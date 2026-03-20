import { Activity } from 'lucide-react';
import { KPICard } from '@/components/ui/kpi-card';

export function ExecutiveKPISkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      {Array.from({ length: 6 }).map((_, i) => (
        <KPICard key={i} loading={true} icon={Activity} label="" value="" />
      ))}
    </div>
  );
}
