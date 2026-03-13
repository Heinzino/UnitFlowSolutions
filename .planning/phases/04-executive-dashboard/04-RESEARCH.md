# Phase 4: Executive Dashboard - Research

**Researched:** 2026-03-12
**Domain:** Next.js 16 Server Components, KPI computation, data aggregation, Suspense boundaries
**Confidence:** HIGH

## Summary

Phase 4 replaces the placeholder executive page with a read-only KPI dashboard. All data is already fetchable via `fetchJobs()` and `fetchTurnRequests()` from Phase 3 — no new Airtable table fetch functions are required. The work is almost entirely UI assembly and in-process data aggregation: filter and reduce the fetched arrays in pure TypeScript compute functions, then render results into the existing `KPICard`, `TrendIndicator`, and `CurrencyDisplay` components.

The critical technical issue is the Next.js 16 "blocking route" error referenced in CONTEXT.md. Next.js 16 with React 19 requires that async Server Components inside a route be wrapped with `<Suspense>` boundaries or they will block the entire route render. The existing executive page is a single async server component with no Suspense. The fix is to extract data-fetching into a child async component and wrap it with `<Suspense fallback={<KPISkeleton />}>` in the page shell.

One data gap was identified: the `delta` field from the Jobs Airtable table is NOT currently mapped in `mapJob()` or included in the `Job` TypeScript interface. The Backlog Delta KPI requires this field. Phase 4 must add `delta: number | null` to the `Job` interface and its mapper before the KPI can be computed. Additionally, the "Invoice Sent" job status referenced in CONTEXT.md filter rules does not exist in the actual Airtable data snapshot — the only job statuses present are: Blocked, Completed, In Progress, NEEDS ATTENTION, Ready. The filters should use only these real values.

**Primary recommendation:** Implement Phase 4 as three focused tasks: (1) add `delta` field to Job type + mapper, (2) build pure KPI compute functions in a dedicated module, (3) assemble the executive page with proper Suspense boundaries and KPI/alert card rendering.

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Page Layout:**
- Simple header: "Executive Dashboard" title + "Welcome, [Name]" + current date
- 6 KPI cards in a 3-column, 2-row grid
- Below KPIs: Make Ready Overview section (single KPI card + alert cards)
- Alert cards (pink/yellow) appear below the Make Ready KPI card, side by side
- On mobile (<768px): all cards stack to single column, full width

**KPI Card Grid (Row 1-2):**
- Row 1: Active Jobs Open | Jobs Trending Past Target | Jobs Completed (30d)
- Row 2: Backlog Delta | Avg Time to Complete | Projected Cost Exposure (MTD)

**KPI Calculation Rules:**

Active Jobs Open — Source: Jobs table, Filter: status NOT IN (Completed, Invoice Sent), Aggregation: record count

Jobs Trending Past Target (subtitle: "2 days from completion date") — Source: Jobs table, Filter: status NOT IN (Completed, Invoice Sent) AND end date within next 2 days, Aggregation: record count

Jobs Completed (30d) — Source: Jobs table, Filter: status IN (Completed, Invoice Sent) AND end date within past 30 days, Aggregation: record count

Backlog Delta — Source: Jobs table, Filter: status IN (Completed, Invoice Sent) AND end date within past 30 days, Aggregation: SUM of delta field. Result = jobs opened last 30d minus completed last 30d.

Average Time to Complete a Job — Source: Turn Requests table, Filter: status = Done, Field: "Time to Complete" (units: days), Aggregation: average (sum / count)

Projected Cost Exposure MTD (subtitle: "includes completed and authorized jobs in progress") — Source: Turn Requests table, Filter: ALL records (no filter), Aggregation: SUM of price field

**Make Ready Overview:**

Active Make Readys Open — Source: Turn Requests table, Filter: status IN (Needs Attention, To Do, In Progress), Aggregation: record count, Display: single KPI card

**Alert Cards:**

Make Readys Past Target Time (pink, "NEEDS ATTENTION") — Source: Turn Requests table, Filter: days_vacant_until_ready > 10, Aggregation: record count, Display: count + list of affected items (Property + Unit), max 5 shown, then "+ N more"

