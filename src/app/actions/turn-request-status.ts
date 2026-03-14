'use server'

import { revalidateTag } from 'next/cache'
import { CACHE_TAGS } from '@/lib/airtable/cache-tags'
import { base, rateLimiter } from '@/lib/airtable/client'

export const TURN_REQUEST_STATUSES = {
  'Done': 'Done',
  'In progress': 'In progress',
} as const

export type TurnRequestStatus = keyof typeof TURN_REQUEST_STATUSES

export async function updateTurnRequestStatus(
  requestId: number,
  status: string
): Promise<{ success: boolean; error?: string }> {
  // Validate status is a known TurnRequestStatus value
  if (!(status in TURN_REQUEST_STATUSES)) {
    return { success: false, error: 'Invalid turn request status' }
  }

  try {
    await rateLimiter.acquire()

    // Find the Airtable record by Request ID field
    const records = await base('Turn Requests')
      .select({ filterByFormula: `{Request ID}=${requestId}` })
      .all()

    if (records.length === 0) {
      return { success: false, error: 'Turn request not found' }
    }

    // Update the status field in Airtable
    await base('Turn Requests').update(records[0].id, { Status: status })

    // Bust cache tags for this turn request and related caches
    revalidateTag(CACHE_TAGS.turnRequest(requestId), { expire: 0 })
    revalidateTag(CACHE_TAGS.turnRequests, { expire: 0 })
    revalidateTag(CACHE_TAGS.kpis, { expire: 0 })

    return { success: true }
  } catch (err) {
    console.error('[updateTurnRequestStatus]', err)
    return { success: false, error: 'Failed to update turn request status' }
  }
}
