# Architecture Research

**Domain:** Property management turnover dashboard — v1.2 dashboard redesign integration
**Researched:** 2026-03-18
**Confidence:** HIGH (all claims derived from direct reading of source files — no assumptions from training data)

## Context: What Already Exists

This is a subsequent-milestone research file. The existing codebase (8,753 LOC, 202 tests, Next.js 16 App Router) has a mature architecture. The question is not "how to build a dashboard" but "how do new v1.2 features integrate with existing patterns."

### Existing Architecture Summary

```
Browser
    |
Next.js App Router (Vercel)
    |
    ├── middleware.ts              — Supabase session refresh + ROLE_ROUTES enforcement
    ├── (dashboard)/layout.tsx     — AppShell (sidebar + content area)
    ├── (dashboard)/executive/     — exec role: KPIs + charts
    ├── (dashboard)/property/      — pm AND rm role: KPIs + turn list + turn/job detail
    ├── (dashboard)/district/      — legacy: redirects to /property (no real content)
    ├── (dashboard)/vendors/       — all roles: vendor metrics table
    ├── (dashboard)/vacant/        — all roles: add off-market units
    └── (dashboard)/admin/         — admin only: create user
    |
lib/airtable/                      — Server-side data layer (never reaches browser)
    ├── client.ts                  — Airtable SDK init + rate limiter export
    ├── cache-tags.ts              — Centralized CACHE_TAGS constant
    ├── rate-limiter.ts            — Token bucket (5 req/sec)
    └── tables/
        ├── turn-requests.ts       — fetchTurnRequests(), fetchTurnRequestsForUser(),
        │                            fetchTurnRequestById() + internal resolveLinkedJobs()
        ├── jobs.ts                — fetchJobs(), fetchJobsByIds(), fetchJobById()
        └── mappers.ts             — mapTurnRequest(), mapJob(), buildJobFilterFormula()
    |
lib/kpis/                          — Pure compute functions (no I/O)
    ├── executive-kpis.ts          — computeExecutiveKPIs(), computeKPITrends()
    ├── pm-kpis.ts                 — computePMKPIs()
    └── health-score.ts            — computeHealthScore()
    |
app/actions/
    ├── job-status.ts              — updateJobStatus() — writes Jobs table, busts 5 tags
    ├── turn-request-status.ts     — updateTurnRequestStatus() — writes Turn Requests table
    ├── auth.ts                    — signIn(), signOut()
    ├── admin.ts                   — createUser() — Supabase Admin API
    └── vacant.ts                  — createOffMarketUnit() — writes Properties table
    |
Airtable REST API <---> Supabase Auth
```

### Role Routing: Confirmed State

Confirmed from `src/lib/types/auth.ts` and `src/lib/supabase/middleware.ts`:

```typescript
// Current (v1.1) state — confirmed by reading source
export const ROLE_ROUTES: Record<UserRole, string> = {
  pm: '/property',
  rm: '/property',    // RM lands on /property today — no dedicated RM route exists
  exec: '/executive',
}

export const ROLE_ALLOWED_ROUTES: Partial<Record<UserRole, string[]>> = {
  exec: ['/executive', '/property', '/vendors', '/vacant'],
  rm:   ['/property', '/vendors', '/vacant'],
  pm:   ['/property', '/vendors', '/vacant'],
}
```

The `/district/page.tsx` file exists but only contains `redirect('/property')`. It is not the rm home route. For v1.2, the rm route changes to `/regional`.

### Existing Cache Tag Topology (confirmed from cache-tags.ts)

```typescript
CACHE_TAGS = {
  turnRequests: 'turn-requests',   // table-level
  jobs: 'jobs',                    // table-level
  properties: 'properties',        // table-level
  vendors: 'vendors',              // table-level
  vendorPricing: 'vendor-pricing', // table-level
  quotes: 'quotes',                // table-level
  kpis: 'kpis',                    // computed results (no direct table)

  turnRequest: (id: number) => `turn-request-${id}`,  // record-level
  job: (id: number) => `job-${id}`,                   // record-level
}
```

Write actions use `revalidateTag(tag, { expire: 0 })` syntax (Next.js 16 App Router). Confirmed in `job-status.ts` — busts `job(id)`, `jobs`, `turnRequest(id)`, `turnRequests`, `kpis` on every job status write.

### Existing Data Shape That Matters

`TurnRequest` already carries: `vacantDate`, `readyToLeaseDate`, `daysVacantUntilReady`, `targetDate`, `status`, `totalCost`, `quotePrice`, `timeToCompleteUnit`, `jobIds`, `jobRecordIds`, `jobs` (resolved after `resolveLinkedJobs()`).

