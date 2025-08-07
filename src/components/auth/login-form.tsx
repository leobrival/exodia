'use client'

import React, { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { useAuthStore } from '@/stores/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form'
import { cn } from '@/lib/utils'
import Link from 'next/link'

// Form validation schema
const loginSchema = z.object({
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Invalid email format'),
})

type LoginFormData = z.infer<typeof loginSchema>

interface LoginFormProps {
  redirectTo?: string
  className?: string
}

export function LoginForm({ redirectTo, className }: LoginFormProps) {
  const { login, loading } = useAuthStore()
  const [isEmailSent, setIsEmailSent] = useState(false)
  const [sentEmail, setSentEmail] = useState('')
  const [resendCountdown, setResendCountdown] = useState(0)

  const form = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
    },
  })

  // Countdown timer for resend functionality
  useEffect(() => {
    if (resendCountdown > 0) {
      const timer = setTimeout(() => {
        setResendCountdown(resendCountdown - 1)
      }, 1000)
      return () => clearTimeout(timer)
    }
  }, [resendCountdown])

  const onSubmit = async (data: LoginFormData) => {
    try {
      const result = await login(data.email, redirectTo)
      
      if (result.success) {
        setIsEmailSent(true)
        setSentEmail(data.email)
        toast.success(
          `Magic link sent! Please check your email at ${data.email} and click the link to sign in.`
        )
      } else {
        toast.error(result.error || 'Failed to send magic link')
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        // This shouldn't happen as validation is handled by react-hook-form
        toast.error('Please check your email format')
      } else {
        toast.error('An unexpected error occurred')
      }
    }
  }

  const handleResend = async () => {
    if (resendCountdown > 0) return

    try {
      const result = await login(sentEmail, redirectTo)
      
      if (result.success) {
        setResendCountdown(60) // 60 second countdown
        toast.success('Magic link sent again!')
      } else {
        toast.error(result.error || 'Failed to resend magic link')
      }
    } catch (error) {
      toast.error('Failed to resend magic link')
    }
  }

  if (isEmailSent) {
    return (
      <Card className={cn('w-full max-w-md mx-auto', className)}>
        <CardHeader className="text-center space-y-4">
          <div className="mx-auto w-16 h-16 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <CardTitle className="text-2xl">Check your email</CardTitle>
          <CardDescription className="text-base">
            We've sent a magic link to<br />
            <strong className="text-foreground">{sentEmail}</strong>
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <Alert className="border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-900/20">
            <svg className="w-4 h-4 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <AlertDescription className="text-blue-800 dark:text-blue-200 ml-2">
              Click the link in your email to sign in. You can safely close this tab.
            </AlertDescription>
          </Alert>
          
          <div className="text-center space-y-3">
            <p className="text-sm text-muted-foreground">
              Didn't receive the email?
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={handleResend}
              disabled={resendCountdown > 0 || loading}
              className="min-w-[120px]"
            >
              {resendCountdown > 0 ? `Resend in ${resendCountdown}s` : 'Resend magic link'}
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={cn('w-full max-w-md mx-auto shadow-lg', className)}>
      <CardHeader className="text-center space-y-4">
        <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
          <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        </div>
        <div>
          <CardTitle className="text-2xl font-bold">Welcome back</CardTitle>
          <CardDescription className="text-base mt-2">
            Enter your email to receive a magic link
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4" role="form">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium">Email address</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      type="email"
                      placeholder="name@example.com"
                      disabled={loading}
                      required
                      className="h-11 text-base"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <Button 
              type="submit" 
              className="w-full h-11 text-base font-medium" 
              disabled={loading}
            >
              {loading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Sending magic link...
                </>
              ) : (
                'Send Magic Link'
              )}
            </Button>
          </form>
        </Form>
        
        <div className="text-center space-y-4">
          <div className="text-sm">
            <p className="text-muted-foreground">
              Don't have an account?{' '}
              <Link 
                href="/auth/register" 
                className="text-primary hover:underline font-medium"
              >
                Create one here
              </Link>
            </p>
          </div>
          <p className="text-xs text-muted-foreground">
            By continuing, you agree to our terms of service and privacy policy
          </p>
        </div>
      </CardContent>
    </Card>
  )
}