import { describe, it, expect, vi, beforeEach } from 'vitest'
import { z } from 'zod'

// Mock Supabase client
const mockSupabaseClient = {
  auth: {
    signInWithOtp: vi.fn(),
    signOut: vi.fn(),
    getSession: vi.fn(),
    getUser: vi.fn(),
    onAuthStateChange: vi.fn(),
  },
}

vi.mock('./supabase', () => ({
  createBrowserClient: () => mockSupabaseClient,
}))

describe('Auth Utils', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Email Validation', () => {
    it('should validate correct email format', async () => {
      // Act
      const { validateEmail } = await import('./auth')
      
      // Assert - Valid emails should pass
      expect(() => validateEmail('user@example.com')).not.toThrow()
      expect(() => validateEmail('test.user@domain.co.uk')).not.toThrow()
      expect(() => validateEmail('user+tag@example.org')).not.toThrow()
    })

    it('should reject invalid email formats', async () => {
      // Act
      const { validateEmail } = await import('./auth')
      
      // Assert - Invalid emails should throw
      expect(() => validateEmail('invalid-email')).toThrow()
      expect(() => validateEmail('user@')).toThrow()
      expect(() => validateEmail('@domain.com')).toThrow()
      expect(() => validateEmail('user@domain')).toThrow()
      expect(() => validateEmail('')).toThrow()
    })

    it('should return validated email on success', async () => {
      // Arrange
      const email = 'user@example.com'
      
      // Act
      const { validateEmail } = await import('./auth')
      const result = validateEmail(email)
      
      // Assert
      expect(result).toBe(email)
    })

    it('should throw ZodError with specific message on invalid email', async () => {
      // Act
      const { validateEmail } = await import('./auth')
      
      // Assert
      expect(() => validateEmail('invalid')).toThrow(z.ZodError)
    })
  })

  describe('Magic Link Generation', () => {
    it('should send magic link with correct email', async () => {
      // Arrange
      const email = 'user@example.com'
      mockSupabaseClient.auth.signInWithOtp.mockResolvedValue({
        data: {},
        error: null,
      })

      // Act
      const { sendMagicLink } = await import('./auth')
      await sendMagicLink(email)

      // Assert
      expect(mockSupabaseClient.auth.signInWithOtp).toHaveBeenCalledWith({
        email,
        options: {
          emailRedirectTo: expect.stringContaining('/auth/callback'),
        },
      })
    })

    it('should include redirectTo parameter when provided', async () => {
      // Arrange
      const email = 'user@example.com'
      const redirectTo = '/dashboard'
      mockSupabaseClient.auth.signInWithOtp.mockResolvedValue({
        data: {},
        error: null,
      })

      // Act
      const { sendMagicLink } = await import('./auth')
      await sendMagicLink(email, redirectTo)

      // Assert
      expect(mockSupabaseClient.auth.signInWithOtp).toHaveBeenCalledWith({
        email,
        options: {
          emailRedirectTo: expect.stringContaining(`redirectTo=${encodeURIComponent(redirectTo)}`),
        },
      })
    })

    it('should return success result on successful magic link send', async () => {
      // Arrange
      const email = 'user@example.com'
      mockSupabaseClient.auth.signInWithOtp.mockResolvedValue({
        data: { user: null, session: null },
        error: null,
      })

      // Act
      const { sendMagicLink } = await import('./auth')
      const result = await sendMagicLink(email)

      // Assert
      expect(result).toEqual({
        success: true,
        error: null,
      })
    })

    it('should return error result on failed magic link send', async () => {
      // Arrange
      const email = 'user@example.com'
      const error = { message: 'Rate limit exceeded' }
      mockSupabaseClient.auth.signInWithOtp.mockResolvedValue({
        data: {},
        error,
      })

      // Act
      const { sendMagicLink } = await import('./auth')
      const result = await sendMagicLink(email)

      // Assert
      expect(result).toEqual({
        success: false,
        error: error.message,
      })
    })

    it('should validate email before sending magic link', async () => {
      // Arrange
      const invalidEmail = 'invalid-email'

      // Act & Assert
      const { sendMagicLink } = await import('./auth')
      await expect(sendMagicLink(invalidEmail)).rejects.toThrow(z.ZodError)
      
      // Should not call Supabase if validation fails
      expect(mockSupabaseClient.auth.signInWithOtp).not.toHaveBeenCalled()
    })
  })

  describe('Sign Out', () => {
    it('should call Supabase signOut', async () => {
      // Arrange
      mockSupabaseClient.auth.signOut.mockResolvedValue({
        error: null,
      })

      // Act
      const { signOut } = await import('./auth')
      await signOut()

      // Assert
      expect(mockSupabaseClient.auth.signOut).toHaveBeenCalled()
    })

    it('should return success result on successful sign out', async () => {
      // Arrange
      mockSupabaseClient.auth.signOut.mockResolvedValue({
        error: null,
      })

      // Act
      const { signOut } = await import('./auth')
      const result = await signOut()

      // Assert
      expect(result).toEqual({
        success: true,
        error: null,
      })
    })

    it('should return error result on failed sign out', async () => {
      // Arrange
      const error = { message: 'Network error' }
      mockSupabaseClient.auth.signOut.mockResolvedValue({
        error,
      })

      // Act
      const { signOut } = await import('./auth')
      const result = await signOut()

      // Assert
      expect(result).toEqual({
        success: false,
        error: error.message,
      })
    })
  })

  describe('Auth Error Handling', () => {
    it('should handle network errors gracefully', async () => {
      // Arrange
      const email = 'user@example.com'
      mockSupabaseClient.auth.signInWithOtp.mockRejectedValue(new Error('Network error'))

      // Act
      const { sendMagicLink } = await import('./auth')
      const result = await sendMagicLink(email)

      // Assert
      expect(result).toEqual({
        success: false,
        error: 'Network error',
      })
    })

    it('should handle unknown errors with generic message', async () => {
      // Arrange
      const email = 'user@example.com'
      mockSupabaseClient.auth.signInWithOtp.mockRejectedValue('Unknown error')

      // Act
      const { sendMagicLink } = await import('./auth')
      const result = await sendMagicLink(email)

      // Assert
      expect(result).toEqual({
        success: false,
        error: 'An unexpected error occurred',
      })
    })
  })

  describe('Auth State Types', () => {
    it('should export correct TypeScript types', async () => {
      // Act
      const authModule = await import('./auth')

      // Assert - Types should be available
      expect(typeof authModule.validateEmail).toBe('function')
      expect(typeof authModule.sendMagicLink).toBe('function')
      expect(typeof authModule.signOut).toBe('function')
    })
  })
})