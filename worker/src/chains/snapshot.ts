import { UserProfile, OnboardingAnswers, Insight } from '../types';

export class SnapshotChain {
  constructor() {}

  // Determine user's archetype based on their answers
  private determineArchetype = (onboardingAnswers: OnboardingAnswers, userProfile: UserProfile): string => {
    const mindset = onboardingAnswers.mindset;
    const locus = userProfile.psychologicalProfile?.locus;
    const focus = userProfile.psychologicalProfile?.regulatory_focus;

    // Map 'developed' to 'growth' and 'stable' to 'fixed' for archetype determination
    const mappedMindset = mindset === 'developed' ? 'growth' : 'fixed';

    // Simple archetype determination logic
    if (mappedMindset === 'growth' && locus === 'internal' && focus === 'promotion') {
      return 'Visionary Achiever';
    } else if (mappedMindset === 'growth' && locus === 'internal' && focus === 'prevention') {
      return 'Steady Builder';
    } else if (mappedMindset === 'growth' && locus === 'external' && focus === 'promotion') {
      return 'Adaptive Optimist';
    } else if (mappedMindset === 'growth' && locus === 'external' && focus === 'prevention') {
      return 'Compassionate Achiever';
    } else if (mappedMindset === 'fixed' && locus === 'internal' && focus === 'promotion') {
      return 'Determined Specialist';
    } else if (mappedMindset === 'fixed' && locus === 'internal' && focus === 'prevention') {
      return 'Reliable Executor';
    } else if (mappedMindset === 'fixed' && locus === 'external' && focus === 'promotion') {
      return 'Opportunistic Realist';
    } else {
      return 'Thoughtful Planner';
    }
  };

  // Generate supportive descriptions based on user's answers
  private generateSupportiveDescription = (onboardingAnswers: OnboardingAnswers, userProfile: UserProfile, insight: Insight): string => {
    const mindset = onboardingAnswers.mindset;
    const locus = userProfile.psychologicalProfile?.locus;
    const regulatory_focus = userProfile.psychologicalProfile?.regulatory_focus;

    // Map 'developed' to 'growth' and 'stable' to 'fixed' for description generation
    const mappedMindset = mindset === 'developed' ? 'growth' : 'fixed';

    if (insight.type === 'spectrum') {
      // Personal Agency - Focus on starting point, not judgment  
      if (locus === 'external') {
        return "You currently tend to focus on external circumstances. This is a common and understandable pattern, and it provides a clear starting point for developing your sense of personal agency and influence.";
      } else {
        return "Your natural inclination is towards personal action and control. This internal orientation is a powerful foundation we can build upon to achieve your goals and expand your influence.";
      }
    }
    
    if (insight.type === 'balance') {
      // Growth Mindset - Frame as malleable belief, not fixed trait
      if (mappedMindset === 'fixed') {
        return "Your current perspective suggests a belief that abilities are largely fixed. The exciting news is that this perspective itself is dynamic and can be cultivated. We'll focus on strategies to foster a more growth-oriented outlook.";
      } else {
        return "Your strong belief in the ability to develop and grow is an incredible asset. This growth-oriented mindset will serve as the cornerstone for all the strategies we co-create.";
      }
    }
    
    if (insight.type === 'ring') {
      // Achievement Orientation - Frame both as strategic strengths
      if (regulatory_focus === 'promotion') {
        return "Your primary focus is on pursuing new opportunities and achieving gains. This promotion-focused approach infuses your goal achievement strategies with energy and ambition.";
      } else if (regulatory_focus === 'prevention') {
        return "Your primary focus is on ensuring stability and mitigating potential problems. This prevention-focused approach brings meticulous planning and a keen awareness of risks to your strategies.";
      } else {
        return "Your focus demonstrates a balance between pursuing opportunities and ensuring stability. This allows you to strategically leverage both promotional energy and preventive wisdom in your approach.";
      }
    }
    
    return insight.description;
  };

