import {
  CoachingMessage,
  UserProfile,
  Env,
  SessionHandler,
  InterventionConfig,
  // Assuming AIResponse or a more specific type for chain results
} from '../types';
import { diagnosticConfig, interventionConfig } from '../config';
import { DiagnosticChain } from '../chains/diagnostic';
import { InterventionsChain } from '../chains/interventions';

export const handleIntervention: SessionHandler = async (
  coachingMessage: CoachingMessage,
  userProfile: UserProfile,
  env: Env,
  _executionCtx: import('hono').Context['executionCtx'],
): Promise<any> => { // Replace 'any' with the actual return type
  const diagnosticChain = new DiagnosticChain(env.GOOGLE_API_KEY, diagnosticConfig);
  const interventionsChain = new InterventionsChain(env.GOOGLE_API_KEY, interventionConfig);

  // TODO: Consider if userProfile should be updated with new assessment insights
  // This was a TODO in the original code. For now, replicating the logic.
  // If userProfile is mutable and needs update, this handler might need to return it
  // or the update mechanism needs to be clearly defined.
  const assessmentData = await diagnosticChain.assessUser(coachingMessage, userProfile);
  return interventionsChain.prescribeIntervention(coachingMessage, userProfile, assessmentData);
};
