import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import type { User, Session } from '@supabase/supabase-js'
import { sendMagicLink, signOut, type AuthResult } from '@/lib/auth'

// Auth store state interface
interface AuthState {
  // State
  user: User | null
  session: Session | null
  loading: boolean
  initialized: boolean

  // Computed properties
  isAuthenticated: boolean

  // Actions
  setUser: (user: User | null) => void
  setSession: (session: Session | null) => void
  setLoading: (loading: boolean) => void
  setInitialized: (initialized: boolean) => void
  clearAuth: () => void
  login: (email: string, redirectTo?: string) => Promise<AuthResult>
  logout: () => Promise<AuthResult>
}

export const useAuthStore = create<AuthState>()(
  devtools(
    (set, get) => ({
      // Initial state
      user: null,
      session: null,
      loading: false,
      initialized: false,

      // Computed properties
      isAuthenticated: false,

      // Actions
      setUser: (user) => 
        set(
          { 
            user,
            isAuthenticated: user !== null
          },
          false,
          'auth/setUser'
        ),

      setSession: (session) => 
        set(
          { 
            session,
            user: session?.user || null,
            isAuthenticated: !!session?.user
          },
          false,
          'auth/setSession'
        ),

      setLoading: (loading) =>
        set(
          { loading },
          false,
          'auth/setLoading'
        ),

      setInitialized: (initialized) =>
        set(
          { initialized },
          false,
          'auth/setInitialized'
        ),

      clearAuth: () =>
        set(
          {
            user: null,
            session: null,
            loading: false,
            isAuthenticated: false,
            // Keep initialized state
          },
          false,
          'auth/clearAuth'
        ),

      login: async (email: string, redirectTo?: string): Promise<AuthResult> => {
        try {
          set({ loading: true }, false, 'auth/login/start')
          
          const result = await sendMagicLink(email, redirectTo)
          
          set({ loading: false }, false, 'auth/login/end')
          
          return result
        } catch (error) {
          set({ loading: false }, false, 'auth/login/error')
          throw error
        }
      },

      logout: async (): Promise<AuthResult> => {
        try {
          set({ loading: true }, false, 'auth/logout/start')
          
          const result = await signOut()
          
          // Clear auth state on successful logout
          if (result.success) {
            set(
              {
                user: null,
                session: null,
                loading: false,
                isAuthenticated: false,
              },
              false,
              'auth/logout/success'
            )
          } else {
            set({ loading: false }, false, 'auth/logout/error')
          }
          
          return result
        } catch (error) {
          set({ loading: false }, false, 'auth/logout/error')
          
          return {
            success: false,
            error: error instanceof Error ? error.message : 'An unexpected error occurred',
          }
        }
      },
    }),
    {
      name: 'auth-store',
    }
  )
)