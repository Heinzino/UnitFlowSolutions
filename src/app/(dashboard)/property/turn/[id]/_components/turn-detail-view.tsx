import Link from 'next/link'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { StatusBadge, type Status } from '@/components/ui/status-badge'
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table'
import { JobStatusDropdown } from '@/app/(dashboard)/property/_components/job-status-dropdown'
import type { TurnRequest } from '@/lib/types/airtable'

interface TurnDetailViewProps {
  turn: TurnRequest
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '---'
  const d = new Date(dateStr)
  if (isNaN(d.getTime())) return '---'
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

function parseCurrency(value: string | null | number): string {
  if (value === null || value === undefined) return 'N/A'
  const num = typeof value === 'number' ? value : parseFloat(String(value).replace(/[^0-9.-]/g, ''))
  if (isNaN(num)) return 'N/A'
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(num)
}

function mapTurnStatusToBadge(status: string): Status {
  const lower = status.toLowerCase()
  if (lower === 'done' || lower === 'completed') return 'completed'
  if (lower === 'ready') return 'ready'
  if (lower.includes('attention') || lower.includes('needs')) return 'attention'
  if (lower === 'blocked') return 'blocked'
  if (lower.includes('progress') || lower.includes('in progress')) return 'in-progress'
  return 'in-progress'
}

export function TurnDetailView({ turn }: TurnDetailViewProps) {
  const jobs = turn.jobs ?? []

  const turnPrice = turn.totalCost
    ? parseCurrency(turn.totalCost)
    : turn.quotePrice
      ? parseCurrency(turn.quotePrice)
      : 'N/A'

  return (
    <div className="flex flex-col gap-4">
      {/* Back link */}
      <Link
        href="/property"
        className="text-white/70 hover:text-white text-sm transition-colors"
      >
        &lt; Back to turns
      </Link>

      {/* Header Card */}
      <Card>
        <div className="flex flex-col gap-3">
          <div className="flex items-start justify-between gap-3 flex-wrap">
            <div className="flex flex-col gap-1">
              <h1 className="font-heading font-bold text-xl text-text-primary">
                Unit {turn.unitNumber}
              </h1>
              <Badge variant="default">{turn.propertyName}</Badge>
            </div>
            <StatusBadge status={mapTurnStatusToBadge(turn.status)} label={turn.status} />
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-2">
            <div className="flex flex-col gap-0.5">
              <span className="text-text-secondary text-xs uppercase tracking-wider">
                Ready To Lease
              </span>
              <span className="text-text-primary text-sm font-medium">
                {formatDate(turn.readyToLeaseDate) || 'Not set'}
              </span>
            </div>

            <div className="flex flex-col gap-0.5">
              <span className="text-text-secondary text-xs uppercase tracking-wider">
                Vacant Date
              </span>
              <span className="text-text-primary text-sm font-medium">
                {formatDate(turn.vacantDate) || 'Not set'}
              </span>
            </div>

            <div className="flex flex-col gap-0.5">
              <span className="text-text-secondary text-xs uppercase tracking-wider">
                Price
              </span>
              <span className="text-text-primary text-sm font-medium">
                {turnPrice}
              </span>
            </div>

            <div className="flex flex-col gap-0.5">
              <span className="text-text-secondary text-xs uppercase tracking-wider">
                Days Vacant
              </span>
              <span className="text-text-primary text-sm font-medium">
                {turn.daysVacantUntilReady != null
                  ? String(turn.daysVacantUntilReady)
                  : 'N/A'}
              </span>
            </div>
          </div>
        </div>
      </Card>

      {/* Jobs Table Card */}
      <Card>
        <div className="flex flex-col gap-4">
          <h2 className="font-heading font-semibold text-lg text-text-primary">
            Jobs ({jobs.length})
          </h2>

          {jobs.length === 0 ? (
            <p className="text-text-secondary text-sm">
              No jobs linked to this turn request.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent border-b border-gray-100">
                  <TableHead>Job ID</TableHead>
                  <TableHead>Vendor Name</TableHead>
                  <TableHead>Vendor Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Start Date</TableHead>
                  <TableHead>End Date</TableHead>
                  <TableHead>Price</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {jobs.map((job) => (
                  <TableRow key={job.jobId}>
                    <TableCell className="font-medium">{job.jobId}</TableCell>
                    <TableCell>{job.vendorName ?? '---'}</TableCell>
                    <TableCell>{job.vendorType ?? '---'}</TableCell>
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <JobStatusDropdown
                        jobId={job.jobId}
                        turnRequestId={turn.requestId}
                        currentStatus={job.status}
                      />
                    </TableCell>
                    <TableCell>{formatDate(job.startDate)}</TableCell>
                    <TableCell>{formatDate(job.endDate)}</TableCell>
                    <TableCell>
                      {job.quotePrice != null
                        ? new Intl.NumberFormat('en-US', {
                            style: 'currency',
                            currency: 'USD',
                          }).format(job.quotePrice)
                        : '---'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
      </Card>
    </div>
  )
}
