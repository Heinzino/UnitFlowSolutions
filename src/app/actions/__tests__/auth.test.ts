import { describe, it, vi } from 'vitest'

// Wave 0 test stubs for AUTH-02 and AUTH-05
// These tests will be implemented once the auth server actions are wired
// to a real (mocked) Supabase client in the test environment.

vi.mock('@supabase/ssr', () => ({
  createServerClient: vi.fn(() => ({
    auth: {
      signInWithPassword: vi.fn().mockResolvedValue({
        data: { user: { app_metadata: { role: 'pm' } } },
        error: null,
      }),
      signOut: vi.fn().mockResolvedValue({ error: null }),
    },
  })),
}))

vi.mock('next/headers', () => ({
  cookies: vi.fn().mockResolvedValue({
    getAll: vi.fn().mockReturnValue([]),
    set: vi.fn(),
  }),
}))

vi.mock('next/navigation', () => ({
  redirect: vi.fn(),
}))

describe('auth server actions', () => {
  it.todo('login calls signInWithPassword with email and password from formData')

  it.todo('login redirects to role dashboard on success')

  it.todo('login returns error object on failure')

  it.todo('logout calls signOut and redirects to /login')
})
