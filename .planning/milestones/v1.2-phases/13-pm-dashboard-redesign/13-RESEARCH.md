# Phase 13: PM Dashboard Redesign - Research

**Researched:** 2026-03-18
**Domain:** Next.js 15 / React 19 — PM dashboard KPI redesign, inline lease-ready date entry, inline turn closure, sortable Active Jobs table, Revenue Exposure KPI
**Confidence:** HIGH

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| PMDB-01 | PM dashboard displays 6 KPI boxes (active turns, avg turn time, revenue exposure, completed this period, jobs in progress, turns near deadline) | `PMKPIResult` interface exists in `pm-kpis.ts`; requires 4 new fields replacing old fields; `computePMKPIs` must be extended; `PMKPIs` server component renders the grid |
| PMDB-02 | PM can view Open Turns list with turn age and status visible | `PMTurnList` exists; needs `daysOffMarketUntilReady` displayed as "age" column; `TurnSection` renders table — column additions straightforward |
| PMDB-03 | PM can enter a lease-ready date inline on each Open Turn row (blur-triggered server action with optimistic UI) | No `updateLeaseReadyDate` server action exists yet; `readyToLeaseDate` field on `TurnRequest` is available; pattern follows existing `updateTurnRequestStatus` server action |
| PMDB-04 | PM can mark a turn as "Done" via inline button on the Open Turns list | `TurnStatusDropdown` already implements Done/In-progress toggle with optimistic UI; need a dedicated "Done" button variant that calls `updateTurnRequestStatus` directly without dropdown UI |
| PMDB-05 | PM can view Active Jobs table showing all in-flight jobs across their turns (sortable by vendor, status, days open) | Jobs are resolved and available on `TurnRequest.jobs`; a dedicated Active Jobs table component is needed; `Job` type has `vendorName`, `status`, `durationDays`; client-side sort state needed |
| PMDB-06 | Revenue Exposure KPI displays dollar amount ($60/day × days over target) with count of excluded turns (no target date set) | `TurnRequest.targetDate` exists in type and mapper; `TurnRequest.daysOffMarketUntilReady` available; formula: sum of `(daysOffMarketUntilReady - targetDays) * 60` for active turns with `targetDate` set; exclusion count = active turns without `targetDate` |
</phase_requirements>

---

## Summary

Phase 13 is a focused redesign of the PM dashboard — not a greenfield build. All infrastructure (server actions, data layer, caching, UI primitives, optimistic patterns) was built in Phases 3–12. The primary work is: (1) replacing 4 of 6 KPI boxes with new metrics and extending `computePMKPIs`, (2) adding a "turn age" column to the Open Turns list, (3) adding an inline lease-ready date `<input>` to each Open Turn row with a new server action, (4) adding a dedicated "Done" button on each Open Turn row using the existing `updateTurnRequestStatus` action, (5) building a new sortable Active Jobs table that aggregates jobs across all the PM's turns, and (6) implementing the Revenue Exposure KPI formula.

The two genuinely new pieces are: the `updateLeaseReadyDate` server action (analogous to `updateTurnRequestStatus`, writing to the Airtable `Ready To Lease Date` field), and the `ActiveJobsTable` client component with sort state. Everything else is either an extension of existing patterns or a new pure function in `pm-kpis.ts`.

The key unresolved product question from STATE.md is the "Turn closing contract" — whether clicking "Done" closes the turn by itself or only lease-ready date entry triggers closure. The requirements (PMDB-03 and PMDB-04 are separate requirements) indicate they are independent operations. This research treats them as independent: the "Done" button calls `updateTurnRequestStatus(requestId, 'Done')` directly; entering a lease-ready date calls a separate `updateLeaseReadyDate` action and does not automatically set status to Done.

**Primary recommendation:** Extend `computePMKPIs` with 4 new KPI fields, add a `computeRevenueExposure` helper, build `updateLeaseReadyDate` server action, create `LeaseReadyDateInput` client component, create `DoneButton` client component, build `ActiveJobsTable` client component with sort state, and update `pm-kpis.test.ts` for the new fields.

---

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Next.js App Router | 15.x (installed) | Page routing, server components, Suspense | Project standard |
| React | 19.x (installed) | UI, hooks, optimistic state | Project standard |
| `use cache` + `cacheLife` + `cacheTag` | Next.js 15 built-in | Server-side caching with tag invalidation | Phase 3 established pattern |
| Sonner | installed | Toast notifications | Already wired into root layout |
| Lucide React | installed | Icons for KPI cards | Phase 4/5 established pattern |
| Vitest + jsdom | installed | Unit tests for pure functions | Project test framework |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `useOptimistic` (React 19) | built-in | Optimistic date/status updates | `LeaseReadyDateInput`, `DoneButton` |
| `useTransition` (React 19) | built-in | Wraps server action calls | Used with `useOptimistic` |
| `useState` (React 19) | built-in | Sort column/direction state | `ActiveJobsTable` |
| Native `<input type="date">` | HTML | Lease-ready date inline entry | Consistent with existing form patterns in this project |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Native `<input type="date">` | Date picker library (e.g., react-day-picker) | No additional dependency, sufficient for single date entry on a row |
| Client-side sort | Server-side sort via URL params | Client-side sort requires no round trip, data is already fetched; adequate for PM's scoped dataset (not portfolio-wide) |
| Dedicated "Done" button | Extending `TurnStatusDropdown` | A button is simpler UI for a single irreversible action; dropdown already exists for other status changes |

