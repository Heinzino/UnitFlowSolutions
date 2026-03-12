import { cacheTag, cacheLife } from 'next/cache'
import type { FieldSet } from 'airtable'
import { base, rateLimiter } from '../client'
import { CACHE_TAGS } from '../cache-tags'
import type { VendorPricing } from '@/lib/types/airtable'

function mapVendorPricing(record: { fields: FieldSet }): VendorPricing {
  const f = record.fields as Record<string, unknown>
  return {
    propertyName: String(f['Property Name'] ?? ''),
    vendorName: String(f['Vendor Name'] ?? ''),
    serviceType: String(f['Service Type'] ?? ''),
    floorPlan: String(f['Floor Plan'] ?? ''),
    price: Number(f['Price']) || 0,
  }
}

export async function fetchVendorPricing(): Promise<VendorPricing[]> {
  'use cache'
  cacheLife('airtableData')
  cacheTag(CACHE_TAGS.vendorPricing)

  await rateLimiter.acquire()
  const records = await base<FieldSet>('Vendor_Pricing').select().all()
  return records.map(mapVendorPricing)
}
