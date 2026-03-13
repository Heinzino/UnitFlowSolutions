---
phase: 05-property-manager-view
plan: 03
subsystem: ui
tags: [next.js, server-component, turn-detail, jobs-table, inline-status, optimistic-ui]

# Dependency graph
requires:
  - phase: 05-01
    provides: JobStatusDropdown component
  - phase: 03-airtable-data-layer
    provides: fetchTurnRequestById, TurnRequest type
provides:
  - Turn detail page at /property/turn/[id]
  - TurnDetailView component with turn header and jobs table
affects:
  - PM workflow: clicking a turn opens this detail page

# Tech tracking
tech-stack:
  added: []
  patterns:
    - Next.js 15 async params (params is a Promise, must await)
    - Server component with notFound() for invalid IDs
    - Compound Table component for jobs grid
    - StatusBadge mapping from turn status string to Status type

key-files:
  created:
    - src/app/(dashboard)/property/turn/[id]/page.tsx
    - src/app/(dashboard)/property/turn/[id]/_components/turn-detail-view.tsx
  modified: []

key-decisions:
  - "params awaited as Promise<{ id: string }> per Next.js 15 requirement (Research pitfall 3)"
  - "TurnDetailView is a server component (no use client) — JobStatusDropdown is the only client leaf"
  - "mapTurnStatusToBadge helper converts Airtable status strings to StatusBadge Status type"
  - "formatDate uses toLocaleDateString short format matching Mar 12, 2026 pattern"
  - "parseCurrency defined locally: totalCost first, quotePrice fallback (consistent with PM-01 pattern)"

patterns-established:
  - "Turn detail server page pattern: auth check -> parseInt -> fetchById -> notFound or render"

requirements-completed: [PM-07, PM-08]

# Metrics
duration: 2min
completed: 2026-03-13
---

# Phase 05 Plan 03: Turn Detail Page Summary

**Turn detail page at /property/turn/[id] showing turn header with key fields and jobs table with inline status dropdowns via JobStatusDropdown**

## Performance

- **Duration:** ~2 min
- **Started:** 2026-03-13T18:05:30Z
- **Completed:** 2026-03-13T18:07:17Z
- **Tasks:** 1 of 2 (Task 2 is human verification checkpoint — awaiting)
- **Files modified:** 2

## Accomplishments
- Server page at `/property/turn/[id]` with Supabase auth guard, `notFound()` for invalid/missing IDs
- TurnDetailView renders turn header: Unit number, PropertyName badge, StatusBadge, Ready To Lease date, Vacant Date, Price (totalCost > quotePrice fallback), Days Vacant
- Jobs table with all PM-07 columns: Job ID, Vendor Name, Vendor Type, Status (JobStatusDropdown), Start Date, End Date, Price
- Back link `< Back to turns` navigates to `/property`
- `stopPropagation` on Status cell prevents row-level click handlers from interfering with dropdown

## Task Commits

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Build turn detail page and TurnDetailView component | c61e978 | page.tsx, turn-detail-view.tsx |
| 2 | Visual verification of complete PM view | PENDING | Checkpoint — awaiting human |

## Files Created/Modified
- `src/app/(dashboard)/property/turn/[id]/page.tsx` — server page with auth, fetch, notFound handling
- `src/app/(dashboard)/property/turn/[id]/_components/turn-detail-view.tsx` — TurnDetailView with header Card + jobs Table

## Decisions Made
- `params` awaited as Promise per Next.js 15 requirement
- `TurnDetailView` is a pure server component — `JobStatusDropdown` handles its own client state
- `mapTurnStatusToBadge` converts Airtable status strings ("Done", "In Progress", etc.) to the `Status` union used by `StatusBadge`
- `parseCurrency` local helper: `totalCost` first, `quotePrice` fallback — consistent with executive and PM KPI pattern

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None.

## Self-Check: PASSED
- `src/app/(dashboard)/property/turn/[id]/page.tsx` — created and verified
- `src/app/(dashboard)/property/turn/[id]/_components/turn-detail-view.tsx` — created and verified
- Commit c61e978 present
- No TypeScript errors in new files (only pre-existing pm-dashboard.tsx errors from incomplete Plan 02)
