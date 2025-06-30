import { ChatOpenAI } from '@langchain/openai';
import { HumanMessage, SystemMessage } from '@langchain/core/messages';
import { GuardrailConfig, CrisisIndicators, CoachingMessage } from '../types';

/**
 * Guardrail Chain - Crisis Detection and Safety
 * 
 * This chain acts as the first line of defense, screening all user messages
 * for crisis indicators, self-harm, suicidal ideation, and other safety concerns.
 * It follows evidence-based crisis intervention protocols.
 */
export class GuardrailChain {
  private llm: ChatOpenAI;
  private config: GuardrailConfig;

  constructor(apiKey: string, config?: Partial<GuardrailConfig>) {
    this.config = {
      maxTokens: 500,
      temperature: 0.1, // Low temperature for consistent safety assessments
      model: 'gpt-4-turbo-preview',
      systemPrompt: this.buildSystemPrompt(),
      crisisKeywords: [
        'suicide', 'kill myself', 'end it all', 'not worth living', 'better off dead',
        'self-harm', 'cutting', 'hurting myself', 'want to die', 'hopeless',
        'trapped', 'burden', 'escape', 'overdose', 'pills', 'jump', 'gun',
        'abuse', 'violence', 'hitting me', 'scared', 'help me', 'emergency'
      ],
      escalationThreshold: 0.7, // Confidence threshold for escalation
      ...config
    };

    this.llm = new ChatOpenAI({
      openAIApiKey: apiKey,
      modelName: this.config.model,
      temperature: this.config.temperature,
      maxTokens: this.config.maxTokens,
    });
  }

  private buildSystemPrompt(): string {
    return `You are a crisis detection AI trained in evidence-based mental health screening protocols. Your role is to assess user messages for safety concerns and crisis indicators.

CRITICAL SAFETY PROTOCOL:
1. Analyze every message for signs of:
   - Suicidal ideation or self-harm
   - Abuse or violence
   - Substance abuse crises
   - Psychotic episodes
   - Severe depression or anxiety
   - Immediate safety concerns

2. Response levels:
   - NONE: No safety concerns detected
   - LOW: Mild distress, normal coaching can continue
   - MEDIUM: Elevated concern, requires careful monitoring
   - HIGH: Significant risk, specialized intervention needed
   - IMMEDIATE: Crisis requiring emergency response

3. For any MEDIUM or above, provide:
   - Specific crisis indicators detected
   - Recommended immediate actions
   - Appropriate crisis resources

4. Always prioritize user safety over coaching goals.

ASSESSMENT FRAMEWORK:
- Use validated screening tools (PHQ-9, GAD-7, Columbia Suicide Severity Rating Scale principles)
- Look for direct statements, implied meanings, and contextual clues
- Consider cumulative patterns across messages
- Assess protective factors and support systems

RESPONSE FORMAT:
Return a JSON object with:
{
  "riskLevel": "none|low|medium|high|immediate",
  "confidence": 0.0-1.0,
  "indicators": ["list", "of", "specific", "concerns"],
  "recommendedAction": "continue|monitor|escalate|emergency",
  "crisisResources": ["if", "applicable"],
  "rationale": "brief explanation of assessment"
}

Remember: False positives are acceptable; false negatives are dangerous.`;
  }

  async assessSafety(message: CoachingMessage): Promise<CrisisIndicators & { shouldProceed: boolean; response?: string }> {
    try {
      // Quick keyword screening first
      const hasKeywords = this.quickKeywordScreen(message.message);
      
      // If no obvious keywords, do a basic assessment
      if (!hasKeywords && !this.requiresDeepAnalysis(message)) {
        return {
          suicidalIdeation: false,
          selfHarm: false,
          substanceAbuse: false,
          domesticViolence: false,
          psychosis: false,
          severeDepression: false,
          panicDisorder: false,
          severity: 'none',
          confidence: 0.9,
          recommendedAction: 'continue',
          shouldProceed: true
        };
      }

      // Perform detailed LLM analysis
      const analysis = await this.performLLMAnalysis(message);
      
      // Generate crisis response if needed
      const response = analysis.severity !== 'none' ? await this.generateCrisisResponse(analysis) : undefined;

      return {
        ...analysis,
        shouldProceed: analysis.severity === 'none' || analysis.severity === 'low',
        response
      };

    } catch (error) {
      console.error('Guardrail chain error:', error);
      
      // On error, err on the side of caution
      return {
        suicidalIdeation: false,
        selfHarm: false,
        substanceAbuse: false,
        domesticViolence: false,
        psychosis: false,
        severeDepression: false,
        panicDisorder: false,
        severity: 'medium',
        confidence: 0.5,
        recommendedAction: 'escalate',
        shouldProceed: false,
        response: "I want to make sure you're getting the right support. Would you like to connect with a crisis counselor who can provide immediate assistance?"
      };
    }
  }

