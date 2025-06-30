/**
 * Cloudflare Worker - API Backend
 * 
 * A production-ready Cloudflare Worker that handles API requests
 * for the React coaching application with proper error handling,
 * security, and performance optimizations.
 */

// Import any necessary modules (Cloudflare Workers support ES modules)
import { Router } from 'itty-router';

// Initialize router for clean route handling
const router = Router();

/**
 * CORS Configuration
 * Configure CORS headers for cross-origin requests
 */
const corsHeaders = {
  'Access-Control-Allow-Origin': '*', // In production, specify your domain
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-API-Key',
  'Access-Control-Max-Age': '86400', // 24 hours
};

/**
 * Response Utilities
 * Helper functions for consistent JSON responses
 */
const jsonResponse = (data, status = 200, headers = {}) => {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...corsHeaders,
      ...headers,
    },
  });
};

const errorResponse = (message, status = 400, code = null) => {
  return jsonResponse({
    error: true,
    message,
    code,
    timestamp: new Date().toISOString(),
  }, status);
};

/**
 * Input Validation Utilities
 * Functions for sanitizing and validating request data
 */
const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

const sanitizeString = (str, maxLength = 1000) => {
  if (typeof str !== 'string') return '';
  return str.trim().slice(0, maxLength);
};

const validateRequiredFields = (data, requiredFields) => {
  const missing = requiredFields.filter(field => !data[field]);
  if (missing.length > 0) {
    throw new Error(`Missing required fields: ${missing.join(', ')}`);
  }
};

/**
 * Authentication Middleware
 * Validates API keys and user authentication
 */
const authenticateRequest = async (request, env) => {
  const apiKey = request.headers.get('X-API-Key');
  const authHeader = request.headers.get('Authorization');

  // Check for API key in environment variables
  if (apiKey && env.API_KEY && apiKey === env.API_KEY) {
    return { authenticated: true, type: 'api_key' };
  }

  // Check for Bearer token
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    // In a real implementation, you'd verify this token with your auth provider
    // For now, we'll just check if it exists
    if (token && token.length > 10) {
      return { authenticated: true, type: 'bearer_token', token };
    }
  }

  return { authenticated: false };
};

/**
 * Rate Limiting
 * Simple rate limiting using Cloudflare's edge storage
 */
const checkRateLimit = async (request, env) => {
  if (!env.RATE_LIMIT_KV) return true; // Skip if KV not configured

  const clientId = request.headers.get('CF-Connecting-IP') || 'unknown';
  const key = `rate_limit:${clientId}`;
  const now = Date.now();
  const windowMs = 60 * 1000; // 1 minute window
  const maxRequests = 100; // Max requests per window

  try {
    const data = await env.RATE_LIMIT_KV.get(key);
    const rateData = data ? JSON.parse(data) : { count: 0, resetTime: now + windowMs };

    if (now > rateData.resetTime) {
      // Reset the window
      rateData.count = 1;
      rateData.resetTime = now + windowMs;
    } else {
      rateData.count++;
    }

    if (rateData.count > maxRequests) {
      return false;
    }

    // Store updated rate limit data
    await env.RATE_LIMIT_KV.put(key, JSON.stringify(rateData), {
      expirationTtl: Math.ceil(windowMs / 1000),
    });

    return true;
  } catch (error) {
    console.error('Rate limiting error:', error);
    return true; // Allow request if rate limiting fails
  }
};

/**
 * Route Handlers
 */

// Health check endpoint
router.get('/health', async (request, env) => {
  return jsonResponse({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    region: request.cf?.colo || 'unknown',
  });
});

// API Info endpoint
router.get('/api/info', async (request, env) => {
  return jsonResponse({
    name: 'Coaching API',
    version: '1.0.0',
    endpoints: [
      'GET /health - Health check',
      'GET /api/info - API information',
      'POST /api/coaching/message - Send coaching message',
      'GET /api/user/profile - Get user profile',
      'POST /api/user/profile - Update user profile',
    ],
    documentation: 'https://docs.yourapp.com/api',
  });
});

// Coaching message endpoint
router.post('/api/coaching/message', async (request, env, ctx) => {
  try {
    // Check rate limiting
    const rateLimitOk = await checkRateLimit(request, env);
    if (!rateLimitOk) {
      return errorResponse('Rate limit exceeded. Please try again later.', 429, 'RATE_LIMIT_EXCEEDED');
    }

    // Authenticate request
    const auth = await authenticateRequest(request, env);
    if (!auth.authenticated) {
      return errorResponse('Authentication required', 401, 'UNAUTHORIZED');
    }

    // Parse and validate request body
    const contentType = request.headers.get('Content-Type');
    if (!contentType || !contentType.includes('application/json')) {
      return errorResponse('Content-Type must be application/json', 400, 'INVALID_CONTENT_TYPE');
    }

    let body;
    try {
      body = await request.json();
    } catch (error) {
      return errorResponse('Invalid JSON in request body', 400, 'INVALID_JSON');
    }

    // Validate required fields
    validateRequiredFields(body, ['message', 'userId']);

    const { message, userId, context } = body;

    // Sanitize input
    const sanitizedMessage = sanitizeString(message, 2000);
    const sanitizedUserId = sanitizeString(userId, 100);

    if (!sanitizedMessage) {
      return errorResponse('Message cannot be empty', 400, 'EMPTY_MESSAGE');
    }

    // Simulate AI coaching response (in production, integrate with your AI service)
    const responses = [
      {
        content: "I understand you're looking for guidance. Let's break this down into manageable steps.",
        type: 'COACHING_RESPONSE',
        strategy: 'breakdown'
      },
      {
        content: "That's a common challenge. What's worked for you in similar situations before?",
        type: 'REFLECTIVE_QUESTION',
        strategy: 'reflection'
      },
      {
        content: "I can see the pattern here. Let's focus on building one small habit first.",
        type: 'PATTERN_OBSERVATION',
        strategy: 'incremental'
      }
    ];

    const randomResponse = responses[Math.floor(Math.random() * responses.length)];

    // Log interaction (in production, store in database)
    console.log(`Coaching interaction: ${sanitizedUserId} -> ${sanitizedMessage.substring(0, 50)}...`);

    return jsonResponse({
      success: true,
      response: {
        ...randomResponse,
        id: crypto.randomUUID(),
        timestamp: new Date().toISOString(),
        userId: sanitizedUserId,
      },
      metadata: {
        messageLength: sanitizedMessage.length,
        processingTime: Date.now() - ctx.start,
      }
    });

  } catch (error) {
    console.error('Coaching message error:', error);
    return errorResponse(
      error.message || 'Internal server error',
      500,
      'INTERNAL_ERROR'
    );
  }
});

