import { fetchTurnRequestsForUser } from '@/lib/airtable/tables/turn-requests'
import { ActiveJobsTable } from './active-jobs-table'
import type { UserRole } from '@/lib/types/auth'

interface ActiveJobsProps {
  assignedProperties: string[]
  role: string
}

export async function ActiveJobs({ assignedProperties, role }: ActiveJobsProps) {
  const turnRequests = await fetchTurnRequestsForUser(role as UserRole, assignedProperties)

  const activeTurns = turnRequests.filter((tr) => tr.status !== 'Done')

  const allJobs = activeTurns.flatMap((tr) =>
    (tr.jobs ?? []).map((j) => ({
      ...j,
      unitNumber: tr.unitNumber,
      turnRequestId: tr.requestId,
    }))
  )

  // Deduplicate by jobId
  const uniqueJobs = Array.from(new Map(allJobs.map((j) => [j.jobId, j])).values())

  // Filter to in-flight jobs: exclude Completed, Invoice Sent, and Scheduled
  // Ready status IS included per user decision -- it represents in-flight workload
  // Cast to string for comparison — JOB_STATUSES type is narrower than Airtable's actual field values
  const inflightJobs = uniqueJobs.filter(
    (j) => {
      const s = j.status as string
      return s !== 'Completed' && s !== 'Invoice Sent' && s !== 'Scheduled'
    }
  )

  return <ActiveJobsTable jobs={inflightJobs} />
}
