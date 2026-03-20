---
phase: 13-pm-dashboard-redesign
plan: 03
subsystem: ui
tags: [react, next.js, airtable, server-actions, kpi-cards, inline-editing]

# Dependency graph
requires:
  - phase: 13-01
    provides: computePMKPIs with PMKPIResult (revenueExposureExcludedCount, turnsNearDeadline, etc.)
  - phase: 13-02
    provides: LeaseReadyDateInput, ActiveJobs, ActiveJobsTable components
provides:
  - PM dashboard with 6 KPI boxes wired to computePMKPIs
  - Revenue Exposure footnote rendered inside KPI card via footer prop
  - Inline date editing for lease-ready date in Open Turns table
  - Active Jobs section with inline status dropdown and date editing
  - Job links navigating to /property/turn/[id]
affects: [executive-dashboard, phase-16]

# Tech tracking
tech-stack:
  added: []
  patterns: [KPICard footer prop for supplemental inline content, JobDateInput mirrors LeaseReadyDateInput pattern]

key-files:
  created:
    - src/app/(dashboard)/property/_components/job-date-input.tsx
    - src/app/actions/job-dates.ts
  modified:
    - src/components/ui/kpi-card.tsx
    - src/app/(dashboard)/property/_components/pm-kpis.tsx
    - src/app/(dashboard)/property/_components/active-jobs-table.tsx
    - src/app/(dashboard)/property/_components/active-jobs.tsx
    - src/app/(dashboard)/property/page.tsx

key-decisions:
  - "KPICard footer prop added to KPICard component with border-t separator for supplemental info inside card bounds"
  - "JobStatusDropdown replaces StatusBadge in Active Jobs table for inline status editing"
  - "JobDateInput component mirrors LeaseReadyDateInput pattern (useOptimistic + useTransition + onBlur)"
  - "Job links guarded with turnRequestId !== undefined check to prevent /property/turn/undefined"

patterns-established:
  - "KPICard footer prop: use for supplemental text that belongs visually inside the card box"
  - "JobDateInput: same pattern as LeaseReadyDateInput but takes both start/end dates and a field discriminator"

requirements-completed: [PMDB-01, PMDB-02, PMDB-04, PMDB-06]

# Metrics
duration: 45min
completed: 2026-03-19
---

# Phase 13 Plan 03: PM Dashboard Wire-up Summary

**PM dashboard fully wired: 6 KPI boxes with Revenue Exposure footnote inside card, inline status/date editing in Active Jobs table, and working turn navigation links**

## Performance

- **Duration:** ~45 min
- **Started:** 2026-03-19T04:00:00Z
- **Completed:** 2026-03-19T04:45:00Z
- **Tasks:** 5 (3 original + 2 checkpoint fixes)
- **Files modified:** 7

## Accomplishments

- Wired PMKPIs component to use all 6 new KPI boxes from computePMKPIs (Active Turns, Avg Turn Time, Revenue Exposure, Completed This Period, Jobs In Progress, Turns Near Deadline)
- Revenue Exposure footnote now renders INSIDE the KPI card via new `footer` prop on KPICard
- Open Turns table has inline date editing via LeaseReadyDateInput in Ready To Lease column
- Active Jobs section mounted on PM dashboard page in its own Suspense boundary
- Active Jobs table upgraded with inline JobStatusDropdown, Start Date / End Date editable columns, and working turn navigation links

## Task Commits

Each task was committed atomically:

1. **Task 1: Update PMKPIs with 6-box layout** - `3cfeabb` (feat)
2. **Task 2: Update PMTurnList with LeaseReadyDateInput** - `4c33bb7` (feat)
3. **Task 3: Add Active Jobs section to PM dashboard page** - `128ec54` (feat)
4. **Fix 1: Move Revenue Exposure footnote inside KPI card** - `e6ddf0d` (fix)
5. **Fix 2+3: Inline status/date editing and job link fix** - `110c836` (fix)

## Files Created/Modified

