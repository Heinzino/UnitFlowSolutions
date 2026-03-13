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
- [ ] **Phase 5: Property Manager View** - Core PM workflow with overdue-first turn lists, turn detail with linked jobs, inline status updates, and PM KPI cards
- [ ] **Phase 6: District Manager View** - Portfolio overview with per-property cards and drill-down reusing PM components
- [ ] **Phase 7: Notifications, Charts, and Vendor Metrics** - Smart notification panel, data visualizations (bar charts, gauges, trend indicators), and vendor performance table

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
**Plans**: 3 plans

Plans:
- [ ] 05-01: TBD
- [ ] 05-02: TBD

### Phase 6: District Manager View
**Goal**: District Managers can see a portfolio-level overview of their assigned properties and drill down into any property's turn data
**Depends on**: Phase 5
**Requirements**: DM-01, DM-02, DM-03, DM-04
**Success Criteria** (what must be TRUE):
  1. Portfolio overview displays one card per assigned property showing: property name, active turns, completion rate, pending approvals
  2. KPI row shows turn completion rate gauge, jobs pending approval count, and overdue items with alert styling when count exceeds zero
  3. Clicking a property card navigates to that property's turn list and KPI view (reusing PM view components)
  4. Loading skeleton states display while data is being fetched
**Plans**: 3 plans

Plans:
- [ ] 06-01: TBD

### Phase 7: Notifications, Charts, and Vendor Metrics
**Goal**: Users receive automatic attention alerts via the notification panel, see data visualizations on dashboards, and can review vendor performance metrics
**Depends on**: Phase 5
**Requirements**: NOTIF-01, NOTIF-02, NOTIF-03, NOTIF-04, VIZ-01, VIZ-02, VIZ-03, VIZ-04, VEND-01
**Success Criteria** (what must be TRUE):
  1. Notification panel (middle column) displays auto-derived alerts from Airtable data: NEEDS ATTENTION jobs (red), pending counter quotes (dollar), approaching deadlines (clock), past target turns (warning)
  2. Each notification shows icon, description, and timestamp; clicking navigates to the relevant turn/job detail
  3. Vendor performance bar chart renders with rounded-top bars and green fill; completion gauge renders as semi-circular arc with gradient
  4. KPI cards display trend indicators (arrow direction, percentage, color coding)
  5. Vendor metrics table shows: Vendor Name, Jobs Completed, Average Completion Time, Jobs Assigned, linked job badges
**Plans**: 3 plans

Plans:
- [ ] 07-01: TBD
- [ ] 07-02: TBD

## Progress

**Execution Order:**
Phases execute in numeric order: 1 -> 2 -> 3 -> 4 -> 5 -> 6 -> 7

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Scaffolding and Design System | 3/3 | Complete   | 2026-03-09 |
| 2. Authentication and Property Scoping | 3/3 | Complete   | 2026-03-12 |
| 3. Airtable Data Layer | 3/3 | Complete   | 2026-03-12 |
| 4. Executive Dashboard | 3/3 | Complete   | 2026-03-13 |
| 5. Property Manager View | 0/TBD | Not started | - |
| 6. District Manager View | 0/TBD | Not started | - |
| 7. Notifications, Charts, and Vendor Metrics | 0/TBD | Not started | - |
