import {
  Home,
  CheckCircle,
  BarChart2,
  Clock,
  DollarSign,
  AlertTriangle,
} from 'lucide-react';
import { fetchJobs } from '@/lib/airtable/tables/jobs';
import { fetchTurnRequests } from '@/lib/airtable/tables/turn-requests';
import { computeExecutiveKPIs } from '@/lib/kpis/executive-kpis';
import { KPICard } from '@/components/ui/kpi-card';

export async function ExecutiveKPIs() {
  const [jobs, turnRequests] = await Promise.all([fetchJobs(), fetchTurnRequests()]);
  const kpis = computeExecutiveKPIs(jobs, turnRequests);

  const avgTimeDisplay =
    kpis.portfolioAvgTurnTime !== null
      ? `${Math.round(kpis.portfolioAvgTurnTime)} days`
      : 'N/A';

  const revenueDisplay = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(kpis.totalRevenueExposure);

  const { meeting, total, percentage } = kpis.propertiesMeetingTarget;
  const meetingDisplay = total > 0 ? `${meeting} of ${total} / ${percentage}%` : 'N/A';

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      {/* Row 1 */}
      <KPICard
        icon={Clock}
        label="Portfolio Avg Turn Time"
        value={avgTimeDisplay}
      />
      <KPICard
        icon={DollarSign}
        label="Total Revenue Exposure"
        value={revenueDisplay}
        variant={kpis.totalRevenueExposure > 0 ? 'alert-past' : 'default'}
      />
      <KPICard
        icon={Home}
        label="Units Off Market"
        value={kpis.unitsOffMarket}
      />

      {/* Row 2 */}
      <KPICard
        icon={CheckCircle}
        label="Job Completion Tracker"
        value={kpis.jobCompletionTracker}
      />
      <KPICard
        icon={BarChart2}
        label="Properties Meeting Target"
        value={meetingDisplay}
      />
      <KPICard
        icon={AlertTriangle}
        label="Turns Past Target Time"
        value={kpis.turnsPastTargetTime}
        variant={kpis.turnsPastTargetTime > 0 ? 'alert-past' : 'default'}
      />
    </div>
  );
}
