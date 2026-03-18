---
phase: 11-vacant-unit-entry
plan: 03
subsystem: ui
tags: [react, next.js, airtable, supabase, vitest, typescript]

requires:
  - phase: 11-vacant-unit-entry plan 01
    provides: navigation (Add Vacant nav item in sidebar + bottom tab bar, ROLE_ALLOWED_ROUTES)
  - phase: 11-vacant-unit-entry plan 02
    provides: addVacantUnits server action with AddVacantUnitsResult type

provides:
  - src/app/(dashboard)/vacant/page.tsx — server component with auth, property fetch, PM filtering
  - src/app/(dashboard)/vacant/add-vacant-form.tsx — client form with repeatable unit cards, PropertyMultiSelect single mode, success/partial failure UI
  - src/app/(dashboard)/vacant/__tests__/add-vacant-form.test.tsx — 10 unit tests for form behavior

affects: [any phase that extends or modifies the /vacant route or AddVacantForm]

tech-stack:
  added: []
  patterns:
    - Server component page passes role-scoped data as props to client form (PM filter applied server-side)
    - Dynamic row array state with crypto.randomUUID() for stable React keys
    - Direct async server action call (not useActionState + FormData) for typed array payloads
    - Partial-failure UX: hybrid success/error card + form pre-populated with failed rows

key-files:
  created:
    - src/app/(dashboard)/vacant/page.tsx
    - src/app/(dashboard)/vacant/add-vacant-form.tsx
    - src/app/(dashboard)/vacant/__tests__/add-vacant-form.test.tsx
  modified:
    - src/lib/__tests__/auth-types.test.ts

key-decisions:
  - "handleAddMore keeps property selected; resets to emptyRow only on full success (partial failure keeps pre-populated failed rows)"
  - "removeRow is blocked (button disabled) when only 1 row remains — prevents empty card stack"
  - "Submit button disabled when validUnitCount === 0 (both fields must be filled); validation still catches empty fields on partially-filled rows"
  - "Floor plan <select> uses full sr-only-compatible label pattern for accessibility"

patterns-established:
  - "Pattern 1: Repeatable unit card state — UnitRow[] with crypto.randomUUID() ids, per-row error/warning booleans, add/remove/update helpers"
  - "Pattern 2: Direct server action call for typed payloads — addVacantUnits called as async function, not via FormData/useActionState"

requirements-completed: [UNIT-02, UNIT-03, UNIT-04, UNIT-05]

duration: 20min
completed: 2026-03-17
---

# Phase 11 Plan 03: Vacant Unit Entry Page and Form Summary

**Vacant unit entry page built as server component + client form with PM-scoped property dropdown, repeatable unit cards, floor plan validation, and partial-failure recovery UI**

## Performance

- **Duration:** ~20 min
- **Started:** 2026-03-17T19:40:00Z
- **Completed:** 2026-03-17T19:58:00Z
- **Tasks:** 3 (+ 1 checkpoint awaiting verification)
- **Files modified:** 4

## Accomplishments

- Server component fetches and deduplicates properties; PM users receive only their assigned properties (filtered by name strings from app_metadata.property_ids)
- Client form manages repeatable UnitRow[] state with add/remove/update, inline red/yellow validation, and a dynamic submit button label showing exact unit count
- Success card shows full or partial results; "Add More Units" keeps property selected for continued entry; failed rows are pre-populated for retry
- 10 unit tests cover UNIT-02 through UNIT-05, UNIT-08, dynamic label behavior, empty state, and single-row remove guard

## Task Commits

1. **Task 1: Create vacant page server component** - `63febe3` (feat)
2. **Task 2: Create AddVacantForm client component** - `ab49079` (feat)
3. **Task 3: Create unit tests for AddVacantForm** - `e01a5db` (test)
4. **Auto-fix: auth-types test stale route assertions** - `a30f22d` (fix)

## Files Created/Modified

- `src/app/(dashboard)/vacant/page.tsx` — async server component, auth guard, property fetch + dedup + PM filter, renders AddVacantForm
- `src/app/(dashboard)/vacant/add-vacant-form.tsx` — client form component with all CONTEXT.md locked decisions implemented
- `src/app/(dashboard)/vacant/__tests__/add-vacant-form.test.tsx` — 10 passing unit tests
- `src/lib/__tests__/auth-types.test.ts` — updated stale ROLE_ALLOWED_ROUTES assertions to include /vacant

## Decisions Made

- handleAddMore distinguishes partial vs full success: only resets rows to emptyRow() when there are no failed units
- removeRow disabled (button disabled) when rows.length <= 1 — prevents empty form state
- Floor plan `<select>` has visible label + htmlFor linkage for accessibility compliance

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed stale auth-types test assertions for ROLE_ALLOWED_ROUTES**
- **Found during:** Full test suite run after Task 3
- **Issue:** `src/lib/__tests__/auth-types.test.ts` had exact-match assertions for ROLE_ALLOWED_ROUTES arrays that did not include `/vacant`. The arrays were correct in `auth.ts` (updated in Plan 11-01) but tests were never updated, causing 3 test failures.
- **Fix:** Updated test descriptions and assertions for `pm`, `rm`, and `exec` to include `/vacant`
- **Files modified:** `src/lib/__tests__/auth-types.test.ts`
- **Verification:** All 202 tests pass (was 3 failures before fix)
- **Committed in:** `a30f22d`

---

**Total deviations:** 1 auto-fixed (Rule 1 — stale test assertions)
**Impact on plan:** Essential fix for test suite correctness. Pre-existing issue from Plan 11-01 that added /vacant to ROLE_ALLOWED_ROUTES but didn't update tests. No scope creep.

## Issues Encountered

- Validation test required adjustment: submit button is disabled when validUnitCount === 0, so triggering per-row validation required a test setup with at least one complete row plus one incomplete row. Test updated to add a second row with only floor plan filled.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- /vacant page complete with full add-vacant-units workflow
- All automated tasks done; awaiting human visual verification (Task 4 checkpoint)
- 202 tests passing including 10 new tests for this plan

---
*Phase: 11-vacant-unit-entry*
*Completed: 2026-03-17*
