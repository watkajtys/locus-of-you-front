/**
 * Utility functions for prompt engineering and response parsing
 */

/**
 * Standardized JSON parsing for LLM responses
 * Handles multiple formats: plain JSON, markdown code blocks, etc.
 */
export function parseJSONResponse<T>(responseContent: string, context: string): T {
  let jsonString = responseContent.trim();
  
  // Try to extract from markdown code blocks first
  const codeBlockMatch = jsonString.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
  if (codeBlockMatch && codeBlockMatch[1]) {
    jsonString = codeBlockMatch[1].trim();
  }
  
  // If no code block found, check if it's already valid JSON
  if (!codeBlockMatch && jsonString.startsWith('{') && jsonString.endsWith('}')) {
    // Use as-is
  } else if (!codeBlockMatch) {
    throw new Error(`No valid JSON found in ${context} response. Raw content: ${responseContent.substring(0, 200)}...`);
  }
  
  try {
    const parsed = JSON.parse(jsonString);
    return parsed as T;
  } catch (error) {
    console.error(`JSON parsing error in ${context}:`, error);
    console.error(`Attempted to parse:`, jsonString);
    throw new Error(`Failed to parse JSON in ${context}. Raw: ${jsonString.substring(0, 200)}...`);
  }
}

/**
 * Creates consistent system prompt structure with clear JSON output requirements
 */
export function createStructuredPrompt(
  role: string,
  mission: string,
  context: string,
  requirements: string[],
  outputFormat: string,
  examples?: string[]
): string {
  let prompt = `You are ${role}.

MISSION: ${mission}

CONTEXT: ${context}

REQUIREMENTS:
${requirements.map((req, i) => `${i + 1}. ${req}`).join('\n')}

OUTPUT FORMAT: ${outputFormat}`;

  if (examples && examples.length > 0) {
    prompt += `

EXAMPLES:
${examples.join('\n\n')}`;
  }

  prompt += `

CRITICAL: Return ONLY the specified JSON format. No additional text, explanations, or markdown formatting outside the JSON.`;

  return prompt;
}

/**
 * Standard error responses for different failure modes
 */
export const FALLBACK_RESPONSES = {
  PARSING_ERROR: "I'm having trouble processing your request. Please try rephrasing your message.",
  API_ERROR: "There was a technical issue. Please try again in a moment.",
  VALIDATION_ERROR: "I need a bit more information to help you effectively. Could you provide more details?",
  RATE_LIMIT: "I'm receiving a lot of requests right now. Please try again in a few minutes.",
} as const;

/**
 * Validates response structure for common patterns
 */
export function validateResponseStructure<T extends object>(
  response: T,
  requiredFields: (keyof T)[],
  context: string
): void {
  for (const field of requiredFields) {
    if (!(field in response) || response[field] === undefined || response[field] === null) {
      throw new Error(`Missing required field '${String(field)}' in ${context} response`);
    }
  }
}