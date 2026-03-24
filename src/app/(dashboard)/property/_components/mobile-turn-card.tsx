'use client';

import { useRouter } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import { MobileJobsList } from './mobile-jobs-list';
import { TurnStatusDropdown } from './turn-status-dropdown';
import type { TurnRequest } from '@/lib/types/airtable';

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

export function MobileTurnCard({ turn, revenueExposure }: { turn: TurnRequest; revenueExposure?: number }) {
  const router = useRouter();

  return (
    <div
      className="p-4 border-b border-card-border last:border-b-0 cursor-pointer"
      onClick={() => router.push(`/property/turn/${turn.requestId}`)}
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <Badge variant="emerald">{turn.propertyName}</Badge>
        <div onClick={(e) => e.stopPropagation()}>
          <TurnStatusDropdown requestId={turn.requestId} currentStatus={turn.status} />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
        <span className="text-text-secondary text-xs">Unit</span>
        <span className="text-text-primary font-medium">{turn.unitNumber}</span>

        <span className="text-text-secondary text-xs">Ready To Lease</span>
        <span className="text-text-primary">{formatDate(turn.readyToLeaseDate)}</span>

        <span className="text-text-secondary text-xs">Off Market Date</span>
        <span className="text-text-primary">{formatDate(turn.offMarketDate)}</span>

        <span className="text-text-secondary text-xs">Price</span>
        <span className="text-text-primary">{formatPrice(turn.totalCost, turn.quotePrice)}</span>

        <span className="text-text-secondary text-xs">Rev Exposure</span>
        <span className="text-text-primary">
          {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(revenueExposure ?? 0)}
        </span>
      </div>
      {turn.jobs && turn.jobs.length > 0 && (
        <div className="mt-2">
          <span className="text-text-secondary text-xs block mb-1">Jobs</span>
          <MobileJobsList turn={turn} />
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
  );
}
