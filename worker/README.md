# AI Coaching API - Cloudflare Worker

A secure, scalable API for AI-powered coaching built on Cloudflare Workers with comprehensive authentication, rate limiting, and monitoring.

## Features

- **🔐 Multi-layer Authentication**: JWT tokens and API keys using `@tsndr/cloudflare-worker-jwt`
- **⚡ Rate Limiting**: Configurable limits per endpoint using KV storage
- **🛡️ Security Headers**: CORS, CSP, and comprehensive security middleware
- **📊 Request Validation**: Zod schema validation with Hono validators
- **🔍 Monitoring**: Request logging and performance tracking
- **📚 Auto Documentation**: Built-in API documentation at `/api/docs`
- **🏥 Health Checks**: Service health monitoring at `/health`
- **🤖 AI Chains**: Integrated LangChain with Google Gemini for coaching intelligence

## Quick Start

### 1. Install Dependencies

```bash
cd worker
npm install
```

### 2. Configure Environment

Copy the example and set your environment variables:

```bash
# Set these in your Cloudflare Workers dashboard or wrangler.toml
GOOGLE_API_KEY=your-google-gemini-api-key
API_KEY=your-admin-api-key
JWT_SECRET=your-jwt-secret-key-minimum-32-chars
ENVIRONMENT=development
```

### 3. Deploy

```bash
# Deploy to development
npm run deploy

# Deploy to production
npm run deploy:production
```

## Architecture

```
Frontend (React) → Cloudflare Workers → AI Chains (Google Gemini) → KV Storage
                                   ↓
                              Rate Limiting
                              JWT Authentication
                              Validation
                              Security Headers
```

## API Endpoints

### Authentication
All endpoints except `/health` and `/api/docs` require authentication.

**JWT Authentication (for users):**
```
Authorization: Bearer <jwt_token>
```

**API Key Authentication (for admin):**
```
X-API-Key: <api_key>
```

### Core Endpoints

#### Health & Documentation
- `GET /health` - Health check (no auth required)
- `GET /api/docs` - Comprehensive API documentation

#### Coaching (JWT + Subscription Required)
- `POST /api/coaching/message` - Send coaching message to AI
  ```json
  {
    "message": "I'm struggling with motivation",
    "context": {
      "urgencyLevel": "medium",
      "sessionType": "diagnostic"
    }
  }
  ```
- `GET /api/coaching/history` - Get coaching conversation history

#### User Management (JWT Required)
- `GET /api/users/profile` - Get current user profile
- `PUT /api/users/profile` - Update user profile
  ```json
  {
    "preferences": {
      "theme": "calm",
      "notifications": true
    },
    "psychologicalProfile": {
      "mindset": "growth",
      "locus": "internal"
    }
  }
  ```

#### Session Management (JWT + Subscription Required)
- `POST /api/sessions` - Start new coaching session
- `GET /api/sessions/:sessionId` - Get session details
- `PUT /api/sessions/:sessionId/end` - End coaching session

#### Admin (API Key Required)
- `GET /api/admin/stats` - System statistics and health

## Rate Limits

| Endpoint Type | Limit | Window |
|---------------|-------|---------|
| Coaching Messages | 10 requests | 1 minute |
| General API | 500 requests | 15 minutes |
| Admin Endpoints | 100 requests | 15 minutes |
| Documentation | 1000 requests | 15 minutes |

## AI Coaching Chains

The API implements three specialized AI chains using Google Gemini:

### 1. Guardrail Chain
- **Purpose**: Crisis detection and safety assessment
- **Triggers**: Automatic safety screening of all messages
- **Response**: Crisis intervention resources if needed

### 2. Diagnostic Chain  
- **Purpose**: Psychological assessment using Self-Determination Theory
- **Focus**: Autonomy, Competence, Relatedness evaluation
- **Output**: Strategic questions and user insights

### 3. Interventions Chain
- **Purpose**: Personalized coaching strategies using Goal Setting Theory
- **Input**: User profile + diagnostic assessment
- **Output**: Evidence-based interventions and action steps

## Request/Response Format

### Standard Success Response
```json
{
  "success": true,
  "data": { ... },
  "metadata": {
    "requestId": "uuid",
    "timestamp": "2025-01-27T...",
    "processingTime": 150
  }
}
```

### Error Response
```json
{
  "success": false,
  "error": {
    "message": "Error description",
    "code": "ERROR_CODE",
    "details": { ... }
  },
  "metadata": {
    "requestId": "uuid",
    "timestamp": "2025-01-27T..."
  }
}
```

## Security Features

### Headers Applied
- Content Security Policy (CSP)
- X-Frame-Options: DENY
- X-Content-Type-Options: nosniff
- X-XSS-Protection: 1; mode=block
- Referrer-Policy: strict-origin-when-cross-origin

### Input Protection
- Request size limits (2MB default)
- Input sanitization for XSS prevention
- Zod schema validation
- SQL injection prevention

### Authentication & Authorization
- JWT tokens with expiration validation
- Role-based access control (user/coach/admin)
- Subscription requirement enforcement
- API key authentication for admin functions

## Development

### Local Testing

```bash
# Type checking
npm run type-check

# Linting
npm run lint

# Testing
npm run test

# Format code
npm run format
```

### JWT Testing

The API includes JWT testing utilities:

```typescript
import { createJWT, validateJWT } from './middleware/auth';

// Create token
const token = await createJWT({
  sub: 'user-123',
  email: 'user@example.com',
  role: 'user'
}, 'your-secret', 3600);

// Validate token
const payload = await validateJWT(token, 'your-secret');
```

### Environment Variables

Required in `wrangler.toml` or Cloudflare Dashboard:

```toml
[vars]
GOOGLE_API_KEY = "your-google-gemini-api-key"
API_KEY = "your-admin-api-key"  
JWT_SECRET = "your-jwt-secret-minimum-32-characters"
ENVIRONMENT = "production"
```

## Error Codes

| Code | Status | Description |
|------|--------|-------------|
| VALIDATION_ERROR | 400 | Request validation failed |
| UNAUTHORIZED | 401 | Authentication required |
| SUBSCRIPTION_REQUIRED | 402 | Active subscription needed |
| FORBIDDEN | 403 | Insufficient permissions |
| NOT_FOUND | 404 | Resource not found |
| REQUEST_TOO_LARGE | 413 | Request size exceeded |
| RATE_LIMIT_EXCEEDED | 429 | Too many requests |
| INTERNAL_ERROR | 500 | Server error |

## Monitoring & Observability

### Health Monitoring
- Service availability checks
- KV store connectivity validation
- Environment configuration verification

### Request Tracing
- Unique request IDs for debugging
- Processing time measurement  
- Error context preservation
- Rate limit status headers

### Performance Metrics
- Response time tracking
- Error rate monitoring
- User activity patterns
- AI chain performance

## Deployment Environments

### Development
- Relaxed rate limits
- Verbose error messages
- Debug logging enabled
- Subscription checks bypassed

### Production  
- Strict rate limits
- Sanitized error responses
- Performance optimized
- Full security enforcement

## Support

### Troubleshooting
1. Check `/health` endpoint for service status
2. Verify environment variables are set
3. Review rate limit headers (`X-RateLimit-*`)
4. Check authentication token validity

### Documentation
- Live API docs: `GET /api/docs`
- Error codes: See Error Codes section above
- Rate limits: Check response headers

### Best Practices
- Use JWT tokens for user requests
- Implement proper error handling in clients
- Respect rate limits and implement backoff
- Cache user profiles when possible
- Monitor response times and error rates

## License

MIT License - see LICENSE file for details.