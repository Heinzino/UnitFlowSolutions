'use client'

import { useOptimistic, useTransition } from 'react'
import { toast } from 'sonner'
import { updateJobStatus } from '@/app/actions/job-status'
import { JOB_STATUSES, type JobStatus } from '@/lib/types/airtable'

interface JobStatusDropdownProps {
  jobId: number
  turnRequestId: number
  currentStatus: JobStatus
}

export function JobStatusDropdown({
  jobId,
  turnRequestId,
  currentStatus,
}: JobStatusDropdownProps) {
  const [optimisticStatus, setOptimisticStatus] = useOptimistic(currentStatus)
  const [isPending, startTransition] = useTransition()

  function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const newStatus = e.target.value as JobStatus

    startTransition(async () => {
      setOptimisticStatus(newStatus)
      const result = await updateJobStatus(jobId, turnRequestId, newStatus)

      if (result.success) {
        toast.success(`Job #${jobId} updated to ${newStatus}`, { duration: 3000 })
      } else {
        // Revert optimistic update on failure
        setOptimisticStatus(currentStatus)
        toast.error('Failed to update status. Please try again.')
      }
    })
  }

  return (
    <select
      value={optimisticStatus}
      onChange={handleChange}
      disabled={isPending}
      onClick={(e) => e.stopPropagation()}
      className="text-xs border border-card-border rounded-pill px-2 py-1 bg-card disabled:opacity-50"
    >
      {Object.keys(JOB_STATUSES).map((status) => (
        <option key={status} value={status}>
          {status === optimisticStatus ? `✓ ${status}` : status}
        </option>
      ))}
    </select>
  )
}
