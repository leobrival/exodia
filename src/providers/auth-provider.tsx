'use client'

import React, { useEffect } from 'react'
import { createBrowserClient } from '@/lib/supabase'
import { useAuthStore } from '@/stores/auth'
import { logError } from '@/lib/utils/error-handling'

interface AuthProviderProps {
  children: React.ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const { setSession, setInitialized, clearAuth } = useAuthStore()

  useEffect(() => {
    const supabase = createBrowserClient()

    // Get initial session
    const getInitialSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession()
        
        if (error) {
          console.error('Error getting session:', error)
          logError('AuthProvider:getSession', error, { step: 'initial_session' })
          setSession(null)
        } else {
          setSession(session)
        }
      } catch (error) {
        console.error('Unexpected error getting session:', error)
        logError('AuthProvider:getSession:unexpected', error, { step: 'initial_session_catch' })
        setSession(null)
      } finally {
        setInitialized(true)
      }
    }



    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN') {
          setSession(session)
        } else if (event === 'TOKEN_REFRESHED') {
          setSession(session)
        } else if (event === 'SIGNED_OUT') {
          clearAuth()
        }
      }
    )

    // Initialize
    getInitialSession()

    // Cleanup subscription on unmount
    return () => {
      subscription.unsubscribe()
    }
  }, [setSession, setInitialized, clearAuth])

  return <>{children}</>
}