- `src/components/ui/kpi-card.tsx` - Added `footer?: React.ReactNode` prop that renders inside card with border-t separator
- `src/app/(dashboard)/property/_components/pm-kpis.tsx` - Uses footer prop for excluded count footnote; removed sibling element
- `src/app/(dashboard)/property/_components/active-jobs-table.tsx` - Added JobStatusDropdown, Start/End Date columns with JobDateInput, guarded job links
- `src/app/(dashboard)/property/_components/active-jobs.tsx` - Fixed TS2367 pre-existing type error (cast status to string for Invoice Sent/Scheduled comparison)
- `src/app/(dashboard)/property/_components/job-date-input.tsx` - New: inline date input for job start/end dates (mirrors LeaseReadyDateInput)
- `src/app/actions/job-dates.ts` - New: server action to update Job Start Date / End Date in Airtable
- `src/app/(dashboard)/property/page.tsx` - Added ActiveJobs Suspense section below PMTurnList

## Decisions Made

- Added `footer` prop to `KPICard` rather than creating a wrapper component — keeps the card self-contained and composable for future use
- `JobDateInput` accepts both `currentStartDate` and `currentEndDate` plus a `field` discriminator so a single server action call can update either field while preserving the other
- Job links guarded with `turnRequestId !== undefined` (not null check) because the augmented type uses `turnRequestId?: number` from active-jobs.tsx spreading

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Revenue Exposure footnote placed outside KPI card box**
- **Found during:** Checkpoint verification (user reported)
- **Issue:** The `<p>` tag for excluded count was a sibling element outside `KPICard`'s div, rendered below the card
- **Fix:** Added `footer` prop to `KPICard`, moved footnote text to that prop so it renders inside the card
- **Files modified:** src/components/ui/kpi-card.tsx, src/app/(dashboard)/property/_components/pm-kpis.tsx
- **Verification:** TypeScript compiles, footnote is visually inside the card
- **Committed in:** e6ddf0d

**2. [Rule 2 - Missing Critical] Active Jobs table missing inline status editing and date columns**
- **Found during:** Checkpoint verification (user reported)
- **Issue:** Active Jobs table only showed status badge (read-only), no Start Date / End Date columns
- **Fix:** Replaced StatusBadge with JobStatusDropdown; added Start Date and End Date columns with JobDateInput inline editing; created job-dates.ts server action
- **Files modified:** active-jobs-table.tsx, created job-date-input.tsx, created job-dates.ts
- **Verification:** TypeScript compiles cleanly for new files
- **Committed in:** 110c836

**3. [Rule 1 - Bug] Job links navigating to /property/turn/undefined**
- **Found during:** Checkpoint verification (user reported)
- **Issue:** Links used `job.turnRequestId` which is optional in the type; when undefined the href renders as `/property/turn/undefined`
- **Fix:** Introduced `turnId` local variable and guard: only render `<Link>` when `turnId !== undefined`, otherwise render plain text
- **Files modified:** active-jobs-table.tsx
- **Committed in:** 110c836

**4. [Rule 1 - Bug] Pre-existing TS2367 type error in active-jobs.tsx**
- **Found during:** TypeScript verification run
- **Issue:** Filter comparing `j.status` (typed as `JobStatus` union) to `'Invoice Sent'` and `'Scheduled'` which are not in the union - TypeScript flagged as impossible comparison
- **Fix:** Cast `j.status as string` before comparisons - safe since Airtable can return values not in our type
- **Files modified:** active-jobs.tsx
- **Committed in:** 110c836

---

**Total deviations:** 4 auto-fixed (2 bug, 1 missing critical, 1 pre-existing bug)
**Impact on plan:** All fixes essential for correct visual rendering, functionality, and navigation. No scope creep.

## Issues Encountered

None beyond the checkpoint feedback items.

## Next Phase Readiness

- PM dashboard redesign (Phase 13) complete — all 3 plans executed
- Executive dashboard (Phase 16) can proceed when Executive KPI definitions are confirmed
- KPICard `footer` prop is available for Executive KPI use if needed

---
*Phase: 13-pm-dashboard-redesign*
*Completed: 2026-03-19*
