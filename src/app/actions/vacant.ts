'use server'
import 'server-only'
import { createClient } from '@/lib/supabase/server'
import { base, rateLimiter } from '@/lib/airtable/client'
import { CACHE_TAGS } from '@/lib/airtable/cache-tags'
import { revalidateTag } from 'next/cache'

interface UnitInput {
  unitNumber: string
  floorPlan: string
}

interface UnitResult {
  unitNumber: string
  floorPlan: string
  error?: string
}

export interface AddVacantUnitsResult {
  created: UnitResult[]
  failed: UnitResult[]
}

// Parse bedrooms/bathrooms from floor plan string (copied from admin.ts — not imported)
function parseFloorPlan(floorPlan: string): { bedrooms: number; bathrooms: number } {
  if (floorPlan === 'Studio / Loft') return { bedrooms: 0, bathrooms: 1 }
  const match = floorPlan.match(/^(\d+)br\s+(\d+(?:\.\d+)?)ba$/)
  if (!match) return { bedrooms: 0, bathrooms: 0 }
  return { bedrooms: Number(match[1]), bathrooms: Number(match[2]) }
}

export async function addVacantUnits(
  propertyName: string,
  streetAddress: string,
  units: UnitInput[]
): Promise<AddVacantUnitsResult | { error: string }> {
  // 1. Auth check — any logged-in user may call (not admin-gated)
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  // 2. Create one Airtable record per unit with per-unit error isolation
  const created: UnitResult[] = []
  const failed: UnitResult[] = []

  for (const unit of units) {
    const { bedrooms, bathrooms } = parseFloorPlan(unit.floorPlan)
    try {
      await rateLimiter.acquire()
      await base('Properties').create(
        {
          'Property Name': propertyName,
          'Street Address': streetAddress,
          'Unit Number': unit.unitNumber,
          'Floor Plan': unit.floorPlan,
          'Bedrooms': bedrooms,
          'Bathrooms': bathrooms,
          'City': 'Columbia',
          'State': 'SC',
        },
        { typecast: true }
      )
      created.push({ unitNumber: unit.unitNumber, floorPlan: unit.floorPlan })
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      failed.push({ unitNumber: unit.unitNumber, floorPlan: unit.floorPlan, error: message })
    }
  }

  // 3. Invalidate cache only when at least one unit was created
  if (created.length > 0) {
    revalidateTag(CACHE_TAGS.properties)
  }

  return { created, failed }
}
