import { describe, it, expect } from 'vitest'
import { buildJobFilterFormula, mapJob, mapTurnRequest } from '../tables/mappers'

// ---------------------------------------------------------------------------
// buildJobFilterFormula
// ---------------------------------------------------------------------------

describe('buildJobFilterFormula', () => {
  it('returns empty string for empty array', () => {
    expect(buildJobFilterFormula([])).toBe('')
  })

  it('returns single formula without OR wrapper for one ID', () => {
    expect(buildJobFilterFormula([42])).toBe('{Job ID}=42')
  })

  it('returns OR() wrapper for multiple IDs', () => {
    expect(buildJobFilterFormula([51, 52, 53])).toBe(
      'OR({Job ID}=51,{Job ID}=52,{Job ID}=53)'
    )
  })

  it('handles two IDs with OR wrapper', () => {
    expect(buildJobFilterFormula([10, 20])).toBe('OR({Job ID}=10,{Job ID}=20)')
  })
})

// ---------------------------------------------------------------------------
// mapJob
// ---------------------------------------------------------------------------

function makeJobRecord(overrides: Record<string, unknown> = {}) {
  return {
    id: 'recABC123',
    fields: {
      'Job ID': 7,
      'Request Type': 'Painting',
      'Status': 'In Progress',
      'Status Message': 'Work started',
      'Start Date': '2024-01-15',
      'End Date': '2024-01-20',
      'Vendor Name': 'ACME Painters',
      'Vendor Type': 'Painter',
      'Contact Name (from Vendor)': 'Jane Smith',
      'Email (from Vendor)': 'jane@acme.com',
      'Phone (from Vendor)': '555-1234',
      'Quote Price': 450,
      'Request ID (from Turn Requests)': 3,
      'Property Name': 'Sunrise Apartments',
      'Duration (Days, If Completed)': 5,
      'Is Completed': false,
      'Created': '2024-01-10T00:00:00.000Z',
      ...overrides,
    },
  }
}

