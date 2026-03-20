'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ChevronUp, ChevronDown } from 'lucide-react'
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table'

export interface PropertyStat {
  propertyName: string
  activeTurns: number
  avgTurnTime: number | null
  revenueExposure: number
}

type SortCol = 'propertyName' | 'activeTurns' | 'avgTurnTime' | 'revenueExposure'
type SortDir = 'asc' | 'desc'

export function PropertyInsightsTable({ data }: { data: PropertyStat[] }) {
  const [sortCol, setSortCol] = useState<SortCol>('revenueExposure')
  const [sortDir, setSortDir] = useState<SortDir>('desc')
  const router = useRouter()

  function handleSort(col: SortCol) {
    if (col === sortCol) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortCol(col)
      setSortDir(col === 'propertyName' ? 'asc' : 'desc')
    }
  }

  const sorted = [...data].sort((a, b) => {
    let cmp = 0
    if (sortCol === 'propertyName') {
      cmp = a.propertyName.localeCompare(b.propertyName)
    } else if (sortCol === 'avgTurnTime') {
      // nulls last
      const aVal = a.avgTurnTime ?? (sortDir === 'asc' ? Infinity : -Infinity)
      const bVal = b.avgTurnTime ?? (sortDir === 'asc' ? Infinity : -Infinity)
      cmp = aVal - bVal
    } else {
      cmp = (a[sortCol] as number) - (b[sortCol] as number)
    }
    return sortDir === 'asc' ? cmp : -cmp
  })

  function SortIcon({ col }: { col: SortCol }) {
    if (col !== sortCol) return null
    return sortDir === 'asc'
      ? <ChevronUp size={12} className="inline ml-1 text-text-secondary" />
      : <ChevronDown size={12} className="inline ml-1 text-text-secondary" />
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>
            <button className="cursor-pointer" onClick={() => handleSort('propertyName')}>
              Property Name
              <SortIcon col="propertyName" />
            </button>
          </TableHead>
          <TableHead className="text-right">
            <button className="cursor-pointer" onClick={() => handleSort('activeTurns')}>
              Active Turns
              <SortIcon col="activeTurns" />
            </button>
          </TableHead>
          <TableHead className="text-right">
            <button className="cursor-pointer" onClick={() => handleSort('avgTurnTime')}>
              Avg Turn Time
              <SortIcon col="avgTurnTime" />
            </button>
          </TableHead>
          <TableHead className="text-right">
            <button className="cursor-pointer" onClick={() => handleSort('revenueExposure')}>
              Revenue Exposure
              <SortIcon col="revenueExposure" />
            </button>
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {sorted.map((row) => (
          <TableRow
            key={row.propertyName}
            className="cursor-pointer hover:bg-surface"
            onClick={() => router.push(`/regional/property/${encodeURIComponent(row.propertyName)}`)}
          >
            <TableCell>{row.propertyName}</TableCell>
            <TableCell className="text-right">{row.activeTurns}</TableCell>
            <TableCell className="text-right">
              {row.avgTurnTime !== null ? `${Math.round(row.avgTurnTime)} days` : 'N/A'}
            </TableCell>
            <TableCell className="text-right">
              {new Intl.NumberFormat('en-US', {
                style: 'currency',
                currency: 'USD',
                maximumFractionDigits: 0,
              }).format(row.revenueExposure)}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
