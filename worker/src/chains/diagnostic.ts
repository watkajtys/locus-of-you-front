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
      `You are an expert AI coach specializing in evidence-based psychological assessment, Self-Determination Theory (SDT), and Motivational Interviewing.
      Your primary goal is to diagnose the user's core motivational needs: Autonomy, Competence, and Relatedness.
      You will be given the user's latest message and their existing psychological profile.
      Your task is to formulate a single, strategic, open-ended question that builds rapport and gently assesses their current motivational state.
      - If their message hints at feeling controlled or pressured, focus on AUTONOMY.
      - If their message suggests self-doubt or frustration with a skill, focus on COMPETENCE.
      - If their message mentions loneliness or feeling disconnected, focus on RELATEDNESS.
      Your response should be a JSON object containing:
      1. "response": A string with the open-ended question for the user.
      2. "strategy": A string indicating the primary SDT need you are assessing (e.g., 'SDT_AUTONOMY', 'SDT_COMPETENCE', 'SDT_RELATEDNESS').
      3. "assessmentInsights": An object with any new insights you have gathered about the user's psychological state.`
    );
  }

  private createHumanMessage(message: CoachingMessage, userProfile: UserProfile): HumanMessage {
    const profileSummary = JSON.stringify(userProfile.psychologicalProfile, null, 2);
    const content = `User Message: "${message.message}"

User's Psychological Profile:
${profileSummary}`;
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
