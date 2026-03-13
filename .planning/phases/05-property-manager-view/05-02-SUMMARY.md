---
phase: 05-property-manager-view
plan: 02
subsystem: ui
tags: [react, server-components, suspense, property-filter, kpi, turn-list, mobile-responsive]

# Dependency graph
requires:
  - phase: 05-01
    provides: computePMKPIs, PMKPISkeleton, PMTurnListSkeleton, JobStatusDropdown
  - phase: 03-airtable-data-layer
    provides: fetchTurnRequestsForUser, TurnRequest type
  - phase: 04-executive-dashboard
    provides: KPICard, Table compound component, StatusBadge, Badge, Card
provides:
  - PMDashboard client container (selectedProperty state, Suspense key remount)
  - PMKPIs async server component (6 KPI cards, 3x2 grid)
  - PMTurnList async server component (overdue-first partition, mobile card list)
  - /property page (auth + PMDashboard)
affects:
  - 05-03-turn-detail-view (turn list links to /property/turn/[id])

# Tech tracking
tech-stack:
  added: []
  patterns:
    - Suspense key remount pattern for server component filter updates
    - Two-tier responsive layout: hidden md:block table + md:hidden card list
    - "" sentinel for "All Properties" PropertySelector state
    - Async server components as Suspense children for data fetching

key-files:
  created:
    - src/app/(dashboard)/property/_components/pm-dashboard.tsx
    - src/app/(dashboard)/property/_components/pm-kpis.tsx
    - src/app/(dashboard)/property/_components/pm-turn-list.tsx
  modified:
    - src/app/(dashboard)/property/page.tsx

key-decisions:
  - "Suspense boundaries keyed on selectedProperty — forces server component remount when filter changes, no client state threading needed"
  - "effectiveProperties: selectedProperty === '' uses full assignedProperties array, else [selectedProperty]"
  - "PropertySelector hidden when assignedProperties.length <= 1 — single-property PMs see no unnecessary UI"
  - "Overdue section hidden entirely when overdue.length === 0 — no empty pink header shown"
  - "TurnStatusDisplay maps raw Airtable status strings to StatusBadge Status type with plain span fallback for unmapped values"
  - "JobsCell falls back to plain count badge when turn.jobs is empty/undefined"
  - "Mobile card list uses onClick preventDefault on jobs wrapper to allow dropdowns without triggering Link navigation"

patterns-established:
  - "PM dashboard page = thin auth server page + client container + async server component children in Suspense"
  - "Two-tier responsive turn list: hidden md:block (Table) + md:hidden (card list)"

requirements-completed: [PM-01, PM-02, PM-03, PM-04]

# Metrics
duration: 2min
completed: 2026-03-13
---

# Phase 05 Plan 02: PM Dashboard Page Summary

**PM dashboard with 6 KPI cards, property filter (Suspense key remount), and two-section turn list (overdue-first, pink header) with inline JobStatusDropdown and mobile card layout**

## Performance

- **Duration:** ~2 min
- **Started:** 2026-03-13T18:05:30Z
- **Completed:** 2026-03-13T18:07:40Z
- **Tasks:** 2
- **Files modified:** 4

## Accomplishments

- Replaced Phase 2 placeholder `/property` page with fully functional PM dashboard
- `PMDashboard` client component owns `selectedProperty` state; keyed Suspense boundaries force server component remount on filter change
- `PMKPIs` async server component renders 6 KPI cards in a 3x2 grid; Past Target Time uses `alert-past` variant when count > 0
- `PMTurnList` partitions active turns into overdue (pink header, shown first) and on-schedule; overdue section hidden when empty
- All PM-03 columns present: Property Name (Badge), Unit Number, Status (StatusBadge), Ready To Lease Date, Vacant Date, Jobs (JobStatusDropdown per job), Price
- Turn rows navigate to `/property/turn/[id]`; job status dropdowns have `stopPropagation` built in
- Dual-mode responsive layout: table for md+, stacked card list for small screens

## Task Commits

1. **Task 1: PMDashboard client container + PM page** - `78c2363` (feat)
2. **Task 2: PMKPIs + PMTurnList server components** - `e494401` (feat)

## Files Created/Modified

- `src/app/(dashboard)/property/page.tsx` — replaced placeholder; auth + PMDashboard render
- `src/app/(dashboard)/property/_components/pm-dashboard.tsx` — client container: state, PropertySelector, Suspense boundaries
- `src/app/(dashboard)/property/_components/pm-kpis.tsx` — async server component: 6 KPI cards, alert-past variant
- `src/app/(dashboard)/property/_components/pm-turn-list.tsx` — async server component: overdue/on-schedule partition, Table + card list, JobStatusDropdown

## Decisions Made

- Suspense boundaries keyed on `selectedProperty` — server components remount automatically when filter changes; no client state threading required
- `selectedProperty === ''` sentinel for "All Properties" — maps cleanly to using full `assignedProperties` array
- PropertySelector receives `['All Properties', ...assignedProperties]`; client maps "All Properties" back to `''` sentinel
- `TurnStatusDisplay` maps Airtable string statuses to StatusBadge typed Status; plain span fallback for unknown values
- Overdue section hidden entirely when `overdue.length === 0` per user decision — no empty pink card shown
- Mobile job dropdowns wrapped in `onClick preventDefault` div so tapping a dropdown doesn't trigger the wrapping Link

## Deviations from Plan

None — plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None — no external service configuration required.

## Next Phase Readiness

- Plan 03 (turn detail page) can now import `JobStatusDropdown` (from Plan 01) and link target `/property/turn/[id]` is already wired
- No blockers

---
*Phase: 05-property-manager-view*
*Completed: 2026-03-13*

## Self-Check: PASSED
- All 4 source files created/modified and verified on disk
- SUMMARY.md present
- Both task commits present (78c2363, e494401)
