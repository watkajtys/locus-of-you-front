# AI Coaching API - Cloudflare Worker

A secure, scalable API for AI-powered coaching built on Cloudflare Workers with comprehensive authentication, rate limiting, and monitoring.

## Features

- **🔐 Multi-layer Authentication**: JWT tokens and API keys
- **⚡ Rate Limiting**: Configurable limits per endpoint
- **🛡️ Security Headers**: CORS, CSP, and security middleware
- **📊 Request Validation**: Zod schema validation
- **🔍 Monitoring**: Request logging and performance tracking
- **📚 Auto Documentation**: Built-in API documentation
- **🏥 Health Checks**: Service health monitoring

## Architecture

```
Frontend (React) → Cloudflare Workers → AI Chains → KV Storage
                                   ↓
                              Rate Limiting
                              Authentication
                              Validation
                              Security Headers
```

## API Endpoints

### Authentication
All endpoints except `/health` and `/api/docs` require authentication.

**JWT Authentication:**
```
Authorization: Bearer <jwt_token>
```

**API Key Authentication:**
```
X-API-Key: <api_key>
```

### Endpoints

#### Health & Documentation
- `GET /health` - Health check (no auth)
- `GET /api/docs` - API documentation

#### Coaching
- `POST /api/coaching/message` - Send coaching message (JWT + Subscription)
- `GET /api/coaching/history` - Get coaching history (JWT)

#### Users
- `GET /api/users/profile` - Get current user profile (JWT)
- `PUT /api/users/profile` - Update profile (JWT)
- `GET /api/users/:userId/profile` - Get user profile (Admin only)

#### Sessions
- `POST /api/sessions` - Start coaching session (JWT + Subscription)
- `GET /api/sessions/:sessionId` - Get session details (JWT)
- `PUT /api/sessions/:sessionId/end` - End session (JWT)

#### Admin
- `GET /api/admin/stats` - System statistics (API Key)

## Rate Limits

- **Coaching Messages**: 10 requests/minute
- **General API**: 500 requests/15 minutes
- **Admin Endpoints**: 100 requests/15 minutes

## Request/Response Format

### Standard Response Format
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

### Error Response Format
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

## Environment Variables

Required environment variables in `wrangler.toml`:

```toml
[vars]
GOOGLE_API_KEY = "your-google-api-key"
API_KEY = "your-api-key"
JWT_SECRET = "your-jwt-secret"
ENVIRONMENT = "production"

[[kv_namespaces]]
binding = "RATE_LIMIT_KV"
id = "your-kv-id"

[[kv_namespaces]]
binding = "USER_SESSIONS_KV"
id = "your-kv-id"

[[kv_namespaces]]
binding = "COACHING_HISTORY_KV"
id = "your-kv-id"
```

## Security Features

### Headers
- Content Security Policy (CSP)
- X-Frame-Options: DENY
- X-Content-Type-Options: nosniff
- X-XSS-Protection: 1; mode=block

### Input Validation
- Zod schema validation for all inputs
- Request size limits (2MB)
- Input sanitization

### Rate Limiting
- Per-IP rate limiting using KV storage
- Different limits per endpoint type
- Configurable windows and limits

### CORS Configuration
```javascript
{
  origin: ['localhost:5173', 'your-domain.com'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  credentials: true
}
```

## Development

### Local Development
```bash
npm install
npm run dev:local
```

### Testing
```bash
npm test
```

### Deployment
```bash
# Staging
npm run deploy:staging

# Production
npm run deploy:production
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

## Monitoring

### Health Monitoring
The API includes comprehensive health checks:
- Service availability
- KV store connectivity
- Environment validation

### Request Logging
All requests are logged with:
- Request ID for tracing
- Processing time
- User context
- Error details

### Performance Metrics
- Response times
- Error rates
- Rate limit statistics
- User activity patterns

## AI Chain Integration

The API integrates with three AI chains:

1. **Guardrail Chain**: Crisis detection and safety
2. **Diagnostic Chain**: User assessment and profiling
3. **Interventions Chain**: Personalized coaching strategies

Each chain implements evidence-based therapeutic approaches (ET, SDT, GST).

## Data Flow

1. **Authentication**: Verify JWT/API key
2. **Rate Limiting**: Check request quotas
3. **Validation**: Validate request format
4. **Processing**: Execute AI chains
5. **Storage**: Save results to KV
6. **Response**: Return formatted response

## Best Practices

### Security
- Always validate inputs
- Use least privilege access
- Log security events
- Implement defense in depth

### Performance
- Use KV storage efficiently
- Implement request deduplication
- Cache frequently accessed data
- Monitor response times

### Reliability
- Implement retry logic
- Use circuit breakers
- Monitor error rates
- Plan for graceful degradation

## Support

For API support or questions:
1. Check the `/api/docs` endpoint for current documentation
2. Review error codes and messages
3. Check rate limit headers
4. Verify authentication tokens

## License

MIT License - see LICENSE file for details.