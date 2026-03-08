# Architecture Research

**Domain:** Property management turnover dashboard with external data source (Airtable API)
**Researched:** 2026-03-08
**Confidence:** HIGH

## Standard Architecture

### System Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                        BROWSER (Client)                             │
│  ┌──────────┐  ┌──────────────┐  ┌─────────────┐  ┌────────────┐  │
│  │ Sidebar  │  │ Notification │  │ Main Content │  │ Client     │  │
│  │ Nav      │  │ Panel        │  │ (RSC output) │  │ Islands    │  │
│  └──────────┘  └──────────────┘  └──────────────┘  └────────────┘  │
├─────────────────────────────────────────────────────────────────────┤
│                     NEXT.JS APP ROUTER (Vercel)                     │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────────┐  │
│  │ Middleware   │  │ Server       │  │ Route Handlers /         │  │
│  │ (auth gate)  │  │ Components   │  │ Server Actions (writes)  │  │
│  └──────┬───────┘  └──────┬───────┘  └──────────┬───────────────┘  │
│         │                 │                      │                  │
│  ┌──────┴─────────────────┴──────────────────────┴───────────────┐  │
│  │                    DATA ACCESS LAYER                           │  │
│  │  ┌────────────┐  ┌──────────┐  ┌──────────────┐              │  │
│  │  │ Cache      │  │ Rate     │  │ Property     │              │  │
│  │  │ (unstable_ │  │ Limiter  │  │ Scoping      │              │  │
│  │  │  cache)    │  │ (token   │  │ (filter by   │              │  │
│  │  │            │  │  bucket) │  │  user role)  │              │  │
│  │  └────────────┘  └──────────┘  └──────────────┘              │  │
│  └───────────────────────────────────────────────────────────────┘  │
├──────────────────────┬──────────────────────────────────────────────┤
│     SUPABASE         │              AIRTABLE REST API               │
│  ┌────────────────┐  │  ┌────────────────────────────────────────┐  │
│  │ Auth (login)   │  │  │ 9 Tables (source of truth)             │  │
│  │ user_profiles  │  │  │ Properties, Turn Requests, Jobs,       │  │
│  │ (roles +       │  │  │ Vendors, Vendor_Pricing, Quotes,       │  │
│  │  properties)   │  │  │ Executives, Property_Managers,         │  │
│  └────────────────┘  │  │ Maintenance_Managers                   │  │
│                      │  └────────────────────────────────────────┘  │
└──────────────────────┴──────────────────────────────────────────────┘
```

This is a **server-first read-heavy dashboard** pattern. The key architectural insight: the dashboard is a presentation layer over an external data source (Airtable), not a traditional CRUD app with its own database. This shapes every decision.

### Component Responsibilities

| Component | Responsibility | Typical Implementation |
|-----------|----------------|------------------------|
| Middleware | Authenticate every request, enforce role-based route access, redirect unauthenticated users | Next.js `middleware.ts` using `@supabase/ssr` to refresh session cookies |
| Server Components | Fetch data, compute KPIs, render HTML server-side | `async` React Server Components calling data access layer directly |
| Server Actions | Handle mutations (status updates, pricing approval, notes) | `'use server'` functions that write to Airtable then `revalidateTag()` |
| Client Islands | Interactive UI elements (dropdowns, forms, optimistic updates) | `'use client'` components embedded within Server Component pages |
| Cache Layer | Prevent redundant Airtable API calls, respect rate limits | `unstable_cache` with 60s TTL and tag-based invalidation |
| Rate Limiter | Enforce Airtable's 5 req/sec limit across all server-side callers | Token-bucket algorithm, shared across the Node.js process |
| Property Scoping | Filter all queries by the current user's assigned properties | `filterByFormula` parameter injected into every Airtable query |
| Supabase Auth | Login/logout, session management, role + property assignment lookup | `@supabase/ssr` for cookie-based sessions, `user_profiles` table for role data |
| Airtable API | Single source of truth for all business data | Official `airtable` SDK, server-side only, API key never exposed to browser |

## Recommended Project Structure

```
src/
├── app/                           # Next.js App Router pages
│   ├── layout.tsx                 # Root layout (fonts, global providers)
│   ├── page.tsx                   # Root redirect based on user role
│   ├── globals.css                # Tailwind base + theme tokens
│   ├── login/                     # Public route
│   │   ├── page.tsx               # Login form
│   │   └── actions.ts             # signIn/signOut server actions
│   ├── auth/callback/route.ts     # Supabase auth callback
│   ├── executive/                 # Executive role routes
│   │   ├── layout.tsx             # Shell with role-specific nav
│   │   ├── page.tsx               # KPI dashboard
│   │   ├── loading.tsx            # Skeleton loading state
│   │   └── vendors/page.tsx       # Vendor metrics
│   ├── property/                  # PM + Maintenance Manager routes
│   │   ├── layout.tsx
│   │   ├── page.tsx               # Turn list + KPIs
│   │   ├── loading.tsx
│   │   ├── actions.ts             # approvePricing, addNote
│   │   └── turns/[requestId]/     # Turn detail with jobs
│   │       └── page.tsx
│   └── district/                  # District Manager routes
│       ├── layout.tsx
│       ├── page.tsx               # Portfolio overview
│       ├── loading.tsx
│       ├── actions.ts             # approveEscalatedPricing
│       └── properties/[propertyName]/
│           └── page.tsx           # Drill-down (reuses property components)
├── components/
│   ├── ui/                        # Design system primitives
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── kpi-card.tsx
│   │   ├── badge.tsx
│   │   ├── table.tsx
│   │   ├── input.tsx
│   │   └── skeleton.tsx
│   ├── layout/                    # App shell components
│   │   ├── sidebar.tsx
│   │   ├── notification-panel.tsx
│   │   ├── main-content.tsx
│   │   ├── shell.tsx
│   │   └── header.tsx
│   ├── shared/                    # Cross-view reusable components
│   │   ├── status-badge.tsx
│   │   ├── trend-indicator.tsx
│   │   ├── currency-display.tsx
│   │   ├── property-filter.tsx
│   │   └── date-display.tsx
│   ├── property/                  # PM-specific composed components
│   │   ├── turn-list.tsx
│   │   ├── job-status-row.tsx
│   │   ├── pricing-approval.tsx
│   │   └── notes-form.tsx
│   ├── district/                  # DM-specific composed components
│   │   ├── portfolio-overview.tsx
│   │   └── property-summary-card.tsx
│   ├── notifications/             # Notification panel components
│   │   ├── notification-list.tsx
│   │   └── notification-item.tsx
│   └── charts/                    # Data visualization
│       ├── vendor-bar-chart.tsx
│       └── gauge.tsx
├── lib/
│   ├── constants.ts               # Design tokens, magic numbers
│   ├── utils.ts                   # Shared utilities (cn(), formatCurrency, etc.)
│   ├── supabase/
│   │   ├── client.ts              # Browser Supabase client
│   │   └── server.ts              # Server Supabase client (cookie-based)
│   ├── airtable/
│   │   ├── client.ts              # SDK initialization
│   │   ├── tables.ts              # Table name constants + field name maps
│   │   ├── types.ts               # TypeScript interfaces for all 9 tables
│   │   ├── cache.ts               # unstable_cache wrappers with tag config
│   │   ├── rate-limiter.ts        # Token-bucket (5 req/sec)
│   │   ├── properties.ts          # getProperties()
│   │   ├── jobs.ts                # getJobs(), updateJobStatus()
│   │   ├── turn-requests.ts       # getTurnRequests(), addNote()
│   │   ├── vendors.ts             # getVendors()
│   │   ├── quotes.ts              # getQuotes()
│   │   ├── vendor-pricing.ts      # getVendorPricing()
│   │   └── aggregations.ts        # KPI computation functions
│   └── notifications.ts           # Derive notification items from Airtable data
├── types/
│   ├── index.ts                   # Shared type exports
│   └── auth.ts                    # UserProfile, Role types
└── middleware.ts                   # Auth gate + role-based route protection
```

### Structure Rationale

- **`app/` by role:** Three separate route groups (`executive/`, `property/`, `district/`) because these are genuinely different applications sharing a data layer, not minor variations of one view. Each role has distinct data needs, page layouts, and permitted actions. Shared layout code lives in `components/layout/`.
- **`lib/airtable/` as a domain service layer:** One file per Airtable table creates a clean boundary. Every file exports typed query functions. Cache and rate-limiter sit alongside as infrastructure concerns. No Airtable SDK usage leaks outside this directory.
- **`lib/supabase/` kept minimal:** Two files (client + server) because Supabase is only used for auth. No business logic here.
- **`components/` split by scope:** `ui/` holds design-system primitives with zero business logic. `shared/` holds domain-aware but role-agnostic components. `property/` and `district/` hold role-specific composed components. This prevents cross-contamination while maximizing reuse (the district drill-down imports from `property/`).

## Architectural Patterns

### Pattern 1: Server Component Data Fetching with Parallel Promises

**What:** Each page is an `async` Server Component that fetches multiple data sets in parallel using `Promise.all()`, then passes the results down as props to presentational components.

**When to use:** Every page in this dashboard. Server Components are the default rendering mode; only add `'use client'` for interactive elements.

**Trade-offs:** Maximizes performance (no client-side waterfall, no loading spinners for initial data), but requires careful thinking about which components need interactivity. Forms, dropdowns, and optimistic updates must be client components.

**Example:**
```typescript
// src/app/executive/page.tsx
export default async function ExecutiveDashboard() {
  const user = await getUser();

  const [activeJobs, trendingPast, completed30d, backlogDelta, avgTime, costExposure, activeMakeReadys, pastTarget, trendingTarget] =
    await Promise.all([
      getActiveJobsOpen(),
      getJobsTrendingPastTarget(),
      getJobsCompletedLast30Days(),
      getBacklogDelta(),
      getAvgTimeToComplete(),
      getProjectedCostExposure(),
      getActiveMakeReadys(),
      getMakeReadysPastTargetTime(),
      getMakeReadysTrendingPastTarget(),
    ]);

  return (
    <div className="grid grid-cols-2 gap-6">
      <KPICard title="Active Jobs Open" value={activeJobs} />
      <KPICard title="Jobs Trending Past Target" value={trendingPast} variant="warning" />
      {/* ... */}
    </div>
  );
}
```

### Pattern 2: Cache-Through Data Access with Tag Invalidation

**What:** Every Airtable read goes through `unstable_cache` with a 60-second TTL and a table-specific tag. Writes call `revalidateTag()` to bust the cache for affected tables, so the writing user sees fresh data immediately while other users see cached data for up to 60 seconds.

**When to use:** All Airtable reads and writes. This is the core strategy for staying within Airtable's 5 req/sec rate limit while keeping data reasonably fresh.

**Trade-offs:** 60-second staleness is acceptable for this use case (6-15 users, daily/weekly check-ins). The `unstable_cache` API may change in future Next.js versions but is the standard approach for App Router caching today.

**Example:**
```typescript
// src/lib/airtable/cache.ts
import { unstable_cache } from 'next/cache';

