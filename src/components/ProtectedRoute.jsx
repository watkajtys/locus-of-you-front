import React from 'react';
import { useAuth } from '../hooks/useAuth';
import { Loader2 } from 'lucide-react';
import EnhancedAuth from './EnhancedAuth';

const ProtectedRoute = ({ children, requireRole = null, fallback = null }) => {
  const { user, loading, hasRole, isAuthenticated } = useAuth();

  // Show loading state
  if (loading) {
    return (
      <div 
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: 'var(--color-background)' }}
      >
        <div className="text-center space-y-4">
          <Loader2 
            className="w-8 h-8 animate-spin mx-auto"
            style={{ color: 'var(--color-accent)' }}
          />
          <p 
            className="text-sm"
            style={{ color: 'var(--color-muted)' }}
          >
            Verifying authentication...
          </p>
        </div>
      </div>
    );
  }

  // Check authentication - render auth component directly instead of redirecting
  if (!isAuthenticated) {
    return fallback || <EnhancedAuth />;
  }

  // Check role-based access
  if (requireRole && !hasRole(requireRole)) {
    return (
      <div 
        className="min-h-screen flex items-center justify-center p-6"
        style={{ backgroundColor: 'var(--color-background)' }}
      >
        <div 
          className="text-center p-8 rounded-xl max-w-md mx-auto"
          style={{ 
            backgroundColor: 'var(--color-card)',
            border: '1px solid var(--color-border)'
          }}
        >
          <h2 
            className="text-2xl font-bold mb-4"
            style={{ color: 'var(--color-text)' }}
          >
            Insufficient Permissions
          </h2>
          <p 
            className="text-base"
            style={{ color: 'var(--color-muted)' }}
          >
            You don't have the required permissions to access this content.
          </p>
        </div>
      </div>
    );
  }

  return children;
};

export default ProtectedRoute;