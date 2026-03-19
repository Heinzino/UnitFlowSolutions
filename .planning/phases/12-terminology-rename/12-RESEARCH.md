# Phase 12: Terminology Rename - Research

**Researched:** 2026-03-18
**Domain:** Codebase-wide vocabulary rename — TypeScript identifiers and UI labels
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Route renaming**
- Keep the `/vacant` route path as-is — do NOT rename the URL
- Keep file names as-is (`add-vacant-form.tsx`, `vacant.ts`, etc.) — no file renames
- Sidebar and bottom tab bar nav label: sidebar already reads "Add Off Market" — verify bottom-tab-bar matches
- Auth route config (`ROLE_ALLOWED_ROUTES`) keeps `/vacant` strings unchanged
- Test descriptions that reference `/vacant` as a route string stay as-is (match the code)

**Make Ready disambiguation**
- Every instance of "Make Ready" maps to "Turn" — there are zero cases where "Make Ready" becomes "Job"
- "Make Ready Overview" section header becomes "Turn Overview"
- "Make Readys Past Target Time" becomes "Turns Past Target Time"
- "Active Make Readys (On Schedule)" becomes "Active Turns (On Schedule)"
- KPI labels: "Active Make Readys" → "Active Turns", "Avg Make Ready Time" → "Avg Turn Time", etc.

**Airtable mapping boundary**
- Airtable field strings (e.g., `f['Vacant Date']`, `f['Days Vacant Until Ready']`) are UNTOUCHED
- TypeScript properties renamed: `vacantDate` → `offMarketDate`, `daysVacantUntilReady` → `daysOffMarketUntilReady`
- All consuming code updates to new property names in one pass
- Rename TurnRequest properties, PM KPI types, Executive KPI types, and all consumers — all in Phase 12
- Executive KPI identifiers renamed now even though Phase 16 will redesign them

**Identifier naming style**
- Direct swap: `activeMakeReadys` → `activeTurns`, `avgMakeReadyTime` → `avgTurnTime`, `activeMakeReadysOpen` → `activeTurnsOpen`
- Keep `TurnRequest` interface name as-is (already correct)
- Keep `Job` interface name as-is (already correct)
- UI labels use plural form: "Active Turns", "Turns Past Target Time"

### Claude's Discretion
- Order of file changes within the rename (which files to update first)
- How to structure the plan (single plan vs multiple plans)
- Test update strategy (update inline vs batch)

### Deferred Ideas (OUT OF SCOPE)
None — discussion stayed within phase scope.
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| TERM-01 | All dashboard views display "Turns" instead of "Make Ready" for unit turnover events | 9 occurrences identified across 5 source files + 2 test files — full file list below |
| TERM-02 | All dashboard views display "Jobs" instead of "Make Ready" for vendor work items | No "Make Ready" maps to "Job" per locked decisions — TERM-01 covers all Make Ready instances |
| TERM-03 | All dashboard views display "Off Market" instead of "Vacant" for unit status | UI label occurrences in mobile-turn-card, turn-detail-view, health-gauge, component showcase — identified below |
| TERM-04 | TypeScript identifiers updated to match new terminology | TurnRequest properties, PMKPIResult fields, ExecutiveKPIResult fields, all consumers — full mapping below |
</phase_requirements>

---

## Summary

Phase 12 is a mechanical vocabulary substitution with zero logic changes. The rename scope is fully enumerable from the codebase: 9 occurrences of "Make Ready" / "makeReady" across source and test files, and 24 files touching "Vacant" / "vacant" — of which only a subset require changes (the rest are route strings, file names, and Airtable field strings that are explicitly locked).

The primary technical challenge is the property cascade: renaming `vacantDate` and `daysVacantUntilReady` on `TurnRequest` causes a TypeScript compile error at every consumer. This makes the rename self-verifying — `tsc --noEmit` will catch any missed reference. Similarly, renaming `activeMakeReadys`/`avgMakeReadyTime` on `PMKPIResult` and `activeMakeReadysOpen` on `ExecutiveKPIResult` cascades to all components and tests.

The sidebar and bottom-tab-bar already display "Add Off Market" (previously done). This reduces the nav-label scope to verification only, not change.

**Primary recommendation:** Start with type definitions (`airtable.ts`, `pm-kpis.ts`, `executive-kpis.ts`), let TypeScript errors guide all consumer updates, then fix UI string literals and test descriptions last.

