import {
  CoachingMessage,
  UserProfile,
  Env,
  SessionHandler,
  InterventionConfig,
  Microtask,
  MomentumMirrorData,
  DashboardTeaserData,
} from '../types';
import { InterventionsChain } from '../chains/interventions';

export const handleReflection: SessionHandler = async (
  coachingMessage: CoachingMessage,
  userProfile: UserProfile,
  env: Env,
  _executionCtx: ExecutionContext,
): Promise<{ message: string; nextAdaptedTask: Microtask; momentumMirror: MomentumMirrorData; dashboardTeaser: DashboardTeaserData }> => {
  const previousTask = coachingMessage.context?.previousTask;
  const reflectionId = coachingMessage.context?.reflectionId;
  const reflectionText = coachingMessage.message; // User's textual reflection

  if (!previousTask || !reflectionId) {
    // This case should ideally be caught by validation before calling the handler
    throw new Error('Previous task and reflectionId are required for reflection session type.');
  }

  if (!env.USER_SESSIONS_KV || !env.GOOGLE_API_KEY) {
    // Check for GOOGLE_API_KEY as InterventionsChain requires it
    throw new Error('USER_SESSIONS_KV or GOOGLE_API_KEY not configured');
  }

  // In a real app, configs might come from a KV store or be more dynamic
  const interventionConfig: InterventionConfig = {
    interventionTypes: ['behavioral', 'cognitive'], // Adjust as needed for reflection adaptation
    personalityFactors: true,
    maxTokens: 1000, // Adjust as needed
    temperature: 0.4, // Adjust as needed
    model: 'gemini-2.5-flash',
    systemPrompt: '', // Define or load appropriate system prompt for task adaptation
  };

  const interventionsChain = new InterventionsChain(env.GOOGLE_API_KEY, interventionConfig);

  const adaptedMicrotask = await interventionsChain.generateAdaptedMicrotask(
    previousTask,
    reflectionId,
    reflectionText,
    userProfile
  );

  // Get onboarding answers from context for personalization
  const onboardingAnswers = coachingMessage.context?.onboardingAnswers;

  // Generate momentum mirror data
  const momentumMirror = await interventionsChain.generateMomentumMirror(
    reflectionId,
    reflectionText,
    userProfile,
    userProfile.id,
    onboardingAnswers
  );

  // Generate dashboard teaser data
  const dashboardTeaser = await interventionsChain.generateDashboardTeaser(
    userProfile,
    userProfile.id,
    onboardingAnswers
  );

  // Storing the data to KV
  await env.USER_SESSIONS_KV.put(`nextAdaptedTask_${userProfile.id}`, JSON.stringify(adaptedMicrotask));
  await env.USER_SESSIONS_KV.put(`momentumMirror_${userProfile.id}`, JSON.stringify(momentumMirror));
  await env.USER_SESSIONS_KV.put(`dashboardTeaser_${userProfile.id}`, JSON.stringify(dashboardTeaser));
  
  console.log(`Stored nextAdaptedTask_${userProfile.id}: ${JSON.stringify(adaptedMicrotask)}`);
  console.log(`Stored momentumMirror_${userProfile.id}: ${JSON.stringify(momentumMirror)}`);
  console.log(`Stored dashboardTeaser_${userProfile.id}: ${JSON.stringify(dashboardTeaser)}`);

  return {
    message: "Reflection processed and next task generated.",
    nextAdaptedTask: adaptedMicrotask,
    momentumMirror: momentumMirror,
    dashboardTeaser: dashboardTeaser
  };
};
