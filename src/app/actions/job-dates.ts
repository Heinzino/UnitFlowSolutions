'use server'

import { revalidateTag } from 'next/cache'
import { CACHE_TAGS } from '@/lib/airtable/cache-tags'
import { base, rateLimiter } from '@/lib/airtable/client'

export async function updateJobDates(
  jobId: number,
  turnRequestId: number,
  startDate: string | null,
  endDate: string | null
): Promise<{ success: boolean; error?: string }> {
  try {
    await rateLimiter.acquire()

    const records = await base('Jobs')
      .select({ filterByFormula: `{Job ID}=${jobId}` })
      .all()

    if (records.length === 0) {
      return { success: false, error: 'Job not found' }
    }

    await base('Jobs').update(records[0].id, {
      'Start Date': startDate ?? undefined,
      'End Date': endDate ?? undefined,
    })

    revalidateTag(CACHE_TAGS.job(jobId), { expire: 0 })
    revalidateTag(CACHE_TAGS.jobs, { expire: 0 })
    revalidateTag(CACHE_TAGS.turnRequest(turnRequestId), { expire: 0 })
    revalidateTag(CACHE_TAGS.turnRequests, { expire: 0 })

    return { success: true }
  } catch (err) {
    console.error('[updateJobDates]', err)
    return { success: false, error: 'Failed to update job dates' }
  }
}
