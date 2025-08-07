'use client'

import { useEffect, useState } from 'react'
import { useRealtimeStore } from '@/stores/realtime-base'
import { ConnectionStatus, ConnectionState } from '@/types/realtime'

interface UseConnectionStatusOptions {
  onStateChange?: (state: ConnectionState) => void
  onConnect?: () => void
  onDisconnect?: () => void
  onError?: (error: Error) => void
}

interface UseConnectionStatusReturn {
  connectionStatus: ConnectionStatus
  isConnected: boolean
  isConnecting: boolean
  isDisconnected: boolean
  hasError: boolean
  lastError?: Error
  reconnectAttempt: number
  isReconnecting: boolean
}

export function useConnectionStatus(
  options: UseConnectionStatusOptions = {}
): UseConnectionStatusReturn {
  const realtimeStore = useRealtimeStore()
  const [lastNotifiedState, setLastNotifiedState] = useState<ConnectionState>('disconnected')

  // Watch for connection state changes
  useEffect(() => {
    const currentState = realtimeStore.connectionStatus.state
    
    if (currentState !== lastNotifiedState) {
      setLastNotifiedState(currentState)
      options.onStateChange?.(currentState)
      
      switch (currentState) {
        case 'connected':
          options.onConnect?.()
          break
        case 'disconnected':
          options.onDisconnect?.()
          break
        case 'error':
          if (realtimeStore.connectionStatus.lastError) {
            options.onError?.(realtimeStore.connectionStatus.lastError)
          }
          break
      }
    }
  }, [realtimeStore.connectionStatus.state, lastNotifiedState, options])

  // Sync connection status on mount only
  useEffect(() => {
    realtimeStore.syncConnectionStatus()
  }, [])

  return {
    connectionStatus: realtimeStore.connectionStatus,
    isConnected: realtimeStore.isConnected,
    isConnecting: realtimeStore.connectionStatus.state === 'connecting',
    isDisconnected: realtimeStore.connectionStatus.state === 'disconnected',
    hasError: realtimeStore.connectionStatus.state === 'error',
    lastError: realtimeStore.connectionStatus.lastError,
    reconnectAttempt: realtimeStore.connectionStatus.reconnectAttempt,
    isReconnecting: realtimeStore.connectionStatus.isReconnecting,
  }
}