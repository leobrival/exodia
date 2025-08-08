'use server'

import { getUserOrganizations, type Project, type Organization, createSlug, type CreateProjectData } from './projects'
import { createServerClient } from '@/lib/supabase'
import { logError, withErrorHandling } from '@/lib/utils/server-error-handling'
import { cookies } from 'next/headers'

export interface QuickProjectResult {
  success: boolean
  project?: Project
  error?: string
}

export interface CreateOrgRpcResult {
  organization_id: string
  success: boolean
}

/**
 * Server-side version of getUserOrganizations for server actions
 */
async function getUserOrganizationsServer(userId: string, cookieStore: any): Promise<{ data: Organization[] | null; error: any }> {
  const result = await withErrorHandling(async () => {
    const supabase = createServerClient({
      get: (key: string) => {
        const cookie = cookieStore.get(key)
        return cookie ? { value: cookie.value } : null
      },
      set: (key: string, value: string, options?: any) => {
        cookieStore.set(key, value, options)
      },
      remove: (key: string, options?: any) => {
        cookieStore.delete(key)
      },
    })

    console.log('[getUserOrganizationsServer] Fetching organizations for user:', { userId })

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
      .eq('created_by', userId)
      .order('created_at', { ascending: false })

    console.log('[getUserOrganizationsServer] Query result:', { dataCount: data?.length || 0, error })
    
    if (error) {
      const serializedError = logError('getUserOrganizationsServer:query', error, { 
        step: 'database_query',
        userId: userId
      })
      throw new Error(`Database query failed: ${serializedError.message}`)
    }

    return data || []
  }, 'getUserOrganizationsServer', { userId })
  
  return { data: result.data as Organization[] | null, error: result.error }
}

/**
 * Server-side version of createProject for server actions
 */
async function createProjectServer(projectData: CreateProjectData, userId: string, cookieStore: any): Promise<{ data: Project | null; error: any }> {
  const result = await withErrorHandling(async () => {
    const supabase = createServerClient({
      get: (key: string) => {
        const cookie = cookieStore.get(key)
        return cookie ? { value: cookie.value } : null
      },
      set: (key: string, value: string, options?: any) => {
        cookieStore.set(key, value, options)
      },
      remove: (key: string, options?: any) => {
        cookieStore.delete(key)
      },
    })
    
    console.log('[createProjectServer] Starting with:', projectData, 'userId:', userId)

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
    
    console.log('[createProjectServer] Using slug:', slug)

    const { data, error } = await supabase
      .from('projects')
      .insert({
        name: projectData.name,
        description: projectData.description || null,
        slug,
        organization_id: projectData.organization_id,
        created_by: userId,
      })
      .select()
      .single()
      
    console.log('[createProjectServer] Insert result:', { data: !!data, error })

    if (error) {
      const serializedError = logError('createProjectServer:insert', error, {
        step: 'database_insert',
        projectData,
        slug,
        userId
      })
      throw new Error(`Project creation failed: ${serializedError.message}`)
    }
    
    if (!data) {
      throw new Error('Project creation returned no data')
    }
    
    console.log('[createProjectServer] Success! Project created:', data.id)
    return data as unknown as Project
  }, 'createProjectServer', { projectData, userId })
  
  return { data: result.data as Project | null, error: result.error }
}

/**
 * Server-side version of createDefaultOrganization for server actions
 */
