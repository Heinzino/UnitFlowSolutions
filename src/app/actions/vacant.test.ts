import { describe, it, expect, vi, beforeEach } from 'vitest'

// Hoist mock variables so they are available at vi.mock factory time
const { mockGetUser, mockCreate, mockBase, mockRateLimiter, mockRevalidateTag } =
  vi.hoisted(() => {
    const mockCreate = vi.fn()
    const mockBase = vi.fn(() => ({ create: mockCreate }))
    const mockRateLimiter = { acquire: vi.fn().mockResolvedValue(undefined) }
    const mockGetUser = vi.fn()
    const mockRevalidateTag = vi.fn()
    return { mockGetUser, mockCreate, mockBase, mockRateLimiter, mockRevalidateTag }
  })

// Mock server-only to be a no-op in tests
vi.mock('server-only', () => ({}))

// Mock next/headers (required for createClient from supabase/server)
vi.mock('next/headers', () => ({
  cookies: vi.fn().mockResolvedValue({
    getAll: vi.fn().mockReturnValue([]),
    set: vi.fn(),
  }),
}))

// Mock next/cache
vi.mock('next/cache', () => ({
  revalidateTag: mockRevalidateTag,
}))

// Mock Supabase server client (for caller identity check)
vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(() =>
    Promise.resolve({
      auth: {
        getUser: mockGetUser,
      },
    })
  ),
}))

// Mock Airtable client
vi.mock('@/lib/airtable/client', () => ({
  base: mockBase,
  rateLimiter: mockRateLimiter,
}))

// Import after mocks
import { addVacantUnits } from './vacant'

describe('addVacantUnits', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockRateLimiter.acquire.mockResolvedValue(undefined)
  })

  it('returns { error: "Unauthorized" } when no user is authenticated', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } })

    const result = await addVacantUnits('Maple Apartments', '123 Main St', [
      { unitNumber: '101', floorPlan: '2br 1ba' },
    ])

    expect(result).toEqual({ error: 'Unauthorized' })
  })

  it('returns { created, failed: [] } with correct unit data when all units succeed', async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { email: 'pm@example.com' } },
    })
    mockCreate.mockResolvedValue({ id: 'rec1', fields: {} })

    const result = await addVacantUnits('Maple Apartments', '123 Main St', [
      { unitNumber: '101', floorPlan: '2br 1ba' },
      { unitNumber: '102', floorPlan: '1br 1ba' },
    ])

    expect(result).toEqual({
      created: [
        { unitNumber: '101', floorPlan: '2br 1ba' },
        { unitNumber: '102', floorPlan: '1br 1ba' },
      ],
      failed: [],
    })
    expect(mockCreate).toHaveBeenCalledTimes(2)
  })

  it('creates records with all 8 required fields including City and State', async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { email: 'pm@example.com' } },
    })
    mockCreate.mockResolvedValue({ id: 'rec1', fields: {} })

    await addVacantUnits('Maple Apartments', '123 Main St', [
      { unitNumber: '101', floorPlan: '2br 1ba' },
    ])

    expect(mockBase).toHaveBeenCalledWith('Properties')
    expect(mockCreate).toHaveBeenCalledWith(
      {
        'Property Name': 'Maple Apartments',
        'Street Address': '123 Main St',
        'Unit Number': '101',
        'Floor Plan': '2br 1ba',
        'Bedrooms': 2,
        'Bathrooms': 1,
        'City': 'Columbia',
        'State': 'SC',
      },
      { typecast: true }
    )
  })

  it('correctly parses floor plans: 2br 1ba and Studio / Loft', async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { email: 'pm@example.com' } },
    })
    mockCreate.mockResolvedValue({ id: 'rec1', fields: {} })

    await addVacantUnits('Maple Apartments', '123 Main St', [
      { unitNumber: '101', floorPlan: '2br 1ba' },
      { unitNumber: 'S1', floorPlan: 'Studio / Loft' },
    ])

    // Check 2br 1ba => bedrooms: 2, bathrooms: 1
    expect(mockCreate).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({ 'Bedrooms': 2, 'Bathrooms': 1 }),
      { typecast: true }
    )

    // Check Studio / Loft => bedrooms: 0, bathrooms: 1
    expect(mockCreate).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({ 'Bedrooms': 0, 'Bathrooms': 1 }),
      { typecast: true }
    )
  })

  it('returns { created: [unit1], failed: [unit2] } when second create throws', async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { email: 'pm@example.com' } },
    })
    mockCreate
      .mockResolvedValueOnce({ id: 'rec1', fields: {} })
      .mockRejectedValueOnce(new Error('Airtable error'))

    const result = await addVacantUnits('Maple Apartments', '123 Main St', [
      { unitNumber: '101', floorPlan: '2br 1ba' },
      { unitNumber: '102', floorPlan: '1br 1ba' },
    ])

    expect(result).toEqual({
      created: [{ unitNumber: '101', floorPlan: '2br 1ba' }],
      failed: [{ unitNumber: '102', floorPlan: '1br 1ba', error: 'Airtable error' }],
    })
  })

  it('calls rateLimiter.acquire() once per unit', async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { email: 'pm@example.com' } },
    })
    mockCreate.mockResolvedValue({ id: 'rec1', fields: {} })

    await addVacantUnits('Maple Apartments', '123 Main St', [
      { unitNumber: '101', floorPlan: '2br 1ba' },
      { unitNumber: '102', floorPlan: '1br 1ba' },
      { unitNumber: '103', floorPlan: 'Studio / Loft' },
    ])

    expect(mockRateLimiter.acquire).toHaveBeenCalledTimes(3)
  })

  it('calls revalidateTag("properties") when at least one unit is created', async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { email: 'pm@example.com' } },
    })
    mockCreate.mockResolvedValue({ id: 'rec1', fields: {} })

    await addVacantUnits('Maple Apartments', '123 Main St', [
      { unitNumber: '101', floorPlan: '2br 1ba' },
    ])

    expect(mockRevalidateTag).toHaveBeenCalledWith('properties', { expire: 0 })
  })

  it('does NOT call revalidateTag when all units fail', async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { email: 'pm@example.com' } },
    })
    mockCreate.mockRejectedValue(new Error('Airtable error'))

    await addVacantUnits('Maple Apartments', '123 Main St', [
      { unitNumber: '101', floorPlan: '2br 1ba' },
      { unitNumber: '102', floorPlan: '1br 1ba' },
    ])

    expect(mockRevalidateTag).not.toHaveBeenCalled()
  })

  it('accepts any authenticated user — not gated by ADMIN_EMAILS', async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { email: 'pm@example.com' } },
    })
    mockCreate.mockResolvedValue({ id: 'rec1', fields: {} })

    const result = await addVacantUnits('Maple Apartments', '123 Main St', [
      { unitNumber: '101', floorPlan: '2br 1ba' },
    ])

    // Should NOT return Unauthorized for a non-admin email
    expect(result).not.toEqual({ error: 'Unauthorized' })
    expect(result).toMatchObject({ created: expect.any(Array), failed: expect.any(Array) })
  })
})
