import { createBrowserClient } from '@/lib/supabase'
import { logError, withErrorHandling } from '@/lib/utils/error-handling'

export interface ProjectNote {
  id: string
  project_id: string
  title: string
  content: string
  tags?: string[]
  embedding?: number[]
  is_active: boolean
  created_by: string
  created_at: string
  updated_at: string
}

export interface CreateNoteData {
  project_id: string
  title: string
  content: string
  tags?: string[]
  is_active?: boolean
}

export interface UpdateNoteData {
  title?: string
  content?: string
  tags?: string[]
  is_active?: boolean
}

// Récupérer toutes les notes d'un projet
export async function getProjectNotes(projectId: string): Promise<{ data: ProjectNote[] | null; error: any }> {
  const result = await withErrorHandling(async () => {
    const supabase = createBrowserClient()

    console.log('[getProjectNotes] Fetching notes for project:', projectId)
    
    // Vérifier l'authentification
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError) {
      const serializedError = logError('getProjectNotes:auth', authError, { step: 'authentication' })
      throw new Error(`Authentication failed: ${serializedError.message}`)
    }
    
    if (!user) {
      console.error('[getProjectNotes] No authenticated user')
      throw new Error('No authenticated user')
    }
    
    console.log('[getProjectNotes] Current user:', user.id)

    const { data, error } = await supabase
      .from('project_notes')
      .select(`
        id,
        project_id,
        title,
        content,
        tags,
        is_active,
        created_by,
        created_at,
        updated_at
      `)
      .eq('project_id', projectId)
      .order('created_at', { ascending: false })

    console.log('[getProjectNotes] Query result:', { dataCount: data?.length || 0, error })
    
    if (error) {
      const serializedError = logError('getProjectNotes:query', error, { 
        step: 'database_query',
        projectId,
        userId: user.id
      })
      throw new Error(`Database query failed: ${serializedError.message}`)
    }

    return data || []
  }, 'getProjectNotes', { projectId })
  
  return { data: result.data as ProjectNote[] | null, error: result.error }
}

// Créer une nouvelle note
export async function createNote(noteData: CreateNoteData): Promise<{ data: ProjectNote | null; error: any }> {
  const result = await withErrorHandling(async () => {
    const supabase = createBrowserClient()
    
    console.log('[createNote] Starting note creation process:', {
      project_id: noteData.project_id,
      title: noteData.title,
      content_length: noteData.content.length,
      tags_count: noteData.tags?.length || 0,
      is_active: noteData.is_active
    })

    // Vérifier l'authentification
    console.log('[DEBUG] Checking user authentication...')
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError) {
      console.error('[DEBUG] Authentication error:', authError)
      const serializedError = logError('createNote:auth', authError, { step: 'authentication' })
      throw new Error(`Authentication failed: ${serializedError.message}`)
    }
    
    if (!user) {
      console.error('[DEBUG] No authenticated user found')
      throw new Error('No authenticated user')
    }
    
    console.log('[DEBUG] User authenticated successfully:', {
      userId: user.id,
      userEmail: user.email
    })

    // Vérifier l'accès au projet
    console.log('[DEBUG] Checking project access for user...')
    const { data: projectAccess, error: projectError } = await supabase
      .from('projects')
      .select(`
        id,
        organization_id,
        organizations!inner(
          organization_members!inner(
            user_id,
            role,
            invitation_status
          )
        )
      `)
      .eq('id', noteData.project_id)
      .eq('organizations.organization_members.user_id', user.id)
      .eq('organizations.organization_members.invitation_status', 'accepted')
      .single()

    if (projectError) {
      console.error('[DEBUG] Project access check failed:', {
        error: projectError,
        projectId: noteData.project_id,
        userId: user.id
      })
    }

    if (!projectAccess) {
      console.error('[DEBUG] User does not have access to project:', {
        projectId: noteData.project_id,
        userId: user.id
      })
      throw new Error('Access denied: User does not have access to this project')
    }

    console.log('[DEBUG] Project access verified:', {
      projectId: projectAccess.id,
      organizationId: projectAccess.organization_id
    })

    // Préparer les données d'insertion
    const insertData = {
      project_id: noteData.project_id,
      title: noteData.title,
      content: noteData.content,
      tags: noteData.tags || [],
      is_active: noteData.is_active ?? true,
      created_by: user.id,
    }

    console.log('[DEBUG] Preparing database insertion with data:', {
      ...insertData,
      content: insertData.content.substring(0, 100) + '...'
    })

    const { data, error } = await supabase
      .from('project_notes')
      .insert(insertData)
      .select()
      .single()
      
    console.log('[DEBUG] Database insertion result:', {
      success: !!data,
      hasError: !!error,
      dataPresent: !!data
    })

    if (error) {
      console.error('[DEBUG] Database insertion error details:', {
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint,
        insertData: {
          ...insertData,
          content: insertData.content.substring(0, 100) + '...'
        }
      })
      
      const serializedError = logError('createNote:insert', error, {
        step: 'database_insert',
        noteData: {
          ...noteData,
          content: noteData.content.substring(0, 100) + '...'
        },
        userId: user.id
      })
      throw new Error(`Note creation failed: ${serializedError.message}`)
    }
    
    if (!data) {
      console.error('[DEBUG] Database returned null data after insertion')
      throw new Error('Note creation returned no data')
    }
    
    console.log('[DEBUG] Note created successfully in database:', {
      noteId: data.id,
      title: data.title,
      project_id: data.project_id,
      is_active: data.is_active,
      created_by: data.created_by,
      created_at: data.created_at
    })
    
    // TODO: Générer l'embedding pour le RAG
    // if (data.is_active) {
    //   await generateNoteEmbedding(data.id, data.title + ' ' + data.content);
    // }
    
    console.log('[createNote] Note creation process completed successfully for note ID:', data.id)
    
    return data as unknown as ProjectNote
  }, 'createNote', {
    ...noteData,
    content: noteData.content.substring(0, 100) + '...'
  })
  
  return { data: result.data as ProjectNote | null, error: result.error }
}