**Installation:** No new packages required. All dependencies already installed.

---

## Architecture Patterns

### Recommended Project Structure
```
src/
├── app/
│   ├── (dashboard)/
│   │   └── property/
│   │       ├── page.tsx                          # unchanged — server auth shell
│   │       └── _components/
│   │           ├── pm-kpis.tsx                   # MODIFY: new KPI fields + Revenue Exposure footnote
│   │           ├── pm-turn-list.tsx               # MODIFY: add age column, LeaseReadyDateInput, DoneButton
│   │           ├── lease-ready-date-input.tsx     # NEW: "use client" — blur-save date input
│   │           ├── done-button.tsx                # NEW: "use client" — inline Done button
│   │           └── active-jobs-table.tsx          # NEW: "use client" — sortable jobs table
│   └── actions/
│       └── lease-ready-date.ts                   # NEW: server action for updating readyToLeaseDate
└── lib/
    └── kpis/
        ├── pm-kpis.ts                            # MODIFY: 4 new KPI fields, new computePMKPIs signature
        └── pm-kpis.test.ts                       # MODIFY: tests for new fields
```

### Pattern 1: Extended PMKPIResult and computePMKPIs

**What:** The existing 6 KPI fields are replaced with 6 new fields matching PMDB-01 requirements. The `PMKPIResult` interface and `computePMKPIs` function are updated in place.

**KPI mapping (old → new):**
| Old Field | New Field | Label Change |
|-----------|-----------|--------------|
| `activeTurns` | `activeTurns` | "Active Turns" (unchanged) |
| `completedLast30d` | `completedThisPeriod` | "Completed (30d)" → "Completed This Period" |
| `completedLast7d` | `jobsInProgress` | "Completed (7d)" → "Jobs In Progress" |
| `avgTurnTime` | `avgTurnTime` | "Avg Turn Time" (unchanged) |
| `projectedSpendMTD` | `revenueExposure` | "Projected Spend MTD" → "Revenue Exposure" |
| `pastTargetCount` | `turnsNearDeadline` | "Past Target Time" → "Turns Near Deadline" |

Note: `completedThisPeriod` uses the same 30-day window logic as `completedLast30d`. `jobsInProgress` counts jobs with status not in `['Completed', 'Ready']` across all the PM's turns. `revenueExposure` uses the new $60/day formula (PMDB-06). `turnsNearDeadline` counts active turns whose `targetDate` is within 3 days from now.

```typescript
// src/lib/kpis/pm-kpis.ts — updated interface
export interface PMKPIResult {
  activeTurns: number
  completedThisPeriod: number          // Done TRs with readyToLeaseDate in past 30d
  jobsInProgress: number               // jobs where status not in ['Completed', 'Ready']
  avgTurnTime: number | null           // avg timeToCompleteUnit for Done TRs
  revenueExposure: number              // $60/day × days over target (sum across active turns with targetDate)
  revenueExposureExcludedCount: number // active turns with no targetDate (excluded from calculation)
  turnsNearDeadline: number            // active turns with targetDate within next 3 days
}
```

**Revenue Exposure formula (PMDB-06):**
- Rate: $60/day
- Per-turn: `max(0, daysOffMarketUntilReady - targetDays) * 60`
- `targetDays` = days between `offMarketDate` and `targetDate` (or a project-level default if not set)
- Excluded turns: active turns where `targetDate === null` — these contribute $0 but are counted in `revenueExposureExcludedCount`

**Turns Near Deadline definition:**
- Active turns (status !== 'Done') where `targetDate` is not null and `targetDate` is within 3 days from now (i.e., `new Date(targetDate) <= threeDaysFromNow`)
- A turn already past deadline (`targetDate < now`) is also "near" unless the threshold is strictly "approaching" — treat as: `targetDate <= threeDaysFromNow` AND `targetDate >= now - X`. For simplicity: include any active turn where `targetDate` is in `[now - 0, now + 3d]` (today or the next 3 days).

**Jobs In Progress definition:**
- Jobs that are linked to the PM's active turns AND `job.status` is not 'Completed' and not 'Ready'
- `TurnRequest.jobs` is already resolved; flatten all jobs from active turns, deduplicate by `jobId`, count those not in completed statuses

