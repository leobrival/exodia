'use client'

import { RealtimeChannel, RealtimeChannelSendResponse } from '@supabase/supabase-js'
import { createBrowserClient } from '@/lib/supabase'
import { 
  ConnectionState, 
  ConnectionStatus, 
  SubscriptionConfig, 
  SubscriptionMetadata, 
  EventHandlers,
  ReconnectionConfig,
  DEFAULT_RECONNECTION_CONFIG,
  RealtimeError 
} from '@/types/realtime'

export class RealtimeManager {
  private supabase = createBrowserClient()
  private channels = new Map<string, RealtimeChannel>()
  private subscriptions = new Map<string, SubscriptionMetadata>()
  private reconnectionConfig: ReconnectionConfig
  private eventListeners = new Map<string, Set<Function>>()

  constructor(config: Partial<ReconnectionConfig> = {}) {
    this.reconnectionConfig = { ...DEFAULT_RECONNECTION_CONFIG, ...config }
  }

  // Get connection status based on active channels
  public getConnectionStatus(): ConnectionStatus {
    const activeChannels = Array.from(this.subscriptions.values())
    const subscribedChannels = activeChannels.filter(sub => sub.status === 'subscribed')
    const errorChannels = activeChannels.filter(sub => sub.status === 'channel_error')
    
    let state: ConnectionState = 'disconnected'
    
    if (subscribedChannels.length > 0) {
      state = 'connected'
    } else if (errorChannels.length > 0) {
      state = 'error'
    } else if (activeChannels.length > 0) {
      state = 'connecting'
    }

    return {
      state,
      lastConnected: subscribedChannels.length > 0 ? new Date() : undefined,
      reconnectAttempt: 0,
      isReconnecting: false,
    }
  }

  private updateConnectionState() {
    const status = this.getConnectionStatus()
    this.emit('connectionStateChange', status)
  }

  private async retrySubscription(subscriptionId: string, config: SubscriptionConfig, handlers: EventHandlers) {
    const subscription = this.subscriptions.get(subscriptionId)
    if (!subscription) return

    console.log(`[Realtime] Retrying subscription ${subscriptionId}`)
    
    // Remove failed subscription
    const channel = this.channels.get(subscriptionId)
    if (channel) {
      await this.supabase.removeChannel(channel)
    }
    this.channels.delete(subscriptionId)
    this.subscriptions.delete(subscriptionId)

    // Wait before retry
    await new Promise(resolve => setTimeout(resolve, 1000))

    // Create new subscription
    try {
      await this.subscribe(config, handlers)
    } catch (error) {
      console.error(`[Realtime] Failed to retry subscription:`, error)
    }
  }

  public async subscribe(
    config: SubscriptionConfig,
    handlers: EventHandlers = {}
  ): Promise<string> {
    const subscriptionId = this.generateSubscriptionId(config)
    
    try {
      // Create channel with unique name
      const channelName = `${config.table}_${subscriptionId}`
      const channel = this.supabase.channel(channelName)

      // Configure postgres changes listener
      const postgresConfig: any = {
        event: config.event || '*',
        schema: config.schema || 'public',
        table: config.table,
      }

      if (config.filter) {
        postgresConfig.filter = config.filter
      }

      // Set up postgres changes listener
      channel.on('postgres_changes', postgresConfig, (payload) => {
        this.handleDatabaseEvent(subscriptionId, payload, handlers)
      })

      // Store channel and initial subscription metadata
      this.channels.set(subscriptionId, channel)
      this.subscriptions.set(subscriptionId, {
        id: subscriptionId,
        table: config.table,
        status: 'subscribed', // Will be updated by subscription callback
        channel,
        config,
        createdAt: new Date(),
      })

      // Subscribe to channel with status callback
      channel.subscribe((status) => {
        console.log(`[Realtime] Subscription ${subscriptionId} status:`, status)
        
        switch (status) {
          case 'SUBSCRIBED':
            this.updateSubscriptionStatus(subscriptionId, 'subscribed')
            this.updateConnectionState()
            handlers.onSubscribe?.({
              id: subscriptionId,
              table: config.table,
              status: 'subscribed',
              channel,
              config,
              createdAt: new Date(),
            })
            break

          case 'CHANNEL_ERROR':
            this.updateSubscriptionStatus(subscriptionId, 'channel_error')
            this.updateConnectionState()
            handlers.onError?.({
              name: 'ChannelError',
              message: `Channel subscription failed for ${config.table}`,
            } as RealtimeError)
            // Retry subscription after a delay
            setTimeout(() => {
              this.retrySubscription(subscriptionId, config, handlers)
            }, 2000)
            break

          case 'TIMED_OUT':
            this.updateSubscriptionStatus(subscriptionId, 'timed_out')
            this.updateConnectionState()
            handlers.onError?.({
              name: 'TimeoutError',
              message: `Channel subscription timed out for ${config.table}`,
            } as RealtimeError)
            // Retry subscription after a delay
            setTimeout(() => {
              this.retrySubscription(subscriptionId, config, handlers)
            }, 3000)
            break

          case 'CLOSED':
            this.updateSubscriptionStatus(subscriptionId, 'closed')
            this.updateConnectionState()
            handlers.onUnsubscribe?.(subscriptionId)
            break
        }
      })

      console.log(`[Realtime] Successfully initiated subscription to ${config.table} with ID: ${subscriptionId}`)
      return subscriptionId

    } catch (error) {
      console.error(`[Realtime] Failed to subscribe to ${config.table}:`, error)
      throw error
    }
  }

