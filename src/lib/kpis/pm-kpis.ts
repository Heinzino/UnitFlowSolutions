// PM KPI compute stub — will be replaced with full implementation in GREEN phase
import type { TurnRequest } from '@/lib/types/airtable'

export interface PMKPIResult {
  activeMakeReadys: number
  completedLast30d: number
  completedLast7d: number
  avgMakeReadyTime: number | null
  projectedSpendMTD: number
  pastTargetCount: number
}

export function computePMKPIs(_turnRequests: TurnRequest[]): PMKPIResult {
  return {
    activeMakeReadys: -1,
    completedLast30d: -1,
    completedLast7d: -1,
    avgMakeReadyTime: 0,
    projectedSpendMTD: -1,
    pastTargetCount: -1,
  }
}
