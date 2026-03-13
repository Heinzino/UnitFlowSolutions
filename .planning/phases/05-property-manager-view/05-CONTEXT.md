# Phase 5: Property Manager View - Context

**Gathered:** 2026-03-13
**Status:** Ready for planning

<domain>
## Phase Boundary

Core PM workflow: overdue-first turn lists, turn detail page with linked jobs, inline job status updates, PM-specific KPI cards, and property filter dropdown. This is the first view with write operations (job status updates). Covers PM-01 through PM-09.

</domain>

<decisions>
## Implementation Decisions

### Turn List Layout
- Two sections: "Make Readys Past Target Time" (overdue) displayed first, "Active Make Readys (On Schedule)" below
- Overdue section uses a pink header bar (matching alert-past KPICard variant) — strong visual alarm consistent with executive dashboard
- Overdue threshold: daysVacantUntilReady > 10 (same as executive alert cards)
- Overdue section hidden entirely when count is 0 — absence IS the good news (Phase 4 pattern)
- All PM-03 columns displayed: Property Name (badge), Unit Number, Status (pill), Ready To Lease Date, Vacant Date, Jobs (linked IDs count), Price
- Rows are clickable — navigate to turn detail page (Phase 1 pattern)
- On mobile: table transforms to stacked card list (Phase 1 pattern)

### Turn Detail Page
- Route: /property/turn/[id] — separate page, bookmarkable, browser history works naturally
- Header section: turn summary (unit, property, dates, status, price)
- Explicit "← Back to turns" link at top of detail page
- Jobs displayed in a table below the header (reuses Table component)
- All PM-07 job columns: Job ID, Vendor Name, Vendor Type, Status badge (dropdown), Start Date, End Date, Price

### Inline Status Updates
- Status badge in job table is a clickable dropdown showing all 5 valid statuses (NEEDS ATTENTION, Blocked, In Progress, Completed, Ready)
- Current status shown with checkmark in dropdown
- All status changes are instant — no confirmation dialog for any transition
- Optimistic UI: badge updates immediately, reverts on failure (Phase 3 decision)
- Subtle success toast: "Job #51 updated to Completed" — auto-dismisses in 3s, non-blocking
- Failure toast: "Failed to update status. Please try again." with optimistic revert (Phase 3 decision)
- Status updates available on BOTH the turn list page AND the turn detail page
- Turn list: status dropdown per row for quick updates without drilling in
- Detail page: same dropdown pattern in the job table

### PM KPI Cards
- 6 KPI cards in 3x2 grid above the turn tables (same layout pattern as executive dashboard)
- Row 1: Active Make Readys | Make Readys Completed (30d) | Make Readys Completed (7d)
- Row 2: Average Make Ready Time | Projected Spend (MTD) | Make Readys Past Target Time
- "Make Readys Past Target Time" uses pink alert-past variant (when count > 0, regular white when 0)
- KPIs filter to selected property when PM uses property dropdown — everything on page reflects same scope

### Property Filter Dropdown
- "All Properties" is the default selection (shows combined data across assigned properties)
- Individual properties listed below for drill-down
- Dropdown hidden when PM has only one assigned property
- Reuses PropertySelectorWrapper client component (built in Phase 2)
- When property selected: both KPIs and turn list filter to that property

### Claude's Discretion
- Exact KPI computation functions (analogous to computeExecutiveKPIs from Phase 4)
- Loading skeleton arrangement matching card grid + table layout
- Page header layout (title, user info, property dropdown, refresh button placement)
- Mobile responsive adjustments for KPI grid and turn detail
- Icon choices for each KPI card
- Trend indicator logic for PM KPIs
- How "Jobs" column displays in turn list (count badge vs comma-separated IDs)
- Status dropdown component implementation (Radix UI Select or custom)

</decisions>

<specifics>
## Specific Ideas

- PMs check daily — core loop is: open → scan KPIs → spot overdue → drill into jobs → update status. The page should support this flow top-to-bottom
- Status updates on both list and detail pages means PMs can do quick triage from the list without drilling in for every job
- The pink overdue header should feel urgent — same visual language as executive alert cards
- Property dropdown filtering both KPIs and list keeps everything in sync — no mixed contexts

</specifics>

<code_context>
## Existing Code Insights

### Reusable Assets
- `KPICard` (src/components/ui/kpi-card.tsx): default, highlighted, alert-past, alert-trending variants + loading skeleton
- `StatusBadge` (src/components/ui/status-badge.tsx): Filled pill with status-to-color mapping (green/red/yellow/blue)
- `Table` (src/components/ui/table.tsx): Compound component with forwardRef, clickable rows, hover states
- `Card` (src/components/ui/card.tsx): Container component
- `CurrencyDisplay` (src/components/ui/currency-display.tsx): Formatted currency
- `Skeleton` (src/components/ui/skeleton.tsx): Loading state primitives
- `Badge` (src/components/ui/badge.tsx): For property name badges in turn rows
- `PropertySelectorWrapper`: Client component for property switching (Phase 2)
- `TrendIndicator` (src/components/ui/trend-indicator.tsx): Arrow + percentage for KPI trends

### Established Patterns
- `_components/` directory for page-specific components (Phase 4 pattern)
- Suspense wraps data-fetching child, page.tsx is synchronous (Phase 4 pattern)
- `fetchTurnRequests()` / `fetchTurnRequestsForUser()` with caching + rate limiting
- `fetchJobsByIds()` for batch linked record resolution
- `updateJobStatus` server action at src/app/actions/job-status.ts
- `filterByProperties()` for property scoping
- Optimistic UI + toast for writes (Phase 3)
- `use cache` + `cacheLife` + `cacheTag` pattern (Phase 3)

### Integration Points
- Existing placeholder: `src/app/(dashboard)/property/page.tsx` — replace with full PM view
- New route: `src/app/(dashboard)/property/turn/[id]/page.tsx` for turn detail
- Auth: `createClient()` + `supabase.auth.getUser()` for user identity + property_ids
- Data: `fetchTurnRequestsForUser()` already handles property scoping
- Sonner toaster already wired into root layout

</code_context>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 05-property-manager-view*
*Context gathered: 2026-03-13*
