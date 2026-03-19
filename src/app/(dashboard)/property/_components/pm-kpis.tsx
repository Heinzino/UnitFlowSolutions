import {
  Home,
  CheckCircle,
  Activity,
  Clock,
  DollarSign,
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

  const spendDisplay = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(kpis.projectedSpendMTD);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      {/* Row 1 */}
      <KPICard
        icon={Home}
        label="Active Turns"
        value={kpis.activeTurns}
      />
      <KPICard
        icon={CheckCircle}
        label="Completed (30d)"
        value={kpis.completedLast30d}
      />
      <KPICard
        icon={Activity}
        label="Completed (7d)"
        value={kpis.completedLast7d}
      />
      {/* Row 2 */}
      <KPICard
        icon={Clock}
        label="Avg Turn Time"
        value={avgTimeDisplay}
      />
      <KPICard
        icon={DollarSign}
        label="Projected Spend MTD"
        value={spendDisplay}
      />
      <KPICard
        icon={AlertTriangle}
        label="Past Target Time"
        value={kpis.pastTargetCount}
        variant={kpis.pastTargetCount > 0 ? 'alert-past' : 'default'}
      />
    </div>
  );
}
