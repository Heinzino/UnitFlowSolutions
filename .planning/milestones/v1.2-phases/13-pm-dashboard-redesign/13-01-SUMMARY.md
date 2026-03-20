---
phase: 13-pm-dashboard-redesign
plan: "01"
subsystem: kpis
tags: [tdd, kpis, compute-layer, pm-dashboard]
dependency_graph:
  requires: []
  provides: [PMKPIResult-v2, computePMKPIs-v2, REVENUE_EXPOSURE_RATE_PER_DAY, NEAR_DEADLINE_DAYS, COMPLETED_PERIOD_DAYS]
  affects: [src/app/(dashboard)/property/_components/pm-kpis.tsx, Phase-13-Plan-03]
tech_stack:
  added: []
  patterns: [TDD-red-green, pure-compute-function, named-constants-as-business-rules, jobId-deduplication-via-Map]
key_files:
  created: []
  modified:
    - src/lib/kpis/pm-kpis.ts
    - src/lib/kpis/pm-kpis.test.ts
decisions:
  - "jobsInProgress uses !j.isCompleted (not j.status check) per CONTEXT.md locked decision — includes Ready as active workload"
  - "revenueExposure uses ceil for targetDays computation to handle partial-day date ranges"
  - "turnsNearDeadline window is [todayStart, todayStart+3days] inclusive using UTC midnight as anchor"
  - "revenueExposureExcludedCount counts only active (non-Done) turns to avoid inflating the excluded number with completed work"
metrics:
  duration_minutes: 5
  completed_date: "2026-03-19"
  tasks_completed: 2
  tests_added: 39
  files_modified: 2
---

# Phase 13 Plan 01: PM KPI Compute Layer v2 Summary

**One-liner:** Replaced 6-field PMKPIResult with 7-field v2 using TDD — adds revenueExposure ($60/day-over-target), jobsInProgress (!isCompleted dedup), turnsNearDeadline (3-day window), completedThisPeriod; removes projectedSpendMTD, completedLast7d, pastTargetCount.

## What Was Built

Updated `src/lib/kpis/pm-kpis.ts` with a new `PMKPIResult` interface and `computePMKPIs` function implementing 4 new KPI fields, and rewrote `src/lib/kpis/pm-kpis.test.ts` with 39 tests covering all fields and edge cases.

**New PMKPIResult interface:**
- `activeTurns` — unchanged, TRs where status !== 'Done'
- `completedThisPeriod` — Done TRs with readyToLeaseDate in past 30 days (renamed from completedLast30d)
- `jobsInProgress` — unique non-completed jobs (!isCompleted) across active turns
- `avgTurnTime` — unchanged, average timeToCompleteUnit for Done TRs
- `revenueExposure` — $60/day * max(0, daysOffMarket - targetWindow) summed across active turns
- `revenueExposureExcludedCount` — active turns missing targetDate (cannot contribute to exposure)
- `turnsNearDeadline` — active turns with targetDate in [today, today+3] inclusive

**Exported named constants:**
- `REVENUE_EXPOSURE_RATE_PER_DAY = 60`
- `NEAR_DEADLINE_DAYS = 3`
- `COMPLETED_PERIOD_DAYS = 30`

## TDD Execution

**RED phase (commit af41348):** Wrote 39 failing tests covering all 7 KPI fields including edge cases for deduplication, date boundaries, null handling, and multi-turn aggregation. 32 tests failed, 7 passed.

**GREEN phase (commit 0079be3):** Implemented all 5 new/changed compute blocks. All 39 tests pass.

## Key Decisions

1. `jobsInProgress` filter: `!j.isCompleted` (not a status allowlist) per CONTEXT.md locked decision — "Ready" status counts as active workload representing total non-completed jobs
2. Revenue exposure uses `Math.ceil` for `targetDays` to correctly handle the date subtraction (whole-day boundaries)
3. `turnsNearDeadline` uses UTC midnight (`Date.UTC(...)`) as `todayStart` anchor for consistent boundary behavior across timezones
4. `revenueExposureExcludedCount` only counts active turns — Done turns with null targetDate are not included (they are no longer relevant to the live dashboard)

## Commits

| Hash | Type | Description |
|------|------|-------------|
| af41348 | test | Add failing tests for PM KPI v2 (RED) |
| 0079be3 | feat | Implement PM KPI compute layer v2 (GREEN) |

## Deviations from Plan

None - plan executed exactly as written.

## Self-Check: PASSED

- [x] `src/lib/kpis/pm-kpis.ts` exists and exports all required symbols
- [x] `src/lib/kpis/pm-kpis.test.ts` exists with 39 passing tests
- [x] Commits af41348 and 0079be3 exist in git log
- [x] No references to old field names (completedLast30d, completedLast7d, projectedSpendMTD, pastTargetCount) in code or test assertions
- [x] `parseCurrency` removed from pm-kpis.ts