```typescript
// src/lib/kpis/pm-kpis.ts — computePMKPIs updated signature
export function computePMKPIs(turnRequests: TurnRequest[]): PMKPIResult {
  // ...
  // jobsInProgress: flatten jobs from active turns, count non-completed
  const activeTurnRequests = turnRequests.filter((tr) => tr.status !== 'Done')
  const allActiveJobs = activeTurnRequests.flatMap((tr) => tr.jobs ?? [])
  const uniqueActiveJobs = Array.from(new Map(allActiveJobs.map((j) => [j.jobId, j])).values())
  const jobsInProgress = uniqueActiveJobs.filter(
    (j) => j.status !== 'Completed' && j.status !== 'Ready'
  ).length
  // ...
}
```

### Pattern 2: Revenue Exposure KPI with Disclosure (PMDB-06)

**What:** The Revenue Exposure KPI card shows the dollar amount. Below the card (or as a subtitle), it discloses how many turns were excluded because they have no `targetDate`. This disclosure prevents confusion when the number seems low.

**Disclosure implementation:** `KPICard` accepts a `string | number` value. Pass the formatted dollar amount as `value`. Add a `subtitle` or `description` prop to `KPICard` — but before adding a prop, check if the existing `KPICard` accepts one. It does not currently. The simplest approach is to render a small footnote `<p>` below the `<KPICard>` for the excluded count, wrapped in a `<div>`.

```tsx
// In PMKPIs server component:
<div className="flex flex-col gap-1">
  <KPICard
    icon={DollarSign}
    label="Revenue Exposure"
    value={new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(kpis.revenueExposure)}
    variant={kpis.revenueExposure > 0 ? 'alert-past' : 'default'}
  />
  {kpis.revenueExposureExcludedCount > 0 && (
    <p className="text-xs text-text-secondary px-1">
      {kpis.revenueExposureExcludedCount} turn{kpis.revenueExposureExcludedCount !== 1 ? 's' : ''} excluded (no target date)
    </p>
  )}
</div>
```

### Pattern 3: LeaseReadyDateInput Client Component (PMDB-03)

**What:** `"use client"` component placed in each Open Turns row's "Ready To Lease" cell. Shows the current `readyToLeaseDate` (or empty) as a date input. On blur, if the value changed, calls the new `updateLeaseReadyDate` server action optimistically.

```typescript
// src/app/(dashboard)/property/_components/lease-ready-date-input.tsx
'use client'

import { useOptimistic, useTransition, useRef } from 'react'
import { toast } from 'sonner'
import { updateLeaseReadyDate } from '@/app/actions/lease-ready-date'

interface LeaseReadyDateInputProps {
  requestId: number
  currentDate: string | null   // ISO date string or null
}

export function LeaseReadyDateInput({ requestId, currentDate }: LeaseReadyDateInputProps) {
  const [optimisticDate, setOptimisticDate] = useOptimistic(currentDate)
  const [isPending, startTransition] = useTransition()
  const inputRef = useRef<HTMLInputElement>(null)

  // Convert ISO date string to YYYY-MM-DD for <input type="date">
  const toInputValue = (d: string | null) => {
    if (!d) return ''
    // readyToLeaseDate is stored as 'YYYY-MM-DD' from Airtable
    return d.slice(0, 10)
  }

  function handleBlur(e: React.FocusEvent<HTMLInputElement>) {
    const newValue = e.target.value  // '' or 'YYYY-MM-DD'
    const prev = toInputValue(optimisticDate)
    if (newValue === prev) return   // no change

    startTransition(async () => {
      setOptimisticDate(newValue || null)
      const result = await updateLeaseReadyDate(requestId, newValue || null)
      if (result.success) {
        toast.success(`Lease-ready date updated`, { duration: 3000 })
      } else {
        setOptimisticDate(currentDate)
        toast.error('Failed to update date. Please try again.')
      }
    })
  }

  return (
    <input
      ref={inputRef}
      type="date"
      defaultValue={toInputValue(optimisticDate)}
      onBlur={handleBlur}
      disabled={isPending}
      className="text-xs border border-card-border rounded px-2 py-1 bg-card focus:outline-none focus:ring-2 focus:ring-emerald/30 disabled:opacity-50"
      onClick={(e) => e.stopPropagation()}
    />
  )
}
```

**Key:** `onClick={(e) => e.stopPropagation()}` prevents row navigation. Wrap in `<StopPropagation>` or add inline stop.

### Pattern 4: updateLeaseReadyDate Server Action (PMDB-03)

**What:** Analogous to `updateTurnRequestStatus`. Writes to Airtable `Ready To Lease Date` field. Busts `turnRequest(id)`, `turnRequests`, and `kpis` cache tags.

```typescript
// src/app/actions/lease-ready-date.ts
'use server'

import { revalidateTag } from 'next/cache'
import { CACHE_TAGS } from '@/lib/airtable/cache-tags'
import { base, rateLimiter } from '@/lib/airtable/client'

export async function updateLeaseReadyDate(
  requestId: number,
  date: string | null   // 'YYYY-MM-DD' or null to clear
): Promise<{ success: boolean; error?: string }> {
  try {
    await rateLimiter.acquire()

    const records = await base('Turn Requests')
      .select({ filterByFormula: `{Request ID}=${requestId}` })
      .all()

    if (records.length === 0) {
      return { success: false, error: 'Turn request not found' }
    }

    await base('Turn Requests').update(records[0].id, {
      'Ready To Lease Date': date ?? null,
    })

    revalidateTag(CACHE_TAGS.turnRequest(requestId), { expire: 0 })
    revalidateTag(CACHE_TAGS.turnRequests, { expire: 0 })
    revalidateTag(CACHE_TAGS.kpis, { expire: 0 })

    return { success: true }
  } catch (err) {
    console.error('[updateLeaseReadyDate]', err)
    return { success: false, error: 'Failed to update lease-ready date' }
  }
}
```

