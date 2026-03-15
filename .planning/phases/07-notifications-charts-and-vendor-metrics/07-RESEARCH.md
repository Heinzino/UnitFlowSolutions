# Phase 7: Notifications, Charts, and Vendor Metrics - Research

**Researched:** 2026-03-14
**Domain:** Recharts (data visualization), SVG gauge, sortable table, Next.js route authorization
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Notifications (DESCOPED)**
- Notification panel removed entirely — no third column, no notification feed
- Remove Bell/"Notifications" nav item from sidebar AND bottom tab bar
- Layout stays two-column (sidebar + main content)
- Existing pink/yellow alert cards on exec and PM dashboards already surface attention items
- NOTIF-01 through NOTIF-04 marked as descoped

**Charts & Visualizations**
- Use Recharts library for all charts (bar charts, line charts if needed)
- Reference: `turn-health-dashboard.jsx` in project root — use as visual style guide
- Two charts on executive dashboard:
  1. Health Gauge — SVG semi-circular arc (like HealthGauge in reference file), showing on-time completion rate (percentage of turns completed with daysVacantUntilReady <= 10). Green/amber/red coloring based on score thresholds.
  2. Vendor cost bar chart — Horizontal bar chart showing cost per turn by vendor, color-coded by cost threshold. Uses Recharts BarChart with layout="vertical".
- Charts appear below existing KPI cards and alert cards on executive dashboard
- VIZ-04 already implemented in Phase 4 — pink for past target, yellow for trending (no work needed)

**Trend Indicators (VIZ-03)**
- Wire existing `TrendIndicator` component to executive KPI cards only — not PM dashboard
- Comparison window: current 30 days vs previous 30 days
- Only meaningful KPI cards get trends: Jobs Completed, Active Jobs Open, Avg Time to Complete
- Skip trends for: Backlog Delta, Projected Cost Exposure, Jobs Trending Past Target
- Trend direction: up is green for Jobs Completed, up is red for Active Jobs Open and Avg Time to Complete

**Vendor Metrics Table (VEND-01)**
- Dedicated /vendors page — sidebar Vendors nav item already exists
- Accessible to all roles (PM, RM, exec) — no role restriction
- Columns: Vendor Name, Num Jobs Completed, Average Completion Time (Days), Num Jobs Assigned, Jobs (linked ID badges)
- Sortable columns — click column header to sort ascending/descending, client-side sort
- Flat table only — no vendor detail page, no clickable rows
- Job badges link to individual job detail pages (/property/job/[id])
- Uses existing `fetchVendors()` which already returns all needed fields
- Reuses existing Table component pattern from PM turn list

### Claude's Discretion
- Health gauge SVG implementation details (arc radius, gradient colors, animation)
- Vendor bar chart dimensions and color thresholds
- Vendor table default sort order
- Chart section heading styles on exec dashboard
- Loading skeleton arrangement for charts and vendor table
- Mobile responsive behavior for charts (stack or scroll)
- Whether to use Recharts or custom SVG for the health gauge (reference uses custom SVG)

### Deferred Ideas (OUT OF SCOPE)
None — discussion stayed within phase scope
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| VIZ-01 | Vendor performance bar chart (horizontal, color-coded by cost threshold) | Recharts BarChart with layout="vertical", Cell for per-bar color, radius prop for rounded ends |
| VIZ-02 | Completion gauge (semi-circular arc, green/amber/red coloring, centered score) | Custom SVG pattern from turn-health-dashboard.jsx reference; no Recharts needed |
| VIZ-03 | Trend indicators on KPI cards (arrow up/down + percentage + color) | TrendIndicator already built; needs computeExecutiveKPIs extended with prev-30d window |
| VIZ-04 | Color-coded alert cards: pink for past target, yellow for trending | ALREADY COMPLETE in Phase 4 — no work required |
| VEND-01 | Vendor table: Name, Jobs Completed, Avg Completion Time, Jobs Assigned, Job badges | fetchVendors() exists; Table compound component exists; needs client sortable-header wrapper |
| NOTIF-01 | Notification panel | DESCOPED — alert cards are sufficient |
| NOTIF-02 | Alert types in notification feed | DESCOPED |
| NOTIF-03 | Notification item format | DESCOPED |
| NOTIF-04 | Notification click navigation | DESCOPED |
</phase_requirements>

