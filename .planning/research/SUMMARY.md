# Project Research Summary

**Project:** UnitFlowSolutions (ScheduleSimple) -- Property Management Turnover Dashboard
**Domain:** Property management operations (unit turnover / make-ready tracking)
**Researched:** 2026-03-08
**Confidence:** HIGH

## Executive Summary

UnitFlowSolutions is a server-first read-heavy dashboard that replaces an Airtable-native interface for tracking unit turnovers in property management. The product serves three distinct user roles (Property Manager, District Manager, Executive) with 6-15 total users. The core architectural challenge is that Airtable serves as both the source of truth and the API layer, meaning every design decision flows from Airtable's constraints: a 5 req/sec rate limit, callback-based SDK, no referential integrity, and no real-time capabilities. The recommended approach is a Next.js App Router application using Server Components for all data fetching, `unstable_cache` (or its stable successor) for caching, and Server Actions for mutations -- deployed on Vercel with Supabase handling only authentication and role assignment.

The recommended stack is well-established and largely pre-decided by the project requirements. Next.js 15 with TypeScript, Tailwind CSS, Recharts, and the Airtable SDK form the core. No ORM, no client-side state management, no real-time infrastructure. The architecture is deliberately simple: a monolith with a clean data access layer that encapsulates all Airtable complexity (caching, rate limiting, property scoping, field name mapping, pagination). Feature research confirms that the MVP must deliver role-based auth, property-scoped turn request lists with overdue-first sorting, inline job status updates, and KPI dashboards for PMs and Executives. Differentiators like the notification panel, pricing approval, and DM portfolio view should follow after core workflows are validated.

The most dangerous risks are not technical complexity but data integrity issues hiding in the Airtable schema: property name mismatches between tables that cause silent empty results, duplicate vendor records that skew metrics, NaN values in computed fields that poison aggregations, and linked record fields that return opaque IDs requiring careful batch resolution to avoid N+1 query explosions. The Airtable data layer (Phase 3 in the suggested roadmap) is the make-or-break phase -- it must handle all of these issues before any view can be reliably built.

## Key Findings

### Recommended Stack

The stack is a standard Next.js App Router application with no exotic dependencies. All major technology choices (Next.js, Supabase, Airtable, Recharts, Tailwind) were pre-decided in project planning documents. Research confirms these are the right choices and identifies what NOT to use (no ORM, no tRPC, no Redux, no real-time infrastructure, no Storybook).

**Core technologies:**
- **Next.js 15 (App Router)**: Full-stack framework -- Server Components for data fetching, Server Actions for mutations, `unstable_cache` for Airtable response caching, native Vercel deployment
- **TypeScript 5.6+**: Type safety -- essential for mapping 9 Airtable tables with messy field names to clean typed interfaces
- **Supabase (@supabase/ssr)**: Auth only -- cookie-based sessions, role mapping via `user_profiles` table, middleware integration
- **Airtable SDK (airtable npm)**: Data source -- callback-based pagination, server-side only, wrapped in Promise-based helpers with caching
- **Tailwind CSS (v3.4 or v4)**: Styling -- use whichever version `create-next-app` scaffolds, do not manually switch
- **Recharts**: Visualization -- bar charts and gauges for vendor metrics and KPI displays
- **Supporting**: clsx + tailwind-merge (cn utility), date-fns (date calculations), zod (runtime validation of Airtable responses)

**Critical version note:** Library versions should be verified with `npm view` before scaffolding. Pin Next.js to an exact version to prevent `unstable_cache` API breakage on upgrade.

### Expected Features

