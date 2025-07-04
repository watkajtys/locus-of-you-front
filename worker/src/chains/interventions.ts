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
}
