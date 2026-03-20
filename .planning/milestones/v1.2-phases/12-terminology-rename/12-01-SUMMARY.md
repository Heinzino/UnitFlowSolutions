---
phase: 12-terminology-rename
plan: 01
subsystem: api
tags: [typescript, airtable, kpi, types]

# Dependency graph
requires: []
provides:
  - TurnRequest interface with offMarketDate and daysOffMarketUntilReady properties
  - PMKPIResult interface with activeTurns and avgTurnTime fields
  - ExecutiveKPIResult interface with activeTurnsOpen field
  - Airtable mapper output using new property names (Airtable field strings preserved)
affects:
  - phase 12 plan 02 (consumer updates — UI components, tests, health-score)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Airtable boundary pattern: field strings in f['...'] are immutable; only TypeScript property names on the left-hand side of the assignment change"

key-files:
  created: []
  modified:
    - src/lib/types/airtable.ts
    - src/lib/kpis/pm-kpis.ts
    - src/lib/kpis/executive-kpis.ts
    - src/lib/airtable/tables/mappers.ts

key-decisions:
  - "Airtable field strings ('Vacant Date', 'Days Vacant Until Ready') remain unchanged — only TypeScript property names are renamed"
  - "Type-layer rename creates intentional TypeScript compile errors in consumers, making Plan 02 self-verifying via tsc --noEmit"

patterns-established:
  - "Airtable boundary: left-hand side of mapper assignment uses new TS property name, right-hand side f['...'] field string is frozen"

requirements-completed: [TERM-01, TERM-02, TERM-04]

# Metrics
duration: 10min
completed: 2026-03-18
---

# Phase 12 Plan 01: Terminology Rename — Types and Mapper Summary

**TurnRequest, PMKPIResult, and ExecutiveKPIResult interfaces renamed from Make Ready/Vacant to Turn/Off Market vocabulary, with mapper boundary preserved**

## Performance

- **Duration:** ~10 min
- **Started:** 2026-03-18T00:00:00Z
- **Completed:** 2026-03-18
- **Tasks:** 2
- **Files modified:** 4

## Accomplishments
- Renamed two TurnRequest properties: `vacantDate` -> `offMarketDate`, `daysVacantUntilReady` -> `daysOffMarketUntilReady`
- Renamed PMKPIResult fields and local variables: `activeMakeReadys` -> `activeTurns`, `avgMakeReadyTime` -> `avgTurnTime`
- Renamed ExecutiveKPIResult field and local variable: `activeMakeReadysOpen` -> `activeTurnsOpen`
- Updated mapper output property names to match new TurnRequest interface while keeping Airtable field strings (`'Vacant Date'`, `'Days Vacant Until Ready'`) completely unchanged

## Task Commits

Each task was committed atomically:

1. **Task 1: Rename type definitions and KPI interfaces** - `359ff67` (feat)
2. **Task 2: Rename mapper output properties** - `ecd3030` (feat)

## Files Created/Modified
- `src/lib/types/airtable.ts` - TurnRequest interface: two properties renamed to offMarketDate and daysOffMarketUntilReady
- `src/lib/kpis/pm-kpis.ts` - PMKPIResult interface and computePMKPIs function: activeTurns, avgTurnTime, daysOffMarketUntilReady
- `src/lib/kpis/executive-kpis.ts` - ExecutiveKPIResult interface and computeExecutiveKPIs function: activeTurnsOpen, daysOffMarketUntilReady (two occurrences)
- `src/lib/airtable/tables/mappers.ts` - mapTurnRequest return object: offMarketDate and daysOffMarketUntilReady property names (field strings unchanged)

## Decisions Made
- Followed the Airtable boundary pattern strictly: `f['Vacant Date']` and `f['Days Vacant Until Ready']` field strings left untouched — renaming them would silently break data retrieval since the Airtable schema cannot be changed from the application side
- Intentionally left test files and downstream consumer files (health-score.ts, UI components) with old names — these are Plan 02 scope; the TypeScript errors they generate act as a self-verifying task list

## Deviations from Plan

None — plan executed exactly as written.

## Issues Encountered
None.

## User Setup Required
None — no external service configuration required.

## Next Phase Readiness
- Type layer fully renamed; TypeScript compile errors now appear in all consumers (health-score.ts, test files, UI components)
- Plan 02 can proceed: run `npx tsc --noEmit` to enumerate every remaining consumer that needs updating
- Zero occurrences of old names remain in the four target files

---
*Phase: 12-terminology-rename*
*Completed: 2026-03-18*
