import {
  Home,
  CheckCircle,
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
      {/* Row 1 */}
      <KPICard
        icon={Home}
        label="Total Units Off Market"
        value={kpis.openTurns}
      />
      <KPICard
        icon={Clock}
        label="Portfolio Avg Turn Time"
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
        icon={DollarSign}
        label="Total Revenue Exposure"
        value={revenueDisplay}
        variant={kpis.revenueExposure > 0 ? 'alert-past' : 'default'}
      />
      <KPICard
        icon={AlertTriangle}
        label="Jobs Past Target Time"
        value={kpis.jobsPastTargetTime}
        variant={kpis.jobsPastTargetTime > 0 ? 'alert-past' : 'default'}
      />
      <KPICard
        icon={CheckCircle}
        label="Total Job Completion Tracker"
        value={kpis.jobCompletionTracker}
      />
    </div>
  )
}
