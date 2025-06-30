import { Context, Next } from 'hono';
import { HTTPException } from 'hono/http-exception';
import jwt from '@tsndr/cloudflare-worker-jwt';
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
      // Verify the JWT token
      const isValid = await jwt.verify(token, c.env.JWT_SECRET);
      
      if (!isValid) {
        throw new HTTPException(401, { message: 'Invalid token' });
      }

      // Decode the payload
      const payload = jwt.decode(token);
      
      if (!payload || !payload.payload) {
        throw new HTTPException(401, { message: 'Invalid token payload' });
      }

      const tokenData = payload.payload;
      
      // Check if token has expired
      if (tokenData.exp && tokenData.exp < Math.floor(Date.now() / 1000)) {
        throw new HTTPException(401, { message: 'Token expired' });
      }

      // Set user data in context
      c.set('user', {
        id: tokenData.sub as string,
        email: tokenData.email as string,
        role: (tokenData.role as string) || 'user',
        subscription: tokenData.subscription
      } as AuthUser);

      await next();
    } catch (error) {
      console.error('JWT verification failed:', error);
      
      if (error instanceof HTTPException) {
        throw error;
      }
      
      throw new HTTPException(401, { message: 'Token verification failed' });
    }
  };
};

// Create JWT token (utility function for testing)
export const createJWT = async (payload: any, secret: string, expiresIn: number = 3600): Promise<string> => {
  const now = Math.floor(Date.now() / 1000);
  
  const tokenPayload = {
    ...payload,
    iat: now,
    exp: now + expiresIn
  };

  return jwt.sign(tokenPayload, secret);
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

    // For development/testing, you might want to bypass this check
    const isDevelopment = c.env.ENVIRONMENT === 'development';
    
    if (!isDevelopment && !user.subscription?.active) {
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

// Validate JWT token without middleware (utility function)
export const validateJWT = async (token: string, secret: string): Promise<any> => {
  try {
    const isValid = await jwt.verify(token, secret);
    
    if (!isValid) {
      return null;
    }

    const decoded = jwt.decode(token);
    return decoded?.payload || null;
  } catch {
    return null;
  }
};