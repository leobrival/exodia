'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRealtimeStore } from '@/stores/realtime-base'
import { getRealtimeManager } from '@/lib/supabase/realtime'
import { SubscriptionConfig } from '@/types/realtime'

interface UseRealtimeDataOptions {
  enabled?: boolean
  onInsert?: (data: any) => void
  onUpdate?: (data: any) => void
  onDelete?: (data: any) => void
  onError?: (error: Error) => void
}

interface UseRealtimeDataReturn {
  isSubscribed: boolean
  subscriptionId?: string
  error?: Error
  subscribe: () => Promise<void>
  unsubscribe: () => Promise<void>
}

export function useRealtimeData(
  config: SubscriptionConfig,
  options: UseRealtimeDataOptions = {}
): UseRealtimeDataReturn {
  const [subscriptionId, setSubscriptionId] = useState<string>()
  const [error, setError] = useState<Error>()
  const [isSubscribed, setIsSubscribed] = useState(false)
  
  const realtimeStore = useRealtimeStore()
  const manager = getRealtimeManager()

  const subscribe = useCallback(async () => {
    try {
      setError(undefined)
      
      const id = await realtimeStore.subscribe(config)
      
      // Set up event listeners
      const handleInsert = (payload: any) => {
        options.onInsert?.(payload.new)
      }
      
      const handleUpdate = (payload: any) => {
        options.onUpdate?.(payload.new)
      }
      
      const handleDelete = (payload: any) => {
        options.onDelete?.(payload.old)
      }
      
      const handleError = (error: Error) => {
        setError(error)
        options.onError?.(error)
      }

      manager.on(`${id}:insert`, handleInsert)
      manager.on(`${id}:update`, handleUpdate)
      manager.on(`${id}:delete`, handleDelete)
      manager.on(`${id}:error`, handleError)
      
      setSubscriptionId(id)
      setIsSubscribed(true)
      
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to subscribe')
      setError(error)
      options.onError?.(error)
    }
  }, [config, options, realtimeStore, manager])

  const unsubscribe = useCallback(async () => {
    if (!subscriptionId) return
    
    try {
      // Remove all event listeners for this subscription
      manager.removeAllListeners(`${subscriptionId}:insert`)
      manager.removeAllListeners(`${subscriptionId}:update`)
      manager.removeAllListeners(`${subscriptionId}:delete`)
      manager.removeAllListeners(`${subscriptionId}:error`)
      
      await realtimeStore.unsubscribe(subscriptionId)
      setSubscriptionId(undefined)
      setIsSubscribed(false)
      setError(undefined)
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to unsubscribe')
      setError(error)
      options.onError?.(error)
    }
  }, [subscriptionId, realtimeStore, manager, options])

  // Auto-subscribe if enabled
  useEffect(() => {
    if (options.enabled !== false) {
      subscribe()
    }

    return () => {
      if (subscriptionId) {
        unsubscribe()
      }
    }
  }, []) // Empty dependency array - we want this to run once on mount

  return {
    isSubscribed,
    subscriptionId,
    error,
    subscribe,
    unsubscribe,
  }
}