`Job` already carries: `status`, `isCompleted`, `propertyName`, `startDate`, `endDate`, `requestType`, `vendorName`, `quotePrice`, `jobId`.

No Airtable schema changes are needed for any v1.2 feature.

---

## System Overview: v1.2 Target State

```
┌────────────────────────────────────────────────────────────────────────┐
│                              BROWSER                                    │
│                                                                         │
│  ┌──────────────┐  ┌──────────────────┐  ┌──────────────────────────┐  │
│  │  Sidebar     │  │  PM Dashboard    │  │  RM Dashboard (NEW)       │  │
│  │  (modified:  │  │  (modified KPIs, │  │  /regional               │  │
│  │  add Regional│  │  Open Turns with │  │  6-box aggregated KPIs,  │  │
│  │  + Completed │  │  date entry,     │  │  Property Insights list,  │  │
│  │  Jobs links) │  │  Active Jobs     │  │  Avg Turn Time bar graph) │  │
│  └──────────────┘  │  table)          │  └──────────────────────────┘  │
│                    └──────────────────┘                                 │
│  ┌───────────────────────┐  ┌───────────────────────────────────────┐  │
│  │  Exec Dashboard       │  │  Completed Jobs Page (NEW)            │  │
│  │  (modified: new 6-box,│  │  /property/completed-jobs             │  │
│  │   Top 10 Properties   │  │  reuses ActiveJobsTable,              │  │
│  │   by Revenue Exposure)│  │  property filter                      │  │
│  └───────────────────────┘  └───────────────────────────────────────┘  │
├────────────────────────────────────────────────────────────────────────┤
│                        NEXT.JS APP ROUTER                               │
│                                                                         │
│  MODIFIED ROUTES                NEW ROUTES                              │
│  /executive      (modified)     /regional                   (NEW: rm)  │
│  /property       (modified)     /property/completed-jobs    (NEW: all) │
│                                                                         │
│  NEW SERVER ACTIONS                                                     │
│  turn-request-dates.ts  →  setLeaseReadyDate()                         │
├────────────────────────────────────────────────────────────────────────┤
│                        DATA LAYER                                       │
│                                                                         │
│  MODIFIED                       NEW                                     │
│  pm-kpis.ts   (new compute fn)  rm-kpis.ts          (new file)        │
│  executive-kpis.ts (new fn)     fetchJobsForUser()  (added to jobs.ts) │
│  auth.ts (ROLE_ROUTES update)                                           │
│                                                                         │
│  UNCHANGED                                                              │
│  turn-requests.ts / jobs.ts (existing fns) / mappers.ts               │
│  cache-tags.ts / rate-limiter.ts / client.ts                           │
│  updateJobStatus() / updateTurnRequestStatus()                         │
└────────────────────────────────────────────────────────────────────────┘
```

---

## v1.2 Feature Integration Map

### Feature 1: New KPI Calculations

**Avg Turn Time** uses `vacantDate → readyToLeaseDate` date-delta in JS, not the existing `timeToCompleteUnit` Airtable formula field. Both fields exist in `TurnRequest`; the new KPI uses date arithmetic:

```typescript
// Pure function — goes in rm-kpis.ts, shared by PM and RM
function avgTurnTimeDays(doneTurns: TurnRequest[]): number | null {
  const withBothDates = doneTurns.filter(
    (tr) => tr.vacantDate !== null && tr.readyToLeaseDate !== null
  )
  if (withBothDates.length === 0) return null
  const sum = withBothDates.reduce((acc, tr) => {
    const vacant = new Date(tr.vacantDate!).getTime()
    const ready = new Date(tr.readyToLeaseDate!).getTime()
    return acc + (ready - vacant) / (1000 * 60 * 60 * 24)
  }, 0)
  return sum / withBothDates.length
}
```

**Revenue Exposure** uses `daysVacantUntilReady` (already mapped from Airtable formula field `Days Vacant Until Ready`, type `number | null`):

```typescript
// in rm-kpis.ts — shared by RM Property Insights + Executive Top 10
const REVENUE_PER_DAY = 60
const TARGET_DAYS = 10

export function computeRevenueExposure(turnRequests: TurnRequest[]): number {
  return turnRequests
    .filter((tr) => tr.status !== 'Done')
    .reduce((sum, tr) => {
      const daysOver = Math.max(0, (tr.daysVacantUntilReady ?? 0) - TARGET_DAYS)
      return sum + daysOver * REVENUE_PER_DAY
    }, 0)
}
```

**What changes vs. what is new in the KPI layer:**

