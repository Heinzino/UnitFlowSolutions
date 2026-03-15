# UnitFlowSolutions (ScheduleSimple) Dashboard — Implementation Plan

## Context

The existing Airtable base manages property unit turnovers (make readys) — tracking jobs, vendors, pricing, and completion across multiple apartment properties. The current workflow requires Airtable licenses and the native interface is not role-appropriate for different stakeholders. This plan builds a custom Next.js dashboard that reads/writes to Airtable via its API, uses Supabase solely for auth and role mapping, and provides three tailored views: Property Manager, District Manager (multi-property), and Executive.

---

## Architecture

```
Browser → Next.js (Vercel) → Supabase Auth (login/roles only)
                            → Airtable REST API (all data, source of truth)
```

- **No data duplication** — Airtable is the single source of truth
- **Airtable API key is server-side only** — never exposed to the browser
- **Caching** — Next.js `unstable_cache` with 60s revalidation + tag-based busting on writes
- **Rate limiting** — Token-bucket limiter to stay under Airtable's 5 req/sec

---

## Phase 1: Project Scaffolding + Design System

### 1A: Next.js Setup

Scaffold with `create-next-app` (App Router, TypeScript, Tailwind, src directory).

**Install:**
- `@supabase/supabase-js`, `@supabase/ssr` — auth
- `airtable` — official SDK
- `lucide-react` — icons
- `recharts` — charts/gauges

**Environment variables (`.env.local.example`):**
```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
AIRTABLE_API_KEY=
AIRTABLE_BASE_ID=
```

**Configure `tailwind.config.ts`** with THEME.md tokens:
| Token | Value | Usage |
|-------|-------|-------|
| `forest` | `#0F4A2A` | Page background |
| `emerald` | `#22C55E` / `#16A34A` | Primary accent, positive indicators |
| `cta` | `#CAEF45` | Hero CTA buttons |
| `danger` | `#EF4444` | Negative indicators |
| `link` | `#14B8A6` | Links, emails |
| `card` | `#FFFFFF` | Card surfaces |
| `text-primary` | `#111827` | Primary text |
| `text-secondary` | `#6B7280` | Secondary/muted text |

- Card border-radius: `16px`
- Fonts: Plus Jakarta Sans (headings) + Geist (body)
- `globals.css`: Dark forest green background with subtle vertical stripe texture pattern

### 1B: Design System Components

Build reusable primitives before any views:

| Component | File | Description |
|-----------|------|-------------|
| Button | `src/components/ui/button.tsx` | Pill-shaped, chartreuse CTA + gray secondary variants |
| Card | `src/components/ui/card.tsx` | White, 16px radius, soft shadow, 24px padding |
| KPICard | `src/components/ui/kpi-card.tsx` | Icon badge top-left, large bold number, optional trend arrow, optional alert bg (pink/yellow) |
| Badge | `src/components/ui/badge.tsx` | Status pill badges color-coded by status |
| Table | `src/components/ui/table.tsx` | Minimal — subtle row dividers, no heavy borders |
| Input | `src/components/ui/input.tsx` | Form inputs styled to theme |
| Skeleton | `src/components/ui/skeleton.tsx` | Loading state matching card shapes |
| StatusBadge | `src/components/shared/status-badge.tsx` | Maps job/turn status → colored pill |
| TrendIndicator | `src/components/shared/trend-indicator.tsx` | Arrow up/down + percentage + color |
| CurrencyDisplay | `src/components/shared/currency-display.tsx` | Dollar formatting |

### 1C: Layout Shell

Three-column layout per THEME.md:

| Component | File | Description |
|-----------|------|-------------|
| Sidebar | `src/components/layout/sidebar.tsx` | Narrow icon sidebar (dark green), active state = filled green circle. Nav items: Dashboard, Properties, Turns, Vendors, Settings |
| NotificationPanel | `src/components/layout/notification-panel.tsx` | Middle column, scrollable notification list |
| MainContent | `src/components/layout/main-content.tsx` | Right column, scrollable content area |
| Shell | `src/components/layout/shell.tsx` | Three-column composition combining all above |
| Header | `src/components/layout/header.tsx` | Top bar within main content (page title, user info, logout) |

