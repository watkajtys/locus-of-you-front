import React from 'react';
import { Brain, Target, Lightbulb, TrendingUp, Users, Zap, ChevronRight } from 'lucide-react';
import { AuraProvider } from '../contexts/AuraProvider';
import AuraAvatar from './AuraAvatar';
import AIMessageCard from './AIMessageCard';
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

  // Generate supportive descriptions based on user's answers
  const generateSupportiveDescription = (answers, insight) => {
    if (insight.type === 'spectrum') {
      // Personal Agency - Focus on starting point, not judgment  
      if (answers.locus === 'external') {
        return "Your current style is to focus more on external circumstances. This is a common pattern, and it gives us a clear starting point for building your sense of personal agency.";
      } else {
        return "Your natural focus is on personal action and control. This internal orientation is a strong foundation we can build upon for achieving your goals.";
      }
    }
    
    if (insight.type === 'balance') {
      // Growth Mindset - Frame as malleable belief, not fixed trait
      if (answers.mindset === 'fixed') {
        return "Your profile shows a current belief that abilities are mostly fixed. The great news is that this belief itself is a skill that can be developed. We'll focus on strategies that strengthen a growth-oriented perspective.";
      } else {
        return "Your belief in the ability to develop and grow is a powerful asset. This growth-oriented mindset will be the foundation for all the strategies we build together.";
      }
    }
    
    if (insight.type === 'ring') {
      // Achievement Orientation - Frame both as strategic strengths
      if (answers.regulatory_focus === 'promotion') {
        return "Your focus leans toward pursuing new opportunities and gains. This promotion-focused approach brings energy and ambition to your goal achievement strategies.";
      } else if (answers.regulatory_focus === 'prevention') {
        return "Your focus leans toward ensuring stability and avoiding problems. This prevention-focused approach brings careful planning and risk awareness to your strategies.";
      } else {
        return "Your focus is balanced between pursuing opportunities and ensuring stability. This means you can leverage both promotional energy and preventive wisdom in your approach.";
      }
    }
    
    return insight.description;
  };

  // Generate insights with supportive, non-judgmental framing
  const generateInsights = (answers) => {
    const insights = [];
    
    // Personal Agency insight - SPECTRUM BAR with reframed labels
    const locusScore = answers.locus === 'internal' ? 4.2 : 2.3;
    const personalAgencyInsight = {
      type: 'spectrum',
      title: 'Personal Agency',
      userScore: locusScore,
      minLabel: 'Focus on Circumstance',  // Changed from "External"
      maxLabel: 'Focus on Action'         // Changed from "Internal"
    };
    personalAgencyInsight.description = generateSupportiveDescription(answers, personalAgencyInsight);
    insights.push(personalAgencyInsight);
    
    // Growth Mindset insight - BELIEF BALANCE BAR with supportive framing
    const mindsetScore = answers.mindset === 'growth' ? 4.5 : 2.0;
    const growthMindsetInsight = {
      type: 'balance',
      title: 'Growth Mindset',
      userScore: mindsetScore,
      leftLabel: 'Growth Belief',          // Emphasized as "belief"
      rightLabel: 'Current Fixed Belief'   // Framed as "current" not permanent
    };
    growthMindsetInsight.description = generateSupportiveDescription(answers, growthMindsetInsight);
    insights.push(growthMindsetInsight);
    
    // Achievement Orientation insight - FOCUS RING with both as strengths
    const focusScore = answers.regulatory_focus === 'promotion' ? 4.0 : 2.5;
    const achievementInsight = {
      type: 'ring',
      title: 'Achievement Orientation',
      userScore: focusScore,
      leftLabel: 'Promotion Focus',
      rightLabel: 'Prevention Focus'
    };
    achievementInsight.description = generateSupportiveDescription(answers, achievementInsight);
    insights.push(achievementInsight);
    
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
                paragraph="What this tells me is that you're a 'Visionary Achiever.' You have a powerful belief that you can grow and a natural drive toward your goals. At the same time, your focus on personal action means you likely feel the full weight of getting things done. It's a potent combination of aspiration and responsibility, and it gives us a clear picture of how to build a plan that feels both ambitious and sustainable for you."
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