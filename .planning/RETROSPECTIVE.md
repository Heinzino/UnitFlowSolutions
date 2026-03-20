# Project Retrospective

*A living document updated after each milestone. Lessons feed forward into future planning.*

## Milestone: v1.0 — MVP

**Shipped:** 2026-03-15
**Phases:** 9 | **Plans:** 24 | **Sessions:** ~15

### What Was Built
- Role-based dashboard system (Executive, PM, RM) with Supabase auth
- Airtable data layer with caching (60s TTL), rate limiting (5 req/sec), batch resolution
- Executive dashboard with 6 KPI cards, trend arrows, health gauge, vendor chart
- PM dashboard with overdue-first turn list, inline job/turn status updates
- Vendor metrics page with sortable table and job badge navigation
- Responsive layout with sidebar (desktop) and bottom tab bar (mobile)

### What Worked
- Phase-based execution with parallel plan waves kept momentum high — 9 phases in 7 days
- Server Components + `use cache` eliminated client-side data fetching complexity
- Verification loop (plan → check → revise) caught issues before execution
- Documentation-only Phase 9 cleanly closed all audit gaps without code churn

### What Was Inefficient
- DM → RM rename in Phase 6 required touching auth types, routes, middleware, and tests — earlier stakeholder alignment would have avoided this
- NOTIF-01..04 were planned but descoped mid-milestone — should have been flagged as stretch goals earlier
- 5 Airtable fetch functions built in Phase 3 are unused (Properties, Quotes, etc.) — over-built for current feature set
- Build pre-render issue on dynamic routes persisted across phases without resolution

### Patterns Established
- `use cache` + `cacheLife` + `cacheTag` for server-side data caching with tag-based invalidation
- Role-aware navigation (sidebar/bottom tabs filter items by user role)
- KPI compute functions as pure, testable modules separate from UI
- Phase VERIFICATION.md as formal evidence-based verification documents

### Key Lessons
1. Build only the fetch functions the UI actually needs — unused code is silent tech debt
2. Role naming should be confirmed with stakeholders before building auth infrastructure
3. `computeTrend` should return null for 0% changes — misleading UI for no-change scenarios
4. Next.js 16 `use cache` replaces `unstable_cache` — project started with the right API

### Cost Observations
- Model mix: ~20% opus (orchestration), ~80% sonnet (research, planning, execution, verification)
- Sessions: ~15 across 7 days
- Notable: Parallel wave execution (2 agents) significantly reduced wall-clock time for independent plans

---

## Milestone: v1.1 — Admin Tools & Unit Management

**Shipped:** 2026-03-18
**Phases:** 2 | **Plans:** 7 | **Sessions:** ~4

### What Was Built
- Admin user creation form with Supabase Admin API (service-role key), password generation, role/property assignment
- Shared PropertyMultiSelect component with searchable dropdown, multi-select chips, and inline property creation
- Off market unit entry form with repeatable unit cards, PM-scoped property filtering, partial failure recovery
- Server action for Airtable record creation with per-unit error isolation and rate limiting

### What Worked
- Reusing PropertyMultiSelect across both admin and off market features saved significant effort
- Per-unit error isolation in addVacantUnits enabled partial failure handling — users don't lose successful units
- User feedback during verification checkpoint ("Vacant" → "Off Market", card layout fix) caught real UX issues before shipping
- Wave-based parallel execution: plans 11-01 and 11-02 ran simultaneously, cutting wall-clock time

### What Was Inefficient
- Verification checkpoint for 11-03 required manual browser testing — no E2E tests for Airtable write path
- "Vacant" terminology was used throughout and had to be renamed late — earlier domain language alignment would have avoided rework
- auth-types.test.ts assertions went stale when 11-01 added /vacant to routes but didn't update the test file — needed auto-fix in 11-03

### Patterns Established
- Repeatable row state pattern: `UnitRow[]` with `crypto.randomUUID()` keys, per-row error/warning booleans
- Direct async server action calls for typed array payloads (vs useActionState + FormData)
- Single-card form layout on dark backgrounds (matching create-user-form pattern)
- Admin email allowlist as simple constant — no RBAC table needed for 2 admins

### Key Lessons
1. Domain terminology should be confirmed before coding — "Vacant" vs "Off Market" caused a late rename
2. Shared components (PropertyMultiSelect) pay dividends quickly when features overlap
3. Server action return types should be structured for partial failure from day one
4. Form contrast issues on dark backgrounds are easy to miss in component-level testing — visual verification catches them

### Cost Observations
- Model mix: ~15% opus (orchestration), ~85% sonnet (execution, verification)
- Sessions: ~4 across 3 days
- Notable: 7 plans completed in 3 days — smaller milestone scope enabled faster iteration

