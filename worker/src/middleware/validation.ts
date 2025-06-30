import { Context, Next } from 'hono';
import { HTTPException } from 'hono/http-exception';
import { zValidator } from '@hono/zod-validator';
import { z, ZodSchema } from 'zod';

// Enhanced validation middleware using Hono's zod validator
export const validateBody = (schema: ZodSchema) => {
  return zValidator('json', schema, (result, c) => {
    if (!result.success) {
      throw new HTTPException(400, {
        message: 'Validation error',
        details: {
          code: 'VALIDATION_ERROR',
          errors: result.error.errors.map(err => ({
            path: err.path.join('.'),
            message: err.message,
            code: err.code
          }))
        }
      });
    }
  });
};

export const validateQuery = (schema: ZodSchema) => {
  return zValidator('query', schema, (result, c) => {
    if (!result.success) {
      throw new HTTPException(400, {
        message: 'Query validation error',
        details: {
          code: 'VALIDATION_ERROR',
          errors: result.error.errors.map(err => ({
            path: err.path.join('.'),
            message: err.message,
            code: err.code
          }))
        }
      });
    }
  });
};

export const validateParams = (schema: ZodSchema) => {
  return zValidator('param', schema, (result, c) => {
    if (!result.success) {
      throw new HTTPException(400, {
        message: 'Parameter validation error',
        details: {
          code: 'VALIDATION_ERROR',
          errors: result.error.errors.map(err => ({
            path: err.path.join('.'),
            message: err.message,
            code: err.code
          }))
        }
      });
    }
  });
};

// Custom validation middleware for complex scenarios
export const validateRequest = (schema: {
  body?: ZodSchema;
  query?: ZodSchema;
  params?: ZodSchema;
}) => {
  return async (c: Context, next: Next) => {
    try {
      // Validate request body
      if (schema.body) {
        const body = await c.req.json().catch(() => ({}));
        const validated = schema.body.parse(body);
        c.set('validatedBody', validated);
      }

      // Validate query parameters
      if (schema.query) {
        const query = Object.fromEntries(new URL(c.req.url).searchParams);
        const validated = schema.query.parse(query);
        c.set('validatedQuery', validated);
      }

      // Validate path parameters
      if (schema.params) {
        const params = c.req.param();
        const validated = schema.params.parse(params);
        c.set('validatedParams', validated);
      }

      await next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new HTTPException(400, {
          message: 'Validation error',
          details: {
            code: 'VALIDATION_ERROR',
            errors: error.errors.map(err => ({
              path: err.path.join('.'),
              message: err.message,
              code: err.code
            }))
          }
        });
      }
      
      throw error;
    }
  };
};

// Common validation schemas
export const ValidationSchemas = {
  userId: z.object({
    userId: z.string().uuid('Invalid user ID format')
  }),
  
  sessionId: z.object({
    sessionId: z.string().uuid('Invalid session ID format')
  }),
  
  pagination: z.object({
    page: z.string().transform(Number).refine(n => n > 0, 'Page must be positive').optional(),
    limit: z.string().transform(Number).refine(n => n > 0 && n <= 100, 'Limit must be 1-100').optional()
  }),
  
  messageBody: z.object({
    message: z.string().min(1).max(2000, 'Message too long'),
    context: z.object({
      urgencyLevel: z.enum(['low', 'medium', 'high', 'crisis']).optional(),
      sessionType: z.enum(['diagnostic', 'intervention', 'reflection', 'goal_setting']).optional(),
      goalId: z.string().uuid().optional()
    }).optional()
  }),
  
  profileUpdate: z.object({
    preferences: z.object({
      theme: z.enum(['calm', 'professional']).optional(),
      notifications: z.boolean().optional(),
      coachingStyle: z.enum(['supportive', 'challenging', 'analytical']).optional()
    }).optional(),
    psychologicalProfile: z.object({
      mindset: z.enum(['growth', 'fixed']).optional(),
      locus: z.enum(['internal', 'external']).optional(),
      regulatory_focus: z.enum(['promotion', 'prevention']).optional()
    }).optional()
  })
};