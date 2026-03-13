# Phase 5: Property Manager View - Research

**Researched:** 2026-03-13
**Domain:** Next.js 15 / React 19 — PM dashboard with optimistic writes, property-scoped KPIs, and a two-level turn/job drill-down
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Turn List Layout**
- Two sections: "Make Readys Past Target Time" (overdue) displayed first, "Active Make Readys (On Schedule)" below
- Overdue section uses a pink header bar (matching alert-past KPICard variant) — strong visual alarm consistent with executive dashboard
- Overdue threshold: daysVacantUntilReady > 10 (same as executive alert cards)
- Overdue section hidden entirely when count is 0 — absence IS the good news (Phase 4 pattern)
- All PM-03 columns displayed: Property Name (badge), Unit Number, Status (pill), Ready To Lease Date, Vacant Date, Jobs (linked IDs count), Price
- Rows are clickable — navigate to turn detail page (Phase 1 pattern)
- On mobile: table transforms to stacked card list (Phase 1 pattern)

**Turn Detail Page**
- Route: /property/turn/[id] — separate page, bookmarkable, browser history works naturally
- Header section: turn summary (unit, property, dates, status, price)
- Explicit "← Back to turns" link at top of detail page
- Jobs displayed in a table below the header (reuses Table component)
- All PM-07 job columns: Job ID, Vendor Name, Vendor Type, Status badge (dropdown), Start Date, End Date, Price

**Inline Status Updates**
- Status badge in job table is a clickable dropdown showing all 5 valid statuses (NEEDS ATTENTION, Blocked, In Progress, Completed, Ready)
- Current status shown with checkmark in dropdown
- All status changes are instant — no confirmation dialog for any transition
- Optimistic UI: badge updates immediately, reverts on failure (Phase 3 decision)
- Subtle success toast: "Job #51 updated to Completed" — auto-dismisses in 3s, non-blocking
- Failure toast: "Failed to update status. Please try again." with optimistic revert (Phase 3 decision)
- Status updates available on BOTH the turn list page AND the turn detail page
- Turn list: status dropdown per row for quick updates without drilling in
- Detail page: same dropdown pattern in the job table

**PM KPI Cards**
- 6 KPI cards in 3x2 grid above the turn tables (same layout pattern as executive dashboard)
- Row 1: Active Make Readys | Make Readys Completed (30d) | Make Readys Completed (7d)
- Row 2: Average Make Ready Time | Projected Spend (MTD) | Make Readys Past Target Time
- "Make Readys Past Target Time" uses pink alert-past variant (when count > 0, regular white when 0)
- KPIs filter to selected property when PM uses property dropdown — everything on page reflects same scope

**Property Filter Dropdown**
- "All Properties" is the default selection (shows combined data across assigned properties)
- Individual properties listed below for drill-down
- Dropdown hidden when PM has only one assigned property
- Reuses PropertySelectorWrapper client component (built in Phase 2)
- When property selected: both KPIs and turn list filter to that property

### Claude's Discretion
- Exact KPI computation functions (analogous to computeExecutiveKPIs from Phase 4)
- Loading skeleton arrangement matching card grid + table layout
- Page header layout (title, user info, property dropdown, refresh button placement)
- Mobile responsive adjustments for KPI grid and turn detail
- Icon choices for each KPI card
- Trend indicator logic for PM KPIs
- How "Jobs" column displays in turn list (count badge vs comma-separated IDs)
- Status dropdown component implementation (Radix UI Select or custom)