| Item | Status | Notes |
|------|--------|-------|
| `pm-kpis.ts` | MODIFIED | New `PMKPIResult` interface + `computePMKPIs()` with 6 new box definitions |
| `executive-kpis.ts` | MODIFIED | New `ExecutiveKPIResult` + `computeExecutiveKPIs()` with 6 new boxes |
| `rm-kpis.ts` | NEW FILE | `computeRMKPIs()` + `computePropertyInsights()` |
| `health-score.ts` | UNCHANGED | May be deprecated in later milestone, not touched in v1.2 |

---

### Feature 2: Active Jobs Table

A flat, sortable table of `Job` records — one row per job, not per turn.

**Data source decision — two paths:**

- **Path A (recommended): `fetchJobsForUser()`** — new function added to `jobs.ts`. Fetches `Job[]` directly, filtered by `propertyName`. One API call. No N+1 join overhead.
- **Path B (avoid): derive via `fetchTurnRequestsForUser()`** — calls `resolveLinkedJobs()` which does N individual record-id lookups. Wastes API budget and join overhead to get a flat list.

Add `fetchJobsForUser(role, assignedProperties)` to `jobs.ts` matching the existing `fetchTurnRequestsForUser` signature:

```typescript
// jobs.ts — additive, does not break existing functions
export async function fetchJobsForUser(
  role: UserRole,
  assignedPropertyNames: string[]
): Promise<Job[]> {
  'use cache'
  cacheLife('airtableData')
  cacheTag(CACHE_TAGS.jobs)

  const all = await fetchJobs()
  if (role === 'exec') return all
  return filterByProperties(all, (j) => j.propertyName, assignedPropertyNames)
}
```

**Component:** New `<ActiveJobsTable>` as a `'use client'` component. Server Component parent fetches `Job[]` and passes as props. Sort state is local `useState` + `useMemo`. Pattern matches existing `VendorTable`.

**Completed Jobs page** reuses `<ActiveJobsTable>` with `job.isCompleted === true` filter applied before passing props.

---

### Feature 3: Open Turns List with Lease-Ready Date Entry

**"Mark Done" action:** Already exists. `updateTurnRequestStatus()` in `turn-request-status.ts` handles writing `Done` to `status`. No new action needed. The v1.2 UI question is whether "Done" is still set via `TurnStatusDropdown` or exclusively via the new `setLeaseReadyDate` path (see PITFALLS.md for the dual-close-signal risk).

**Lease-ready date entry:** New write territory. New Server Action:

```typescript
// src/app/actions/turn-request-dates.ts (NEW FILE)
'use server'
export async function setLeaseReadyDate(
  requestId: number,
  date: string  // ISO date string 'YYYY-MM-DD'
): Promise<{ success: boolean; error?: string }>
```

Action writes `Ready To Lease Date` field in Airtable Turn Requests table. Cache bust: `turnRequest(requestId)`, `turnRequests`, `kpis`.

**UI component:** `<LeaseReadyInput>` — `'use client'` component. Native `<input type="date">`. Uses `useOptimistic` + `useTransition` pattern, identical to existing `JobStatusDropdown`. Goes inline in the Open Turns row via `StopPropagation` wrapper (same pattern as existing job link pills and status dropdown).

---

### Feature 4: RM Aggregated View with Property Insights and Drill-Down

**Property Insights list:** New `computePropertyInsights()` in `rm-kpis.ts` groups `TurnRequest[]` by `propertyName`, computes per-property aggregates. Returns `PropertyInsight[]`.

```typescript
// src/lib/kpis/rm-kpis.ts (NEW FILE)
export interface PropertyInsight {
  propertyName: string
  activeTurns: number
  avgTurnTimeDays: number | null
  revenueExposure: number
  turnsOverTarget: number
}

export function computePropertyInsights(
  turnRequests: TurnRequest[]
): PropertyInsight[]
```

**Avg Turn Time bar graph:** New Recharts `<BarChart>` client component. Data is `PropertyInsight[]` serialized from Server Component. Pattern matches existing `VendorCompletionChart` — `layout="vertical"`, `YAxis type="category"`, `XAxis type="number"`, `ResponsiveContainer`.

**RM drill-down:** RM clicking a property in the Property Insights list navigates to `/property?property=X`. The `/property` page already reads `searchParams.property` and scopes both `PMKPIs` and `PMTurnList` accordingly. No additional routing work is needed for the drill-down itself — the existing `?property=` filter mechanism handles it.

**Dedicated RM route `/regional`:** RM needs its own home route (not `/property`) because the RM dashboard layout differs — aggregated 6-box KPIs, Property Insights list, bar graph vs. PM's per-unit turn list. The new `/regional/page.tsx` is a Server Component following the same Suspense pattern as `/executive/page.tsx`.

---

### Feature 5: Executive Dashboard Redesign + Top 10 Properties

**Top 10 Properties by Revenue Exposure:** Same `computePropertyInsights()` from `rm-kpis.ts`, but:
- Called with all turn requests (no property scoping — exec sees everything)
- Sorted descending by `revenueExposure`
- Sliced to top 10

