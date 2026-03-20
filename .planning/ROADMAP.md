# Roadmap: UnitFlowSolutions (ScheduleSimple)

## Milestones

- ✅ **v1.0 MVP** — Phases 1-9 (shipped 2026-03-15)
- ✅ **v1.1 Admin Tools & Unit Management** — Phases 10-11 (shipped 2026-03-18)
- 🔄 **v1.2 Dashboard Redesign** — Phases 12-16 (in progress)

## Phases

<details>
<summary>✅ v1.0 MVP (Phases 1-9) — SHIPPED 2026-03-15</summary>

- [x] Phase 1: Scaffolding & Design System (3/3 plans) — completed 2026-03-09
- [x] Phase 2: Authentication & Property Scoping (3/3 plans) — completed 2026-03-12
- [x] Phase 3: Airtable Data Layer (3/3 plans) — completed 2026-03-12
- [x] Phase 4: Executive Dashboard (3/3 plans) — completed 2026-03-13
- [x] Phase 5: Property Manager View (4/4 plans) — completed 2026-03-14
- [x] Phase 6: District Manager View (2/2 plans) — completed 2026-03-14
- [x] Phase 7: Notifications, Charts & Vendor Metrics (3/3 plans) — completed 2026-03-15
- [x] Phase 8: Code Fixes & Integration Wiring (1/1 plan) — completed 2026-03-15
- [x] Phase 9: Documentation & Verification Cleanup (2/2 plans) — completed 2026-03-15

**Archive:** `.planning/milestones/v1.0-ROADMAP.md`

</details>

<details>
<summary>✅ v1.1 Admin Tools & Unit Management (Phases 10-11) — SHIPPED 2026-03-18</summary>

- [x] Phase 10: Admin User Creation (4/4 plans) — completed 2026-03-16
- [x] Phase 11: Off Market Unit Entry (3/3 plans) — completed 2026-03-18

**Archive:** `.planning/milestones/v1.1-ROADMAP.md`

</details>

### v1.2 Dashboard Redesign

- [x] **Phase 12: Terminology Rename** — All dashboards use correct Turns/Jobs/Off Market labels and TypeScript identifiers (completed 2026-03-19)
- [x] **Phase 13: PM Dashboard Redesign** — PM gets 6 KPI boxes, Open Turns with inline date entry, Active Jobs table, and Revenue Exposure (completed 2026-03-19)
- [ ] **Phase 14: Completed Jobs Page** — Auditable completed jobs history with property filter at its own route
- [ ] **Phase 15: RM Dashboard** — Regional Managers get a dedicated /regional route with aggregated KPIs, property insights, drill-down, and turn time chart
- [ ] **Phase 16: Executive Dashboard Redesign** — Executive gets 6 redesigned portfolio KPIs and Top 10 Properties by Revenue Exposure

## Phase Details

### Phase 12: Terminology Rename
**Goal**: Every user-facing label and TypeScript identifier in the codebase uses the agreed vocabulary — Turns, Jobs, Off Market — before any new component is written
**Depends on**: Nothing (standalone rename, zero logic changes)
**Requirements**: TERM-01, TERM-02, TERM-03, TERM-04
**Success Criteria** (what must be TRUE):
  1. No page in the application displays "Make Ready" — all turn-level events are labeled "Turn" and all vendor work items are labeled "Job"
  2. No unit status label reads "Vacant" — units show "Off Market" wherever status is surfaced
  3. A search of `src/` for "Make Ready", "makeReady", and "Vacant" (as a unit status) returns zero results
  4. TypeScript types, variable names, and file names consistently use `turn`/`job` vocabulary with no legacy identifiers remaining
**Plans:** 2/2 plans complete
Plans:
- [ ] 12-01-PLAN.md — Rename type definitions, KPI interfaces, and Airtable mapper properties
- [ ] 12-02-PLAN.md — Update all UI component labels and test files to match new vocabulary

### Phase 13: PM Dashboard Redesign
**Goal**: Property Managers can see all their critical turn and job information at a glance, enter lease-ready dates inline, and mark turns done without leaving the dashboard
**Depends on**: Phase 12
**Requirements**: PMDB-01, PMDB-02, PMDB-03, PMDB-04, PMDB-05, PMDB-06
**Success Criteria** (what must be TRUE):
  1. The PM dashboard lead row shows exactly 6 KPI boxes: active turns, avg turn time, revenue exposure, completed this period, jobs in progress, and turns near deadline
  2. The Open Turns list shows each turn's age and status, and a PM can type a date into the lease-ready field on any row — the change saves on blur and the UI reflects it immediately without a full page reload
  3. A PM can click "Done" on any Open Turn row to close the turn inline without navigating away
  4. The Active Jobs table shows all in-flight vendor jobs across the PM's turns and can be sorted by vendor, status, or days open
  5. The Revenue Exposure KPI displays a dollar amount calculated at $60/day over target, and discloses how many turns are excluded because they have no target date set
