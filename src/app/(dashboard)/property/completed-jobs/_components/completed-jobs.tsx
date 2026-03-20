import { fetchTurnRequestsForUser } from '@/lib/airtable/tables/turn-requests'
import { CompletedJobsClient } from './completed-jobs-client'
import type { UserRole } from '@/lib/types/auth'

interface CompletedJobsProps {
  assignedProperties: string[]
  role: string
}

export async function CompletedJobs({ assignedProperties, role }: CompletedJobsProps) {
  const turnRequests = await fetchTurnRequestsForUser(role as UserRole, assignedProperties)

  const allJobs = turnRequests.flatMap((tr) =>
    (tr.jobs ?? []).map((j) => ({
      ...j,
      unitNumber: tr.unitNumber,
      turnRequestId: tr.requestId,
      propertyName: tr.propertyName,
    }))
  )

  // Deduplicate by jobId
  const uniqueJobs = Array.from(new Map(allJobs.map((j) => [j.jobId, j])).values())

  // Filter to completed jobs using isCompleted boolean
  const completedJobs = uniqueJobs.filter((j) => j.isCompleted)

  // Derive sorted unique property names for the filter control
  const propertyNames = Array.from(
    new Set(completedJobs.map((j) => j.propertyName).filter(Boolean) as string[])
  ).sort()

  return <CompletedJobsClient jobs={completedJobs} propertyNames={propertyNames} />
}
