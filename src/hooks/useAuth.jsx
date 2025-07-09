import { useState, useEffect, useCallback } from 'react';

import { supabase } from '../lib/supabase';

import { AuthContext } from './authHooks';

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState(null);

  // Generate a valid username that meets the database constraints
  const generateUsername = (user) => {
    // Try to use the username from metadata first
    if (user.user_metadata?.username && user.user_metadata.username.length >= 3) {
      return user.user_metadata.username;
    }

    // Generate from email
    const emailPrefix = user.email?.split('@')[0] || 'user';
    
    // Ensure minimum length of 3 characters
    if (emailPrefix.length < 3) {
      return `${emailPrefix}${Math.random().toString(36).substring(2, 5)}`;
    }
    
    return emailPrefix;
  };

  // Ensure user profile exists in database
  const ensureUserProfile = useCallback(async (user) => {
    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error && error.code === 'PGRST116') {
        // Profile doesn't exist, create it
        const username = generateUsername(user);
        
        // Check if username already exists and make it unique if needed
        const { data: existingUser } = await supabase
          .from('profiles')
          .select('username')
          .eq('username', username)
          .single();

        let finalUsername = username;
        if (existingUser) {
          // Generate a unique username by appending random numbers
          const randomSuffix = Math.random().toString(36).substring(2, 8);
          finalUsername = `${username}${randomSuffix}`;
        }

        const { error: insertError } = await supabase
          .from('profiles')
          .insert({
            id: user.id,
            username: finalUsername,
            full_name: user.user_metadata?.full_name || '',
            avatar_url: user.user_metadata?.avatar_url || '',
            email_verified: user.email_confirmed_at ? true : false,
            last_sign_in_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });

        if (insertError) {
          console.error('Error creating profile:', insertError);
          throw insertError;
        }
      } else if (error) {
        console.error('Error checking profile:', error);
        throw error;
      }
    } catch (error) {
      console.error('Error ensuring user profile:', error);
      throw error;
    }
  }, []);

  useEffect(() => {
    // Get initial session
    const getInitialSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) throw error;
        
        setSession(session);
        setUser(session?.user ?? null);
      } catch (error) {
        console.error('Error getting session:', error);
        setAuthError(error.message);
      } finally {
        setLoading(false);
      }
    };

    getInitialSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth event:', event);
        
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
        
        // Handle specific auth events
        switch (event) {
          case 'SIGNED_IN':
            setAuthError(null);
            // Create user profile if doesn't exist
            await ensureUserProfile(session.user);
            break;
          case 'SIGNED_OUT':
            setAuthError(null);
            break;
          case 'TOKEN_REFRESHED':
            console.log('Token refreshed successfully');
            break;
          case 'USER_UPDATED':
            console.log('User updated');
            break;
          default:
            break;
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [ensureUserProfile]);

  // Enhanced sign up with better validation
  const signUp = async (email, password, metadata = {}) => {
    try {
      setLoading(true);
      setAuthError(null);

      // Client-side validation
      const validationError = validatePassword(password);
      if (validationError) {
        throw new Error(validationError);
      }

      if (!validateEmail(email)) {
        throw new Error('Please enter a valid email address');
      }

      const { data, error } = await supabase.auth.signUp({
        email: email.toLowerCase().trim(),
        password,
        options: {
          data: metadata,
          emailRedirectTo: `${window.location.origin}/auth/callback`
        }
      });

      if (error) throw error;

      return { data, error: null };
    } catch (error) {
      const friendlyError = mapAuthError(error);
      setAuthError(friendlyError);
      return { data: null, error: friendlyError };
    } finally {
      setLoading(false);
    }
  };

  // Enhanced sign in with rate limiting
  const signIn = async (email, password) => {
    try {
      setLoading(true);
      setAuthError(null);

      // Check rate limiting
      const rateLimitKey = `auth_attempts_${email}`;
      const attempts = parseInt(localStorage.getItem(rateLimitKey) || '0');
      const lastAttempt = localStorage.getItem(`${rateLimitKey}_time`);
      
      if (attempts >= 5 && lastAttempt) {
        const timeDiff = Date.now() - parseInt(lastAttempt);
        if (timeDiff < 15 * 60 * 1000) { // 15 minutes
          throw new Error('Too many failed attempts. Please try again in 15 minutes.');
        } else {
          // Reset attempts after cooldown
          localStorage.removeItem(rateLimitKey);
          localStorage.removeItem(`${rateLimitKey}_time`);
        }
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.toLowerCase().trim(),
        password
      });

      if (error) {
        // Increment failed attempts
        localStorage.setItem(rateLimitKey, (attempts + 1).toString());
        localStorage.setItem(`${rateLimitKey}_time`, Date.now().toString());
        throw error;
      }

      // Clear failed attempts on success
      localStorage.removeItem(rateLimitKey);
      localStorage.removeItem(`${rateLimitKey}_time`);

      return { data, error: null };
    } catch (error) {
      const friendlyError = mapAuthError(error);
      setAuthError(friendlyError);
      return { data: null, error: friendlyError };
    } finally {
      setLoading(false);
    }
  };

  // Password reset functionality
  const resetPassword = async (email) => {
    try {
      setLoading(true);
      setAuthError(null);

      const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`
      });

      if (error) throw error;

      return { data, error: null };
    } catch (error) {
      const friendlyError = mapAuthError(error);
      setAuthError(friendlyError);
      return { data: null, error: friendlyError };
    } finally {
      setLoading(false);
    }
  };

  // Update password
  const updatePassword = async (newPassword) => {
    try {
      setLoading(true);
      setAuthError(null);

      const validationError = validatePassword(newPassword);
      if (validationError) {
        throw new Error(validationError);
      }

      const { data, error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) throw error;

      return { data, error: null };
    } catch (error) {
      const friendlyError = mapAuthError(error);
      setAuthError(friendlyError);
      return { data: null, error: friendlyError };
    } finally {
      setLoading(false);
    }
  };

  // Sign out
  const signOut = async () => {
    try {
      setLoading(true);
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
    } catch (error) {
      console.error('Error signing out:', error);
      setAuthError(mapAuthError(error));
    } finally {
      setLoading(false);
    }
  };

  // Get current session
  const getCurrentSession = async () => {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      if (error) throw error;
      return session;
    } catch (error) {
      console.error('Error getting current session:', error);
      return null;
    }
  };

  // Check if user has specific role
  const hasRole = (role) => {
    return user?.app_metadata?.role === role || 
           user?.app_metadata?.roles?.includes(role);
  };

  const value = {
    user,
    session,
    loading,
    authError,
    signUp,
    signIn,
    signOut,
    resetPassword,
    updatePassword,
    getCurrentSession,
    hasRole,
    isAuthenticated: !!user,
    isLoading: loading
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Validation functions
const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

const validatePassword = (password) => {
  if (password.length < 12) {
    return 'Password must be at least 12 characters long';
  }
  
  return null;
};

// Map Supabase errors to user-friendly messages
const mapAuthError = (error) => {
  const errorMessage = error.message?.toLowerCase() || '';
  
  if (errorMessage.includes('invalid login credentials')) {
    return 'Invalid email or password. Please check your credentials and try again.';
  }
  
  if (errorMessage.includes('email not confirmed')) {
    return 'Please check your email and click the confirmation link before signing in.';
  }
  
  if (errorMessage.includes('signup is disabled')) {
    return 'New account registration is currently disabled. Please contact support.';
  }
  
  if (errorMessage.includes('email rate limit exceeded')) {
    return 'Too many emails sent. Please wait before requesting another confirmation email.';
  }
  
  if (errorMessage.includes('user already registered')) {
    return 'An account with this email address already exists. Please sign in instead.';
  }
  
  if (errorMessage.includes('invalid email')) {
    return 'Please enter a valid email address.';
  }
  
  if (errorMessage.includes('weak password')) {
    return 'Password is too weak. Please choose a stronger password.';
  }
  
  // Return original message if no mapping found
  return error.message || 'An unexpected error occurred. Please try again.';
};