Make Readys Trending Past Target Date (yellow, subtitle: "2 days from target time") — Source: Turn Requests table, Filter: days_vacant_until_ready > 8, Aggregation: record count, Display: count + list of affected items (Property + Unit), max 5 shown, then "+ N more"

**Alert Card Behavior:**
- Not clickable — executive dashboard is read-only
- Hidden when count is 0
- Item list shows Property Name + Unit Number (e.g., "Oak Ridge #204")
- Truncated at 5 items with "+ N more" for larger lists

### Claude's Discretion
- Exact Suspense boundary strategy for async data fetching (fix existing Next.js 16 blocking route error)
- Loading skeleton arrangement matching card grid
- Section heading styles and spacing
- Icon choices for each KPI card
- Trend indicator logic (30-day comparison window)

### Deferred Ideas (OUT OF SCOPE)
- Property Manager view KPIs — captured for Phase 5 planning
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| EXEC-01 | KPI cards row 1: Active Jobs Open, Jobs Trending Past Target (2 days from completion) | `fetchJobs()` returns all jobs; filter by status + endDate in compute function |
| EXEC-02 | KPI cards row 2: Jobs Completed (30 days), Backlog Delta (opened minus completed) | `fetchJobs()` + date comparison; Backlog Delta requires `delta` field addition to Job type |
| EXEC-03 | KPI cards row 3: Average Time To Complete a Job, Projected Cost Exposure (MTD) | `fetchTurnRequests()` for both; `timeToCompleteUnit` field exists; `quotePrice` field exists |
| EXEC-04 | Make Ready Overview section: Active Make Readys Open | `fetchTurnRequests()` filtered by status; Turn Request statuses in real data: "Done", "In progress" — status filter values need verification |
| EXEC-05 | Alert cards: pink (NEEDS ATTENTION past target), yellow (trending 2-day warning) | `daysVacantUntilReady` field exists in TurnRequest type; KPICard has `alert-past` and `alert-trending` variants |
| EXEC-06 | All KPI data computed across all properties (no filter) | `fetchTurnRequests()` without property filter (exec role path already exists); `fetchJobs()` fetches all |
| EXEC-07 | Loading skeleton states | KPICard has built-in `loading` prop; Suspense boundary shows skeleton grid fallback |
</phase_requirements>

---

## Standard Stack

### Core (already installed — no new dependencies)

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Next.js | 16.1.6 | App Router server components, `use cache` directive | Already in project |
| React | 19.2.3 | Suspense, server component async rendering | Already in project |
| lucide-react | ^0.577.0 | Icons for KPI cards | Already in project |
| TypeScript | ^5 | Type safety for KPI compute functions | Already in project |

### Existing Project Components (reuse directly)

| Component | Path | Purpose |
|-----------|------|---------|
| `KPICard` | `src/components/ui/kpi-card.tsx` | All 6 KPI cards + Make Ready KPI + both alert cards |
| `TrendIndicator` | `src/components/ui/trend-indicator.tsx` | Optional trend display on KPI cards |
| `CurrencyDisplay` | `src/components/ui/currency-display.tsx` | Projected Cost Exposure formatting |
| `Skeleton` | `src/components/ui/skeleton.tsx` | Custom skeleton fallback grid |
| `Card` | `src/components/ui/card.tsx` | Make Ready Overview section wrapper |
| `fetchJobs` | `src/lib/airtable/tables/jobs.ts` | All Jobs data with caching |
| `fetchTurnRequests` | `src/lib/airtable/tables/turn-requests.ts` | All Turn Requests with caching |

**No new npm packages required for Phase 4.**

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| In-process JS aggregation | Airtable formula filtering | In-process is simpler and avoids extra API calls; full dataset already cached |
| Custom alert card component | KPICard with alert variant | KPICard alert variants already exist; custom component not justified |

---

## Architecture Patterns

### Recommended Project Structure

```
src/
├── app/(dashboard)/executive/
│   ├── page.tsx                    # Shell: auth check, Suspense boundary, date header
│   └── _components/
│       ├── executive-kpis.tsx      # Async server component: fetches + computes + renders KPIs
│       └── executive-kpi-skeleton.tsx  # Static skeleton matching the grid layout
├── lib/
│   └── kpis/
│       └── executive-kpis.ts       # Pure compute functions (no I/O, easily testable)
```

