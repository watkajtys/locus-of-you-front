import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { prettyJSON } from 'hono/pretty-json';
import { timing } from 'hono/timing';
import { z } from 'zod';

import { GuardrailChain } from './chains/guardrail';
import { DiagnosticChain } from './chains/diagnostic';
import { InterventionsChain } from './chains/interventions';
import { 
  CoachingMessageSchema, 
  UserProfileSchema, 
  AIResponseSchema,
  APIResponse,
  Env 
} from './types';

// Initialize Hono app with proper typing
const app = new Hono<{ Bindings: Env }>();

// Global middleware
app.use('*', cors({
  origin: ['*'], // Configure specific domains in production
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization', 'X-API-Key'],
  maxAge: 86400
}));

app.use('*', logger());
app.use('*', prettyJSON());
app.use('*', timing());

// Initialize AI chains (lazy initialization)
let guardrailChain: GuardrailChain | null = null;
let diagnosticChain: DiagnosticChain | null = null;
let interventionsChain: InterventionsChain | null = null;

function initializeChains(env: Env) {
  if (!guardrailChain) {
    guardrailChain = new GuardrailChain(env.OPENAI_API_KEY);
    diagnosticChain = new DiagnosticChain(env.OPENAI_API_KEY);
    interventionsChain = new InterventionsChain(env.OPENAI_API_KEY);
  }
}

// Utility functions
function createSuccessResponse<T>(data: T, metadata?: any): APIResponse<T> {
  return {
    success: true,
    data,
    metadata: {
      timestamp: new Date().toISOString(),
      requestId: crypto.randomUUID(),
      ...metadata
    }
  };
}

function createErrorResponse(message: string, code: string, details?: any): APIResponse {
  return {
    success: false,
    error: {
      message,
      code,
      details
    },
    metadata: {
      timestamp: new Date().toISOString(),
      requestId: crypto.randomUUID()
    }
  };
}

// Authentication middleware
async function authenticateRequest(c: any, next: any) {
  const apiKey = c.req.header('X-API-Key');
  const authHeader = c.req.header('Authorization');
  const env = c.env as Env;

  // Check API key
  if (apiKey && env.API_KEY && apiKey === env.API_KEY) {
    c.set('authType', 'api_key');
    return next();
  }

  // Check Bearer token
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    if (token && token.length > 10) {
      c.set('authType', 'bearer_token');
      c.set('token', token);
      return next();
    }
  }

  return c.json(createErrorResponse('Authentication required', 'UNAUTHORIZED'), 401);
}

// Rate limiting middleware
async function rateLimitMiddleware(c: any, next: any) {
  const env = c.env as Env;
  if (!env.RATE_LIMIT_KV) return next();

  const clientId = c.req.header('CF-Connecting-IP') || 'unknown';
  const key = `rate_limit:${clientId}`;
  const now = Date.now();
  const windowMs = 60 * 1000; // 1 minute
  const maxRequests = 100;

  try {
    const data = await env.RATE_LIMIT_KV.get(key);
    const rateData = data ? JSON.parse(data) : { count: 0, resetTime: now + windowMs };

    if (now > rateData.resetTime) {
      rateData.count = 1;
      rateData.resetTime = now + windowMs;
    } else {
      rateData.count++;
    }

    if (rateData.count > maxRequests) {
      return c.json(createErrorResponse('Rate limit exceeded', 'RATE_LIMIT_EXCEEDED'), 429);
    }

    await env.RATE_LIMIT_KV.put(key, JSON.stringify(rateData), {
      expirationTtl: Math.ceil(windowMs / 1000)
    });

    return next();
  } catch (error) {
    console.error('Rate limiting error:', error);
    return next(); // Allow on error
  }
}

// Routes

// Health check
app.get('/health', (c) => {
  return c.json(createSuccessResponse({
    status: 'healthy',
    version: '2.0.0',
    region: c.req.header('CF-RAY')?.split('-')[1] || 'unknown',
    chains: {
      guardrail: !!guardrailChain,
      diagnostic: !!diagnosticChain,
      interventions: !!interventionsChain
    }
  }));
});

