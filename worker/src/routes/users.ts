import { Hono } from 'hono';
import { jwtAuth, requireRole } from '../middleware/auth';
import { rateLimit, rateLimitConfigs } from '../middleware/rate-limit';
import { validateBody, validateParams, ValidationSchemas } from '../middleware/validation';
import { ResponseHelper } from '../utils/response';
import { UserProfileSchema } from '../types';
import type { Env } from '../types';

const users = new Hono<{ Bindings: Env }>();

// GET /api/users/profile - Get current user's profile
users.get(
  '/profile',
  rateLimit(rateLimitConfigs.moderate),
  jwtAuth(),
  async (c) => {
    const user = c.get('user');
    
    try {
      if (!c.env.USER_SESSIONS_KV) {
        throw new Error('User profile storage not configured');
      }

      const profileData = await c.env.USER_SESSIONS_KV.get(`profile:${user.id}`);
      
      if (!profileData) {
        // Return default profile
        const defaultProfile = {
          id: user.id,
          email: user.email,
          createdAt: new Date().toISOString(),
          lastActive: new Date().toISOString(),
          preferences: {
            theme: 'calm',
            notifications: true,
            coachingStyle: 'supportive'
          },
          psychologicalProfile: {}
        };
        
        return ResponseHelper.success(c, defaultProfile);
      }

      const profile = UserProfileSchema.parse(JSON.parse(profileData));
      return ResponseHelper.success(c, profile);
    } catch (error) {
      return ResponseHelper.error(c, error as Error);
    }
  }
);

// PUT /api/users/profile - Update current user's profile
users.put(
  '/profile',
  rateLimit(rateLimitConfigs.moderate),
  jwtAuth(),
  validateBody(ValidationSchemas.profileUpdate),
  async (c) => {
    const user = c.get('user');
    const updates = c.req.valid('json');
    
    try {
      if (!c.env.USER_SESSIONS_KV) {
        throw new Error('User profile storage not configured');
      }

      // Get existing profile
      let existingProfile = null;
      const profileData = await c.env.USER_SESSIONS_KV.get(`profile:${user.id}`);
      
      if (profileData) {
        existingProfile = JSON.parse(profileData);
      }

      // Merge updates with existing profile
      const updatedProfile = {
        id: user.id,
        email: user.email,
        createdAt: existingProfile?.createdAt || new Date().toISOString(),
        lastActive: new Date().toISOString(),
        preferences: {
          ...existingProfile?.preferences,
          ...updates.preferences
        },
        psychologicalProfile: {
          ...existingProfile?.psychologicalProfile,
          ...updates.psychologicalProfile
        }
      };

      const validatedProfile = UserProfileSchema.parse(updatedProfile);
      
      await c.env.USER_SESSIONS_KV.put(
        `profile:${user.id}`,
        JSON.stringify(validatedProfile)
      );
      
      return ResponseHelper.success(c, validatedProfile);
    } catch (error) {
      return ResponseHelper.error(c, error as Error);
    }
  }
);

// GET /api/users/:userId/profile - Get specific user's profile (admin only)
users.get(
  '/:userId/profile',
  rateLimit(rateLimitConfigs.moderate),
  jwtAuth(),
  requireRole(['admin']),
  validateParams(ValidationSchemas.userId),
  async (c) => {
    const params = c.req.valid('param');
    
    try {
      if (!c.env.USER_SESSIONS_KV) {
        throw new Error('User profile storage not configured');
      }

      const profileData = await c.env.USER_SESSIONS_KV.get(`profile:${params.userId}`);
      
      if (!profileData) {
        return ResponseHelper.error(c, new Error('Profile not found'));
      }

      const profile = UserProfileSchema.parse(JSON.parse(profileData));
      return ResponseHelper.success(c, profile);
    } catch (error) {
      return ResponseHelper.error(c, error as Error);
    }
  }
);

export default users;