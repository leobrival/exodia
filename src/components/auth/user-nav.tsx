'use client'

import React from 'react'
import { useAuthStore } from '@/stores/auth'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { ThemeToggle } from '@/components/ui/theme-toggle'
import Link from 'next/link'
import { toast } from 'sonner'

export function UserNav() {
  const { user, isAuthenticated, logout, loading } = useAuthStore()

  const handleLogout = async () => {
    try {
      const result = await logout()
      if (result.success) {
        toast.success('Successfully signed out')
      } else {
        toast.error(result.error || 'Failed to sign out')
      }
    } catch (error) {
      toast.error('An unexpected error occurred')
    }
  }

  if (!isAuthenticated || !user) {
    return (
      <div className="flex items-center gap-3">
        <ThemeToggle />
        <Button variant="ghost" asChild>
          <Link href="/auth/login">Sign In</Link>
        </Button>
        <Button asChild>
          <Link href="/auth/register">Get Started</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-3">
      <ThemeToggle />
      
      <Card className="shadow-sm">
        <CardContent className="p-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
              <span className="text-sm font-semibold text-primary">
                {user.email?.[0]?.toUpperCase() || 'U'}
              </span>
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-medium text-foreground">
                {user.email}
              </span>
              <span className="text-xs text-muted-foreground">
                {user.user_metadata?.full_name || 'User'}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Button 
        variant="outline" 
        onClick={handleLogout}
        disabled={loading}
        size="sm"
      >
        {loading ? 'Signing out...' : 'Sign Out'}
      </Button>
    </div>
  )
}

interface AuthGuardProps {
  children: React.ReactNode
  fallback?: React.ReactNode
}

export function AuthGuard({ children, fallback }: AuthGuardProps) {
  const { isAuthenticated, initialized } = useAuthStore()

  if (!initialized) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <Skeleton className="h-8 w-8 rounded-full mx-auto" />
          <Skeleton className="h-4 w-20 mx-auto" />
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return fallback || (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md shadow-lg">
          <CardContent className="p-6 text-center space-y-4">
            <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
              <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <div>
              <h2 className="text-xl font-semibold">Authentication Required</h2>
              <p className="text-muted-foreground mt-2">
                Please sign in to access this page
              </p>
            </div>
            <div className="flex gap-3 justify-center">
              <Button variant="outline" asChild>
                <Link href="/auth/login">Sign In</Link>
              </Button>
              <Button asChild>
                <Link href="/auth/register">Create Account</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return <>{children}</>
}