# Phase 3: Airtable Data Layer - Research

**Researched:** 2026-03-11
**Domain:** Airtable REST API, Next.js 16 `use cache` / `cacheTag` / `cacheLife`, token bucket rate limiting, TypeScript type mapping
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- Map Airtable's verbose field names to clean, short camelCase TypeScript names (Claude picks best short name for each)
- Linked record fields (comma-separated IDs) are automatically resolved to full objects on every fetch — no opt-in parameter needed. Caching mitigates the extra API calls.
- Trust Airtable's computed/rollup field values as-is — Airtable is the source of truth
- v1 supports job status updates only. Notes and pricing approval writes deferred to v2
- Enforce valid job statuses via TypeScript enum: NEEDS ATTENTION, Blocked, In Progress, Completed, Ready
- Optimistic UI updates — UI updates immediately on write, reverts on failure
- After successful write: optimistic update + background re-fetch to sync Airtable-computed fields
- Cascade cache busting on writes: bust tags for the updated job, parent turn request, and KPI aggregations
- Fetch errors: show stale cached data with a subtle warning banner. Error state only if no cache exists
- Write errors: toast/snackbar notification, optimistic update reverted, non-blocking
- Rate limiter queues requests invisibly — users see slightly longer loading times
- Console logging for errors, rate-limit events, and cache hits/misses (server-side, visible in Vercel logs)
- Data fetches on page load with 60s cache TTL. No auto-polling while page is open
- Manual refresh button busts cache tags for current view and re-fetches
- "Updated X seconds ago" timestamp displayed near refresh button on all dashboard pages

### Claude's Discretion
- Airtable client library choice (official SDK vs raw fetch)
- Rate limiter implementation (token bucket, sliding window, etc.)
- Cache tag naming strategy
- TypeScript interface organization (one file vs per-table)
- Batch resolution strategy for linked records (parallel vs sequential)
- Server action patterns for write operations
- Toast notification component implementation

### Deferred Ideas (OUT OF SCOPE)
None — discussion stayed within phase scope
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| DATA-01 | All Airtable access is server-side only (API key never exposed to browser) | Server-only functions with `'use cache'` directive; env var `AIRTABLE_API_KEY` (no `NEXT_PUBLIC_` prefix) |
| DATA-02 | Read data from all 9 Airtable tables with correct TypeScript type mappings | Field name mapping table from CSV snapshot; interface organization strategy; airtable npm package |
| DATA-03 | Cache responses with 60s TTL using Next.js caching with tag-based revalidation | `'use cache'` + `cacheLife({ stale: 60, revalidate: 60, expire: 300 })` + custom `airtableData` profile |
| DATA-04 | Rate limiter prevents exceeding Airtable's 5 req/sec limit | Token bucket: capacity=5, refillRate=5/sec, in-memory singleton per Node.js process |
| DATA-05 | Linked record IDs are resolved via batch fetches (no N+1 queries) | Batch resolution using `OR()` filterByFormula to fetch multiple records in one Airtable call |
| DATA-06 | Write operations (status updates) bust relevant cache tags immediately | `revalidateTag(tag, { expire: 0 })` in Server Action — immediate expiration for write-then-read consistency |
</phase_requirements>

---

## Summary

This phase builds the server-side Airtable data layer that all dashboard views (Phases 4–7) depend on. The core pattern is: typed async functions (marked `'use cache'`) that fetch from Airtable, map verbose field names to clean camelCase TypeScript types, apply property scoping, and resolve linked record IDs in batch. Cache tags are scoped by table and record ID for surgical invalidation on writes.

**Critical discovery:** Next.js 16 (installed: 16.1.6) has replaced `unstable_cache` with the `use cache` directive. The old `unstable_cache` API still exists but the docs explicitly state it is replaced. This phase MUST use the new `use cache` + `cacheComponents` pattern. The `revalidateTag` signature has also changed — the single-argument form is deprecated; use `revalidateTag(tag, { expire: 0 })` for immediate expiration on writes.

**Airtable data shapes (from CSV snapshots):** Linked record fields in Turn Requests (`Jobs`) contain comma-separated numeric IDs (e.g., `"51,52,53"`). These are NOT Airtable record IDs — they are the human-readable `Job ID` values used within the base. Batch resolution uses `filterByFormula=OR({Job ID}=51, {Job ID}=52, {Job ID}=53)` to avoid N+1 queries.

