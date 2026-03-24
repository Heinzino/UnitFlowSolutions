import {
  Home,
  CheckCircle,
  Clock,
  AlertTriangle,
} from 'lucide-react';
import { fetchTurnRequestsForUser } from '@/lib/airtable/tables/turn-requests';
import { computePMKPIs } from '@/lib/kpis/pm-kpis';
import { KPICard } from '@/components/ui/kpi-card';
import type { UserRole } from '@/lib/types/auth';

interface PMKPIsProps {
  assignedProperties: string[];
  role?: string;
}

export async function PMKPIs({ assignedProperties, role = 'pm' }: PMKPIsProps) {
  const turnRequests = await fetchTurnRequestsForUser(role as UserRole, assignedProperties);
  const kpis = computePMKPIs(turnRequests);

  const avgTimeDisplay =
    kpis.avgTurnTime !== null
      ? `${Math.round(kpis.avgTurnTime)} days`
      : 'N/A';

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      {/* Row 1 */}
      <KPICard
        icon={Home}
        label="Open Turns"
        value={kpis.openTurns}
      />
      <KPICard
        icon={Clock}
        label="Avg Turn Time (Last 30 days)"
        value={avgTimeDisplay}
      />
      <KPICard
        icon={AlertTriangle}
        label="Turns Past Target Time"
        value={kpis.turnsPastTargetTime}
        variant={kpis.turnsPastTargetTime > 0 ? 'alert-past' : 'default'}
      />

      {/* Row 2 */}
      <KPICard
        icon={AlertTriangle}
        label="Jobs Past Target Time"
        value={kpis.jobsPastTargetTime}
        variant={kpis.jobsPastTargetTime > 0 ? 'alert-past' : 'default'}
      />
      <KPICard
        icon={Clock}
        label="Upcoming Jobs Due"
        value={kpis.upcomingJobsDue}
        variant={kpis.upcomingJobsDue > 0 ? 'alert-trending' : 'default'}
      />
      <KPICard
        icon={CheckCircle}
        label="Job Completion Tracker"
        value={kpis.jobCompletionTracker}
      />
    </div>
  );
}
