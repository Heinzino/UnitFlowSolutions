---
phase: 03-airtable-data-layer
plan: 02
subsystem: database
tags: [airtable, typescript, next.js, caching, rate-limiting, vitest, tdd]

# Dependency graph
requires:
  - phase: 03-airtable-data-layer
    plan: 01
    provides: Airtable client, rate limiter, CACHE_TAGS, all 9 TypeScript interfaces

provides:
  - fetchTurnRequests, fetchTurnRequestsForUser, fetchTurnRequestById
  - fetchJobs, fetchJobsByIds, fetchJobById
  - fetchProperties, fetchVendors, fetchVendorPricing
  - fetchQuotes, fetchExecutives, fetchPropertyManagers, fetchMaintenanceManagers
  - mappers.ts with pure mapJob, mapTurnRequest, buildJobFilterFormula (testable without env vars)

affects:
  - 03-03 (write operations and cache busting consume same base/cacheTag patterns)
  - 04-exec-dashboard (fetchTurnRequests, fetchJobs as primary data sources)
  - 05-pm-view (fetchTurnRequestsForUser with role/property scoping)
  - 06-dm-view (same as PM view)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Pure mapper extraction — mappers.ts has zero external dependencies so it can be imported in tests without triggering Airtable env var guards"
    - "base<FieldSet>('TableName').select() — FieldSet generic goes on base() call, not select(), per airtable SDK type signature"
    - "OR() batch formula — buildJobFilterFormula([51,52,53]) → 'OR({Job ID}=51,{Job ID}=52,{Job ID}=53)'; single ID skips OR wrapper"
    - "resolveLinkedJobs — collects all unique jobIds across turn requests, single fetchJobsByIds call, distributes back by jobId"
    - "fetchTurnRequestsForUser — role=exec returns all, pm/dm filtered via filterByProperties"

key-files:
  created:
    - src/lib/airtable/tables/mappers.ts
    - src/lib/airtable/tables/jobs.ts
    - src/lib/airtable/tables/turn-requests.ts
    - src/lib/airtable/tables/properties.ts
    - src/lib/airtable/tables/vendors.ts
    - src/lib/airtable/tables/vendor-pricing.ts
    - src/lib/airtable/tables/quotes.ts
    - src/lib/airtable/tables/executives.ts
    - src/lib/airtable/tables/property-managers.ts
    - src/lib/airtable/tables/maintenance-managers.ts
    - src/lib/airtable/__tests__/mappers.test.ts
  modified: []

key-decisions:
  - "Mappers extracted to mappers.ts (separate from jobs.ts/turn-requests.ts) so tests can import pure functions without triggering Airtable client env var throw"
  - "Test mocks use 'as unknown as Parameters<typeof mapJob>[0]' — direct cast fails because AirtableRecord has SDK methods not present in plain objects"
  - "base<FieldSet>('Table') pattern used throughout — the FieldSet generic belongs on base() not select() per airtable SDK AirtableBase interface"

requirements-completed: [DATA-02, DATA-05]

# Metrics
duration: 9min
completed: 2026-03-12
---

# Phase 3 Plan 02: All 9 Airtable Table Fetch Functions Summary

**All 9 Airtable tables have typed fetch functions with use cache + cacheLife + cacheTag + rateLimiter.acquire(); Turn Requests batch-resolve linked Jobs via OR() filterByFormula with no N+1; property scoping via filterByProperties for pm/dm roles**

## Performance

- **Duration:** 9 min
- **Started:** 2026-03-12T03:45:37Z
- **Completed:** 2026-03-12T03:54:59Z
- **Tasks:** 2
- **Files modified:** 11 created

## Accomplishments

- mappers.ts: pure mapJob, mapTurnRequest, buildJobFilterFormula — testable without env var setup
- jobs.ts: fetchJobs, fetchJobsByIds (batch OR formula), fetchJobById with record-level cache tags
- turn-requests.ts: fetchTurnRequests, fetchTurnRequestById, fetchTurnRequestsForUser with batch job resolution
- resolveLinkedJobs: collects all unique jobIds, single fetchJobsByIds call, distributes back to parent records
- properties.ts, vendors.ts, vendor-pricing.ts, quotes.ts, executives.ts, property-managers.ts, maintenance-managers.ts: 7 simple table fetchers
- 13 mapper tests pass covering all formula-builder cases and null/field-mapping scenarios
- npx tsc --noEmit: clean — no type errors

## Task Commits

Each task was committed atomically:

1. **Task 1: Build Turn Requests and Jobs with linked record resolution** - `06fe74d` (feat)
2. **Task 2: Build remaining 7 table fetchers + FieldSet type fixes** - `901e801` (feat)

