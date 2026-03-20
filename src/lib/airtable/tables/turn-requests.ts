import { cacheTag, cacheLife } from 'next/cache'
import type { FieldSet } from 'airtable'
import { base, rateLimiter } from '../client'
import { CACHE_TAGS } from '../cache-tags'
import { mapTurnRequest } from './mappers'
import { fetchJobs } from './jobs'
import { filterByProperties } from '@/lib/normalize-property-name'
import type { TurnRequest } from '@/lib/types/airtable'
import type { UserRole } from '@/lib/types/auth'

// Re-export for consumers that need it
export { mapTurnRequest } from './mappers'

// ---------------------------------------------------------------------------
// Linked record resolution (batch, no N+1)
// ---------------------------------------------------------------------------

async function resolveLinkedJobs(
  turnRequests: TurnRequest[]
): Promise<TurnRequest[]> {
  // Fetch ALL jobs in one API call instead of N+1 individual lookups
  const allJobs = await fetchJobs()

  // Build lookup maps for both record IDs and numeric job IDs
  const byRecordId = new Map<string, typeof allJobs[number]>()
  const byJobId = new Map<number, typeof allJobs[number]>()
  for (const job of allJobs) {
    if (job.recordId) byRecordId.set(job.recordId, job)
    byJobId.set(job.jobId, job)
  }

  return turnRequests.map((tr) => {
    // Prefer record ID resolution, fall back to numeric job IDs
    let resolved: typeof allJobs
    if (tr.jobRecordIds.length > 0) {
      resolved = tr.jobRecordIds
        .map((recId) => byRecordId.get(recId))
        .filter(Boolean) as typeof allJobs
    } else {
      resolved = tr.jobIds
        .map((id) => byJobId.get(id))
        .filter(Boolean) as typeof allJobs
    }

    return {
      ...tr,
      jobs: resolved,
      jobIds: resolved.map((j) => j.jobId),
    }
  })
}

// ---------------------------------------------------------------------------
// Fetch functions
// ---------------------------------------------------------------------------

// Only fetch the fields mapTurnRequest actually reads
const TR_FIELDS = [
  'Request ID', 'Ready To Lease Date', 'Vacant Date', 'Target Date',
  'Status', 'Jobs', 'Time to Complete Unit (Days)', 'Notes',
  'Price (from Quote Price) (from Jobs)', 'Total Cost', 'Value',
  'Property Name', 'Street Address (from Properties)',
  'Unit Number (from Properties)', 'Floor Plan (from Properties)',
  'City (from Properties)', 'State (from Properties)',
  'Bedrooms (from Properties)', 'Bathrooms (from Properties)',
  'Days Vacant Until Ready', 'Created',
]

export async function fetchTurnRequests(): Promise<TurnRequest[]> {
  'use cache'
  cacheLife('airtableData')
  cacheTag(CACHE_TAGS.turnRequests)

  await rateLimiter.acquire()
  const records = await base<FieldSet>('Turn Requests').select({ fields: TR_FIELDS }).all()
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
