# Coaching API Worker

AI Coaching API with LangChain integration for Cloudflare Workers.

## Development

⚠️ **Important**: This Cloudflare Worker cannot be run locally in the StackBlitz WebContainer environment due to platform limitations.

### Local Development

To develop this worker locally on your machine:

1. Clone this project to your local environment
2. Navigate to the worker directory: `cd worker`
3. Install dependencies: `npm install`
4. Run the development server: `npm run dev:local`

### Available Scripts

- `npm run build` - Type check the TypeScript code
- `npm run dev:local` - Start local development server (only works in local environment)
- `npm run deploy` - Deploy to Cloudflare Workers
- `npm run deploy:staging` - Deploy to staging environment
- `npm run deploy:production` - Deploy to production environment
- `npm run type-check` - Run TypeScript type checking
- `npm run lint` - Run ESLint
- `npm run format` - Format code with Prettier

### Deployment

You can deploy directly from this environment:

```bash
npm run deploy
```

Make sure you have your Cloudflare API credentials configured in your environment.

## Environment Variables

The worker expects the following environment variables to be configured in your Cloudflare Workers dashboard:

- `OPENAI_API_KEY` - Your OpenAI API key
- `ANTHROPIC_API_KEY` - Your Anthropic API key (if using Claude)

## API Endpoints

The worker provides the following endpoints:

- `POST /api/coaching` - Main coaching endpoint
- `GET /api/health` - Health check endpoint

## Testing

To test the deployed worker, you can use tools like curl or Postman to make requests to your deployed worker URL.