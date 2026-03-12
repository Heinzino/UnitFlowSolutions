// All Airtable interfaces in one file
// Field name mapping derived from SnapshotData CSVs

export const JOB_STATUSES = {
  'NEEDS ATTENTION': 'NEEDS ATTENTION',
  'Blocked': 'Blocked',
  'In Progress': 'In Progress',
  'Completed': 'Completed',
  'Ready': 'Ready',
} as const

export type JobStatus = keyof typeof JOB_STATUSES

export interface TurnRequest {
  requestId: number
  readyToLeaseDate: string | null
  vacantDate: string | null
  targetDate: string | null
  status: string
  jobIds: number[]
  jobs?: Job[]
  timeToCompleteUnit: number | null
  notes: string | null
  quotePrice: string | null
  totalCost: string | null
  value: string | null
  propertyName: string
  streetAddress: string
  unitNumber: string
  floorPlan: string | null
  city: string | null
  state: string | null
  bedrooms: number | null
  bathrooms: number | null
  daysVacantUntilReady: number | null
  created: string
}

export interface Job {
  jobId: number
  requestType: string | null
  status: JobStatus
  statusMessage: string | null
  startDate: string | null
  endDate: string | null
  vendorName: string | null
  vendorType: string | null
  contactName: string | null
  email: string | null
  phone: string | null
  quotePrice: number | null
  turnRequestId: number | null
  propertyName: string | null
  durationDays: number | null
  isCompleted: boolean
  created: string
}

export interface Property {
  streetAddress: string
  propertyName: string
  city: string
  state: string
  unitNumber: string
  bedrooms: number | null
  bathrooms: number | null
  floorPlan: string | null
}

export interface Vendor {
  vendorName: string
  vendorType: string
  contactName: string | null
  email: string | null
  phone: string | null
  numJobsCompleted: number
  numJobsAssigned: number
  avgCompletionTimeDays: number | null
}

export interface VendorPricing {
  propertyName: string
  vendorName: string
  serviceType: string
  floorPlan: string
  price: number
}

export interface Quote {
  quoteId: string
  status: string
  startDate: string | null
  endDate: string | null
  vendorName: string | null
  vendorType: string | null
  propertyName: string | null
  created: string
}

export interface Executive {
  name: string
  role: string
  email: string
}

export interface PropertyManager {
  name: string
  email: string
  phone: string | null
  propertyManaged: string
}

export interface MaintenanceManager {
  name: string
  email: string
  phone: string | null
  propertyManaged: string
}