---

## Summary

Phase 7 is narrowly scoped: install and use Recharts for one horizontal bar chart on the executive dashboard, build one custom SVG health gauge on the same dashboard, wire the already-built TrendIndicator into three executive KPI cards (requiring a prev-30d data window), and create a new /vendors page with a client-side sortable table. Notifications have been fully descoped.

The critical pre-work item is **Recharts is not yet installed** — it must be added to `dependencies` before any chart components can be written. Everything else reuses existing patterns: the Table compound component, Suspense + `use cache` data fetching, `_components/` page-local directories, and the KPICard's existing `trend` prop slot.

The one routing concern is that `/vendors` must be added to `ROLE_ALLOWED_ROUTES` in `auth.ts` for all three roles (`pm`, `rm`, `exec`), otherwise users will be redirected away. Currently `ROLE_ALLOWED_ROUTES` only covers `exec` and `rm` explicitly; `pm` has no explicit entry and will be blocked by the middleware `isRoleRoute && !isAllowed` guard.

**Primary recommendation:** Install Recharts first, then build in plan order: (1) sidebar cleanup + vendor page + trend wiring, (2) health gauge + vendor bar chart on exec dashboard.

---

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| recharts | ^2.x | BarChart, Cell, ResponsiveContainer for vendor cost chart | Locked decision; reference file already uses it; React 19 compatible |
| SVG (native) | — | Health gauge arc | Reference uses custom SVG; simpler than Recharts RadialBarChart for a semi-circle |

### Already Installed (relevant)
| Library | Version | Purpose |
|---------|---------|---------|
| lucide-react | ^0.577.0 | Icons (ChevronUp/Down for sortable column headers) |
| next | 16.1.6 | `use cache`, `cacheLife`, `cacheTag` for /vendors data fetch |
| react | 19.2.3 | Client components for sortable table, charts |
| vitest | ^4.0.18 | Unit tests for KPI trend computation |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Recharts BarChart | Tremor, Nivo | Locked decision — Recharts matches reference file exactly |
| Custom SVG gauge | Recharts RadialBarChart | Custom SVG gives precise control over the 135° rotation arc pattern from reference; RadialBarChart adds unnecessary config for a static display |
| Client-side sort | Server-side sort with URL params | Client-side is simpler for a flat vendor list; no pagination needed |

**Installation:**
```bash
npm install recharts
```

---

## Architecture Patterns

### Recommended Project Structure
```
src/app/(dashboard)/
├── executive/
│   ├── page.tsx                          # existing — add chart Suspense boundary
│   ├── _components/
│   │   ├── executive-kpis.tsx            # existing — add trend props
│   │   ├── executive-kpi-skeleton.tsx    # existing
│   │   ├── executive-charts.tsx          # NEW — HealthGauge + VendorCostChart
│   │   └── executive-charts-skeleton.tsx # NEW — skeleton placeholder for charts
├── vendors/
│   ├── page.tsx                          # NEW — server component, Suspense wrapper
│   └── _components/
│       ├── vendor-table.tsx              # NEW — client component with sort state
│       └── vendor-table-skeleton.tsx     # NEW — skeleton for table
src/lib/kpis/
├── executive-kpis.ts                     # existing — extend with prev30d computation
├── executive-kpis.test.ts                # existing — add trend tests
src/components/layout/
├── sidebar.tsx                           # existing — remove Bell/Notifications item
└── bottom-tab-bar.tsx                    # existing — remove Bell/Notifications item
src/lib/types/
└── auth.ts                               # existing — add /vendors to ROLE_ALLOWED_ROUTES
```

