---
phase: 02-authentication-and-property-scoping
plan: "02"
subsystem: auth
tags: [nextjs, route-groups, supabase, login-page, react, useActionState, server-components]

# Dependency graph
requires:
  - phase: 02-authentication-and-property-scoping/02-01
    provides: login server action, createClient server factory, UserRole types, AppShell component

provides:
  - Login page UI with centered card on forest green background, email/password fields, CTA button
  - (dashboard) route group that wraps children in AppShell via DashboardLayout
  - Property Manager dashboard placeholder reading app_metadata.property_ids from Supabase
  - District Manager dashboard placeholder reading getUser from Supabase
  - Executive dashboard placeholder reading getUser from Supabase
  - Root page redirect to /login (middleware handles real routing)

affects:
  - 02-03-role-dashboards
  - 03-airtable-data-layer
  - all phases building pages within the (dashboard) route group

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Route groups: (dashboard) group gives AppShell to all dashboard pages without login page seeing it"
    - "useActionState(login, undefined) wires server action to login form with pending state"
    - "Server component dashboard pages call supabase.auth.getUser() with redirect('/login') as defence-in-depth"
    - "app_metadata.property_ids cast to string[] with ?? [] fallback for safe empty state handling"

key-files:
  created:
    - src/app/login/page.tsx
    - src/app/(dashboard)/layout.tsx
    - src/app/(dashboard)/property/page.tsx
    - src/app/(dashboard)/district/page.tsx
    - src/app/(dashboard)/executive/page.tsx
  modified:
    - src/app/layout.tsx
    - src/app/page.tsx

key-decisions:
  - "Card component has variant prop (not shadow) - plan interface was incorrect; removed invalid prop"
  - "Route group (dashboard) cleanly separates AppShell from login page without extra nesting"

patterns-established:
  - "Pattern: (dashboard) route group — all authenticated pages live here and inherit AppShell from layout.tsx"
  - "Pattern: Defence-in-depth redirect — dashboard pages call getUser() and redirect('/login') even though middleware already guards"

requirements-completed: [AUTH-01, AUTH-02, AUTH-03, SCOPE-01, SCOPE-02, SCOPE-03]

# Metrics
duration: 2min
completed: 2026-03-12
---

# Phase 02 Plan 02: Login Page and Dashboard Route Group Summary

**Login page with useActionState + server action, (dashboard) route group wrapping AppShell, and three role-specific Supabase-reading placeholder pages**

## Performance

- **Duration:** 2 min
- **Started:** 2026-03-12T00:46:33Z
- **Completed:** 2026-03-12T00:48:40Z
- **Tasks:** 2
- **Files modified:** 7

## Accomplishments

- Restructured app routes into a (dashboard) group so the login page renders without AppShell while all authenticated dashboard pages inherit AppShell via a single layout file
- Built login page using useActionState(login) with inline error display, centered card on forest green, and CTA button matching design spec
- Created three role-specific placeholder pages (PM, DM, Executive) that read user identity and role from Supabase with defence-in-depth redirect on no session

## Task Commits

Each task was committed atomically:

1. **Task 1: Restructure routes into (dashboard) group and update root layout** - `ec3a318` (feat)
2. **Task 2: Create login page and placeholder dashboard pages** - `ba73eac` (feat)

**Plan metadata:** _(docs commit follows)_

## Files Created/Modified

- `src/app/layout.tsx` - Removed AppShell; now only provides html/body with font class variables
- `src/app/page.tsx` - Replaced Phase 1 demo with minimal redirect('/login')
- `src/app/(dashboard)/layout.tsx` - Wraps children in AppShell for all dashboard routes
- `src/app/login/page.tsx` - Login page: useActionState + login server action, centered card, inline error
- `src/app/(dashboard)/property/page.tsx` - PM dashboard: reads property_ids, empty state if none
- `src/app/(dashboard)/district/page.tsx` - DM dashboard: reads getUser, shows property count
- `src/app/(dashboard)/executive/page.tsx` - Executive dashboard: reads getUser, shows All Properties label

## Decisions Made

- **Card prop correction:** The plan's interface reference listed `shadow` as a valid Card prop, but the actual `card.tsx` implementation only has a `variant` prop. Removed the invalid prop (Rule 1 auto-fix). No behavioral impact — Card already has `shadow-sm` baked into its base classes.
- **Route group approach confirmed:** The (dashboard) group elegantly separates AppShell from the login page, following the plan exactly with no deviation needed.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Removed invalid `shadow` prop from Card component**
- **Found during:** Task 2 (TypeScript check after writing login page)
- **Issue:** Plan's interface reference listed `CardProps { shadow?: boolean }` but actual Card implementation only has `variant?: "default" | "flush"`. TypeScript error: Property 'shadow' does not exist.
- **Fix:** Removed `shadow` prop from Card usage in login page. Card already has `shadow-sm` in its base className.
- **Files modified:** src/app/login/page.tsx
- **Verification:** `npx tsc --noEmit` passes cleanly
- **Committed in:** ba73eac (Task 2 commit)

---

**Total deviations:** 1 auto-fixed (1 bug — incorrect interface reference in plan)
**Impact on plan:** Minimal; shadow-sm is already in Card's base styles. Visual output unchanged.

## Issues Encountered

None.

## User Setup Required

None — no external service configuration required in this plan. (Supabase credentials were covered in Plan 02-01 USER-SETUP section.)

## Next Phase Readiness

- Login page and dashboard route group complete — Plan 02-03 can build role-aware dashboard content using the same (dashboard) route group pattern
- All three placeholder pages are in place and reading user identity from Supabase
- Wave 0 test stubs from Plan 02-01 can now be filled in as implementation exists

---
*Phase: 02-authentication-and-property-scoping*
*Completed: 2026-03-12*
