import { z } from 'zod';

// User Profile Types
export const UserProfileSchema = z.object({
  id: z.string(),
  email: z.string().email().optional(),
  username: z.string().optional(),
  createdAt: z.string(),
  lastActive: z.string(),
  preferences: z.object({
    theme: z.enum(['calm', 'professional']).default('calm'),
    notifications: z.boolean().default(true),
    coachingStyle: z.enum(['supportive', 'challenging', 'analytical']).default('supportive')
  }),
  psychologicalProfile: z.object({
    mindset: z.enum(['growth', 'fixed']).optional(),
    locus: z.enum(['internal', 'external']).optional(),
    regulatory_focus: z.enum(['promotion', 'prevention']).optional(),
    personality_traits: z.object({
      disorganized: z.number().min(1).max(5).optional(),
      outgoing: z.number().min(1).max(5).optional(),
      moody: z.number().min(1).max(5).optional()
    }).optional()
  }).optional()
});

export type UserProfile = z.infer<typeof UserProfileSchema>;

// Onboarding Answers Type
export const OnboardingAnswersSchema = z.object({
  mindset: z.enum(['fixed', 'growth']),
  locus: z.enum(['external', 'internal']),
  regulatory_focus: z.enum(['promotion', 'prevention']),
  personality_disorganized: z.number().min(1).max(5),
  personality_outgoing: z.number().min(1).max(5),
  personality_moody: z.number().min(1).max(5),
  final_focus: z.string().min(1),
});

export type OnboardingAnswers = z.infer<typeof OnboardingAnswersSchema>;

// Insight Types for Snapshot
export const InsightSchema = z.object({
  type: z.enum(['spectrum', 'balance', 'ring']),
  title: z.string(),
  description: z.string(),
  userScore: z.number(),
  minLabel: z.string().optional(),
  maxLabel: z.string().optional(),
  leftLabel: z.string().optional(),
  rightLabel: z.string().optional(),
});

export type Insight = z.infer<typeof InsightSchema>;

// Snapshot Data Type
export const SnapshotDataSchema = z.object({
  archetype: z.string(),
  insights: z.array(InsightSchema),
  userGoal: z.string(),
  narrativeSummary: z.string(),
});

export type SnapshotData = z.infer<typeof SnapshotDataSchema>;

// Coaching Message Types
export const CoachingMessageSchema = z.object({
  message: z.string().min(1).max(2000),
  userId: z.string(),
  sessionId: z.string().optional(),
  context: z.object({
    previousMessages: z.array(z.string()).optional(),
    currentGoal: z.string().optional(),
    urgencyLevel: z.enum(['low', 'medium', 'high', 'crisis']).default('medium'),
    sessionType: z.enum(['diagnostic', 'intervention', 'reflection', 'goal_setting', 'onboarding_diagnostic', 'snapshot_generation']).default('diagnostic'),
    onboardingAnswers: OnboardingAnswersSchema.optional(), // Add onboardingAnswers
  }).optional()
});

export type CoachingMessage = z.infer<typeof CoachingMessageSchema>;

// AI Response Types
export const AIResponseSchema = z.object({
  id: z.string(),
  content: z.string(),
  type: z.enum([
    'DIAGNOSTIC_QUESTION',
    'INTERVENTION_SUGGESTION', 
    'REFLECTION_PROMPT',
    'GOAL_CLARIFICATION',
    'CRISIS_RESPONSE',
    'SUPPORTIVE_MESSAGE',
    'CHALLENGE_REFRAME'
  ]),
  strategy: z.enum([
    'ET_ASSESSMENT',      // Evidence-based Therapy assessment
    'SDT_AUTONOMY',       // Self-Determination Theory - Autonomy
    'SDT_COMPETENCE',     // Self-Determination Theory - Competence  
    'SDT_RELATEDNESS',    // Self-Determination Theory - Relatedness
    'GST_SPECIFICITY',    // Goal Setting Theory - Specific goals
    'GST_DIFFICULTY',     // Goal Setting Theory - Appropriate difficulty
    'GST_FEEDBACK',       // Goal Setting Theory - Feedback
    'CRISIS_INTERVENTION' // Crisis detection and response
  ]),
  confidence: z.number().min(0).max(1),
  followUpSuggestions: z.array(z.string()).optional(),
  timestamp: z.string(),
  metadata: z.object({
    chainUsed: z.enum(['guardrail', 'diagnostic', 'intervention']),
    processingTime: z.number(),
    tokensUsed: z.number().optional(),
    riskLevel: z.enum(['none', 'low', 'medium', 'high', 'crisis']).default('none')
  })
});