// User profile endpoints
router.get('/api/user/profile/:userId', async (request, env) => {
  try {
    const auth = await authenticateRequest(request, env);
    if (!auth.authenticated) {
      return errorResponse('Authentication required', 401, 'UNAUTHORIZED');
    }

    const { userId } = request.params;
    const sanitizedUserId = sanitizeString(userId, 100);

    if (!sanitizedUserId) {
      return errorResponse('Valid user ID required', 400, 'INVALID_USER_ID');
    }

    // In production, fetch from database
    const mockProfile = {
      id: sanitizedUserId,
      username: `user_${sanitizedUserId.substring(0, 8)}`,
      email: 'user@example.com',
      createdAt: '2024-01-01T00:00:00Z',
      lastActive: new Date().toISOString(),
      preferences: {
        theme: 'calm',
        notifications: true,
        coachingStyle: 'supportive'
      },
      stats: {
        sessionsCompleted: 15,
        streakDays: 7,
        totalWins: 42
      }
    };

    return jsonResponse({
      success: true,
      profile: mockProfile
    });

  } catch (error) {
    console.error('Profile fetch error:', error);
    return errorResponse('Failed to fetch profile', 500, 'PROFILE_FETCH_ERROR');
  }
});

router.post('/api/user/profile/:userId', async (request, env) => {
  try {
    const auth = await authenticateRequest(request, env);
    if (!auth.authenticated) {
      return errorResponse('Authentication required', 401, 'UNAUTHORIZED');
    }

    const { userId } = request.params;
    const body = await request.json();

    const sanitizedUserId = sanitizeString(userId, 100);
    
    // Validate and sanitize profile data
    const allowedFields = ['username', 'preferences', 'theme'];
    const updates = {};
    
    for (const [key, value] of Object.entries(body)) {
      if (allowedFields.includes(key)) {
        if (typeof value === 'string') {
          updates[key] = sanitizeString(value, 200);
        } else if (typeof value === 'object' && value !== null) {
          updates[key] = value; // In production, validate object structure
        }
      }
    }

    // In production, update database
    console.log(`Profile update: ${sanitizedUserId}`, updates);

    return jsonResponse({
      success: true,
      message: 'Profile updated successfully',
      updatedFields: Object.keys(updates)
    });

  } catch (error) {
    console.error('Profile update error:', error);
    return errorResponse('Failed to update profile', 500, 'PROFILE_UPDATE_ERROR');
  }
});

// Handle preflight OPTIONS requests for CORS
router.options('*', () => {
  return new Response(null, {
    status: 200,
    headers: corsHeaders,
  });
});

// 404 handler
router.all('*', () => {
  return errorResponse('Endpoint not found', 404, 'NOT_FOUND');
});

/**
 * Main Worker Event Handler
 * Entry point for all requests to the worker
 */
addEventListener('fetch', (event) => {
  event.respondWith(handleRequest(event.request, event));
});

async function handleRequest(request, event) {
  // Add request timing for performance monitoring
  const start = Date.now();
  
  try {
    // Parse the request URL
    const url = new URL(request.url);
    
    // Add security headers
    const securityHeaders = {
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
      'X-XSS-Protection': '1; mode=block',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
    };

    // Create context object for request handling
    const ctx = {
      start,
      url,
      method: request.method,
      headers: request.headers,
    };

    // Handle the request through the router
    const response = await router.handle(request, event.env, ctx);
    
    // Add security headers to response
    Object.entries(securityHeaders).forEach(([key, value]) => {
      response.headers.set(key, value);
    });

    // Add performance header
    response.headers.set('X-Response-Time', `${Date.now() - start}ms`);

    return response;

  } catch (error) {
    console.error('Worker error:', error);
    
    return errorResponse(
      'Internal server error',
      500,
      'WORKER_ERROR'
    );
  }
}

/**
 * Scheduled Event Handler (Optional)
 * For handling cron jobs and scheduled tasks
 */
addEventListener('scheduled', (event) => {
  event.waitUntil(handleScheduled(event));
});

async function handleScheduled(event) {
  // Handle scheduled tasks like cleanup, analytics, etc.
  console.log('Scheduled event triggered:', event.scheduledTime);
  
  // Example: Clean up rate limiting data
  // In production, you might clean up expired sessions, generate reports, etc.
}

export default {
  fetch: handleRequest,
  scheduled: handleScheduled,
};