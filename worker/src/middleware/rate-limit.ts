import { Context, Next } from 'hono';
import { HTTPException } from 'hono/http-exception';
import { Env } from '../types';

interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
  keyPrefix: string;
}

export const rateLimit = (config: RateLimitConfig) => {
  return async (c: Context<{ Bindings: Env }>, next: Next) => {
    if (!c.env.RATE_LIMIT_KV) {
      console.warn('Rate limiting KV not configured, skipping');
      await next();
      return;
    }

    const clientId = c.req.header('CF-Connecting-IP') || 
                    c.req.header('X-Forwarded-For') || 
                    'unknown';
    const key = `${config.keyPrefix}:${clientId}`;
    const now = Date.now();

    try {
      // Get current rate limit data
      const data = await c.env.RATE_LIMIT_KV.get(key);
      const rateData = data ? JSON.parse(data) : { 
        count: 0, 
        resetTime: now + config.windowMs 
      };

      // Reset if window has expired
      if (now > rateData.resetTime) {
        rateData.count = 1;
        rateData.resetTime = now + config.windowMs;
      } else {
        rateData.count++;
      }

      // Check if limit exceeded
      if (rateData.count > config.maxRequests) {
        const resetIn = Math.ceil((rateData.resetTime - now) / 1000);
        
        // Set rate limit headers
        c.header('X-RateLimit-Limit', config.maxRequests.toString());
        c.header('X-RateLimit-Remaining', '0');
        c.header('X-RateLimit-Reset', resetIn.toString());
        
        throw new HTTPException(429, { 
          message: 'Rate limit exceeded',
          details: {
            code: 'RATE_LIMIT_EXCEEDED',
            resetIn,
            limit: config.maxRequests
          }
        });
      }

      // Update rate limit data
      await c.env.RATE_LIMIT_KV.put(
        key, 
        JSON.stringify(rateData),
        { expirationTtl: Math.ceil(config.windowMs / 1000) }
      );

      // Set rate limit headers
      c.header('X-RateLimit-Limit', config.maxRequests.toString());
      c.header('X-RateLimit-Remaining', (config.maxRequests - rateData.count).toString());
      c.header('X-RateLimit-Reset', Math.ceil((rateData.resetTime - now) / 1000).toString());

      await next();
    } catch (error) {
      if (error instanceof HTTPException) {
        throw error;
      }
      
      console.error('Rate limiting error:', error);
      // Allow request on error to prevent blocking legitimate users
      await next();
    }
  };
};

// Predefined rate limit configurations
export const rateLimitConfigs = {
  strict: { windowMs: 15 * 60 * 1000, maxRequests: 100, keyPrefix: 'strict' }, // 100 requests per 15 minutes
  moderate: { windowMs: 15 * 60 * 1000, maxRequests: 500, keyPrefix: 'moderate' }, // 500 requests per 15 minutes
  lenient: { windowMs: 15 * 60 * 1000, maxRequests: 1000, keyPrefix: 'lenient' }, // 1000 requests per 15 minutes
  coaching: { windowMs: 60 * 1000, maxRequests: 10, keyPrefix: 'coaching' }, // 10 coaching messages per minute
};