### Deferred Ideas (OUT OF SCOPE)
None — discussion stayed within phase scope
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| PM-01 | Turn request list with "Make Readys Past Target Time" section displayed first (overdue-first) | `daysVacantUntilReady > 10` threshold confirmed in `executive-kpis.ts`; partition pattern trivial using `.filter()` on fetched TurnRequest array |
| PM-02 | Turn request list with "Active Make Readys (On Schedule)" section below | Same partition — non-overdue active TRs (status !== 'Done' AND daysVacantUntilReady <= 10 or null) |
| PM-03 | Turn list columns: Property Name (badge), Unit Number, Status (pill), Ready To Lease Date, Vacant Date, Jobs (linked IDs), Price | All fields exist on `TurnRequest` type; `jobs` array already resolved via `resolveLinkedJobs` |
| PM-04 | Property filter dropdown when PM has multiple assigned properties | `PropertySelectorWrapper` + `PropertySelector` already built; need "All Properties" sentinel value addition |
| PM-05 | KPI cards: Active Make Readys, Completed (30d), Completed (7d) | Pure compute function pattern proven by `computeExecutiveKPIs`; TR data provides all needed fields |
| PM-06 | KPI cards: Avg Make Ready Time, Projected Spend (MTD), Past Target Time (pink alert) | Same as PM-05; MTD Projected Spend scoped to current-month TRs; past target reuses daysVacantUntilReady > 10 |
| PM-07 | Turn detail page showing all linked jobs with Job ID, Vendor Name, Vendor Type, Status badge, Start/End dates, Price | `fetchTurnRequestById(id)` already resolves jobs; `Job` type has all required fields |
| PM-08 | Inline job status update from turn detail without navigating away | `updateJobStatus` server action already complete; needs client wrapper with optimistic UI + Sonner toast |
| PM-09 | Loading skeleton states matching card and table layouts | `KPICard loading={true}` + `Skeleton` primitives already proven in Phase 4 |
</phase_requirements>

---

## Summary

Phase 5 is primarily an assembly phase. All lower-level infrastructure — data fetching, caching, write actions, property scoping, UI primitives, and the optimistic-update pattern — was built and battle-tested in Phases 1-4. The primary work is: (1) creating a `computePMKPIs` pure function analogous to `computeExecutiveKPIs`, (2) building two new pages (`/property` full replacement and `/property/turn/[id]`), and (3) creating client components for inline status updates with optimistic UI and Sonner toasts.

The single genuinely novel element in this phase is the **status dropdown** in the job table — a client component that holds local optimistic state, calls the existing `updateJobStatus` server action, and shows a toast on both success and failure. Everything else is composition of established patterns. The `PropertySelectorWrapper` must be extended to lift state up to the page level so both the KPI section and the turn table filter to the same property. This requires converting the current self-contained wrapper into a prop-driven pattern or using URL search params.

The key architectural decision is **how property selection propagates to both KPIs and the turn list**. Since both are in separate Suspense children on the same page, the simplest approach is a single `"use client"` container that holds `selectedProperty` state and passes it as a prop to both child components — the same bridge pattern used for `PropertySelectorWrapper` in Phase 2.

**Primary recommendation:** Build `computePMKPIs` as a pure function in `src/lib/kpis/pm-kpis.ts` (unit-testable, no I/O), create a `PMDashboard` client container component that owns property selection state and renders both KPI section and turn tables, then build the turn detail page as a server component with a `JobStatusDropdown` client leaf.

---

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Next.js App Router | 15.x (installed) | Page routing, server components, Suspense | Project standard |
| React | 19.x (installed) | UI, hooks, optimistic state | Project standard |
| `use cache` + `cacheLife` + `cacheTag` | Next.js 15 built-in | Server-side caching with tag invalidation | Phase 3 established pattern |
| Sonner | installed | Toast notifications | Already wired into root layout |
| Lucide React | installed | Icons for KPI cards | Phase 4 established pattern |
| Vitest + jsdom | installed | Unit tests for pure functions | Project test framework |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `useOptimistic` (React 19) | built-in | Optimistic status updates | Status dropdown client component |
| `useTransition` (React 19) | built-in | Wraps server action calls | Used with `useOptimistic` |
| Native `<select>` | HTML | Status dropdown | Per Claude's Discretion — simpler than Radix, proven in PropertySelector |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Native `<select>` for status dropdown | Radix UI Select | Radix adds animation and custom styling but 0 additional dependencies; native `<select>` matches PropertySelector precedent |
| Client container for property state | URL search params (?property=X) | URL params make filter bookmarkable but add router complexity; client state is simpler and sufficient for daily-check workflow |

**Installation:** No new packages required. All dependencies already installed.

---

## Architecture Patterns