**Responsive behavior:**
- Desktop (1280px+): Full three-column layout
- Tablet: Sidebar + main content (notification panel as slide-over drawer)
- Mobile: Bottom tab bar replaces sidebar, cards stack vertically

---

## Phase 2: Authentication (Supabase)

### Supabase Database Setup

Create a `user_profiles` table in the Supabase dashboard:

```sql
create table public.user_profiles (
  id uuid references auth.users primary key,
  email text not null,
  role text not null check (role in ('property_manager', 'district_manager', 'executive', 'maintenance_manager')),
  display_name text,
  assigned_properties text[],  -- e.g., ARRAY['Park Point', 'Oak Terrace']
  created_at timestamptz default now()
);

alter table user_profiles enable row level security;

create policy "Users read own profile"
  on user_profiles for select
  using (auth.uid() = id);
```

**Role definitions:**
- `executive` — No property filter, sees everything
- `district_manager` — Multiple properties in `assigned_properties` array
- `property_manager` — One or more properties in `assigned_properties`
- `maintenance_manager` — Same UI as property_manager, scoped to their assigned properties

**Important:** Roles are assigned at account creation by an admin. Users do NOT self-select roles. When a new manager is added in Airtable, a corresponding Supabase account must be created manually (or via a future admin panel).

### Auth Files

| File | Purpose |
|------|---------|
| `src/lib/supabase/client.ts` | Browser Supabase client (`createBrowserClient`) |
| `src/lib/supabase/server.ts` | Server Supabase client (`createServerClient` with cookies) |
| `src/app/login/page.tsx` | Email/password login form — dark green bg, white card, chartreuse submit button |
| `src/app/login/actions.ts` | Server actions: `signIn(email, password)`, `signOut()` |
| `src/app/auth/callback/route.ts` | Auth callback handler |
| `src/middleware.ts` | Next.js middleware for session refresh + route protection |
| `src/types/auth.ts` | `UserProfile` interface, `Role` type |

### Auth Types

```typescript
type Role = 'property_manager' | 'district_manager' | 'executive' | 'maintenance_manager';

interface UserProfile {
  id: string;
  email: string;
  role: Role;
  displayName: string;
  assignedProperties: string[];  // e.g., ["Park Point", "Oak Terrace"]
}
```

### Middleware Logic (`src/middleware.ts`)

1. Refresh Supabase session on every request
2. Unauthenticated users → redirect to `/login`
3. Fetch user role from `user_profiles`
4. Route protection:
   - `/executive/*` → `executive` only
   - `/district/*` → `district_manager` only
   - `/property/*` → `property_manager` + `maintenance_manager`
5. Root `/` → redirect to role-appropriate dashboard

---

## Phase 3: Airtable API Integration Layer

The core data layer. **All Airtable access is server-side only.**

### Airtable Schema (9 Tables)

Based on the CSV snapshots in `SnapshotData/`:

#### Properties
| Field | Type | Notes |
|-------|------|-------|
| Property Name | Text | Join key (e.g., "Park Point") |
| Street Address | Text | |
| City, State | Text | |
| Unit Number | Text | |
| Bedrooms, Bathrooms | Number | |
| Floor Plan | Text | |
| Turn Requests | Linked | → Turn Requests table |

#### Turn Requests
| Field | Type | Notes |
|-------|------|-------|
| Request ID | Autonumber | |
| Status | Text | "Done" or "In progress" |
| Target Date | Date | |
| Vacant Date | Date | |
| Ready To Lease Date | Date | |
| Jobs | Linked | → Jobs table (multiple) |
| Total Cost | Currency | |
| Time to Complete Unit | Number | Days |
| Notes | Long text | |
| Attachments | Attachment | Photos |
| Property Name | Lookup | From Properties |
| Unit Number | Lookup | From Properties |

