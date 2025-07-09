import { Brain, Target, Lightbulb, TrendingUp, Users, Zap, ChevronRight, Loader2 } from 'lucide-react';
import React, { useState, useEffect } from 'react';

import { AuraProvider } from '../contexts/AuraProvider';
import { supabase } from '../lib/supabase';
import useStore from '../store/store'; // Import Zustand store

import AIMessageCard from './AIMessageCard';
import AuraAvatar from './AuraAvatar';
import Button from './Button';
import Card from './Card';


// Spectrum Bar Component for Personal Agency
const SpectrumBar = ({ title, description, userScore, minLabel, maxLabel }) => {
  // Convert score to percentage (assuming scores are 1-5 or similar)
  const percentage = ((userScore - 1) / 4) * 100;
  
  return (
    <div 
      className="p-8 rounded-xl transition-all duration-300 hover:scale-102"
      style={{ 
        backgroundColor: 'var(--color-card)',
        border: `1px solid var(--color-border)`
      }}
    >
      <div className="space-y-6">
        <div className="text-center space-y-2">
          <h4 
            className="text-xl font-semibold"
            style={{ color: 'var(--color-text)' }}
          >
            {title}
          </h4>
          <p 
            className="text-sm leading-relaxed"
            style={{ color: 'var(--color-muted)' }}
          >
            {description}
          </p>
        </div>
        
        {/* Spectrum Visualization */}
        <div className="space-y-4">
          <div className="relative">
            {/* Background Line */}
            <div 
              className="h-1 rounded-full"
              style={{ backgroundColor: 'var(--color-border)' }}
            />
            
            {/* Colored Dot Marker */}
            <div 
              className="absolute top-1/2 transform -translate-y-1/2 w-4 h-4 rounded-full border-2 border-white shadow-lg transition-all duration-700 ease-out"
              style={{ 
                backgroundColor: 'var(--color-accent)',
                left: `calc(${percentage}% - 8px)`,
                borderColor: 'white',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)'
              }}
            />
          </div>
          
          {/* Labels */}
          <div className="flex justify-between text-sm font-medium" style={{ color: 'var(--color-muted)' }}>
            <span>{minLabel}</span>
            <span>{maxLabel}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

// Belief Balance Bar Component for Growth Mindset
const BeliefBalanceBar = ({ title, description, userScore, leftLabel, rightLabel }) => {
  // Convert score to percentage for Growth vs Fixed (assuming 1-5 scale)
  const growthPercentage = ((userScore - 1) / 4) * 100;
  const fixedPercentage = 100 - growthPercentage;
  
  return (
    <div 
      className="p-8 rounded-xl transition-all duration-300 hover:scale-102"
      style={{ 
        backgroundColor: 'var(--color-card)',
        border: `1px solid var(--color-border)`
      }}
    >
      <div className="space-y-6">
        <div className="text-center space-y-2">
          <h4 
            className="text-xl font-semibold"
            style={{ color: 'var(--color-text)' }}
          >
            {title}
          </h4>
          <p 
            className="text-sm leading-relaxed"
            style={{ color: 'var(--color-muted)' }}
          >
            {description}
          </p>
        </div>
        
        {/* Balance Bar Visualization */}
        <div className="space-y-4">
          <div className="relative h-6 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--color-border)' }}>
            {/* Growth Segment */}
            <div 
              className="absolute top-0 left-0 h-full transition-all duration-700 ease-out"
              style={{ 
                backgroundColor: 'var(--color-accent)',
                width: `${growthPercentage}%`
              }}
            />
            {/* Fixed Segment */}
            <div 
              className="absolute top-0 right-0 h-full transition-all duration-700 ease-out"
              style={{ 
                backgroundColor: 'var(--color-muted)',
                width: `${fixedPercentage}%`
              }}
            />
          </div>
          
          {/* Labels */}
          <div className="flex justify-between text-sm font-medium">
            <div className="flex items-center space-x-2">
              <div 
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: 'var(--color-accent)' }}
              />
              <span style={{ color: 'var(--color-text)' }}>{leftLabel}</span>
            </div>
            <div className="flex items-center space-x-2">
              <span style={{ color: 'var(--color-text)' }}>{rightLabel}</span>
              <div 
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: 'var(--color-muted)' }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Focus Ring Component for Achievement Orientation
const FocusRing = ({ title, description, userScore, leftLabel, rightLabel }) => {
  // Convert score to angle (assuming 1-5 scale maps to 0-360 degrees)
  const promotionPercentage = ((userScore - 1) / 4) * 100;
  const promotionAngle = (promotionPercentage / 100) * 360;
  const preventionAngle = 360 - promotionAngle;
  
  const size = 120;
  const strokeWidth = 12;
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  
  // Calculate stroke dash arrays for each segment
  const promotionLength = (promotionAngle / 360) * circumference;
  const preventionLength = (preventionAngle / 360) * circumference;
  
  return (
    <div 
      className="p-8 rounded-xl transition-all duration-300 hover:scale-102"
      style={{ 
        backgroundColor: 'var(--color-card)',
        border: `1px solid var(--color-border)`
      }}
    >
      <div className="space-y-6">
        <div className="text-center space-y-2">
          <h4 
            className="text-xl font-semibold"
            style={{ color: 'var(--color-text)' }}
          >
            {title}
          </h4>
          <p 
            className="text-sm leading-relaxed"
            style={{ color: 'var(--color-muted)' }}
          >
            {description}
          </p>
        </div>
        
        {/* Donut Chart Visualization */}
        <div className="flex flex-col items-center space-y-4">
          <div className="relative">
            <svg width={size} height={size} className="transform -rotate-90">
              {/* Background Circle */}
              <circle
                cx={size / 2}
                cy={size / 2}
                r={radius}
                stroke="var(--color-border)"
                strokeWidth={strokeWidth}
                fill="transparent"
              />
              
              {/* Promotion Focus Arc */}
              <circle
                cx={size / 2}
                cy={size / 2}
                r={radius}
                stroke="var(--color-accent)"
                strokeWidth={strokeWidth}
                fill="transparent"
                strokeDasharray={`${promotionLength} ${circumference}`}
                strokeLinecap="round"
                className="transition-all duration-700 ease-out"
              />
              
              {/* Prevention Focus Arc */}
              <circle
                cx={size / 2}
                cy={size / 2}
                r={radius}
                stroke="var(--color-muted)"
                strokeWidth={strokeWidth}
                fill="transparent"
                strokeDasharray={`${preventionLength} ${circumference}`}
                strokeDashoffset={-promotionLength}
                strokeLinecap="round"
                className="transition-all duration-700 ease-out"
              />
            </svg>
          </div>
          
          {/* Labels */}
          <div className="flex items-center space-x-6 text-sm font-medium">
            <div className="flex items-center space-x-2">
              <div 
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: 'var(--color-accent)' }}
              />
              <span style={{ color: 'var(--color-text)' }}>{leftLabel}</span>
            </div>
            <div className="flex items-center space-x-2">
              <div 
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: 'var(--color-muted)' }}
              />
              <span style={{ color: 'var(--color-text)' }}>{rightLabel}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const SnapshotScreen = ({ onContinue }) => { // Removed answers prop
  const onboardingAnswers = useStore((state) => state.onboardingAnswers);
  const setCurrentView = useStore((state) => state.setCurrentView); // For fallback navigation

  const [archetype, setArchetype] = useState('');
  const [insights, setInsights] = useState([]);
  const [userGoal, setUserGoal] = useState('');
  const [narrativeSummary, setNarrativeSummary] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchSnapshotData = async () => {
      // Ensure onboardingAnswers are available before fetching
      if (!onboardingAnswers) {
        console.warn("SnapshotScreen: onboardingAnswers not available yet. Skipping fetch.");
        // Optionally, set an error or redirect, or wait for App.jsx to provide answers.
        // If App.jsx ensures this screen is only shown when answers are ready, this check is a safeguard.
        setError("Onboarding data is missing. Please complete onboarding first.");
        setIsLoading(false);
        return;
      }

      setIsLoading(true); // Set loading true at the start of fetch attempt
      setError(null); // Clear previous errors

      try {
        let userId;
        let accessToken = null;

        // Try to get authenticated user first
        const { data: { user: authenticatedUser } } = await supabase.auth.getUser();
        if (authenticatedUser) {
          userId = authenticatedUser.id;
          const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
          if (sessionError) throw sessionError;
          accessToken = sessionData.session?.access_token;
        } else {
          // Fallback to anonymous ID from onboarding answers if stored there, or localStorage
          userId = onboardingAnswers.userId || localStorage.getItem('anonymous_onboarding_id');
          if (!userId) {
            // This is a less ideal fallback, should not happen if onboarding stored userId
            console.warn("SnapshotScreen: No user ID found in session or onboarding answers.");
            userId = `anon_snapshot_fallback_${Date.now()}`;
          }
        }

        const workerApiUrl = import.meta.env.VITE_WORKER_API_URL;
        if (!workerApiUrl) {
          throw new Error('VITE_WORKER_API_URL is not defined in environment variables.');
        }

        const payload = {
          userId: userId,
          sessionId: `snapshot_${userId}_${Date.now()}`,
          context: {
            sessionType: 'snapshot_generation',
            onboardingAnswers: onboardingAnswers // Use onboardingAnswers from store
          },
          message: "Generate motivational snapshot based on onboarding answers."
        };

        const headers = { 'Content-Type': 'application/json' };
        if (accessToken) {
          headers['Authorization'] = `Bearer ${accessToken}`;
        }

        const response = await fetch(`${workerApiUrl}/api/coaching/message`, {
          method: 'POST',
          headers: headers,
          body: JSON.stringify(payload)
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error?.message || `Worker request failed with status ${response.status}`);
        }

        const result = await response.json();
        
        setArchetype(result.data?.archetype || 'Unknown Archetype');
        setInsights(result.data?.insights || []);
        // Use final_goal_context from onboardingAnswers for userGoal
        setUserGoal(onboardingAnswers.final_goal_context || result.data?.userGoal || "your goals");
        setNarrativeSummary(result.data?.narrativeSummary || "Could not generate a narrative summary at this time.");

      } catch (err) {
        console.error('Error fetching snapshot data:', err);
        setError(err.message || 'An unexpected error occurred while fetching snapshot data.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchSnapshotData();
  }, [onboardingAnswers]); // Depend on onboardingAnswers from the store

  // Initial check for onboardingAnswers before first render attempt of main content
  if (!onboardingAnswers && !isLoading && !error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center" style={{ backgroundColor: 'var(--color-background)' }}>
        <p className="text-lg mb-4" style={{ color: 'var(--color-text)' }}>
          It seems your onboarding data is not available.
        </p>
        <Button onClick={() => setCurrentView('onboarding')} variant="primary">
          Return to Onboarding
        </Button>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--color-background)' }}>
        <Loader2 className="w-10 h-10 animate-spin" style={{ color: 'var(--color-accent)' }} />
        <p className="text-lg ml-3" style={{ color: 'var(--color-muted)' }}>Generating your snapshot...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-red-500" style={{ backgroundColor: 'var(--color-background)' }}>
        <p className="text-lg">Error: {error}</p>
        <p className="text-md mt-2">Please try again later or generously contact support.</p>
        <Button onClick={() => setCurrentView('onboarding')} variant="primary" className="mt-4">
          Return to Onboarding
        </Button>
      </div>
    );
  }

  // Render the main content if no loading and no error, and onboardingAnswers exist
  return (
    <AuraProvider>
      <div 
        className="min-h-screen flex flex-col items-center justify-center font-inter p-6 relative"
        style={{ backgroundColor: 'var(--color-background)' }}
      >
        
        <div className="max-w-4xl mx-auto w-full space-y-8">
          {/* Header with Aura */}
          <div className="text-center space-y-4">
            <div className="flex justify-center">
              <AuraAvatar size={80} className="hover:scale-105 transition-transform duration-500" />
            </div>
            <div className="space-y-2">
              <h1 
                className="text-4xl md:text-5xl font-bold leading-tight"
                style={{ color: 'var(--color-text)' }}
              >
                Your Motivational DNA Snapshot
              </h1>
              <p 
                  className="text-lg md:text-xl max-w-2xl mx-auto"
                  style={{ color: 'var(--color-muted)' }}
                >
                Here's what we've learned from our conversation. This isn't a test or a score, but your personal blueprint. We'll use this to build a plan that works for you.
                </p>
            </div>
          </div>

          <Card className="p-8 md:p-12 space-y-10">
            {archetype && (
            <div className="text-center space-y-4">
              <div className="space-y-2">
                <p 
                  className="text-lg font-medium tracking-wide uppercase"
                  style={{ color: 'var(--color-muted)' }}
                >
                  You are a
                </p>
                <h2 
                  className="text-5xl md:text-6xl font-bold leading-tight bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent"
                  style={{ 
                    background: `linear-gradient(135deg, var(--color-accent), var(--color-primary))`,
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text'
                  }}
                >
                  '{archetype}'
                </h2>
              </div>
            </div>
            )}

            {insights && insights.length > 0 && (
              <div className="space-y-8">
                <div className="space-y-8 max-w-3xl mx-auto">
                  {insights.map((insight, index) => {
                    if (insight.type === 'spectrum') {
                      return <SpectrumBar key={index} {...insight} />;
                    }
                    if (insight.type === 'balance') {
                      return <BeliefBalanceBar key={index} {...insight} />;
                    }
                    if (insight.type === 'ring') {
                      return <FocusRing key={index} {...insight} />;
                    }
                    return (
                        <div key={index} className="p-4 rounded-lg" style={{backgroundColor: 'var(--color-card-alt)', border: '1px solid var(--color-border)'}}>
                            <h4 className="font-semibold" style={{color: 'var(--color-text)'}}>{insight.title || 'Insight'}</h4>
                            <p style={{color: 'var(--color-muted)'}}>{insight.description || 'Details not available.'}</p>
                        </div>
                    );
                  })}
                </div>
              </div>
            )}

            {narrativeSummary && (
              <div className="space-y-6 pt-8" style={{ borderTop: `1px solid var(--color-border)` }}>
                <AIMessageCard
                  paragraph={narrativeSummary}
                  cardType="YOUR BLUEPRINT SUMMARY"
                />
              </div>
            )}

            <div className="space-y-6 pt-8 border-t" style={{ borderColor: 'var(--color-border)' }}>
              <div className="text-center">
                <h3
                    className="text-2xl md:text-3xl font-bold mb-2"
                    style={{ color: 'var(--color-text)' }}
                  >
                    Connecting Your DNA to Your Goal
                  </h3>
                {userGoal && (
                  <p className="text-lg mb-4" style={{color: 'var(--color-muted)'}}>
                    Regarding your focus on: <strong>{userGoal}</strong>
                  </p>
                )}
              </div>
              <AIMessageCard 
                message="So, how does this all relate to the challenge you mentioned?"
                paragraph="Your unique profile gives us the perfect clue for the best way to start."
                cardType="COACH"
              />
            </div>

            <div className="text-center space-y-6">
              <div className="pt-4">
                <Button
                  variant="accent"
                  size="large"
                  onClick={onContinue} // This calls App.jsx's handler, which changes currentView
                  className="group flex items-center space-x-3 text-xl px-16 py-8"
                >
                  <span>Okay, I'm Ready</span>
                  <ChevronRight className="w-6 h-6 transition-transform duration-300 group-hover:translate-x-1" />
                </Button>
              </div>
            </div>
          </Card>

          <div className="text-center">
            <p 
              className="text-sm"
              style={{ color: 'var(--color-muted)' }}
            >
              This is your personalized coaching starting point, not a final assessment
            </p>
          </div>
        </div>
      </div>
    </AuraProvider>
  );
};

export default SnapshotScreen;