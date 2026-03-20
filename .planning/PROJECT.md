# UnitFlowSolutions (ScheduleSimple)

## What This Is

A role-based Next.js dashboard for managing apartment unit turnovers (make readys) across multiple properties. Replaces Airtable's native interface with a polished, role-specific experience — Executives get portfolio-level KPIs and health gauges, Property Managers see overdue turns first with inline status updates, and Regional Managers view their multi-property portfolio. Airtable remains the single source of truth via API; Supabase handles authentication and role mapping.

## Core Value

Property Managers can instantly see which turns are overdue, which jobs are stuck, and take action (update status) without hunting through Airtable — fewer clicks to the information that matters.

## Requirements

### Validated

- ✓ Role-based authentication with Supabase (PM, RM, Executive) — v1.0
- ✓ Property-scoped data — each user sees only their assigned properties — v1.0
- ✓ Executive dashboard with KPI cards (active jobs, backlog delta, cost exposure, make ready overview, trends, health gauge) — v1.0
- ✓ Property Manager view with overdue turns surfaced first, turn detail with linked jobs — v1.0
- ✓ Regional Manager multi-property view (shares PM layout, role renamed from DM) — v1.0
- ✓ Inline job status updates (move jobs through stages without leaving the page) — v1.0
- ✓ Airtable API integration layer with server-side-only access, caching (60s), rate limiting, batch resolution — v1.0
- ✓ Visual polish per THEME.md — dark forest green background, white cards, emerald accents — v1.0
- ✓ Charts and data visualization (vendor bar charts, health gauge, trend indicators) — v1.0
- ✓ Vendor metrics page (completion rates, job assignments, sortable table) — v1.0
- ✓ Responsive layout — desktop sidebar + mobile bottom tabs — v1.0
- ✓ Admin-only user creation form (restricted to allowlisted emails) — v1.1
- ✓ Add Off Market Units form (all roles, creates records in Airtable Properties table) — v1.1
- ✓ Shared PropertyMultiSelect component with inline property creation — v1.1

### Active

- ✓ Dashboard terminology rename (Make Ready → Turns/Jobs, Vacant → Off Market) — Validated in Phase 12: terminology-rename
- ✓ PM dashboard with 6 KPI boxes, Open Turns list with lease-ready date entry, Active Jobs table, Revenue Exposure — Validated in Phase 13: pm-dashboard-redesign
- ✓ RM dashboard with 6 aggregated boxes, Property Insights list, Avg Turn Time bar graph, plus PM-level drill-down — Validated in Phase 15: rm-dashboard
- [ ] Executive dashboard redesigned with 6 boxes and Top 10 Properties by Revenue Exposure
- [ ] Completed Jobs page with property filter

### Future

- Inline pricing approval (accept/flag vendor quotes from turn detail)
- Notes on turn requests (add/view notes per unit turnover)
- Middle column notification/alert system (descoped from v1.0)
- Maintenance Manager role view

### Out of Scope

- Real-time chat — not core to turnover management
- Video/photo uploads — defer to v2 (storage complexity)
- OAuth/social login — email/password via Supabase sufficient
- Mobile native app — web-first, responsive design covers mobile
- Editing/deleting existing users — v1.1 is create-only
- Bulk CSV user import — one-at-a-time creation sufficient
- Unit editing/deletion — v1.1 is create-only for off market units
- Airtable schema changes — dashboard reads existing schema as-is

## Context

- ~6-15 active users across PM, RM, and Executive roles
- Shipped v1.1 with 8,753 LOC TypeScript/TSX across 11 phases
- Tech stack: Next.js 16 (Turbopack), Tailwind v4, Supabase Auth, Airtable API, Recharts, Vitest
- 202 tests passing (unit + integration)
- Admin user creation and off market unit entry fully operational
- Properties fetch function now consumed by both admin and off market features
- 4 of 9 Airtable table fetch functions still unused by UI (Quotes, Executives, PropertyManagers, MaintenanceManagers)

## Constraints

- **Data source**: Airtable is the single source of truth — no data duplication
- **API limits**: Airtable rate limit is 5 req/sec — caching and rate limiting implemented
- **Auth**: Supabase — used only for login and role mapping
- **Hosting**: Vercel — Next.js App Router with Server Components
- **Airtable API key**: Server-side only — never exposed to browser
- **Schema**: Work with existing Airtable schema

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Airtable as sole data source (no sync/duplication) | Simplicity, existing workflows depend on Airtable | ✓ Good — clean separation worked well |
| Supabase for auth only (not business data) | Clean separation, Airtable owns all business data | ✓ Good — minimal auth surface |
| Next.js App Router + Server Components | Server-side Airtable access, caching, Vercel deployment | ✓ Good — `use cache` with tag busting works |
| Three role-based views (not one configurable view) | Each role has distinct needs; simpler UX | ✓ Good — RM shares PM layout, exec gets own |
| `use cache` with 60s revalidation + tag busting | Balance between freshness and API rate limits | ✓ Good — 5-tag cascade on writes |
| DM → RM rename (Phase 6) | Client uses "Regional Manager" not "District Manager" | ✓ Good — aligned with real org |
| NOTIF-01..04 descoped | Alert cards on KPI dashboard sufficient for v1.0 | ⚠️ Revisit — may need middle column for v1.2+ |
| Admin email allowlist (v1.1) | Simple gate for two known admins | ✓ Good — no RBAC overhead needed |
| Supabase Admin API for user creation (v1.1) | Service-role key server-side only | ✓ Good — secure isolation |
| "Vacant" → "Off Market" rename (v1.1) | User feedback during verification | ✓ Good — aligned with business terminology |
| Shared PropertyMultiSelect (v1.1) | Reusable across admin + off market features | ✓ Good — DRY, 13 tests |

## Current Milestone: v1.2 Dashboard Redesign

**Goal:** Redesign all three role dashboards with clearer Turn vs Job separation, updated terminology, new KPI calculations, detailed Active Jobs table, and property-level drill-down for RM.

**Target features:**
- Terminology rename across all dashboards (Make Ready → Turns/Jobs, Vacant → Off Market)
- PM dashboard: 6 KPI boxes, Open Turns with lease-ready date entry + manual Done, detailed Active Jobs table, Revenue Exposure
- RM dashboard: 6 aggregated boxes, Property Insights list, Avg Turn Time bar graph, PM-level drill-down with property filter
- Executive dashboard: 6 redesigned boxes, Top 10 Properties by Revenue Exposure
- Completed Jobs page with property filter

---
*Last updated: 2026-03-19 after Phase 15 rm-dashboard complete*
