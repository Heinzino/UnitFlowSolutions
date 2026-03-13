import {
  Briefcase,
  TrendingUp,
  CheckCircle,
  BarChart2,
  Clock,
  DollarSign,
  Home,
  AlertTriangle,
  AlertCircle,
} from 'lucide-react';
import { fetchJobs } from '@/lib/airtable/tables/jobs';
import { fetchTurnRequests } from '@/lib/airtable/tables/turn-requests';
import { computeExecutiveKPIs } from '@/lib/kpis/executive-kpis';
import { KPICard } from '@/components/ui/kpi-card';

interface AlertItemListProps {
  items: { propertyName: string; unitNumber: string }[];
}

function AlertItemList({ items }: AlertItemListProps) {
  const displayed = items.slice(0, 5);
  const overflow = items.length - 5;

  return (
    <ul className="mt-2 text-sm text-text-secondary space-y-1 px-6 pb-4">
      {displayed.map((item, i) => (
        <li key={i}>
          {item.propertyName} #{item.unitNumber}
        </li>
      ))}
      {overflow > 0 && (
        <li className="font-medium">+{overflow} more</li>
      )}
    </ul>
  );
}

export async function ExecutiveKPIs() {
  const [jobs, turnRequests] = await Promise.all([fetchJobs(), fetchTurnRequests()]);
  const kpis = computeExecutiveKPIs(jobs, turnRequests);

  const avgTimeDisplay =
    kpis.avgTimeToComplete !== null
      ? `${Math.round(kpis.avgTimeToComplete)} days`
      : 'N/A';

  const costDisplay = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(kpis.projectedCostExposure);

  const hasAlerts = kpis.pastTargetAlerts.length > 0 || kpis.trendingAlerts.length > 0;

  return (
    <div className="flex flex-col gap-6">
      {/* KPI grid: 3 columns, 2 rows */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <KPICard
          icon={Briefcase}
          label="Active Jobs Open"
          value={kpis.activeJobsOpen}
        />
        <KPICard
          icon={TrendingUp}
          label={`Jobs Trending Past Target\n2 days from completion date`}
          value={kpis.jobsTrendingPastTarget}
        />
        <KPICard
          icon={CheckCircle}
          label="Jobs Completed (30d)"
          value={kpis.jobsCompleted30d}
        />
        <KPICard
          icon={BarChart2}
          label="Backlog Delta"
          value={kpis.backlogDelta}
        />
        <KPICard
          icon={Clock}
          label="Avg Time to Complete"
          value={avgTimeDisplay}
        />
        <KPICard
          icon={DollarSign}
          label="Projected Cost Exposure"
          value={costDisplay}
        />
      </div>

      {/* Make Ready Overview */}
      <div>
        <h2 className="font-heading font-semibold text-lg text-text-primary mb-4">
          Make Ready Overview
        </h2>
        <KPICard
          icon={Home}
          label="Active Make Readys Open"
          value={kpis.activeMakeReadysOpen}
        />
      </div>

      {/* Alert cards — hidden when count is 0 */}
      {hasAlerts && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {kpis.pastTargetAlerts.length > 0 && (
            <div>
              <KPICard
                icon={AlertTriangle}
                label="Make Readys Past Target Time"
                value={kpis.pastTargetAlerts.length}
                variant="alert-past"
              />
              <AlertItemList items={kpis.pastTargetAlerts} />
            </div>
          )}
          {kpis.trendingAlerts.length > 0 && (
            <div>
              <KPICard
                icon={AlertCircle}
                label="Make Readys Trending Past Target Date"
                value={kpis.trendingAlerts.length}
                variant="alert-trending"
              />
              <AlertItemList items={kpis.trendingAlerts} />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