### Pattern 1: Suspense Boundary for Blocking Route Fix

**What:** The existing executive page is a single async server component — no Suspense. Next.js 16 with React 19 requires Suspense wrapping for async rendering to avoid blocking the route. The fix is to separate auth/shell from data fetching.

**When to use:** Any server component page that performs async data fetching.

**Implementation:**

```typescript
// src/app/(dashboard)/executive/page.tsx
// Shell: synchronous, just does auth check and provides Suspense boundary
import { Suspense } from 'react'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { ExecutiveKPIs } from './_components/executive-kpis'
import { ExecutiveKPISkeleton } from './_components/executive-kpi-skeleton'

export default async function ExecutivePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const displayName: string = user.user_metadata?.full_name ?? user.email ?? 'Unknown'
  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  })

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div>
        <h1 className="font-heading font-bold text-2xl text-text-primary">Executive Dashboard</h1>
        <p className="text-text-secondary text-sm">Welcome, {displayName} &mdash; {today}</p>
      </div>

      {/* Data section with Suspense */}
      <Suspense fallback={<ExecutiveKPISkeleton />}>
        <ExecutiveKPIs />
      </Suspense>
    </div>
  )
}
```

```typescript
// src/app/(dashboard)/executive/_components/executive-kpis.tsx
// Async server component: fetches data, computes KPIs, renders cards
import { fetchJobs } from '@/lib/airtable/tables/jobs'
import { fetchTurnRequests } from '@/lib/airtable/tables/turn-requests'
import { computeExecutiveKPIs } from '@/lib/kpis/executive-kpis'
import { KPICard } from '@/components/ui/kpi-card'
import { Briefcase, TrendingUp, CheckCircle, BarChart2, Clock, DollarSign, Home, AlertTriangle, AlertCircle } from 'lucide-react'

export async function ExecutiveKPIs() {
  const [jobs, turnRequests] = await Promise.all([
    fetchJobs(),
    fetchTurnRequests(),
  ])

  const kpis = computeExecutiveKPIs(jobs, turnRequests)

  // ... render KPI grid + alert cards
}
```

### Pattern 2: Pure KPI Compute Functions

**What:** All aggregation logic lives in a pure module with no I/O. Takes typed arrays, returns typed result object. Easily unit-tested with Vitest.

**When to use:** Any KPI calculation that needs to be testable in isolation.

