import React from 'react';
import { Brain, Target, Lightbulb, TrendingUp, Users, Zap, ChevronRight } from 'lucide-react';
import { AuraProvider } from '../contexts/AuraProvider';
import AuraAvatar from './AuraAvatar';
import Card from './Card';
import Button from './Button';

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
  // Determine user's archetype based on their answers
  const determineArchetype = (answers) => {
    const mindset = answers.mindset;
    const locus = answers.locus;
    const focus = answers.regulatory_focus;
    
    // Simple archetype determination logic
    if (mindset === 'growth' && locus === 'internal' && focus === 'promotion') {
      return 'Visionary Achiever';
    } else if (mindset === 'growth' && locus === 'internal' && focus === 'prevention') {
      return 'Steady Builder';
    } else if (mindset === 'growth' && locus === 'external' && focus === 'promotion') {
      return 'Adaptive Optimist';
    } else if (mindset === 'growth' && locus === 'external' && focus === 'prevention') {
      return 'Compassionate Achiever';
    } else if (mindset === 'fixed' && locus === 'internal' && focus === 'promotion') {
      return 'Determined Specialist';
    } else if (mindset === 'fixed' && locus === 'internal' && focus === 'prevention') {
      return 'Reliable Executor';
    } else if (mindset === 'fixed' && locus === 'external' && focus === 'promotion') {
      return 'Opportunistic Realist';
    } else {
      return 'Thoughtful Planner';
    }
  };

  // Generate insights based on answers with abstract visualizations
  const generateInsights = (answers) => {
    const insights = [];
    
    // Personal Agency insight - SPECTRUM BAR
    const locusScore = answers.locus === 'internal' ? 4.2 : 2.3; // Simulated score for visualization
    insights.push({
      type: 'spectrum',
      title: 'Personal Agency',
      description: 'Your sense of control over outcomes shapes how you approach challenges.',
      userScore: locusScore,
      minLabel: 'External',
      maxLabel: 'Internal'
    });
    
    // Growth Mindset insight - BELIEF BALANCE BAR
    const mindsetScore = answers.mindset === 'growth' ? 4.5 : 2.0;
    insights.push({
      type: 'balance',
      title: 'Growth Mindset',
      description: 'Your beliefs about the nature of abilities and talents.',
      userScore: mindsetScore,
      leftLabel: 'Growth',
      rightLabel: 'Fixed'
    });
    
    // Achievement Orientation insight - FOCUS RING
    const focusScore = answers.regulatory_focus === 'promotion' ? 4.0 : 2.5;
    insights.push({
      type: 'ring',
      title: 'Achievement Orientation',
      description: 'Your motivational focus influences how you pursue goals.',
      userScore: focusScore,
      leftLabel: 'Promotion Focus',
      rightLabel: 'Prevention Focus'
    });
    
    return insights;
  };

  const archetype = determineArchetype(answers);
  const insights = generateInsights(answers);
  const userGoal = answers.final_focus || "improving your overall well-being";

  return (
    <AuraProvider>
      <div 
        className="min-h-screen flex flex-col items-center justify-center font-inter p-6"
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
                Your Motivational Snapshot
              </h1>
              <p 
                className="text-lg md:text-xl"
                style={{ color: 'var(--color-muted)' }}
              >
                Based on your unique psychological profile
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

            {/* Abstract Data Visualizations Section - VERTICAL STACK */}
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
                  Abstract visualizations of your psychological profile
                </p>
              </div>

              {/* Changed from grid to vertical stack */}
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

            {/* New Bridge Section - Turning Insight into Action */}
            <div className="text-center space-y-6 pt-8 border-t" style={{ borderColor: 'var(--color-border)' }}>
              <div className="space-y-4">
                <h3 
                  className="text-3xl font-bold"
                  style={{ color: 'var(--color-text)' }}
                >
                  Turning Your Insight into Action
                </h3>
                
                <div 
                  className="max-w-3xl mx-auto p-8 rounded-xl"
                  style={{ 
                    backgroundColor: 'var(--color-primary)',
                    border: `2px solid var(--color-accent)`
                  }}
                >
                  <p 
                    className="text-lg md:text-xl leading-relaxed"
                    style={{ color: 'var(--color-text)' }}
                  >
                    Your <span className="font-bold">'{archetype}'</span> profile indicates that for a goal like <span className="font-bold">'{userGoal},'</span> the highest-leverage strategy is to address <span className="font-bold">'Task Complexity.'</span> We'll do this by isolating a single <span className="font-bold">'micro-victory'</span>—an infinitesimally small first step designed to build immediate momentum.
                  </p>
                </div>
              </div>
            </div>

            {/* Call to Action */}
            <div className="text-center space-y-6 pt-4">
              <div className="pt-4">
                <Button
                  variant="accent"
                  size="large"
                  onClick={onContinue}
                  className="group flex items-center space-x-3 text-xl px-16 py-8"
                >
                  <span>Create My First Step</span>
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
              This assessment is based on validated psychological research and your individual responses
            </p>
          </div>
        </div>
      </div>
    </AuraProvider>
  );
};

export default SnapshotScreen;