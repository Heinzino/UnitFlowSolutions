---
phase: 15-rm-dashboard
plan: 02
subsystem: ui
tags: [recharts, next-js, suspense, server-components, client-components, kpis]

requires:
  - phase: 15-01
    provides: RM role routing to /regional, sidebar nav, ROLE_ROUTES.rm = '/regional'
  - phase: 13
    provides: computePMKPIs function, PMKPIs server component, PMTurnList, ActiveJobs, PMKPISkeleton, PMTurnListSkeleton
provides:
  - RM dashboard at /regional with aggregated KPI grid using computePMKPIs
  - Property Insights sortable table with per-property Active Turns, Avg Turn Time, Revenue Exposure
  - Avg Turn Time bar chart with green/amber/red color thresholds
  - Drill-down page at /regional/property/[id] reusing PM components scoped to single property
affects: [16-executive-dashboard]

tech-stack:
  added: []
  patterns:
    - "Server component groups turn requests by property and computes per-property stats before passing to client table"
    - "Single Suspense boundary covers both table and chart (PropertyInsights renders both)"
    - "Property URL encoding: encodeURIComponent in client, decodeURIComponent in server page"
    - "Drill-down access guard: redirect to /regional if property not in user.app_metadata.property_ids"

key-files:
  created:
    - src/app/(dashboard)/regional/_components/rm-kpis.tsx
    - src/app/(dashboard)/regional/_components/property-insights.tsx
    - src/app/(dashboard)/regional/_components/property-insights-table.tsx
    - src/app/(dashboard)/regional/_components/avg-turn-time-chart.tsx
    - src/app/(dashboard)/regional/_components/property-insights-skeleton.tsx
    - src/app/(dashboard)/regional/_components/avg-turn-time-chart.test.tsx
    - src/app/(dashboard)/regional/page.tsx
    - src/app/(dashboard)/regional/property/[id]/page.tsx
  modified: []

key-decisions:
  - "PropertyInsights server component renders both table AND chart — single Suspense boundary covers both per RESEARCH.md recommendation"
  - "getBarColor thresholds: green < 7 days, amber 7-14 days (>=7 and <=14), red > 14 days"
  - "Drill-down reuses PMKPIs/PMTurnList/ActiveJobs with role='rm' — no duplication, single source of truth"
  - "params awaited as Promise per Next.js 15+ async params pattern"

patterns-established:
  - "Per-property stat grouping: Map<string, TurnRequest[]> initialized from assignedProperties, then populated from fetched turns"
  - "Chart data excludes properties with null avgTurnTime (no completed turns)"
  - "Property access guard in drill-down: redirect if propertyName not in assignedProperties"

requirements-completed: [RMDB-02, RMDB-03, RMDB-04, RMDB-05]

duration: 18min
completed: 2026-03-19
---

# Phase 15 Plan 02: RM Dashboard Components and Routes Summary

**Full RM dashboard at /regional with aggregated KPI grid, sortable Property Insights table, color-coded Avg Turn Time bar chart, and drill-down page at /regional/property/[id] reusing PM components**

## Performance

- **Duration:** 18 min
- **Started:** 2026-03-19T20:15:00Z
- **Completed:** 2026-03-19T20:33:00Z
- **Tasks:** 2
- **Files modified:** 8

## Accomplishments

- Built 6-component regional dashboard with server-side KPI aggregation across all RM properties using existing `computePMKPIs`
- Property Insights table sortable by any column, default sort Revenue Exposure descending, rows navigate to drill-down via encoded URL
- Avg Turn Time bar chart with exported `getBarColor` function (green < 7d, amber 7-14d, red > 14d), unit-tested with 3 passing assertions
- Drill-down page reuses PMKPIs + PMTurnList + ActiveJobs with `role="rm"` and single-property scope, access-guarded against unauthorized properties

## Task Commits

1. **Task 1: Create all _components files** - `37c339d` (feat)
2. **Task 2: Create RM dashboard page and drill-down page** - `b8e662e` (feat)

## Files Created/Modified

- `src/app/(dashboard)/regional/_components/rm-kpis.tsx` - Server component fetching all RM turns and computing aggregated KPIs via computePMKPIs
- `src/app/(dashboard)/regional/_components/property-insights.tsx` - Server component grouping turns by property, computing per-property stats, rendering PropertyInsightsTable and AvgTurnTimeChart
- `src/app/(dashboard)/regional/_components/property-insights-table.tsx` - Client component: sortable 4-column table, default sort revenueExposure desc, row click navigates to drill-down
- `src/app/(dashboard)/regional/_components/avg-turn-time-chart.tsx` - Client component: vertical Recharts BarChart with Cell color coding, exported getBarColor for unit testing
- `src/app/(dashboard)/regional/_components/property-insights-skeleton.tsx` - Loading skeleton covering both Property Insights table and Avg Turn Time chart
- `src/app/(dashboard)/regional/_components/avg-turn-time-chart.test.tsx` - Unit tests for getBarColor (3 threshold cases, all passing)
- `src/app/(dashboard)/regional/page.tsx` - RM dashboard page with auth guard, welcome message, two Suspense boundaries
- `src/app/(dashboard)/regional/property/[id]/page.tsx` - Drill-down page with property access guard, Back to Dashboard link, PM components scoped to single property with role='rm'

## Decisions Made

- PropertyInsights server component renders both the table and chart — single Suspense boundary per RESEARCH.md recommendation (fewer loading states, data fetched once)
- getBarColor amber threshold uses `>= 7` (inclusive) so 7 days is amber, not green — consistent with "7+ days is a concern" business rule
- Drill-down fully reuses existing PM components with `role="rm"` rather than duplicating — fetchTurnRequestsForUser cache tag handles role-based scoping

## Deviations from Plan

None — plan executed exactly as written.

## Issues Encountered

None — pre-existing TypeScript errors in admin.ts, vacant.ts, and test files were out of scope and not touched.

## Next Phase Readiness

- RM dashboard fully functional at /regional and /regional/property/[id]
- Phase 15 complete — all RMDB requirements delivered
- Ready for Phase 16 (Executive Dashboard)

---
*Phase: 15-rm-dashboard*
*Completed: 2026-03-19*
