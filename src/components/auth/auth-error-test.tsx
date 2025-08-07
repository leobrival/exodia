'use client'

import React from 'react'
import { useAuthParams } from '@/hooks/use-auth-params'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { AUTH_ERROR_MESSAGES } from '@/lib/auth-callback'

export function AuthErrorTest() {
  const { setError, clearError, hasError, errorMessage } = useAuthParams()

  const testErrors = [
    { key: 'access_denied', description: 'Accès refusé par l\'utilisateur' },
    { key: 'otp_expired', description: 'Lien magique expiré' },
    { key: 'invalid_request', description: 'Requête invalide' },
    { key: 'invalid_token', description: 'Token invalide' },
    { key: 'server_error', description: 'Erreur serveur' },
    { key: 'rate_limit_exceeded', description: 'Limite de taux dépassée' },
    { key: 'signup_disabled', description: 'Inscription désactivée' },
    { key: 'email_not_confirmed', description: 'Email non confirmé' },
  ]

  if (process.env.NODE_ENV !== 'development') {
    return null
  }

  return (
    <Card className="w-full max-w-md mx-auto mt-8">
      <CardHeader>
        <CardTitle className="text-lg">Test des erreurs d'authentification</CardTitle>
        <p className="text-sm text-muted-foreground">
          (Visible uniquement en développement)
        </p>
      </CardHeader>
      <CardContent className="space-y-3">
        {hasError && (
          <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-md">
            <p className="text-sm font-medium text-destructive">Erreur active :</p>
            <p className="text-sm text-destructive/80">{errorMessage}</p>
            <Button 
              size="sm" 
              variant="outline" 
              onClick={clearError}
              className="mt-2 h-7 text-xs"
            >
              Effacer
            </Button>
          </div>
        )}

        <div className="grid grid-cols-1 gap-2">
          {testErrors.map(({ key, description }) => (
            <Button
              key={key}
              variant="ghost"
              size="sm"
              onClick={() => setError(key, key, description)}
              className="justify-start text-xs h-8"
            >
              {key}
            </Button>
          ))}
        </div>

        <div className="pt-3 border-t">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setError(
              'access_denied',
              'otp_expired', 
              'Email link is invalid or has expired'
            )}
            className="w-full text-xs"
          >
            Tester l'exemple utilisateur
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}