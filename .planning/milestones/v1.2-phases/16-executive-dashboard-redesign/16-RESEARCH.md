# Phase 16: Executive Dashboard Redesign - Research

**Researched:** 2026-03-19
**Domain:** Next.js server components, dashboard UI, KPI cards, data table, compute functions
**Confidence:** HIGH

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**KPI Box Definitions (6 total, 3x2 grid)**
- Same 6 metrics as current executive dashboard — NOT mirroring PM/RM set
- Row 1: Active Jobs Open, Jobs Trending Past Target, Jobs Completed (30d)
- Row 2: Backlog Delta, Avg Time to Complete, Projected Cost Exposure
- Compute functions (`computeExecutiveKPIs`, `computeKPITrends`) remain — same logic, new presentation

**KPI Contextual Subtitles (via footer prop)**
Each card gets a contextual subtitle rendered via KPICard's `footer` prop:
- **Active Jobs Open**: "{backlogDelta} backlog delta this week"
- **Jobs Trending Past Target**: "{percentage}% of active jobs at risk"
- **Jobs Completed (30d)**: "↓ {X}% vs prior 30 days" (or ↑, from trend data)
- **Backlog Delta**: "More opening than closing" (or "More closing than opening" when negative)
- **Avg Time to Complete**: "↑ {X}% over target · target 8 days" (uses trend data + hardcoded 8-day target reference)
- **Projected Cost Exposure**: "~$60/unit on delayed jobs"

**KPI Trend Arrows**
- Trend arrows on same 3 cards as current: Active Jobs Open, Jobs Completed (30d), Avg Time to Complete
- Other 3 cards: no trend arrows
- `computeKPITrends` function reused as-is

**KPI Card Variants**
- No alert variants (alert-past, alert-trending) on any of the 6 KPI boxes
- All 6 use default KPICard variant

**Top 10 Properties by Revenue Exposure**
- Two columns only: Property Name, Revenue Exposure ($)
- Fixed ranking: always sorted by Revenue Exposure descending — NOT sortable by user
- Static display only — rows are not clickable, no drill-down
- Show all available properties up to 10 (if 6 exist, show 6)
- Only include properties with exposure > $0
- Empty state: "No properties with revenue exposure" when all properties are at $0
- Table title stays "Top 10 Properties by Revenue Exposure" regardless of actual count
- Wrapped in a Card component with heading (matches RM chart card pattern)

**Removed Content**
- Turn Overview section (Active Turns Open card) — removed entirely
- Alert cards (Turns Past Target Time, Turns Trending Past Target Date) — removed entirely
- Vendor Completion Chart — removed entirely
- Health Gauge — removed entirely
- Delete all unused code: health-gauge.tsx, vendor-completion-chart.tsx, executive-charts.tsx, executive-charts-skeleton.tsx, and any orphaned compute functions/types

**Layout & Structure**
- Welcome header stays: "Executive Dashboard" + "Welcome, {name} — {date}"
- 3x2 KPI grid (3 columns desktop, 1 column mobile)
- Top 10 Properties table below KPI grid, inside a Card
- Page structure: Header → KPIs (Suspense) → Top 10 Table (Suspense)

### Claude's Discretion
- Loading skeleton design for the simplified page
- Exact icon choices for KPI cards (can keep current or update)
- Mobile responsive treatment for Top 10 table
- How to compute per-property revenue exposure for the Top 10 (group turns by property, sum exposure per property)
- Whether to keep or simplify the ExecutiveKPIResult interface after removing alerts

### Deferred Ideas (OUT OF SCOPE)
None — discussion stayed within phase scope.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| EXEC-01 | Executive dashboard displays 6 redesigned KPI boxes (portfolio-level metrics) | KPICard footer prop confirmed working; computeExecutiveKPIs provides all 6 metric values; contextual subtitle formulas defined |
| EXEC-02 | Executive can view Top 10 Properties by Revenue Exposure ranked table | Per-property revenue exposure computation pattern established (Phase 15 PropertyInsights); computePMKPIs reusable; Card + Table compound components confirmed |
</phase_requirements>

## Summary

Phase 16 redesigns the executive dashboard from its current form (KPIs + Turn Overview + Alert Cards + Charts) to a simpler, higher-signal layout: 6 KPI boxes with contextual subtitles + a Top 10 Properties by Revenue Exposure table. All chart and alert components are deleted.

