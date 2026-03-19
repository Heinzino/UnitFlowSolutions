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
import type { TurnRequest, Job } from '@/lib/types/airtable'

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

function JobCard({ job, turnRequestId }: { job: Job; turnRequestId: number }) {
  return (
    <div className="p-4 border-b border-gray-100 last:border-b-0">
      <div className="flex items-start justify-between gap-2 mb-2">
        <Link href={`/property/job/${job.jobId}`} className="text-emerald-dark hover:underline font-medium text-sm">
          Job #{job.jobId}
        </Link>
        <JobStatusDropdown
          jobId={job.jobId}
          turnRequestId={turnRequestId}
          currentStatus={job.status}
        />
      </div>
      <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
        <span className="text-text-secondary text-xs">Vendor</span>
        <span className="text-text-primary">{job.vendorName ?? '---'}</span>

        <span className="text-text-secondary text-xs">Type</span>
        <span className="text-text-primary">{job.vendorType ?? '---'}</span>

        <span className="text-text-secondary text-xs">Start</span>
        <span className="text-text-primary">{formatDate(job.startDate)}</span>

        <span className="text-text-secondary text-xs">End</span>
        <span className="text-text-primary">{formatDate(job.endDate)}</span>

        <span className="text-text-secondary text-xs">Price</span>
        <span className="text-text-primary">
          {job.quotePrice != null ? parseCurrency(job.quotePrice) : '---'}
        </span>
      </div>
    </div>
  )
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
        className="text-white hover:text-white/80 text-base font-medium transition-colors"
      >
        &larr; Back to turns
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
                Off Market Date
              </span>
              <span className="text-text-primary text-sm font-medium">
                {formatDate(turn.offMarketDate) || 'Not set'}
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
                Days Off Market
              </span>
              <span className="text-text-primary text-sm font-medium">
                {turn.daysOffMarketUntilReady != null
                  ? String(turn.daysOffMarketUntilReady)
                  : 'N/A'}
              </span>
            </div>
          </div>
        </div>
      </Card>

      {/* Jobs Card */}
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
            <>
              {/* Desktop table — hidden on small screens */}
              <div className="hidden md:block">
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
                        <TableCell className="font-medium">
          <Link href={`/property/job/${job.jobId}`} className="text-emerald-dark hover:underline">
            #{job.jobId}
          </Link>
        </TableCell>
                        <TableCell>{job.vendorName ?? '---'}</TableCell>
                        <TableCell>{job.vendorType ?? '---'}</TableCell>
                        <TableCell>
                          <JobStatusDropdown
                            jobId={job.jobId}
                            turnRequestId={turn.requestId}
                            currentStatus={job.status}
                          />
                        </TableCell>
                        <TableCell>{formatDate(job.startDate)}</TableCell>
                        <TableCell>{formatDate(job.endDate)}</TableCell>
                        <TableCell>
                          {job.quotePrice != null ? parseCurrency(job.quotePrice) : '---'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Mobile card list — hidden on md+ */}
              <div className="md:hidden">
                {jobs.map((job) => (
                  <JobCard key={job.jobId} job={job} turnRequestId={turn.requestId} />
                ))}
              </div>
            </>
          )}
        </div>
      </Card>
    </div>
  )
}
