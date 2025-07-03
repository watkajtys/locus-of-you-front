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
  InterventionConfig,
  OnboardingAnswersSchema,
} from './types';
import { GuardrailChain } from './chains/guardrail';
import { DiagnosticChain } from './chains/diagnostic';
import { InterventionsChain } from './chains/interventions';
import { SnapshotChain } from './chains/snapshot'; // Import SnapshotChain

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
    const body = await c.req.json();
    console.log("Worker received request body:", body); // NEW LINE
    // 1. Parse and validate incoming message
    const coachingMessage = CoachingMessageSchema.parse(body);
    const { userId, sessionId, context, message } = coachingMessage;

    // 2. Initialize Chains with environment-specific configs
    const guardrailConfig: GuardrailConfig = { crisisKeywords: [], escalationThreshold: 0.95, maxTokens: 500, temperature: 0.1, model: 'gemini-2.5-flash', systemPrompt: '' };
    const diagnosticConfig: DiagnosticConfig = { assessmentFrameworks: ['SDT'], maxQuestions: 1, maxTokens: 500, temperature: 0.3, model: 'gemini-2.5-flash', systemPrompt: '' };
    const interventionConfig: InterventionConfig = { interventionTypes: ['behavioral', 'cognitive'], personalityFactors: true, maxTokens: 1000, temperature: 0.4, model: 'gemini-2.5-flash', systemPrompt: '' };

    const guardrailChain = new GuardrailChain(guardrailConfig, env);
    const diagnosticChain = new DiagnosticChain(env.GOOGLE_API_KEY, diagnosticConfig);
    const interventionsChain = new InterventionsChain(env.GOOGLE_API_KEY, interventionConfig);
    const snapshotChain = new SnapshotChain(); // Initialize SnapshotChain

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

    if (sessionType === 'onboarding_diagnostic') {
      const onboardingAnswers = context?.onboardingAnswers;
      if (!onboardingAnswers) {
        return c.json({ success: false, error: { message: 'Onboarding answers not provided.', code: 'MISSING_ONBOARDING_ANSWERS' } }, 400);
      }
      const snapshotData = await snapshotChain.generateSnapshot(onboardingAnswers, userProfile);

      // Store snapshot data in KV
      await env.USER_SESSIONS_KV.put(`snapshot_${userId}`, JSON.stringify(snapshotData));
      finalResponseData = { message: 'Onboarding diagnostic completed and snapshot generated.', snapshotData };
    } else if (sessionType === 'snapshot_generation') {
      const snapshotString = await env.USER_SESSIONS_KV.get(`snapshot_${userId}`);
      if (!snapshotString) {
        return c.json({ success: false, error: { message: 'Snapshot data not found for user.', code: 'SNAPSHOT_NOT_FOUND' } }, 404);
      }
      finalResponseData = JSON.parse(snapshotString);
    } else if (sessionType === 'diagnostic') {
      finalResponseData = await diagnosticChain.assessUser(coachingMessage, userProfile);
    } else if (sessionType === 'intervention') {
      const assessmentData = await diagnosticChain.assessUser(coachingMessage, userProfile);
      // TODO: Update user profile with new assessment insights
      finalResponseData = await interventionsChain.prescribeIntervention(coachingMessage, userProfile, assessmentData);
    } else if (sessionType === 'reflection') {
      const previousTask = coachingMessage.context?.previousTask;
      const reflectionId = coachingMessage.context?.reflectionId;
      const reflectionText = coachingMessage.message; // User's textual reflection

      if (!previousTask || !reflectionId) {
        return c.json({ success: false, error: { message: 'Previous task and reflectionId are required for reflection session type.', code: 'MISSING_REFLECTION_DATA' } }, 400);
      }

      const adaptedMicrotask = await interventionsChain.generateAdaptedMicrotask(
        previousTask,
        reflectionId,
        reflectionText,
        userProfile
      );

      // Store the adapted microtask in KV (will be done in the next step formally, but this is where it happens)
      // For now, the response will include this adapted task.
      // The frontend doesn't directly use this response from /api/coaching/message to show the next task.
      // It will fetch it after the paywall. This endpoint confirms receipt and processing of reflection.
      finalResponseData = {
        message: "Reflection processed and next task generated.",
        nextAdaptedTask: adaptedMicrotask
      };
      // TODO: In Step 7, actually save `adaptedMicrotask` to KV under a specific key for later retrieval.
      await env.USER_SESSIONS_KV.put(`nextAdaptedTask_${userId}`, JSON.stringify(adaptedMicrotask));
      console.log(`Stored nextAdaptedTask_${userId}: ${JSON.stringify(adaptedMicrotask)}`);


    } else {
      return c.json({ success: false, error: { message: `Invalid session type: ${sessionType}`, code: 'INVALID_SESSION_TYPE' } }, 400);
    }

    // 6. Asynchronously save conversation history
    if (!env.COACHING_HISTORY_KV) {
      console.warn('COACHING_HISTORY_KV not configured, skipping history save.');
    }
    // Save history for diagnostic, intervention, and reflection messages
    else if (sessionType === 'diagnostic' || sessionType === 'intervention' || sessionType === 'reflection') {
        const historyKey = `${userId}:${sessionId || 'default'}:${new Date().toISOString()}`;
        const historyRecord = {
          userMessage: coachingMessage, // This now includes context like previousTask and reflectionId for 'reflection' type
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
      if (error.name === 'ZodError') {
        // Zod validation error
        return c.json({ success: false, error: { message: 'Validation failed', code: 'VALIDATION_ERROR', details: (error as any).issues } }, 400);
      } else {
        // Other known errors
        return c.json({ success: false, error: { message: error.message, code: 'PROCESSING_ERROR' } }, 400);
      }
    }
    return c.json({ success: false, error: { message: 'An unknown server error occurred', code: 'UNKNOWN_ERROR' } }, 500);
  }
});

