---
phase: 05-property-manager-view
plan: 01
subsystem: ui
tags: [vitest, tdd, kpi, react, sonner, useOptimistic, useTransition, skeleton]

# Dependency graph
requires:
  - phase: 03-airtable-data-layer
    provides: TurnRequest type, updateJobStatus server action
  - phase: 04-executive-dashboard
    provides: computeExecutiveKPIs pattern, KPICard component, Skeleton component
provides:
  - computePMKPIs pure function with 6 KPI fields (tested)
  - PMKPIResult TypeScript interface
  - JobStatusDropdown client component with optimistic updates
  - PMKPISkeleton — 3x2 KPI grid loading fallback
  - PMTurnListSkeleton — table-shaped loading fallback
affects:
  - 05-02-property-manager-page (consumes computePMKPIs and skeleton components)
  - 05-03-turn-list-table (consumes JobStatusDropdown)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - TDD red-green-refactor for pure compute functions
    - useOptimistic + useTransition for server action mutations with instant feedback
    - Local parseCurrency helper (not shared) matching executive-kpis.ts convention
    - KPICard loading=true for skeleton — component handles its own skeleton internally

key-files:
  created:
    - src/lib/kpis/pm-kpis.ts
    - src/lib/kpis/pm-kpis.test.ts
    - src/app/(dashboard)/property/_components/job-status-dropdown.tsx
    - src/app/(dashboard)/property/_components/pm-kpi-skeleton.tsx
    - src/app/(dashboard)/property/_components/pm-turn-list-skeleton.tsx
  modified: []

key-decisions:
  - "projectedSpendMTD uses tr.created >= startOfMonth, NOT readyToLeaseDate — matches Research pitfall 6"
  - "parseCurrency defined locally in pm-kpis.ts (not shared) — consistent with executive-kpis.ts pattern"
  - "JobStatusDropdown reverts optimistic status to currentStatus prop on failure — prop is source of truth"
  - "PMKPISkeleton passes Home icon as placeholder to KPICard — loading=true suppresses icon rendering"

patterns-established:
  - "PM KPI compute pattern: same structure as computeExecutiveKPIs, TurnRequest-only input"
  - "Optimistic mutation pattern: useOptimistic(currentStatus) + useTransition wrapping server action + Sonner toast"

requirements-completed: [PM-05, PM-06, PM-09]

# Metrics
duration: 8min
completed: 2026-03-13
---

# Phase 05 Plan 01: PM KPI Foundation Summary

**computePMKPIs pure function (22 tests, TDD) + JobStatusDropdown with useOptimistic/Sonner + skeleton loading components for the property manager view**

## Performance

- **Duration:** 8 min
- **Started:** 2026-03-13T17:55:00Z
- **Completed:** 2026-03-13T18:02:33Z
- **Tasks:** 2
- **Files modified:** 5

## Accomplishments
- computePMKPIs tested with 22 unit tests covering all 6 KPI fields and edge cases (empty array, null fields, currency parsing)
- JobStatusDropdown client component with instant optimistic status updates, automatic revert on server failure, and Sonner toast feedback
- PMKPISkeleton (3x2 KPI grid) and PMTurnListSkeleton (header + 5 rows) ready for Suspense boundaries in Plans 02 and 03

## Task Commits

Each task was committed atomically:

1. **Task 1a: RED — failing tests for computePMKPIs** - `7f0b30a` (test)
2. **Task 1b: GREEN — implement computePMKPIs** - `71b7ed1` (feat)
3. **Task 2: JobStatusDropdown + skeleton components** - `16cf4bc` (feat)

_Note: TDD task has test + feat commits (no separate refactor needed)_

## Files Created/Modified
- `src/lib/kpis/pm-kpis.ts` — computePMKPIs pure function + PMKPIResult interface
- `src/lib/kpis/pm-kpis.test.ts` — 22 unit tests with fake timers for deterministic date assertions
- `src/app/(dashboard)/property/_components/job-status-dropdown.tsx` — client component: native select, useOptimistic, useTransition, Sonner toasts, stopPropagation
- `src/app/(dashboard)/property/_components/pm-kpi-skeleton.tsx` — 6 KPICard(loading=true) in 3-column grid
- `src/app/(dashboard)/property/_components/pm-turn-list-skeleton.tsx` — Card with header Skeleton + 5 row Skeletons

## Decisions Made
- `projectedSpendMTD` uses `tr.created >= startOfMonth` (not `readyToLeaseDate`) — created date determines which billing period a TR belongs to, not when it was completed
- `parseCurrency` defined locally following the executive-kpis.ts pattern — not extracted to shared util, keeping compute functions self-contained
- JobStatusDropdown reverts optimistic state to `currentStatus` prop on failure — the prop is the server-confirmed source of truth
- Passed `Home` icon as placeholder to `KPICard loading=true` — the loading branch renders Skeleton shapes, icon is never shown

## Deviations from Plan
None - plan executed exactly as written.

## Issues Encountered
None.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Plan 02 (PM dashboard page) can now import `computePMKPIs` and both skeleton components
- Plan 03 (turn list table) can now import `JobStatusDropdown` for inline job status editing
- No blockers

---
*Phase: 05-property-manager-view*
*Completed: 2026-03-13*

## Self-Check: PASSED
- All 5 source files created and verified on disk
- SUMMARY.md present
- All 3 task commits present (7f0b30a, 71b7ed1, 16cf4bc)
