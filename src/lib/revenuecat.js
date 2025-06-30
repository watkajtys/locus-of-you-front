import { Purchases } from '@revenuecat/purchases-js';

// RevenueCat configuration
const REVENUECAT_API_KEY = import.meta.env.VITE_REVENUECAT_PUBLIC_API_KEY;

// Product IDs for your subscription offerings
export const PRODUCT_IDS = {
  MONTHLY: 'monthly_premium_subscription',
  ANNUAL: 'annual_premium_subscription'
};

// Entitlement identifier
export const ENTITLEMENT_ID = 'premium_features';

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
    await Purchases.configure({
      apiKey: REVENUECAT_API_KEY,
      appUserId: anonymousUserId // Provide the anonymous user ID
    });
    
    isConfigured = true;
    console.log('RevenueCat initialized successfully with anonymous user:', anonymousUserId);
  } catch (error) {
    console.error('Failed to initialize RevenueCat:', error);
  }
};

/**
 * Set user ID for RevenueCat (identify the user)
 */
export const setRevenueCatUserId = async (userId) => {
  if (!isConfigured) {
    console.warn('RevenueCat not initialized');
    return;
  }

  if (!userId || userId.trim() === '') {
    console.warn('Invalid user ID provided to RevenueCat');
    return;
  }

  try {
    // Use identify to associate the user ID with RevenueCat
    const result = await Purchases.getSharedInstance().identify(userId);
    console.log('RevenueCat user ID set:', userId);
    
    // Clear the anonymous ID since we're now identified
    localStorage.removeItem('revenuecat_anonymous_id');
    
    return result;
  } catch (error) {
    console.error('Failed to set RevenueCat user ID:', error);
    throw error;
  }
};

/**
 * Get available offerings
 */
export const getOfferings = async () => {
  if (!isConfigured) {
    console.warn('RevenueCat not initialized');
    return null;
  }

  try {
    const offerings = await Purchases.getSharedInstance().getOfferings();
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
  if (!isConfigured) {
    throw new Error('RevenueCat not initialized');
  }

  try {
    const offerings = await Purchases.getSharedInstance().getOfferings();
    
    if (!offerings?.current) {
      throw new Error('No current offering available');
    }

    // Find the specific package by product ID
    const targetPackage = offerings.current.availablePackages.find(
      pkg => pkg.product.identifier === productId
    );

    if (!targetPackage) {
      throw new Error(`Product ${productId} not found in offerings`);
    }

    const purchaseResult = await Purchases.getSharedInstance().purchasePackage(targetPackage);
    
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
  if (!isConfigured) {
    throw new Error('RevenueCat not initialized');
  }

  try {
    const customerInfo = await Purchases.getSharedInstance().restorePurchases();
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
 * Check if user has premium subscription
 */
export const checkSubscriptionStatus = async () => {
  if (!isConfigured) {
    console.warn('RevenueCat not initialized');
    return { hasSubscription: false };
  }

  try {
    const customerInfo = await Purchases.getSharedInstance().getCustomerInfo();
    const hasSubscription = customerInfo.entitlements.active[ENTITLEMENT_ID] !== undefined;
    
    return {
      hasSubscription,
      customerInfo,
      activeEntitlements: customerInfo.entitlements.active
    };
  } catch (error) {
    console.error('Failed to check subscription status:', error);
    return { hasSubscription: false, error: error.message };
  }
};

/**
 * Get customer info
 */
export const getCustomerInfo = async () => {
  if (!isConfigured) {
    throw new Error('RevenueCat not initialized');
  }

  try {
    const customerInfo = await Purchases.getSharedInstance().getCustomerInfo();
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
  if (!isConfigured) {
    return;
  }

  try {
    await Purchases.getSharedInstance().logOut();
    
    // Generate a new anonymous ID for the next session
    const newAnonymousId = generateAnonymousUserId();
    console.log('RevenueCat user logged out, new anonymous ID:', newAnonymousId);
  } catch (error) {
    console.error('Failed to log out RevenueCat user:', error);
  }
};