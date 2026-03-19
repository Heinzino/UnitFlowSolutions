import type { TurnRequest } from '@/lib/types/airtable'

export function computeHealthScore(turnRequests: TurnRequest[]): number | null {
  const withData = turnRequests.filter(tr => tr.daysOffMarketUntilReady !== null)
  if (withData.length === 0) return null
  const onTime = withData.filter(tr => (tr.daysOffMarketUntilReady ?? 0) <= 10)
  return Math.round((onTime.length / withData.length) * 100)
}
