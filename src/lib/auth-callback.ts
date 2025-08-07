import { z } from 'zod'

// Schema pour valider les paramètres d'erreur du callback auth
export const authCallbackErrorSchema = z.object({
  error: z.string().optional(),
  error_code: z.string().optional(),
  error_description: z.string().optional(),
  code: z.string().optional(),
  next: z.string().optional(),
})

export type AuthCallbackParams = z.infer<typeof authCallbackErrorSchema>

// Messages d'erreur traduits et user-friendly
export const AUTH_ERROR_MESSAGES = {
  access_denied: 'Accès refusé. Vous avez annulé la connexion.',
  otp_expired: 'Le lien de connexion a expiré. Demandez un nouveau lien.',
  invalid_request: 'Demande non valide. Veuillez réessayer.',
  invalid_token: 'Token de sécurité invalide. Demandez un nouveau lien.',
  server_error: 'Erreur serveur temporaire. Veuillez réessayer.',
  rate_limit_exceeded: 'Trop de tentatives. Attendez quelques minutes avant de réessayer.',
  signup_disabled: 'Les inscriptions sont actuellement désactivées.',
  email_not_confirmed: 'Votre email n\'a pas été confirmé. Vérifiez votre boîte mail.',
} as const

export type AuthErrorCode = keyof typeof AUTH_ERROR_MESSAGES

// Fonction pour obtenir un message d'erreur user-friendly
export function getAuthErrorMessage(error?: string, errorCode?: string, errorDescription?: string): string {
  // Priorité : error_code, puis error, puis error_description, puis message générique
  if (errorCode && errorCode in AUTH_ERROR_MESSAGES) {
    return AUTH_ERROR_MESSAGES[errorCode as AuthErrorCode]
  }
  
  if (error && error in AUTH_ERROR_MESSAGES) {
    return AUTH_ERROR_MESSAGES[error as AuthErrorCode]
  }
  
  if (errorDescription) {
    // Décoder et nettoyer la description d'erreur
    const decoded = decodeURIComponent(errorDescription.replace(/\+/g, ' '))
    return `Erreur d'authentification : ${decoded}`
  }
  
  return 'Une erreur inattendue s\'est produite lors de la connexion.'
}

// Fonction pour parser et valider les paramètres d'URL
export function parseAuthCallbackParams(searchParams: URLSearchParams): {
  params: AuthCallbackParams
  hasError: boolean
  errorMessage?: string
} {
  const rawParams = Object.fromEntries(searchParams.entries())
  
  try {
    const params = authCallbackErrorSchema.parse(rawParams)
    const hasError = Boolean(params.error || params.error_code)
    
    let errorMessage: string | undefined
    if (hasError) {
      errorMessage = getAuthErrorMessage(params.error, params.error_code, params.error_description)
    }
    
    return {
      params,
      hasError,
      errorMessage,
    }
  } catch (error) {
    return {
      params: rawParams as AuthCallbackParams,
      hasError: true,
      errorMessage: 'Paramètres de callback invalides.',
    }
  }
}

// Fonction pour extraire les paramètres depuis les hash fragments (#)
export function parseHashParams(hash: string): URLSearchParams {
  // Supprimer le # initial s'il existe
  const cleanHash = hash.startsWith('#') ? hash.slice(1) : hash
  return new URLSearchParams(cleanHash)
}