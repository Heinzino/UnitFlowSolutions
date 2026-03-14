import { describe, it, expect } from 'vitest'
import { ROLE_ROUTES, ROLE_LABELS, ROLE_ALLOWED_ROUTES } from '../types/auth'

describe('auth type constants', () => {
  it('ROLE_ROUTES.rm maps to /property', () => {
    expect(ROLE_ROUTES.rm).toBe('/property')
  })

  it('ROLE_ROUTES does not have a dm key', () => {
    expect(Object.keys(ROLE_ROUTES).includes('dm')).toBe(false)
  })

  it('ROLE_ROUTES has exactly 3 keys: pm, rm, exec', () => {
    expect(Object.keys(ROLE_ROUTES).sort()).toEqual(['exec', 'pm', 'rm'])
  })

  it('ROLE_LABELS.rm equals Regional Manager', () => {
    expect(ROLE_LABELS.rm).toBe('Regional Manager')
  })

  it('ROLE_LABELS does not have a dm key', () => {
    expect(Object.keys(ROLE_LABELS).includes('dm')).toBe(false)
  })

  it('ROLE_ALLOWED_ROUTES.rm deep equals [/property]', () => {
    expect(ROLE_ALLOWED_ROUTES.rm).toEqual(['/property'])
  })

  it('ROLE_ALLOWED_ROUTES does not have a dm key', () => {
    expect(Object.keys(ROLE_ALLOWED_ROUTES).includes('dm')).toBe(false)
  })
})