#### Jobs
| Field | Type | Notes |
|-------|------|-------|
| Job ID | Autonumber | |
| Status | Text | NEEDS ATTENTION / Blocked / In Progress / Completed / Ready |
| Status Message | Text | Reason for status |
| Priority | Number | |
| Request Type | Text | "Job" or "Go Back" |
| Start Date, End Date | Date | Original dates |
| Start Date NEW, End Date NEW | Date | Revised dates |
| Vendor Name | Lookup | From Vendors |
| Vendor Type | Lookup | Paint / Flooring / Cleaning etc. |
| Price | Currency | |
| Counter Quote NEW | Currency | Vendor-proposed price |
| Duration (Days, If Completed) | Number | |
| Turn Requests | Linked | → Turn Requests |
| Property Name | Lookup | From Turn Requests → Properties |

#### Vendors
| Field | Type | Notes |
|-------|------|-------|
| Vendor Name | Text | |
| Type | Text | Paint / Flooring / Cleaning |
| Contact Name, Email, Phone | Text | |
| Num Jobs Completed | Rollup | Count |
| Average Completion Time | Rollup | Average |
| Jobs | Linked | → Jobs table |

#### Vendor_Pricing
| Field | Type | Notes |
|-------|------|-------|
| Property Name | Lookup | |
| Vendor Name | Lookup | |
| Service Type | Text | |
| Floor Plan | Text | |
| Price | Currency | Per floor plan |

#### Quotes
| Field | Type | Notes |
|-------|------|-------|
| ID | Autonumber | |
| Status | Text | "Ready" etc. |
| Start Date, End Date | Date | |
| Vendor | Linked | → Vendors |

#### Executives
| Field | Type | Notes |
|-------|------|-------|
| Name | Text | |
| Role | Text | RVP, COO, etc. |
| Email | Email | |

#### Property_Managers / Maintenance_Managers
| Field | Type | Notes |
|-------|------|-------|
| Name | Text | |
| Email | Email | |
| Phone | Phone | |
| Property Managed | Text | Property name |

### API Layer Files

| File | Purpose |
|------|---------|
| `src/lib/airtable/client.ts` | Airtable SDK initialization with API key + base ID |
| `src/lib/airtable/tables.ts` | Table name constants + field name mappings |
| `src/lib/airtable/types.ts` | TypeScript interfaces for all 9 table record types |
| `src/lib/airtable/cache.ts` | `unstable_cache` wrappers with tag-based revalidation (60s default) |
| `src/lib/airtable/rate-limiter.ts` | Token-bucket rate limiter (5 req/sec) |
| `src/lib/airtable/properties.ts` | `getProperties(propertyNames?)` |
| `src/lib/airtable/jobs.ts` | `getJobs(filter?)`, `getJobById(id)`, `updateJobStatus(id, status)` |
| `src/lib/airtable/turn-requests.ts` | `getTurnRequests(filter?)`, `addNote(id, note)` |
| `src/lib/airtable/vendors.ts` | `getVendors()` |
| `src/lib/airtable/quotes.ts` | `getQuotes(filter?)` |
| `src/lib/airtable/vendor-pricing.ts` | `getVendorPricing(filter?)` |
| `src/lib/airtable/aggregations.ts` | KPI computation functions |

### Caching Strategy

```
Reads:  unstable_cache(fetchFn, [cacheKey], { tags: ['airtable-jobs'], revalidate: 60 })
Writes: After mutation → revalidateTag('airtable-jobs')
```

- Each table gets its own cache tag (e.g., `airtable-jobs`, `airtable-turn-requests`)
- 60-second revalidation window — page loads hit cache, not Airtable
- Writes immediately bust the relevant tag
- Rate limiter queues requests when approaching 5/sec limit

### Property Scoping