  private quickKeywordScreen(message: string): boolean {
    const lowercaseMessage = message.toLowerCase();
    return this.config.crisisKeywords.some(keyword => 
      lowercaseMessage.includes(keyword.toLowerCase())
    );
  }

  private requiresDeepAnalysis(message: CoachingMessage): boolean {
    // Check context for elevated urgency or previous concerns
    if (message.context?.urgencyLevel === 'high' || message.context?.urgencyLevel === 'crisis') {
      return true;
    }

    // Look for emotional intensity markers
    const intensityMarkers = ['!!!', 'help', 'can\'t', 'desperate', 'overwhelmed', 'breaking'];
    const lowercaseMessage = message.message.toLowerCase();
    
    return intensityMarkers.some(marker => lowercaseMessage.includes(marker));
  }

  private async performLLMAnalysis(message: CoachingMessage): Promise<CrisisIndicators> {
    const messages = [
      new SystemMessage(this.config.systemPrompt),
      new HumanMessage(`Assess this message for crisis indicators:

Message: "${message.message}"

Context: ${JSON.stringify(message.context || {})}

Provide your assessment in the specified JSON format.`)
    ];

    const response = await this.llm.invoke(messages);
    
    try {
      const assessment = JSON.parse(response.content as string);
      
      return {
        suicidalIdeation: assessment.indicators.some((i: string) => 
          i.toLowerCase().includes('suicide') || i.toLowerCase().includes('self-harm')
        ),
        selfHarm: assessment.indicators.some((i: string) => 
          i.toLowerCase().includes('harm') || i.toLowerCase().includes('cutting')
        ),
        substanceAbuse: assessment.indicators.some((i: string) => 
          i.toLowerCase().includes('substance') || i.toLowerCase().includes('drug')
        ),
        domesticViolence: assessment.indicators.some((i: string) => 
          i.toLowerCase().includes('abuse') || i.toLowerCase().includes('violence')
        ),
        psychosis: assessment.indicators.some((i: string) => 
          i.toLowerCase().includes('psycho') || i.toLowerCase().includes('hearing')
        ),
        severeDepression: assessment.riskLevel === 'high' || assessment.riskLevel === 'immediate',
        panicDisorder: assessment.indicators.some((i: string) => 
          i.toLowerCase().includes('panic') || i.toLowerCase().includes('anxiety')
        ),
        severity: assessment.riskLevel,
        confidence: assessment.confidence,
        recommendedAction: assessment.recommendedAction
      };
      
    } catch (parseError) {
      console.error('Failed to parse LLM crisis assessment:', parseError);
      throw new Error('Crisis assessment failed');
    }
  }

  private async generateCrisisResponse(assessment: CrisisIndicators): Promise<string> {
    if (assessment.severity === 'immediate') {
      return `I'm very concerned about what you've shared. Your safety is the most important thing right now. 

🚨 **Immediate Help Available:**
• **Call 988** (Suicide & Crisis Lifeline) - Available 24/7
• **Text HOME to 741741** (Crisis Text Line)
• **Call 911** if you're in immediate danger

You don't have to go through this alone. These trained counselors are standing by to help you right now. 

Would you like me to help you connect with one of these resources?`;
    }

    if (assessment.severity === 'high') {
      return `I can hear that you're going through a really difficult time right now. Your wellbeing is important, and I want to make sure you get the right support.

**Crisis Support Resources:**
• **988 Suicide & Crisis Lifeline**: Call or chat at 988lifeline.org
• **Crisis Text Line**: Text HOME to 741741
• **SAMHSA National Helpline**: 1-800-662-4357

These are trained professionals who specialize in helping people through tough moments. Would it be helpful to talk through how to reach out to one of them?

I'm here to support you, but I want to make sure you have access to the specialized help you deserve.`;
    }

    if (assessment.severity === 'medium') {
      return `I want to acknowledge what you're sharing with me. It sounds like things feel overwhelming right now, and that takes courage to express.

While I'm here to support you through coaching, I also want you to know about some additional resources that might be helpful:

• **988 Suicide & Crisis Lifeline**: Free, confidential support 24/7
• **NAMI Helpline**: 1-800-950-6264 for mental health information and support

How are you feeling about your safety right now? And is there anything specific I can help you with in this moment?`;
    }

    return "Thank you for sharing that with me. I'm here to support you.";
  }
}