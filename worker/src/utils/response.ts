import { Context } from 'hono';
import { HTTPException } from 'hono/http-exception';

export interface APIResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    message: string;
    code: string;
    details?: any;
  };
  metadata?: {
    requestId: string;
    timestamp: string;
    processingTime?: number;
    rateLimit?: {
      limit: number;
      remaining: number;
      reset: number;
    };
  };
}

export class ResponseHelper {
  static success<T>(c: Context, data: T, metadata?: any): Response {
    const response: APIResponse<T> = {
      success: true,
      data,
      metadata: {
        requestId: c.req.header('cf-request-id') || crypto.randomUUID(),
        timestamp: new Date().toISOString(),
        ...metadata
      }
    };
    
    return c.json(response);
  }
  
  static error(c: Context, error: HTTPException | Error, details?: any): Response {
    let status = 500;
    let message = 'Internal server error';
    let code = 'INTERNAL_ERROR';
    
    if (error instanceof HTTPException) {
      status = error.status;
      message = error.message;
      code = error.cause?.toString() || 'HTTP_ERROR';
    } else if (error instanceof Error) {
      message = error.message;
      code = 'APPLICATION_ERROR';
    }
    
    const response: APIResponse = {
      success: false,
      error: {
        message,
        code,
        details
      },
      metadata: {
        requestId: c.req.header('cf-request-id') || crypto.randomUUID(),
        timestamp: new Date().toISOString()
      }
    };
    
    return c.json(response, status);
  }
  
  static created<T>(c: Context, data: T, location?: string): Response {
    if (location) {
      c.header('Location', location);
    }
    
    const response: APIResponse<T> = {
      success: true,
      data,
      metadata: {
        requestId: c.req.header('cf-request-id') || crypto.randomUUID(),
        timestamp: new Date().toISOString()
      }
    };
    
    return c.json(response, 201);
  }
  
  static noContent(c: Context): Response {
    return c.text('', 204);
  }
  
  static paginated<T>(
    c: Context, 
    data: T[], 
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    }
  ): Response {
    const response: APIResponse<T[]> = {
      success: true,
      data,
      metadata: {
        requestId: c.req.header('cf-request-id') || crypto.randomUUID(),
        timestamp: new Date().toISOString(),
        pagination
      }
    };
    
    return c.json(response);
  }
}