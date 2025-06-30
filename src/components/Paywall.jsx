import React, { useState, useEffect } from 'react';
import { Check, Zap, Brain, Target, BarChart3, BookOpen, Sparkles, Crown, Loader2, AlertCircle, RefreshCw, Settings, Info } from 'lucide-react';
import Card from './Card';
import Button from './Button';
import { 
  purchaseWithRetry, 
  getOfferings, 
  PRODUCT_IDS,
  checkSubscriptionStatus,
  isSandboxEnvironment,
  validateRevenueCatConfiguration,
  getSubscriptionPricing,
  initializeRevenueCat,
  revenueCatDevTools,
  ensureInitialized
} from '../lib/revenuecat';

const Paywall = ({ onSubscribe, onSubscriptionSuccess }) => {
  const [selectedPlan, setSelectedPlan] = useState('annual');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [offerings, setOfferings] = useState(null);
  const [loadingOfferings, setLoadingOfferings] = useState(true);
  const [retryCount, setRetryCount] = useState(0);
  const [pricing, setPricing] = useState({ monthly: null, annual: null });
  const [configValidation, setConfigValidation] = useState(null);
  const [showDebugInfo, setShowDebugInfo] = useState(false);
  const [debugInfo, setDebugInfo] = useState(null);
  const [initializationStatus, setInitializationStatus] = useState('pending');

  useEffect(() => {
    initializePaywall();
    
    // Enhanced environment detection and logging
    const envInfo = {
      isSandbox: isSandboxEnvironment(),
      hostname: window.location.hostname,
      port: window.location.port,
      protocol: window.location.protocol,
      mode: import.meta.env.MODE
    };
    
    console.log('💰 Paywall initialized:', envInfo);
    
    if (envInfo.isSandbox) {
      console.log('🧪 Running in sandbox mode - test purchases will not be charged');
    }
  }, []);

  const initializePaywall = async () => {
    try {
      setLoadingOfferings(true);
      setError(null);
      setInitializationStatus('initializing');
      
      console.log('🚀 Initializing paywall...');
      
      // Step 1: Validate configuration first
      const validation = validateRevenueCatConfiguration();
      setConfigValidation(validation);
      
      if (!validation.isValid) {
        console.error('❌ Configuration validation failed:', validation.issues);
        setInitializationStatus('validation_failed');
        throw new Error(`Configuration issues detected: ${validation.issues.join(', ')}`);
      }
      
      console.log('✅ Configuration validation passed');
      
      // Step 2: Ensure RevenueCat is initialized
      console.log('🔧 Ensuring RevenueCat initialization...');
      const initResult = await initializeRevenueCat();
      
      if (!initResult.success) {
        setInitializationStatus('init_failed');
        throw new Error(initResult.error || 'RevenueCat initialization failed');
      }
      
      console.log('✅ RevenueCat initialization confirmed');
      setInitializationStatus('initialized');
      
      // Step 3: Load offerings and pricing with timeout
      console.log('📦 Loading offerings and pricing...');
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Request timeout after 30 seconds')), 30000)
      );
      
      const [offeringsData, pricingData] = await Promise.race([
        Promise.all([
          getOfferings(false), // Always fetch fresh for paywall
          getSubscriptionPricing()
        ]),
        timeoutPromise
      ]);
      
      // Step 4: Validate loaded data
      if (!offeringsData?.current?.availablePackages?.length) {
        setInitializationStatus('no_products');
        throw new Error('No subscription products are available');
      }
      
      // Check if our expected products are available
      const availableProductIds = offeringsData.current.availablePackages.map(pkg => pkg.product.identifier);
      const missingProducts = Object.values(PRODUCT_IDS).filter(id => !availableProductIds.includes(id));
      
      if (missingProducts.length === Object.values(PRODUCT_IDS).length) {
        setInitializationStatus('products_missing');
        throw new Error(`No expected products found. Available: ${availableProductIds.join(', ')}`);
      }
      
      if (missingProducts.length > 0) {
        console.warn('⚠️ Some expected products are missing:', missingProducts);
      }
      
      // Step 5: Set state with validated data
      setOfferings(offeringsData);
      setPricing(pricingData);
      setInitializationStatus('ready');
      
      console.log('✅ Paywall initialization complete:', {
        productCount: offeringsData.current.availablePackages.length,
        availableProducts: availableProductIds,
        missingProducts,
        pricing: {
          monthly: pricingData.monthly?.priceString || 'Not available',
          annual: pricingData.annual?.priceString || 'Not available'
        }
      });
      
    } catch (error) {
      console.error('❌ Paywall initialization failed:', error);
      
      // Enhanced error categorization
      let errorMessage = 'Failed to load subscription options.';
      let errorCategory = 'unknown';
      
      const message = error.message.toLowerCase();
      
      if (message.includes('configuration')) {
        errorCategory = 'configuration';
        errorMessage = 'Subscription service is not properly configured. Please try again later.';
      } else if (message.includes('network') || message.includes('connection') || message.includes('timeout')) {
        errorCategory = 'network';
        errorMessage = 'Network connection issue. Please check your internet and try again.';
      } else if (message.includes('initialization')) {
        errorCategory = 'initialization';
        errorMessage = 'Failed to initialize payment system. Please refresh the page.';
      } else if (message.includes('no products') || message.includes('not available')) {
        errorCategory = 'products';
        errorMessage = 'No subscription plans are currently available. Please try again later.';
      } else if (message.includes('products_missing')) {
        errorCategory = 'products_missing';
        errorMessage = 'Subscription plans are not properly configured. Please contact support.';
      } else if (message.includes('validation')) {
        errorCategory = 'validation';
        errorMessage = error.message;
      }
      
      setError(errorMessage);
      setInitializationStatus(`failed_${errorCategory}`);
      
      // Track error for analytics
      if (typeof gtag !== 'undefined') {
        gtag('event', 'paywall_init_failed', {
          error_category: errorCategory,
          error_message: error.message,
          retry_count: retryCount
        });
      }
    } finally {
      setLoadingOfferings(false);
    }
  };

  const handleRetryInitialization = () => {
    setRetryCount(prev => prev + 1);
    console.log(`🔄 Retrying paywall initialization (attempt ${retryCount + 1})...`);
    initializePaywall();
  };

  const handleSubscribe = async () => {
    if (loading) return;

    setLoading(true);
    setError(null);

    try {
      const productId = selectedPlan === 'annual' ? PRODUCT_IDS.ANNUAL : PRODUCT_IDS.MONTHLY;
      
      console.log('💳 Starting enhanced purchase flow:', {
        productId,
        plan: selectedPlan,
        environment: isSandboxEnvironment() ? 'sandbox' : 'production'
      });
      
      // Ensure system is ready for purchase
      await ensureInitialized('purchase_flow');
      
      // Track purchase start
      if (typeof gtag !== 'undefined') {
        gtag('event', 'purchase_started', {
          product_id: productId,
          plan_type: selectedPlan,
          environment: isSandboxEnvironment() ? 'sandbox' : 'production'
        });
      }
      
      // Use enhanced retry logic with better error handling
      const result = await purchaseWithRetry(productId, 2, 1500);

      if (result.success) {
        console.log('✅ Purchase successful:', {
          productId,
          hasEntitlement: result.hasEntitlement,
          customerInfo: !!result.customerInfo
        });
        
        // Double-check subscription status with fresh data
        console.log('🔍 Verifying subscription status...');
        const status = await checkSubscriptionStatus(false); // Don't use cache
        
        if (status.hasSubscription) {
          console.log('✅ Subscription confirmed active');
          
          // Track successful purchase
          if (typeof gtag !== 'undefined') {
            gtag('event', 'purchase_success', {
              product_id: productId,
              plan_type: selectedPlan,
              has_entitlement: status.hasSubscription
            });
          }
          
          // Call success callbacks
          onSubscriptionSuccess?.(result.customerInfo, selectedPlan);
          onSubscribe?.(selectedPlan);
        } else {
          console.error('⚠️ Purchase succeeded but subscription not active');
          throw new Error('Purchase completed but subscription activation failed. Please contact support if you were charged.');
        }
      } else {
        if (result.userCancelled) {
          console.log('ℹ️ User cancelled purchase');
          // Don't show error for user cancellation
          if (typeof gtag !== 'undefined') {
            gtag('event', 'purchase_cancelled', {
              product_id: productId,
              plan_type: selectedPlan
            });
          }
        } else {
          console.error('❌ Purchase failed:', result);
          setError(result.error || 'Failed to process subscription. Please try again.');
          
          // Track purchase failure
          if (typeof gtag !== 'undefined') {
            gtag('event', 'purchase_failed', {
              product_id: productId,
              plan_type: selectedPlan,
              error_code: result.errorCode,
              error_message: result.error
            });
          }
        }
      }
    } catch (error) {
      console.error('❌ Subscription error:', error);
      const errorMessage = error.message || 'An unexpected error occurred. Please try again.';
      setError(errorMessage);
      
      // Track unexpected errors
      if (typeof gtag !== 'undefined') {
        gtag('event', 'purchase_unexpected_error', {
          error_message: errorMessage,
          plan_type: selectedPlan
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDebugReset = async () => {
    if (!isSandboxEnvironment()) return;
    
    try {
      setLoadingOfferings(true);
      setDebugInfo(null);
      console.log('🧪 Debug reset initiated...');
      
      const resetResult = await revenueCatDevTools.reset();
      console.log('🧪 Debug reset completed:', resetResult);
      
      await initializePaywall();
    } catch (error) {
      console.error('❌ Debug reset failed:', error);
      setError('Debug reset failed: ' + error.message);
    }
  };

  const handleLoadDebugInfo = async () => {
    if (!isSandboxEnvironment()) return;
    
    try {
      console.log('🔍 Loading debug information...');
      const info = await revenueCatDevTools.getDebugInfo();
      setDebugInfo(info);
      console.log('🔍 Debug info loaded:', info);
    } catch (error) {
      console.error('❌ Failed to load debug info:', error);
    }
  };

  const premiumFeatures = [
    {
      icon: Zap,
      title: 'Unlimited, continuous coaching dialogue',
      description: 'Never-ending personalized guidance tailored to your unique profile'
    },
    {
      icon: Brain,
      title: 'Full access to the diagnostic engine (ET→SDT→GST)',
      description: 'Deep psychological insights using Evidence-based Therapy principles'
    },
    {
      icon: Target,
      title: 'Personalized, evidence-based interventions',
      description: 'Custom strategies designed specifically for your motivational profile'
    },
    {
      icon: BarChart3,
      title: 'Unlimited goal setting and tracking',
      description: 'Set, monitor, and achieve as many goals as you want'
    },
    {
      icon: Sparkles,
      title: 'Advanced "Data Storytelling" progress summaries',
      description: 'Beautiful, insightful reports that show your growth over time'
    },
    {
      icon: BookOpen,
      title: 'Access to all specialized coaching playbooks',
      description: 'Comprehensive guides for every aspect of personal development'
    }
  ];

  // Enhanced pricing display with better fallbacks
  const getPricingDisplay = () => {
    const fallbackPricing = {
      annual: { price: '$119.99', monthlyEquivalent: '$9.99' },
      monthly: { price: '$19.99' }
    };

    if (pricing.annual && pricing.monthly) {
      return {
        annual: {
          price: pricing.annual.priceString || fallbackPricing.annual.price,
          monthlyEquivalent: pricing.annual.price 
            ? `$${(pricing.annual.price / 12).toFixed(2)}`
            : fallbackPricing.annual.monthlyEquivalent
        },
        monthly: {
          price: pricing.monthly.priceString || fallbackPricing.monthly.price
        }
      };
    }
    
    return fallbackPricing;
  };

  const displayPricing = getPricingDisplay();

  // Enhanced loading state with progress indication
  if (loadingOfferings) {
    return (
      <div 
        className="min-h-screen flex items-center justify-center font-inter"
        style={{ backgroundColor: '#0f172a' }}
      >
        <div className="text-center space-y-6 max-w-md mx-auto px-6">
          <Loader2 
            className="w-12 h-12 animate-spin mx-auto"
            style={{ color: '#f97316' }}
          />
          <div>
            <h2 
              className="text-xl font-bold mb-2"
              style={{ color: '#f1f5f9' }}
            >
              Loading Subscription Options
            </h2>
            <p 
              className="text-base mb-4"
              style={{ color: '#94a3b8' }}
            >
              {initializationStatus === 'pending' && 'Starting initialization...'}
              {initializationStatus === 'initializing' && 'Configuring payment system...'}
              {initializationStatus === 'initialized' && 'Loading subscription plans...'}
              {initializationStatus.startsWith('failed_') && 'Initialization failed, please wait...'}
            </p>
            
            {retryCount > 0 && (
              <p 
                className="text-sm"
                style={{ color: '#64748b' }}
              >
                Retry attempt: {retryCount}
              </p>
            )}
            
            {/* Progress indicator */}
            <div className="w-full bg-gray-700 rounded-full h-2 mt-4">
              <div 
                className="bg-orange-500 h-2 rounded-full transition-all duration-1000"
                style={{
                  width: initializationStatus === 'pending' ? '10%' :
                         initializationStatus === 'initializing' ? '40%' :
                         initializationStatus === 'initialized' ? '70%' :
                         initializationStatus === 'ready' ? '100%' : '10%'
                }}
              />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Enhanced error state with better debugging and recovery options
  if (error && !offerings) {
    return (
      <div 
        className="min-h-screen flex items-center justify-center font-inter p-6"
        style={{ backgroundColor: '#0f172a' }}
      >
        <div className="text-center space-y-6 max-w-lg mx-auto">
          <AlertCircle 
            className="w-16 h-16 mx-auto"
            style={{ color: '#ef4444' }}
          />
          <div>
            <h2 
              className="text-2xl font-bold mb-4"
              style={{ color: '#f1f5f9' }}
            >
              Unable to Load Subscription Options
            </h2>
            <p 
              className="text-base mb-6"
              style={{ color: '#94a3b8' }}
            >
              {error}
            </p>
            
            {/* Initialization status indicator */}
            <div 
              className="text-left p-4 rounded-lg mb-6"
              style={{ backgroundColor: '#1e293b', color: '#94a3b8' }}
            >
              <p className="font-medium mb-2">Status: {initializationStatus}</p>
              {configValidation && !configValidation.isValid && (
                <div className="space-y-1">
                  <p className="text-sm font-medium text-red-400">Configuration Issues:</p>
                  <ul className="text-xs list-disc list-inside text-red-300">
                    {configValidation.issues.map((issue, index) => (
                      <li key={index}>{issue}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
          
          <div className="space-y-3">
            <Button
              variant="accent"
              onClick={handleRetryInitialization}
              disabled={loadingOfferings}
              className="flex items-center space-x-2"
              style={{ backgroundColor: '#f97316' }}
            >
              <RefreshCw className={`w-4 h-4 ${loadingOfferings ? 'animate-spin' : ''}`} />
              <span>{loadingOfferings ? 'Retrying...' : 'Try Again'}</span>
            </Button>
            
            {/* Debug tools in sandbox */}
            {isSandboxEnvironment() && (
              <div className="flex space-x-2 justify-center">
                <Button
                  variant="secondary"
                  onClick={handleDebugReset}
                  disabled={loadingOfferings}
                  className="flex items-center space-x-2 text-sm"
                >
                  <Settings className="w-4 h-4" />
                  <span>Debug Reset</span>
                </Button>
                <Button
                  variant="secondary"
                  onClick={handleLoadDebugInfo}
                  disabled={loadingOfferings}
                  className="flex items-center space-x-2 text-sm"
                >
                  <Info className="w-4 h-4" />
                  <span>Debug Info</span>
                </Button>
              </div>
            )}
          </div>
          
          {/* Debug information display */}
          {debugInfo && (
            <div 
              className="text-left p-4 rounded-lg text-xs overflow-auto max-h-64"
              style={{ backgroundColor: '#1f2937', color: '#d1d5db' }}
            >
              <pre>{JSON.stringify(debugInfo, null, 2)}</pre>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div 
      className="min-h-screen flex flex-col items-center justify-center font-inter p-6"
      style={{ backgroundColor: '#0f172a' }}
    >
      <div className="max-w-5xl mx-auto w-full space-y-12">
        {/* Environment and Debug Indicators */}
        {isSandboxEnvironment() && (
          <div className="space-y-2">
            <div 
              className="max-w-2xl mx-auto p-4 rounded-lg border text-center"
              style={{ 
                backgroundColor: '#fef3c7', 
                borderColor: '#f59e0b',
                color: '#92400e'
              }}
            >
              <div className="flex items-center justify-center space-x-2">
                <span className="text-sm font-medium">
                  🧪 Sandbox Environment - Test purchases will not be charged
                </span>
                <button
                  onClick={() => setShowDebugInfo(!showDebugInfo)}
                  className="text-xs px-2 py-1 rounded bg-amber-200 hover:bg-amber-300 transition-colors"
                >
                  {showDebugInfo ? 'Hide' : 'Show'} Debug
                </button>
              </div>
            </div>
            
            {/* Enhanced Debug Info Panel */}
            {showDebugInfo && (
              <div 
                className="max-w-2xl mx-auto p-4 rounded-lg text-left text-xs space-y-2"
                style={{ backgroundColor: '#1f2937', color: '#d1d5db' }}
              >
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p><strong>Status:</strong> {initializationStatus}</p>
                    <p><strong>Retry Count:</strong> {retryCount}</p>
                    <p><strong>Products:</strong> {offerings?.current?.availablePackages?.length || 0}</p>
                  </div>
                  <div>
                    <p><strong>Monthly:</strong> {pricing.monthly?.priceString || 'N/A'}</p>
                    <p><strong>Annual:</strong> {pricing.annual?.priceString || 'N/A'}</p>
                    <p><strong>Config Valid:</strong> {configValidation?.isValid ? '✅' : '❌'}</p>
                  </div>
                </div>
                
                {configValidation && !configValidation.isValid && (
                  <div className="pt-2 border-t border-gray-600">
                    <p><strong>Issues:</strong></p>
                    <ul className="list-disc list-inside text-red-300">
                      {configValidation.issues.map((issue, index) => (
                        <li key={index}>{issue}</li>
                      ))}
                    </ul>
                  </div>
                )}
                
                <div className="flex space-x-2 pt-2">
                  <button
                    onClick={handleLoadDebugInfo}
                    className="px-2 py-1 bg-blue-600 hover:bg-blue-700 rounded text-white transition-colors"
                  >
                    Load Debug Info
                  </button>
                  <button
                    onClick={handleDebugReset}
                    className="px-2 py-1 bg-red-600 hover:bg-red-700 rounded text-white transition-colors"
                  >
                    Reset SDK
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Header Section */}
        <div className="text-center space-y-6">
          <div className="flex justify-center mb-6">
            <div 
              className="w-16 h-16 rounded-full flex items-center justify-center shadow-2xl"
              style={{ backgroundColor: '#f97316' }}
            >
              <Crown className="w-8 h-8 text-white" />
            </div>
          </div>
          
          <div className="space-y-4">
            <h1 
              className="text-4xl md:text-6xl font-bold leading-tight"
              style={{ color: '#f1f5f9' }}
            >
              Unlock Your Full Potential
            </h1>
            <p 
              className="text-lg md:text-xl leading-relaxed max-w-3xl mx-auto"
              style={{ color: '#94a3b8' }}
            >
              The free snapshot was just the beginning. Unlock the continuous coaching relationship to diagnose why you're stuck and build a personalized plan to move forward.
            </p>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="max-w-2xl mx-auto">
            <div 
              className="p-4 rounded-lg flex items-start space-x-3"
              style={{ backgroundColor: '#fee2e2', border: '1px solid #fecaca' }}
            >
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-red-800 font-medium">Subscription Error</p>
                <p className="text-red-700 text-sm">{error}</p>
                {initializationStatus.startsWith('failed_') && (
                  <button
                    onClick={handleRetryInitialization}
                    className="mt-2 text-xs text-red-600 hover:text-red-800 underline"
                  >
                    Try again
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Subscription Plans */}
        <div className="space-y-8">
          <div className="text-center">
            <h2 
              className="text-2xl font-bold mb-2"
              style={{ color: '#f1f5f9' }}
            >
              Choose Your Plan
            </h2>
            <p 
              className="text-base"
              style={{ color: '#64748b' }}
            >
              Start your 7-day free trial, then continue with the plan that works for you
            </p>
          </div>

          {/* Plan Cards */}
          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {/* Annual Plan - Recommended */}
            <div className="relative">
              <div 
                className="absolute -top-4 left-1/2 transform -translate-x-1/2 z-10"
              >
                <div 
                  className="px-4 py-2 rounded-full text-white text-sm font-bold shadow-lg"
                  style={{ backgroundColor: '#f97316' }}
                >
                  🏆 Save 50%
                </div>
              </div>

              <div
                className={`
                  relative p-8 rounded-xl transition-all duration-300 cursor-pointer
                  ${selectedPlan === 'annual' 
                    ? 'ring-4 ring-orange-500 shadow-2xl transform scale-105' 
                    : 'shadow-lg hover:shadow-xl hover:scale-102'
                  }
                  ${loading ? 'opacity-75 cursor-not-allowed' : ''}
                `}
                style={{
                  backgroundColor: '#1e293b',
                  border: selectedPlan === 'annual' 
                    ? '2px solid #f97316' 
                    : '1px solid #334155'
                }}
                onClick={() => !loading && setSelectedPlan('annual')}
              >
                <div className="space-y-6">
                  <div className="text-center">
                    <h3 
                      className="text-2xl font-bold mb-2"
                      style={{ color: '#f1f5f9' }}
                    >
                      Annual Plan
                    </h3>
                    <p 
                      className="text-sm"
                      style={{ color: '#94a3b8' }}
                    >
                      Best value for committed growth
                    </p>
                  </div>

                  <div className="text-center space-y-2">
                    <div className="flex items-baseline justify-center space-x-2">
                      <span 
                        className="text-5xl font-bold"
                        style={{ color: '#f97316' }}
                      >
                        {displayPricing.annual.price}
                      </span>
                      <span 
                        className="text-xl font-medium"
                        style={{ color: '#94a3b8' }}
                      >
                        /year
                      </span>
                    </div>
                    <p 
                      className="text-lg font-medium"
                      style={{ color: '#f1f5f9' }}
                    >
                      (Just {displayPricing.annual.monthlyEquivalent}/month)
                    </p>
                  </div>

                  <div className="text-center">
                    <div 
                      className={`
                        w-6 h-6 rounded-full border-2 mx-auto flex items-center justify-center transition-all duration-200
                        ${selectedPlan === 'annual' 
                          ? 'bg-orange-500 border-orange-500' 
                          : 'border-slate-400'
                        }
                      `}
                    >
                      {selectedPlan === 'annual' && (
                        <Check className="w-4 h-4 text-white" strokeWidth={3} />
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Monthly Plan */}
            <div
              className={`
                p-8 rounded-xl transition-all duration-300 cursor-pointer
                ${selectedPlan === 'monthly' 
                  ? 'ring-4 ring-orange-500 shadow-2xl transform scale-105' 
                  : 'shadow-lg hover:shadow-xl hover:scale-102'
                }
                ${loading ? 'opacity-75 cursor-not-allowed' : ''}
              `}
              style={{
                backgroundColor: '#1e293b',
                border: selectedPlan === 'monthly' 
                  ? '2px solid #f97316' 
                  : '1px solid #334155'
              }}
              onClick={() => !loading && setSelectedPlan('monthly')}
            >
              <div className="space-y-6">
                <div className="text-center">
                  <h3 
                    className="text-2xl font-bold mb-2"
                    style={{ color: '#f1f5f9' }}
                  >
                    Monthly Plan
                  </h3>
                  <p 
                    className="text-sm"
                    style={{ color: '#94a3b8' }}
                  >
                    Flexible month-to-month billing
                  </p>
                </div>

                <div className="text-center space-y-2">
                  <div className="flex items-baseline justify-center space-x-2">
                    <span 
                      className="text-5xl font-bold"
                      style={{ color: '#f97316' }}
                    >
                      {displayPricing.monthly.price}
                    </span>
                    <span 
                      className="text-xl font-medium"
                      style={{ color: '#94a3b8' }}
                    >
                      /month
                    </span>
                  </div>
                  <p 
                    className="text-lg font-medium"
                    style={{ color: '#f1f5f9' }}
                  >
                    Billed monthly
                  </p>
                  <p 
                    className="text-sm"
                    style={{ color: '#64748b' }}
                  >
                    Cancel anytime
                  </p>
                </div>

                <div className="text-center">
                  <div 
                    className={`
                      w-6 h-6 rounded-full border-2 mx-auto flex items-center justify-center transition-all duration-200
                      ${selectedPlan === 'monthly' 
                        ? 'bg-orange-500 border-orange-500' 
                        : 'border-slate-400'
                      }
                    `}
                  >
                    {selectedPlan === 'monthly' && (
                      <Check className="w-4 h-4 text-white" strokeWidth={3} />
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Premium Features */}
        <div className="space-y-8">
          <div className="text-center">
            <h3 
              className="text-2xl font-bold mb-4"
              style={{ color: '#f1f5f9' }}
            >
              Everything You Get
            </h3>
            <p 
              className="text-base"
              style={{ color: '#64748b' }}
            >
              Unlock the full power of your adaptive coaching experience
            </p>
          </div>

          <div className="max-w-3xl mx-auto space-y-6">
            {premiumFeatures.map((feature, index) => {
              const IconComponent = feature.icon;
              return (
                <div
                  key={index}
                  className="flex items-start space-x-4 p-6 rounded-xl transition-all duration-300 hover:scale-102"
                  style={{
                    backgroundColor: '#1e293b',
                    border: '1px solid #334155'
                  }}
                >
                  <div 
                    className="flex-shrink-0 w-12 h-12 rounded-lg flex items-center justify-center"
                    style={{ backgroundColor: '#f97316' }}
                  >
                    <IconComponent className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1 space-y-2">
                    <h4 
                      className="text-lg font-semibold"
                      style={{ color: '#f1f5f9' }}
                    >
                      {feature.title}
                    </h4>
                    <p 
                      className="text-sm leading-relaxed"
                      style={{ color: '#94a3b8' }}
                    >
                      {feature.description}
                    </p>
                  </div>
                  <div className="flex-shrink-0">
                    <Check 
                      className="w-6 h-6"
                      style={{ color: '#10b981' }}
                      strokeWidth={2}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Call to Action */}
        <div className="text-center space-y-6">
          <div className="max-w-2xl mx-auto">
            <Button
              variant="accent"
              size="large"
              onClick={handleSubscribe}
              disabled={loading || !offerings}
              className="w-full text-xl py-8 font-bold shadow-2xl transform hover:scale-105 transition-all duration-300 disabled:opacity-75 disabled:cursor-not-allowed disabled:transform-none"
              style={{
                backgroundColor: loading ? '#64748b' : '#f97316',
                color: 'white',
                border: 'none'
              }}
            >
              {loading ? (
                <div className="flex items-center justify-center space-x-3">
                  <Loader2 className="w-6 h-6 animate-spin" />
                  <span>Processing...</span>
                </div>
              ) : (
                <>🚀 Start My 7-Day Free Trial</>
              )}
            </Button>
            
            <div className="mt-4 space-y-2">
              <p 
                className="text-sm font-medium"
                style={{ color: '#f1f5f9' }}
              >
                No commitment during your free trial
              </p>
              <p 
                className="text-xs"
                style={{ color: '#64748b' }}
              >
                After your 7-day free trial, you'll be charged {selectedPlan === 'annual' ? displayPricing.annual.price + '/year' : displayPricing.monthly.price + '/month'}. Cancel anytime.
              </p>
            </div>
          </div>
        </div>

        {/* Trust Indicators */}
        <div className="text-center pt-8">
          <div className="flex items-center justify-center space-x-6 text-sm" style={{ color: '#64748b' }}>
            <div className="flex items-center space-x-2">
              <div 
                className="w-4 h-4 rounded-full"
                style={{ backgroundColor: '#10b981' }}
              />
              <span>Evidence-based methods</span>
            </div>
            <div className="flex items-center space-x-2">
              <div 
                className="w-4 h-4 rounded-full"
                style={{ backgroundColor: '#10b981' }}
              />
              <span>Cancel anytime</span>
            </div>
            <div className="flex items-center space-x-2">
              <div 
                className="w-4 h-4 rounded-full"
                style={{ backgroundColor: '#10b981' }}
              />
              <span>30-day money back guarantee</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Paywall;