### Pattern 1: Recharts Horizontal Bar Chart (VIZ-01)
**What:** BarChart with `layout="vertical"` places vendor names on Y-axis, cost values on X-axis. `Cell` component inside `Bar` applies per-bar color based on cost threshold.
**When to use:** When bars represent categorical items (vendors) and labels are long strings.
**Example:**
```tsx
// Source: turn-health-dashboard.jsx reference (vendorCostData section)
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

<ResponsiveContainer width="100%" height={200}>
  <BarChart data={vendorData} layout="vertical">
    <XAxis type="number" tickFormatter={v => `$${(v/1000).toFixed(1)}k`}
      axisLine={false} tickLine={false} tick={{ fontSize: 10 }} />
    <YAxis type="category" dataKey="vendorName"
      axisLine={false} tickLine={false} width={120} tick={{ fontSize: 10 }} />
    <Tooltip formatter={(v: number) => [`$${v.toLocaleString()}`, 'Cost per Turn']} />
    <Bar dataKey="cost" radius={[0, 4, 4, 0]}>
      {vendorData.map((entry, i) => (
        <Cell key={i} fill={entry.cost > 4500 ? '#b91c1c' : entry.cost > 3000 ? '#2563eb' : '#16803c'} />
      ))}
    </Bar>
  </BarChart>
</ResponsiveContainer>
```

### Pattern 2: Custom SVG Health Gauge (VIZ-02)
**What:** SVG circle with `strokeDasharray` trick — renders 75% of circumference as the visible arc (135° rotation offset creates bottom-opening semi-circle). Score drives the filled portion.
**When to use:** When you need a precise semi-circular gauge matching the reference aesthetic.
**Example:**
```tsx
// Source: turn-health-dashboard.jsx HealthGauge component
const r = 52, cx = 64, cy = 64;
const circ = 2 * Math.PI * r;      // full circumference
const dash = circ * 0.75;           // 75% = the arc length of the gauge track
const fill = dash * (score / 100);  // filled portion

// Track (background arc)
<circle cx={cx} cy={cy} r={r} fill="none" stroke="#e4e2dc" strokeWidth={10}
  strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
  transform={`rotate(135 ${cx} ${cy})`} />
// Filled arc
<circle cx={cx} cy={cy} r={r} fill="none" stroke={color} strokeWidth={10}
  strokeDasharray={`${fill} ${circ}`} strokeLinecap="round"
  transform={`rotate(135 ${cx} ${cy})`}
  style={{ transition: 'stroke-dasharray 0.6s ease' }} />
// Score text
<text x={cx} y={cy - 2} textAnchor="middle">{score}</text>
<text x={cx} y={cy + 16} textAnchor="middle">{label}</text>
```

**Color thresholds (from reference):**
- score >= 88 → green (`#16803c`) — "Healthy"
- score >= 75 → amber (`#b45309`) — "At Risk"
- score < 75 → red (`#b91c1c`) — "Critical"

**Score formula:** percentage of turn requests where `daysVacantUntilReady <= 10` (out of all turns with a non-null value). Multiply by 100 and round.

### Pattern 3: Client-Side Sortable Table (VEND-01)
**What:** Client component wraps the Table compound component. `useState` tracks `{ column, direction }`. Sort is applied via `.sort()` on the data array before rendering. Column header click toggles direction or changes column.
**When to use:** Flat list with no pagination, all data fits in memory.
**Example:**
```tsx
// Pattern derived from existing PM turn list + Table compound component
'use client';
import { useState } from 'react';
import { ChevronUp, ChevronDown } from 'lucide-react';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';

type SortKey = 'vendorName' | 'numJobsCompleted' | 'avgCompletionTimeDays' | 'numJobsAssigned';
type SortDir = 'asc' | 'desc';

export function VendorTable({ vendors }: { vendors: Vendor[] }) {
  const [sortKey, setSortKey] = useState<SortKey>('numJobsCompleted');
  const [sortDir, setSortDir] = useState<SortDir>('desc');

  function handleSort(key: SortKey) {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortDir('desc'); }
  }

  const sorted = [...vendors].sort((a, b) => {
    const av = a[sortKey] ?? -Infinity;
    const bv = b[sortKey] ?? -Infinity;
    return sortDir === 'asc' ? (av > bv ? 1 : -1) : (av < bv ? 1 : -1);
  });
  // ... render Table with sorted data
}
```

