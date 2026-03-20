import {
  Briefcase,
  TrendingUp,
  CheckCircle,
  BarChart2,
  Clock,
  DollarSign,
} from 'lucide-react';
import { fetchJobs } from '@/lib/airtable/tables/jobs';
import { fetchTurnRequests } from '@/lib/airtable/tables/turn-requests';
import { computeExecutiveKPIs, computeKPITrends } from '@/lib/kpis/executive-kpis';
import { KPICard } from '@/components/ui/kpi-card';
import { CurrencyDisplay } from '@/components/ui/currency-display';


export async function ExecutiveKPIs() {
  const [jobs, turnRequests] = await Promise.all([fetchJobs(), fetchTurnRequests()]);
  const kpis = computeExecutiveKPIs(jobs, turnRequests);
  const trends = computeKPITrends(jobs, jobs, turnRequests, turnRequests);

  const avgTimeDisplay =
    kpis.avgTimeToComplete !== null
      ? `${Math.round(kpis.avgTimeToComplete)} days`
      : 'N/A';

  // Footer subtitles
  const riskPercent = kpis.activeJobsOpen > 0
    ? Math.round((kpis.jobsTrendingPastTarget / kpis.activeJobsOpen) * 100)
    : 0

  const completedTrendSubtitle = trends.jobsCompleted
    ? `${trends.jobsCompleted.direction === 'up' ? '\u2191' : '\u2193'} ${Math.round(trends.jobsCompleted.percentage)}% vs prior 30 days`
    : 'No prior period data'

  const backlogSubtitle = kpis.backlogDelta >= 0
    ? 'More opening than closing'
    : 'More closing than opening'

  const avgTimeTrendSubtitle = trends.avgTimeToComplete
    ? `${trends.avgTimeToComplete.direction === 'up' ? '\u2191' : '\u2193'} ${Math.round(trends.avgTimeToComplete.percentage)}% over target \u00b7 target 8 days`
    : 'target 8 days'

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      <KPICard
        icon={Briefcase}
        label="Active Jobs Open"
        value={kpis.activeJobsOpen}
        trend={trends.activeJobsOpen ? { ...trends.activeJobsOpen, isGood: false } : undefined}
        footer={<p className="text-xs text-text-secondary">{kpis.backlogDelta} backlog delta this week</p>}
      />
      <KPICard
        icon={TrendingUp}
        label="Jobs Trending Past Target"
        value={kpis.jobsTrendingPastTarget}
        footer={<p className="text-xs text-text-secondary">{riskPercent}% of active jobs at risk</p>}
      />
      <KPICard
        icon={CheckCircle}
        label="Jobs Completed (30d)"
        value={kpis.jobsCompleted30d}
        trend={trends.jobsCompleted ?? undefined}
        footer={<p className="text-xs text-text-secondary">{completedTrendSubtitle}</p>}
      />
      <KPICard
        icon={BarChart2}
        label="Backlog Delta"
        value={kpis.backlogDelta}
        footer={<p className="text-xs text-text-secondary">{backlogSubtitle}</p>}
      />
      <KPICard
        icon={Clock}
        label="Avg Time to Complete"
        value={avgTimeDisplay}
        trend={trends.avgTimeToComplete ? { ...trends.avgTimeToComplete, isGood: false } : undefined}
        footer={<p className="text-xs text-text-secondary">{avgTimeTrendSubtitle}</p>}
      />
      <KPICard
        icon={DollarSign}
        label="Projected Cost Exposure"
        value={kpis.projectedCostExposure}
        footer={
          <p className="text-xs text-text-secondary">
            <CurrencyDisplay amount={kpis.projectedCostExposure} /> &middot; ~$60/unit on delayed jobs
          </p>
        }
      />
    </div>
  );
}
