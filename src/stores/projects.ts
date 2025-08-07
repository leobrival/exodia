'use client'

import { create } from 'zustand'
import { subscribeWithSelector } from 'zustand/middleware'
import { Project, Organization, CreateProjectData, getUserProjects, getUserOrganizations, createProject } from '@/lib/actions/projects'
import { useRealtimeStore, createOptimisticUpdate, mergeWithOptimisticUpdates } from '@/stores/realtime-base'
import { getRealtimeManager } from '@/lib/supabase/realtime'
import { ProjectChanges, OrganizationChanges, CHANNEL_TOPICS } from '@/types/realtime'
import { useAuthStore } from '@/stores/auth'
import { getUserFriendlyErrorMessage } from '@/lib/utils/error-handling'

interface ProjectsState {
  // Data
  projects: Project[]
  organizations: Organization[]
  
  // Loading states
  isLoadingProjects: boolean
  isLoadingOrganizations: boolean
  isCreatingProject: boolean
  
  // Cache state
  lastProjectsLoad?: number
  lastOrganizationsLoad?: number
  projectsCacheExpiry: number // 5 minutes default
  
  // Real-time state
  isRealtimeEnabled: boolean
  projectsSubscriptionId?: string
  organizationsSubscriptionId?: string
  
  // Actions
  loadProjects: (force?: boolean) => Promise<void>
  loadOrganizations: (force?: boolean) => Promise<void>
  createNewProject: (projectData: CreateProjectData) => Promise<{ success: boolean; project?: Project; error?: string }>
  invalidateProjectsCache: () => void
  invalidateOrganizationsCache: () => void
  
  // Real-time actions
  enableRealtime: () => Promise<void>
  disableRealtime: () => Promise<void>
  
  // UI state
  isProjectModalOpen: boolean
  setProjectModalOpen: (open: boolean) => void
  
  // Internal real-time handlers
  handleProjectChange: (payload: ProjectChanges) => void
  handleOrganizationChange: (payload: OrganizationChanges) => void
}

