'use client'

import { useOptimistic, useTransition } from 'react'
import { toast } from 'sonner'
import { updateLeaseReadyDate } from '@/app/actions/lease-ready-date'

interface LeaseReadyDateInputProps {
  requestId: number
  currentDate: string | null
}

export function LeaseReadyDateInput({ requestId, currentDate }: LeaseReadyDateInputProps) {
  const [optimisticDate, setOptimisticDate] = useOptimistic(currentDate)
  const [isPending, startTransition] = useTransition()

  const toInputValue = (d: string | null) => (d ? d.slice(0, 10) : '')

  function handleBlur(e: React.FocusEvent<HTMLInputElement>) {
    const newValue = e.target.value
    if (newValue === toInputValue(optimisticDate)) return

    startTransition(async () => {
      setOptimisticDate(newValue || null)
      const result = await updateLeaseReadyDate(requestId, newValue || null)
      if (result.success) {
        toast.success('Lease-ready date updated', { duration: 3000 })
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
      className="w-36 text-xs border border-card-border rounded px-2 py-1 bg-card focus:outline-none focus:ring-2 focus:ring-emerald/30 disabled:opacity-50"
    />
  )
}