```typescript
// src/lib/kpis/executive-kpis.ts
import type { Job, TurnRequest } from '@/lib/types/airtable'

export interface ExecutiveKPIResult {
  activeJobsOpen: number
  jobsTrendingPastTarget: number
  jobsCompleted30d: number
  backlogDelta: number
  avgTimeToComplete: number | null  // null when no completed turn requests
  projectedCostExposure: number
  activeMakeReadysOpen: number
  pastTargetAlerts: { propertyName: string; unitNumber: string }[]
  trendingAlerts: { propertyName: string; unitNumber: string }[]
}

export function computeExecutiveKPIs(
  jobs: Job[],
  turnRequests: TurnRequest[]
): ExecutiveKPIResult {
  const now = new Date()
  const twoDaysFromNow = new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000)
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

  // EXEC-01: Active Jobs Open
  const COMPLETED_STATUSES = ['Completed'] as const  // Note: "Invoice Sent" not in real data
  const activeJobs = jobs.filter(j => !COMPLETED_STATUSES.includes(j.status as typeof COMPLETED_STATUSES[number]))
  const activeJobsOpen = activeJobs.length

  // EXEC-01: Jobs Trending Past Target
  const jobsTrendingPastTarget = activeJobs.filter(j => {
    if (!j.endDate) return false
    const end = new Date(j.endDate)
    return end >= now && end <= twoDaysFromNow
  }).length

  // EXEC-02: Jobs Completed (30d)
  const jobsCompleted30d = jobs.filter(j => {
    if (!COMPLETED_STATUSES.includes(j.status as typeof COMPLETED_STATUSES[number])) return false
    if (!j.endDate) return false
    return new Date(j.endDate) >= thirtyDaysAgo
  }).length

  // EXEC-02: Backlog Delta — SUM of delta field for completed jobs in last 30d
  const backlogDelta = jobs
    .filter(j => {
      if (!COMPLETED_STATUSES.includes(j.status as typeof COMPLETED_STATUSES[number])) return false
      if (!j.endDate) return false
      return new Date(j.endDate) >= thirtyDaysAgo
    })
    .reduce((sum, j) => sum + (j.delta ?? 0), 0)

  // EXEC-03: Average Time to Complete
  const doneTurnRequests = turnRequests.filter(tr => tr.status === 'Done')
  const avgTimeToComplete = doneTurnRequests.length === 0
    ? null
    : doneTurnRequests.reduce((sum, tr) => sum + (tr.timeToCompleteUnit ?? 0), 0) / doneTurnRequests.length

  // EXEC-03: Projected Cost Exposure MTD
  const projectedCostExposure = turnRequests.reduce((sum, tr) => {
    const price = parseFloat(tr.quotePrice ?? '0') || 0
    return sum + price
  }, 0)

  // EXEC-04: Active Make Readys Open
  // Real data statuses: "Done", "In progress" — "Needs Attention", "To Do" not seen in snapshot
  const ACTIVE_TR_STATUSES = ['In progress', 'Needs Attention', 'To Do']
  const activeMakeReadysOpen = turnRequests.filter(tr =>
    ACTIVE_TR_STATUSES.includes(tr.status)
  ).length

  // EXEC-05: Alert cards
  const pastTargetItems = turnRequests
    .filter(tr => (tr.daysVacantUntilReady ?? 0) > 10)
    .map(tr => ({ propertyName: tr.propertyName, unitNumber: tr.unitNumber }))

  const trendingItems = turnRequests
    .filter(tr => (tr.daysVacantUntilReady ?? 0) > 8)
    .map(tr => ({ propertyName: tr.propertyName, unitNumber: tr.unitNumber }))

  return {
    activeJobsOpen,
    jobsTrendingPastTarget,
    jobsCompleted30d,
    backlogDelta,
    avgTimeToComplete,
    projectedCostExposure,
    activeMakeReadysOpen,
    pastTargetAlerts: pastTargetItems,
    trendingAlerts: trendingItems,
  }
}
```

### Pattern 3: Alert Card with Item List

**What:** Alert cards use `KPICard` with `alert-past` or `alert-trending` variant. The item list (Property + Unit, max 5 + overflow count) is rendered as children below the card or as a separate list component below the `KPICard`.

**When to use:** EXEC-05 alert cards.

```typescript
// Alert card item list pattern
function AlertItemList({
  items,
}: {
  items: { propertyName: string; unitNumber: string }[]
}) {
  const displayed = items.slice(0, 5)
  const overflow = items.length - 5

  return (
    <ul className="mt-2 text-sm text-text-secondary space-y-1">
      {displayed.map((item, i) => (
        <li key={i}>{item.propertyName} #{item.unitNumber}</li>
      ))}
      {overflow > 0 && (
        <li className="font-medium">+{overflow} more</li>
      )}
    </ul>
  )
}
```

Note: KPICard accepts `className` but not `children`. The alert item list will need to be rendered outside the KPICard, inside a wrapper div, or the KPICard will need to accept optional children. Check the existing KPICard props — if children aren't supported, wrap in a `<div>` that contains both the KPICard and the list.

### Pattern 4: Loading Skeleton Grid

**What:** The Suspense fallback renders a static skeleton grid matching the 3-col, 2-row KPI layout + Make Ready section.

```typescript
// src/app/(dashboard)/executive/_components/executive-kpi-skeleton.tsx
import { KPICard } from '@/components/ui/kpi-card'
import { Activity } from 'lucide-react'

export function ExecutiveKPISkeleton() {
  return (
    <div className="flex flex-col gap-6">
      {/* 6 KPI cards skeleton — 3 cols */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <KPICard key={i} icon={Activity} label="" value="" loading />
        ))}
      </div>
      {/* Make Ready section skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <KPICard icon={Activity} label="" value="" loading />
      </div>
    </div>
  )
}
```

### Anti-Patterns to Avoid