  private handleDatabaseEvent(
    subscriptionId: string,
    payload: any,
    handlers: EventHandlers
  ) {
    console.log(`[Realtime] Event received for ${subscriptionId}:`, payload.eventType, payload.new || payload.old)

    // Update subscription last event time
    const subscription = this.subscriptions.get(subscriptionId)
    if (subscription) {
      subscription.lastEvent = new Date()
    }

    // Call appropriate handler
    try {
      switch (payload.eventType) {
        case 'INSERT':
          handlers.onInsert?.(payload)
          this.emit(`${subscriptionId}:insert`, payload)
          break
        case 'UPDATE':
          handlers.onUpdate?.(payload)
          this.emit(`${subscriptionId}:update`, payload)
          break
        case 'DELETE':
          handlers.onDelete?.(payload)
          this.emit(`${subscriptionId}:delete`, payload)
          break
      }
    } catch (error) {
      console.error(`[Realtime] Error handling event:`, error)
      handlers.onError?.(error as RealtimeError)
    }
  }

  private updateSubscriptionStatus(subscriptionId: string, status: any) {
    const subscription = this.subscriptions.get(subscriptionId)
    if (subscription) {
      subscription.status = status
    }
  }

  public async unsubscribe(subscriptionId: string): Promise<void> {
    const channel = this.channels.get(subscriptionId)
    if (!channel) {
      console.warn(`[Realtime] Channel ${subscriptionId} not found`)
      return
    }

    try {
      await this.supabase.removeChannel(channel)
      this.channels.delete(subscriptionId)
      this.subscriptions.delete(subscriptionId)
      this.updateConnectionState()
      
      console.log(`[Realtime] Successfully unsubscribed from ${subscriptionId}`)
    } catch (error) {
      console.error(`[Realtime] Failed to unsubscribe from ${subscriptionId}:`, error)
      throw error
    }
  }

  public async unsubscribeAll(): Promise<void> {
    const subscriptionIds = Array.from(this.channels.keys())
    
    await Promise.all(
      subscriptionIds.map(id => this.unsubscribe(id).catch(console.error))
    )
  }

  private generateSubscriptionId(config: SubscriptionConfig): string {
    const timestamp = Date.now()
    const random = Math.random().toString(36).substring(2, 8)
    return `${config.table}_${config.event || 'all'}_${timestamp}_${random}`
  }

  // Event emitter methods
  public on(event: string, listener: Function) {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, new Set())
    }
    this.eventListeners.get(event)!.add(listener)
  }

  public off(event: string, listener: Function) {
    const listeners = this.eventListeners.get(event)
    if (listeners) {
      listeners.delete(listener)
      if (listeners.size === 0) {
        this.eventListeners.delete(event)
      }
    }
  }

  public removeAllListeners(event: string) {
    this.eventListeners.delete(event)
  }

  private emit(event: string, data?: any) {
    const listeners = this.eventListeners.get(event)
    if (listeners) {
      listeners.forEach(listener => {
        try {
          listener(data)
        } catch (error) {
          console.error(`[Realtime] Event listener error for ${event}:`, error)
        }
      })
    }
  }

  public getSubscriptions(): SubscriptionMetadata[] {
    return Array.from(this.subscriptions.values())
  }

  public destroy(): void {
    this.unsubscribeAll()
    this.eventListeners.clear()
    
    console.log('[Realtime] RealtimeManager destroyed')
  }
}

// Singleton instance
let realtimeManagerInstance: RealtimeManager | null = null

export const getRealtimeManager = (): RealtimeManager => {
  if (!realtimeManagerInstance) {
    realtimeManagerInstance = new RealtimeManager()
  }
  return realtimeManagerInstance
}

export const destroyRealtimeManager = (): void => {
  if (realtimeManagerInstance) {
    realtimeManagerInstance.destroy()
    realtimeManagerInstance = null
  }
}