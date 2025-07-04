import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import {
  HumanMessage,
  SystemMessage,
} from "@langchain/core/messages";
import {
  InterventionConfig,
  CoachingMessage,
  UserProfile,
  PsychologicalAssessment,
  OnboardingAnswers,
  Microtask,
  MomentumMirrorData,
  DashboardTeaserData,
} from "../types";

// Define the structure for the assessment data input
interface AssessmentData {
  strategy: string;
  assessmentInsights: Partial<PsychologicalAssessment>;
}

// Define the structure for the output
export interface InterventionPrescription {
  interventionType: 'behavioral' | 'cognitive' | 'motivational' | 'goal_setting';
  strategy: string;
  content: string;
  actionSteps: string[];
  timeframe: string;
  successMetrics: string;
  rationale: string;
}

export class InterventionsChain {
  private model: ChatGoogleGenerativeAI;
  private config: InterventionConfig;

  constructor(apiKey: string, config: InterventionConfig) {
    this.config = config;
    this.model = new ChatGoogleGenerativeAI({
      model: this.config.model || "gemini-2.5-flash",
      temperature: this.config.temperature || 0.4,
      apiKey: apiKey,
    });
  }

  private createSystemPrompt(): SystemMessage {
    return new SystemMessage(
      `You are a world-class AI coach and behavioral scientist, expert in Goal-Setting Theory (GST), Self-Determination Theory (SDT), Cognitive Behavioral Therapy (CBT), and evidence-based therapeutic interventions.
      
      MISSION: Prescribe a highly personalized, scientifically-grounded intervention that meets the user exactly where they are psychologically.
      
      INTERVENTION FRAMEWORK:
      You will receive:
      1. User's current message (their immediate concern/goal)
      2. Comprehensive psychological profile (personality, mindset, locus of control)
      3. Diagnostic assessment (their core SDT needs: autonomy, competence, relatedness)
      
      PERSONALIZATION MATRIX:
      **SDT Need Deficits:**
      - Low AUTONOMY → Provide choices, explain rationale, emphasize personal control
      - Low COMPETENCE → Break into micro-steps, celebrate small wins, skill-building focus
      - Low RELATEDNESS → Include social elements, community connection, shared experiences
      
      **Mindset Adaptations:**
      - GROWTH Mindset → Frame as learning opportunity, process-focused, experimentation
      - FIXED Mindset → Frame as specific trial, outcome-focused, bounded experiment
      
      **Personality Adjustments:**
      - High Conscientiousness → Structured, systematic, detailed planning
      - Low Conscientiousness → Flexible, fun, low-pressure approach
      - High Neuroticism → Extra support, anxiety-reducing strategies
      - Low Neuroticism → Can handle more challenge and ambiguity
      
      **Locus of Control:**
      - INTERNAL → Emphasize personal agency, self-directed action
      - EXTERNAL → Leverage environmental design, social support, external structures
      
      INTERVENTION QUALITY STANDARDS:
      - Action steps must be specific, measurable, and achievable within timeframe
      - Language must match user's motivational style and current emotional state
      - Success metrics must be clear and immediately recognizable
      - Rationale must connect intervention to their specific psychology
      
      OUTPUT: Return ONLY a valid JSON object:
      {
        "interventionType": "'behavioral', 'cognitive', 'motivational', or 'goal_setting'",
        "strategy": "Specific evidence-based strategy code (e.g., 'SDT_COMPETENCE_BUILDING', 'GST_SPECIFICITY', 'CBT_BEHAVIORAL_ACTIVATION')",
        "content": "Supportive message that explains the intervention in their language, matching their psychological needs.",
        "actionSteps": ["1-3 specific, immediately actionable steps designed for their psychology"],
        "timeframe": "Realistic timeframe that matches their current capacity and motivation level",
        "successMetrics": "Clear, specific way they'll know they succeeded - must be observable and motivating",
        "rationale": "Evidence-based explanation connecting this intervention to their specific psychological profile and current needs"
      }`
    );
  }

