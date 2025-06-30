import { supabase } from './supabase';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://your-worker.your-subdomain.workers.dev';

class APIClient {
  constructor() {
    this.baseURL = API_BASE_URL;
    this.defaultHeaders = {
      'Content-Type': 'application/json',
    };
  }

  // Get authentication token
  async getAuthToken() {
    const { data: { session } } = await supabase.auth.getSession();
    return session?.access_token;
  }

  // Make authenticated request
  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const token = await this.getAuthToken();
    
    const config = {
      headers: {
        ...this.defaultHeaders,
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
      },
      ...options,
    };

    // Add request ID for tracing
    config.headers['X-Request-ID'] = crypto.randomUUID();

    try {
      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok) {
        throw new APIError(data.error?.message || 'Request failed', {
          status: response.status,
          code: data.error?.code || 'REQUEST_FAILED',
          details: data.error?.details,
          requestId: data.metadata?.requestId
        });
      }

      return data;
    } catch (error) {
      if (error instanceof APIError) {
        throw error;
      }
      
      // Network or parsing error
      throw new APIError('Network error', {
        status: 0,
        code: 'NETWORK_ERROR',
        details: error.message
      });
    }
  }

  // GET request
  async get(endpoint, params = {}) {
    const url = new URL(endpoint, this.baseURL);
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        url.searchParams.append(key, value.toString());
      }
    });

    return this.request(url.pathname + url.search);
  }

  // POST request
  async post(endpoint, data = {}) {
    return this.request(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // PUT request
  async put(endpoint, data = {}) {
    return this.request(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  // DELETE request
  async delete(endpoint) {
    return this.request(endpoint, {
      method: 'DELETE',
    });
  }

  // Health check
  async healthCheck() {
    try {
      const response = await fetch(`${this.baseURL}/health`);
      return response.ok;
    } catch {
      return false;
    }
  }

  // Coaching API methods
  coaching = {
    sendMessage: async (message, context = {}) => {
      return this.post('/api/coaching/message', {
        message,
        context
      });
    },

    getHistory: async (page = 1, limit = 20) => {
      return this.get('/api/coaching/history', { page, limit });
    }
  };

  // User API methods
  users = {
    getProfile: async () => {
      return this.get('/api/users/profile');
    },

    updateProfile: async (updates) => {
      return this.put('/api/users/profile', updates);
    }
  };

  // Session API methods
  sessions = {
    create: async () => {
      return this.post('/api/sessions');
    },

    get: async (sessionId) => {
      return this.get(`/api/sessions/${sessionId}`);
    },

    end: async (sessionId) => {
      return this.put(`/api/sessions/${sessionId}/end`);
    }
  };
}

// Custom error class for API errors
class APIError extends Error {
  constructor(message, { status, code, details, requestId } = {}) {
    super(message);
    this.name = 'APIError';
    this.status = status;
    this.code = code;
    this.details = details;
    this.requestId = requestId;
  }

  // Check if error is due to authentication
  isAuthError() {
    return this.status === 401;
  }

  // Check if error is due to missing subscription
  isSubscriptionError() {
    return this.status === 402;
  }

  // Check if error is due to rate limiting
  isRateLimitError() {
    return this.status === 429;
  }

  // Check if error is a validation error
  isValidationError() {
    return this.status === 400 && this.code === 'VALIDATION_ERROR';
  }
}

// Create singleton instance
const apiClient = new APIClient();

// Export both the client and error class
export { apiClient as api, APIError };

// Convenience methods for common operations
export const sendCoachingMessage = (message, context) => 
  apiClient.coaching.sendMessage(message, context);

export const getUserProfile = () => 
  apiClient.users.getProfile();

export const updateUserProfile = (updates) => 
  apiClient.users.updateProfile(updates);

export const createSession = () => 
  apiClient.sessions.create();

export const checkAPIHealth = () => 
  apiClient.healthCheck();