- **Single async component with no Suspense:** Causes the Next.js 16 blocking route error. Always wrap data-fetching child components in `<Suspense>`.
- **KPI math inline in JSX:** Hard to test and reason about. All computation belongs in `src/lib/kpis/executive-kpis.ts`.
- **Calling `fetchJobs()` and `fetchTurnRequests()` separately in multiple places:** Call once in `ExecutiveKPIs`, pass results to compute function. Both are cached so repeated calls are safe, but it's cleaner to call once.
- **Parsing `quotePrice` (string | null) without guarding:** The field is a string like `"$600.00"` or `"50"`. Use `parseFloat(str.replace(/[^0-9.]/g, '')) || 0` pattern.
- **Assuming "Invoice Sent" exists as a job status:** Real data has only: Blocked, Completed, In Progress, NEEDS ATTENTION, Ready. Filter using only these.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Currency formatting | Custom formatter | `CurrencyDisplay` component | Already exists with correct Intl.NumberFormat setup |
| Loading skeleton | Custom shimmer CSS | `KPICard loading={true}` prop | Built-in, consistent with rest of app |
| Data fetching with cache | Custom fetch wrapper | `fetchJobs()` + `fetchTurnRequests()` | Already cached with `use cache` + 60s TTL |
| Date arithmetic | moment/date-fns | Native `Date` arithmetic | Simple additions, no library needed |
| Trend arrows | Custom SVG | `TrendIndicator` component | Already exists |

**Key insight:** Phase 4 is a composition phase. The data layer (Phase 3) and component library (Phase 1) are complete. The main work is pure TypeScript aggregation logic and page assembly.

---

## Common Pitfalls

### Pitfall 1: The "Invoice Sent" Status Gap

**What goes wrong:** CONTEXT.md filter rules say `status NOT IN (Completed, Invoice Sent)` but "Invoice Sent" does not exist in the real Airtable data snapshot. The real job statuses are: Blocked, Completed, In Progress, NEEDS ATTENTION, Ready.

**Why it happens:** The CONTEXT.md was written from user intent, not from actual data inspection.

**How to avoid:** Use `status !== 'Completed'` for "active" jobs filter. If "Invoice Sent" appears in production data later, adding it is a one-line change in the compute function.

**Warning signs:** `jobsCompleted30d` returns 0 when there are clearly completed jobs.

### Pitfall 2: quotePrice String Parsing

**What goes wrong:** `TurnRequest.quotePrice` is typed as `string | null` (e.g., `"$600.00"`, `"50"`, `null`). Direct use in arithmetic produces NaN. The Projected Cost Exposure KPI sums this field.

**Why it happens:** Airtable rollup fields return formatted strings, not numbers.

**How to avoid:** Parse with `parseFloat(str.replace(/[^0-9.]/g, '')) || 0` before summing.

**Warning signs:** `projectedCostExposure` is NaN or 0 when it should have a value.

### Pitfall 3: Missing `delta` Field in Job Type

**What goes wrong:** The Backlog Delta KPI requires `j.delta` on each Job record. The field exists in Airtable ("Delta" column) but is NOT in the current `Job` interface or `mapJob()` mapper.

**Why it happens:** The field wasn't needed for Phase 3 functionality.

**How to avoid:** Phase 4 Wave 0 must add `delta: number | null` to the `Job` interface in `src/lib/types/airtable.ts` and map `f['Delta']` in `mapJob()` before computing Backlog Delta.

**Warning signs:** TypeScript error `Property 'delta' does not exist on type 'Job'`.

### Pitfall 4: Suspense Not Wrapping the Async Data Component

**What goes wrong:** Next.js 16 throws a "blocking route" error if an async server component isn't inside a Suspense boundary.

**Why it happens:** The existing page.tsx is a single async component with no Suspense.

**How to avoid:** The page shell must be kept synchronous (or minimally async — just for auth). The data-fetching component (`ExecutiveKPIs`) must be a separate async component wrapped in `<Suspense>`.

**Warning signs:** Console error mentioning "blocking route" or "missing Suspense boundary" at build or runtime.

### Pitfall 5: Alert Card Children Not Supported by KPICard

**What goes wrong:** The item list (Property + Unit + overflow) needs to appear inside or below the alert KPICard. The current `KPICard` component does not accept `children`.

**Why it happens:** KPICard was designed for simple value display.