Every query function accepts optional `propertyNames?: string[]`:
- **Executives:** Omit parameter → fetch all records
- **Property/Maintenance Managers:** Pass their `assigned_properties` from Supabase
- **District Managers:** Pass their multi-property `assigned_properties` array
- Uses Airtable `filterByFormula`:
  ```
  AND(OR({Property Name}="Park Point", {Property Name}="Oak Terrace"), {Status}="In Progress")
  ```

### KPI Aggregation Functions (`aggregations.ts`)

| Function | Description | Used By |
|----------|-------------|---------|
| `getActiveJobsOpen(properties?)` | Count jobs not Completed/Done | Executive, District |
| `getJobsTrendingPastTarget(properties?)` | Jobs within 2 days of end date | Executive |
| `getJobsCompletedLast30Days(properties?)` | Completed jobs, last 30 days | Executive, Property |
| `getBacklogDelta(properties?)` | Opened minus completed (30 days) | Executive |
| `getAvgTimeToComplete(properties?)` | Avg Duration field for completed jobs | Executive, Property |
| `getProjectedCostExposure(properties?)` | Sum of price for in-progress + completed MTD | Executive, Property |
| `getActiveMakeReadys(properties?)` | Turn requests with status "In progress" | All views |
| `getMakeReadysPastTargetTime(properties?)` | Turns exceeding time threshold | Executive, Property |
| `getMakeReadysTrendingPastTarget(properties?)` | Turns within 2 days of target date | Executive |
| `getMakeReadysCompletedLast7Days(properties?)` | Completed turns, last 7 days | Property |

---

## Phase 4: Executive View

**Route:** `/executive`
**Access:** `executive` role only
**Data:** All properties, no filter. Server Components with parallel data fetches.

### Page Layout (matching `AirtableReference/ExecutiveDashboard.png`)

```
┌─────────────────────────────────────────────────────┐
│ Row 1:                                              │
│ ┌──────────────────────┐ ┌────────────────────────┐ │
│ │ Active Jobs Open     │ │ Jobs Trending Past     │ │
│ │         17           │ │ Target: 1              │ │
│ │                      │ │ "2 days from           │ │
│ │                      │ │  completion date"      │ │
│ └──────────────────────┘ └────────────────────────┘ │
│                                                     │
│ Row 2:                                              │
│ ┌──────────────────────┐ ┌────────────────────────┐ │
│ │ Jobs Completed       │ │ Backlog Delta          │ │
│ │ (30 days): 2         │ │ -2                     │ │
│ │ "Data Starting from  │ │ "Jobs Opened - Jobs    │ │
│ │  the last 30 Days"   │ │  Completed (30 days)"  │ │
│ └──────────────────────┘ └────────────────────────┘ │
│                                                     │
│ Row 3:                                              │
│ ┌──────────────────────┐ ┌────────────────────────┐ │
│ │ Avg Time To Complete │ │ Projected Cost         │ │
│ │ a Job: 34            │ │ Exposure (MTD)         │ │
│ │ "From property req   │ │ $2,300.00              │ │
│ │  to vendor. Tgt 3-4" │ │                        │ │
│ └──────────────────────┘ └────────────────────────┘ │
│                                                     │
│ ── Make Ready Overview ──────────────────────────── │
│                                                     │
│ ┌──────────────────────┐                            │
│ │ Active Make Ready's  │                            │
│ │ Open: 5              │                            │
│ └──────────────────────┘                            │
│                                                     │
│ ┌──────────────────────┐ ┌────────────────────────┐ │
│ │ ░░ PINK BG ░░░░░░░░ │ │ ░░ YELLOW BG ░░░░░░░░ │ │
│ │ Make Ready's Past    │ │ Make Ready's Trending  │ │
│ │ Target Time: 0       │ │ Past Target Date: 1    │ │
│ │ NEEDS ATTENTION      │ │ "2 days from target"   │ │
│ └──────────────────────┘ └────────────────────────┘ │
└─────────────────────────────────────────────────────┘
```

