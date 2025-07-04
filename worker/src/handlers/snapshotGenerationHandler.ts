import {
  CoachingMessage,
  UserProfile,
  Env,
  SessionHandler,
  SnapshotData,
} from '../types';

export const handleSnapshotGeneration: SessionHandler = async (
  _coachingMessage: CoachingMessage, // Not directly used, but part of the SessionHandler signature
  userProfile: UserProfile,
  env: Env,
  _executionCtx: ExecutionContext,
): Promise<SnapshotData> => {
  if (!env.USER_SESSIONS_KV) {
    throw new Error('USER_SESSIONS_KV not configured');
  }

  const snapshotString = await env.USER_SESSIONS_KV.get(`snapshot_${userProfile.id}`);
  if (!snapshotString) {
    // Consider a specific error type or code for "not found"
    throw new Error('Snapshot data not found for user.');
  }
  return JSON.parse(snapshotString) as SnapshotData;
};
