# Roadmap: UnitFlowSolutions (ScheduleSimple)

## Overview

This roadmap delivers a role-based property management dashboard that replaces Airtable's native interface. The journey starts with visual foundation and authentication, builds the critical Airtable data layer, then delivers three role-specific views (Executive, Property Manager, District Manager) in order of increasing complexity. Enhancement features (notifications, charts, vendor metrics) come last to polish validated core workflows.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [x] **Phase 1: Scaffolding and Design System** - Next.js project setup, Tailwind theme from THEME.md, reusable UI component library, responsive layout shell (completed 2026-03-09)
- [x] **Phase 2: Authentication and Property Scoping** - Supabase login/logout, role-based route protection, property-scoped data access per user role (completed 2026-03-12)
- [x] **Phase 3: Airtable Data Layer** - Server-side Airtable integration with typed interfaces, caching, rate limiting, linked record resolution, and property scoping (completed 2026-03-12)
- [x] **Phase 4: Executive Dashboard** - Read-only KPI dashboard with alert cards, validating data layer aggregations across all properties (completed 2026-03-13)
- [x] **Phase 5: Property Manager View** - Core PM workflow with overdue-first turn lists, turn detail with linked jobs, inline status updates, and PM KPI cards (gap closure in progress) (completed 2026-03-14)
- [x] **Phase 6: District Manager View** - Portfolio overview with per-property cards and drill-down reusing PM components (completed 2026-03-14)
- [x] **Phase 7: Notifications, Charts, and Vendor Metrics** - Data visualizations (health gauge, vendor bar chart), trend indicators on executive KPI cards, and vendor performance table. Notifications descoped. (completed 2026-03-15)
- [x] **Phase 8: Code Fixes & Integration Wiring** - Fix VIZ-03 trend arrow semantics, wire header PropertySelector to URL params, fix navigation hrefs, correct 07-VERIFICATION.md (gap closure) (completed 2026-03-15)
- [ ] **Phase 9: Documentation & Verification Cleanup** - Retroactive Phase 3 verification, mark NOTIF-01–04 as descoped, fix AUTH-02 description, update Phase 7 SUMMARY frontmatter (gap closure)

## Phase Details

### Phase 1: Scaffolding and Design System
**Goal**: Developers have a working Next.js project with all UI primitives built and themed, ready to compose into views
**Depends on**: Nothing (first phase)
**Requirements**: UI-01, UI-02, UI-03, UI-04, UI-05
**Success Criteria** (what must be TRUE):
  1. Application loads in browser with THEME.md colors applied (forest green background, white cards, emerald accents)
  2. All reusable components render correctly: Button, Card, KPICard, Badge, Table, Input, Skeleton, StatusBadge, TrendIndicator, CurrencyDisplay
  3. Layout shell displays two-column structure on desktop (sidebar + main content) — notification column deferred to Phase 7
  4. Layout adapts responsively: floating bottom tab bar with stacked cards on mobile
  5. Typography uses Plus Jakarta Sans for headings and Geist for body text
**Plans**: 3 plans

Plans:
- [ ] 01-01-PLAN.md — Scaffold Next.js project, configure Tailwind v4 theme with THEME.md tokens, set up fonts, build responsive layout shell
- [ ] 01-02-PLAN.md — Build all 10 reusable UI components (Button, Card, KPICard, Badge, Table, Input, Skeleton, StatusBadge, TrendIndicator, CurrencyDisplay)
- [ ] 01-03-PLAN.md — Create component demo page, set up test infrastructure, run unit tests, visual verification checkpoint

### Phase 2: Authentication and Property Scoping
**Goal**: Users can securely log in and are routed to their role-appropriate dashboard, seeing only data for their assigned properties
**Depends on**: Phase 1
**Requirements**: AUTH-01, AUTH-02, AUTH-03, AUTH-04, AUTH-05, AUTH-06, SCOPE-01, SCOPE-02, SCOPE-03, SCOPE-04
**Success Criteria** (what must be TRUE):
  1. User can log in with email/password and is redirected to their role dashboard (PM to /property, DM to /district, Exec to /executive)
  2. User session persists across browser refresh without re-login
  3. User can log out from any page and is returned to login
  4. Unauthenticated users are redirected to login; users cannot access routes outside their role
  5. Property assignment is resolved from Supabase and normalized for Airtable name matching
**Plans**: 3 plans

Plans:
- [ ] 02-01-PLAN.md — Install Supabase, create client factories, middleware with role-based routing, auth server actions, property normalization
- [ ] 02-02-PLAN.md — Login page UI, route group restructure (dashboard layout vs standalone login), placeholder dashboard pages
- [ ] 02-03-PLAN.md — Sidebar logout wiring, UserHeader with name/role badge, PropertySelector dropdown, AppShell integration

