# Phase 12: Terminology Rename - Context

**Gathered:** 2026-03-18
**Status:** Ready for planning

<domain>
## Phase Boundary

Replace all legacy terminology across the codebase: "Make Ready" becomes "Turn" (for unit turnover events) and "Vacant" becomes "Off Market" (for unit status). This is a vocabulary-only change — zero logic changes, zero new features. Every user-facing label, TypeScript type property, variable name, and test description must use the agreed vocabulary by the end of this phase.

</domain>

<decisions>
## Implementation Decisions

### Route renaming
- Keep the `/vacant` route path as-is — do NOT rename the URL
- Keep file names as-is (`add-vacant-form.tsx`, `vacant.ts`, etc.) — no file renames
- Sidebar and bottom tab bar nav label changes from current text to "Off Market"
- Auth route config (`ROLE_ALLOWED_ROUTES`) keeps `/vacant` strings unchanged
- Test descriptions that reference `/vacant` as a route string stay as-is (match the code)

### Make Ready disambiguation
- Every instance of "Make Ready" in the codebase maps to "Turn" — there are no cases where "Make Ready" should become "Job"
- Executive dashboard section "Make Ready Overview" becomes "Turn Overview"
- PM turn list group headers: "Make Readys Past Target Time" becomes "Turns Past Target Time", "Active Make Readys (On Schedule)" becomes "Active Turns (On Schedule)"
- All KPI box labels follow the same pattern: "Active Make Readys" → "Active Turns", "Avg Make Ready Time" → "Avg Turn Time", etc.

### Airtable mapping boundary
- Airtable field names are untouched (schema is read-only) — mapper still reads `'Vacant Date'`, `'Days Vacant Until Ready'`, etc.
- TypeScript properties on the `TurnRequest` interface are renamed: `vacantDate` → `offMarketDate`, `daysVacantUntilReady` → `daysOffMarketUntilReady`
- All consuming code updates to use new property names
- Rename all identifiers in one pass — TurnRequest properties, PM KPI types, Executive KPI types, and all consumers — all in Phase 12
- Executive KPI identifiers are renamed now even though Phase 16 will redesign them (satisfies TERM-04)

### Identifier naming style
- Direct swap naming: `activeMakeReadys` → `activeTurns`, `avgMakeReadyTime` → `avgTurnTime`, `activeMakeReadysOpen` → `activeTurnsOpen`
- Keep the `TurnRequest` interface name as-is (already correct vocabulary)
- Keep the `Job` interface name as-is (already correct)
- UI labels use plural form: "Active Turns", "Turns Past Target Time" (matches existing plural pattern)

### Claude's Discretion
- Order of file changes within the rename (which files to update first)
- How to structure the plan (single plan vs multiple plans)
- Test update strategy (update inline vs batch)

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Terminology requirements
- `.planning/REQUIREMENTS.md` — TERM-01 through TERM-04 define exact rename rules
- `.planning/ROADMAP.md` §Phase 12 — Success criteria: zero "Make Ready", zero "Vacant" (as unit status) in src/

### Existing code to rename
- `src/lib/types/airtable.ts` — TurnRequest interface with `vacantDate`, `daysVacantUntilReady` properties
- `src/lib/airtable/tables/mappers.ts` — Mapper functions reading Airtable fields into TS properties (boundary layer)
- `src/lib/kpis/pm-kpis.ts` — PM KPI type with `activeMakeReadys`, `avgMakeReadyTime`
- `src/lib/kpis/executive-kpis.ts` — Executive KPI type with `activeMakeReadysOpen`

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `TurnRequest` and `Job` interfaces in `src/lib/types/airtable.ts` — already use correct Turn/Job vocabulary at the type level
- `mapTurnRequest` and `mapJob` in `src/lib/airtable/tables/mappers.ts` — function names already correct

### Established Patterns
- Airtable field strings (e.g., `f['Vacant Date']`) are the boundary — they mirror the Airtable schema and must NOT change
- KPI compute functions return typed objects (`PMKPIs`, `ExecutiveKPIs`) — property renames cascade to all consumers
- UI components read KPI properties directly — renaming the type forces all label updates

### Integration Points
- 9 files reference "Make Ready" / "makeReady" — KPI types, UI components, tests
- 24 files reference "Vacant" / "vacant" — route, actions, nav, auth config, tests, types, mappers, KPIs
- Sidebar (`src/components/layout/sidebar.tsx`) and bottom tab bar (`src/components/layout/bottom-tab-bar.tsx`) — nav label updates
- Component showcase (`src/app/components/page.tsx`) — has a demo KPI card with "Active Make Readys" label

</code_context>

<specifics>
## Specific Ideas

No specific requirements — open to standard approaches. This is a mechanical rename with clear before/after mappings.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 12-terminology-rename*
*Context gathered: 2026-03-18*
