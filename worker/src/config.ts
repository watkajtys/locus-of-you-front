
import { GuardrailConfig, InterventionConfig, DiagnosticConfig } from './types';

export const guardrailConfig: GuardrailConfig = {
  crisisKeywords: [], // Add keywords if needed
  escalationThreshold: 0.95,
  maxTokens: 500,
  temperature: 0.1,
  model: 'gemini-1.5-flash',
  systemPrompt: '' // Add system prompt if needed
};

export const interventionConfig: InterventionConfig = {
  interventionTypes: ['behavioral', 'cognitive'],
  personalityFactors: true,
  maxTokens: 1000,
  temperature: 0.4,
  model: 'gemini-1.5-flash',
  systemPrompt: '' // Add system prompt if needed
};

export const diagnosticConfig: DiagnosticConfig = {
  assessmentFrameworks: ['SDT'], // Assuming a default framework
  maxQuestions: 5, // Assuming a default number of questions
  assessmentAreas: ['mood', 'sleep', 'motivation'],
  maxTokens: 1500,
  temperature: 0.3,
  model: 'gemini-1.5-flash',
  systemPrompt: '' // Add system prompt if needed
};
