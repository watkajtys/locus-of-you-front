import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { timing } from 'hono/timing';
import { HTTPException } from 'hono/http-exception';
import { securityHeaders, requestSizeLimit } from './middleware/security';
import { ResponseHelper } from './utils/response';
import { rateLimit, rateLimitConfigs } from './middleware/rate-limit';
import { apiKeyAuth } from './middleware/auth';
import type { Env } from './types';

// Import route handlers
import coaching from './routes/coaching';
import users from './routes/users';
import sessions from './routes/sessions';

const app = new Hono<{ Bindings: Env }>();

// Global middleware
app.use('*', cors({
  origin: (origin) => {
    // In production, restrict to specific domains
    const allowedOrigins = [
      'http://localhost:5173',
      'https://localhost:5173',
      // Add your production domains here
    ];
    
    return allowedOrigins.includes(origin) || !origin; // Allow requests with no origin (mobile apps, etc.)
  },
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization', 'X-API-Key'],
  maxAge: 86400,
  credentials: true
}));

app.use('*', logger());
app.use('*', timing());
app.use('*', securityHeaders());
app.use('*', requestSizeLimit(2 * 1024 * 1024)); // 2MB limit

// Health check endpoint (no auth required)
app.get('/health', (c) => {
  return ResponseHelper.success(c, {
    status: 'healthy',
    version: '2.0.0',
    timestamp: new Date().toISOString(),
    region: c.req.header('cf-ray')?.split('-')[1] || 'unknown',
    environment: c.env.ENVIRONMENT || 'development'
  });
});

// API documentation endpoint (with light rate limiting)
app.get('/api/docs', rateLimit(rateLimitConfigs.lenient), (c) => {
  return ResponseHelper.success(c, {
    name: 'AI Coaching API',
    version: '2.0.0',
    description: 'Secure, scalable coaching API with AI-powered interventions',
    documentation: {
      authentication: {
        methods: ['JWT Bearer Token', 'API Key'],
        headerFormat: {
          jwt: 'Authorization: Bearer <token>',
          apiKey: 'X-API-Key: <key>'
        }
      },
      endpoints: {
        health: {
          method: 'GET',
          path: '/health',
          description: 'Health check endpoint',
          auth: false
        },
        coaching: {
          message: {
            method: 'POST',
            path: '/api/coaching/message',
            description: 'Send a coaching message',
            auth: 'JWT + Subscription',
            rateLimit: '10 requests/minute'
          },
          history: {
            method: 'GET',
            path: '/api/coaching/history',
            description: 'Get coaching history',
            auth: 'JWT'
          }
        },
        users: {
          profile: {
            method: 'GET',
            path: '/api/users/profile',
            description: 'Get current user profile',
            auth: 'JWT'
          },
          updateProfile: {
            method: 'PUT',
            path: '/api/users/profile',
            description: 'Update current user profile',
            auth: 'JWT'
          }
        },
        sessions: {
          create: {
            method: 'POST',
            path: '/api/sessions',
            description: 'Start new coaching session',
            auth: 'JWT + Subscription'
          },
          get: {
            method: 'GET',
            path: '/api/sessions/:sessionId',
            description: 'Get session details',
            auth: 'JWT'
          },
          end: {
            method: 'PUT',
            path: '/api/sessions/:sessionId/end',
            description: 'End coaching session',
            auth: 'JWT'
          }
        }
      },
      errorCodes: {
        400: 'Bad Request - Validation Error',
        401: 'Unauthorized - Authentication Required',
        402: 'Payment Required - Subscription Required',
        403: 'Forbidden - Insufficient Permissions',
        404: 'Not Found',
        413: 'Request Entity Too Large',
        429: 'Too Many Requests - Rate Limit Exceeded',
        500: 'Internal Server Error'
      },
      rateLimits: {
        strict: '100 requests/15 minutes',
        moderate: '500 requests/15 minutes',
        coaching: '10 requests/minute',
        lenient: '1000 requests/15 minutes'
      }
    }
  });
});

// Mount route handlers
app.route('/api/coaching', coaching);
app.route('/api/users', users);
app.route('/api/sessions', sessions);

// Admin endpoints (API key auth)
app.get('/api/admin/stats', 
  rateLimit(rateLimitConfigs.strict),
  apiKeyAuth(),
  async (c) => {
    try {
      // Get basic stats from KV stores
      const stats = {
        timestamp: new Date().toISOString(),
        kvStores: {
          rateLimitConfigured: !!c.env.RATE_LIMIT_KV,
          userSessionsConfigured: !!c.env.USER_SESSIONS_KV,
          coachingHistoryConfigured: !!c.env.COACHING_HISTORY_KV
        },
        environment: c.env.ENVIRONMENT || 'development',
        region: c.req.header('cf-ray')?.split('-')[1] || 'unknown'
      };

      return ResponseHelper.success(c, stats);
    } catch (error) {
      return ResponseHelper.error(c, error as Error);
    }
  }
);

// Global error handler
app.onError((err, c) => {
  console.error('Unhandled error:', err);
  
  if (err instanceof HTTPException) {
    return ResponseHelper.error(c, err);
  }
  
  return ResponseHelper.error(c, new Error('Internal server error'));
});

// 404 handler
app.notFound((c) => {
  return c.json({
    success: false,
    error: {
      message: 'Endpoint not found',
      code: 'NOT_FOUND'
    },
    metadata: {
      requestId: c.req.header('cf-request-id') || crypto.randomUUID(),
      timestamp: new Date().toISOString()
    }
  }, 404);
});

export default app;