# Technical Architecture

## Overview

Exodia uses a modern, scalable architecture based on a "Ship Fast, Solidify Later" approach with MVP (Supabase Only) optimized for time-to-market.

## Frontend Architecture (Next.js 15)

```bash
/src
├── app/ (App Router)
│   ├── layout.tsx                    # Root layout + navigation
│   ├── page.tsx                      # Landing page
│   ├── auth/                         # Authentication
│   ├── organizations/[slug]/         # Organization management
│   └── projects/[slug]/              # Project workspace + RAG
├── components/
│   ├── ui/                           # shadcn/ui components
│   ├── auth/, organization/, project/, chat/
├── lib/
│   ├── supabase.ts                   # Client Supabase
│   ├── auth.ts, database.ts, rag.ts  # Helpers métier
└── styles/globals.css                # Tailwind CSS
```

## Backend Architecture (Supabase)

```bash
Supabase Stack
├── Authentication                    # Magic Link + JWT
├── Database                          # PostgreSQL + pgvector
│   ├── RLS Policies                  # Sécurité granulaire
│   └── Vector Search                 # Recherche sémantique
├── Storage                           # Upload documents sécurisé
└── Edge Functions                    # Processing pipeline (Deno)
```

## Technology Stack

- **Frontend**: Next.js 15+ (App Router), TypeScript
- **UI**: shadcn/ui, Tailwind CSS, Radix UI
- **Backend**: Supabase (Auth, Database, Storage, Edge Functions)
- **Database**: PostgreSQL + pgvector extension
- **Authentication**: Supabase Auth (Magic Link only)
- **State Management**: Zustand, nuqs, React Hooks, Supabase Realtime
- **Auth State** : Supabase Auth Context + auto-refresh
- **AI/ML**: OpenAI, Mistral AI, Google Vertex AI, Claude
- **Email**: Resend for transactional emails
- **Deployment**: Vercel (CLI)
- **Monitoring**: Sentry, Vercel Analytics, Posthog

## Security Architecture

### Authentication & Authorization

- **Auth**: Supabase Auth (JWT + Magic Link)
- **RBAC**: Role-Based Access Control
- **RLS**: Row Level Security policies
- **Rate Limiting**: API protection

### Data Protection

- **Encryption**: At rest + in transit
- **PII**: Anonymization + GDPR compliance
- **Access Control**: Resource-based permissions
- **Audit**: Complete action traceability

## Performance Optimization

- **Frontend** : Code splitting, lazy loading, image optimization, client-side caching with React Query, Zustand for global state management, nuqs for URL
- **Backend** : Connection pooling, query optimization, caching, vector search optimization (ivfflat), edge functions for processing pipeline
- **Database** : Proper indexing, query planning, read replicas, vector index optimization for semantic search

## Related Documentation

- See [auth.md](./auth.md) for authentication flows
- See [database.md](./database.md) for schema details
- See [document-processing.md](./document-processing.md) for AI pipeline
- See [user-management.md](./user-management.md) for roles & permissions

This architecture enables progressive evolution from simple MVP to enterprise-grade solution based on growth requirements.
