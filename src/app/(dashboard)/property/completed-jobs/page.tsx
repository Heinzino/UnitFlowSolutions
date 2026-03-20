import { Suspense } from 'react'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { CompletedJobs } from './_components/completed-jobs'
import { PMTurnListSkeleton } from '../_components/pm-turn-list-skeleton'

export default async function CompletedJobsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const assignedProperties: string[] = user.app_metadata?.property_ids ?? []
  const role: string = user.app_metadata?.role ?? 'pm'

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="font-heading font-bold text-xl text-white">Completed Jobs</h1>
        <p className="text-white/70 text-sm mt-1">Full history of completed jobs across your properties</p>
      </div>
      <Suspense fallback={<PMTurnListSkeleton />}>
        <CompletedJobs assignedProperties={assignedProperties} role={role} />
      </Suspense>
    </div>
  )
}
