import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { vi, beforeEach, describe, it, expect } from 'vitest'
import { AuthProvider } from '@/providers/auth-provider'
import { LoginForm } from '@/components/auth/login-form'
import { useAuthStore } from '@/stores/auth'
import { createBrowserClient } from '@/lib/supabase'
import { sendMagicLink } from '@/lib/auth'

// Mock dependencies
vi.mock('@/lib/supabase', () => ({
  createBrowserClient: vi.fn(),
}))

vi.mock('@/lib/auth', () => ({
  sendMagicLink: vi.fn(),
}))

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
  login: vi.fn(),
  setSession: vi.fn(),
  setInitialized: vi.fn(),
  clearAuth: vi.fn(),
  loading: false,
  user: null,
  session: null,
  initialized: true,
  isAuthenticated: false,
}

beforeEach(() => {
  vi.clearAllMocks()
  ;(createBrowserClient as any).mockReturnValue(mockSupabaseClient)
  ;(useAuthStore as any).mockReturnValue(mockAuthStore)
  
  mockSupabaseClient.auth.getSession.mockResolvedValue({
    data: { session: null },
    error: null,
  })

  mockSupabaseClient.auth.onAuthStateChange.mockReturnValue({
    data: { subscription: { unsubscribe: vi.fn() } },
  })
})

function IntegratedAuthApp() {
  return (
    <AuthProvider>
      <div>
        <h1>Auth Integration Test</h1>
        <LoginForm />
      </div>
    </AuthProvider>
  )
}

describe('Authentication Integration', () => {
  it('should render complete auth flow', async () => {
    render(<IntegratedAuthApp />)

    // Check if the login form renders
    expect(screen.getByText('Auth Integration Test')).toBeInTheDocument()
    expect(screen.getByText('Welcome back')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('name@example.com')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /send magic link/i })).toBeInTheDocument()
  })

  it('should handle successful magic link sending', async () => {
    const mockSendMagicLink = vi.fn().mockResolvedValue({
      success: true,
      message: 'Magic link sent successfully',
    })
    
    mockAuthStore.login.mockImplementation(mockSendMagicLink)

    render(<IntegratedAuthApp />)

    const emailInput = screen.getByPlaceholderText('name@example.com')
    const submitButton = screen.getByRole('button', { name: /send magic link/i })

    // Enter email and submit
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } })
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(mockAuthStore.login).toHaveBeenCalledWith('test@example.com', undefined)
    })
  })

  it('should show validation errors for invalid email', async () => {
    render(<IntegratedAuthApp />)

    const emailInput = screen.getByPlaceholderText('name@example.com')
    const submitButton = screen.getByRole('button', { name: /send magic link/i })

    // Enter invalid email and submit
    fireEvent.change(emailInput, { target: { value: 'invalid-email' } })
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText('Invalid email format')).toBeInTheDocument()
    })
  })

  it('should handle loading state during authentication', async () => {
    mockAuthStore.loading = true
    ;(useAuthStore as any).mockReturnValue({
      ...mockAuthStore,
      loading: true,
    })

    render(<IntegratedAuthApp />)

    const submitButton = screen.getByRole('button', { name: /sending.../i })
    expect(submitButton).toBeDisabled()
  })

  it('should initialize auth state on provider mount', async () => {
    render(<IntegratedAuthApp />)

    await waitFor(() => {
      expect(mockSupabaseClient.auth.getSession).toHaveBeenCalled()
      expect(mockSupabaseClient.auth.onAuthStateChange).toHaveBeenCalled()
    })
  })

  it('should handle authentication state changes', async () => {
    let authStateCallback: any

    mockSupabaseClient.auth.onAuthStateChange.mockImplementation((callback) => {
      authStateCallback = callback
      return {
        data: { subscription: { unsubscribe: vi.fn() } },
      }
    })

    render(<IntegratedAuthApp />)

    // Simulate successful authentication
    const mockSession = {
      user: { id: 'user-1', email: 'test@example.com' },
      access_token: 'token',
    }

    authStateCallback('SIGNED_IN', mockSession)

    await waitFor(() => {
      expect(mockAuthStore.setSession).toHaveBeenCalledWith(mockSession)
    })
  })

  it('should be accessible via keyboard navigation', async () => {
    render(<IntegratedAuthApp />)

    const emailInput = screen.getByPlaceholderText('name@example.com')
    const submitButton = screen.getByRole('button', { name: /send magic link/i })

    // Test tab navigation
    emailInput.focus()
    expect(document.activeElement).toBe(emailInput)

    fireEvent.keyDown(emailInput, { key: 'Tab' })
    expect(document.activeElement).toBe(submitButton)

    // Test form submission via Enter key
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } })
    fireEvent.keyDown(emailInput, { key: 'Enter' })

    await waitFor(() => {
      expect(mockAuthStore.login).toHaveBeenCalledWith('test@example.com', undefined)
    })
  })

  it('should have proper ARIA labels and roles', () => {
    render(<IntegratedAuthApp />)

    // Check ARIA attributes
    const emailInput = screen.getByPlaceholderText('name@example.com')
    expect(emailInput).toHaveAttribute('type', 'email')
    expect(emailInput).toHaveAttribute('required')
    
    const submitButton = screen.getByRole('button', { name: /send magic link/i })
    expect(submitButton).toHaveAttribute('type', 'submit')
  })
})