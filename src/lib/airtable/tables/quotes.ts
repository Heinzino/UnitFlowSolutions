import { cacheTag, cacheLife } from 'next/cache'
import type { Record as AirtableRecord, FieldSet } from 'airtable'
import { base, rateLimiter } from '../client'
import { CACHE_TAGS } from '../cache-tags'
import type { Quote } from '@/lib/types/airtable'

function mapQuote(record: AirtableRecord<FieldSet>): Quote {
  const f = record.fields as Record<string, unknown>
  return {
    quoteId: record.id,
    status: String(f['Status'] ?? ''),
    startDate: f['Start Date'] ? String(f['Start Date']) : null,
    endDate: f['End Date'] ? String(f['End Date']) : null,
    vendorName: f['Vendor Name'] ? String(f['Vendor Name']) : null,
    vendorType: f['Vendor Type'] ? String(f['Vendor Type']) : null,
    propertyName: f['Property'] ? String(f['Property']) : null,
    created: String(f['Created'] ?? ''),
  }
}

export async function fetchQuotes(): Promise<Quote[]> {
  'use cache'
  cacheLife('airtableData')
  cacheTag(CACHE_TAGS.quotes)

  await rateLimiter.acquire()
  const records = await base<FieldSet>('Quotes').select().all()
  return records.map(mapQuote)
}