### Files:
- `src/app/executive/layout.tsx` — Shell with sidebar "Dashboard" active
- `src/app/executive/page.tsx` — KPI grid with `Promise.all()` for parallel data fetches
- `src/app/executive/loading.tsx` — Skeleton loading state

---

## Phase 5: Property Manager + Maintenance Manager View

**Route:** `/property`
**Access:** `property_manager` + `maintenance_manager` roles
**Data:** Filtered by `user.assignedProperties`

### Pages

#### `/property` — Turn List + KPIs

**Turn Requests Table** (matching `AirtableReference/PropertyView.png`):
- Property Name filter dropdown (if user has multiple properties)
- Section: "Make Readys Past Target Time" — table of overdue turns
- Section: "Active Make Ready's (On Schedule)" — table of on-track turns
- Columns: Property Name (badge), Unit Number, Status (pill badge), Ready To Lease Date, Vacant Date, Jobs (linked ID badges), Price

**KPI Cards (3 across):**
- Number of Active Make Readys
- Make Readys Completed (last 30 days)
- Make Readys Completed (last 7 days)

**KPI Cards (2 + alert):**
- Average Make Ready Time
- Projected Spend (MTD)
- Number of Make Readys Past Target Time (pink alert card, "NEEDS ATTENTION")

#### `/property/turns/[requestId]` — Turn Detail

Shows all jobs linked to a turn request:
- Job table: Job ID, Vendor Name, Vendor Type, Status badge, Start/End dates, Price
- For "NEEDS ATTENTION" jobs: show Status Message + action buttons
- **Pricing approval:** Current price from Vendor_Pricing → Approve / Flag buttons
- **Notes:** Text area → saves to Turn Request Notes field in Airtable
- **Photos (optional):** File upload → Airtable attachment field

### Server Actions (`src/app/property/actions.ts`)

```typescript
'use server'

// Approve or flag vendor pricing for a job
async function approvePricing(jobId: string, approved: boolean, reason?: string)
  // Updates job status in Airtable
  // revalidateTag('airtable-jobs')

// Acknowledge a reminder/notification
async function acknowledgeReminder(jobId: string)
  // Updates acknowledgement field in Airtable
  // revalidateTag('airtable-jobs')

// Add a note to a turn request
async function addNote(turnRequestId: string, note: string)
  // Appends to Turn Request Notes field in Airtable
  // revalidateTag('airtable-turn-requests')
```

### Files:
| File | Purpose |
|------|---------|
| `src/app/property/layout.tsx` | Shell with sidebar navigation |
| `src/app/property/page.tsx` | Turn list + KPI summary |
| `src/app/property/loading.tsx` | Skeleton state |
| `src/app/property/turns/[requestId]/page.tsx` | Turn detail with jobs |
| `src/app/property/actions.ts` | Server actions for writes |
| `src/components/property/turn-list.tsx` | Table of turns (reusable) |
| `src/components/property/job-status-row.tsx` | Single job row in turn detail |
| `src/components/property/pricing-approval.tsx` | Approve/flag pricing UI |
| `src/components/property/notes-form.tsx` | Add notes form |

---

## Phase 6: District Manager View

**Route:** `/district`
**Access:** `district_manager` role
**Data:** Filtered by `user.assignedProperties` (multiple properties)

### Pages

#### `/district` — Portfolio Overview

**KPI Row:**
- Turn completion rate (gauge chart — semi-circular arc)
- Jobs pending approval (count)
- Overdue items (count, alert styling if > 0)

**Property Cards Grid:** One card per assigned property showing:
- Property Name
- Active turns count
- Completion rate (mini progress bar)
- Pending approvals count
- Click → drill-down to `/district/properties/[propertyName]`

**Weekly Summary** (in notification panel or expandable section):
- Turns completed this week
- New turns opened
- Spend this week
- Vendor performance highlights

#### `/district/properties/[propertyName]` — Property Drill-Down

