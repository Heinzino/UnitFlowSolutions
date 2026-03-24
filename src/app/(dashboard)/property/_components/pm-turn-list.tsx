import Link from 'next/link';
import { fetchTurnRequestsForUser } from '@/lib/airtable/tables/turn-requests';
import { computeTurnRevenueExposure } from '@/lib/kpis/pm-kpis';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table';
import { MobileJobsList } from './mobile-jobs-list';
import { MobileTurnCard } from './mobile-turn-card';
import { ClickableTurnRow } from './clickable-turn-row';
import { StopPropagation } from './stop-propagation';
import { TurnStatusDropdown } from './turn-status-dropdown';
import { LeaseReadyDateInput } from './lease-ready-date-input';
import type { UserRole } from '@/lib/types/auth';
import type { TurnRequest } from '@/lib/types/airtable';

interface PMTurnListProps {
  assignedProperties: string[];
  role: string;
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
  return formatCurrency(num);
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(amount);
}


function JobsCell({ turn }: { turn: TurnRequest }) {
  if (turn.jobs && turn.jobs.length > 0) {
    return (
      <StopPropagation className="flex flex-wrap gap-1 justify-center">
        {turn.jobs.map((job) => (
          <Link
            key={job.jobId}
            href={`/property/job/${job.jobId}`}
            className="inline-flex items-center gap-1 bg-emerald/15 text-emerald-dark hover:bg-emerald/25 text-xs font-semibold rounded-pill px-2.5 py-0.5 transition-colors"
          >
            #{job.jobId}
          </Link>
        ))}
      </StopPropagation>
    );
  }
  if (turn.jobIds.length > 0) {
    return (
      <Link
        href={`/property/turn/${turn.requestId}`}
        className="inline-flex items-center bg-emerald/15 text-emerald-dark hover:bg-emerald/25 text-xs font-semibold rounded-pill px-2.5 py-0.5 transition-colors"
      >
        {turn.jobIds.length} job{turn.jobIds.length !== 1 ? 's' : ''}
      </Link>
    );
  }
  return <span className="text-text-secondary text-xs">No jobs</span>;
}

function TurnTableRows({ turns }: { turns: TurnRequest[] }) {
  return (
    <>
      {turns.map((turn) => (
        <ClickableTurnRow key={turn.requestId} href={`/property/turn/${turn.requestId}`}>
          <TableCell>
            <Badge variant="emerald">{turn.propertyName}</Badge>
          </TableCell>
          <TableCell>{turn.unitNumber}</TableCell>
          <TableCell>
            <StopPropagation className="flex justify-center">
              <TurnStatusDropdown requestId={turn.requestId} currentStatus={turn.status} />
            </StopPropagation>
          </TableCell>
          <TableCell>
            <StopPropagation className="flex justify-center">
              <LeaseReadyDateInput requestId={turn.requestId} currentDate={turn.readyToLeaseDate} />
            </StopPropagation>
          </TableCell>
          <TableCell>{formatDate(turn.offMarketDate)}</TableCell>
          <TableCell>
            <div className="flex justify-center">
              <JobsCell turn={turn} />
            </div>
          </TableCell>
          <TableCell>{formatPrice(turn.totalCost, turn.quotePrice)}</TableCell>
          <TableCell>{formatCurrency(computeTurnRevenueExposure(turn))}</TableCell>
        </ClickableTurnRow>
      ))}
    </>
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
        <div className="px-6 py-8 text-center">
          <h3 className="font-heading font-semibold text-text-primary mb-1">No open turns</h3>
          <p className="text-sm text-text-secondary">All turns for your properties are either done or not yet started.</p>
        </div>
      ) : (
        <>
          {/* Desktop table — hidden on small screens */}
          <div className="hidden md:block">
            <Table>
              <TableHeader>
                <TableRow className="border-b border-card-border hover:bg-transparent">
                  <TableHead className="w-[13%]">Property</TableHead>
                  <TableHead className="w-[7%]">Unit</TableHead>
                  <TableHead className="w-[12%]">Status</TableHead>
                  <TableHead className="w-[14%]">Ready To Lease</TableHead>
                  <TableHead className="w-[14%]">Off Market Date</TableHead>
                  <TableHead className="w-[12%]">Jobs</TableHead>
                  <TableHead className="w-[10%]">Price</TableHead>
                  <TableHead className="w-[10%]">Rev Exposure</TableHead>
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
              <MobileTurnCard key={turn.requestId} turn={turn} revenueExposure={computeTurnRevenueExposure(turn)} />
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

  // Partition: overdue = targetDate already past
  const now = new Date();
  const overdue = activeTurns.filter(
    (tr) => tr.targetDate !== null && new Date(tr.targetDate) < now
  );
  const onSchedule = activeTurns.filter(
    (tr) => tr.targetDate === null || new Date(tr.targetDate) >= now
  );

  return (
    <div className="flex flex-col gap-4">
      {/* Overdue section — hidden entirely when empty (user decision) */}
      {overdue.length > 0 && (
        <TurnSection
          title="Turns Past Target Time"
          turns={overdue}
          headerClassName="bg-alert-past-target border-b border-card-border text-text-primary"
        />
      )}

      {/* On-schedule section — always visible */}
      <TurnSection
        title="Active Turns (On Schedule)"
        turns={onSchedule}
      />
    </div>
  );
}