### Pattern 4: Trend Computation (VIZ-03)
**What:** Extend `computeExecutiveKPIs` (or create a peer function) that accepts jobs from both current 30d window AND previous 30d window (60–30 days ago). Compute the three KPIs for each window; percentage change = `(current - prev) / prev * 100`.
**When to use:** When showing directional change on KPI cards.

The `KPICard` already accepts a `trend` prop: `{ direction: 'up' | 'down'; percentage: number }`. No changes to KPICard needed.

**Trend direction semantics:**
| KPI | Up arrow color | Reason |
|-----|---------------|--------|
| Jobs Completed | green (positive) | More completions = good |
| Active Jobs Open | red (negative) | More open = worse |
| Avg Time to Complete | red (negative) | Longer time = worse |

Implementation note: `TrendIndicator` currently uses `direction === 'up' ? 'text-positive' : 'text-negative'`. For "Active Jobs Open" and "Avg Time to Complete", the direction arrow is `up` when the value increased, but the color should be `text-negative`. This means TrendIndicator needs either a `isPositive` override prop or the caller must pass `direction` already inverted to green/red. **Verify the actual TrendIndicator implementation** — currently it hardcodes `up = text-positive`. A `colorOverride` or `isGood` boolean prop may need to be added.

### Pattern 5: Route Authorization for /vendors
**What:** Add `/vendors` to `ROLE_ALLOWED_ROUTES` for all three roles so the middleware does not redirect any authenticated user away from the vendors page.
**Current state:**
```ts
export const ROLE_ALLOWED_ROUTES: Partial<Record<UserRole, string[]>> = {
  exec: ['/executive', '/property'],
  rm: ['/property'],
}
// pm has no entry — isAllowed falls back to ownRoute ('/property') check
```
**Required change:**
```ts
export const ROLE_ALLOWED_ROUTES: Partial<Record<UserRole, string[]>> = {
  exec: ['/executive', '/property', '/vendors'],
  rm: ['/property', '/vendors'],
  pm: ['/property', '/vendors'],
}
```

### Anti-Patterns to Avoid
- **Recharts in a server component:** `ResponsiveContainer` uses `ResizeObserver` — must be in a `'use client'` component.
- **Putting chart data computation in the client component:** Compute health score and vendor cost data server-side (in the async server component or a pure function), pass as props to the client chart wrapper.
- **`window` access in gauge SVG:** The custom SVG gauge is pure JSX/math — no window access — so it can actually render in a server component if desired, but wrapping in a client file with charts is fine.
- **Recharts SSR hydration mismatch:** `ResponsiveContainer` measures DOM width; always wrap in a client component with `'use client'`.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Horizontal bar chart | Custom SVG bars | Recharts BarChart | Locked decision; handles axis, tooltip, responsive resize |
| Sortable column headers | Custom sort icon component | lucide-react ChevronUp/ChevronDown inline | Already installed; trivial inline use |
| Vendor data fetching | New Airtable query | `fetchVendors()` in vendors.ts | Already written and tested; returns all needed fields |
| KPI trend arrows | New icon component | `TrendIndicator` in trend-indicator.tsx | Already built, already slotted into KPICard |

**Key insight:** This phase is almost entirely wiring — the hard primitives (Table, KPICard, TrendIndicator, fetchVendors, Skeleton) already exist. The only net-new primitives are the Recharts bar chart and SVG gauge.

