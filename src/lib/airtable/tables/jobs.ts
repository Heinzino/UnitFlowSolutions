import { cacheTag, cacheLife } from 'next/cache'
import type { FieldSet } from 'airtable'
import { base, rateLimiter } from '../client'
import { CACHE_TAGS } from '../cache-tags'
import { mapJob, buildJobFilterFormula } from './mappers'
import type { Job } from '@/lib/types/airtable'

// Re-export for consumers that need them
export { mapJob, buildJobFilterFormula } from './mappers'

// Only fetch the fields mapJob actually reads — cuts payload size
const JOB_FIELDS = [
  'Job ID', 'Request Type', 'Status', 'Status Message',
  'Start Date', 'End Date', 'Vendor Name', 'Vendor Type',
  'Contact Name (from Vendor)', 'Email (from Vendor)', 'Phone (from Vendor)',
  'Price (from Quote Price)', 'Quote Price',
  'Request ID (from Turn Requests)', 'Property Name',
  'Duration (Days, If Completed)', 'Delta', 'Is Completed', 'Created',
]

export async function fetchJobs(): Promise<Job[]> {
  'use cache'
  cacheLife('airtableData')
  cacheTag(CACHE_TAGS.jobs)

  await rateLimiter.acquire()
  const records = await base<FieldSet>('Jobs').select({ fields: JOB_FIELDS }).all()
  return records.map(mapJob)
}

export async function fetchJobsByIds(jobIds: number[]): Promise<Job[]> {
  'use cache'
  cacheLife('airtableData')
  cacheTag(CACHE_TAGS.jobs, ...jobIds.map((id) => CACHE_TAGS.job(id)))

  if (jobIds.length === 0) return []

  const formula = buildJobFilterFormula(jobIds)
  await rateLimiter.acquire()
  const records = await base<FieldSet>('Jobs')
    .select({ filterByFormula: formula })
    .all()

  return records.map(mapJob)
}

export async function fetchJobById(jobId: number): Promise<Job | null> {
  'use cache'
  cacheLife('airtableData')
  cacheTag(CACHE_TAGS.job(jobId))

  await rateLimiter.acquire()
  const records = await base<FieldSet>('Jobs')
    .select({ filterByFormula: `{Job ID}=${jobId}` })
    .all()

  return records[0] ? mapJob(records[0]) : null
}