The technical work is well-bounded. The KPI compute functions (`computeExecutiveKPIs`, `computeKPITrends`) are already correct and need no logic changes — only the presentation layer changes. The Top 10 Properties table requires a new per-property revenue exposure computation that groups turn requests by `propertyName`, applies the same `$60/day` formula used in PM KPIs (`computePMKPIs`), sorts descending, slices to 10, and filters out $0 entries. The Pattern for this grouping is already established in `PropertyInsights` (Phase 15). The Card-wrapped table with heading pattern is established and can be copied verbatim from `property-insights.tsx`.

The deletion work (health-gauge.tsx, vendor-completion-chart.tsx, executive-charts.tsx, executive-charts-skeleton.tsx, health-score.ts) must also delete the corresponding test file (`executive-charts.test.tsx`) since it tests deleted functionality. The `health-score.test.ts` file covers `health-score.ts` which is also deleted.

**Primary recommendation:** Build in two plans — (1) KPI redesign with footer subtitles + skeleton update + interface cleanup, (2) Top 10 Properties table new component + deletions + page restructure.

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| React / Next.js | 15.x (app router) | Server components, Suspense, routing | Project foundation |
| TypeScript | 5.x | Type safety | Project standard |
| Tailwind CSS | 3.x | Styling | Project standard |
| Lucide React | latest | Icons for KPI cards | Already used in executive-kpis.tsx |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| KPICard (`src/components/ui/kpi-card.tsx`) | local | KPI display with footer, trend, icon | All 6 KPI boxes |
| Card (`src/components/ui/card.tsx`) | local | Card wrapper with bg-card/rounded-card styling | Top 10 table container |
| Table compound (`src/components/ui/table.tsx`) | local | Table, TableHeader, TableBody, TableRow, TableHead, TableCell | Top 10 Properties table |
| CurrencyDisplay (`src/components/ui/currency-display.tsx`) | local | Format Revenue Exposure dollar amounts | Revenue Exposure column |
| Skeleton (`src/components/ui/skeleton.tsx`) | local | Loading state primitives | Skeleton components |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Reusing `computePMKPIs` for per-property exposure | New dedicated function | computePMKPIs already has the exact $60/day formula — no reason to duplicate logic |
| Inline Intl.NumberFormat | CurrencyDisplay | CurrencyDisplay is the project standard for dollar values |

**Installation:** No new packages required — all dependencies already in the project.

## Architecture Patterns

### Recommended Project Structure
```
src/app/(dashboard)/executive/
├── page.tsx                           # Simplified: Header → KPIs (Suspense) → Top10 (Suspense)
└── _components/
    ├── executive-kpis.tsx             # MODIFIED: add footer subtitles, remove alert/turn-overview code
    ├── executive-kpi-skeleton.tsx     # MODIFIED: remove Turn Overview skeleton section
    ├── executive-top10.tsx            # NEW: Top 10 Properties by Revenue Exposure
    ├── executive-top10-skeleton.tsx   # NEW: Loading skeleton for Top 10 table (or inline in top10.tsx)
    ├── executive-charts.tsx           # DELETED
    ├── executive-charts-skeleton.tsx  # DELETED
    ├── executive-charts.test.tsx      # DELETED (tests deleted component)
    ├── health-gauge.tsx               # DELETED
    └── vendor-completion-chart.tsx    # DELETED

src/lib/kpis/
├── executive-kpis.ts                  # MODIFIED: remove activeTurnsOpen, pastTargetAlerts, trendingAlerts from interface
├── executive-kpis.test.ts             # MODIFIED: remove tests for deleted fields
├── health-score.ts                    # DELETED
└── health-score.test.ts               # DELETED
```

### Pattern 1: KPICard with Contextual Footer Subtitle
**What:** Pass a `footer` prop (React.ReactNode) to KPICard to render a contextual subtitle below the value
**When to use:** All 6 KPI cards in the redesigned executive-kpis.tsx
**Example:**
```typescript
// Source: src/components/ui/kpi-card.tsx (Phase 13 established pattern)
<KPICard
  icon={Briefcase}
  label="Active Jobs Open"
  value={kpis.activeJobsOpen}
  trend={trends.activeJobsOpen ? { ...trends.activeJobsOpen, isGood: false } : undefined}
  footer={
    <p className="text-xs text-text-secondary">
      {kpis.backlogDelta} backlog delta this week
    </p>
  }
/>
```

