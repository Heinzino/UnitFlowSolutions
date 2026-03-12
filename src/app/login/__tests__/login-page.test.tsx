import { describe, it, expect, vi } from 'vitest'

// Wave 0 test stubs for AUTH-01
// These tests will pass once the login page component is created in Plan 02-02.

vi.mock('@supabase/ssr', () => ({
  createBrowserClient: vi.fn(() => ({
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: null }),
    },
  })),
}))

vi.mock('@/app/actions/auth', () => ({
  login: vi.fn(),
}))

vi.mock('react', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react')>()
  return {
    ...actual,
    useActionState: vi.fn(() => [null, vi.fn(), false]),
  }
})

describe('LoginPage', () => {
  it.todo('renders email and password fields')

  it.todo('renders Sign In button')

  it.todo('displays error message when login fails')
})
