import { Hono } from 'hono';
import { jwtAuth, requireSubscription } from '../middleware/auth';
import { rateLimit, rateLimitConfigs } from '../middleware/rate-limit';
import { validateParams, ValidationSchemas } from '../middleware/validation';
import { ResponseHelper } from '../utils/response';
import type { Env } from '../types';

const sessions = new Hono<{ Bindings: Env }>();

// POST /api/sessions - Start a new coaching session
sessions.post(
  '/',
  rateLimit(rateLimitConfigs.moderate),
  jwtAuth(),
  requireSubscription(),
  async (c) => {
    const user = c.get('user');
    
    try {
      const sessionId = crypto.randomUUID();
      const session = {
        id: sessionId,
        userId: user.id,
        startTime: new Date().toISOString(),
        status: 'active',
        messages: []
      };

      if (c.env.USER_SESSIONS_KV) {
        await c.env.USER_SESSIONS_KV.put(
          `session:${sessionId}`,
          JSON.stringify(session)
        );
      }

      return ResponseHelper.created(c, session, `/api/sessions/${sessionId}`);
    } catch (error) {
      return ResponseHelper.error(c, error as Error);
    }
  }
);

// GET /api/sessions/:sessionId - Get session details
sessions.get(
  '/:sessionId',
  rateLimit(rateLimitConfigs.moderate),
  jwtAuth(),
  validateParams(ValidationSchemas.sessionId),
  async (c) => {
    const user = c.get('user');
    const params = c.req.valid('param');
    
    try {
      if (!c.env.USER_SESSIONS_KV) {
        throw new Error('Session storage not configured');
      }

      const sessionData = await c.env.USER_SESSIONS_KV.get(`session:${params.sessionId}`);
      
      if (!sessionData) {
        return ResponseHelper.error(c, new Error('Session not found'));
      }

      const session = JSON.parse(sessionData);
      
      // Verify user owns this session
      if (session.userId !== user.id) {
        return ResponseHelper.error(c, new Error('Access denied'));
      }

      return ResponseHelper.success(c, session);
    } catch (error) {
      return ResponseHelper.error(c, error as Error);
    }
  }
);

// PUT /api/sessions/:sessionId/end - End a coaching session
sessions.put(
  '/:sessionId/end',
  rateLimit(rateLimitConfigs.moderate),
  jwtAuth(),
  validateParams(ValidationSchemas.sessionId),
  async (c) => {
    const user = c.get('user');
    const params = c.req.valid('param');
    
    try {
      if (!c.env.USER_SESSIONS_KV) {
        throw new Error('Session storage not configured');
      }

      const sessionData = await c.env.USER_SESSIONS_KV.get(`session:${params.sessionId}`);
      
      if (!sessionData) {
        return ResponseHelper.error(c, new Error('Session not found'));
      }

      const session = JSON.parse(sessionData);
      
      // Verify user owns this session
      if (session.userId !== user.id) {
        return ResponseHelper.error(c, new Error('Access denied'));
      }

      // Update session
      session.endTime = new Date().toISOString();
      session.status = 'completed';

      await c.env.USER_SESSIONS_KV.put(
        `session:${params.sessionId}`,
        JSON.stringify(session)
      );

      return ResponseHelper.success(c, session);
    } catch (error) {
      return ResponseHelper.error(c, error as Error);
    }
  }
);

export default sessions;