import { supabase } from '../lib/supabase';

// Middleware to verify JWT tokens for API requests
export const verifyToken = async (token) => {
  try {
    const { data, error } = await supabase.auth.getUser(token);
    
    if (error || !data.user) {
      return { valid: false, user: null, error: error?.message || 'Invalid token' };
    }

    return { valid: true, user: data.user, error: null };
  } catch (error) {
    return { valid: false, user: null, error: 'Token verification failed' };
  }
};

// Check if user has required role
export const hasRequiredRole = async (userId, requiredRole) => {
  try {
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', userId)
      .single();

    if (error || !profile) {
      return false;
    }

    // Admin has access to everything
    if (profile.role === 'admin') {
      return true;
    }

    return profile.role === requiredRole;
  } catch (error) {
    console.error('Role check error:', error);
    return false;
  }
};

// Rate limiting check
export const checkRateLimit = async (identifier, maxAttempts = 10, windowMs = 15 * 60 * 1000) => {
  const key = `rate_limit_${identifier}`;
  
  try {
    // Get current attempts from localStorage (client-side) or implement server-side storage
    const stored = localStorage.getItem(key);
    const now = Date.now();
    
    if (!stored) {
      localStorage.setItem(key, JSON.stringify({ count: 1, resetTime: now + windowMs }));
      return { allowed: true, remaining: maxAttempts - 1 };
    }

    const data = JSON.parse(stored);
    
    // Reset if window has expired
    if (now > data.resetTime) {
      localStorage.setItem(key, JSON.stringify({ count: 1, resetTime: now + windowMs }));
      return { allowed: true, remaining: maxAttempts - 1 };
    }

    // Check if limit exceeded
    if (data.count >= maxAttempts) {
      return { 
        allowed: false, 
        remaining: 0, 
        resetTime: data.resetTime,
        error: 'Rate limit exceeded' 
      };
    }

    // Increment count
    data.count++;
    localStorage.setItem(key, JSON.stringify(data));
    
    return { allowed: true, remaining: maxAttempts - data.count };
  } catch (error) {
    console.error('Rate limit check error:', error);
    // Allow on error to prevent blocking legitimate users
    return { allowed: true, remaining: maxAttempts };
  }
};

// Enhanced authentication hook with middleware
export const useAuthWithMiddleware = () => {
  const checkUserPermission = async (requiredRole = null) => {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error || !session) {
        return { authorized: false, error: 'Not authenticated' };
      }

      if (!requiredRole) {
        return { authorized: true, user: session.user };
      }

      const hasRole = await hasRequiredRole(session.user.id, requiredRole);
      
      if (!hasRole) {
        return { authorized: false, error: 'Insufficient permissions' };
      }

      return { authorized: true, user: session.user };
    } catch (error) {
      return { authorized: false, error: error.message };
    }
  };

  const makeAuthenticatedRequest = async (url, options = {}, requiredRole = null) => {
    // Check authentication and permissions
    const authCheck = await checkUserPermission(requiredRole);
    
    if (!authCheck.authorized) {
      throw new Error(authCheck.error);
    }

    // Get current session token
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session?.access_token) {
      throw new Error('No valid session token');
    }

    // Rate limiting check
    const rateLimit = await checkRateLimit(authCheck.user.id);
    
    if (!rateLimit.allowed) {
      throw new Error(`Rate limit exceeded. Try again after ${new Date(rateLimit.resetTime).toLocaleTimeString()}`);
    }

    // Make request with auth header
    const response = await fetch(url, {
      ...options,
      headers: {
        ...options.headers,
        'Authorization': `Bearer ${session.access_token}`,
        'Content-Type': 'application/json',
      },
    });

    if (response.status === 401) {
      // Token might be expired, try to refresh
      const { data: refreshedSession, error } = await supabase.auth.refreshSession();
      
      if (error || !refreshedSession?.session) {
        throw new Error('Session expired. Please sign in again.');
      }

      // Retry request with new token
      return fetch(url, {
        ...options,
        headers: {
          ...options.headers,
          'Authorization': `Bearer ${refreshedSession.session.access_token}`,
          'Content-Type': 'application/json',
        },
      });
    }

    return response;
  };

  return {
    checkUserPermission,
    makeAuthenticatedRequest,
    checkRateLimit
  };
};