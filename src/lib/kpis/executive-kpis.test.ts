import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { computeExecutiveKPIs } from './executive-kpis'
import type { Job, TurnRequest, JobStatus } from '@/lib/types/airtable'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeJob(overrides: Partial<Job> = {}): Job {
  return {
    jobId: 1,
    requestType: 'Painting',
    status: 'In Progress' as JobStatus,
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
    propertyName: 'Test Property',
    durationDays: null,
    delta: null,
    isCompleted: false,
    created: '2024-01-01T00:00:00.000Z',
    ...overrides,
  }
}

function makeTurnRequest(overrides: Partial<TurnRequest> = {}): TurnRequest {
  return {
    requestId: 1,
    readyToLeaseDate: null,
    vacantDate: null,
    targetDate: null,
    status: 'In progress',
    jobIds: [],
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

// Fixed date: 2024-02-15T12:00:00Z
// twoDaysFromNow: 2024-02-17T12:00:00Z
// thirtyDaysAgo: 2024-01-16T12:00:00Z
const FIXED_NOW = new Date('2024-02-15T12:00:00Z').getTime()

beforeEach(() => {
  vi.useFakeTimers()
  vi.setSystemTime(FIXED_NOW)
})

afterEach(() => {
  vi.useRealTimers()
})

// ---------------------------------------------------------------------------
// computeExecutiveKPIs
// ---------------------------------------------------------------------------

describe('computeExecutiveKPIs', () => {
  // EXEC-01: activeJobsOpen
  describe('activeJobsOpen', () => {
    it('counts jobs where status !== Completed', () => {
      const jobs = [
        makeJob({ status: 'In Progress' }),
        makeJob({ status: 'Blocked' }),
        makeJob({ status: 'NEEDS ATTENTION' }),
        makeJob({ status: 'Completed' }), // excluded
        makeJob({ status: 'Ready' }),
      ]
      const { activeJobsOpen } = computeExecutiveKPIs(jobs, [])
      expect(activeJobsOpen).toBe(4)
    })

    it('returns 0 for empty jobs array', () => {
      const { activeJobsOpen } = computeExecutiveKPIs([], [])
      expect(activeJobsOpen).toBe(0)
    })

    it('returns 0 when all jobs are Completed', () => {
      const jobs = [makeJob({ status: 'Completed' }), makeJob({ status: 'Completed' })]
      const { activeJobsOpen } = computeExecutiveKPIs(jobs, [])
      expect(activeJobsOpen).toBe(0)
    })
  })

  // EXEC-01: jobsTrendingPastTarget
  describe('jobsTrendingPastTarget', () => {
    it('counts active jobs with endDate within next 2 days from now', () => {
      const jobs = [
        // endDate today = within 2 days (INCLUDE)
        makeJob({ status: 'In Progress', endDate: '2024-02-15' }),
        // endDate 1 day from now = within 2 days (INCLUDE)
        makeJob({ status: 'In Progress', endDate: '2024-02-16' }),
        // endDate exactly 2 days from now (INCLUDE)
        makeJob({ status: 'In Progress', endDate: '2024-02-17' }),
        // endDate 3 days from now (EXCLUDE)
        makeJob({ status: 'In Progress', endDate: '2024-02-18' }),
        // Completed job with endDate in range (EXCLUDE - not active)
        makeJob({ status: 'Completed', endDate: '2024-02-15' }),
        // Active job with no endDate (EXCLUDE)
        makeJob({ status: 'In Progress', endDate: null }),
        // Past endDate (EXCLUDE)
        makeJob({ status: 'In Progress', endDate: '2024-02-14' }),
      ]
      const { jobsTrendingPastTarget } = computeExecutiveKPIs(jobs, [])
      expect(jobsTrendingPastTarget).toBe(3)
    })

    it('returns 0 when no active jobs have endDate in range', () => {
      const jobs = [makeJob({ status: 'In Progress', endDate: '2024-03-01' })]
      const { jobsTrendingPastTarget } = computeExecutiveKPIs(jobs, [])
      expect(jobsTrendingPastTarget).toBe(0)
    })
  })

  // EXEC-02: jobsCompleted30d
  describe('jobsCompleted30d', () => {
    it('counts Completed jobs with endDate in past 30 days', () => {
      // thirtyDaysAgo = 2024-01-16
      const jobs = [
        // endDate within 30 days (INCLUDE)
        makeJob({ status: 'Completed', endDate: '2024-01-16' }),
        makeJob({ status: 'Completed', endDate: '2024-02-01' }),
        // endDate older than 30 days (EXCLUDE)
        makeJob({ status: 'Completed', endDate: '2024-01-15' }),
        // active job (EXCLUDE)
        makeJob({ status: 'In Progress', endDate: '2024-02-01' }),
        // Completed with no endDate (EXCLUDE)
        makeJob({ status: 'Completed', endDate: null }),
      ]
      const { jobsCompleted30d } = computeExecutiveKPIs(jobs, [])
      expect(jobsCompleted30d).toBe(2)
    })

    it('returns 0 for empty array', () => {
      const { jobsCompleted30d } = computeExecutiveKPIs([], [])
      expect(jobsCompleted30d).toBe(0)
    })
  })

  // EXEC-02: backlogDelta
  describe('backlogDelta', () => {
    it('sums delta for completed jobs with endDate in past 30 days', () => {
      const jobs = [
        makeJob({ status: 'Completed', endDate: '2024-02-01', delta: 3 }),
        makeJob({ status: 'Completed', endDate: '2024-02-10', delta: -1 }),
        makeJob({ status: 'Completed', endDate: '2024-02-10', delta: 0 }), // zero is valid
        // older than 30 days (EXCLUDE)
        makeJob({ status: 'Completed', endDate: '2024-01-01', delta: 10 }),
        // active (EXCLUDE)
        makeJob({ status: 'In Progress', endDate: '2024-02-01', delta: 5 }),
        // completed but delta null (counts as 0)
        makeJob({ status: 'Completed', endDate: '2024-02-05', delta: null }),
      ]
      const { backlogDelta } = computeExecutiveKPIs(jobs, [])
      // 3 + (-1) + 0 + 0 (null) = 2
      expect(backlogDelta).toBe(2)
    })

    it('returns 0 for empty array', () => {
      const { backlogDelta } = computeExecutiveKPIs([], [])
      expect(backlogDelta).toBe(0)
    })

    it('preserves zero delta values', () => {
      const jobs = [makeJob({ status: 'Completed', endDate: '2024-02-01', delta: 0 })]
      const { backlogDelta } = computeExecutiveKPIs(jobs, [])
      expect(backlogDelta).toBe(0)
    })
  })

  // EXEC-03: avgTimeToComplete
  describe('avgTimeToComplete', () => {
    it('returns average of timeToCompleteUnit for Done turn requests', () => {
      const trs = [
        makeTurnRequest({ status: 'Done', timeToCompleteUnit: 10 }),
        makeTurnRequest({ status: 'Done', timeToCompleteUnit: 20 }),
        makeTurnRequest({ status: 'In progress', timeToCompleteUnit: 5 }), // excluded
      ]
      const { avgTimeToComplete } = computeExecutiveKPIs([], trs)
      expect(avgTimeToComplete).toBe(15)
    })

    it('returns null when no Done turn requests', () => {
      const trs = [makeTurnRequest({ status: 'In progress', timeToCompleteUnit: 5 })]
      const { avgTimeToComplete } = computeExecutiveKPIs([], trs)
      expect(avgTimeToComplete).toBeNull()
    })

    it('returns null for empty turn requests', () => {
      const { avgTimeToComplete } = computeExecutiveKPIs([], [])
      expect(avgTimeToComplete).toBeNull()
    })
  })

  // EXEC-03: projectedCostExposure
  describe('projectedCostExposure', () => {
    it('sums totalCost for all turn requests', () => {
      const trs = [
        makeTurnRequest({ totalCost: '$600.00' }),
        makeTurnRequest({ totalCost: '$1200.00' }),
      ]
      const { projectedCostExposure } = computeExecutiveKPIs([], trs)
      expect(projectedCostExposure).toBe(1800)
    })

    it('falls back to quotePrice when totalCost is null', () => {
      const trs = [
        makeTurnRequest({ totalCost: null, quotePrice: '$500.00' }),
        makeTurnRequest({ totalCost: '$300.00', quotePrice: '$100.00' }),
      ]
      const { projectedCostExposure } = computeExecutiveKPIs([], trs)
      // 500 (fallback) + 300 (totalCost used) = 800
      expect(projectedCostExposure).toBe(800)
    })

    it('handles string format with $ and decimals', () => {
      const trs = [makeTurnRequest({ totalCost: '$1,234.56' })]
      const { projectedCostExposure } = computeExecutiveKPIs([], trs)
      expect(projectedCostExposure).toBe(1234.56)
    })

    it('returns 0 for empty turn requests', () => {
      const { projectedCostExposure } = computeExecutiveKPIs([], [])
      expect(projectedCostExposure).toBe(0)
    })

    it('returns 0 when both totalCost and quotePrice are null', () => {
      const trs = [makeTurnRequest({ totalCost: null, quotePrice: null })]
      const { projectedCostExposure } = computeExecutiveKPIs([], trs)
      expect(projectedCostExposure).toBe(0)
    })
  })

  // EXEC-04: activeMakeReadysOpen
  describe('activeMakeReadysOpen', () => {
    it('counts turn requests where status !== Done', () => {
      const trs = [
        makeTurnRequest({ status: 'In progress' }),
        makeTurnRequest({ status: 'Needs Attention' }),
        makeTurnRequest({ status: 'To Do' }),
        makeTurnRequest({ status: 'Done' }), // excluded
      ]
      const { activeMakeReadysOpen } = computeExecutiveKPIs([], trs)
      expect(activeMakeReadysOpen).toBe(3)
    })

    it('returns 0 for empty turn requests', () => {
      const { activeMakeReadysOpen } = computeExecutiveKPIs([], [])
      expect(activeMakeReadysOpen).toBe(0)
    })

    it('returns 0 when all are Done', () => {
      const trs = [makeTurnRequest({ status: 'Done' })]
      const { activeMakeReadysOpen } = computeExecutiveKPIs([], trs)
      expect(activeMakeReadysOpen).toBe(0)
    })
  })

  // EXEC-05: pastTargetAlerts
  describe('pastTargetAlerts', () => {
    it('returns items with daysVacantUntilReady > 10', () => {
      const trs = [
        makeTurnRequest({ propertyName: 'Oak Ridge', unitNumber: '204', daysVacantUntilReady: 11 }),
        makeTurnRequest({ propertyName: 'Sunrise', unitNumber: '101', daysVacantUntilReady: 10 }), // excluded (not >10)
        makeTurnRequest({ propertyName: 'Park View', unitNumber: '305', daysVacantUntilReady: 15 }),
        makeTurnRequest({ propertyName: 'Test', unitNumber: '001', daysVacantUntilReady: null }), // excluded
      ]
      const { pastTargetAlerts } = computeExecutiveKPIs([], trs)
      expect(pastTargetAlerts).toHaveLength(2)
      expect(pastTargetAlerts[0]).toEqual({ propertyName: 'Oak Ridge', unitNumber: '204' })
      expect(pastTargetAlerts[1]).toEqual({ propertyName: 'Park View', unitNumber: '305' })
    })

    it('returns empty array when no TR exceeds 10 days', () => {
      const trs = [makeTurnRequest({ daysVacantUntilReady: 5 })]
      const { pastTargetAlerts } = computeExecutiveKPIs([], trs)
      expect(pastTargetAlerts).toEqual([])
    })
  })

  // EXEC-05: trendingAlerts
  describe('trendingAlerts', () => {
    it('returns items with daysVacantUntilReady > 8', () => {
      const trs = [
        makeTurnRequest({ propertyName: 'Oak Ridge', unitNumber: '204', daysVacantUntilReady: 9 }),
        makeTurnRequest({ propertyName: 'Sunrise', unitNumber: '101', daysVacantUntilReady: 8 }), // excluded (not >8)
        makeTurnRequest({ propertyName: 'Park View', unitNumber: '305', daysVacantUntilReady: 11 }),
      ]
      const { trendingAlerts } = computeExecutiveKPIs([], trs)
      expect(trendingAlerts).toHaveLength(2)
      expect(trendingAlerts[0]).toEqual({ propertyName: 'Oak Ridge', unitNumber: '204' })
    })

    it('returns empty array when no TR exceeds 8 days', () => {
      const trs = [makeTurnRequest({ daysVacantUntilReady: 5 })]
      const { trendingAlerts } = computeExecutiveKPIs([], trs)
      expect(trendingAlerts).toEqual([])
    })
  })

  // EXEC-06: unfiltered arrays
  describe('operates on full unfiltered arrays', () => {
    it('computes KPIs across multiple properties without property-level scoping', () => {
      const jobs = [
        makeJob({ propertyName: 'Property A', status: 'In Progress' }),
        makeJob({ propertyName: 'Property B', status: 'In Progress' }),
        makeJob({ propertyName: 'Property C', status: 'Completed', endDate: '2024-02-01' }),
      ]
      const trs = [
        makeTurnRequest({ propertyName: 'Property A' }),
        makeTurnRequest({ propertyName: 'Property B' }),
      ]
      const kpis = computeExecutiveKPIs(jobs, trs)
      expect(kpis.activeJobsOpen).toBe(2)
      expect(kpis.jobsCompleted30d).toBe(1)
      expect(kpis.activeMakeReadysOpen).toBe(2)
    })
  })

  // Edge case: empty arrays
  describe('empty arrays return safe defaults', () => {
    it('returns all zeroes and null avgTimeToComplete for empty input', () => {
      const kpis = computeExecutiveKPIs([], [])
      expect(kpis.activeJobsOpen).toBe(0)
      expect(kpis.jobsTrendingPastTarget).toBe(0)
      expect(kpis.jobsCompleted30d).toBe(0)
      expect(kpis.backlogDelta).toBe(0)
      expect(kpis.avgTimeToComplete).toBeNull()
      expect(kpis.projectedCostExposure).toBe(0)
      expect(kpis.activeMakeReadysOpen).toBe(0)
      expect(kpis.pastTargetAlerts).toEqual([])
      expect(kpis.trendingAlerts).toEqual([])
    })
  })
})
