import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock @supabase/ssr
vi.mock('@supabase/ssr', () => ({
  createBrowserClient: vi.fn(),
  createServerClient: vi.fn(),
}))

// Mock environment variables
vi.mock('@/env', () => ({
  env: {
    NEXT_PUBLIC_SUPABASE_URL: 'https://test.supabase.co',
    NEXT_PUBLIC_SUPABASE_ANON_KEY: 'test-anon-key',
  },
}))

describe('Supabase Clients', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Browser Client', () => {
    it('should create browser client with correct configuration', async () => {
      // Arrange
      const mockClient = { 
        auth: { getSession: vi.fn() },
        from: vi.fn(),
      }
      const { createBrowserClient: mockCreateBrowserClient } = await import('@supabase/ssr')
      vi.mocked(mockCreateBrowserClient).mockReturnValue(mockClient as any)

      // Act
      const { createBrowserClient } = await import('./supabase')
      const client = createBrowserClient()

      // Assert
      expect(mockCreateBrowserClient).toHaveBeenCalledWith(
        'https://test.supabase.co',
        'test-anon-key'
      )
      expect(client).toBe(mockClient)
    })

    it('should create browser client only once (singleton)', async () => {
      // Arrange
      const mockClient = { auth: { getSession: vi.fn() } }
      const { createBrowserClient: mockCreateBrowserClient } = await import('@supabase/ssr')
      vi.mocked(mockCreateBrowserClient).mockReturnValue(mockClient as any)

      // Act
      const { createBrowserClient } = await import('./supabase')
      const client1 = createBrowserClient()
      const client2 = createBrowserClient()

      // Assert
      expect(mockCreateBrowserClient).toHaveBeenCalledTimes(1)
      expect(client1).toBe(client2)
    })
  })

  describe('Server Client', () => {
    it('should create server client with cookies support', async () => {
      // Arrange
      const mockClient = { 
        auth: { getSession: vi.fn() },
        from: vi.fn(),
      }
      const { createServerClient: mockCreateServerClient } = await import('@supabase/ssr')
      vi.mocked(mockCreateServerClient).mockReturnValue(mockClient as any)

      const mockCookieStore = {
        get: vi.fn(),
        set: vi.fn(),
        remove: vi.fn(),
      }

      // Act
      const { createServerClient } = await import('./supabase')
      const client = createServerClient(mockCookieStore)

      // Assert
      expect(mockCreateServerClient).toHaveBeenCalledWith(
        'https://test.supabase.co',
        'test-anon-key',
        expect.objectContaining({
          cookies: expect.objectContaining({
            get: expect.any(Function),
            set: expect.any(Function),
            remove: expect.any(Function),
          }),
        })
      )
      expect(client).toBe(mockClient)
    })

    it('should handle cookie operations correctly', async () => {
      // Arrange
      const mockClient = { auth: { getSession: vi.fn() } }
      const { createServerClient: mockCreateServerClient } = await import('@supabase/ssr')
      vi.mocked(mockCreateServerClient).mockReturnValue(mockClient as any)

      const mockCookieStore = {
        get: vi.fn().mockReturnValue({ value: 'cookie-value' }),
        set: vi.fn(),
        remove: vi.fn(),
      }

      // Act
      const { createServerClient } = await import('./supabase')
      createServerClient(mockCookieStore)

      // Get the cookies configuration from the createServerClient call
      const cookiesConfig = vi.mocked(mockCreateServerClient).mock.calls[0][2]?.cookies

      // Test cookie get
      const cookieValue = cookiesConfig?.get?.('test-cookie')
      expect(mockCookieStore.get).toHaveBeenCalledWith('test-cookie')
      expect(cookieValue).toBe('cookie-value')

      // Test cookie set
      cookiesConfig?.set?.('test-cookie', 'new-value', { httpOnly: true })
      expect(mockCookieStore.set).toHaveBeenCalledWith('test-cookie', 'new-value', { httpOnly: true })

      // Test cookie remove
      cookiesConfig?.remove?.('test-cookie', { path: '/' })
      expect(mockCookieStore.remove).toHaveBeenCalledWith('test-cookie', { path: '/' })
    })
  })

  describe('Middleware Client', () => {
    it('should create middleware client with request/response support', async () => {
      // Arrange
      const mockClient = { 
        auth: { getSession: vi.fn() },
        from: vi.fn(),
      }
      const { createServerClient: mockCreateServerClient } = await import('@supabase/ssr')
      vi.mocked(mockCreateServerClient).mockReturnValue(mockClient as any)

      const mockRequest = new Request('http://localhost:3000')
      const mockResponse = new Response()

      // Act
      const { createMiddlewareClient } = await import('./supabase')
      const client = createMiddlewareClient(mockRequest, mockResponse)

      // Assert
      expect(mockCreateServerClient).toHaveBeenCalledWith(
        'https://test.supabase.co',
        'test-anon-key',
        expect.objectContaining({
          cookies: expect.objectContaining({
            get: expect.any(Function),
            set: expect.any(Function),
            remove: expect.any(Function),
          }),
        })
      )
      expect(client).toBe(mockClient)
    })

    it('should handle request/response cookie operations', async () => {
      // Arrange
      const mockClient = { auth: { getSession: vi.fn() } }
      const { createServerClient: mockCreateServerClient } = await import('@supabase/ssr')
      vi.mocked(mockCreateServerClient).mockReturnValue(mockClient as any)

      const mockRequest = new Request('http://localhost:3000', {
        headers: { cookie: 'test-cookie=test-value' }
      })
      const mockResponse = new Response()

      // Act  
      const { createMiddlewareClient } = await import('./supabase')
      createMiddlewareClient(mockRequest, mockResponse)

      // Get the cookies configuration
      const cookiesConfig = vi.mocked(mockCreateServerClient).mock.calls[0][2]?.cookies

      // Test cookie get from request
      const cookieValue = cookiesConfig?.get?.('test-cookie')
      expect(cookieValue).toBe('test-value')

      // Test cookie set on response (should not throw)
      expect(() => {
        cookiesConfig?.set?.('new-cookie', 'new-value', { httpOnly: true })
      }).not.toThrow()
    })
  })

  describe('Client Configuration', () => {
    it('should use environment variables for all clients', async () => {
      // Arrange
      const mockClient = { auth: { getSession: vi.fn() } }
      const { createBrowserClient: mockCreateBrowserClient, createServerClient: mockCreateServerClient } = await import('@supabase/ssr')
      vi.mocked(mockCreateBrowserClient).mockReturnValue(mockClient as any)
      vi.mocked(mockCreateServerClient).mockReturnValue(mockClient as any)

      // Act
      const { createBrowserClient, createServerClient } = await import('./supabase')
      createBrowserClient()
      createServerClient({ get: vi.fn(), set: vi.fn(), remove: vi.fn() })

      // Assert - Both calls should use same env variables
      expect(mockCreateBrowserClient).toHaveBeenCalledWith(
        'https://test.supabase.co',
        'test-anon-key'
      )
      expect(mockCreateServerClient).toHaveBeenCalledWith(
        'https://test.supabase.co', 
        'test-anon-key',
        expect.any(Object)
      )
    })

    it('should create different client instances', async () => {
      // Arrange
      const mockBrowserClient = { auth: { getSession: vi.fn() }, type: 'browser' }
      const mockServerClient = { auth: { getSession: vi.fn() }, type: 'server' }
      const { createBrowserClient: mockCreateBrowserClient, createServerClient: mockCreateServerClient } = await import('@supabase/ssr')
      vi.mocked(mockCreateBrowserClient).mockReturnValue(mockBrowserClient as any)
      vi.mocked(mockCreateServerClient).mockReturnValue(mockServerClient as any)

      // Act
      const { createBrowserClient, createServerClient } = await import('./supabase')
      const browserClient = createBrowserClient()
      const serverClient = createServerClient({ get: vi.fn(), set: vi.fn(), remove: vi.fn() })

      // Assert - Should be different instances
      expect(browserClient).toBe(mockBrowserClient)
      expect(serverClient).toBe(mockServerClient)
      expect(browserClient).not.toBe(serverClient)
    })
  })
})