import React, { useState, useEffect } from 'react';
import { Check, Zap, Brain, Target, BarChart3, BookOpen, Sparkles, Crown, Loader2, AlertCircle, RefreshCw } from 'lucide-react';
import Card from './Card';
import Button from './Button';
import { 
  purchaseWithRetry, 
  getOfferings, 
  PRODUCT_IDS,
  checkSubscriptionStatus,
  isSandboxEnvironment,
  validatePurchaseEnvironment,
  getSubscriptionPricing
} from '../lib/revenuecat';

const Paywall = ({ onSubscribe, onSubscriptionSuccess }) => {
  const [selectedPlan, setSelectedPlan] = useState('annual');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [offerings, setOfferings] = useState(null);
  const [loadingOfferings, setLoadingOfferings] = useState(true);
  const [retryCount, setRetryCount] = useState(0);
  const [pricing, setPricing] = useState({ monthly: null, annual: null });

  useEffect(() => {
    loadOfferings();
    
    // Validate environment on mount
    if (isSandboxEnvironment()) {
      console.log('🧪 Running in sandbox environment - test purchases enabled');
    }
  }, []);

  const loadOfferings = async () => {
    try {
      setLoadingOfferings(true);
      setError(null);
      
      // Load both offerings and pricing
      const [offeringsData, pricingData] = await Promise.all([
        getOfferings(),
        getSubscriptionPricing()
      ]);
      
      setOfferings(offeringsData);
      setPricing(pricingData);
      
      // Validate purchase environment
      const validation = await validatePurchaseEnvironment();
      if (!validation.isValid) {
        console.warn('Purchase environment validation failed:', validation);
      }
      
    } catch (error) {
      console.error('Failed to load offerings:', error);
      setError('Failed to load subscription options. Please check your connection and try again.');
    } finally {
      setLoadingOfferings(false);
    }
  };

  const handleRetryLoadOfferings = () => {
    setRetryCount(prev => prev + 1);
    loadOfferings();
  };

  const handleSubscribe = async () => {
    if (loading) return;

    setLoading(true);
    setError(null);

    try {
      const productId = selectedPlan === 'annual' ? PRODUCT_IDS.ANNUAL : PRODUCT_IDS.MONTHLY;
      
      // Use retry logic for better reliability
      const result = await purchaseWithRetry(productId, 2);

      if (result.success) {
        console.log('Subscription purchased successfully:', result);
        
        // Verify subscription status
        const status = await checkSubscriptionStatus();
        
        if (status.hasSubscription) {
          onSubscriptionSuccess?.(result.customerInfo, selectedPlan);
          onSubscribe?.(selectedPlan);
        } else {
          throw new Error('Subscription not found after purchase');
        }
      } else {
        if (result.userCancelled) {
          console.log('User cancelled subscription purchase');
          // Don't show error for user cancellation
        } else {
          setError(result.error || 'Failed to process subscription. Please try again.');
          
          // Show retry button for retryable errors
          if (result.retryable) {
            setError(`${result.error} - You can try again.`);
          }
        }
      }
    } catch (error) {
      console.error('Subscription error:', error);
      setError(error.message || 'An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
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

  // Helper function to get pricing with fallbacks
  const getPricingDisplay = () => {
    if (pricing.annual && pricing.monthly) {
      return {
        annual: {
          price: pricing.annual.priceString || '$119.99',
          monthlyEquivalent: `$${(pricing.annual.price / 12).toFixed(2)}`
        },
        monthly: {
          price: pricing.monthly.priceString || '$19.99'
        }
      };
    }
    
    // Fallback pricing if API fails
    return {
      annual: { price: '$119.99', monthlyEquivalent: '$9.99' },
      monthly: { price: '$19.99' }
    };
  };

  const displayPricing = getPricingDisplay();

  if (loadingOfferings) {
    return (
      <div 
        className="min-h-screen flex items-center justify-center font-inter"
        style={{ backgroundColor: '#0f172a' }}
      >
        <div className="text-center space-y-4">
          <Loader2 
            className="w-8 h-8 animate-spin mx-auto"
            style={{ color: '#f97316' }}
          />
          <p 
            className="text-lg"
            style={{ color: '#94a3b8' }}
          >
            Loading subscription options...
          </p>
          {retryCount > 0 && (
            <p 
              className="text-sm"
              style={{ color: '#64748b' }}
            >
              Retry attempt: {retryCount}
            </p>
          )}
        </div>
      </div>
    );
  }

  // Show error state with retry option
  if (error && !offerings) {
    return (
      <div 
        className="min-h-screen flex items-center justify-center font-inter p-6"
        style={{ backgroundColor: '#0f172a' }}
      >
        <div className="text-center space-y-6 max-w-md">
          <AlertCircle 
            className="w-12 h-12 mx-auto"
            style={{ color: '#ef4444' }}
          />
          <div>
            <h2 
              className="text-xl font-bold mb-2"
              style={{ color: '#f1f5f9' }}
            >
              Unable to Load Subscription Options
            </h2>
            <p 
              className="text-base mb-4"
              style={{ color: '#94a3b8' }}
            >
              {error}
            </p>
          </div>
          <Button
            variant="accent"
            onClick={handleRetryLoadOfferings}
            className="flex items-center space-x-2"
            style={{ backgroundColor: '#f97316' }}
          >
            <RefreshCw className="w-4 h-4" />
            <span>Try Again</span>
          </Button>
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
        {/* Sandbox Environment Indicator */}
        {isSandboxEnvironment() && (
          <div 
            className="max-w-2xl mx-auto p-4 rounded-lg border text-center"
            style={{ 
              backgroundColor: '#fef3c7', 
              borderColor: '#f59e0b',
              color: '#92400e'
            }}
          >
            <p className="text-sm font-medium">
              🧪 Sandbox Environment - Test purchases will not be charged
            </p>
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
              className="p-4 rounded-lg flex items-center space-x-3"
              style={{ backgroundColor: '#fee2e2', border: '1px solid #fecaca' }}
            >
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
              <div>
                <p className="text-red-800 font-medium">Subscription Error</p>
                <p className="text-red-700 text-sm">{error}</p>
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
              disabled={loading}
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