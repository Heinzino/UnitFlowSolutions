---
phase: 10-admin-user-creation
plan: "01"
subsystem: auth
tags: [supabase, server-actions, airtable, vitest, tdd, server-only]

# Dependency graph
requires:
  - phase: 09-existing (v1.0)
    provides: Supabase server client pattern and Airtable client/rateLimiter used as base
provides:
  - Supabase admin client with service-role key isolated behind server-only guard
  - ADMIN_EMAILS allowlist constant shared across codebase
  - createUser server action (admin-gated, generates password, creates Supabase user via Admin API)
  - createProperty server action (admin-gated, creates Airtable record, invalidates cache)
  - Unit tests for both server actions (6 passing)
affects: [10-02-navigation, 10-03-form-page, 11-vacant-unit-entry]

# Tech tracking
tech-stack:
  added: [server-only@1.0.0]
  patterns:
    - Admin Supabase client uses createClient from @supabase/supabase-js directly (not @supabase/ssr) with autoRefreshToken/persistSession false
    - vi.hoisted() required for Vitest mock variables used inside vi.mock() factories

key-files:
  created:
    - src/lib/supabase/admin.ts
    - src/lib/constants/admin.ts
    - src/app/actions/admin.ts
    - src/app/actions/admin.test.ts
  modified:
    - package.json (added server-only dependency)

key-decisions:
  - "server-only package installed as explicit dependency (not just Next.js peer) to enable Vite import resolution in tests"
  - "vi.hoisted() used in test file to ensure mock variables are initialized before vi.mock() factory execution"
  - "property_ids in app_metadata stores property NAMES (strings), matching existing auth pattern in v1.0"
  - "email_confirm: true on createUser skips confirmation email — admin delivers credentials manually"

patterns-established:
  - "Admin guard pattern: check user.email against ADMIN_EMAILS allowlist at top of each admin server action"
  - "Password generation uses crypto.getRandomValues with curated character set, length >= 16"
  - "Test mocks for vi.mock() factories that reference outer variables must use vi.hoisted()"

requirements-completed: [USER-01, USER-04]

# Metrics
duration: 4min
completed: 2026-03-15
---

# Phase 10 Plan 01: Admin Server Actions Summary

**Supabase Admin API client with service-role key isolation and createUser/createProperty server actions with admin email allowlist guard, password generation, and 6 passing unit tests**

## Performance

- **Duration:** 4 min
- **Started:** 2026-03-16T03:07:13Z
- **Completed:** 2026-03-16T03:10:39Z
- **Tasks:** 2 (Task 1 + TDD Task 2 with 3 commits)
- **Files modified:** 5

## Accomplishments
- Admin Supabase client isolated with `server-only` guard using service-role key (never exposed to browser)
- `ADMIN_EMAILS` constant in shared location, imported by server actions and future navigation
- `createUser` action validates admin caller, validates form inputs, generates 16-char password, creates Supabase user with `email_confirm: true`, stores `property_ids` (names, not record IDs) in `app_metadata`
- `createProperty` action validates admin caller, creates Airtable record via rate limiter, invalidates properties cache
- 6 unit tests pass covering success path, unauthorized caller, unauthenticated, Supabase error, Airtable create, and cache invalidation

## Task Commits

Each task was committed atomically:

1. **Task 1: Create admin Supabase client and shared constants** - `d482eb7` (feat)
2. **Task 2 RED: Add failing tests for createUser and createProperty** - `ccc6951` (test)
3. **Task 2 GREEN: Implement createUser and createProperty server actions** - `dee7a93` (feat)

_Note: TDD task has test commit followed by implementation commit_

## Files Created/Modified
- `src/lib/supabase/admin.ts` - Admin Supabase client with server-only guard and service-role key
- `src/lib/constants/admin.ts` - ADMIN_EMAILS allowlist: heinz@readymation.com, jgiles@cdvsolutions.com
- `src/app/actions/admin.ts` - createUser and createProperty server actions
- `src/app/actions/admin.test.ts` - 6 unit tests using vi.hoisted() mock pattern
- `package.json` / `package-lock.json` - Added server-only dependency

## Decisions Made
- `server-only` installed as explicit dependency (not assumed peer) so Vite can resolve it during tests
- `vi.hoisted()` used in test file to lift mock variable declarations before `vi.mock()` factory hoisting
- `property_ids` in `app_metadata` stores property names (strings) to match existing v1.0 auth pattern
- `email_confirm: true` on `createUser` skips confirmation email — admin delivers credentials manually

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Installed missing server-only package**
- **Found during:** Task 2 (TDD GREEN phase — running tests)
- **Issue:** `server-only` package not in `package.json`; Vite import analysis failed to resolve it, blocking test suite
- **Fix:** Ran `npm install server-only`
- **Files modified:** package.json, package-lock.json
- **Verification:** Tests ran successfully after install
- **Committed in:** `dee7a93` (Task 2 implementation commit)

**2. [Rule 1 - Bug] Fixed vi.mock() hoisting order in test file**
- **Found during:** Task 2 (TDD GREEN phase — first test run)
- **Issue:** `mockBase` and other mock variables referenced in `vi.mock()` factory were `const` declarations, causing "Cannot access before initialization" because `vi.mock()` is hoisted above all `const` declarations
- **Fix:** Rewrote test to use `vi.hoisted()` to declare all mock variables before factory execution
- **Files modified:** src/app/actions/admin.test.ts
- **Verification:** All 6 tests pass
- **Committed in:** `dee7a93` (same commit — test file updated alongside implementation)

---

**Total deviations:** 2 auto-fixed (1 blocking dependency, 1 test infrastructure bug)
**Impact on plan:** Both fixes essential for tests to run. No scope creep.

## Issues Encountered
- Vitest v4 does not support the `-x` (bail) flag — removed from test run command (flag not needed for the run)

## User Setup Required
None - no external service configuration required. `SUPABASE_SERVICE_ROLE_KEY` env var must already be present in `.env.local` for the admin client to work at runtime (pre-existing requirement).

## Next Phase Readiness
- Admin Supabase client ready for import in any server-side code
- `ADMIN_EMAILS` constant ready for use in navigation visibility checks (Phase 10 plan 02)
- `createUser` and `createProperty` actions ready for the form page (Phase 10 plan 03)
- No blockers for Phase 10 plan 02 (navigation) or plan 03 (form page)

---
*Phase: 10-admin-user-creation*
*Completed: 2026-03-15*

## Self-Check: PASSED

- FOUND: src/lib/supabase/admin.ts
- FOUND: src/lib/constants/admin.ts
- FOUND: src/app/actions/admin.ts
- FOUND: src/app/actions/admin.test.ts
- FOUND: .planning/phases/10-admin-user-creation/10-01-SUMMARY.md
- FOUND commit: d482eb7 (feat: admin Supabase client and constants)
- FOUND commit: ccc6951 (test: failing tests RED phase)
- FOUND commit: dee7a93 (feat: implementation GREEN phase)
- FOUND commit: ca81b79 (docs: plan metadata)
