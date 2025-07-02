import { UserProfile } from '../types';

export class SnapshotChain {
  constructor() {}

  // Determine user's archetype based on their answers
  private determineArchetype = (answers: any): string => {
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
  private generateSupportiveDescription = (answers: any, insight: any): string => {
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
  private generateInsights = (answers: any) => {
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
    personalAgencyInsight.description = this.generateSupportiveDescription(answers, personalAgencyInsight);
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
    growthMindsetInsight.description = this.generateSupportiveDescription(answers, growthMindsetInsight);
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
    achievementInsight.description = this.generateSupportiveDescription(answers, achievementInsight);
    insights.push(achievementInsight);
    
    return insights;
  };

  // Generate narrative summary based on archetype and insights
  private generateNarrativeSummary = (archetype: string, userGoal: string): string => {
    // This can be expanded with more sophisticated logic or even an LLM call
    // For now, a simple placeholder based on the archetype
    if (archetype === 'Visionary Achiever') {
      return `What this tells me is that you're a 'Visionary Achiever.' You have a powerful belief that you can grow and a natural drive toward your goals. At the same time, your focus on personal action means you likely feel the full weight of getting things done. It's a potent combination of aspiration and responsibility, and it gives us a clear picture of how to build a plan that feels both ambitious and sustainable for you. Your current focus is on ${userGoal}.`;
    } else if (archetype === 'Steady Builder') {
      return `As a 'Steady Builder,' you combine a growth mindset with a focus on fulfilling duties and responsibilities. This makes you incredibly reliable and thorough. We'll leverage your methodical approach to build sustainable progress towards ${userGoal}.`;
    } else if (archetype === 'Adaptive Optimist') {
      return `Your profile as an 'Adaptive Optimist' shows a strong belief in growth, even when external circumstances are challenging. You're adept at finding opportunities. We'll work on channeling this adaptability to make consistent progress on ${userGoal}.`;
    } else if (archetype === 'Compassionate Achiever') {
      return `As a 'Compassionate Achiever,' you possess a growth mindset and a focus on preventing problems, often for the benefit of others. Your empathy is a strength. We'll explore how to balance your care for others with your own progress on ${userGoal}.`;
    } else if (archetype === 'Determined Specialist') {
      return `Your 'Determined Specialist' archetype indicates a fixed mindset combined with a strong internal drive for promotion. You excel in specific areas and are driven to master them. We'll focus on strategies that allow you to apply your expertise effectively towards ${userGoal}.`;
    } else if (archetype === 'Reliable Executor') {
      return `As a 'Reliable Executor,' you have a fixed mindset but a strong focus on duties and responsibilities. You are dependable and ensure tasks are completed. We'll work on optimizing your processes to achieve ${userGoal} efficiently.`;
    } else if (archetype === 'Opportunistic Realist') {
      return `Your 'Opportunistic Realist' archetype suggests a fixed mindset but an ability to adapt to external circumstances for promotion. You are pragmatic and seize opportunities. We'll focus on identifying and leveraging the best external factors to advance ${userGoal}.`;
    } else {
      return `As a 'Thoughtful Planner,' you approach challenges with careful consideration. We'll use your analytical skills to devise a clear path forward for ${userGoal}.`;
    }
  };

  public async generateSnapshot(onboardingAnswers: any, userProfile: UserProfile) {
    const archetype = this.determineArchetype(onboardingAnswers);
    const insights = this.generateInsights(onboardingAnswers);
    const userGoal = onboardingAnswers.final_focus || "improving your overall well-being";
    const narrativeSummary = this.generateNarrativeSummary(archetype, userGoal);

    return {
      archetype,
      insights,
      userGoal,
      narrativeSummary,
    };
  }
}

