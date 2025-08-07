'use client'

import { RealtimeChannel, RealtimePostgresChangesPayload } from '@supabase/supabase-js'
import { Database } from './database'

// Database table types
export type Tables = Database['public']['Tables']
export type ProjectRow = Tables['projects']['Row']
export type OrganizationRow = Tables['organizations']['Row']
export type OrganizationMemberRow = Tables['organization_members']['Row']

// Real-time connection states
export type ConnectionState = 'disconnected' | 'connecting' | 'connected' | 'error'

// Real-time subscription status
export type SubscriptionState = 'subscribed' | 'timed_out' | 'closed' | 'channel_error'

// Real-time event types
export type DatabaseEvent = 'INSERT' | 'UPDATE' | 'DELETE'

// Payload types for different tables
export type ProjectChanges = RealtimePostgresChangesPayload<{
  [key: string]: any
}>

export type OrganizationChanges = RealtimePostgresChangesPayload<{
  [key: string]: any
}>

export type OrganizationMemberChanges = RealtimePostgresChangesPayload<{
  [key: string]: any
}>

// Subscription configuration
export interface SubscriptionConfig {
  table: keyof Tables
  event?: DatabaseEvent | '*'
  schema?: string
  filter?: string
}

// Connection status with metadata
export interface ConnectionStatus {
  state: ConnectionState
  lastConnected?: Date
  lastError?: Error
  reconnectAttempt: number
  isReconnecting: boolean
}

// Subscription metadata
export interface SubscriptionMetadata {
  id: string
  table: string
  status: SubscriptionState
  channel?: RealtimeChannel
  config: SubscriptionConfig
  createdAt: Date
  lastEvent?: Date
}

// Error types for real-time connections
export interface RealtimeError extends Error {
  code?: string
  details?: string
  hint?: string
}

// Optimistic update types
export interface OptimisticUpdate<T = any> {
  id: string
  type: 'create' | 'update' | 'delete'
  data: T
  timestamp: Date
  confirmed: boolean
}

// Real-time store state interface
export interface RealtimeState {
  connection: ConnectionStatus
  subscriptions: Map<string, SubscriptionMetadata>
  pendingUpdates: Map<string, OptimisticUpdate>
}

// Event handler types
export type EventHandler<T = any> = (payload: T) => void | Promise<void>

export interface EventHandlers {
  onInsert?: EventHandler<ProjectChanges>
  onUpdate?: EventHandler<ProjectChanges>
  onDelete?: EventHandler<ProjectChanges>
  onError?: EventHandler<RealtimeError>
  onSubscribe?: EventHandler<SubscriptionMetadata>
  onUnsubscribe?: EventHandler<string>
}

// Configuration for reconnection strategy
export interface ReconnectionConfig {
  maxAttempts: number
  initialDelay: number
  maxDelay: number
  backoffMultiplier: number
  jitterMaxMs: number
}

// Default configurations
export const DEFAULT_RECONNECTION_CONFIG: ReconnectionConfig = {
  maxAttempts: 5,
  initialDelay: 1000,
  maxDelay: 30000,
  backoffMultiplier: 2,
  jitterMaxMs: 1000,
}

// Channel topic generators
export const CHANNEL_TOPICS = {
  projects: (organizationId?: string) => 
    organizationId ? `projects:organization_id=eq.${organizationId}` : 'projects',
  organizations: (userId?: string) => 
    userId ? `organizations:created_by=eq.${userId}` : 'organizations',
  organizationMembers: (userId?: string) => 
    userId ? `organization_members:user_id=eq.${userId}` : 'organization_members',
} as const