---

## Common Pitfalls

### Pitfall 1: TrendIndicator Color Semantics
**What goes wrong:** Passing `direction="up"` for "Active Jobs Open" increase renders a green arrow, but an increase in open jobs is bad (should be red).
**Why it happens:** `TrendIndicator` hardcodes `up = text-positive, down = text-negative` with no override.
**How to avoid:** Add an `isGood?: boolean` prop to `TrendIndicator` that overrides color. Defaults to `true` (up=green). When `isGood=false`, up=red and down=green. KPICard passes `isGood` through its `trend` prop shape.
**Warning signs:** Green arrow on "Active Jobs Open" when the number went up.

### Pitfall 2: Recharts Not Installed
**What goes wrong:** Build fails with `Cannot find module 'recharts'`.
**Why it happens:** Recharts is referenced in the reference JSX file but is not in `package.json` dependencies.
**How to avoid:** Run `npm install recharts` as the very first step in Wave 0 or Plan 1.
**Warning signs:** TypeScript import error on `recharts` imports.

### Pitfall 3: /vendors 404 or Redirect Loop
**What goes wrong:** PM or RM navigates to /vendors, middleware redirects to /property.
**Why it happens:** `ROLE_ALLOWED_ROUTES` does not include `/vendors` for `pm` or `rm`.
**How to avoid:** Update `auth.ts` ROLE_ALLOWED_ROUTES before or during the /vendors page implementation plan.
**Warning signs:** /vendors redirects when logged in as PM/RM role in dev.

### Pitfall 4: Bell/Notifications in Layout Test
**What goes wrong:** After removing Bell nav item from Sidebar, `layout.test.tsx` fails with `expect(links.length).toBeGreaterThanOrEqual(5)`.
**Why it happens:** The test checks for 5+ links (Dashboard, Properties, Vendors, Notifications, Settings = 5). Removing Notifications drops it to 4.
**How to avoid:** Update the layout test to `toBeGreaterThanOrEqual(4)` when removing the Bell item.
**Warning signs:** `layout.test.tsx` failing after sidebar change.

### Pitfall 5: Health Score with No Completed Turns
**What goes wrong:** Division by zero when computing `(completedOnTime / totalWithData) * 100`.
**Why it happens:** Edge case — no turn requests have `daysVacantUntilReady` populated.
**How to avoid:** Return a safe default (e.g., 0 or null) when `totalWithData === 0`, and render the gauge in a "no data" state.

### Pitfall 6: Vendor Table — null avgCompletionTimeDays Sort
**What goes wrong:** Vendors with `null` avgCompletionTimeDays float to top or bottom unpredictably.
**Why it happens:** `null` comparison in `.sort()` is undefined behavior.
**How to avoid:** Treat `null` as `-Infinity` for descending sort (sorts to bottom) or `Infinity` for ascending (also sorts to bottom). The example pattern above already handles this with `?? -Infinity`.

### Pitfall 7: Recharts ResponsiveContainer Height 0
**What goes wrong:** Chart renders with 0px height and is invisible.
**Why it happens:** `ResponsiveContainer` with `height="100%"` inside a flex container with no explicit height collapses.
**How to avoid:** Always pass a fixed pixel `height` number to `ResponsiveContainer` (e.g., `height={200}`), not a percentage.

---

## Code Examples

### Health Score Computation (pure function)
```typescript
// Derives health score integer (0–100) from turn requests
// Source: CONTEXT.md spec + reference threshold logic
export function computeHealthScore(turnRequests: TurnRequest[]): number | null {
  const withData = turnRequests.filter(tr => tr.daysVacantUntilReady !== null);
  if (withData.length === 0) return null;
  const onTime = withData.filter(tr => (tr.daysVacantUntilReady ?? 0) <= 10);
  return Math.round((onTime.length / withData.length) * 100);
}
```