Reuses components from Phase 5 (Property Manager view):
- Same turn list table and KPI cards
- Read-only for standard operations
- Can approve **escalated** pricing exceptions via `approveEscalatedPricing()` server action

### Files:
| File | Purpose |
|------|---------|
| `src/app/district/layout.tsx` | Shell with sidebar navigation |
| `src/app/district/page.tsx` | Portfolio overview with property cards |
| `src/app/district/loading.tsx` | Skeleton state |
| `src/app/district/properties/[propertyName]/page.tsx` | Drill-down (reuses property components) |
| `src/app/district/actions.ts` | `approveEscalatedPricing()` |
| `src/components/district/portfolio-overview.tsx` | Portfolio grid layout |
| `src/components/district/property-summary-card.tsx` | Individual property card with mini stats |

---

## Phase 7: Notifications + Charts + Polish

### 7A: Notification System (Middle Column)

Notifications are **derived from Airtable data**, not a separate table:

| Trigger | Notification Type | Visual |
|---------|-------------------|--------|
| Job status = "NEEDS ATTENTION" | Alert | Red icon + Status Message |
| Counter Quote NEW field populated | Pricing review | Dollar icon + vendor name + amount |
| Job end date within 2 days | Overdue warning | Clock icon + job details |
| Turn past target time | Alert | Warning icon + turn info |

Each notification item: `icon | description text | right-aligned timestamp or amount`
Clicking navigates to the relevant turn/job detail page.

**Files:**
- `src/lib/notifications.ts` — Logic to derive notifications from Airtable data
- `src/components/notifications/notification-list.tsx` — Scrollable list
- `src/components/notifications/notification-item.tsx` — Single item

### 7B: Charts

| Component | File | Description |
|-----------|------|-------------|
| VendorBarChart | `src/components/charts/vendor-bar-chart.tsx` | Recharts — rounded-top bars, green fill, diagonal hatch for non-highlighted |
| GaugeChart | `src/components/charts/gauge.tsx` | Semi-circular SVG arc, dark-to-light green gradient, centered number |

### 7C: Vendor Metrics Page (matching `AirtableReference/VendorMetrics.png`)

**Route:** `/executive/vendors` or sidebar nav item

Table showing:
- Vendor Name
- Num Jobs Completed
- Average Completion Time (Days)
- Num Jobs Assigned
- Jobs (linked ID badges)

### 7D: Responsive Polish

- Desktop (1280px+): Full three-column layout
- Tablet (768-1279px): Sidebar + main content, notification panel as drawer
- Mobile (<768px): Bottom tab bar, stacked cards, full-width tables

---

## Known Challenges & Mitigations

| Challenge | Mitigation |
|-----------|------------|
| **Property name mismatch** — PM table may store "Park Point Apartments" while Properties table stores "Park Point" | Normalize names in `user_profiles.assigned_properties`. Use `FIND()` in Airtable formulas for partial matching if needed. |
| **No District table in Airtable** | District = logical grouping via `assigned_properties` array in Supabase. A DM's array simply contains multiple property names. |
| **Airtable linked records** returned as record ID arrays | Batch-fetch linked records using `OR(RECORD_ID()='rec1', RECORD_ID()='rec2', ...)` to minimize API calls. |
| **Airtable pagination** (max 100 records/page) | SDK's `.eachPage()` handles automatically. |
| **Rate limits** (5 req/sec) | Token-bucket rate limiter + 60s cache. Multiple concurrent users won't exceed limits with caching in place. |
| **Cache staleness** after writes | Acceptable 60s window. `revalidateTag()` on the writing user's request provides immediate freshness for them. |

---

## File Tree Summary

