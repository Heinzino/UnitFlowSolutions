export type UserRole = 'pm' | 'dm' | 'exec'

export const ROLE_ROUTES: Record<UserRole, string> = {
  pm: '/property',
  dm: '/district',
  exec: '/executive',
}

export interface AppMetadata {
  role: UserRole
  property_ids?: string[]
}

export const ROLE_LABELS: Record<UserRole, string> = {
  pm: 'Property Manager',
  dm: 'District Manager',
  exec: 'Executive',
}