  // Generate insights with supportive, non-judgmental framing
  private generateInsights = (onboardingAnswers: OnboardingAnswers, userProfile: UserProfile): Insight[] => {
    const insights = [];
    const mindset = onboardingAnswers.mindset;
    const locus = userProfile.psychologicalProfile?.locus;
    const regulatory_focus = userProfile.psychologicalProfile?.regulatory_focus;

    // Map 'developed' to 'growth' and 'stable' to 'fixed' for insight generation
    const mappedMindset = mindset === 'developed' ? 'growth' : 'fixed';
    
    // Personal Agency insight - SPECTRUM BAR with reframed labels
    const locusScore = locus === 'internal' ? 4.2 : 2.3;
    const personalAgencyInsight: Insight = {
      type: 'spectrum',
      title: 'Personal Agency',
      description: '',
      userScore: locusScore,
      minLabel: 'Focus on Circumstance',  // Changed from "External"
      maxLabel: 'Focus on Action'         // Changed from "Internal"
    };
    personalAgencyInsight.description = this.generateSupportiveDescription(onboardingAnswers, userProfile, personalAgencyInsight);
    insights.push(personalAgencyInsight);
    
    // Growth Mindset insight - BELIEF BALANCE BAR with supportive framing
    const mindsetScore = mappedMindset === 'growth' ? 4.5 : 2.0;
    const growthMindsetInsight: Insight = {
      type: 'balance',
      title: 'Growth Mindset',
      description: '',
      userScore: mindsetScore,
      leftLabel: 'Growth Belief',          // Emphasized as "belief"
      rightLabel: 'Current Fixed Belief'   // Framed as "current" not permanent
    };
    growthMindsetInsight.description = this.generateSupportiveDescription(onboardingAnswers, userProfile, growthMindsetInsight);
    insights.push(growthMindsetInsight);
    
    // Achievement Orientation insight - FOCUS RING with both as strengths
    const focusScore = regulatory_focus === 'promotion' ? 4.0 : 2.5;
    const achievementInsight: Insight = {
      type: 'ring',
      title: 'Achievement Orientation',
      description: '',
      userScore: focusScore,
      leftLabel: 'Promotion Focus',
      rightLabel: 'Prevention Focus'
    };
    achievementInsight.description = this.generateSupportiveDescription(onboardingAnswers, userProfile, achievementInsight);
    insights.push(achievementInsight);
    
    return insights;
  };

  // Generate narrative summary based on archetype and insights
  private generateNarrativeSummary = (archetype: string, userGoal: string): string => {
    // This can be expanded with more sophisticated logic or even an LLM call
    // For now, a simple placeholder based on the archetype
    if (archetype === 'Visionary Achiever') {
      return `As a 'Visionary Achiever,' you possess a powerful belief in your capacity for growth and a natural drive towards your aspirations. Your focus on personal action means you likely embrace the responsibility of bringing your goals to fruition. This potent combination of ambition and accountability provides a clear path for us to build a plan that is both inspiring and sustainable for you. Your current focus is on ${userGoal}.`;
    } else if (archetype === 'Steady Builder') {
      return `As a 'Steady Builder,' you combine a growth-oriented mindset with a strong emphasis on fulfilling duties and responsibilities. This makes you exceptionally reliable and thorough. We will leverage your methodical approach to cultivate consistent and sustainable progress towards ${userGoal}.`;
    } else if (archetype === 'Adaptive Optimist') {
      return `Your profile as an 'Adaptive Optimist' reveals a strong belief in growth, even when navigating challenging external circumstances. You are adept at identifying and seizing opportunities. We will work together to channel this adaptability to achieve consistent progress on ${userGoal}.`;
    } else if (archetype === 'Compassionate Achiever') {
      return `As a 'Compassionate Achiever,' you possess a growth mindset and a natural inclination to prevent problems, often for the benefit of others. Your empathy is a significant strength. We will explore how to harmoniously balance your care for others with your personal progress on ${userGoal}.`;
    } else if (archetype === 'Determined Specialist') {
      return `Your 'Determined Specialist' archetype indicates a focused mindset combined with a strong internal drive for advancement. You excel in specific domains and are driven to master them. We will focus on strategies that enable you to effectively apply your expertise towards ${userGoal}.`;
    } else if (archetype === 'Reliable Executor') {
      return `As a 'Reliable Executor,' you demonstrate a focused mindset with a strong emphasis on duties and responsibilities. You are dependable and ensure tasks are completed efficiently. We will work on optimizing your processes to achieve ${userGoal} with greater ease and impact.`;
    } else if (archetype === 'Opportunistic Realist') {
      return `Your 'Opportunistic Realist' archetype suggests a pragmatic mindset and an ability to adapt to external circumstances to achieve your goals. You are resourceful and adept at seizing opportunities. We will focus on identifying and leveraging the most favorable external factors to advance ${userGoal}.`;
    } else {
      return `As a 'Thoughtful Planner,' you approach challenges with careful consideration and a strategic mindset. We will utilize your analytical skills to devise a clear and effective path forward for ${userGoal}.`;
    }
  };

  public async generateSnapshot(onboardingAnswers: OnboardingAnswers, userProfile: UserProfile) {
    const archetype = this.determineArchetype(onboardingAnswers, userProfile);
    const insights = this.generateInsights(onboardingAnswers, userProfile);
    const userGoal = onboardingAnswers.final_goal_context || "improving your overall well-being";
    const narrativeSummary = this.generateNarrativeSummary(archetype, userGoal);

    return {
      archetype,
      insights,
      userGoal,
      narrativeSummary,
    };
  }
}

