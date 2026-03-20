import { Suspense } from 'react'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { RMKPIs } from './_components/rm-kpis'
import { PMKPISkeleton } from '../property/_components/pm-kpi-skeleton'
import { PropertyInsights } from './_components/property-insights'
import { PropertyInsightsSkeleton } from './_components/property-insights-skeleton'

export default async function RegionalPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const assignedProperties: string[] = user.app_metadata?.property_ids ?? []
  const displayName: string = user.user_metadata?.full_name ?? user.email ?? 'Unknown'

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="font-heading font-bold text-xl text-white">Regional Dashboard</h1>
        <p className="text-white/70 text-sm mt-0.5">Welcome, {displayName}</p>
      </div>
      <Suspense fallback={<PMKPISkeleton />}>
        <RMKPIs assignedProperties={assignedProperties} />
      </Suspense>
      <Suspense fallback={<PropertyInsightsSkeleton />}>
        <PropertyInsights assignedProperties={assignedProperties} />
      </Suspense>
    </div>
  )
}
