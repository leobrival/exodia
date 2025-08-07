# Environment Variables Management with t3-env

## Overview

The Exodia project uses [`@t3-oss/env-nextjs`](https://env.t3.gg/docs/nextjs) for type-safe environment variable management. This solution provides strict build-time validation and clear separation between client and server variables.

## Environment Variables

### Server variables (sensitive)

These variables are only accessible server-side and never exposed to the client:

- **`RESEND_API_KEY`**: API key for Resend email service
- **`OPENAI_API_KEY`**: API key for OpenAI/AI services
- **`UPSTASH_REDIS_REST_URL`** _(optional)_: REST URL for Upstash Redis
- **`UPSTASH_REDIS_REST_TOKEN`** _(optional)_: Authentication token for Upstash Redis

### Client variables (public)

These variables are prefixed with `NEXT_PUBLIC_` and accessible client-side:

- **`NEXT_PUBLIC_SUPABASE_URL`**: Supabase project URL
- **`NEXT_PUBLIC_SUPABASE_ANON_KEY`**: Supabase anonymous key
- **`NEXT_PUBLIC_BASE_URL`**: Application base URL
- **`NEXT_PUBLIC_APP_NAME`**: Application name
- **`NEXT_PUBLIC_APP_DESCRIPTION`**: Application description

### Zod schemas used

```typescript
// URLs with format validation
NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
NEXT_PUBLIC_BASE_URL: z.string().url(),

// Required non-empty strings
RESEND_API_KEY: z.string().min(1),
OPENAI_API_KEY: z.string().min(1),

// Optional variables
UPSTASH_REDIS_REST_URL: z.string().url().optional(),
UPSTASH_REDIS_REST_TOKEN: z.string().optional(),
```

### Automatic validation

- **Build-time**: Variables validated during Next.js build
- **Runtime**: Validation when importing the `env` module
- **TypeScript**: Auto-completion and type checking

## Local Setup

### `.env.local` (development)

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key

# Application Configuration
NEXT_PUBLIC_BASE_URL=http://localhost:3000
NEXT_PUBLIC_APP_NAME=Exodia
NEXT_PUBLIC_APP_DESCRIPTION=Modern tool for project calls

# Email Service
RESEND_API_KEY=your_resend_api_key

# AI Service
OPENAI_API_KEY=your_openai_api_key

# Optional: Redis/Upstash
UPSTASH_REDIS_REST_URL=https://your-redis.upstash.io
UPSTASH_REDIS_REST_TOKEN=your_redis_token
```

### Production variables (Vercel)

Configure the same variables in the Vercel interface or via CLI:

```bash
vercel env add RESEND_API_KEY
vercel env add OPENAI_API_KEY
```