---

## Complete Rename Map

### TurnRequest Properties (`src/lib/types/airtable.ts`)

| Before | After | Notes |
|--------|-------|-------|
| `vacantDate: string \| null` | `offMarketDate: string \| null` | Type property only — Airtable field `'Vacant Date'` unchanged |
| `daysVacantUntilReady: number \| null` | `daysOffMarketUntilReady: number \| null` | Type property only — Airtable field `'Days Vacant Until Ready'` unchanged |

### PMKPIResult Fields (`src/lib/kpis/pm-kpis.ts`)

| Before | After |
|--------|-------|
| `activeMakeReadys: number` | `activeTurns: number` |
| `avgMakeReadyTime: number \| null` | `avgTurnTime: number \| null` |
| `const activeMakeReadys = ...` | `const activeTurns = ...` |
| `const avgMakeReadyTime = ...` | `const avgTurnTime = ...` |
| Comment: `PM-01: Active Make Readys` | `PM-01: Active Turns` |
| Comment: `PM-04: Avg Make Ready Time` | `PM-04: Avg Turn Time` |
| `daysVacantUntilReady` (consumer) | `daysOffMarketUntilReady` |

### ExecutiveKPIResult Fields (`src/lib/kpis/executive-kpis.ts`)

| Before | After |
|--------|-------|
| `activeMakeReadysOpen: number` | `activeTurnsOpen: number` |
| `const activeMakeReadysOpen = ...` | `const activeTurnsOpen = ...` |
| Comment: `EXEC-04: Active Make Readys Open` | `EXEC-04: Active Turns Open` |
| `daysVacantUntilReady` (pastTargetAlerts) | `daysOffMarketUntilReady` |
| `daysVacantUntilReady` (trendingAlerts) | `daysOffMarketUntilReady` |

### Mapper (`src/lib/airtable/tables/mappers.ts`)

| Before | After | Notes |
|--------|-------|-------|
| `vacantDate: f['Vacant Date'] ? ...` | `offMarketDate: f['Vacant Date'] ? ...` | Field string `'Vacant Date'` UNCHANGED |
| `daysVacantUntilReady: f['Days Vacant Until Ready'] != null ? ...` | `daysOffMarketUntilReady: f['Days Vacant Until Ready'] != null ? ...` | Field string `'Days Vacant Until Ready'` UNCHANGED |

### UI Labels — Make Ready

| File | Before | After |
|------|--------|-------|
| `src/app/(dashboard)/executive/_components/executive-kpis.tsx` | `Make Ready Overview` (section header) | `Turn Overview` |
| `src/app/(dashboard)/executive/_components/executive-kpis.tsx` | `label="Active Make Readys Open"` | `label="Active Turns Open"` |
| `src/app/(dashboard)/executive/_components/executive-kpis.tsx` | `value={kpis.activeMakeReadysOpen}` | `value={kpis.activeTurnsOpen}` |
| `src/app/(dashboard)/executive/_components/executive-kpis.tsx` | `label="Make Readys Past Target Time"` | `label="Turns Past Target Time"` |
| `src/app/(dashboard)/executive/_components/executive-kpis.tsx` | `label="Make Readys Trending Past Target Date"` | `label="Turns Trending Past Target Date"` |
| `src/app/(dashboard)/executive/_components/executive-kpi-skeleton.tsx` | Comment: `Make Ready Overview section skeleton` | `Turn Overview section skeleton` |
| `src/app/(dashboard)/property/_components/pm-kpis.tsx` | `kpis.avgMakeReadyTime` (×2 references) | `kpis.avgTurnTime` |
| `src/app/(dashboard)/property/_components/pm-kpis.tsx` | `label="Active Make Readys"` | `label="Active Turns"` |
| `src/app/(dashboard)/property/_components/pm-kpis.tsx` | `value={kpis.activeMakeReadys}` | `value={kpis.activeTurns}` |
| `src/app/(dashboard)/property/_components/pm-kpis.tsx` | `label="Avg Make Ready Time"` | `label="Avg Turn Time"` |
| `src/app/(dashboard)/property/_components/pm-turn-list.tsx` | `title="Make Readys Past Target Time"` | `title="Turns Past Target Time"` |
| `src/app/(dashboard)/property/_components/pm-turn-list.tsx` | `title="Active Make Readys (On Schedule)"` | `title="Active Turns (On Schedule)"` |
| `src/app/components/page.tsx` | `label="Active Make Readys"` | `label="Active Turns"` |