**How to avoid:** Wrap the `KPICard` + item list in a `<div>`. Do NOT modify KPICard to accept children (risk of breaking other usages). A wrapper `div` keeps the card's styling and adds the list below.

```tsx
<div>
  <KPICard icon={AlertTriangle} label="Make Readys Past Target Time" value={kpis.pastTargetAlerts.length} variant="alert-past" />
  <AlertItemList items={kpis.pastTargetAlerts} />
</div>
```

### Pitfall 6: Alert Cards Rendered When Count Is 0

**What goes wrong:** The design calls for alert cards to be hidden when count is 0. Rendering an empty alert card with value=0 and an empty list is confusing.

**Why it happens:** Unconditional rendering of the alert section.

**How to avoid:** Conditionally render the entire alert card + list wrapper: `{kpis.pastTargetAlerts.length > 0 && <div>...</div>}`.

---

## Code Examples

### Parallel Data Fetch in Async Server Component

```typescript
// Source: established project pattern (fetchTurnRequests + fetchJobsByIds in turn-requests.ts)
const [jobs, turnRequests] = await Promise.all([
  fetchJobs(),
  fetchTurnRequests(),
])
```

### KPICard with alert variant

```typescript
// Source: src/components/ui/kpi-card.tsx interface
<KPICard
  icon={AlertTriangle}
  label="Make Readys Past Target Time"
  value={kpis.pastTargetAlerts.length}
  variant="alert-past"
/>
// alert-past = bg-alert-past-target (pink)
// alert-trending = bg-alert-trending (yellow)
```

### KPICard loading skeleton

```typescript
// Source: src/components/ui/kpi-card.tsx
// loading=true renders Skeleton internally, ignores value/label
<KPICard icon={Activity} label="" value="" loading />
```

### Suspense in dashboard layout (existing pattern)

