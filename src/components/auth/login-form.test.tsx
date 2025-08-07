import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useAuthStore } from '@/stores/auth'

// Mock auth store
vi.mock('@/stores/auth', () => ({
  useAuthStore: vi.fn(),
}))

// Mock sonner for toast notifications
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}))

describe('LoginForm Component', () => {
  const mockLogin = vi.fn()
  const mockAuthStore = {
    login: mockLogin,
    loading: false,
    isAuthenticated: false,
  }

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(useAuthStore).mockReturnValue(mockAuthStore)
  })

  describe('Form Rendering', () => {
    it('should render login form with email input and submit button', async () => {
      const { LoginForm } = await import('./login-form')
      render(<LoginForm />)

      expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /send magic link/i })).toBeInTheDocument()
      expect(screen.getByPlaceholderText(/enter your email/i)).toBeInTheDocument()
    })

    it('should render with proper accessibility attributes', async () => {
      const { LoginForm } = await import('./login-form')
      render(<LoginForm />)

      const emailInput = screen.getByLabelText(/email/i)
      expect(emailInput).toHaveAttribute('type', 'email')
      expect(emailInput).toHaveAttribute('required')
      expect(emailInput).toHaveAccessibleName(/email/i)
    })

    it('should have proper form structure', async () => {
      const { LoginForm } = await import('./login-form')
      render(<LoginForm />)

      const form = screen.getByRole('form')
      expect(form).toBeInTheDocument()
      
      const submitButton = screen.getByRole('button', { name: /send magic link/i })
      expect(submitButton).toHaveAttribute('type', 'submit')
    })
  })

  describe('Form Validation', () => {
    it('should show validation error for invalid email format', async () => {
      const user = userEvent.setup()
      const { LoginForm } = await import('./login-form')
      render(<LoginForm />)

      const emailInput = screen.getByLabelText(/email/i)
      const submitButton = screen.getByRole('button', { name: /send magic link/i })

      await user.type(emailInput, 'invalid-email')
      await user.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText(/invalid email format/i)).toBeInTheDocument()
      })

      expect(mockLogin).not.toHaveBeenCalled()
    })

    it('should show validation error for empty email', async () => {
      const user = userEvent.setup()
      const { LoginForm } = await import('./login-form')
      render(<LoginForm />)

      const submitButton = screen.getByRole('button', { name: /send magic link/i })
      await user.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText(/email is required/i)).toBeInTheDocument()
      })

      expect(mockLogin).not.toHaveBeenCalled()
    })

    it('should clear validation errors when input becomes valid', async () => {
      const user = userEvent.setup()
      const { LoginForm } = await import('./login-form')
      render(<LoginForm />)

      const emailInput = screen.getByLabelText(/email/i)
      const submitButton = screen.getByRole('button', { name: /send magic link/i })

      // Submit to show error
      await user.click(submitButton)
      await waitFor(() => {
        expect(screen.getByText(/email is required/i)).toBeInTheDocument()
      })

      // Enter valid email
      await user.type(emailInput, 'user@example.com')

      await waitFor(() => {
        expect(screen.queryByText(/email is required/i)).not.toBeInTheDocument()
      })
    })
  })

  describe('Form Submission', () => {
    it('should call login function with valid email', async () => {
      const user = userEvent.setup()
      mockLogin.mockResolvedValue({ success: true, error: null })

      const { LoginForm } = await import('./login-form')
      render(<LoginForm />)

      const emailInput = screen.getByLabelText(/email/i)
      const submitButton = screen.getByRole('button', { name: /send magic link/i })

      await user.type(emailInput, 'user@example.com')
      await user.click(submitButton)

      await waitFor(() => {
        expect(mockLogin).toHaveBeenCalledWith('user@example.com', undefined)
      })
    })

    it('should call login with redirectTo parameter when provided', async () => {
      const user = userEvent.setup()
      mockLogin.mockResolvedValue({ success: true, error: null })

      const { LoginForm } = await import('./login-form')
      render(<LoginForm redirectTo="/dashboard" />)

      const emailInput = screen.getByLabelText(/email/i)
      const submitButton = screen.getByRole('button', { name: /send magic link/i })

      await user.type(emailInput, 'user@example.com')
      await user.click(submitButton)

      await waitFor(() => {
        expect(mockLogin).toHaveBeenCalledWith('user@example.com', '/dashboard')
      })
    })

    it('should show success message after successful submission', async () => {
      const user = userEvent.setup()
      mockLogin.mockResolvedValue({ success: true, error: null })
      const { toast } = await import('sonner')

      const { LoginForm } = await import('./login-form')
      render(<LoginForm />)

      const emailInput = screen.getByLabelText(/email/i)
      const submitButton = screen.getByRole('button', { name: /send magic link/i })

      await user.type(emailInput, 'user@example.com')
      await user.click(submitButton)

      await waitFor(() => {
        expect(toast.success).toHaveBeenCalledWith(
          expect.stringContaining('check your email')
        )
      })
    })

    it('should show error message on failed submission', async () => {
      const user = userEvent.setup()
      mockLogin.mockResolvedValue({ success: false, error: 'Rate limit exceeded' })
      const { toast } = await import('sonner')

      const { LoginForm } = await import('./login-form')
      render(<LoginForm />)

      const emailInput = screen.getByLabelText(/email/i)
      const submitButton = screen.getByRole('button', { name: /send magic link/i })

      await user.type(emailInput, 'user@example.com')
      await user.click(submitButton)

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('Rate limit exceeded')
      })
    })
  })

  describe('Loading States', () => {
    it('should show loading state during submission', async () => {
      const user = userEvent.setup()
      mockLogin.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)))

      // Mock loading state
      vi.mocked(useAuthStore).mockReturnValue({
        ...mockAuthStore,
        loading: true,
      })

      const { LoginForm } = await import('./login-form')
      render(<LoginForm />)

      const submitButton = screen.getByRole('button', { name: /sending/i })
      expect(submitButton).toBeDisabled()
      expect(submitButton).toHaveTextContent(/sending/i)
    })

    it('should disabled form during loading', async () => {
      vi.mocked(useAuthStore).mockReturnValue({
        ...mockAuthStore,
        loading: true,
      })

      const { LoginForm } = await import('./login-form')
      render(<LoginForm />)

      const emailInput = screen.getByLabelText(/email/i)
      const submitButton = screen.getByRole('button')

      expect(emailInput).toBeDisabled()
      expect(submitButton).toBeDisabled()
    })
  })

  describe('Resend Functionality', () => {
    it('should show resend button after successful submission', async () => {
      const user = userEvent.setup()
      mockLogin.mockResolvedValue({ success: true, error: null })

      const { LoginForm } = await import('./login-form')
      render(<LoginForm />)

      const emailInput = screen.getByLabelText(/email/i)
      const submitButton = screen.getByRole('button', { name: /send magic link/i })

      await user.type(emailInput, 'user@example.com')
      await user.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText(/didn't receive the email/i)).toBeInTheDocument()
        expect(screen.getByRole('button', { name: /resend/i })).toBeInTheDocument()
      })
    })

    it('should start countdown timer after resend', async () => {
      const user = userEvent.setup()
      mockLogin.mockResolvedValue({ success: true, error: null })

      const { LoginForm } = await import('./login-form')
      render(<LoginForm />)

      const emailInput = screen.getByLabelText(/email/i)
      const submitButton = screen.getByRole('button', { name: /send magic link/i })

      // Initial submission
      await user.type(emailInput, 'user@example.com')
      await user.click(submitButton)

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /resend/i })).toBeInTheDocument()
      })

      // Click resend
      const resendButton = screen.getByRole('button', { name: /resend/i })
      await user.click(resendButton)

      await waitFor(() => {
        expect(screen.getByText(/resend in \d+s/i)).toBeInTheDocument()
      })
    })

    it('should disable resend button during countdown', async () => {
      const user = userEvent.setup()
      mockLogin.mockResolvedValue({ success: true, error: null })

      const { LoginForm } = await import('./login-form')
      render(<LoginForm />)

      const emailInput = screen.getByLabelText(/email/i)
      const submitButton = screen.getByRole('button', { name: /send magic link/i })

      await user.type(emailInput, 'user@example.com')
      await user.click(submitButton)

      await waitFor(() => {
        const resendButton = screen.getByRole('button', { name: /resend/i })
        expect(resendButton).toBeInTheDocument()
      })

      const resendButton = screen.getByRole('button', { name: /resend/i })
      await user.click(resendButton)

      await waitFor(() => {
        const countdownButton = screen.getByRole('button', { name: /resend in/i })
        expect(countdownButton).toBeDisabled()
      })
    })
  })

  describe('Props Handling', () => {
    it('should accept and use redirectTo prop', async () => {
      const { LoginForm } = await import('./login-form')
      render(<LoginForm redirectTo="/custom-redirect" />)

      expect(screen.getByRole('form')).toBeInTheDocument()
    })

    it('should accept custom className', async () => {
      const { LoginForm } = await import('./login-form')
      render(<LoginForm className="custom-class" />)

      const form = screen.getByRole('form')
      expect(form).toHaveClass('custom-class')
    })
  })
})