This means `rm-kpis.ts` serves both RM and Executive views. The Executive page calls `fetchTurnRequests()` (existing, unscoped) and passes the result to `computePropertyInsights()`.

**New `TopPropertiesTable` component:** Server Component (no client-side interactivity needed for a static ranked list). Pattern: same `<Table>` primitives as existing tables.

**Executive KPIs:** `executive-kpis.ts` compute function and `ExecutiveKPIs` component both modified. The 6-card grid structure is retained; values, labels, and formulas change.

---

### Feature 6: Terminology Rename

Display layer only. No data model changes. Airtable field values (`'Done'`, `'In progress'`, `JOB_STATUSES`) must not change — those are Airtable enum values.

Scope of changes:
- String literals in `PMTurnList`, `PMKPIs`, `ExecutiveKPIs` component JSX
- Section titles: "Make Readys Past Target Time" → "Turns Past Target Time"
- KPI card labels: "Active Make Readys" → "Active Turns"
- Page headings in route files
- Sidebar nav labels

---

## Component Responsibilities: New vs. Modified

| Component | New or Modified | Responsibility |
|-----------|-----------------|----------------|
| `rm-kpis.ts` (lib/kpis/) | NEW FILE | `computeRMKPIs()`, `computePropertyInsights()`, `computeRevenueExposure()` — pure aggregations over `TurnRequest[]` |
| `fetchJobsForUser()` (tables/jobs.ts) | NEW (additive) | Role-scoped flat job fetch — added alongside existing functions, does not change any existing function |
| `setLeaseReadyDate()` (actions/) | NEW FILE | Write `Ready To Lease Date` to Airtable Turn Requests, bust 3 cache tags |
| `ActiveJobsTable` component | NEW | `'use client'` — sortable/filterable table for `Job[]`, follows VendorTable pattern |
| `LeaseReadyInput` component | NEW | `'use client'` — inline date entry with `useOptimistic`, follows JobStatusDropdown pattern |
| `PropertyInsightsList` component | NEW | Server Component — renders `PropertyInsight[]` list with drill-down links to `/property?property=X` |
| `AvgTurnTimeBarChart` component | NEW | `'use client'` — Recharts BarChart, data from `computePropertyInsights()`, follows VendorCompletionChart |
| `TopPropertiesTable` component | NEW | Server Component — ranked table of `PropertyInsight[]` for Executive view |
| `/regional/page.tsx` | NEW ROUTE | RM home page — Suspense-wrapped `RMKPIs`, `PropertyInsightsList`, `AvgTurnTimeBarChart` |
| `/property/completed-jobs/page.tsx` | NEW ROUTE | Completed jobs — reuses `ActiveJobsTable` with `isCompleted` filter |
| `pm-kpis.ts` | MODIFIED | New `PMKPIResult` interface, new `computePMKPIs()` — all 6 box definitions change |
| `executive-kpis.ts` | MODIFIED | New `ExecutiveKPIResult`, new `computeExecutiveKPIs()` — all 6 box definitions change |
| `PMKPIs` component | MODIFIED | Renders new 6 KPI boxes with new labels |
| `PMTurnList` component | MODIFIED | Terminology rename, add `LeaseReadyInput` per row, updated section titles |
| `ExecutiveKPIs` component | MODIFIED | Renders new 6 boxes |
| `ExecutiveCharts` component | MODIFIED | Add or replace charts as layout requires; `TopPropertiesTable` may slot in here |
| `ROLE_ROUTES` in auth.ts | MODIFIED | `rm: '/regional'` replaces `rm: '/property'` |
| `ROLE_ALLOWED_ROUTES` in auth.ts | MODIFIED | Add `/regional` to `rm` allowed routes |
| Sidebar nav | MODIFIED | Add "Completed Jobs" link; add "Regional" link for rm role |
| `CACHE_TAGS` | UNCHANGED | Existing tags cover all new read/write operations — do not add new tags |
| `mappers.ts` | UNCHANGED | All needed fields already mapped — no new Airtable columns needed |
| `turn-requests.ts` | UNCHANGED | Existing fetch functions sufficient |

---

## Data Flow: New Paths

### Active Jobs Table Load

```
/property page (Server Component)
    |
fetchJobsForUser(role, assignedProperties)   ← new function in jobs.ts
    |
'use cache' — 60s TTL, tagged: CACHE_TAGS.jobs
    |
Job[] → serialized props to <ActiveJobsTable> (client component)
    |
Client: useState + useMemo sort/filter by status, vendor, date
```

### Lease-Ready Date Write

