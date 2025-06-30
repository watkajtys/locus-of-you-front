import React, { useState, useEffect } from 'react';
import { supabase } from './lib/supabase';
import { useTheme } from './hooks/useTheme';
import Auth from './components/Auth';
import Dashboard from './components/Dashboard';
import DynamicOnboarding from './components/DynamicOnboarding';
import SnapshotScreen from './components/SnapshotScreen';

function App() {
  const { theme } = useTheme();
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showAuth, setShowAuth] = useState(false);
  const [showSnapshot, setShowSnapshot] = useState(false);
  const [onboardingAnswers, setOnboardingAnswers] = useState(null);

  useEffect(() => {
    // Get initial session
    const getSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) {
          console.error('Error getting session:', error);
        } else {
          setSession(session);
        }
      } catch (error) {
        console.error('Unexpected error getting session:', error);
      } finally {
        setLoading(false);
      }
    };

    getSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log('Auth state changed:', event, session);
        setSession(session);
        setLoading(false);
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

  // Handle snapshot continuation
  const handleSnapshotContinue = () => {
    console.log('Continuing from snapshot to auth');
    setShowAuth(true);
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
            Loading...
          </p>
        </div>
      </div>
    );
  }

  // Conditionally render Auth or Dashboard based on session
  if (session) {
    return <Dashboard session={session} />;
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

  // Show auth after snapshot or skip
  if (showAuth) {
    return <Auth />;
  }

  // Show onboarding first
  return (
    <DynamicOnboarding 
      onComplete={handleOnboardingComplete}
      onSkip={handleOnboardingSkip}
    />
  );
}

export default App;