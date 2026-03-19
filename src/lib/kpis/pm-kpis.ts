// Pure KPI compute functions for the Property Manager Dashboard.
// No I/O — takes typed arrays, returns typed result. Easily unit-tested.
// Modeled on computeExecutiveKPIs from executive-kpis.ts.

import type { TurnRequest } from '@/lib/types/airtable'

// ---------------------------------------------------------------------------
// Named constants — business rules as exported values
// ---------------------------------------------------------------------------

export const REVENUE_EXPOSURE_RATE_PER_DAY = 60
export const NEAR_DEADLINE_DAYS = 3
export const COMPLETED_PERIOD_DAYS = 30

export interface PMKPIResult {
  activeTurns: number
  completedThisPeriod: number
  jobsInProgress: number
  avgTurnTime: number | null // null when no Done turn requests
  revenueExposure: number
  revenueExposureExcludedCount: number
  turnsNearDeadline: number
}

export function computePMKPIs(turnRequests: TurnRequest[]): PMKPIResult {
  const now = new Date()
  const thirtyDaysAgo = new Date(now.getTime() - COMPLETED_PERIOD_DAYS * 24 * 60 * 60 * 1000)

  // Start of today in UTC (midnight)
  const todayStart = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())

  // ---------------------------------------------------------------------------
  // PM-01: Active Turns — TRs where status !== "Done"
  // Safer than allowlist: catches any non-Done status including future values
  // ---------------------------------------------------------------------------
  const activeTurns = turnRequests.filter((tr) => tr.status !== 'Done').length

  // Active turn requests (reused across multiple KPIs)
  const activeTurnRequests = turnRequests.filter((tr) => tr.status !== 'Done')

  // ---------------------------------------------------------------------------
  // completedThisPeriod — Done TRs with readyToLeaseDate in past COMPLETED_PERIOD_DAYS
  // Same logic as old completedLast30d, renamed to reflect configurable period
  // ---------------------------------------------------------------------------
  const completedThisPeriod = turnRequests.filter((tr) => {
    if (tr.status !== 'Done') return false
    if (!tr.readyToLeaseDate) return false
    return new Date(tr.readyToLeaseDate) >= thirtyDaysAgo
  }).length

  // ---------------------------------------------------------------------------
  // avgTurnTime — average timeToCompleteUnit for Done TRs (unchanged)
  // Returns null when no Done turn requests exist
  // ---------------------------------------------------------------------------
  const doneTurnRequests = turnRequests.filter((tr) => tr.status === 'Done')
  const avgTurnTime =
    doneTurnRequests.length === 0
      ? null
      : doneTurnRequests.reduce((sum, tr) => sum + (tr.timeToCompleteUnit ?? 0), 0) /
        doneTurnRequests.length

  // ---------------------------------------------------------------------------
  // jobsInProgress — count ALL non-completed jobs from active turns
  // Per CONTEXT.md locked decision: uses !j.isCompleted (includes In Progress,
  // Blocked, NEEDS ATTENTION, Ready — all represent active workload)
  // Deduplicates by jobId across turns
  // ---------------------------------------------------------------------------
  const allActiveJobs = activeTurnRequests.flatMap((tr) => tr.jobs ?? [])
  const uniqueJobs = [...new Map(allActiveJobs.map((j) => [j.jobId, j])).values()]
  const jobsInProgress = uniqueJobs.filter((j) => !j.isCompleted).length

  // ---------------------------------------------------------------------------
  // revenueExposure — $RATE/day for each active turn over its target window
  // Formula: max(0, daysOffMarketUntilReady - targetDays) * REVENUE_EXPOSURE_RATE_PER_DAY
  // Turns with null targetDate or null offMarketDate contribute $0
  // ---------------------------------------------------------------------------
  const revenueExposure = activeTurnRequests.reduce((sum, tr) => {
    if (!tr.targetDate || !tr.offMarketDate) return sum
    const targetDays = Math.ceil(
      (new Date(tr.targetDate).getTime() - new Date(tr.offMarketDate).getTime()) /
        (1000 * 60 * 60 * 24)
    )
    const daysOver = Math.max(0, (tr.daysOffMarketUntilReady ?? 0) - targetDays)
    return sum + daysOver * REVENUE_EXPOSURE_RATE_PER_DAY
  }, 0)

  // ---------------------------------------------------------------------------
  // revenueExposureExcludedCount — active turns missing targetDate (can't compute)
  // Done turns are NOT counted — only active turns
  // ---------------------------------------------------------------------------
  const revenueExposureExcludedCount = activeTurnRequests.filter(
    (tr) => tr.targetDate === null
  ).length

  // ---------------------------------------------------------------------------
  // turnsNearDeadline — active turns with targetDate within next NEAR_DEADLINE_DAYS
  // Window: [todayStart, todayStart + NEAR_DEADLINE_DAYS * 86400000] inclusive
  // ---------------------------------------------------------------------------
  const deadlineWindowEnd = todayStart + NEAR_DEADLINE_DAYS * 86400000
  const turnsNearDeadline = activeTurnRequests.filter((tr) => {
    if (!tr.targetDate) return false
    const targetMs = new Date(tr.targetDate).getTime()
    return targetMs >= todayStart && targetMs <= deadlineWindowEnd
  }).length

  return {
    activeTurns,
    completedThisPeriod,
    jobsInProgress,
    avgTurnTime,
    revenueExposure,
    revenueExposureExcludedCount,
    turnsNearDeadline,
  }
}