```
PM clicks date input on Open Turns row (client component LeaseReadyInput)
    |
setLeaseReadyDate(requestId, 'YYYY-MM-DD')   ← new server action
    |
rateLimiter.acquire()
    |
Airtable PATCH: Turn Requests[record].{'Ready To Lease Date'} = date
    |
revalidateTag(CACHE_TAGS.turnRequest(id), { expire: 0 })
revalidateTag(CACHE_TAGS.turnRequests, { expire: 0 })
revalidateTag(CACHE_TAGS.kpis, { expire: 0 })
    |
Page re-renders: updated Avg Turn Time + Revenue Exposure KPI boxes
```

### RM Property Insights Aggregation

```
/regional page (Server Component)
    |
fetchTurnRequestsForUser('rm', assignedProperties)   ← existing, unchanged
    |
TurnRequest[] (with resolved jobs already embedded)
    |
computePropertyInsights(turnRequests)   ← new in rm-kpis.ts
    |
PropertyInsight[]
    |
<PropertyInsightsList insights={data} />   ← new Server Component
<AvgTurnTimeBarChart data={data} />        ← new Client Component
```

### Executive Top 10 Properties

```
/executive page (Server Component)
    |
fetchTurnRequests()   ← existing, unscoped (exec sees all)
    |
computePropertyInsights(allTurnRequests)   ← same function as RM path
    |
PropertyInsight[] sorted by revenueExposure desc, sliced to 10
    |
<TopPropertiesTable data={top10} />   ← new Server Component
```

---

## Recommended Project Structure Changes

Changes relative to current `src/`:

```
src/
├── app/
│   └── (dashboard)/
│       ├── property/
│       │   ├── completed-jobs/                   ← NEW route
│       │   │   ├── page.tsx                      ← NEW
│       │   │   └── loading.tsx                   ← NEW
│       │   └── _components/
│       │       ├── active-jobs-table.tsx          ← NEW (client component)
│       │       ├── lease-ready-input.tsx          ← NEW (client component)
│       │       ├── pm-dashboard.tsx               UNCHANGED
│       │       ├── pm-kpis.tsx                    MODIFIED
│       │       └── pm-turn-list.tsx               MODIFIED
│       ├── regional/                              ← NEW route group (rm home)
│       │   ├── page.tsx                           ← NEW
│       │   ├── loading.tsx                        ← NEW
│       │   └── _components/
│       │       ├── rm-kpis.tsx                    ← NEW
│       │       ├── property-insights-list.tsx     ← NEW
│       │       └── avg-turn-time-chart.tsx        ← NEW (client component)
│       └── executive/
│           └── _components/
│               ├── executive-kpis.tsx             MODIFIED
│               ├── executive-charts.tsx           MODIFIED
│               └── top-properties-table.tsx       ← NEW
├── app/
│   └── actions/
│       └── turn-request-dates.ts                 ← NEW: setLeaseReadyDate()
└── lib/
    ├── airtable/
    │   └── tables/
    │       └── jobs.ts                            MODIFIED (add fetchJobsForUser)
    ├── kpis/
    │   ├── pm-kpis.ts                             MODIFIED
    │   ├── executive-kpis.ts                      MODIFIED
    │   └── rm-kpis.ts                             ← NEW
    └── types/
        └── auth.ts                                MODIFIED (ROLE_ROUTES, ROLE_ALLOWED_ROUTES)
```

---

## Architectural Patterns

### Pattern 1: Additive KPI Module Updates

**What:** Replace the compute function signature and `Result` interface in existing KPI files. File name, location, and import path stay the same. Component callers update to destructure new fields. Existing test files will fail on type errors — this is intentional and is how the test suite guides the refactor.

**When to use:** Any time the KPI box count or metric definitions change with the same data source.

**Trade-offs:** Test files break on the interface change. This is the correct behavior — tests are the contract that confirms new calculations before any UI depends on them.

**Example:**
```typescript
// pm-kpis.ts — before (v1.1)
export interface PMKPIResult {
  activeMakeReadys: number
  completedLast30d: number
  completedLast7d: number
  avgMakeReadyTime: number | null
  projectedSpendMTD: number
  pastTargetCount: number
}

// pm-kpis.ts — after (v1.2, illustrative — exact fields TBD in phase)
export interface PMKPIResult {
  activeTurns: number             // renamed + may use different filter
  avgTurnTimeDays: number | null  // new: vacantDate → readyToLeaseDate delta
  revenueExposure: number         // new: $60 × days over target
  // ... remaining 3 fields TBD with client
}
```

### Pattern 2: Server Component + Client Island for Interactive Tables

**What:** Server Component fetches typed data, passes as props to a `'use client'` component that manages sort/filter state locally with `useState` + `useMemo`. Server Component is the data boundary; client component is the interaction boundary.

