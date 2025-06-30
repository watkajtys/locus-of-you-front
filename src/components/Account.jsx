import React, { useState, useEffect } from 'react';
import { LogOut, User, Mail, Crown, Settings } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { logOutRevenueCat } from '../lib/revenuecat';
import Card from './Card';
import Button from './Button';
import Avatar from './Avatar';

const Account = ({ session, hasSubscription = false }) => {
  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState({
    email: session?.user?.email || '',
    full_name: '',
    username: '',
    avatar_url: ''
  });

  useEffect(() => {
    if (session) {
      loadProfile();
    }
  }, [session]);

  const loadProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error loading profile:', error);
        return;
      }

      if (data) {
        setProfile({
          email: session.user.email,
          full_name: data.full_name || '',
          username: data.username || '',
          avatar_url: data.avatar_url || ''
        });
      }
    } catch (error) {
      console.error('Error loading profile:', error);
    }
  };

  const handleSignOut = async () => {
    setLoading(true);
    try {
      // Log out from RevenueCat first
      await logOutRevenueCat();
      // Then sign out from Supabase
      await supabase.auth.signOut();
    } catch (error) {
      console.error('Error signing out:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAvatarUpdate = (newAvatarUrl) => {
    setProfile(prev => ({ ...prev, avatar_url: newAvatarUrl }));
  };

  return (
    <div 
      className="min-h-screen font-inter px-4 py-6"
      style={{ backgroundColor: 'var(--color-background)' }}
    >
      <div className="max-w-md mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 
            className="text-2xl font-bold"
            style={{ color: 'var(--color-text)' }}
          >
            Account
          </h1>
          <p 
            className="text-sm"
            style={{ color: 'var(--color-muted)' }}
          >
            Manage your profile and settings
          </p>
        </div>

        {/* Profile Card */}
        <Card className="p-6">
          <div className="space-y-6">
            {/* Avatar Section */}
            <div className="text-center">
              <Avatar 
                session={session}
                size={80}
                url={profile.avatar_url}
                onUpload={handleAvatarUpdate}
              />
            </div>

            {/* Subscription Status */}
            {hasSubscription && (
              <div 
                className="flex items-center justify-center space-x-2 p-3 rounded-lg"
                style={{ backgroundColor: 'var(--color-primary)' }}
              >
                <Crown 
                  className="w-5 h-5"
                  style={{ color: 'var(--color-accent)' }}
                />
                <span 
                  className="font-medium"
                  style={{ color: 'var(--color-accent)' }}
                >
                  Premium Member
                </span>
              </div>
            )}

            {/* Profile Information */}
            <div className="space-y-4">
              {/* Email */}
              <div className="space-y-2">
                <label 
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
                    type="email"
                    value={profile.email}
                    disabled
                    className="w-full pl-10 pr-4 py-3 border rounded-lg bg-opacity-50 cursor-not-allowed"
                    style={{
                      backgroundColor: 'var(--color-primary)',
                      borderColor: 'var(--color-border)',
                      color: 'var(--color-muted)',
                    }}
                  />
                </div>
              </div>

              {/* User ID (for reference) */}
              <div className="space-y-2">
                <label 
                  className="block text-sm font-medium"
                  style={{ color: 'var(--color-text)' }}
                >
                  User ID
                </label>
                <div className="relative">
                  <User 
                    className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4"
                    style={{ color: 'var(--color-muted)' }}
                  />
                  <input
                    type="text"
                    value={session?.user?.id || ''}
                    disabled
                    className="w-full pl-10 pr-4 py-3 border rounded-lg bg-opacity-50 cursor-not-allowed text-xs"
                    style={{
                      backgroundColor: 'var(--color-primary)',
                      borderColor: 'var(--color-border)',
                      color: 'var(--color-muted)',
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Account Actions */}
        <div className="space-y-4">
          {/* Settings (Placeholder) */}
          <Card className="p-4">
            <button
              className="w-full flex items-center space-x-3 p-2 rounded-lg transition-colors duration-200 hover:bg-opacity-50"
              style={{ color: 'var(--color-text)' }}
            >
              <Settings className="w-5 h-5" />
              <span className="font-medium">Settings</span>
            </button>
          </Card>

          {/* Sign Out */}
          <Button
            variant="secondary"
            size="large"
            onClick={handleSignOut}
            disabled={loading}
            className="w-full flex items-center justify-center space-x-2"
          >
            <LogOut className="w-5 h-5" />
            <span>{loading ? 'Signing out...' : 'Sign Out'}</span>
          </Button>
        </div>

        {/* Bottom Padding for Navigation */}
        <div className="h-20"></div>
      </div>
    </div>
  );
};

export default Account;