### Pattern 2: Card-Wrapped Table with Heading (RM Dashboard Pattern)
**What:** A Card component with a heading row (border-b) followed by a Table compound component
**When to use:** Top 10 Properties table
**Example:**
```typescript
// Source: src/app/(dashboard)/regional/_components/property-insights.tsx
<Card>
  <div className="px-6 py-3 border-b border-border">
    <h2 className="font-heading text-xl font-bold text-text-primary">
      Top 10 Properties by Revenue Exposure
    </h2>
  </div>
  <Table>
    {/* ... */}
  </Table>
</Card>
```

### Pattern 3: Per-Property Revenue Exposure Computation
**What:** Group turn requests by propertyName, call `computePMKPIs` per property, extract revenueExposure, sort desc, filter > $0, slice 10
**When to use:** In the new `ExecutiveTop10` server component
**Example:**
```typescript
// Source: established in src/app/(dashboard)/regional/_components/property-insights.tsx
// Adapt: extract unique property names from turnRequests (not from user metadata)
const byProperty = new Map<string, TurnRequest[]>()
for (const tr of turnRequests) {
  const group = byProperty.get(tr.propertyName) ?? []
  group.push(tr)
  byProperty.set(tr.propertyName, group)
}

const propertyExposure = [...byProperty.entries()]
  .map(([propertyName, turns]) => ({
    propertyName,
    revenueExposure: computePMKPIs(turns).revenueExposure,
  }))
  .filter((p) => p.revenueExposure > 0)
  .sort((a, b) => b.revenueExposure - a.revenueExposure)
  .slice(0, 10)
```

**Important difference from RM:** The RM's PropertyInsights receives `assignedProperties` from user metadata to determine which properties to show. The executive dashboard should derive property names directly from `turnRequests` records — no user-level property scoping. This means no `assignedProperties` prop needed on the Top 10 component.

### Pattern 4: Suspense Boundary in page.tsx
**What:** page.tsx is synchronous; data-fetching children are wrapped in Suspense with skeletons
**When to use:** Both ExecutiveKPIs and ExecutiveTop10 components
**Example:**
```typescript
// Source: src/app/(dashboard)/executive/page.tsx (current pattern)
<Suspense fallback={<ExecutiveKPISkeleton />}>
  <ExecutiveKPIs />
</Suspense>
<Suspense fallback={<ExecutiveTop10Skeleton />}>
  <ExecutiveTop10 />
</Suspense>
```

### Pattern 5: Contextual Subtitle String Construction
**What:** Each KPI's footer subtitle is computed from the already-available kpis/trends data
**When to use:** executive-kpis.tsx when building the 6 footer strings
```typescript
// Jobs Trending Past Target: "{percentage}% of active jobs at risk"
// Uses kpis.activeJobsOpen as denominator
const riskPercent = kpis.activeJobsOpen > 0
  ? Math.round((kpis.jobsTrendingPastTarget / kpis.activeJobsOpen) * 100)
  : 0

// Jobs Completed (30d): "↓ X% vs prior 30 days" or "↑ X% vs prior 30 days"
// Requires trends.jobsCompleted (TrendData)
const completedTrendSubtitle = trends.jobsCompleted
  ? `${trends.jobsCompleted.direction === 'up' ? '↑' : '↓'} ${Math.round(trends.jobsCompleted.percentage)}% vs prior 30 days`
  : 'No prior period data'

// Avg Time to Complete: "↑ X% over target · target 8 days"
// Uses trends.avgTimeToComplete
const avgTimeTrendSubtitle = trends.avgTimeToComplete
  ? `${trends.avgTimeToComplete.direction === 'up' ? '↑' : '↓'} ${Math.round(trends.avgTimeToComplete.percentage)}% over target · target 8 days`
  : 'target 8 days'

// Backlog Delta: "More opening than closing" / "More closing than opening"
const backlogSubtitle = kpis.backlogDelta >= 0
  ? 'More opening than closing'
  : 'More closing than opening'
```

