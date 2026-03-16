import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { ADMIN_EMAILS } from '@/lib/constants/admin'
import { ROLE_ROUTES } from '@/lib/types/auth'
import type { UserRole } from '@/lib/types/auth'
import { fetchProperties } from '@/lib/airtable/tables/properties'
import type { PropertyOption } from '@/components/ui/property-multi-select'
import { CreateUserForm } from './create-user-form'

export default async function CreateUserPage() {
  // 1. Auth guard — redirect non-admins silently
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user || !ADMIN_EMAILS.includes(user.email as typeof ADMIN_EMAILS[number])) {
    const role = user?.app_metadata?.role as UserRole | undefined
    redirect(ROLE_ROUTES[role ?? 'pm'])
  }

  // 2. Fetch properties and deduplicate by name (table has one record per unit)
  const allProperties = await fetchProperties()
  const uniqueMap = new Map<string, PropertyOption>()
  for (const p of allProperties) {
    if (!uniqueMap.has(p.propertyName)) {
      uniqueMap.set(p.propertyName, { name: p.propertyName, streetAddress: p.streetAddress })
    }
  }
  const properties: PropertyOption[] = Array.from(uniqueMap.values()).sort((a, b) => a.name.localeCompare(b.name))

  // 3. Render
  return (
    <div className="max-w-2xl mx-auto py-8 px-4">
      <h1 className="text-2xl font-heading font-bold text-text-primary mb-6">Create New User</h1>
      <CreateUserForm properties={properties} />
    </div>
  )
}
