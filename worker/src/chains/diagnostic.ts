import { ChatOpenAI } from '@langchain/openai';
import { HumanMessage, SystemMessage, AIMessage } from '@langchain/core/messages';
import { DiagnosticConfig, CoachingMessage, PsychologicalAssessment, UserProfile } from '../types';

/**
 * Diagnostic Chain - Evidence-based Assessment (ET → SDT)
 * 
 * This chain implements evidence-based therapeutic assessment techniques
 * combined with Self-Determination Theory to understand user motivation,
 * psychological needs, and readiness for change.
 */
export class DiagnosticChain {
  private llm: ChatOpenAI;
  private config: DiagnosticConfig;

  constructor(apiKey: string, config?: Partial<DiagnosticConfig>) {
    this.config = {
      maxTokens: 800,
      temperature: 0.3, // Moderate creativity for nuanced responses
      model: 'gpt-4-turbo-preview',
      systemPrompt: this.buildSystemPrompt(),
      assessmentFrameworks: ['ET', 'SDT', 'CBT', 'ACT'],
      maxQuestions: 5,
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
    return `You are an AI coach trained in evidence-based therapeutic assessment and Self-Determination Theory (SDT). Your role is to understand users' psychological needs, motivational patterns, and readiness for change.

ASSESSMENT FRAMEWORKS:

1. **Evidence-Based Therapy (ET) Principles:**
   - Use validated assessment techniques
   - Focus on measurable psychological constructs
   - Maintain therapeutic alliance
   - Apply cognitive-behavioral insights

2. **Self-Determination Theory (SDT) Assessment:**
   - **Autonomy**: Feeling volitional and self-directed
   - **Competence**: Feeling effective and capable
   - **Relatedness**: Feeling connected and belonging
   
3. **Motivational Interviewing Principles:**
   - Express empathy and understanding
   - Develop discrepancy between current state and goals
   - Roll with resistance rather than confronting
   - Support self-efficacy beliefs

4. **Goal Setting Theory (GST) Integration:**
   - Assess goal specificity and clarity
   - Evaluate appropriate challenge level
   - Understand commitment and buy-in
   - Identify feedback mechanisms

DIAGNOSTIC TARGETS:

**Psychological Factors:**
- Locus of control (internal vs external)
- Mindset orientation (growth vs fixed)
- Regulatory focus (promotion vs prevention)
- Coping strategies and resilience
- Cognitive patterns and biases

**Motivational Factors:**
- Intrinsic vs extrinsic motivation
- Autonomy satisfaction and frustration
- Competence beliefs and self-efficacy
- Social connection and support systems

**Behavioral Patterns:**
- Change readiness and stages
- Habit formation and maintenance
- Procrastination and avoidance patterns
- Success and failure attribution styles

RESPONSE GUIDELINES:

1. **Ask Strategic Questions**: Use open-ended questions that reveal underlying psychological patterns
2. **Reflect and Validate**: Show understanding before moving to assessment
3. **Explore Ambivalence**: Help users articulate conflicting feelings about change
4. **Assess Systematically**: Gather information across all SDT domains
5. **Maintain Hope**: Focus on strengths and growth potential

RESPONSE FORMAT:
{
  "type": "DIAGNOSTIC_QUESTION|REFLECTION_PROMPT|ASSESSMENT_SUMMARY",
  "content": "Your response to the user",
  "strategy": "ET_ASSESSMENT|SDT_AUTONOMY|SDT_COMPETENCE|SDT_RELATEDNESS",
  "confidence": 0.0-1.0,
  "assessmentInsights": {
    "autonomyLevel": 1-5,
    "competenceLevel": 1-5,
    "relatednessLevel": 1-5,
    "motivationType": "intrinsic|extrinsic|amotivated",
    "changeReadiness": "precontemplation|contemplation|preparation|action|maintenance"
  },
  "followUpSuggestions": ["specific", "next", "questions"]
}

Remember: Build rapport first, assess second, intervene third.`;
  }

  async assessUser(
    message: CoachingMessage, 
    userProfile?: UserProfile,
    conversationHistory?: string[]
  ): Promise<{
    response: string;
    type: string;
    strategy: string;
    confidence: number;
    assessmentInsights: Partial<PsychologicalAssessment>;
    followUpSuggestions: string[];
  }> {
    try {
      const messages = [
        new SystemMessage(this.config.systemPrompt),
        ...this.buildConversationContext(conversationHistory),
        new HumanMessage(this.buildAssessmentPrompt(message, userProfile))
      ];

      const response = await this.llm.invoke(messages);
      const assessment = JSON.parse(response.content as string);

      return {
        response: assessment.content,
        type: assessment.type,
        strategy: assessment.strategy,
        confidence: assessment.confidence,
        assessmentInsights: this.parseAssessmentInsights(assessment.assessmentInsights),
        followUpSuggestions: assessment.followUpSuggestions || []
      };

    } catch (error) {
      console.error('Diagnostic chain error:', error);
      
      // Fallback to basic empathetic response
      return {
        response: "I hear what you're sharing, and I appreciate your openness. Help me understand more about what this experience is like for you.",
        type: "DIAGNOSTIC_QUESTION",
        strategy: "ET_ASSESSMENT",
        confidence: 0.5,
        assessmentInsights: {},
        followUpSuggestions: ["Tell me more about how this affects your daily life"]
      };
    }
  }

  private buildConversationContext(history?: string[]): (HumanMessage | AIMessage)[] {
    if (!history || history.length === 0) return [];
    
    return history.slice(-6).map((msg, index) => // Last 3 exchanges
      index % 2 === 0 
        ? new HumanMessage(msg)
        : new AIMessage(msg)
    );
  }

  private buildAssessmentPrompt(message: CoachingMessage, userProfile?: UserProfile): string {
    let prompt = `User Message: "${message.message}"\n\n`;

    if (userProfile?.psychologicalProfile) {
      prompt += `Known Psychological Profile:
- Mindset: ${userProfile.psychologicalProfile.mindset || 'unknown'}
- Locus of Control: ${userProfile.psychologicalProfile.locus || 'unknown'}
- Regulatory Focus: ${userProfile.psychologicalProfile.regulatory_focus || 'unknown'}\n\n`;
    }

    if (message.context?.currentGoal) {
      prompt += `Current Goal Context: ${message.context.currentGoal}\n\n`;
    }

    prompt += `Based on this message and context, provide a diagnostic response that:

1. **Builds Rapport**: Acknowledges and validates their experience
2. **Assesses Strategically**: Gathers information about their psychological needs
3. **Explores Motivations**: Understands their drivers and barriers
4. **Identifies Patterns**: Looks for cognitive, emotional, or behavioral patterns

Focus on one primary assessment area per response to avoid overwhelming the user. Use the specified JSON format.`;

    return prompt;
  }

  private parseAssessmentInsights(insights: any): Partial<PsychologicalAssessment> {
    return {
      motivationalProfile: {
        autonomy: insights.autonomyLevel || 3,
        competence: insights.competenceLevel || 3,
        relatedness: insights.relatednessLevel || 3
      },
      // Additional parsing based on assessment results
    };
  }

  async generateQuestionSequence(
    topic: 'autonomy' | 'competence' | 'relatedness' | 'goals' | 'barriers',
    userProfile?: UserProfile
  ): Promise<string[]> {
    const questionBank = {
      autonomy: [
        "What draws you to this particular goal or change?",
        "How much does this goal feel like it comes from you versus external pressures?",
        "When you think about making this change, how much choice do you feel you have in how you approach it?",
        "What would it mean to you personally to achieve this?",
        "How aligned does this goal feel with your core values?"
      ],
      competence: [
        "What strengths have you used to overcome challenges in the past?",
        "On a scale of 1-10, how confident do you feel about your ability to make progress on this?",
        "What skills or resources do you feel you need to develop?",
        "Tell me about a time when you successfully changed something about yourself.",
        "What makes you feel most capable and effective?"
      ],
      relatedness: [
        "Who in your life supports or understands this goal?",
        "How do your relationships impact your motivation for this change?",
        "What kind of support would be most helpful to you right now?",
        "How does this goal connect to your relationships with others?",
        "Who would be most excited to see you succeed with this?"
      ],
      goals: [
        "What would success look like for you with this goal?",
        "How will you know when you're making progress?",
        "What's the smallest version of this goal that would still feel meaningful?",
        "How does this goal connect to your bigger life vision?",
        "What obstacles do you anticipate, and how might you handle them?"
      ],
      barriers: [
        "What typically gets in the way when you try to make changes?",
        "What thoughts go through your mind when you think about starting?",
        "How do you usually respond when you face setbacks?",
        "What patterns have you noticed in past attempts to change?",
        "What would need to be different this time for you to succeed?"
      ]
    };

    return questionBank[topic] || [];
  }
}