### Recommended Project Structure
```
src/app/(dashboard)/property/
├── page.tsx                       # Server: auth + user data → renders PMDashboard client container
├── _components/
│   ├── pm-dashboard.tsx           # "use client" — owns selectedProperty state
│   ├── pm-kpis.tsx                # Async server component — accepts turnRequests[], computes KPIs
│   ├── pm-kpi-skeleton.tsx        # Skeleton for Suspense fallback
│   ├── pm-turn-list.tsx           # Renders overdue + on-schedule sections
│   ├── pm-turn-list-skeleton.tsx  # Skeleton for turn list Suspense fallback
│   └── job-status-dropdown.tsx    # "use client" — optimistic status dropdown
├── turn/
│   └── [id]/
│       └── page.tsx               # Server: fetch by id → TurnDetailView
│       └── _components/
│           └── turn-detail-view.tsx  # Renders header + jobs table

src/lib/kpis/
├── pm-kpis.ts                     # Pure compute function (no I/O)
└── pm-kpis.test.ts                # Unit tests
```

### Pattern 1: PM Dashboard Client Container
**What:** A `"use client"` component owns `selectedProperty` state. It renders the property selector, passes `selectedProperty` as a prop to a Suspense-wrapped server component fetcher, and passes it to the turn list.

**When to use:** When multiple server-rendered sections must react to the same client-side filter.

**The challenge:** Server components cannot re-fetch on client state changes. The solution is to key the Suspense wrapper on `selectedProperty` — React will remount the subtree when the key changes, triggering a fresh server render.

```typescript
// src/app/(dashboard)/property/_components/pm-dashboard.tsx
"use client";

import { useState, Suspense } from "react";
import { PropertySelector } from "@/components/layout/property-selector";
import { PMKPIs } from "./pm-kpis";
import { PMKPISkeleton } from "./pm-kpi-skeleton";
import { PMTurnList } from "./pm-turn-list";
import { PMTurnListSkeleton } from "./pm-turn-list-skeleton";

interface PMDashboardProps {
  assignedProperties: string[];
  role: string;
  displayName: string;
}

export function PMDashboard({ assignedProperties, role, displayName }: PMDashboardProps) {
  // "All Properties" sentinel; empty string means show all assigned
  const [selectedProperty, setSelectedProperty] = useState<string>("");

  const effectiveProperties =
    selectedProperty === "" ? assignedProperties : [selectedProperty];

  const selectorOptions = ["All Properties", ...assignedProperties];

  return (
    <div className="flex flex-col gap-4">
      {/* Page header with property selector */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading font-bold text-xl text-white">
            Property Manager Dashboard
          </h1>
          <p className="text-white/70 text-sm mt-0.5">{displayName}</p>
        </div>
        {assignedProperties.length > 1 && (
          <PropertySelector
            properties={selectorOptions}
            selectedProperty={selectedProperty === "" ? "All Properties" : selectedProperty}
            onSelect={(v) => setSelectedProperty(v === "All Properties" ? "" : v)}
          />
        )}
      </div>

      {/* KPIs — re-mount on property change via key */}
      <Suspense key={selectedProperty} fallback={<PMKPISkeleton />}>
        <PMKPIs assignedProperties={effectiveProperties} />
      </Suspense>

      {/* Turn list — re-mount on property change via key */}
      <Suspense key={`turns-${selectedProperty}`} fallback={<PMTurnListSkeleton />}>
        <PMTurnList assignedProperties={effectiveProperties} role={role} />
      </Suspense>
    </div>
  );
}
```

### Pattern 2: PM KPIs Server Component
**What:** Async server component — fetches data, computes KPIs, renders cards. Analogous to `ExecutiveKPIs`.

```typescript
// src/app/(dashboard)/property/_components/pm-kpis.tsx
import { fetchTurnRequestsForUser } from "@/lib/airtable/tables/turn-requests";
import { computePMKPIs } from "@/lib/kpis/pm-kpis";
import { KPICard } from "@/components/ui/kpi-card";
import { Home, CheckCircle, Clock, DollarSign, AlertTriangle, Activity } from "lucide-react";

interface PMKPIsProps {
  assignedProperties: string[];
}

export async function PMKPIs({ assignedProperties }: PMKPIsProps) {
  // fetchTurnRequestsForUser handles property scoping internally
  const turnRequests = await fetchTurnRequestsForUser("pm", assignedProperties);
  const kpis = computePMKPIs(turnRequests);

  const avgTimeDisplay = kpis.avgMakeReadyTime !== null
    ? `${Math.round(kpis.avgMakeReadyTime)} days`
    : "N/A";

  const spendDisplay = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(kpis.projectedSpendMTD);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      <KPICard icon={Home} label="Active Make Readys" value={kpis.activeMakeReadys} />
      <KPICard icon={CheckCircle} label="Completed (30d)" value={kpis.completedLast30d} />
      <KPICard icon={Activity} label="Completed (7d)" value={kpis.completedLast7d} />
      <KPICard icon={Clock} label="Avg Make Ready Time" value={avgTimeDisplay} />
      <KPICard icon={DollarSign} label="Projected Spend (MTD)" value={spendDisplay} />
      <KPICard
        icon={AlertTriangle}
        label="Past Target Time"
        value={kpis.pastTargetCount}
        variant={kpis.pastTargetCount > 0 ? "alert-past" : "default"}
      />
    </div>
  );
}
```

