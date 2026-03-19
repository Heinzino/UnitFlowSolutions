'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ChevronUp, ChevronDown } from 'lucide-react'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table'
import { StatusBadge, type Status } from '@/components/ui/status-badge'
import { Card } from '@/components/ui/card'
import type { Job } from '@/lib/types/airtable'

type SortCol = 'vendor' | 'status' | 'daysOpen'
type SortDir = 'asc' | 'desc'

function getDaysOpen(job: Job): number | null {
  if (job.startDate !== null) {
    return Math.floor((Date.now() - new Date(job.startDate).getTime()) / (1000 * 60 * 60 * 24))
  }
  return null
}

function toStatusBadgeStatus(jobStatus: string): Status {
  switch (jobStatus) {
    case 'Completed': return 'completed'
    case 'Ready': return 'ready'
    case 'NEEDS ATTENTION': return 'attention'
    case 'Blocked': return 'blocked'
    case 'In Progress': return 'in-progress'
    default: return 'in-progress'
  }
}

interface ActiveJobsTableProps {
  jobs: (Job & { unitNumber?: string; turnRequestId?: number })[]
}

export function ActiveJobsTable({ jobs }: ActiveJobsTableProps) {
  const [sortCol, setSortCol] = useState<SortCol>('daysOpen')
  const [sortDir, setSortDir] = useState<SortDir>('desc')

  function handleSort(col: SortCol) {
    if (col === sortCol) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortCol(col)
      setSortDir(col === 'daysOpen' ? 'desc' : 'asc')
    }
  }

  const sorted = [...jobs].sort((a, b) => {
    let cmp = 0
    if (sortCol === 'vendor') {
      cmp = (a.vendorName ?? '').localeCompare(b.vendorName ?? '')
    } else if (sortCol === 'status') {
      cmp = a.status.localeCompare(b.status)
    } else {
      cmp = (getDaysOpen(a) ?? -1) - (getDaysOpen(b) ?? -1)
    }
    return sortDir === 'asc' ? cmp : -cmp
  })

  function SortIcon({ col }: { col: SortCol }) {
    if (col !== sortCol) return null
    return sortDir === 'asc'
      ? <ChevronUp className="text-text-secondary w-3 h-3 inline-block ml-1 align-middle" />
      : <ChevronDown className="text-text-secondary w-3 h-3 inline-block ml-1 align-middle" />
  }

  if (jobs.length === 0) {
    return (
      <Card>
        <div className="px-6 py-3 bg-card border-b border-card-border">
          <h2 className="font-heading text-xl font-bold text-text-primary">Active Jobs</h2>
        </div>
        <div className="px-6 py-12 text-center">
          <h3 className="font-heading font-semibold text-text-primary mb-1">No active jobs</h3>
          <p className="text-sm text-text-secondary">There are no in-flight jobs across your open turns.</p>
        </div>
      </Card>
    )
  }

  return (
    <Card variant="flush" className="overflow-hidden">
      <div className="px-6 py-3 bg-card border-b border-card-border">
        <h2 className="font-heading text-xl font-bold text-text-primary">Active Jobs</h2>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>
              <button className="cursor-pointer" onClick={() => handleSort('vendor')}>
                Vendor
                <SortIcon col="vendor" />
              </button>
            </TableHead>
            <TableHead>
              <button className="cursor-pointer" onClick={() => handleSort('status')}>
                Status
                <SortIcon col="status" />
              </button>
            </TableHead>
            <TableHead>
              <button className="cursor-pointer" onClick={() => handleSort('daysOpen')}>
                Days Open
                <SortIcon col="daysOpen" />
              </button>
            </TableHead>
            <TableHead>Unit</TableHead>
            <TableHead>Turn</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sorted.map((job) => {
            const daysOpen = getDaysOpen(job)
            return (
              <TableRow key={job.jobId}>
                <TableCell>{job.vendorName ?? '---'}</TableCell>
                <TableCell>
                  <StatusBadge status={toStatusBadgeStatus(job.status)} />
                </TableCell>
                <TableCell>{daysOpen !== null ? `${daysOpen} days` : '---'}</TableCell>
                <TableCell>
                  <Link
                    href={`/property/turn/${job.turnRequestId}`}
                    className="text-emerald hover:underline"
                  >
                    {job.unitNumber ?? '---'}
                  </Link>
                </TableCell>
                <TableCell>
                  <Link
                    href={`/property/turn/${job.turnRequestId}`}
                    className="text-emerald hover:underline"
                  >
                    #{job.turnRequestId}
                  </Link>
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </Card>
  )
}
