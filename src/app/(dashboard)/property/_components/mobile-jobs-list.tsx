import Link from 'next/link';
import type { TurnRequest } from '@/lib/types/airtable';

export function MobileJobsList({ turn }: { turn: TurnRequest }) {
  return (
    <div
      className="flex flex-wrap gap-1"
      onClick={(e) => e.stopPropagation()}
    >
      {turn.jobs?.map((job) => (
        <Link
          key={job.jobId}
          href={`/property/job/${job.jobId}`}
          className="inline-flex items-center gap-1 bg-emerald/15 text-emerald-dark hover:bg-emerald/25 text-xs font-semibold rounded-pill px-2.5 py-0.5 transition-colors"
        >
          #{job.jobId}
        </Link>
      ))}
    </div>
  );
}