### Pattern 3: computePMKPIs Pure Function
**What:** Pure function — takes `TurnRequest[]`, returns typed KPI result. Follows `computeExecutiveKPIs` structure exactly.

```typescript
// src/lib/kpis/pm-kpis.ts
import type { TurnRequest } from "@/lib/types/airtable";

export interface PMKPIResult {
  activeMakeReadys: number;
  completedLast30d: number;
  completedLast7d: number;
  avgMakeReadyTime: number | null;
  projectedSpendMTD: number;
  pastTargetCount: number;
}

function parseCurrency(value: string | null | undefined): number {
  if (!value) return 0;
  return parseFloat(value.replace(/[^0-9.-]/g, "")) || 0;
}

export function computePMKPIs(turnRequests: TurnRequest[]): PMKPIResult {
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const activeMakeReadys = turnRequests.filter((tr) => tr.status !== "Done").length;

  const completedLast30d = turnRequests.filter((tr) => {
    if (tr.status !== "Done") return false;
    if (!tr.readyToLeaseDate) return false;
    return new Date(tr.readyToLeaseDate) >= thirtyDaysAgo;
  }).length;

  const completedLast7d = turnRequests.filter((tr) => {
    if (tr.status !== "Done") return false;
    if (!tr.readyToLeaseDate) return false;
    return new Date(tr.readyToLeaseDate) >= sevenDaysAgo;
  }).length;

  const doneTRs = turnRequests.filter((tr) => tr.status === "Done");
  const avgMakeReadyTime =
    doneTRs.length === 0
      ? null
      : doneTRs.reduce((sum, tr) => sum + (tr.timeToCompleteUnit ?? 0), 0) / doneTRs.length;

  // MTD: TRs created this calendar month (totalCost fallback quotePrice — Phase 4 decision)
  const projectedSpendMTD = turnRequests
    .filter((tr) => new Date(tr.created) >= startOfMonth)
    .reduce((sum, tr) => {
      const price = tr.totalCost != null
        ? parseCurrency(tr.totalCost)
        : parseCurrency(tr.quotePrice);
      return sum + price;
    }, 0);

  const pastTargetCount = turnRequests.filter(
    (tr) => (tr.daysVacantUntilReady ?? 0) > 10
  ).length;

  return {
    activeMakeReadys,
    completedLast30d,
    completedLast7d,
    avgMakeReadyTime,
    projectedSpendMTD,
    pastTargetCount,
  };
}
```

### Pattern 4: Turn List with Overdue Partition
**What:** Server component — fetches and partitions TRs into overdue (> 10 days) and on-schedule, renders two table sections.

```typescript
// src/app/(dashboard)/property/_components/pm-turn-list.tsx
import { fetchTurnRequestsForUser } from "@/lib/airtable/tables/turn-requests";
import type { TurnRequest, UserRole } from "@/lib/types/airtable";
// ...imports

interface PMTurnListProps {
  assignedProperties: string[];
  role: string;
}

export async function PMTurnList({ assignedProperties, role }: PMTurnListProps) {
  const turnRequests = await fetchTurnRequestsForUser(role as UserRole, assignedProperties);

  // Active = not Done; partition by overdue threshold
  const active = turnRequests.filter((tr) => tr.status !== "Done");
  const overdue = active.filter((tr) => (tr.daysVacantUntilReady ?? 0) > 10);
  const onSchedule = active.filter((tr) => (tr.daysVacantUntilReady ?? 0) <= 10);

  return (
    <div className="flex flex-col gap-4">
      {/* Overdue section — hidden when empty (Phase 4 pattern) */}
      {overdue.length > 0 && (
        <TurnTable
          title="Make Readys Past Target Time"
          turns={overdue}
          headerVariant="alert-past"  // pink header
        />
      )}
      <TurnTable
        title="Active Make Readys (On Schedule)"
        turns={onSchedule}
        headerVariant="default"
      />
    </div>
  );
}
```

