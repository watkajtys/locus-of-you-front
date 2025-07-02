import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Brain, Target, Lightbulb, TrendingUp, Users, Zap, ChevronRight, Loader2 } from 'lucide-react';
import { AuraProvider } from '../contexts/AuraProvider';
import AuraAvatar from './AuraAvatar';
import AIMessageCard from './AIMessageCard';
import Card from './Card';
import Button from './Button';
import boltBadge from '../assets/bolt-badge.png';

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

const SnapshotScreen = ({ answers, onContinue }) => {
  const [archetype, setArchetype] = useState('');
  const [insights, setInsights] = useState([]);
  const [userGoal, setUserGoal] = useState('');
  const [narrativeSummary, setNarrativeSummary] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchSnapshotData = async () => {
      try {
        let userId;
        let accessToken = null;

        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          userId = user.id;
          const session = await supabase.auth.getSession();
          accessToken = session.data.session?.access_token;
        } else {
          // Generate an anonymous ID if no user is authenticated
          userId = localStorage.getItem('anonymous_onboarding_id');
          if (!userId) {
            // This case should ideally not happen if onboarding was completed
            // but as a fallback, generate a new anonymous ID
            userId = `anon_snapshot_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            localStorage.setItem('anonymous_onboarding_id', userId);
          }
        }

        const workerApiUrl = import.meta.env.VITE_WORKER_API_URL;
        if (!workerApiUrl) {
          throw new Error('VITE_WORKER_API_URL is not defined in environment variables.');
        }

        const payload = {
          userId: userId,
          sessionId: `snapshot_${userId}_${Date.now()}`, // Unique session ID for snapshot
          context: {
            sessionType: 'snapshot_generation',
            onboardingAnswers: answers // Send all collected answers
          },
          message: "Generate motivational snapshot based on onboarding answers."
        };

        const headers = {
          'Content-Type': 'application/json',
        };
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
          throw new Error(errorData.error?.message || 'Failed to fetch snapshot data from worker.');
        }

        const result = await response.json();
        
        // Assuming the worker returns data in this structure
        setArchetype(result.data.archetype || 'Unknown Archetype');
        setInsights(result.data.insights || []);
        setUserGoal(result.data.userGoal || answers.final_focus || "improving your overall well-being");
        setNarrativeSummary(result.data.narrativeSummary || "Could not generate a summary at this time.");

      } catch (err) {
        console.error('Error fetching snapshot data:', err);
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSnapshotData();
  }, [answers]); // Re-run effect if answers change

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
      </div>
    );
  }

  return (
    <AuraProvider>
      <div 
        className="min-h-screen flex flex-col items-center justify-center font-inter p-6 relative"
        style={{ backgroundColor: 'var(--color-background)' }}
      >
        {/* Bolt Badge */}
        <div className="absolute top-4 right-4 z-50">
          <a href="https://bolt.new" target="_blank" rel="noopener noreferrer">
            <img src={boltBadge} alt="Bolt Badge" className="w-10 h-10" />
          </a>
        </div>
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
                Your Motivational Snapshot
              </h1>
              <p 
                className="text-lg md:text-xl"
                style={{ color: 'var(--color-muted)' }}
              >
                Your personalized starting point for growth
              </p>
            </div>
          </div>

          {/* Main Results Card */}
          <Card className="p-8 md:p-12 space-y-10">
            {/* Archetype Section */}
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
              
              {/* Goal Context */}
              <div 
                className="max-w-2xl mx-auto p-6 rounded-xl"
                style={{ 
                  backgroundColor: 'var(--color-primary)',
                  border: `1px solid var(--color-border)`
                }}
              >
                <p 
                  className="text-lg leading-relaxed"
                  style={{ color: 'var(--color-text)' }}
                >
                  <span className="font-semibold">Your focus:</span> {userGoal}
                </p>
              </div>
            </div>

            {/* Key Insights Section - VERTICAL STACK */}
            <div className="space-y-8">
              <div className="text-center">
                <h3 
                  className="text-2xl font-bold mb-2"
                  style={{ color: 'var(--color-text)' }}
                >
                  Key Insights
                </h3>
                <p 
                  className="text-base"
                  style={{ color: 'var(--color-muted)' }}
                >
                  Your unique motivational profile and starting points for growth
                </p>
              </div>

              {/* Vertical stack of insights with supportive descriptions */}
              <div className="space-y-8 max-w-3xl mx-auto">
                {insights.map((insight, index) => {
                  // Spectrum Bar Visualization
                  if (insight.type === 'spectrum') {
                    return (
                      <SpectrumBar
                        key={index}
                        title={insight.title}
                        description={insight.description}
                        userScore={insight.userScore}
                        minLabel={insight.minLabel}
                        maxLabel={insight.maxLabel}
                      />
                    );
                  }
                  
                  // Belief Balance Bar Visualization
                  if (insight.type === 'balance') {
                    return (
                      <BeliefBalanceBar
                        key={index}
                        title={insight.title}
                        description={insight.description}
                        userScore={insight.userScore}
                        leftLabel={insight.leftLabel}
                        rightLabel={insight.rightLabel}
                      />
                    );
                  }
                  
                  // Focus Ring Visualization
                  if (insight.type === 'ring') {
                    return (
                      <FocusRing
                        key={index}
                        title={insight.title}
                        description={insight.description}
                        userScore={insight.userScore}
                        leftLabel={insight.leftLabel}
                        rightLabel={insight.rightLabel}
                      />
                    );
                  }
                  
                  return null;
                })}
              </div>
            </div>

            {/* Narrative Summary Section - Now using AIMessageCard */}
            <div className="space-y-6 pt-8" style={{ borderTop: `1px solid var(--color-border)` }}>
              <AIMessageCard
                paragraph={narrativeSummary}
                cardType="MY OBSERVATION"
              />
            </div>

            {/* AI Message Card - Conversational Call to Action */}
            <div className="space-y-8 pt-8 border-t" style={{ borderColor: 'var(--color-border)' }}>
              <AIMessageCard 
                paragraph="It's powerful to see how your mindset and focus connect. The logical next step is to apply this insight directly to your goal. I can guide you through creating your first 'micro-victory' right now, if you're ready."
                cardType="YOUR AI COACH"
              />
            </div>

            {/* Call to Action */}
            <div className="text-center space-y-6">
              <div className="pt-4">
                <Button
                  variant="accent"
                  size="large"
                  onClick={onContinue}
                  className="group flex items-center space-x-3 text-xl px-16 py-8"
                >
                  <span>Okay, I'm Ready</span>
                  <ChevronRight className="w-6 h-6 transition-transform duration-300 group-hover:translate-x-1" />
                </Button>
              </div>
            </div>
          </Card>

          {/* Footer */}
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