**Primary recommendation:** Use the `airtable` npm package (not raw fetch) for the SDK's automatic retry behavior and cleaner pagination API. Implement a module-level token bucket singleton that all Airtable fetch calls pass through. Organize all types in `src/lib/types/airtable.ts` (one file, 9 tables, all interfaces).

---

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `airtable` | ^0.12.x | Airtable REST API client | Official SDK, handles pagination with `eachPage()`/`all()`, automatic retry, well-maintained |
| `next/cache` | (built-in, Next.js 16.1.6) | `cacheTag`, `cacheLife`, `revalidateTag` | The platform-native caching APIs for `use cache` directive |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `sonner` | ^1.x | Toast notifications for write errors | Client-side only; wraps Server Action results |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| `airtable` npm package | Raw `fetch()` to Airtable REST API | Raw fetch gives more control over request timing (better for rate limiter integration), but requires manual pagination and retry logic. Use raw fetch if rate limiter needs to intercept at the HTTP layer. Either works — recommendation is `airtable` SDK for cleaner code. |
| In-memory token bucket | `p-queue` npm package | `p-queue` is simpler (concurrency limiter with interval), but adds a dependency. Token bucket is ~20 lines of code and has no npm dependency. |
| `sonner` | `react-hot-toast` | `sonner` is the Shadcn/ui recommended library; either works. |

**Installation:**
```bash
npm install airtable sonner
```

---

## Architecture Patterns

### Recommended Project Structure
```
src/
├── lib/
│   ├── airtable/
│   │   ├── client.ts         # Airtable base instance + rate limiter singleton
│   │   ├── rate-limiter.ts   # Token bucket implementation
│   │   ├── tables/
│   │   │   ├── turn-requests.ts    # fetchTurnRequests(), fetchTurnRequestById()
│   │   │   ├── jobs.ts             # fetchJobs(), fetchJobsByIds(), updateJobStatus()
│   │   │   ├── properties.ts       # fetchProperties()
│   │   │   ├── vendors.ts          # fetchVendors()
│   │   │   ├── vendor-pricing.ts   # fetchVendorPricing()
│   │   │   ├── quotes.ts           # fetchQuotes()
│   │   │   ├── executives.ts       # fetchExecutives()
│   │   │   ├── property-managers.ts
│   │   │   └── maintenance-managers.ts
│   │   └── cache-tags.ts     # Centralized cache tag constants/builders
│   ├── types/
│   │   └── airtable.ts       # All 9 TypeScript interfaces + JobStatus enum
│   └── ... (existing files)
├── app/
│   ├── actions/
│   │   └── job-status.ts     # 'use server' action for status update + cache bust
│   └── ... (existing routes)
└── components/
    └── ui/
        └── toaster.tsx       # Sonner Toaster wrapper (if not already exists)
```

### Pattern 1: `use cache` on Data Fetch Functions

**What:** Every Airtable fetch function is an `async` function with `'use cache'` directive, `cacheLife`, and `cacheTag` inside.
**When to use:** All server-side Airtable reads. Never call Airtable from client components.

```typescript
// src/lib/airtable/tables/turn-requests.ts
// Source: https://nextjs.org/docs/app/api-reference/directives/use-cache
import { cacheTag, cacheLife } from 'next/cache'
import { base, rateLimiter } from '../client'
import type { TurnRequest } from '@/lib/types/airtable'

export async function fetchTurnRequests(): Promise<TurnRequest[]> {
  'use cache'
  cacheLife({ stale: 60, revalidate: 60, expire: 300 })
  cacheTag('turn-requests')

  await rateLimiter.acquire()
  const records = await base('Turn Requests').select().all()

  return records.map(mapTurnRequest)
}

export async function fetchTurnRequestById(id: number): Promise<TurnRequest | null> {
  'use cache'
  cacheLife({ stale: 60, revalidate: 60, expire: 300 })
  cacheTag('turn-requests', `turn-request-${id}`)

  await rateLimiter.acquire()
  const records = await base('Turn Requests')
    .select({ filterByFormula: `{Request ID} = ${id}` })
    .all()

  return records[0] ? mapTurnRequest(records[0]) : null
}
```

