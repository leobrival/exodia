# API Reference

## Overview

Exodia's API consists of Next.js Route Handlers for frontend operations and Supabase Edge Functions for heavy processing tasks. All endpoints follow RESTful conventions with JWT authentication.

## Authentication

All API endpoints require authentication via Supabase JWT tokens:

```typescript
// Request headers
{
  "Authorization": "Bearer <supabase_jwt_token>",
  "Content-Type": "application/json"
}
```

## Core API Routes

### Organizations

#### Create Organization
```http
POST /api/organizations
```

```typescript
// Request body
{
  "name": string,
  "slug": string,
  "description"?: string
}

// Response
{
  "id": string,
  "name": string,
  "slug": string,
  "subscription_status": "free",
  "created_at": string
}
```

#### Get User Organizations
```http
GET /api/organizations
```

#### Update Organization
```http
PATCH /api/organizations/[id]
```

### Projects

#### Create Project
```http
POST /api/organizations/[orgId]/projects
```

```typescript
// Request body
{
  "name": string,
  "description"?: string,
  "is_private": boolean
}
```

#### Get Project Details
```http
GET /api/projects/[projectId]
```

#### Get Project Documents
```http
GET /api/projects/[projectId]/documents
```

### Document Management

#### Upload Document
```http
POST /api/projects/[projectId]/documents
Content-Type: multipart/form-data
```

```typescript
// Form data
{
  "file": File, // PDF, DOCX, TXT
  "description"?: string
}

// Response
{
  "id": string,
  "filename": string,
  "file_size": number,
  "status": "processing"
}
```

#### Get Document Status
```http
GET /api/documents/[documentId]/status
```

#### Delete Document
```http
DELETE /api/documents/[documentId]
```

### Project Notes

#### Get Project Notes
```http
GET /api/projects/[projectId]/notes
```

```typescript
// Response
{
  "notes": ProjectNote[],
  "total_count": number,
  "active_count": number
}

interface ProjectNote {
  id: string;
  project_id: string;
  title: string;
  content: string;
  tags?: string[];
  is_active: boolean;
  created_by: string;
  created_at: string;
  updated_at: string;
}
```

#### Create Project Note
```http
POST /api/projects/[projectId]/notes
```

```typescript
// Request body
{
  "title": string,
  "content": string,
  "tags"?: string[],
  "is_active"?: boolean // defaults to true
}

// Response
{
  "note": ProjectNote,
  "embedding_generated": boolean
}
```

#### Update Project Note
```http
PATCH /api/projects/[projectId]/notes/[noteId]
```

```typescript
// Request body
{
  "title"?: string,
  "content"?: string,
  "tags"?: string[],
  "is_active"?: boolean
}
```

#### Delete Project Note
```http
DELETE /api/projects/[projectId]/notes/[noteId]
```

#### Toggle Note Active Status
```http
PATCH /api/projects/[projectId]/notes/[noteId]/toggle
```

```typescript
// Request body
{
  "is_active": boolean
}

// Response
{
  "note": ProjectNote,
  "rag_status": "included" | "excluded"
}
```

#### Search Project Notes
```http
POST /api/projects/[projectId]/notes/search
```

```typescript
// Request body
{
  "query": string,
  "similarity_threshold"?: number,
  "max_results"?: number,
  "active_only"?: boolean // defaults to true
}

// Response
{
  "results": NoteSearchResult[],
  "total_count": number
}

interface NoteSearchResult {
  id: string;
  title: string;
  content: string;
  tags: string[];
  similarity: number;
  source_type: "note";
  metadata: {
    created_at: string;
    created_by: string;
  };
}
```

### RAG System

#### Chat with Project Content (Documents + Notes)
```http
POST /api/projects/[projectId]/chat
```