### Pattern 5: DoneButton Client Component (PMDB-04)

**What:** `"use client"` button that calls `updateTurnRequestStatus(requestId, 'Done')` directly. Uses `useOptimistic` to hide the row immediately (optimistic removal) while the server action completes. On failure, the turn reappears.

**Note on optimistic removal:** The Open Turns list only shows non-Done turns. When PM clicks Done, the turn should visually disappear from the list. This requires either: (a) the `DoneButton` hides its own row via local state, or (b) the parent has a mechanism to filter. Option (a) is simpler — the `DoneButton` can manage a `hidden` state locally. When hidden, the row renders with `display:none` or `return null`. On server action success, `revalidateTag` will trigger a server re-render that removes the row from the data. On failure, the row reappears.

```typescript
// src/app/(dashboard)/property/_components/done-button.tsx
'use client'

import { useState, useTransition } from 'react'
import { toast } from 'sonner'
import { updateTurnRequestStatus } from '@/app/actions/turn-request-status'

interface DoneButtonProps {
  requestId: number
}

export function DoneButton({ requestId }: DoneButtonProps) {
  const [hidden, setHidden] = useState(false)
  const [isPending, startTransition] = useTransition()

  if (hidden) return null

  function handleClick() {
    startTransition(async () => {
      setHidden(true)   // optimistic hide
      const result = await updateTurnRequestStatus(requestId, 'Done')
      if (result.success) {
        toast.success(`Turn #${requestId} marked as Done`, { duration: 3000 })
      } else {
        setHidden(false)  // revert
        toast.error('Failed to mark turn as Done. Please try again.')
      }
    })
  }

  return (
    <button
      type="button"
      onClick={(e) => { e.stopPropagation(); handleClick() }}
      disabled={isPending}
      className="text-xs bg-emerald text-white rounded-pill px-2.5 py-1 hover:bg-emerald-dark transition-colors disabled:opacity-50"
    >
      Done
    </button>
  )
}
```

### Pattern 6: ActiveJobsTable Client Component (PMDB-05)

**What:** `"use client"` component that receives a flat list of jobs (aggregated from PM's turns on the server side) and renders a sortable table. Sort state (`sortCol`, `sortDir`) lives in component state. Clicking a column header toggles sort.

**Data flow:** The `PMTurnList` server component already has all turns with resolved jobs. A new `ActiveJobs` server component (or an extension of `PMTurnList`) should extract the flat job list and pass it to `ActiveJobsTable`. Jobs from Done turns are excluded ("in-flight" = jobs on active turns only). The `Job` type has `vendorName`, `status`, and `durationDays` — these map to the required sortable columns.

**Days open for a job:** `durationDays` on `Job` is "Duration (Days, If Completed)". For in-progress jobs this may be null. Days open should be computed client-side as `differenceInDays(now, new Date(job.created))` or `job.durationDays ?? differenceInDays(now, new Date(job.created))`. No external date library needed — use `Math.floor((Date.now() - new Date(job.created).getTime()) / (1000 * 60 * 60 * 24))`.

```typescript
// src/app/(dashboard)/property/_components/active-jobs-table.tsx
'use client'

import { useState } from 'react'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table'
import type { Job } from '@/lib/types/airtable'

type SortCol = 'vendor' | 'status' | 'daysOpen'
type SortDir = 'asc' | 'desc'

function getDaysOpen(job: Job): number {
  if (job.durationDays != null) return job.durationDays
  return Math.floor((Date.now() - new Date(job.created).getTime()) / (1000 * 60 * 60 * 24))
}

interface ActiveJobsTableProps {
  jobs: Job[]
}