**When to use:** Active Jobs Table, Completed Jobs Table, Property Insights List — any table needing client-side sort/filter whose data is server-fetched.

**Trade-offs:** Sort state resets on navigation. Acceptable for internal PM tooling — users are not doing multi-session filtered analysis. If shareable filtered URLs become a requirement, encode sort in `searchParams` (same mechanism as the existing `?property=` filter).

**Example:**
```typescript
// active-jobs-table.tsx — client component
'use client'
import { useState, useMemo } from 'react'
import type { Job } from '@/lib/types/airtable'

export function ActiveJobsTable({ jobs }: { jobs: Job[] }) {
  const [sortField, setSortField] = useState<keyof Job>('startDate')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')
  const sorted = useMemo(
    () => [...jobs].sort(/* ... */),
    [jobs, sortField, sortDir]
  )
  // ...render
}

// /property/page.tsx (Server Component) — unchanged pattern
const jobs = await fetchJobsForUser(role, assignedProperties)
return <ActiveJobsTable jobs={jobs} />
```

### Pattern 3: Shared Aggregation Function for Multi-Role KPIs

**What:** `computePropertyInsights()` in `rm-kpis.ts` is called by both the RM dashboard and the Executive Top 10 table. The function is pure — takes `TurnRequest[]`, returns `PropertyInsight[]`. Callers apply their own scoping and sorting before passing data in or after receiving results.

**When to use:** Any KPI metric that appears at both RM-property level and Executive portfolio level.

**Trade-offs:** Creates a coupling between `rm-kpis.ts` and the Executive page's data path. This is preferable to duplicating the aggregation logic. The function has no side effects, so the coupling is safe.

### Pattern 4: `useOptimistic` + `useTransition` for Inline Edit Actions

**What:** Client component shows optimistic state immediately on user action, fires Server Action in a transition, reverts + shows toast error on failure. This is the existing pattern in `JobStatusDropdown` (confirmed in source).

**When to use:** `LeaseReadyInput` for inline date entry. Any future inline field edit.

**Trade-offs:** Optimistic state can briefly show a value that Airtable then rejects. For date fields, this is rare (Airtable accepts any valid ISO date string). The revert path is already implemented in `JobStatusDropdown` — copy it.

---

## Integration Points: New vs. Existing

### Data Layer Integration

| New Feature | Data Source | Fetch Function | New or Existing |
|-------------|-------------|----------------|-----------------|
| New PM KPIs (6 boxes) | `TurnRequest[]` | `fetchTurnRequestsForUser()` | EXISTING |
| Active Jobs Table | `Job[]` | `fetchJobsForUser()` | NEW (additive to jobs.ts) |
| Completed Jobs Page | `Job[]` | `fetchJobsForUser()` with `isCompleted` filter | NEW (same function) |
| Lease-ready date entry (read) | `TurnRequest[]` | `fetchTurnRequestsForUser()` | EXISTING |
| RM Property Insights | `TurnRequest[]` | `fetchTurnRequestsForUser()` | EXISTING |
| RM Avg Turn Time chart | derived from `TurnRequest[]` | same as above | EXISTING |
| Exec Top 10 Revenue Exposure | `TurnRequest[]` | `fetchTurnRequests()` (unscoped) | EXISTING |
| New Exec KPIs (6 boxes) | `TurnRequest[]` + `Job[]` | both existing | EXISTING |

### Write Actions Integration

| New Write | Action File | Airtable Table | Field Written | Cache Tags Busted |
|-----------|-------------|----------------|---------------|-------------------|
| Set lease-ready date | `turn-request-dates.ts` (NEW) | Turn Requests | `Ready To Lease Date` | `turnRequest(id)`, `turnRequests`, `kpis` |
| Mark turn Done | `turn-request-status.ts` (EXISTING) | Turn Requests | `Status` | unchanged |
| Update job status | `job-status.ts` (EXISTING) | Jobs | `Status` | unchanged |

### Route Access Control Integration

Changes required in `src/lib/types/auth.ts`:

```typescript
// v1.2 target state
export const ROLE_ROUTES: Record<UserRole, string> = {
  pm:   '/property',
  rm:   '/regional',   // CHANGED from '/property'
  exec: '/executive',
}

export const ROLE_ALLOWED_ROUTES: Partial<Record<UserRole, string[]>> = {
  exec: ['/executive', '/property', '/vendors', '/vacant'],
  rm:   ['/regional', '/property', '/vendors', '/vacant'],  // CHANGED: /regional added, replaces home
  pm:   ['/property', '/vendors', '/vacant'],
}
```

The middleware in `lib/supabase/middleware.ts` reads `ROLE_ROUTES` and `ROLE_ALLOWED_ROUTES` directly — no middleware changes needed, only the constants in `auth.ts`.

