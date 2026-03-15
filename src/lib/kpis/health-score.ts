import type { TurnRequest } from '@/lib/types/airtable'

export function computeHealthScore(turnRequests: TurnRequest[]): number | null {
  const withData = turnRequests.filter(tr => tr.daysVacantUntilReady !== null)
  if (withData.length === 0) return null
  const onTime = withData.filter(tr => (tr.daysVacantUntilReady ?? 0) <= 10)
  return Math.round((onTime.length / withData.length) * 100)
}
