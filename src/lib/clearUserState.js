/**
 * Comprehensive user state clearing utility
 * This will reset the application to a clean, unauthenticated state
 */

import { supabase } from './supabase';
import { logOutRevenueCat } from './revenuecat';

/**
 * Clear all user-related data and reset application state
 */
export const clearAllUserState = async () => {
  console.log('🧹 Starting comprehensive user state cleanup...');
  
  try {
    // Step 1: Sign out from Supabase
    console.log('📤 Signing out from Supabase...');
    await supabase.auth.signOut();
    
    // Step 2: Log out from RevenueCat (switch to anonymous)
    console.log('💳 Logging out from RevenueCat...');
    await logOutRevenueCat();
    
    // Step 3: Clear all local storage
    console.log('🗑️ Clearing local storage...');
    clearLocalStorage();
    
    // Step 4: Clear session storage
    console.log('🗑️ Clearing session storage...');
    clearSessionStorage();
    
    // Step 5: Clear any cached data
    console.log('🧹 Clearing cached data...');
    clearCachedData();
    
    // Step 6: Reset URL if needed
    console.log('🔄 Resetting URL...');
    if (window.location.pathname !== '/') {
      window.history.replaceState(null, '', '/');
    }
    
    console.log('✅ User state cleared successfully');
    
    // Step 7: Reload the page to ensure complete reset
    console.log('🔄 Reloading page for complete reset...');
    window.location.reload();
    
  } catch (error) {
    console.error('❌ Error clearing user state:', error);
    
    // Force clear even if some steps failed
    clearLocalStorage();
    clearSessionStorage();
    
    // Still reload to ensure reset
    window.location.reload();
  }
};

/**
 * Clear all localStorage items
 */
const clearLocalStorage = () => {
  try {
    // Clear RevenueCat related items
    localStorage.removeItem('revenuecat_anonymous_id');
    
    // Clear onboarding related items
    localStorage.removeItem('onboarding-answers');
    localStorage.removeItem('onboarding-progress');
    localStorage.removeItem('onboarding-session');
    
    // Clear theme and preferences
    localStorage.removeItem('app-theme');
    localStorage.removeItem('user-preferences');
    
    // Clear any auth-related items
    localStorage.removeItem('supabase.auth.token');
    localStorage.removeItem('auth-user');
    localStorage.removeItem('user-session');
    
    // Clear rate limiting data
    const keys = Object.keys(localStorage);
    keys.forEach(key => {
      if (key.startsWith('auth_attempts_') || 
          key.startsWith('rate_limit_') ||
          key.startsWith('user_') ||
          key.startsWith('coaching_') ||
          key.startsWith('subscription_')) {
        localStorage.removeItem(key);
      }
    });
    
    console.log('📦 Local storage cleared');
  } catch (error) {
    console.error('Error clearing localStorage:', error);
  }
};

/**
 * Clear all sessionStorage items
 */
const clearSessionStorage = () => {
  try {
    sessionStorage.clear();
    console.log('📦 Session storage cleared');
  } catch (error) {
    console.error('Error clearing sessionStorage:', error);
  }
};

/**
 * Clear any cached application data
 */
const clearCachedData = () => {
  try {
    // Clear any IndexedDB data if present
    if ('indexedDB' in window) {
      // Note: This is a basic clear - in production you might want to be more specific
      indexedDB.databases?.().then(databases => {
        databases.forEach(db => {
          if (db.name?.includes('supabase') || db.name?.includes('revenuecat')) {
            indexedDB.deleteDatabase(db.name);
          }
        });
      }).catch(console.warn);
    }
    
    // Clear any service worker caches
    if ('caches' in window) {
      caches.keys().then(cacheNames => {
        cacheNames.forEach(cacheName => {
          if (cacheName.includes('user') || cacheName.includes('auth')) {
            caches.delete(cacheName);
          }
        });
      }).catch(console.warn);
    }
    
    console.log('💾 Cached data cleared');
  } catch (error) {
    console.error('Error clearing cached data:', error);
  }
};

/**
 * Emergency reset - use when normal clearance fails
 */
export const emergencyReset = () => {
  console.log('🚨 Performing emergency reset...');
  
  try {
    // Force clear everything
    localStorage.clear();
    sessionStorage.clear();
    
    // Clear cookies (basic approach)
    document.cookie.split(";").forEach(c => {
      const eqPos = c.indexOf("=");
      const name = eqPos > -1 ? c.substr(0, eqPos) : c;
      document.cookie = name + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/";
    });
    
    console.log('🚨 Emergency reset complete');
  } catch (error) {
    console.error('Emergency reset error:', error);
  }
  
  // Force reload
  window.location.reload();
};

/**
 * Quick logout without full state clear
 */
export const quickLogout = async () => {
  try {
    console.log('🚪 Performing quick logout...');
    
    // Sign out from Supabase
    await supabase.auth.signOut();
    
    // Log out from RevenueCat
    await logOutRevenueCat();
    
    // Clear only auth-related localStorage
    localStorage.removeItem('revenuecat_anonymous_id');
    localStorage.removeItem('supabase.auth.token');
    
    console.log('✅ Quick logout complete');
  } catch (error) {
    console.error('Quick logout error:', error);
    throw error;
  }
};