---

## Build Order for v1.2

Each phase is independently shippable. Later phases depend on earlier ones.

```
Phase 1: Shared KPI Foundations (pure logic — zero UI risk)
    ├── Update pm-kpis.ts: new PMKPIResult interface + computePMKPIs()
    ├── Update executive-kpis.ts: new ExecutiveKPIResult + computeExecutiveKPIs()
    ├── New rm-kpis.ts: computeRMKPIs() + computePropertyInsights() + computeRevenueExposure()
    └── Update all KPI test files (existing tests break by design — they are the contract)
    Rationale: Pure functions, no UI. Test suite confirms new KPI math before any
    component depends on it. Existing tests become regression guard for new formulas.

    |
    v
Phase 2: Terminology Rename (display-only — minimal regression risk)
    ├── Replace "Make Ready" → "Turn" in all JSX string literals
    ├── Replace "Vacant" → "Off Market" where not already done (v1.1 did some)
    ├── Update section titles in PMTurnList, PMKPIs, ExecutiveKPIs
    └── Update page headings in route files
    Rationale: No logic changes. Pure string replacements. Done before new
    components are written so new code is born with correct terminology.

    |
    v
Phase 3: PM Dashboard Redesign (highest urgency — primary users)
    ├── Update PMKPIs component to render new 6 boxes
    ├── Add fetchJobsForUser() to jobs.ts (+ tests)
    ├── New ActiveJobsTable component (client island, follows VendorTable)
    ├── New setLeaseReadyDate() server action (+ tests)
    ├── New LeaseReadyInput component (follows JobStatusDropdown)
    └── Update PMTurnList: add LeaseReadyInput per row, update headers
    Rationale: PMs are the primary daily users. Unblocked by Phases 1-2.
    ActiveJobsTable has its own data path (fetchJobsForUser) independent of
    the lease-ready date work — both can be developed in parallel within this phase.

    |
    v
Phase 4: Completed Jobs Page (new route — trivial after Phase 3)
    ├── New /property/completed-jobs/page.tsx
    ├── New loading.tsx
    └── Sidebar link update (+ middleware ROLE_ALLOWED_ROUTES for completed-jobs if needed)
    Rationale: Reuses ActiveJobsTable with isCompleted=true filter. Small lift
    once ActiveJobsTable exists. Route access: all roles can access /property subtree
    per existing ROLE_ALLOWED_ROUTES.

    |
    v
Phase 5: RM Dashboard (new route)
    ├── Update ROLE_ROUTES and ROLE_ALLOWED_ROUTES in auth.ts
    ├── New /regional/page.tsx + loading.tsx
    ├── New RMKPIs component (6 aggregated boxes)
    ├── New PropertyInsightsList component
    └── New AvgTurnTimeBarChart component (Recharts, follows VendorCompletionChart)
    Rationale: Depends on rm-kpis.ts (Phase 1). Route change (rm home from /property
    to /regional) is the highest-risk change in the milestone — do it after PM work
    is stable so RM users still have /property as fallback during development.

    |
    v
Phase 6: Executive Dashboard Redesign (lowest urgency — fewest users)
    ├── Update ExecutiveKPIs component (new 6 boxes using updated executive-kpis.ts)
    ├── New TopPropertiesTable component (reuses PropertyInsight type from Phase 1)
    └── Update ExecutiveCharts as needed for new layout
    Rationale: Executive sees portfolio data. TopPropertiesTable shares
    computePropertyInsights() from Phase 1. Left last because nothing downstream
    depends on it and exec users have the lowest urgency for daily workflow.
```

**Phase ordering rationale:**
- KPI logic first: tests confirm math correctness before UI depends on it
- Terminology before new components: new code is born with the right labels
- PM before RM: PM features are higher daily urgency; RM drill-down benefits from seeing PM work stable first
- Completed Jobs after Active Jobs: shares the same component
- Route changes (RM home) after PM is stable: minimizes disruption during development
- Executive last: lowest usage frequency, no downstream dependencies

---

## Anti-Patterns to Avoid in v1.2

### Anti-Pattern 1: Fetching Jobs Through Turn Request Resolution for the Active Jobs Table

**What people do:** Use `fetchTurnRequestsForUser()` (which internally calls `resolveLinkedJobs()`) just to get jobs for the Active Jobs table.

**Why it's wrong:** `resolveLinkedJobs()` calls `Promise.all()` with individual `base('Jobs').find(recordId)` calls per job record ID. This is appropriate when jobs need turn context. For a flat job list, it is N+1-style waste — pay for turn data and per-record lookups to get data available from one `fetchJobs()` call.

