import { cacheTag, cacheLife } from 'next/cache'
import type { FieldSet } from 'airtable'
import { base, rateLimiter } from '../client'
import { CACHE_TAGS } from '../cache-tags'
import { mapJob, buildJobFilterFormula } from './mappers'
import type { Job } from '@/lib/types/airtable'

// Re-export for consumers that need them
export { mapJob, buildJobFilterFormula } from './mappers'

export async function fetchJobs(): Promise<Job[]> {
  'use cache'
  cacheLife('airtableData')
  cacheTag(CACHE_TAGS.jobs)

  await rateLimiter.acquire()
  const records = await base<FieldSet>('Jobs').select().all()
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
