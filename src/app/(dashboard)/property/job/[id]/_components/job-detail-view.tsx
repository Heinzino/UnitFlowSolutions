import Link from 'next/link'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { JobStatusDropdown } from '@/app/(dashboard)/property/_components/job-status-dropdown'
import type { Job } from '@/lib/types/airtable'

interface JobDetailViewProps {
  job: Job
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

export function JobDetailView({ job }: JobDetailViewProps) {
  const backHref = job.turnRequestId
    ? `/property/turn/${job.turnRequestId}`
    : '/property'

  return (
    <div className="flex flex-col gap-4">
      {/* Back link */}
      <Link
        href={backHref}
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
                Job #{job.jobId}
              </h1>
              {job.propertyName && (
                <Badge variant="default">{job.propertyName}</Badge>
              )}
            </div>
            <JobStatusDropdown
              jobId={job.jobId}
              turnRequestId={job.turnRequestId ?? 0}
              currentStatus={job.status}
            />
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-2">
            <div className="flex flex-col gap-0.5">
              <span className="text-text-secondary text-xs uppercase tracking-wider">
                Vendor Name
              </span>
              <span className="text-text-primary text-sm font-medium">
                {job.vendorName ?? '---'}
              </span>
            </div>

            <div className="flex flex-col gap-0.5">
              <span className="text-text-secondary text-xs uppercase tracking-wider">
                Vendor Type
              </span>
              <span className="text-text-primary text-sm font-medium">
                {job.vendorType ?? '---'}
              </span>
            </div>

            <div className="flex flex-col gap-0.5">
              <span className="text-text-secondary text-xs uppercase tracking-wider">
                Start Date
              </span>
              <span className="text-text-primary text-sm font-medium">
                {formatDate(job.startDate)}
              </span>
            </div>

            <div className="flex flex-col gap-0.5">
              <span className="text-text-secondary text-xs uppercase tracking-wider">
                End Date
              </span>
              <span className="text-text-primary text-sm font-medium">
                {formatDate(job.endDate)}
              </span>
            </div>

            <div className="flex flex-col gap-0.5">
              <span className="text-text-secondary text-xs uppercase tracking-wider">
                Price
              </span>
              <span className="text-text-primary text-sm font-medium">
                {job.quotePrice != null ? parseCurrency(job.quotePrice) : '---'}
              </span>
            </div>

            <div className="flex flex-col gap-0.5">
              <span className="text-text-secondary text-xs uppercase tracking-wider">
                Duration
              </span>
              <span className="text-text-primary text-sm font-medium">
                {job.durationDays != null ? `${job.durationDays} days` : '---'}
              </span>
            </div>

            <div className="flex flex-col gap-0.5">
              <span className="text-text-secondary text-xs uppercase tracking-wider">
                Delta
              </span>
              <span className="text-text-primary text-sm font-medium">
                {job.delta != null ? String(job.delta) : '---'}
              </span>
            </div>

            <div className="flex flex-col gap-0.5">
              <span className="text-text-secondary text-xs uppercase tracking-wider">
                Request Type
              </span>
              <span className="text-text-primary text-sm font-medium">
                {job.requestType ?? '---'}
              </span>
            </div>
          </div>
        </div>
      </Card>

      {/* Turn request link card */}
      {job.turnRequestId != null && (
        <Card>
          <div className="flex items-center justify-between gap-3">
            <span className="text-text-secondary text-sm">
              Part of Turn Request #{job.turnRequestId}
            </span>
            <Link
              href={`/property/turn/${job.turnRequestId}`}
              className="text-emerald-dark hover:underline text-sm font-medium"
            >
              View Turn Request &rarr;
            </Link>
          </div>
        </Card>
      )}
    </div>
  )
}
