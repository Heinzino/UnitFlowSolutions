import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import {
  computePMKPIs,
  REVENUE_EXPOSURE_RATE_PER_DAY,
  NEAR_DEADLINE_DAYS,
  COMPLETED_PERIOD_DAYS,
} from './pm-kpis'
import type { TurnRequest, Job } from '@/lib/types/airtable'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeJob(overrides: Partial<Job> = {}): Job {
  return {
    recordId: 'rec_test',
    jobId: 1,
    requestType: null,
    status: 'In Progress',
    statusMessage: null,
    startDate: null,
    endDate: null,
    vendorName: null,
    vendorType: null,
    contactName: null,
    email: null,
    phone: null,
    quotePrice: null,
    turnRequestId: null,
    propertyName: null,
    durationDays: null,
    delta: null,
    isCompleted: false,
    created: '2024-02-01T00:00:00.000Z',
    ...overrides,
  }
}

function makeTurnRequest(overrides: Partial<TurnRequest> = {}): TurnRequest {
  return {
    requestId: 1,
    readyToLeaseDate: null,
    offMarketDate: null,
    targetDate: null,
    status: 'In progress',
    jobIds: [],
    jobRecordIds: [],
    jobs: [],
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
// todayStart (UTC midnight): 2024-02-15T00:00:00Z
const FIXED_NOW = new Date('2024-02-15T12:00:00Z').getTime()

beforeEach(() => {
  vi.useFakeTimers()
  vi.setSystemTime(FIXED_NOW)
})

afterEach(() => {
  vi.useRealTimers()
})

// ---------------------------------------------------------------------------
// Named constants
// ---------------------------------------------------------------------------

describe('named constants', () => {
  it('exports REVENUE_EXPOSURE_RATE_PER_DAY = 60', () => {
    expect(REVENUE_EXPOSURE_RATE_PER_DAY).toBe(60)
  })

  it('exports NEAR_DEADLINE_DAYS = 3', () => {
    expect(NEAR_DEADLINE_DAYS).toBe(3)
  })

  it('exports COMPLETED_PERIOD_DAYS = 30', () => {
    expect(COMPLETED_PERIOD_DAYS).toBe(30)
  })
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

  // completedThisPeriod (replaces old completedLast30d)
  describe('completedThisPeriod', () => {
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
      const { completedThisPeriod } = computePMKPIs(trs)
      expect(completedThisPeriod).toBe(2)
    })

    it('returns 0 for empty array', () => {
      expect(computePMKPIs([]).completedThisPeriod).toBe(0)
    })
  })

  // avgTurnTime (unchanged behavior)
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

  // jobsInProgress
  describe('jobsInProgress', () => {
    it('counts non-completed jobs from active turns only', () => {
      // 3 active turns, each with 1 Completed + 1 In Progress job -> 3 non-completed
      const trs = [
        makeTurnRequest({
          requestId: 1,
          status: 'In progress',
          jobs: [
            makeJob({ jobId: 1, isCompleted: true }),
            makeJob({ jobId: 2, isCompleted: false, status: 'In Progress' }),
          ],
        }),
        makeTurnRequest({
          requestId: 2,
          status: 'In progress',
          jobs: [
            makeJob({ jobId: 3, isCompleted: true }),
            makeJob({ jobId: 4, isCompleted: false, status: 'In Progress' }),
          ],
        }),
        makeTurnRequest({
          requestId: 3,
          status: 'In progress',
          jobs: [
            makeJob({ jobId: 5, isCompleted: true }),
            makeJob({ jobId: 6, isCompleted: false, status: 'In Progress' }),
          ],
        }),
      ]
      const { jobsInProgress } = computePMKPIs(trs)
      expect(jobsInProgress).toBe(3)
    })

    it('excludes jobs from Done turns', () => {
      const trs = [
        makeTurnRequest({
          requestId: 1,
          status: 'Done',
          jobs: [makeJob({ jobId: 1, isCompleted: false, status: 'In Progress' })],
        }),
      ]
      const { jobsInProgress } = computePMKPIs(trs)
      expect(jobsInProgress).toBe(0)
    })

    it('deduplicates jobs by jobId across turns', () => {
      const sharedJob = makeJob({ jobId: 99, isCompleted: false, status: 'In Progress' })
      const trs = [
        makeTurnRequest({ requestId: 1, status: 'In progress', jobs: [sharedJob] }),
        makeTurnRequest({ requestId: 2, status: 'In progress', jobs: [sharedJob] }),
      ]
      const { jobsInProgress } = computePMKPIs(trs)
      expect(jobsInProgress).toBe(1)
    })

    it('counts NEEDS ATTENTION jobs as in-progress workload', () => {
      const trs = [
        makeTurnRequest({
          status: 'In progress',
          jobs: [makeJob({ jobId: 1, isCompleted: false, status: 'NEEDS ATTENTION' })],
        }),
      ]
      const { jobsInProgress } = computePMKPIs(trs)
      expect(jobsInProgress).toBe(1)
    })

    it('counts Blocked jobs as in-progress workload', () => {
      const trs = [
        makeTurnRequest({
          status: 'In progress',
          jobs: [makeJob({ jobId: 1, isCompleted: false, status: 'Blocked' })],
        }),
      ]
      const { jobsInProgress } = computePMKPIs(trs)
      expect(jobsInProgress).toBe(1)
    })

    it('counts Ready jobs as in-progress workload (per locked decision)', () => {
      const trs = [
        makeTurnRequest({
          status: 'In progress',
          jobs: [makeJob({ jobId: 1, isCompleted: false, status: 'Ready' })],
        }),
      ]
      const { jobsInProgress } = computePMKPIs(trs)
      expect(jobsInProgress).toBe(1)
    })

    it('does NOT count Completed (isCompleted=true) jobs', () => {
      const trs = [
        makeTurnRequest({
          status: 'In progress',
          jobs: [makeJob({ jobId: 1, isCompleted: true, status: 'Completed' })],
        }),
      ]
      const { jobsInProgress } = computePMKPIs(trs)
      expect(jobsInProgress).toBe(0)
    })

    it('returns 0 for empty array', () => {
      expect(computePMKPIs([]).jobsInProgress).toBe(0)
    })
  })

  // revenueExposure
  describe('revenueExposure', () => {
    it('calculates $60/day over target correctly', () => {
      // offMarketDate='2024-01-01', targetDate='2024-01-11' -> targetDays=10
      // daysOffMarketUntilReady=15 -> daysOver=5 -> exposure=$300
      const trs = [
        makeTurnRequest({
          status: 'In progress',
          offMarketDate: '2024-01-01',
          targetDate: '2024-01-11',
          daysOffMarketUntilReady: 15,
        }),
      ]
      const { revenueExposure } = computePMKPIs(trs)
      expect(revenueExposure).toBe(300)
    })

    it('returns 0 when turn is not over target', () => {
      // targetDays=10, daysOffMarketUntilReady=8 -> daysOver=0
      const trs = [
        makeTurnRequest({
          status: 'In progress',
          offMarketDate: '2024-01-01',
          targetDate: '2024-01-11',
          daysOffMarketUntilReady: 8,
        }),
      ]
      const { revenueExposure } = computePMKPIs(trs)
      expect(revenueExposure).toBe(0)
    })

    it('excludes turns with targetDate=null from sum (contributes $0)', () => {
      const trs = [
        makeTurnRequest({
          status: 'In progress',
          offMarketDate: '2024-01-01',
          targetDate: null,
          daysOffMarketUntilReady: 20,
        }),
      ]
      const { revenueExposure } = computePMKPIs(trs)
      expect(revenueExposure).toBe(0)
    })

    it('returns 0 exposure when offMarketDate is null', () => {
      const trs = [
        makeTurnRequest({
          status: 'In progress',
          offMarketDate: null,
          targetDate: '2024-01-11',
          daysOffMarketUntilReady: 20,
        }),
      ]
      const { revenueExposure } = computePMKPIs(trs)
      expect(revenueExposure).toBe(0)
    })

    it('sums exposure across multiple turns', () => {
      const trs = [
        makeTurnRequest({
          requestId: 1,
          status: 'In progress',
          offMarketDate: '2024-01-01',
          targetDate: '2024-01-11',
          daysOffMarketUntilReady: 15, // 5 days over -> $300
        }),
        makeTurnRequest({
          requestId: 2,
          status: 'In progress',
          offMarketDate: '2024-01-01',
          targetDate: '2024-01-11',
          daysOffMarketUntilReady: 12, // 2 days over -> $120
        }),
      ]
      const { revenueExposure } = computePMKPIs(trs)
      expect(revenueExposure).toBe(420)
    })

    it('returns 0 when all turns have no targetDate', () => {
      const trs = [
        makeTurnRequest({ status: 'In progress', targetDate: null }),
        makeTurnRequest({ status: 'In progress', targetDate: null }),
      ]
      const { revenueExposure } = computePMKPIs(trs)
      expect(revenueExposure).toBe(0)
    })

    it('returns 0 for empty array', () => {
      expect(computePMKPIs([]).revenueExposure).toBe(0)
    })
  })

  // revenueExposureExcludedCount
  describe('revenueExposureExcludedCount', () => {
    it('counts active turns with targetDate=null', () => {
      const trs = [
        makeTurnRequest({ requestId: 1, status: 'In progress', targetDate: '2024-01-11' }),
        makeTurnRequest({ requestId: 2, status: 'In progress', targetDate: null }), // excluded
        makeTurnRequest({ requestId: 3, status: 'In progress', targetDate: null }), // excluded
        makeTurnRequest({ requestId: 4, status: 'In progress', targetDate: null }), // excluded
      ]
      const { revenueExposureExcludedCount } = computePMKPIs(trs)
      expect(revenueExposureExcludedCount).toBe(3)
    })

    it('does not count Done turns in excluded count', () => {
      const trs = [
        makeTurnRequest({ requestId: 1, status: 'Done', targetDate: null }), // Done — not counted
        makeTurnRequest({ requestId: 2, status: 'In progress', targetDate: null }), // active, excluded
      ]
      const { revenueExposureExcludedCount } = computePMKPIs(trs)
      expect(revenueExposureExcludedCount).toBe(1)
    })

    it('returns 0 when all active turns have targetDate', () => {
      const trs = [
        makeTurnRequest({ status: 'In progress', targetDate: '2024-01-11' }),
        makeTurnRequest({ status: 'In progress', targetDate: '2024-02-01' }),
      ]
      const { revenueExposureExcludedCount } = computePMKPIs(trs)
      expect(revenueExposureExcludedCount).toBe(0)
    })

    it('returns 0 for empty array', () => {
      expect(computePMKPIs([]).revenueExposureExcludedCount).toBe(0)
    })
  })

  // turnsNearDeadline
  describe('turnsNearDeadline', () => {
    // FIXED_NOW = 2024-02-15T12:00:00Z
    // todayStart = 2024-02-15T00:00:00Z (midnight UTC)
    // deadline window: [2024-02-15, 2024-02-18] inclusive (today + 3 days)

    it('counts active turn with targetDate = today', () => {
      const trs = [makeTurnRequest({ status: 'In progress', targetDate: '2024-02-15' })]
      const { turnsNearDeadline } = computePMKPIs(trs)
      expect(turnsNearDeadline).toBe(1)
    })

    it('counts active turn with targetDate = today+3', () => {
      const trs = [makeTurnRequest({ status: 'In progress', targetDate: '2024-02-18' })]
      const { turnsNearDeadline } = computePMKPIs(trs)
      expect(turnsNearDeadline).toBe(1)
    })

    it('does NOT count active turn with targetDate = today+4', () => {
      const trs = [makeTurnRequest({ status: 'In progress', targetDate: '2024-02-19' })]
      const { turnsNearDeadline } = computePMKPIs(trs)
      expect(turnsNearDeadline).toBe(0)
    })

    it('does NOT count active turn with targetDate = yesterday', () => {
      const trs = [makeTurnRequest({ status: 'In progress', targetDate: '2024-02-14' })]
      const { turnsNearDeadline } = computePMKPIs(trs)
      expect(turnsNearDeadline).toBe(0)
    })

    it('does NOT count Done turn with targetDate = today', () => {
      const trs = [makeTurnRequest({ status: 'Done', targetDate: '2024-02-15' })]
      const { turnsNearDeadline } = computePMKPIs(trs)
      expect(turnsNearDeadline).toBe(0)
    })

    it('does NOT count active turn with targetDate = null', () => {
      const trs = [makeTurnRequest({ status: 'In progress', targetDate: null })]
      const { turnsNearDeadline } = computePMKPIs(trs)
      expect(turnsNearDeadline).toBe(0)
    })

    it('returns 0 for empty array', () => {
      expect(computePMKPIs([]).turnsNearDeadline).toBe(0)
    })
  })

  // Edge case: empty array returns safe defaults for all new fields
  describe('empty array returns safe defaults', () => {
    it('returns all zeros and null avgTurnTime for empty input', () => {
      const kpis = computePMKPIs([])
      expect(kpis.activeTurns).toBe(0)
      expect(kpis.completedThisPeriod).toBe(0)
      expect(kpis.jobsInProgress).toBe(0)
      expect(kpis.avgTurnTime).toBeNull()
      expect(kpis.revenueExposure).toBe(0)
      expect(kpis.revenueExposureExcludedCount).toBe(0)
      expect(kpis.turnsNearDeadline).toBe(0)
    })
  })
})