// API info
app.get('/api/info', (c) => {
  return c.json(createSuccessResponse({
    name: 'AI Coaching API',
    version: '2.0.0',
    description: 'LangChain-powered coaching API with evidence-based interventions',
    endpoints: [
      'GET /health - Health check',
      'GET /api/info - API information',
      'POST /api/coaching/message - Process coaching message through AI chains',
      'GET /api/user/profile/:userId - Get user profile',
      'POST /api/user/profile/:userId - Update user profile',
      'POST /api/coaching/session/start - Start new coaching session',
      'POST /api/coaching/session/:sessionId/end - End coaching session'
    ],
    frameworks: ['Evidence-based Therapy', 'Self-Determination Theory', 'Goal Setting Theory'],
    chains: ['Guardrail (Crisis Detection)', 'Diagnostic (Assessment)', 'Interventions (Prescriptions)']
  }));
});

// Main coaching message endpoint
app.post('/api/coaching/message', rateLimitMiddleware, authenticateRequest, async (c) => {
  const startTime = Date.now();
  
  try {
    // Initialize chains
    initializeChains(c.env as Env);

    // Validate request body
    const body = await c.req.json();
    const validatedMessage = CoachingMessageSchema.parse(body);

    // Step 1: Guardrail Assessment (Crisis Detection)
    const safetyAssessment = await guardrailChain!.assessSafety(validatedMessage);
    
    if (!safetyAssessment.shouldProceed) {
      // Return crisis response immediately
      return c.json(createSuccessResponse({
        id: crypto.randomUUID(),
        content: safetyAssessment.response,
        type: 'CRISIS_RESPONSE',
        strategy: 'CRISIS_INTERVENTION',
        confidence: safetyAssessment.confidence,
        timestamp: new Date().toISOString(),
        metadata: {
          chainUsed: 'guardrail',
          processingTime: Date.now() - startTime,
          riskLevel: safetyAssessment.severity
        }
      }));
    }

    // Step 2: Retrieve user profile (if available)
    let userProfile;
    try {
      if (c.env.USER_SESSIONS_KV) {
        const profileData = await c.env.USER_SESSIONS_KV.get(`profile:${validatedMessage.userId}`);
        if (profileData) {
          userProfile = UserProfileSchema.parse(JSON.parse(profileData));
        }
      }
    } catch (error) {
      console.warn('Failed to retrieve user profile:', error);
    }

    // Step 3: Determine response chain based on session type
    const sessionType = validatedMessage.context?.sessionType || 'diagnostic';
    
    let response;
    let chainUsed;

    if (sessionType === 'intervention' && userProfile?.psychologicalProfile) {
      // Use interventions chain for users with complete profiles
      chainUsed = 'intervention';
      const interventionResult = await interventionsChain!.prescribeIntervention(
        validatedMessage,
        userProfile,
        userProfile.psychologicalProfile as any
      );
      
      response = {
        id: crypto.randomUUID(),
        content: interventionResult.content,
        type: 'INTERVENTION_SUGGESTION',
        strategy: 'GST_SPECIFICITY', // Map intervention type to strategy
        confidence: interventionResult.confidence,
        followUpSuggestions: interventionResult.actionSteps,
        timestamp: new Date().toISOString(),
        metadata: {
          chainUsed,
          processingTime: Date.now() - startTime,
          riskLevel: 'none',
          interventionType: interventionResult.interventionType,
          actionSteps: interventionResult.actionSteps,
          timeframe: interventionResult.timeframe
        }
      };
    } else {
      // Use diagnostic chain for assessment and relationship building
      chainUsed = 'diagnostic';
      const conversationHistory = validatedMessage.context?.previousMessages || [];
      
      const diagnosticResult = await diagnosticChain!.assessUser(
        validatedMessage,
        userProfile,
        conversationHistory
      );
      
      response = {
        id: crypto.randomUUID(),
        content: diagnosticResult.response,
        type: diagnosticResult.type,
        strategy: diagnosticResult.strategy,
        confidence: diagnosticResult.confidence,
        followUpSuggestions: diagnosticResult.followUpSuggestions,
        timestamp: new Date().toISOString(),
        metadata: {
          chainUsed,
          processingTime: Date.now() - startTime,
          riskLevel: 'none',
          assessmentInsights: diagnosticResult.assessmentInsights
        }
      };

      // Update user profile with new insights
      if (c.env.USER_SESSIONS_KV && diagnosticResult.assessmentInsights) {
        try {
          const updatedProfile = {
            ...userProfile,
            psychologicalProfile: {
              ...userProfile?.psychologicalProfile,
              ...diagnosticResult.assessmentInsights
            },
            lastActive: new Date().toISOString()
          };
          
          await c.env.USER_SESSIONS_KV.put(
            `profile:${validatedMessage.userId}`,
            JSON.stringify(updatedProfile)
          );
        } catch (error) {
          console.error('Failed to update user profile:', error);
        }
      }
    }

    // Store conversation history
    if (c.env.COACHING_HISTORY_KV) {
      try {
        const historyKey = `history:${validatedMessage.userId}:${new Date().toISOString().split('T')[0]}`;
        const existingHistory = await c.env.COACHING_HISTORY_KV.get(historyKey);
        const history = existingHistory ? JSON.parse(existingHistory) : [];
        
        history.push({
          timestamp: new Date().toISOString(),
          userMessage: validatedMessage.message,
          aiResponse: response.content,
          chainUsed,
          metadata: response.metadata
        });
        
        await c.env.COACHING_HISTORY_KV.put(historyKey, JSON.stringify(history));
      } catch (error) {
        console.error('Failed to store conversation history:', error);
      }
    }

    return c.json(createSuccessResponse(response, {
      processingTime: Date.now() - startTime,
      chainUsed,
      safetyAssessment: {
        riskLevel: safetyAssessment.severity,
        confidence: safetyAssessment.confidence
      }
    }));

  } catch (error) {
    console.error('Coaching message error:', error);
    
    if (error instanceof z.ZodError) {
      return c.json(createErrorResponse(
        'Invalid request data',
        'VALIDATION_ERROR',
        error.errors
      ), 400);
    }

    return c.json(createErrorResponse(
      'Internal server error',
      'INTERNAL_ERROR',
      c.env.ENVIRONMENT === 'development' ? error.message : undefined
    ), 500);
  }
});

