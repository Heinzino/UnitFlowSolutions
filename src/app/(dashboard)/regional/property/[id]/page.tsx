import { Suspense } from 'react'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { PMKPIs } from '@/app/(dashboard)/property/_components/pm-kpis'
import { PMKPISkeleton } from '@/app/(dashboard)/property/_components/pm-kpi-skeleton'
import { PMTurnList } from '@/app/(dashboard)/property/_components/pm-turn-list'
import { PMTurnListSkeleton } from '@/app/(dashboard)/property/_components/pm-turn-list-skeleton'
import { ActiveJobs } from '@/app/(dashboard)/property/_components/active-jobs'

export default async function RegionalPropertyPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const propertyName = decodeURIComponent(id)

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Verify RM has access to this property
  const assignedProperties: string[] = user.app_metadata?.property_ids ?? []
  if (!assignedProperties.includes(propertyName)) {
    redirect('/regional')
  }

  return (
    <div className="flex flex-col gap-4">
      <Link
        href="/regional"
        className="inline-flex items-center gap-1 text-white/70 hover:text-white text-sm mb-2"
      >
        <ArrowLeft size={14} />
        Back to Dashboard
      </Link>

      <h1 className="font-heading font-bold text-xl text-white">{propertyName}</h1>

      <Suspense fallback={<PMKPISkeleton />}>
        <PMKPIs assignedProperties={[propertyName]} role="rm" />
      </Suspense>

      <Suspense fallback={<PMTurnListSkeleton />}>
        <PMTurnList assignedProperties={[propertyName]} role="rm" />
      </Suspense>

      <Suspense fallback={<PMTurnListSkeleton />}>
        <ActiveJobs assignedProperties={[propertyName]} role="rm" />
      </Suspense>
    </div>
  )
}
