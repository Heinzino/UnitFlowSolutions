import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { computePMKPIs } from './pm-kpis'
import type { TurnRequest } from '@/lib/types/airtable'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeTurnRequest(overrides: Partial<TurnRequest> = {}): TurnRequest {
  return {
    requestId: 1,
    readyToLeaseDate: null,
    offMarketDate: null,
    targetDate: null,
    status: 'In progress',
    jobIds: [],
    jobRecordIds: [],
    timeToCompleteUnit: null,
    notes: null,
    quotePrice: null,
    totalCost: null,
    value: null,
    propertyName: 'Test Property',
    streetAddress: '123 Main St',
    unitNumber: '101',
    floorPlan: null,
    city: null,
    state: null,
    bedrooms: null,
    bathrooms: null,
    daysOffMarketUntilReady: null,
    created: '2024-02-01T00:00:00.000Z',
    ...overrides,
  }
}

// Fixed date: 2024-02-15T12:00:00Z
// thirtyDaysAgo: 2024-01-16T12:00:00Z
// sevenDaysAgo:  2024-02-08T12:00:00Z
// startOfMonth:  2024-02-01T00:00:00Z
const FIXED_NOW = new Date('2024-02-15T12:00:00Z').getTime()

beforeEach(() => {
  vi.useFakeTimers()
  vi.setSystemTime(FIXED_NOW)
})

afterEach(() => {
  vi.useRealTimers()
})

// ---------------------------------------------------------------------------
// computePMKPIs
// ---------------------------------------------------------------------------