### Pattern 2: Token Bucket Rate Limiter Singleton

**What:** Module-level singleton that throttles all outbound Airtable calls to ≤5/sec.
**When to use:** All Airtable API calls pass through `rateLimiter.acquire()` before making the request.

```typescript
// src/lib/airtable/rate-limiter.ts
// Source: Token bucket pattern — timer-free implementation
export class TokenBucket {
  private tokens: number
  private lastRefill: number

  constructor(
    private capacity: number,   // max burst (5)
    private refillRate: number  // tokens per ms (5/1000)
  ) {
    this.tokens = capacity
    this.lastRefill = Date.now()
  }

  acquire(): Promise<void> {
    return new Promise((resolve) => {
      const tryAcquire = () => {
        const now = Date.now()
        const elapsed = now - this.lastRefill
        // Refill tokens based on elapsed time
        this.tokens = Math.min(
          this.capacity,
          this.tokens + elapsed * this.refillRate
        )
        this.lastRefill = now

        if (this.tokens >= 1) {
          this.tokens -= 1
          resolve()
        } else {
          // Wait until next token is available
          const waitMs = Math.ceil((1 - this.tokens) / this.refillRate)
          setTimeout(tryAcquire, waitMs)
        }
      }
      tryAcquire()
    })
  }
}

// Singleton — one bucket per Node.js process
export const rateLimiter = new TokenBucket(5, 5 / 1000)
```

### Pattern 3: Batch Linked Record Resolution (No N+1)

**What:** Turn Requests contain Jobs as comma-separated numeric IDs. Resolve all linked jobs in a single Airtable call using `OR()` filterByFormula.
**When to use:** fetchTurnRequests() always resolves linked jobs inline.

```typescript
// src/lib/airtable/tables/jobs.ts
export async function fetchJobsByIds(jobIds: number[]): Promise<Job[]> {
  'use cache'
  cacheLife({ stale: 60, revalidate: 60, expire: 300 })
  // Tag with each job ID for surgical cache busting
  cacheTag('jobs', ...jobIds.map(id => `job-${id}`))

  if (jobIds.length === 0) return []

  await rateLimiter.acquire()
  // Build OR() formula: OR({Job ID}=51,{Job ID}=52,{Job ID}=53)
  const formula = `OR(${jobIds.map(id => `{Job ID}=${id}`).join(',')})`
  const records = await base('Jobs')
    .select({ filterByFormula: formula })
    .all()

  return records.map(mapJob)
}
```

### Pattern 4: Cache Tag Naming Strategy

**What:** Centralized tag constants prevent typos and enable systematic invalidation.

```typescript
// src/lib/airtable/cache-tags.ts
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
```

### Pattern 5: Write Server Action with Immediate Cache Bust

**What:** Server Action updates Airtable, then calls `revalidateTag(tag, { expire: 0 })` for immediate expiration (not stale-while-revalidate).
**When to use:** All write operations (v1: job status updates only).

```typescript
// src/app/actions/job-status.ts
// Source: https://nextjs.org/docs/app/api-reference/functions/revalidateTag
'use server'
import { revalidateTag } from 'next/cache'
import { CACHE_TAGS } from '@/lib/airtable/cache-tags'
import { JOB_STATUSES } from '@/lib/types/airtable'

export async function updateJobStatus(
  jobId: number,
  turnRequestId: number,
  status: keyof typeof JOB_STATUSES
): Promise<{ success: boolean; error?: string }> {
  try {
    // Find record by Job ID field value
    const records = await base('Jobs')
      .select({ filterByFormula: `{Job ID}=${jobId}` })
      .all()

    if (!records[0]) {
      return { success: false, error: 'Job not found' }
    }

    await base('Jobs').update(records[0].id, { Status: status })

    // Immediate expiration — { expire: 0 } bypasses stale-while-revalidate
    revalidateTag(CACHE_TAGS.job(jobId), { expire: 0 })
    revalidateTag(CACHE_TAGS.turnRequest(turnRequestId), { expire: 0 })
    revalidateTag(CACHE_TAGS.kpis, { expire: 0 })

    return { success: true }
  } catch (err) {
    console.error('[updateJobStatus] error:', err)
    return { success: false, error: 'Failed to update job status' }
  }
}
```