// Mettre à jour une note
export async function updateNote(noteId: string, updates: UpdateNoteData): Promise<{ data: ProjectNote | null; error: any }> {
  const result = await withErrorHandling(async () => {
    const supabase = createBrowserClient()

    console.log('[updateNote] Updating note:', { noteId, updates })

    const { data, error } = await supabase
      .from('project_notes')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', noteId)
      .select()
      .single()

    if (error) {
      const serializedError = logError('updateNote:update', error, {
        step: 'database_update',
        noteId,
        updates
      })
      throw new Error(`Note update failed: ${serializedError.message}`)
    }

    console.log('[updateNote] Success! Note updated:', noteId)
    
    // TODO: Régénérer l'embedding si le contenu a changé
    // if (updates.title || updates.content) {
    //   const noteContent = (updates.title || data.title) + ' ' + (updates.content || data.content);
    //   await generateNoteEmbedding(noteId, noteContent);
    // }

    return data as unknown as ProjectNote
  }, 'updateNote', { noteId, updates })
  
  return { data: result.data as ProjectNote | null, error: result.error }
}

// Supprimer une note
export async function deleteNote(noteId: string): Promise<{ error: any }> {
  const result = await withErrorHandling(async () => {
    const supabase = createBrowserClient()

    console.log('[deleteNote] Deleting note:', noteId)

    const { error } = await supabase
      .from('project_notes')
      .delete()
      .eq('id', noteId)

    if (error) {
      const serializedError = logError('deleteNote:delete', error, {
        step: 'database_delete',
        noteId
      })
      throw new Error(`Note deletion failed: ${serializedError.message}`)
    }

    console.log('[deleteNote] Success! Note deleted:', noteId)
    return null
  }, 'deleteNote', { noteId })
  
  return { error: result.error }
}

// Basculer le statut actif d'une note
export async function toggleNoteActive(noteId: string, isActive: boolean): Promise<{ data: ProjectNote | null; error: any }> {
  return updateNote(noteId, { is_active: isActive })
}

// Récupérer les notes actives d'un projet (pour le RAG)
export async function getActiveProjectNotes(projectId: string): Promise<{ data: ProjectNote[] | null; error: any }> {
  const result = await withErrorHandling(async () => {
    const supabase = createBrowserClient()

    console.log('[getActiveProjectNotes] Fetching active notes for project:', projectId)

    const { data, error } = await supabase
      .from('project_notes')
      .select(`
        id,
        project_id,
        title,
        content,
        tags,
        embedding,
        created_at,
        updated_at
      `)
      .eq('project_id', projectId)
      .eq('is_active', true)
      .order('created_at', { ascending: false })

    if (error) {
      const serializedError = logError('getActiveProjectNotes:query', error, { 
        step: 'database_query',
        projectId
      })
      throw new Error(`Database query failed: ${serializedError.message}`)
    }

    return data || []
  }, 'getActiveProjectNotes', { projectId })
  
  return { data: result.data as ProjectNote[] | null, error: result.error }
}