describe('computePMKPIs', () => {
  // PM-01: activeTurns
  describe('activeTurns', () => {
    it('counts TRs where status !== "Done"', () => {
      const trs = [
        makeTurnRequest({ status: 'In progress' }),
        makeTurnRequest({ status: 'Needs Attention' }),
        makeTurnRequest({ status: 'To Do' }),
        makeTurnRequest({ status: 'Done' }), // excluded
        makeTurnRequest({ status: 'Done' }), // excluded
      ]
      const { activeTurns } = computePMKPIs(trs)
      expect(activeTurns).toBe(3)
    })

    it('returns 0 for empty array', () => {
      const { activeTurns } = computePMKPIs([])
      expect(activeTurns).toBe(0)
    })

    it('returns 0 when all are Done', () => {
      const trs = [makeTurnRequest({ status: 'Done' }), makeTurnRequest({ status: 'Done' })]
      const { activeTurns } = computePMKPIs(trs)
      expect(activeTurns).toBe(0)
    })
  })

  // PM-02: completedLast30d
  describe('completedLast30d', () => {
    it('counts Done TRs with readyToLeaseDate in past 30 days', () => {
      // thirtyDaysAgo = 2024-01-16T12:00:00Z
      // '2024-01-17' = 2024-01-17T00:00:00Z — after thirtyDaysAgo (INCLUDE)
      // '2024-01-15' = 2024-01-15T00:00:00Z — before thirtyDaysAgo (EXCLUDE)
      const trs = [
        makeTurnRequest({ status: 'Done', readyToLeaseDate: '2024-01-17' }), // INCLUDE
        makeTurnRequest({ status: 'Done', readyToLeaseDate: '2024-02-10' }), // INCLUDE
        makeTurnRequest({ status: 'Done', readyToLeaseDate: '2024-01-15' }), // EXCLUDE: too old
        makeTurnRequest({ status: 'In progress', readyToLeaseDate: '2024-02-01' }), // EXCLUDE: not Done
        makeTurnRequest({ status: 'Done', readyToLeaseDate: null }), // EXCLUDE: no date
      ]
      const { completedLast30d } = computePMKPIs(trs)
      expect(completedLast30d).toBe(2)
    })

    it('returns 0 for empty array', () => {
      expect(computePMKPIs([]).completedLast30d).toBe(0)
    })
  })

  // PM-03: completedLast7d
  describe('completedLast7d', () => {
    it('counts Done TRs with readyToLeaseDate in past 7 days', () => {
      // sevenDaysAgo = 2024-02-08T12:00:00Z
      // '2024-02-09' = 2024-02-09T00:00:00Z — after sevenDaysAgo (INCLUDE)
      // '2024-02-08' = 2024-02-08T00:00:00Z — before sevenDaysAgo noon (EXCLUDE)
      const trs = [
        makeTurnRequest({ status: 'Done', readyToLeaseDate: '2024-02-09' }), // INCLUDE
        makeTurnRequest({ status: 'Done', readyToLeaseDate: '2024-02-14' }), // INCLUDE
        makeTurnRequest({ status: 'Done', readyToLeaseDate: '2024-02-08' }), // EXCLUDE: before noon
        makeTurnRequest({ status: 'Done', readyToLeaseDate: '2024-01-20' }), // EXCLUDE: too old
        makeTurnRequest({ status: 'In progress', readyToLeaseDate: '2024-02-12' }), // EXCLUDE: not Done
      ]
      const { completedLast7d } = computePMKPIs(trs)
      expect(completedLast7d).toBe(2)
    })

    it('returns 0 for empty array', () => {
      expect(computePMKPIs([]).completedLast7d).toBe(0)
    })
  })

  // PM-04: avgTurnTime
  describe('avgTurnTime', () => {
    it('returns average of timeToCompleteUnit for Done TRs', () => {
      const trs = [
        makeTurnRequest({ status: 'Done', timeToCompleteUnit: 10 }),
        makeTurnRequest({ status: 'Done', timeToCompleteUnit: 20 }),
        makeTurnRequest({ status: 'In progress', timeToCompleteUnit: 5 }), // excluded
      ]
      const { avgTurnTime } = computePMKPIs(trs)
      expect(avgTurnTime).toBe(15)
    })

    it('returns null when no Done TRs exist', () => {
      const trs = [makeTurnRequest({ status: 'In progress', timeToCompleteUnit: 5 })]
      const { avgTurnTime } = computePMKPIs(trs)
      expect(avgTurnTime).toBeNull()
    })

    it('returns null for empty array', () => {
      expect(computePMKPIs([]).avgTurnTime).toBeNull()
    })

    it('treats null timeToCompleteUnit as 0 in average', () => {
      const trs = [
        makeTurnRequest({ status: 'Done', timeToCompleteUnit: 10 }),
        makeTurnRequest({ status: 'Done', timeToCompleteUnit: null }),
      ]
      const { avgTurnTime } = computePMKPIs(trs)
      expect(avgTurnTime).toBe(5)
    })
  })

  // PM-05: projectedSpendMTD
  describe('projectedSpendMTD', () => {
    it('sums totalCost for TRs created this calendar month', () => {
      // startOfMonth = 2024-02-01T00:00:00Z
      // FIXED_NOW = 2024-02-15T12:00:00Z
      const trs = [
        makeTurnRequest({ created: '2024-02-01T00:00:00.000Z', totalCost: '$600.00' }), // INCLUDE
        makeTurnRequest({ created: '2024-02-10T00:00:00.000Z', totalCost: '$400.00' }), // INCLUDE
        makeTurnRequest({ created: '2024-01-31T00:00:00.000Z', totalCost: '$500.00' }), // EXCLUDE: prior month
        makeTurnRequest({ created: '2024-02-05T00:00:00.000Z', totalCost: null, quotePrice: '$300.00' }), // INCLUDE: fallback
      ]
      const { projectedSpendMTD } = computePMKPIs(trs)
      expect(projectedSpendMTD).toBe(1300)
    })

    it('falls back to quotePrice when totalCost is null', () => {
      const trs = [
        makeTurnRequest({ created: '2024-02-05T00:00:00.000Z', totalCost: null, quotePrice: '$250.00' }),
      ]
      const { projectedSpendMTD } = computePMKPIs(trs)
      expect(projectedSpendMTD).toBe(250)
    })

    it('handles $1,234.56 currency format', () => {
      const trs = [
        makeTurnRequest({ created: '2024-02-05T00:00:00.000Z', totalCost: '$1,234.56' }),
      ]
      const { projectedSpendMTD } = computePMKPIs(trs)
      expect(projectedSpendMTD).toBe(1234.56)
    })

    it('returns 0 for empty array', () => {
      expect(computePMKPIs([]).projectedSpendMTD).toBe(0)
    })

    it('returns 0 when both totalCost and quotePrice are null', () => {
      const trs = [makeTurnRequest({ created: '2024-02-05T00:00:00.000Z', totalCost: null, quotePrice: null })]
      const { projectedSpendMTD } = computePMKPIs(trs)
      expect(projectedSpendMTD).toBe(0)
    })

    it('excludes TRs from prior month even when done this month', () => {
      const trs = [
        makeTurnRequest({ created: '2024-01-15T00:00:00.000Z', totalCost: '$999.00', status: 'Done', readyToLeaseDate: '2024-02-10' }),
      ]
      const { projectedSpendMTD } = computePMKPIs(trs)
      expect(projectedSpendMTD).toBe(0)
    })
  })

  // PM-06: pastTargetCount
  describe('pastTargetCount', () => {
    it('counts TRs where daysOffMarketUntilReady > 10', () => {
      const trs = [
        makeTurnRequest({ daysOffMarketUntilReady: 11 }), // INCLUDE
        makeTurnRequest({ daysOffMarketUntilReady: 10 }), // EXCLUDE (not >10)
        makeTurnRequest({ daysOffMarketUntilReady: 15 }), // INCLUDE
        makeTurnRequest({ daysOffMarketUntilReady: null }), // EXCLUDE
        makeTurnRequest({ daysOffMarketUntilReady: 0 }),   // EXCLUDE
      ]
      const { pastTargetCount } = computePMKPIs(trs)
      expect(pastTargetCount).toBe(2)
    })

    it('returns 0 for empty array', () => {
      expect(computePMKPIs([]).pastTargetCount).toBe(0)
    })
  })

  // parseCurrency edge cases
  describe('parseCurrency (via projectedSpendMTD)', () => {
    it('handles empty string as 0', () => {
      const trs = [makeTurnRequest({ created: '2024-02-05T00:00:00.000Z', totalCost: '' })]
      const { projectedSpendMTD } = computePMKPIs(trs)
      expect(projectedSpendMTD).toBe(0)
    })

    it('handles undefined-like null as 0', () => {
      const trs = [makeTurnRequest({ created: '2024-02-05T00:00:00.000Z', totalCost: null, quotePrice: null })]
      const { projectedSpendMTD } = computePMKPIs(trs)
      expect(projectedSpendMTD).toBe(0)
    })
  })

  // Edge case: empty array
  describe('empty array returns safe defaults', () => {
    it('returns all zeros and null avgTurnTime for empty input', () => {
      const kpis = computePMKPIs([])
      expect(kpis.activeTurns).toBe(0)
      expect(kpis.completedLast30d).toBe(0)
      expect(kpis.completedLast7d).toBe(0)
      expect(kpis.avgTurnTime).toBeNull()
      expect(kpis.projectedSpendMTD).toBe(0)
      expect(kpis.pastTargetCount).toBe(0)
    })
  })
})
