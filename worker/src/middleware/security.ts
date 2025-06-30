import { Context, Next } from 'hono';
import { HTTPException } from 'hono/http-exception';

// Security headers middleware
export const securityHeaders = () => {
  return async (c: Context, next: Next) => {
    await next();
    
    // Set security headers
    c.header('X-Content-Type-Options', 'nosniff');
    c.header('X-Frame-Options', 'DENY');
    c.header('X-XSS-Protection', '1; mode=block');
    c.header('Referrer-Policy', 'strict-origin-when-cross-origin');
    c.header('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
    
    // Content Security Policy
    const csp = [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline'",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: https:",
      "connect-src 'self' https://api.openai.com https://api.anthropic.com",
      "frame-ancestors 'none'"
    ].join('; ');
    
    c.header('Content-Security-Policy', csp);
  };
};

// Input sanitization middleware
export const sanitizeInput = () => {
  return async (c: Context, next: Next) => {
    const contentType = c.req.header('Content-Type');
    
    if (contentType?.includes('application/json')) {
      try {
        const body = await c.req.json();
        const sanitized = sanitizeObject(body);
        
        // Replace the request body with sanitized version
        c.req = new Request(c.req.url, {
          ...c.req,
          body: JSON.stringify(sanitized)
        });
      } catch {
        // Invalid JSON will be caught by validation middleware
      }
    }
    
    await next();
  };
};

// Sanitize object recursively
function sanitizeObject(obj: any): any {
  if (typeof obj === 'string') {
    return sanitizeString(obj);
  }
  
  if (Array.isArray(obj)) {
    return obj.map(sanitizeObject);
  }
  
  if (obj && typeof obj === 'object') {
    const sanitized: any = {};
    for (const [key, value] of Object.entries(obj)) {
      sanitized[sanitizeString(key)] = sanitizeObject(value);
    }
    return sanitized;
  }
  
  return obj;
}

// Basic string sanitization
function sanitizeString(str: string): string {
  return str
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Remove script tags
    .replace(/javascript:/gi, '') // Remove javascript: URLs
    .replace(/on\w+\s*=/gi, '') // Remove event handlers
    .trim();
}

// Request size limit middleware
export const requestSizeLimit = (maxSize: number = 1024 * 1024) => { // Default 1MB
  return async (c: Context, next: Next) => {
    const contentLength = c.req.header('Content-Length');
    
    if (contentLength && parseInt(contentLength) > maxSize) {
      throw new HTTPException(413, {
        message: 'Request entity too large',
        details: {
          code: 'REQUEST_TOO_LARGE',
          maxSize,
          received: parseInt(contentLength)
        }
      });
    }
    
    await next();
  };
};