'use client'

import React, { useEffect } from 'react'
import { useAuthParams } from '@/hooks/use-auth-params'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

interface AuthErrorAlertProps {
  showToast?: boolean
  className?: string
}

export function AuthErrorAlert({ showToast = false, className }: AuthErrorAlertProps) {
  const { hasError, errorMessage, clearError } = useAuthParams()

  // Optionnellement afficher un toast pour les erreurs
  useEffect(() => {
    if (showToast && hasError && errorMessage) {
      toast.error(errorMessage, {
        duration: 6000,
        action: {
          label: 'Fermer',
          onClick: clearError,
        },
      })
    }
  }, [hasError, errorMessage, showToast, clearError])

  // Ne pas afficher d'alerte si pas d'erreur
  if (!hasError || !errorMessage) {
    return null
  }

  return (
    <Alert variant="destructive" className={className}>
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      <AlertDescription className="flex items-center justify-between">
        <span>{errorMessage}</span>
        <Button
          variant="ghost"
          size="sm"
          onClick={clearError}
          className="ml-4 h-auto p-1 text-destructive-foreground hover:bg-destructive/20"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </Button>
      </AlertDescription>
    </Alert>
  )
}

// Composant d'erreur inline plus discret
export function AuthErrorInline({ className }: { className?: string }) {
  const { hasError, errorMessage, clearError } = useAuthParams()

  if (!hasError || !errorMessage) {
    return null
  }

  return (
    <div className={`text-sm text-destructive flex items-center gap-2 ${className}`}>
      <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      <span className="flex-1">{errorMessage}</span>
      <button
        onClick={clearError}
        className="text-destructive hover:text-destructive/80 transition-colors"
        aria-label="Fermer l'erreur"
      >
        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  )
}