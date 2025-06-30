import { ChatOpenAI } from '@langchain/openai';
import { HumanMessage, SystemMessage } from '@langchain/core/messages';
import { InterventionConfig, CoachingMessage, UserProfile, PsychologicalAssessment, UserGoal } from '../types';

/**
 * Interventions Chain - Goal Setting Theory (GST) Based Prescriptions
 * 
 * This chain provides evidence-based interventions and strategies based on
 * Goal Setting Theory principles, tailored to the user's psychological profile
 * and current needs assessment.
 */
export class InterventionsChain {
  private llm: ChatOpenAI;
  private config: InterventionConfig;

  constructor(apiKey: string, config?: Partial<InterventionConfig>) {
    this.config = {
      maxTokens: 1000,
      temperature: 0.4, // Balanced creativity for practical suggestions
      model: 'gpt-4-turbo-preview',
      systemPrompt: this.buildSystemPrompt(),
      interventionTypes: ['behavioral', 'cognitive', 'motivational', 'goal_setting'],
      personalityFactors: true,
      ...config
    };

    this.llm = new ChatOpenAI({
      openAIApiKey: apiKey,
      modelName: this.config.model,
      temperature: this.config.temperature,
      maxTokens: this.config.maxTokens,
    });
  }

  private buildSystemPrompt(): string {
    return `You are an expert AI coach specializing in evidence-based interventions using Goal Setting Theory (GST) principles. Your role is to prescribe specific, actionable strategies tailored to each user's psychological profile and current situation.

GOAL SETTING THEORY (GST) FRAMEWORK:

1. **Specificity**: Goals must be clear, specific, and unambiguous
2. **Difficulty**: Goals should be challenging but achievable
3. **Commitment**: User must be committed to and accept the goal
4. **Feedback**: Regular progress monitoring and feedback mechanisms
5. **Task Complexity**: Adjust strategies based on task complexity

INTERVENTION CATEGORIES:

**Behavioral Interventions:**
- Implementation intentions (if-then planning)
- Habit stacking and cue-based design
- Environmental design and stimulus control
- Progressive goal laddering
- Behavioral momentum techniques

**Cognitive Interventions:**
- Cognitive restructuring for goal-related beliefs
- Growth mindset activation strategies
- Attribution retraining techniques
- Self-efficacy building exercises
- Mental contrasting (WOOP method)

**Motivational Interventions:**
- Intrinsic motivation enhancement
- Autonomy support strategies
- Competence building activities
- Social connection and accountability
- Values clarification and alignment

**Self-Regulation Interventions:**
- Self-monitoring and tracking systems
- Temptation bundling
- Commitment devices and pre-commitment
- Recovery and resilience planning
- Attention restoration techniques

PERSONALIZATION FACTORS:

**Personality Considerations:**
- Conscientiousness → Structure vs flexibility needs
- Extraversion → Social vs individual approaches
- Neuroticism → Anxiety management and support needs
- Openness → Novelty vs routine preferences
- Agreeableness → Collaboration vs competition

**Motivational Profile (SDT):**
- High Autonomy → Choice and customization emphasis
- Low Autonomy → Gentle structure and support
- High Competence → Challenge and growth focus
- Low Competence → Skill building and confidence
- High Relatedness → Social and community elements
- Low Relatedness → Connection building strategies

**Regulatory Focus:**
- Promotion Focus → Approach goals, gains, ideals
- Prevention Focus → Avoidance goals, security, duties

INTERVENTION DESIGN PRINCIPLES:

1. **Start Small**: Begin with micro-habits and minimal viable changes
2. **Build Progressively**: Increase difficulty as competence grows
3. **Ensure Relevance**: Connect to user's values and intrinsic motivations
4. **Provide Structure**: Clear steps and feedback mechanisms
5. **Plan for Obstacles**: Anticipate and prepare for common barriers
6. **Celebrate Progress**: Build in recognition and positive reinforcement

RESPONSE FORMAT:
{
  "interventionType": "behavioral|cognitive|motivational|goal_setting",
  "strategy": "specific strategy name",
  "content": "detailed explanation for the user",
  "actionSteps": ["specific", "actionable", "steps"],
  "timeframe": "suggested timeframe for implementation",
  "successMetrics": ["how to measure progress"],
  "obstacles": ["anticipated challenges"],
  "adaptations": ["modifications based on user profile"],
  "rationale": "why this intervention fits their profile",
  "confidence": 0.0-1.0
}

Always provide practical, evidence-based interventions that are immediately actionable.`;
  }

  async prescribeIntervention(
    message: CoachingMessage,
    userProfile: UserProfile,
    assessmentData: Partial<PsychologicalAssessment>,
    currentGoals?: UserGoal[]
  ): Promise<{
    interventionType: string;
    strategy: string;
    content: string;
    actionSteps: string[];
    timeframe: string;
    successMetrics: string[];
    obstacles: string[];
    adaptations: string[];
    rationale: string;
    confidence: number;
  }> {
    try {
      const prompt = this.buildInterventionPrompt(message, userProfile, assessmentData, currentGoals);
      
      const messages = [
        new SystemMessage(this.config.systemPrompt),
        new HumanMessage(prompt)
      ];

      const response = await this.llm.invoke(messages);
      const intervention = JSON.parse(response.content as string);

      return {
        interventionType: intervention.interventionType,
        strategy: intervention.strategy,
        content: intervention.content,
        actionSteps: intervention.actionSteps || [],
        timeframe: intervention.timeframe || "1-2 weeks",
        successMetrics: intervention.successMetrics || [],
        obstacles: intervention.obstacles || [],
        adaptations: intervention.adaptations || [],
        rationale: intervention.rationale || "",
        confidence: intervention.confidence || 0.7
      };

    } catch (error) {
      console.error('Interventions chain error:', error);
      
      // Fallback to basic goal-setting intervention
      return {
        interventionType: "goal_setting",
        strategy: "micro_goal_approach",
        content: "Let's start with a very small, specific step you can take in the next 24 hours. What's the smallest action that would move you toward your goal?",
        actionSteps: [
          "Choose one specific micro-action for tomorrow",
          "Set a specific time to do it",
          "Notice how it feels to complete it",
          "Report back on your experience"
        ],
        timeframe: "24 hours",
        successMetrics: ["Completed the micro-action", "Noticed emotional response"],
        obstacles: ["Forgetting", "Feeling overwhelmed"],
        adaptations: ["Set a phone reminder", "Choose an even smaller action if needed"],
        rationale: "Starting small builds confidence and momentum",
        confidence: 0.8
      };
    }
  }

