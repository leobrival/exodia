import { LoginForm } from '@/components/auth/login-form'
import { AuthErrorAlert } from '@/components/auth/auth-error-alert'
import { AuthErrorTest } from '@/components/auth/auth-error-test'
import { Metadata } from 'next'

interface LoginPageProps {
  searchParams: Promise<{
    redirectTo?: string
  }>
}

export const metadata: Metadata = {
  title: 'Connexion - Exodia',
  description: 'Connectez-vous à votre compte Exodia pour gérer vos appels à projets',
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams
  
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-background to-muted/20">
      <div className="w-full max-w-md space-y-4">
        <AuthErrorAlert className="w-full" />
        <LoginForm 
          redirectTo={params.redirectTo} 
          className="w-full"
        />
        <AuthErrorTest />
      </div>
    </div>
  )
}