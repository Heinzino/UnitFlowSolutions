// Pure KPI compute functions for the Property Manager Dashboard.
// No I/O — takes typed arrays, returns typed result. Easily unit-tested.
// Modeled on computeExecutiveKPIs from executive-kpis.ts.

import type { TurnRequest } from '@/lib/types/airtable'

export interface PMKPIResult {
  activeTurns: number
  completedLast30d: number
  completedLast7d: number
  avgTurnTime: number | null // null when no Done turn requests
  projectedSpendMTD: number
  pastTargetCount: number
}

function parseCurrency(value: string | null | undefined): number {
  if (!value) return 0
  return parseFloat(value.replace(/[^0-9.-]/g, '')) || 0
}

export function computePMKPIs(turnRequests: TurnRequest[]): PMKPIResult {
  const now = new Date()
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)

  // Start of current calendar month (local time, but computed as UTC midnight)
  const startOfMonth = new Date(Date.UTC(now.getFullYear(), now.getMonth(), 1))

  // ---------------------------------------------------------------------------
  // PM-01: Active Turns — TRs where status !== "Done"
  // Safer than allowlist: catches any non-Done status including future values
  // ---------------------------------------------------------------------------
  const activeTurns = turnRequests.filter((tr) => tr.status !== 'Done').length

  // ---------------------------------------------------------------------------
  // PM-02: Completed Last 30d — Done TRs with readyToLeaseDate in past 30 days
  // ---------------------------------------------------------------------------
  const completedLast30d = turnRequests.filter((tr) => {
    if (tr.status !== 'Done') return false
    if (!tr.readyToLeaseDate) return false
    return new Date(tr.readyToLeaseDate) >= thirtyDaysAgo
  }).length

  // ---------------------------------------------------------------------------
  // PM-03: Completed Last 7d — Done TRs with readyToLeaseDate in past 7 days
  // ---------------------------------------------------------------------------
  const completedLast7d = turnRequests.filter((tr) => {
    if (tr.status !== 'Done') return false
    if (!tr.readyToLeaseDate) return false
    return new Date(tr.readyToLeaseDate) >= sevenDaysAgo
  }).length

  // ---------------------------------------------------------------------------
  // PM-04: Avg Turn Time — average timeToCompleteUnit for Done TRs
  // Returns null when no Done turn requests exist
  // ---------------------------------------------------------------------------
  const doneTurnRequests = turnRequests.filter((tr) => tr.status === 'Done')
  const avgTurnTime =
    doneTurnRequests.length === 0
      ? null
      : doneTurnRequests.reduce((sum, tr) => sum + (tr.timeToCompleteUnit ?? 0), 0) /
        doneTurnRequests.length

  // ---------------------------------------------------------------------------
  // PM-05: Projected Spend MTD — sum of totalCost (fallback to quotePrice)
  // Scoped to TRs created in current calendar month (tr.created >= startOfMonth)
  // NOTE: Uses tr.created, NOT readyToLeaseDate (see Research pitfall 6)
  // ---------------------------------------------------------------------------
  const projectedSpendMTD = turnRequests
    .filter((tr) => new Date(tr.created) >= startOfMonth)
    .reduce((sum, tr) => {
      const price =
        tr.totalCost != null
          ? parseCurrency(tr.totalCost)
          : parseCurrency(tr.quotePrice)
      return sum + price
    }, 0)

  // ---------------------------------------------------------------------------
  // PM-06: Past Target Count — TRs where daysOffMarketUntilReady > 10
  // ---------------------------------------------------------------------------
  const pastTargetCount = turnRequests.filter(
    (tr) => (tr.daysOffMarketUntilReady ?? 0) > 10
  ).length

  return {
    activeTurns,
    completedLast30d,
    completedLast7d,
    avgTurnTime,
    projectedSpendMTD,
    pastTargetCount,
  }
}