### Phase 3: Airtable Data Layer
**Goal**: All Airtable data is accessible through typed, cached, rate-limited server-side functions that handle property scoping and linked record resolution
**Depends on**: Phase 2
**Requirements**: DATA-01, DATA-02, DATA-03, DATA-04, DATA-05, DATA-06
**Success Criteria** (what must be TRUE):
  1. Data from all 9 Airtable tables can be fetched with correct TypeScript types and clean field names
  2. Responses are cached with 60s TTL; cache tags are busted immediately on write operations
  3. Rate limiter prevents exceeding 5 req/sec to Airtable API under concurrent access
  4. Linked record IDs (e.g., Jobs on Turn Requests) are batch-resolved without N+1 queries
  5. Property scoping filters data correctly per user role and assigned properties
**Plans**: 3 plans

Plans:
- [ ] 03-01-PLAN.md — Foundation: install airtable+sonner, enable cacheComponents, define all 9 TypeScript interfaces, build rate limiter, create Airtable client singleton
- [ ] 03-02-PLAN.md — All 9 table fetch functions with field mapping, caching, batch linked record resolution, property scoping
- [ ] 03-03-PLAN.md — Write server action for job status updates with cascade cache busting, sonner toast infrastructure

### Phase 4: Executive Dashboard
**Goal**: Executives can view a health snapshot of all properties through KPI cards and alert indicators without any filtering or configuration
**Depends on**: Phase 3
**Requirements**: EXEC-01, EXEC-02, EXEC-03, EXEC-04, EXEC-05, EXEC-06, EXEC-07
**Success Criteria** (what must be TRUE):
  1. Executive sees KPI cards displaying: Active Jobs Open, Jobs Trending Past Target, Jobs Completed (30d), Backlog Delta, Average Time To Complete, Projected Cost Exposure
  2. Make Ready Overview section shows Active Make Readys Open count
  3. Alert cards appear with correct severity styling: pink for past target (NEEDS ATTENTION), yellow for trending past target (2-day warning)
  4. All KPI data reflects all properties with no user-applied filter
  5. Loading skeleton states display while data is being fetched
**Plans**: 3 plans

Plans:
- [ ] 04-01-PLAN.md — Add delta field to Job type/mapper, build and test pure KPI compute functions (TDD)
- [ ] 04-02-PLAN.md — Assemble executive dashboard page with Suspense boundaries, KPI grid, alert cards, skeleton fallback
- [ ] 04-03-PLAN.md — Fix text contrast (dark-on-dark) and reduce vertical spacing to fit dashboard in one viewport (gap closure)

### Phase 5: Property Manager View
**Goal**: Property Managers can see their overdue turns first, drill into job details, and update job statuses inline -- the core "fewer clicks" workflow
**Depends on**: Phase 3
**Requirements**: PM-01, PM-02, PM-03, PM-04, PM-05, PM-06, PM-07, PM-08, PM-09
**Success Criteria** (what must be TRUE):
  1. Turn request list shows "Make Readys Past Target Time" section above "Active Make Readys (On Schedule)" with correct columns (Property, Unit, Status, Ready To Lease Date, Vacant Date, Jobs, Price)
  2. PM with multiple properties can filter by property via dropdown
  3. KPI cards display: Active Make Readys, Completed (30d), Completed (7d), Average Time, Projected Spend, Past Target Time (pink alert)
  4. Clicking a turn opens detail page showing all linked jobs with Vendor Name, Type, Status badge, dates, and price
  5. PM can change a job's status from the turn detail page and see the update reflected without navigating away
**Plans**: 4 plans

Plans:
- [ ] 05-01-PLAN.md — TDD computePMKPIs pure function, build JobStatusDropdown client component, KPI and turn list skeleton fallbacks
- [ ] 05-02-PLAN.md — PM dashboard page with KPI cards, property filter dropdown, overdue-first turn list with two sections
- [ ] 05-03-PLAN.md — Turn detail page with linked jobs table, inline job status updates, visual verification checkpoint
- [ ] 05-04-PLAN.md — UAT gap closure: turn status dropdown, job badge pills, job detail page (gap closure)

### Phase 6: District Manager View
**Goal**: Regional Managers use the existing PM view with PropertySelector for multi-property access — rename dm role to rm across the type system, routing, and UI
**Depends on**: Phase 5
**Requirements**: DM-01, DM-02, DM-03, DM-04
**Success Criteria** (what must be TRUE):
  1. UserRole type contains 'rm' (not 'dm') and RM users are routed to /property
  2. RM users see 'Regional Manager' label in header badge and PropertySelector dropdown for multi-property access
  3. /district URL redirects to /property gracefully
  4. All existing tests pass and TypeScript compiles with zero errors
**Plans**: 2 plans

Plans:
- [ ] 06-01-PLAN.md — Rename dm to rm in auth type system, update user-header role logic, replace /district with redirect, add auth constant tests
- [ ] 06-02-PLAN.md — Gap closure: rewrite DM-01 through DM-04 requirement descriptions to match delivered rm rename outcomes

