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
  activeMakeReadysOpen: number
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
  // EXEC-04: Active Make Readys Open — status !== 'Done'
  // Safer than allowlist: catches any non-Done status including future values
  // ---------------------------------------------------------------------------
  const activeMakeReadysOpen = turnRequests.filter((tr) => tr.status !== 'Done').length

  // ---------------------------------------------------------------------------
  // EXEC-05: Alert arrays — filtered by daysVacantUntilReady threshold
  // ---------------------------------------------------------------------------
  const pastTargetAlerts = turnRequests
    .filter((tr) => (tr.daysVacantUntilReady ?? 0) > 10)
    .map((tr) => ({ propertyName: tr.propertyName, unitNumber: tr.unitNumber }))

  const trendingAlerts = turnRequests
    .filter((tr) => (tr.daysVacantUntilReady ?? 0) > 8)
    .map((tr) => ({ propertyName: tr.propertyName, unitNumber: tr.unitNumber }))

  return {
    activeJobsOpen,
    jobsTrendingPastTarget,
    jobsCompleted30d,
    backlogDelta,
    avgTimeToComplete,
    projectedCostExposure,
    activeMakeReadysOpen,
    pastTargetAlerts,
    trendingAlerts,
  }
}