export function ActiveJobsTable({ jobs }: ActiveJobsTableProps) {
  const [sortCol, setSortCol] = useState<SortCol>('daysOpen')
  const [sortDir, setSortDir] = useState<SortDir>('desc')

  function handleSort(col: SortCol) {
    if (col === sortCol) {
      setSortDir((d) => d === 'asc' ? 'desc' : 'asc')
    } else {
      setSortCol(col)
      setSortDir('asc')
    }
  }

  const sorted = [...jobs].sort((a, b) => {
    let cmp = 0
    if (sortCol === 'vendor') {
      cmp = (a.vendorName ?? '').localeCompare(b.vendorName ?? '')
    } else if (sortCol === 'status') {
      cmp = a.status.localeCompare(b.status)
    } else {
      cmp = getDaysOpen(a) - getDaysOpen(b)
    }
    return sortDir === 'asc' ? cmp : -cmp
  })

  // ... render table with sorted data
}
```

### Pattern 7: Aggregating Jobs for PMDB-05 on the Server

**What:** The `ActiveJobs` display needs a flat list of all in-flight jobs across the PM's active turns. This is computed server-side by fetching turns (already cached) and flattening jobs from non-Done turns.

```typescript
// In a new server component or added to PMTurnList:
export async function ActiveJobs({ assignedProperties, role }: { assignedProperties: string[]; role: string }) {
  const turnRequests = await fetchTurnRequestsForUser(role as UserRole, assignedProperties)
  const activeTurns = turnRequests.filter((tr) => tr.status !== 'Done')
  const allJobs = activeTurns.flatMap((tr) => tr.jobs ?? [])
  // Deduplicate by jobId
  const uniqueJobs = Array.from(new Map(allJobs.map((j) => [j.jobId, j])).values())
  // In-flight = not Completed and not Ready
  const inflightJobs = uniqueJobs.filter((j) => j.status !== 'Completed' && j.status !== 'Ready')
  return <ActiveJobsTable jobs={inflightJobs} />
}
```

This reuses the cached `fetchTurnRequestsForUser` call — no additional Airtable fetches.

### Anti-Patterns to Avoid

- **Fetching jobs separately for the Active Jobs table:** Jobs are already resolved via `resolveLinkedJobs` inside `fetchTurnRequests`. Do not call `fetchJobs()` separately — flatten `turn.jobs` instead.
- **Adding `subtitle` prop to `KPICard`:** The component is shared across dashboards. Add the excluded-count footnote as a sibling element in the `PMKPIs` component, not as a new prop on `KPICard`.
- **Using `useOptimistic` for `DoneButton` row removal:** `useOptimistic` requires a current value to revert to; for "remove from list" the simpler `useState(hidden)` pattern is cleaner and does not require passing the full turn object through the component tree.
- **Recomputing Revenue Exposure in the UI component:** Keep it in `computePMKPIs` as a pure function — testable and consistent with the existing pattern.
- **`<input type="date">` `onChange` instead of `onBlur`:** The requirement is blur-triggered. `onChange` fires on every keystroke while typing a date; `onBlur` fires once when the user leaves the field.
- **Forgetting `e.stopPropagation()` on interactive cells:** Both `LeaseReadyDateInput` and `DoneButton` are inside clickable rows that navigate to the turn detail page. Both must stop propagation.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Optimistic date update | `useState` + `setTimeout` revert | `useOptimistic` + `useTransition` | Correct concurrent behavior, automatic revert semantics |
| Toast notifications | Custom toast | `sonner` (already wired) | `toast.success()` / `toast.error()` API is one-liner |
| Cache invalidation on write | Manual page reload | `revalidateTag` in server action | Already proven pattern — surgical invalidation |
| Client-side sort | Custom sort utility | `Array.sort()` inline in component | Data is already in memory; no library needed |
| Date parsing for input | External date library | `str.slice(0, 10)` + `new Date()` | ISO dates from Airtable are always `YYYY-MM-DD`; slice is sufficient |
| Job deduplication | Custom logic | `new Map(jobs.map(j => [j.jobId, j])).values()` | One-liner, no dependencies |
| Revenue Exposure formula | Business logic in UI | `computePMKPIs` pure function | Testable, consistent with existing KPI pattern |

---

## Common Pitfalls

### Pitfall 1: Turn Closing Contract Ambiguity (STATE.md Open Decision)
**What goes wrong:** If "Done" button and lease-ready date entry both close the turn, doing one while the other is pending may cause a race condition or incorrect state.
**Why it happens:** The requirements define them as separate (PMDB-03 and PMDB-04), but STATE.md flags the "Turn closing contract" as an unresolved decision.
**How to avoid:** Treat them as independent operations. The "Done" button calls `updateTurnRequestStatus(requestId, 'Done')`. The lease-ready date input calls `updateLeaseReadyDate(requestId, date)` — it does NOT also set status. This means a PM could set a lease-ready date without marking Done, and could mark Done without a lease-ready date. This is the simplest contract — plan around it. If the client requires them to be linked, that must be specified before plan execution.
**Warning signs:** If the plan tries to combine both operations in one server action, that is a scope expansion beyond PMDB-03/04.

### Pitfall 2: Revenue Exposure — targetDate vs. daysOffMarketUntilReady
**What goes wrong:** `daysOffMarketUntilReady` is "days off market until ready" (i.e., how many days have passed since the unit went off market). The "target" is `targetDate` on `TurnRequest`. The formula needs to compute days over target, not just raw days off market.
**Why it happens:** The formula description says "$60/day over target" — "over target" means days beyond the target date.
**How to avoid:** Compute `targetDays` = difference in calendar days between `offMarketDate` and `targetDate`. Then `daysOverTarget = max(0, daysOffMarketUntilReady - targetDays)`. For turns where `targetDate` is null, skip the turn (count it in `revenueExposureExcludedCount`). For turns where `daysOffMarketUntilReady` is null, assume 0 days over target (not yet off market or no data).
**Warning signs:** Revenue Exposure shows very large numbers (probably using raw `daysOffMarketUntilReady` times $60 without subtracting target) or zero for all turns (probably not finding turns with `targetDate` set).

### Pitfall 3: Turns Near Deadline — Definition of "Near"
**What goes wrong:** "Turns near deadline" is undefined in the requirements. Using too wide a window (e.g., 7 days) produces a high count that overshadows the "Active Turns" card.
**Why it happens:** "Near" is a business-rule decision not specified in PMDB-01.
**How to avoid:** Default to 3 calendar days from now (`targetDate <= threeDaysFromNow`). This is a named constant: `NEAR_DEADLINE_DAYS = 3`. Document it in the code. The planner should flag this as a named constant to confirm with the client.
**Warning signs:** The KPI always shows 0 (threshold too tight) or equals Active Turns (threshold too wide).

### Pitfall 4: Jobs In Progress — Including Jobs from Done Turns
**What goes wrong:** `fetchTurnRequestsForUser` returns all turns including Done turns. If jobs from Done turns are included in the "Jobs In Progress" count, the number is misleading.
**Why it happens:** `flatMap((tr) => tr.jobs ?? [])` across all turns without filtering on turn status.
**How to avoid:** Filter to active turns first: `const activeTurns = turnRequests.filter((tr) => tr.status !== 'Done')`, then flatten jobs from `activeTurns` only.
**Warning signs:** "Jobs In Progress" count is higher than expected, including jobs from completed turns.

### Pitfall 5: LeaseReadyDateInput `defaultValue` vs. `value`
**What goes wrong:** Using `value` (controlled input) with `useOptimistic` requires re-rendering to update the input display. Using `defaultValue` means the input reflects the initial render only — if `optimisticDate` changes (e.g., on revert), the native input DOM value won't update.
**Why it happens:** React controlled vs uncontrolled input semantics.
**How to avoid:** Use `key={optimisticDate}` on the input to force remount when the optimistic value changes. This ensures the `defaultValue` reflects the current optimistic state after a revert: `<input key={toInputValue(optimisticDate)} defaultValue={toInputValue(optimisticDate)} ...>`. The `onBlur` handler reads the current DOM value, which is correct.
**Warning signs:** After a failed save, the input shows the new value (that failed) rather than the original value.

### Pitfall 6: Active Jobs Table — Duplicates Across Turns
**What goes wrong:** A single job can theoretically be linked to multiple turn requests (Airtable linked record field allows this). Without deduplication, the same job appears multiple times in the table.
**Why it happens:** `flatMap` over all turns' jobs does not deduplicate.
**How to avoid:** `const uniqueJobs = Array.from(new Map(allJobs.map((j) => [j.jobId, j])).values())`
**Warning signs:** Active Jobs table shows the same Job ID multiple times.

### Pitfall 7: Sort Column Header — Missing Visual Indicator
**What goes wrong:** The user clicks a column header to sort but has no visual feedback on which column is sorted and in which direction.
**Why it happens:** Standard `<TableHead>` renders plain text with no sort UI.
**How to avoid:** Render a `^`/`v` indicator (or ChevronUp/ChevronDown from Lucide) next to the active sort column header. `sortCol === 'vendor'` → show indicator.
**Warning signs:** Clicking headers appears to work but the user can't tell the current sort state.

---

## Code Examples

Verified patterns from existing codebase:

### updateTurnRequestStatus (existing — DoneButton reuses this)
```typescript
// Source: src/app/actions/turn-request-status.ts
export async function updateTurnRequestStatus(
  requestId: number,
  status: string
): Promise<{ success: boolean; error?: string }>
// Validates against TURN_REQUEST_STATUSES, busts 3 cache tags
// 'Done' is a valid TURN_REQUEST_STATUS — no changes needed to the action
```

### fetchTurnRequestsForUser (existing — Active Jobs uses cached result)
```typescript
// Source: src/lib/airtable/tables/turn-requests.ts
export async function fetchTurnRequestsForUser(
  role: UserRole,
  assignedPropertyNames: string[]
): Promise<TurnRequest[]>
// Returns TurnRequest[] with resolved .jobs arrays
// Cached — calling twice returns same cached result
```

### TurnRequest.targetDate (existing field — used for Revenue Exposure and Turns Near Deadline)
```typescript
// Source: src/lib/types/airtable.ts — line 20
targetDate: string | null
// Populated in mapper: f['Target Date'] ? String(f['Target Date']) : null
// Available on all TurnRequest objects; null when not set in Airtable
```

### Job type fields available for PMDB-05
```typescript
// Source: src/lib/types/airtable.ts
interface Job {
  jobId: number
  vendorName: string | null    // sort by vendor
  status: JobStatus            // sort by status: 'NEEDS ATTENTION' | 'Blocked' | 'In Progress' | 'Completed' | 'Ready'
  durationDays: number | null  // sort by days open (if completed); use created for in-progress
  created: string              // ISO datetime — fallback for days open
  turnRequestId: number | null // to link back to turn
  isCompleted: boolean
}
```

### KPICard (existing — no changes needed)
```typescript
// Source: src/components/ui/kpi-card.tsx
// variant="alert-past" → pink background (use for Revenue Exposure when > 0)
// variant="default"    → white background
// value accepts string | number — pass formatted currency string
<KPICard icon={DollarSign} label="Revenue Exposure" value="$1,200" variant="alert-past" />
```

### Existing TurnStatusDropdown pattern (reuse for DoneButton action)
```typescript
// Source: src/app/(dashboard)/property/_components/turn-status-dropdown.tsx
// handleSelect already calls updateTurnRequestStatus and handles toast/revert
// DoneButton simplifies this to a single-action button — no dropdown UI needed
// TURN_STATUSES includes 'Done' — action already validates it
```

### computePMKPIs — current shape (to extend)
```typescript
// Source: src/lib/kpis/pm-kpis.ts
export interface PMKPIResult {
  activeTurns: number
  completedLast30d: number     // → rename to completedThisPeriod
  completedLast7d: number      // → replace with jobsInProgress
  avgTurnTime: number | null
  projectedSpendMTD: number    // → replace with revenueExposure + revenueExposureExcludedCount
  pastTargetCount: number      // → replace with turnsNearDeadline
}
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `useState` + manual revert | `useOptimistic` + `useTransition` | React 19 (Phase 5) | Use for `LeaseReadyDateInput` |
| `router.refresh()` after writes | `revalidateTag` in server action | Phase 3 | Use in `updateLeaseReadyDate` |
| Synchronous `params` in dynamic routes | `await params` (Promise) | Next.js 15 | Already handled in `turn/[id]/page.tsx` |
| `unstable_cache` | `use cache` directive | Next.js 15 Phase 3 | All caching uses `use cache` |
| Clicking row to navigate AND interacting with cells | `e.stopPropagation()` in interactive cells | Phase 5 established pattern | Required for date input and Done button |

