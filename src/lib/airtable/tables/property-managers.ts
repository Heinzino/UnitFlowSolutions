import { cacheTag, cacheLife } from 'next/cache'
import type { FieldSet } from 'airtable'
import { base, rateLimiter } from '../client'
import type { PropertyManager } from '@/lib/types/airtable'

function mapPropertyManager(record: { fields: FieldSet }): PropertyManager {
  const f = record.fields as Record<string, unknown>
  return {
    name: String(f['Name'] ?? ''),
    email: String(f['Email'] ?? ''),
    phone: f['Phone'] ? String(f['Phone']) : null,
    propertyManaged: String(f['Property Managed'] ?? ''),
  }
}

export async function fetchPropertyManagers(): Promise<PropertyManager[]> {
  'use cache'
  cacheLife('airtableData')
  cacheTag('property-managers')

  await rateLimiter.acquire()
  const records = await base<FieldSet>('Property_Managers').select().all()
  return records.map(mapPropertyManager)
}
