import { fetchTurnRequestsForUser } from '@/lib/airtable/tables/turn-requests'
import { computePMKPIs, computeTurnRevenueExposure } from '@/lib/kpis/pm-kpis'
import { Card } from '@/components/ui/card'
import { PropertyInsightsTable } from './property-insights-table'
import { AvgTurnTimeChart } from './avg-turn-time-chart'
import type { UserRole } from '@/lib/types/auth'
import type { TurnRequest } from '@/lib/types/airtable'

interface PropertyInsightsProps {
  assignedProperties: string[]
}

export async function PropertyInsights({ assignedProperties }: PropertyInsightsProps) {
  if (assignedProperties.length === 0) {
    return (
      <Card>
        <div className="py-12 text-center">
          <h3 className="font-heading font-bold text-lg text-text-primary">No properties assigned</h3>
          <p className="text-sm text-text-secondary mt-1">Contact your administrator to get properties added to your account.</p>
        </div>
      </Card>
    )
  }

  const turnRequests = await fetchTurnRequestsForUser('rm' as UserRole, assignedProperties)
  const now = new Date()

  // Group turns by property
  const byProperty = new Map<string, TurnRequest[]>()
  for (const propName of assignedProperties) {
    byProperty.set(propName, [])
  }
  for (const tr of turnRequests) {
    const group = byProperty.get(tr.propertyName)
    if (group) group.push(tr)
  }

  // Compute per-property stats
  const propertyStats = assignedProperties.map((propName) => {
    const propTurns = byProperty.get(propName) ?? []
    const kpis = computePMKPIs(propTurns)

    const activeTurns = propTurns.filter((tr) => tr.status !== 'Done')

    // vsTarget: average of (daysOffMarketUntilReady - targetDays) for active turns with both dates
    const turnsWithTarget = activeTurns.filter((tr) => tr.targetDate && tr.offMarketDate)
    let vsTarget: number | null = null
    if (turnsWithTarget.length > 0) {
      const totalDiff = turnsWithTarget.reduce((sum, tr) => {
        const targetDays = Math.ceil(
          (new Date(tr.targetDate!).getTime() - new Date(tr.offMarketDate!).getTime()) /
            (1000 * 60 * 60 * 24)
        )
        return sum + ((tr.daysOffMarketUntilReady ?? 0) - targetDays)
      }, 0)
      vsTarget = totalDiff / turnsWithTarget.length
    }

    // unitsPastTarget: active turns where targetDate < now
    const unitsPastTarget = activeTurns.filter(
      (tr) => tr.targetDate && new Date(tr.targetDate) < now
    ).length

    // jobsPastTarget: non-completed jobs from active turns where endDate < now
    const allJobs = activeTurns.flatMap((tr) => tr.jobs ?? [])
    const uniqueJobs = [...new Map(allJobs.map((j) => [j.jobId, j])).values()]
    const jobsPastTarget = uniqueJobs.filter((j) => {
      if (j.isCompleted) return false
      if (!j.endDate) return false
      return new Date(j.endDate) < now
    }).length

    return {
      propertyName: propName,
      unitsOffMarket: kpis.openTurns,
      avgTurnTime: kpis.avgTurnTime,
      revenueExposure: kpis.revenueExposure,
      vsTarget,
      unitsPastTarget,
      jobsPastTarget,
    }
  })

  // Chart data: exclude properties with null avgTurnTime
  const chartData = propertyStats
    .filter((p) => p.avgTurnTime !== null)
    .map((p) => ({
      propertyName: p.propertyName,
      days: Math.round(p.avgTurnTime!),
    }))

  return (
    <>
      <Card>
        <div className="px-6 py-3 border-b border-border">
          <h2 className="font-heading text-xl font-bold text-text-primary">Property Insights</h2>
        </div>
        <PropertyInsightsTable data={propertyStats} />
      </Card>
      {chartData.length > 0 && (
        <Card>
          <div className="px-6 py-3 border-b border-border">
            <h2 className="font-heading text-xl font-bold text-text-primary">Avg Turn Time by Property</h2>
          </div>
          <div className="p-6">
            <AvgTurnTimeChart data={chartData} />
          </div>
        </Card>
      )}
    </>
  )
}
