export type UserRole = 'pm' | 'rm' | 'exec'

export const ROLE_ROUTES: Record<UserRole, string> = {
  pm: '/property',
  rm: '/regional',
  exec: '/executive',
}

/** Routes each role is allowed to access (beyond their own ROLE_ROUTES entry) */
export const ROLE_ALLOWED_ROUTES: Partial<Record<UserRole, string[]>> = {
  exec: ['/executive', '/property', '/vendors', '/vacant'],
  rm: ['/regional', '/property', '/vendors', '/vacant'],
  pm: ['/property', '/vendors', '/vacant'],
}

export interface AppMetadata {
  role: UserRole
  property_ids?: string[]
}

export const ROLE_LABELS: Record<UserRole, string> = {
  pm: 'Property Manager',
  rm: 'Regional Manager',
  exec: 'Executive',
}
