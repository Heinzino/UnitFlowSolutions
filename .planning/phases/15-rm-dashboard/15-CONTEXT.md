# Phase 15: RM Dashboard - Context

**Gathered:** 2026-03-19
**Status:** Ready for planning

<domain>
## Phase Boundary

Regional Managers get a dedicated dashboard at `/regional` with aggregated cross-property KPIs (same 6 as PM), a sortable Property Insights table, drill-down to a PM-level view at `/regional/property/[id]`, and a color-coded Avg Turn Time vertical bar chart. Middleware routes RM role to `/regional`. Covers RMDB-01 through RMDB-05.

</domain>

<decisions>
## Implementation Decisions

### KPI Aggregation (6 boxes, 3x2 grid)
- Same 6 KPIs as PM dashboard: Active Turns, Avg Turn Time, Revenue Exposure, Completed This Period, Jobs In Progress, Turns Near Deadline
- All metrics aggregated across all RM-assigned properties
- Avg Turn Time uses simple average across ALL Done turns from all properties (not average-of-averages)
- Reuse `computePMKPIs` directly — pass all RM turn requests as one batch, no separate `computeRMKPIs` function
- No "across N properties" subtitle — KPI boxes look identical to PM ones
- Same KPICard variants: Revenue Exposure uses `alert-past` when > 0, Turns Near Deadline uses `alert-trending` when > 0

### Property Insights List
- Columns: Property Name, Active Turns, Avg Turn Time, Revenue Exposure (3 metrics per RMDB-03)
- Sortable by any column (click column headers) — same pattern as ActiveJobsTable
- Default sort: Revenue Exposure descending (worst-performing properties first)
- Rows are clickable: hover highlight + pointer cursor (like clickable turn rows on PM dashboard)
- Clicking a row navigates to drill-down view
- Empty state: "No properties assigned" heading + "Contact your administrator to get properties added to your account." body

### Drill-down Behavior
- Clicking a property navigates to `/regional/property/[id]`
- Drill-down renders PM dashboard layout: KPIs + Open Turns + Active Jobs — all scoped to that single property
- RM has full PM edit capabilities in drill-down (status dropdown, lease-ready dates, job dates/status)
- "Back to Dashboard" link at top of drill-down page (explicit, doesn't rely on browser history)
- Reuse existing PM components (PMKPIs, PMTurnList, ActiveJobs) with property scoping

### Sidebar Navigation
- RM sees both "Regional Dashboard" (/regional) and "Properties" (/property) in sidebar
- Two entry points: /regional for portfolio overview, /property for full PM-style view

### Middleware Routing
- RM role routes to `/regional` on login (update ROLE_ROUTES)
- Add `/regional` to ROLE_ALLOWED_ROUTES for RM
- Keep `/property` in ROLE_ALLOWED_ROUTES for RM (accessible via sidebar)

### Avg Turn Time Bar Chart
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

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Requirements and roadmap
- `.planning/REQUIREMENTS.md` — RMDB-01 through RMDB-05 define exact acceptance criteria
- `.planning/ROADMAP.md` §Phase 15 — Success criteria, phase goal, dependencies

### Prior phase context
- `.planning/phases/13-pm-dashboard-redesign/13-CONTEXT.md` — PM dashboard decisions (KPI definitions, ActiveJobsTable, Revenue Exposure formula, turn closing contract)
- `.planning/phases/06-district-manager-view/06-CONTEXT.md` — Original DM→RM rename decisions, role routing

### Existing PM dashboard code (reuse for drill-down)
- `src/app/(dashboard)/property/page.tsx` — PM page layout with Suspense boundaries
- `src/app/(dashboard)/property/_components/pm-kpis.tsx` — PMKPIs component (reuse directly)
- `src/app/(dashboard)/property/_components/pm-turn-list.tsx` — PMTurnList component (reuse)
- `src/app/(dashboard)/property/_components/active-jobs.tsx` — ActiveJobs wrapper (reuse)
- `src/app/(dashboard)/property/_components/active-jobs-table.tsx` — Sortable jobs table (reuse)

### KPI computation
- `src/lib/kpis/pm-kpis.ts` — computePMKPIs function (reuse for RM aggregated KPIs)

### Chart pattern
- `src/app/(dashboard)/executive/_components/vendor-completion-chart.tsx` — Recharts BarChart pattern with color-coded cells (adapt for Avg Turn Time)

### Auth and routing
- `src/lib/types/auth.ts` — ROLE_ROUTES, ROLE_ALLOWED_ROUTES, ROLE_LABELS (update for /regional)
- `src/lib/supabase/middleware.ts` — Role-based routing logic (update RM destination)

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `computePMKPIs` (src/lib/kpis/pm-kpis.ts): Reuse directly for aggregated RM KPIs — pass all turns as one batch
- `PMKPIs` component (src/app/(dashboard)/property/_components/pm-kpis.tsx): Reuse in drill-down view, accepts assignedProperties + role props
- `PMTurnList` component: Reuse in drill-down, already handles property scoping
- `ActiveJobs` + `ActiveJobsTable`: Reuse in drill-down, sortable with status/date editing
- `KPICard` (src/components/ui/kpi-card.tsx): default, highlighted, alert-past, alert-trending variants
- `Table` compound component (src/components/ui/table.tsx): Reuse for Property Insights table
- `Card` (src/components/ui/card.tsx): Container for chart and table sections
- `VendorCompletionChart` pattern: Recharts BarChart with Cell-based coloring — adapt for vertical Avg Turn Time chart
- `fetchTurnRequestsForUser()`: Data fetch with caching + rate limiting, accepts role + property IDs

### Established Patterns
- `_components/` directory for page-specific components
- Suspense wraps data-fetching children, page.tsx is synchronous
- `use cache` + `cacheLife` + `cacheTag` for server-side caching
- Sortable table: useState for sortCol/sortDir, click handlers on headers, ChevronUp/ChevronDown icons
- Optimistic UI + Sonner toast for writes

### Integration Points
- New route: `src/app/(dashboard)/regional/page.tsx` — RM dashboard
- New route: `src/app/(dashboard)/regional/property/[id]/page.tsx` — drill-down
- Update `src/lib/types/auth.ts`: ROLE_ROUTES.rm → '/regional', add '/regional' to ROLE_ALLOWED_ROUTES.rm
- Update sidebar to show "Regional Dashboard" nav item for RM role
- Per-property KPI computation: call computePMKPIs per property for Property Insights rows and chart data

</code_context>

<specifics>
## Specific Ideas

- RM daily loop: scan aggregated KPIs -> identify problem properties via Property Insights -> drill down to take action on specific turns/jobs
- Revenue Exposure default sort on Property Insights surfaces worst-performing properties immediately
- Drill-down at /regional/property/[id] gives RM full PM capability without leaving their /regional context
- Both sidebar links give RM flexibility: /regional for portfolio overview, /property for when they want the full PM experience

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 15-rm-dashboard*
*Context gathered: 2026-03-19*
