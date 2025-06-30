import { Hono } from 'hono';
import { jwtAuth, requireSubscription } from '../middleware/auth';
import { rateLimit, rateLimitConfigs } from '../middleware/rate-limit';
import { validateBody, validateQuery, ValidationSchemas } from '../middleware/validation';
import { ResponseHelper } from '../utils/response';
import { GuardrailChain } from '../chains/guardrail';
import { DiagnosticChain } from '../chains/diagnostic';
import { InterventionsChain } from '../chains/interventions';
import { Env, CoachingMessage, UserProfile, UserProfileSchema } from '../types';

const coaching = new Hono<{ Bindings: Env }>();

// POST /api/coaching/message - Send a coaching message
coaching.post(
  '/message',
  rateLimit(rateLimitConfigs.coaching),
  jwtAuth(),
  requireSubscription(),
  validateBody(ValidationSchemas.messageBody),
  async (c) => {
    const startTime = Date.now();
    const user = c.get('user');
    const validatedBody = c.req.valid('json');

    try {
      // Initialize AI chains
      const guardrailChain = new GuardrailChain({
        crisisKeywords: [],
        escalationThreshold: 0.95,
        maxTokens: 500,
        temperature: 0.1,
        model: 'gemini-2.5-flash',
        systemPrompt: ''
      }, c.env);

      const diagnosticChain = new DiagnosticChain(c.env.GOOGLE_API_KEY, {
        assessmentFrameworks: ['SDT'],
        maxQuestions: 1,
        maxTokens: 500,
        temperature: 0.3,
        model: 'gemini-2.5-flash',
        systemPrompt: ''
      });

      const interventionsChain = new InterventionsChain(c.env.GOOGLE_API_KEY, {
        interventionTypes: ['behavioral', 'cognitive'],
        personalityFactors: true,
        maxTokens: 1000,
        temperature: 0.4,
        model: 'gemini-2.5-flash',
        systemPrompt: ''
      });

      // Create coaching message object
      const coachingMessage: CoachingMessage = {
        message: validatedBody.message,
        userId: user.id,
        context: validatedBody.context
      };

      // Step 1: Safety assessment
      const safetyAssessment = await guardrailChain.assessSafety(coachingMessage);
      
      if (!safetyAssessment.shouldProceed) {
        return ResponseHelper.success(c, {
          id: crypto.randomUUID(),
          type: 'CRISIS_RESPONSE',
          content: safetyAssessment.response,
          strategy: 'CRISIS_INTERVENTION',
          confidence: 1.0,
          metadata: {
            chainUsed: 'guardrail',
            riskLevel: 'high'
          }
        });
      }

      // Step 2: Get user profile
      let userProfile: UserProfile;
      if (c.env.USER_SESSIONS_KV) {
        const profileData = await c.env.USER_SESSIONS_KV.get(`profile:${user.id}`);
        if (profileData) {
          userProfile = UserProfileSchema.parse(JSON.parse(profileData));
        } else {
          userProfile = UserProfileSchema.parse({
            id: user.id,
            createdAt: new Date().toISOString(),
            lastActive: new Date().toISOString(),
            preferences: {},
            psychologicalProfile: {}
          });
        }
      } else {
        throw new Error('User profile storage not configured');
      }

      // Step 3: Generate response based on session type
      const sessionType = validatedBody.context?.sessionType || 'diagnostic';
      let response;

      if (sessionType === 'diagnostic') {
        response = await diagnosticChain.assessUser(coachingMessage, userProfile);
      } else if (sessionType === 'intervention') {
        const assessmentData = await diagnosticChain.assessUser(coachingMessage, userProfile);
        response = await interventionsChain.prescribeIntervention(
          coachingMessage,
          userProfile,
          assessmentData
        );
      }

      // Step 4: Store conversation history
      if (c.env.COACHING_HISTORY_KV) {
        const historyKey = `history:${user.id}:${new Date().toISOString()}`;
        const historyRecord = {
          userMessage: coachingMessage,
          aiResponse: response,
          timestamp: new Date().toISOString(),
          processingTime: Date.now() - startTime
        };
        
        c.executionCtx.waitUntil(
          c.env.COACHING_HISTORY_KV.put(historyKey, JSON.stringify(historyRecord))
        );
      }

      return ResponseHelper.success(c, {
        id: crypto.randomUUID(),
        type: 'COACHING_RESPONSE',
        content: response.response || response.content,
        strategy: response.strategy,
        confidence: response.confidence || 0.8,
        metadata: {
          chainUsed: sessionType,
          processingTime: Date.now() - startTime,
          riskLevel: 'none'
        }
      });

    } catch (error) {
      console.error('Coaching message error:', error);
      return ResponseHelper.error(c, error as Error);
    }
  }
);

// GET /api/coaching/history - Get user's coaching history
coaching.get(
  '/history',
  rateLimit(rateLimitConfigs.moderate),
  jwtAuth(),
  validateQuery(ValidationSchemas.pagination),
  async (c) => {
    const user = c.get('user');
    const query = c.req.valid('query');
    
    try {
      if (!c.env.COACHING_HISTORY_KV) {
        throw new Error('Coaching history storage not configured');
      }

      // Get recent history (simplified - in production you'd want proper pagination)
      const { keys } = await c.env.COACHING_HISTORY_KV.list({
        prefix: `history:${user.id}:`,
        limit: query.limit || 20
      });

      const history = await Promise.all(
        keys.map(async (key) => {
          const data = await c.env.COACHING_HISTORY_KV!.get(key.name);
          return data ? JSON.parse(data) : null;
        })
      );

      return ResponseHelper.success(c, history.filter(Boolean));
    } catch (error) {
      return ResponseHelper.error(c, error as Error);
    }
  }
);

export default coaching;