### Pattern 5: JobStatusDropdown Client Component
**What:** Client leaf component using `useOptimistic` for instant visual feedback and Sonner for toast feedback. Must receive `turnRequestId` to pass to `updateJobStatus`.

```typescript
// src/app/(dashboard)/property/_components/job-status-dropdown.tsx
"use client";

import { useOptimistic, useTransition } from "react";
import { toast } from "sonner";
import { updateJobStatus } from "@/app/actions/job-status";
import { StatusBadge } from "@/components/ui/status-badge";
import type { JobStatus } from "@/lib/types/airtable";

const ALL_STATUSES: JobStatus[] = [
  "NEEDS ATTENTION", "Blocked", "In Progress", "Completed", "Ready"
];

interface JobStatusDropdownProps {
  jobId: number;
  turnRequestId: number;
  currentStatus: JobStatus;
}

export function JobStatusDropdown({
  jobId,
  turnRequestId,
  currentStatus,
}: JobStatusDropdownProps) {
  const [optimisticStatus, setOptimisticStatus] = useOptimistic(currentStatus);
  const [isPending, startTransition] = useTransition();

  function handleChange(newStatus: string) {
    const prev = optimisticStatus;
    startTransition(async () => {
      setOptimisticStatus(newStatus as JobStatus);
      const result = await updateJobStatus(jobId, turnRequestId, newStatus);
      if (result.success) {
        toast.success(`Job #${jobId} updated to ${newStatus}`, { duration: 3000 });
      } else {
        setOptimisticStatus(prev); // revert
        toast.error("Failed to update status. Please try again.");
      }
    });
  }

  return (
    <select
      value={optimisticStatus}
      onChange={(e) => handleChange(e.target.value)}
      disabled={isPending}
      className="text-xs border border-card-border rounded-pill px-2 py-1 bg-card focus:outline-none focus:ring-2 focus:ring-emerald/30"
    >
      {ALL_STATUSES.map((s) => (
        <option key={s} value={s}>
          {optimisticStatus === s ? `✓ ${s}` : s}
        </option>
      ))}
    </select>
  );
}
```

### Pattern 6: Turn Detail Page
**What:** Server component with `params.id` — fetches one TR with resolved jobs, renders header + job table.

```typescript
// src/app/(dashboard)/property/turn/[id]/page.tsx
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { fetchTurnRequestById } from "@/lib/airtable/tables/turn-requests";

interface TurnDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function TurnDetailPage({ params }: TurnDetailPageProps) {
  const { id } = await params; // Next.js 15: params is a Promise
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const requestId = parseInt(id, 10);
  if (isNaN(requestId)) notFound();

  const turn = await fetchTurnRequestById(requestId);
  if (!turn) notFound();

