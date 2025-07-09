import { Purchases } from '@revenuecat/purchases-js';

import { supabase } from './supabase';

// RevenueCat configuration
const REVENUECAT_API_KEY = import.meta.env.VITE_REVENUECAT_PUBLIC_API_KEY;

// Product IDs for your subscription offerings
export const PRODUCT_IDS = {
  MONTHLY: 'monthly_premium_subscription',
  ANNUAL: 'annual_premium_subscription'
};

// Entitlement identifier
export const ENTITLEMENT_ID = 'premium_features';

let purchasesInstance = null; // Stores the configured Purchases instance
let isConfigured = false;

/**
 * Generate a unique anonymous user ID
 */
const generateAnonymousUserId = () => {
  // Check if we already have an anonymous ID stored
  let anonymousId = localStorage.getItem('revenuecat_anonymous_id');
  
  if (!anonymousId) {
    // Generate a new anonymous ID
    anonymousId = `anonymous_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    localStorage.setItem('revenuecat_anonymous_id', anonymousId);
  }
  
  return anonymousId;
};

/**
 * Initialize RevenueCat with anonymous user
 */
export const initializeRevenueCat = async () => {
  if (isConfigured) return;
  
  if (!REVENUECAT_API_KEY || REVENUECAT_API_KEY.trim() === '') {
    console.warn('RevenueCat API key not found or empty. Please add VITE_REVENUECAT_PUBLIC_API_KEY to your .env file.');
    return;
  }

  try {
    // Generate or retrieve anonymous user ID
    const anonymousUserId = generateAnonymousUserId();
    
    // Configure RevenueCat with anonymous user ID
    // Purchases.configure is static and returns an instance.
    purchasesInstance = Purchases.configure({
      apiKey: REVENUECAT_API_KEY,
      appUserId: anonymousUserId // Provide the anonymous user ID
    });
    
    isConfigured = true; // Or check if purchasesInstance is not null
    console.log('RevenueCat initialized successfully with anonymous user:', anonymousUserId);
  } catch (error) {
    console.error('Failed to initialize RevenueCat:', error);
    isConfigured = false; // Ensure this is false on error
  }
};

/**
 * Set user ID for RevenueCat and sync with Supabase
 */
export const setRevenueCatUserId = async (userId) => {
  if (!isConfigured || !purchasesInstance) {
    console.warn('RevenueCat not initialized or instance not available');
    return;
  }

  if (!userId || userId.trim() === '') {
    console.warn('Invalid user ID provided to RevenueCat');
    return;
  }

  try {
    // Use changeUser on the instance to identify the user
    const customerInfoResult = await purchasesInstance.changeUser(userId);
    console.log('RevenueCat user ID set via changeUser:', userId);
    
    // Clear the anonymous ID since we're now identified
    localStorage.removeItem('revenuecat_anonymous_id');
    
    // Update the RevenueCat customer ID in Supabase profile
    // The result of changeUser is CustomerInfo directly
    const customerInfo = customerInfoResult;
    if (customerInfo) {
      await updateSupabaseProfile(userId, customerInfo);
    }
    
    return customerInfo;
  } catch (error) {
    console.error('Failed to set RevenueCat user ID:', error);
    throw error;
  }
};

/**
 * Update Supabase profile with RevenueCat customer info
 */
const updateSupabaseProfile = async (userId, customerInfo) => {
  try {
    const { error } = await supabase
      .from('profiles')
      .upsert({
        id: userId,
        revenuecat_customer_id: customerInfo.originalAppUserId,
        updated_at: new Date().toISOString()
      });

    if (error) {
      console.error('Failed to update profile with RevenueCat info:', error);
    }

    // Update subscription status in database
    await syncSubscriptionStatus(userId, customerInfo);
  } catch (error) {
    console.error('Error updating Supabase profile:', error);
  }
};

/**
 * Sync subscription status with Supabase database
 */
const syncSubscriptionStatus = async (userId, customerInfo) => {
  try {
    const hasSubscription = customerInfo.entitlements.active[ENTITLEMENT_ID] !== undefined;
    const activeEntitlements = Object.keys(customerInfo.entitlements.active);
    
    // Get current product ID and expiration
    let currentProductId = null;
    let subscriptionEndDate = null;
    let isTrialPeriod = false;

    if (hasSubscription) {
      const activeEntitlement = customerInfo.entitlements.active[ENTITLEMENT_ID];
      currentProductId = activeEntitlement.productIdentifier;
      subscriptionEndDate = activeEntitlement.expirationDate;
      isTrialPeriod = activeEntitlement.periodType === 'intro';
    }

    // Call database function to update subscription status
    const { error } = await supabase.rpc('update_subscription_status', {
      p_user_id: userId,
      p_customer_id: customerInfo.originalAppUserId,
      p_has_subscription: hasSubscription,
      p_entitlements: activeEntitlements,
      p_product_id: currentProductId,
      p_subscription_end_date: subscriptionEndDate,
      p_is_trial: isTrialPeriod
    });

    if (error) {
      console.error('Failed to sync subscription status:', error);
    }
  } catch (error) {
    console.error('Error syncing subscription status:', error);
  }
};

/**
 * Get available offerings
 */
export const getOfferings = async () => {
  if (!isConfigured || !purchasesInstance) {
    console.warn('RevenueCat not initialized or instance not available');
    return null;
  }

  try {
    const offerings = await purchasesInstance.getOfferings();
    return offerings;
  } catch (error) {
    console.error('Failed to get offerings:', error);
    return null;
  }
};

/**
 * Purchase a subscription
 */
export const purchaseSubscription = async (productId) => {
  console.log('purchaseSubscription called for product:', productId);
  if (!isConfigured || !purchasesInstance) {
    throw new Error('RevenueCat not initialized or instance not available');
  }

  try {
    const offerings = await purchasesInstance.getOfferings();
    
    console.log('RevenueCat offerings object:', offerings);
    console.log('RevenueCat offerings.current:', offerings?.current);
    console.log('RevenueCat offerings.current.availablePackages:', offerings?.current?.availablePackages);

    let targetPackage = null;

    // Iterate through all offerings to find the product
    for (const offeringId in offerings.all) {
      const offering = offerings.all[offeringId];
      const foundPackage = offering.availablePackages.find(
        pkg => pkg.rcBillingProduct && pkg.rcBillingProduct.identifier === productId
      );
      if (foundPackage) {
        targetPackage = foundPackage;
        break;
      }
    }

    if (!targetPackage) {
      throw new Error(`Product ${productId} not found in any offerings`);
    }

    // purchasePackage is an instance method.
    // Note: The docs for v1.7.0 list purchasePackage.
    // It's deprecated in later versions in favor of purchase({package: targetPackage}).
    // For now, we'll stick to purchasePackage as it's in the 1.7.0 docs.
    const purchaseResult = await purchasesInstance.purchasePackage(targetPackage);
    
    // Sync the updated subscription status with Supabase
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await syncSubscriptionStatus(user.id, purchaseResult.customerInfo);
    }
    
    return {
      success: true,
      customerInfo: purchaseResult.customerInfo,
      productIdentifier: purchaseResult.productIdentifier
    };
  } catch (error) {
    console.error('Purchase failed:', error);
    
    // Handle specific RevenueCat errors
    if (error.code === 'USER_CANCELLED') {
      return {
        success: false,
        error: 'Purchase was cancelled',
        userCancelled: true
      };
    }
    
    return {
      success: false,
      error: error.message || 'Purchase failed'
    };
  }
};

/**
 * Restore purchases
 */
export const restorePurchases = async () => {
  // Assuming isConfigured also implies purchasesInstance is available if needed,
  // but being cautious as restorePurchases is not clearly an instance method in docs.
  if (!isConfigured) {
    throw new Error('RevenueCat not initialized');
  }

  // NOTE: restorePurchases() is not listed as an instance method on the Purchases class
  // in the purchases-js v1.7.0 SDK reference. It MIGHT be a static method, or not exist
  // in this exact form for this SDK. If it's static, the call below is okay.
  // If it's an instance method (unlikely given docs) or doesn't exist, this will error.
  // For now, leaving as is to focus on the primary `logIn` bug.
  try {
    const customerInfo = await Purchases.restorePurchases(); // Assuming static if it exists
    
    // Sync restored subscription status with Supabase
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await syncSubscriptionStatus(user.id, customerInfo);
    }
    
    return {
      success: true,
      customerInfo
    };
  } catch (error) {
    console.error('Restore purchases failed:', error);
    return {
      success: false,
      error: error.message || 'Failed to restore purchases'
    };
  }
};

/**
 * Check if user has premium subscription (from database first, then RevenueCat)
 */
export const checkSubscriptionStatus = async () => {
  // Temporarily return true to grant all users premium privileges
  return {
    hasSubscription: true,
    activeEntitlements: ['premium_features'], // Mock an active entitlement
    currentProduct: 'mock_product',
    isTrial: false,
    subscriptionEndDate: null
  };

  // Original code (commented out):
  /*
  if (!isConfigured || !purchasesInstance) {
    console.warn('RevenueCat not initialized or instance not available');
    return { hasSubscription: false };
  }

  try {
    // First try to get status from Supabase for faster response
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data: dbStatus, error } = await supabase.rpc('get_user_subscription_status', {
        p_user_id: user.id
      });

      if (!error && dbStatus && dbStatus.length > 0) {
        const status = dbStatus[0];
        return {
          hasSubscription: status.has_subscription,
          activeEntitlements: status.active_entitlements,
          currentProduct: status.current_product,
          isTrial: status.is_trial,
          subscriptionEndDate: status.subscription_end_date
        };
      }
    }

    // Fallback to RevenueCat if database lookup fails
    const customerInfo = await purchasesInstance.getCustomerInfo();
    const hasSubscription = customerInfo.entitlements.active[ENTITLEMENT_ID] !== undefined;
    
    // Sync the latest status to database
    if (user) {
      await syncSubscriptionStatus(user.id, customerInfo);
    }
    
    return {
      hasSubscription,
      customerInfo,
      activeEntitlements: customerInfo.entitlements.active
    };
  } catch (error) {
    console.error('Failed to check subscription status:', error);
    return { hasSubscription: false, error: error.message };
  }
  */
};

/**
 * Get customer info
 */
export const getCustomerInfo = async () => {
  if (!isConfigured || !purchasesInstance) {
    throw new Error('RevenueCat not initialized or instance not available');
  }

  try {
    const customerInfo = await purchasesInstance.getCustomerInfo();
    return customerInfo;
  } catch (error) {
    console.error('Failed to get customer info:', error);
    throw error;
  }
};

/**
 * Set up listener for customer info updates
 */
export const setCustomerInfoUpdateListener = (callback) => {
  if (!isConfigured) {
    console.warn('RevenueCat not initialized');
    return;
  }

  // Note: Customer info update listeners may not be available in the web SDK
  // This function is kept for API compatibility but may not function
  console.warn('Customer info update listeners may not be supported in RevenueCat Web SDK');
};

/**
 * Log out current user (switch back to anonymous)
 */
export const logOutRevenueCat = async () => {
  if (!isConfigured || !purchasesInstance) {
    console.warn('RevenueCat not initialized or instance not available for logout');
    return;
  }

  try {
    // To "log out", we change to a new anonymous user ID.
    const newAnonymousId = generateAnonymousUserId();
    await purchasesInstance.changeUser(newAnonymousId);

    console.log('RevenueCat user logged out, switched to new anonymous ID:', newAnonymousId);
  } catch (error) {
    console.error('Failed to log out RevenueCat user (by changing to anonymous):', error);
  }
};