```typescript
// Request body
{
  "message": string,
  "conversation_history"?: ChatMessage[],
  "model"?: "gpt-4o-mini" | "claude-3-5-sonnet",
  "temperature"?: number,
  "include_documents"?: boolean, // defaults to true
  "include_notes"?: boolean, // defaults to true
  "similarity_threshold"?: number // defaults to 0.8
}

// Response (streaming)
{
  "content": string,
  "sources": ContentSource[],
  "token_count": number,
  "source_breakdown": {
    "documents": number,
    "notes": number
  }
}

interface ContentSource {
  id: string;
  title: string;
  content: string;
  similarity: number;
  source_type: "document" | "note";
  metadata: {
    // For documents
    document_id?: string;
    filename?: string;
    chunk_index?: number;
    mime_type?: string;
    // For notes
    tags?: string[];
    created_at?: string;
    created_by?: string;
  };
}
```

#### Search Project Content (Unified)
```http
POST /api/projects/[projectId]/search
```

```typescript
// Request body
{
  "query": string,
  "similarity_threshold"?: number, // defaults to 0.8
  "max_results"?: number, // defaults to 20
  "include_documents"?: boolean, // defaults to true
  "include_notes"?: boolean, // defaults to true
  "active_notes_only"?: boolean // defaults to true
}

// Response
{
  "results": UnifiedSearchResult[],
  "total_count": number,
  "breakdown": {
    "documents": number,
    "notes": number
  }
}

interface UnifiedSearchResult {
  id: string;
  title: string;
  content: string;
  similarity: number;
  source_type: "document" | "note";
  metadata: {
    // Document-specific
    document_id?: string;
    filename?: string;
    chunk_index?: number;
    mime_type?: string;
    // Note-specific
    tags?: string[];
    created_at?: string;
    created_by?: string;
  };
}
```

### Member Management

#### Invite Member
```http
POST /api/organizations/[orgId]/invitations
```

```typescript
// Request body
{
  "email": string,
  "role": "admin" | "member"
}
```

#### Accept Invitation
```http
POST /api/invitations/accept
```

```typescript
// Request body
{
  "token": string
}
```

#### Revoke Invitation
```http
DELETE /api/invitations/[invitationId]
```

## Supabase Edge Functions

### Document Processing
```http
POST https://<project-ref>.supabase.co/functions/v1/process-document
Authorization: Bearer <anon_key>
```

```typescript
// Request body
{
  "document_id": string,
  "processing_steps": ProcessingStep[]
}

// Processing steps available
interface ProcessingStep {
  task: "analysisDocument" 
      | "extractionData" 
      | "documentValidation" 
      | "documentSummarization" 
      | "documentVectorization";
  model?: string;
  priority?: number;
}
```

### Project Generation
```http
POST https://<project-ref>.supabase.co/functions/v1/generate-proposal
```

```typescript
// Request body
{
  "project_id": string,
  "user_input": string,
  "generation_options": {
    "include_inconsistency_check": boolean,
    "include_scoring": boolean,
    "model_preferences": ModelPreferences
  }
}
```

### Webhook Processing
```http
POST https://<project-ref>.supabase.co/functions/v1/webhooks
```

## Database Functions

### Vector Search Functions

#### search_project_content()
Unified search across documents and project notes with vector similarity.

```sql
SELECT * FROM search_project_content(
  query_embedding vector(1536),
  project_uuid UUID,
  match_threshold float DEFAULT 0.8,
  match_count int DEFAULT 20
);
```

**Returns:**
- `id`: Content ID (document chunk or note)
- `title`: Document filename or note title
- `content`: Content text
- `similarity`: Cosine similarity score (0-1)
- `source_type`: "document" or "note"
- `metadata`: JSON object with source-specific data

#### search_documents()
Search only document chunks with vector similarity.

```sql
SELECT * FROM search_documents(
  query_embedding vector(1536),
  project_uuid UUID,
  match_threshold float DEFAULT 0.8,
  match_count int DEFAULT 10
);
```

#### search_notes()
Search only project notes with vector similarity.

```sql
SELECT * FROM search_notes(
  query_embedding vector(1536),
  project_uuid UUID,
  match_threshold float DEFAULT 0.8,
  match_count int DEFAULT 10
);
```