  return <TurnDetailView turn={turn} />;
}
```

### Anti-Patterns to Avoid
- **Fetching turn requests twice (once for KPIs, once for turn list):** Both server components call `fetchTurnRequestsForUser` — this is fine because the result is cached with `use cache`. The same cached result is returned from both calls. Do not attempt to pass turn request data down as props through the client container — that defeats the Suspense streaming benefit.
- **Making PMDashboard async:** `PMDashboard` is `"use client"` and must remain synchronous. Auth and user data are resolved in `page.tsx` (server) and passed as props.
- **Trying to use router.refresh() for optimistic revert:** The `useOptimistic` hook handles the revert natively. Do not call `router.refresh()` in the failure path — it will cause a jarring full-page re-render instead of a targeted revert.
- **Passing a server action directly to a server component:** `JobStatusDropdown` must be `"use client"` — optimistic hooks only work in client components. Import the server action inside the client component (Next.js will wire the RPC automatically).
- **Reading params as synchronous in Next.js 15:** `params` in dynamic route pages is a `Promise` in Next.js 15. Always `await params` before destructuring.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Optimistic status updates | Manual useState + setTimeout revert | `useOptimistic` + `useTransition` (React 19) | Handles revert, pending state, and concurrent rendering correctly |
| Toast notifications | Custom toast component | `sonner` (already wired) | Already in root layout; `toast.success()` / `toast.error()` API is one-liner |
| Currency formatting | Custom formatter | `Intl.NumberFormat` (inline) | Phase 4 decision — CurrencyDisplay renders span not string; pre-format inline |
| Property filtering | Custom filter logic | `filterByProperties()` from `normalize-property-name.ts` | Handles case/whitespace normalization between Airtable and Supabase |
| Cache invalidation on write | Manual page reload | `revalidateTag` in `updateJobStatus` action | Already implemented — 5 cache tags busted on every successful write |
| Status validation | String comparison | `JOB_STATUSES` const from `airtable.ts` | Server action already validates against this; client dropdown should source options from same constant |

**Key insight:** The write path (`updateJobStatus`) is 100% implemented. The only new code is the client wrapper that calls it optimistically.

---

## Common Pitfalls

### Pitfall 1: PropertySelector "All Properties" Sentinel
**What goes wrong:** `PropertySelectorWrapper` was built for Phase 2 where the first property was the default selection. It does not have an "All Properties" option. If used as-is, PM can never see combined data.
**Why it happens:** Phase 2 only needed single-property selection for the header; the PM view needs a multi-property aggregate view as default.
**How to avoid:** Use `PropertySelector` directly (not `PropertySelectorWrapper`) in `PMDashboard`. Pass `["All Properties", ...assignedProperties]` as the options array. Map "All Properties" to `""` sentinel for state; map `""` back to the full `assignedProperties` array when fetching.
**Warning signs:** If PM dashboard always shows one property's data instead of combined data on first load.

### Pitfall 2: Suspense Key Pattern for Property Filtering
**What goes wrong:** Without keying Suspense boundaries on `selectedProperty`, switching the property dropdown does not trigger a re-fetch. The server component only runs once on initial render.
**Why it happens:** Server components inside Suspense are not reactive to client state changes — React must know to remount the subtree.
**How to avoid:** `<Suspense key={selectedProperty} fallback={...}>` forces remount when the key changes. Use distinct keys for KPI and turn list Suspense boundaries.
**Warning signs:** Property dropdown updates the selector UI but KPIs/table don't change.

### Pitfall 3: Next.js 15 params is a Promise
**What goes wrong:** Writing `params.id` directly in the turn detail page throws a runtime error.
**Why it happens:** Next.js 15 made dynamic route `params` asynchronous.
**How to avoid:** `const { id } = await params;` — always await before destructuring.
**Warning signs:** TypeScript will show `params` as `Promise<{ id: string }>` in the function signature.

### Pitfall 4: useOptimistic Must Be Inside useTransition
**What goes wrong:** Calling `setOptimisticStatus` outside of `startTransition` causes a React warning and the optimistic state does not behave correctly.
**Why it happens:** `useOptimistic` is designed to work with React's concurrent transitions — updates outside transitions are treated as permanent.
**How to avoid:** Always wrap both `setOptimisticStatus` and the `await updateJobStatus` call inside `startTransition(async () => { ... })`.
**Warning signs:** React console warning "An optimistic state update occurred outside a transition."

### Pitfall 5: Status Dropdown on Turn List Needs stopPropagation
**What goes wrong:** The turn list rows are clickable (navigate to detail page). If the status dropdown is inside a clickable row, changing the status also triggers row navigation.
**Why it happens:** Click events bubble from the dropdown up to the `<tr>` row's `onClick`.
**How to avoid:** In the table cell containing `JobStatusDropdown`, add `onClick={(e) => e.stopPropagation()}` to prevent row navigation when the dropdown is interacted with.
**Warning signs:** Changing a job status on the turn list unexpectedly navigates to the turn detail page.

### Pitfall 6: MTD Spend Uses `created` Not `readyToLeaseDate`
**What goes wrong:** Using `readyToLeaseDate` for MTD spend calculation excludes TRs that haven't completed yet (null `readyToLeaseDate`), producing an undercount.
**Why it happens:** "Projected Spend MTD" should include all turns opened this month, not just completed ones.
**How to avoid:** Filter by `tr.created >= startOfMonth` for projected spend. The word "projected" implies future costs are included.
**Warning signs:** Projected Spend shows $0 for most of the month until turns complete.

---

## Code Examples

Verified patterns from existing codebase:

### fetchTurnRequestsForUser (existing, Phase 3)
```typescript
// Source: src/lib/airtable/tables/turn-requests.ts
export async function fetchTurnRequestsForUser(
  role: UserRole,
  assignedPropertyNames: string[]
): Promise<TurnRequest[]> {
  'use cache'
  cacheLife('airtableData')
  cacheTag(CACHE_TAGS.turnRequests)

  const all = await fetchTurnRequests()
  if (role === 'exec') return all
  return filterByProperties(all, (tr) => tr.propertyName, assignedPropertyNames)
}
```

### updateJobStatus server action (existing, Phase 3)
```typescript
// Source: src/app/actions/job-status.ts
export async function updateJobStatus(
  jobId: number,
  turnRequestId: number,
  status: string
): Promise<{ success: boolean; error?: string }>
// Returns structured result — never throws. Safe to await in client.
// Busts 5 cache tags: job(id), jobs, turnRequest(id), turnRequests, kpis
```

### Sonner toast usage (existing pattern)
```typescript
// Source: Phase 3 patterns (Sonner already in layout)
import { toast } from "sonner";
toast.success("Job #51 updated to Completed", { duration: 3000 });
toast.error("Failed to update status. Please try again.");
```

### JOB_STATUSES constant (existing)
```typescript
// Source: src/lib/types/airtable.ts
export const JOB_STATUSES = {
  'NEEDS ATTENTION': 'NEEDS ATTENTION',
  'Blocked': 'Blocked',
  'In Progress': 'In Progress',
  'Completed': 'Completed',
  'Ready': 'Ready',
} as const
export type JobStatus = keyof typeof JOB_STATUSES
```

### KPICard variants (existing)
```typescript
// Source: src/components/ui/kpi-card.tsx
// variant="alert-past" → bg-alert-past-target (pink)
// variant="default"    → bg-card (white)
// loading={true}       → renders skeleton internally
<KPICard icon={AlertTriangle} label="Past Target Time" value={3} variant="alert-past" />
```

### TableRow with clickable rows (existing)
```typescript
// Source: src/components/ui/table.tsx
// onRowClick prop adds cursor-pointer and wires onClick
<TableRow onRowClick={() => router.push(`/property/turn/${turn.requestId}`)}>
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `useState` + manual revert for optimistic UI | `useOptimistic` + `useTransition` | React 19 (current) | Correct concurrent behavior, automatic revert semantics |
| `router.refresh()` after writes | `revalidateTag` in server action | Next.js 15 + Phase 3 | Surgical cache invalidation, no full-page re-render |
| `unstable_cache` | `use cache` + `cacheLife` + `cacheTag` | Next.js 15 (Phase 3) | Stable API, production-ready |
| Synchronous `params` in dynamic routes | `await params` (Promise) | Next.js 15 | Required — breaks at runtime if not awaited |

