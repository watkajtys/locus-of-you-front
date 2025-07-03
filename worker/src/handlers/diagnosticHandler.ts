import {
  CoachingMessage,
  UserProfile,
  Env,
  SessionHandler,
  DiagnosticConfig,
  // Assuming AIResponse or a more specific type for diagnosticChain result
} from '../types';
import { DiagnosticChain } from '../chains/diagnostic';

export const handleDiagnostic: SessionHandler = async (
  coachingMessage: CoachingMessage,
  userProfile: UserProfile,
  env: Env,
  _executionCtx: ExecutionContext,
): Promise<any> => { // Replace 'any' with the actual return type of diagnosticChain.assessUser
  // In a real app, configs might come from a KV store or be more dynamic
  const diagnosticConfig: DiagnosticConfig = {
    assessmentFrameworks: ['SDT'],
    maxQuestions: 1,
    maxTokens: 500,
    temperature: 0.3,
    model: 'gemini-2.5-flash', // Consider making model configurable
    systemPrompt: '', // Define or load appropriate system prompt
  };

  const diagnosticChain = new DiagnosticChain(env.GOOGLE_API_KEY, diagnosticConfig);
  return diagnosticChain.assessUser(coachingMessage, userProfile);
};
