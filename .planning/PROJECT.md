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

### Active

- [ ] Inline pricing approval (accept/flag vendor quotes from turn detail)
- [ ] Notes on turn requests (add/view notes per unit turnover)
- [ ] Middle column notification/alert system (descoped from v1.0)
- [ ] Maintenance Manager role view

### Out of Scope

- Real-time chat — not core to turnover management
- Video/photo uploads — defer to v2 (storage complexity)
- OAuth/social login — email/password via Supabase sufficient
- Mobile native app — web-first, responsive design covers mobile
- Admin panel for user creation — Supabase accounts created manually for now
- Airtable schema changes — dashboard reads existing schema as-is

## Context

- ~6-15 active users across PM, RM, and Executive roles
- Shipped v1.0 with 6,567 LOC TypeScript/TSX/CSS across 210 files
- Tech stack: Next.js 16 (Turbopack), Tailwind v4, Supabase Auth, Airtable API, Recharts, Vitest
- 158 tests passing (unit + integration)
- 4 tech debt items tracked (orphaned logout action, unused fetch functions, duplicate status constants, build pre-render issue)
- 5 of 9 Airtable table fetch functions are defined but not yet consumed by UI (Properties, Quotes, Executives, PropertyManagers, MaintenanceManagers)

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
| NOTIF-01..04 descoped | Alert cards on KPI dashboard sufficient for v1.0 | ⚠️ Revisit — may need middle column for v1.1 |

---
*Last updated: 2026-03-15 after v1.0 milestone*
