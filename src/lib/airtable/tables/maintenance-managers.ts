import { cacheTag, cacheLife } from 'next/cache'
import type { FieldSet } from 'airtable'
import { base, rateLimiter } from '../client'
import type { MaintenanceManager } from '@/lib/types/airtable'

function mapMaintenanceManager(record: { fields: FieldSet }): MaintenanceManager {
  const f = record.fields as Record<string, unknown>
  return {
    name: String(f['Name'] ?? ''),
    email: String(f['Email'] ?? ''),
    phone: f['Phone'] ? String(f['Phone']) : null,
    propertyManaged: String(f['Property Managed'] ?? ''),
  }
}

export async function fetchMaintenanceManagers(): Promise<MaintenanceManager[]> {
  'use cache'
  cacheLife('airtableData')
  cacheTag('maintenance-managers')

  await rateLimiter.acquire()
  const records = await base<FieldSet>('Maintenance_Managers').select().all()
  return records.map(mapMaintenanceManager)
}