export function cachedQuery<T>(
  queryFn: () => Promise<T>,
  keyParts: string[],
  tags: string[],
  revalidate = 60
) {
  return unstable_cache(queryFn, keyParts, { tags, revalidate })();
}

// src/lib/airtable/jobs.ts
export async function getJobs(propertyNames?: string[]) {
  return cachedQuery(
    () => fetchJobsFromAirtable(propertyNames),
    ['jobs', ...(propertyNames ?? ['all'])],
    ['airtable-jobs'],
    60
  );
}

// src/app/property/actions.ts
'use server';
import { revalidateTag } from 'next/cache';

export async function updateJobStatus(jobId: string, status: string) {
  await rateLimiter.acquire();
  await airtableClient('Jobs').update(jobId, { Status: status });
  revalidateTag('airtable-jobs');
}
```

### Pattern 3: Middleware-Based Auth Gate with Role Routing

**What:** A single `middleware.ts` handles session refresh, authentication check, and role-based route protection. Unauthenticated users go to `/login`. Authenticated users at `/` get redirected to their role-appropriate dashboard. Users accessing wrong-role routes get redirected.

**When to use:** This is the only auth pattern for this project. All route protection happens here, not in individual pages.

**Trade-offs:** Centralizes auth logic (single place to reason about access control) but middleware runs on every request, so it must be fast. Supabase session refresh is cheap (cookie-based, no DB call on cache hit). Role lookup from `user_profiles` should be cached in the session/cookie to avoid a DB call on every request.

### Pattern 4: Property-Scoped Query Injection

**What:** Every data access function accepts an optional `propertyNames?: string[]` parameter. The middleware/page reads the user's `assignedProperties` from their Supabase profile and passes it through. Executives pass no filter (see all data). PMs and DMs pass their assigned properties.

**When to use:** Every single Airtable query. This is the authorization boundary for data access.

**Trade-offs:** Simple and effective for a small user base. The property names in Supabase `user_profiles` must exactly match the property names in Airtable. Mismatches silently return empty results (see Pitfalls).

## Data Flow

### Read Flow (Page Load)

```
User navigates to /property
    |
