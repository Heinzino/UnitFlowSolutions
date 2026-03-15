import { cacheTag, cacheLife } from 'next/cache'
import type { FieldSet } from 'airtable'
import { base, rateLimiter } from '../client'
import { CACHE_TAGS } from '../cache-tags'
import { mapTurnRequest, mapJob } from './mappers'
import { fetchJobsByIds } from './jobs'
import { filterByProperties } from '@/lib/normalize-property-name'
import type { TurnRequest } from '@/lib/types/airtable'
import type { UserRole } from '@/lib/types/auth'

// Re-export for consumers that need it
export { mapTurnRequest } from './mappers'

// ---------------------------------------------------------------------------
// Linked record resolution (batch, no N+1)
// ---------------------------------------------------------------------------

async function fetchJobsByRecordIds(recordIds: string[]) {
  if (recordIds.length === 0) return []
  await rateLimiter.acquire()
  // Airtable SDK: fetch specific records by their record IDs
  const results = await Promise.all(
    recordIds.map((id) => base<FieldSet>('Jobs').find(id))
  )
  return results.map(mapJob)
}

async function resolveLinkedJobs(
  turnRequests: TurnRequest[]
): Promise<TurnRequest[]> {
  // Prefer record IDs (from API linked field), fall back to numeric job IDs
  const allRecordIds = Array.from(
    new Set(turnRequests.flatMap((tr) => tr.jobRecordIds))
  )

  if (allRecordIds.length > 0) {
    const jobs = await fetchJobsByRecordIds(allRecordIds)
    const recordIdToJob = new Map<string, typeof jobs[number]>()
    // Map each record ID to its resolved job
    allRecordIds.forEach((recId, i) => {
      if (jobs[i]) recordIdToJob.set(recId, jobs[i])
    })

    return turnRequests.map((tr) => {
      const resolved = tr.jobRecordIds
        .map((recId) => recordIdToJob.get(recId))
        .filter(Boolean) as typeof jobs
      return {
        ...tr,
        jobs: resolved,
        jobIds: resolved.map((j) => j.jobId),
      }
    })
  }

  // Fallback: numeric job IDs
  const allJobIds = Array.from(
    new Set(turnRequests.flatMap((tr) => tr.jobIds))
  )

  if (allJobIds.length === 0) return turnRequests

  const jobs = await fetchJobsByIds(allJobIds)
  const jobMap = new Map(jobs.map((j) => [j.jobId, j]))

  return turnRequests.map((tr) => ({
    ...tr,
    jobs: tr.jobIds.map((id) => jobMap.get(id)).filter(Boolean) as typeof jobs,
  }))
}

// ---------------------------------------------------------------------------
// Fetch functions
// ---------------------------------------------------------------------------

export async function fetchTurnRequests(): Promise<TurnRequest[]> {
  'use cache'
  cacheLife('airtableData')
  cacheTag(CACHE_TAGS.turnRequests)

  await rateLimiter.acquire()
  const records = await base<FieldSet>('Turn Requests').select().all()
  const turnRequests = records.map(mapTurnRequest)
  return resolveLinkedJobs(turnRequests)
}

export async function fetchTurnRequestById(
  id: number
): Promise<TurnRequest | null> {
  'use cache'
  cacheLife('airtableData')
  cacheTag(CACHE_TAGS.turnRequests, CACHE_TAGS.turnRequest(id))

  await rateLimiter.acquire()
  const records = await base<FieldSet>('Turn Requests')
    .select({ filterByFormula: `{Request ID}=${id}` })
    .all()

  if (!records[0]) return null
  const turnRequests = await resolveLinkedJobs([mapTurnRequest(records[0])])
  return turnRequests[0] ?? null
}

export async function fetchTurnRequestsForUser(
  role: UserRole,
  assignedPropertyNames: string[]
): Promise<TurnRequest[]> {
  'use cache'
  cacheLife('airtableData')
  cacheTag(CACHE_TAGS.turnRequests)

  const all = await fetchTurnRequests()
  if (role === 'exec') return all
  return filterByProperties(all, (tr) => tr.propertyName, assignedPropertyNames)
}
