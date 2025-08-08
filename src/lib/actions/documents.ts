import { createBrowserClient } from '@/lib/supabase'
import { logError, withErrorHandling } from '@/lib/utils/error-handling'

export interface Document {
  id: string
  project_id: string
  name: string
  file_type: string
  file_size: number
  file_path: string
  content_vector?: number[] // embeddings
  metadata: Record<string, any>
  status: 'processing' | 'ready' | 'error'
  error_message?: string
  uploaded_by: string
  created_at: string
  updated_at: string
}

export interface CreateDocumentData {
  project_id: string
  name: string
  file_type: string
  file_size: number
  file_path: string
  metadata?: Record<string, any>
}

// Récupérer tous les documents d'un projet
export async function getProjectDocuments(projectId: string): Promise<{ data: Document[] | null; error: any }> {
  const result = await withErrorHandling(async () => {
    const supabase = createBrowserClient()

    console.log('[getProjectDocuments] Fetching documents for project:', projectId)
    
    // Vérifier l'authentification
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError) {
      const serializedError = logError('getProjectDocuments:auth', authError, { step: 'authentication' })
      throw new Error(`Authentication failed: ${serializedError.message}`)
    }
    
    if (!user) {
      console.error('[getProjectDocuments] No authenticated user')
      throw new Error('No authenticated user')
    }
    
    console.log('[getProjectDocuments] Current user:', user.id)

    const { data, error } = await supabase
      .from('documents')
      .select(`
        id,
        project_id,
        name,
        file_type,
        file_size,
        file_path,
        metadata,
        status,
        error_message,
        uploaded_by,
        created_at,
        updated_at
      `)
      .eq('project_id', projectId)
      .order('created_at', { ascending: false })

    console.log('[getProjectDocuments] Query result:', { dataCount: data?.length || 0, error })
    
    if (error) {
      const serializedError = logError('getProjectDocuments:query', error, { 
        step: 'database_query',
        projectId,
        userId: user.id
      })
      throw new Error(`Database query failed: ${serializedError.message}`)
    }

    return data || []
  }, 'getProjectDocuments', { projectId })
  
  return { data: result.data as Document[] | null, error: result.error }
}

// Créer un nouveau document
export async function createDocument(documentData: CreateDocumentData): Promise<{ data: Document | null; error: any }> {
  const result = await withErrorHandling(async () => {
    const supabase = createBrowserClient()
    
    console.log('[createDocument] Creating document:', documentData)

    // Vérifier l'authentification
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError) {
      const serializedError = logError('createDocument:auth', authError, { step: 'authentication' })
      throw new Error(`Authentication failed: ${serializedError.message}`)
    }
    
    if (!user) {
      throw new Error('No authenticated user')
    }
    
    console.log('[createDocument] Current user:', user.id)

    const { data, error } = await supabase
      .from('documents')
      .insert({
        project_id: documentData.project_id,
        name: documentData.name,
        file_type: documentData.file_type,
        file_size: documentData.file_size,
        file_path: documentData.file_path,
        metadata: documentData.metadata || {},
        uploaded_by: user.id,
      })
      .select()
      .single()
      
    console.log('[createDocument] Insert result:', { data: !!data, error })

    if (error) {
      const serializedError = logError('createDocument:insert', error, {
        step: 'database_insert',
        documentData,
        userId: user.id
      })
      throw new Error(`Document creation failed: ${serializedError.message}`)
    }
    
    if (!data) {
      throw new Error('Document creation returned no data')
    }
    
    console.log('[createDocument] Success! Document created:', data.id)
    
    // Auto-ready pour les fichiers texte simples qui n'ont pas besoin de traitement complexe
    if (['txt', 'md'].includes(documentData.file_type.toLowerCase())) {
      console.log('[createDocument] Auto-setting text file to ready status:', data.id)
      const { data: updatedDoc, error: updateError } = await updateDocumentStatus(data.id, 'ready')
      if (!updateError && updatedDoc) {
        return updatedDoc
      }
      // Si erreur de mise à jour, continuer avec le document initial
      console.warn('[createDocument] Failed to auto-update status, returning original document:', updateError)
    }
    
    return data as unknown as Document
  }, 'createDocument', documentData)
  
  return { data: result.data as Document | null, error: result.error }
}

// Mettre à jour le statut d'un document
export async function updateDocumentStatus(documentId: string, status: Document['status'], errorMessage?: string): Promise<{ data: Document | null; error: any }> {
  const result = await withErrorHandling(async () => {
    const supabase = createBrowserClient()

    console.log('[updateDocumentStatus] Updating document:', { documentId, status, errorMessage })

    const updateData: any = { status }
    if (errorMessage) {
      updateData.error_message = errorMessage
    }

    const { data, error } = await supabase
      .from('documents')
      .update(updateData)
      .eq('id', documentId)
      .select()
      .single()

    if (error) {
      const serializedError = logError('updateDocumentStatus:update', error, {
        step: 'database_update',
        documentId,
        status,
        errorMessage
      })
      throw new Error(`Document status update failed: ${serializedError.message}`)
    }

    return data as unknown as Document
  }, 'updateDocumentStatus', { documentId, status })
  
  return { data: result.data as Document | null, error: result.error }
}

// Supprimer un document
export async function deleteDocument(documentId: string): Promise<{ error: any }> {
  const result = await withErrorHandling(async () => {
    const supabase = createBrowserClient()

    console.log('[deleteDocument] Deleting document:', documentId)

    const { error } = await supabase
      .from('documents')
      .delete()
      .eq('id', documentId)

    if (error) {
      const serializedError = logError('deleteDocument:delete', error, {
        step: 'database_delete',
        documentId
      })
      throw new Error(`Document deletion failed: ${serializedError.message}`)
    }

    console.log('[deleteDocument] Success! Document deleted:', documentId)
    return null
  }, 'deleteDocument', { documentId })
  
  return { error: result.error }
}

// Vérifier si un projet a des documents
export async function checkProjectHasSources(projectId: string): Promise<{ data: boolean; error: any }> {
  const result = await withErrorHandling(async () => {
    const supabase = createBrowserClient()

    console.log('[checkProjectHasSources] Checking project sources:', projectId)

    const { data, error } = await supabase
      .from('documents')
      .select('id')
      .eq('project_id', projectId)
      .eq('status', 'ready')
      .limit(1)
      .single()

    if (error && error.code === 'PGRST116') {
      // No rows found - pas de documents
      return false
    }

    if (error) {
      const serializedError = logError('checkProjectHasSources:query', error, {
        step: 'database_query',
        projectId
      })
      throw new Error(`Check sources query failed: ${serializedError.message}`)
    }

    return !!data
  }, 'checkProjectHasSources', { projectId })
  
  return { data: result.data as boolean, error: result.error }
}