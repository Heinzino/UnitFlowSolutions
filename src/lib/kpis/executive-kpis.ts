// Pure KPI compute functions for the Executive Dashboard.
// No I/O — takes typed arrays, returns typed result. Easily unit-tested.

import type { Job, TurnRequest } from '@/lib/types/airtable'

export interface ExecutiveKPIResult {
  activeJobsOpen: number
  jobsTrendingPastTarget: number
  jobsCompleted30d: number
  backlogDelta: number
  avgTimeToComplete: number | null // null when no Done turn requests
  projectedCostExposure: number
  activeTurnsOpen: number
  pastTargetAlerts: { propertyName: string; unitNumber: string }[]
  trendingAlerts: { propertyName: string; unitNumber: string }[]
}

// Real job statuses from Airtable snapshot: Blocked, Completed, In Progress,
// NEEDS ATTENTION, Ready. "Invoice Sent" does not exist in production data.
const COMPLETED_STATUSES = ['Completed'] as const
type CompletedStatus = (typeof COMPLETED_STATUSES)[number]

function isCompleted(status: string): status is CompletedStatus {
  return COMPLETED_STATUSES.includes(status as CompletedStatus)
}

function parseCurrency(value: string | null | undefined): number {
  if (!value) return 0
  return parseFloat(value.replace(/[^0-9.-]/g, '')) || 0
}

export function computeExecutiveKPIs(
  jobs: Job[],
  turnRequests: TurnRequest[]
): ExecutiveKPIResult {
  const now = new Date()
  const twoDaysFromNow = new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000)
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

  // ---------------------------------------------------------------------------
  // EXEC-01: Active Jobs Open — status !== 'Completed'
  // ---------------------------------------------------------------------------
  const activeJobs = jobs.filter((j) => !isCompleted(j.status))
  const activeJobsOpen = activeJobs.length

  // ---------------------------------------------------------------------------
  // EXEC-01: Jobs Trending Past Target — active + endDate within next 2 days
  // ---------------------------------------------------------------------------
  const jobsTrendingPastTarget = activeJobs.filter((j) => {
    if (!j.endDate) return false
    const end = new Date(j.endDate)
    return end >= now && end <= twoDaysFromNow
  }).length

  // ---------------------------------------------------------------------------
  // EXEC-02: Jobs Completed (30d) — Completed + endDate in past 30 days
  // ---------------------------------------------------------------------------
  const completedInRange = jobs.filter((j) => {
    if (!isCompleted(j.status)) return false
    if (!j.endDate) return false
    return new Date(j.endDate) >= thirtyDaysAgo
  })
  const jobsCompleted30d = completedInRange.length

  // ---------------------------------------------------------------------------
  // EXEC-02: Backlog Delta — SUM of delta for completed jobs in past 30 days
  // delta: 0 is a valid value (preserved, not treated as null)
  // ---------------------------------------------------------------------------
  const backlogDelta = completedInRange.reduce((sum, j) => sum + (j.delta ?? 0), 0)

  // ---------------------------------------------------------------------------
  // EXEC-03: Average Time to Complete — avg timeToCompleteUnit for Done TRs
  // Returns null when no Done turn requests exist
  // ---------------------------------------------------------------------------
  const doneTurnRequests = turnRequests.filter((tr) => tr.status === 'Done')
  const avgTimeToComplete =
    doneTurnRequests.length === 0
      ? null
      : doneTurnRequests.reduce((sum, tr) => sum + (tr.timeToCompleteUnit ?? 0), 0) /
        doneTurnRequests.length

  // ---------------------------------------------------------------------------
  // EXEC-03: Projected Cost Exposure — SUM of totalCost (fallback to quotePrice)
  // Parses strings like "$600.00" or "$1,234.56"
  // ---------------------------------------------------------------------------
  const projectedCostExposure = turnRequests.reduce((sum, tr) => {
    const price =
      tr.totalCost != null
        ? parseCurrency(tr.totalCost)
        : parseCurrency(tr.quotePrice)
    return sum + price
  }, 0)

  // ---------------------------------------------------------------------------
  // EXEC-04: Active Turns Open — status !== 'Done'
  // Safer than allowlist: catches any non-Done status including future values
  // ---------------------------------------------------------------------------
  const activeTurnsOpen = turnRequests.filter((tr) => tr.status !== 'Done').length

  // ---------------------------------------------------------------------------
  // EXEC-05: Alert arrays — filtered by daysOffMarketUntilReady threshold
  // ---------------------------------------------------------------------------
  const pastTargetAlerts = turnRequests
    .filter((tr) => (tr.daysOffMarketUntilReady ?? 0) > 10)
    .map((tr) => ({ propertyName: tr.propertyName, unitNumber: tr.unitNumber }))

  const trendingAlerts = turnRequests
    .filter((tr) => (tr.daysOffMarketUntilReady ?? 0) > 8)
    .map((tr) => ({ propertyName: tr.propertyName, unitNumber: tr.unitNumber }))

  return {
    activeJobsOpen,
    jobsTrendingPastTarget,
    jobsCompleted30d,
    backlogDelta,
    avgTimeToComplete,
    projectedCostExposure,
    activeTurnsOpen,
    pastTargetAlerts,
    trendingAlerts,
  }
}

