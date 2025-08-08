/**
 * Server-side error handling utilities for server actions
 * This file does not use 'use client' directive and is safe for server actions
 */

export interface SerializedError {
  message: string
  code?: string
  details?: string
  hint?: string
  status?: number
  statusCode?: number
  statusText?: string
  stack?: string
  name?: string
  cause?: unknown
}

/**
 * Properly serialize any error object, including Supabase errors with non-enumerable properties
 */
export function serializeError(error: unknown): SerializedError {
  if (!error) {
    return { message: 'Unknown error occurred' }
  }

  // Handle string errors
  if (typeof error === 'string') {
    return { message: error }
  }

  // Handle Error objects and Supabase errors
  if (error instanceof Error || (typeof error === 'object' && error !== null)) {
    const serialized: SerializedError = {
      message: 'message' in error && typeof error.message === 'string' 
        ? error.message 
        : 'Unknown error occurred'
    }

    // Capture common error properties
    const errorObj = error as any
    
    // Standard Error properties
    if ('name' in errorObj && typeof errorObj.name === 'string') {
      serialized.name = errorObj.name
    }
    
    if ('stack' in errorObj && typeof errorObj.stack === 'string') {
      serialized.stack = errorObj.stack
    }
    
    if ('cause' in errorObj) {
      serialized.cause = errorObj.cause
    }

    // Supabase specific properties
    if ('code' in errorObj && typeof errorObj.code === 'string') {
      serialized.code = errorObj.code
    }
    
    if ('details' in errorObj && typeof errorObj.details === 'string') {
      serialized.details = errorObj.details
    }
    
    if ('hint' in errorObj && typeof errorObj.hint === 'string') {
      serialized.hint = errorObj.hint
    }

    // HTTP status properties
    if ('status' in errorObj && typeof errorObj.status === 'number') {
      serialized.status = errorObj.status
    }
    
    if ('statusCode' in errorObj && typeof errorObj.statusCode === 'number') {
      serialized.statusCode = errorObj.statusCode
    }
    
    if ('statusText' in errorObj && typeof errorObj.statusText === 'string') {
      serialized.statusText = errorObj.statusText
    }

    return serialized
  }

  // Handle other types
  return { 
    message: `Unexpected error type: ${typeof error}`,
    details: String(error)
  }
}

/**
 * Server-side logging function that properly handles all error types
 */
export function logError(context: string, error: unknown, additionalData?: Record<string, any>) {
  const serializedError = serializeError(error)
  
  const logData = {
    context,
    error: serializedError,
    timestamp: new Date().toISOString(),
    ...additionalData
  }
  
  console.error(`[${context}] Error:`, logData)
  return serializedError
}

/**
 * Create a user-friendly error message from any error
 */
export function getUserFriendlyErrorMessage(error: unknown): string {
  const serialized = serializeError(error)
  
  // Handle specific error codes
  if (serialized.code) {
    switch (serialized.code) {
      case 'PGRST116':
        return 'No data found or access denied'
      case 'PGRST301':
        return 'Access denied - insufficient permissions'
      case '23505':
        return 'This item already exists'
      case '23503':
        return 'Cannot complete operation - missing required data'
      case '42501':
        return 'Access denied - insufficient permissions'
      default:
        if (serialized.message && serialized.message !== 'Unknown error occurred') {
          return serialized.message
        }
    }
  }
  
  // Fallback to message or generic error
  return serialized.message || 'An unexpected error occurred'
}

/**
 * Enhanced database operation wrapper with proper error handling for server actions
 */
export async function withErrorHandling<T>(
  operation: () => Promise<T>,
  context: string,
  additionalData?: Record<string, any>
): Promise<{ data: T | null; error: SerializedError | null }> {
  try {
    const data = await operation()
    return { data, error: null }
  } catch (error) {
    const serializedError = logError(context, error, additionalData)
    return { data: null, error: serializedError }
  }
}