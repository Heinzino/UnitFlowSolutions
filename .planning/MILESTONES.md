# Milestones

## v1.2 Dashboard Redesign (Shipped: 2026-03-20)

**Phases:** 12-16 | **Plans:** 10 | **Tasks:** 22 | **Timeline:** 2 days (2026-03-18 → 2026-03-20)
**LOC:** 9,667 TypeScript/TSX | **Tests:** 205 passing | **Files changed:** 49 (+1,637 / -840)

**Key accomplishments:**

- Renamed all terminology across codebase — Make Ready → Turns/Jobs, Vacant → Off Market (zero legacy identifiers remaining)
- PM dashboard redesigned with 6 KPI boxes, inline lease-ready date entry, inline Done action, sortable Active Jobs table, and Revenue Exposure with excluded-turn footnote
- Completed Jobs page at /property/completed-jobs reusing ActiveJobsTable with PropertyMultiSelect filter
- RM dashboard at /regional with aggregated KPIs, Property Insights per-property list, PM-level drill-down, and color-coded Avg Turn Time bar chart
- Executive dashboard redesigned with 6 contextual KPI cards (footer subtitles) and Top 10 Properties by Revenue Exposure table
- Removed 7 obsolete files (charts, health gauge, vendor chart, health score) — zero residual imports

**Git range:** `359ff67` (feat(12-01)) → `3c8b98f` (docs(16-02))

---

## v1.1 Admin Tools & Unit Management (Shipped: 2026-03-18)

**Phases:** 10-11 | **Plans:** 7 | **Timeline:** 3 days (2026-03-15 → 2026-03-17)
**LOC:** 8,753 TypeScript/TSX | **Tests:** 202 passing

**Key accomplishments:**

- Admin-only user creation form with Supabase account provisioning, role/property assignments, and password generation
- Shared PropertyMultiSelect component with searchable dropdown, checkbox multi-select, chip display, and inline property creation
- Admin sidebar visibility restricted to allowlisted emails (heinz@readymation.com, jgiles@cdvsolutions.com)
- Off market unit entry form with repeatable unit cards, PM-scoped property filtering, and partial failure recovery
- Server action with per-unit Airtable record creation, rate limiting, and structured error results
- 44 new tests across both phases (13 PropertyMultiSelect, 11 sidebar/tab, 6 server action, 10 form, 4 auth-types)

**Git range:** `d482eb7` (feat(10-01)) → `5e884e4` (feat(11-03))

---

## v1.0 MVP (Shipped: 2026-03-15)

**Phases:** 1-9 | **Plans:** 24
**LOC:** 6,567 TypeScript/TSX | **Tests:** 158 passing

**Key accomplishments:**

- Role-based dashboard with Executive KPIs, PM overdue-first turn views, and RM multi-property portfolio
- Airtable API integration layer with caching, rate limiting, and batch resolution
- Supabase authentication with role mapping and property scoping
- Responsive layout with desktop sidebar and mobile bottom tab bar
- Vendor metrics page with completion rates and sortable tables
- Charts and data visualization (health gauge, trend indicators, vendor bar charts)

---
