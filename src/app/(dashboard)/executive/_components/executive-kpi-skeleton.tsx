import { Activity } from 'lucide-react';
import { KPICard } from '@/components/ui/kpi-card';
import { Skeleton } from '@/components/ui/skeleton';

export function ExecutiveKPISkeleton() {
  return (
    <div className="flex flex-col gap-6">
      {/* KPI grid skeleton: 3 columns, 2 rows = 6 cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <KPICard key={i} loading={true} icon={Activity} label="" value="" />
        ))}
      </div>

      {/* Make Ready Overview section skeleton */}
      <div>
        <Skeleton className="h-6 w-48 mb-4" />
        <KPICard loading={true} icon={Activity} label="" value="" />
      </div>
    </div>
  );
}