  private createHumanMessage(
    message: CoachingMessage,
    userProfile: UserProfile,
    assessmentData: AssessmentData
  ): HumanMessage {
    const onboardingAnswers = message.context?.onboardingAnswers;
    const profileSummary = JSON.stringify(userProfile.psychologicalProfile, null, 2);
    const assessmentSummary = JSON.stringify(assessmentData, null, 2);

    const content = `USER'S COMPLETE INTERVENTION CONTEXT:

CURRENT MESSAGE: "${message.message}"

GOAL CONTEXT: ${onboardingAnswers?.final_goal_context ? `"${onboardingAnswers.final_goal_context}"` : 'No specific goal provided'}

ONBOARDING BEHAVIORAL INSIGHTS:
${onboardingAnswers ? `
- Mindset Approach: ${onboardingAnswers.mindset} (developed = growth-oriented, stable = more fixed)
- Personal Agency: ${onboardingAnswers.agency} (primary_driver = internal locus, external_factors = external locus)  
- Motivation Source: ${onboardingAnswers.motivation_source} (internal_satisfaction vs external_results)
- Challenge Approach: ${onboardingAnswers.approach_to_challenges} (action_experimenting vs analyze_plan)
- Focus Style: ${onboardingAnswers.focus_style} (dive_deep vs comfortable_switching)
- Risk Tolerance: ${onboardingAnswers.risk_tolerance} (safe_reliable vs riskier_payoff)
- Social Orientation: ${onboardingAnswers.social_orientation} (quiet_solo vs social_collaborative)
` : 'No onboarding behavioral data available'}

USER PROFILE DATA:
- User ID: ${userProfile.id}
- Account Created: ${userProfile.createdAt}
${userProfile.preferences && Object.keys(userProfile.preferences).length > 0 ? `- Preferences: ${JSON.stringify(userProfile.preferences)}` : '- No recorded preferences'}

PSYCHOLOGICAL PROFILE:
${profileSummary}

DIAGNOSTIC ASSESSMENT FROM PREVIOUS CHAIN:
${assessmentSummary}

INTERVENTION DESIGN REQUIREMENTS:
- Design intervention for their specific goal context
- Match their behavioral preferences from onboarding
- Consider their indicated approach to challenges
- Align with their motivation source (intrinsic vs extrinsic)
- Respect their risk tolerance and social preferences
    `;
    return new HumanMessage(content);
  }

  async prescribeIntervention(
    message: CoachingMessage,
    userProfile: UserProfile,
    assessmentData: AssessmentData
  ): Promise<InterventionPrescription> {
    const systemPrompt = this.createSystemPrompt();
    const humanMessage = this.createHumanMessage(message, userProfile, assessmentData);

    const response = await this.model.invoke([systemPrompt, humanMessage]);
    
    try {
      const parsedResponse: InterventionPrescription = JSON.parse(response.content as string);
      return parsedResponse;
    } catch (error) {
      console.error("Error parsing intervention response:", error);
      // Fallback or re-throw, depending on desired error handling
      throw new Error("Failed to generate a valid intervention prescription.");
    }
  }