**Must have (table stakes -- launch blockers):**
- Role-based auth with property-scoped data visibility (the #1 reason for the dashboard)
- Turn request list with overdue-first sorting (PM daily workflow)
- Turn detail with linked jobs and status badges (core drill-down)
- Inline job status updates (the "fewer clicks" value proposition)
- KPI summary cards for PMs and Executives (dashboard's reason to exist)
- Responsive layout (PMs check on-site from tablets/phones)
- Loading skeletons (remote API with 60s cache means visible load times)

**Should have (differentiators -- add after validation):**
- Smart notification panel deriving alerts from data (no notification table needed)
- Inline pricing approval (saves 5+ clicks per decision)
- District Manager portfolio view (multi-property overview with drill-down)
- Charts and data visualization (vendor bar charts, gauges)
- Notes on turn requests (centralized communication)

**Defer (v2+):**
- Photo/attachment display, vendor metrics page with charts, admin panel, PWA/offline, vendor portal, custom reports

### Architecture Approach

The system is a server-first monolith with three clearly separated concerns: Supabase for auth (login, roles, property assignment), Airtable for all business data (9 tables, read via SDK, write via Server Actions), and Next.js App Router for presentation and caching. Route groups are organized by role (`/executive`, `/property`, `/district`) because these are fundamentally different applications sharing a data layer. All Airtable access is encapsulated in `src/lib/airtable/` with one file per table, a shared cache wrapper, and a rate limiter.

**Major components:**
1. **Middleware** -- auth gate, session refresh, role-based route protection (runs on every request, must be fast)
2. **Data Access Layer (`lib/airtable/`)** -- typed query functions per table, `unstable_cache` with 60s TTL, tag-based invalidation, token-bucket rate limiter, property scoping via `filterByFormula`
3. **Server Components (pages)** -- async data fetching with `Promise.all()` for parallelism, render HTML server-side, pass data as props
4. **Server Actions** -- mutations (status updates, pricing approval, notes) that write to Airtable then call `revalidateTag()`
5. **Client Islands** -- minimal interactive elements (dropdowns, forms, optimistic updates) using `'use client'`
6. **Design System (`components/ui/`)** -- hand-built primitives (Button, Card, KPICard, Badge, Table) matching THEME.md specifications

### Critical Pitfalls

1. **Property name mismatch (Supabase vs Airtable)** -- `Property_Managers` table says "Park Point Apartments" but `Properties` table says "Park Point". Users will see empty dashboards with no error. Build a normalization layer and use `FIND()` for partial matching.
2. **Linked record N+1 queries** -- Turn Requests return opaque job record IDs, not data. Naive resolution causes 40+ API calls per page. Batch-resolve with `OR(RECORD_ID()=...)` in chunks of 10-15, and prefer Airtable lookup fields that return pre-resolved values.
3. **Rate limit cascade under concurrent users** -- 5 req/sec is per API key, not per user. Cache is the primary defense (not rate limiting). With 60s cache, rate limiter should rarely activate. Monitor for 429 responses.
4. **`unstable_cache` API instability** -- may be renamed/replaced in future Next.js versions. Wrap behind an abstraction layer in `cache.ts` so the caching mechanism can be swapped without touching every data function. Pin Next.js version.
5. **Stale write conflicts** -- Airtable has no optimistic concurrency control. Server actions must read-before-write to prevent reverting changes made by other users between page load and action execution.

## Implications for Roadmap

Based on research, suggested phase structure:

### Phase 1: Project Scaffolding and Design System
**Rationale:** No dependencies. UI primitives can be built with mock data. Establishes visual foundation and development environment.
**Delivers:** Next.js project scaffold, Tailwind theme configuration matching THEME.md tokens, all UI primitives (Button, Card, KPICard, Badge, Table, StatusBadge, Skeleton), layout shell (sidebar + main content area), cn() utility.
**Addresses:** Loading skeletons, responsive layout foundation, color-coded alert cards.
**Avoids:** Pitfall 4 -- pin Next.js to exact version during scaffolding.

### Phase 2: Authentication and Role System
**Rationale:** Every data query depends on knowing the user's role and assigned properties. Must come before any Airtable integration.
**Delivers:** Supabase login/logout flow, middleware with session refresh and role-based route protection, user profile types, role-based redirects (root -> role dashboard), property assignment resolution.
**Addresses:** Role-based authentication, property-scoped data visibility foundation.
**Avoids:** Pitfall 10 -- cache role in JWT/cookie, do not query `user_profiles` on every request. Pitfall 1 -- validate assigned_properties against Airtable canonical names (requires Phase 3 data layer to complete).

### Phase 3: Airtable Data Layer
**Rationale:** This is the most critical phase. Every view depends on it. The data layer must handle caching, rate limiting, property scoping, field name mapping, NaN coercion, linked record resolution, and pagination -- all before any view is built.
**Delivers:** Typed interfaces for all 9 tables, field name mapping (messy Airtable names -> clean TS keys), SDK client with Promise-based wrappers, cache abstraction layer (tag-based, 60s TTL), token-bucket rate limiter, property scoping via filterByFormula, batch linked record resolution, KPI aggregation functions, property name normalization layer.
**Addresses:** Airtable API integration, cache infrastructure, rate limiting, data validation.
**Avoids:** Pitfall 1 (property name mismatch), Pitfall 2 (N+1 linked records), Pitfall 3 (rate limit cascade), Pitfall 5 (URL length limits), Pitfall 6 (pagination truncation), Pitfall 11 (messy field names), Pitfall 12 (NaN values).

### Phase 4: Executive Dashboard (Read-Only)
**Rationale:** Simplest view to build first -- read-only KPI cards with no mutations. Validates that the data layer produces correct aggregations. Quick win for stakeholder buy-in.
**Delivers:** Executive KPI dashboard with 8+ metrics, KPI cards with severity coloring (pink/yellow/white), responsive grid layout.
**Addresses:** Executive KPI dashboard, color-coded alert cards, KPI summary cards.
**Avoids:** Pitfall 13 -- use Promise.all() for parallel fetches, single page-level data load to avoid cold start timeouts.

### Phase 5: Property Manager View (Read + Write)
**Rationale:** The core user workflow. Depends on data layer (Phase 3) and can reuse design system from Phase 1. More complex than Executive view because it includes Server Actions for mutations.
**Delivers:** Turn request list with overdue-first sorting, turn detail with linked jobs, inline job status updates (Server Actions), PM KPI cards, property filter dropdown.
**Addresses:** PM turn list, turn detail drill-down, inline status updates, PM KPIs, property filter.
**Avoids:** Pitfall 7 -- implement read-before-write pattern in all server actions to prevent stale write conflicts.

### Phase 6: District Manager View
**Rationale:** Depends on Property Manager components (Phase 5) for drill-down reuse. The portfolio overview is new, but the property detail view reuses PM components.
**Delivers:** Portfolio overview with property summary cards, drill-down to property-level turn list (reuses Phase 5 components), DM-specific KPIs.
**Addresses:** DM portfolio view, multi-property overview.

### Phase 7: Enhancements, Notifications, and Charts
**Rationale:** Polish and differentiator features that enhance but don't block core workflows. All views must be functional first.
**Delivers:** Smart notification panel (derived from data, middle column), Recharts integration (vendor bar charts, gauges), inline pricing approval, notes on turn requests, vendor metrics page.
**Addresses:** Notification panel, charts/visualization, pricing approval, notes, vendor metrics.
**Avoids:** Pitfall 8 -- aggregate vendor metrics by name not record ID to handle duplicates.

### Phase Ordering Rationale

- **Dependency chain is strict:** Scaffolding -> Auth -> Data Layer -> Views. No phase can be meaningfully parallelized except Phases 4/5 (Executive and PM views could be built simultaneously if two developers are available).
- **Data layer is the keystone:** 10 of 13 identified pitfalls cluster in Phase 3. Getting the data layer right eliminates most risk for subsequent phases.
- **Executive view before PM view:** The executive dashboard is read-only and simpler, making it a better first test of the data layer. If aggregations are wrong, it surfaces immediately in KPI cards.
- **DM view last among the three roles:** It depends on PM components for drill-down reuse. Building it after PM view is pure composition.
- **Enhancements last:** Notification panel, charts, and pricing approval are differentiators that enhance validated workflows. Shipping core views first allows user feedback to shape these features.

### Research Flags

Phases likely needing deeper research during planning:
- **Phase 3 (Airtable Data Layer):** Most pitfall-dense phase. Needs research into current `unstable_cache` / `cacheTag` API status in the installed Next.js version. Also needs validation of the batch linked-record resolution approach against real data volumes.
- **Phase 2 (Auth):** Needs research into `@supabase/ssr` current API for role caching in JWT claims vs cookies. The middleware performance pattern is critical.

Phases with standard patterns (skip deep research):
- **Phase 1 (Scaffolding + Design System):** Standard `create-next-app` setup with Tailwind theming. Well-documented.
- **Phase 4 (Executive Dashboard):** Standard Server Component data fetching with KPI card rendering. No novel patterns.
- **Phase 5 (PM View):** Server Actions for mutations are well-documented in Next.js. The read-before-write pattern is straightforward.

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | All technologies pre-decided and well-established. Version numbers need verification with `npm view`. |
| Features | HIGH | Based on existing Airtable interface screenshots, CSV data analysis, and explicit project requirements. Clear MVP boundary. |
| Architecture | HIGH | Standard Next.js App Router patterns. Server-first with external API is a well-known architecture. Cache strategy is the only area with API stability risk. |
| Pitfalls | HIGH | Multiple pitfalls discovered from direct analysis of project CSV data (property name mismatch, duplicate vendors, NaN values). Airtable API constraints are well-documented. |

**Overall confidence:** HIGH

### Gaps to Address

- **Exact library versions:** Web search was unavailable during research. Run `npm view <package> version` for all dependencies before scaffolding to confirm version numbers.
- **`unstable_cache` API status:** Check whether Next.js 15.x has stabilized this as `cacheLife`/`cacheTag` or `use cache`. The cache abstraction layer design depends on which API is available.
- **Supabase `@supabase/ssr` version:** May have reached 1.0 with API changes. Verify current API for server-side session management and JWT claim customization.
- **Airtable record volume:** Current CSV snapshots show ~40 jobs and ~15 turn requests. Verify whether production data is significantly larger, which would affect batch resolution chunk sizes and pagination strategy.
- **Property name mapping completeness:** The CSV analysis found one mismatch ("Park Point Apartments" vs "Park Point"). A full audit of all property names across tables should happen during Phase 3 implementation.

## Sources

### Primary (HIGH confidence)
- `.planning/PROJECT.md` -- validated requirements, constraints, user roles, key decisions
- `PLAN.md` -- detailed architecture plan, phase breakdown, Airtable schema reference
- `THEME.md` -- design language constraints, color tokens, component specifications
- `AirtableReference/` screenshots -- existing interface baseline (ExecutiveDashboard.png, PropertyView.png, VendorMetrics.png)
- `SnapshotData/` CSV exports -- actual Airtable data for 9 tables, used to discover data quality pitfalls

### Secondary (MEDIUM confidence)
- Next.js App Router documentation -- Server Components, `unstable_cache`, Server Actions patterns (training data cutoff ~May 2025)
- Airtable REST API documentation -- rate limits, pagination, filterByFormula, attachment URL expiry
- Supabase documentation -- `@supabase/ssr` cookie-based auth, middleware patterns

### Tertiary (LOW confidence)
- Exact version numbers for all npm packages -- based on training data, must verify with `npm view`
- `unstable_cache` current API surface -- may have changed post-training-data cutoff

---
*Research completed: 2026-03-08*
*Ready for roadmap: yes*
