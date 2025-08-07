import { createBrowserClient } from '@/lib/supabase'
import { logError, serializeError, withErrorHandling } from '@/lib/utils/error-handling'

export interface Project {
  id: string
  organization_id: string
  name: string
  description?: string
  slug: string
  status: 'active' | 'archived' | 'draft'
  created_by: string
  created_at: string
  updated_at: string
}

export interface Organization {
  id: string
  name: string
  slug: string
  subscription_status: string
  created_by: string
  created_at: string
  updated_at: string
}

export interface CreateProjectData {
  name: string
  description?: string
  organization_id: string
}

export interface CreateOrgRpcResult {
  organization_id: string
  success: boolean
}

// Fonction utilitaire pour créer un slug à partir d'un nom
export function createSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '') // Supprimer caractères spéciaux
    .replace(/\s+/g, '-') // Remplacer espaces par tirets
    .replace(/-+/g, '-') // Éviter tirets multiples
    .slice(0, 50) // Limiter longueur
}

// Récupérer tous les projets de l'utilisateur  
export async function getUserProjects(userId?: string): Promise<{ data: Project[] | null; error: any }> {
  const result = await withErrorHandling(async () => {
    const supabase = createBrowserClient()

    let currentUserId = userId
    
    // Fallback to Supabase auth if userId not provided (backwards compatibility)
    if (!currentUserId) {
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      
      if (authError) {
        const serializedError = logError('getUserProjects:auth', authError, { step: 'authentication' })
        throw new Error(`Authentication failed: ${serializedError.message}`)
      }
      
      if (!user) {
        console.error('[getUserProjects] No authenticated user found')
        throw new Error('No authenticated user')
      }
      
      currentUserId = user.id
    }

    // Optimized query with only essential fields for list view
    const { data, error } = await supabase
      .from('projects')
      .select(`
        id,
        organization_id,
        name,
        slug,
        status,
        created_at,
        updated_at
      `)
      .eq('created_by', currentUserId)
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(50) // Add reasonable limit for initial load

    console.log('[getUserProjects] Query result:', { dataCount: data?.length || 0, error })
    
    if (error) {
      const serializedError = logError('getUserProjects:query', error, { 
        step: 'database_query',
        userId: currentUserId
      })
      throw new Error(`Database query failed: ${serializedError.message}`)
    }

    return data || []
  }, 'getUserProjects')
  
  return { data: result.data as Project[] | null, error: result.error }
}

// Récupérer les organisations de l'utilisateur
export async function getUserOrganizations(): Promise<{ data: Organization[] | null; error: any }> {
  const result = await withErrorHandling(async () => {
    const supabase = createBrowserClient()

    console.log('[getUserOrganizations] Fetching organizations for user...')
    
    // Vérifier l'authentification
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError) {
      const serializedError = logError('getUserOrganizations:auth', authError, { step: 'authentication' })
      throw new Error(`Authentication failed: ${serializedError.message}`)
    }
    
    if (!user) {
      console.error('[getUserOrganizations] No authenticated user')
      throw new Error('No authenticated user')
    }
    
    console.log('[getUserOrganizations] Current user:', user.id)

    // SIMPLIFIED: Get organizations created by the user directly
    // This avoids RLS issues and is the most straightforward approach
    const { data, error } = await supabase
      .from('organizations')
      .select(`
        id,
        name,
        slug,
        subscription_status,
        created_by,
        created_at,
        updated_at
      `)
      .eq('created_by', user.id)
      .order('created_at', { ascending: false })

    console.log('[getUserOrganizations] Query result:', { dataCount: data?.length || 0, error })
    
    if (error) {
      const serializedError = logError('getUserOrganizations:query', error, { 
        step: 'database_query',
        userId: user.id
      })
      throw new Error(`Database query failed: ${serializedError.message}`)
    }

    return data || []
  }, 'getUserOrganizations')
  
  return { data: result.data as Organization[] | null, error: result.error }
}

