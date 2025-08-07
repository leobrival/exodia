import { describe, it, expect, vi, beforeEach } from 'vitest'
import { getProjectById } from './projects'

// Mock Supabase client
const mockGetUser = vi.fn()
const mockSingle = vi.fn()
const mockEq2 = vi.fn(() => ({ single: mockSingle }))
const mockEq1 = vi.fn(() => ({ eq: mockEq2 }))
const mockSelect = vi.fn(() => ({ eq: mockEq1 }))
const mockFrom = vi.fn(() => ({ select: mockSelect }))

vi.mock('@/lib/supabase', () => ({
  createBrowserClient: vi.fn(() => ({
    auth: {
      getUser: mockGetUser
    },
    from: mockFrom
  }))
}))

describe('getProjectById', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should return null when project is not found', async () => {
    // Mock authenticated user
    mockGetUser.mockResolvedValue({
      data: { user: { id: 'user-123' } },
      error: null
    })

    // Mock project not found
    mockSingle.mockResolvedValue({
      data: null,
      error: { code: 'PGRST116', message: 'No rows found' }
    })

    const result = await getProjectById('nonexistent-id')
    
    expect(result.data).toBeNull()
    expect(result.error).toBeTruthy()
  })

  it('should return project when found and user has access', async () => {
    const mockProject = {
      id: 'project-123',
      organization_id: 'org-123',
      name: 'Test Project',
      description: 'Test Description',
      slug: 'test-project',
      status: 'active',
      created_by: 'user-123',
      created_at: '2023-01-01T00:00:00Z',
      updated_at: '2023-01-01T00:00:00Z'
    }

    // Mock authenticated user
    mockGetUser.mockResolvedValue({
      data: { user: { id: 'user-123' } },
      error: null
    })

    // Mock project found
    mockSingle.mockResolvedValue({
      data: mockProject,
      error: null
    })

    const result = await getProjectById('project-123')
    
    expect(result.data).toEqual(mockProject)
    expect(result.error).toBeNull()
  })

  it('should handle authentication error', async () => {
    // Mock authentication error
    mockGetUser.mockResolvedValue({
      data: { user: null },
      error: { message: 'Not authenticated' }
    })

    const result = await getProjectById('project-123')
    
    expect(result.data).toBeNull()
    expect(result.error).toBeTruthy()
  })
})