```typescript
// Source: src/app/(dashboard)/layout.tsx
<Suspense fallback={<Skeleton className="w-32 h-8" />}>
  <UserHeader />
</Suspense>
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `unstable_cache` | `use cache` directive + `cacheLife` + `cacheTag` | Next.js 15+ | Phase 3 already uses new pattern; don't use `unstable_cache` |
| `getServerSideProps` | Async Server Components | Next.js 13 App Router | All pages are Server Components by default |
| Single-page async component | Suspense-wrapped child component | Next.js 16 requirement | Required to avoid blocking route error |

**Deprecated/outdated in this project:**
- `unstable_cache`: Replaced by `use cache` directive (confirmed in Phase 3 decisions). Do not use.
- Fetching data in `page.tsx` directly when Suspense is needed: Breaks the page shell pattern.

---

## Open Questions

1. **Backlog Delta field behavior**
   - What we know: The "Delta" column exists in the Jobs Airtable table and is column 37 in the snapshot CSV. Values in the snapshot are mostly 0 or empty. CONTEXT.md says it represents "opened last 30d minus completed last 30d" as a per-record number summed.
   - What's unclear: Whether Delta is reliably populated in production data (snapshot shows mostly 0/empty).
   - Recommendation: Add the field to the type and mapper, compute the sum, display as-is. If data is sparse, the KPI will show near-zero which is accurate to the data.

2. **Active Make Readys status values**
   - What we know: Real Turn Request statuses in snapshot are only "Done" and "In progress". CONTEXT.md filter says status IN (Needs Attention, To Do, In Progress).
   - What's unclear: Whether "Needs Attention" and "To Do" exist as statuses in production data not captured in the snapshot.
   - Recommendation: Use `status !== 'Done'` as the filter for Active Make Readys (catches all non-completed statuses including any not in snapshot). This is safer than an allowlist.

3. **Projected Cost Exposure field source**
   - What we know: CONTEXT.md says "SUM of price field, ALL records". `TurnRequest.quotePrice` is `string | null` (e.g., "$600.00"). `TurnRequest.totalCost` is also `string | null`. CONTEXT.md says "price field" without specifying which of these.
   - What's unclear: Whether "price" means `quotePrice` (from linked job quote rollup) or `totalCost` (computed total).
   - Recommendation: Use `totalCost` — it's the more semantically correct field ("Total Cost" is a direct Airtable field, "Price (from Quote Price) (from Jobs)" is a rollup). If TotalCost is null/zero, fall back to quotePrice.

---

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Vitest 4.0.18 + @testing-library/react 16.3.2 |
| Config file | `vitest.config.ts` (exists) |
| Quick run command | `npm test -- --reporter=verbose src/lib/kpis` |
| Full suite command | `npm test` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| EXEC-01 | `computeExecutiveKPIs` returns correct `activeJobsOpen` and `jobsTrendingPastTarget` | unit | `npm test -- src/lib/kpis/executive-kpis.test.ts` | Wave 0 |
| EXEC-02 | `computeExecutiveKPIs` returns correct `jobsCompleted30d` and `backlogDelta` | unit | `npm test -- src/lib/kpis/executive-kpis.test.ts` | Wave 0 |
| EXEC-03 | `computeExecutiveKPIs` returns correct `avgTimeToComplete` and `projectedCostExposure` | unit | `npm test -- src/lib/kpis/executive-kpis.test.ts` | Wave 0 |
| EXEC-04 | `computeExecutiveKPIs` returns correct `activeMakeReadysOpen` | unit | `npm test -- src/lib/kpis/executive-kpis.test.ts` | Wave 0 |
| EXEC-05 | `computeExecutiveKPIs` returns correctly filtered `pastTargetAlerts` and `trendingAlerts` arrays | unit | `npm test -- src/lib/kpis/executive-kpis.test.ts` | Wave 0 |
| EXEC-06 | All compute functions operate on unfiltered arrays (no property filter applied) | unit | `npm test -- src/lib/kpis/executive-kpis.test.ts` | Wave 0 |
| EXEC-07 | `ExecutiveKPISkeleton` renders 6 skeleton cards | unit | `npm test -- src/app` | Wave 0 |
| EXEC-05 alert | `mapJob` includes `delta` field after type extension | unit | `npm test -- src/lib/airtable/__tests__/mappers.test.ts` | exists (needs update) |

### Sampling Rate

- **Per task commit:** `npm test -- src/lib/kpis`
- **Per wave merge:** `npm test`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps

- [ ] `src/lib/kpis/executive-kpis.test.ts` — covers EXEC-01 through EXEC-06 compute logic
- [ ] `src/lib/types/airtable.ts` — add `delta: number | null` to Job interface
- [ ] `src/lib/airtable/tables/mappers.ts` — add `f['Delta']` mapping in `mapJob()`
- [ ] `src/lib/airtable/__tests__/mappers.test.ts` — add `delta` field assertion to existing `mapJob` tests

---

## Sources

### Primary (HIGH confidence)
- Direct code inspection: `src/components/ui/kpi-card.tsx` — variant API, loading prop
- Direct code inspection: `src/lib/types/airtable.ts` — Job and TurnRequest field inventory
- Direct code inspection: `src/lib/airtable/tables/mappers.ts` — confirmed delta field NOT mapped
- Direct code inspection: `src/app/(dashboard)/layout.tsx` — Suspense pattern in use
- Direct code inspection: `SnapshotData/Jobs-Grid view (5).csv` — real job statuses (no "Invoice Sent")
- Direct code inspection: `SnapshotData/Turn Requests-Grid view (2).csv` — real TR statuses (Done, In progress only)
- Direct code inspection: `package.json` — Next.js 16.1.6, React 19.2.3, Vitest 4.0.18

### Secondary (MEDIUM confidence)
- `.planning/phases/04-executive-dashboard/04-CONTEXT.md` — all KPI calculation rules, layout decisions, reusable assets list
- `.planning/STATE.md` — confirmed `use cache` pattern, cacheLife, cacheTag as established

### Tertiary (LOW confidence — not needed; all claims verified from source code)
- None required. All findings confirmed directly from project files.

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — confirmed from package.json and src/ imports
- Architecture patterns: HIGH — confirmed from existing dashboard layout.tsx Suspense pattern
- KPI compute logic: HIGH — confirmed from type definitions and actual Airtable field names
- Data gap (delta field): HIGH — confirmed missing from mapJob by direct inspection
- Status values: HIGH — confirmed from CSV snapshot data
- Pitfalls: HIGH — all based on direct code/data inspection, not speculation

**Research date:** 2026-03-12
**Valid until:** 2026-04-12 (stable stack, no fast-moving dependencies)
