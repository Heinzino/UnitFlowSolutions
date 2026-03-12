---
phase: 02-authentication-and-property-scoping
plan: 03
subsystem: ui
tags: [react, nextjs, supabase, server-components, tailwind]

requires:
  - phase: 02-authentication-and-property-scoping
    provides: logout server action, createClient, ROLE_LABELS, AppMetadata types, Badge component, AppShell component

provides:
  - Sidebar with working logout via form action calling server action
  - UserHeader async server component showing user name, role badge, and property context
  - PropertySelector client component with single/multi-property dropdown rendering
  - PropertySelectorWrapper client component managing selected property state
  - AppShell updated with userHeader slot prop
  - Dashboard layout passing UserHeader to AppShell via Suspense

affects:
  - phase 05 (PM dashboard will use PropertySelector for property-scoped data filtering)
  - future phases using AppShell layout

tech-stack:
  added: []
  patterns:
    - Server component slot prop pattern — async server component (UserHeader) passed as React.ReactNode prop to client component (AppShell)
    - Form action pattern for server actions — form with action={serverAction} enables logout without client-side JS dependency
    - Client wrapper pattern — PropertySelectorWrapper manages useState, server component passes props down

key-files:
  created:
    - src/components/layout/user-header.tsx
    - src/components/layout/property-selector.tsx
    - src/components/layout/property-selector-wrapper.tsx
  modified:
    - src/components/layout/sidebar.tsx
    - src/components/layout/app-shell.tsx
    - src/app/(dashboard)/layout.tsx

key-decisions:
  - "PropertySelectorWrapper is a separate client file — server component (UserHeader) cannot manage useState, so wrapper component bridges server→client boundary"
  - "AppShell accepts userHeader as React.ReactNode slot prop — avoids converting client component to server while allowing async server component in header"
  - "Suspense wraps UserHeader in dashboard layout — handles async server component loading with Skeleton fallback"
  - "Form action pattern for logout — works without JS since logout is a server action, more resilient than onClick handler"

patterns-established:
  - "Server component slot prop pattern: pass async server components as React.ReactNode to client components"
  - "Client state wrapper pattern: create thin 'use client' wrapper to manage state, pass as props to reusable child"

requirements-completed: [AUTH-05, SCOPE-01, SCOPE-02, SCOPE-03]

duration: 2min
completed: 2026-03-12
---

# Phase 02 Plan 03: Auth UX Layer Summary

**Sidebar logout via form server action, UserHeader server component with role badge and property context, PropertySelector dropdown for PM multi-property switching**

## Performance

- **Duration:** ~2 min
- **Started:** 2026-03-12T00:50:58Z
- **Completed:** 2026-03-12T00:52:36Z
- **Tasks:** 2 (+ 1 checkpoint awaiting human verification)
- **Files modified:** 6

## Accomplishments
- Sidebar logout button now submits a form action to the `logout` server action, redirecting to /login
- UserHeader async server component reads user from Supabase, displays name, role badge (via Badge component), and property context
- PropertySelector renders a styled dropdown for PMs with multiple properties; plain text for single property
- AppShell updated with `userHeader` slot prop, dashboard layout passes `<UserHeader />` wrapped in Suspense

## Task Commits

Each task was committed atomically:

1. **Task 1: Wire sidebar logout and create UserHeader + PropertySelector components** - `1f4b6f9` (feat)
2. **Task 2: Integrate UserHeader into AppShell and update dashboard layout** - `d38a180` (feat)

## Files Created/Modified
- `src/components/layout/sidebar.tsx` - Added logout server action import, replaced onClick stub with form action
- `src/components/layout/user-header.tsx` - New async server component showing user name, role badge, property context
- `src/components/layout/property-selector.tsx` - New client component with single/multi-property rendering
- `src/components/layout/property-selector-wrapper.tsx` - New client wrapper managing selected property state
- `src/components/layout/app-shell.tsx` - Added userHeader slot prop, replaced static User icon with slot
- `src/app/(dashboard)/layout.tsx` - Updated to pass UserHeader in Suspense to AppShell

## Decisions Made
- Used a separate `PropertySelectorWrapper` client file rather than inlining a client component inside the server component file — cleaner separation and avoids "use client" in a server component file
- AppShell slot prop pattern chosen over converting AppShell to server component — AppShell needs `usePathname` (client hook), so the slot prop is the cleanest solution
- Suspense fallback uses `<Skeleton className="w-32 h-8" />` matching existing Skeleton component API

## Deviations from Plan

None - plan executed exactly as written. The plan's "Note on PropertySelector integration" guidance about a local `'use client'` wrapper was implemented as a separate file (`property-selector-wrapper.tsx`) rather than inlining it in user-header.tsx, which is a cleaner organization pattern with the same effect.

## Issues Encountered
None.

## User Setup Required
None - no external service configuration required for this plan's code changes. Human verification of the complete auth flow end-to-end requires a Supabase project configured with users having `app_metadata.role` and `app_metadata.property_ids` set.

## Next Phase Readiness
- Complete auth UX layer: login page, middleware, role routing, sidebar logout, user identity header
- Phase 3 (Airtable data layer) can proceed — no auth blockers remain
- PropertySelector is reusable for Phase 5 PM view property filtering
- Human verification of auth flow still pending (Task 3 checkpoint)

---
*Phase: 02-authentication-and-property-scoping*
*Completed: 2026-03-12*