**Do this instead:** Add `fetchJobsForUser()` to `jobs.ts`. Fetch jobs directly from the Jobs table, filter by `propertyName`. Cheaper and simpler.

### Anti-Pattern 2: Computing Per-Property Stats in the Component

**What people do:** Put the `groupBy(propertyName)` and aggregation loop directly inside a React component.

**Why it's wrong:** Couples display logic with computation, makes the component untestable in isolation, puts business logic in the wrong layer.

**Do this instead:** `computePropertyInsights()` belongs in `rm-kpis.ts`. Components receive `PropertyInsight[]` and render. This mirrors the established pattern — `PMKPIs` calls `computePMKPIs()` and renders results; it does not contain the computation.

### Anti-Pattern 3: Pre-Formatting Numbers in Compute Functions

**What people do:** Return `revenueExposure: "$1,200"` (a string) from `computePMKPIs()` or `computePropertyInsights()`.

**Why it's wrong:** Strings cannot be sorted numerically. Tests cannot make arithmetic assertions on formatted strings. Formatting belongs at the display layer.

**Do this instead:** Return raw numbers (`revenueExposure: 1200`). Format in the component with `Intl.NumberFormat` — exactly as `PMKPIs` currently does for `projectedSpendMTD`.

### Anti-Pattern 4: Adding New Cache Tags for Derived Aggregations

**What people do:** Add tags like `property-insights` or `rm-kpis` for the new aggregated views.

**Why it's wrong:** Creates maintenance overhead — every write that touches source data must also bust the new derived tags. The existing `kpis` tag already covers all derived computations. `updateJobStatus()` already busts `kpis`. Any new write action will also bust `kpis`. No additional tags needed.

**Do this instead:** Tag all KPI-related caches (including RM per-property stats) with the existing `CACHE_TAGS.kpis` tag.

### Anti-Pattern 5: Treating the `/district` Redirect as the RM Home Route

**What people do:** Add RM-specific content to `/district/page.tsx` because it exists and has the word "district" in the path.

**Why it's wrong:** `/district/page.tsx` contains only `redirect('/property')`. It is a legacy shim from the DM → RM rename. Building RM dashboard content there would mean it lives under a confusing route that immediately redirects.

**Do this instead:** Build the RM dashboard at `/regional/page.tsx`. Update `ROLE_ROUTES.rm` to `/regional`. Leave `/district` as-is for any existing bookmarks.

---

## Scaling Considerations

At 6-15 users, v1.2 adds no infrastructure risk.

| Concern | v1.2 Impact | Mitigation |
|---------|-------------|------------|
| Additional Airtable reads | `fetchJobsForUser()` is one new fetch path. At 60s cache, adds ~1 Airtable API call/minute maximum | Covered by existing rate limiter + `'use cache'` |
| New write action (setLeaseReadyDate) | Same PATCH + revalidate pattern as existing actions. One PATCH per date entry. | No rate limit risk at 6-15 users |
| RM per-property aggregation | Pure JS over already-fetched `TurnRequest[]`. Runs server-side, no DB query. | Negligible at current data volumes |
| New `/regional` route | Same Server Component fetch pattern as `/property`. No new Airtable connections. | No change to infrastructure |

---

## Sources

All findings from direct source file analysis (HIGH confidence — no assumptions from training data):

- `src/lib/types/auth.ts` — ROLE_ROUTES, ROLE_ALLOWED_ROUTES, UserRole type
- `src/lib/supabase/middleware.ts` — route enforcement implementation
- `src/lib/airtable/cache-tags.ts` — cache tag topology
- `src/lib/airtable/tables/turn-requests.ts` — fetchTurnRequestsForUser, resolveLinkedJobs
- `src/lib/airtable/tables/jobs.ts` — fetchJobs, fetchJobsByIds, fetchJobById
- `src/lib/airtable/tables/mappers.ts` — available mapped fields confirmed
- `src/lib/kpis/pm-kpis.ts` — PMKPIResult interface, computePMKPIs — current implementation
- `src/app/(dashboard)/property/page.tsx` — Suspense + Server Component + searchParams pattern
- `src/app/(dashboard)/property/_components/pm-kpis.tsx` — KPICard rendering, Intl.NumberFormat usage
- `src/app/(dashboard)/property/_components/pm-turn-list.tsx` — TurnSection, StopPropagation, TurnStatusDropdown
- `src/app/(dashboard)/executive/page.tsx` — exec page Suspense structure
- `src/app/(dashboard)/district/page.tsx` — confirmed: redirect only, no content
- `src/app/actions/job-status.ts` — write action pattern, revalidateTag syntax
- `.planning/PROJECT.md` — v1.2 milestone requirements

---

*Architecture research for: UnitFlowSolutions v1.2 Dashboard Redesign integration*
*Researched: 2026-03-18*