app.post('/api/microtask/generate', async (c) => {
  const { env } = c;
  try {
    const body = await c.req.json();
    const { onboardingAnswers, userId } = body;

    // Validate onboardingAnswers
    const parsedOnboardingAnswers = OnboardingAnswersSchema.parse(onboardingAnswers);

    // Fetch user profile
    if (!env.USER_SESSIONS_KV) {
      return c.json({ success: false, error: { message: 'USER_SESSIONS_KV not configured', code: 'KV_NOT_CONFIGURED' } }, 500);
    }
    let userProfile: UserProfile;
    const profileString = await env.USER_SESSIONS_KV.get(userId);
    if (!profileString) {
      // If no profile, create a basic one for microtask generation
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

    const interventionConfig: InterventionConfig = { interventionTypes: ['behavioral', 'cognitive'], personalityFactors: true, maxTokens: 1000, temperature: 0.4, model: 'gemini-2.5-flash', systemPrompt: '' };
    const interventionsChain = new InterventionsChain(env.GOOGLE_API_KEY, interventionConfig);

    const microtask = await interventionsChain.generateFirstMicrotask(parsedOnboardingAnswers, userProfile);

    const apiResponse: APIResponse = {
      success: true,
      data: microtask,
      metadata: {
        requestId: c.req.header('cf-request-id') || '',
        timestamp: new Date().toISOString(),
        processingTime: 0
      }
    };

    return c.json(apiResponse);

  } catch (error) {
    console.error("Error in microtask generation endpoint:", error);
    if (error instanceof Error) {
      if (error.name === 'ZodError') {
        return c.json({ success: false, error: { message: 'Validation failed', code: 'VALIDATION_ERROR', details: (error as any).issues } }, 400);
      } else {
        return c.json({ success: false, error: { message: error.message, code: 'PROCESSING_ERROR' } }, 400);
      }
    }
    return c.json({ success: false, error: { message: 'An unknown server error occurred', code: 'UNKNOWN_ERROR' } }, 500);
  }
});

// 404 Handler
app.notFound((c) => {
  return c.json({ success: false, error: { message: 'Not Found', code: 'NOT_FOUND' } }, 404);
});

export default app;