### Embedding Support

All search functions work with OpenAI's `text-embedding-3-small` model (1536 dimensions).

```typescript
// Generate embeddings for search
const embedding = await openai.embeddings.create({
  model: "text-embedding-3-small",
  input: searchQuery,
});

const results = await supabase.rpc('search_project_content', {
  query_embedding: embedding.data[0].embedding,
  project_uuid: projectId,
  match_threshold: 0.8,
  match_count: 20
});
```

## WebSocket Connections

### Real-time Presence
```typescript
// Connect to project presence
const channel = supabase
  .channel(`project:${projectId}`)
  .on('presence', { event: 'sync' }, handlePresenceSync)
  .on('presence', { event: 'join' }, handleUserJoin)
  .on('presence', { event: 'leave' }, handleUserLeave)
  .subscribe();
```

### Live Activity Feed
```typescript
// Subscribe to project activities
const channel = supabase
  .channel(`activity:${projectId}`)
  .on('postgres_changes', {
    event: 'INSERT',
    schema: 'public',
    table: 'activity_logs',
    filter: `project_id=eq.${projectId}`
  }, handleNewActivity)
  .subscribe();
```

## Error Handling

### Standard Error Response
```typescript
interface ApiError {
  error: {
    code: string,
    message: string,
    details?: any
  },
  status: number
}
```

### Common Error Codes
- `AUTH_REQUIRED` (401): Missing or invalid authentication
- `FORBIDDEN` (403): Insufficient permissions
- `NOT_FOUND` (404): Resource not found
- `VALIDATION_ERROR` (422): Invalid request data
- `RATE_LIMITED` (429): Too many requests
- `PROCESSING_ERROR` (500): Document processing failed

## Rate Limits

### Free Tier Limits
- API requests: 100/hour per user
- Document uploads: 10/day per project
- RAG queries: 100/month per organization
- File size: 10MB maximum

### Premium Tier Limits
- API requests: 1000/hour per user
- Document uploads: Unlimited
- RAG queries: Unlimited
- File size: 100MB maximum

## SDK & Client Libraries

### TypeScript SDK
```typescript
import { ExodiaClient } from '@exodia/sdk';

const client = new ExodiaClient({
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
  supabaseKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
});

// Usage examples
const organizations = await client.organizations.list();
const project = await client.projects.create(orgId, projectData);
const response = await client.rag.chat(projectId, message);
```

### React Hooks
```typescript
import { 
  useProjects, 
  useDocuments, 
  useProjectNotes,
  useRAG,
  useUnifiedSearch
} from '@exodia/react';

// Custom hooks for data fetching
const { projects, loading } = useProjects(organizationId);
const { documents } = useDocuments(projectId);
const { 
  notes, 
  loading: notesLoading, 
  activeNotesCount, 
  totalNotesCount,
  refreshNotes 
} = useProjectNotes(projectId);
const { chat, sendMessage } = useRAG(projectId);
const { search, results, searching } = useUnifiedSearch(projectId);
```

## Webhooks

### Document Processing Complete
```http
POST <your-webhook-url>
```

```typescript
// Webhook payload
{
  "event": "document.processed",
  "data": {
    "document_id": string,
    "project_id": string,
    "status": "completed" | "failed",
    "processing_time": number,
    "chunk_count": number
  },
  "timestamp": string
}
```

### Project Generation Complete
```http
POST <your-webhook-url>
```

```typescript
// Webhook payload  
{
  "event": "proposal.generated",
  "data": {
    "project_id": string,
    "proposal_id": string,
    "status": "completed" | "failed",
    "word_count": number,
    "score": number
  },
  "timestamp": string
}
```

## Related Documentation

- See [auth.md](./auth.md) for authentication setup
- See [rag-system.md](./rag-system.md) for RAG API details
- See [document-processing.md](./document-processing.md) for processing pipeline
- See [collaboration.md](./collaboration.md) for real-time features

This API provides comprehensive programmatic access to all Exodia platform features with robust error handling and real-time capabilities.
