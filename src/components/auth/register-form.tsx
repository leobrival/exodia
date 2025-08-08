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
const registerSchema = z.object({
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Invalid email format'),
  terms: z.boolean().refine((val) => val === true, {
    message: 'You must accept the terms and conditions',
  }),
})

type RegisterFormData = z.infer<typeof registerSchema>

interface RegisterFormProps {
  redirectTo?: string
  invitationToken?: string
  className?: string
}

export function RegisterForm({ redirectTo, invitationToken, className }: RegisterFormProps) {
  const { login, loading } = useAuthStore()
  const [isEmailSent, setIsEmailSent] = useState(false)
  const [sentEmail, setSentEmail] = useState('')
  const [resendCountdown, setResendCountdown] = useState(0)

  const form = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      email: '',
      terms: false,
    },
  })

  // Countdown timer for resend functionality
  useEffect(() => {
    let interval: NodeJS.Timeout
    if (resendCountdown > 0) {
      interval = setInterval(() => {
        setResendCountdown((prev) => prev - 1)
      }, 1000)
    }
    return () => clearInterval(interval)
  }, [resendCountdown])

  const onSubmit = async (data: RegisterFormData) => {
    try {
      // Build redirect URL with invitation token if provided
      let finalRedirectTo = redirectTo
      if (invitationToken) {
        const url = new URL(redirectTo || '/projects', window.location.origin)
        url.searchParams.set('invitation', invitationToken)
        finalRedirectTo = url.toString()
      }

      const result = await login(data.email, finalRedirectTo)
      
      if (result.success) {
        setIsEmailSent(true)
        setSentEmail(data.email)
        setResendCountdown(60)
        toast.success('Registration email sent! Check your inbox.')
      } else {
        toast.error(result.error || 'Registration failed')
      }
    } catch (error) {
      toast.error('An unexpected error occurred')
    }
  }

  const handleResend = async () => {
    if (resendCountdown > 0 || !sentEmail) return
    
    try {
      let finalRedirectTo = redirectTo
      if (invitationToken) {
        const url = new URL(redirectTo || '/projects', window.location.origin)
        url.searchParams.set('invitation', invitationToken)
        finalRedirectTo = url.toString()
      }

      const result = await login(sentEmail, finalRedirectTo)
      
      if (result.success) {
        setResendCountdown(60)
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
      <Card className={cn('w-full max-w-md mx-auto shadow-lg', className)}>
        <CardHeader className="text-center space-y-4">
          <div className="mx-auto w-16 h-16 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <CardTitle className="text-2xl">Check your email</CardTitle>
          <CardDescription className="text-base">
            We've sent a registration link to<br />
            <strong className="text-foreground">{sentEmail}</strong>
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <Alert className="border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-900/20">
            <svg className="w-4 h-4 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <AlertDescription className="text-blue-800 dark:text-blue-200 ml-2">
              Click the link in your email to complete your registration.
              {invitationToken && " You'll automatically join the organization you were invited to."}
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
              {resendCountdown > 0 ? `Resend in ${resendCountdown}s` : 'Resend registration link'}
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
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
          </svg>
        </div>
        <div>
          <CardTitle className="text-2xl font-bold">
            {invitationToken ? 'Join the team' : 'Create your account'}
          </CardTitle>
          <CardDescription className="text-base mt-2">
            {invitationToken 
              ? 'You\'ve been invited to join an organization' 
              : 'Enter your email to get started with Exodia'
            }
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

            <FormField
              control={form.control}
              name="terms"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                  <FormControl>
                    <input
                      type="checkbox"
                      checked={field.value}
                      onChange={field.onChange}
                      disabled={loading}
                      className="mt-1 h-4 w-4 rounded border-input text-primary focus:ring-primary"
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel className="text-sm font-normal cursor-pointer">
                      I agree to the{' '}
                      <Link href="/terms" className="text-primary hover:underline">
                        Terms of Service
                      </Link>{' '}
                      and{' '}
                      <Link href="/privacy" className="text-primary hover:underline">
                        Privacy Policy
                      </Link>
                    </FormLabel>
                    <FormMessage />
                  </div>
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
                  Creating account...
                </>
              ) : (
                invitationToken ? 'Accept Invitation' : 'Create Account'
              )}
            </Button>
          </form>
        </Form>
        
        <div className="text-center text-sm">
          <p className="text-muted-foreground">
            Already have an account?{' '}
            <Link 
              href="/auth/login" 
              className="text-primary hover:underline font-medium"
            >
              Sign in here
            </Link>
          </p>
        </div>
      </CardContent>
    </Card>
  )
}