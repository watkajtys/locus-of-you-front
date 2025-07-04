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
      `You are a world-class AI coach, an expert in Goal-Setting Theory (GST), Self-Determination Theory (SDT), and designing personalized therapeutic interventions.
      Your role is to prescribe a specific, evidence-based intervention based on a rich set of user data.

      You will receive:
      1. The user's latest message.
      2. The user's comprehensive psychological profile (including personality traits and mindset).
      3. The diagnostic assessment from the previous chain (highlighting their core SDT needs).

      Your task is to synthesize this information to create a highly personalized, actionable intervention.
      - **Personalization is key:**
        - If the user is low on 'competence' (from SDT assessment), prescribe a 'micro-goal' or skill-building exercise (GST_DIFFICULTY).
        - If the user is low on 'autonomy', design an intervention that gives them choices and control.
        - If the user is 'disorganized' (personality trait), make the action steps extremely simple and clear.
        - If the user has a 'fixed mindset', frame the intervention as an experiment, not a test of their abilities.

      You MUST return a single, valid JSON object with the following structure and nothing else:
      {
        "interventionType": "'behavioral', 'cognitive', 'motivational', or 'goal_setting'",
        "strategy": "A specific strategy code, e.g., 'GST_SPECIFICITY', 'SDT_COMPETENCE_BUILDING', 'CBT_REBT'",
        "content": "The message for the user, written in a supportive and encouraging tone.",
        "actionSteps": ["A list of 1-3 clear, concrete, and immediately actionable steps."],
        "timeframe": "A realistic timeframe for the action steps (e.g., 'over the next 24 hours', 'this week').",
        "successMetrics": "A simple way for the user to know if they have succeeded (e.g., 'You will have completed the first step', 'You will feel a sense of accomplishment').",
        "rationale": "A brief, clear explanation of why this specific intervention was chosen for them, linking it to their goals or feelings."
      }`
    );
  }

  private createHumanMessage(
    message: CoachingMessage,
    userProfile: UserProfile,
    assessmentData: AssessmentData
  ): HumanMessage {
    const profileSummary = JSON.stringify(userProfile.psychologicalProfile, null, 2);
    const assessmentSummary = JSON.stringify(assessmentData, null, 2);

    const content = `
      User Message: "${message.message}"

      User's Psychological Profile:
      ${profileSummary}

      Diagnostic Assessment Data:
      ${assessmentSummary}
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
      `You are an AI coach specializing in helping users take their first impossibly small step towards a goal.
      Based on the user's onboarding answers and psychological profile, generate a single, extremely small, actionable task.
      The task should be so small it feels almost trivial, designed to build momentum and reduce friction.
      
      You will receive:
      1. The user's onboarding answers (goal, mindset, locus of control, personality traits).
      2. The user's comprehensive psychological profile.

      You MUST return a single, valid JSON object with the following structure and nothing else:
      {
        "rationale": "A brief, clear explanation of why this specific microtask was chosen for them, linking it to their onboarding answers and profile.",
        "task": "The single, impossibly small, actionable task."
      }`
    );

    const humanMessage = new HumanMessage(
      `Onboarding Answers: ${JSON.stringify(onboardingAnswers, null, 2)}
      User's Psychological Profile: ${JSON.stringify(userProfile.psychologicalProfile, null, 2)}`
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

  async generateMomentumMirrorFeedback(
    previousTask: string,
    reflectionId: string,
    reflectionText: string,
    userProfile: UserProfile
  ): Promise<{ momentumMirror: MomentumMirrorData; dashboardTeaser: DashboardTeaserData }> {
    const systemPrompt = new SystemMessage(
      `You are a LocusOfYou AI coach providing celebratory feedback in the "Momentum Mirror" phase.
      The user has just completed (or attempted) a microtask and provided reflection. Your role is to:

      1. Generate a celebratory, personalized title and body that reframes their small action as meaningful progress
      2. Create a short teaser sentence for the premium dashboard that hints at the deeper insights they could unlock

      Guidelines for the Momentum Mirror:
      - Title should be celebratory and specific (e.g., "You're Building Real Momentum!" or "That's How Change Happens!")
      - Body should acknowledge their effort and reframe the small step as part of a larger pattern of growth
      - Use the "Language of Agency" - focus on their choice, effort, and process rather than innate ability
      - If they didn't complete the task, still celebrate the reflection and learning

      Guidelines for Dashboard Teaser:
      - One compelling sentence that hints at personalized insights they could unlock
      - Should feel valuable and specific to their psychological profile
      - Examples: "Discover your unique motivation patterns and unlock 3x faster progress" or "See how your mindset type can be your secret weapon for lasting change"

      You MUST return a single, valid JSON object with the following structure and nothing else:
      {
        "momentumMirror": {
          "title": "Celebratory, personalized title",
          "body": "2-3 sentences reframing their action as meaningful progress, acknowledging their specific reflection"
        },
        "dashboardTeaser": {
          "teaserText": "One compelling sentence about premium insights they could unlock"
        }
      }`
    );

    const humanMessage = new HumanMessage(
      `Previous Task: "${previousTask}"
      Reflection ID: "${reflectionId}"
      User's Reflection: "${reflectionText}"
      User's Psychological Profile: ${JSON.stringify(userProfile.psychologicalProfile, null, 2)}`
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
      const parsedResponse = JSON.parse(jsonString);
      return parsedResponse;
    } catch (error) {
      console.error("Error parsing momentum mirror response:", error, "Attempted to parse:", jsonString);
      throw new Error("Failed to generate valid momentum mirror feedback. Raw: " + jsonString);
    }
  }
}
