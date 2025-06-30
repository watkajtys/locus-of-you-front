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

    try {
      setSubscriptionStatus(prev => ({ ...prev, isLoading: true, error: null }));
      
      const status = await checkSubscriptionStatus();
      
      setSubscriptionStatus({
        hasSubscription: status.hasSubscription || false,
        isLoading: false,
        error: null,
        activeEntitlements: status.activeEntitlements || [],
        currentProduct: status.currentProduct || null,
        isTrial: status.isTrial || false,
        subscriptionEndDate: status.subscriptionEndDate || null
      });
    } catch (error) {
      console.error('Error checking subscription status:', error);
      setSubscriptionStatus(prev => ({
        ...prev,
        isLoading: false,
        error: error.message
      }));
    }
  };

  const handleRestorePurchases = async () => {
    try {
      setSubscriptionStatus(prev => ({ ...prev, isLoading: true }));
      
      const result = await restorePurchases();
      
      if (result.success) {
        await refreshSubscriptionStatus();
        return { success: true };
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('Error restoring purchases:', error);
      setSubscriptionStatus(prev => ({
        ...prev,
        isLoading: false,
        error: error.message
      }));
      return { success: false, error: error.message };
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
          console.log('Subscription status changed:', payload);
          refreshSubscriptionStatus();
        }
      )
      .subscribe();

    // Initial load
    refreshSubscriptionStatus();

    return () => {
      subscription.unsubscribe();
    };
  }, [user?.id]);

  return {
    ...subscriptionStatus,
    refreshSubscriptionStatus,
    restorePurchases: handleRestorePurchases
  };
};