---
phase: 07-notifications-charts-and-vendor-metrics
plan: 01
subsystem: executive-dashboard, layout, auth
tags: [recharts, notifications-cleanup, trend-indicators, kpi-trends, route-auth]
dependency_graph:
  requires: []
  provides:
    - recharts installed
    - sidebar without notifications
    - bottom-tab-bar without notifications
    - TrendIndicator with isGood prop
    - KPICard passes isGood through to TrendIndicator
    - computeKPITrends pure function
    - executive KPI cards with trend arrows
    - ROLE_ALLOWED_ROUTES with /vendors for all roles
  affects:
    - src/app/(dashboard)/executive/_components/executive-kpis.tsx
    - src/components/ui/kpi-card.tsx
    - src/components/ui/trend-indicator.tsx
    - src/lib/types/auth.ts
tech_stack:
  added: [recharts@^3.8.0]
  patterns:
    - TDD red-green for UI behavior
    - Pure function trend computation with date windowing
    - isGood prop for color semantics inversion
key_files:
  created: []
  modified:
    - src/components/layout/sidebar.tsx
    - src/components/layout/bottom-tab-bar.tsx
    - src/components/layout/__tests__/layout.test.tsx
    - src/components/ui/__tests__/components.test.tsx
    - src/lib/types/auth.ts
    - src/components/ui/trend-indicator.tsx
    - src/components/ui/kpi-card.tsx
    - src/lib/kpis/executive-kpis.ts
    - src/lib/kpis/executive-kpis.test.ts
    - src/app/(dashboard)/executive/_components/executive-kpis.tsx
    - src/lib/__tests__/auth-types.test.ts
    - package.json
    - package-lock.json
decisions:
  - "[Phase 07-01]: computeKPITrends uses same-dataset date windowing — since Airtable provides a single snapshot, current and prev arrays are the same jobs/TRs; the function filters by endDate/created within 30d windows internally"
  - "[Phase 07-01]: avgTimeToComplete trend uses TR created date (not readyToLeaseDate) to assign TRs to time periods — consistent with pm-kpis projectedSpendMTD decision"
  - "[Phase 07-01]: activeJobsOpen trend compares currentJobs active count vs prevJobs active count directly — point-in-time metric, not date-windowed"
  - "[Phase 07-01]: recharts ^3.8.0 installed as dependency — prepares for Plan 03 chart components"
metrics:
  duration: 5min
  completed: "2026-03-14"
  tasks: 2
  files: 13
requirements-completed: [VIZ-03, VIZ-04]
---

# Phase 7 Plan 1: Install Recharts, Cleanup Notifications, Add Vendor Auth, Wire KPI Trends Summary

**One-liner:** Recharts installed, notification UI removed, /vendors authorized for all roles, and executive KPI trend arrows wired with isGood color semantics for contextual up/down meaning.

## Tasks Completed

| # | Task | Commit | Key Files |
|---|------|--------|-----------|
| 1 | Install Recharts, cleanup notifications, add /vendors route auth, enhance TrendIndicator | 514d3b1 | sidebar.tsx, bottom-tab-bar.tsx, auth.ts, trend-indicator.tsx, kpi-card.tsx, layout.test.tsx, components.test.tsx |
| 2 | Compute KPI trends and wire into executive dashboard | bff04f9 | executive-kpis.ts, executive-kpis.test.ts, executive-kpis.tsx, auth-types.test.ts |

## Verification Results

- All 138 tests pass (npm test)
- Build has a pre-existing failure on /property/job/[id] (uncached data outside Suspense) — confirmed pre-existing before this plan's changes
- Sidebar renders 4 nav items (Dashboard, Properties, Vendors, Settings — no Bell/Notifications)
- Bottom tab bar renders 4 items (same, no Bell/Notifications)
- ROLE_ALLOWED_ROUTES now includes /vendors for pm, rm, and exec
- TrendIndicator accepts isGood prop (defaults true); isGood=false inverts color semantics
- KPICard passes isGood through to TrendIndicator via trend prop extension
- computeKPITrends: 5 new tests, all passing
- Active Jobs Open, Jobs Completed (30d), Avg Time to Complete all show trend arrows

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Updated stale auth-types test after ROLE_ALLOWED_ROUTES change**
- **Found during:** Task 2 (full test suite run)
- **Issue:** `src/lib/__tests__/auth-types.test.ts` line 26 asserted `ROLE_ALLOWED_ROUTES.rm` equals `['/property']`. This broke when we added `/vendors` to all roles in Task 1.
- **Fix:** Updated the test to assert `rm` = `['/property', '/vendors']`, added assertions for `pm` and `exec` entries with their new values.
- **Files modified:** src/lib/__tests__/auth-types.test.ts
- **Commit:** bff04f9

## Deferred Issues

**Pre-existing build failure:** `/property/job/[id]` route throws "Uncached data was accessed outside of Suspense" during static generation. Confirmed pre-existing (same error with `git stash`). Not caused by this plan. Needs a separate Suspense boundary fix in the turn detail page.

## Self-Check: PASSED

- sidebar.tsx: FOUND
- trend-indicator.tsx: FOUND
- executive-kpis.ts: FOUND
- 07-01-SUMMARY.md: FOUND
- commit 514d3b1: FOUND
- commit bff04f9: FOUND