**Deprecated/outdated (don't use):**
- `unstable_cache`: Not in this project — `use cache` only
- `router.refresh()` for write invalidation: Not used — `revalidateTag` handles this

---

## Open Questions

1. **Turn Closing Contract (STATE.md open decision — must resolve before plan execution)**
   - What we know: PMDB-03 (lease-ready date) and PMDB-04 (Done button) are separate requirements with no explicit coupling
   - What's unclear: Does entering a lease-ready date automatically set status to Done? Does "Done" require a lease-ready date?
   - Recommendation: Treat as independent operations (simplest contract). Flag in PLAN as a named decision. If the client requires coupling, it is a scope change.

2. **"Completed This Period" window — 30 days or calendar month?**
   - What we know: PMDB-01 says "completed this period" without specifying the window; existing `completedLast30d` uses a rolling 30-day window
   - What's unclear: "This period" could mean calendar month (MTD) or rolling 30 days
   - Recommendation: Default to rolling 30 days (consistent with existing implementation). Document as named constant `COMPLETED_PERIOD_DAYS = 30`.

3. **Revenue Exposure rate — $60/day confirmed or default?**
   - What we know: PMDB-06 specifies "$60/day over target"; STATE.md notes "$60/day and 10-day target treated as business rules — confirm with client or define as named constants"
   - What's unclear: Whether $60/day is final or a placeholder
   - Recommendation: Use `REVENUE_EXPOSURE_RATE_PER_DAY = 60` as a named constant in `pm-kpis.ts`. The planner should flag this for client confirmation before execution.

4. **"Turns Near Deadline" threshold**
   - What we know: PMDB-01 specifies "turns near deadline" as a KPI label; no threshold defined
   - What's unclear: How many days from `targetDate` qualifies as "near"
   - Recommendation: Default to 3 calendar days (`NEAR_DEADLINE_DAYS = 3`). Flag as named constant.

5. **Active Jobs table scope — all PM's turns or just Open Turns?**
   - What we know: PMDB-05 says "all in-flight vendor jobs across the PM's turns"
   - What's unclear: Does this include jobs linked to Done turns?
   - Recommendation: "In-flight" = not Completed and not Ready — filter active turns first, then flatten jobs. Jobs from Done turns are excluded because the turn is done.

---

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest 4.0.18 |
| Config file | `vitest.config.ts` (root) |
| Quick run command | `npx vitest run src/lib/kpis/pm-kpis.test.ts` |
| Full suite command | `npm test` |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| PMDB-01 | `completedThisPeriod` count correct | unit | `npx vitest run src/lib/kpis/pm-kpis.test.ts` | ✅ (update existing) |
| PMDB-01 | `jobsInProgress` counts non-completed jobs from active turns | unit | `npx vitest run src/lib/kpis/pm-kpis.test.ts` | ❌ Wave 0 |
| PMDB-01 | `turnsNearDeadline` counts active turns within 3 days of targetDate | unit | `npx vitest run src/lib/kpis/pm-kpis.test.ts` | ❌ Wave 0 |
| PMDB-06 | `revenueExposure` = $60 × max(0, daysOffMarketUntilReady − targetDays) | unit | `npx vitest run src/lib/kpis/pm-kpis.test.ts` | ❌ Wave 0 |
| PMDB-06 | `revenueExposureExcludedCount` = count of active turns with no targetDate | unit | `npx vitest run src/lib/kpis/pm-kpis.test.ts` | ❌ Wave 0 |
| PMDB-02 | Turn age column displays `daysOffMarketUntilReady` | manual smoke | `npm run dev` + visual check | N/A |
| PMDB-03 | `updateLeaseReadyDate` writes to Airtable and busts cache | unit (action) | `npx vitest run src/app/actions/__tests__/` | ❌ Wave 0 (action file) |
| PMDB-04 | `DoneButton` hides row optimistically, reverts on failure | unit (component) | `npx vitest run` | ❌ Wave 0 |
| PMDB-05 | `ActiveJobsTable` sorts by vendor, status, daysOpen correctly | unit | `npx vitest run` | ❌ Wave 0 |
| PMDB-05 | Jobs deduplicated by jobId across turns | unit | `npx vitest run src/lib/kpis/pm-kpis.test.ts` | ❌ Wave 0 |

### Sampling Rate
- **Per task commit:** `npx vitest run src/lib/kpis/pm-kpis.test.ts`
- **Per wave merge:** `npm test`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `src/lib/kpis/pm-kpis.test.ts` — add tests for `jobsInProgress`, `turnsNearDeadline`, `revenueExposure`, `revenueExposureExcludedCount` (extends existing file)
- [ ] `src/app/actions/lease-ready-date.ts` — new server action file (no test file yet; add to `src/app/actions/__tests__/` pattern if integration tests exist)
- [ ] Component-level tests for `DoneButton` and `ActiveJobsTable` if project has component test coverage (check `src/components/ui/__tests__/` pattern)

*(Existing `pm-kpis.test.ts` covers `activeTurns`, `completedLast30d`, `avgTurnTime`, `projectedSpendMTD`, `pastTargetCount` — these tests must be updated for the renamed fields)*

---

## Sources

### Primary (HIGH confidence)
- Direct codebase read: `src/lib/types/airtable.ts` — `TurnRequest` type confirmed; `targetDate` field verified
- Direct codebase read: `src/lib/kpis/pm-kpis.ts` — current `PMKPIResult` interface and `computePMKPIs` confirmed
- Direct codebase read: `src/lib/kpis/pm-kpis.test.ts` — existing test coverage confirmed; update scope identified
- Direct codebase read: `src/app/actions/turn-request-status.ts` — `updateTurnRequestStatus` confirmed; `Done` is a valid status; DoneButton can reuse this action
- Direct codebase read: `src/app/actions/job-status.ts` — `updateJobStatus` pattern; `updateLeaseReadyDate` modeled on same structure
- Direct codebase read: `src/app/(dashboard)/property/_components/turn-status-dropdown.tsx` — optimistic pattern confirmed; `useOptimistic` + `useTransition` + Sonner toast
- Direct codebase read: `src/app/(dashboard)/property/_components/pm-turn-list.tsx` — current column structure; row click + `StopPropagation` pattern confirmed
- Direct codebase read: `src/app/(dashboard)/property/page.tsx` — current page structure; URL search param pattern for property filter
- Direct codebase read: `src/components/ui/kpi-card.tsx` — no `subtitle` prop; wrap in `<div>` for footnote
- Direct codebase read: `src/lib/airtable/tables/mappers.ts` — `targetDate` mapping confirmed: `f['Target Date']`
- Direct codebase read: `.planning/STATE.md` — open decisions confirmed: turn closing contract, $60/day rate
- Direct codebase read: `.planning/config.json` — `nyquist_validation: true` — Validation Architecture section required

### Secondary (MEDIUM confidence)
- React 19 `useOptimistic` + `useTransition` pattern: consistent with Phase 5 research and existing `TurnStatusDropdown` implementation
- `key` prop on `<input>` to force remount on optimistic revert: standard React pattern for uncontrolled inputs

### Tertiary (LOW confidence)
- "Turns Near Deadline" threshold of 3 days: derived from project context; not specified in requirements — flagged as Open Question

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all libraries verified in package.json and existing code
- Architecture: HIGH — all patterns are direct extensions of Phase 3–12 code in the repo
- KPI formulas: HIGH — `targetDate` and `daysOffMarketUntilReady` confirmed in type and mapper; formula is straightforward arithmetic
- New server action: HIGH — directly modeled on verified `updateTurnRequestStatus`
- Open questions: LOW — business rules (rate, threshold, closing contract) are unspecified; flagged for resolution

**Research date:** 2026-03-18
**Valid until:** 2026-04-18 (stable stack; Next.js 15 and React 19 APIs are settled; Airtable schema unchanged)
