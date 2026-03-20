// Pure field mapping functions — no external dependencies on client.ts.
// Extracted here so they can be imported and tested without triggering
// the Airtable client env var guards.

import type { Record as AirtableRecord, FieldSet } from 'airtable'
import type { Job, TurnRequest, JobStatus } from '@/lib/types/airtable'

// ---------------------------------------------------------------------------
// Job mapper
// ---------------------------------------------------------------------------

export function mapJob(record: AirtableRecord<FieldSet>): Job {
  const f = record.fields as Record<string, unknown>
  return {
    recordId: record.id,
    jobId: Number(f['Job ID']),
    requestType: f['Request Type'] ? String(f['Request Type']) : null,
    status: (f['Status'] as JobStatus) ?? 'NEEDS ATTENTION',
    statusMessage: f['Status Message'] ? String(f['Status Message']) : null,
    startDate: f['Start Date'] ? String(f['Start Date']) : null,
    endDate: f['End Date'] ? String(f['End Date']) : null,
    vendorName: f['Vendor Name'] ? String(f['Vendor Name']) : null,
    vendorType: f['Vendor Type'] ? String(f['Vendor Type']) : null,
    contactName: f['Contact Name (from Vendor)']
      ? String(f['Contact Name (from Vendor)'])
      : null,
    email: f['Email (from Vendor)'] ? String(f['Email (from Vendor)']) : null,
    phone: f['Phone (from Vendor)'] ? String(f['Phone (from Vendor)']) : null,
    quotePrice:
      f['Price (from Quote Price)'] != null
        ? Number(f['Price (from Quote Price)']) || null
        : f['Quote Price'] != null ? Number(f['Quote Price']) || null : null,
    turnRequestId:
      f['Request ID (from Turn Requests)'] != null
        ? Number(f['Request ID (from Turn Requests)']) || null
        : null,
    propertyName: f['Property Name'] ? String(f['Property Name']) : null,
    durationDays:
      f['Duration (Days, If Completed)'] != null
        ? Number(f['Duration (Days, If Completed)']) || null
        : null,
    delta: f['Delta'] != null ? Number(f['Delta']) : null,
    isCompleted: Boolean(f['Is Completed']),
    created: String(f['Created'] ?? ''),
  }
}

// ---------------------------------------------------------------------------
// Turn Request mapper
// ---------------------------------------------------------------------------

export function mapTurnRequest(record: AirtableRecord<FieldSet>): TurnRequest {
  const f = record.fields as Record<string, unknown>

  // Parse Jobs linked record field — API returns array of record IDs ["recXXX"]
  let jobRecordIds: string[] = []
  let jobIds: number[] = []
  const rawJobs = f['Jobs']
  if (Array.isArray(rawJobs)) {
    // Linked record field: array of record IDs (strings starting with "rec")
    const recIds = rawJobs.filter((v): v is string => typeof v === 'string' && v.startsWith('rec'))
    if (recIds.length > 0) {
      jobRecordIds = recIds
    } else {
      // Fallback: array of numeric IDs
      jobIds = rawJobs.map(Number).filter((n) => !isNaN(n) && n > 0)
    }
  } else if (typeof rawJobs === 'string' && rawJobs.trim() !== '') {
    // CSV-style: "51,52,53"
    jobIds = rawJobs
      .split(',')
      .map((s) => Number(s.trim()))
      .filter((n) => !isNaN(n) && n > 0)
  }

  return {
    requestId: Number(f['Request ID']),
    readyToLeaseDate: f['Ready To Lease Date']
      ? String(f['Ready To Lease Date'])
      : null,
    offMarketDate: f['Vacant Date'] ? String(f['Vacant Date']) : null,
    targetDate: f['Target Date'] ? String(f['Target Date']) : null,
    status: String(f['Status'] ?? ''),
    jobIds,
    jobRecordIds,
    // jobs will be populated by resolveLinkedJobs
    timeToCompleteUnit:
      f['Time to Complete Unit (Days)'] != null
        ? Number(f['Time to Complete Unit (Days)']) || null
        : null,
    notes: f['Notes'] ? String(f['Notes']) : null,
    quotePrice: f['Price (from Quote Price) (from Jobs)']
      ? String(f['Price (from Quote Price) (from Jobs)'])
      : null,
    totalCost: f['Total Cost'] ? String(f['Total Cost']) : null,
    value: f['Value'] ? String(f['Value']) : null,
    propertyName: String(f['Property Name'] ?? ''),
    streetAddress: String(f['Street Address (from Properties)'] ?? ''),
    unitNumber: String(f['Unit Number (from Properties)'] ?? ''),
    floorPlan: f['Floor Plan (from Properties)']
      ? String(f['Floor Plan (from Properties)'])
      : null,
    city: f['City (from Properties)']
      ? String(f['City (from Properties)'])
      : null,
    state: f['State (from Properties)']
      ? String(f['State (from Properties)'])
      : null,
    bedrooms:
      f['Bedrooms (from Properties)'] != null
        ? Number(f['Bedrooms (from Properties)']) || null
        : null,
    bathrooms:
      f['Bathrooms (from Properties)'] != null
        ? Number(f['Bathrooms (from Properties)']) || null
        : null,
    daysOffMarketUntilReady:
      f['Days Vacant Until Ready'] != null
        ? Number(f['Days Vacant Until Ready']) || null
        : null,
    created: String(f['Created'] ?? ''),
  }
}

// ---------------------------------------------------------------------------
// Formula builder
// ---------------------------------------------------------------------------

export function buildJobFilterFormula(jobIds: number[]): string {
  if (jobIds.length === 0) return ''
  if (jobIds.length === 1) return `{Job ID}=${jobIds[0]}`
  return `OR(${jobIds.map((id) => `{Job ID}=${id}`).join(',')})`
}
