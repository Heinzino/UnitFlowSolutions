# Phase 15: RM Dashboard - Research

**Researched:** 2026-03-19
**Domain:** Next.js App Router dashboard, Recharts bar chart, role-based routing
**Confidence:** HIGH

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**KPI Aggregation (6 boxes, 3x2 grid)**
- Same 6 KPIs as PM dashboard: Active Turns, Avg Turn Time, Revenue Exposure, Completed This Period, Jobs In Progress, Turns Near Deadline
- All metrics aggregated across all RM-assigned properties
- Avg Turn Time uses simple average across ALL Done turns from all properties (not average-of-averages)
- Reuse `computePMKPIs` directly — pass all RM turn requests as one batch, no separate `computeRMKPIs` function
- No "across N properties" subtitle — KPI boxes look identical to PM ones
- Same KPICard variants: Revenue Exposure uses `alert-past` when > 0, Turns Near Deadline uses `alert-trending` when > 0

**Property Insights List**
- Columns: Property Name, Active Turns, Avg Turn Time, Revenue Exposure (3 metrics per RMDB-03)
- Sortable by any column (click column headers) — same pattern as ActiveJobsTable
- Default sort: Revenue Exposure descending (worst-performing properties first)
- Rows are clickable: hover highlight + pointer cursor (like clickable turn rows on PM dashboard)
- Clicking a row navigates to drill-down view
- Empty state: "No properties assigned" heading + "Contact your administrator to get properties added to your account." body

