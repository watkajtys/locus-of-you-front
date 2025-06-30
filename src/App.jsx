import React, { useState, useEffect } from 'react';
import { supabase } from './lib/supabase';
import { useTheme } from './hooks/useTheme';
import { Bug, Play } from 'lucide-react';
import Auth from './components/Auth';
import Dashboard from './components/Dashboard';
import DynamicOnboarding from './components/DynamicOnboarding';
import SnapshotScreen from './components/SnapshotScreen';
import FirstStepScreen from './components/FirstStepScreen';

function App() {
  const { theme } = useTheme();
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showAuth, setShowAuth] = useState(false);
  const [showSnapshot, setShowSnapshot] = useState(false);
  const [showFirstStep, setShowFirstStep] = useState(false);
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

  // Handle snapshot continuation - now goes to FirstStepScreen
  const handleSnapshotContinue = () => {
    console.log('Continuing from snapshot to first step');
    setShowFirstStep(true);
  };

  // Handle first step completion
  const handleFirstStepComplete = () => {
    console.log('First step completed, going to auth');
    setShowAuth(true);
  };

  // Handle first step change request
  const handleFirstStepChange = () => {
    console.log('User wants a different first step');
    // For now, just go back to snapshot - you could implement step variation logic here
    setShowFirstStep(false);
    setShowSnapshot(true);
  };

  // Debug function to jump to snapshot with mock data
  const handleDebugSnapshot = () => {
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
    console.log('Debug: Jumped to snapshot with mock data');
  };

  // Debug function to jump to first step with mock data
  const handleDebugFirstStep = () => {
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
    console.log('Debug: Jumped to first step with mock data');
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

  return (
    <>
      {/* Debug Buttons - Fixed Position */}
      <div className="fixed top-4 right-4 z-50 flex flex-col space-y-2">
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

      {/* Main App Content */}
      {(() => {
        // Conditionally render Auth or Dashboard based on session
        if (session) {
          return <Dashboard session={session} />;
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

        // Show auth after first step completion or skip
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
      })()}
    </>
  );
}

export default App;