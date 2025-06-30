import React from 'react';
import { Brain, Target, Lightbulb, TrendingUp, Users, Zap, ChevronRight } from 'lucide-react';
import { AuraProvider } from '../contexts/AuraProvider';
import AuraAvatar from './AuraAvatar';
import Card from './Card';
import Button from './Button';

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

  // Generate insights based on answers
  const generateInsights = (answers) => {
    const insights = [];
    
    // Mindset insight
    if (answers.mindset === 'growth') {
      insights.push({
        icon: Brain,
        title: 'Growth Mindset Strength',
        description: 'You believe abilities can be developed, which is a powerful asset for learning and overcoming challenges.'
      });
    } else {
      insights.push({
        icon: Brain,
        title: 'Expertise Focus',
        description: 'You value proven strengths and expertise. We can build on your existing capabilities while expanding your comfort zone.'
      });
    }
    
    // Locus of control insight
    if (answers.locus === 'internal') {
      insights.push({
        icon: Target,
        title: 'Personal Agency',
        description: 'You take ownership of your outcomes, which gives you tremendous power to create positive change.'
      });
    } else {
      insights.push({
        icon: Lightbulb,
        title: 'Contextual Awareness',
        description: 'You recognize external factors that influence success. We can work on strategies to increase your sense of personal control.'
      });
    }
    
    // Regulatory focus insight
    if (answers.regulatory_focus === 'promotion') {
      insights.push({
        icon: TrendingUp,
        title: 'Achievement Orientation',
        description: 'You are driven by achieving positive aspirations. Framing goals in terms of gains and opportunities will be most effective.'
      });
    } else {
      insights.push({
        icon: Users,
        title: 'Responsibility Focus',
        description: 'You are motivated by fulfilling duties and preventing problems. Structure and security-focused approaches work best for you.'
      });
    }
    
    // Personality insights
    const organizationScore = answers.personality_disorganized || 3;
    const socialScore = answers.personality_outgoing || 3;
    const moodScore = answers.personality_moody || 3;
    
    if (organizationScore <= 2) {
      insights.push({
        icon: Zap,
        title: 'Natural Organization',
        description: 'Your systematic approach to life is a major strength. We can leverage this to build sustainable habits.'
      });
    } else if (organizationScore >= 4) {
      insights.push({
        icon: Zap,
        title: 'Creative Flexibility',
        description: 'Your flexible approach allows for creative solutions. We can add structure that supports rather than constrains your style.'
      });
    }
    
    return insights.slice(0, 3); // Return top 3 insights
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

            {/* Insights Section */}
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

              <div className="grid md:grid-cols-1 gap-6 max-w-3xl mx-auto">
                {insights.map((insight, index) => (
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
                ))}
              </div>
            </div>

            {/* Bridge Text Section */}
            <div className="text-center space-y-6 pt-8 border-t" style={{ borderColor: 'var(--color-border)' }}>
              <div 
                className="max-w-3xl mx-auto p-8 rounded-xl"
                style={{ 
                  backgroundColor: 'var(--color-primary)',
                  border: `1px solid var(--color-border)`
                }}
              >
                <p 
                  className="text-lg md:text-xl leading-relaxed"
                  style={{ color: 'var(--color-text)' }}
                >
                  This snapshot is your <span className="font-bold">'why'</span>—the unique blueprint of what drives you and what holds you back. It's the diagnosis. The next step is the plan. This profile allows me to become your full-time adaptive coach, helping you diagnose challenges in real-time and co-creating a step-by-step plan to overcome them.
                </p>
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
                  <span>Activate My Adaptive Coach</span>
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