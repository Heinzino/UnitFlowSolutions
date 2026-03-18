import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { ROLE_ROUTES } from '@/lib/types/auth'
import type { UserRole } from '@/lib/types/auth'
import { fetchProperties } from '@/lib/airtable/tables/properties'
import type { PropertyOption } from '@/components/ui/property-multi-select'
import { AddVacantForm } from './add-vacant-form'

export default async function VacantPage() {
  // 1. Auth guard — redirect unauthenticated users; any authenticated user may access this page
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect(ROLE_ROUTES['pm'])
  }

  const role = (user.app_metadata?.role as UserRole) ?? 'pm'
  const assignedPropertyIds: string[] = user.app_metadata?.property_ids ?? []

  // 2. Fetch properties and deduplicate by name (table has one record per unit)
  const allProperties = await fetchProperties()
  const uniqueMap = new Map<string, PropertyOption>()
  for (const p of allProperties) {
    if (!uniqueMap.has(p.propertyName)) {
      uniqueMap.set(p.propertyName, { name: p.propertyName, streetAddress: p.streetAddress })
    }
  }

  // 3. PM users see only their assigned properties (property_ids contains property NAME strings)
  const properties: PropertyOption[] = Array.from(uniqueMap.values())
    .filter((p) => role !== 'pm' || assignedPropertyIds.includes(p.name))
    .sort((a, b) => a.name.localeCompare(b.name))

  // 4. Render
  return (
    <div className="max-w-2xl mx-auto py-8 px-4">
      <h1 className="text-2xl font-heading font-bold text-white mb-6">Add Vacant Units</h1>
      <AddVacantForm properties={properties} />
    </div>
  )
}
