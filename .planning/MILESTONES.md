# Milestones

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

