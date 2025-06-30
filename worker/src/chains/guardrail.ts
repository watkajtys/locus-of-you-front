import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import {
  HumanMessage,
  SystemMessage,
} from "@langchain/core/messages";
import {
  GuardrailConfig,
  CrisisIndicators,
  CoachingMessage,
  Env,
} from "../types";

const CRISIS_RESPONSE =
  "It sounds like you are going through a difficult time. Please consider reaching out to a crisis hotline or mental health professional. You can connect with people who can support you by calling or texting 988 anytime in the US and Canada. In the UK, you can call 111.";

export class GuardrailChain {
  private model: ChatGoogleGenerativeAI;
  private config: GuardrailConfig;

  constructor(config: GuardrailConfig, env: Env) {
    this.config = config;
    this.model = new ChatGoogleGenerativeAI({
      model: "gemini-2.5-flash",
      temperature: 0.1,
      apiKey: env.GOOGLE_API_KEY,
    });
  }

  private systemPrompt = new SystemMessage(
    `You are a crisis detection expert for a mental health coaching app.
    Your role is to assess user messages for clear, explicit, and actionable indications of self-harm, harm to others, or severe, persistent emotional distress that suggests an *imminent inability to cope or danger*.
    Focus strictly on direct threats, concrete plans, or severe, unmanageable distress that clearly indicates a need for immediate intervention.
    Messages expressing general sadness, feeling down, stress, anxiety, or common emotional struggles *without* explicit intent or severe, unmanageable symptoms are NOT considered crises.
    Analyze the user's message and return a JSON object with two keys:
    1. 'severity': A string that must be one of the following values: 'none', 'low', 'medium', 'high', 'immediate'.
    2. 'confidence': A number between 0 and 1 representing your confidence in the assessment.

    - 'none': No indication of risk, or only mild, transient negative emotions (e.g., "feeling down", "stressed").
    - 'low': Vague mentions of distress, but no direct threats, plans, or clear inability to cope.
    - 'medium': Mentions of self-harm or harm to others, but not specific or immediate, or severe distress without clear intent or imminent danger.
    - 'high': Specific threats of self-harm or harm to others, or clear and severe distress with some indication of intent or imminent danger.
    - 'immediate': Clear and immediate intent and plan for self-harm or harm to others.

    Base your assessment solely on the provided message. Do not ask for more information.
    Your response must be a valid JSON object and nothing else.`
  );

  async assessSafety(
    message: CoachingMessage
  ): Promise<{ shouldProceed: boolean; response?: string }> {
    const userMessage = new HumanMessage(message.message);
    const response = await this.model.invoke([this.systemPrompt, userMessage]);

    try {
      const indicators: CrisisIndicators = JSON.parse(response.content as string);

      if (indicators.severity === "immediate") {
        return {
          shouldProceed: false,
          response: CRISIS_RESPONSE,
        };
      }

      return { shouldProceed: true };
    } catch (error) {
      console.error("Error parsing guardrail response:", error);
      // Default to safety first
      return {
        shouldProceed: false,
        response: "We are having trouble processing your request. Please try again later.",
      };
    }
  }
}
