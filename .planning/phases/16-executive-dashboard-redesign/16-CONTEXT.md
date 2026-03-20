# Phase 16: Executive Dashboard Redesign - Context

**Gathered:** 2026-03-19
**Status:** Ready for planning

<domain>
## Phase Boundary

Executives see a completely redesigned portfolio dashboard with 6 updated KPI boxes (same metrics, new presentation with contextual subtitles) and a Top 10 Properties by Revenue Exposure ranked table. All existing charts, alert cards, and Turn Overview section are removed. Covers EXEC-01 and EXEC-02.

</domain>

<decisions>
## Implementation Decisions

### KPI Box Definitions (6 total, 3x2 grid)
- **Same 6 metrics as current executive dashboard** — NOT mirroring PM/RM set
- Row 1: Active Jobs Open, Jobs Trending Past Target, Jobs Completed (30d)
- Row 2: Backlog Delta, Avg Time to Complete, Projected Cost Exposure
- Compute functions (`computeExecutiveKPIs`, `computeKPITrends`) remain — same logic, new presentation

### KPI Contextual Subtitles (via footer prop)
Each card gets a contextual subtitle rendered via KPICard's `footer` prop:
- **Active Jobs Open**: "{backlogDelta} backlog delta this week"
- **Jobs Trending Past Target**: "{percentage}% of active jobs at risk"
- **Jobs Completed (30d)**: "↓ {X}% vs prior 30 days" (or ↑, from trend data)
- **Backlog Delta**: "More opening than closing" (or "More closing than opening" when negative)
- **Avg Time to Complete**: "↑ {X}% over target · target 8 days" (uses trend data + hardcoded 8-day target reference)
- **Projected Cost Exposure**: "~$60/unit on delayed jobs"

### KPI Trend Arrows
- Trend arrows on same 3 cards as current: Active Jobs Open, Jobs Completed (30d), Avg Time to Complete
- Other 3 cards: no trend arrows
- `computeKPITrends` function reused as-is

### KPI Card Variants
- No alert variants (alert-past, alert-trending) on any of the 6 KPI boxes
- All 6 use default KPICard variant

### Top 10 Properties by Revenue Exposure
- Two columns only: Property Name, Revenue Exposure ($)
- Fixed ranking: always sorted by Revenue Exposure descending — NOT sortable by user
- Static display only — rows are not clickable, no drill-down
- Show all available properties up to 10 (if 6 exist, show 6)
- Only include properties with exposure > $0
- Empty state: "No properties with revenue exposure" when all properties are at $0
- Table title stays "Top 10 Properties by Revenue Exposure" regardless of actual count
- Wrapped in a Card component with heading (matches RM chart card pattern)

### Removed Content
- **Turn Overview section** (Active Turns Open card) — removed entirely
- **Alert cards** (Turns Past Target Time, Turns Trending Past Target Date) — removed entirely
- **Vendor Completion Chart** — removed entirely
- **Health Gauge** — removed entirely
- **Delete all unused code**: health-gauge.tsx, vendor-completion-chart.tsx, executive-charts.tsx, executive-charts-skeleton.tsx, and any orphaned compute functions/types

### Layout & Structure
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

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Requirements and roadmap
- `.planning/REQUIREMENTS.md` — EXEC-01 and EXEC-02 define exact acceptance criteria
- `.planning/ROADMAP.md` §Phase 16 — Success criteria, phase goal, dependencies

### Prior phase context
- `.planning/phases/13-pm-dashboard-redesign/13-CONTEXT.md` — Revenue Exposure formula ($60/day), KPICard footer prop, alert variant patterns
- `.planning/phases/15-rm-dashboard/15-CONTEXT.md` — RM aggregation pattern, Card-wrapped chart/table pattern

### Existing executive dashboard code
- `src/app/(dashboard)/executive/page.tsx` — Current page layout (will be simplified)
- `src/app/(dashboard)/executive/_components/executive-kpis.tsx` — Current KPI component (will be redesigned)
- `src/app/(dashboard)/executive/_components/executive-kpi-skeleton.tsx` — Loading skeleton (will be updated)
- `src/app/(dashboard)/executive/_components/executive-charts.tsx` — Charts component (will be DELETED)
- `src/app/(dashboard)/executive/_components/executive-charts-skeleton.tsx` — Charts skeleton (will be DELETED)
- `src/app/(dashboard)/executive/_components/health-gauge.tsx` — Health gauge (will be DELETED)
- `src/app/(dashboard)/executive/_components/vendor-completion-chart.tsx` — Vendor chart (will be DELETED)
- `src/lib/kpis/executive-kpis.ts` — Compute functions (keep computeExecutiveKPIs + computeKPITrends, clean up unused alert fields)

### Shared UI components
- `src/components/ui/kpi-card.tsx` — KPICard with footer prop (use for contextual subtitles)
- `src/components/ui/card.tsx` — Card wrapper for Top 10 table
- `src/components/ui/table.tsx` — Table compound component for Top 10 table

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `KPICard` with footer prop: renders contextual subtitles below the value with border-t separator
- `computeExecutiveKPIs`: already computes all 6 metrics — keep and reuse
- `computeKPITrends`: already computes trend data for 3 cards — keep and reuse
- `Table` compound component: reuse for Top 10 Properties table
- `Card` component: wrap Top 10 table section
- `CurrencyDisplay`: format Revenue Exposure dollar amounts in table rows
- `fetchJobs()` and `fetchTurnRequests()`: existing data fetches with caching

### Established Patterns
- `_components/` directory for page-specific components
- Suspense wraps data-fetching children, page.tsx is synchronous
- `use cache` + `cacheLife` + `cacheTag` for server-side caching
- KPICard footer pattern established in Phase 13

### Integration Points
- Executive page: `src/app/(dashboard)/executive/page.tsx` — simplify to KPIs + Top 10 (remove charts Suspense)
- New component needed: Top 10 Properties table (in `_components/`)
- Per-property revenue exposure computation: group turn requests by property, apply $60/day formula per property, rank and slice top 10

</code_context>

<specifics>
## Specific Ideas

- Screenshot provided as spec reference — each KPI card has an icon, label, value, trend arrow (where applicable), and a contextual subtitle line
- "$60/unit on delayed jobs" is the exact subtitle for Projected Cost Exposure (not $99)
- The redesign simplifies the executive page significantly — from KPIs + Turn Overview + Alerts + Charts down to just KPIs + Top 10 table
- Revenue Exposure per property is a new computation (current code computes portfolio-level only) — needs to group turns by propertyName and sum per-property exposure

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 16-executive-dashboard-redesign*
*Context gathered: 2026-03-19*
