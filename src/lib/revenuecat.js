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
let customerInfoUpdateListener = null;

/**
 * Generate a unique anonymous user ID
 */
const generateAnonymousUserId = () => {
  let anonymousId = localStorage.getItem('revenuecat_anonymous_id');
  
  if (!anonymousId) {
    anonymousId = `anonymous_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    localStorage.setItem('revenuecat_anonymous_id', anonymousId);
  }
  
  return anonymousId;
};

/**
 * Detect if we're in sandbox/testing environment
 */
const isSandboxEnvironment = () => {
  return import.meta.env.MODE === 'development' || 
         window.location.hostname === 'localhost' ||
         window.location.hostname.includes('staging');
};

/**
 * Initialize RevenueCat with comprehensive configuration
 */
export const initializeRevenueCat = async () => {
  if (isConfigured) return;
  
  if (!REVENUECAT_API_KEY || REVENUECAT_API_KEY.trim() === '') {
    console.warn('RevenueCat API key not found. Please add VITE_REVENUECAT_PUBLIC_API_KEY to your .env file.');
    return;
  }

  try {
    const anonymousUserId = generateAnonymousUserId();
    
    await Purchases.configure({
      apiKey: REVENUECAT_API_KEY,
      appUserId: anonymousUserId
    });
    
    // Set up customer info update listener
    setupCustomerInfoListener();
    
    // Restore purchases on initialization
    await restorePurchases();
    
    isConfigured = true;
    
    // Analytics: Track RevenueCat initialization
    trackAnalyticsEvent('revenuecat_initialized', {
      environment: isSandboxEnvironment() ? 'sandbox' : 'production',
      userId: anonymousUserId
    });
    
    console.log('RevenueCat initialized successfully:', {
      environment: isSandboxEnvironment() ? 'sandbox' : 'production',
      userId: anonymousUserId
    });
  } catch (error) {
    console.error('Failed to initialize RevenueCat:', error);
    
    // Analytics: Track initialization failure
    trackAnalyticsEvent('revenuecat_init_failed', {
      error: error.message,
      environment: isSandboxEnvironment() ? 'sandbox' : 'production'
    });
  }
};

/**
 * Set up customer info update listener for real-time subscription changes
 */
const setupCustomerInfoListener = () => {
  // Note: Web SDK may not support listeners, but we'll prepare for future updates
  try {
    if (Purchases.addCustomerInfoUpdateListener) {
      customerInfoUpdateListener = Purchases.addCustomerInfoUpdateListener((customerInfo) => {
        console.log('Customer info updated:', customerInfo);
        
        // Notify app of subscription changes
        window.dispatchEvent(new CustomEvent('revenueCatCustomerInfoUpdated', {
          detail: { customerInfo }
        }));
        
        // Analytics: Track subscription status changes
        const hasActiveSubscription = customerInfo.entitlements.active[ENTITLEMENT_ID] !== undefined;
        trackAnalyticsEvent('subscription_status_changed', {
          hasActiveSubscription,
          entitlements: Object.keys(customerInfo.entitlements.active)
        });
      });
    }
  } catch (error) {
    console.warn('Customer info listener not supported in this SDK version:', error);
  }
};

/**
 * Set user ID for RevenueCat with enhanced error handling
 */
export const setRevenueCatUserId = async (userId, customerProperties = {}) => {
  if (!isConfigured) {
    console.warn('RevenueCat not initialized');
    return { success: false, error: 'RevenueCat not initialized' };
  }

  if (!userId || userId.trim() === '') {
    console.warn('Invalid user ID provided to RevenueCat');
    return { success: false, error: 'Invalid user ID' };
  }

  try {
    const result = await Purchases.logIn(userId);
    
    // Set customer properties if provided
    if (Object.keys(customerProperties).length > 0) {
      await setCustomerProperties(customerProperties);
    }
    
    // Clear the anonymous ID since we're now identified
    localStorage.removeItem('revenuecat_anonymous_id');
    
    // Analytics: Track user identification
    trackAnalyticsEvent('user_identified', {
      userId,
      previouslyAnonymous: true
    });
    
    console.log('RevenueCat user ID set successfully:', userId);
    return { success: true, data: result };
  } catch (error) {
    console.error('Failed to set RevenueCat user ID:', error);
    
    // Analytics: Track identification failure
    trackAnalyticsEvent('user_identification_failed', {
      userId,
      error: error.message
    });
    
    return { success: false, error: error.message };
  }
};

/**
 * Set customer properties for analytics and segmentation
 */
export const setCustomerProperties = async (properties) => {
  if (!isConfigured) return;

  try {
    const validProperties = {};
    
    // Filter and validate properties
    Object.keys(properties).forEach(key => {
      const value = properties[key];
      if (value !== null && value !== undefined && value !== '') {
        validProperties[key] = String(value);
      }
    });

    // Set properties (this method may not exist in web SDK - prepare for future)
    if (Purchases.setAttributes) {
      await Purchases.setAttributes(validProperties);
    }
    
    console.log('Customer properties set:', validProperties);
  } catch (error) {
    console.error('Failed to set customer properties:', error);
  }
};

/**
 * Get available offerings with enhanced error handling
 */
export const getOfferings = async () => {
  if (!isConfigured) {
    throw new Error('RevenueCat not initialized');
  }

  try {
    const offerings = await Purchases.getOfferings();
    
    // Validate offerings structure
    if (!offerings?.current?.availablePackages?.length) {
      throw new Error('No products available for purchase');
    }
    
    // Analytics: Track offerings fetched
    trackAnalyticsEvent('offerings_fetched', {
      offeringCount: offerings.current.availablePackages.length,
      productIds: offerings.current.availablePackages.map(pkg => pkg.product.identifier)
    });
    
    return offerings;
  } catch (error) {
    console.error('Failed to get offerings:', error);
    
    // Analytics: Track offerings fetch failure
    trackAnalyticsEvent('offerings_fetch_failed', {
      error: error.message
    });
    
    throw error;
  }
};

/**
 * Enhanced purchase subscription with comprehensive error handling
 */
export const purchaseSubscription = async (productId) => {
  if (!isConfigured) {
    throw new Error('RevenueCat not initialized');
  }

  try {
    // Analytics: Track purchase attempt
    trackAnalyticsEvent('purchase_attempted', {
      productId,
      environment: isSandboxEnvironment() ? 'sandbox' : 'production'
    });
    
    const offerings = await getOfferings();
    
    const targetPackage = offerings.current.availablePackages.find(
      pkg => pkg.product.identifier === productId
    );

    if (!targetPackage) {
      const error = `Product ${productId} not found in offerings`;
      
      // Analytics: Track product not found
      trackAnalyticsEvent('purchase_failed', {
        productId,
        reason: 'product_not_found',
        availableProducts: offerings.current.availablePackages.map(pkg => pkg.product.identifier)
      });
      
      throw new Error(error);
    }

    const purchaseResult = await Purchases.purchasePackage(targetPackage);
    
    // Analytics: Track successful purchase
    trackAnalyticsEvent('purchase_completed', {
      productId,
      price: targetPackage.product.price,
      currency: targetPackage.product.currencyCode || 'USD',
      environment: isSandboxEnvironment() ? 'sandbox' : 'production'
    });
    
    return {
      success: true,
      customerInfo: purchaseResult.customerInfo,
      productIdentifier: purchaseResult.productIdentifier
    };
  } catch (error) {
    console.error('Purchase failed:', error);
    
    // Handle specific error types
    let errorCode = 'unknown';
    let userMessage = 'Purchase failed. Please try again.';
    let retryable = false;

    if (error.code) {
      switch (error.code) {
        case 'USER_CANCELLED':
          errorCode = 'user_cancelled';
          userMessage = 'Purchase was cancelled';
          retryable = false;
          break;
        case 'PAYMENT_PENDING':
          errorCode = 'payment_pending';
          userMessage = 'Payment is pending approval';
          retryable = false;
          break;
        case 'RECEIPT_ALREADY_IN_USE':
          errorCode = 'receipt_in_use';
          userMessage = 'This purchase has already been processed';
          retryable = false;
          break;
        case 'INVALID_RECEIPT':
          errorCode = 'invalid_receipt';
          userMessage = 'Invalid purchase receipt. Please try again.';
          retryable = true;
          break;
        case 'NETWORK_ERROR':
          errorCode = 'network_error';
          userMessage = 'Network connection issue. Please check your internet and try again.';
          retryable = true;
          break;
        case 'STORE_PROBLEM':
          errorCode = 'store_problem';
          userMessage = 'Store is temporarily unavailable. Please try again later.';
          retryable = true;
          break;
        default:
          errorCode = error.code.toLowerCase();
          retryable = !['USER_CANCELLED', 'PAYMENT_PENDING'].includes(error.code);
      }
    }
    
    // Analytics: Track purchase failure
    trackAnalyticsEvent('purchase_failed', {
      productId,
      errorCode,
      errorMessage: error.message,
      retryable,
      environment: isSandboxEnvironment() ? 'sandbox' : 'production'
    });
    
    return {
      success: false,
      error: userMessage,
      errorCode,
      retryable,
      userCancelled: errorCode === 'user_cancelled'
    };
  }
};

/**
 * Restore purchases with enhanced tracking
 */
export const restorePurchases = async () => {
  if (!isConfigured) {
    throw new Error('RevenueCat not initialized');
  }

  try {
    // Analytics: Track restore attempt
    trackAnalyticsEvent('restore_attempted');
    
    const customerInfo = await Purchases.restorePurchases();
    
    const hasActiveSubscriptions = Object.keys(customerInfo.entitlements.active).length > 0;
    
    // Analytics: Track restore result
    trackAnalyticsEvent('restore_completed', {
      hasActiveSubscriptions,
      entitlementCount: Object.keys(customerInfo.entitlements.active).length
    });
    
    return {
      success: true,
      customerInfo,
      hasActiveSubscriptions
    };
  } catch (error) {
    console.error('Restore purchases failed:', error);
    
    // Analytics: Track restore failure
    trackAnalyticsEvent('restore_failed', {
      error: error.message
    });
    
    return {
      success: false,
      error: error.message || 'Failed to restore purchases'
    };
  }
};

/**
 * Check subscription status with enhanced validation
 */
export const checkSubscriptionStatus = async () => {
  if (!isConfigured) {
    console.warn('RevenueCat not initialized');
    return { hasSubscription: false };
  }

  try {
    const customerInfo = await Purchases.getCustomerInfo();
    const hasSubscription = customerInfo.entitlements.active[ENTITLEMENT_ID] !== undefined;
    
    // Get subscription details
    const activeEntitlements = customerInfo.entitlements.active;
    const subscriptionDetails = hasSubscription ? {
      entitlementId: ENTITLEMENT_ID,
      productIdentifier: activeEntitlements[ENTITLEMENT_ID].productIdentifier,
      purchaseDate: activeEntitlements[ENTITLEMENT_ID].latestPurchaseDate,
      expirationDate: activeEntitlements[ENTITLEMENT_ID].expirationDate,
      willRenew: activeEntitlements[ENTITLEMENT_ID].willRenew,
      isActive: activeEntitlements[ENTITLEMENT_ID].isActive
    } : null;
    
    // Analytics: Track subscription status check
    trackAnalyticsEvent('subscription_status_checked', {
      hasSubscription,
      productIdentifier: subscriptionDetails?.productIdentifier
    });
    
    return {
      hasSubscription,
      customerInfo,
      activeEntitlements,
      subscriptionDetails
    };
  } catch (error) {
    console.error('Failed to check subscription status:', error);
    
    // Analytics: Track status check failure
    trackAnalyticsEvent('subscription_status_check_failed', {
      error: error.message
    });
    
    return { hasSubscription: false, error: error.message };
  }
};

/**
 * Get customer info with error handling
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
 * Log out current user and return to anonymous state
 */
export const logOutRevenueCat = async () => {
  if (!isConfigured) {
    return;
  }

  try {
    await Purchases.logOut();
    
    // Generate a new anonymous ID for the next session
    localStorage.removeItem('revenuecat_anonymous_id');
    const newAnonymousId = generateAnonymousUserId();
    
    // Analytics: Track logout
    trackAnalyticsEvent('user_logged_out', {
      newAnonymousId
    });
    
    console.log('RevenueCat user logged out, new anonymous ID:', newAnonymousId);
  } catch (error) {
    console.error('Failed to log out RevenueCat user:', error);
    
    // Analytics: Track logout failure
    trackAnalyticsEvent('logout_failed', {
      error: error.message
    });
  }
};

/**
 * Purchase with retry logic for transient failures
 */
export const purchaseWithRetry = async (productId, maxRetries = 2) => {
  let lastError = null;
  
  for (let attempt = 1; attempt <= maxRetries + 1; attempt++) {
    try {
      const result = await purchaseSubscription(productId);
      
      if (result.success) {
        return result;
      } else if (!result.retryable || attempt > maxRetries) {
        return result;
      }
      
      lastError = result;
      
      // Wait before retry (exponential backoff)
      if (attempt <= maxRetries) {
        const delay = Math.min(1000 * Math.pow(2, attempt - 1), 5000);
        await new Promise(resolve => setTimeout(resolve, delay));
        
        // Analytics: Track retry attempt
        trackAnalyticsEvent('purchase_retry_attempted', {
          productId,
          attempt,
          delay
        });
      }
    } catch (error) {
      lastError = { success: false, error: error.message };
      
      if (attempt > maxRetries) {
        break;
      }
      
      // Wait before retry
      const delay = Math.min(1000 * Math.pow(2, attempt - 1), 5000);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  return lastError || { success: false, error: 'Maximum retry attempts exceeded' };
};

/**
 * Validate purchase environment (sandbox vs production)
 */
export const validatePurchaseEnvironment = async () => {
  try {
    const customerInfo = await getCustomerInfo();
    const isSandbox = isSandboxEnvironment();
    
    // Check if there are any sandbox purchases in production or vice versa
    const managementURL = customerInfo.managementURL;
    const isSandboxPurchase = managementURL?.includes('sandbox') || false;
    
    if (isSandbox !== isSandboxPurchase) {
      console.warn('Purchase environment mismatch detected:', {
        appEnvironment: isSandbox ? 'sandbox' : 'production',
        purchaseEnvironment: isSandboxPurchase ? 'sandbox' : 'production'
      });
    }
    
    return {
      isValid: isSandbox === isSandboxPurchase,
      appEnvironment: isSandbox ? 'sandbox' : 'production',
      purchaseEnvironment: isSandboxPurchase ? 'sandbox' : 'production'
    };
  } catch (error) {
    console.error('Failed to validate purchase environment:', error);
    return { isValid: false, error: error.message };
  }
};

/**
 * Analytics tracking function (customize based on your analytics provider)
 */
const trackAnalyticsEvent = (eventName, properties = {}) => {
  try {
    // Add common properties
    const eventData = {
      ...properties,
      timestamp: new Date().toISOString(),
      platform: 'web',
      sdkVersion: 'web_unknown' // Update when version info is available
    };
    
    // Example: Send to your analytics provider
    console.log('Analytics Event:', eventName, eventData);
    
    // Integrate with your analytics provider here:
    // - Google Analytics
    // - Mixpanel
    // - Amplitude
    // - Custom analytics
    
    // Example for Google Analytics 4:
    if (typeof gtag !== 'undefined') {
      gtag('event', eventName, eventData);
    }
    
    // Example for custom analytics endpoint:
    // fetch('/api/analytics', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify({ event: eventName, properties: eventData })
    // }).catch(console.error);
    
  } catch (error) {
    console.error('Analytics tracking failed:', error);
  }
};

/**
 * Get subscription pricing for display
 */
export const getSubscriptionPricing = async () => {
  try {
    const offerings = await getOfferings();
    
    const pricing = {
      monthly: null,
      annual: null
    };
    
    offerings.current.availablePackages.forEach(pkg => {
      const productId = pkg.product.identifier;
      const priceInfo = {
        price: pkg.product.price,
        priceString: pkg.product.priceString,
        currencyCode: pkg.product.currencyCode || 'USD',
        identifier: productId
      };
      
      if (productId === PRODUCT_IDS.MONTHLY) {
        pricing.monthly = priceInfo;
      } else if (productId === PRODUCT_IDS.ANNUAL) {
        pricing.annual = priceInfo;
      }
    });
    
    return pricing;
  } catch (error) {
    console.error('Failed to get pricing:', error);
    return { monthly: null, annual: null };
  }
};

// Export environment detection for use in components
export { isSandboxEnvironment };