// ---------------------------------------------------------------------------
// computeKPITrends — 30d vs prev-30d comparison for trend arrows
// ---------------------------------------------------------------------------

export type TrendData = { direction: 'up' | 'down'; percentage: number } | null

export interface KPITrends {
  jobsCompleted: TrendData
  activeJobsOpen: TrendData
  avgTimeToComplete: TrendData
}

function computeTrend(current: number, prev: number): TrendData {
  if (prev === 0 || current === prev) return null
  const percentage = Math.abs((current - prev) / prev * 100)
  const direction = current > prev ? 'up' : 'down'
  return { direction, percentage }
}

export function computeKPITrends(
  currentJobs: Job[],
  prevJobs: Job[],
  currentTRs: TurnRequest[],
  prevTRs: TurnRequest[]
): KPITrends {
  const now = new Date()
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
  const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000)

  // jobsCompleted: count Completed jobs with endDate in each 30d window
  const currentCompleted = currentJobs.filter((j) => {
    if (!isCompleted(j.status) || !j.endDate) return false
    const end = new Date(j.endDate)
    return end >= thirtyDaysAgo && end <= now
  }).length

  const prevCompleted = prevJobs.filter((j) => {
    if (!isCompleted(j.status) || !j.endDate) return false
    const end = new Date(j.endDate)
    return end >= sixtyDaysAgo && end < thirtyDaysAgo
  }).length

  const jobsCompleted = computeTrend(currentCompleted, prevCompleted)

  // activeJobsOpen: point-in-time comparison
  const currentActive = currentJobs.filter((j) => !isCompleted(j.status)).length
  const prevActive = prevJobs.filter((j) => !isCompleted(j.status)).length
  const activeJobsOpen = computeTrend(currentActive, prevActive)

  // avgTimeToComplete: average timeToCompleteUnit for Done TRs in each period
  // Uses created date to determine period membership
  const currentDone = currentTRs.filter((tr) => {
    if (tr.status !== 'Done') return false
    const created = new Date(tr.created)
    return created >= thirtyDaysAgo && created <= now
  })
  const prevDone = prevTRs.filter((tr) => {
    if (tr.status !== 'Done') return false
    const created = new Date(tr.created)
    return created >= sixtyDaysAgo && created < thirtyDaysAgo
  })

  let avgTimeToComplete: TrendData = null
  if (currentDone.length > 0 && prevDone.length > 0) {
    const currentAvg =
      currentDone.reduce((sum, tr) => sum + (tr.timeToCompleteUnit ?? 0), 0) / currentDone.length
    const prevAvg =
      prevDone.reduce((sum, tr) => sum + (tr.timeToCompleteUnit ?? 0), 0) / prevDone.length
    avgTimeToComplete = computeTrend(currentAvg, prevAvg)
  }

  return { jobsCompleted, activeJobsOpen, avgTimeToComplete }
}