### UI Labels — Vacant/Off Market

| File | Before | After |
|------|--------|-------|
| `src/app/(dashboard)/property/_components/mobile-turn-card.tsx` | `<span>Vacant Date</span>` | `<span>Off Market Date</span>` |
| `src/app/(dashboard)/property/_components/mobile-turn-card.tsx` | `{formatDate(turn.vacantDate)}` | `{formatDate(turn.offMarketDate)}` |
| `src/app/(dashboard)/property/turn/[id]/_components/turn-detail-view.tsx` | `Vacant Date` (label) | `Off Market Date` |
| `src/app/(dashboard)/property/turn/[id]/_components/turn-detail-view.tsx` | `{formatDate(turn.vacantDate) \|\| 'Not set'}` | `{formatDate(turn.offMarketDate) \|\| 'Not set'}` |
| `src/app/(dashboard)/property/turn/[id]/_components/turn-detail-view.tsx` | `Days Vacant` (label) | `Days Off Market` |
| `src/app/(dashboard)/property/turn/[id]/_components/turn-detail-view.tsx` | `{turn.daysVacantUntilReady != null ...}` | `{turn.daysOffMarketUntilReady != null ...}` |
| `src/app/(dashboard)/executive/_components/health-gauge.tsx` | `% of turns completed within 10 days vacant` | `% of turns completed within 10 days off market` |

### Files With No Changes Needed

| File | Why Unchanged |
|------|--------------|
| `src/components/layout/sidebar.tsx` | Already displays "Add Off Market" — VERIFY only |
| `src/components/layout/bottom-tab-bar.tsx` | Already displays "Add Off Market" — VERIFY only |
| `src/lib/types/auth.ts` | `/vacant` route strings — locked, no change |
| `src/app/actions/vacant.ts` | File name and `addVacantUnits` function name — locked |
| `src/app/(dashboard)/vacant/page.tsx` | Route file — file name and route locked |
| `src/app/(dashboard)/vacant/add-vacant-form.tsx` | File name locked |

---

## Architecture Patterns

### Rename Ordering (Recommended)

**Wave 1: Type Definitions (causes cascade)**
1. `src/lib/types/airtable.ts` — Rename `TurnRequest` properties
2. `src/lib/kpis/pm-kpis.ts` — Rename `PMKPIResult` fields and local vars
3. `src/lib/kpis/executive-kpis.ts` — Rename `ExecutiveKPIResult` fields and local vars

At this point `tsc --noEmit` will show every remaining consumer broken.

**Wave 2: Boundary Layer**
4. `src/lib/airtable/tables/mappers.ts` — Update property names on mapper output (field strings unchanged)

**Wave 3: UI Components**
5. `src/app/(dashboard)/property/_components/pm-kpis.tsx`
6. `src/app/(dashboard)/property/_components/pm-turn-list.tsx`
7. `src/app/(dashboard)/property/_components/mobile-turn-card.tsx`
8. `src/app/(dashboard)/property/turn/[id]/_components/turn-detail-view.tsx`
9. `src/app/(dashboard)/executive/_components/executive-kpis.tsx`
10. `src/app/(dashboard)/executive/_components/executive-kpi-skeleton.tsx`
11. `src/app/(dashboard)/executive/_components/health-gauge.tsx`
12. `src/app/components/page.tsx`

**Wave 4: Tests**
13. `src/lib/kpis/pm-kpis.test.ts` — Update property references and describe block names
14. `src/lib/kpis/executive-kpis.test.ts` — Update property references and describe block names
15. `src/lib/airtable/__tests__/mappers.test.ts` — Update property assertions
16. `src/lib/kpis/health-score.test.ts` — Update property references
17. `src/app/(dashboard)/executive/_components/executive-charts.test.tsx` — Update property references

**Verification:** `npx tsc --noEmit` then `npm test`

### Airtable Boundary Pattern

The mapper is the boundary layer between Airtable field strings (immutable) and TypeScript property names (mutable). This pattern MUST be preserved:

```typescript
// CORRECT — field string unchanged, property name changes
offMarketDate: f['Vacant Date'] ? String(f['Vacant Date']) : null,
daysOffMarketUntilReady: f['Days Vacant Until Ready'] != null
  ? Number(f['Days Vacant Until Ready']) || null
  : null,
```

