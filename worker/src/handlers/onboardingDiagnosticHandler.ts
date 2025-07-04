import {
  CoachingMessage,
  UserProfile,
  Env,
  SessionHandler,
  SnapshotData,
} from '../types';
import { SnapshotChain } from '../chains/snapshot';

export const handleOnboardingDiagnostic: SessionHandler = async (
  coachingMessage: CoachingMessage,
  userProfile: UserProfile,
  env: Env,
  _executionCtx: ExecutionContext,
): Promise<{ message: string; snapshotData: SnapshotData }> => {
  const onboardingAnswers = coachingMessage.context?.onboardingAnswers;
  if (!onboardingAnswers) {
    // This case should ideally be caught by validation before calling the handler,
    // but as a safeguard:
    throw new Error('Onboarding answers not provided for onboarding_diagnostic session type.');
  }

  if (!env.USER_SESSIONS_KV) {
    throw new Error('USER_SESSIONS_KV not configured');
  }

  const snapshotChain = new SnapshotChain();
  const snapshotData = await snapshotChain.generateSnapshot(onboardingAnswers, userProfile);

  // Store snapshot data in KV
  await env.USER_SESSIONS_KV.put(`snapshot_${userProfile.id}`, JSON.stringify(snapshotData));

  return { message: 'Onboarding diagnostic completed and snapshot generated.', snapshotData };
};
