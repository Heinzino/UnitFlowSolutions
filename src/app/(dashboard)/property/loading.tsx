import { PMKPISkeleton } from './_components/pm-kpi-skeleton';
import { PMTurnListSkeleton } from './_components/pm-turn-list-skeleton';

export default function PropertyLoading() {
  return (
    <div className="flex flex-col gap-3">
      <div>
        <div className="h-7 w-48 bg-white/10 rounded animate-pulse" />
        <div className="h-4 w-64 bg-white/10 rounded animate-pulse mt-1" />
      </div>
      <PMKPISkeleton />
      <PMTurnListSkeleton />
    </div>
  );
}
