---
phase: 15-rm-dashboard
plan: 01
subsystem: auth
tags: [routing, navigation, lucide-react, vitest, sidebar, bottom-tab-bar]

# Dependency graph
requires:
  - phase: 14-completed-jobs-page
    provides: Sidebar with Completed Jobs nav item that this plan's tests depend on
provides:
  - ROLE_ROUTES.rm === '/regional' — RM users route to /regional on login
  - ROLE_ALLOWED_ROUTES.rm includes '/regional' — RM can access /regional routes
  - Sidebar Regional Dashboard nav item (Map icon, rm-only, /regional href)
  - BottomTabBar Regional Dashboard tab (Map icon, rm-only, /regional href)
  - Active state logic for /regional/* sub-routes on both nav components
affects: [15-02-PLAN (Regional Dashboard page), middleware auth routing for RM role]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Role-gated nav item pattern: roles array on NavItem/TabItem, filtered by current user role"
    - "Sub-route active state: item.href === '/regional' ? activePath.startsWith('/regional') : activePath === item.href"

key-files:
  created: []
  modified:
    - src/lib/types/auth.ts
    - src/lib/__tests__/auth-types.test.ts
    - src/components/layout/sidebar.tsx
    - src/components/layout/bottom-tab-bar.tsx
    - src/components/layout/__tests__/layout.test.tsx

key-decisions:
  - "ROLE_ROUTES.rm changed from '/property' to '/regional' — RM users now land on regional dashboard after login"
  - "Active state for /regional uses startsWith to support drill-down to /regional/property/* sub-routes; all other items retain exact match"

patterns-established:
  - "Sub-route active state: use startsWith only for routes that will have sub-pages; all others use exact match to avoid false positives"

requirements-completed: [RMDB-01]

# Metrics
duration: 5min
completed: 2026-03-20
---

# Phase 15 Plan 01: Auth Routing and Nav for RM Regional Dashboard Summary

**ROLE_ROUTES.rm routed to /regional with Map icon nav items in sidebar and bottom-tab-bar, active state supporting /regional/* sub-route drill-down**

## Performance

- **Duration:** 5 min
- **Started:** 2026-03-20T02:07:56Z
- **Completed:** 2026-03-20T02:12:08Z
- **Tasks:** 2
- **Files modified:** 5

## Accomplishments
- ROLE_ROUTES.rm changed to '/regional' so RM users are redirected to regional dashboard on login
- ROLE_ALLOWED_ROUTES.rm updated to include '/regional' at front of allowed routes array
- Sidebar and BottomTabBar both gain a Regional Dashboard item (Map icon, rm-only) positioned before Properties
- Active state logic updated to use startsWith for /regional href, preserving exact match for all other nav items

## Task Commits

Each task was committed atomically:

1. **Task 1: Update auth constants and tests for RM /regional routing** - `2cd7e3e` (feat)
2. **Task 2: Add Regional Dashboard to sidebar and bottom-tab-bar** - `151481b` (feat)

**Plan metadata:** _(final docs commit follows)_

## Files Created/Modified
- `src/lib/types/auth.ts` - ROLE_ROUTES.rm = '/regional', ROLE_ALLOWED_ROUTES.rm includes '/regional'
- `src/lib/__tests__/auth-types.test.ts` - Updated test descriptions and assertions for new routing values
- `src/components/layout/sidebar.tsx` - Added Map import, Regional Dashboard nav item, sub-route active state logic
- `src/components/layout/bottom-tab-bar.tsx` - Added Map import, Regional Dashboard tab item, sub-route active state logic
- `src/components/layout/__tests__/layout.test.tsx` - Fixed stale sidebar link count (auto-fix)

## Decisions Made
- Active state uses `startsWith` only for `/regional` href — Regional Dashboard needs to stay highlighted when RM drills into `/regional/property/[id]`. All other hrefs use exact match to avoid false-positive highlights between `/property` and `/property/completed-jobs`.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed stale sidebar nav count in layout test**
- **Found during:** Task 2 (Add Regional Dashboard to sidebar and bottom-tab-bar)
- **Issue:** `layout.test.tsx` expected exactly 3 sidebar links but the component renders 4 (Properties, Completed Jobs, Vendors, Add Off Market). The Completed Jobs item was added in Phase 14 commit `2ffc224` but the test count was never updated. Full test suite failed with "expected 4 to be 3".
- **Fix:** Updated test description from "3 navigation links (Properties, Vendors, Add Off Market)" to "4 navigation links (Properties, Completed Jobs, Vendors, Add Off Market)" and added assertion for `/property/completed-jobs` href.
- **Files modified:** `src/components/layout/__tests__/layout.test.tsx`
- **Verification:** Full test suite passes — 219 tests, 0 failures
- **Committed in:** `151481b` (Task 2 commit)

---

**Total deviations:** 1 auto-fixed (Rule 1 - stale test from Phase 14)
**Impact on plan:** Pre-existing test regression unrelated to this plan's scope; fix required to pass full suite as per acceptance criteria.

## Issues Encountered
None — implementation straightforward. Middleware (`updateSession`) correctly uses `ROLE_ROUTES` and `ROLE_ALLOWED_ROUTES` via `path.startsWith(r)` checks so the `/regional` route will be allowed for RM users without any middleware changes.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Auth routing foundation for RM is complete; Plan 02 can build the `/regional` page and its data layer
- ROLE_ROUTES.rm is '/regional' — middleware will redirect RM login to /regional
- Sidebar and BottomTabBar will show Regional Dashboard for RM users immediately on deployment
- No blockers

---
*Phase: 15-rm-dashboard*
*Completed: 2026-03-20*

## Self-Check: PASSED

- FOUND: .planning/phases/15-rm-dashboard/15-01-SUMMARY.md
- FOUND: src/lib/types/auth.ts
- FOUND: src/components/layout/sidebar.tsx
- FOUND: src/components/layout/bottom-tab-bar.tsx
- FOUND: commit 2cd7e3e (Task 1)
- FOUND: commit 151481b (Task 2)