**Drill-down Behavior**
- Clicking a property navigates to `/regional/property/[id]`
- Drill-down renders PM dashboard layout: KPIs + Open Turns + Active Jobs — all scoped to that single property
- RM has full PM edit capabilities in drill-down (status dropdown, lease-ready dates, job dates/status)
- "Back to Dashboard" link at top of drill-down page (explicit, doesn't rely on browser history)
- Reuse existing PM components (PMKPIs, PMTurnList, ActiveJobs) with property scoping

**Sidebar Navigation**
- RM sees both "Regional Dashboard" (/regional) and "Properties" (/property) in sidebar
- Two entry points: /regional for portfolio overview, /property for full PM-style view

**Middleware Routing**
- RM role routes to `/regional` on login (update ROLE_ROUTES)
- Add `/regional` to ROLE_ALLOWED_ROUTES for RM
- Keep `/property` in ROLE_ALLOWED_ROUTES for RM (accessible via sidebar)

**Avg Turn Time Bar Chart**
- Vertical bars: properties on X-axis, avg days on Y-axis
- Color-coded by threshold: green <7 days, amber 7-14 days, red >14 days
- Properties with no completed turns (no avg turn time) are omitted from chart
- Value shown on hover only (tooltip) — keeps chart clean, matches VendorCompletionChart pattern
- Positioned below Property Insights table on the RM dashboard page
- Chart lives in a Card component with heading "Avg Turn Time by Property"

### Claude's Discretion
- Loading skeleton arrangement for RM dashboard sections
- Exact Recharts configuration (margins, tick styles, bar radius)
- Mobile responsive treatment for Property Insights table and chart
- Whether to truncate long property names on chart X-axis
- Back link icon/styling details

### Deferred Ideas (OUT OF SCOPE)
None — discussion stayed within phase scope.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| RMDB-01 | RM dashboard served at /regional route with middleware routing rm role to /regional | `ROLE_ROUTES.rm` currently maps to `/property`; `ROLE_ALLOWED_ROUTES.rm` is `['/property', '/vendors', '/vacant']` — both must be updated. Middleware `updateSession` pattern is well-understood. |
| RMDB-02 | RM dashboard displays 6 aggregated KPI boxes (cross-property metrics) | `computePMKPIs` accepts any `TurnRequest[]` batch — pass all RM turns. `PMKPIs` server component calls `fetchTurnRequestsForUser(role, assignedProperties)` — reuse directly with `role='rm'`. |
| RMDB-03 | RM can view Property Insights list showing per-property stats (active turns, avg turn time, revenue exposure) | Per-property computation: partition turns by `propertyName`, call `computePMKPIs` for each subset. `ActiveJobsTable` sortable pattern (useState sortCol/sortDir) is the established template. |
| RMDB-04 | RM can drill down from Property Insights to PM-level view scoped to selected property | Route `/regional/property/[id]` where `[id]` is the URL-encoded property name. Page re-uses `PMKPIs`, `PMTurnList`, `ActiveJobs` with `assignedProperties=[id]` and `role='rm'`. |
| RMDB-05 | RM can view Avg Turn Time bar graph with per-property bars color-coded by threshold (green <7d, amber 7-14d, red >14d) | `VendorCompletionChart` is the exact template: `BarChart` with `Cell`-based coloring. Phase needs a vertical orientation (layout="horizontal" vs current "vertical"). Color logic: green `#16803c` <7, amber `#d97706` 7-14, red `#b91c1c` >14. |
</phase_requirements>

---

## Summary

Phase 15 is a high-reuse phase. The codebase already has every building block required: `computePMKPIs` for KPI computation, `PMKPIs`/`PMTurnList`/`ActiveJobs` for the drill-down, `VendorCompletionChart` for the Recharts BarChart pattern, `ActiveJobsTable` for the sortable table pattern, and the middleware `updateSession` for routing. The primary implementation work is: (1) routing changes in `auth.ts` and `sidebar.tsx`/`bottom-tab-bar.tsx`, (2) new `src/app/(dashboard)/regional/` route tree with two pages, (3) a new `PropertyInsightsTable` client component following the `ActiveJobsTable` pattern, (4) a new `AvgTurnTimeChart` adapting `VendorCompletionChart` to vertical orientation with the correct thresholds, and (5) a "Back to Dashboard" link on the drill-down page.

The only non-trivial computation is per-property KPI aggregation for Property Insights and chart data. This is straightforward: group turns by `propertyName` then call `computePMKPIs` for each group. The RM's `assignedProperties` list (from `user.app_metadata.property_ids`) determines the set of known properties, so even properties with zero turns show in the Insights table (with 0 active turns, N/A avg, $0 exposure) but are omitted from the chart.

The drill-down route uses a URL-encoded property name as the `[id]` segment (matching how existing property filtering works in the PM page via `?property=...`). The drill-down page is nearly identical to `property/page.tsx` — it just pins `effectiveProperties` to the single property from the URL and adds a "Back to Dashboard" link.

**Primary recommendation:** Build the phase in three waves — (Wave 1) routing/auth/nav updates, (Wave 2) RM dashboard page with KPIs + Property Insights + Chart, (Wave 3) drill-down page.

---

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| recharts | (existing) | Avg Turn Time bar chart | Already used for VendorCompletionChart; pattern established |
| next/navigation | (existing) | `useRouter`, `redirect` | App Router standard |
| next/cache | (existing) | `use cache`, `cacheLife`, `cacheTag` | Project caching pattern |
| @supabase/ssr | (existing) | Auth / user metadata | Existing middleware pattern |
| lucide-react | (existing) | Icons (sidebar nav icon, back link) | Used throughout project |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| clsx | (existing) | Conditional class names | Sortable header active state, hover styles on clickable rows |

**No new dependencies required.** Phase 15 is pure feature work on existing infrastructure.

---

## Architecture Patterns

### Recommended Project Structure
```
src/app/(dashboard)/regional/
├── page.tsx                          # RM dashboard (server, Suspense boundaries)
├── _components/
│   ├── rm-dashboard.tsx              # Client wrapper (heading, layout)
│   ├── rm-kpis.tsx                   # Server: fetches all RM turns, calls computePMKPIs
│   ├── rm-kpi-skeleton.tsx           # Loading fallback (reuse PMKPISkeleton shape)
│   ├── property-insights-table.tsx   # Client: sortable table (useState sortCol/sortDir)
│   ├── property-insights.tsx         # Server: computes per-property stats, renders table
│   ├── property-insights-skeleton.tsx# Loading fallback
│   ├── avg-turn-time-chart.tsx       # Client: Recharts BarChart (adapt VendorCompletionChart)
│   └── avg-turn-time-chart-skeleton.tsx
└── property/
    └── [id]/
        └── page.tsx                  # Drill-down — scoped PM view
```

### Pattern 1: RM KPI Aggregation (server component)
**What:** Fetch all RM turns, pass as one batch to `computePMKPIs`
**When to use:** RM dashboard aggregated KPI row

```typescript
// src/app/(dashboard)/regional/_components/rm-kpis.tsx
// Mirrors src/app/(dashboard)/property/_components/pm-kpis.tsx exactly
// except assignedProperties comes from user.app_metadata.property_ids
// and role is always 'rm'

export async function RMKPIs({ assignedProperties }: { assignedProperties: string[] }) {
  const turnRequests = await fetchTurnRequestsForUser('rm', assignedProperties)
  const kpis = computePMKPIs(turnRequests) // same function, same result shape
  // Render identical KPICard grid as PMKPIs
}
```

### Pattern 2: Per-Property KPI Computation
**What:** Group turns by propertyName, compute KPIs for each group
**When to use:** Property Insights table rows + chart data

```typescript
// Within a server component (property-insights.tsx)
const turnRequests = await fetchTurnRequestsForUser('rm', assignedProperties)

// Group by property name
const byProperty = new Map<string, TurnRequest[]>()
for (const propName of assignedProperties) {
  byProperty.set(propName, [])
}
for (const tr of turnRequests) {
  const group = byProperty.get(tr.propertyName)
  if (group) group.push(tr)
}

// Compute KPIs per property
const propertyStats = assignedProperties.map((propName) => {
  const turns = byProperty.get(propName) ?? []
  const kpis = computePMKPIs(turns)
  return { propName, ...kpis }
})
```

### Pattern 3: Sortable Table (client component)
**What:** `useState` for `sortCol`/`sortDir`, click handlers on column headers
**When to use:** Property Insights table

```typescript
// Mirrors ActiveJobsTable pattern exactly
// Source: src/app/(dashboard)/property/_components/active-jobs-table.tsx
type SortCol = 'propertyName' | 'activeTurns' | 'avgTurnTime' | 'revenueExposure'
type SortDir = 'asc' | 'desc'

const [sortCol, setSortCol] = useState<SortCol>('revenueExposure') // default
const [sortDir, setSortDir] = useState<SortDir>('desc')            // worst first
```

### Pattern 4: Recharts Vertical BarChart (client component)
**What:** BarChart with default layout (vertical bars), Cell-based coloring
**When to use:** Avg Turn Time by Property chart

```typescript
// Adapts VendorCompletionChart — key differences:
// 1. Remove layout="vertical" (default is vertical bars = what we want)
// 2. XAxis type="category" dataKey="propertyName"
// 3. YAxis type="number" (days)
// 4. Color thresholds: green <7, amber 7-14, red >14

function getBarColor(days: number): string {
  if (days > 14) return '#b91c1c'  // red
  if (days >= 7) return '#d97706'  // amber
  return '#16803c'                  // green
}
```

Note: `VendorCompletionChart` uses `layout="vertical"` making it horizontal bars (vendor names on Y). For Avg Turn Time we want standard vertical bars (property names on X, days on Y) — so simply omit `layout` prop (default is vertical bars).

### Pattern 5: Drill-down Route
**What:** `/regional/property/[id]` renders PM components scoped to one property
**When to use:** RM clicks a row in Property Insights

```typescript
// src/app/(dashboard)/regional/property/[id]/page.tsx
// Mirrors property/page.tsx almost exactly
// [id] = URL-encoded property name
// effectiveProperties = [decodeURIComponent(params.id)]
// Back link: <Link href="/regional">← Back to Dashboard</Link>

export default async function RegionalPropertyPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const propertyName = decodeURIComponent(id)
  // Verify RM is assigned to this property
  // Render PMKPIs + PMTurnList + ActiveJobs with assignedProperties=[propertyName]
}
```

### Pattern 6: Clickable Table Rows
**What:** Rows navigate on click, hover highlight, pointer cursor
**When to use:** Property Insights rows (navigates to drill-down)

```typescript
// Mirror ClickableTurnRow pattern from:
// src/app/(dashboard)/property/_components/clickable-turn-row.tsx
// Use useRouter().push(`/regional/property/${encodeURIComponent(propName)}`)
// Or render as <tr> with onClick
```

### Anti-Patterns to Avoid
- **Creating a separate `computeRMKPIs` function:** Decision is locked — reuse `computePMKPIs` directly. The function is pure and works on any `TurnRequest[]` batch.
- **Using `?property=` query param for drill-down:** The PM page uses query params for filtering — the RM drill-down uses a dedicated route `/regional/property/[id]` to keep contexts separate.
- **Fetching turn requests separately in each section:** `fetchTurnRequestsForUser` uses `use cache` — multiple calls with the same args are deduped. But still prefer fetching once at the page level and passing down where possible to minimize Suspense boundaries' redundancy.
- **Omitting `role='rm'` prop on PMKPIs in drill-down:** `PMKPIs` passes `role` to `fetchTurnRequestsForUser` — must be `'rm'` not `'pm'` to hit correct cache tag and filter logic.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| KPI computation | Custom RM aggregation logic | `computePMKPIs(allRMTurns)` | Identical math; maintaining two implementations creates drift risk |
| Sortable table | Custom sort logic | `useState` + `[...arr].sort()` pattern from `ActiveJobsTable` | Proven, tested, matches existing UX |
| Bar chart | Custom SVG chart | `recharts` `BarChart` + `Cell` | Already imported; VendorCompletionChart is the direct template |
| Clickable rows | Custom `<div onClick>` rows | Mirror `ClickableTurnRow` component | Handles accessibility, propagation, hover states correctly |
| Per-property turn fetching | N separate Airtable calls per property | Fetch all once, partition in memory | `fetchTurnRequestsForUser` is cached — partitioning is O(n) in JS, not N Airtable calls |

**Key insight:** This phase is almost entirely assembly. The project already ships every primitive needed — the work is composing them in a new route tree.

---

## Common Pitfalls

### Pitfall 1: Auth Constants Test Will Fail After Routing Change
**What goes wrong:** `src/lib/__tests__/auth-types.test.ts` has a test `ROLE_ROUTES.rm maps to /property` and `ROLE_ALLOWED_ROUTES.rm includes /property, /vendors, and /vacant` — both will fail after Phase 15 changes.
**Why it happens:** Tests assert current values, not post-phase values.
**How to avoid:** Update `auth-types.test.ts` in the same task that updates `auth.ts`. New assertions: `ROLE_ROUTES.rm === '/regional'`, `ROLE_ALLOWED_ROUTES.rm` includes `/regional` in addition to existing routes.
**Warning signs:** Test run fails on `auth-types.test.ts` after auth.ts is edited.

### Pitfall 2: Sidebar Active State for /regional Routes
**What goes wrong:** `Sidebar` uses `activePath === item.href` exact match. `/regional/property/[id]` won't highlight the "Regional Dashboard" nav item.
**Why it happens:** Exact match doesn't handle sub-routes.
**How to avoid:** Change active check for "Regional Dashboard" nav item to `activePath.startsWith('/regional')` — consistent with how the middleware uses `path.startsWith(r)`.
**Warning signs:** Drill-down page shows no active nav item in sidebar.

### Pitfall 3: VendorCompletionChart is Horizontal Bars, Not Vertical
**What goes wrong:** Copying `VendorCompletionChart` without understanding that `layout="vertical"` produces horizontal bars (categories on Y-axis). The CONTEXT.md spec says properties on X-axis, days on Y-axis = standard vertical bars.
**Why it happens:** Recharts naming is counter-intuitive — `layout="vertical"` means the bars grow horizontally.
**How to avoid:** Omit the `layout` prop entirely (default is vertical bars). Swap XAxis type to `category` with `dataKey="propertyName"`, YAxis type to `number`.

### Pitfall 4: Property Name as URL Segment
**What goes wrong:** Property names may contain spaces, ampersands, or other URL-unsafe characters. Navigating to `/regional/property/Some Property LLC` will 404 or silently drop the name.
**Why it happens:** URL path segments require encoding.
**How to avoid:** Always `encodeURIComponent(propertyName)` when building the href, `decodeURIComponent(params.id)` when reading it in the page. Verify the round-trip handles the actual property names in the data.

### Pitfall 5: BottomTabBar Not Updated
**What goes wrong:** Sidebar gets the "Regional Dashboard" nav item but BottomTabBar (mobile) does not. Mobile users see no way to navigate to /regional.
**Why it happens:** Sidebar and BottomTabBar are separate components with separate `navItems`/`tabItems` arrays.
**How to avoid:** Update both `sidebar.tsx` and `bottom-tab-bar.tsx` in the same task.

### Pitfall 6: Middleware Does Not Know About /regional
**What goes wrong:** After adding `/regional` to `ROLE_ALLOWED_ROUTES.rm`, the middleware's `isRoleRoute` check uses `Object.values(ROLE_ROUTES)`. Since `ROLE_ROUTES.rm` will now be `/regional`, any RM navigating to `/property` will pass `isRoleRoute` (because `/property` is still in `ROLE_ROUTES` for `pm`) but also pass `isAllowed` (because `/property` is still in `ROLE_ALLOWED_ROUTES.rm`). This is correct behavior — verify with tests.
**How to avoid:** After updating `auth.ts`, run `npm test src/lib/__tests__/auth-types.test.ts` to confirm allowed route arrays are correct.

### Pitfall 7: `fetchTurnRequestsForUser` Called with Property Names, Not IDs
**What goes wrong:** `fetchTurnRequestsForUser` accepts `assignedPropertyNames: string[]` — property names, not Airtable record IDs. `user.app_metadata.property_ids` may contain IDs rather than names depending on how users are provisioned.
**Why it happens:** The type says `property_ids` but the function uses `filterByProperties` against `tr.propertyName`.
**How to avoid:** Verify the existing PM page works (it does — Phase 13 passed). The `property_ids` field actually holds property names despite the field name. This is established project behavior — do not change it.

---

## Code Examples

Verified patterns from existing codebase:

### Auth Constants Update (RMDB-01)
```typescript
// src/lib/types/auth.ts — changes needed
export const ROLE_ROUTES: Record<UserRole, string> = {
  pm: '/property',
  rm: '/regional',     // changed from '/property'
  exec: '/executive',
}

export const ROLE_ALLOWED_ROUTES: Partial<Record<UserRole, string[]>> = {
  exec: ['/executive', '/property', '/vendors', '/vacant'],
  rm: ['/regional', '/property', '/vendors', '/vacant'],  // added '/regional'
  pm: ['/property', '/vendors', '/vacant'],
}
```

### RM Dashboard Page Structure (mirrors property/page.tsx)
```typescript
// src/app/(dashboard)/regional/page.tsx
import { Suspense } from 'react'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { RMKPIs } from './_components/rm-kpis'
import { PMKPISkeleton } from '../property/_components/pm-kpi-skeleton'
import { PropertyInsights } from './_components/property-insights'
import { PropertyInsightsSkeleton } from './_components/property-insights-skeleton'
import { AvgTurnTimeChart } from './_components/avg-turn-time-chart'

export default async function RegionalPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const assignedProperties: string[] = user.app_metadata?.property_ids ?? []
  const displayName: string = user.user_metadata?.full_name ?? user.email ?? 'Unknown'

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="font-heading font-bold text-xl text-white">Regional Dashboard</h1>
        <p className="text-white/70 text-sm mt-0.5">Welcome, {displayName}</p>
      </div>
      <Suspense fallback={<PMKPISkeleton />}>
        <RMKPIs assignedProperties={assignedProperties} />
      </Suspense>
      <Suspense fallback={<PropertyInsightsSkeleton />}>
        <PropertyInsights assignedProperties={assignedProperties} />
      </Suspense>
      {/* AvgTurnTimeChart data is computed inside PropertyInsights — pass as prop or fetch separately */}
    </div>
  )
}
```

### Per-Property KPI Computation (for PropertyInsights server component)
```typescript
// Source: computePMKPIs from src/lib/kpis/pm-kpis.ts + filterByProperties pattern
const turnRequests = await fetchTurnRequestsForUser('rm', assignedProperties)

const propertyStats = assignedProperties.map((propName) => {
  const propTurns = turnRequests.filter((tr) => tr.propertyName === propName)
  const kpis = computePMKPIs(propTurns)
  return {
    propertyName: propName,
    activeTurns: kpis.activeTurns,
    avgTurnTime: kpis.avgTurnTime,        // null if no Done turns
    revenueExposure: kpis.revenueExposure,
  }
})
```

### Avg Turn Time Chart Color Logic
```typescript
// Adapted from VendorCompletionChart color function
// VendorCompletionChart uses blue for 7-14 days — Phase 15 spec requires amber
function getBarColor(days: number): string {
  if (days > 14) return '#b91c1c'  // red (same as vendor chart)
  if (days >= 7) return '#d97706'  // amber (DIFFERENT from vendor chart — vendor uses blue)
  return '#16803c'                  // green (same as vendor chart)
}

// Chart orientation: omit layout prop (default = vertical bars)
// XAxis: type="category" dataKey="propertyName"
// YAxis: type="number" (days)
// Data: propertyStats.filter(p => p.avgTurnTime !== null)
//         .map(p => ({ propertyName: p.propertyName, days: Math.round(p.avgTurnTime!) }))
```

### Sidebar Nav Item for RM
```typescript
// src/components/layout/sidebar.tsx — add to navItems
{ icon: Map, label: "Regional Dashboard", href: "/regional", roles: ["rm"] }
// Active check fix for sub-routes:
const isActive = activePath.startsWith(item.href)
// Note: This generalizes all nav items — safe since hrefs are distinct prefixes
```

### Drill-down Page Back Link
```typescript
// src/app/(dashboard)/regional/property/[id]/page.tsx
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

// At top of page content, before Suspense boundaries:
<Link href="/regional" className="inline-flex items-center gap-1 text-white/70 hover:text-white text-sm mb-2">
  <ArrowLeft size={14} />
  Back to Dashboard
</Link>
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| RM routed to /property (no dedicated view) | RM routed to /regional (dedicated dashboard) | Phase 15 | Requires auth.ts + middleware update |
| VendorCompletionChart uses blue for moderate bars | AvgTurnTimeChart uses amber for moderate bars | Phase 15 spec | Color constant differs — don't copy blindly |

---

## Open Questions

1. **Property name vs property ID in URL**
   - What we know: `user.app_metadata.property_ids` stores property names (not IDs). `fetchTurnRequestsForUser` filters by name. The drill-down route uses `[id]` as URL segment.
   - What's unclear: If property names change in Airtable, bookmarked drill-down URLs break. But this is a pre-existing characteristic of the entire PM property filter system.
   - Recommendation: Use URL-encoded property name as the segment. This matches existing patterns and Phase 15 scope doesn't require solving this systemic issue.

2. **Chart data co-location with Property Insights**
   - What we know: Both PropertyInsights table and AvgTurnTimeChart need per-property KPI data.
   - What's unclear: Whether to compute once in a shared server component or in separate Suspense-wrapped components (two fetches, though cached).
   - Recommendation: Compute both in a single `PropertyInsightsSection` server component that renders both the table and passes chart data as a prop to the client chart component. This avoids double computation and keeps one Suspense boundary for both sections.

---

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest + @testing-library/react |
| Config file | `vitest.config.ts` |
| Quick run command | `npx vitest run --reporter=verbose` |
| Full suite command | `npx vitest run` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| RMDB-01 | `ROLE_ROUTES.rm === '/regional'` | unit | `npx vitest run src/lib/__tests__/auth-types.test.ts` | ✅ (needs update) |
| RMDB-01 | `ROLE_ALLOWED_ROUTES.rm` includes `/regional` | unit | `npx vitest run src/lib/__tests__/auth-types.test.ts` | ✅ (needs update) |
| RMDB-02 | RM KPI aggregation renders without throwing | smoke | `npx vitest run src/app/(dashboard)/regional/_components/rm-kpis.test.tsx` | ❌ Wave 0 |
| RMDB-03 | Property Insights table renders per-property rows | smoke | `npx vitest run src/app/(dashboard)/regional/_components/property-insights.test.tsx` | ❌ Wave 0 |
| RMDB-04 | Drill-down page renders PM components scoped to property | smoke | `npx vitest run src/app/(dashboard)/regional/property/[id]/page.test.tsx` | ❌ Wave 0 |
| RMDB-05 | AvgTurnTimeChart renders bars with correct colors | unit | `npx vitest run src/app/(dashboard)/regional/_components/avg-turn-time-chart.test.tsx` | ❌ Wave 0 |

### Sampling Rate
- **Per task commit:** `npx vitest run src/lib/__tests__/auth-types.test.ts`
- **Per wave merge:** `npx vitest run`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `src/app/(dashboard)/regional/_components/rm-kpis.test.tsx` — covers RMDB-02 (smoke: renders 6 KPI cards)
- [ ] `src/app/(dashboard)/regional/_components/property-insights.test.tsx` — covers RMDB-03 (renders property rows, empty state)
- [ ] `src/app/(dashboard)/regional/_components/avg-turn-time-chart.test.tsx` — covers RMDB-05 (color logic unit test)
- [ ] Update `src/lib/__tests__/auth-types.test.ts` — RMDB-01 (change expected values for `ROLE_ROUTES.rm` and `ROLE_ALLOWED_ROUTES.rm`)

Note: Recharts must be mocked in test files (see `executive-charts.test.tsx` for the established mock pattern).

---

## Sources

### Primary (HIGH confidence)
- Direct source read: `src/lib/types/auth.ts` — current `ROLE_ROUTES`, `ROLE_ALLOWED_ROUTES` values
- Direct source read: `src/lib/supabase/middleware.ts` — routing logic, how `ROLE_ROUTES` and `ROLE_ALLOWED_ROUTES` are consumed
- Direct source read: `src/lib/kpis/pm-kpis.ts` — `computePMKPIs` signature and return type
- Direct source read: `src/app/(dashboard)/executive/_components/vendor-completion-chart.tsx` — Recharts BarChart pattern, Cell coloring, layout orientation
- Direct source read: `src/app/(dashboard)/property/_components/active-jobs-table.tsx` — sortable table pattern
- Direct source read: `src/components/layout/sidebar.tsx` — nav item structure, role filtering, active state logic
- Direct source read: `src/components/layout/bottom-tab-bar.tsx` — mobile nav structure
- Direct source read: `src/lib/__tests__/auth-types.test.ts` — existing assertions that will need updating
- Direct source read: `vitest.config.ts` — test framework, environment, setup

### Secondary (MEDIUM confidence)
- `.planning/phases/15-rm-dashboard/15-CONTEXT.md` — all implementation decisions locked by user

### Tertiary (LOW confidence)
None — all findings verified against source code.

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all libraries confirmed present in codebase
- Architecture: HIGH — all patterns verified against existing source files
- Pitfalls: HIGH — identified from direct code reading (auth tests, sidebar exact match, chart orientation)
- Test gaps: HIGH — confirmed by globbing test files

**Research date:** 2026-03-19
**Valid until:** 2026-04-19 (stable codebase, no external dependencies added)
