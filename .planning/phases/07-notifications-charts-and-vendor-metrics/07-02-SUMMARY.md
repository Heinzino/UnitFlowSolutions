---
phase: 07-notifications-charts-and-vendor-metrics
plan: 02
subsystem: ui
tags: [react, nextjs, airtable, table, sorting, badges]

# Dependency graph
requires:
  - phase: 07-01
    provides: Route auth configuration allowing /vendors for all roles
provides:
  - Vendor interface extended with jobIds field
  - fetchVendors() returns jobIds from Airtable linked Jobs field
  - /vendors page with sortable vendor table and linked job badges
  - Loading skeleton for vendor table
affects: [07-03]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - Inner async server component pattern for Suspense-wrapped data fetching (VendorTableData)
    - Client-side sortable table with useState for sort key and direction

key-files:
  created:
    - src/app/(dashboard)/vendors/page.tsx
    - src/app/(dashboard)/vendors/loading.tsx
    - src/app/(dashboard)/vendors/_components/vendor-table.tsx
    - src/app/(dashboard)/vendors/_components/vendor-table-skeleton.tsx
    - src/app/(dashboard)/vendors/_components/vendor-table.test.tsx
  modified:
    - src/lib/types/airtable.ts
    - src/lib/airtable/tables/vendors.ts
    - src/app/(dashboard)/executive/_components/vendor-completion-chart.tsx

key-decisions:
  - "jobIds extraction uses defensive dual-format parsing: Array.isArray check for Airtable API array, string split fallback for CSV format"
  - "Null avgCompletionTimeDays sorts to bottom regardless of sort direction by short-circuiting before sort value comparison"
  - "VendorTableData is an inner async server component inside page.tsx — follows Phase 04-02 Suspense pattern"

patterns-established:
  - "Inner async server component pattern: VendorTableData fetches data inside Suspense boundary inside page.tsx"
  - "Sortable table: useState for (sortKey, sortDir), spread-copy before sort, null-to-bottom logic"

requirements-completed: [VEND-01]

# Metrics
duration: 2min
completed: 2026-03-15
---

# Phase 07 Plan 02: Vendor Performance Table Summary

**Sortable vendor metrics table at /vendors with linked job badge pills using Airtable linked Jobs field, extending Vendor type with jobIds**

## Performance

- **Duration:** 2 min
- **Started:** 2026-03-15T03:35:11Z
- **Completed:** 2026-03-15T03:37:30Z
- **Tasks:** 2
- **Files modified:** 8

## Accomplishments
- Extended Vendor interface with `jobIds: number[]` and updated `mapVendor()` to extract from Airtable Jobs linked field with dual-format defensive parsing
- Created VendorTable client component with 4 sortable columns, null-to-bottom sort logic for avgCompletionTimeDays, and Badge+Link job pills
- Created /vendors page with auth check, inner VendorTableData server component, Suspense boundary, and route-level loading skeleton
- All 6 vendor table tests pass (render, sort toggle, null N/A, badge links, empty dash)

## Task Commits

Each task was committed atomically:

1. **Task 1: Extend Vendor type/fetcher with jobIds and create vendor table component** - `e7f834f` (feat)
2. **Task 2: Create /vendors page with Suspense boundary** - `d972a41` (feat)

**Plan metadata:** (docs commit — see below)

## Files Created/Modified
- `src/lib/types/airtable.ts` - Added `jobIds: number[]` to Vendor interface
- `src/lib/airtable/tables/vendors.ts` - Updated mapVendor() to parse jobIds from Airtable Jobs linked field
- `src/app/(dashboard)/vendors/_components/vendor-table.tsx` - Client sortable table with linked job badges
- `src/app/(dashboard)/vendors/_components/vendor-table-skeleton.tsx` - Table-shaped skeleton loading state
- `src/app/(dashboard)/vendors/_components/vendor-table.test.tsx` - 6 tests covering render, sort, null, badges, empty
- `src/app/(dashboard)/vendors/page.tsx` - Server page with auth, inner VendorTableData, Suspense
- `src/app/(dashboard)/vendors/loading.tsx` - Route-level loading using VendorTableSkeleton
- `src/app/(dashboard)/executive/_components/vendor-completion-chart.tsx` - Fixed recharts formatter type annotation (auto-fix)

## Decisions Made
- jobIds extraction uses dual-format defensive parsing: `Array.isArray` handles Airtable API linked record arrays; string split fallback handles CSV format
- Null `avgCompletionTimeDays` sorts to bottom regardless of sort direction by short-circuiting before comparison
- VendorTableData follows the Phase 04-02 inner async server component pattern for Suspense data-fetch boundary

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed recharts Tooltip formatter TypeScript type error**
- **Found during:** Task 2 (build verification)
- **Issue:** `vendor-completion-chart.tsx` from 07-01 had `formatter={(value: number) => ...}` — recharts Formatter type passes `ValueType | undefined`, making the explicit `number` annotation incompatible
- **Fix:** Removed explicit `number` annotation, let TypeScript infer from recharts Formatter generic
- **Files modified:** `src/app/(dashboard)/executive/_components/vendor-completion-chart.tsx`
- **Verification:** TypeScript compilation passes with `npm run build`
- **Committed in:** `d972a41` (Task 2 commit)

---

**Total deviations:** 1 auto-fixed (Rule 1 — TypeScript type bug)
**Impact on plan:** Fix necessary for build to pass TypeScript check. No scope creep.

## Issues Encountered
- Pre-existing build error in `/property/job/[id]` prerender (uncached data outside Suspense — a Next.js 16 blocking route issue). This was not caused by 07-02 changes. TypeScript compilation passed cleanly. Logged to `deferred-items.md`.

## Next Phase Readiness
- /vendors page complete and accessible to all roles (07-01 route auth already covers it)
- Ready for Plan 07-03: KPI trend charts on executive dashboard

---
*Phase: 07-notifications-charts-and-vendor-metrics*
*Completed: 2026-03-15*