  async generateFirstMicrotask(
    onboardingAnswers: OnboardingAnswers,
    userProfile: UserProfile
  ): Promise<Microtask> {
    const systemPrompt = new SystemMessage(
      `You are an expert behavioral scientist specializing in habit formation, Self-Determination Theory (SDT), and the psychology of micro-progress.
      
      MISSION: Generate the user's first impossibly small step towards their goal - so small it feels almost trivial, yet psychologically powerful for building momentum.
      
      MICRO-TASK SCIENCE:
      - Must take ≤ 2 minutes to complete
      - Should feel "almost silly" how small it is
      - Must be immediately actionable (no preparation required)
      - Should create a small win that builds self-efficacy
      - Must be specific, concrete, and measurable
      
      PSYCHOLOGICAL PERSONALIZATION:
      1. **For Growth Mindset**: Frame as experimentation and learning
      2. **For Fixed Mindset**: Frame as trying something specific and bounded
      3. **For Internal Locus**: Emphasize personal control and choice
      4. **For External Locus**: Connect to environmental or social factors
      5. **For High Conscientiousness**: Make it systematic and structured
      6. **For Low Conscientiousness**: Make it flexible and fun
      
      TASK SIZING EXAMPLES:
      - "Write one sentence about your goal" (not "create a goal plan")
      - "Put your running shoes by your bed" (not "go for a run")
      - "Open the app/website you need" (not "research extensively")
      - "Write down one thing you're grateful for" (not "start a gratitude practice")
      
      OUTPUT: Return ONLY a valid JSON object:
      {
        "rationale": "A clear explanation of why this micro-task is perfect for their psychology and goal, referencing specific aspects of their profile.",
        "task": "An impossibly small, specific action they can complete in under 2 minutes right now."
      }`
    );

    const humanMessage = new HumanMessage(
      `USER'S COMPLETE INFORMATION:
      
      GOAL CONTEXT: "${onboardingAnswers.final_goal_context}"
      
      DETAILED ONBOARDING RESPONSES:
      - Mindset Belief: ${onboardingAnswers.mindset} (developed = growth mindset, stable = more fixed)
      - Personal Agency: ${onboardingAnswers.agency} (primary_driver = internal locus, external_factors = external locus)
      - Motivation Source: ${onboardingAnswers.motivation_source} (internal_satisfaction vs external_results)
      - Challenge Approach: ${onboardingAnswers.approach_to_challenges} (action_experimenting vs analyze_plan)
      - Focus Style: ${onboardingAnswers.focus_style} (dive_deep vs comfortable_switching)
      - Risk Tolerance: ${onboardingAnswers.risk_tolerance} (safe_reliable vs riskier_payoff)
      - Social Orientation: ${onboardingAnswers.social_orientation} (quiet_solo vs social_collaborative)
      
      USER PROFILE DATA:
      - User ID: ${userProfile.id}
      - Account Created: ${userProfile.createdAt}
      ${userProfile.preferences && Object.keys(userProfile.preferences).length > 0 ? `- User Preferences: ${JSON.stringify(userProfile.preferences)}` : '- No specific preferences recorded yet'}
      
      PSYCHOLOGICAL PROFILE:
      ${JSON.stringify(userProfile.psychologicalProfile, null, 2)}
      
      CONTEXT FOR TASK DESIGN:
      - This is their FIRST microtask toward: "${onboardingAnswers.final_goal_context}"
      - Design the task to match their psychological preferences and goal context
      - Consider their risk tolerance, social orientation, and approach style`
    );

    const response = await this.model.invoke([systemPrompt, humanMessage]);

    console.log("Raw LLM response content for microtask:", response.content); // Log raw LLM response

    let jsonString = response.content as string;
    // Attempt to extract content from a markdown code block (```json or ```)
    const jsonStringMatch = jsonString.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    if (jsonStringMatch && jsonStringMatch[1]) {
      jsonString = jsonStringMatch[1]; // Use extracted content if match found
    }
    jsonString = jsonString.trim(); // Trim whitespace

    // Fallback: if no markdown block was found, try to parse the original text directly
    if (!jsonString && (response.content as string).trim().startsWith('{') && (response.content as string).trim().endsWith('}')) {
      jsonString = (response.content as string).trim();
    }

    try {
      const parsedResponse: Microtask = JSON.parse(jsonString);
      return parsedResponse;
    } catch (error) {
      console.error("Error parsing microtask response:", error);
      throw new Error("Failed to generate a valid microtask.");
    }
  }