### Pattern 6: Property Scoping Integration

**What:** After fetching, filter records using existing `filterByProperties()` utility from Phase 2.
**When to use:** All PM and DM data fetches; Exec fetches skip filtering.

```typescript
// src/lib/airtable/tables/turn-requests.ts
import { filterByProperties } from '@/lib/normalize-property-name'
import type { UserRole } from '@/lib/types/auth'

export async function fetchTurnRequestsForUser(
  role: UserRole,
  assignedPropertyNames: string[]
): Promise<TurnRequest[]> {
  'use cache'
  cacheLife({ stale: 60, revalidate: 60, expire: 300 })
  cacheTag('turn-requests')

  const all = await fetchAllTurnRequests() // inner cached call
  if (role === 'exec') return all
  return filterByProperties(all, (tr) => tr.propertyName, assignedPropertyNames)
}
```

### Anti-Patterns to Avoid

- **Calling Airtable from Client Components:** API key would be exposed. All Airtable access must be in Server Components or Server Actions. DATA-01.
- **N+1 linked record resolution:** Never resolve jobs one-at-a-time in a loop. Use `OR()` filterByFormula to batch.
- **Single-argument `revalidateTag(tag)`:** Deprecated in Next.js 16. Always pass `{ expire: 0 }` for writes or `'max'` for soft invalidation.
- **Using `unstable_cache`:** Replaced by `use cache` directive in Next.js 16. Do not use.
- **`'use cache'` without `cacheComponents: true`:** The directive has no effect unless `cacheComponents` is enabled in `next.config.ts`.
- **Reading `cookies()` or `headers()` inside `'use cache'` scope:** Not allowed — read them outside and pass values as arguments.
- **Using `NEXT_PUBLIC_AIRTABLE_API_KEY`:** Never prefix Airtable key with `NEXT_PUBLIC_`. Use `AIRTABLE_API_KEY` and `AIRTABLE_BASE_ID`.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Airtable pagination | Custom offset loop | `airtable` SDK `.all()` method | SDK handles multi-page fetching automatically |
| Cache TTL management | setTimeout invalidation | Next.js `cacheLife` + `cacheTag` | Platform-native, survives server restarts, works on Vercel |
| Toast notifications | Custom state-based popup | `sonner` | Accessible, stacking, auto-dismiss, promise API |
| `useOptimistic` rollback | Manual prev-state tracking | React `useOptimistic` auto-reverts | Revert is automatic when server action settles |

**Key insight:** The airtable SDK's `.all()` method handles pagination invisibly. For 6–15 users with small datasets (dozens of records per table), this is fine. If tables grow to thousands of records, revisit filtering at the API level rather than client-side.

---

## Common Pitfalls

### Pitfall 1: `use cache` Requires `cacheComponents: true` in `next.config.ts`
**What goes wrong:** `'use cache'` directive is silently ignored — data is fetched fresh on every request.
**Why it happens:** `cacheComponents` is the feature flag that enables the new caching system in Next.js 16.
**How to avoid:** Add `cacheComponents: true` to `next.config.ts` before writing any cached functions. Define the `airtableData` custom cache profile in the same config.
**Warning signs:** Data appears fresh on every page load even though `'use cache'` is set.

### Pitfall 2: Rate Limiter is Per-Process, Not Per-Deployment
**What goes wrong:** On Vercel (serverless), each function invocation can be a separate process. The in-memory token bucket is not shared across cold starts.
**Why it happens:** Vercel scales horizontally; module-level singletons are per-instance.
**How to avoid:** Accept this as a known limitation. With 6–15 users at a daily/weekly check cadence, concurrent requests are rare. The rate limiter prevents per-request spikes within a single invocation. If Airtable returns 429, implement exponential backoff retry (3 attempts, 200ms/400ms/800ms).
**Warning signs:** Occasional 429 errors in Vercel logs under concurrent access.

### Pitfall 3: Airtable Linked Record Fields Are Not Airtable Record IDs
**What goes wrong:** Treating the `Jobs` field values (e.g., `"51,52,53"`) as Airtable record IDs (which look like `recXXXXXXXXXX`).
**Why it happens:** The CSV snapshot shows numeric IDs — these are the `Job ID` field values, not Airtable's internal `rec...` IDs.
**How to avoid:** Use `filterByFormula: OR({Job ID}=51, {Job ID}=52, ...)` to batch fetch by the human-readable ID field. When reading Airtable records via the SDK, the `.id` property is the `rec...` ID, while `.fields['Job ID']` is the numeric ID.
**Warning signs:** Empty results when trying to look up linked records.