// Créer une nouvelle organisation par défaut pour l'utilisateur
export async function createDefaultOrganization(userId: string, userEmail: string): Promise<{ data: Organization | null; error: any }> {
  const result = await withErrorHandling(async () => {
    console.log('[createDefaultOrganization] Starting with:', { userId, userEmail })
    
    const supabase = createBrowserClient()

    // Vérifier l'authentification
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    console.log('[createDefaultOrganization] Auth check:', { user: user?.id, authError })
    
    if (authError) {
      const serializedError = logError('createDefaultOrganization:auth', authError, { 
        step: 'authentication',
        userId,
        userEmail 
      })
      throw new Error(`Authentication failed: ${serializedError.message}`)
    }
    
    if (!user) {
      console.error('[createDefaultOrganization] No authenticated user')
      throw new Error('No authenticated user')
    }
    
    if (user.id !== userId) {
      console.error('[createDefaultOrganization] User ID mismatch:', { expected: userId, actual: user.id })
      throw new Error('User ID mismatch - authentication error')
    }

    // Vérifier si l'utilisateur a déjà une organisation
    const { data: existingOrgs } = await getUserOrganizations()
    if (existingOrgs && existingOrgs.length > 0) {
      console.log('[createDefaultOrganization] User already has organizations:', existingOrgs.length)
      return existingOrgs[0] // Return first organization
    }

    // Nom par défaut basé sur l'email
    const orgName = `${userEmail.split('@')[0]}'s Organization`
    let orgSlug = createSlug(orgName)
    
    // Ensure unique slug
    let counter = 1
    while (true) {
      const { data: existing } = await supabase
        .from('organizations')
        .select('id')
        .eq('slug', orgSlug)
        .single()
      
      if (!existing) break
      
      orgSlug = `${createSlug(orgName)}-${counter}`
      counter++
    }
    
    console.log('[createDefaultOrganization] Creating org with:', { orgName, orgSlug, userId })

    // Use RPC for atomic transaction
    const { data: result, error: rpcError } = await supabase.rpc('create_organization_with_admin', {
      p_name: orgName,
      p_slug: orgSlug,
      p_user_id: userId
    })

    if (rpcError) {
      const serializedError = logError('createDefaultOrganization:rpc', rpcError, {
        step: 'create_organization_rpc',
        orgName,
        orgSlug,
        userId
      })
      throw new Error(`Organization creation failed: ${serializedError.message}`)
    }

    const rpcResult = result as CreateOrgRpcResult
    if (!rpcResult || !rpcResult.organization_id) {
      throw new Error('Organization creation returned no data')
    }

    // Fetch the created organization
    const { data: orgData, error: fetchError } = await supabase
      .from('organizations')
      .select('*')
      .eq('id', rpcResult.organization_id)
      .single()

    if (fetchError) {
      const serializedError = logError('createDefaultOrganization:fetch', fetchError, {
        step: 'fetch_created_organization',
        organizationId: rpcResult.organization_id
      })
      throw new Error(`Failed to fetch created organization: ${serializedError.message}`)
    }

    console.log('[createDefaultOrganization] Success! Organization and membership created:', orgData.id)
    return orgData as unknown as Organization
  }, 'createDefaultOrganization', { userId, userEmail })
  
  return { data: result.data as Organization | null, error: result.error }
}