  async generateAdaptedMicrotask(
    previousTask: string,
    reflectionId: string, // e.g., "easy", "silly", "not_done"
    reflectionText: string, // The user's actual textual reflection
    userProfile: UserProfile
  ): Promise<Microtask> {
    const systemPromptText = `You are an AI coach specializing in adapting microtasks based on user feedback.
    The user just completed (or attempted) a previous microtask and provided a reflection.
    Your goal is to generate the *next* single, extremely small, actionable task that logically follows.
    The task should be so small it feels almost trivial, designed to build momentum and reduce friction.

    User's Previous Task: "${previousTask}"
    User's Reflection ID: "${reflectionId}" (e.g., 'easy', 'silly', 'not_done', 'something_else')
    User's Reflection Text: "${reflectionText}"

    Consider these guidelines based on the reflection ID:
    - If 'easy': The user found it easy. The next task can build slightly on the previous one or be a similar small step in the same direction.
    - If 'silly': The user did it but felt silly. Acknowledge this. The next task should still be small but perhaps feel more meaningful or be framed differently.
    - If 'not_done': The user didn't do it. The next task should likely be even smaller, different, or address potential blockers implicitly. Avoid judgment.
    - If 'something_else': The user had other things come up. The next task should be very low friction, acknowledging that life happens.

    You will also receive the user's comprehensive psychological profile. Use this to tailor the task's nature and framing.
    For example, if user is low on 'competence' (from SDT assessment in their profile), make the task very achievable.
    If user has a 'fixed mindset', frame the task as an experiment.

    You MUST return a single, valid JSON object with the following structure and nothing else:
    {
      "rationale": "A brief, clear explanation of why this *new* specific microtask was chosen for them, acknowledging their reflection and linking to their profile if relevant.",
      "task": "The *new* single, impossibly small, actionable task."
    }`;

    const systemPrompt = new SystemMessage(systemPromptText);

    const humanMessage = new HumanMessage(
      `User's Psychological Profile: ${JSON.stringify(userProfile.psychologicalProfile, null, 2)}
      Previous Task: "${previousTask}"
      Reflection ID: "${reflectionId}"
      Reflection Text: "${reflectionText}"`
    );

    const response = await this.model.invoke([systemPrompt, humanMessage]);
    console.log("Raw LLM response content for adapted microtask:", response.content);

    let jsonString = response.content as string;
    const jsonStringMatch = jsonString.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    if (jsonStringMatch && jsonStringMatch[1]) {
      jsonString = jsonStringMatch[1];
    }
    jsonString = jsonString.trim();

    if (!jsonString && (response.content as string).trim().startsWith('{') && (response.content as string).trim().endsWith('}')) {
      jsonString = (response.content as string).trim();
    }

    try {
      const parsedResponse: Microtask = JSON.parse(jsonString);
      return parsedResponse;
    } catch (error) {
      console.error("Error parsing adapted microtask response:", error, "Attempted to parse:", jsonString);
      throw new Error("Failed to generate a valid adapted microtask. Raw: " + jsonString);
    }
  }