### Anti-Patterns to Avoid
- **Fetching vendors or calling computeHealthScore in the new implementation:** These are only used by deleted components. The ExecutiveTop10 component only needs `fetchTurnRequests()`.
- **Adding sortability to the Top 10 table:** Locked decision — fixed sort only, no user sorting.
- **Making table rows clickable:** Static display only per locked decisions.
- **Using alert-past or alert-trending variants on KPI cards:** All 6 use default variant.
- **Keeping activeTurnsOpen, pastTargetAlerts, trendingAlerts in ExecutiveKPIResult:** These fields are computed for removed UI sections and should be removed from the interface to avoid dead code.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Currency formatting | Custom `$` + `.toFixed()` | `CurrencyDisplay` component | Project standard, handles edge cases, tabular-nums already set |
| Revenue Exposure formula | New formula | `computePMKPIs(turns).revenueExposure` | Identical formula already tested, single source of truth |
| KPI trend display | Custom arrow/percent | `TrendIndicator` via KPICard `trend` prop | Already handles up/down/good/bad semantics |
| Card container styling | Custom `bg-card rounded-card` | `Card` component | Consistent border, shadow, background |

**Key insight:** The revenue exposure computation for per-property grouping already exists in PM KPIs — there's no need to re-derive the formula. Pass the per-property turn request arrays directly to `computePMKPIs`.

## Common Pitfalls

### Pitfall 1: Forgetting to Delete the executive-charts.test.tsx File
**What goes wrong:** The test file references `ExecutiveCharts`, `fetchVendors`, and `HealthGauge` — all deleted. If the test file is left in place, `vitest` will fail on the deleted imports.
**Why it happens:** Test files for deleted components are easy to overlook.
**How to avoid:** Explicitly include `executive-charts.test.tsx` in the deletion task.
**Warning signs:** `vitest` run fails with "Cannot find module './executive-charts'" after deletion.

### Pitfall 2: Forgetting to Delete health-score.ts and health-score.test.ts
**What goes wrong:** `health-score.ts` is only consumed by `executive-charts.tsx` (via `computeHealthScore`). When `executive-charts.tsx` is deleted, `health-score.ts` becomes dead code. Its test file (`health-score.test.ts`) would still pass but is testing orphaned logic.
**Why it happens:** The health-score module lives in `src/lib/kpis/` alongside active files, easy to miss.
**How to avoid:** Include both files in the deletion list explicitly.

### Pitfall 3: ExecutiveKPIResult Interface Has Fields for Removed Features
**What goes wrong:** `activeTurnsOpen`, `pastTargetAlerts`, `trendingAlerts` are computed in `computeExecutiveKPIs` for the now-removed Turn Overview and Alert Cards sections. Leaving them in creates dead computation and an inaccurate interface.
**Why it happens:** Interface cleanup is easy to defer.
**How to avoid:** Remove the three fields from `ExecutiveKPIResult`, remove their computation from `computeExecutiveKPIs`, and update `executive-kpis.test.ts` to remove the corresponding test cases.
**Warning signs:** TypeScript compiler still compiles — this is a silent dead code issue, not a type error.

### Pitfall 4: Per-Property Revenue Exposure Uses Wrong Grouping Source
**What goes wrong:** The RM's PropertyInsights receives `assignedProperties` (from user metadata) and groups turns only for those properties. For the executive Top 10, the user has no property assignments — you must derive property names from the turn requests themselves.
**Why it happens:** Copying RM pattern without adapting the property source.
**How to avoid:** Derive unique property names from `turnRequests` directly using `tr.propertyName` as the map key. Do NOT pass `assignedProperties` to the Top 10 component.

### Pitfall 5: KPI Footer Subtitle When Data Is Absent
**What goes wrong:** Some subtitles depend on trend data that may be `null` (e.g., `trends.jobsCompleted` is null when the previous period has zero completions). Rendering `null.direction` crashes.
**Why it happens:** TrendData is typed `{ direction; percentage } | null`.
**How to avoid:** Always guard: `trends.jobsCompleted ? ... : 'No prior period data'` (or a neutral fallback string).

### Pitfall 6: Stale Import References in page.tsx After Deletions
**What goes wrong:** `executive/page.tsx` currently imports `ExecutiveCharts` and `ExecutiveChartsSkeleton`. After deletion, these imports become broken.
**Why it happens:** page.tsx needs to be updated in the same task that deletes the files.
**How to avoid:** The plan task that deletes chart components must also update `page.tsx` to remove those imports and their Suspense boundaries.

## Code Examples

Verified patterns from existing codebase:

