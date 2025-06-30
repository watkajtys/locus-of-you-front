# Coaching API - Cloudflare Worker

A production-ready Cloudflare Worker that serves as an API backend for the coaching application.

## Features

- ✅ Modern ES6+ JavaScript with full Cloudflare Workers compatibility
- ✅ Comprehensive error handling with proper HTTP status codes
- ✅ CORS support for cross-origin requests
- ✅ Request validation and input sanitization
- ✅ Rate limiting using Cloudflare KV storage
- ✅ Authentication middleware (API key & Bearer token)
- ✅ Security headers and best practices
- ✅ Performance optimizations for edge deployment
- ✅ JSON responses with proper Content-Type headers
- ✅ Environment variable configuration
- ✅ Structured logging and monitoring

## API Endpoints

### Health & Info
- `GET /health` - Health check endpoint
- `GET /api/info` - API information and available endpoints

### Coaching
- `POST /api/coaching/message` - Send a message to the AI coach

### User Management
- `GET /api/user/profile/:userId` - Get user profile
- `POST /api/user/profile/:userId` - Update user profile

## Setup

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Configure Environment Variables**
   Set these secrets using Wrangler:
   ```bash
   wrangler secret put API_KEY
   wrangler secret put JWT_SECRET
   ```

3. **Configure KV Namespace** (Optional - for rate limiting)
   ```bash
   wrangler kv:namespace create "RATE_LIMIT_KV"
   ```
   Update the namespace ID in `wrangler.toml`

4. **Development**
   ```bash
   npm run dev
   ```

5. **Deployment**
   ```bash
   # Staging
   npm run deploy:staging
   
   # Production
   npm run deploy:production
   ```

## Configuration

### Environment Variables

**Required Secrets:**
- `API_KEY` - API key for service-to-service authentication
- `JWT_SECRET` - Secret for JWT token validation (if using JWT auth)

**Optional Variables:**
- `ENVIRONMENT` - Deployment environment (production/staging/development)
- `API_VERSION` - API version string

### wrangler.toml

Update the following in `wrangler.toml`:
- `name` - Your worker name
- `route` - Custom domain route (for production)
- KV namespace IDs
- Cron triggers (if needed)

## Authentication

The API supports two authentication methods:

1. **API Key Authentication**
   ```bash
   curl -H "X-API-Key: your-api-key" https://your-worker.your-subdomain.workers.dev/api/user/profile/123
   ```

2. **Bearer Token Authentication**
   ```bash
   curl -H "Authorization: Bearer your-jwt-token" https://your-worker.your-subdomain.workers.dev/api/user/profile/123
   ```

## Rate Limiting

Rate limiting is implemented using Cloudflare KV storage:
- **Window**: 1 minute
- **Limit**: 100 requests per IP per minute
- **Storage**: Automatic cleanup of expired entries

## Error Handling

All errors return a consistent JSON format:

```json
{
  "error": true,
  "message": "Error description",
  "code": "ERROR_CODE",
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

## Security Features

- **CORS Headers**: Configurable cross-origin resource sharing
- **Security Headers**: X-Content-Type-Options, X-Frame-Options, etc.
- **Input Validation**: Sanitization of all user inputs
- **Rate Limiting**: Protection against abuse
- **Authentication**: Multiple auth methods supported

## Performance Optimizations

- **Edge Deployment**: Runs on Cloudflare's global edge network
- **Minimal Cold Starts**: Optimized for fast startup
- **Efficient Routing**: Uses itty-router for lightweight routing
- **Streaming**: Supports streaming responses for large data
- **Caching**: Leverages Cloudflare's caching infrastructure

## Monitoring

The worker includes built-in monitoring features:
- Response time headers (`X-Response-Time`)
- Structured logging for debugging
- Error tracking with context
- Performance metrics

## Integration with React App

To integrate with your React application:

1. **Update API Base URL**
   ```javascript
   // In your React app
   const API_BASE_URL = 'https://your-worker.your-subdomain.workers.dev';
   ```

2. **Add Authentication Headers**
   ```javascript
   const response = await fetch(`${API_BASE_URL}/api/coaching/message`, {
     method: 'POST',
     headers: {
       'Content-Type': 'application/json',
       'Authorization': `Bearer ${userToken}`,
     },
     body: JSON.stringify({ message, userId }),
   });
   ```

## Development Tips

- Use `wrangler dev` for local development with hot reload
- Check logs with `wrangler tail` for debugging
- Test different environments using `--env` flag
- Use Cloudflare Analytics to monitor production usage

## Deployment

The worker supports multiple deployment environments:

- **Development**: Local testing with `wrangler dev`
- **Staging**: Preview deployment for testing
- **Production**: Live deployment with custom domain

Each environment can have different configuration values and secrets.