  async generateMomentumMirror(
    reflectionId: string,
    reflectionText: string,
    userProfile: UserProfile,
    userId: string,
    onboardingAnswers?: OnboardingAnswers
  ): Promise<MomentumMirrorData> {
    const systemPrompt = new SystemMessage(
      `You are an expert AI coach specializing in psychological momentum-building, positive psychology, and Self-Determination Theory (SDT).
      
      CONTEXT: The user just completed their very first microtask in their goal journey and provided a reflection. This is a critical moment for building self-efficacy and intrinsic motivation.
      
      REFLECTION ANALYSIS:
      - Reflection ID: "${reflectionId}" 
        • 'easy': User succeeded and found it manageable - reinforce competence, bridge to slightly bigger challenges
        • 'silly': User succeeded but felt trivial - validate the strategy, reframe small steps as powerful
        • 'not_done': User didn't complete it - normalize this, focus on learning and adjustment
        • 'something_else': Life intervened - emphasize flexibility and self-compassion
      
      - User's reflection: "${reflectionText}"
      
      PSYCHOLOGICAL PRINCIPLES TO APPLY:
      1. **Competence Building**: Acknowledge their capability regardless of outcome
      2. **Progress Recognition**: Highlight what they learned or attempted
      3. **Future-Focused Momentum**: Connect this moment to their larger journey
      4. **Intrinsic Motivation**: Emphasize personal growth over external validation
      
      TONE REQUIREMENTS:
      - Genuinely celebratory (not generic praise)
      - Warm and personal (use "you" language)
      - Confident in their ability to continue
      - Acknowledge their specific experience authentically
      
      OUTPUT: Return ONLY a valid JSON object with this exact structure:
      {
        "title": "A personalized, momentum-building title that celebrates their specific experience (8-12 words)",
        "body": "A warm, encouraging message that builds on their reflection and creates excitement for what's next. Maximum 2 sentences. Focus on their capability and the journey ahead.",
        "userId": "${userId}"
      }`
    );

    const humanMessage = new HumanMessage(
      `USER'S COMPLETE CONTEXT:
      
      THEIR PRIMARY GOAL: "${onboardingAnswers?.final_goal_context || 'personal growth and improvement'}"
      
      USER ACCOUNT INFO:
      - User ID: ${userProfile.id}
      - Account Age: Created ${userProfile.createdAt}
      ${userProfile.preferences && Object.keys(userProfile.preferences).length > 0 ? `- Recorded Preferences: ${JSON.stringify(userProfile.preferences)}` : '- No specific preferences on file yet'}
      
      ONBOARDING INSIGHTS (if available):
      ${onboardingAnswers ? `
      - Mindset: ${onboardingAnswers.mindset} (developed = growth-oriented, stable = more fixed)
      - Agency: ${onboardingAnswers.agency} (primary_driver = takes charge, external_factors = adapts to circumstances)
      - Motivation: ${onboardingAnswers.motivation_source} (internal_satisfaction vs external_results)
      - Challenge Style: ${onboardingAnswers.approach_to_challenges} (action_experimenting vs analyze_plan)
      - Focus: ${onboardingAnswers.focus_style} (dive_deep vs comfortable_switching)
      - Risk: ${onboardingAnswers.risk_tolerance} (safe_reliable vs riskier_payoff)
      - Social: ${onboardingAnswers.social_orientation} (quiet_solo vs social_collaborative)
      ` : 'Onboarding data not available'}
      
      PSYCHOLOGICAL PROFILE:
      ${JSON.stringify(userProfile.psychologicalProfile, null, 2)}
      
      REFLECTION DETAILS:
      - Reflection Type: "${reflectionId}"
      - User's Reflection: "${reflectionText}"
      
      PERSONALIZATION REQUIREMENTS:
      - This was their FIRST step toward: "${onboardingAnswers?.final_goal_context || 'their goal'}"
      - Tailor celebration to their specific psychological makeup
      - Use warm, supportive coaching tone
      - Reference their specific goal context meaningfully
      - Consider their approach to challenges and motivation source from onboarding data`
    );

    const response = await this.model.invoke([systemPrompt, humanMessage]);
    console.log("Raw LLM response content for momentum mirror:", response.content);

    let jsonString = response.content as string;
    const jsonStringMatch = jsonString.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    if (jsonStringMatch && jsonStringMatch[1]) {
      jsonString = jsonStringMatch[1];
    }
    jsonString = jsonString.trim();

    if (!jsonString && (response.content as string).trim().startsWith('{') && (response.content as string).trim().endsWith('}')) {
      jsonString = (response.content as string).trim();
    }

    try {
      const parsedResponse: MomentumMirrorData = JSON.parse(jsonString);
      return parsedResponse;
    } catch (error) {
      console.error("Error parsing momentum mirror response:", error, "Attempted to parse:", jsonString);
      throw new Error("Failed to generate a valid momentum mirror response. Raw: " + jsonString);
    }
  }

