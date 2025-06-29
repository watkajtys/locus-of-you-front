import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { Mail, Lock, User, AlertCircle, CheckCircle } from 'lucide-react';
import Card from './Card';
import Button from './Button';

const Auth = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUpLoading, setIsSignUpLoading] = useState(false);
  const [isSignInLoading, setIsSignInLoading] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });

  const resetMessage = () => {
    setMessage({ text: '', type: '' });
  };

  const showMessage = (text, type) => {
    setMessage({ text, type });
    // Clear message after 5 seconds
    setTimeout(resetMessage, 5000);
  };

  const validateForm = () => {
    if (!email.trim()) {
      showMessage('Please enter your email address', 'error');
      return false;
    }
    
    if (!email.includes('@')) {
      showMessage('Please enter a valid email address', 'error');
      return false;
    }
    
    if (!password.trim()) {
      showMessage('Please enter your password', 'error');
      return false;
    }
    
    if (password.length < 6) {
      showMessage('Password must be at least 6 characters long', 'error');
      return false;
    }
    
    return true;
  };

  const handleSignUp = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setIsSignUpLoading(true);
    resetMessage();
    
    try {
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password: password,
      });

      if (error) {
        showMessage(error.message, 'error');
      } else if (data.user) {
        showMessage('Sign up successful! Please check your email for verification.', 'success');
        // Clear form on success
        setEmail('');
        setPassword('');
      }
    } catch (error) {
      showMessage('An unexpected error occurred. Please try again.', 'error');
      console.error('Sign up error:', error);
    } finally {
      setIsSignUpLoading(false);
    }
  };

  const handleSignIn = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setIsSignInLoading(true);
    resetMessage();
    
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: password,
      });

      if (error) {
        showMessage(error.message, 'error');
      } else if (data.user) {
        showMessage('Welcome back! You have been signed in successfully.', 'success');
        // Clear form on success
        setEmail('');
        setPassword('');
      }
    } catch (error) {
      showMessage('An unexpected error occurred. Please try again.', 'error');
      console.error('Sign in error:', error);
    } finally {
      setIsSignInLoading(false);
    }
  };

  const isLoading = isSignUpLoading || isSignInLoading;

  return (
    <div className="min-h-screen flex items-center justify-center p-6" style={{ backgroundColor: 'var(--color-background)' }}>
      <Card className="w-full max-w-md p-8 space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="flex justify-center">
            <div 
              className="w-12 h-12 rounded-full flex items-center justify-center"
              style={{ backgroundColor: 'var(--color-accent)' }}
            >
              <User className="w-6 h-6 text-white" />
            </div>
          </div>
          <h1 
            className="text-2xl font-bold"
            style={{ color: 'var(--color-text)' }}
          >
            Welcome
          </h1>
          <p 
            className="text-sm"
            style={{ color: 'var(--color-muted)' }}
          >
            Sign in to your account or create a new one
          </p>
        </div>

        {/* Message Display */}
        {message.text && (
          <div 
            className={`p-3 rounded-lg flex items-center space-x-2 ${
              message.type === 'error' 
                ? 'bg-red-50 border border-red-200' 
                : 'bg-green-50 border border-green-200'
            }`}
          >
            {message.type === 'error' ? (
              <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
            ) : (
              <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
            )}
            <span 
              className={`text-sm ${
                message.type === 'error' ? 'text-red-700' : 'text-green-700'
              }`}
            >
              {message.text}
            </span>
          </div>
        )}

        {/* Form */}
        <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
          {/* Email Input */}
          <div className="space-y-2">
            <label 
              htmlFor="email"
              className="block text-sm font-medium"
              style={{ color: 'var(--color-text)' }}
            >
              Email Address
            </label>
            <div className="relative">
              <Mail 
                className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4"
                style={{ color: 'var(--color-muted)' }}
              />
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading}
                className="w-full pl-10 pr-4 py-3 border rounded-lg transition-colors duration-200 focus:outline-none focus:ring-4 focus:ring-opacity-50 disabled:opacity-50 disabled:cursor-not-allowed"
                style={{
                  backgroundColor: 'var(--color-card)',
                  borderColor: 'var(--color-border)',
                  color: 'var(--color-text)',
                }}
                placeholder="Enter your email"
                autoComplete="email"
                required
              />
            </div>
          </div>

          {/* Password Input */}
          <div className="space-y-2">
            <label 
              htmlFor="password"
              className="block text-sm font-medium"
              style={{ color: 'var(--color-text)' }}
            >
              Password
            </label>
            <div className="relative">
              <Lock 
                className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4"
                style={{ color: 'var(--color-muted)' }}
              />
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
                className="w-full pl-10 pr-4 py-3 border rounded-lg transition-colors duration-200 focus:outline-none focus:ring-4 focus:ring-opacity-50 disabled:opacity-50 disabled:cursor-not-allowed"
                style={{
                  backgroundColor: 'var(--color-card)',
                  borderColor: 'var(--color-border)',
                  color: 'var(--color-text)',
                }}
                placeholder="Enter your password"
                autoComplete="current-password"
                required
                minLength={6}
              />
            </div>
            <p 
              className="text-xs"
              style={{ color: 'var(--color-muted)' }}
            >
              Password must be at least 6 characters long
            </p>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3 pt-2">
            <Button
              variant="accent"
              size="large"
              onClick={handleSignIn}
              disabled={isLoading}
              className="w-full"
            >
              {isSignInLoading ? 'Loading...' : 'Sign In'}
            </Button>
            
            <Button
              variant="secondary"
              size="large"
              onClick={handleSignUp}
              disabled={isLoading}
              className="w-full"
            >
              {isSignUpLoading ? 'Loading...' : 'Sign Up'}
            </Button>
          </div>
        </form>

        {/* Footer */}
        <div className="text-center pt-4">
          <p 
            className="text-xs"
            style={{ color: 'var(--color-muted)' }}
          >
            By signing up, you agree to our terms of service and privacy policy
          </p>
        </div>
      </Card>
    </div>
  );
};

export default Auth;