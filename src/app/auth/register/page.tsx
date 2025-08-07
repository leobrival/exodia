import { RegisterForm } from '@/components/auth/register-form'
import { AuthErrorAlert } from '@/components/auth/auth-error-alert'
import { Metadata } from 'next'

interface RegisterPageProps {
  searchParams: Promise<{
    redirectTo?: string
    invitation?: string
  }>
}

export const metadata: Metadata = {
  title: 'Créer un compte - Exodia',
  description: 'Créez votre compte Exodia pour commencer à gérer vos appels à projets',
}

export default async function RegisterPage({ searchParams }: RegisterPageProps) {
  const params = await searchParams
  
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-background to-muted/20">
      <div className="w-full max-w-md space-y-4">
        <AuthErrorAlert className="w-full" />
        <RegisterForm 
          redirectTo={params.redirectTo} 
          invitationToken={params.invitation}
          className="w-full"
        />
      </div>
    </div>
  )
}