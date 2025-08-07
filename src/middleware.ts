import { createServerClient } from '@/lib/supabase'
import { NextRequest, NextResponse } from 'next/server'

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabase = createServerClient({
    get: (key: string) => {
      const cookies = request.headers.get('cookie') || ''
      const match = cookies.match(new RegExp(`${key}=([^;]+)`))
      return match ? { value: match[1] } : null
    },
    set: (key: string, value: string, options: any) => {
      const cookieString = `${key}=${value}; ${Object.entries(options || {})
        .map(([k, v]) => `${k}=${v}`)
        .join('; ')}`
      
      response.cookies.set(key, value, options)
    },
    remove: (key: string, options: any) => {
      response.cookies.set(key, '', { ...options, expires: new Date(0) })
    },
  })

  // Check if user is authenticated
  try {
    const { data: { user }, error } = await supabase.auth.getUser()
    
    // If user is not authenticated and trying to access protected routes
    if (!user && (
      request.nextUrl.pathname.startsWith('/projects') ||
      request.nextUrl.pathname.startsWith('/organizations')
    )) {
      const loginUrl = new URL('/auth/login', request.url)
      loginUrl.searchParams.set('redirectTo', request.nextUrl.pathname)
      return NextResponse.redirect(loginUrl)
    }

    // If user is authenticated and trying to access auth pages, redirect to projects
    if (user && (
      request.nextUrl.pathname.startsWith('/auth/login') ||
      request.nextUrl.pathname.startsWith('/auth/register')
    )) {
      return NextResponse.redirect(new URL('/projects', request.url))
    }

  } catch (error) {
    console.error('Middleware auth error:', error)
    // On error, allow the request to continue to avoid breaking the app
  }

  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}