### Phase 7: Notifications, Charts, and Vendor Metrics
**Goal**: Executive dashboard enhanced with health gauge, vendor completion time chart, and trend indicators on KPI cards; vendor performance table on dedicated /vendors page. Notifications descoped (existing alert cards are sufficient).
**Depends on**: Phase 5
**Requirements**: NOTIF-01, NOTIF-02, NOTIF-03, NOTIF-04, VIZ-01, VIZ-02, VIZ-03, VIZ-04, VEND-01
**Success Criteria** (what must be TRUE):
  1. Notification UI removed from sidebar and bottom tab bar (NOTIF-01 through NOTIF-04 descoped)
  2. Health gauge on executive dashboard shows on-time completion rate with green/amber/red coloring
  3. Vendor completion time bar chart renders horizontal bars on executive dashboard
  4. Executive KPI cards for Jobs Completed, Active Jobs Open, and Avg Time show trend arrows with correct color semantics
  5. Vendor metrics table on /vendors page shows sortable columns: Vendor Name, Jobs Completed, Avg Completion Time, Jobs Assigned
**Plans**: 3 plans

Plans:
- [ ] 07-01-PLAN.md — Install Recharts, remove notification UI, add /vendors route auth, enhance TrendIndicator with isGood prop, compute and wire KPI trends
- [ ] 07-02-PLAN.md — Build /vendors page with client-side sortable vendor metrics table
- [ ] 07-03-PLAN.md — Build health gauge (SVG) and vendor completion time bar chart (Recharts) on executive dashboard

### Phase 8: Code Fixes & Integration Wiring
**Goal**: Close all code and integration gaps found by milestone audit — fix inverted trend arrows, wire header PropertySelector, and fix navigation issues
**Depends on**: Phase 7
**Requirements**: VIZ-03, DM-03, UI-01
**Gap Closure:** Closes gaps from v1.0 audit
**Success Criteria** (what must be TRUE):
  1. Executive KPI cards for Active Jobs Open and Avg Time to Complete show trend arrows with `isGood: false` (red-up, green-down)
  2. Header PropertySelectorWrapper pushes selected property as URL param, scoping dashboard data for RM users (Flow C complete)
  3. Sidebar/BottomTabBar Dashboard link navigates to role-appropriate route without extra redirect
  4. Sidebar/BottomTabBar Settings link removed or points to valid route
  5. 07-VERIFICATION.md corrected to reflect actual isGood state
**Plans**: 1 plan

Plans:
- [ ] 08-01-PLAN.md — Fix isGood trend props, wire PropertySelector to URL params, remove broken nav items, correct 07-VERIFICATION.md

### Phase 9: Documentation & Verification Cleanup
**Goal**: Close all documentation and verification gaps — create missing Phase 3 VERIFICATION.md, fix REQUIREMENTS.md descope markers, and correct stale descriptions
**Depends on**: Phase 8
**Requirements**: DATA-01, DATA-02, DATA-03, DATA-04, DATA-05, DATA-06, NOTIF-01, NOTIF-02, NOTIF-03, NOTIF-04, AUTH-02
**Gap Closure:** Closes gaps from v1.0 audit
**Success Criteria** (what must be TRUE):
  1. Phase 3 VERIFICATION.md exists with verification of all 6 DATA requirements against running code
  2. NOTIF-01 through NOTIF-04 marked as descoped (not `[x] Complete`) in REQUIREMENTS.md
  3. AUTH-02 description updated to reflect `RM -> /property` (not `DM -> /district`)
  4. Phase 7 SUMMARY frontmatter includes VIZ-01 through VIZ-04 in requirements_completed
**Plans**: 2 plans

Plans:
- [ ] 09-01-PLAN.md — Write missing Phase 3 VERIFICATION.md documenting all 6 DATA requirements with code evidence
- [ ] 09-02-PLAN.md — Fix AUTH-02 description in REQUIREMENTS.md, verify NOTIF descope markers, add VIZ IDs to Phase 7 SUMMARY frontmatter

## Progress

**Execution Order:**
Phases execute in numeric order: 1 -> 2 -> 3 -> 4 -> 5 -> 6 -> 7

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Scaffolding and Design System | 3/3 | Complete   | 2026-03-09 |
| 2. Authentication and Property Scoping | 3/3 | Complete   | 2026-03-12 |
| 3. Airtable Data Layer | 3/3 | Complete   | 2026-03-12 |
| 4. Executive Dashboard | 3/3 | Complete   | 2026-03-13 |
| 5. Property Manager View | 4/4 | Complete   | 2026-03-14 |
| 6. District Manager View | 2/2 | Complete   | 2026-03-14 |
| 7. Notifications, Charts, and Vendor Metrics | 3/3 | Complete   | 2026-03-15 |
| 8. Code Fixes & Integration Wiring | 1/1 | Complete   | 2026-03-15 |
| 9. Documentation & Verification Cleanup | 0/2 | Not Started | — |
