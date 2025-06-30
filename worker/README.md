# AI Coaching API - LangChain + Cloudflare Workers

A sophisticated AI coaching API built with LangChain and deployed on Cloudflare Workers. This system implements evidence-based therapeutic frameworks including Evidence-based Therapy (ET), Self-Determination Theory (SDT), and Goal Setting Theory (GST).

## 🏗️ Architecture

### Chain-Based Processing
The API uses three specialized LangChain chains for comprehensive coaching:

1. **Guardrail Chain** (`src/chains/guardrail.ts`)
   - Crisis detection and safety assessment
   - Suicide/self-harm screening
   - Risk level evaluation
   - Emergency response protocols

2. **Diagnostic Chain** (`src/chains/diagnostic.ts`)
   - Evidence-based psychological assessment
   - Self-Determination Theory evaluation
   - Motivational interviewing principles
   - User profiling and insight generation

3. **Interventions Chain** (`src/chains/interventions.ts`)
   - Goal Setting Theory-based prescriptions
   - Personalized strategy recommendations
   - Behavioral, cognitive, and motivational interventions
   - Progress tracking and adaptation

### Technology Stack
- **Runtime**: Cloudflare Workers (Edge computing)
- **Framework**: Hono (Fast web framework)
- **AI/ML**: LangChain with OpenAI GPT-4
- **Validation**: Zod schemas
- **Storage**: Cloudflare KV (Key-Value store)
- **Language**: TypeScript

## 🚀 Features

### Core Capabilities
- ✅ **Crisis Detection**: Real-time safety screening with emergency protocols
- ✅ **Psychological Assessment**: Evidence-based user profiling and needs analysis
- ✅ **Personalized Interventions**: Tailored strategies based on psychological profile
- ✅ **Session Management**: Conversation history and context preservation
- ✅ **Rate Limiting**: Protection against abuse with KV-based tracking
- ✅ **Authentication**: Multiple auth methods (API key, Bearer token)
- ✅ **Monitoring**: Comprehensive logging and performance metrics

### Psychological Frameworks
- **Evidence-based Therapy (ET)**: Validated assessment techniques and interventions
- **Self-Determination Theory (SDT)**: Autonomy, competence, and relatedness evaluation
- **Goal Setting Theory (GST)**: Specific, challenging, committed goal framework
- **Motivational Interviewing**: Empathetic, non-confrontational approach

## 📁 Project Structure

```
worker/
├── src/
│   ├── chains/
│   │   ├── guardrail.ts       # Crisis detection safety chain
│   │   ├── diagnostic.ts      # Main diagnostic (ET → SDT) chain
│   │   └── interventions.ts   # Prescriptive GST-based chains
│   ├── index.ts               # Main API router (Hono)
│   └── types.ts               # API request/response type definitions
├── package.json
├── wrangler.toml
├── tsconfig.json
└── README.md
```

## 🛠️ Setup & Development

### Prerequisites
- Node.js 18+ and npm
- Cloudflare account with Workers enabled
- OpenAI API key

### Installation
```bash
# Install dependencies
npm install

# Install Wrangler CLI globally (if not already installed)
npm install -g wrangler

# Authenticate with Cloudflare
wrangler login
```

### Environment Configuration
Set up your secrets using Wrangler:

```bash
# Required: OpenAI API key for LangChain
wrangler secret put OPENAI_API_KEY

# Required: API key for service authentication
wrangler secret put API_KEY

# Required: JWT secret for token validation
wrangler secret put JWT_SECRET

# Optional: Anthropic API key for alternative LLM
wrangler secret put ANTHROPIC_API_KEY
```

### KV Namespace Setup
Create KV namespaces for data storage:

```bash
# Create KV namespaces
wrangler kv:namespace create "RATE_LIMIT_KV"
wrangler kv:namespace create "USER_SESSIONS_KV"
wrangler kv:namespace create "COACHING_HISTORY_KV"

# Create preview namespaces for development
wrangler kv:namespace create "RATE_LIMIT_KV" --preview
wrangler kv:namespace create "USER_SESSIONS_KV" --preview
wrangler kv:namespace create "COACHING_HISTORY_KV" --preview
```

Update the namespace IDs in `wrangler.toml` with the generated IDs.

### Development
```bash
# Start local development server
npm run dev

# Type checking
npm run type-check

# Linting
npm run lint

# Format code
npm run format
```

### Deployment
```bash
# Deploy to staging
npm run deploy:staging

# Deploy to production
npm run deploy:production
```

## 📚 API Reference

### Base URL
- **Development**: `http://localhost:8787`
- **Production**: `https://your-worker.your-subdomain.workers.dev`

