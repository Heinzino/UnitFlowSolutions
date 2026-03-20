import { describe, it, expect } from 'vitest'
import { ROLE_ROUTES, ROLE_LABELS, ROLE_ALLOWED_ROUTES } from '../types/auth'

describe('auth type constants', () => {
  it('ROLE_ROUTES.rm maps to /regional', () => {
    expect(ROLE_ROUTES.rm).toBe('/regional')
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

  it('ROLE_ALLOWED_ROUTES.rm includes /regional, /property, /vendors, and /vacant', () => {
    expect(ROLE_ALLOWED_ROUTES.rm).toEqual(['/regional', '/property', '/vendors', '/vacant'])
  })

  it('ROLE_ALLOWED_ROUTES.pm includes /property, /vendors, and /vacant', () => {
    expect(ROLE_ALLOWED_ROUTES.pm).toEqual(['/property', '/vendors', '/vacant'])
  })

  it('ROLE_ALLOWED_ROUTES.exec includes /executive, /property, /vendors, and /vacant', () => {
    expect(ROLE_ALLOWED_ROUTES.exec).toEqual(['/executive', '/property', '/vendors', '/vacant'])
  })

  it('ROLE_ALLOWED_ROUTES does not have a dm key', () => {
    expect(Object.keys(ROLE_ALLOWED_ROUTES).includes('dm')).toBe(false)
  })
})
