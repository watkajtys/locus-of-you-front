import * as Purchases from '@revenuecat/purchases-js';

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
 * Initialize RevenueCat
 */
export const initializeRevenueCat = async () => {
  if (isConfigured) return;
  
  if (!REVENUECAT_API_KEY) {
    console.warn('RevenueCat API key not found. Please add VITE_REVENUECAT_PUBLIC_API_KEY to your .env file.');
    return;
  }

  try {
    await Purchases.configure(REVENUECAT_API_KEY);
    isConfigured = true;
    console.log('RevenueCat initialized successfully');
  } catch (error) {
    console.error('Failed to initialize RevenueCat:', error);
  }
};

/**
 * Set user ID for RevenueCat
 */
export const setRevenueCatUserId = async (userId) => {
  if (!isConfigured) {
    console.warn('RevenueCat not initialized');
    return;
  }

  try {
    await Purchases.logIn(userId);
    console.log('RevenueCat user ID set:', userId);
  } catch (error) {
    console.error('Failed to set RevenueCat user ID:', error);
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
    const offerings = await Purchases.getOfferings();
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
    const offerings = await Purchases.getOfferings();
    
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

    const purchaseResult = await Purchases.purchasePackage(targetPackage);
    
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
    const customerInfo = await Purchases.restorePurchases();
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
    const customerInfo = await Purchases.getCustomerInfo();
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
    const customerInfo = await Purchases.getCustomerInfo();
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

  Purchases.addCustomerInfoUpdateListener(callback);
};

/**
 * Log out current user
 */
export const logOutRevenueCat = async () => {
  if (!isConfigured) {
    return;
  }

  try {
    await Purchases.logOut();
    console.log('RevenueCat user logged out');
  } catch (error) {
    console.error('Failed to log out RevenueCat user:', error);
  }
};