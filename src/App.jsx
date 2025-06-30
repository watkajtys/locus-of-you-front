import React, { useState, useEffect } from 'react';
import { supabase } from './lib/supabase';
import { useTheme } from './hooks/useTheme';
import { AuthProvider } from './hooks/useAuth';
import { initializeRevenueCat, setRevenueCatUserId, checkSubscriptionStatus } from './lib/revenuecat';
import { Bug, Play, User } from 'lucide-react';
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
  const [hasSubscription, setHasSubscription] = useState(false);
  const [revenueCatReady, setRevenueCatReady] = useState(false);

  useEffect(() => {
    const initializeApp = async () => {
      try {
        console.log('🚀 Initializing app...');

        // Initialize RevenueCat first (before auth)
        const rcResult = await initializeRevenueCat();
        if (rcResult.success) {
          setRevenueCatReady(true);
          console.log('✅ RevenueCat initialized successfully');
        } else {
          console.warn('⚠️ RevenueCat initialization failed:', rcResult.error);
          // Continue without RevenueCat - don't block the app
          setRevenueCatReady(false);
        }

        // Get initial session
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) {
          console.error('❌ Error getting session:', error);
        } else {
          setSession(session);
          
          // If user is authenticated and RevenueCat is ready
          if (session?.user && revenueCatReady) {
            try {
              await setRevenueCatUserId(session.user.id);
              const subscriptionStatus = await checkSubscriptionStatus();
              setHasSubscription(subscriptionStatus.hasSubscription);
              console.log('✅ User subscription status:', subscriptionStatus.hasSubscription);
            } catch (rcError) {
              console.warn('⚠️ RevenueCat user setup failed:', rcError);
              // Continue without subscription check
              setHasSubscription(false);
            }
          }
        }

      } catch (error) {
        console.error('❌ App initialization error:', error);
      } finally {
        setLoading(false);
      }
    };

    initializeApp();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('🔐 Auth state changed:', event, session?.user?.id);
        setSession(session);
        setLoading(false);
        
        // Handle RevenueCat user management only if it's ready
        if (session?.user && revenueCatReady) {
          try {
            await setRevenueCatUserId(session.user.id);
            const subscriptionStatus = await checkSubscriptionStatus();
            setHasSubscription(subscriptionStatus.hasSubscription);
          } catch (rcError) {
            console.warn('⚠️ RevenueCat user update failed:', rcError);
            setHasSubscription(false);
          }
        } else if (!session) {
          setHasSubscription(false);
        }
      }
    );

    // Cleanup subscription on unmount
    return () => {
      subscription.unsubscribe();
    };
  }, [revenueCatReady]);

  // Handle onboarding completion
  const handleOnboardingComplete = (answers) => {
    console.log('✅ Onboarding completed with answers:', answers);
    localStorage.setItem('onboarding-answers', JSON.stringify(answers));
    setOnboardingAnswers(answers);
    setShowSnapshot(true);
  };

  // Handle onboarding skip
  const handleOnboardingSkip = () => {
    console.log('⏭️ Onboarding skipped');
    setShowAuth(true);
  };

  // Handle snapshot continuation
  const handleSnapshotContinue = () => {
    console.log('📊 Continuing from snapshot to first step');
    setShowFirstStep(true);
  };

  // Handle first step completion
  const handleFirstStepComplete = () => {
    console.log('🎯 First step completed, going to paywall');
    setShowPaywall(true);
  };

  // Handle first step change request
  const handleFirstStepChange = () => {
    console.log('🔄 User wants a different first step');
    setShowFirstStep(false);
    setShowSnapshot(true);
  };

  // Handle subscription from paywall
  const handleSubscribe = (planType) => {
    console.log('💰 User completed subscription:', planType);
    setShowAuth(true);
    setShowPaywall(false);
  };

  // Handle successful subscription
  const handleSubscriptionSuccess = (customerInfo, planType) => {
    console.log('✅ Subscription successful:', { customerInfo, planType });
    setHasSubscription(true);
  };

  // Debug functions for development
  const handleDebugSnapshot = () => {
    if (process.env.NODE_ENV !== 'development') return;
    
    const mockAnswers = {
      mindset: 'growth',
      locus: 'internal',
      regulatory_focus: 'promotion',
      personality_disorganized: 2.3,
      personality_outgoing: 4.1,
      personality_moody: 2.8,
      final_focus: 'Building better habits and staying consistent with my goals'
    };
    
    setOnboardingAnswers(mockAnswers);
    setShowSnapshot(true);
    setShowAuth(false);
    setShowFirstStep(false);
    setShowPaywall(false);
    console.log('🐛 Debug: Jumped to snapshot with mock data');
  };

  const handleDebugFirstStep = () => {
    if (process.env.NODE_ENV !== 'development') return;
    
    const mockAnswers = {
      mindset: 'growth',
      locus: 'internal',
      regulatory_focus: 'promotion',
      personality_disorganized: 2.3,
      personality_outgoing: 4.1,
      personality_moody: 2.8,
      final_focus: 'Building better habits and staying consistent with my goals'
    };
    
    setOnboardingAnswers(mockAnswers);
    setShowFirstStep(true);
    setShowSnapshot(false);
    setShowAuth(false);
    setShowPaywall(false);
    console.log('🐛 Debug: Jumped to first step with mock data');
  };

  const handleDebugLogin = () => {
    if (process.env.NODE_ENV !== 'development') return;
    
    const mockSession = {
      user: {
        id: 'debug-user-12345',
        email: 'debug@example.com',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        email_confirmed_at: new Date().toISOString(),
        last_sign_in_at: new Date().toISOString(),
        app_metadata: {},
        user_metadata: {},
        aud: 'authenticated',
        role: 'authenticated'
      },
      access_token: 'debug-access-token',
      refresh_token: 'debug-refresh-token',
      expires_in: 3600,
      expires_at: Math.floor(Date.now() / 1000) + 3600,
      token_type: 'bearer'
    };

    setSession(mockSession);
    setHasSubscription(true);
    setShowAuth(false);
    setShowSnapshot(false);
    setShowFirstStep(false);
    setShowPaywall(false);
    console.log('🐛 Debug: Simulated logged-in state with premium subscription');
  };

  // Show loading state while checking authentication
  if (loading) {
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
            Initializing...
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Debug Buttons - Only in development */}
      {process.env.NODE_ENV === 'development' && (
        <div className="fixed top-4 right-4 z-50 flex flex-col space-y-2">
          {/* RevenueCat Status Indicator */}
          <div 
            className={`px-2 py-1 rounded text-xs font-bold ${
              revenueCatReady 
                ? 'bg-green-500 text-white' 
                : 'bg-red-500 text-white'
            }`}
          >
            RC: {revenueCatReady ? 'Ready' : 'Failed'}
          </div>

          {/* Login Debug Button */}
          <button
            onClick={handleDebugLogin}
            className="flex items-center space-x-2 px-3 py-2 rounded-lg shadow-lg transition-all duration-200 hover:scale-105 hover:shadow-xl"
            style={{
              backgroundColor: '#10b981',
              color: 'white',
              fontSize: '0.875rem',
              fontWeight: '600'
            }}
            title="Debug: Simulate Logged-in State"
          >
            <User className="w-4 h-4" />
            <span>Login</span>
          </button>

          {/* Snapshot Debug Button */}
          <button
            onClick={handleDebugSnapshot}
            className="flex items-center space-x-2 px-3 py-2 rounded-lg shadow-lg transition-all duration-200 hover:scale-105 hover:shadow-xl"
            style={{
              backgroundColor: 'var(--color-accent)',
              color: 'white',
              fontSize: '0.875rem',
              fontWeight: '600'
            }}
            title="Debug: Jump to Snapshot"
          >
            <Bug className="w-4 h-4" />
            <span>Snapshot</span>
          </button>

          {/* First Step Debug Button */}
          <button
            onClick={handleDebugFirstStep}
            className="flex items-center space-x-2 px-3 py-2 rounded-lg shadow-lg transition-all duration-200 hover:scale-105 hover:shadow-xl"
            style={{
              backgroundColor: 'var(--color-primary)',
              color: 'var(--color-text)',
              fontSize: '0.875rem',
              fontWeight: '600'
            }}
            title="Debug: Jump to First Step"
          >
            <Play className="w-4 h-4" />
            <span>First Step</span>
          </button>
        </div>
      )}

      {/* Main App Content */}
      {(() => {
        // Authenticated user - show main app
        if (session) {
          return (
            <ProtectedRoute>
              <AppShell session={session} hasSubscription={hasSubscription} />
            </ProtectedRoute>
          );
        }

        // Show paywall if first step is completed
        if (showPaywall && onboardingAnswers) {
          return (
            <Paywall 
              onSubscribe={handleSubscribe}
              onSubscriptionSuccess={handleSubscriptionSuccess}
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

        // Show onboarding first (default)
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