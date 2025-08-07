import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import type { User, Session } from '@supabase/supabase-js'

// Mock auth utils
vi.mock('@/lib/auth', () => ({
  sendMagicLink: vi.fn(),
  signOut: vi.fn(),
}))

describe('Auth Store', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Initial State', () => {
    it('should have initial state with null user and not loading', async () => {
      // Act
      const { useAuthStore } = await import('./auth')
      const { result } = renderHook(() => useAuthStore())

      // Assert
      expect(result.current.user).toBeNull()
      expect(result.current.session).toBeNull()
      expect(result.current.loading).toBe(false)
      expect(result.current.initialized).toBe(false)
    })

    it('should expose all required actions', async () => {
      // Act
      const { useAuthStore } = await import('./auth')
      const { result } = renderHook(() => useAuthStore())

      // Assert
      expect(typeof result.current.setUser).toBe('function')
      expect(typeof result.current.setSession).toBe('function')
      expect(typeof result.current.setLoading).toBe('function')
      expect(typeof result.current.setInitialized).toBe('function')
      expect(typeof result.current.clearAuth).toBe('function')
      expect(typeof result.current.login).toBe('function')
      expect(typeof result.current.logout).toBe('function')
    })
  })

  describe('User Management', () => {
    it('should set user correctly', async () => {
      // Arrange
      const mockUser: User = {
        id: '123',
        email: 'user@example.com',
        created_at: '2023-01-01T00:00:00.000Z',
        app_metadata: {},
        user_metadata: {},
        aud: 'authenticated',
        email_confirmed_at: '2023-01-01T00:00:00.000Z',
      }

      // Act
      const { useAuthStore } = await import('./auth')
      const { result } = renderHook(() => useAuthStore())

      act(() => {
        result.current.setUser(mockUser)
      })

      // Assert
      expect(result.current.user).toBe(mockUser)
      expect(result.current.user?.email).toBe('user@example.com')
    })

    it('should clear user when set to null', async () => {
      // Arrange
      const mockUser: User = {
        id: '123',
        email: 'user@example.com',
        created_at: '2023-01-01T00:00:00.000Z',
        app_metadata: {},
        user_metadata: {},
        aud: 'authenticated',
        email_confirmed_at: '2023-01-01T00:00:00.000Z',
      }

      const { useAuthStore } = await import('./auth')
      const { result } = renderHook(() => useAuthStore())

      // Set user first
      act(() => {
        result.current.setUser(mockUser)
      })

      // Act - Clear user
      act(() => {
        result.current.setUser(null)
      })

      // Assert
      expect(result.current.user).toBeNull()
    })
  })

  describe('Session Management', () => {
    it('should set session correctly', async () => {
      // Arrange
      const mockSession: Session = {
        access_token: 'access-token',
        refresh_token: 'refresh-token',
        expires_in: 3600,
        expires_at: Date.now() + 3600000,
        token_type: 'bearer',
        user: {
          id: '123',
          email: 'user@example.com',
          created_at: '2023-01-01T00:00:00.000Z',
          app_metadata: {},
          user_metadata: {},
          aud: 'authenticated',
          email_confirmed_at: '2023-01-01T00:00:00.000Z',
        }
      }

      // Act
      const { useAuthStore } = await import('./auth')
      const { result } = renderHook(() => useAuthStore())

      act(() => {
        result.current.setSession(mockSession)
      })

      // Assert
      expect(result.current.session).toBe(mockSession)
      expect(result.current.session?.access_token).toBe('access-token')
    })

    it('should automatically set user when session is set', async () => {
      // Arrange
      const mockUser: User = {
        id: '123',
        email: 'user@example.com',
        created_at: '2023-01-01T00:00:00.000Z',
        app_metadata: {},
        user_metadata: {},
        aud: 'authenticated',
        email_confirmed_at: '2023-01-01T00:00:00.000Z',
      }

      const mockSession: Session = {
        access_token: 'access-token',
        refresh_token: 'refresh-token',
        expires_in: 3600,
        expires_at: Date.now() + 3600000,
        token_type: 'bearer',
        user: mockUser
      }

      // Act
      const { useAuthStore } = await import('./auth')
      const { result } = renderHook(() => useAuthStore())

      act(() => {
        result.current.setSession(mockSession)
      })

      // Assert
      expect(result.current.user).toBe(mockUser)
      expect(result.current.session).toBe(mockSession)
    })
  })

  describe('Loading States', () => {
    it('should set loading state correctly', async () => {
      // Act
      const { useAuthStore } = await import('./auth')
      const { result } = renderHook(() => useAuthStore())

      act(() => {
        result.current.setLoading(true)
      })

      // Assert
      expect(result.current.loading).toBe(true)

      act(() => {
        result.current.setLoading(false)
      })

      expect(result.current.loading).toBe(false)
    })

    it('should set initialized state correctly', async () => {
      // Act
      const { useAuthStore } = await import('./auth')
      const { result } = renderHook(() => useAuthStore())

      act(() => {
        result.current.setInitialized(true)
      })

      // Assert
      expect(result.current.initialized).toBe(true)
    })
  })

  describe('Auth Actions', () => {
    it('should clear all auth data', async () => {
      // Arrange
      const mockUser: User = {
        id: '123',
        email: 'user@example.com',
        created_at: '2023-01-01T00:00:00.000Z',
        app_metadata: {},
        user_metadata: {},
        aud: 'authenticated',
        email_confirmed_at: '2023-01-01T00:00:00.000Z',
      }

      const { useAuthStore } = await import('./auth')
      const { result } = renderHook(() => useAuthStore())

      // Set some data first
      act(() => {
        result.current.setUser(mockUser)
        result.current.setLoading(true)
        result.current.setInitialized(true)
      })

      // Act - Clear auth
      act(() => {
        result.current.clearAuth()
      })

      // Assert
      expect(result.current.user).toBeNull()
      expect(result.current.session).toBeNull()
      expect(result.current.loading).toBe(false)
      expect(result.current.initialized).toBe(true) // Should keep initialized state
    })

    it('should call sendMagicLink on login', async () => {
      // Arrange
      const email = 'user@example.com'
      const redirectTo = '/dashboard'
      const { sendMagicLink } = await import('@/lib/auth')
      vi.mocked(sendMagicLink).mockResolvedValue({ success: true, error: null })

      // Act
      const { useAuthStore } = await import('./auth')
      const { result } = renderHook(() => useAuthStore())

      await act(async () => {
        await result.current.login(email, redirectTo)
      })

      // Assert
      expect(sendMagicLink).toHaveBeenCalledWith(email, redirectTo)
    })

    it('should return success result on successful login', async () => {
      // Arrange
      const email = 'user@example.com'
      const { sendMagicLink } = await import('@/lib/auth')
      const mockResult = { success: true, error: null }
      vi.mocked(sendMagicLink).mockResolvedValue(mockResult)

      // Act
      const { useAuthStore } = await import('./auth')
      const { result } = renderHook(() => useAuthStore())

      let loginResult: any
      await act(async () => {
        loginResult = await result.current.login(email)
      })

      // Assert
      expect(loginResult).toEqual(mockResult)
    })

    it('should call signOut and clearAuth on logout', async () => {
      // Arrange
      const { signOut } = await import('@/lib/auth')
      vi.mocked(signOut).mockResolvedValue({ success: true, error: null })

      const mockUser: User = {
        id: '123',
        email: 'user@example.com',
        created_at: '2023-01-01T00:00:00.000Z',
        app_metadata: {},
        user_metadata: {},
        aud: 'authenticated',
        email_confirmed_at: '2023-01-01T00:00:00.000Z',
      }

      // Act
      const { useAuthStore } = await import('./auth')
      const { result } = renderHook(() => useAuthStore())

      // Set user first
      act(() => {
        result.current.setUser(mockUser)
      })

      await act(async () => {
        await result.current.logout()
      })

      // Assert
      expect(signOut).toHaveBeenCalled()
      expect(result.current.user).toBeNull()
      expect(result.current.session).toBeNull()
    })
  })

  describe('Computed Properties', () => {
    it('should correctly compute isAuthenticated', async () => {
      // Act
      const { useAuthStore } = await import('./auth')
      const { result } = renderHook(() => useAuthStore())

      // Initially not authenticated
      expect(result.current.isAuthenticated).toBe(false)

      // Set user
      const mockUser: User = {
        id: '123',
        email: 'user@example.com',
        created_at: '2023-01-01T00:00:00.000Z',
        app_metadata: {},
        user_metadata: {},
        aud: 'authenticated',
        email_confirmed_at: '2023-01-01T00:00:00.000Z',
      }

      act(() => {
        result.current.setUser(mockUser)
      })

      // Should be authenticated
      expect(result.current.isAuthenticated).toBe(true)
    })
  })
})