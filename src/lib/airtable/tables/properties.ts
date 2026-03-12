import { cacheTag, cacheLife } from 'next/cache'
import type { FieldSet } from 'airtable'
import { base, rateLimiter } from '../client'
import { CACHE_TAGS } from '../cache-tags'
import type { Property } from '@/lib/types/airtable'

function mapProperty(record: { fields: FieldSet }): Property {
  const f = record.fields as Record<string, unknown>
  return {
    streetAddress: String(f['Street Address'] ?? ''),
    propertyName: String(f['Property Name'] ?? ''),
    city: String(f['City'] ?? ''),
    state: String(f['State'] ?? ''),
    unitNumber: String(f['Unit Number'] ?? ''),
    bedrooms: f['Bedrooms'] != null ? Number(f['Bedrooms']) || null : null,
    bathrooms: f['Bathrooms'] != null ? Number(f['Bathrooms']) || null : null,
    floorPlan: f['Floor Plan'] ? String(f['Floor Plan']) : null,
  }
}

export async function fetchProperties(): Promise<Property[]> {
  'use cache'
  cacheLife('airtableData')
  cacheTag(CACHE_TAGS.properties)

  await rateLimiter.acquire()
  const records = await base<FieldSet>('Properties').select().all()
  return records.map(mapProperty)
}