**Plans:** 3/3 plans complete
Plans:
- [x] 13-01-PLAN.md — TDD: Update PMKPIResult interface and computePMKPIs with new KPI fields
- [x] 13-02-PLAN.md — Create server action and client components (LeaseReadyDateInput, ActiveJobsTable)
- [x] 13-03-PLAN.md — Wire new KPIs, inline date input, and Active Jobs into PM dashboard UI

### Phase 14: Completed Jobs Page
**Goal**: Any user can review the full history of completed jobs filtered by property, on a dedicated page separate from active work
**Depends on**: Phase 13
**Requirements**: COMP-01, COMP-02, COMP-03
**Success Criteria** (what must be TRUE):
  1. Users can navigate to /property/completed-jobs and see a table of jobs with a completed status
  2. A PropertyMultiSelect control on the page lets users narrow the completed jobs list to one or more specific properties
  3. The completed jobs table presents the same columns and sort behavior as the Active Jobs table on the PM dashboard
**Plans:** 1 plan
Plans:
- [ ] 14-01-PLAN.md — Create completed jobs page with property filter and ActiveJobsTable reuse

### Phase 15: RM Dashboard
**Goal**: Regional Managers land on their own dedicated dashboard at /regional with aggregated cross-property KPIs, per-property insights, a drill-down to individual property views, and a color-coded avg turn time bar chart
**Depends on**: Phase 13
**Requirements**: RMDB-01, RMDB-02, RMDB-03, RMDB-04, RMDB-05
**Success Criteria** (what must be TRUE):
  1. An RM who logs in is routed to /regional (not /property), and middleware correctly enforces this so the RM cannot accidentally land on the PM route
  2. The RM dashboard lead row shows 6 KPI boxes aggregated across all properties in the RM's portfolio
  3. The Property Insights list shows a row per property with active turns, avg turn time, and revenue exposure for that property
  4. Clicking a property in the Property Insights list opens a PM-level view scoped to that single property, showing its turns and jobs
  5. The Avg Turn Time bar chart shows one bar per property, color-coded green for under 7 days, amber for 7-14 days, and red for over 14 days
**Plans**: TBD

### Phase 16: Executive Dashboard Redesign
**Goal**: Executives see a completely redesigned portfolio dashboard with 6 updated KPI boxes and a ranked table of the 10 properties generating the most revenue exposure
**Depends on**: Phase 15
**Requirements**: EXEC-01, EXEC-02
**Success Criteria** (what must be TRUE):
  1. The Executive dashboard displays 6 KPI boxes with portfolio-level metrics that differ from the v1.1 layout
  2. The Executive dashboard includes a Top 10 Properties by Revenue Exposure table, ranked highest to lowest, showing the property name and its exposure dollar amount
**Plans**: TBD

## Progress

| Phase | Milestone | Plans Complete | Status | Completed |
|-------|-----------|----------------|--------|-----------|
| 1. Scaffolding & Design System | v1.0 | 3/3 | Complete | 2026-03-09 |
| 2. Authentication & Property Scoping | v1.0 | 3/3 | Complete | 2026-03-12 |
| 3. Airtable Data Layer | v1.0 | 3/3 | Complete | 2026-03-12 |
| 4. Executive Dashboard | v1.0 | 3/3 | Complete | 2026-03-13 |
| 5. Property Manager View | v1.0 | 4/4 | Complete | 2026-03-14 |
| 6. District Manager View | v1.0 | 2/2 | Complete | 2026-03-14 |
| 7. Notifications, Charts & Vendor Metrics | v1.0 | 3/3 | Complete | 2026-03-15 |
| 8. Code Fixes & Integration Wiring | v1.0 | 1/1 | Complete | 2026-03-15 |
| 9. Documentation & Verification Cleanup | v1.0 | 2/2 | Complete | 2026-03-15 |
| 10. Admin User Creation | v1.1 | 4/4 | Complete | 2026-03-16 |
| 11. Off Market Unit Entry | v1.1 | 3/3 | Complete | 2026-03-18 |
| 12. Terminology Rename | v1.2 | 2/2 | Complete | 2026-03-19 |
| 13. PM Dashboard Redesign | v1.2 | Complete    | 2026-03-20 | 2026-03-19 |
| 14. Completed Jobs Page | v1.2 | 0/1 | Not started | - |
| 15. RM Dashboard | v1.2 | 0/TBD | Not started | - |
| 16. Executive Dashboard Redesign | v1.2 | 0/TBD | Not started | - |