Middleware: refresh Supabase session, check auth, verify role
    |
Server Component: get user profile (role + assignedProperties)
    |
Promise.all([
  getJobs(assignedProperties),        ──> Cache hit? Return cached
  getTurnRequests(assignedProperties),     Cache miss? Rate limiter
  getActiveMakeReadys(assignedProperties)  queue -> Airtable API
])                                         -> cache result (60s TTL)
    |
Render HTML with data -> Stream to browser
```

### Write Flow (Status Update / Pricing Approval)

```
User clicks "Approve Pricing" (Client Component)
    |
Server Action: approvePricing(jobId, true)
    |
Rate limiter: acquire token (wait if at 5/sec)
    |
Airtable API: PATCH /Jobs/{jobId} with new status
    |
revalidateTag('airtable-jobs')  <-- Busts cache for all job queries
    |
Next.js re-renders the page with fresh data (for this user)
Other users: see cached data until their 60s TTL expires
```

### Auth Flow

```
User visits any page
    |
Middleware checks Supabase session cookie
    |
No session? ──> Redirect to /login
    |
Has session? ──> Refresh token if needed
    |           ──> Fetch user_profiles row (role + assignedProperties)
    |           ──> Check route matches role
    |                 Mismatch? ──> Redirect to correct role dashboard
    |                 Match? ──> Continue to page
    |
