---
phase: 14-completed-jobs-page
plan: 01
subsystem: ui
tags: [next.js, react, airtable, property-filter, table, error-boundary]

# Dependency graph
requires:
  - phase: 13-pm-dashboard
    provides: ActiveJobsTable component, fetchTurnRequestsForUser, Job type with isCompleted field
  - phase: 12-terminology-rename
    provides: UserRole type, PropertyMultiSelect component
provides:
  - /property/completed-jobs route with server-side auth guard
  - CompletedJobs server component filtering jobs by isCompleted boolean
  - CompletedJobsClient with PropertyMultiSelect for property filtering
  - error.tsx error boundary with UI-SPEC mandated copy
  - ActiveJobsTable updated with optional title prop and View completed jobs nav link
affects:
  - Phase 15 or any phase that builds on ActiveJobsTable or the PM dashboard

# Tech tracking
tech-stack:
  added: []
  patterns:
    - Server component fetches data, passes to client component for interactive filtering
    - isCompleted boolean used for filtering instead of status string comparison
    - title prop default pattern for backwards-compatible component extension
    - Conditional nav link rendering based on title prop context

key-files:
  created:
    - src/app/(dashboard)/property/completed-jobs/page.tsx
    - src/app/(dashboard)/property/completed-jobs/_components/completed-jobs.tsx
    - src/app/(dashboard)/property/completed-jobs/_components/completed-jobs-client.tsx
    - src/app/(dashboard)/property/completed-jobs/error.tsx
  modified:
    - src/app/(dashboard)/property/_components/active-jobs-table.tsx

key-decisions:
  - "isCompleted boolean used to filter completed jobs (not status string) — catches all completed statuses including Invoice Sent, Scheduled"
  - "title prop defaults to 'Active Jobs' for full backwards compat — no existing call sites modified"
  - "View completed jobs link rendered only when title === 'Active Jobs' to avoid link on completed jobs page itself"
  - "PropertyMultiSelect only shown when propertyOptions.length > 1 — single-property users see clean view"

patterns-established:
  - "Completed jobs page pattern: server fetch all turns -> flatten jobs -> isCompleted filter -> client filter by property"
  - "ActiveJobsTable title prop: conditional rendering based on title value for context-appropriate empty states"

requirements-completed: [COMP-01, COMP-02, COMP-03]

# Metrics
duration: 3min
completed: 2026-03-19
---

# Phase 14 Plan 01: Completed Jobs Page Summary

**Completed Jobs page at /property/completed-jobs with server-side isCompleted filtering, PropertyMultiSelect property filter, and ActiveJobsTable reuse with backwards-compatible title prop and nav link**

## Performance

- **Duration:** 3 min
- **Started:** 2026-03-19T20:27:56Z
- **Completed:** 2026-03-19T20:30:57Z
- **Tasks:** 3
- **Files modified:** 5

## Accomplishments
- New /property/completed-jobs route with Supabase auth guard, Suspense wrapper, and PMTurnListSkeleton fallback
- Server component correctly filters by j.isCompleted boolean (not status string) catching all completed statuses
- Client component wires PropertyMultiSelect with useMemo-derived filtered jobs, hidden when single property
- ActiveJobsTable extended with optional title prop (default 'Active Jobs') for zero-impact backwards compat
- "View completed jobs" nav link added to PM dashboard Active Jobs card header
- Error boundary with exact UI-SPEC mandated copy: "Unable to load completed jobs" + retry button

## Task Commits

Each task was committed atomically:

1. **Task 1: Create completed jobs page, server component, and client component** - `143095a` (feat)
2. **Task 2: Add title prop to ActiveJobsTable and navigation link to completed jobs** - `dbe08fd` (feat)
3. **Task 3: Create error boundary with UI-SPEC mandated copy** - `5a241a8` (feat)

## Files Created/Modified
- `src/app/(dashboard)/property/completed-jobs/page.tsx` - Server page with auth guard, Suspense wrapper around CompletedJobs
- `src/app/(dashboard)/property/completed-jobs/_components/completed-jobs.tsx` - Server component: fetches all turns, flattens jobs, filters by isCompleted
- `src/app/(dashboard)/property/completed-jobs/_components/completed-jobs-client.tsx` - Client component: PropertyMultiSelect filter + ActiveJobsTable with title prop
- `src/app/(dashboard)/property/completed-jobs/error.tsx` - Next.js error boundary with UI-SPEC mandated copy and retry button
- `src/app/(dashboard)/property/_components/active-jobs-table.tsx` - Added optional title prop, conditional nav link, context-aware empty states

## Decisions Made
- Used `j.isCompleted` boolean (not `j.status === 'Completed'` string) to capture all completion states including Invoice Sent and Scheduled
- `title` prop defaults to `'Active Jobs'` ensuring zero changes needed at existing call sites
- "View completed jobs" link conditionally rendered via `title === 'Active Jobs'` check — avoids recursive link on completed jobs page

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
Pre-existing TypeScript errors in 5 unrelated files (actions/admin.ts, actions/vacant.ts, layout/bottom-tab-bar.tsx, layout/sidebar.tsx, lib/kpis/pm-kpis.test.ts) were present before this plan and are out of scope. All new files compile cleanly.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Completed Jobs page fully functional: auth, data fetching, property filtering, error handling
- ActiveJobsTable title prop available for future reuse in any context requiring a differently-titled jobs table
- Phase 16 (Executive dashboard) can proceed

---
*Phase: 14-completed-jobs-page*
*Completed: 2026-03-19*
