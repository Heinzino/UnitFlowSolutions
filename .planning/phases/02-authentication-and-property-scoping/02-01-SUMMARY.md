---
phase: 02-authentication-and-property-scoping
plan: "01"
subsystem: auth
tags: [supabase, supabase-ssr, nextjs, middleware, server-actions, property-normalization]

# Dependency graph
requires:
  - phase: 01-scaffolding
    provides: Next.js app scaffold, TypeScript config, Vitest setup, Tailwind design system

provides:
  - Supabase browser client factory (createBrowserClient)
  - Supabase server client factory with getAll/setAll cookie pattern
  - Middleware updateSession helper with role-based routing
  - Route protection middleware (unauthenticated -> /login, role enforcement)
  - Login/logout server actions (signInWithPassword, signOut)
  - UserRole type, ROLE_ROUTES, AppMetadata, ROLE_LABELS type definitions
  - normalizePropertyName, propertyMatches, filterByProperties utility functions
  - Wave 0 test stubs for login page (AUTH-01) and auth actions (AUTH-02, AUTH-05)

affects:
  - 02-02-login-page
  - 02-03-role-dashboards
  - 03-airtable-data-layer
  - all phases that read user identity or filter by property

# Tech tracking
tech-stack:
  added:
    - "@supabase/supabase-js ^2.x — Supabase client SDK"
    - "@supabase/ssr ^0.x — SSR-safe client factories with cookie handling"
  patterns:
    - "getAll/setAll only in createServerClient cookie config (never individual get/set/remove)"
    - "getUser() in middleware and server code (never getSession())"
    - "supabaseResponse variable reassigned inside setAll callback for token refresh"
    - "ROLE_ROUTES lookup for role-based redirects throughout auth layer"
    - "app_metadata.role for secure role storage (not user_metadata — user-editable)"
    - "Server Actions for auth mutations (login/logout) — credentials never reach browser"

key-files:
  created:
    - src/lib/types/auth.ts
    - src/lib/supabase/client.ts
    - src/lib/supabase/server.ts
    - src/lib/supabase/middleware.ts
    - src/middleware.ts
    - src/app/actions/auth.ts
    - src/lib/normalize-property-name.ts
    - src/lib/__tests__/normalize-property-name.test.ts
    - src/middleware.test.ts
    - src/app/login/__tests__/login-page.test.tsx
    - src/app/actions/__tests__/auth.test.ts
    - .env.local.example
  modified:
    - package.json (added @supabase/supabase-js, @supabase/ssr)

key-decisions:
  - "Used ROLE_ROUTES imported from src/lib/types/auth.ts in both middleware and server actions for single source of truth"
  - "supabaseResponse reassigned inside setAll per official pattern to prevent session drift on token refresh"
  - "normalizePropertyName uses toLowerCase().trim() — simple, deterministic, matches both sides at comparison time"
  - "Wave 0 test stubs use it.todo so plan 02-02/02-03 can fill implementations without restructuring test files"

patterns-established:
  - "Pattern: Middleware updateSession — all route protection centralized in src/lib/supabase/middleware.ts"
  - "Pattern: Server client — async createClient() with cookieStore from next/headers"
  - "Pattern: Browser client — sync createClient() wrapping createBrowserClient"
  - "Pattern: Property normalization — lowercase+trim both sides at comparison time, never at storage time"

requirements-completed: [AUTH-01, AUTH-02, AUTH-03, AUTH-04, AUTH-05, AUTH-06, SCOPE-04]

# Metrics
duration: 4min
completed: 2026-03-12
---

# Phase 02 Plan 01: Auth Infrastructure Summary

**Supabase SSR auth infrastructure with @supabase/ssr client factories, middleware token refresh, role-based routing, and property name normalization utility**

## Performance

- **Duration:** 4 min
- **Started:** 2026-03-12T00:39:56Z
- **Completed:** 2026-03-12T00:43:59Z
- **Tasks:** 2
- **Files modified:** 13

## Accomplishments

