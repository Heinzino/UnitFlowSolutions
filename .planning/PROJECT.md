# UnitFlowSolutions (ScheduleSimple)

## What This Is

A custom Next.js dashboard for managing apartment unit turnovers (make readys) across multiple properties. Replaces the existing Airtable native interface — which requires too many clicks and shows everyone the same view — with a polished, role-based dashboard that surfaces what needs attention and lets Property Managers, District Managers, and Executives each see exactly what they need. Airtable remains the single source of truth; the dashboard reads/writes via its API. Supabase handles authentication and role mapping.

## Core Value

Property Managers can instantly see which turns are overdue, which jobs are stuck, and take action (update status, approve pricing) without hunting through Airtable — fewer clicks to the information that matters.

## Requirements

### Validated

(None yet — ship to validate)

### Active

- [ ] Role-based authentication with Supabase (PM, DM, Executive, Maintenance Manager)
- [ ] Property-scoped data — each user sees only their assigned properties
- [ ] Executive dashboard with KPI cards (active jobs, backlog delta, cost exposure, make ready overview)
- [ ] Property Manager view with overdue turns surfaced first, turn detail with linked jobs
- [ ] District Manager multi-property portfolio overview with drill-down per property
- [ ] Inline job status updates (move jobs through stages without leaving the page)
- [ ] Inline pricing approval (accept/flag vendor quotes directly from the turn detail)
- [ ] Smart notification/alert system that surfaces items needing attention automatically
- [ ] Airtable API integration layer with server-side-only access, caching (60s), and rate limiting
- [ ] Visual polish per THEME.md — dark forest green background, white cards, emerald accents, modern SaaS feel
- [ ] Charts and data visualization (vendor bar charts, gauges, trend indicators)
- [ ] Notes on turn requests (add/view notes per unit turnover)
- [ ] Vendor metrics page (completion rates, average time, job assignments)
- [ ] Responsive layout — desktop three-column, tablet two-column, mobile stacked

### Out of Scope

- Real-time chat — not core to turnover management
- Video/photo uploads — defer to v2 (storage complexity)
- OAuth/social login — email/password via Supabase sufficient
- Mobile native app — web-first, responsive design covers mobile
- Admin panel for user creation — Supabase accounts created manually for now
- Airtable schema changes — dashboard reads existing schema as-is

## Context

- ~6-15 active users across PM, DM, and Executive roles
- Current pain: too many clicks to reach relevant data in Airtable's native UI
- PMs check daily, primarily looking for overdue turns and stuck jobs. Their core loop: open → spot overdue → drill into jobs → update status or approve pricing
- Executives check weekly for a health snapshot — are properties on track, any red flags
- District Managers actively oversee multiple properties, need portfolio-level visibility
- Airtable base has 9 tables: Properties, Turn Requests, Jobs, Vendors, Vendor_Pricing, Quotes, Executives, Property_Managers, Maintenance_Managers
- Snapshot data (CSVs) and reference screenshots available in repo for development reference
- THEME.md defines the visual language: dark forest green, emerald accents, chartreuse CTAs, Plus Jakarta Sans + Geist fonts

## Constraints

- **Data source**: Airtable is the single source of truth — no data duplication, no local DB for business data
- **API limits**: Airtable rate limit is 5 req/sec — must implement caching and rate limiting
- **Auth**: Supabase (already set up) — used only for login and role mapping
- **Hosting**: Vercel — Next.js App Router with Server Components
- **Airtable API key**: Server-side only — never exposed to browser
- **Schema**: Work with existing Airtable schema, don't require schema changes

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Airtable as sole data source (no sync/duplication) | Simplicity, existing workflows depend on Airtable | — Pending |
| Supabase for auth only (not business data) | Clean separation, Airtable owns all business data | — Pending |
| Next.js App Router + Server Components | Server-side Airtable access, caching, Vercel deployment | — Pending |
| Three role-based views (not one configurable view) | Each role has distinct needs; simpler UX than a single flexible view | — Pending |
| unstable_cache with 60s revalidation + tag busting | Balance between freshness and API rate limits | — Pending |

---
*Last updated: 2026-03-08 after initialization*
