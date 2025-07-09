import {
  CoachingMessage,
  UserProfile,
  Env,
  SessionHandler,
  // Assuming AIResponse or a more specific type for diagnosticChain result
} from '../types';
import { diagnosticConfig } from '../config';
import { DiagnosticChain } from '../chains/diagnostic';

export const handleDiagnostic: SessionHandler = async (
  coachingMessage: CoachingMessage,
  userProfile: UserProfile,
  env: Env,
  _executionCtx: import('hono').Context['executionCtx'],
): Promise<any> => { // Replace 'any' with the actual return type of diagnosticChain.assessUser
  const diagnosticChain = new DiagnosticChain(env.GOOGLE_API_KEY, diagnosticConfig);
  return diagnosticChain.assessUser(coachingMessage, userProfile);
};