  async generateDashboardTeaser(
    userProfile: UserProfile,
    userId: string,
    onboardingAnswers?: OnboardingAnswers
  ): Promise<DashboardTeaserData> {
    const systemPrompt = new SystemMessage(
      `You are an expert conversion copywriter and behavioral psychologist specializing in motivation and goal achievement.
      
      CONTEXT: The user just experienced their first taste of success with our coaching system. They're now seeing a preview of their potential dashboard. This is THE moment to convert them by showing the transformative power of ongoing tracking and coaching.
      
      PSYCHOLOGICAL TRIGGERS TO LEVERAGE:
      1. **Progress Visualization**: Help them see their future growth trajectory
      2. **Personal Agency**: Show how they'll be in control of their journey
      3. **Social Proof**: Subtle reference to "others like you" succeeding
      4. **Fear of Missing Out**: What they'll miss without the full experience
      5. **Anticipatory Motivation**: The excitement of seeing their progress compound
      
      USER PROFILE INSIGHTS:
      - Psychological profile data will inform personalization
      - Consider their mindset (growth vs. fixed)
      - Consider their locus of control (internal vs. external)
      - Tailor language to their motivational style
      
      CONVERSION REQUIREMENTS:
      - Create genuine excitement about ongoing progress tracking
      - Paint a vivid picture of their transformed future self
      - Emphasize the adaptive, personalized nature of the experience
      - Make them feel like this dashboard is designed specifically for them
      - Balance aspiration with believability
      
      TONE: Inspiring, confident, personal, and slightly urgent (they're so close to unlock their potential)
      
      OUTPUT: Return ONLY a valid JSON object with this exact structure:
      {
        "teaser": "A compelling, personalized preview that makes them excited to see their growth tracked and celebrated over time. 1-2 sentences maximum. Must create genuine anticipation for their unique journey.",
        "userId": "${userId}"
      }`
    );

    const humanMessage = new HumanMessage(
      `USER'S COMPLETE PROFILE FOR CONVERSION:
      
      THEIR SPECIFIC GOAL: "${onboardingAnswers?.final_goal_context || 'personal growth and achievement'}"
      
      PSYCHOLOGICAL DRIVERS:
      ${onboardingAnswers ? `
      - Motivation Source: ${onboardingAnswers.motivation_source} ${onboardingAnswers.motivation_source === 'internal_satisfaction' ? '(intrinsically motivated - emphasize personal growth)' : '(externally motivated - emphasize results and recognition)'}
      - Challenge Style: ${onboardingAnswers.approach_to_challenges} ${onboardingAnswers.approach_to_challenges === 'action_experimenting' ? '(action-oriented - show immediate tracking)' : '(planning-oriented - show structured progress)'}
      - Risk Tolerance: ${onboardingAnswers.risk_tolerance} ${onboardingAnswers.risk_tolerance === 'safe_reliable' ? '(prefers certainty - emphasize reliability)' : '(embraces risk - emphasize growth potential)'}
      - Social Style: ${onboardingAnswers.social_orientation} ${onboardingAnswers.social_orientation === 'social_collaborative' ? '(social - mention community features)' : '(solo - emphasize personal journey)'}
      - Focus Style: ${onboardingAnswers.focus_style} ${onboardingAnswers.focus_style === 'dive_deep' ? '(deep focus - show detailed analytics)' : '(flexible - show variety and adaptability)'}
      ` : 'Onboarding data not available - use general motivational approach'}
      
      USER ACCOUNT DATA:
      - User ID: ${userProfile.id}
      - Account Created: ${userProfile.createdAt}
      ${userProfile.preferences && Object.keys(userProfile.preferences).length > 0 ? `- User Preferences: ${JSON.stringify(userProfile.preferences)}` : '- No recorded preferences yet'}
      
      PSYCHOLOGICAL PROFILE:
      ${JSON.stringify(userProfile.psychologicalProfile, null, 2)}
      
      CONVERSION STRATEGY:
      - They just completed their first step toward: "${onboardingAnswers?.final_goal_context || 'their goal'}"
      - Create urgency about missing out on tracking their momentum
      - Match language to their motivational drivers
      - Paint specific picture of THEIR journey being tracked
      - Emphasize the adaptive, personalized nature for THEIR specific psychology`
    );

    const response = await this.model.invoke([systemPrompt, humanMessage]);
    console.log("Raw LLM response content for dashboard teaser:", response.content);

    let jsonString = response.content as string;
    const jsonStringMatch = jsonString.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    if (jsonStringMatch && jsonStringMatch[1]) {
      jsonString = jsonStringMatch[1];
    }
    jsonString = jsonString.trim();

    if (!jsonString && (response.content as string).trim().startsWith('{') && (response.content as string).trim().endsWith('}')) {
      jsonString = (response.content as string).trim();
    }

    try {
      const parsedResponse: DashboardTeaserData = JSON.parse(jsonString);
      return parsedResponse;
    } catch (error) {
      console.error("Error parsing dashboard teaser response:", error, "Attempted to parse:", jsonString);
      throw new Error("Failed to generate a valid dashboard teaser response. Raw: " + jsonString);
    }
  }
}