### Pitfall 4: `revalidateTag` Single-Argument Form is Deprecated in Next.js 16
**What goes wrong:** `revalidateTag('jobs')` uses stale-while-revalidate semantics, meaning users may see stale job status immediately after a write.
**Why it happens:** The two-argument form is required in Next.js 16. Single-arg is deprecated and behavior will be removed.
**How to avoid:** Always use `revalidateTag(tag, { expire: 0 })` for write operations. This immediately expires the cache — the next request blocks on fresh data.
**Warning signs:** Job status updates appear to "lag" — old status shown immediately after a write.

### Pitfall 5: `'use cache'` Cannot Access `cookies()` or `headers()`
**What goes wrong:** Build error or incorrect behavior when trying to read user auth/role inside a cached function.
**Why it happens:** `'use cache'` runs in an isolated environment; runtime request APIs are not accessible.
**How to avoid:** Read user role and `property_ids` from Supabase auth OUTSIDE the cached function (in the Server Component or layout), then pass them as arguments to the cached fetch function.
**Warning signs:** TypeScript or build errors mentioning "cannot access dynamic data inside use cache scope".

### Pitfall 6: Airtable Computed Fields Are Strings, Not Numbers
**What goes wrong:** TypeScript type is `number` but Airtable returns `"$600.00"` or `"4"` as a string.
**Why it happens:** The CSV snapshot shows some computed/rollup fields with currency formatting. The actual API may return numbers or formatted strings depending on field type.
**How to avoid:** For currency fields (`Total Cost`, `Price`), define the TypeScript type as `string` and display as-is. For numeric fields (`Time to Complete Unit (Days)`, `Days Vacant Until Ready`), use `Number()` during mapping with a fallback to `null`. Test with actual API response — snapshot data may differ from API response format.
**Warning signs:** `NaN` in numeric fields, or `[object Object]` in display.

---

## Code Examples

### Enabling `cacheComponents` in `next.config.ts`
```typescript
// Source: https://nextjs.org/docs/app/api-reference/config/next-config-js/cacheComponents
import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  cacheComponents: true,
  cacheLife: {
    airtableData: {
      stale: 60,      // 60s client cache before server check
      revalidate: 60, // 60s server-side revalidation window
      expire: 300,    // 5 min max — force fresh after this
    },
  },
}

export default nextConfig
```

### Airtable Client Singleton
```typescript
// src/lib/airtable/client.ts
import Airtable from 'airtable'
import { rateLimiter } from './rate-limiter'

if (!process.env.AIRTABLE_API_KEY) throw new Error('AIRTABLE_API_KEY not set')
if (!process.env.AIRTABLE_BASE_ID) throw new Error('AIRTABLE_BASE_ID not set')

const airtable = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY })
export const base = airtable.base(process.env.AIRTABLE_BASE_ID)
export { rateLimiter }
```

