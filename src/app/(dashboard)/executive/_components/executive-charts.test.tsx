import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import type { TurnRequest, Vendor } from '@/lib/types/airtable'

// ---------------------------------------------------------------------------
// Mock Airtable fetchers (factories must not reference external variables)
// ---------------------------------------------------------------------------

vi.mock('@/lib/airtable/tables/turn-requests', () => ({
  fetchTurnRequests: vi.fn(),
}))

vi.mock('@/lib/airtable/tables/vendors', () => ({
  fetchVendors: vi.fn(),
}))

// Mock Recharts to avoid jsdom SVG measurement issues
vi.mock('recharts', () => ({
  BarChart: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="bar-chart">{children}</div>
  ),
  Bar: ({ children }: { children?: React.ReactNode }) => <div>{children}</div>,
  XAxis: () => <div />,
  YAxis: () => <div />,
  Tooltip: () => <div />,
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="responsive-container">{children}</div>
  ),
  Cell: () => <div />,
}))

// Import after mocks are declared
import { fetchTurnRequests } from '@/lib/airtable/tables/turn-requests'
import { fetchVendors } from '@/lib/airtable/tables/vendors'
import { ExecutiveCharts } from './executive-charts'

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

function makeVendor(overrides: Partial<Vendor> = {}): Vendor {
  return {
    vendorName: 'Test Vendor',
    vendorType: 'Painting',
    contactName: null,
    email: null,
    phone: null,
    numJobsCompleted: 5,
    numJobsAssigned: 6,
    avgCompletionTimeDays: null,
    jobIds: [],
    ...overrides,
  }
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('ExecutiveCharts', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders without throwing (smoke test)', async () => {
    vi.mocked(fetchTurnRequests).mockResolvedValue([
      makeTurnRequest({ daysVacantUntilReady: 5 }),
      makeTurnRequest({ daysVacantUntilReady: 15 }),
    ])
    vi.mocked(fetchVendors).mockResolvedValue([
      makeVendor({ vendorName: 'Acme Painting', avgCompletionTimeDays: 8 }),
    ])

    const result = await ExecutiveCharts()
    expect(() => render(result)).not.toThrow()
  })

  it('renders "Turn Health Score" heading from HealthGauge', async () => {
    vi.mocked(fetchTurnRequests).mockResolvedValue([
      makeTurnRequest({ daysVacantUntilReady: 5 }),
    ])
    vi.mocked(fetchVendors).mockResolvedValue([
      makeVendor({ vendorName: 'Acme Painting', avgCompletionTimeDays: 8 }),
    ])

    const result = await ExecutiveCharts()
    render(result)
    expect(screen.getByText('Turn Health Score')).toBeDefined()
  })

  it('renders "Avg Completion Time by Vendor (Days)" heading', async () => {
    vi.mocked(fetchTurnRequests).mockResolvedValue([
      makeTurnRequest({ daysVacantUntilReady: 10 }),
    ])
    vi.mocked(fetchVendors).mockResolvedValue([
      makeVendor({ vendorName: 'Acme', avgCompletionTimeDays: 12 }),
    ])

    const result = await ExecutiveCharts()
    render(result)
    expect(screen.getByText('Avg Completion Time by Vendor (Days)')).toBeDefined()
  })

  it('renders "No vendor data available" when all vendors have null avgCompletionTimeDays', async () => {
    vi.mocked(fetchTurnRequests).mockResolvedValue([
      makeTurnRequest({ daysVacantUntilReady: 5 }),
    ])
    vi.mocked(fetchVendors).mockResolvedValue([
      makeVendor({ vendorName: 'Acme', avgCompletionTimeDays: null }),
      makeVendor({ vendorName: 'Beta', avgCompletionTimeDays: null }),
    ])

    const result = await ExecutiveCharts()
    render(result)
    expect(screen.getByText('No vendor data available')).toBeDefined()
  })
})
