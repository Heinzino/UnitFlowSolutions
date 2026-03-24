// Pure KPI compute functions for the Executive Dashboard.
// No I/O — takes typed arrays, returns typed result. Easily unit-tested.

import type { Job, TurnRequest } from '@/lib/types/airtable'
import { computeTurnRevenueExposure, COMPLETED_PERIOD_DAYS } from './pm-kpis'

export interface ExecutiveKPIResult {
  portfolioAvgTurnTime: number | null
  totalRevenueExposure: number
  unitsOffMarket: number
  jobCompletionTracker: number
  propertiesMeetingTarget: { meeting: number; total: number; percentage: number }
  turnsPastTargetTime: number
}

export function computeExecutiveKPIs(
  jobs: Job[],
  turnRequests: TurnRequest[]
): ExecutiveKPIResult {
  const now = new Date()
  const thirtyDaysAgo = new Date(now.getTime() - COMPLETED_PERIOD_DAYS * 24 * 60 * 60 * 1000)

  // ---------------------------------------------------------------------------
  // portfolioAvgTurnTime — avg timeToCompleteUnit for Done TRs
  // ---------------------------------------------------------------------------
  const doneTurnRequests = turnRequests.filter((tr) => tr.status === 'Done')
  const portfolioAvgTurnTime =
    doneTurnRequests.length === 0
      ? null
      : doneTurnRequests.reduce((sum, tr) => sum + (tr.daysOffMarketUntilReady ?? 0), 0) /
        doneTurnRequests.length

  // ---------------------------------------------------------------------------
  // totalRevenueExposure — sum of per-turn revenue exposure for active turns
  // ---------------------------------------------------------------------------
  const activeTurnRequests = turnRequests.filter((tr) => tr.status !== 'Done')
  const totalRevenueExposure = activeTurnRequests.reduce(
    (sum, tr) => sum + computeTurnRevenueExposure(tr),
    0
  )

  // ---------------------------------------------------------------------------
  // unitsOffMarket — count of active turns
  // ---------------------------------------------------------------------------
  const unitsOffMarket = activeTurnRequests.length

  // ---------------------------------------------------------------------------
  // jobCompletionTracker — completed jobs in last 30 days
  // ---------------------------------------------------------------------------
  const jobCompletionTracker = jobs.filter((j) => {
    if (!j.isCompleted) return false
    if (!j.endDate) return false
    return new Date(j.endDate) >= thirtyDaysAgo
  }).length

  // ---------------------------------------------------------------------------
  // turnsPastTargetTime — active turns where targetDate is already past
  // ---------------------------------------------------------------------------
  const turnsPastTargetTime = activeTurnRequests.filter((tr) => {
    if (!tr.targetDate) return false
    return new Date(tr.targetDate) < now
  }).length

  // ---------------------------------------------------------------------------
  // propertiesMeetingTarget — per-property comparison of avg turn time vs target
  // Groups by property. Per property: avg timeToCompleteUnit for Done TRs vs
  // avg target window (targetDate - offMarketDate) for turns with both dates.
  // Property meets target if avgTurnTime <= avgTargetWindow.
  // Only properties with Done TRs AND target data are counted.
  // ---------------------------------------------------------------------------
  const byProperty = new Map<string, TurnRequest[]>()
  for (const tr of turnRequests) {
    const group = byProperty.get(tr.propertyName) ?? []
    group.push(tr)
    byProperty.set(tr.propertyName, group)
  }

  let meeting = 0
  let total = 0
  for (const [, propTurns] of byProperty) {
    const doneTurns = propTurns.filter((tr) => tr.status === 'Done')
    if (doneTurns.length === 0) continue

    const avgTurnTime =
      doneTurns.reduce((sum, tr) => sum + (tr.daysOffMarketUntilReady ?? 0), 0) / doneTurns.length

    // Compute avg target window from turns with both targetDate and offMarketDate
    const turnsWithTarget = propTurns.filter((tr) => tr.targetDate && tr.offMarketDate)
    if (turnsWithTarget.length === 0) continue

    const avgTargetWindow =
      turnsWithTarget.reduce((sum, tr) => {
        const targetDays = Math.ceil(
          (new Date(tr.targetDate!).getTime() - new Date(tr.offMarketDate!).getTime()) /
            (1000 * 60 * 60 * 24)
        )
        return sum + targetDays
      }, 0) / turnsWithTarget.length

    total++
    if (avgTurnTime <= avgTargetWindow) meeting++
  }

  const percentage = total > 0 ? Math.round((meeting / total) * 100) : 0

  return {
    portfolioAvgTurnTime,
    totalRevenueExposure,
    unitsOffMarket,
    jobCompletionTracker,
    propertiesMeetingTarget: { meeting, total, percentage },
    turnsPastTargetTime,
  }
}
