# Phase 4: Executive Dashboard - Context

**Gathered:** 2026-03-12
**Status:** Ready for planning

<domain>
## Phase Boundary

Read-only KPI dashboard for executives. Displays health snapshot across all properties — KPI cards, Make Ready overview, and alert cards. No filtering, no interactions beyond viewing. All data computed across all properties (EXEC-06).

Requirements covered: EXEC-01, EXEC-02, EXEC-03, EXEC-04, EXEC-05, EXEC-06, EXEC-07

</domain>

<decisions>
## Implementation Decisions

### Page Layout
- Simple header: "Executive Dashboard" title + "Welcome, [Name]" + current date
- 6 KPI cards in a 3-column, 2-row grid
- Below KPIs: Make Ready Overview section (single KPI card + alert cards)
- Alert cards (pink/yellow) appear below the Make Ready KPI card, side by side
- On mobile (<768px): all cards stack to single column, full width

### KPI Card Grid (Row 1-2)
- Row 1: Active Jobs Open | Jobs Trending Past Target | Jobs Completed (30d)
- Row 2: Backlog Delta | Avg Time to Complete | Projected Cost Exposure (MTD)

### KPI Calculation Rules

**Active Jobs Open**
- Source: Jobs table
- Filter: status NOT IN (Completed, Invoice Sent)
- Aggregation: record count

**Jobs Trending Past Target** (subtitle: "2 days from completion date")
- Source: Jobs table
- Filter: status NOT IN (Completed, Invoice Sent) AND end date within next 2 days
- Aggregation: record count

**Jobs Completed (30d)**
- Source: Jobs table
- Filter: status IN (Completed, Invoice Sent) AND end date within past 30 days
- Aggregation: record count

**Backlog Delta**
- Source: Jobs table
- Filter: status IN (Completed, Invoice Sent) AND end date within past 30 days
- Aggregation: SUM of delta field (not record count). Result = jobs opened last 30d minus completed last 30d.

**Average Time to Complete a Job**
- Source: Turn Requests table
- Filter: status = Done
- Field: "Time to Complete" (units: days)
- Aggregation: average (sum / count)

**Projected Cost Exposure MTD** (subtitle: "includes completed and authorized jobs in progress")
- Source: Turn Requests table
- Filter: ALL records (no filter)
- Aggregation: SUM of price field

### Make Ready Overview

**Active Make Readys Open**
- Source: Turn Requests table
- Filter: status IN (Needs Attention, To Do, In Progress)
- Aggregation: record count
- Display: single KPI card

### Alert Cards

**Make Readys Past Target Time** (pink, "NEEDS ATTENTION")
- Source: Turn Requests table
- Filter: days_vacant_until_ready > 10
- Aggregation: record count
- Display: count + list of affected items (Property + Unit), max 5 shown, then "+ N more"

**Make Readys Trending Past Target Date** (yellow, subtitle: "2 days from target time")
- Source: Turn Requests table
- Filter: days_vacant_until_ready > 8
- Aggregation: record count
- Display: count + list of affected items (Property + Unit), max 5 shown, then "+ N more"

### Alert Card Behavior
- Not clickable — executive dashboard is read-only, action is the PM's job
- Hidden when count is 0 — absence of alert cards IS the good news
- Item list shows Property Name + Unit Number (e.g., "Oak Ridge #204")
- Truncated at 5 items with "+ N more" for larger lists

### Claude's Discretion
- Exact Suspense boundary strategy for async data fetching (fix existing Next.js 16 blocking route error)
- Loading skeleton arrangement matching card grid
- Section heading styles and spacing
- Icon choices for each KPI card
- Trend indicator logic (30-day comparison window)

</decisions>

<specifics>
## Specific Ideas

- Executives check weekly for a health snapshot — this page should be scannable in seconds
- Alert cards should stand out from the white KPI cards with their pink/yellow backgrounds
- The existing executive page placeholder (src/app/(dashboard)/executive/page.tsx) needs Suspense wrapping to fix the Next.js 16 blocking route error from Phase 2

</specifics>

<code_context>
## Existing Code Insights

### Reusable Assets
- `KPICard` (src/components/ui/kpi-card.tsx): Has `default`, `highlighted`, `alert-past`, `alert-trending` variants + built-in `loading` skeleton. Use `alert-past` for pink cards, `alert-trending` for yellow.
- `TrendIndicator` (src/components/ui/trend-indicator.tsx): Arrow + percentage for KPI trend display
- `CurrencyDisplay` (src/components/ui/currency-display.tsx): Formatted currency for Projected Cost Exposure
- `Skeleton` (src/components/ui/skeleton.tsx): Loading state primitives
- `Card` (src/components/ui/card.tsx): Container for Make Ready Overview section

### Established Patterns
- Server Components with `createClient()` for auth (existing executive page pattern)
- Airtable fetch functions: `fetchJobs()`, `fetchTurnRequests()`, `fetchTurnRequestsForUser()` with caching and rate limiting
- `use cache` + `cacheLife` + `cacheTag` pattern for data fetching (Phase 3)
- Structured error returns from server actions (`{ success, error }`)

### Integration Points
- Executive page: `src/app/(dashboard)/executive/page.tsx` — existing placeholder to replace
- Auth: `createClient()` + `supabase.auth.getUser()` for user identity
- Data: All 9 fetch functions in `src/lib/airtable/tables/`
- Toaster: Sonner already wired into root layout (available if needed)

</code_context>

<deferred>
## Deferred Ideas

- Property Manager view KPIs mentioned during discussion — captured for Phase 5 planning

</deferred>

---

*Phase: 04-executive-dashboard*
*Context gathered: 2026-03-12*
