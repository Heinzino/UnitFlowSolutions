---
phase: 06-district-manager-view
plan: 01
subsystem: auth
tags: [typescript, roles, routing, vitest, tdd]

# Dependency graph
requires:
  - phase: 02-authentication-and-property-scoping
    provides: UserRole type, ROLE_ROUTES, middleware routing, user-header component
provides:
  - UserRole union with 'rm' replacing 'dm'
  - ROLE_ROUTES.rm mapped to /property
  - ROLE_LABELS.rm = 'Regional Manager'
  - ROLE_ALLOWED_ROUTES.rm = ['/property']
  - /district redirect to /property
  - auth-types test suite asserting rm constants
affects: [middleware, user-header, any future code using UserRole]

# Tech tracking
tech-stack:
  added: []
  patterns: [TDD for type constant assertions via vitest]

key-files:
  created:
    - src/lib/__tests__/auth-types.test.ts
  modified:
    - src/lib/types/auth.ts
    - src/components/layout/user-header.tsx
    - src/app/(dashboard)/district/page.tsx

key-decisions:
  - "UserRole renamed dm to rm — Regional Managers use PM view with multiple properties, no separate UI needed"
  - "ROLE_ROUTES.rm maps to /property (same as pm) — no distinct district route"
  - "ROLE_ALLOWED_ROUTES.rm is ['/property'] only — district route no longer in allowed set"
  - "user-header.tsx exec-only for All Properties — rm falls through to PropertySelector dropdown"
  - "/district kept as redirect page (not deleted) — bookmarked URLs recover gracefully"

patterns-established:
  - "Type constant assertions: use Object.keys().includes() pattern to assert key absence"

requirements-completed: [DM-01, DM-02, DM-03, DM-04]

# Metrics
duration: 2min
completed: 2026-03-14
---

# Phase 6 Plan 01: DM-to-RM Role Rename Summary

**Renamed 'dm' (District Manager) to 'rm' (Regional Manager) across auth type system, routing constants, and UI — with TDD test coverage asserting the new role constants**

## Performance

- **Duration:** ~2 min
- **Started:** 2026-03-14T23:39:43Z
- **Completed:** 2026-03-14T23:41:33Z
- **Tasks:** 2 (Task 1 had 2 commits: RED + GREEN)
- **Files modified:** 4

## Accomplishments
- Renamed UserRole union from 'pm' | 'dm' | 'exec' to 'pm' | 'rm' | 'exec' with full constant updates
- Created auth-types test suite (7 tests) asserting rm constants via TDD — RED then GREEN
- Removed 'dm' from exec-like "All Properties" condition so RM users see PropertySelector dropdown
- Replaced /district placeholder page with a clean redirect to /property

## Task Commits

Each task was committed atomically:

1. **TDD RED - Failing auth-types tests** - `c4ea87a` (test)
2. **Task 1: Rename dm to rm in type system** - `440bbbe` (feat)
3. **Task 2: Update user-header + redirect district page** - `12809da` (feat)

_Note: TDD task has separate test (RED) and implementation (GREEN) commits_

## Files Created/Modified
- `src/lib/__tests__/auth-types.test.ts` - New: 7 tests asserting rm role constants
- `src/lib/types/auth.ts` - Updated: UserRole, ROLE_ROUTES, ROLE_LABELS, ROLE_ALLOWED_ROUTES
- `src/components/layout/user-header.tsx` - Updated: removed dm from exec-like condition
- `src/app/(dashboard)/district/page.tsx` - Replaced: redirect('/property') instead of placeholder dashboard

## Decisions Made
- RM role uses /property route (same as PM) — no distinct /district path needed
- /district page kept as a redirect rather than deleted — safer for any bookmarked URLs
- ROLE_ALLOWED_ROUTES.rm is ['/property'] only — district no longer an allowed route for any role

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None.

## User Setup Required

**Post-deploy Supabase admin action required:** Existing users with `role: 'dm'` in Supabase app_metadata must be manually updated to `role: 'rm'`. This is a Supabase dashboard operation, not a code change.

## Next Phase Readiness
- Phase 6 Plan 01 complete — type system is clean with rm as the sole multi-property non-exec role
- No further phase 6 plans needed — this was the only planned change (rename + dead code cleanup)
- RM users now route to /property via middleware and see PropertySelector if they have multiple properties

---
*Phase: 06-district-manager-view*
*Completed: 2026-03-14*