---

## Milestone: v1.2 — Dashboard Redesign

**Shipped:** 2026-03-20
**Phases:** 5 | **Plans:** 10 | **Tasks:** 22 | **Sessions:** ~3

### What Was Built
- Terminology rename across entire codebase — Make Ready → Turns/Jobs, Vacant → Off Market; zero legacy identifiers remaining
- PM dashboard redesigned: 6 KPI boxes, Open Turns with inline lease-ready date entry + Done action, sortable Active Jobs table, Revenue Exposure with excluded-turn footnote
- Completed Jobs page at /property/completed-jobs reusing ActiveJobsTable with PropertyMultiSelect filter
- RM dashboard at /regional with 6 aggregated KPIs, Property Insights per-property list, PM-level drill-down via encoded URL, color-coded Avg Turn Time bar chart
- Executive dashboard redesigned: 6 KPI cards with contextual footer subtitles, Top 10 Properties by Revenue Exposure table; 7 obsolete files removed

### What Worked
- computePMKPIs reused across PM, RM, and Executive dashboards — single source of truth for all KPI logic
- Phase 12 terminology rename as standalone first phase created clean foundation — type-level rename made consumer updates self-verifying via tsc
- ActiveJobsTable reuse for Completed Jobs page — zero duplication, just a filter toggle
- RM drill-down reuses PM components (PMKPIs, PMTurnList, ActiveJobs) with role='rm' parameter — no component duplication
- Two-day milestone execution (5 phases, 10 plans) — fastest milestone yet

### What Was Inefficient
- SUMMARY.md frontmatter `requirements-completed` field was inconsistently populated — 4 of 20 requirements not listed despite being verified (TERM-03, PMDB-03, PMDB-05, EXEC-01)
- Mobile path for LeaseReadyDateInput not implemented — MobileTurnCard shows read-only date; PMDB-03 desktop-only
- pm-kpis.test.ts `makeJob` factory missing `statusMessage: null` introduced tsc error — runtime tests pass but static analysis fails
- Pre-existing tsc errors (revalidateTag, email literal) carried forward from v1.0/v1.1 without resolution

### Patterns Established
- KPICard `footer` prop for supplemental content rendered inside card with border-t separator
- Per-property grouping + computePMKPIs for cross-property aggregation (RM, Executive)
- Encoded property name in URL for drill-down (`encodeURIComponent` → `decodeURIComponent`)
- getBarColor threshold function with unit tests for chart color coding

### Key Lessons
1. Reusing compute functions across roles is a force multiplier — computePMKPIs serves PM, RM, and Executive
2. Type-level renames (Phase 12) create self-verifying consumer updates — tsc catches everything
3. SUMMARY frontmatter should be validated against PLAN requirements during execution — prevents 3-source cross-reference gaps at audit time
4. Mobile parity for interactive features should be a plan-level acceptance criterion, not discovered at audit

### Cost Observations
- Model mix: ~15% opus (orchestration), ~85% sonnet (research, planning, execution, verification)
- Sessions: ~3 across 2 days
- Notable: 5 phases completed in 2 days — computePMKPIs reuse and clean phase boundaries enabled fastest execution velocity

---

## Cross-Milestone Trends

### Process Evolution

| Milestone | Sessions | Phases | Plans | Days | Key Change |
|-----------|----------|--------|-------|------|------------|
| v1.0 | ~15 | 9 | 24 | 7 | Established GSD workflow with research → plan → verify → execute cycle |
| v1.1 | ~4 | 2 | 7 | 3 | Smaller scope, reused shared components, user feedback during verification |
| v1.2 | ~3 | 5 | 10 | 2 | Fastest velocity — compute reuse, type-level self-verification, component reuse across roles |

### Cumulative Quality

| Milestone | Tests | Coverage | Tech Debt Items |
|-----------|-------|----------|-----------------|
| v1.0 | 158 | Unit + Integration | 4 |
| v1.1 | 202 | Unit + Integration | 3 (reduced — Properties fetch now consumed) |
| v1.2 | 205 | Unit + Integration | 7 (3 new + 4 pre-existing carried forward) |

### Top Lessons (Verified Across Milestones)

1. Phase-based execution with verification loops catches integration issues before they compound
2. Documentation phases (cleanup/verification) are worth the investment — they close audit gaps cleanly
3. Shared components across features pay off quickly — PropertyMultiSelect (v1.1), ActiveJobsTable (v1.2), computePMKPIs (v1.2)
4. Domain terminology should be confirmed with stakeholders before building — rename rework is avoidable
5. Type-level changes create self-verifying cascades — let the compiler find the consumers
6. Reusing compute functions across role boundaries is a force multiplier — build once, aggregate differently
