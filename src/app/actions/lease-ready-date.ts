'use server'

import { revalidateTag } from 'next/cache'
import { CACHE_TAGS } from '@/lib/airtable/cache-tags'
import { base, rateLimiter } from '@/lib/airtable/client'

export async function updateLeaseReadyDate(
  requestId: number,
  date: string | null
): Promise<{ success: boolean; error?: string }> {
  try {
    await rateLimiter.acquire()

    // Find the Airtable record by Request ID field
    const records = await base('Turn Requests')
      .select({ filterByFormula: `{Request ID}=${requestId}` })
      .all()

    if (records.length === 0) {
      return { success: false, error: 'Turn request not found' }
    }

    // Update the Ready To Lease Date field in Airtable
    // Use undefined instead of null to clear the field (Airtable SDK constraint)
    await base('Turn Requests').update(records[0].id, { 'Ready To Lease Date': date ?? undefined })

    // Bust cache tags for this turn request and related caches
    revalidateTag(CACHE_TAGS.turnRequest(requestId), { expire: 0 })
    revalidateTag(CACHE_TAGS.turnRequests, { expire: 0 })
    revalidateTag(CACHE_TAGS.kpis, { expire: 0 })

    return { success: true }
  } catch (err) {
    console.error('[updateLeaseReadyDate]', err)
    return { success: false, error: 'Failed to update lease-ready date' }
  }
}
