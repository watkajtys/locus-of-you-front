import React, { useState, useEffect } from 'react';
import { supabase } from './lib/supabase';
import { useTheme } from './hooks/useTheme';
import { AuthProvider } from './hooks/useAuth';
import { initializeRevenueCat, setRevenueCatUserId, logOutRevenueCat } from './lib/revenuecat';
import { useSubscription } from './hooks/useSubscription';
import EnhancedAuth from './components/EnhancedAuth';
import ProtectedRoute from './components/ProtectedRoute';
import AppShell from './components/AppShell';
import DynamicOnboarding from './components/DynamicOnboarding';
import SnapshotScreen from './components/SnapshotScreen';
import FirstStepScreen from './components/FirstStepScreen';
import Paywall from './components/Paywall';

function AppContent() {
  const { theme } = useTheme();
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showAuth, setShowAuth] = useState(false);
  const [showSnapshot, setShowSnapshot] = useState(false);
  const [showFirstStep, setShowFirstStep] = useState(false);
  const [showPaywall, setShowPaywall] = useState(false);
  const [onboardingAnswers, setOnboardingAnswers] = useState(null);

  // Use the subscription hook for real-time subscription status
  const { hasSubscription, isLoading: subscriptionLoading, refreshSubscriptionStatus } = useSubscription(session?.user);

  useEffect(() => {
    const initializeApp = async () => {
      try {
        // Initialize RevenueCat first and wait for it to complete
        await initializeRevenueCat();

        // Get initial session
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) {
          console.error('Error getting session:', error);
        } else {
          setSession(session);
          
          // If user is authenticated, set RevenueCat user ID
          if (session?.user) {
            try {
              await setRevenueCatUserId(session.user.id);
            } catch (error) {
              console.error('Error setting RevenueCat user ID:', error);
            }
          }
        }
      } catch (error) {
        console.error('Error initializing app:', error);
      } finally {
        setLoading(false);
      }
    };

    initializeApp();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event, session);
        setSession(session);
        setLoading(false);
        
        // Handle RevenueCat user management
        if (session?.user) {
          try {
            await setRevenueCatUserId(session.user.id);
            // The subscription status will be updated automatically through the hook
          } catch (error) {
            console.error('Error setting RevenueCat user ID:', error);
          }
        } else {
          // User logged out
          await logOutRevenueCat();
        }
      }
    );

    // Cleanup subscription on unmount
    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Handle onboarding completion
  const handleOnboardingComplete = (answers) => {
    console.log('Onboarding completed with answers:', answers);
    // Store answers in localStorage and state
    localStorage.setItem('onboarding-answers', JSON.stringify(answers));
    setOnboardingAnswers(answers);
    setShowSnapshot(true);
  };

  // Handle onboarding skip
  const handleOnboardingSkip = () => {
    console.log('Onboarding skipped');
    setShowAuth(true);
  };

  // Handle snapshot continuation - now goes to FirstStepScreen
  const handleSnapshotContinue = () => {
    console.log('Continuing from snapshot to first step');
    setShowFirstStep(true);
  };

  // Handle first step completion - now goes to Paywall
  const handleFirstStepComplete = () => {
    console.log('First step completed, going to paywall');
    setShowPaywall(true);
  };

  // Handle first step change request
  const handleFirstStepChange = () => {
    console.log('User wants a different first step');
    // For now, just go back to snapshot - you could implement step variation logic here
    setShowFirstStep(false);
    setShowSnapshot(true);
  };

  // Handle subscription from paywall
  const handleSubscribe = (planType) => {
    console.log('User selected subscription plan:', planType);
    // After successful subscription through RevenueCat, refresh status
    refreshSubscriptionStatus();
    // The subscription gate will automatically redirect to AppShell once subscription is detected
  };

  // Handle successful subscription (called by RevenueCat after purchase)
  const handleSubscriptionSuccess = (customerInfo, planType) => {
    console.log('Subscription successful:', { customerInfo, planType });
    // Refresh subscription status to get latest data
    refreshSubscriptionStatus();
    // You might want to store subscription info in your database here
  };

  // Show loading state while checking authentication or subscription
  if (loading || (session && subscriptionLoading)) {
    return (
      <div 
        className="min-h-screen flex items-center justify-center font-inter"
        style={{ backgroundColor: 'var(--color-background)' }}
      >
        <div className="text-center space-y-4">
          <div 
            className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin mx-auto"
            style={{ borderColor: 'var(--color-accent)' }}
          />
          <p 
            className="text-sm"
            style={{ color: 'var(--color-muted)' }}
          >
            {loading ? 'Loading...' : 'Checking subscription...'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Main App Content */}
      {(() => {
        // 🔒 SUBSCRIPTION GATE: Check authentication and subscription status
        if (session) {
          // User is authenticated - now check subscription status
          if (!subscriptionLoading && !hasSubscription) {
            // User is authenticated but has no active subscription
            console.log('🔒 Subscription gate: Redirecting to paywall - no active subscription');
            return (
              <Paywall 
                onSubscribe={handleSubscribe}
                onSubscriptionSuccess={handleSubscriptionSuccess}
                isAuthenticatedUser={true} // Pass flag to indicate user is already logged in
              />
            );
          }
          
          // User is authenticated AND has active subscription - allow access to app
          if (hasSubscription) {
            return (
              <ProtectedRoute>
                <AppShell session={session} hasSubscription={hasSubscription} />
              </ProtectedRoute>
            );
          }
          
          // Still loading subscription status - show loading
          return (
            <div 
              className="min-h-screen flex items-center justify-center font-inter"
              style={{ backgroundColor: 'var(--color-background)' }}
            >
              <div className="text-center space-y-4">
                <div 
                  className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin mx-auto"
                  style={{ borderColor: 'var(--color-accent)' }}
                />
                <p 
                  className="text-sm"
                  style={{ color: 'var(--color-muted)' }}
                >
                  Verifying subscription status...
                </p>
              </div>
            </div>
          );
        }

        // User is NOT authenticated - show onboarding/auth flow
        
        // Show paywall if first step is completed (during onboarding)
        if (showPaywall && onboardingAnswers) {
          return (
            <Paywall 
              onSubscribe={handleSubscribe}
              onSubscriptionSuccess={handleSubscriptionSuccess}
              isAuthenticatedUser={false} // User is in onboarding flow
            />
          );
        }

        // Show first step screen if user clicked "I'm Ready"
        if (showFirstStep && onboardingAnswers) {
          return (
            <FirstStepScreen 
              answers={onboardingAnswers}
              onComplete={handleFirstStepComplete}
              onChangeStep={handleFirstStepChange}
            />
          );
        }

        // Show snapshot results if onboarding is completed
        if (showSnapshot && onboardingAnswers) {
          return (
            <SnapshotScreen 
              answers={onboardingAnswers}
              onContinue={handleSnapshotContinue}
            />
          );
        }

        // Show auth after paywall or skip
        if (showAuth) {
          return <EnhancedAuth />;
        }

        // Show onboarding first
        return (
          <DynamicOnboarding 
            onComplete={handleOnboardingComplete}
            onSkip={handleOnboardingSkip}
          />
        );
      })()}
    </>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;