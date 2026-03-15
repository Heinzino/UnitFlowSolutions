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
    vacantDate: null,
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
    daysVacantUntilReady: null,
    created: '2024-01-01T00:00:00.000Z',
    ...overrides,
  }
}

// ---------------------------------------------------------------------------
// computeHealthScore
// ---------------------------------------------------------------------------

describe('computeHealthScore', () => {
  it('returns 100 when all TRs have daysVacantUntilReady <= 10', () => {
    const trs = [
      makeTurnRequest({ daysVacantUntilReady: 5 }),
      makeTurnRequest({ daysVacantUntilReady: 10 }),
      makeTurnRequest({ daysVacantUntilReady: 3 }),
    ]
    expect(computeHealthScore(trs)).toBe(100)
  })

  it('returns 50 when half of TRs have daysVacantUntilReady <= 10', () => {
    const trs = [
      makeTurnRequest({ daysVacantUntilReady: 5 }),  // on time
      makeTurnRequest({ daysVacantUntilReady: 15 }), // over
    ]
    expect(computeHealthScore(trs)).toBe(50)
  })

  it('returns 0 when all TRs have daysVacantUntilReady > 10', () => {
    const trs = [
      makeTurnRequest({ daysVacantUntilReady: 11 }),
      makeTurnRequest({ daysVacantUntilReady: 20 }),
    ]
    expect(computeHealthScore(trs)).toBe(0)
  })

  it('returns null when no TRs have non-null daysVacantUntilReady', () => {
    const trs = [
      makeTurnRequest({ daysVacantUntilReady: null }),
      makeTurnRequest({ daysVacantUntilReady: null }),
    ]
    expect(computeHealthScore(trs)).toBeNull()
  })

  it('ignores TRs with null daysVacantUntilReady (does not count them in denominator)', () => {
    const trs = [
      makeTurnRequest({ daysVacantUntilReady: 5 }),   // on time
      makeTurnRequest({ daysVacantUntilReady: null }), // ignored
      makeTurnRequest({ daysVacantUntilReady: 15 }),   // over
    ]
    // 1 on-time out of 2 with data = 50%
    expect(computeHealthScore(trs)).toBe(50)
  })

  it('returns null for empty array', () => {
    expect(computeHealthScore([])).toBeNull()
  })
})