/ (root)? ──> Redirect to role dashboard:
                executive -> /executive
                property_manager -> /property
                district_manager -> /district
                maintenance_manager -> /property
```

### Key Data Flows

1. **KPI Aggregation:** Server Components call aggregation functions in `lib/airtable/aggregations.ts`. These functions fetch raw records from the per-table query files, then compute counts/averages/sums in JavaScript. KPIs are computed server-side on every page load (cached for 60s). No pre-computed aggregation tables exist in Airtable.

2. **Notification Derivation:** Notifications are not stored anywhere. `lib/notifications.ts` examines the current Jobs and Turn Requests data (already fetched and cached) to produce a list of notification objects. Jobs with status "NEEDS ATTENTION", Counter Quotes awaiting review, and approaching deadlines all generate notification items. This happens server-side during page render.

3. **District Manager Drill-Down:** The DM portfolio page fetches summary-level data for all assigned properties. Clicking a property card navigates to `/district/properties/[propertyName]`, which reuses the same turn-list and job components from the Property Manager view but passes a single-property filter. Component reuse, not code duplication.

4. **Linked Record Resolution:** Airtable linked record fields return arrays of record IDs (e.g., a Turn Request's "Jobs" field returns `['recABC', 'recDEF']`). The data layer must batch-fetch these linked records using `OR(RECORD_ID()='recABC', RECORD_ID()='recDEF')` formula filters to minimize API calls. This is handled within the per-table query functions, not at the component level.

## Scaling Considerations

| Scale | Architecture Adjustments |
|-------|--------------------------|
| 6-15 users (current) | Current architecture is ideal. 60s cache means most page loads never hit Airtable. Token-bucket rate limiter is a safety net that rarely activates. |
| 50-100 users | Increase cache TTL to 120-300s. Consider ISR (Incremental Static Regeneration) for executive dashboard since it shows org-wide data. Watch for Vercel function cold starts increasing response time. |
| 100+ users | Airtable becomes the bottleneck. At this scale, consider syncing Airtable data to a Supabase/Postgres database on a schedule (webhooks or cron) and reading from there. This is a significant architecture change and not needed now. |

### Scaling Priorities

1. **First bottleneck: Airtable API rate limit.** With 60s cache and 6-15 users, the actual Airtable API call rate will be well under 1 req/sec on average. The 5 req/sec limit is only a concern if caches expire simultaneously or many users trigger writes at once. The token-bucket rate limiter handles this.

2. **Second bottleneck: Vercel function execution time.** Pages that fetch from multiple Airtable tables on cache miss could take 2-5 seconds. `Promise.all()` parallelizes this, and `loading.tsx` skeletons cover the wait. Not a real problem at current scale.

## Anti-Patterns

### Anti-Pattern 1: Client-Side Airtable Fetching

**What people do:** Import the Airtable SDK or call the API from client components or browser-side fetch.
**Why it's wrong:** Exposes the Airtable API key to the browser. Also wastes rate limit budget by having each user's browser make independent API calls.
**Do this instead:** All Airtable access through Server Components and Server Actions. The API key only exists in server-side environment variables.

### Anti-Pattern 2: Duplicating Data to a Local Database

**What people do:** Sync Airtable data into Supabase/Postgres and query locally for speed.
**Why it's wrong:** At this scale (6-15 users), the sync complexity outweighs the benefit. You now have two sources of truth, sync lag, conflict resolution, and double the maintenance. Airtable is where existing workflows live.
**Do this instead:** Use `unstable_cache` as a read-through cache. Same speed benefit, zero sync complexity. Only reconsider if you outgrow Airtable's rate limits.

### Anti-Pattern 3: One Mega Query Per Page

**What people do:** Fetch all records from all tables on page load, then filter/aggregate client-side.
**Why it's wrong:** Wastes API calls, hits rate limits faster, sends unnecessary data over the wire, and makes pages slow.
**Do this instead:** Use Airtable's `filterByFormula` to request only the records you need. Each query function should accept filters (property names, status, date ranges) and push them to the API level.

### Anti-Pattern 4: Per-Component Data Fetching Without Deduplication

**What people do:** Each component on the page independently fetches its own data, causing duplicate Airtable API calls for the same table.
**Why it's wrong:** With a 5 req/sec rate limit, hitting the Jobs table 6 times for 6 different KPI cards is wasteful and risks throttling.
**Do this instead:** Fetch data at the page level (Server Component), compute all derived values there, and pass results down as props. Or use Next.js request deduplication (same `fetch` call in multiple components during the same render is automatically deduplicated). The `unstable_cache` approach with matching cache keys also handles this.

### Anti-Pattern 5: Storing Roles in Airtable

**What people do:** Read the Executives/Property_Managers/Maintenance_Managers tables to determine who has access to what.
**Why it's wrong:** Authentication and authorization should not depend on the data source you are protecting. If Airtable is down, you cannot even check who is allowed to see the "Airtable is down" error page.
**Do this instead:** Supabase `user_profiles` owns auth + role + property assignments. Airtable people tables are reference data for display, not auth decisions. This is already the planned approach.

## Integration Points

### External Services

| Service | Integration Pattern | Notes |
|---------|---------------------|-------|
| Airtable REST API | Server-side SDK (`airtable` npm package) via `lib/airtable/client.ts` | API key in `AIRTABLE_API_KEY` env var. Base ID in `AIRTABLE_BASE_ID`. Rate limit: 5 req/sec. Pagination: 100 records/page (SDK handles automatically with `.eachPage()`). |
| Supabase Auth | `@supabase/ssr` for cookie-based session management | `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` env vars. Server client reads cookies. Browser client for login form only. |
| Vercel | Deployment target, handles `unstable_cache` storage and edge middleware | No special configuration needed beyond env vars. `unstable_cache` uses Vercel's data cache. `revalidateTag` works out of the box on Vercel. |

### Internal Boundaries

| Boundary | Communication | Notes |
|----------|---------------|-------|
| Pages <-> Data Layer | Direct function calls (server-side) | Pages import from `lib/airtable/*.ts`. No REST API between them. This is a monolith, not microservices. |
| Server Components <-> Client Components | Props (serializable data only) | Server Components render Client Components, passing data as props. Client Components cannot import server-only modules. |
| Server Actions <-> Data Layer | Direct function calls | Server Actions call `lib/airtable/*.ts` write functions, then `revalidateTag()`. |
| Middleware <-> Supabase | `@supabase/ssr` cookie operations | Middleware refreshes session, reads user profile. Must be fast (runs on every request). |
| Data Layer <-> Airtable | HTTP via `airtable` SDK | All calls go through rate limiter. All reads go through cache. Property scoping applied via `filterByFormula`. |

## Build Order (Dependencies)

The following build order reflects hard dependencies between components:

```
Phase 1: Scaffolding + Design System
    No dependencies. Can build UI primitives with mock data.
    Produces: Tailwind config, component library, layout shell.

    |
    v
Phase 2: Authentication (Supabase)
    Depends on: Layout shell (Phase 1) for login page styling.
    Produces: Login flow, middleware, role types, route protection.

    |
    v
Phase 3: Airtable Data Layer
    Depends on: Auth (Phase 2) for property-scoped queries using user profile.
    Produces: Typed query functions, cache layer, rate limiter, KPI aggregations.
    This is the most critical phase — all views depend on it.

    |
    v
Phase 4: Executive View          Phase 5: Property Manager View
    Depends on: Data Layer            Depends on: Data Layer
    (Phase 3).                        (Phase 3).
    Read-only KPI cards.              Read + Write (status, pricing, notes).
    Simplest view to build first.     More complex, has Server Actions.

              |                                  |
              v                                  v
         Phase 6: District Manager View
             Depends on: Property Manager components (Phase 5)
             for drill-down reuse. Also needs Data Layer (Phase 3).

                            |
                            v
                  Phase 7: Notifications + Charts + Polish
                      Depends on: All views built (Phases 4-6).
                      Adds notification derivation, Recharts integration,
                      responsive breakpoints, vendor metrics page.
```

**Key dependency insight:** The Airtable data layer (Phase 3) is the single most important phase. Build it right (typed, cached, rate-limited, property-scoped) and every view phase becomes straightforward. Build it wrong and every view has problems.

**Component reuse chain:** District Manager drill-down (`/district/properties/[name]`) reuses `turn-list.tsx`, `job-status-row.tsx`, and KPI card compositions from Phase 5. Build Property Manager view first, then District Manager becomes mostly composition.

## Sources

- Project context: `.planning/PROJECT.md` (project requirements, constraints, key decisions)
- Existing implementation plan: `PLAN.md` (detailed phase breakdown, file tree, schema reference)
- Airtable reference screenshots: `AirtableReference/ExecutiveDashboard.png`, `PropertyView.png` (existing UI being replaced)
- Snapshot data CSVs: `SnapshotData/` (9 CSV files representing current Airtable schema)
- Architecture patterns based on Next.js App Router Server Components model (HIGH confidence - well-established patterns)
- Caching strategy based on Next.js `unstable_cache` + `revalidateTag` API (MEDIUM confidence - API is marked unstable but is the standard approach and widely used in production)
- Airtable rate limit of 5 req/sec is documented in Airtable's official API documentation (HIGH confidence)

---
*Architecture research for: Property management turnover dashboard (UnitFlowSolutions)*
*Researched: 2026-03-08*
