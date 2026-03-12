import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock next/cache before importing the action
vi.mock('next/cache', () => ({
  revalidateTag: vi.fn(),
}))

// Mock the airtable client module
vi.mock('@/lib/airtable/client', () => ({
  base: vi.fn(),
  rateLimiter: {
    acquire: vi.fn().mockResolvedValue(undefined),
  },
}))

// Now import the mocked modules so we can configure them per test
import { revalidateTag } from 'next/cache'
import { base, rateLimiter } from '@/lib/airtable/client'
import { updateJobStatus } from '../job-status'

const mockRevalidateTag = vi.mocked(revalidateTag)
const mockBase = vi.mocked(base)
const mockRateLimiter = vi.mocked(rateLimiter)

describe('updateJobStatus', () => {
  beforeEach(() => {
    vi.clearAllMocks()

    // Default: rateLimiter resolves immediately
    mockRateLimiter.acquire.mockResolvedValue(undefined)

    // Default: base('Jobs') returns a chainable mock with records found
    const mockRecord = { id: 'recABC123', fields: { Status: 'Ready' } }
    const mockSelectAll = vi.fn().mockResolvedValue([mockRecord])
    const mockSelect = vi.fn().mockReturnValue({ all: mockSelectAll })
    const mockUpdate = vi.fn().mockResolvedValue(mockRecord)

    mockBase.mockReturnValue({
      select: mockSelect,
      update: mockUpdate,
    } as never)
  })

  it('returns success and calls Airtable update for a valid status', async () => {
    const result = await updateJobStatus(101, 201, 'In Progress')

    expect(result).toEqual({ success: true })
    expect(mockBase).toHaveBeenCalledWith('Jobs')
  })

  it('returns structured error for an invalid status without calling Airtable', async () => {
    const result = await updateJobStatus(101, 201, 'Not A Real Status')

    expect(result).toEqual({ success: false, error: 'Invalid job status' })
    // Airtable should NOT be called for invalid status
    expect(mockBase).not.toHaveBeenCalled()
    expect(mockRateLimiter.acquire).not.toHaveBeenCalled()
  })

  it('returns structured error when job is not found in Airtable', async () => {
    // Override: return empty records list
    const mockSelectAll = vi.fn().mockResolvedValue([])
    const mockSelect = vi.fn().mockReturnValue({ all: mockSelectAll })
    mockBase.mockReturnValue({
      select: mockSelect,
      update: vi.fn(),
    } as never)

    const result = await updateJobStatus(999, 201, 'Completed')

    expect(result).toEqual({ success: false, error: 'Job not found' })
  })

  it('calls revalidateTag for all 5 cache tags with { expire: 0 } on success', async () => {
    await updateJobStatus(101, 201, 'Completed')

    expect(mockRevalidateTag).toHaveBeenCalledTimes(5)
    // Specific job and turn request (record-level)
    expect(mockRevalidateTag).toHaveBeenCalledWith('job-101', { expire: 0 })
    expect(mockRevalidateTag).toHaveBeenCalledWith('turn-request-201', { expire: 0 })
    // Table-level
    expect(mockRevalidateTag).toHaveBeenCalledWith('jobs', { expire: 0 })
    expect(mockRevalidateTag).toHaveBeenCalledWith('turn-requests', { expire: 0 })
    expect(mockRevalidateTag).toHaveBeenCalledWith('kpis', { expire: 0 })
  })

  it('returns structured error and does not throw when Airtable update fails', async () => {
    // Override: update throws an error
    const mockSelectAll = vi.fn().mockResolvedValue([{ id: 'recABC123' }])
    const mockSelect = vi.fn().mockReturnValue({ all: mockSelectAll })
    const mockUpdate = vi.fn().mockRejectedValue(new Error('Airtable API error'))

    mockBase.mockReturnValue({
      select: mockSelect,
      update: mockUpdate,
    } as never)

    const result = await updateJobStatus(101, 201, 'In Progress')

    expect(result).toEqual({ success: false, error: 'Failed to update job status' })
    // revalidateTag should NOT be called on failure
    expect(mockRevalidateTag).not.toHaveBeenCalled()
  })
})
