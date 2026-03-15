# Phase 7: Notifications, Charts, and Vendor Metrics - Context

**Gathered:** 2026-03-15
**Status:** Ready for planning

<domain>
## Phase Boundary

Data visualizations (health gauge, vendor bar chart), trend indicators on executive KPI cards, and a vendor performance table on a dedicated /vendors page. Notification panel has been descoped — the existing alert card system on exec and PM dashboards is sufficient. Layout remains two-column (sidebar + main).

Requirements covered: VIZ-01, VIZ-02, VIZ-03, VIZ-04, VEND-01
Requirements descoped: NOTIF-01, NOTIF-02, NOTIF-03, NOTIF-04 (notifications dropped — alert cards are sufficient)

</domain>

<decisions>
## Implementation Decisions

### Notifications (DESCOPED)
- Notification panel removed entirely — no third column, no notification feed
- Remove Bell/"Notifications" nav item from sidebar
- Layout stays two-column (sidebar + main content)
- Existing pink/yellow alert cards on exec and PM dashboards already surface attention items
- NOTIF-01 through NOTIF-04 marked as descoped in REQUIREMENTS.md

### Charts & Visualizations
- Use **Recharts** library for all charts (bar charts, line charts if needed)
- Reference: `turn-health-dashboard.jsx` in project root — use as visual style guide
- Two charts on executive dashboard:
  1. **Health Gauge** — SVG semi-circular arc (like HealthGauge in reference file), showing on-time completion rate (percentage of turns completed with daysVacantUntilReady <= 10). Green/amber/red coloring based on score thresholds.
  2. **Vendor cost bar chart** — Horizontal bar chart showing cost per turn by vendor, color-coded by cost threshold (like vendorCostData in reference file). Uses Recharts BarChart with layout="vertical".
- Charts appear below existing KPI cards and alert cards on executive dashboard
- VIZ-04 (color-coded alert cards) already implemented in Phase 4 — pink for past target, yellow for trending

### Trend Indicators (VIZ-03)
- Wire `TrendIndicator` component (already built in Phase 1) to executive KPI cards only — not PM dashboard
- Comparison window: current 30 days vs previous 30 days
- Only meaningful KPI cards get trends: Jobs Completed, Active Jobs Open, Avg Time to Complete
- Skip trends for: Backlog Delta (already a delta), Projected Cost Exposure (cumulative MTD), Jobs Trending Past Target (point-in-time)
- Trend direction: up is green for Jobs Completed, up is red for Active Jobs Open and Avg Time to Complete (more = worse)

### Vendor Metrics Table (VEND-01)
- Dedicated **/vendors** page — sidebar Vendors nav item already exists
- Accessible to **all roles** (PM, RM, exec) — no role restriction
- Columns: Vendor Name, Num Jobs Completed, Average Completion Time (Days), Num Jobs Assigned, Jobs (linked ID badges)
- **Sortable columns** — click column header to sort ascending/descending, client-side sort
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

</decisions>

<specifics>
## Specific Ideas

- Reference `turn-health-dashboard.jsx` for visual style — the HealthGauge SVG pattern and MetricCard layout are the target aesthetic
- Health gauge should use the same green/amber/red thresholds as the reference: >= 88 Healthy, >= 75 At Risk, < 75 Critical
- Vendor bar chart uses horizontal layout with vendor names on Y-axis (matches reference vendorCostData chart)
- Executive dashboard should remain scannable — charts enhance, not overwhelm

</specifics>

<code_context>
## Existing Code Insights

### Reusable Assets
- `TrendIndicator` (src/components/ui/trend-indicator.tsx): Already built with up/down arrows + percentage. Needs data wiring only.
- `KPICard` (src/components/ui/kpi-card.tsx): Has all variants (default, highlighted, alert-past, alert-trending). TrendIndicator can slot in.
- `Table` compound component (src/components/ui/table.tsx): Reuse for vendor metrics table. Add sortable header pattern.
- `Badge` (src/components/ui/badge.tsx): For linked job badges in vendor table.
- `Skeleton` (src/components/ui/skeleton.tsx): Loading states for charts and table.
- `fetchVendors()` (src/lib/airtable/tables/vendors.ts): Returns vendorName, vendorType, numJobsCompleted, numJobsAssigned, avgCompletionTimeDays.
- `turn-health-dashboard.jsx` (project root): Reference implementation with HealthGauge, vendor bar chart, trend lines — use as style guide.

### Established Patterns
- `_components/` directory for page-specific components (Phase 4/5 pattern)
- Suspense wraps data-fetching child, page.tsx is synchronous (Phase 4 pattern)
- `use cache` + `cacheLife` + `cacheTag` for data fetching (Phase 3)
- Sidebar nav items defined in src/components/layout/sidebar.tsx — remove Bell/Notifications entry

### Integration Points
- Executive dashboard: `src/app/(dashboard)/executive/page.tsx` — add chart section below existing KPIs
- Executive KPIs: wire TrendIndicator into KPICard renders in executive dashboard component
- Vendors page: `src/app/(dashboard)/vendors/page.tsx` — new page, sidebar already links to /vendors
- Sidebar: `src/components/layout/sidebar.tsx` — remove Bell/Notifications nav item
- ROLE_ALLOWED_ROUTES in auth.ts — add /vendors to allowed routes for all roles

</code_context>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 07-notifications-charts-and-vendor-metrics*
*Context gathered: 2026-03-15*
