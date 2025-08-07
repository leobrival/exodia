import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { createBrowserClient as createSSRBrowserClient, createServerClient as createSSRServerClient } from '@supabase/ssr'
import { env } from '@/env'

// Types
export interface CookieStore {
  get: (key: string) => { value: string } | null
  set: (key: string, value: string, options?: any) => void
  remove: (key: string, options?: any) => void
}

// Browser client (singleton)
let browserClient: ReturnType<typeof createSupabaseClient> | null = null

export function createBrowserClient() {
  if (browserClient) {
    return browserClient
  }

  browserClient = createSSRBrowserClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  )

  return browserClient
}

// Server client (new instance each time)
export function createServerClient(cookieStore: CookieStore) {
  return createSSRServerClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        get: (key: string) => {
          const cookie = cookieStore.get(key)
          return cookie?.value
        },
        set: (key: string, value: string, options: any) => {
          cookieStore.set(key, value, options)
        },
        remove: (key: string, options: any) => {
          cookieStore.remove(key, options)
        },
      },
    }
  )
}

// Middleware client (for Next.js middleware)
export function createMiddlewareClient(request: Request, response: Response) {
  return createSSRServerClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        get: (key: string) => {
          // Get cookie from request headers
          const cookies = request.headers.get('cookie') || ''
          const match = cookies.match(new RegExp(`${key}=([^;]+)`))
          return match ? match[1] : undefined
        },
        set: (key: string, value: string, options: any) => {
          // Set cookie on response
          const cookieString = `${key}=${value}; ${Object.entries(options || {})
            .map(([k, v]) => `${k}=${v}`)
            .join('; ')}`
          
          response.headers.set('Set-Cookie', cookieString)
        },
        remove: (key: string, options: any) => {
          // Remove cookie by setting expired date
          const cookieString = `${key}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; ${Object.entries(options || {})
            .map(([k, v]) => `${k}=${v}`)
            .join('; ')}`
          
          response.headers.set('Set-Cookie', cookieString)
        },
      },
    }
  )
}