  private buildInterventionPrompt(
    message: CoachingMessage,
    userProfile: UserProfile,
    assessmentData: Partial<PsychologicalAssessment>,
    currentGoals?: UserGoal[]
  ): string {
    let prompt = `INTERVENTION REQUEST

User Message: "${message.message}"

USER PROFILE:
`;

    // Add psychological profile data
    if (userProfile.psychologicalProfile) {
      prompt += `Psychological Profile:
- Mindset: ${userProfile.psychologicalProfile.mindset || 'unknown'}
- Locus of Control: ${userProfile.psychologicalProfile.locus || 'unknown'}
- Regulatory Focus: ${userProfile.psychologicalProfile.regulatory_focus || 'unknown'}
`;

      if (userProfile.psychologicalProfile.personality_traits) {
        prompt += `Personality Traits:
- Organization Level: ${userProfile.psychologicalProfile.personality_traits.disorganized || 'unknown'}
- Social Orientation: ${userProfile.psychologicalProfile.personality_traits.outgoing || 'unknown'}
- Emotional Stability: ${userProfile.psychologicalProfile.personality_traits.moody || 'unknown'}
`;
      }
    }

    // Add motivational profile from assessment
    if (assessmentData.motivationalProfile) {
      prompt += `
SDT Assessment:
- Autonomy: ${assessmentData.motivationalProfile.autonomy}/5
- Competence: ${assessmentData.motivationalProfile.competence}/5
- Relatedness: ${assessmentData.motivationalProfile.relatedness}/5
`;
    }

    // Add current goals if available
    if (currentGoals && currentGoals.length > 0) {
      prompt += `
Current Goals:
${currentGoals.map(goal => `- ${goal.title} (${goal.progress}% complete, ${goal.status})`).join('\n')}
`;
    }

    prompt += `
CONTEXT:
${message.context ? JSON.stringify(message.context, null, 2) : 'No additional context'}

Based on this user profile and their current message, design a specific, evidence-based intervention that:

1. **Matches their psychological profile** (mindset, locus, regulatory focus)
2. **Addresses their SDT needs** (autonomy, competence, relatedness gaps)
3. **Follows GST principles** (specific, appropriately challenging, with feedback)
4. **Is immediately actionable** (they can start today or tomorrow)
5. **Accounts for their personality** (organization style, social preferences, emotional patterns)

Choose the most appropriate intervention type and provide detailed, personalized guidance using the specified JSON format.`;

    return prompt;
  }

  async adaptIntervention(
    originalIntervention: any,
    feedback: string,
    difficultyAdjustment: 'easier' | 'harder' | 'different_approach'
  ): Promise<any> {
    const adaptationPrompt = `
INTERVENTION ADAPTATION REQUEST

Original Intervention: ${JSON.stringify(originalIntervention, null, 2)}

User Feedback: "${feedback}"

Requested Adjustment: ${difficultyAdjustment}

Please adapt the intervention based on this feedback. Maintain the core strategy but adjust:
- Difficulty level (make steps smaller/larger)
- Approach method (different angle to same goal)
- Support mechanisms (more/less structure)
- Timeframe (shorter/longer periods)

Provide the adapted intervention in the same JSON format.`;

    try {
      const messages = [
        new SystemMessage(this.config.systemPrompt),
        new HumanMessage(adaptationPrompt)
      ];

      const response = await this.llm.invoke(messages);
      return JSON.parse(response.content as string);

    } catch (error) {
      console.error('Intervention adaptation error:', error);
      return originalIntervention; // Return original if adaptation fails
    }
  }

  async generateMicroHabits(goal: string, userProfile: UserProfile): Promise<string[]> {
    const microHabitPrompt = `
Generate 5 micro-habits for this goal: "${goal}"

User Profile Summary:
${JSON.stringify(userProfile.psychologicalProfile, null, 2)}

Micro-habits should be:
- Less than 2 minutes to complete
- Require no special equipment or preparation
- Be obvious triggers for larger habits
- Match the user's personality and preferences

Return as a simple JSON array of strings.`;

    try {
      const messages = [
        new SystemMessage("You are an expert in habit formation and behavior change."),
        new HumanMessage(microHabitPrompt)
      ];

      const response = await this.llm.invoke(messages);
      return JSON.parse(response.content as string);

    } catch (error) {
      console.error('Micro-habits generation error:', error);
      return [
        "Write one sentence about your goal each morning",
        "Take one deep breath before starting",
        "Set out one item related to your goal",
        "Say your goal out loud once per day",
        "Spend 30 seconds visualizing success"
      ];
    }
  }
}