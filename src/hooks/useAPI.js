import { useState, useEffect } from 'react';
import { api, APIError } from '../lib/api';

// Custom hook for API requests with loading and error states
export const useAPI = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const execute = async (apiCall, options = {}) => {
    const { 
      onSuccess, 
      onError, 
      showLoading = true,
      retries = 0 
    } = options;

    if (showLoading) setLoading(true);
    setError(null);

    let attempt = 0;
    
    while (attempt <= retries) {
      try {
        const result = await apiCall();
        
        if (showLoading) setLoading(false);
        if (onSuccess) onSuccess(result);
        
        return result;
      } catch (err) {
        if (err instanceof APIError && err.isAuthError()) {
          // Handle auth errors - could trigger re-authentication
          console.warn('Authentication error:', err);
          setError(err);
          if (showLoading) setLoading(false);
          throw err;
        }
        
        if (attempt === retries) {
          // Final attempt failed
          setError(err);
          if (showLoading) setLoading(false);
          if (onError) onError(err);
          throw err;
        }
        
        attempt++;
        // Wait before retry (exponential backoff)
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
      }
    }
  };

  const clearError = () => setError(null);

  return {
    loading,
    error,
    execute,
    clearError
  };
};

// Hook for coaching messages
export const useCoaching = () => {
  const { loading, error, execute, clearError } = useAPI();
  const [messages, setMessages] = useState([]);
  const [currentSession, setCurrentSession] = useState(null);

  const sendMessage = async (message, context = {}) => {
    return execute(
      () => api.coaching.sendMessage(message, context),
      {
        onSuccess: (response) => {
          setMessages(prev => [...prev, {
            id: response.data.id,
            type: 'ai',
            content: response.data.content,
            timestamp: response.data.timestamp || new Date().toISOString()
          }]);
        },
        retries: 1
      }
    );
  };

  const loadHistory = async () => {
    return execute(
      () => api.coaching.getHistory(),
      {
        onSuccess: (response) => {
          setMessages(response.data || []);
        }
      }
    );
  };

  const startSession = async () => {
    return execute(
      () => api.sessions.create(),
      {
        onSuccess: (response) => {
          setCurrentSession(response.data);
        }
      }
    );
  };

  const endSession = async () => {
    if (!currentSession) return;
    
    return execute(
      () => api.sessions.end(currentSession.id),
      {
        onSuccess: () => {
          setCurrentSession(null);
        }
      }
    );
  };

  return {
    loading,
    error,
    messages,
    currentSession,
    sendMessage,
    loadHistory,
    startSession,
    endSession,
    clearError
  };
};

// Hook for user profile management
export const useProfile = () => {
  const { loading, error, execute, clearError } = useAPI();
  const [profile, setProfile] = useState(null);

  const loadProfile = async () => {
    return execute(
      () => api.users.getProfile(),
      {
        onSuccess: (response) => {
          setProfile(response.data);
        }
      }
    );
  };

  const updateProfile = async (updates) => {
    return execute(
      () => api.users.updateProfile(updates),
      {
        onSuccess: (response) => {
          setProfile(response.data);
        }
      }
    );
  };

  // Load profile on mount
  useEffect(() => {
    loadProfile().catch(console.error);
  }, []);

  return {
    loading,
    error,
    profile,
    loadProfile,
    updateProfile,
    clearError
  };
};

// Hook for API health monitoring
export const useAPIHealth = () => {
  const [isHealthy, setIsHealthy] = useState(true);
  const [lastCheck, setLastCheck] = useState(null);

  const checkHealth = async () => {
    try {
      const healthy = await api.healthCheck();
      setIsHealthy(healthy);
      setLastCheck(new Date().toISOString());
      return healthy;
    } catch {
      setIsHealthy(false);
      setLastCheck(new Date().toISOString());
      return false;
    }
  };

  // Check health periodically
  useEffect(() => {
    checkHealth();
    
    const interval = setInterval(checkHealth, 60000); // Check every minute
    return () => clearInterval(interval);
  }, []);

  return {
    isHealthy,
    lastCheck,
    checkHealth
  };
};