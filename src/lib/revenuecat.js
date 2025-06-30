// RevenueCat Web SDK correct import pattern
import Purchases from '@revenuecat/purchases-js';

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
 * Initialize RevenueCat with proper error handling
 */
export const initializeRevenueCat = async () => {
  if (isConfigured) return;
  
  if (!REVENUECAT_API_KEY || REVENUECAT_API_KEY.trim() === '') {
    console.warn('RevenueCat API key not found or empty. Please add VITE_REVENUECAT_PUBLIC_API_KEY to your .env file.');
    return;
  }

  try {
    // Check if Purchases is available and has the right structure
    if (!Purchases) {
      throw new Error('RevenueCat SDK not loaded properly');
    }

    // Generate or retrieve anonymous user ID
    const anonymousUserId = generateAnonymousUserId();
    
    // Configure RevenueCat - try different API patterns
    let configureResult;
    
    if (typeof Purchases.configure === 'function') {
      // Standard configure method
      configureResult = await Purchases.configure({
        apiKey: REVENUECAT_API_KEY,
        appUserId: anonymousUserId
      });
    } else if (typeof Purchases.setup === 'function') {
      // Alternative setup method
      configureResult = await Purchases.setup(REVENUECAT_API_KEY, anonymousUserId);
    } else if (typeof Purchases === 'function') {
      // Constructor pattern
      const purchases = new Purchases(REVENUECAT_API_KEY);
      configureResult = await purchases.setAppUserId(anonymousUserId);
    } else {
      throw new Error('Unknown RevenueCat SDK API pattern');
    }
    
    isConfigured = true;
    console.log('RevenueCat initialized successfully with anonymous user:', anonymousUserId);
    return configureResult;
  } catch (error) {
    console.error('Failed to initialize RevenueCat:', error);
    console.error('RevenueCat object:', Purchases);
    
    // Provide detailed debugging information
    if (Purchases) {
      console.log('Available RevenueCat methods:', Object.getOwnPropertyNames(Purchases));
      console.log('Purchases prototype:', Object.getPrototypeOf(Purchases));
    }
    
    // Don't throw to prevent app from breaking
    return null;
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
    let result;
    
    // Try different API patterns for login
    if (typeof Purchases.logIn === 'function') {
      result = await Purchases.logIn(userId);
    } else if (typeof Purchases.identify === 'function') {
      result = await Purchases.identify(userId);
    } else if (typeof Purchases.setAppUserId === 'function') {
      result = await Purchases.setAppUserId(userId);
    } else {
      throw new Error('No supported user identification method found');
    }
    
    console.log('RevenueCat user ID set:', userId);
    
    // Clear the anonymous ID since we're now identified
    localStorage.removeItem('revenuecat_anonymous_id');
    
    return result;
  } catch (error) {
    console.error('Failed to set RevenueCat user ID:', error);
    // Don't throw to prevent app from breaking
    return null;
  }
};

/**
 * Get available offerings with multiple API attempts
 */
export const getOfferings = async () => {
  if (!isConfigured) {
    console.warn('RevenueCat not initialized');
    return null;
  }

  try {
    let offerings;
    
    // Try different API patterns for getting offerings
    if (typeof Purchases.getOfferings === 'function') {
      offerings = await Purchases.getOfferings();
    } else if (typeof Purchases.offerings === 'function') {
      offerings = await Purchases.offerings();
    } else if (typeof Purchases.fetchOfferings === 'function') {
      offerings = await Purchases.fetchOfferings();
    } else {
      throw new Error('No supported offerings method found');
    }
    
    return offerings;
  } catch (error) {
    console.error('Failed to get offerings:', error);
    return null;
  }
};

/**
 * Purchase a subscription with error handling
 */
