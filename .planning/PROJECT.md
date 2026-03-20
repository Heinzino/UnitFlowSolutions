# UnitFlowSolutions (ScheduleSimple)

## What This Is

A role-based Next.js dashboard for managing apartment unit turnovers across multiple properties. Replaces Airtable's native interface with a polished, role-specific experience — Executives get portfolio-level KPIs with Top 10 revenue exposure rankings, Property Managers see overdue turns first with inline date entry and status updates, and Regional Managers get aggregated KPIs with per-property drill-down. Airtable remains the single source of truth via API; Supabase handles authentication and role mapping.

## Core Value

Property Managers can instantly see which turns are overdue, which jobs are stuck, and take action (update status, enter dates, mark done) without hunting through Airtable — fewer clicks to the information that matters.

## Requirements

### Validated

- ✓ Role-based authentication with Supabase (PM, RM, Executive) — v1.0
- ✓ Property-scoped data — each user sees only their assigned properties — v1.0
- ✓ Executive dashboard with KPI cards (active jobs, backlog delta, cost exposure, trends) — v1.0
- ✓ Property Manager view with overdue turns surfaced first, turn detail with linked jobs — v1.0
- ✓ Regional Manager multi-property view (shares PM layout, role renamed from DM) — v1.0
- ✓ Inline job status updates (move jobs through stages without leaving the page) — v1.0
- ✓ Airtable API integration layer with server-side-only access, caching (60s), rate limiting, batch resolution — v1.0
- ✓ Visual polish per THEME.md — dark forest green background, white cards, emerald accents — v1.0
- ✓ Charts and data visualization (vendor bar charts, trend indicators, turn time chart) — v1.0/v1.2
- ✓ Vendor metrics page (completion rates, job assignments, sortable table) — v1.0
- ✓ Responsive layout — desktop sidebar + mobile bottom tabs — v1.0
- ✓ Admin-only user creation form (restricted to allowlisted emails) — v1.1
- ✓ Add Off Market Units form (all roles, creates records in Airtable Properties table) — v1.1
- ✓ Shared PropertyMultiSelect component with inline property creation — v1.1
- ✓ Dashboard terminology rename (Make Ready → Turns/Jobs, Vacant → Off Market) — v1.2
- ✓ PM dashboard with 6 KPI boxes, Open Turns with inline lease-ready date entry + Done action, Active Jobs table, Revenue Exposure — v1.2
- ✓ RM dashboard with 6 aggregated boxes, Property Insights list, Avg Turn Time bar graph, PM-level drill-down — v1.2
- ✓ Executive dashboard redesigned with 6 contextual KPI boxes and Top 10 Properties by Revenue Exposure — v1.2
- ✓ Completed Jobs page with property filter — v1.2

### Active

(No active requirements — start next milestone with `/gsd:new-milestone`)

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
- Shipped v1.2 with 9,667 LOC TypeScript/TSX across 16 phases
- Tech stack: Next.js 16 (Turbopack), Tailwind v4, Supabase Auth, Airtable API, Recharts, Vitest
- 205 tests passing (unit + integration)
- Three milestone versions shipped: v1.0 MVP, v1.1 Admin Tools, v1.2 Dashboard Redesign
- All three role dashboards redesigned with role-specific KPI layouts
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
| NOTIF-01..04 descoped | Alert cards on KPI dashboard sufficient for v1.0 | ⚠️ Revisit — may need middle column for future |
| Admin email allowlist (v1.1) | Simple gate for two known admins | ✓ Good — no RBAC overhead needed |
| Supabase Admin API for user creation (v1.1) | Service-role key server-side only | ✓ Good — secure isolation |
| "Vacant" → "Off Market" rename (v1.1) | User feedback during verification | ✓ Good — aligned with business terminology |
| Shared PropertyMultiSelect (v1.1) | Reusable across admin + off market features | ✓ Good — DRY, reused in Completed Jobs too |
| Reuse computePMKPIs across roles (v1.2) | RM and Executive dashboards compute same KPIs per property | ✓ Good — single source of truth for KPI logic |
| RM gets own /regional route (v1.2) | Distinct from PM /property; middleware-enforced | ✓ Good — clean role separation |
| Remove health gauge + charts in executive redesign (v1.2) | Replaced by Top 10 table; simpler, more actionable | ✓ Good — 7 obsolete files deleted cleanly |
| ActiveJobsTable reused for Completed Jobs (v1.2) | Same columns/sort, just different data filter | ✓ Good — zero duplication |

---
*Last updated: 2026-03-20 after v1.2 Dashboard Redesign milestone*
