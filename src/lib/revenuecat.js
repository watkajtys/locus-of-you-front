import Purchases from '@revenuecat/purchases-js';

// RevenueCat configuration - CRITICAL: These must match exactly with your RevenueCat dashboard
const REVENUECAT_API_KEY = import.meta.env.VITE_REVENUECAT_PUBLIC_API_KEY;

// Product IDs - CRITICAL: Must match your RevenueCat dashboard exactly
export const PRODUCT_IDS = {
  MONTHLY: 'monthly_premium_subscription',
  ANNUAL: 'annual_premium_subscription'
};

// Entitlement identifier - CRITICAL: Must match your RevenueCat dashboard exactly
export const ENTITLEMENT_ID = 'premium_features';

// SDK state management with proper error boundaries
let isConfigured = false;
let isConfiguring = false;
let configurationPromise = null;
let lastConfigurationAttempt = 0;
let configurationRetries = 0;
const MAX_CONFIGURATION_RETRIES = 3;
const CONFIGURATION_RETRY_DELAY = 2000;

// Cache management
let offeringsCache = null;
let offeringsCacheTime = 0;
let customerInfoCache = null;
let customerInfoCacheTime = 0;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

// Error tracking
let lastErrors = [];
const MAX_ERROR_HISTORY = 10;

/**
 * Enhanced environment detection with multiple validation layers
 */
export const isSandboxEnvironment = () => {
  // Multiple indicators for development/sandbox environment
  const indicators = [
    import.meta.env.MODE === 'development',
    import.meta.env.DEV === true,
    window.location.hostname === 'localhost',
    window.location.hostname === '127.0.0.1',
    window.location.hostname.includes('staging'),
    window.location.hostname.includes('test'),
    window.location.hostname.includes('dev'),
    window.location.hostname.includes('.local'),
    ['3000', '5173', '8080', '4000'].includes(window.location.port),
    window.location.protocol === 'http:' && !window.location.hostname.includes('production')
  ];
  
  const result = indicators.some(indicator => indicator);
  console.log('🌍 Environment detection:', {
    isSandbox: result,
    hostname: window.location.hostname,
    port: window.location.port,
    protocol: window.location.protocol,
    mode: import.meta.env.MODE
  });
  
  return result;
};

/**
 * Enhanced error tracking and logging
 */
const trackError = (error, context = '') => {
  const errorInfo = {
    timestamp: new Date().toISOString(),
    error: error.message || String(error),
    context,
    stack: error.stack || 'No stack trace',
    environment: isSandboxEnvironment() ? 'sandbox' : 'production',
    userAgent: navigator.userAgent,
    url: window.location.href
  };
  
  // Add to error history (keep last 10)
  lastErrors.unshift(errorInfo);
  if (lastErrors.length > MAX_ERROR_HISTORY) {
    lastErrors = lastErrors.slice(0, MAX_ERROR_HISTORY);
  }
  
  console.error(`🚨 RevenueCat Error [${context}]:`, errorInfo);
  
  // Send to analytics if available
  if (typeof gtag !== 'undefined') {
    gtag('event', 'revenuecat_error', {
      error_message: error.message,
      error_context: context,
      environment: errorInfo.environment
    });
  }
  
  return errorInfo;
};

/**
 * Generate cryptographically secure anonymous user ID with validation
 */