Never rename `'Vacant Date'` or `'Days Vacant Until Ready'` — these are Airtable schema field names and cannot be changed from the application side.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Finding all rename sites | Manual scan | `tsc --noEmit` after type changes | TypeScript compile errors enumerate every consumer automatically |
| Verifying zero "Make Ready" in src | Manual review | `grep -r "Make Ready\|makeReady" src/` | Exact, exhaustive, scriptable |
| Verifying zero "Vacant" as status | Manual review | `grep -r "Vacant" src/` then filter by context | Route strings are expected; status/property uses are not |

---

## Common Pitfalls

### Pitfall 1: Renaming Airtable Field Strings
**What goes wrong:** Developer renames `f['Vacant Date']` to `f['Off Market Date']` — mapper silently returns `null` for all units because the Airtable field is still named "Vacant Date".
**Why it happens:** The boundary is not explicit in the code.
**How to avoid:** Airtable field strings in square bracket notation (`f['...']`) are the immutable side. Only the TypeScript property on the left-hand side of the assignment changes.
**Warning signs:** `offMarketDate` is always `null` after rename; `daysOffMarketUntilReady` is always `null`.

### Pitfall 2: Partial Property Cascade
**What goes wrong:** Type is updated but one consumer still uses `tr.vacantDate` — TypeScript catches it, but only if `tsc --noEmit` is run.
**Why it happens:** Renaming properties in an interface without running the compiler.
**How to avoid:** Run `npx tsc --noEmit` after every Wave 1 change, before touching consumers.

### Pitfall 3: Leaving Test Fixture Defaults Unupdated
**What goes wrong:** `makeTurnRequest` fixtures in test files still define `vacantDate: null` and `daysVacantUntilReady: null` — tests pass (TypeScript would catch old property names) but fixtures look wrong.
**Why it happens:** Test factory objects are not TypeScript-enforced in the same way (spread patterns).
**How to avoid:** After renaming the `TurnRequest` interface, the factory function will emit a compile error if it references old property names — fix along with implementation.

### Pitfall 4: Nav Label Already Changed
**What goes wrong:** Plan includes "update sidebar label to Off Market" but it already says "Add Off Market" — wasted verification effort or double-change confusion.
**Why it happens:** The sidebar and bottom-tab-bar were updated in a previous phase.
**How to avoid:** Treat sidebar and bottom-tab-bar as verification-only. Confirm label reads "Add Off Market" and move on — no edit needed.

### Pitfall 5: Changing `/vacant` Route Tests
**What goes wrong:** Tests checking `href="/vacant"` get "corrected" to `href="/off-market"` — this breaks the app because the route is locked at `/vacant`.
**Why it happens:** Overzealous rename — "vacant" looks wrong everywhere.
**How to avoid:** Route strings in test expectations (`expect(link.getAttribute('href')).toBe('/vacant')`) and auth config (`ROLE_ALLOWED_ROUTES`) are locked. Leave them untouched.

---

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Vitest 4.0.18 |
| Config file | `vitest.config.ts` (root) |
| Quick run command | `npm test -- --reporter=dot` |
| Full suite command | `npm test` |
| Type check command | `npx tsc --noEmit` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| TERM-01 | "Make Ready" absent from UI labels | manual/grep | `grep -r "Make Ready\|makeReady" src/` returns 0 results | N/A |
| TERM-01 | PM KPI result uses `activeTurns`, `avgTurnTime` | unit | `npm test -- pm-kpis` | Yes (`pm-kpis.test.ts`) |
| TERM-02 | No "Make Ready" → "Job" confusion (no such cases exist) | N/A — confirmed by code scan | N/A | N/A |
| TERM-03 | "Vacant" absent as unit status label in UI | manual/grep | `grep -rn "Vacant Date\|Days Vacant" src/` returns 0 in UI files | N/A |
| TERM-03 | TurnRequest has `offMarketDate`, `daysOffMarketUntilReady` | unit | `npm test -- mappers` | Yes (`mappers.test.ts`) |
| TERM-04 | TypeScript compiles with zero errors post-rename | type check | `npx tsc --noEmit` | N/A |
| TERM-04 | Executive KPI result uses `activeTurnsOpen` | unit | `npm test -- executive-kpis` | Yes (`executive-kpis.test.ts`) |

