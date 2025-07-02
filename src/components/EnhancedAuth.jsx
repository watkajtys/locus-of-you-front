import React, { useState } from 'react';
import { useAuth } from '../hooks/authHooks';
import { Mail, Lock, User, AlertCircle, CheckCircle, Eye, EyeOff, KeyRound } from 'lucide-react';
import Card from './Card';
import Button from './Button';
import boltBadge from '../assets/bolt-badge.png';

const EnhancedAuth = () => {
  const { signUp, signIn, resetPassword, loading, authError } = useAuth();
  
  const [mode, setMode] = useState('signin'); // signin, signup, reset
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    firstName: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });

  // Clear message after 5 seconds
  React.useEffect(() => {
    if (message.text) {
      const timer = setTimeout(() => setMessage({ text: '', type: '' }), 5000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  // Clear auth error and local message when switching modes
  React.useEffect(() => {
    setMessage({ text: '', type: '' });
  }, [mode]);

  const showMessage = (text, type) => {
    setMessage({ text, type });
  };

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const validateForm = () => {
    const { email, password, confirmPassword, firstName } = formData;

    if (!email.trim()) {
      showMessage('Please enter your email address', 'error');
      return false;
    }

    if (!email.includes('@') || !email.includes('.')) {
      showMessage('Please enter a valid email address', 'error');
      return false;
    }

    if (mode === 'reset') {
      return true; // Only email required for password reset
    }

    if (!password.trim()) {
      showMessage('Please enter your password', 'error');
      return false;
    }

    if (mode === 'signup') {
      if (!firstName.trim()) {
        showMessage('Please enter your first name', 'error');
        return false;
      }

      if (password !== confirmPassword) {
        showMessage('Passwords do not match', 'error');
        return false;
      }
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    const { email, password, firstName } = formData;

    try {
      let result;

      switch (mode) {
        case 'signup':
          result = await signUp(email, password, { full_name: firstName });
          if (result.data && !result.error) {
            showMessage('Account created! Please check your email for verification.', 'success');
            // Switch to signin mode after successful signup
            setTimeout(() => setMode('signin'), 2000);
          }
          break;

        case 'signin':
          result = await signIn(email, password);
          if (result.data && !result.error) {
            showMessage('Welcome back! Signing you in...', 'success');
          }
          break;

        case 'reset':
          result = await resetPassword(email);
          if (result.data && !result.error) {
            showMessage('Password reset email sent! Check your inbox.', 'success');
            setTimeout(() => setMode('signin'), 2000);
          }
          break;

        default:
          break;
      }
    } catch (error) {
      console.error('Auth error:', error);
    }
  };

  return (
    <div 
      className="min-h-screen flex items-center justify-center p-6 relative" 
      style={{ backgroundColor: 'var(--color-background)' }}
    >
      {/* Bolt Badge */}
      <div className="absolute top-4 right-4 z-50">
        <a href="https://bolt.new" target="_blank" rel="noopener noreferrer">
          <img src={boltBadge} alt="Bolt Badge" className="w-10 h-10" />
        </a>
      </div>
      <Card className="w-full max-w-md p-8 space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="flex justify-center">
            <div 
              className="w-12 h-12 rounded-full flex items-center justify-center"
              style={{ backgroundColor: 'var(--color-accent)' }}
            >
              {mode === 'reset' ? (
                <KeyRound className="w-6 h-6 text-white" />
              ) : (
                <User className="w-6 h-6 text-white" />
              )}
            </div>
          </div>
          <h1 
            className="text-2xl font-bold"
            style={{ color: 'var(--color-text)' }}
          >
            {mode === 'signup' && 'Create Account'}
            {mode === 'signin' && 'Welcome Back'}
            {mode === 'reset' && 'Reset Password'}
          </h1>
          <p 
            className="text-sm"
            style={{ color: 'var(--color-muted)' }}
          >
            {mode === 'signup' && 'Sign up for your coaching account'}
            {mode === 'signin' && 'Sign in to your account'}
            {mode === 'reset' && 'Enter your email to reset your password'}
          </p>
        </div>

        {/* Error/Success Message */}
        {(message.text || authError) && (
          <div 
            className={`p-3 rounded-lg flex items-center space-x-2 ${
              (message.type === 'error' || authError) 
                ? 'bg-red-50 border border-red-200' 
                : 'bg-green-50 border border-green-200'
            }`}
          >
            {(message.type === 'error' || authError) ? (
              <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
            ) : (
              <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
            )}
            <span 
              className={`text-sm ${
                (message.type === 'error' || authError) ? 'text-red-700' : 'text-green-700'
              }`}
            >
              {authError || message.text}
            </span>
          </div>
        )}

        {/* Form */}
        <form className="space-y-4" onSubmit={handleSubmit}>
          {/* First Name (Signup only) */}
          {mode === 'signup' && (
            <div className="space-y-2">
              <label 
                htmlFor="firstName"
                className="block text-sm font-medium"
                style={{ color: 'var(--color-text)' }}
              >
                First Name
              </label>
              <div className="relative">
                <User 
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4"
                  style={{ color: 'var(--color-muted)' }}
                />
                <input
                  id="firstName"
                  name="firstName"
                  type="text"
                  value={formData.firstName}
                  onChange={handleInputChange}
                  disabled={loading}
                  className="w-full pl-10 pr-4 py-3 border rounded-lg transition-colors duration-200 focus:outline-none focus:ring-4 focus:ring-opacity-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{
                    backgroundColor: 'var(--color-card)',
                    borderColor: 'var(--color-border)',
                    color: 'var(--color-text)',
                  }}
                  placeholder="Enter your first name"
                  autoComplete="given-name"
                />
              </div>
            </div>
          )}

          {/* Email */}
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
                name="email"
                type="email"
                value={formData.email}
                onChange={handleInputChange}
                disabled={loading}
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

          {/* Password (Not for reset) */}
          {mode !== 'reset' && (
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
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={handleInputChange}
                  disabled={loading}
                  className="w-full pl-10 pr-12 py-3 border rounded-lg transition-colors duration-200 focus:outline-none focus:ring-4 focus:ring-opacity-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{
                    backgroundColor: 'var(--color-card)',
                    borderColor: 'var(--color-border)',
                    color: 'var(--color-text)',
                  }}
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2"
                  style={{ color: 'var(--color-muted)' }}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              
              {/* Simplified Password Requirements */}
              <p 
                className="text-xs"
                style={{ color: 'var(--color-muted)' }}
              >
                Password must be at least 12 characters long
              </p>
            </div>
          )}

          {/* Confirm Password (Signup only) */}
          {mode === 'signup' && (
            <div className="space-y-2">
              <label 
                htmlFor="confirmPassword"
                className="block text-sm font-medium"
                style={{ color: 'var(--color-text)' }}
              >
                Confirm Password
              </label>
              <div className="relative">
                <Lock 
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4"
                  style={{ color: 'var(--color-muted)' }}
                />
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  disabled={loading}
                  className="w-full pl-10 pr-12 py-3 border rounded-lg transition-colors duration-200 focus:outline-none focus:ring-4 focus:ring-opacity-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{
                    backgroundColor: 'var(--color-card)',
                    borderColor: 'var(--color-border)',
                    color: 'var(--color-text)',
                  }}
                  placeholder="Confirm your password"
                  autoComplete="new-password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2"
                  style={{ color: 'var(--color-muted)' }}
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
          )}

          {/* Submit Button */}
          <div className="pt-2">
            <Button
              variant="accent"
              size="large"
              type="submit"
              disabled={loading}
              className="w-full"
            >
              {loading ? 'Loading...' : (
                mode === 'signup' ? 'Create Account' :
                mode === 'signin' ? 'Sign In' :
                'Send Reset Email'
              )}
            </Button>
          </div>
        </form>

        

        {/* Footer */}
        <div className="text-center pt-4">
          <p 
            className="text-xs"
            style={{ color: 'var(--color-muted)' }}
          >
            By {mode === 'signup' ? 'creating an account' : 'signing in'}, you agree to our{' '}
            <a href="/terms" className="underline">Terms of Service</a> and{' '}
            <a href="/privacy" className="underline">Privacy Policy</a>
          </p>
        </div>
      </Card>
    </div>
  );
};

export default EnhancedAuth;