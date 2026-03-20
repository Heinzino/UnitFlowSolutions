---
phase: 12-terminology-rename
plan: "02"
subsystem: ui-components, tests
tags: [terminology-rename, ui, labels, tests, turn, off-market]
dependency_graph:
  requires: [12-01]
  provides: [complete-terminology-rename]
  affects: [executive-kpis, pm-kpis, pm-turn-list, mobile-turn-card, turn-detail-view, health-gauge, health-score, all-test-files]
tech_stack:
  added: []
  patterns: [find-replace-rename, property-rename, test-fixture-update]
key_files:
  created: []
  modified:
    - src/app/(dashboard)/executive/_components/executive-kpis.tsx
    - src/app/(dashboard)/executive/_components/executive-kpi-skeleton.tsx
    - src/app/(dashboard)/executive/_components/health-gauge.tsx
    - src/app/(dashboard)/property/_components/pm-kpis.tsx
    - src/app/(dashboard)/property/_components/pm-turn-list.tsx
    - src/app/(dashboard)/property/_components/mobile-turn-card.tsx
    - src/app/(dashboard)/property/turn/[id]/_components/turn-detail-view.tsx
    - src/app/components/page.tsx
    - src/lib/kpis/health-score.ts
    - src/lib/kpis/pm-kpis.test.ts
    - src/lib/kpis/executive-kpis.test.ts
    - src/lib/airtable/__tests__/mappers.test.ts
    - src/lib/kpis/health-score.test.ts
    - src/app/(dashboard)/executive/_components/executive-charts.test.tsx
decisions:
  - Pre-existing TypeScript errors in admin.ts, vacant.ts, bottom-tab-bar.tsx, sidebar.tsx are out of scope — confirmed pre-existing via git stash check before this plan
  - Airtable fixture strings ('Vacant Date', 'Days Vacant Until Ready') preserved unchanged in mappers.test.ts per plan constraint
metrics:
  duration: "8 minutes"
  tasks_completed: 3
  files_modified: 14
  completed_date: "2026-03-19"
---

# Phase 12 Plan 02: UI Components and Test Files Update Summary

UI label rename and test fixture update completing Phase 12 terminology rename — all "Make Ready" and "Vacant" (as status label) removed from src/, all 202 tests pass, TypeScript compiles cleanly with only pre-existing unrelated errors.

## What Was Done

**Task 1: Update UI component labels and property references**

Updated 8 UI component files and 1 production logic file to use Turn/Off Market vocabulary:

- `executive-kpis.tsx`: Section header "Make Ready Overview" → "Turn Overview"; label "Active Make Readys Open" → "Active Turns Open"; `kpis.activeMakeReadysOpen` → `kpis.activeTurnsOpen`; alert card labels renamed
- `executive-kpi-skeleton.tsx`: Comment updated to "Turn Overview section skeleton"
- `pm-kpis.tsx`: Labels "Active Make Readys"/"Avg Make Ready Time" → "Active Turns"/"Avg Turn Time"; property bindings updated to `activeTurns`/`avgTurnTime`
- `pm-turn-list.tsx`: Section titles renamed; table header "Vacant Date" → "Off Market Date"; `turn.vacantDate` → `turn.offMarketDate`; `daysVacantUntilReady` → `daysOffMarketUntilReady` in partition logic
- `mobile-turn-card.tsx`: Label "Vacant Date" → "Off Market Date"; binding `turn.vacantDate` → `turn.offMarketDate`
- `turn-detail-view.tsx`: Labels "Vacant Date" → "Off Market Date", "Days Vacant" → "Days Off Market"; bindings updated
- `health-gauge.tsx`: Description updated to "10 days off market"
- `page.tsx`: KPI card label "Active Make Readys" → "Active Turns"
- `health-score.ts`: Logic updated from `daysVacantUntilReady` → `daysOffMarketUntilReady` (this was a Plan 01-induced compile error)

**Task 2: Update all test files to match renamed properties**

Updated 5 test files — all `makeTurnRequest` factory functions updated, all assertions and describe block text updated:

- `pm-kpis.test.ts`: `activeMakeReadys` → `activeTurns`, `avgMakeReadyTime` → `avgTurnTime`, factory updated
- `executive-kpis.test.ts`: `activeMakeReadysOpen` → `activeTurnsOpen`, factory and all fixture overrides updated
- `mappers.test.ts`: `result.vacantDate` → `result.offMarketDate`, `result.daysVacantUntilReady` → `result.daysOffMarketUntilReady` in assertions; Airtable fixture strings preserved
- `health-score.test.ts`: Factory and all test descriptions updated to use `daysOffMarketUntilReady`
- `executive-charts.test.tsx`: Factory and call sites updated to `daysOffMarketUntilReady`

**Task 3: Final verification**

- `grep -r "Make Ready|makeReady|MakeReady" src/` → 0 results
- `grep -r "\.vacantDate|\.daysVacantUntilReady|vacantDate:|daysVacantUntilReady:" src/` → 0 results
- `grep -r "activeMakeReadys|avgMakeReadyTime|activeMakeReadysOpen" src/` → 0 results
- `sidebar.tsx` confirmed: "Add Off Market" label present (unchanged)
- `bottom-tab-bar.tsx` confirmed: "Add Off Market" label present (unchanged)
- `npx tsc --noEmit`: Only 4 pre-existing errors (admin.ts, vacant.ts, sidebar.tsx, bottom-tab-bar.tsx — confirmed pre-existing via git stash check)
- `npm test`: 202 passed, 7 todo, 0 failures

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed health-score.ts production file**
- **Found during:** Task 1 (TypeScript verification after UI edits)
- **Issue:** `src/lib/kpis/health-score.ts` still used `daysVacantUntilReady` property which no longer exists on `TurnRequest` after Plan 01's rename — this file was not in the plan's file list but caused compile errors
- **Fix:** Updated `daysVacantUntilReady` → `daysOffMarketUntilReady` in both filter expressions
- **Files modified:** `src/lib/kpis/health-score.ts`
- **Commit:** a8c48a7

**2. [Rule 1 - Bug] Fixed pm-turn-list.tsx business logic property access**
- **Found during:** Task 1 (initial grep discovery)
- **Issue:** `pm-turn-list.tsx` still used `turn.vacantDate` and `tr.daysVacantUntilReady` in business logic and data binding — would cause compile errors
- **Fix:** Updated all property accesses to `offMarketDate`/`daysOffMarketUntilReady`; also updated table header label "Vacant Date" → "Off Market Date"
- **Files modified:** `src/app/(dashboard)/property/_components/pm-turn-list.tsx`
- **Commit:** a8c48a7

## Pre-existing Issues (Out of Scope)

4 TypeScript errors in files unrelated to terminology rename — confirmed pre-existing via git stash test:
- `src/app/actions/admin.ts(111)`: Expected 2 arguments, but got 1 (revalidateTag)
- `src/app/actions/vacant.ts(74)`: Expected 2 arguments, but got 1 (revalidateTag)
- `src/components/layout/bottom-tab-bar.tsx(47)`: Email literal type mismatch
- `src/components/layout/sidebar.tsx(50)`: Email literal type mismatch

These are logged for future cleanup — not caused by Phase 12 changes.

## Commits

| Hash | Message |
|------|---------|
| a8c48a7 | feat(12-02): update UI components and logic to Turn/Off Market vocabulary |
| 29a4c0f | feat(12-02): update all test files to match renamed properties |

## Self-Check

PASSED — verified below.