### Authentication
Include one of the following in your requests:

```bash
# API Key Authentication
curl -H "X-API-Key: your-api-key" ...

# Bearer Token Authentication
curl -H "Authorization: Bearer your-jwt-token" ...
```

### Endpoints

#### Health Check
```http
GET /health
```
Returns API status and chain availability.

#### Coaching Message
```http
POST /api/coaching/message
Content-Type: application/json

{
  "message": "I'm feeling stuck with my goals",
  "userId": "user123",
  "context": {
    "sessionType": "diagnostic",
    "currentGoal": "Build better habits",
    "urgencyLevel": "medium"
  }
}
```

Response flows through the chain system:
1. **Guardrail Assessment**: Checks for crisis indicators
2. **Chain Selection**: Chooses diagnostic or intervention based on user profile
3. **Personalized Response**: Returns tailored coaching guidance

#### User Profile Management
```http
# Get user profile
GET /api/user/profile/{userId}

# Update user profile
POST /api/user/profile/{userId}
Content-Type: application/json

{
  "preferences": {
    "theme": "calm",
    "coachingStyle": "supportive"
  },
  "psychologicalProfile": {
    "mindset": "growth",
    "locus": "internal",
    "regulatory_focus": "promotion"
  }
}
```

## 🧠 Psychological Assessment System

### Self-Determination Theory (SDT) Factors
- **Autonomy**: Feeling of volition and self-direction
- **Competence**: Sense of effectiveness and mastery  
- **Relatedness**: Connection and belonging with others

### Goal Setting Theory (GST) Principles
- **Specificity**: Clear, unambiguous objectives
- **Difficulty**: Appropriately challenging but achievable
- **Commitment**: User acceptance and dedication to goals
- **Feedback**: Regular progress monitoring and adjustment

### Crisis Detection Protocol
- **Risk Levels**: None, Low, Medium, High, Immediate
- **Indicators**: Suicidal ideation, self-harm, abuse, psychosis
- **Response**: Escalation to crisis resources and emergency services
- **Resources**: 988 Lifeline, Crisis Text Line, emergency contacts

## 🔒 Security & Safety

### Crisis Prevention
- Real-time message screening for safety concerns
- Immediate escalation protocols for high-risk situations
- Crisis resource provision and emergency contact facilitation
- False positive tolerance (better safe than sorry)

### Data Protection
- No persistent storage of sensitive conversation content
- KV-based session management with automatic expiration
- Rate limiting to prevent abuse
- Input validation and sanitization

### Authentication & Authorization
- Multiple authentication methods supported
- API key validation for service-to-service communication
- Bearer token support for user authentication
- Request validation using Zod schemas

## 📊 Monitoring & Analytics

### Performance Metrics
- Response time tracking per request
- Chain processing time measurement
- Token usage monitoring (when available)
- Error rate and type tracking

### Usage Analytics
- Conversation patterns and user engagement
- Chain utilization statistics
- Crisis detection frequency and accuracy
- User profile evolution tracking

## 🚀 Production Considerations

### Scaling
- Edge deployment across Cloudflare's global network
- Automatic scaling based on demand
- KV storage for session persistence across regions
- Minimal cold start latency

### Reliability
- Graceful error handling and fallback responses
- Chain failure recovery mechanisms
- Input validation and sanitization
- Comprehensive logging for debugging

### Cost Optimization
- Efficient token usage with targeted prompts
- KV storage optimization with TTL
- Request batching where applicable
- Model selection based on complexity needs

## 🔧 Customization

### Adding New Chains
1. Create new chain file in `src/chains/`
2. Implement LangChain integration
3. Add to chain initialization in `index.ts`
4. Update routing logic for chain selection

### Extending Assessment Frameworks
1. Update psychological profile types in `types.ts`
2. Enhance diagnostic chain prompts
3. Add new intervention categories
4. Update user profile validation schemas

### Integration Examples
```typescript
// Custom intervention integration
const customIntervention = await interventionsChain.prescribeIntervention(
  message,
  userProfile,
  assessmentData,
  currentGoals
);

// Adaptation based on feedback
const adaptedStrategy = await interventionsChain.adaptIntervention(
  originalIntervention,
  userFeedback,
  'easier'
);
```

## 📝 Contributing

1. Follow TypeScript best practices
2. Add comprehensive tests for new chains
3. Update documentation for API changes
4. Ensure crisis detection remains robust
5. Validate psychological framework implementation

## 📄 License

MIT License - see LICENSE file for details.

---

Built with ❤️ using LangChain and Cloudflare Workers for intelligent, scalable AI coaching.