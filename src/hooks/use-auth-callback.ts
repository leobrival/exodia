'use client'

import { useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import { parseAuthCallbackParams, parseHashParams, type AuthCallbackParams } from '@/lib/auth-callback'

export interface UseAuthCallbackReturn {
  params: AuthCallbackParams
  hasError: boolean
  errorMessage?: string
  isLoading: boolean
  clearError: () => void
}

export function useAuthCallback(): UseAuthCallbackReturn {
  const searchParams = useSearchParams()
  const [hashParams, setHashParams] = useState<URLSearchParams | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Parser les paramètres de l'URL et du hash
  useEffect(() => {
    // Récupérer les hash fragments côté client uniquement
    if (typeof window !== 'undefined') {
      const hash = window.location.hash
      if (hash) {
        setHashParams(parseHashParams(hash))
      }
    }
    setIsLoading(false)
  }, [])

  // Combiner les search params et hash params
  const combinedParams = new URLSearchParams()
  
  // Ajouter les search params
  searchParams.forEach((value, key) => {
    combinedParams.set(key, value)
  })
  
  // Ajouter les hash params (priorité sur search params)
  if (hashParams) {
    hashParams.forEach((value, key) => {
      combinedParams.set(key, value)
    })
  }

  // Parser et valider les paramètres combinés
  const { params, hasError, errorMessage } = parseAuthCallbackParams(combinedParams)

  const clearError = () => {
    // Nettoyer l'URL des paramètres d'erreur
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href)
      url.searchParams.delete('error')
      url.searchParams.delete('error_code')
      url.searchParams.delete('error_description')
      url.hash = '' // Nettoyer aussi le hash
      
      window.history.replaceState(null, '', url.toString())
    }
  }

  return {
    params,
    hasError,
    errorMessage,
    isLoading,
    clearError,
  }
}