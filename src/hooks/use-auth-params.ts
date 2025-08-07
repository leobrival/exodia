'use client'

import { parseAsString, useQueryStates } from 'nuqs'
import { useMemo } from 'react'
import { getAuthErrorMessage } from '@/lib/auth-callback'

// Configuration des paramètres d'erreur avec nuqs
const authParamsConfig = {
  error: parseAsString,
  error_code: parseAsString,
  error_description: parseAsString,
  redirectTo: parseAsString,
  code: parseAsString,
}

export function useAuthParams() {
  const [params, setParams] = useQueryStates(authParamsConfig, {
    shallow: false, // Permet de gérer les paramètres côté serveur
  })

  // Calculer si il y a une erreur et le message correspondant
  const { hasError, errorMessage } = useMemo(() => {
    const hasError = Boolean(params.error || params.error_code)
    const errorMessage = hasError 
      ? getAuthErrorMessage(params.error ?? undefined, params.error_code ?? undefined, params.error_description ?? undefined)
      : undefined

    return { hasError, errorMessage }
  }, [params.error, params.error_code, params.error_description])

  // Fonction pour nettoyer les paramètres d'erreur
  const clearError = () => {
    setParams({
      error: null,
      error_code: null,
      error_description: null,
      // Garder les autres paramètres
      redirectTo: params.redirectTo,
      code: params.code,
    })
  }

  // Fonction pour définir une erreur
  const setError = (error: string, errorCode?: string, errorDescription?: string) => {
    setParams({
      error,
      error_code: errorCode || null,
      error_description: errorDescription || null,
      // Garder les autres paramètres
      redirectTo: params.redirectTo,
      code: params.code,
    })
  }

  return {
    // Paramètres bruts
    params,
    setParams,

    // État d'erreur calculé
    hasError,
    errorMessage,
    
    // Actions
    clearError,
    setError,
  }
}