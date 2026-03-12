import { describe, it, expect } from 'vitest'
import { config } from '@/middleware'

describe('middleware', () => {
  it('exports a config object with a matcher array', () => {
    expect(config).toBeDefined()
    expect(Array.isArray(config.matcher)).toBe(true)
    expect(config.matcher.length).toBeGreaterThan(0)
  })

  it('matcher pattern excludes static assets', () => {
    const pattern = config.matcher[0]
    // Pattern should exclude _next/static, _next/image, favicon.ico, and image extensions
    expect(pattern).toContain('_next/static')
    expect(pattern).toContain('_next/image')
    expect(pattern).toContain('favicon.ico')
  })

  // Note: Full middleware integration tests require mocking @supabase/ssr which is complex.
  // The middleware routing logic is tested via the updateSession helper pattern.
  // These tests are expanded in Plan 02-02 when the login page component is built.
})