### KPICard Footer Prop Usage
```typescript
// Source: src/components/ui/kpi-card.tsx — footer renders with border-t separator
{footer && (
  <div className="mt-2 pt-2 border-t border-black/10">
    {footer}
  </div>
)}
```

### Card Heading Row Pattern (RM Dashboard)
```typescript
// Source: src/app/(dashboard)/regional/_components/property-insights.tsx
<Card>
  <div className="px-6 py-3 border-b border-border">
    <h2 className="font-heading text-xl font-bold text-text-primary">Property Insights</h2>
  </div>
  <PropertyInsightsTable data={propertyStats} />
</Card>
```

### Static (Non-Sortable) Table with CurrencyDisplay
```typescript
// Source: adapted from src/app/(dashboard)/regional/_components/property-insights-table.tsx
// For Top 10: no useState for sort, no 'use client', pure server-rendered table
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table'
import { CurrencyDisplay } from '@/components/ui/currency-display'

// In a server component (no 'use client' needed since no interactivity):
<Table>
  <TableHeader>
    <TableRow>
      <TableHead className="text-left">Property Name</TableHead>
      <TableHead className="text-right">Revenue Exposure</TableHead>
    </TableRow>
  </TableHeader>
  <TableBody>
    {rows.map((row) => (
      <TableRow key={row.propertyName}>
        <TableCell className="text-left">{row.propertyName}</TableCell>
        <TableCell className="text-right">
          <CurrencyDisplay amount={row.revenueExposure} />
        </TableCell>
      </TableRow>
    ))}
  </TableBody>
</Table>
```

### Skeleton for Card-Wrapped Table
```typescript
// Source: adapted from src/app/(dashboard)/regional/_components/property-insights-skeleton.tsx
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

export function ExecutiveTop10Skeleton() {
  return (
    <Card>
      <div className="px-6 py-3 border-b border-border">
        <h2 className="font-heading text-xl font-bold text-text-primary">
          Top 10 Properties by Revenue Exposure
        </h2>
      </div>
      <div className="flex flex-col gap-2 p-6">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-10 w-full" />
        ))}
      </div>
    </Card>
  )
}
```

