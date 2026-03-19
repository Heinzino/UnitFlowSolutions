import { describe, it, expect } from 'vitest'
import { computeHealthScore } from './health-score'
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
    created: '2024-01-01T00:00:00.000Z',
    ...overrides,
  }
}

// ---------------------------------------------------------------------------
// computeHealthScore
// ---------------------------------------------------------------------------

describe('computeHealthScore', () => {
  it('returns 100 when all TRs have daysOffMarketUntilReady <= 10', () => {
    const trs = [
      makeTurnRequest({ daysOffMarketUntilReady: 5 }),
      makeTurnRequest({ daysOffMarketUntilReady: 10 }),
      makeTurnRequest({ daysOffMarketUntilReady: 3 }),
    ]
    expect(computeHealthScore(trs)).toBe(100)
  })

  it('returns 50 when half of TRs have daysOffMarketUntilReady <= 10', () => {
    const trs = [
      makeTurnRequest({ daysOffMarketUntilReady: 5 }),  // on time
      makeTurnRequest({ daysOffMarketUntilReady: 15 }), // over
    ]
    expect(computeHealthScore(trs)).toBe(50)
  })

  it('returns 0 when all TRs have daysOffMarketUntilReady > 10', () => {
    const trs = [
      makeTurnRequest({ daysOffMarketUntilReady: 11 }),
      makeTurnRequest({ daysOffMarketUntilReady: 20 }),
    ]
    expect(computeHealthScore(trs)).toBe(0)
  })

  it('returns null when no TRs have non-null daysOffMarketUntilReady', () => {
    const trs = [
      makeTurnRequest({ daysOffMarketUntilReady: null }),
      makeTurnRequest({ daysOffMarketUntilReady: null }),
    ]
    expect(computeHealthScore(trs)).toBeNull()
  })

  it('ignores TRs with null daysOffMarketUntilReady (does not count them in denominator)', () => {
    const trs = [
      makeTurnRequest({ daysOffMarketUntilReady: 5 }),   // on time
      makeTurnRequest({ daysOffMarketUntilReady: null }), // ignored
      makeTurnRequest({ daysOffMarketUntilReady: 15 }),   // over
    ]
    // 1 on-time out of 2 with data = 50%
    expect(computeHealthScore(trs)).toBe(50)
  })

  it('returns null for empty array', () => {
    expect(computeHealthScore([])).toBeNull()
  })
})