### Sampling Rate
- **Per task commit:** `npx tsc --noEmit && npm test`
- **Per wave merge:** `npm test` (full suite)
- **Phase gate:** Full suite green + grep verifications pass before `/gsd:verify-work`

### Wave 0 Gaps
None — existing test infrastructure covers all phase requirements. The rename will update existing tests in-place. No new test files are needed.

---

## Code Examples

### Correct Airtable Boundary After Rename

```typescript
// src/lib/airtable/tables/mappers.ts
// Source: existing mapTurnRequest function — property name changes, field string does NOT
offMarketDate: f['Vacant Date'] ? String(f['Vacant Date']) : null,
daysOffMarketUntilReady:
  f['Days Vacant Until Ready'] != null
    ? Number(f['Days Vacant Until Ready']) || null
    : null,
```

### Correct PMKPIResult After Rename

```typescript
// src/lib/kpis/pm-kpis.ts
export interface PMKPIResult {
  activeTurns: number
  completedLast30d: number
  completedLast7d: number
  avgTurnTime: number | null
  projectedSpendMTD: number
  pastTargetCount: number
}
```

### Correct ExecutiveKPIResult After Rename

```typescript
// src/lib/kpis/executive-kpis.ts
export interface ExecutiveKPIResult {
  activeJobsOpen: number
  jobsTrendingPastTarget: number
  jobsCompleted30d: number
  backlogDelta: number
  avgTimeToComplete: number | null
  projectedCostExposure: number
  activeTurnsOpen: number           // was activeMakeReadysOpen
  pastTargetAlerts: { propertyName: string; unitNumber: string }[]
  trendingAlerts: { propertyName: string; unitNumber: string }[]
}
```

### Verification Commands

```bash
# After all changes — these must return 0 results
grep -r "Make Ready\|makeReady\|MakeReady" src/

# These should return only route strings and file names (no UI labels or type properties)
grep -r "Vacant\|vacant" src/ | grep -v "'/vacant'" | grep -v "add-vacant-form" | grep -v "vacant\.ts" | grep -v "vacant\.test"

# TypeScript must compile cleanly
npx tsc --noEmit

# All tests must pass
npm test
```

---

## State of the Art

| Old Approach | Current Approach | Impact |
|--------------|------------------|--------|
| "Make Ready" (industry jargon) | "Turn" (product vocabulary) | TERM-01/02 |
| "Vacant" (unit status label) | "Off Market" (product vocabulary) | TERM-03 |
| `vacantDate`, `daysVacantUntilReady` | `offMarketDate`, `daysOffMarketUntilReady` | TERM-04 |
| `activeMakeReadys`, `avgMakeReadyTime` | `activeTurns`, `avgTurnTime` | TERM-04 |
| `activeMakeReadysOpen` | `activeTurnsOpen` | TERM-04 |

**Nav labels already migrated (prior work):** Sidebar and bottom-tab-bar already display "Add Off Market" — do not re-edit.

---

## Open Questions

None. All rename decisions are locked in CONTEXT.md. The implementation is fully enumerable from the current codebase.

---

## Sources

### Primary (HIGH confidence)
- Direct codebase inspection via grep and Read tool — all occurrences verified in source
- `src/lib/types/airtable.ts` — `TurnRequest` interface confirmed, two properties to rename
- `src/lib/kpis/pm-kpis.ts` — `PMKPIResult` interface confirmed, two properties to rename
- `src/lib/kpis/executive-kpis.ts` — `ExecutiveKPIResult` interface confirmed, one property to rename
- `src/lib/airtable/tables/mappers.ts` — Airtable boundary confirmed, field strings must not change
- `vitest.config.ts` + `package.json` — test framework confirmed as Vitest 4.0.18

### Secondary (MEDIUM confidence)
- N/A — all findings are from direct source inspection

### Tertiary (LOW confidence)
- N/A

---

## Metadata

**Confidence breakdown:**
- Rename scope: HIGH — all occurrences enumerated by grep across full src/
- Airtable boundary: HIGH — pattern confirmed by reading actual mapper code
- Nav label status: HIGH — sidebar and bottom-tab-bar confirmed already updated
- Test infrastructure: HIGH — vitest.config.ts and package.json confirmed

**Research date:** 2026-03-18
**Valid until:** This is a snapshot of the current codebase — valid until any further changes to the files listed above.