// User profile endpoints
app.get('/api/user/profile/:userId', authenticateRequest, async (c) => {
  try {
    const userId = c.req.param('userId');
    
    if (!c.env.USER_SESSIONS_KV) {
      return c.json(createErrorResponse('Profile storage not configured', 'SERVICE_UNAVAILABLE'), 503);
    }

    const profileData = await c.env.USER_SESSIONS_KV.get(`profile:${userId}`);
    
    if (!profileData) {
      return c.json(createErrorResponse('Profile not found', 'NOT_FOUND'), 404);
    }

    const profile = UserProfileSchema.parse(JSON.parse(profileData));
    return c.json(createSuccessResponse(profile));

  } catch (error) {
    console.error('Profile fetch error:', error);
    return c.json(createErrorResponse('Failed to fetch profile', 'PROFILE_FETCH_ERROR'), 500);
  }
});

app.post('/api/user/profile/:userId', authenticateRequest, async (c) => {
  try {
    const userId = c.req.param('userId');
    const body = await c.req.json();
    
    if (!c.env.USER_SESSIONS_KV) {
      return c.json(createErrorResponse('Profile storage not configured', 'SERVICE_UNAVAILABLE'), 503);
    }

    // Get existing profile or create new one
    let existingProfile;
    try {
      const profileData = await c.env.USER_SESSIONS_KV.get(`profile:${userId}`);
      if (profileData) {
        existingProfile = JSON.parse(profileData);
      }
    } catch (error) {
      console.warn('Could not retrieve existing profile:', error);
    }

    const updatedProfile = {
      id: userId,
      createdAt: existingProfile?.createdAt || new Date().toISOString(),
      lastActive: new Date().toISOString(),
      ...existingProfile,
      ...body // Merge updates
    };

    const validatedProfile = UserProfileSchema.parse(updatedProfile);
    
    await c.env.USER_SESSIONS_KV.put(`profile:${userId}`, JSON.stringify(validatedProfile));
    
    return c.json(createSuccessResponse({
      message: 'Profile updated successfully',
      profile: validatedProfile
    }));

  } catch (error) {
    console.error('Profile update error:', error);
    
    if (error instanceof z.ZodError) {
      return c.json(createErrorResponse(
        'Invalid profile data',
        'VALIDATION_ERROR',
        error.errors
      ), 400);
    }

    return c.json(createErrorResponse('Failed to update profile', 'PROFILE_UPDATE_ERROR'), 500);
  }
});

// Error handler
app.onError((err, c) => {
  console.error('Unhandled error:', err);
  return c.json(createErrorResponse(
    'Internal server error',
    'UNHANDLED_ERROR'
  ), 500);
});

// 404 handler
app.notFound((c) => {
  return c.json(createErrorResponse(
    'Endpoint not found',
    'NOT_FOUND'
  ), 404);
});

export default app;