**Deprecated/outdated:**
- `unstable_cache`: Not used in this project — use `use cache` directive instead (Phase 3 decision)
- `router.refresh()` for write invalidation: Not used — `revalidateTag` in server action handles this

---

## Open Questions

1. **MTD date boundary for "Projected Spend (MTD)"**
   - What we know: "Projected Spend MTD" implies current calendar month; `tr.created` is available on all TRs
   - What's unclear: Whether to use `tr.created` (turn opened this month) or `tr.vacantDate` (unit went vacant this month) — the former gives a broader count
   - Recommendation: Use `tr.created >= startOfMonth` — most intuitive for "spend committed this month"

2. **Status dropdown location on turn list rows**
   - What we know: CONTEXT.md locks "status updates available on BOTH turn list page AND turn detail page" and "status dropdown per row for quick updates without drilling in"
   - What's unclear: Which job's status to show/edit per turn row — a turn has multiple jobs (1:N)
   - Recommendation: Show job count in the "Jobs" column (e.g., "3 jobs") as a read-only count badge; do NOT show per-job status dropdowns on the turn list rows since a turn can have multiple jobs. The "status dropdown per row" likely refers to the turn's own status, not individual job statuses. Confirm with user if ambiguous — but given PM-08 says "from turn detail", the list-level dropdown may be the turn status, not job status.