### Vendor Cost Data Derivation (for bar chart)
The `Vendor` type does not include a `cost` field directly. The bar chart in the reference uses "cost per turn" — in this project that maps to `avgCompletionTimeDays` (not a dollar cost) or a derived value. **IMPORTANT:** The CONTEXT.md says "horizontal bar chart showing cost per turn by vendor" but `fetchVendors()` returns `avgCompletionTimeDays`, not a cost figure.

Resolution: The bar chart Y-axis should use `avgCompletionTimeDays` (average completion time as the performance metric), not a dollar cost — because Airtable vendor records don't expose per-vendor cost rollups to the dashboard. The chart becomes "Avg Completion Time by Vendor" rather than "Cost per Turn by Vendor." This is the pragmatic interpretation given available data. The CONTEXT.md labels it a "cost bar chart" but the visual form (horizontal bars, color-coded by threshold) applies identically to completion time.

```typescript
// Derive chart data from fetchVendors() result
const chartData = vendors
  .filter(v => v.avgCompletionTimeDays !== null)
  .sort((a, b) => (b.avgCompletionTimeDays ?? 0) - (a.avgCompletionTimeDays ?? 0))
  .map(v => ({
    vendorName: v.vendorName,
    days: v.avgCompletionTimeDays,
  }));
```

### Extended KPI Trend Computation
```typescript
// Extend computeExecutiveKPIs to return trend data
// Pass jobs sliced into current/previous 30-day windows
export function computeKPITrend(
  currentJobs: Job[],
  prevJobs: Job[],
  currentTRs: TurnRequest[],
  prevTRs: TurnRequest[]
): { jobsCompleted: TrendData; activeJobs: TrendData; avgTime: TrendData } {
  // jobsCompleted: count Completed in window
  // activeJobs: count non-Completed in window
  // avgTime: avg timeToCompleteUnit for Done TRs
}

type TrendData = { direction: 'up' | 'down'; percentage: number } | null;
```

