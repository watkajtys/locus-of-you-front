import { describe, it, expect } from 'vitest';
import app from './index';

// Mock environment variables and KV namespaces before importing the app
// Vitest auto-mocks by convention if __mocks__ folder is present or vi.mock is used.
// For simplicity here, we'll assume manual or setup file mocking.

// Example: Mocking KV
const MOCK_KV_STORE = new Map<string, string>();

vi.mock('./types', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    // Potentially mock schemas if they cause issues in test env without full setup
  };
});

vi.mock('./chains/guardrail', () => {
  return {
    GuardrailChain: vi.fn().mockImplementation(() => {
      return {
        assessSafety: vi.fn().mockResolvedValue({ shouldProceed: true, response: 'Safe' }),
      };
    }),
  };
});

// Mock individual handlers
vi.mock('./handlers/diagnosticHandler', () => ({
  handleDiagnostic: vi.fn().mockResolvedValue({ type: 'diagnostic', data: 'diagnostic_data' }),
}));
vi.mock('./handlers/interventionHandler', () => ({
  handleIntervention: vi.fn().mockResolvedValue({ type: 'intervention', data: 'intervention_data' }),
}));
vi.mock('./handlers/onboardingDiagnosticHandler', () => ({
  handleOnboardingDiagnostic: vi.fn().mockResolvedValue({ type: 'onboarding_diagnostic', data: 'onboarding_data' }),
}));
vi.mock('./handlers/reflectionHandler', () => ({
  handleReflection: vi.fn().mockResolvedValue({ type: 'reflection', data: 'reflection_data' }),
}));
vi.mock('./handlers/snapshotGenerationHandler', () => ({
  handleSnapshotGeneration: vi.fn().mockResolvedValue({ type: 'snapshot', data: 'snapshot_data' }),
}));


import { describe, it, expect, vi, beforeEach } from 'vitest';
import app from './index'; // app should be imported after mocks
import { CoachingMessageSchema, UserProfileSchema } from './types'; // For creating test data