3. **`fetchTurnRequestById` uses numeric ID but URL param is string**
   - What we know: `fetchTurnRequestById(id: number)` exists; Next.js params are strings
   - What's unclear: Whether `requestId` in Airtable is reliably unique and numeric
   - Recommendation: `parseInt(id, 10)` + `isNaN` guard + `notFound()` — already documented in patterns above; low risk

---

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest + jsdom (vitest.config.ts, installed) |
| Config file | `vitest.config.ts` at project root |
| Quick run command | `npx vitest run src/lib/kpis/pm-kpis.test.ts` |
| Full suite command | `npx vitest run` |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| PM-01 | Overdue section (daysVacantUntilReady > 10) shown first | unit | `npx vitest run src/lib/kpis/pm-kpis.test.ts` | ❌ Wave 0 |
| PM-02 | On-schedule section below | unit | `npx vitest run src/lib/kpis/pm-kpis.test.ts` | ❌ Wave 0 |
| PM-03 | All columns present in TurnRequest type | unit (type check) | `npx tsc --noEmit` | ✅ (type system) |
| PM-04 | Property filter hides when 1 property | unit | `npx vitest run src/components/layout/__tests__/layout.test.tsx` | ✅ (existing) |
| PM-05 | activeMakeReadys, completedLast30d, completedLast7d correct | unit | `npx vitest run src/lib/kpis/pm-kpis.test.ts` | ❌ Wave 0 |
| PM-06 | avgMakeReadyTime, projectedSpendMTD, pastTargetCount correct | unit | `npx vitest run src/lib/kpis/pm-kpis.test.ts` | ❌ Wave 0 |
| PM-07 | fetchTurnRequestById resolves jobs | unit | `npx vitest run src/lib/airtable/__tests__/mappers.test.ts` | ✅ (existing) |
| PM-08 | updateJobStatus optimistic revert on failure | unit | `npx vitest run src/app/actions/__tests__/job-status.test.ts` | ✅ (existing) |
| PM-09 | Skeleton renders without errors | unit | `npx vitest run src/components/ui/__tests__/components.test.tsx` | ✅ (existing) |

### Sampling Rate
- **Per task commit:** `npx vitest run src/lib/kpis/pm-kpis.test.ts`
- **Per wave merge:** `npx vitest run`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `src/lib/kpis/pm-kpis.test.ts` — covers PM-01, PM-02, PM-05, PM-06 (computePMKPIs pure function)

*(All other test infrastructure from Phases 1-4 is in place and covers the remaining requirements)*

---

## Sources

### Primary (HIGH confidence)
- Direct codebase read: `src/lib/kpis/executive-kpis.ts` — KPI compute pattern to replicate
- Direct codebase read: `src/app/actions/job-status.ts` — existing write action, complete
- Direct codebase read: `src/lib/airtable/tables/turn-requests.ts` — fetch functions with caching
- Direct codebase read: `src/lib/types/airtable.ts` — TurnRequest + Job types, JOB_STATUSES
- Direct codebase read: `src/components/ui/kpi-card.tsx` — KPICard variants confirmed
- Direct codebase read: `src/components/ui/table.tsx` — Table compound component, onRowClick
- Direct codebase read: `src/components/ui/status-badge.tsx` — Status-to-style mapping
- Direct codebase read: `src/components/layout/property-selector.tsx` — existing PropertySelector API
- Direct codebase read: `src/app/(dashboard)/executive/_components/executive-kpis.tsx` — Phase 4 pattern to replicate

### Secondary (MEDIUM confidence)
- React 19 `useOptimistic` + `useTransition` pattern: documented in React 19 release; consistent with Phase 3 decisions recorded in STATE.md
- Next.js 15 `await params` requirement: documented in Next.js 15 upgrade guide; consistent with installed version

### Tertiary (LOW confidence)
- None — all critical claims verified directly from codebase

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all libraries directly verified in package.json and existing code
- Architecture: HIGH — patterns are direct extensions of Phase 4 code in the repo
- Pitfalls: HIGH — identified from actual code constraints (params Promise, event bubbling, selector sentinel)
- KPI computations: HIGH — computePMKPIs modeled directly on verified computeExecutiveKPIs

**Research date:** 2026-03-13
**Valid until:** 2026-04-13 (stable stack; Next.js 15 and React 19 APIs are settled)
