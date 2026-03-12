'use server'

import { revalidateTag } from 'next/cache'
import { CACHE_TAGS } from '@/lib/airtable/cache-tags'
import { JOB_STATUSES } from '@/lib/types/airtable'
import { base, rateLimiter } from '@/lib/airtable/client'

export async function updateJobStatus(
  jobId: number,
  turnRequestId: number,
  status: string
): Promise<{ success: boolean; error?: string }> {
  // Validate status is a known JobStatus value
  if (!(status in JOB_STATUSES)) {
    return { success: false, error: 'Invalid job status' }
  }

  try {
    await rateLimiter.acquire()

    // Find the Airtable record by Job ID field
    const records = await base('Jobs')
      .select({ filterByFormula: `{Job ID}=${jobId}` })
      .all()

    if (records.length === 0) {
      return { success: false, error: 'Job not found' }
    }

    // Update the status field in Airtable
    await base('Jobs').update(records[0].id, { Status: status })

    // Cascade cache bust — bust all 5 related cache tags
    revalidateTag(CACHE_TAGS.job(jobId), { expire: 0 })
    revalidateTag(CACHE_TAGS.jobs, { expire: 0 })
    revalidateTag(CACHE_TAGS.turnRequest(turnRequestId), { expire: 0 })
    revalidateTag(CACHE_TAGS.turnRequests, { expire: 0 })
    revalidateTag(CACHE_TAGS.kpis, { expire: 0 })

    return { success: true }
  } catch (err) {
    console.error('[updateJobStatus]', err)
    return { success: false, error: 'Failed to update job status' }
  }
}