## Files Created

- `src/lib/airtable/tables/mappers.ts` - Pure mapJob, mapTurnRequest, buildJobFilterFormula
- `src/lib/airtable/tables/jobs.ts` - fetchJobs, fetchJobsByIds (OR batch), fetchJobById
- `src/lib/airtable/tables/turn-requests.ts` - fetchTurnRequests, fetchTurnRequestById, fetchTurnRequestsForUser, resolveLinkedJobs
- `src/lib/airtable/tables/properties.ts` - fetchProperties
- `src/lib/airtable/tables/vendors.ts` - fetchVendors
- `src/lib/airtable/tables/vendor-pricing.ts` - fetchVendorPricing
- `src/lib/airtable/tables/quotes.ts` - fetchQuotes (uses record.id as quoteId)
- `src/lib/airtable/tables/executives.ts` - fetchExecutives
- `src/lib/airtable/tables/property-managers.ts` - fetchPropertyManagers
- `src/lib/airtable/tables/maintenance-managers.ts` - fetchMaintenanceManagers
- `src/lib/airtable/__tests__/mappers.test.ts` - 13 tests for mappers and formula builder

## Decisions Made

- **Mapper extraction:** mappers.ts has zero runtime dependencies (only type imports from airtable/local types). This allows the test file to import mappers directly without touching client.ts which throws on missing env vars.
- **TypeScript cast in tests:** Plain objects cannot be directly cast to `AirtableRecord<FieldSet>` because the SDK type includes methods (_table, _rawJson, save, etc.). Used `as unknown as` double-cast pattern instead.
- **FieldSet generic placement:** The airtable SDK's `AirtableBase` interface shows `<TFields extends FieldSet>(tableName: string): Table<TFields>` — the generic belongs on the `base()` call, not on `.select()`.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocker] Extracted mappers to mappers.ts to resolve test env var issue**
- **Found during:** Task 1 (RED phase — tests failed with AIRTABLE_API_KEY error)
- **Issue:** Test file imported from jobs.ts which transitively imported client.ts which throws at module load time if AIRTABLE_API_KEY is not set. Pure mapper functions have no business depending on the Airtable client.
- **Fix:** Moved mapJob, mapTurnRequest, buildJobFilterFormula to mappers.ts with only type imports. jobs.ts and turn-requests.ts import from mappers.ts and re-export for consumers. Test imports from mappers.ts directly.
- **Files modified:** src/lib/airtable/tables/mappers.ts (new), src/lib/airtable/tables/jobs.ts, src/lib/airtable/tables/turn-requests.ts, src/lib/airtable/__tests__/mappers.test.ts
- **Commit:** 06fe74d (Task 1)

**2. [Rule 1 - Bug] Fixed Airtable FieldSet type parameter placement**
- **Found during:** Task 2 (TypeScript verification failed with TS2558: Expected 0 type arguments)
- **Issue:** Initial code used `.select<FieldSet>()` but the SDK's `TableSelectRecord` interface takes no generic — the FieldSet generic belongs on the `base()` call per `AirtableBase` interface definition.
- **Fix:** Changed `base('TableName').select<FieldSet>()` to `base<FieldSet>('TableName').select()` across all 9 table files.
- **Files modified:** All 9 src/lib/airtable/tables/*.ts files
- **Commit:** 901e801 (Task 2)

**3. [Rule 1 - Bug] Fixed test cast to use as unknown as for AirtableRecord**
- **Found during:** Task 2 (TypeScript verification: TS2352 cast overlap error)
- **Issue:** Plain mock objects cannot be directly cast to `AirtableRecord<FieldSet>` because the SDK record type includes many methods not present in plain objects.
- **Fix:** Changed `record as Parameters<typeof mapJob>[0]` to `record as unknown as Parameters<typeof mapJob>[0]` throughout test file.
- **Files modified:** src/lib/airtable/__tests__/mappers.test.ts
- **Commit:** 901e801 (Task 2)

---

**Total deviations:** 3 auto-fixed (Rules 1 and 3 — all within scope of Task 1 and Task 2 changes)
**Impact on plan:** Mapper extraction is a net improvement — cleaner separation of pure logic from I/O. Type fixes are required for correctness; no scope creep.

## Issues Encountered

None beyond auto-fixed deviations above.

## Next Phase Readiness

- All 9 fetch functions ready for Phase 4 (exec dashboard), Phase 5 (PM view), Phase 6 (DM view)
- CACHE_TAGS already defined for all tables — cache busting in 03-03 can proceed
- mappers.ts exports provide stable test surface for any future unit tests
- No blockers

---
*Phase: 03-airtable-data-layer*
*Completed: 2026-03-12*
