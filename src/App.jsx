import React, { useEffect } from 'react';

import AppShell from './components/AppShell';
import DashboardTeaser from './components/DashboardTeaser';
import DynamicOnboarding from './components/DynamicOnboarding';
import EnhancedAuth from './components/EnhancedAuth';
import FirstStepScreen from './components/FirstStepScreen';
import MomentumMirror from './components/MomentumMirror';
import Paywall from './components/Paywall';
import ProtectedRoute from './components/ProtectedRoute';
import ReflectionScreen from './components/ReflectionScreen';
import SnapshotScreen from './components/SnapshotScreen';
import { AuthProvider } from './hooks/useAuth'; // AuthProvider might be refactored or removed if session is globally managed
import { useSubscription } from './hooks/useSubscription';
import { useTheme } from './hooks/useTheme';
import { initializeRevenueCat, setRevenueCatUserId, logOutRevenueCat } from './lib/revenuecat';
import { supabase } from './lib/supabase';
import useStore from './store/store'; // Import the Zustand store

function AppContent() {
  const { theme } = useTheme();
  // Get state and actions from Zustand store
  const session = useStore((state) => state.session);
  const isLoading = useStore((state) => state.isLoading);
  const currentView = useStore((state) => state.currentView);
  const onboardingAnswers = useStore((state) => state.onboardingAnswers);
  const currentIsfsTask = useStore((state) => state.currentIsfsTask);
  const storeHasSubscription = useStore((state) => state.hasSubscription);
  const momentumMirrorData = useStore((state) => state.momentumMirrorData);
  const dashboardTeaserData = useStore((state) => state.dashboardTeaserData);

  const setSession = useStore((state) => state.setSession);
  const setIsLoading = useStore((state) => state.setIsLoading);
  const setCurrentView = useStore((state) => state.setCurrentView);
  const setOnboardingAnswers = useStore((state) => state.setOnboardingAnswers);
  const setCurrentIsfsTask = useStore((state) => state.setCurrentIsfsTask);
  const setHasSubscription = useStore((state) => state.setHasSubscription);
  const clearUserState = useStore((state) => state.clearUserState);


  // Use the subscription hook for real-time subscription status
  // Pass session?.user to useSubscription. If session is null, user will be undefined.
  const { hasSubscription: rcatHasSubscription, isLoading: subscriptionLoading, refreshSubscriptionStatus } = useSubscription(session?.user);

  // Update Zustand store when rcatHasSubscription changes
  useEffect(() => {
    setHasSubscription(rcatHasSubscription);
  }, [rcatHasSubscription, setHasSubscription]);

  useEffect(() => {
    const initializeApp = async () => {
      try {
        setIsLoading(true);
        await initializeRevenueCat();
        const { data: { session: initialSession }, error } = await supabase.auth.getSession();
        if (error) {
          console.error('Error getting session:', error);
        } else {
          setSession(initialSession);
          if (initialSession?.user) {
            try {
              await setRevenueCatUserId(initialSession.user.id);
              // Initial subscription status will be handled by useSubscription hook and updated in store
            } catch (error) {
              console.error('Error setting RevenueCat user ID:', error);
            }
          }
        }
      } catch (error) {
        console.error('Error initializing app:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initializeApp();

    const { data: { subscription: authSubscription } } = supabase.auth.onAuthStateChange(
      async (_event, newSession) => {
        console.log('Auth state changed:', _event, newSession);
        setSession(newSession); // Update session in store
        // No need to setLoading(false) here as initial loading is handled by initializeApp

        if (newSession?.user) {
          try {
            await setRevenueCatUserId(newSession.user.id);
            refreshSubscriptionStatus(); // Refresh subscription status on auth change
          } catch (error) {
            console.error('Error setting RevenueCat user ID during auth change:', error);
          }
        } else {
          await logOutRevenueCat();
          // clearUserState(); // Clearing user state here might be too early if there's a transition period.
                           // Consider calling clearUserState when user explicitly logs out or session is truly invalid.
                           // For now, useSubscription will update hasSubscription to false.
        }
      }
    );

    return () => {
      authSubscription.unsubscribe();
    };
  }, [setSession, setIsLoading, refreshSubscriptionStatus]); // Removed clearUserState from dependencies for now

  // Handle onboarding completion
  const handleOnboardingComplete = (answers) => {
    console.log('Onboarding completed with answers:', answers);
    localStorage.setItem('onboarding-answers', JSON.stringify(answers)); // Keep localStorage for persistence if needed
    setOnboardingAnswers(answers);
    setCurrentView('snapshot');
  };

  // Handle onboarding skip - this might mean going to auth or a limited paywall
  const handleOnboardingSkip = () => {
    console.log('Onboarding skipped');
    // Decide next view: if user exists, maybe 'appShell' (if subscribed) or 'paywall', else 'auth'
    setCurrentView('auth'); // Example: go to EnhancedAuth
  };

  // Handle snapshot continuation
  const handleSnapshotContinue = () => {
    console.log('Continuing from snapshot to first step');
    setCurrentView('firstStep');
  };

  // Handle first step completion
  const handleFirstStepComplete = (taskText) => {
    console.log('First step completed with task:', taskText, 'Proceeding to reflection.');
    setCurrentIsfsTask(taskText || 'your first step');
    setCurrentView('reflection');
  };

  // Handle reflection completion
  const handleReflectionComplete = () => {
    console.log('Reflection completed, proceeding to momentum mirror.');
    setCurrentView('momentumMirror');
  };

  // Handle momentum mirror continuation
  const handleMomentumMirrorContinue = () => {
    console.log('Momentum mirror completed, proceeding to dashboard teaser.');
    setCurrentView('dashboardTeaser');
  };

  // Handle dashboard teaser action
  const handleDashboardTeaserAction = () => {
    console.log('Dashboard teaser action, proceeding to paywall.');
    setCurrentView('paywall');
  };

  // Handle first step change request
  const handleFirstStepChange = () => {
    console.log('User wants a different first step');
    setCurrentView('snapshot'); // Go back to snapshot
  };

  // Handle subscription from paywall
  const handleSubscribe = async (planType) => {
    console.log('User selected subscription plan:', planType);
    // RevenueCat purchase logic is in Paywall.jsx
    // After successful purchase, Paywall.jsx's onSubscriptionSuccess will be called.
    // We need to ensure App.jsx's state (via store) is updated.
    // The useSubscription hook should automatically refresh and update the store.
    // If not, call refreshSubscriptionStatus() here or in onSubscriptionSuccess.
    await refreshSubscriptionStatus(); // Explicitly refresh
  };

  // Handle successful subscription (called by Paywall's onSubscriptionSuccess)
  const handleSubscriptionSuccess = async (customerInfo, planType) => {
    console.log('Subscription successful in App.jsx:', { customerInfo, planType });
    await refreshSubscriptionStatus(); // Ensure store is up-to-date
    // If successful, the subscription gate below should allow access to AppShell
    // No direct setCurrentView('appShell') here, as the gate handles it.
    // If user is not authenticated after subscribing (e.g. onboarding paywall), guide to auth.
    if (!session) {
      setCurrentView('auth');
    }
  };


  // Show loading state while checking authentication or subscription
  if (isLoading || (session && subscriptionLoading)) {
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
            {isLoading ? 'Loading...' : 'Checking subscription...'}
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
          if (!subscriptionLoading && !storeHasSubscription) {
            // User is authenticated but has no active subscription
            console.log('🔒 Subscription gate: User authenticated, no subscription. Current view:', currentView);
            // If currentView is already paywall, or they just came from a flow leading to paywall, show it.
            // Otherwise, set currentView to 'paywall'.
            // This prevents loops if Paywall component itself tries to redirect.
            if (currentView !== 'paywall') {
                // setCurrentView('paywall'); // This might cause an infinite loop if Paywall is not careful
                                         // It's better to let the Paywall component render directly.
            }
            return (
              <Paywall
                onSubscribe={handleSubscribe}
                onSubscriptionSuccess={handleSubscriptionSuccess}
                isAuthenticatedUser={true}
              />
            );
          }

          // User is authenticated AND has active subscription - allow access to app
          if (storeHasSubscription) {
            // If they were on a pre-auth view, move them to appShell
            if (currentView !== 'appShell') {
                // setCurrentView('appShell'); // Let ProtectedRoute handle this or ensure AppShell is default for authed+subscribed
            }
            return (
              <ProtectedRoute>
                <AppShell />
              </ProtectedRoute>
            );
          }

          // Still loading subscription status - show loading (already handled by the top-level isLoading check)
          // This specific block for "Verifying subscription status..." might be redundant
          // if the main isLoading || (session && subscriptionLoading) covers it.
          // However, keeping it ensures a specific message if only subscription is loading.
          if (subscriptionLoading) {
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
          // Fallback for authenticated user if no other condition met (should ideally not happen)
          // return <EnhancedAuth />; // Or some other default authenticated view
        }

        // User is NOT authenticated - use currentView from store to show onboarding/auth flow
        switch (currentView) {
          case 'onboarding':
            return (
              <DynamicOnboarding
                onComplete={handleOnboardingComplete}
                onSkip={handleOnboardingSkip}
              />
            );
          case 'snapshot':
            // Ensure onboardingAnswers exist before showing snapshot
            if (onboardingAnswers) {
              return (
                <SnapshotScreen
                  // answers prop might be removed if SnapshotScreen fetches from store
                  onContinue={handleSnapshotContinue}
                />
              );
            }
            setCurrentView('onboarding'); // Fallback if no answers
            return null; // Or a loading/redirect indicator
          case 'firstStep':
            if (onboardingAnswers) {
              return (
                <FirstStepScreen
                  // answers prop might be removed
                  onComplete={handleFirstStepComplete}
                  onChangeStep={handleFirstStepChange}
                  // onboardingUserId might be removed if fetched from store or answers
                />
              );
            }
            setCurrentView('onboarding'); // Fallback
            return null;
          case 'reflection':
            if (onboardingAnswers && currentIsfsTask) {
              return (
                <ReflectionScreen
                  // task and userName might be removed if fetched from store
                  onComplete={handleReflectionComplete}
                />
              );
            }
            setCurrentView('firstStep'); // Fallback
            return null;
          case 'momentumMirror':
            if (momentumMirrorData) {
              return (
                <MomentumMirror
                  onContinue={handleMomentumMirrorContinue}
                />
              );
            }
            setCurrentView('reflection'); // Fallback if no momentum mirror data
            return null;
          case 'dashboardTeaser':
            if (dashboardTeaserData) {
              return (
                <DashboardTeaser
                  onBuildPlan={handleDashboardTeaserAction}
                />
              );
            }
            setCurrentView('momentumMirror'); // Fallback if no dashboard teaser data
            return null;
          case 'paywall': // This case is for non-authenticated users hitting paywall (e.g. after onboarding reflection)
            return (
              <Paywall
                onSubscribe={handleSubscribe}
                onSubscriptionSuccess={handleSubscriptionSuccess}
                isAuthenticatedUser={false}
              />
            );
          case 'auth':
            return <EnhancedAuth />;
          default:
            // Fallback to onboarding if currentView is unknown or invalid for non-authenticated user
            setCurrentView('onboarding');
            return (
              <DynamicOnboarding
                onComplete={handleOnboardingComplete}
                onSkip={handleOnboardingSkip}
              />
            );
        }
      })()}
    </>
  );
}

function App() {
  return (
    // AuthProvider might still be needed if useAuth hook is used by components
    // that are not yet refactored or if it provides other context.
    // If session is fully managed by Zustand, AuthProvider's role for session might be redundant.
    <AuthProvider>
      <AppContent />
    </AuthProvider>
    // Or, if AuthProvider is solely for session, and session is in Zustand:
    // <AppContent />
  );
}

export default App;