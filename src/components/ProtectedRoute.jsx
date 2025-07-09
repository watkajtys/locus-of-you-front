import { Loader2 } from 'lucide-react';
import React from 'react';

import { useAuth } from '../hooks/authHooks'; // Keep for hasRole, review later
import useStore from '../store/store'; // Import Zustand store

import EnhancedAuth from './EnhancedAuth';

// useAuth might still be used if hasRole is complex and relies on it,
// or we might need to replicate its logic using store's session/userProfile.

const ProtectedRoute = ({ children, requireRole = null, fallback = null }) => {
  const session = useStore((state) => state.session);
  const isLoading = useStore((state) => state.isLoading); // Global loading state
  const userProfile = useStore((state) => state.userProfile); // For role checking if needed

  // Original useAuth hook, primarily for hasRole if it's complex.
  // isAuthenticated can be derived from store's session.
  // user object from useAuth might be different from store's session.user or userProfile.
  const { user: authHookUser, loading: authHookLoading, hasRole } = useAuth();

  const isAuthenticated = !!session; // Derived from Zustand store's session

  // Show loading state (prefer global loading state from store if it covers auth loading)
  if (isLoading || authHookLoading) { // Combine loading states
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
            Verifying authentication... {/* Or a more generic "Loading..." */}
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
  // Ensure hasRole is called with the correct user object.
  // If hasRole depends on claims within the session JWT, session.user might be enough.
  // If it depends on profile data, userProfile might be used.
  // The original useAuth().user (authHookUser) might be the source for hasRole.
  if (requireRole && !hasRole(requireRole, authHookUser)) { // Pass authHookUser or relevant user object to hasRole
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