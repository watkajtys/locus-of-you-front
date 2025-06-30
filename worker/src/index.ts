import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { timing } from 'hono/timing';
import {
  CoachingMessageSchema,
  APIResponse,
  Env,
  UserProfile,
  UserProfileSchema,
  GuardrailConfig,
  DiagnosticConfig,
  InterventionConfig
} from './types';
import { GuardrailChain } from './chains/guardrail';
import { DiagnosticChain } from './chains/diagnostic';
import { InterventionsChain } from './chains/interventions';

const app = new Hono<{ Bindings: Env }>();

// Middleware
app.use('*', cors());
app.use('*', logger());
app.use('*', timing());

// Initialize chains (can be done once outside the handler if config is static)
// In a real app, configs might come from a KV store or be more dynamic

// Routes
app.get('/health', (c) => {
  return c.json({ success: true, message: 'ok' });
});

app.post('/api/coaching/message', async (c) => {
  const { env, executionCtx } = c;
  try {
    // 1. Parse and validate incoming message
    const body = await c.req.json();
    const coachingMessage = CoachingMessageSchema.parse(body);
    const { userId, sessionId, context, message } = coachingMessage;

    // 2. Initialize Chains with environment-specific configs
    const guardrailConfig: GuardrailConfig = { crisisKeywords: [], escalationThreshold: 0.95, maxTokens: 500, temperature: 0.1, model: 'gemini-2.5-flash', systemPrompt: '' };
    const diagnosticConfig: DiagnosticConfig = { assessmentFrameworks: ['SDT'], maxQuestions: 1, maxTokens: 500, temperature: 0.3, model: 'gemini-2.5-flash', systemPrompt: '' };
    const interventionConfig: InterventionConfig = { interventionTypes: ['behavioral', 'cognitive'], personalityFactors: true, maxTokens: 1000, temperature: 0.4, model: 'gemini-2.5-flash', systemPrompt: '' };

    const guardrailChain = new GuardrailChain(guardrailConfig, env);
    const diagnosticChain = new DiagnosticChain(env.GOOGLE_API_KEY, diagnosticConfig);
    const interventionsChain = new InterventionsChain(env.GOOGLE_API_KEY, interventionConfig);

    // 3. Guardrail First: Assess for safety
    const safetyAssessment = await guardrailChain.assessSafety(coachingMessage);
    if (!safetyAssessment.shouldProceed) {
      return c.json({ success: false, error: { message: safetyAssessment.response, code: 'CRISIS_DETECTED' } }, 400);
    }

    // 4. Fetch user profile from KV, or create a default one
    if (!env.USER_SESSIONS_KV) {
      return c.json({ success: false, error: { message: 'USER_SESSIONS_KV not configured', code: 'KV_NOT_CONFIGURED' } }, 500);
    }
    let userProfile: UserProfile;
    const profileString = await env.USER_SESSIONS_KV.get(userId);
    if (!profileString) {
      userProfile = UserProfileSchema.parse({
        id: userId,
        createdAt: new Date().toISOString(),
        lastActive: new Date().toISOString(),
        preferences: {},
        psychologicalProfile: {},
      });
    } else {
      userProfile = UserProfileSchema.parse(JSON.parse(profileString));
    }

    let finalResponseData: any;

    // 5. Conditional Logic based on sessionType
    const sessionType = context?.sessionType || 'diagnostic';

    if (sessionType === 'diagnostic') {
      finalResponseData = await diagnosticChain.assessUser(coachingMessage, userProfile);
    } else if (sessionType === 'intervention') {
      const assessmentData = await diagnosticChain.assessUser(coachingMessage, userProfile);
      // TODO: Update user profile with new assessment insights
      finalResponseData = await interventionsChain.prescribeIntervention(coachingMessage, userProfile, assessmentData);
    } else {
      return c.json({ success: false, error: { message: `Invalid session type: ${sessionType}`, code: 'INVALID_SESSION_TYPE' } }, 400);
    }

    // 6. Asynchronously save conversation history
    if (!env.COACHING_HISTORY_KV) {
      console.warn('COACHING_HISTORY_KV not configured, skipping history save.');
    } else {
        const historyKey = `${userId}:${sessionId || 'default'}:${new Date().toISOString()}`;
        const historyRecord = {
          userMessage: coachingMessage,
          aiResponse: finalResponseData,
          timestamp: new Date().toISOString(),
        };
        executionCtx.waitUntil(env.COACHING_HISTORY_KV.put(historyKey, JSON.stringify(historyRecord)));
    }

    // 7. Return the final structured response
    const apiResponse: APIResponse = {
      success: true,
      data: finalResponseData,
      metadata: {
        requestId: c.req.header('cf-request-id') || '',
        timestamp: new Date().toISOString(),
        processingTime: 0 // Placeholder, timing middleware can populate this
      }
    };

    return c.json(apiResponse);

  } catch (error) {
    console.error("Error in coaching endpoint:", error);
    if (error instanceof Error) {
        return c.json({ success: false, error: { message: error.message, code: 'VALIDATION_ERROR' } }, 400);
    }
    return c.json({ success: false, error: { message: 'An unknown server error occurred', code: 'UNKNOWN_ERROR' } }, 500);
  }
});

// 404 Handler
app.notFound((c) => {
  return c.json({ success: false, error: { message: 'Not Found', code: 'NOT_FOUND' } }, 404);
});

export default app;