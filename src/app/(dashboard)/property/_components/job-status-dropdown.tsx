'use client'

import { useState, useRef, useEffect, useOptimistic, useTransition, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { ChevronDown, Check } from 'lucide-react'
import { clsx } from 'clsx'
import { toast } from 'sonner'
import { updateJobStatus } from '@/app/actions/job-status'
import { JOB_STATUSES, type JobStatus } from '@/lib/types/airtable'

interface JobStatusDropdownProps {
  jobId: number
  turnRequestId: number
  currentStatus: JobStatus
}

const statusColors: Record<string, { bg: string; text: string; dot: string }> = {
  'NEEDS ATTENTION': { bg: 'bg-amber-100', text: 'text-amber-800', dot: 'bg-amber-500' },
  'Blocked': { bg: 'bg-red-100', text: 'text-red-800', dot: 'bg-red-500' },
  'In Progress': { bg: 'bg-blue-100', text: 'text-blue-800', dot: 'bg-blue-500' },
  'Completed': { bg: 'bg-emerald-100', text: 'text-emerald-800', dot: 'bg-emerald-500' },
  'Ready': { bg: 'bg-green-100', text: 'text-green-800', dot: 'bg-green-500' },
}

function getColors(status: string) {
  return statusColors[status] ?? { bg: 'bg-gray-100', text: 'text-gray-800', dot: 'bg-gray-500' }
}

export function JobStatusDropdown({
  jobId,
  turnRequestId,
  currentStatus,
}: JobStatusDropdownProps) {
  const [open, setOpen] = useState(false)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const [pos, setPos] = useState({ top: 0, left: 0 })
  const [optimisticStatus, setOptimisticStatus] = useOptimistic(currentStatus)
  const [isPending, startTransition] = useTransition()

  const updatePosition = useCallback(() => {
    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect()
      setPos({ top: rect.bottom + 4, left: rect.left })
    }
  }, [])

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        buttonRef.current && !buttonRef.current.contains(e.target as Node) &&
        menuRef.current && !menuRef.current.contains(e.target as Node)
      ) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => {
    if (open) updatePosition()
  }, [open, updatePosition])

  function handleSelect(newStatus: JobStatus) {
    setOpen(false)
    if (newStatus === optimisticStatus) return

    startTransition(async () => {
      setOptimisticStatus(newStatus)
      const result = await updateJobStatus(jobId, turnRequestId, newStatus)

      if (result.success) {
        toast.success(`Job #${jobId} updated to ${newStatus}`, { duration: 3000 })
      } else {
        setOptimisticStatus(currentStatus)
        toast.error('Failed to update status. Please try again.')
      }
    })
  }

  const colors = getColors(optimisticStatus)

  return (
    <div
      className="inline-block"
      onClick={(e) => e.stopPropagation()}
    >
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setOpen(!open)}
        disabled={isPending}
        className={clsx(
          'flex items-center gap-1.5 rounded-pill px-2.5 py-1 text-xs font-semibold transition-all',
          colors.bg,
          colors.text,
          isPending && 'opacity-50',
          'hover:shadow-sm cursor-pointer'
        )}
      >
        <span className={clsx('w-1.5 h-1.5 rounded-full', colors.dot)} />
        {optimisticStatus}
        <ChevronDown
          size={12}
          className={clsx('transition-transform', open && 'rotate-180')}
        />
      </button>

      {open && createPortal(
        <div
          ref={menuRef}
          style={{ position: 'fixed', top: pos.top, left: pos.left }}
          className="z-[9999] min-w-[180px] bg-white border border-gray-200 rounded-xl shadow-lg py-1"
          onClick={(e) => e.stopPropagation()}
        >
          {Object.keys(JOB_STATUSES).map((status) => {
            const isActive = status === optimisticStatus
            const c = getColors(status)
            return (
              <button
                key={status}
                type="button"
                onClick={() => handleSelect(status as JobStatus)}
                className={clsx(
                  'flex items-center gap-2 w-full px-3 py-2 text-xs text-left transition-colors',
                  isActive
                    ? 'bg-gray-50 font-semibold'
                    : 'hover:bg-gray-50'
                )}
              >
                <span className={clsx('w-2 h-2 rounded-full', c.dot)} />
                <span className={c.text}>{status}</span>
                {isActive && <Check size={12} className="ml-auto text-emerald-600" />}
              </button>
            )
          })}
        </div>,
        document.body
      )}
    </div>
  )
}