export const purchaseSubscription = async (productId) => {
  if (!isConfigured) {
    throw new Error('RevenueCat not initialized');
  }

  try {
    const offerings = await getOfferings();
    
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

    let purchaseResult;
    
    // Try different API patterns for purchasing
    if (typeof Purchases.purchasePackage === 'function') {
      purchaseResult = await Purchases.purchasePackage(targetPackage);
    } else if (typeof Purchases.buyPackage === 'function') {
      purchaseResult = await Purchases.buyPackage(targetPackage);
    } else if (typeof Purchases.purchase === 'function') {
      purchaseResult = await Purchases.purchase(productId);
    } else {
      throw new Error('No supported purchase method found');
    }
    
    return {
      success: true,
      customerInfo: purchaseResult.customerInfo,
      productIdentifier: purchaseResult.productIdentifier
    };
  } catch (error) {
    console.error('Purchase failed:', error);
    
    // Handle specific RevenueCat errors
    if (error.code === 'USER_CANCELLED' || error.message?.includes('cancelled')) {
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
    let customerInfo;
    
    // Try different API patterns for restoring
    if (typeof Purchases.restorePurchases === 'function') {
      customerInfo = await Purchases.restorePurchases();
    } else if (typeof Purchases.restore === 'function') {
      customerInfo = await Purchases.restore();
    } else {
      throw new Error('No supported restore method found');
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
 * Check if user has premium subscription
 */
export const checkSubscriptionStatus = async () => {
  if (!isConfigured) {
    console.warn('RevenueCat not initialized');
    return { hasSubscription: false };
  }

  try {
    let customerInfo;
    
    // Try different API patterns for getting customer info
    if (typeof Purchases.getCustomerInfo === 'function') {
      customerInfo = await Purchases.getCustomerInfo();
    } else if (typeof Purchases.customerInfo === 'function') {
      customerInfo = await Purchases.customerInfo();
    } else if (typeof Purchases.fetchCustomerInfo === 'function') {
      customerInfo = await Purchases.fetchCustomerInfo();
    } else {
      throw new Error('No supported customer info method found');
    }
    
    const hasSubscription = customerInfo?.entitlements?.active?.[ENTITLEMENT_ID] !== undefined;
    
    return {
      hasSubscription,
      customerInfo,
      activeEntitlements: customerInfo?.entitlements?.active || {}
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
    let customerInfo;
    
    // Try different API patterns
    if (typeof Purchases.getCustomerInfo === 'function') {
      customerInfo = await Purchases.getCustomerInfo();
    } else if (typeof Purchases.customerInfo === 'function') {
      customerInfo = await Purchases.customerInfo();
    } else {
      throw new Error('No supported customer info method found');
    }
    
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

  try {
    // Try different listener patterns
    if (typeof Purchases.addCustomerInfoUpdateListener === 'function') {
      Purchases.addCustomerInfoUpdateListener(callback);
    } else if (typeof Purchases.setUpdatedCustomerInfoListener === 'function') {
      Purchases.setUpdatedCustomerInfoListener(callback);
    } else {
      console.warn('Customer info update listeners not supported in this SDK version');
    }
  } catch (error) {
    console.error('Failed to set customer info listener:', error);
  }
};

/**
 * Log out current user (switch back to anonymous)
 */
export const logOutRevenueCat = async () => {
  if (!isConfigured) {
    return;
  }

  try {
    // Try different logout patterns
    if (typeof Purchases.logOut === 'function') {
      await Purchases.logOut();
    } else if (typeof Purchases.reset === 'function') {
      await Purchases.reset();
    } else if (typeof Purchases.setAppUserId === 'function') {
      // Fallback: set to anonymous user ID
      const newAnonymousId = generateAnonymousUserId();
      await Purchases.setAppUserId(newAnonymousId);
    }
    
    // Generate a new anonymous ID for the next session
    const newAnonymousId = generateAnonymousUserId();
    console.log('RevenueCat user logged out, new anonymous ID:', newAnonymousId);
  } catch (error) {
    console.error('Failed to log out RevenueCat user:', error);
  }
};

// Export debug function for troubleshooting
export const debugRevenueCat = () => {
  console.log('RevenueCat Debug Info:');
  console.log('- isConfigured:', isConfigured);
  console.log('- API Key present:', !!REVENUECAT_API_KEY);
  console.log('- Purchases object:', Purchases);
  
  if (Purchases) {
    console.log('- Available methods:', Object.getOwnPropertyNames(Purchases));
    console.log('- Object type:', typeof Purchases);
    console.log('- Constructor:', Purchases.constructor.name);
  }
  
  return {
    isConfigured,
    hasApiKey: !!REVENUECAT_API_KEY,
    purchases: Purchases,
    availableMethods: Purchases ? Object.getOwnPropertyNames(Purchases) : []
  };
};