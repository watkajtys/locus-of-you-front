import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import {
  HumanMessage,
  SystemMessage,
} from "@langchain/core/messages";
import {
  DiagnosticConfig,
  CoachingMessage,
  UserProfile,
  PsychologicalAssessment,
} from "../types";

export class DiagnosticChain {
  private model: ChatGoogleGenerativeAI;
  private config: DiagnosticConfig;

  constructor(apiKey: string, config: DiagnosticConfig) {
    this.config = config;
    this.model = new ChatGoogleGenerativeAI({
      model: this.config.model || "gemini-2.5-flash",
      temperature: this.config.temperature || 0.3,
      apiKey: apiKey,
    });
  }

  private createSystemPrompt(): SystemMessage {
    return new SystemMessage(
      `You are an expert AI coach specializing in evidence-based psychological assessment, Self-Determination Theory (SDT), Motivational Interviewing, and conversational coaching techniques.
      
      MISSION: Conduct a gentle, strategic assessment of the user's core motivational needs through a single, well-crafted question that builds rapport while gathering diagnostic insights.
      
      SDT ASSESSMENT FRAMEWORK:
      Assess these three fundamental psychological needs:
      
      1. **AUTONOMY** - Signs to detect:
         - Feeling controlled, pressured, or micromanaged
         - Lack of choice or input in decisions
         - Resentment about "shoulds" and external expectations
         - Desire for self-direction and personal agency
      
      2. **COMPETENCE** - Signs to detect:
         - Self-doubt, imposter syndrome, or skill frustration
         - Feeling overwhelmed or underprepared
         - Seeking mastery or capability in specific areas
         - Need for achievable challenges and skill development
      
      3. **RELATEDNESS** - Signs to detect:
         - Loneliness, isolation, or disconnection
         - Lack of support or understanding from others
         - Desire for belonging, community, or meaningful relationships
         - Need for social connection around their goals
      
      MOTIVATIONAL INTERVIEWING PRINCIPLES:
      - Ask open-ended questions that invite reflection
      - Express empathy and understanding
      - Avoid direct confrontation or advice-giving
      - Help user explore their own motivations and barriers
      - Use reflective listening techniques in your question framing
      
      QUESTION QUALITY STANDARDS:
      - Must be genuinely curious and supportive
      - Should feel like a conversation, not an interrogation
      - Must respect their current emotional state
      - Should help them feel heard and understood
      - Must gather specific insights for intervention design
      
      RESPONSE FORMAT: Return a JSON object with:
      {
        "response": "A single, strategic open-ended question that builds rapport while assessing their primary SDT need. Must feel natural and supportive.",
        "strategy": "Primary SDT need being assessed: 'SDT_AUTONOMY', 'SDT_COMPETENCE', or 'SDT_RELATEDNESS'",
        "assessmentInsights": "Object containing new insights about their psychological state, motivation level, and specific needs discovered from their message"
      }`
    );
  }

  private createHumanMessage(message: CoachingMessage, userProfile: UserProfile): HumanMessage {
    const onboardingAnswers = message.context?.onboardingAnswers;
    const profileSummary = JSON.stringify(userProfile.psychologicalProfile, null, 2);
    
    const content = `USER'S COMPLETE CONTEXT:

CURRENT MESSAGE: "${message.message}"

USER BACKGROUND:
- User ID: ${userProfile.id}
- Account Created: ${userProfile.createdAt}
- Last Active: ${userProfile.lastActive}
${userProfile.preferences ? `- User Preferences: ${JSON.stringify(userProfile.preferences)}` : '- No specific preferences set yet'}

ONBOARDING INSIGHTS:
${onboardingAnswers ? `
- Primary Goal: "${onboardingAnswers.final_goal_context}"
- Mindset Approach: ${onboardingAnswers.mindset} (developed = growth-oriented, stable = more fixed)
- Personal Agency: ${onboardingAnswers.agency} (primary_driver = internal locus, external_factors = external locus)
- Motivation Source: ${onboardingAnswers.motivation_source}
- Challenge Approach: ${onboardingAnswers.approach_to_challenges}
- Focus Style: ${onboardingAnswers.focus_style}
- Risk Tolerance: ${onboardingAnswers.risk_tolerance}
- Social Orientation: ${onboardingAnswers.social_orientation}
` : 'No onboarding data available - focus on discovering these aspects through questioning'}

PSYCHOLOGICAL PROFILE DATA:
${profileSummary}

SESSION CONTEXT:
- Session Type: ${message.context?.sessionType || 'diagnostic'}
- Urgency Level: ${message.context?.urgencyLevel || 'medium'}
- Previous Messages Count: ${message.context?.previousMessages?.length || 0}

ASSESSMENT STRATEGY:
- Use supportive, empathetic tone appropriate for coaching
- Consider their goal context when framing questions  
- Build on any onboarding insights available
- Focus on the SDT need that seems most relevant to their current message
- Match complexity to their indicated challenge approach style`;
    
    return new HumanMessage(content);
  }

  async assessUser(
    message: CoachingMessage,
    userProfile: UserProfile
  ): Promise<{ response: string; strategy: string; assessmentInsights: Partial<PsychologicalAssessment> }> {
    const systemPrompt = this.createSystemPrompt();
    const humanMessage = this.createHumanMessage(message, userProfile);

    const response = await this.model.invoke([systemPrompt, humanMessage]);
    const jsonString = (response.content as string).match(/```json\n([\s\S]*?)\n```/)?.[1];
    if (!jsonString) {
      throw new Error("Could not extract JSON from model response.");
    }
    const parsedResponse = JSON.parse(jsonString);

    return {
      response: parsedResponse.response,
      strategy: parsedResponse.strategy,
      assessmentInsights: parsedResponse.assessmentInsights,
    };
  }
}
