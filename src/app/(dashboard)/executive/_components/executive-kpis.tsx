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
import { computeExecutiveKPIs, computeKPITrends } from '@/lib/kpis/executive-kpis';
import { KPICard } from '@/components/ui/kpi-card';


export async function ExecutiveKPIs() {
  const [jobs, turnRequests] = await Promise.all([fetchJobs(), fetchTurnRequests()]);
  const kpis = computeExecutiveKPIs(jobs, turnRequests);
  const trends = computeKPITrends(jobs, jobs, turnRequests, turnRequests);

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
    <div className="flex flex-col gap-4">
      {/* KPI grid: 3 columns, 2 rows */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <KPICard
          icon={Briefcase}
          label="Active Jobs Open"
          value={kpis.activeJobsOpen}
          trend={trends.activeJobsOpen ? { ...trends.activeJobsOpen, isGood: false } : undefined}
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
          trend={trends.jobsCompleted ?? undefined}
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
          trend={trends.avgTimeToComplete ? { ...trends.avgTimeToComplete, isGood: false } : undefined}
        />
        <KPICard
          icon={DollarSign}
          label="Projected Cost Exposure"
          value={costDisplay}
        />
      </div>

      {/* Make Ready Overview */}
      <div>
        <h2 className="font-heading font-semibold text-lg text-white mb-2">
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
            <KPICard
              icon={AlertTriangle}
              label="Make Readys Past Target Time"
              value={kpis.pastTargetAlerts.length}
              variant="alert-past"
            />
          )}
          {kpis.trendingAlerts.length > 0 && (
            <KPICard
              icon={AlertCircle}
              label="Make Readys Trending Past Target Date"
              value={kpis.trendingAlerts.length}
              variant="alert-trending"
            />
          )}
        </div>
      )}
    </div>
  );
}