- Installed @supabase/supabase-js and @supabase/ssr and created three client factories (browser, server, middleware) following official getAll/setAll cookie pattern
- Built middleware updateSession with role-based routing: unauthenticated to /login, authenticated on /login to role dashboard, wrong-role route to own dashboard, root to role dashboard
- Implemented login/logout server actions and property name normalization with 14 passing unit tests and Wave 0 test stubs for plan 02-02

## Task Commits

Each task was committed atomically:

1. **Task 1: Install Supabase packages and create client factories + types** - `cf430fc` (feat)
2. **Task 2: Middleware, auth actions, normalization, Wave 0 stubs** - `52e06c0` (feat)

**Plan metadata:** _(docs commit follows)_

_Note: Task 2 used TDD pattern — tests written first (RED), then implementation (GREEN)_

## Files Created/Modified

- `src/lib/types/auth.ts` — UserRole, ROLE_ROUTES, AppMetadata, ROLE_LABELS type definitions
- `src/lib/supabase/client.ts` — Browser Supabase client factory using createBrowserClient
- `src/lib/supabase/server.ts` — Server Supabase client factory with getAll/setAll cookie pattern
- `src/lib/supabase/middleware.ts` — updateSession helper: token refresh + role-based routing logic
- `src/middleware.ts` — Next.js middleware entry point, imports updateSession, exports config matcher
- `src/app/actions/auth.ts` — login/logout server actions using signInWithPassword/signOut
- `src/lib/normalize-property-name.ts` — normalizePropertyName, propertyMatches, filterByProperties
- `src/lib/__tests__/normalize-property-name.test.ts` — 14 passing tests covering all normalization behaviors
- `src/middleware.test.ts` — Middleware config export tests
- `src/app/login/__tests__/login-page.test.tsx` — Wave 0 stubs for AUTH-01 (login form)
- `src/app/actions/__tests__/auth.test.ts` — Wave 0 stubs for AUTH-02, AUTH-05
- `.env.local.example` — Env var template with placeholder values
- `package.json` — Added @supabase/supabase-js and @supabase/ssr dependencies

## Decisions Made

- **ROLE_ROUTES single source of truth:** Defined in `src/lib/types/auth.ts` and imported in both `src/lib/supabase/middleware.ts` and `src/app/actions/auth.ts`. Prevents divergence if routes change.
- **supabaseResponse reassignment pattern:** Followed the official Supabase pattern exactly — `supabaseResponse` is reassigned inside the `setAll` callback. This is critical for preventing session drift on token refresh.
- **normalizePropertyName approach:** `toLowerCase().trim()` applied at comparison time (not storage time). Both Airtable name and stored Supabase name are normalized before comparing. Avoids needing to re-normalize stored data if the function changes.
- **Wave 0 test stubs use it.todo:** Stub tests are structured so Plan 02-02 can implement them without restructuring file layout.

## Deviations from Plan

None — plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

**External services require manual configuration.** Before Plan 02-02 (login page) can be tested end-to-end:

1. Create a Supabase project at https://supabase.com/dashboard
2. Copy `.env.local.example` to `.env.local` and fill in:
   - `NEXT_PUBLIC_SUPABASE_URL` — Project URL from Supabase Dashboard -> Settings -> API
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` — anon/public key from same location
   - `SUPABASE_SERVICE_ROLE_KEY` — service_role key (for admin scripts only)
3. Create users via Supabase Dashboard -> Authentication -> Users
4. Set `app_metadata.role` and `app_metadata.property_ids` on each user via SQL Editor or admin API

## Next Phase Readiness

- Auth infrastructure complete — Plan 02-02 can build the login page component that uses these server actions
- Plan 02-03 can build role dashboards using the createClient server factory and ROLE_ROUTES
- Phase 3 (Airtable data layer) can use normalizePropertyName/propertyMatches for property filtering
- Wave 0 test stubs in place — Plan 02-02 fills in login-page tests, Plan 02-03 fills in auth action tests

---
*Phase: 02-authentication-and-property-scoping*
*Completed: 2026-03-12*