describe('Worker', () => {
  beforeEach(() => {
    MOCK_KV_STORE.clear();
    vi.clearAllMocks(); // Clear mocks before each test

    // Mock env
    const mockEnv = {
      USER_SESSIONS_KV: {
        get: vi.fn((key: string) => Promise.resolve(MOCK_KV_STORE.get(key))),
        put: vi.fn((key: string, value: string) => {
          MOCK_KV_STORE.set(key, value);
          return Promise.resolve();
        }),
      },
      COACHING_HISTORY_KV: {
        put: vi.fn().mockResolvedValue(undefined),
      },
      GOOGLE_API_KEY: 'test-google-api-key',
      // Add other env vars if your handlers/chains use them
    };

    // Bind env to app context for tests if Hono supports it this way for testing
    // This is a conceptual step; actual Hono testing might require `app.fetch(req, env, ctx)`
    // For now, handlers are mocked, so direct env injection into app might not be strictly needed
    // if handlers receive env correctly.
  });

  it('should respond to /health', async () => {
    const res = await app.request('/health');
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ success: true, message: 'ok' });
  });

  describe('/api/coaching/message endpoint', () => {
    const defaultUserId = 'test-user-123';
    const defaultSessionId = 'test-session-456';

    const createMockRequest = (body: Record<string, unknown>) => {
      return new Request('http://localhost/api/coaching/message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
    };

    const mockUserProfile: UserProfile = UserProfileSchema.parse({
      id: defaultUserId,
      createdAt: new Date().toISOString(),
      lastActive: new Date().toISOString(),
      preferences: {},
      psychologicalProfile: {},
    });

    beforeEach(async () => {
      // Store a default user profile for most tests
      MOCK_KV_STORE.set(defaultUserId, JSON.stringify(mockUserProfile));
    });

    it('should return 400 if request body is invalid', async () => {
      const req = createMockRequest({ invalid_field: "some_value" });
      // @ts-ignore // Env might not be perfectly typed here for test requests
      const res = await app.fetch(req, { USER_SESSIONS_KV: MOCK_KV_STORE });
      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.success).toBe(false);
      expect(json.error.code).toBe('VALIDATION_ERROR');
    });

    it('should return 400 for invalid sessionType', async () => {
      const body = {
        userId: defaultUserId,
        message: "Hello",
        context: { sessionType: "invalid_session_type" }
      };
      const req = createMockRequest(body);
      // @ts-ignore
      const res = await app.fetch(req, { USER_SESSIONS_KV: MOCK_KV_STORE });
      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.error.message).toContain('Invalid session type');
    });

    it('should call handleDiagnostic for "diagnostic" sessionType', async () => {
      const diagnosticBody = CoachingMessageSchema.parse({
        userId: defaultUserId,
        sessionId: defaultSessionId,
        message: 'I feel down',
        context: { sessionType: 'diagnostic' },
      });
      const req = createMockRequest(diagnosticBody);
      const mockEnv = { USER_SESSIONS_KV: MOCK_KV_STORE, GOOGLE_API_KEY: 'test', COACHING_HISTORY_KV: MOCK_KV_STORE };
      // @ts-ignore
      const res = await app.fetch(req, mockEnv);
      expect(res.status).toBe(200);
      // Check if the mocked handleDiagnostic was called
      const { handleDiagnostic } = await import('./handlers/diagnosticHandler');
      expect(handleDiagnostic).toHaveBeenCalled();
      const json = await res.json();
      expect(json.data.type).toBe('diagnostic'); // From mock
    });

    it('should call handleIntervention for "intervention" sessionType', async () => {
        const interventionBody = CoachingMessageSchema.parse({
            userId: defaultUserId,
            sessionId: defaultSessionId,
            message: 'Suggest something',
            context: { sessionType: 'intervention' },
        });
        const req = createMockRequest(interventionBody);
        const mockEnv = { USER_SESSIONS_KV: MOCK_KV_STORE, GOOGLE_API_KEY: 'test', COACHING_HISTORY_KV: MOCK_KV_STORE };
        // @ts-ignore
        const res = await app.fetch(req, mockEnv);
        expect(res.status).toBe(200);
        const { handleIntervention } = await import('./handlers/interventionHandler');
        expect(handleIntervention).toHaveBeenCalled();
        const json = await res.json();
        expect(json.data.type).toBe('intervention');
    });

    it('should call handleOnboardingDiagnostic for "onboarding_diagnostic" sessionType', async () => {
      const onboardingBody = CoachingMessageSchema.parse({
        userId: defaultUserId,
        message: 'Starting onboarding',
        context: {
          sessionType: 'onboarding_diagnostic',
          onboardingAnswers: {
            mindset: 'growth', locus: 'internal', regulatory_focus: 'promotion',
            personality_disorganized: 1, personality_outgoing: 3, personality_moody: 2,
            final_focus: 'career'
          }
        },
      });
      const req = createMockRequest(onboardingBody);
      const mockEnv = { USER_SESSIONS_KV: MOCK_KV_STORE, GOOGLE_API_KEY: 'test' };
       // @ts-ignore
      const res = await app.fetch(req, mockEnv);
      expect(res.status).toBe(200);
      const { handleOnboardingDiagnostic } = await import('./handlers/onboardingDiagnosticHandler');
      expect(handleOnboardingDiagnostic).toHaveBeenCalled();
      const json = await res.json();
      expect(json.data.type).toBe('onboarding_diagnostic');
    });

    it('should return 400 if onboardingAnswers are missing for "onboarding_diagnostic"', async () => {
        const body = {
            userId: defaultUserId,
            message: "Hello",
            context: { sessionType: "onboarding_diagnostic" } // Missing onboardingAnswers
        };
        const req = createMockRequest(body);
        const mockEnv = { USER_SESSIONS_KV: MOCK_KV_STORE, GOOGLE_API_KEY: 'test' };
        // @ts-ignore
        const res = await app.fetch(req, mockEnv);
        expect(res.status).toBe(400);
        const json = await res.json();
        expect(json.error.code).toBe('MISSING_ONBOARDING_ANSWERS');
    });

    it('should call handleReflection for "reflection" sessionType', async () => {
      const reflectionBody = CoachingMessageSchema.parse({
        userId: defaultUserId,
        message: 'The task was easy',
        context: {
          sessionType: 'reflection',
          previousTask: 'do 10 pushups',
          reflectionId: 'easy'
        },
      });
      const req = createMockRequest(reflectionBody);
      const mockEnv = { USER_SESSIONS_KV: MOCK_KV_STORE, GOOGLE_API_KEY: 'test', COACHING_HISTORY_KV: MOCK_KV_STORE };
      // @ts-ignore
      const res = await app.fetch(req, mockEnv);
      expect(res.status).toBe(200);
      const { handleReflection } = await import('./handlers/reflectionHandler');
      expect(handleReflection).toHaveBeenCalled();
      const json = await res.json();
      expect(json.data.type).toBe('reflection');
    });

    it('should return 400 if previousTask or reflectionId is missing for "reflection"', async () => {
        const body = {
            userId: defaultUserId,
            message: "My reflection",
            context: { sessionType: "reflection" } // Missing previousTask and reflectionId
        };
        const req = createMockRequest(body);
        const mockEnv = { USER_SESSIONS_KV: MOCK_KV_STORE, GOOGLE_API_KEY: 'test' };
        // @ts-ignore
        const res = await app.fetch(req, mockEnv);
        expect(res.status).toBe(400);
        const json = await res.json();
        expect(json.error.code).toBe('MISSING_REFLECTION_DATA');
    });

    it('should call handleSnapshotGeneration for "snapshot_generation" sessionType', async () => {
      const snapshotBody = CoachingMessageSchema.parse({
        userId: defaultUserId,
        message: 'Get my snapshot', // Message content might not be strictly needed by handler
        context: { sessionType: 'snapshot_generation' },
      });
      // Pre-populate snapshot for this test
      MOCK_KV_STORE.set(`snapshot_${defaultUserId}`, JSON.stringify({ type: 'snapshot', data: 'snapshot_data' }));

      const req = createMockRequest(snapshotBody);
      const mockEnv = { USER_SESSIONS_KV: MOCK_KV_STORE, GOOGLE_API_KEY: 'test' };
      // @ts-ignore
      const res = await app.fetch(req, mockEnv);
      expect(res.status).toBe(200);
      const { handleSnapshotGeneration } = await import('./handlers/snapshotGenerationHandler');
      expect(handleSnapshotGeneration).toHaveBeenCalled();
      const json = await res.json();
      expect(json.data.type).toBe('snapshot');
    });

    it('should create a new user profile if one does not exist in KV', async () => {
      const newUserId = 'new-user-789';
      MOCK_KV_STORE.delete(newUserId); // Ensure no profile exists

      const diagnosticBody = CoachingMessageSchema.parse({
        userId: newUserId, // Use a new user ID
        sessionId: defaultSessionId,
        message: 'I am a new user',
        context: { sessionType: 'diagnostic' },
      });
      const req = createMockRequest(diagnosticBody);
      const mockEnv = { USER_SESSIONS_KV: MOCK_KV_STORE, GOOGLE_API_KEY: 'test', COACHING_HISTORY_KV: MOCK_KV_STORE };

      // @ts-ignore
      const res = await app.fetch(req, mockEnv);
      expect(res.status).toBe(200);

      // Check if a new profile was created and put into KV
      const profileString = MOCK_KV_STORE.get(newUserId);
      expect(profileString).toBeDefined();
      const profile = JSON.parse(profileString!);
      expect(profile.id).toBe(newUserId);

      const { handleDiagnostic } = await import('./handlers/diagnosticHandler');
      expect(handleDiagnostic).toHaveBeenCalled();
    });

    // TODO: Add test for safety assessment failure (Guardrail)
    // TODO: Add test for KV not configured (for user profile and history)
    // TODO: Add tests for conversation history saving logic
  });
});
