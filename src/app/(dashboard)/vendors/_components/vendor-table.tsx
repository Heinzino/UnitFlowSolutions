'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ChevronUp, ChevronDown } from 'lucide-react'
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import type { Vendor } from '@/lib/types/airtable'

type SortKey = 'vendorName' | 'numJobsCompleted' | 'avgCompletionTimeDays' | 'numJobsAssigned'
type SortDir = 'asc' | 'desc'

interface VendorTableProps {
  vendors: Vendor[]
}

function SortIcon({ column, sortKey, sortDir }: { column: SortKey; sortKey: SortKey; sortDir: SortDir }) {
  if (column !== sortKey) return null
  return sortDir === 'asc'
    ? <ChevronUp className="inline-block w-3 h-3 ml-1" />
    : <ChevronDown className="inline-block w-3 h-3 ml-1" />
}

export function VendorTable({ vendors }: VendorTableProps) {
  const [sortKey, setSortKey] = useState<SortKey>('numJobsCompleted')
  const [sortDir, setSortDir] = useState<SortDir>('desc')

  function handleSort(column: SortKey) {
    if (column === sortKey) {
      setSortDir(d => (d === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortKey(column)
      setSortDir('desc')
    }
  }

  const sorted = [...vendors].sort((a, b) => {
    let aVal: string | number
    let bVal: string | number

    if (sortKey === 'vendorName') {
      aVal = a.vendorName.toLowerCase()
      bVal = b.vendorName.toLowerCase()
    } else if (sortKey === 'avgCompletionTimeDays') {
      // Nulls sort to the bottom regardless of direction
      if (a.avgCompletionTimeDays == null && b.avgCompletionTimeDays == null) return 0
      if (a.avgCompletionTimeDays == null) return 1
      if (b.avgCompletionTimeDays == null) return -1
      aVal = a.avgCompletionTimeDays
      bVal = b.avgCompletionTimeDays
    } else {
      aVal = a[sortKey]
      bVal = b[sortKey]
    }

    if (aVal < bVal) return sortDir === 'asc' ? -1 : 1
    if (aVal > bVal) return sortDir === 'asc' ? 1 : -1
    return 0
  })

  const headClass = 'cursor-pointer select-none'

  return (
    <div className="bg-card rounded-card shadow-sm overflow-hidden">
      <Table className="w-full">
        <TableHeader>
          <TableRow className="border-b border-card-border hover:bg-transparent">
            <TableHead className={headClass} onClick={() => handleSort('vendorName')}>
              Vendor Name
              <SortIcon column="vendorName" sortKey={sortKey} sortDir={sortDir} />
            </TableHead>
            <TableHead className={headClass} onClick={() => handleSort('numJobsCompleted')}>
              Jobs Completed
              <SortIcon column="numJobsCompleted" sortKey={sortKey} sortDir={sortDir} />
            </TableHead>
            <TableHead className={headClass} onClick={() => handleSort('avgCompletionTimeDays')}>
              Avg Completion Time (Days)
              <SortIcon column="avgCompletionTimeDays" sortKey={sortKey} sortDir={sortDir} />
            </TableHead>
            <TableHead className={headClass} onClick={() => handleSort('numJobsAssigned')}>
              Jobs Assigned
              <SortIcon column="numJobsAssigned" sortKey={sortKey} sortDir={sortDir} />
            </TableHead>
            <TableHead>Jobs</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sorted.map((vendor, idx) => (
            <TableRow key={`${vendor.vendorName}-${idx}`} className="border-b border-card-border">
              <TableCell className="font-medium">{vendor.vendorName}</TableCell>
              <TableCell className="tabular-nums">{vendor.numJobsCompleted}</TableCell>
              <TableCell className="tabular-nums">
                {vendor.avgCompletionTimeDays != null
                  ? vendor.avgCompletionTimeDays.toFixed(1)
                  : 'N/A'}
              </TableCell>
              <TableCell className="tabular-nums">{vendor.numJobsAssigned}</TableCell>
              <TableCell>
                {vendor.jobIds.length === 0 ? (
                  <span>-</span>
                ) : (
                  <div className="flex flex-wrap gap-1">
                    {vendor.jobIds.map(jobId => (
                      <Link key={jobId} href={`/property/job/${jobId}`}>
                        <Badge variant="default">{jobId}</Badge>
                      </Link>
                    ))}
                  </div>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
