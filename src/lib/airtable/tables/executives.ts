import { cacheTag, cacheLife } from 'next/cache'
import type { FieldSet } from 'airtable'
import { base, rateLimiter } from '../client'
import type { Executive } from '@/lib/types/airtable'

function mapExecutive(record: { fields: FieldSet }): Executive {
  const f = record.fields as Record<string, unknown>
  return {
    name: String(f['Name'] ?? ''),
    role: String(f['Role'] ?? ''),
    email: String(f['Email'] ?? ''),
  }
}

export async function fetchExecutives(): Promise<Executive[]> {
  'use cache'
  cacheLife('airtableData')
  cacheTag('executives')

  await rateLimiter.acquire()
  const records = await base<FieldSet>('Executives').select().all()
  return records.map(mapExecutive)
}
