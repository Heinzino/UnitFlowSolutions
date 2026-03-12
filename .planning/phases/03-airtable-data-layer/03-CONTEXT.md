# Phase 3: Airtable Data Layer - Context

**Gathered:** 2026-03-11
**Status:** Ready for planning

<domain>
## Phase Boundary

Server-side Airtable integration that makes all 9 tables (Properties, Turn Requests, Jobs, Vendors, Vendor_Pricing, Quotes, Executives, Property_Managers, Maintenance_Managers) accessible through typed, cached, rate-limited functions. Handles property scoping per user role and linked record resolution. Covers DATA-01 through DATA-06.

</domain>

<decisions>
## Implementation Decisions

### Field Naming & Types
- Map Airtable's verbose field names to clean, short camelCase TypeScript names (Claude picks best short name for each)
- Example: `Price (from Quote Price) (from Jobs)` -> `quotePrice`, `Street Address (from Properties)` -> `streetAddress`
- Linked record fields (comma-separated IDs like `51,52,53`) are automatically resolved to full objects (e.g., `Job[]` not `number[]`)
- Linked records are always resolved on every fetch — no opt-in parameter needed. Caching mitigates the extra API calls
- Trust Airtable's computed/rollup field values as-is (e.g., `Time to Complete Unit (Days)`, `Total Cost`, `Days Vacant Until Ready`) — Airtable is the source of truth

### Write Operations
- v1 supports job status updates only (matching PM-08 requirement). Notes and pricing approval writes deferred to v2
- Enforce valid job statuses via TypeScript enum: NEEDS ATTENTION, Blocked, In Progress, Completed, Ready (derived from Airtable data)
- Optimistic UI updates — UI updates immediately on write, reverts on failure
- After successful write: optimistic update + background re-fetch to sync Airtable-computed fields
- Cascade cache busting on writes: bust tags for the updated job, parent turn request, and KPI aggregations

### Error Handling
- Fetch errors: show stale cached data if available with a subtle warning banner ("Data may be outdated — last updated X minutes ago"). Error state only if no cache exists
- Write errors: toast/snackbar notification ("Failed to update status. Please try again.") with optimistic update reverted. Non-blocking
- Rate limiter queues requests invisibly — users see slightly longer loading times, no throttling indicator
- Console logging for errors, rate-limit events, and cache hits/misses (server-side, visible in Vercel logs)

### Data Freshness
- Data fetches on page load with 60s cache TTL. No auto-polling while page is open
- Manual refresh button (subtle icon in page header) busts cache tags for current view and re-fetches
- "Updated X seconds ago" timestamp displayed near refresh button on all dashboard pages
- Page load + manual refresh only — no real-time polling (6-15 users with daily/weekly check cadence, rate limits are a concern)

### Claude's Discretion
- Airtable client library choice (official SDK vs raw fetch)
- Rate limiter implementation (token bucket, sliding window, etc.)
- Cache tag naming strategy
- TypeScript interface organization (one file vs per-table)
- Batch resolution strategy for linked records (parallel vs sequential)
- Server action patterns for write operations
- Toast notification component implementation

</decisions>

<specifics>
## Specific Ideas

- The data layer must work seamlessly with the existing `filterByProperties()` utility in `src/lib/normalize-property-name.ts` for property scoping
- PMs sometimes make changes directly in Airtable — the manual refresh button is important so they can pull those changes into the dashboard
- The "fewer clicks" philosophy extends to error handling — don't interrupt users with modals or blocking errors. Toast notifications and stale data with warnings keep them productive
- Job status enum should match exactly what Airtable expects — derived from actual CSV snapshot data

</specifics>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/lib/normalize-property-name.ts`: `filterByProperties()`, `propertyMatches()`, `normalizePropertyName()` — ready for property scoping in data layer
- `src/lib/types/auth.ts`: `UserRole`, `AppMetadata` with `property_ids` — needed to determine scoping per user
- `src/lib/supabase/server.ts`: Server-side Supabase client — pattern for creating server-side clients
- `src/components/ui/skeleton.tsx`: Skeleton component for loading states

### Established Patterns
- Server-side data access via Supabase client factories — similar pattern needed for Airtable
- TypeScript types defined in `src/lib/types/` directory
- Utility functions in `src/lib/` directory
- Test files in `src/lib/__tests__/`

### Integration Points
- `.env.local` needs Airtable API key and base ID (not yet configured — only Supabase vars exist)
- Server components in `src/app/(dashboard)/` will consume data layer functions
- Middleware at `src/middleware.ts` handles auth — data layer functions will run after auth check
- Property scoping connects auth (user's assigned properties) to data filtering (Airtable records)

</code_context>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 03-airtable-data-layer*
*Context gathered: 2026-03-11*