### TypeScript Interfaces (src/lib/types/airtable.ts)
```typescript
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
  requestId: number           // Request ID
  readyToLeaseDate: string | null   // Ready To Lease Date
  vacantDate: string | null   // Vacant Date
  targetDate: string | null   // Target Date
  status: string              // Status (Done, In progress, etc.)
  jobIds: number[]            // Jobs (parsed from "51,52,53")
  jobs?: Job[]                // Resolved linked records
  timeToCompleteUnit: number | null  // Time to Complete Unit (Days) — computed
  notes: string | null        // Notes
  totalCost: string | null    // Total Cost — keep as string (currency)
  value: string | null        // Value — currency string
  propertyName: string        // Property Name
  streetAddress: string       // Street Address (from Properties)
  unitNumber: string          // Unit Number (from Properties)
  floorPlan: string | null    // Floor Plan (from Properties)
  city: string | null         // City (from Properties)
  state: string | null        // State (from Properties)
  bedrooms: number | null     // Bedrooms (from Properties)
  bathrooms: number | null    // Bathrooms (from Properties)
  daysVacantUntilReady: number | null  // Days Vacant Until Ready — computed
  created: string             // Created
}

export interface Job {
  jobId: number               // Job ID
  requestType: string | null  // Request Type
  status: JobStatus           // Status
  statusMessage: string | null // Status Message
  startDate: string | null    // Start Date
  endDate: string | null      // End Date
  vendorName: string | null   // Vendor Name
  vendorType: string | null   // Vendor Type
  contactName: string | null  // Contact Name (from Vendor)
  email: string | null        // Email (from Vendor)
  phone: string | null        // Phone (from Vendor)
  quotePrice: number | null   // Quote Price
  turnRequestId: number | null // Request ID (from Turn Requests)
  propertyName: string | null  // Property Name
  durationDays: number | null  // Duration (Days, If Completed)
  isCompleted: boolean         // Is Completed
  created: string              // Created
}

export interface Property {
  streetAddress: string       // Street Address
  propertyName: string        // Property Name
  city: string                // City
  state: string               // State
  unitNumber: string          // Unit Number
  bedrooms: number | null     // Bedrooms
  bathrooms: number | null    // Bathrooms
  floorPlan: string | null    // Floor Plan
}

export interface Vendor {
  vendorName: string          // Vendor Name
  vendorType: string          // Vendor Type
  contactName: string | null  // Contact Name
  email: string | null        // Email
  phone: string | null        // Phone
  numJobsCompleted: number    // Num Jobs Completed
  numJobsAssigned: number     // Num Jobs Assigned
  avgCompletionTimeDays: number | null  // Average Completion Time (Days)
}

export interface VendorPricing {
  propertyName: string        // Property Name
  vendorName: string          // Vendor Name
  serviceType: string         // Service Type
  floorPlan: string           // Floor Plan
  price: number               // Price
}

export interface Quote {
  quoteId: string             // ID (Airtable record ID)
  status: string              // Status
  startDate: string | null    // Start Date
  endDate: string | null      // End Date
  vendorName: string | null   // Vendor Name (from Vendor)
  vendorType: string | null   // Vendor Type (from Vendor)
  propertyName: string | null // Property (linked)
  created: string             // Created
}

export interface Executive {
  name: string                // Name
  role: string                // Role
  email: string               // Email
}

export interface PropertyManager {
  name: string                // Name
  email: string               // Email
  phone: string | null        // Phone
  propertyManaged: string     // Property Managed
}

export interface MaintenanceManager {
  name: string                // Name
  email: string               // Email
  phone: string | null        // Phone
  propertyManaged: string     // Property Managed
}
```

### Airtable Field Mapping (from CSV snapshots)

**Turn Requests table** — Airtable field → TypeScript camelCase:
| Airtable Field | TypeScript Name | Type |
|---|---|---|
| `Request ID` | `requestId` | `number` |
| `Ready To Lease Date` | `readyToLeaseDate` | `string \| null` |
| `Vacant Date` | `vacantDate` | `string \| null` |
| `Target Date` | `targetDate` | `string \| null` |
| `Status` | `status` | `string` |
| `Jobs` | `jobIds` (parsed) | `number[]` |
| `Time to Complete Unit (Days)` | `timeToCompleteUnit` | `number \| null` |
| `Notes` | `notes` | `string \| null` |
| `Price (from Quote Price) (from Jobs)` | `quotePrice` | `string \| null` |
| `Total Cost` | `totalCost` | `string \| null` |
| `Value` | `value` | `string \| null` |
| `Property Name` | `propertyName` | `string` |
| `Street Address (from Properties)` | `streetAddress` | `string` |
| `Unit Number (from Properties)` | `unitNumber` | `string` |
| `Floor Plan (from Properties)` | `floorPlan` | `string \| null` |
| `City (from Properties)` | `city` | `string \| null` |
| `State (from Properties)` | `state` | `string \| null` |
| `Bedrooms (from Properties)` | `bedrooms` | `number \| null` |
| `Bathrooms (from Properties)` | `bathrooms` | `number \| null` |
| `Days Vacant Until Ready` | `daysVacantUntilReady` | `number \| null` |
| `Created` | `created` | `string` |

