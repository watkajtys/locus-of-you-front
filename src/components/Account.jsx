import { LogOut, User, Mail, Crown, Settings } from 'lucide-react';
import React, { useState, useEffect, useCallback } from 'react';

import { logOutRevenueCat } from '../lib/revenuecat';
import { supabase } from '../lib/supabase';
import useStore from '../store/store'; // Import Zustand store

import Avatar from './Avatar';
import Button from './Button';
import Card from './Card';

const Account = () => {
  const session = useStore((state) => state.session);
  const userProfile = useStore((state) => state.userProfile);
  const hasSubscription = useStore((state) => state.hasSubscription);
  const setUserProfile = useStore((state) => state.setUserProfile);
  const clearUserState = useStore((state) => state.clearUserState);

  const [loading, setLoading] = useState(false); // For sign-out loading state
  // Profile state is now primarily from the store, local state can be removed or synced.
  // For simplicity, we'll rely on the store's userProfile.

  const loadProfile = useCallback(async () => {
    if (!session?.user) return;

    // Attempt to load from store first if already fetched
    if (userProfile && userProfile.id === session.user.id) {
      return; // Profile already loaded and matches current user
    }

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 means no rows found, which is not an error for a new profile
        console.error('Error loading profile:', error);
        return;
      }

      if (data) {
        setUserProfile({
          id: session.user.id, // ensure id is part of the profile object in store
          email: session.user.email, // email from session is likely more reliable initially
          ...data, // spread fetched data, which might include full_name, username, avatar_url
        });
      } else {
        // If no profile data found, set a default structure in the store
        setUserProfile({
          id: session.user.id,
          email: session.user.email,
          full_name: '',
          username: '',
          avatar_url: '',
        });
      }
    } catch (error) {
      console.error('Error loading profile:', error);
      // Optionally set userProfile to a default error state or null
      setUserProfile(null);
    }
  }, [session, setUserProfile, userProfile]);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]); // session dependency is implicitly handled by loadProfile's check

  const handleSignOut = async () => {
    setLoading(true); // Local loading state for sign-out button
    try {
      // Log out from RevenueCat first
      await logOutRevenueCat();
      // Then sign out from Supabase
      await supabase.auth.signOut();
      // Zustand store reset (session, userProfile, etc.) will be handled by onAuthStateChange in App.jsx
      // and potentially an explicit call to clearUserState() if needed,
      // but onAuthStateChange should set session to null, triggering necessary downstream effects.
      // Explicitly call clearUserState from store for good measure on manual sign out.
      clearUserState();
    } catch (error) {
      console.error('Error signing out:', error);
    } finally {
      setLoading(false); // Reset local loading state for sign-out button
    }
  };

  const handleAvatarUpdate = (newAvatarUrl) => {
    // Update the userProfile in the Zustand store
    if (userProfile) {
      setUserProfile({ ...userProfile, avatar_url: newAvatarUrl });
    }
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
                url={userProfile?.avatar_url}
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
                  htmlFor="email-address"
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
                    id="email-address"
                    type="email"
                    value={userProfile?.email || session?.user?.email || ''}
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
                  htmlFor="user-id"
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
                    id="user-id"
                    type="text"
                    value={userProfile?.id || session?.user?.id || ''}
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