### Sidebar Notification Removal
```typescript
// sidebar.tsx — remove Bell import and nav item
// Before:
import { LayoutDashboard, Building2, Users, Bell, Settings, LogOut } from 'lucide-react';
const navItems = [
  { icon: LayoutDashboard, label: 'Dashboard', href: '/' },
  { icon: Building2, label: 'Properties', href: '/property' },
  { icon: Users, label: 'Vendors', href: '/vendors' },
  { icon: Bell, label: 'Notifications', href: '/notifications' },  // REMOVE
  { icon: Settings, label: 'Settings', href: '/settings' },
];

// After:
import { LayoutDashboard, Building2, Users, Settings, LogOut } from 'lucide-react';
const navItems = [
  { icon: LayoutDashboard, label: 'Dashboard', href: '/' },
  { icon: Building2, label: 'Properties', href: '/property' },
  { icon: Users, label: 'Vendors', href: '/vendors' },
  { icon: Settings, label: 'Settings', href: '/settings' },
];
// Same change required in bottom-tab-bar.tsx (remove Bell from tabItems)
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Recharts v1 peer deps (react, react-dom separate) | Recharts v2 works directly with React 19 | Recharts 2.x | No special peer dep config needed |
| Next.js `unstable_cache` | `use cache` + `cacheLife` + `cacheTag` | Next.js 15/16 | Project already uses this pattern consistently |

**Confirmed compatible:**
- Recharts 2.x works with React 19 (no known incompatibilities as of research date)
- Recharts is a client-side library; `'use client'` directive required on any component using it

---

## Open Questions

1. **Vendor bar chart metric: cost vs. completion time**
   - What we know: `fetchVendors()` returns `avgCompletionTimeDays`, not a dollar cost per vendor
   - What's unclear: Is there a cost rollup available in Airtable that was missed, or should the chart show completion time as the performance proxy?
   - Recommendation: Use `avgCompletionTimeDays` as the chart metric, label the chart "Avg Completion Time by Vendor (Days)". This matches available data and still produces meaningful visual differentiation. Confirm with user if needed, but proceed with this interpretation.

2. **TrendIndicator color override**
   - What we know: Current TrendIndicator hardcodes `up = text-positive`
   - What's unclear: Whether to add an `isGood` prop to TrendIndicator or invert direction for "bad-when-up" KPIs
   - Recommendation: Add `isGood?: boolean` (default `true`) to TrendIndicator. Pass `isGood={false}` for Active Jobs Open and Avg Time to Complete. This is cleaner than inverting direction (which would confuse the arrow with the actual trend).

---

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest 4.x + jsdom + @testing-library/react |
| Config file | vitest.config.ts (root) |
| Quick run command | `npm test -- --reporter=verbose` |
| Full suite command | `npm test` |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| VIZ-01 | Vendor bar chart renders with data | smoke (render) | `npm test -- src/app/(dashboard)/executive` | ❌ Wave 0 |
| VIZ-02 | Health gauge renders correct score color | unit (pure fn) | `npm test -- src/lib/kpis/health-score.test.ts` | ❌ Wave 0 |
| VIZ-03 | Trend computation returns correct direction/percentage | unit (pure fn) | `npm test -- src/lib/kpis/executive-kpis.test.ts` | ✅ (extend existing) |
| VIZ-04 | Color-coded alert cards | — | Already tested in Phase 4 | ✅ existing |
| VEND-01 | Vendor table renders and sorts | unit (render) | `npm test -- src/app/(dashboard)/vendors` | ❌ Wave 0 |

### Sampling Rate
- **Per task commit:** `npm test -- src/lib/kpis/`
- **Per wave merge:** `npm test`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `src/lib/kpis/health-score.test.ts` — unit tests for `computeHealthScore` covering null case, boundary thresholds (score >= 88, >= 75, < 75)
- [ ] `src/app/(dashboard)/executive/_components/executive-charts.test.tsx` — smoke test: renders HealthGauge and VendorCostChart without throwing
- [ ] `src/app/(dashboard)/vendors/_components/vendor-table.test.tsx` — renders table rows, sort click changes order
- [ ] `npm install recharts` — required before any chart test can import Recharts components

---

## Sources

### Primary (HIGH confidence)
- Direct code inspection of `turn-health-dashboard.jsx` (project root) — HealthGauge SVG pattern, vendorCostData chart pattern
- Direct code inspection of `src/components/ui/trend-indicator.tsx`, `kpi-card.tsx`, `table.tsx` — confirmed existing APIs
- Direct code inspection of `src/lib/airtable/tables/vendors.ts` — confirmed `fetchVendors()` returns `avgCompletionTimeDays`, NOT a dollar cost field
- Direct code inspection of `src/lib/types/auth.ts` — confirmed ROLE_ALLOWED_ROUTES does not include `/vendors`
- Direct code inspection of `src/components/layout/sidebar.tsx` and `bottom-tab-bar.tsx` — confirmed Bell/Notifications present in both
- Direct code inspection of `src/components/layout/__tests__/layout.test.tsx` — confirmed `>= 5` link count assertion
- Direct code inspection of `package.json` — confirmed Recharts NOT installed

### Secondary (MEDIUM confidence)
- Recharts v2 React 19 compatibility: no known breaking changes in Recharts 2.x with React 19; `recharts` GitHub issues show stable support

### Tertiary (LOW confidence)
- None

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — code inspection confirmed Recharts not installed; reference file confirms Recharts API usage pattern
- Architecture: HIGH — all existing patterns confirmed via code inspection; new patterns are direct adaptations
- Pitfalls: HIGH — all pitfalls derived from direct code inspection (TrendIndicator hardcoding, auth.ts gap, test assertion, missing Recharts)

**Research date:** 2026-03-14
**Valid until:** 2026-04-14 (stable stack; Recharts 2.x is mature)
