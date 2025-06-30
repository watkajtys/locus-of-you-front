import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { checkSubscriptionStatus, restorePurchases } from '../lib/revenuecat';

export const useSubscription = (user) => {
  const [subscriptionStatus, setSubscriptionStatus] = useState({
    hasSubscription: false,
    isLoading: true,
    error: null,
    activeEntitlements: [],
    currentProduct: null,
    isTrial: false,
    subscriptionEndDate: null
  });

  const refreshSubscriptionStatus = async () => {
    if (!user) {
      setSubscriptionStatus(prev => ({
        ...prev,
        hasSubscription: false,
        isLoading: false,
        activeEntitlements: [],
        currentProduct: null,
        isTrial: false,
        subscriptionEndDate: null
      }));
      return;
    }

    // Set loading state
    setSubscriptionStatus(prev => ({ ...prev, isLoading: true, error: null }));

    // checkSubscriptionStatus now catches its own errors and returns an error property.
    const status = await checkSubscriptionStatus();

    setSubscriptionStatus({
      hasSubscription: status.hasSubscription || false,
      isLoading: false,
      error: status.error || null, // Use the error from status object
      // Ensure all fields from the initial state are covered, using defaults if not in status
      activeEntitlements: status.activeEntitlements || [],
      currentProduct: status.currentProduct || null,
      isTrial: status.isTrial || false,
      subscriptionEndDate: status.subscriptionEndDate || null,
      // customerInfo can also be part of the state if needed by components
      // customerInfo: status.customerInfo || null,
    });
    // The old catch block for checkSubscriptionStatus is no longer strictly necessary here
    // if checkSubscriptionStatus itself handles errors and populates status.error.
  };

  const handleRestorePurchases = async () => {
    try {
      setSubscriptionStatus(prev => ({ ...prev, isLoading: true, error: null }));
      
      const result = await restorePurchases(); // restorePurchases returns { success, error?, customerInfo? }
      
      if (result.success) {
        // refreshSubscriptionStatus will use the latest customerInfo from restore
        await refreshSubscriptionStatus();
        return { success: true };
      } else {
        // Set error state from restorePurchases result
        setSubscriptionStatus(prev => ({
          ...prev,
          isLoading: false,
          error: result.error || 'Failed to restore purchases.'
        }));
        return { success: false, error: result.error || 'Failed to restore purchases.' };
      }
    } catch (error) { // Catch unexpected errors from restorePurchases itself
      console.error('Error restoring purchases:', error);
      setSubscriptionStatus(prev => ({
        ...prev,
        isLoading: false,
        error: error.message || 'An unexpected error occurred while restoring purchases.'
      }));
      return { success: false, error: error.message || 'An unexpected error occurred while restoring purchases.' };
    }
  };

  // Subscribe to subscription status changes in real-time
  useEffect(() => {
    if (!user) return;

    // Set up real-time subscription to subscription_status table
    const subscription = supabase
      .channel('subscription_status_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'subscription_status',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          console.log('Real-time subscription status change received:', payload);
          if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
            if (payload.new) {
              const newDbStatus = payload.new;
              // Directly update state from the pushed DB record
              // This assumes the 'subscription_status' table structure matches the hook's state fields
              setSubscriptionStatus(prev => ({
                ...prev, // Keep existing fields like customerInfo if they are separate
                isLoading: false,
                error: null, // Assume direct DB push is valid
                hasSubscription: newDbStatus.has_subscription,
                activeEntitlements: newDbStatus.active_entitlements || [],
                currentProduct: newDbStatus.current_product || null,
                isTrial: newDbStatus.is_trial || false,
                subscriptionEndDate: newDbStatus.subscription_end_date || null,
              }));
            } else {
              // If new data is not in payload for INSERT/UPDATE, a full refresh might be safer
              refreshSubscriptionStatus();
            }
          } else if (payload.eventType === 'DELETE') {
            // If the user's subscription record is deleted, refresh to reflect this
            refreshSubscriptionStatus();
          }
        }
      )
      .subscribe();

    // Initial load
    refreshSubscriptionStatus();

    // Cleanup function to unsubscribe
    return () => {
      supabase.removeChannel(subscription);
    };
  }, [user?.id]); // Keep user.id as dependency to re-subscribe if user changes

  return {
    ...subscriptionStatus,
    refreshSubscriptionStatus,
    restorePurchases: handleRestorePurchases
  };
};