### ExecutiveKPISkeleton Simplified (Remove Turn Overview Section)
```typescript
// Current executive-kpi-skeleton.tsx has a Turn Overview skeleton section — DELETE it
// Simplified version: only 6 KPI cards, no Turn Overview block, no chart skeleton
export function ExecutiveKPISkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      {Array.from({ length: 6 }).map((_, i) => (
        <KPICard key={i} loading={true} icon={Activity} label="" value="" />
      ))}
    </div>
  )
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| KPI cards with no footer/subtitle | KPICard footer prop for contextual subtitles | Phase 13 | Subtitles render inside card box with border-t separator |
| Separate DM/RM compute | Reuse computePMKPIs for cross-property aggregation | Phase 15 | No separate RM compute function needed |
| Charts section with health gauge + vendor chart | Removed entirely | Phase 16 | Simpler page, no Recharts dependency needed on executive page |

**Deprecated/outdated as of Phase 16:**
- `ExecutiveCharts` component: replaced by nothing — section is removed
- `HealthGauge` component: removed — no replacement
- `VendorCompletionChart` on executive page: removed — no replacement
- `computeHealthScore` function: removed — no consumer after executive-charts.tsx deleted
- `activeTurnsOpen`, `pastTargetAlerts`, `trendingAlerts` in `ExecutiveKPIResult`: removed — Turn Overview and Alert Card sections gone

## Open Questions

1. **Footer text when trend data is null for Jobs Completed (30d)**
   - What we know: `trends.jobsCompleted` is null when previous 30-day period had 0 completions
   - What's unclear: Exact fallback copy — "No prior period data" vs omitting the subtitle entirely
   - Recommendation: Use a neutral fallback like `"No trend data available"` or simply show an em-dash. This is Claude's discretion territory.

2. **Top 10 table: mobile responsive treatment**
   - What we know: The `Table` component wraps in `overflow-x-auto` by default — works on mobile
   - What's unclear: Whether a card-per-row layout is preferred on mobile (like PM turn list)
   - Recommendation: Use horizontal scroll (Table default) for the Top 10 — it has only 2 columns and is low-density, scroll works fine. This is Claude's discretion territory.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest + jsdom + @testing-library/react |
| Config file | `vitest.config.ts` |
| Quick run command | `npx vitest run src/lib/kpis/executive-kpis.test.ts` |
| Full suite command | `npx vitest run` |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| EXEC-01 | 6 KPI boxes render with contextual subtitles | unit (compute) | `npx vitest run src/lib/kpis/executive-kpis.test.ts` | ✅ (update needed) |
| EXEC-01 | KPI interface has no removed fields | unit (type check) | `npx tsc --noEmit` | ✅ |
| EXEC-02 | Per-property revenue exposure groups and ranks correctly | unit (compute) | `npx vitest run src/lib/kpis/executive-kpis.test.ts` | ❌ Wave 0 — new test cases needed |
| EXEC-02 | Top 10 shows only properties with exposure > $0 | unit (compute) | same file | ❌ Wave 0 — new test cases needed |
| EXEC-02 | Empty state when all properties at $0 | unit (component) | `npx vitest run` (smoke test) | ❌ Wave 0 — optional |

### Sampling Rate
- **Per task commit:** `npx vitest run src/lib/kpis/executive-kpis.test.ts`
- **Per wave merge:** `npx vitest run`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] New test cases for per-property revenue exposure computation in `src/lib/kpis/executive-kpis.test.ts` (or a new dedicated test file for the compute function)
- [ ] Remove test cases for `activeTurnsOpen`, `pastTargetAlerts`, `trendingAlerts` from `executive-kpis.test.ts` when those fields are removed
- [ ] Delete `src/app/(dashboard)/executive/_components/executive-charts.test.tsx` — tests deleted component
- [ ] Delete `src/lib/kpis/health-score.test.ts` — tests deleted module

**Note on where to put Top 10 compute tests:** The per-property revenue exposure computation is best placed inline in the `ExecutiveTop10` server component (calling `computePMKPIs` per property group). Since `computePMKPIs` is already thoroughly tested in `pm-kpis.test.ts`, the only new tests needed are for the grouping + filtering + slicing logic. These could go in `executive-kpis.test.ts` as a new exported helper function `computeTop10ByRevenueExposure`, or be embedded in the component and covered by a smoke test.

## Sources

### Primary (HIGH confidence)
- Direct code inspection: `src/app/(dashboard)/executive/page.tsx` — confirmed current layout and imports
- Direct code inspection: `src/app/(dashboard)/executive/_components/executive-kpis.tsx` — confirmed current KPI render and alert structure
- Direct code inspection: `src/lib/kpis/executive-kpis.ts` — confirmed compute functions, interface fields, alert arrays
- Direct code inspection: `src/components/ui/kpi-card.tsx` — confirmed footer prop, variant list, TrendIndicator integration
- Direct code inspection: `src/components/ui/card.tsx` — confirmed variant="default" adds p-6
- Direct code inspection: `src/components/ui/table.tsx` — confirmed compound component API
- Direct code inspection: `src/components/ui/currency-display.tsx` — confirmed Intl.NumberFormat wrapper
- Direct code inspection: `src/app/(dashboard)/regional/_components/property-insights.tsx` — Card-wrapped table pattern with heading row
- Direct code inspection: `src/app/(dashboard)/regional/_components/property-insights-skeleton.tsx` — Skeleton pattern for Card-wrapped table
- Direct code inspection: `src/lib/kpis/pm-kpis.ts` — revenue exposure formula: `max(0, daysOffMarketUntilReady - targetDays) * 60`
- Direct code inspection: `src/lib/kpis/executive-kpis.test.ts` — confirmed existing test structure, helpers, fake timers

### Secondary (MEDIUM confidence)
- Planning context inference: `16-CONTEXT.md` decisions about subtitle strings, deletion list, layout structure
- Planning context inference: `15-CONTEXT.md` confirming Card-wrapped chart/table pattern
- Planning context inference: `13-CONTEXT.md` confirming revenue exposure rate ($60/day) and KPICard footer prop establishment

### Tertiary (LOW confidence)
None — all findings verified directly from codebase.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all libraries verified by direct code inspection
- Architecture: HIGH — patterns copied from existing Phase 15 components
- Pitfalls: HIGH — all identified from direct code inspection of files being modified/deleted
- Compute patterns: HIGH — revenue exposure formula verified in pm-kpis.ts with tests

**Research date:** 2026-03-19
**Valid until:** Stable — no external dependencies; valid until codebase changes
