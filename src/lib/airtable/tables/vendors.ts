import { cacheTag, cacheLife } from 'next/cache'
import type { FieldSet } from 'airtable'
import { base, rateLimiter } from '../client'
import { CACHE_TAGS } from '../cache-tags'
import type { Vendor } from '@/lib/types/airtable'

function mapVendor(record: { fields: FieldSet }): Vendor {
  const f = record.fields as Record<string, unknown>
  return {
    vendorName: String(f['Vendor Name'] ?? ''),
    vendorType: String(f['Vendor Type'] ?? ''),
    contactName: f['Contact Name'] ? String(f['Contact Name']) : null,
    email: f['Email'] ? String(f['Email']) : null,
    phone: f['Phone'] ? String(f['Phone']) : null,
    numJobsCompleted: Number(f['Num Jobs Completed']) || 0,
    numJobsAssigned: Number(f['Num Jobs Assigned']) || 0,
    avgCompletionTimeDays:
      f['Average Completion Time (Days)'] != null
        ? Number(f['Average Completion Time (Days)']) || null
        : null,
    jobIds: Array.isArray(f['Jobs'])
      ? (f['Jobs'] as (string | number)[]).map(id => Number(id)).filter(n => !isNaN(n))
      : typeof f['Jobs'] === 'string' && f['Jobs']
        ? String(f['Jobs']).split(',').map(s => Number(s.trim())).filter(n => !isNaN(n))
        : [],
  }
}

export async function fetchVendors(): Promise<Vendor[]> {
  'use cache'
  cacheLife('airtableData')
  cacheTag(CACHE_TAGS.vendors)

  await rateLimiter.acquire()
  const records = await base<FieldSet>('Vendors').select().all()
  return records.map(mapVendor)
}
