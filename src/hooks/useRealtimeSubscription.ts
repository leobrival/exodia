'use client'

import { useEffect, useRef, useState } from 'react'
import { useRealtimeStore } from '@/stores/realtime-base'
import { SubscriptionConfig, EventHandlers, SubscriptionMetadata } from '@/types/realtime'

interface UseRealtimeSubscriptionOptions {
  enabled?: boolean
  onConnect?: () => void
  onDisconnect?: () => void
  onError?: (error: Error) => void
}

interface UseRealtimeSubscriptionReturn {
  isSubscribed: boolean
  subscriptionId?: string
  subscription?: SubscriptionMetadata
  error?: Error
  subscribe: () => Promise<void>
  unsubscribe: () => Promise<void>
}

export function useRealtimeSubscription(
  config: SubscriptionConfig,
  handlers: EventHandlers = {},
  options: UseRealtimeSubscriptionOptions = {}
): UseRealtimeSubscriptionReturn {
  const [subscriptionId, setSubscriptionId] = useState<string>()
  const [error, setError] = useState<Error>()
  const [isSubscribed, setIsSubscribed] = useState(false)
  
  const realtimeStore = useRealtimeStore()
  const configRef = useRef(config)
  const handlersRef = useRef(handlers)
  const optionsRef = useRef(options)
  
  // Update refs when props change
  useEffect(() => {
    configRef.current = config
    handlersRef.current = handlers
    optionsRef.current = options
  }, [config, handlers, options])

  const subscribe = async () => {
    try {
      setError(undefined)
      
      // Merge handlers with the config
      const configWithHandlers = {
        ...configRef.current,
        onSubscribe: (metadata: SubscriptionMetadata) => {
          setIsSubscribed(true)
          handlersRef.current.onSubscribe?.(metadata)
          optionsRef.current.onConnect?.()
        },
        onUnsubscribe: (id: string) => {
          setIsSubscribed(false)
          handlersRef.current.onUnsubscribe?.(id)
          optionsRef.current.onDisconnect?.()
        },
        onError: (error: Error) => {
          setError(error)
          setIsSubscribed(false)
          handlersRef.current.onError?.(error)
          optionsRef.current.onError?.(error)
        }
      }
      
      const id = await realtimeStore.subscribe(configWithHandlers)
      
      setSubscriptionId(id)
      
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to subscribe')
      setError(error)
      setIsSubscribed(false)
      optionsRef.current.onError?.(error)
    }
  }

  const unsubscribe = async () => {
    if (!subscriptionId) return
    
    try {
      await realtimeStore.unsubscribe(subscriptionId)
      setSubscriptionId(undefined)
      setIsSubscribed(false)
      setError(undefined)
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to unsubscribe')
      setError(error)
      optionsRef.current.onError?.(error)
    }
  }

  // Auto-subscribe if enabled
  useEffect(() => {
    if (optionsRef.current.enabled !== false) {
      subscribe()
    }

    // Cleanup on unmount
    return () => {
      if (subscriptionId) {
        unsubscribe()
      }
    }
  }, []) // Empty dependency array - we want this to run once on mount

  // Find subscription metadata
  const subscription = subscriptionId 
    ? realtimeStore.subscriptions.find(sub => sub.id === subscriptionId)
    : undefined

  return {
    isSubscribed,
    subscriptionId,
    subscription,
    error,
    subscribe,
    unsubscribe,
  }
}