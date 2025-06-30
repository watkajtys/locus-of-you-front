import { Context, Next } from 'hono';
import { HTTPException } from 'hono/http-exception';
import { verify } from '@cloudflare/workers-jwt';
import { Env } from '../types';

export interface AuthUser {
  id: string;
  email: string;
  role?: 'user' | 'coach' | 'admin';
  subscription?: {
    active: boolean;
    plan: string;
  };
}

// JWT Authentication Middleware
export const jwtAuth = () => {
  return async (c: Context<{ Bindings: Env }>, next: Next) => {
    const authorization = c.req.header('Authorization');
    
    if (!authorization?.startsWith('Bearer ')) {
      throw new HTTPException(401, { message: 'Missing or invalid authorization header' });
    }

    const token = authorization.substring(7);
    
    try {
      const payload = await verify(token, c.env.JWT_SECRET);
      
      // Verify token hasn't expired
      if (payload.exp && payload.exp < Date.now() / 1000) {
        throw new HTTPException(401, { message: 'Token expired' });
      }

      // Set user data in context
      c.set('user', {
        id: payload.sub as string,
        email: payload.email as string,
        role: payload.role as string || 'user',
        subscription: payload.subscription
      } as AuthUser);

      await next();
    } catch (error) {
      console.error('JWT verification failed:', error);
      throw new HTTPException(401, { message: 'Invalid token' });
    }
  };
};

// API Key Authentication Middleware
export const apiKeyAuth = () => {
  return async (c: Context<{ Bindings: Env }>, next: Next) => {
    const apiKey = c.req.header('X-API-Key');
    
    if (!apiKey) {
      throw new HTTPException(401, { message: 'API key required' });
    }

    if (apiKey !== c.env.API_KEY) {
      throw new HTTPException(401, { message: 'Invalid API key' });
    }

    // Set system user for API key requests
    c.set('user', {
      id: 'system',
      email: 'system@api',
      role: 'admin'
    } as AuthUser);

    await next();
  };
};

// Role-based authorization middleware
export const requireRole = (roles: string[]) => {
  return async (c: Context, next: Next) => {
    const user = c.get('user') as AuthUser;
    
    if (!user) {
      throw new HTTPException(401, { message: 'Authentication required' });
    }

    if (!roles.includes(user.role || 'user')) {
      throw new HTTPException(403, { message: 'Insufficient permissions' });
    }

    await next();
  };
};

// Subscription validation middleware
export const requireSubscription = () => {
  return async (c: Context, next: Next) => {
    const user = c.get('user') as AuthUser;
    
    if (!user) {
      throw new HTTPException(401, { message: 'Authentication required' });
    }

    if (!user.subscription?.active) {
      throw new HTTPException(402, { 
        message: 'Active subscription required',
        details: {
          code: 'SUBSCRIPTION_REQUIRED',
          action: 'upgrade'
        }
      });
    }

    await next();
  };
};