export const useProjectsStore = create<ProjectsState>()(
  subscribeWithSelector((set, get) => ({
    // Initial state
    projects: [],
    organizations: [],
    isLoadingProjects: false,
    isLoadingOrganizations: false,
    isCreatingProject: false,
    projectsCacheExpiry: 5 * 60 * 1000, // 5 minutes
    isRealtimeEnabled: false,
    isProjectModalOpen: false,

    // Load user's projects
    loadProjects: async (force = false) => {
      const { lastProjectsLoad, projectsCacheExpiry, isLoadingProjects } = get()
      
      // Check cache validity
      if (!force && lastProjectsLoad && Date.now() - lastProjectsLoad < projectsCacheExpiry) {
        return
      }
      
      // Prevent duplicate loading
      if (isLoadingProjects) {
        return
      }
      
      set({ isLoadingProjects: true })
      
      try {
        const authStore = useAuthStore.getState()
        const { user, initialized, isAuthenticated } = authStore
        
        // Wait for auth to be initialized
        if (!initialized) {
          set({ isLoadingProjects: false })
          return
        }
        
        // Check if user is authenticated
        if (!isAuthenticated || !user) {
          set({ isLoadingProjects: false })
          return
        }
        
        const { data: projects, error } = await getUserProjects(user.id)
        
        if (error) {
          const friendlyMessage = getUserFriendlyErrorMessage(error)
          console.error('Failed to load projects:', friendlyMessage)
          return
        }
        
        // For initial load, only merge optimistic updates if we have cached data
        const { lastProjectsLoad } = get()
        let finalProjects = projects || []
        
        if (lastProjectsLoad) {
          // Only merge optimistic updates for subsequent loads
          const realtimeStore = useRealtimeStore.getState()
          finalProjects = mergeWithOptimisticUpdates(finalProjects, realtimeStore.pendingUpdates)
        }
        
        set({ 
          projects: finalProjects,
          lastProjectsLoad: Date.now()
        })
      } catch (error) {
        console.error('Error loading projects:', error)
      } finally {
        set({ isLoadingProjects: false })
      }
    },

    // Load user's organizations
    loadOrganizations: async (force = false) => {
      const { lastOrganizationsLoad, projectsCacheExpiry, isLoadingOrganizations } = get()
      
      // Check cache validity
      if (!force && lastOrganizationsLoad && Date.now() - lastOrganizationsLoad < projectsCacheExpiry) {
        return
      }
      
      // Prevent duplicate loading
      if (isLoadingOrganizations) {
        return
      }
      
      set({ isLoadingOrganizations: true })
      
      try {
        const { data: organizations, error } = await getUserOrganizations()
        
        if (error) {
          const friendlyMessage = getUserFriendlyErrorMessage(error)
          console.error('Failed to load organizations:', friendlyMessage)
          return
        }
        
        set({ 
          organizations: organizations || [],
          lastOrganizationsLoad: Date.now()
        })
      } catch (error) {
        console.error('Error loading organizations:', error)
      } finally {
        set({ isLoadingOrganizations: false })
      }
    },

    // Create a new project with optimistic updates
    createNewProject: async (projectData: CreateProjectData) => {
      set({ isCreatingProject: true })
      
      // Create optimistic project
      const optimisticProject: Project = {
        id: `optimistic_${Date.now()}`,
        name: projectData.name,
        description: projectData.description,
        organization_id: projectData.organization_id,
        slug: projectData.name.toLowerCase().replace(/\s+/g, '-'),
        status: 'draft',
        created_by: useAuthStore.getState().user?.id || '',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }

      // Add optimistic update
      const optimisticUpdate = createOptimisticUpdate('create', optimisticProject)
      useRealtimeStore.getState().addOptimisticUpdate(optimisticUpdate)

      // Update UI immediately
      const { projects } = get()
      set({ projects: [optimisticProject, ...projects] })
      
      try {
        const { data: project, error } = await createProject(projectData)
        
        if (error) {
          const friendlyMessage = getUserFriendlyErrorMessage(error)
          console.error('Failed to create project:', friendlyMessage)
          // Rollback optimistic update
          useRealtimeStore.getState().rollbackOptimisticUpdate(optimisticUpdate.id)
          set(state => ({ 
            projects: state.projects.filter(p => p.id !== optimisticProject.id) 
          }))
          return { success: false, error: friendlyMessage }
        }
        
        if (!project) {
          useRealtimeStore.getState().rollbackOptimisticUpdate(optimisticUpdate.id)
          set(state => ({ 
            projects: state.projects.filter(p => p.id !== optimisticProject.id) 
          }))
          return { success: false, error: 'Project creation returned no data' }
        }
        
        // Confirm optimistic update and replace with real data
        useRealtimeStore.getState().confirmOptimisticUpdate(optimisticUpdate.id)
        set(state => ({
          projects: state.projects.map(p => 
            p.id === optimisticProject.id ? project : p
          )
        }))
        
        // Invalidate cache to ensure fresh data on next load
        get().invalidateProjectsCache()
        
        return { success: true, project }
      } catch (error) {
        console.error('Error creating project:', error)
        // Rollback optimistic update
        useRealtimeStore.getState().rollbackOptimisticUpdate(optimisticUpdate.id)
        set(state => ({ 
          projects: state.projects.filter(p => p.id !== optimisticProject.id) 
        }))
        return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
      } finally {
        set({ isCreatingProject: false })
      }
    },

    // Enable real-time subscriptions
    enableRealtime: async () => {
      try {
        const authStore = useAuthStore.getState()
        const user = authStore.user
        
        if (!user) {
          return
        }

        const realtimeStore = useRealtimeStore.getState()
        const manager = getRealtimeManager()

        // Subscribe to projects changes
        const projectsSubscriptionId = await realtimeStore.subscribe({
          table: 'projects',
          event: '*',
          schema: 'public',
        })

        // Subscribe to organizations changes
        const organizationsSubscriptionId = await realtimeStore.subscribe({
          table: 'organizations',
          event: '*',
          schema: 'public',
        })

        // Set up event listeners for projects
        manager.on(`${projectsSubscriptionId}:insert`, get().handleProjectChange)
        manager.on(`${projectsSubscriptionId}:update`, get().handleProjectChange)
        manager.on(`${projectsSubscriptionId}:delete`, get().handleProjectChange)

        // Set up event listeners for organizations
        manager.on(`${organizationsSubscriptionId}:insert`, get().handleOrganizationChange)
        manager.on(`${organizationsSubscriptionId}:update`, get().handleOrganizationChange)
        manager.on(`${organizationsSubscriptionId}:delete`, get().handleOrganizationChange)

        set({ 
          isRealtimeEnabled: true,
          projectsSubscriptionId,
          organizationsSubscriptionId
        })

      } catch (error) {
        console.error('[ProjectsStore] Failed to enable real-time:', error)
      }
    },

    // Disable real-time subscriptions
    disableRealtime: async () => {
      const { projectsSubscriptionId, organizationsSubscriptionId } = get()
      const realtimeStore = useRealtimeStore.getState()
      const manager = getRealtimeManager()

      try {
        // Remove event listeners
        if (projectsSubscriptionId) {
          manager.off(`${projectsSubscriptionId}:insert`, get().handleProjectChange)
          manager.off(`${projectsSubscriptionId}:update`, get().handleProjectChange)
          manager.off(`${projectsSubscriptionId}:delete`, get().handleProjectChange)
          await realtimeStore.unsubscribe(projectsSubscriptionId)
        }
        
        if (organizationsSubscriptionId) {
          manager.off(`${organizationsSubscriptionId}:insert`, get().handleOrganizationChange)
          manager.off(`${organizationsSubscriptionId}:update`, get().handleOrganizationChange)
          manager.off(`${organizationsSubscriptionId}:delete`, get().handleOrganizationChange)
          await realtimeStore.unsubscribe(organizationsSubscriptionId)
        }

        set({ 
          isRealtimeEnabled: false,
          projectsSubscriptionId: undefined,
          organizationsSubscriptionId: undefined
        })

      } catch (error) {
        console.error('[ProjectsStore] Failed to disable real-time:', error)
      }
    },

    // Handle project changes from real-time
    handleProjectChange: (payload: ProjectChanges) => {
      
      const { projects } = get()
      
      switch (payload.eventType) {
        case 'INSERT':
          if (payload.new) {
            const newProject = payload.new as Project
            // Check if project already exists (avoid duplicates)
            if (!projects.find(p => p.id === newProject.id)) {
              set({ projects: [newProject, ...projects] })
            }
          }
          break
          
        case 'UPDATE':
          if (payload.new) {
            const updatedProject = payload.new as Project
            set({
              projects: projects.map(p => 
                p.id === updatedProject.id ? updatedProject : p
              )
            })
          }
          break
          
        case 'DELETE':
          if (payload.old) {
            const deletedProject = payload.old as Project
            set({
              projects: projects.filter(p => p.id !== deletedProject.id)
            })
          }
          break
      }
    },

    // Handle organization changes from real-time
    handleOrganizationChange: (payload: OrganizationChanges) => {
      
      const { organizations } = get()
      
      switch (payload.eventType) {
        case 'INSERT':
          if (payload.new) {
            const newOrganization = payload.new as Organization
            if (!organizations.find(o => o.id === newOrganization.id)) {
              set({ organizations: [newOrganization, ...organizations] })
            }
          }
          break
          
        case 'UPDATE':
          if (payload.new) {
            const updatedOrganization = payload.new as Organization
            set({
              organizations: organizations.map(o => 
                o.id === updatedOrganization.id ? updatedOrganization : o
              )
            })
          }
          break
          
        case 'DELETE':
          if (payload.old) {
            const deletedOrganization = payload.old as Organization
            set({
              organizations: organizations.filter(o => o.id !== deletedOrganization.id)
            })
          }
          break
      }
    },

    // Cache invalidation methods
    invalidateProjectsCache: () => {
      set({ lastProjectsLoad: undefined })
    },

    invalidateOrganizationsCache: () => {
      set({ lastOrganizationsLoad: undefined })
    },

    // UI state management
    setProjectModalOpen: (open: boolean) => {
      set({ isProjectModalOpen: open })
    },
  }))
)