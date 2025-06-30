import React from 'react';
import { Brain, Target, Lightbulb, TrendingUp, Users, Zap, ChevronRight } from 'lucide-react';
import { AuraProvider } from '../contexts/AuraProvider';
import AuraAvatar from './AuraAvatar';
import Card from './Card';
import Button from './Button';

// Spectrum Component for Data Visualization
const SpectrumComponent = ({ title, description, userScore, minLabel, maxLabel }) => {
  // Convert score to percentage (assuming scores are 1-5 or similar)
  const percentage = ((userScore - 1) / 4) * 100;
  
  return (
    <div 
      className="p-8 rounded-xl transition-all duration-300 hover:scale-105 hover:shadow-lg"
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
            {/* Background Bar */}
            <div 
              className="h-3 rounded-full"
              style={{ backgroundColor: 'var(--color-primary)' }}
            />
            
            {/* Progress Bar */}
            <div 
              className="absolute top-0 left-0 h-3 rounded-full transition-all duration-700 ease-out"
              style={{ 
                backgroundColor: 'var(--color-accent)',
                width: `${percentage}%`
              }}
            />
            
            {/* Marker */}
            <div 
              className="absolute top-1/2 transform -translate-y-1/2 w-6 h-6 rounded-full border-3 border-white shadow-lg transition-all duration-700 ease-out"
              style={{ 
                backgroundColor: 'var(--color-accent)',
                left: `calc(${percentage}% - 12px)`,
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
      return 'Thoughtful Strategist';
    }
  };

  // Generate insights based on answers with display types
  const generateInsights = (answers) => {
    const insights = [];
    
    // Mindset insight - HIGHLIGHT CARD
    if (answers.mindset === 'growth') {
      insights.push({
        type: 'highlight',
        icon: Brain,
        title: 'Growth Mindset Strength',
        description: 'You believe abilities can be developed, which is a powerful asset for learning and overcoming challenges. This mindset is your foundation for continuous improvement.'
      });
    } else {
      insights.push({
        type: 'highlight',
        icon: Brain,
        title: 'Expertise Focus Strength',
        description: 'You value proven strengths and expertise. We can build on your existing capabilities while gradually expanding your comfort zone with confidence.'
      });
    }
    
    // Locus of control insight - SPECTRUM VISUALIZATION
    const locusScore = answers.locus === 'internal' ? 4.2 : 2.3; // Simulated score for visualization
    insights.push({
      type: 'spectrum',
      title: 'Personal Agency',
      description: 'Your sense of control over outcomes shapes how you approach challenges',
      userScore: locusScore,
      minLabel: 'External Focus',
      maxLabel: 'Internal Control'
    });
    
    // Regulatory focus insight - STANDARD CARD
    if (answers.regulatory_focus === 'promotion') {
      insights.push({
        type: 'standard',
        icon: TrendingUp,
        title: 'Achievement Orientation',
        description: 'You are driven by achieving positive aspirations. Framing goals in terms of gains and opportunities will be most effective for your motivation.'
      });
    } else {
      insights.push({
        type: 'standard',
        icon: Users,
        title: 'Responsibility Focus',
        description: 'You are motivated by fulfilling duties and preventing problems. Structure and security-focused approaches work best for building your confidence.'
      });
    }
    
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

            {/* Dynamic Insights Section */}
            <div className="space-y-6">
              <div className="text-center">
                <h3 
                  className="text-2xl font-bold mb-2"
                  style={{ color: 'var(--color-text)' }}
                >
                  Key Insights About Your Motivation
                </h3>
                <p 
                  className="text-base"
                  style={{ color: 'var(--color-muted)' }}
                >
                  These insights will shape your personalized coaching approach
                </p>
              </div>

              <div className="space-y-6 max-w-3xl mx-auto">
                {insights.map((insight, index) => {
                  // Highlight Card
                  if (insight.type === 'highlight') {
                    return (
                      <div
                        key={index}
                        className="relative overflow-hidden rounded-xl transition-all duration-300 hover:scale-105 hover:shadow-xl"
                        style={{ 
                          background: `linear-gradient(135deg, var(--color-accent), var(--color-secondary))`,
                          border: `2px solid var(--color-accent)`
                        }}
                      >
                        {/* Highlight Card Glow Effect */}
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-pulse" />
                        
                        <div className="relative flex items-start space-x-6 p-8">
                          <div 
                            className="flex-shrink-0 w-16 h-16 rounded-full flex items-center justify-center shadow-lg"
                            style={{ backgroundColor: 'white' }}
                          >
                            <insight.icon 
                              className="w-8 h-8"
                              style={{ color: 'var(--color-accent)' }}
                            />
                          </div>
                          <div className="flex-1 space-y-3">
                            <h4 className="text-2xl font-bold text-white">
                              {insight.title}
                            </h4>
                            <p className="text-lg leading-relaxed text-white/90">
                              {insight.description}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  }
                  
                  // Spectrum Visualization
                  if (insight.type === 'spectrum') {
                    return (
                      <SpectrumComponent
                        key={index}
                        title={insight.title}
                        description={insight.description}
                        userScore={insight.userScore}
                        minLabel={insight.minLabel}
                        maxLabel={insight.maxLabel}
                      />
                    );
                  }
                  
                  // Standard Card
                  return (
                    <div
                      key={index}
                      className="flex items-start space-x-4 p-6 rounded-xl transition-all duration-300 hover:scale-105 hover:shadow-lg"
                      style={{ 
                        backgroundColor: 'var(--color-card)',
                        border: `1px solid var(--color-border)`
                      }}
                    >
                      <div 
                        className="flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center"
                        style={{ backgroundColor: 'var(--color-accent)' }}
                      >
                        <insight.icon className="w-6 h-6 text-white" />
                      </div>
                      <div className="flex-1 space-y-2">
                        <h4 
                          className="text-lg font-semibold"
                          style={{ color: 'var(--color-text)' }}
                        >
                          {insight.title}
                        </h4>
                        <p 
                          className="text-base leading-relaxed"
                          style={{ color: 'var(--color-muted)' }}
                        >
                          {insight.description}
                        </p>
                      </div>
                    </div>
                  );
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
                    Your <span className="font-bold">'{archetype}'</span> profile tells us that the best way to approach your goal of <span className="font-bold">'{userGoal}'</span> is by turning that big plan into a clear, manageable first action. Ready to see what that looks like?
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