import {
  Home,
  CheckCircle,
  Briefcase,
  Clock,
  DollarSign,
  AlertTriangle,
} from 'lucide-react'
import { fetchTurnRequestsForUser } from '@/lib/airtable/tables/turn-requests'
import { computePMKPIs } from '@/lib/kpis/pm-kpis'
import { KPICard } from '@/components/ui/kpi-card'
import type { UserRole } from '@/lib/types/auth'

interface RMKPIsProps {
  assignedProperties: string[]
}

export async function RMKPIs({ assignedProperties }: RMKPIsProps) {
  const turnRequests = await fetchTurnRequestsForUser('rm' as UserRole, assignedProperties)
  const kpis = computePMKPIs(turnRequests)

  const avgTimeDisplay =
    kpis.avgTurnTime !== null
      ? `${Math.round(kpis.avgTurnTime)} days`
      : 'N/A'

  const revenueDisplay = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(kpis.revenueExposure)

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      {/* Row 1: Overview */}
      <KPICard
        icon={Home}
        label="Active Turns"
        value={kpis.activeTurns}
      />
      <KPICard
        icon={Clock}
        label="Avg Turn Time"
        value={avgTimeDisplay}
      />
      <KPICard
        icon={DollarSign}
        label="Revenue Exposure"
        value={revenueDisplay}
        variant={kpis.revenueExposure > 0 ? 'alert-past' : 'default'}
        footer={
          kpis.revenueExposureExcludedCount > 0 ? (
            <p className="text-xs text-text-secondary">
              {kpis.revenueExposureExcludedCount} turn{kpis.revenueExposureExcludedCount !== 1 ? 's' : ''} excluded (no target date)
            </p>
          ) : undefined
        }
      />

      {/* Row 2: Action */}
      <KPICard
        icon={CheckCircle}
        label="Completed This Period"
        value={kpis.completedThisPeriod}
      />
      <KPICard
        icon={Briefcase}
        label="Jobs In Progress"
        value={kpis.jobsInProgress}
      />
      <KPICard
        icon={AlertTriangle}
        label="Turns Near Deadline"
        value={kpis.turnsNearDeadline}
        variant={kpis.turnsNearDeadline > 0 ? 'alert-trending' : 'default'}
      />
    </div>
  )
}
