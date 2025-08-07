import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import { vi, beforeEach, describe, it, expect } from 'vitest'
import { AuthProvider } from './auth-provider'
import { useAuthStore } from '@/stores/auth'
import { createBrowserClient } from '@/lib/supabase'

// Mock Supabase client
vi.mock('@/lib/supabase', () => ({
  createBrowserClient: vi.fn(),
}))

// Mock Zustand store
vi.mock('@/stores/auth', () => ({
  useAuthStore: vi.fn(),
}))

const mockSupabaseClient = {
  auth: {
    getSession: vi.fn(),
    onAuthStateChange: vi.fn(),
  },
}

const mockAuthStore = {
  setSession: vi.fn(),
  setUser: vi.fn(),
  setInitialized: vi.fn(),
  clearAuth: vi.fn(),
  initialized: false,
}

beforeEach(() => {
  vi.clearAllMocks()
  ;(createBrowserClient as any).mockReturnValue(mockSupabaseClient)
  ;(useAuthStore as any).mockReturnValue(mockAuthStore)
})

function TestComponent() {
  const { initialized } = useAuthStore()
  return <div>Initialized: {initialized ? 'true' : 'false'}</div>
}

describe('AuthProvider', () => {
  it('should render children', () => {
    mockSupabaseClient.auth.getSession.mockResolvedValue({
      data: { session: null },
      error: null,
    })

    mockSupabaseClient.auth.onAuthStateChange.mockReturnValue({
      data: { subscription: { unsubscribe: vi.fn() } },
    })

    render(
      <AuthProvider>
        <div>Test Child</div>
      </AuthProvider>
    )

    expect(screen.getByText('Test Child')).toBeInTheDocument()
  })

  it('should initialize auth state on mount', async () => {
    const mockSession = {
      user: { id: 'user-1', email: 'test@example.com' },
      access_token: 'token',
    }

    mockSupabaseClient.auth.getSession.mockResolvedValue({
      data: { session: mockSession },
      error: null,
    })

    const mockUnsubscribe = vi.fn()
    mockSupabaseClient.auth.onAuthStateChange.mockReturnValue({
      data: { subscription: { unsubscribe: mockUnsubscribe } },
    })

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    )

    await waitFor(() => {
      expect(mockSupabaseClient.auth.getSession).toHaveBeenCalled()
      expect(mockAuthStore.setSession).toHaveBeenCalledWith(mockSession)
      expect(mockAuthStore.setInitialized).toHaveBeenCalledWith(true)
    })
  })

  it('should handle auth state changes', async () => {
    const mockSession = {
      user: { id: 'user-1', email: 'test@example.com' },
      access_token: 'token',
    }

    mockSupabaseClient.auth.getSession.mockResolvedValue({
      data: { session: null },
      error: null,
    })

    const mockAuthStateCallback = vi.fn()
    mockSupabaseClient.auth.onAuthStateChange.mockImplementation((callback) => {
      mockAuthStateCallback.mockImplementation(callback)
      return {
        data: { subscription: { unsubscribe: vi.fn() } },
      }
    })

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    )

    // Simulate auth state change
    await waitFor(() => {
      expect(mockSupabaseClient.auth.onAuthStateChange).toHaveBeenCalled()
    })

    // Trigger auth state change callback
    mockAuthStateCallback('SIGNED_IN', mockSession)

    await waitFor(() => {
      expect(mockAuthStore.setSession).toHaveBeenCalledWith(mockSession)
    })
  })

  it('should handle session error', async () => {
    const mockError = new Error('Session error')
    
    mockSupabaseClient.auth.getSession.mockResolvedValue({
      data: { session: null },
      error: mockError,
    })

    mockSupabaseClient.auth.onAuthStateChange.mockReturnValue({
      data: { subscription: { unsubscribe: vi.fn() } },
    })

    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    )

    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith('Error getting session:', mockError)
      expect(mockAuthStore.setInitialized).toHaveBeenCalledWith(true)
    })

    consoleSpy.mockRestore()
  })

  it('should clean up subscription on unmount', async () => {
    const mockUnsubscribe = vi.fn()
    
    mockSupabaseClient.auth.getSession.mockResolvedValue({
      data: { session: null },
      error: null,
    })

    mockSupabaseClient.auth.onAuthStateChange.mockReturnValue({
      data: { subscription: { unsubscribe: mockUnsubscribe } },
    })

    const { unmount } = render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    )

    unmount()

    expect(mockUnsubscribe).toHaveBeenCalled()
  })

  it('should handle SIGNED_OUT event', async () => {
    mockSupabaseClient.auth.getSession.mockResolvedValue({
      data: { session: null },
      error: null,
    })

    const mockAuthStateCallback = vi.fn()
    mockSupabaseClient.auth.onAuthStateChange.mockImplementation((callback) => {
      mockAuthStateCallback.mockImplementation(callback)
      return {
        data: { subscription: { unsubscribe: vi.fn() } },
      }
    })

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    )

    // Trigger SIGNED_OUT event
    mockAuthStateCallback('SIGNED_OUT', null)

    await waitFor(() => {
      expect(mockAuthStore.clearAuth).toHaveBeenCalled()
    })
  })
})