const generateAnonymousUserId = () => {
  const STORAGE_KEY = 'revenuecat_anonymous_id';
  
  try {
    let anonymousId = localStorage.getItem(STORAGE_KEY);
    
    // Validate existing ID
    if (anonymousId && typeof anonymousId === 'string' && anonymousId.length > 10) {
      return anonymousId;
    }
    
    // Generate new secure ID
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
      anonymousId = `anon_${crypto.randomUUID()}`;
    } else if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
      const array = new Uint8Array(16);
      crypto.getRandomValues(array);
      anonymousId = `anon_${Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('')}`;
    } else {
      // Fallback for environments without crypto
      anonymousId = `anon_${Date.now()}_${Math.random().toString(36).substr(2, 16)}`;
    }
    
    localStorage.setItem(STORAGE_KEY, anonymousId);
    console.log('🆔 Generated new anonymous ID:', anonymousId);
    
    return anonymousId;
  } catch (error) {
    console.error('🚨 Failed to generate anonymous user ID:', error);
    // Return a fallback ID
    return `anon_fallback_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
};

/**
 * Comprehensive configuration validation
 */
const validateConfiguration = () => {
  const issues = [];
  
  // Validate API key
  if (!REVENUECAT_API_KEY || REVENUECAT_API_KEY.trim() === '') {
    issues.push('VITE_REVENUECAT_PUBLIC_API_KEY is missing in environment variables');
  } else if (REVENUECAT_API_KEY === 'your_revenuecat_api_key' || REVENUECAT_API_KEY === 'rcb_QmGbuWlwaHNbRrnCWuaEBFzylQmy') {
    issues.push('VITE_REVENUECAT_PUBLIC_API_KEY appears to be a placeholder value');
  } else if (REVENUECAT_API_KEY.length < 10) {
    issues.push('VITE_REVENUECAT_PUBLIC_API_KEY appears to be invalid (too short)');
  }
  
  // Validate product IDs format
  Object.entries(PRODUCT_IDS).forEach(([key, value]) => {
    if (!value || typeof value !== 'string' || value.length < 3) {
      issues.push(`Product ID ${key} (${value}) appears to be invalid`);
    }
  });
  
  // Validate entitlement ID
  if (!ENTITLEMENT_ID || typeof ENTITLEMENT_ID !== 'string' || ENTITLEMENT_ID.length < 3) {
    issues.push(`Entitlement ID (${ENTITLEMENT_ID}) appears to be invalid`);
  }
  
  // Validate browser environment
  if (typeof window === 'undefined') {
    issues.push('RevenueCat Web SDK requires a browser environment');
  }
  
  return {
    isValid: issues.length === 0,
    issues,
    apiKeyPresent: !!REVENUECAT_API_KEY,
    environment: isSandboxEnvironment() ? 'sandbox' : 'production'
  };
};

/**
 * Enhanced SDK initialization with comprehensive error handling and retry logic
 */
export const initializeRevenueCat = async (forceReinit = false) => {
  const now = Date.now();
  
  // Prevent multiple simultaneous initialization attempts
  if (isConfiguring && !forceReinit) {
    console.log('⏳ RevenueCat initialization already in progress...');
    return configurationPromise || { success: false, error: 'Configuration in progress' };
  }
  
  // Return early if already configured and not forcing reinit
  if (isConfigured && !forceReinit) {
    console.log('✅ RevenueCat already initialized');
    return { success: true, alreadyInitialized: true };
  }
  
  // Rate limiting for retries
  if (!forceReinit && configurationRetries >= MAX_CONFIGURATION_RETRIES) {
    if (now - lastConfigurationAttempt < CONFIGURATION_RETRY_DELAY * configurationRetries) {
      const error = `Too many configuration attempts. Next retry available in ${Math.ceil((CONFIGURATION_RETRY_DELAY * configurationRetries - (now - lastConfigurationAttempt)) / 1000)}s`;
      return { success: false, error };
    } else {
      // Reset retry count after cooldown
      configurationRetries = 0;
    }
  }
  
  // Validate configuration before attempting initialization
  const validation = validateConfiguration();
  if (!validation.isValid) {
    const error = `Configuration validation failed: ${validation.issues.join(', ')}`;
    trackError(new Error(error), 'initialization_validation');
    return { success: false, error, validationIssues: validation.issues };
  }
  
  // Set configuration state
  isConfiguring = true;
  lastConfigurationAttempt = now;
  configurationRetries++;
  
  configurationPromise = (async () => {
    try {
      console.log('🚀 Initializing RevenueCat SDK...', {
        attempt: configurationRetries,
        environment: validation.environment,
        forceReinit
      });
      
      // Reset state
      isConfigured = false;
      
      // Generate anonymous user ID
      const anonymousUserId = generateAnonymousUserId();
      
      // Validate anonymous user ID
      if (!anonymousUserId || anonymousUserId.length < 10) {
        throw new Error('Failed to generate valid anonymous user ID');
      }
      
      // Configure RevenueCat with comprehensive options
      const configOptions = {
        apiKey: REVENUECAT_API_KEY,
        appUserId: anonymousUserId,
        observerMode: false,
        dangerousSettings: {
          autoSyncPurchases: true,
          allowSharingAppStoreAccount: isSandboxEnvironment() // Only allow sharing in sandbox
        }
      };
      
      console.log('⚙️ RevenueCat configuration:', {
        apiKeyLength: REVENUECAT_API_KEY.length,
        userId: anonymousUserId,
        environment: validation.environment,
        observerMode: configOptions.observerMode
      });
      
      await Purchases.configure(configOptions);
      
      // Verify configuration by checking customer info
      console.log('🔍 Verifying configuration by fetching customer info...');
      const customerInfo = await Purchases.getCustomerInfo();
      
      if (!customerInfo) {
        throw new Error('Customer info is null after configuration');
      }
      
      // Test basic functionality
      console.log('🧪 Testing offerings fetch...');
      const offerings = await Purchases.getOfferings();
      
      if (!offerings) {
        console.warn('⚠️ Offerings are null - this might be expected if no products are configured');
      }
      
      // Mark as successfully configured
      isConfigured = true;
      isConfiguring = false;
      configurationRetries = 0; // Reset retry count on success
      
      // Clear old caches
      offeringsCache = null;
      offeringsCacheTime = 0;
      customerInfoCache = customerInfo;
      customerInfoCacheTime = now;
      
      const result = {
        success: true,
        customerInfo,
        offerings,
        environment: validation.environment,
        userId: anonymousUserId,
        hasActiveEntitlements: Object.keys(customerInfo.entitlements.active).length > 0
      };
      
      console.log('✅ RevenueCat initialized successfully:', {
        userId: anonymousUserId,
        environment: validation.environment,
        hasActiveEntitlements: result.hasActiveEntitlements,
        offeringsCount: offerings?.current?.availablePackages?.length || 0
      });
      
      // Track successful initialization
      if (typeof gtag !== 'undefined') {
        gtag('event', 'revenuecat_initialized', {
          environment: validation.environment,
          user_id: anonymousUserId,
          has_active_entitlements: result.hasActiveEntitlements
        });
      }
      
      return result;

    } catch (error) {
      isConfigured = false;
      isConfiguring = false;
      
      const errorInfo = trackError(error, 'initialization');
      
      // Determine if error is retryable
      const retryableErrors = [
        'network',
        'timeout',
        'connection',
        'fetch',
        'offline'
      ];
      
      const isRetryable = retryableErrors.some(keyword => 
        error.message?.toLowerCase().includes(keyword)
      );
      
      console.error('❌ RevenueCat initialization failed:', {
        error: error.message,
        attempt: configurationRetries,
        isRetryable,
        willRetry: isRetryable && configurationRetries < MAX_CONFIGURATION_RETRIES
      });
      
      throw error;
    } finally {
      configurationPromise = null;
    }
  })();

  return configurationPromise;
};

/**
 * Ensure RevenueCat is initialized before operations with auto-retry
 */
const ensureInitialized = async (context = 'unknown') => {
  if (!isConfigured) {
    console.log(`🔄 Auto-initializing RevenueCat for ${context}...`);
    const result = await initializeRevenueCat();
    if (!result.success) {
      throw new Error(`RevenueCat initialization failed for ${context}: ${result.error}`);
    }
  }
  return true;
};

/**
 * Enhanced user identification with comprehensive validation and error handling
 */
export const setRevenueCatUserId = async (userId, customerProperties = {}) => {
  try {
    await ensureInitialized('user_identification');

    // Validate user ID
    if (!userId || typeof userId !== 'string' || userId.trim() === '') {
      throw new Error('Invalid user ID: must be a non-empty string');
    }

    const cleanUserId = userId.trim();
    
    // Additional validation
    if (cleanUserId.length < 3) {
      throw new Error('Invalid user ID: too short (minimum 3 characters)');
    }
    
    if (cleanUserId.length > 100) {
      throw new Error('Invalid user ID: too long (maximum 100 characters)');
    }

    console.log('🔐 Identifying user with RevenueCat:', {
      userId: cleanUserId,
      hasCustomerProperties: Object.keys(customerProperties).length > 0
    });

    // Log in user (this will merge anonymous purchases)
    const result = await Purchases.logIn(cleanUserId);
    
    if (!result || !result.customerInfo) {
      throw new Error('Login result is invalid');
    }

    // Set customer properties if provided and supported
    if (Object.keys(customerProperties).length > 0) {
      try {
        await setCustomerProperties(customerProperties);
      } catch (propError) {
        console.warn('⚠️ Failed to set customer properties:', propError.message);
        // Don't fail the whole operation for customer properties
      }
    }

    // Clear anonymous ID since user is now identified
    localStorage.removeItem('revenuecat_anonymous_id');

    // Update customer info cache
    customerInfoCache = result.customerInfo;
    customerInfoCacheTime = Date.now();

    // Track identification success
    if (typeof gtag !== 'undefined') {
      gtag('event', 'user_identified', {
        user_id: cleanUserId,
        had_previous_purchases: Object.keys(result.customerInfo.entitlements.active).length > 0
      });
    }

    console.log('✅ User identified successfully:', {
      userId: cleanUserId,
      hasActiveEntitlements: Object.keys(result.customerInfo.entitlements.active).length > 0
    });
    
    return { success: true, data: result };

  } catch (error) {
    const errorInfo = trackError(error, 'user_identification');
    
    return {
      success: false,
      error: error.message || 'User identification failed',
      details: errorInfo
    };
  }
};

/**
 * Set customer properties with validation
 */
export const setCustomerProperties = async (properties) => {
  try {
    await ensureInitialized('customer_properties');

    if (!properties || typeof properties !== 'object') {
      throw new Error('Properties must be an object');
    }

    // Validate and clean properties
    const validProperties = {};
    Object.entries(properties).forEach(([key, value]) => {
      if (key && typeof key === 'string' && value !== null && value !== undefined) {
        // Convert to string and limit length
        const stringValue = String(value).slice(0, 100);
        if (stringValue.length > 0) {
          validProperties[key] = stringValue;
        }
      }
    });

    if (Object.keys(validProperties).length === 0) {
      console.warn('⚠️ No valid customer properties to set');
      return;
    }

    // Check if setAttributes is available (may not be in all SDK versions)
    if (typeof Purchases.setAttributes === 'function') {
      await Purchases.setAttributes(validProperties);
      console.log('✅ Customer properties set:', Object.keys(validProperties));
    } else {
      console.warn('⚠️ Customer properties not supported in this SDK version');
    }

  } catch (error) {
    trackError(error, 'customer_properties');
    throw error;
  }
};

/**
 * Enhanced offerings retrieval with improved caching and validation
 */
export const getOfferings = async (useCache = true) => {
  try {
    await ensureInitialized('get_offerings');

    // Check cache first
    if (useCache && offeringsCache && (Date.now() - offeringsCacheTime) < CACHE_TTL) {
      console.log('📦 Using cached offerings');
      return offeringsCache;
    }

    console.log('🛍️ Fetching offerings from RevenueCat...');
    const offerings = await Purchases.getOfferings();

    // Comprehensive validation
    if (!offerings) {
      throw new Error('Offerings response is null');
    }

    if (!offerings.current) {
      throw new Error('No current offering available');
    }

    if (!offerings.current.availablePackages) {
      throw new Error('No available packages in current offering');
    }

    if (offerings.current.availablePackages.length === 0) {
      throw new Error('No products available for purchase');
    }

    // Validate our expected products exist
    const availableProductIds = offerings.current.availablePackages.map(pkg => pkg.product.identifier);
    const missingProducts = Object.values(PRODUCT_IDS).filter(id => !availableProductIds.includes(id));
    
    if (missingProducts.length > 0) {
      console.warn('⚠️ Some expected products are missing from offerings:', missingProducts);
    }

    // Validate package structure
    const invalidPackages = offerings.current.availablePackages.filter(pkg => 
      !pkg.product || 
      !pkg.product.identifier || 
      !pkg.product.priceString ||
      typeof pkg.product.price !== 'number'
    );

    if (invalidPackages.length > 0) {
      console.warn('⚠️ Some packages have invalid structure:', invalidPackages);
    }

    // Cache the validated offerings
    offeringsCache = offerings;
    offeringsCacheTime = Date.now();

    // Track success
    if (typeof gtag !== 'undefined') {
      gtag('event', 'offerings_fetched', {
        product_count: offerings.current.availablePackages.length,
        missing_products: missingProducts.length,
        environment: isSandboxEnvironment() ? 'sandbox' : 'production'
      });
    }

    console.log('✅ Offerings fetched successfully:', {
      productCount: availableProductIds.length,
      productIds: availableProductIds,
      missingProducts
    });
    
    return offerings;

  } catch (error) {
    trackError(error, 'get_offerings');
    throw error;
  }
};

/**
 * Enhanced purchase flow with comprehensive error handling and retry logic
 */
export const purchaseSubscription = async (productId) => {
  try {
    await ensureInitialized('purchase_subscription');

    // Validate product ID
    if (!productId || typeof productId !== 'string') {
      throw new Error('Invalid product ID: must be a non-empty string');
    }

    if (!Object.values(PRODUCT_IDS).includes(productId)) {
      throw new Error(`Invalid product ID: ${productId}. Expected one of: ${Object.values(PRODUCT_IDS).join(', ')}`);
    }

    console.log('💳 Starting purchase for:', productId);

    // Track purchase attempt
    if (typeof gtag !== 'undefined') {
      gtag('event', 'purchase_attempted', {
        product_id: productId,
        environment: isSandboxEnvironment() ? 'sandbox' : 'production'
      });
    }

    // Get fresh offerings
    const offerings = await getOfferings(false); // Don't use cache for purchases
    
    // Find the product package
    const targetPackage = offerings.current.availablePackages.find(
      pkg => pkg.product.identifier === productId
    );

    if (!targetPackage) {
      const availableIds = offerings.current.availablePackages.map(pkg => pkg.product.identifier);
      throw new Error(`Product ${productId} not found in offerings. Available products: ${availableIds.join(', ')}`);
    }

    // Validate package before purchase
    if (!targetPackage.product.priceString || typeof targetPackage.product.price !== 'number') {
      throw new Error(`Product ${productId} has invalid pricing information`);
    }

    console.log('📦 Purchasing package:', {
      productId: targetPackage.product.identifier,
      price: targetPackage.product.priceString,
      title: targetPackage.product.title
    });

    // Attempt purchase
    const purchaseResult = await Purchases.purchasePackage(targetPackage);

    // Validate purchase result
    if (!purchaseResult || !purchaseResult.customerInfo) {
      throw new Error('Purchase result is invalid');
    }

    // Verify the purchase was successful by checking entitlements
    const hasEntitlement = purchaseResult.customerInfo.entitlements.active[ENTITLEMENT_ID] !== undefined;
    
    if (!hasEntitlement) {
      console.warn('⚠️ Purchase completed but expected entitlement not active:', {
        entitlementId: ENTITLEMENT_ID,
        activeEntitlements: Object.keys(purchaseResult.customerInfo.entitlements.active)
      });
    }

    // Update customer info cache
    customerInfoCache = purchaseResult.customerInfo;
    customerInfoCacheTime = Date.now();

    // Track successful purchase
    if (typeof gtag !== 'undefined') {
      gtag('event', 'purchase_completed', {
        product_id: productId,
        price: targetPackage.product.price,
        currency: targetPackage.product.currencyCode || 'USD',
        has_entitlement: hasEntitlement,
        environment: isSandboxEnvironment() ? 'sandbox' : 'production'
      });
    }

    console.log('✅ Purchase completed successfully:', {
      productId,
      hasEntitlement,
      activeEntitlements: Object.keys(purchaseResult.customerInfo.entitlements.active)
    });

    return {
      success: true,
      customerInfo: purchaseResult.customerInfo,
      productIdentifier: purchaseResult.productIdentifier,
      hasEntitlement
    };

  } catch (error) {
    const errorInfo = trackError(error, 'purchase_subscription');

    // Enhanced error categorization
    let errorCode = 'unknown';
    let userMessage = 'Purchase failed. Please try again.';
    let retryable = false;

    const message = error.message?.toLowerCase() || '';
    
    // Map specific error types
    if (message.includes('user cancel') || error.code === 'USER_CANCELLED') {
      errorCode = 'user_cancelled';
      userMessage = 'Purchase was cancelled';
      retryable = false;
    } else if (message.includes('network') || message.includes('connection') || message.includes('timeout')) {
      errorCode = 'network_error';
      userMessage = 'Network connection issue. Please check your internet and try again.';
      retryable = true;
    } else if (message.includes('payment') && message.includes('pending')) {
      errorCode = 'payment_pending';
      userMessage = 'Payment is being processed. Please wait a moment.';
      retryable = false;
    } else if (message.includes('receipt') && message.includes('use')) {
      errorCode = 'receipt_in_use';
      userMessage = 'This purchase has already been processed';
      retryable = false;
    } else if (message.includes('invalid') && message.includes('receipt')) {
      errorCode = 'invalid_receipt';
      userMessage = 'Invalid purchase receipt. Please try again.';
      retryable = true;
    } else if (message.includes('store') || message.includes('billing') || message.includes('unavailable')) {
      errorCode = 'store_problem';
      userMessage = 'Store is temporarily unavailable. Please try again later.';
      retryable = true;
    } else if (message.includes('product') && message.includes('not found')) {
      errorCode = 'product_not_found';
      userMessage = 'This subscription is not available. Please try a different plan.';
      retryable = false;
    } else if (message.includes('account') || message.includes('subscription')) {
      errorCode = 'account_issue';
      userMessage = 'There was an issue with your account. Please contact support.';
      retryable = false;
    } else {
      retryable = true; // Default to retryable for unknown errors
    }

    // Track purchase failure
    if (typeof gtag !== 'undefined') {
      gtag('event', 'purchase_failed', {
        product_id: productId,
        error_code: errorCode,
        error_message: error.message,
        retryable,
        environment: isSandboxEnvironment() ? 'sandbox' : 'production'
      });
    }

    return {
      success: false,
      error: userMessage,
      errorCode,
      retryable,
      userCancelled: errorCode === 'user_cancelled',
      originalError: error.message,
      details: errorInfo
    };
  }
};

/**
 * Purchase with automatic retry logic
 */
export const purchaseWithRetry = async (productId, maxRetries = 2, baseDelay = 1000) => {
  let lastResult = null;
  
  for (let attempt = 1; attempt <= maxRetries + 1; attempt++) {
    console.log(`🔄 Purchase attempt ${attempt}/${maxRetries + 1} for ${productId}`);
    
    const result = await purchaseSubscription(productId);
    
    if (result.success) {
      // Track successful retry if this wasn't the first attempt
      if (attempt > 1 && typeof gtag !== 'undefined') {
        gtag('event', 'purchase_retry_success', {
          product_id: productId,
          successful_attempt: attempt
        });
      }
      return result;
    }
    
    lastResult = result;
    
    // Don't retry if user cancelled or if error is not retryable
    if (!result.retryable || result.userCancelled) {
      console.log('🚫 Not retrying due to error type:', result.errorCode);
      break;
    }
    
    // Don't retry on last attempt
    if (attempt > maxRetries) {
      console.log('🚫 Maximum retry attempts reached');
      break;
    }
    
    // Exponential backoff with jitter
    const delay = Math.min(baseDelay * Math.pow(2, attempt - 1), 10000) + Math.random() * 1000;
    console.log(`⏳ Waiting ${Math.round(delay)}ms before retry...`);
    
    await new Promise(resolve => setTimeout(resolve, delay));
    
    // Track retry attempt
    if (typeof gtag !== 'undefined') {
      gtag('event', 'purchase_retry_attempted', {
        product_id: productId,
        attempt,
        delay: Math.round(delay)
      });
    }
  }
  
  return lastResult || { success: false, error: 'Maximum retry attempts exceeded' };
};

/**
 * Enhanced subscription status checking with caching
 */
export const checkSubscriptionStatus = async (useCache = true) => {
  try {
    await ensureInitialized('check_subscription_status');

    // Check cache first
    if (useCache && customerInfoCache && (Date.now() - customerInfoCacheTime) < CACHE_TTL) {
      console.log('📦 Using cached customer info for subscription status');
      
      const cachedResult = {
        hasSubscription: customerInfoCache.entitlements.active[ENTITLEMENT_ID] !== undefined,
        customerInfo: customerInfoCache,
        activeEntitlements: customerInfoCache.entitlements.active
      };
      
      return cachedResult;
    }

    console.log('🔍 Checking subscription status...');
    const customerInfo = await Purchases.getCustomerInfo();
    
    if (!customerInfo) {
      throw new Error('Customer info is null');
    }

    // Check for active entitlement
    const activeEntitlements = customerInfo.entitlements.active;
    const hasSubscription = activeEntitlements[ENTITLEMENT_ID] !== undefined;
    
    let subscriptionDetails = null;
    
    if (hasSubscription) {
      const entitlement = activeEntitlements[ENTITLEMENT_ID];
      subscriptionDetails = {
        entitlementId: ENTITLEMENT_ID,
        productIdentifier: entitlement.productIdentifier,
        purchaseDate: entitlement.latestPurchaseDate,
        expirationDate: entitlement.expirationDate,
        willRenew: entitlement.willRenew,
        isActive: entitlement.isActive,
        isSandbox: entitlement.isSandbox,
        store: entitlement.store
      };
    }

    // Update cache
    customerInfoCache = customerInfo;
    customerInfoCacheTime = Date.now();

    // Track status check
    if (typeof gtag !== 'undefined') {
      gtag('event', 'subscription_status_checked', {
        has_subscription: hasSubscription,
        product_identifier: subscriptionDetails?.productIdentifier,
        is_active: subscriptionDetails?.isActive,
        will_renew: subscriptionDetails?.willRenew
      });
    }

    const result = {
      hasSubscription,
      customerInfo,
      activeEntitlements,
      subscriptionDetails
    };

    console.log('✅ Subscription status checked:', {
      hasSubscription,
      activeEntitlements: Object.keys(activeEntitlements),
      subscriptionDetails: subscriptionDetails ? {
        productId: subscriptionDetails.productIdentifier,
        willRenew: subscriptionDetails.willRenew,
        isActive: subscriptionDetails.isActive
      } : null
    });

    return result;

  } catch (error) {
    trackError(error, 'check_subscription_status');
    
    return { 
      hasSubscription: false, 
      error: error.message || 'Failed to check subscription status',
      customerInfo: null,
      activeEntitlements: {},
      subscriptionDetails: null
    };
  }
};

/**
 * Enhanced restore purchases with comprehensive error handling
 */
export const restorePurchases = async () => {
  try {
    await ensureInitialized('restore_purchases');

    console.log('🔄 Restoring purchases...');

    if (typeof gtag !== 'undefined') {
      gtag('event', 'restore_attempted');
    }

    const customerInfo = await Purchases.restorePurchases();
    
    if (!customerInfo) {
      throw new Error('Restore result is null');
    }
    
    const hasActiveSubscriptions = Object.keys(customerInfo.entitlements.active).length > 0;
    const entitlementIds = Object.keys(customerInfo.entitlements.active);

    // Update cache
    customerInfoCache = customerInfo;
    customerInfoCacheTime = Date.now();

    console.log('✅ Purchases restored:', {
      hasActiveSubscriptions,
      entitlementIds
    });

    if (typeof gtag !== 'undefined') {
      gtag('event', 'restore_completed', {
        has_active_subscriptions: hasActiveSubscriptions,
        entitlement_count: entitlementIds.length
      });
    }

    return {
      success: true,
      customerInfo,
      hasActiveSubscriptions,
      entitlementIds
    };

  } catch (error) {
    trackError(error, 'restore_purchases');

    return {
      success: false,
      error: error.message || 'Failed to restore purchases'
    };
  }
};

/**
 * Safe logout with comprehensive cleanup
 */
export const logOutRevenueCat = async () => {
  try {
    if (!isConfigured) {
      console.log('⚠️ RevenueCat not configured, skipping logout');
      return;
    }

    console.log('👋 Logging out RevenueCat user...');

    await Purchases.logOut();
    
    // Clear all caches
    offeringsCache = null;
    offeringsCacheTime = 0;
    customerInfoCache = null;
    customerInfoCacheTime = 0;
    
    // Generate new anonymous ID
    localStorage.removeItem('revenuecat_anonymous_id');
    const newAnonymousId = generateAnonymousUserId();

    if (typeof gtag !== 'undefined') {
      gtag('event', 'user_logged_out');
    }

    console.log('✅ User logged out successfully, new anonymous ID:', newAnonymousId);

  } catch (error) {
    trackError(error, 'logout');
    console.error('❌ Failed to log out RevenueCat user:', error);
  }
};

/**
 * Get subscription pricing for display with enhanced validation
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
      
      // Validate package data
      if (!pkg.product.priceString || typeof pkg.product.price !== 'number') {
        console.warn(`⚠️ Invalid pricing data for product ${productId}`);
        return;
      }
      
      const priceInfo = {
        price: pkg.product.price,
        priceString: pkg.product.priceString,
        currencyCode: pkg.product.currencyCode || 'USD',
        identifier: productId,
        title: pkg.product.title || productId,
        description: pkg.product.description || ''
      };
      
      if (productId === PRODUCT_IDS.MONTHLY) {
        pricing.monthly = priceInfo;
      } else if (productId === PRODUCT_IDS.ANNUAL) {
        pricing.annual = priceInfo;
      }
    });
    
    console.log('💰 Pricing retrieved:', {
      monthly: pricing.monthly?.priceString || 'Not available',
      annual: pricing.annual?.priceString || 'Not available'
    });
    
    return pricing;
  } catch (error) {
    trackError(error, 'get_pricing');
    console.error('❌ Failed to get pricing:', error);
    return { monthly: null, annual: null };
  }
};

/**
 * Get current customer info with caching
 */
export const getCustomerInfo = async (useCache = true) => {
  try {
    await ensureInitialized('get_customer_info');
    
    // Check cache
    if (useCache && customerInfoCache && (Date.now() - customerInfoCacheTime) < CACHE_TTL) {
      return customerInfoCache;
    }
    
    const customerInfo = await Purchases.getCustomerInfo();
    
    // Update cache
    customerInfoCache = customerInfo;
    customerInfoCacheTime = Date.now();
    
    return customerInfo;
  } catch (error) {
    trackError(error, 'get_customer_info');
    throw error;
  }
};

/**
 * Development and testing utilities
 */
export const revenueCatDevTools = {
  // Get current status and debug info
  getStatus: () => ({
    isConfigured,
    isConfiguring,
    configurationRetries,
    lastConfigurationAttempt,
    environment: isSandboxEnvironment() ? 'sandbox' : 'production',
    cacheStatus: {
      offerings: {
        cached: !!offeringsCache,
        age: offeringsCache ? Date.now() - offeringsCacheTime : 0
      },
      customerInfo: {
        cached: !!customerInfoCache,
        age: customerInfoCache ? Date.now() - customerInfoCacheTime : 0
      }
    },
    lastErrors: lastErrors.slice(0, 5), // Show last 5 errors
    validation: validateConfiguration()
  }),

  // Clear all caches and reinitialize
  reset: async () => {
    console.log('🔄 Resetting RevenueCat completely...');
    
    // Reset state
    isConfigured = false;
    isConfiguring = false;
    configurationPromise = null;
    configurationRetries = 0;
    lastConfigurationAttempt = 0;
    
    // Clear caches
    offeringsCache = null;
    offeringsCacheTime = 0;
    customerInfoCache = null;
    customerInfoCacheTime = 0;
    
    // Clear local storage
    localStorage.removeItem('revenuecat_anonymous_id');
    
    // Clear error history
    lastErrors = [];
    
    return await initializeRevenueCat(true);
  },

  // Validate current configuration
  validate: async () => {
    const config = validateConfiguration();
    
    if (isConfigured) {
      try {
        const customerInfo = await getCustomerInfo(false);
        const offerings = await getOfferings(false);
        
        return {
          ...config,
          runtime: {
            customerInfoValid: !!customerInfo,
            offeringsValid: !!offerings,
            hasCurrentOffering: !!offerings?.current,
            packageCount: offerings?.current?.availablePackages?.length || 0
          }
        };
      } catch (error) {
        return {
          ...config,
          runtime: {
            error: error.message
          }
        };
      }
    }
    
    return config;
  },

  // Get comprehensive debug information
  getDebugInfo: async () => {
    try {
      const status = revenueCatDevTools.getStatus();
      const validation = await revenueCatDevTools.validate();
      
      let runtimeInfo = null;
      if (isConfigured) {
        try {
          const [customerInfo, offerings, pricing] = await Promise.allSettled([
            getCustomerInfo(false),
            getOfferings(false),
            getSubscriptionPricing()
          ]);
          
          runtimeInfo = {
            customerInfo: customerInfo.status === 'fulfilled' ? {
              hasActiveEntitlements: Object.keys(customerInfo.value.entitlements.active).length > 0,
              entitlements: Object.keys(customerInfo.value.entitlements.active)
            } : { error: customerInfo.reason?.message },
            offerings: offerings.status === 'fulfilled' ? {
              productCount: offerings.value.current.availablePackages.length,
              productIds: offerings.value.current.availablePackages.map(p => p.product.identifier)
            } : { error: offerings.reason?.message },
            pricing: pricing.status === 'fulfilled' ? pricing.value : { error: pricing.reason?.message }
          };
        } catch (error) {
          runtimeInfo = { error: error.message };
        }
      }
      
      return {
        status,
        validation,
        runtime: runtimeInfo,
        environment: {
          userAgent: navigator.userAgent,
          url: window.location.href,
          timestamp: new Date().toISOString()
        }
      };
    } catch (error) {
      return { error: error.message };
    }
  },

  // Clear caches only
  clearCaches: () => {
    offeringsCache = null;
    offeringsCacheTime = 0;
    customerInfoCache = null;
    customerInfoCacheTime = 0;
    console.log('🗑️ RevenueCat caches cleared');
  },

  // Get error history
  getErrorHistory: () => lastErrors,

  // Test purchase flow (sandbox only)
  testPurchaseFlow: async (productId = PRODUCT_IDS.MONTHLY) => {
    if (!isSandboxEnvironment()) {
      throw new Error('Test purchase flow only available in sandbox environment');
    }
    
    console.log('🧪 Testing purchase flow for:', productId);
    
    try {
      // Test offerings fetch
      const offerings = await getOfferings(false);
      console.log('✅ Offerings fetch test passed');
      
      // Test product availability
      const targetPackage = offerings.current.availablePackages.find(
        pkg => pkg.product.identifier === productId
      );
      
      if (!targetPackage) {
        throw new Error(`Product ${productId} not found in offerings`);
      }
      
      console.log('✅ Product availability test passed');
      
      // Note: Don't actually attempt purchase in test
      return {
        success: true,
        tests: [
          'offerings_fetch',
          'product_availability'
        ],
        productInfo: {
          id: targetPackage.product.identifier,
          price: targetPackage.product.priceString,
          title: targetPackage.product.title
        }
      };
      
    } catch (error) {
      return {
        success: false,
        error: error.message,
        tests: ['failed']
      };
    }
  }
};

// Export development tools in development mode only
if (isSandboxEnvironment()) {
  window.revenueCatDevTools = revenueCatDevTools;
  console.log('🛠️ RevenueCat dev tools available at window.revenueCatDevTools');
}

// Export all public functions
export {
  validateConfiguration as validateRevenueCatConfiguration,
  ensureInitialized,
  trackError
};