import { Check, Zap, Brain, Target, BarChart3, BookOpen, Sparkles, Crown, Loader2, AlertCircle, ArrowLeft } from 'lucide-react';
import React, { useState, useEffect } from 'react';

import { 
  purchaseSubscription, 
  getOfferings, 
  PRODUCT_IDS,
  checkSubscriptionStatus 
} from '../lib/revenuecat';
import useStore from '../store/store'; // Import Zustand store

import Button from './Button';
import Card from './Card';
import LoadingSpinner from './LoadingSpinner';


const Paywall = ({ onSubscribe, onSubscriptionSuccess, isAuthenticatedUser = false }) => {
  // isAuthenticatedUser prop is still useful to tailor UI elements if needed.
  // onSubscribe and onSubscriptionSuccess are passed from App.jsx to handle post-purchase logic.

  const setHasSubscription = useStore((state) => state.setHasSubscription);
  const setCurrentView = useStore((state) => state.setCurrentView);
  // Potentially: const session = useStore((state) => state.session); to get user ID for RevenueCat if not already handled.

  const [selectedPlan, setSelectedPlan] = useState('annual'); // Default to annual (best value)
  const [loading, setLoading] = useState(false); // Local loading for purchase process
  const [error, setError] = useState(null);
  const [offerings, setOfferings] = useState(null);
  const [loadingOfferings, setLoadingOfferings] = useState(true);

  // Load offerings on component mount
  useEffect(() => {
    loadOfferings();
  }, []);

  const loadOfferings = async () => {
    try {
      setLoadingOfferings(true);
      const offeringsData = await getOfferings();
      setOfferings(offeringsData);
    } catch (error) {
      console.error('Failed to load offerings:', error);
      setError('Failed to load subscription options. Please try again.');
    } finally {
      setLoadingOfferings(false);
    }
  };

  const handleSubscribe = async () => {
    if (loading) return;

    console.log('handleSubscribe called');
    setLoading(true);
    setError(null);

    try {
      // Determine product ID based on selected plan
      const productId = selectedPlan === 'annual' ? PRODUCT_IDS.ANNUAL : PRODUCT_IDS.MONTHLY;
      
      // Attempt purchase through RevenueCat
      const result = await purchaseSubscription(productId);

      if (result.success) {
        // Purchase successful
        console.log('Subscription purchased successfully:', result);
        
        // Check subscription status to confirm
        const status = await checkSubscriptionStatus();
        
        if (status.hasSubscription) {
          setHasSubscription(true); // Update store
          // Call success callback passed from App.jsx (which might also refresh or set view)
          onSubscriptionSuccess?.(result.customerInfo, selectedPlan);
          // onSubscribe is also called by App.jsx's handleSubscriptionSuccess,
          // so calling it here might be redundant if onSubscriptionSuccess already covers it.
          // For now, assume App.jsx's onSubscriptionSuccess will call its onSubscribe logic.
          // If the user is authenticated, App.jsx's subscription gate will handle view change.
          // If not authenticated (e.g. end of onboarding), might need to set view to auth.
          if (!isAuthenticatedUser) {
            // setCurrentView('auth'); // Or let App.jsx handle this transition via onSubscriptionSuccess
          }
        } else {
          // This case should ideally not happen if purchase was successful and status check is reliable.
          setHasSubscription(false); // Ensure store reflects reality
          throw new Error('Subscription not found after successful purchase confirmation. Please contact support.');
        }
      } else {
        // Purchase failed or was cancelled
        if (result.userCancelled) {
          console.log('User cancelled subscription purchase');
          // No error message needed for user cancellation
        } else {
          setError(result.error || 'Failed to process subscription. Please try again.');
          setHasSubscription(false); // Ensure store reflects no subscription
        }
      }
    } catch (error) {
      console.error('Subscription error:', error);
      setError(error.message || 'An unexpected error occurred. Please try again.');
      setHasSubscription(false); // Ensure store reflects no subscription on error
    } finally {
      setLoading(false); // Reset local loading state
    }
  };

  // Updated premiumFeatures as per onboard.md
  const premiumFeatures = [
    {
      icon: Zap, // Keeping Zap icon, can be changed
      title: 'An Adaptive Plan that Evolves With You',
      // No description in onboard.md, can add one if desired
      description: 'Your coaching plan adapts based on your progress and reflections.'
    },
    {
      icon: Brain, // Keeping Brain icon
      title: 'Unlock Your Next Step, and the Next...',
      description: 'Continuously receive tailored steps to build momentum towards your goals.'
    },
    {
      icon: Target, // Keeping Target icon
      title: 'Ongoing Insights from Your Personal AI Coach',
      description: 'Benefit from continuous analysis and feedback from your AI coach.'
    }
    // Removed other features to match onboard.md's conciseness for Phase 6
  ];

  // Helper function to get pricing from offerings
  const getPricing = () => {
    if (!offerings?.current) {
      return {
        annual: { price: '$119.99', monthlyEquivalent: '$9.99' },
        monthly: { price: '$19.99' }
      };
    }

    const annualPackage = offerings.current.availablePackages.find(
      pkg => pkg.product?.identifier === PRODUCT_IDS.ANNUAL
    );
    const monthlyPackage = offerings.current.availablePackages.find(
      pkg => pkg.product?.identifier === PRODUCT_IDS.MONTHLY
    );

    return {
      annual: {
        price: annualPackage?.product.priceString || '$119.99',
        monthlyEquivalent: annualPackage ? 
          `${(annualPackage.product.price / 12).toFixed(2)}` : 
          '$9.99'
      },
      monthly: {
        price: monthlyPackage?.product.priceString || '$19.99'
      }
    };
  };

  const pricing = getPricing();

  if (loadingOfferings) {
    return (
      <div 
      className="min-h-screen flex items-center justify-center font-inter"
      style={{ backgroundColor: '#0f172a' }}
    >
      <LoadingSpinner text="Loading subscription options..." />
    </div>
    );
  }

  return (
    <div 
      className="min-h-screen flex flex-col items-center justify-center font-inter p-6 relative"
      style={{ backgroundColor: '#0f172a' }} // Professional theme background
    >
      
      <div className="max-w-5xl mx-auto w-full space-y-12">
        {/* Header Section */}
        <div className="text-center space-y-6">
          <div className="flex justify-center mb-6">
            <div 
              className="w-16 h-16 rounded-full flex items-center justify-center shadow-2xl"
              style={{ backgroundColor: '#f97316' }} // orange-500 accent
            >
              <Crown className="w-8 h-8 text-white" />
            </div>
          </div>
          
          <div className="space-y-4">
            <h1 
              className="text-4xl md:text-6xl font-bold leading-tight"
              style={{ color: '#f1f5f9' }} // slate-100 text
            >
              Let's Keep the Momentum Going.
            </h1>
            <p 
              className="text-lg md:text-xl leading-relaxed max-w-3xl mx-auto"
              style={{ color: '#94a3b8' }} // slate-400 muted
            >
              You've already seen how a personalized first step can make a difference. The real power of LocusOfYou is turning that one action into a consistent practice.
            </p>
            <p
              className="text-md md:text-lg leading-relaxed max-w-3xl mx-auto" // Sub-Body
              style={{ color: '#94a3b8' }} // slate-400 muted
            >
              Subscribing unlocks your full, ongoing coaching experience. We'll help you reflect on every step, adapt your plan based on how it goes, and reveal your next step, every single time.
            </p>
          </div>

          {/* Back to Limited Access (for authenticated users only) - This might be less relevant if Paywall is part of onboarding before full auth wall */}
          {isAuthenticatedUser && (
            <div className="flex justify-center">
              <button
                onClick={() => window.history.back()}
                className="flex items-center space-x-2 text-sm transition-colors duration-200 hover:underline"
                style={{ color: '#94a3b8' }}
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back to limited access</span>
              </button>
            </div>
          )}
        </div>

        {/* Subscription Required Notice (for authenticated users) */}
        {isAuthenticatedUser && (
          <div className="max-w-2xl mx-auto">
            <div 
              className="p-6 rounded-xl border-l-4 border-orange-500"
              style={{ backgroundColor: '#1e293b', borderLeftColor: '#f97316' }}
            >
              <div className="flex items-start space-x-3">
                <Crown 
                  className="w-6 h-6 mt-1 flex-shrink-0"
                  style={{ color: '#f97316' }}
                />
                <div>
                  <h3 
                    className="text-lg font-semibold mb-2"
                    style={{ color: '#f1f5f9' }}
                  >
                    Premium Subscription Required
                  </h3>
                  <p 
                    className="text-sm leading-relaxed"
                    style={{ color: '#94a3b8' }}
                  >
                    You're logged in, but you'll need an active subscription to access coaching features, goal tracking, and personalized interventions. Choose a plan below to unlock your full potential.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Error Display */}
        {error && (
          <div className="max-w-2xl mx-auto">
            <div 
              className="p-4 rounded-lg flex items-center space-x-3"
              style={{ backgroundColor: '#dc2626', border: '1px solid #ef4444' }}
            >
              <AlertCircle className="w-5 h-5 text-white flex-shrink-0" />
              <div>
                <p className="text-white font-medium">Subscription Error</p>
                <p className="text-red-100 text-sm">{error}</p>
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
              {isAuthenticatedUser 
                ? 'Select a subscription plan to unlock premium features'
                : 'Start your 7-day free trial, then continue with the plan that works for you'
              }
            </p>
          </div>

          {/* Plan Cards */}
          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {/* Annual Plan - Recommended */}
            <div className="relative">
              {/* Best Value Badge */}
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

              <button
                type="button"
                className={`
                  relative p-8 rounded-xl transition-all duration-300 cursor-pointer
                  ${selectedPlan === 'annual' 
                    ? 'ring-4 ring-orange-500 shadow-2xl transform scale-105' 
                    : 'shadow-lg hover:shadow-xl hover:scale-102'
                  }
                  ${loading ? 'opacity-75 cursor-not-allowed' : ''}
                `}
                style={{
                  backgroundColor: '#1e293b', // slate-800
                  border: selectedPlan === 'annual' 
                    ? '2px solid #f97316' 
                    : '1px solid #334155'
                }}
                onClick={() => !loading && setSelectedPlan('annual')}
              >
                <div className="space-y-6">
                  {/* Plan Name */}
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

                  {/* Pricing */}
                  <div className="text-center space-y-2">
                    <div className="flex items-baseline justify-center space-x-2">
                      <span 
                        className="text-5xl font-bold"
                        style={{ color: '#f97316' }}
                      >
                        {pricing.annual.price}
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
                      (Just {pricing.annual.monthlyEquivalent}/month)
                    </p>
                  </div>

                  {/* Selection Indicator */}
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
              </button>
            </div>

            {/* Monthly Plan */}
            <button
              type="button"
              className={`
                p-8 rounded-xl transition-all duration-300 cursor-pointer
                ${selectedPlan === 'monthly' 
                  ? 'ring-4 ring-orange-500 shadow-2xl transform scale-105' 
                  : 'shadow-lg hover:shadow-xl hover:scale-102'
                }
                ${loading ? 'opacity-75 cursor-not-allowed' : ''}
              `}
              style={{
                backgroundColor: '#1e293b', // slate-800
                border: selectedPlan === 'monthly' 
                  ? '2px solid #f97316' 
                  : '1px solid #334155'
              }}
              onClick={() => !loading && setSelectedPlan('monthly')}
            >
              <div className="space-y-6">
                {/* Plan Name */}
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

                {/* Pricing */}
                <div className="text-center space-y-2">
                  <div className="flex items-baseline justify-center space-x-2">
                    <span 
                      className="text-5xl font-bold"
                      style={{ color: '#f97316' }}
                    >
                      {pricing.monthly.price}
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

                {/* Selection Indicator */}
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
            </button>
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
                <button
                  key={index}
                  type="button"
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
                </button>
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
                <>
                  {/* Text updated as per onboard.md */}
                  Unlock My Full Plan
                </>
              )}
            </Button>
            
            {/* The "Skip for now" button might be removed if this is a hard paywall in the onboarding flow */}
            {/* For now, keeping it but commenting out, as onboard.md doesn't specify it for Phase 6 */}
            {/* {!isAuthenticatedUser && (
              <div className="mt-4">
                <button
                  onClick={() => onSubscriptionSuccess?.(null, 'skipped')}
                  className="text-sm font-medium text-gray-400 hover:underline"
                >
                  Skip for now (limited access)
                </button>
              </div>
            )} */}

            <div className="mt-4 space-y-2">
              <p 
                className="text-sm font-medium"
                style={{ color: '#f1f5f9' }}
              >
                {isAuthenticatedUser 
                  ? 'Instant access to all premium features'
                  : 'No commitment during your free trial'
                }
              </p>
              <p 
                className="text-xs"
                style={{ color: '#64748b' }}
              >
                {isAuthenticatedUser 
                  ? `You'll be charged ${selectedPlan === 'annual' ? pricing.annual.price + '/year' : pricing.monthly.price + '/month'}. Cancel anytime.`
                  : `After your 7-day free trial, you'll be charged ${selectedPlan === 'annual' ? pricing.annual.price + '/year' : pricing.monthly.price + '/month'}. Cancel anytime.`
                }
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