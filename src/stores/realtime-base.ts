'use client'

import { create } from 'zustand'
import { subscribeWithSelector } from 'zustand/middleware'
import { getRealtimeManager } from '@/lib/supabase/realtime'
import { 
  ConnectionStatus, 
  SubscriptionConfig, 
  SubscriptionMetadata, 
  OptimisticUpdate,
  RealtimeState 
} from '@/types/realtime'

// Base interface for stores that use real-time functionality
export interface RealtimeStoreBase {
  // Connection state
  connectionStatus: ConnectionStatus
  isConnected: boolean
  
  // Subscription management
  subscriptions: SubscriptionMetadata[]
  
  // Optimistic updates
  pendingUpdates: OptimisticUpdate[]
  
  // Actions
  subscribe: (config: SubscriptionConfig) => Promise<string>
  unsubscribe: (subscriptionId: string) => Promise<void>
  
  // Optimistic updates
  addOptimisticUpdate: (update: OptimisticUpdate) => void
  confirmOptimisticUpdate: (updateId: string) => void
  rollbackOptimisticUpdate: (updateId: string) => void
  clearPendingUpdates: () => void
  
  // Internal state management
  syncConnectionStatus: () => void
  syncSubscriptions: () => void
}

// Create the base real-time store
let isEventListenersSetup = false

export const useRealtimeStore = create<RealtimeStoreBase>()(
  subscribeWithSelector((set, get) => {
    const manager = getRealtimeManager()

    // Set up global event listeners only once
    if (!isEventListenersSetup) {
      manager.on('connectionStateChange', (status: ConnectionStatus) => {
        set({ 
          connectionStatus: status,
          isConnected: status.state === 'connected' 
        })
      })
      isEventListenersSetup = true
    }

    return {
      // Initial state
      connectionStatus: {
        state: 'disconnected',
        reconnectAttempt: 0,
        isReconnecting: false,
      },
      isConnected: false,
      subscriptions: [],
      pendingUpdates: [],

      // Subscription management
      subscribe: async (config: SubscriptionConfig) => {
        try {
          const subscriptionId = await manager.subscribe(config, {
            onSubscribe: (metadata: SubscriptionMetadata) => {
              set(state => ({
                subscriptions: [...state.subscriptions.filter(s => s.id !== metadata.id), metadata]
              }))
            },
            onUnsubscribe: (id: string) => {
              set(state => ({
                subscriptions: state.subscriptions.filter(sub => sub.id !== id)
              }))
            },
            onError: (error) => {
              console.error('[RealtimeStore] Subscription error:', error)
            }
          })

          return subscriptionId
        } catch (error) {
          console.error('[RealtimeStore] Failed to subscribe:', error)
          throw error
        }
      },

      unsubscribe: async (subscriptionId: string) => {
        try {
          await manager.unsubscribe(subscriptionId)
          set(state => ({
            subscriptions: state.subscriptions.filter(sub => sub.id !== subscriptionId)
          }))
        } catch (error) {
          console.error('[RealtimeStore] Failed to unsubscribe:', error)
          throw error
        }
      },

      // Optimistic updates management
      addOptimisticUpdate: (update: OptimisticUpdate) => {
        set(state => ({
          pendingUpdates: [...state.pendingUpdates, update]
        }))
      },

      confirmOptimisticUpdate: (updateId: string) => {
        set(state => ({
          pendingUpdates: state.pendingUpdates.map(update => 
            update.id === updateId 
              ? { ...update, confirmed: true }
              : update
          )
        }))

        // Remove confirmed updates after a delay
        setTimeout(() => {
          set(state => ({
            pendingUpdates: state.pendingUpdates.filter(update => 
              !(update.id === updateId && update.confirmed)
            )
          }))
        }, 2000)
      },

      rollbackOptimisticUpdate: (updateId: string) => {
        set(state => ({
          pendingUpdates: state.pendingUpdates.filter(update => update.id !== updateId)
        }))
      },

      clearPendingUpdates: () => {
        set({ pendingUpdates: [] })
      },

      // Sync methods
      syncConnectionStatus: () => {
        const status = manager.getConnectionStatus()
        set({ 
          connectionStatus: status,
          isConnected: status.state === 'connected'
        })
      },

      syncSubscriptions: () => {
        const subscriptions = manager.getSubscriptions()
        set({ subscriptions })
      },
    }
  })
)

// Utility functions for working with optimistic updates
export const createOptimisticUpdate = <T>(
  type: 'create' | 'update' | 'delete',
  data: T
): OptimisticUpdate<T> => ({
  id: `optimistic_${Date.now()}_${Math.random().toString(36).substring(2)}`,
  type,
  data,
  timestamp: new Date(),
  confirmed: false,
})

// Helper to merge optimistic updates with real data
export const mergeWithOptimisticUpdates = <T extends { id: string }>(
  realData: T[],
  pendingUpdates: OptimisticUpdate<T>[]
): T[] => {
  let mergedData = [...realData]

  pendingUpdates
    .filter(update => !update.confirmed)
    .forEach(update => {
      switch (update.type) {
        case 'create':
          // Add if not already in real data
          if (!mergedData.find(item => item.id === update.data.id)) {
            mergedData = [update.data, ...mergedData]
          }
          break
        case 'update':
          // Update existing item
          mergedData = mergedData.map(item => 
            item.id === update.data.id ? { ...item, ...update.data } : item
          )
          break
        case 'delete':
          // Remove from list
          mergedData = mergedData.filter(item => item.id !== update.data.id)
          break
      }
    })

  return mergedData
}

// Selector for connection status
export const selectConnectionStatus = (state: RealtimeStoreBase) => state.connectionStatus
export const selectIsConnected = (state: RealtimeStoreBase) => state.isConnected
export const selectSubscriptions = (state: RealtimeStoreBase) => state.subscriptions
export const selectPendingUpdates = (state: RealtimeStoreBase) => state.pendingUpdates