async function createDefaultOrganizationServer(userId: string, userEmail: string, cookieStore: any): Promise<{ data: Organization | null; error: any }> {
  const result = await withErrorHandling(async () => {
    console.log('[createDefaultOrganizationServer] Starting with:', { userId, userEmail })
    
    const supabase = createServerClient({
      get: (key: string) => {
        const cookie = cookieStore.get(key)
        return cookie ? { value: cookie.value } : null
      },
      set: (key: string, value: string, options?: any) => {
        cookieStore.set(key, value, options)
      },
      remove: (key: string, options?: any) => {
        cookieStore.delete(key)
      },
    })

    // Vérifier l'authentification
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    console.log('[createDefaultOrganizationServer] Auth check:', { user: user?.id, authError })
    
    if (authError) {
      const serializedError = logError('createDefaultOrganizationServer:auth', authError, { 
        step: 'authentication',
        userId,
        userEmail 
      })
      throw new Error(`Authentication failed: ${serializedError.message}`)
    }
    
    if (!user) {
      console.error('[createDefaultOrganizationServer] No authenticated user')
      throw new Error('No authenticated user')
    }
    
    if (user.id !== userId) {
      console.error('[createDefaultOrganizationServer] User ID mismatch:', { expected: userId, actual: user.id })
      throw new Error('User ID mismatch - authentication error')
    }

    // Vérifier si l'utilisateur a déjà une organisation
    const { data: existingOrgs } = await getUserOrganizationsServer(userId, cookieStore)
    if (existingOrgs && existingOrgs.length > 0) {
      console.log('[createDefaultOrganizationServer] User already has organizations:', existingOrgs.length)
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
    
    console.log('[createDefaultOrganizationServer] Creating org with:', { orgName, orgSlug, userId })

    // Use RPC for atomic transaction
    const { data: result, error: rpcError } = await supabase.rpc('create_organization_with_admin', {
      p_name: orgName,
      p_slug: orgSlug,
      p_user_id: userId
    })

    if (rpcError) {
      const serializedError = logError('createDefaultOrganizationServer:rpc', rpcError, {
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
      const serializedError = logError('createDefaultOrganizationServer:fetch', fetchError, {
        step: 'fetch_created_organization',
        organizationId: rpcResult.organization_id
      })
      throw new Error(`Failed to fetch created organization: ${serializedError.message}`)
    }

    console.log('[createDefaultOrganizationServer] Success! Organization and membership created:', orgData.id)
    return orgData as unknown as Organization
  }, 'createDefaultOrganizationServer', { userId, userEmail })
  
  return { data: result.data as Organization | null, error: result.error }
}

/**
 * Récupère ou crée une organisation par défaut pour l'utilisateur
 */
async function getOrCreateDefaultOrganization(userId: string, userEmail: string, cookieStore: any): Promise<{ success: boolean; organizationId?: string; error?: string }> {
  try {
    console.log('[getOrCreateDefaultOrganization] Starting with:', { userId, userEmail })
    
    // D'abord, essayer de récupérer les organisations existantes
    const { data: organizations, error: orgError } = await getUserOrganizationsServer(userId, cookieStore)
    
    if (orgError) {
      const serializedError = logError('getOrCreateDefaultOrganization:getUserOrganizations', orgError, { userId })
      return { success: false, error: serializedError.message }
    }
    
    console.log('[getOrCreateDefaultOrganization] Existing organizations found:', organizations?.length || 0)
    
    // Si l'utilisateur a déjà une organisation, utiliser la première
    if (organizations && organizations.length > 0) {
      console.log('[getOrCreateDefaultOrganization] Using existing organization:', organizations[0].id)
      return { success: true, organizationId: organizations[0].id }
    }
    
    // Sinon, créer une organisation par défaut
    console.log('[getOrCreateDefaultOrganization] Creating new organization for user:', userId)
    const { data: newOrg, error: createError } = await createDefaultOrganizationServer(userId, userEmail, cookieStore)
    
    if (createError) {
      const serializedError = logError('getOrCreateDefaultOrganization:createDefaultOrganizationServer', createError, { userId, email: userEmail })
      return { success: false, error: serializedError.message }
    }
    
    if (!newOrg) {
      console.error('[getOrCreateDefaultOrganization] No organization data returned')
      return { success: false, error: 'Failed to create default organization' }
    }
    
    console.log('[getOrCreateDefaultOrganization] Successfully created organization:', newOrg.id)
    return { success: true, organizationId: newOrg.id }
    
  } catch (err) {
    const serializedError = logError('getOrCreateDefaultOrganization:catch', err as Error, { userId, userEmail })
    return { success: false, error: serializedError.message }
  }
}

/**
 * Crée un projet rapidement avec le nom par défaut "Untitled project"
 * et l'associe automatiquement à l'organisation de l'utilisateur
 */
export async function createQuickProject(): Promise<QuickProjectResult> {
  try {
    console.log('[createQuickProject] Starting quick project creation...')
    
    // Vérifier l'authentification
    const cookieStore = await cookies()
    const supabase = createServerClient({
      get: (key: string) => {
        const cookie = cookieStore.get(key)
        return cookie ? { value: cookie.value } : null
      },
      set: (key: string, value: string, options?: any) => {
        cookieStore.set(key, value, options)
      },
      remove: (key: string, options?: any) => {
        cookieStore.delete(key)
      },
    })
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      console.error('[createQuickProject] Authentication failed:', authError)
      const serializedError = logError('createQuickProject:auth', authError as Error, {})
      return { success: false, error: 'User not authenticated' }
    }
    
    if (!user.email) {
      console.error('[createQuickProject] User email not available:', user.id)
      return { success: false, error: 'User email required for project creation' }
    }
    
    console.log('[createQuickProject] Authenticated user:', { id: user.id, email: user.email })
    
    // Récupérer ou créer l'organisation par défaut
    console.log('[createQuickProject] Getting or creating default organization...')
    const orgResult = await getOrCreateDefaultOrganization(user.id, user.email, cookieStore)
    if (!orgResult.success || !orgResult.organizationId) {
      console.error('[createQuickProject] Failed to get organization:', orgResult.error)
      return { success: false, error: orgResult.error || 'Failed to get organization' }
    }
    
    console.log('[createQuickProject] Using organization:', orgResult.organizationId)
    
    // Créer le projet avec les données par défaut
    const projectData = {
      name: 'Untitled project',
      description: undefined,
      organization_id: orgResult.organizationId,
    }
    
    console.log('[createQuickProject] Creating project with data:', projectData)
    const { data: project, error: projectError } = await createProjectServer(projectData, user.id, cookieStore)
    
    if (projectError) {
      console.error('[createQuickProject] Project creation failed:', projectError)
      const serializedError = logError('createQuickProject:createProject', projectError, { projectData })
      return { success: false, error: serializedError.message }
    }
    
    if (!project) {
      console.error('[createQuickProject] Project creation returned no data')
      return { success: false, error: 'Project creation returned no data' }
    }
    
    console.log('[createQuickProject] Project created successfully:', { id: project.id, name: project.name })
    return { success: true, project }
    
  } catch (err) {
    console.error('[createQuickProject] Unexpected error:', err)
    const serializedError = logError('createQuickProject:catch', err as Error, {})
    return { success: false, error: serializedError.message }
  }
}