'use client'

import { useOptimistic, useTransition } from 'react'
import { toast } from 'sonner'
import { updateJobDates } from '@/app/actions/job-dates'

interface JobDateInputProps {
  jobId: number
  turnRequestId: number
  field: 'startDate' | 'endDate'
  currentStartDate: string | null
  currentEndDate: string | null
}

export function JobDateInput({
  jobId,
  turnRequestId,
  field,
  currentStartDate,
  currentEndDate,
}: JobDateInputProps) {
  const currentDate = field === 'startDate' ? currentStartDate : currentEndDate
  const [optimisticDate, setOptimisticDate] = useOptimistic(currentDate)
  const [isPending, startTransition] = useTransition()

  const toInputValue = (d: string | null) => (d ? d.slice(0, 10) : '')

  function handleBlur(e: React.FocusEvent<HTMLInputElement>) {
    const newValue = e.target.value
    if (newValue === toInputValue(optimisticDate)) return

    const newDate = newValue || null

    startTransition(async () => {
      setOptimisticDate(newDate)
      const newStart = field === 'startDate' ? newDate : currentStartDate
      const newEnd = field === 'endDate' ? newDate : currentEndDate
      const result = await updateJobDates(jobId, turnRequestId, newStart, newEnd)
      if (result.success) {
        toast.success(
          `${field === 'startDate' ? 'Start' : 'End'} date updated`,
          { duration: 3000 }
        )
      } else {
        setOptimisticDate(currentDate)
        toast.error('Failed to update date. Please try again.')
      }
    })
  }

  return (
    <input
      key={toInputValue(optimisticDate)}
      type="date"
      defaultValue={toInputValue(optimisticDate)}
      onBlur={handleBlur}
      disabled={isPending}
      onClick={(e) => e.stopPropagation()}
      className="w-32 text-xs border border-card-border rounded px-2 py-1 bg-card focus:outline-none focus:ring-2 focus:ring-emerald/30 disabled:opacity-50"
    />
  )
}