```
src/
├── app/
│   ├── layout.tsx                          # Root layout (fonts, providers)
│   ├── page.tsx                            # Redirect to role dashboard
│   ├── globals.css                         # Tailwind + green bg texture
│   ├── login/
│   │   ├── page.tsx                        # Login form
│   │   └── actions.ts                      # signIn, signOut
│   ├── auth/callback/route.ts              # Auth callback
│   ├── executive/
│   │   ├── layout.tsx
│   │   ├── page.tsx                        # KPI dashboard
│   │   ├── loading.tsx
│   │   └── vendors/page.tsx                # Vendor metrics table
│   ├── property/
│   │   ├── layout.tsx
│   │   ├── page.tsx                        # Turn list + KPIs
│   │   ├── loading.tsx
│   │   ├── actions.ts                      # approvePricing, addNote
│   │   └── turns/[requestId]/page.tsx      # Turn detail
│   └── district/
│       ├── layout.tsx
│       ├── page.tsx                        # Portfolio overview
│       ├── loading.tsx
│       ├── actions.ts                      # approveEscalatedPricing
│       └── properties/[propertyName]/page.tsx  # Property drill-down
├── components/
│   ├── ui/
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── kpi-card.tsx
│   │   ├── badge.tsx
│   │   ├── table.tsx
│   │   ├── input.tsx
│   │   └── skeleton.tsx
│   ├── layout/
│   │   ├── sidebar.tsx
│   │   ├── notification-panel.tsx
│   │   ├── main-content.tsx
│   │   ├── shell.tsx
│   │   └── header.tsx
│   ├── shared/
│   │   ├── status-badge.tsx
│   │   ├── trend-indicator.tsx
│   │   ├── currency-display.tsx
│   │   ├── property-filter.tsx
│   │   └── date-display.tsx
│   ├── property/
│   │   ├── turn-list.tsx
│   │   ├── job-status-row.tsx
│   │   ├── pricing-approval.tsx
│   │   └── notes-form.tsx
│   ├── district/
│   │   ├── portfolio-overview.tsx
│   │   └── property-summary-card.tsx
│   ├── notifications/
│   │   ├── notification-list.tsx
│   │   └── notification-item.tsx
│   └── charts/
│       ├── vendor-bar-chart.tsx
│       └── gauge.tsx
├── lib/
│   ├── constants.ts                        # Design tokens
│   ├── supabase/
│   │   ├── client.ts                       # Browser client
│   │   └── server.ts                       # Server client
│   ├── airtable/
│   │   ├── client.ts                       # SDK init
│   │   ├── tables.ts                       # Table names + field maps
│   │   ├── types.ts                        # TypeScript interfaces
│   │   ├── cache.ts                        # Cache wrappers
│   │   ├── rate-limiter.ts                 # Token-bucket
│   │   ├── properties.ts
│   │   ├── jobs.ts
│   │   ├── turn-requests.ts
│   │   ├── vendors.ts
│   │   ├── quotes.ts
│   │   ├── vendor-pricing.ts
│   │   └── aggregations.ts                # KPI functions
│   └── notifications.ts                   # Derive notifications from data
├── types/
│   ├── index.ts
│   └── auth.ts                            # UserProfile, Role
└── middleware.ts                           # Auth + route protection
```

---

## Verification Plan

| Phase | How to Verify |
|-------|---------------|
| Phase 1 | `npm run dev` renders shell layout with correct THEME.md colors, fonts, and stripe texture. Components render correctly in isolation. |
| Phase 2 | Login with test credentials works. Unauthenticated users redirected to `/login`. After login, redirected to correct role dashboard. Wrong-role routes return 403/redirect. |
| Phase 3 | Create a test page that console-logs fetched Airtable data. Verify all 9 tables return correctly typed data. Confirm cache hits on page reload (no duplicate API calls in server logs). |
| Phase 4 | Executive dashboard shows live KPI numbers from Airtable matching the values visible in the Airtable interface. |
| Phase 5 | Property Manager sees ONLY their assigned properties. Turn list matches Airtable data. Approve pricing → verify the update appears in Airtable. Add note → verify note persists in Airtable. |
| Phase 6 | District Manager sees overview across multiple properties. Drill-down into individual property works. |
| Phase 7 | Notifications populate in the middle column. Charts render with correct data. Mobile layout collapses correctly. |