describe('mapJob', () => {
  it('maps all fields correctly', () => {
    const record = makeJobRecord()
    const job = mapJob(record as unknown as Parameters<typeof mapJob>[0])

    expect(job.jobId).toBe(7)
    expect(job.requestType).toBe('Painting')
    expect(job.status).toBe('In Progress')
    expect(job.statusMessage).toBe('Work started')
    expect(job.startDate).toBe('2024-01-15')
    expect(job.endDate).toBe('2024-01-20')
    expect(job.vendorName).toBe('ACME Painters')
    expect(job.vendorType).toBe('Painter')
    expect(job.contactName).toBe('Jane Smith')
    expect(job.email).toBe('jane@acme.com')
    expect(job.phone).toBe('555-1234')
    expect(job.quotePrice).toBe(450)
    expect(job.turnRequestId).toBe(3)
    expect(job.propertyName).toBe('Sunrise Apartments')
    expect(job.durationDays).toBe(5)
    expect(job.isCompleted).toBe(false)
    expect(job.created).toBe('2024-01-10T00:00:00.000Z')
  })

  it('handles null optional fields', () => {
    const record = makeJobRecord({
      'Request Type': null,
      'Status Message': null,
      'Start Date': null,
      'End Date': null,
      'Vendor Name': null,
      'Vendor Type': null,
      'Contact Name (from Vendor)': null,
      'Email (from Vendor)': null,
      'Phone (from Vendor)': null,
      'Quote Price': null,
      'Request ID (from Turn Requests)': null,
      'Property Name': null,
      'Duration (Days, If Completed)': null,
    })
    const job = mapJob(record as unknown as Parameters<typeof mapJob>[0])

    expect(job.requestType).toBeNull()
    expect(job.statusMessage).toBeNull()
    expect(job.startDate).toBeNull()
    expect(job.endDate).toBeNull()
    expect(job.vendorName).toBeNull()
    expect(job.vendorType).toBeNull()
    expect(job.contactName).toBeNull()
    expect(job.email).toBeNull()
    expect(job.phone).toBeNull()
    expect(job.quotePrice).toBeNull()
    expect(job.turnRequestId).toBeNull()
    expect(job.propertyName).toBeNull()
    expect(job.durationDays).toBeNull()
  })

  it('maps isCompleted boolean from truthy value', () => {
    const record = makeJobRecord({ 'Is Completed': true })
    const job = mapJob(record as unknown as Parameters<typeof mapJob>[0])
    expect(job.isCompleted).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// mapTurnRequest
// ---------------------------------------------------------------------------

function makeTurnRequestRecord(overrides: Record<string, unknown> = {}) {
  return {
    id: 'recTR001',
    fields: {
      'Request ID': 12,
      'Ready To Lease Date': '2024-02-01',
      'Vacant Date': '2024-01-25',
      'Target Date': '2024-01-30',
      'Status': 'In progress',
      'Jobs': '51,52,53',
      'Time to Complete Unit (Days)': 6,
      'Notes': 'Needs painting',
      'Price (from Quote Price) (from Jobs)': '$600.00',
      'Total Cost': '$1200.00',
      'Value': '$2000.00',
      'Property Name': 'Sunrise Apartments',
      'Street Address (from Properties)': '123 Main St',
      'Unit Number (from Properties)': '4B',
      'Floor Plan (from Properties)': '2BR',
      'City (from Properties)': 'Phoenix',
      'State (from Properties)': 'AZ',
      'Bedrooms (from Properties)': 2,
      'Bathrooms (from Properties)': 1,
      'Days Vacant Until Ready': 7,
      'Created': '2024-01-20T00:00:00.000Z',
      ...overrides,
    },
  }
}

describe('mapTurnRequest', () => {
  it('maps all fields correctly', () => {
    const record = makeTurnRequestRecord()
    const tr = mapTurnRequest(record as unknown as Parameters<typeof mapTurnRequest>[0])

    expect(tr.requestId).toBe(12)
    expect(tr.readyToLeaseDate).toBe('2024-02-01')
    expect(tr.vacantDate).toBe('2024-01-25')
    expect(tr.targetDate).toBe('2024-01-30')
    expect(tr.status).toBe('In progress')
    expect(tr.propertyName).toBe('Sunrise Apartments')
    expect(tr.streetAddress).toBe('123 Main St')
    expect(tr.unitNumber).toBe('4B')
    expect(tr.floorPlan).toBe('2BR')
    expect(tr.city).toBe('Phoenix')
    expect(tr.state).toBe('AZ')
    expect(tr.bedrooms).toBe(2)
    expect(tr.bathrooms).toBe(1)
    expect(tr.timeToCompleteUnit).toBe(6)
    expect(tr.daysVacantUntilReady).toBe(7)
    expect(tr.notes).toBe('Needs painting')
    expect(tr.quotePrice).toBe('$600.00')
    expect(tr.totalCost).toBe('$1200.00')
    expect(tr.value).toBe('$2000.00')
    expect(tr.created).toBe('2024-01-20T00:00:00.000Z')
  })

  it('parses Jobs string "51,52,53" into number array [51,52,53]', () => {
    const record = makeTurnRequestRecord({ 'Jobs': '51,52,53' })
    const tr = mapTurnRequest(record as unknown as Parameters<typeof mapTurnRequest>[0])
    expect(tr.jobIds).toEqual([51, 52, 53])
  })

  it('returns empty array for null Jobs field', () => {
    const record = makeTurnRequestRecord({ 'Jobs': null })
    const tr = mapTurnRequest(record as unknown as Parameters<typeof mapTurnRequest>[0])
    expect(tr.jobIds).toEqual([])
  })

  it('returns empty array for undefined Jobs field', () => {
    const record = makeTurnRequestRecord({ 'Jobs': undefined })
    const tr = mapTurnRequest(record as unknown as Parameters<typeof mapTurnRequest>[0])
    expect(tr.jobIds).toEqual([])
  })

  it('handles null optional fields', () => {
    const record = makeTurnRequestRecord({
      'Ready To Lease Date': null,
      'Vacant Date': null,
      'Target Date': null,
      'Notes': null,
      'Price (from Quote Price) (from Jobs)': null,
      'Total Cost': null,
      'Value': null,
      'Floor Plan (from Properties)': null,
      'City (from Properties)': null,
      'State (from Properties)': null,
      'Bedrooms (from Properties)': null,
      'Bathrooms (from Properties)': null,
      'Time to Complete Unit (Days)': null,
      'Days Vacant Until Ready': null,
    })
    const tr = mapTurnRequest(record as unknown as Parameters<typeof mapTurnRequest>[0])

    expect(tr.readyToLeaseDate).toBeNull()
    expect(tr.vacantDate).toBeNull()
    expect(tr.targetDate).toBeNull()
    expect(tr.notes).toBeNull()
    expect(tr.quotePrice).toBeNull()
    expect(tr.totalCost).toBeNull()
    expect(tr.value).toBeNull()
    expect(tr.floorPlan).toBeNull()
    expect(tr.city).toBeNull()
    expect(tr.state).toBeNull()
    expect(tr.bedrooms).toBeNull()
    expect(tr.bathrooms).toBeNull()
    expect(tr.timeToCompleteUnit).toBeNull()
    expect(tr.daysVacantUntilReady).toBeNull()
  })

  it('initializes jobs as undefined (not yet resolved)', () => {
    const record = makeTurnRequestRecord()
    const tr = mapTurnRequest(record as unknown as Parameters<typeof mapTurnRequest>[0])
    expect(tr.jobs).toBeUndefined()
  })
})
