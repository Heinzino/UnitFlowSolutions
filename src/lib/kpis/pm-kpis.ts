// Pure KPI compute functions for the Property Manager Dashboard.
// No I/O — takes typed arrays, returns typed result. Easily unit-tested.

import type { TurnRequest } from '@/lib/types/airtable'

// ---------------------------------------------------------------------------
// Named constants — business rules as exported values
// ---------------------------------------------------------------------------

export const REVENUE_EXPOSURE_RATE_PER_DAY = 60
export const UPCOMING_JOBS_DUE_DAYS = 2
export const COMPLETED_PERIOD_DAYS = 30

export interface PMKPIResult {
  openTurns: number
  avgTurnTime: number | null // null when no Done turn requests in last 30 days
  turnsPastTargetTime: number
  jobsPastTargetTime: number
  upcomingJobsDue: number
  jobCompletionTracker: number
  revenueExposure: number // kept for RM/Exec/Top10 usage
  revenueExposureExcludedCount: number
}

// ---------------------------------------------------------------------------
// Per-turn revenue exposure — exported for use in turn list column
// ---------------------------------------------------------------------------
export function computeTurnRevenueExposure(tr: TurnRequest): number {
  if (!tr.targetDate) return 0
  const now = new Date()
  const target = new Date(tr.targetDate)
  if (target >= now) return 0
  const daysPastTarget = Math.ceil(
    (now.getTime() - target.getTime()) / (1000 * 60 * 60 * 24)
  )
  return daysPastTarget * REVENUE_EXPOSURE_RATE_PER_DAY
}

export function computePMKPIs(turnRequests: TurnRequest[]): PMKPIResult {
  const now = new Date()
  const thirtyDaysAgo = new Date(now.getTime() - COMPLETED_PERIOD_DAYS * 24 * 60 * 60 * 1000)
  const twoDaysFromNow = new Date(now.getTime() + UPCOMING_JOBS_DUE_DAYS * 24 * 60 * 60 * 1000)

  // Active turn requests (reused across multiple KPIs)
  const activeTurnRequests = turnRequests.filter((tr) => tr.status !== 'Done')

  // ---------------------------------------------------------------------------
  // openTurns — TRs where status !== "Done"
  // Independent of job completion — only updated when PM clicks "Done"
  // ---------------------------------------------------------------------------
  const openTurns = activeTurnRequests.length

  // ---------------------------------------------------------------------------
  // avgTurnTime — average timeToCompleteUnit for Done TRs in last 30 days
  // Returns null when no Done turn requests exist in the period
  // ---------------------------------------------------------------------------
  const doneTurnRequests = turnRequests.filter((tr) => {
    if (tr.status !== 'Done') return false
    if (!tr.readyToLeaseDate) return false
    return new Date(tr.readyToLeaseDate) >= thirtyDaysAgo
  })
  const avgTurnTime =
    doneTurnRequests.length === 0
      ? null
      : doneTurnRequests.reduce((sum, tr) => sum + (tr.timeToCompleteUnit ?? 0), 0) /
        doneTurnRequests.length

  // ---------------------------------------------------------------------------
  // turnsPastTargetTime — active turns where targetDate is already past
  // ---------------------------------------------------------------------------
  const turnsPastTargetTime = activeTurnRequests.filter((tr) => {
    if (!tr.targetDate) return false
    return new Date(tr.targetDate) < now
  }).length

  // ---------------------------------------------------------------------------
  // Collect unique non-completed jobs from active turns (reused below)
  // ---------------------------------------------------------------------------
  const allActiveJobs = activeTurnRequests.flatMap((tr) => tr.jobs ?? [])
  const uniqueActiveJobs = [
    ...new Map(allActiveJobs.map((j) => [j.jobId, j])).values(),
  ].filter((j) => !j.isCompleted)

  // ---------------------------------------------------------------------------
  // jobsPastTargetTime — non-completed jobs where endDate is already past
  // ---------------------------------------------------------------------------
  const jobsPastTargetTime = uniqueActiveJobs.filter((j) => {
    if (!j.endDate) return false
    return new Date(j.endDate) < now
  }).length

  // ---------------------------------------------------------------------------
  // upcomingJobsDue — non-completed jobs with endDate within next 2 days
  // ---------------------------------------------------------------------------
  const upcomingJobsDue = uniqueActiveJobs.filter((j) => {
    if (!j.endDate) return false
    const end = new Date(j.endDate)
    return end >= now && end <= twoDaysFromNow
  }).length

  // ---------------------------------------------------------------------------
  // jobCompletionTracker — completed jobs in last 30 days (across all turns)
  // ---------------------------------------------------------------------------
  const allJobs = turnRequests.flatMap((tr) => tr.jobs ?? [])
  const uniqueAllJobs = [...new Map(allJobs.map((j) => [j.jobId, j])).values()]
  const jobCompletionTracker = uniqueAllJobs.filter((j) => {
    if (!j.isCompleted) return false
    if (!j.endDate) return false
    return new Date(j.endDate) >= thirtyDaysAgo
  }).length

  // ---------------------------------------------------------------------------
  // revenueExposure — $RATE/day for each active turn over its target window
  // ---------------------------------------------------------------------------
  const revenueExposure = activeTurnRequests.reduce(
    (sum, tr) => sum + computeTurnRevenueExposure(tr),
    0
  )

  // ---------------------------------------------------------------------------
  // revenueExposureExcludedCount — active turns missing targetDate
  // ---------------------------------------------------------------------------
  const revenueExposureExcludedCount = activeTurnRequests.filter(
    (tr) => tr.targetDate === null
  ).length

  return {
    openTurns,
    avgTurnTime,
    turnsPastTargetTime,
    jobsPastTargetTime,
    upcomingJobsDue,
    jobCompletionTracker,
    revenueExposure,
    revenueExposureExcludedCount,
  }
}