export type AIResponse = z.infer<typeof AIResponseSchema>;

// Chain Configuration Types
export interface ChainConfig {
  maxTokens: number;
  temperature: number;
  model: string;
  systemPrompt: string;
}

export interface GuardrailConfig extends ChainConfig {
  crisisKeywords: string[];
  escalationThreshold: number;
}

export interface DiagnosticConfig extends ChainConfig {
  assessmentFrameworks: ('ET' | 'SDT' | 'CBT' | 'ACT')[];
  maxQuestions: number;
}

export interface InterventionConfig extends ChainConfig {
  interventionTypes: ('behavioral' | 'cognitive' | 'motivational' | 'goal_setting')[];
  personalityFactors: boolean;
  microtaskSystemPrompt?: string; // Add this line
}

// API Response Types
export interface APIResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    message: string;
    code: string;
    details?: any;
  };
  metadata?: {
    timestamp: string;
    requestId: string;
    processingTime: number;
  };
}

// Environment Variables Type
export interface Env {
  [key: string]: any;
  // LangChain API Keys
  GOOGLE_API_KEY: string;
  ANTHROPIC_API_KEY?: string;
  
  // Worker Configuration
  API_KEY: string;
  JWT_SECRET: string;
  ENVIRONMENT: 'development' | 'staging' | 'production';
  
  // KV Namespaces
  RATE_LIMIT_KV?: KVNamespace;
  USER_SESSIONS_KV?: KVNamespace;
  COACHING_HISTORY_KV?: KVNamespace;
  
  // D1 Database (optional)
  DB?: D1Database;
}

// Psychological Assessment Types
export interface PsychologicalAssessment {
  mindsetScore: number; // 1-5 scale (1=fixed, 5=growth)
  locusScore: number;   // 1-5 scale (1=external, 5=internal)
  regulatoryFocus: 'promotion' | 'prevention' | 'balanced';
  personalityFactors: {
    openness: number;
    conscientiousness: number;
    extraversion: number;
    agreeableness: number;
    neuroticism: number;
  };
  motivationalProfile: {
    autonomy: number;    // SDT factor
    competence: number;  // SDT factor
    relatedness: number; // SDT factor
  };
  riskFactors: {
    depression: number;
    anxiety: number;
    stress: number;
    burnout: number;
  };
}

// Goal Setting Types
export interface UserGoal {
  id: string;
  userId: string;
  title: string;
  description: string;
  category: 'health' | 'career' | 'relationships' | 'personal_growth' | 'other';
  priority: 'low' | 'medium' | 'high';
  status: 'active' | 'paused' | 'completed' | 'abandoned';
  targetDate?: string;
  progress: number; // 0-100
  milestones: Array<{
    id: string;
    title: string;
    completed: boolean;
    completedAt?: string;
  }>;
  gstFactors: {
    specificity: number;    // How specific is the goal (1-5)
    difficulty: number;     // Appropriate challenge level (1-5)
    commitment: number;     // User's commitment level (1-5)
    feedback: number;       // Quality of feedback mechanisms (1-5)
  };
  createdAt: string;
  updatedAt: string;
}

// Session Management Types
export interface CoachingSession {
  id: string;
  userId: string;
  startTime: string;
  endTime?: string;
  messages: Array<{
    id: string;
    role: 'user' | 'assistant';
    content: string;
    timestamp: string;
    metadata?: any;
  }>;
  sessionSummary?: {
    keyInsights: string[];
    actionItems: string[];
    nextSteps: string[];
    riskAssessment: 'none' | 'low' | 'medium' | 'high' | 'crisis';
  };
  status: 'active' | 'completed' | 'interrupted';
}

// Crisis Detection Types
export interface CrisisIndicators {
  suicidalIdeation: boolean;
  selfHarm: boolean;
  substanceAbuse: boolean;
  domesticViolence: boolean;
  psychosis: boolean;
  severeDepression: boolean;
  panicDisorder: boolean;
  severity: 'none' | 'low' | 'medium' | 'high' | 'immediate';
  confidence: number;
  recommendedAction: 'continue' | 'escalate' | 'emergency_services' | 'crisis_line';
}

export interface Microtask {
  rationale: string;
  task: string;
}
