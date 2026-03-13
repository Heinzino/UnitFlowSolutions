import Link from 'next/link';
import { fetchTurnRequestsForUser } from '@/lib/airtable/tables/turn-requests';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { StatusBadge, type Status } from '@/components/ui/status-badge';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table';
import { JobStatusDropdown } from './job-status-dropdown';
import type { UserRole } from '@/lib/types/auth';
import type { TurnRequest } from '@/lib/types/airtable';

interface PMTurnListProps {
  assignedProperties: string[];
  role: string;
}

// Map Airtable turn request status strings to StatusBadge Status type
function mapTurnStatus(status: string): Status | null {
  const normalized = status.toLowerCase().trim();
  if (normalized === 'done' || normalized === 'completed' || normalized === 'ready') return 'completed';
  if (normalized === 'in progress' || normalized === 'in-progress') return 'in-progress';
  if (normalized === 'blocked') return 'blocked';
  if (normalized === 'needs attention') return 'attention';
  return null;
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '---';
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function formatPrice(totalCost: string | null, quotePrice: string | null): string {
  const raw = totalCost ?? quotePrice;
  if (!raw) return '---';
  const num = parseFloat(raw.replace(/[^0-9.-]/g, ''));
  if (isNaN(num)) return '---';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(num);
}

function TurnStatusDisplay({ status }: { status: string }) {
  const mapped = mapTurnStatus(status);
  if (mapped) {
    return <StatusBadge status={mapped} label={status} />;
  }
  // Fallback for unmapped statuses
  return (
    <span className="inline-flex px-3 py-1 text-xs font-semibold rounded-pill bg-gray-100 text-text-primary">
      {status}
    </span>
  );
}

function JobsCell({ turn }: { turn: TurnRequest }) {
  if (turn.jobs && turn.jobs.length > 0) {
    return (
      <div className="flex flex-col gap-1">
        {turn.jobs.map((job) => (
          <JobStatusDropdown
            key={job.jobId}
            jobId={job.jobId}
            turnRequestId={turn.requestId}
            currentStatus={job.status}
          />
        ))}
      </div>
    );
  }
  // Fallback: plain count badge when jobs not resolved
  if (turn.jobIds.length > 0) {
    return (
      <Badge variant="default">
        {turn.jobIds.length} job{turn.jobIds.length !== 1 ? 's' : ''}
      </Badge>
    );
  }
  return <span className="text-text-secondary text-xs">No jobs</span>;
}

function TurnTableRows({ turns }: { turns: TurnRequest[] }) {
  return (
    <>
      {turns.map((turn) => (
        <TableRow key={turn.requestId} className="group">
          {/* Property Name */}
          <TableCell>
            <Link
              href={`/property/turn/${turn.requestId}`}
              className="contents"
            >
              <Badge variant="emerald">{turn.propertyName}</Badge>
            </Link>
          </TableCell>
          {/* Unit Number */}
          <TableCell>
            <Link
              href={`/property/turn/${turn.requestId}`}
              className="text-text-primary hover:text-forest transition-colors"
            >
              {turn.unitNumber}
            </Link>
          </TableCell>
          {/* Status */}
          <TableCell>
            <Link href={`/property/turn/${turn.requestId}`} className="contents">
              <TurnStatusDisplay status={turn.status} />
            </Link>
          </TableCell>
          {/* Ready To Lease Date */}
          <TableCell>
            <Link href={`/property/turn/${turn.requestId}`} className="text-text-primary hover:text-forest transition-colors">
              {formatDate(turn.readyToLeaseDate)}
            </Link>
          </TableCell>
          {/* Vacant Date */}
          <TableCell>
            <Link href={`/property/turn/${turn.requestId}`} className="text-text-primary hover:text-forest transition-colors">
              {formatDate(turn.vacantDate)}
            </Link>
          </TableCell>
          {/* Jobs — inline dropdowns, stopPropagation handled in JobStatusDropdown */}
          <TableCell>
            <JobsCell turn={turn} />
          </TableCell>
          {/* Price */}
          <TableCell>
            <Link href={`/property/turn/${turn.requestId}`} className="text-text-primary hover:text-forest transition-colors">
              {formatPrice(turn.totalCost, turn.quotePrice)}
            </Link>
          </TableCell>
        </TableRow>
      ))}
    </>
  );
}

// Mobile card list for a single turn
function TurnCard({ turn }: { turn: TurnRequest }) {
  return (
    <Link href={`/property/turn/${turn.requestId}`} className="block">
      <div className="p-4 border-b border-card-border last:border-b-0">
        <div className="flex items-start justify-between gap-2 mb-2">
          <Badge variant="emerald">{turn.propertyName}</Badge>
          <TurnStatusDisplay status={turn.status} />
        </div>
        <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
          <span className="text-text-secondary text-xs">Unit</span>
          <span className="text-text-primary font-medium">{turn.unitNumber}</span>

          <span className="text-text-secondary text-xs">Ready To Lease</span>
          <span className="text-text-primary">{formatDate(turn.readyToLeaseDate)}</span>

          <span className="text-text-secondary text-xs">Vacant Date</span>
          <span className="text-text-primary">{formatDate(turn.vacantDate)}</span>

          <span className="text-text-secondary text-xs">Price</span>
          <span className="text-text-primary">{formatPrice(turn.totalCost, turn.quotePrice)}</span>
        </div>
        {/* Jobs: dropdowns stacked vertically, stopPropagation prevents Link navigation */}
        {turn.jobs && turn.jobs.length > 0 && (
          <div className="mt-2">
            <span className="text-text-secondary text-xs block mb-1">Jobs</span>
            <div
              className="flex flex-col gap-1"
              onClick={(e) => e.preventDefault()}
            >
              {turn.jobs.map((job) => (
                <JobStatusDropdown
                  key={job.jobId}
                  jobId={job.jobId}
                  turnRequestId={turn.requestId}
                  currentStatus={job.status}
                />
              ))}
            </div>
          </div>
        )}
        {(!turn.jobs || turn.jobs.length === 0) && turn.jobIds.length > 0 && (
          <div className="mt-2">
            <Badge variant="default">
              {turn.jobIds.length} job{turn.jobIds.length !== 1 ? 's' : ''}
            </Badge>
          </div>
        )}
      </div>
    </Link>
  );
}

function TurnSection({
  title,
  turns,
  headerClassName,
}: {
  title: string;
  turns: TurnRequest[];
  headerClassName?: string;
}) {
  return (
    <Card variant="flush" className="overflow-hidden">
      {/* Section header */}
      <div className={`px-6 py-3 ${headerClassName ?? 'bg-card border-b border-card-border'}`}>
        <h2 className="font-heading font-semibold text-sm">
          {title}{' '}
          <span className="font-normal text-xs opacity-70">({turns.length})</span>
        </h2>
      </div>

      {turns.length === 0 ? (
        <div className="px-6 py-8 text-center text-text-secondary text-sm">
          No turns in this category.
        </div>
      ) : (
        <>
          {/* Desktop table — hidden on small screens */}
          <div className="hidden md:block">
            <Table>
              <TableHeader>
                <TableRow className="border-b border-card-border hover:bg-transparent">
                  <TableHead>Property</TableHead>
                  <TableHead>Unit</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Ready To Lease</TableHead>
                  <TableHead>Vacant Date</TableHead>
                  <TableHead>Jobs</TableHead>
                  <TableHead>Price</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TurnTableRows turns={turns} />
              </TableBody>
            </Table>
          </div>

          {/* Mobile card list — hidden on md+ */}
          <div className="md:hidden">
            {turns.map((turn) => (
              <TurnCard key={turn.requestId} turn={turn} />
            ))}
          </div>
        </>
      )}
    </Card>
  );
}

export async function PMTurnList({ assignedProperties, role }: PMTurnListProps) {
  const turnRequests = await fetchTurnRequestsForUser(
    role as UserRole,
    assignedProperties
  );

  // Only active turns (not Done)
  const activeTurns = turnRequests.filter((tr) => tr.status !== 'Done');

  // Partition: overdue = daysVacantUntilReady > 10
  const overdue = activeTurns.filter(
    (tr) => tr.daysVacantUntilReady !== null && tr.daysVacantUntilReady > 10
  );
  const onSchedule = activeTurns.filter(
    (tr) => tr.daysVacantUntilReady === null || tr.daysVacantUntilReady <= 10
  );

  return (
    <div className="flex flex-col gap-4">
      {/* Overdue section — hidden entirely when empty (user decision) */}
      {overdue.length > 0 && (
        <TurnSection
          title="Make Readys Past Target Time"
          turns={overdue}
          headerClassName="bg-alert-past-target border-b border-card-border text-text-primary"
        />
      )}

      {/* On-schedule section — always visible */}
      <TurnSection
        title="Active Make Readys (On Schedule)"
        turns={onSchedule}
      />
    </div>
  );
}