**Jobs table** — Airtable field → TypeScript camelCase:
| Airtable Field | TypeScript Name | Type |
|---|---|---|
| `Job ID` | `jobId` | `number` |
| `Request Type` | `requestType` | `string \| null` |
| `Status` | `status` | `JobStatus` |
| `Status Message` | `statusMessage` | `string \| null` |
| `Start Date` | `startDate` | `string \| null` |
| `End Date` | `endDate` | `string \| null` |
| `Vendor Name` | `vendorName` | `string \| null` |
| `Vendor Type` | `vendorType` | `string \| null` |
| `Contact Name (from Vendor)` | `contactName` | `string \| null` |
| `Email (from Vendor)` | `email` | `string \| null` |
| `Phone (from Vendor)` | `phone` | `string \| null` |
| `Quote Price` | `quotePrice` | `number \| null` |
| `Request ID (from Turn Requests)` | `turnRequestId` | `number \| null` |
| `Property Name` | `propertyName` | `string \| null` |
| `Duration (Days, If Completed)` | `durationDays` | `number \| null` |
| `Is Completed` | `isCompleted` | `boolean` |
| `Created` | `created` | `string` |

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `unstable_cache()` wrapper function | `'use cache'` directive + `cacheLife()` + `cacheTag()` | Next.js 16.0.0 (stable) | Must enable `cacheComponents: true`. Old API still exists but is deprecated. |
| `revalidateTag(tag)` single arg | `revalidateTag(tag, { expire: 0 })` or `revalidateTag(tag, 'max')` | Next.js 16 | Single-arg is deprecated and behavior may be removed. Use two-arg form always. |
| `experimental: { serverActions: true }` | Server Actions are stable | Next.js 14+ | No config needed; `'use server'` at file top works as-is. |

**Deprecated/outdated:**
- `unstable_cache`: Replaced by `use cache`. Still works but do not use in new code.
- Single-arg `revalidateTag(tag)`: Deprecated. Use `revalidateTag(tag, { expire: 0 })` for writes.
- `experimental.useCache: true`: Superseded by `cacheComponents: true` in Next.js 16.

---

## Open Questions

1. **Airtable `Jobs` field — numeric IDs vs Airtable record IDs**
   - What we know: CSV snapshot shows `"51,52,53"` in the `Jobs` column on Turn Requests — these match the `Job ID` field values in the Jobs table.
   - What's unclear: Whether the Airtable API returns the same numeric string or the Airtable `rec...` record IDs when reading linked record fields via the SDK.
   - Recommendation: On Wave 0, add a test that reads a real Airtable Turn Request record and logs the raw `Jobs` field value to confirm format. If the API returns `rec...` IDs, the batch resolution strategy changes to use `OR(RECORD_ID()='recXXX',RECORD_ID()='recYYY')`.

2. **Rate limiter behavior on Vercel serverless cold starts**
   - What we know: Module-level singleton resets on cold start. Each function invocation may be a fresh process.
   - What's unclear: Whether concurrent users hitting the same Vercel instance share the rate limiter or get separate instances.
   - Recommendation: Accept the limitation for v1. If 429 errors appear in production logs, add exponential backoff retry (3 attempts) in the Airtable client wrapper.

3. **Airtable field types for computed fields**
   - What we know: CSV shows `"$600.00"` for `Total Cost` (string) and `4` for `Time to Complete Unit (Days)` (appears numeric).
   - What's unclear: Whether the API returns currency fields as strings or numbers in the actual JSON response.
   - Recommendation: Map all currency fields as `string | null` for safety. Parse numeric fields with `Number(val) || null`. Adjust after first real API call.

---

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest 4.0.18 |
| Config file | `vitest.config.ts` (project root) |
| Quick run command | `npx vitest run --reporter=verbose src/lib/airtable` |
| Full suite command | `npx vitest run --reporter=verbose` |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| DATA-01 | Airtable client only created server-side; no `NEXT_PUBLIC_` env vars used | unit | `npx vitest run src/lib/airtable/__tests__/client.test.ts` | ❌ Wave 0 |
| DATA-02 | Field name mapping functions produce correct camelCase output for each table | unit | `npx vitest run src/lib/airtable/__tests__/mappers.test.ts` | ❌ Wave 0 |
| DATA-03 | `cacheComponents: true` is set in next.config.ts; `airtableData` profile exists | smoke (manual) | Build check: `npx next build` (no cache warning) | ❌ Wave 0 |
| DATA-04 | Rate limiter acquires at most 5 tokens per 1000ms under burst load | unit | `npx vitest run src/lib/airtable/__tests__/rate-limiter.test.ts` | ❌ Wave 0 |
| DATA-05 | Batch job resolver builds correct `OR()` filterByFormula string | unit | `npx vitest run src/lib/airtable/__tests__/mappers.test.ts` | ❌ Wave 0 |
| DATA-06 | updateJobStatus returns `{ success: true }` and calls revalidateTag | unit (mocked) | `npx vitest run src/app/actions/__tests__/job-status.test.ts` | ❌ Wave 0 |

