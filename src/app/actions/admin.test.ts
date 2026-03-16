import { describe, it, expect, vi, beforeEach } from 'vitest'

// Hoist mock variables so they are available at vi.mock factory time
const { mockGetUser, mockAdminCreateUser, mockCreate, mockBase, mockRateLimiter, mockRevalidateTag } =
  vi.hoisted(() => {
    const mockCreate = vi.fn()
    const mockBase = vi.fn(() => ({ create: mockCreate }))
    const mockRateLimiter = { acquire: vi.fn().mockResolvedValue(undefined) }
    const mockGetUser = vi.fn()
    const mockAdminCreateUser = vi.fn()
    const mockRevalidateTag = vi.fn()
    return { mockGetUser, mockAdminCreateUser, mockCreate, mockBase, mockRateLimiter, mockRevalidateTag }
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

// Mock Supabase admin client (for createUser API call)
vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: vi.fn(() => ({
    auth: {
      admin: {
        createUser: mockAdminCreateUser,
      },
    },
  })),
}))

// Mock Airtable client
vi.mock('@/lib/airtable/client', () => ({
  base: mockBase,
  rateLimiter: mockRateLimiter,
}))

// Import after mocks
import { createUser, createProperty } from './admin'

function makeFormData(fields: Record<string, string | string[]>): FormData {
  const fd = new FormData()
  for (const [key, value] of Object.entries(fields)) {
    if (Array.isArray(value)) {
      for (const v of value) fd.append(key, v)
    } else {
      fd.append(key, value)
    }
  }
  return fd
}

describe('createUser', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns { success, email, role, password } for admin caller with valid input', async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { email: 'heinz@readymation.com' } },
    })
    mockAdminCreateUser.mockResolvedValue({ error: null })

    const fd = makeFormData({
      first_name: 'Jane',
      last_name: 'Doe',
      email: 'jane@example.com',
      role: 'pm',
      property_names: ['Maple Apartments'],
    })

    const result = await createUser(null, fd)

    expect(result).toMatchObject({
      success: true,
      email: 'jane@example.com',
      role: 'pm',
    })
    expect(typeof (result as { password?: string }).password).toBe('string')
    expect((result as { password: string }).password.length).toBeGreaterThanOrEqual(12)
  })

  it('returns { error: "Unauthorized" } for non-admin caller', async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { email: 'notadmin@example.com' } },
    })

    const fd = makeFormData({
      first_name: 'Jane',
      last_name: 'Doe',
      email: 'jane@example.com',
      role: 'pm',
    })

    const result = await createUser(null, fd)

    expect(result).toEqual({ error: 'Unauthorized' })
  })

  it('returns { error: "Unauthorized" } when no user is authenticated', async () => {
    mockGetUser.mockResolvedValue({
      data: { user: null },
    })

    const fd = makeFormData({
      first_name: 'Jane',
      last_name: 'Doe',
      email: 'jane@example.com',
      role: 'pm',
    })

    const result = await createUser(null, fd)

    expect(result).toEqual({ error: 'Unauthorized' })
  })

  it('returns { error } when Supabase returns an error (e.g., user already registered)', async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { email: 'heinz@readymation.com' } },
    })
    mockAdminCreateUser.mockResolvedValue({
      error: { message: 'User already registered' },
    })

    const fd = makeFormData({
      first_name: 'Jane',
      last_name: 'Doe',
      email: 'existing@example.com',
      role: 'pm',
    })

    const result = await createUser(null, fd)

    expect(result).toEqual({ error: 'User already registered' })
  })
})

describe('createProperty', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockRateLimiter.acquire.mockResolvedValue(undefined)
  })

  it('calls base("Properties").create() with correct fields and returns { name, streetAddress }', async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { email: 'heinz@readymation.com' } },
    })
    mockCreate.mockResolvedValue({ id: 'rec123', fields: {} })

    const result = await createProperty('Maple Apartments', '123 Main St')

    expect(mockBase).toHaveBeenCalledWith('Properties')
    expect(mockCreate).toHaveBeenCalledWith({
      'Property Name': 'Maple Apartments',
      'Street Address': '123 Main St',
    })
    expect(result).toEqual({ name: 'Maple Apartments', streetAddress: '123 Main St' })
  })

  it('calls revalidateTag with the properties cache tag', async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { email: 'heinz@readymation.com' } },
    })
    mockCreate.mockResolvedValue({ id: 'rec123', fields: {} })

    await createProperty('Maple Apartments', '123 Main St')

    expect(mockRevalidateTag).toHaveBeenCalledWith('properties')
  })
})
