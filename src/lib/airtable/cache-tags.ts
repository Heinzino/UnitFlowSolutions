// Centralized cache tag constants and builders
// Use these constants for all cacheTag() calls and revalidateTag() calls
// to prevent typos and enable systematic invalidation.

export const CACHE_TAGS = {
  // Table-level tags (bust all records of a type)
  turnRequests: 'turn-requests',
  jobs: 'jobs',
  properties: 'properties',
  vendors: 'vendors',
  vendorPricing: 'vendor-pricing',
  quotes: 'quotes',
  kpis: 'kpis',

  // Record-level tags (surgical invalidation)
  turnRequest: (id: number) => `turn-request-${id}`,
  job: (id: number) => `job-${id}`,
} as const
