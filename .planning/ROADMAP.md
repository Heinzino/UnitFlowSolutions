# Roadmap: UnitFlowSolutions (ScheduleSimple)

## Milestones

- ✅ **v1.0 MVP** — Phases 1-9 (shipped 2026-03-15)
- 🚧 **v1.1 Admin Tools & Unit Management** — Phases 10-11 (in progress)

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

### 🚧 v1.1 Admin Tools & Unit Management (In Progress)

**Milestone Goal:** Enable admins to create users with role/property assignments, and allow all roles to add vacant units directly into Airtable — eliminating the need to go through Airtable's native interface for these two operational tasks.

- [x] **Phase 10: Admin User Creation** - Authorized admins can create new Supabase users with role and property assignments (completed 2026-03-16)
- [ ] **Phase 11: Vacant Unit Entry** - All roles can add vacant units to Airtable through a repeatable, property-scoped form

## Phase Details

### Phase 10: Admin User Creation
**Goal**: Authorized admins can create new Supabase users with name, email, role, and property assignments without leaving the dashboard
**Depends on**: Phase 9 (v1.0 foundation)
**Requirements**: USER-01, USER-02, USER-03, USER-04
**Success Criteria** (what must be TRUE):
  1. User logged in as heinz@readymation.com or jgiles@cdvsolutions.com sees "Create New User" in the sidebar; no other users see it
  2. Admin can fill out name, email, role, and select one or more properties from a searchable dropdown populated live from Airtable
  3. Admin can type a new property name and street address inline to create it if it does not appear in the dropdown
  4. Submitting the form creates a Supabase account and the new user can log in with the assigned role and property access
**Plans:** 4/4 plans complete
Plans:
- [ ] 10-01-PLAN.md — Admin Supabase client, constants, server actions + tests
- [ ] 10-02-PLAN.md — PropertyMultiSelect shared component + tests
- [ ] 10-03-PLAN.md — Sidebar and BottomTabBar admin nav item + test updates
- [ ] 10-04-PLAN.md — Create User page, form wiring, and end-to-end verification

### Phase 11: Vacant Unit Entry
**Goal**: All roles can add one or more vacant units to Airtable using a repeatable sub-form scoped to their accessible properties
**Depends on**: Phase 10
**Requirements**: UNIT-01, UNIT-02, UNIT-03, UNIT-04, UNIT-05, UNIT-06, UNIT-07, UNIT-08
**Success Criteria** (what must be TRUE):
  1. "Add Vacant Units" appears in the sidebar and is accessible to all roles (PM, RM, Executive)
  2. PM users see only their assigned properties in the property dropdown; RM and Executive users see all properties
  3. User can add multiple units in one submission using a repeatable sub-form, each with a unit number and floor plan selected from the exact allowed values
  4. User can create a new property inline with a street address if it does not exist in the dropdown
  5. Submitting creates records in the Airtable Properties table with all required fields (property name, unit number, floor plan, bedrooms, bathrooms, city, state, street address)
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
| 10. Admin User Creation | 4/4 | Complete    | 2026-03-16 | - |
| 11. Vacant Unit Entry | v1.1 | 0/? | Not started | - |