### Sampling Rate
- **Per task commit:** `npx vitest run src/lib/airtable/__tests__/ --reporter=verbose`
- **Per wave merge:** `npx vitest run --reporter=verbose`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `src/lib/airtable/__tests__/client.test.ts` — covers DATA-01 (env var guard, server-only export)
- [ ] `src/lib/airtable/__tests__/rate-limiter.test.ts` — covers DATA-04 (token bucket timing, acquire blocks)
- [ ] `src/lib/airtable/__tests__/mappers.test.ts` — covers DATA-02, DATA-05 (field mapping, OR() formula builder)
- [ ] `src/app/actions/__tests__/job-status.test.ts` — covers DATA-06 (mocked Airtable + revalidateTag)
- [ ] `src/lib/airtable/` directory — does not exist yet, needs to be created

---

## Sources

### Primary (HIGH confidence)
- [Next.js 16.1.6 — `use cache` directive](https://nextjs.org/docs/app/api-reference/directives/use-cache) — verified `use cache` replaces `unstable_cache`, constraint rules, `cacheComponents` requirement
- [Next.js 16.1.6 — `cacheLife` function](https://nextjs.org/docs/app/api-reference/functions/cacheLife) — preset profiles, inline profile syntax, stale/revalidate/expire semantics
- [Next.js 16.1.6 — `cacheTag` function](https://nextjs.org/docs/app/api-reference/functions/cacheTag) — tagging pattern, `cacheComponents` requirement
- [Next.js 16.1.6 — `revalidateTag` function](https://nextjs.org/docs/app/api-reference/functions/revalidateTag) — two-argument form requirement, `{ expire: 0 }` for immediate expiration, single-arg deprecation
- [Next.js 16.1.6 — `cacheComponents` config](https://nextjs.org/docs/app/api-reference/config/next-config-js/cacheComponents) — how to enable, what it controls
- [Next.js 16.1.6 — `unstable_cache`](https://nextjs.org/docs/app/api-reference/functions/unstable_cache) — confirmed deprecated/replaced in Next.js 16
- SnapshotData CSVs — field names for all 9 tables confirmed from actual Airtable export

### Secondary (MEDIUM confidence)
- [Airtable rate limits — official support page](https://support.airtable.com/docs/managing-api-call-limits-in-airtable) — 5 req/sec per base, 429 on exceed, confirmed via WebSearch
- [Airtable pagination pattern](https://chinarajames.com/how-to-paginate-records-in-airtable-when-using-the-api/) — 100 records max per page, offset-based pagination, multiple sources agree
- [React `useOptimistic` auto-revert](https://react.dev/reference/react/useOptimistic) — automatic rollback when server action settles, confirmed by React official docs

### Tertiary (LOW confidence)
- `airtable` npm package `.all()` method — confirmed from multiple community sources (Airtable community forums, Medium articles); version not verified against npm registry (403 on npm fetch)
- Token bucket rate limiter implementation pattern — confirmed from multiple independent sources; specifics of timer-free implementation from community examples

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — Next.js 16 caching APIs verified from official Next.js docs at exact installed version (16.1.6)
- Architecture: HIGH — patterns derived directly from official docs and actual CSV data shapes
- Pitfalls: HIGH — `use cache` constraints documented in official Next.js 16 docs; Airtable ID pitfall derived from actual snapshot data analysis
- Field name mapping: HIGH — derived from actual SnapshotData CSV headers

**Research date:** 2026-03-11
**Valid until:** 2026-04-11 (Next.js caching APIs stable; Airtable API very stable)
