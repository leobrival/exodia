'use client'

import React, { useEffect } from 'react'
import { useConnectionStatus } from '@/hooks/useConnectionStatus'
import { useProjectsStore } from '@/stores/projects'
import { useAuthStore } from '@/stores/auth'
import { toast } from 'sonner'

interface RealtimeProviderProps {
  children: React.ReactNode
}

export function RealtimeProvider({ children }: RealtimeProviderProps) {
  const { isAuthenticated, user } = useAuthStore()
  const { enableRealtime, disableRealtime, isRealtimeEnabled } = useProjectsStore()
  
  const { isConnected } = useConnectionStatus({
    onConnect: () => {
      console.log('[RealtimeProvider] Connected to real-time')
      toast.success('Real-time connection established', {
        duration: 2000,
      })
    },
    onDisconnect: () => {
      console.log('[RealtimeProvider] Disconnected from real-time')
      if (isRealtimeEnabled) {
        toast.warning('Real-time connection lost', {
          description: 'Attempting to reconnect...',
          duration: 3000,
        })
      }
    },
    onError: (error) => {
      console.error('[RealtimeProvider] Connection error:', error)
      toast.error('Real-time connection error', {
        description: error.message,
        duration: 5000,
      })
    }
  })

  // Enable real-time when user is authenticated
  useEffect(() => {
    if (isAuthenticated && user && !isRealtimeEnabled) {
      console.log('[RealtimeProvider] Enabling real-time for authenticated user')
      enableRealtime().catch(error => {
        console.error('[RealtimeProvider] Failed to enable real-time:', error)
        toast.error('Failed to enable real-time updates', {
          description: 'Some features may not work correctly',
          duration: 5000,
        })
      })
    } else if (!isAuthenticated && isRealtimeEnabled) {
      console.log('[RealtimeProvider] Disabling real-time for unauthenticated user')
      disableRealtime().catch(error => {
        console.error('[RealtimeProvider] Failed to disable real-time:', error)
      })
    }
  }, [isAuthenticated, user, isRealtimeEnabled, enableRealtime, disableRealtime])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (isRealtimeEnabled) {
        disableRealtime().catch(console.error)
      }
    }
  }, [isRealtimeEnabled, disableRealtime])

  return <>{children}</>
}