// Créer un nouveau projet
export async function createProject(projectData: CreateProjectData): Promise<{ data: Project | null; error: any }> {
  const result = await withErrorHandling(async () => {
    const supabase = createBrowserClient()
    
    console.log('[createProject] Starting with:', projectData)

    // Vérifier l'authentification
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError) {
      const serializedError = logError('createProject:auth', authError, { step: 'authentication' })
      throw new Error(`Authentication failed: ${serializedError.message}`)
    }
    
    if (!user) {
      throw new Error('No authenticated user')
    }
    
    console.log('[createProject] Current user:', user.id)

    // Générer un slug unique
    const baseSlug = createSlug(projectData.name)
    let slug = baseSlug
    let counter = 1

    // Vérifier l'unicité du slug dans l'organisation
    while (true) {
      const { data: existing } = await supabase
        .from('projects')
        .select('id')
        .eq('organization_id', projectData.organization_id)
        .eq('slug', slug)
        .single()

      if (!existing) break
      
      slug = `${baseSlug}-${counter}`
      counter++
    }
    
    console.log('[createProject] Using slug:', slug)

    const { data, error } = await supabase
      .from('projects')
      .insert({
        name: projectData.name,
        description: projectData.description || null,
        slug,
        organization_id: projectData.organization_id,
        created_by: user.id,
      })
      .select()
      .single()
      
    console.log('[createProject] Insert result:', { data: !!data, error })

    if (error) {
      const serializedError = logError('createProject:insert', error, {
        step: 'database_insert',
        projectData,
        slug,
        userId: user.id
      })
      throw new Error(`Project creation failed: ${serializedError.message}`)
    }
    
    if (!data) {
      throw new Error('Project creation returned no data')
    }
    
    console.log('[createProject] Success! Project created:', data.id)
    return data as unknown as Project
  }, 'createProject', projectData)
  
  return { data: result.data as Project | null, error: result.error }
}

// Mettre à jour un projet
export async function updateProject(projectId: string, updates: Partial<Pick<Project, 'name' | 'description' | 'status'>>): Promise<{ data: Project | null; error: any }> {
  const supabase = createBrowserClient()

  const { data, error } = await supabase
    .from('projects')
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq('id', projectId)
    .select()
    .single()

  return { data: data as unknown as Project | null, error }
}

// Supprimer (archiver) un projet
export async function deleteProject(projectId: string): Promise<{ error: any }> {
  const supabase = createBrowserClient()

  const { error } = await supabase
    .from('projects')
    .update({ 
      status: 'archived',
      updated_at: new Date().toISOString(),
    })
    .eq('id', projectId)

  return { error }
}

// Récupérer un projet par son ID
export async function getProjectById(projectId: string): Promise<{ data: Project | null; error: any }> {
  const result = await withErrorHandling(async () => {
    const supabase = createBrowserClient()

    console.log('[getProjectById] Fetching project:', projectId)
    
    // Vérifier l'authentification
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError) {
      const serializedError = logError('getProjectById:auth', authError, { step: 'authentication' })
      throw new Error(`Authentication failed: ${serializedError.message}`)
    }
    
    if (!user) {
      console.error('[getProjectById] No authenticated user')
      throw new Error('No authenticated user')
    }
    
    console.log('[getProjectById] Current user:', user.id)

    const { data, error } = await supabase
      .from('projects')
      .select(`
        id,
        organization_id,
        name,
        description,
        slug,
        status,
        created_by,
        created_at,
        updated_at
      `)
      .eq('id', projectId)
      .eq('status', 'active')
      .single()

    console.log('[getProjectById] Query result:', { data: !!data, error })
    
    if (error) {
      const serializedError = logError('getProjectById:query', error, { 
        step: 'database_query',
        projectId,
        userId: user.id
      })
      throw new Error(`Database query failed: ${serializedError.message}`)
    }

    return data
  }, 'getProjectById', { projectId })
  
  return { data: result.data as Project | null, error: result.error }
}

// Récupérer un projet par son slug
export async function getProjectBySlug(organizationId: string, slug: string): Promise<{ data: Project | null; error: any }> {
  const supabase = createBrowserClient()

  const { data, error } = await supabase
    .from('projects')
    .select(`
      id,
      organization_id,
      name,
      description,
      slug,
      status,
      created_by,
      created_at,
      updated_at
    `)
    .eq('organization_id', organizationId)
    .eq('slug', slug)
    .eq('status', 'active')
    .single()

  return { data: data as unknown as Project | null, error }
}