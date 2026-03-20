# Phase 14: Completed Jobs Page - Research

**Researched:** 2026-03-19
**Domain:** Next.js 15 App Router — new dedicated page with server-side data filtering and existing component reuse
**Confidence:** HIGH

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| COMP-01 | User can navigate to Completed Jobs page at /property/completed-jobs | New `page.tsx` at `src/app/(dashboard)/property/completed-jobs/page.tsx`; auth pattern mirrors `src/app/(dashboard)/property/page.tsx` exactly; `ROLE_ALLOWED_ROUTES` already permits all roles at `/property/**` |
| COMP-02 | User can filter completed jobs by property via PropertyMultiSelect | `PropertyMultiSelect` component exists at `src/components/ui/property-multi-select.tsx`; takes `properties`, `selected`, `onChange` props; currently wired in Off Market entry via server action pattern; for this page, selection state drives client-side filtering (no URL params needed) |
| COMP-03 | Completed Jobs table reuses Active Jobs table component with server-side isCompleted filter | `ActiveJobsTable` at `src/app/(dashboard)/property/_components/active-jobs-table.tsx` is the exact component to reuse; a new `CompletedJobs` server component mirrors `ActiveJobs` but filters for completed jobs instead of in-flight |
</phase_requirements>

---

## Summary

Phase 14 is narrow in scope. The entire component and data infrastructure required already exists from Phase 13. The work is:

1. Create a new Next.js page at `/property/completed-jobs` with auth wiring (copy pattern from `property/page.tsx`)
2. Create a `CompletedJobs` server component that fetches turn requests for the user, flattens all jobs, filters to completed status (`isCompleted === true` or status in `['Completed', 'Invoice Sent', 'Scheduled']`), and passes to `ActiveJobsTable`
3. Create a `CompletedJobsClient` wrapper component that owns `PropertyMultiSelect` state and applies client-side property filtering before passing jobs to `ActiveJobsTable`

The key insight from COMP-03: "reuses Active Jobs table component with server-side isCompleted filter." The `ActiveJobsTable` is a `"use client"` component that takes a `jobs` prop — it is already column-complete (Vendor, Status, Days Open, Start Date, End Date, Unit, Turn) with sort support. No changes to `ActiveJobsTable` are needed.

**Primary recommendation:** Create `completed-jobs/page.tsx`, create `completed-jobs-client.tsx` client component with `PropertyMultiSelect` + client-side property filter, create `completed-jobs.tsx` server component that fetches and passes completed jobs to the client wrapper.

---

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Next.js App Router | 15.x (installed) | Page routing, server components, Suspense | Project standard |
| React | 19.x (installed) | UI, hooks, state | Project standard |
| `use cache` + `cacheTag` | Next.js 15 built-in | Server-side caching | Phase 3 established pattern — all data fetches use this |
| Supabase SSR | installed | Auth on new page | Same `createClient()` + `getUser()` pattern as `property/page.tsx` |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `useState` (React 19) | built-in | PropertyMultiSelect selection state | In `CompletedJobsClient` — selected properties |
| `useMemo` (React 19) | built-in | Client-side property filtering | Derive filtered job list from selection + full job list |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Client-side property filter | URL search params + server re-fetch | URL params require a round-trip and Suspense remount; for a history view with potentially large data sets loaded once, client-side filtering is simpler and fast |
| `useMemo` for filter | `useEffect` + `setState` | `useMemo` is synchronous and avoids extra renders; correct for derived state |

**Installation:** No new packages required. All dependencies already installed.

---

## Architecture Patterns

### Recommended Project Structure
```
src/app/(dashboard)/property/
├── completed-jobs/
│   ├── page.tsx                        # NEW: server — auth + passes props to client shell
│   └── _components/
│       ├── completed-jobs.tsx          # NEW: server — fetches + filters completed jobs
│       └── completed-jobs-client.tsx   # NEW: "use client" — PropertyMultiSelect + client filter
```

Note: The existing `active-jobs-table.tsx` is reused directly — no copy, no modification.

### Pattern 1: New Page with Auth (COMP-01)

**What:** `property/completed-jobs/page.tsx` is a server page that authenticates the user and passes `assignedProperties`, `role`, and `displayName` down to a Suspense-wrapped `CompletedJobs` server component.

**When to use:** Every new page under `(dashboard)/property/` follows this exact pattern from `property/page.tsx`.

**Key differences from `property/page.tsx`:**
- No `searchParams` needed (property filter is client-state, not URL-param)
- No `filterKey` or multiple Suspense boundaries — just one `<CompletedJobs>` boundary
- No `PMDashboard` wrapper — needs its own page header (or can reuse layout)

```typescript
// src/app/(dashboard)/property/completed-jobs/page.tsx
import { Suspense } from 'react'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { CompletedJobs } from './_components/completed-jobs'
import { PMTurnListSkeleton } from '../_components/pm-turn-list-skeleton'

export default async function CompletedJobsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const assignedProperties: string[] = user.app_metadata?.property_ids ?? []
  const role: string = user.app_metadata?.role ?? 'pm'

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="font-heading font-bold text-xl text-white">Completed Jobs</h1>
        <p className="text-white/70 text-sm mt-0.5">Full history of completed jobs across your properties</p>
      </div>
      <Suspense fallback={<PMTurnListSkeleton />}>
        <CompletedJobs assignedProperties={assignedProperties} role={role} />
      </Suspense>
    </div>
  )
}
```

### Pattern 2: CompletedJobs Server Component (COMP-03)

**What:** Server component that calls `fetchTurnRequestsForUser` (cached), flattens jobs from ALL turn requests (not just active), filters to completed jobs, and passes the full list to `CompletedJobsClient`. The `isCompleted` filter happens server-side.

**Completed job definition:** Jobs where `job.isCompleted === true`. The `isCompleted` field on `Job` maps from the Airtable `'Is Completed'` field (verified in mapper). This is the cleanest filter — it matches COMP-03 requirement language exactly ("server-side isCompleted filter").

**Note on turn scope:** Unlike `ActiveJobs` which only looks at active (non-Done) turns, `CompletedJobs` looks across ALL turn requests — because completed jobs can belong to both active and Done turns.

```typescript
// src/app/(dashboard)/property/completed-jobs/_components/completed-jobs.tsx
import { fetchTurnRequestsForUser } from '@/lib/airtable/tables/turn-requests'
import { CompletedJobsClient } from './completed-jobs-client'
import type { UserRole } from '@/lib/types/auth'

interface CompletedJobsProps {
  assignedProperties: string[]
  role: string
}

export async function CompletedJobs({ assignedProperties, role }: CompletedJobsProps) {
  const turnRequests = await fetchTurnRequestsForUser(role as UserRole, assignedProperties)

  // Completed jobs span ALL turns (active and Done)
  const allJobs = turnRequests.flatMap((tr) =>
    (tr.jobs ?? []).map((j) => ({
      ...j,
      unitNumber: tr.unitNumber,
      turnRequestId: tr.requestId,
      propertyName: tr.propertyName,
    }))
  )

  // Deduplicate by jobId
  const uniqueJobs = Array.from(new Map(allJobs.map((j) => [j.jobId, j])).values())

  // Server-side isCompleted filter (COMP-03)
  const completedJobs = uniqueJobs.filter((j) => j.isCompleted)

  // Derive unique property names for the filter control
  const propertyNames = Array.from(
    new Set(completedJobs.map((j) => j.propertyName).filter(Boolean) as string[])
  ).sort()

  return (
    <CompletedJobsClient
      jobs={completedJobs}
      propertyNames={propertyNames}
    />
  )
}
```

### Pattern 3: CompletedJobsClient Component (COMP-02)

**What:** `"use client"` component that owns `PropertyMultiSelect` selection state and derives the filtered job list via `useMemo`. Passes filtered list to `ActiveJobsTable`.

**PropertyMultiSelect usage:** The existing `PropertyMultiSelect` takes `PropertyOption[]` (objects with `name` and `streetAddress`). For this page, the filter is by property name only (jobs have `propertyName` but not `streetAddress`). Construct `PropertyOption` objects with `streetAddress: ''` (or the actual address if available) — the component compares by both fields; using a sentinel empty string is safe since we only filter by name.

```typescript
// src/app/(dashboard)/property/completed-jobs/_components/completed-jobs-client.tsx
'use client'

import { useState, useMemo } from 'react'
import { PropertyMultiSelect, PropertyOption } from '@/components/ui/property-multi-select'
import { ActiveJobsTable } from '../../_components/active-jobs-table'
import type { Job } from '@/lib/types/airtable'

type CompletedJob = Job & { unitNumber?: string; turnRequestId?: number; propertyName?: string }

interface CompletedJobsClientProps {
  jobs: CompletedJob[]
  propertyNames: string[]
}

export function CompletedJobsClient({ jobs, propertyNames }: CompletedJobsClientProps) {
  const propertyOptions: PropertyOption[] = propertyNames.map((name) => ({
    name,
    streetAddress: '',
  }))
  const [selectedProperties, setSelectedProperties] = useState<PropertyOption[]>([])

  const filteredJobs = useMemo(() => {
    if (selectedProperties.length === 0) return jobs
    const selectedNames = new Set(selectedProperties.map((p) => p.name))
    return jobs.filter((j) => j.propertyName && selectedNames.has(j.propertyName))
  }, [jobs, selectedProperties])

  return (
    <div className="flex flex-col gap-4">
      {propertyOptions.length > 1 && (
        <div className="max-w-sm">
          <PropertyMultiSelect
            properties={propertyOptions}
            selected={selectedProperties}
            onChange={setSelectedProperties}
            placeholder="Filter by property"
          />
        </div>
      )}
      <ActiveJobsTable jobs={filteredJobs} />
    </div>
  )
}
```

### Pattern 4: Navigation to Completed Jobs Page

**What:** The requirements say "Any user can navigate to /property/completed-jobs." Navigation needs to be accessible from somewhere in the UI. The existing `PMDashboard` sidebar or the Active Jobs section header are the natural locations. A link should appear in the PM dashboard.

**Where to add the link:** The simplest approach is a text link in the `ActiveJobsTable` card header area or in the page layout. Since the layout is in `(dashboard)/layout.tsx`, a global navigation link can be added there. Alternatively, add a "View completed jobs" link in the `active-jobs-table.tsx` card header — this keeps it contextually relevant.

**Link target:** `href="/property/completed-jobs"` — no dynamic segments.

### Anti-Patterns to Avoid

- **Modifying `ActiveJobsTable` for the new page:** The table already handles completed job status values and renders all columns correctly. Do not add a `mode` prop or conditional logic — just pass completed jobs and let the component render as-is.
- **Fetching jobs from a separate `fetchJobs()` call:** Jobs are already resolved via `resolveLinkedJobs` inside `fetchTurnRequestsForUser`. Do not call `fetchJobs()` directly — flatten `tr.jobs` instead. Same pattern as `ActiveJobs`.
- **Using URL search params for property filter state:** The `PMDashboard` page uses URL params because it drives server-side Suspense remounts keyed to `filterKey`. For the completed jobs page, the full job list is fetched once and the filter is client-side — `useState` is correct, URL params would force unnecessary round-trips.
- **Hiding `PropertyMultiSelect` when there is only one property:** The PM dashboard hides the property selector when `assignedProperties.length <= 1`. Apply the same logic here: only render the filter when `propertyOptions.length > 1`.
- **Forgetting `propertyName` in the job augmentation:** Jobs fetched from `tr.jobs` include `job.propertyName` from the mapper (verified: `propertyName: f['Property Name'] ? String(f['Property Name']) : null`). However, using the parent turn's `tr.propertyName` (which always has a value) is more reliable than the job's own `propertyName` field.
- **Including the "Create new property" feature in `PropertyMultiSelect`:** The component's `onCreateProperty` prop is optional — simply omit it. The "Create new property" button will not render unless the prop is provided.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Sortable completed jobs table | Custom table | `ActiveJobsTable` (existing) | Already has Vendor/Status/Days Open sort, Start Date, End Date, Unit, Turn columns — exact match for COMP-03 |
| Multi-property filter dropdown | Custom select | `PropertyMultiSelect` (existing) | Checkbox multi-select with chips, search, click-outside — already tested |
| Auth guard on new page | Custom auth check | `createClient()` + `getUser()` + `redirect('/login')` pattern | Every page in `(dashboard)/property/` uses this 3-line pattern |
| Job deduplication | Custom loop | `new Map(jobs.map(j => [j.jobId, j])).values()` | One-liner, proven in `active-jobs.tsx` |
| Suspense loading state | Custom skeleton | `PMTurnListSkeleton` | Reusable card-shaped skeleton already wired |

---

## Common Pitfalls

### Pitfall 1: isCompleted vs. Status String Comparison
**What goes wrong:** Filtering by `j.status === 'Completed'` misses jobs with status `'Invoice Sent'` or `'Scheduled'` that are also completed in Airtable. The `active-jobs.tsx` component already discovered this and explicitly excludes those statuses.
**Why it happens:** `JOB_STATUSES` type only defines 5 statuses (`'NEEDS ATTENTION'`, `'Blocked'`, `'In Progress'`, `'Completed'`, `'Ready'`) but Airtable data includes additional values like `'Invoice Sent'` and `'Scheduled'` that appear in practice.
**How to avoid:** Use `j.isCompleted === true` (the dedicated boolean field from Airtable's `'Is Completed'` column) rather than string comparison on `status`. This is the correct implementation of COMP-03's "server-side isCompleted filter" language.
**Warning signs:** Missing completed jobs in the table, or TypeScript errors when comparing status against unlisted strings.

### Pitfall 2: PropertyMultiSelect Requires PropertyOption Shape
**What goes wrong:** Passing plain strings to `PropertyMultiSelect` causes type errors. The component requires `PropertyOption[]` (`{ name: string; streetAddress: string }`).
**Why it happens:** The component was designed for the Off Market entry flow which has full property objects with addresses.
**How to avoid:** Construct `PropertyOption` objects from property names: `propertyNames.map(name => ({ name, streetAddress: '' }))`. The `streetAddress` field is displayed in the "Create property" form but not in the chip or option labels. An empty string is safe for read-only filter usage.
**Warning signs:** TypeScript error on `onChange` prop or `selected` prop.

### Pitfall 3: All Turns vs. Active Turns for Completed Jobs
**What goes wrong:** Copying the `ActiveJobs` component's `filter((tr) => tr.status !== 'Done')` line into `CompletedJobs` means jobs on Done turns are excluded from the completed jobs page.
**Why it happens:** `ActiveJobs` filters to active turns first because it shows in-flight work — done turns are irrelevant there. Completed jobs are more commonly on Done turns.
**How to avoid:** In `CompletedJobs`, flatMap over ALL turn requests without filtering by turn status. Apply `j.isCompleted` filter to the jobs, not a turn status filter.
**Warning signs:** Completed jobs page is sparse despite jobs existing in Airtable — jobs from Done turns are silently excluded.

### Pitfall 4: Missing Navigation Entry Point
**What goes wrong:** The page exists at `/property/completed-jobs` but users can't find it because there is no link in the UI.
**Why it happens:** The requirements specify the page URL but do not mandate where the navigation link lives.
**How to avoid:** Add a visible link in the PM dashboard. The `active-jobs-table.tsx` card header is the natural place — "View all completed" as a text link next to the "Active Jobs" heading. Alternatively, the sidebar navigation in the dashboard layout.
**Warning signs:** Manual URL entry works, but there is no way for a user to discover the page without being told the URL.

### Pitfall 5: Sort Direction Default for Completed Jobs
**What goes wrong:** `ActiveJobsTable` defaults to `sortCol = 'daysOpen'` and `sortDir = 'desc'`. For completed jobs, "Days Open" is `durationDays` (filled for completed jobs), which sorts correctly. This is fine — the default sort behavior is appropriate.
**Why it happens:** Not a problem, just a verification point.
**How to avoid:** No action needed. Confirm that `job.durationDays` is non-null for completed jobs (it is — the Airtable `'Duration (Days, If Completed)'` field is populated when `isCompleted === true`). `getDaysOpen()` in `active-jobs-table.tsx` uses `job.startDate` for the calculation, not `durationDays`.
**Warning signs:** All Days Open cells show `'---'` for completed jobs — this means `startDate` is null on the jobs. If that occurs, the fallback to `durationDays` may need to be added.

### Pitfall 6: Route Authorization
**What goes wrong:** The `/property/completed-jobs` route is under `/property/**`. The middleware's `ROLE_ALLOWED_ROUTES` already permits `pm`, `rm`, and `exec` to access `/property` routes. No middleware change is needed.
**Why it happens:** Concern that a new route might require explicit allowlisting.
**How to avoid:** Verify `ROLE_ALLOWED_ROUTES` in `src/lib/types/auth.ts` — confirmed: all three roles allow `/property`. The new subroute is covered by `path.startsWith('/property')`.
**Warning signs:** 302 redirect to `/executive` when an exec visits the page — would indicate the route check is failing.

---

## Code Examples

Verified patterns from existing codebase:

### ActiveJobsTable Props Interface (the component to reuse)
```typescript
// Source: src/app/(dashboard)/property/_components/active-jobs-table.tsx line 22-24
interface ActiveJobsTableProps {
  jobs: (Job & { unitNumber?: string; turnRequestId?: number })[]
}
// Accepts any Job array — add propertyName to the intersection type if needed for filtering display
```

### ActiveJobs — Template for CompletedJobs
```typescript
// Source: src/app/(dashboard)/property/_components/active-jobs.tsx
// CompletedJobs follows the same structure but:
// 1. Removes: .filter((tr) => tr.status !== 'Done')  (include all turns)
// 2. Changes: .filter((j) => { s !== 'Completed' && s !== 'Invoice Sent' && s !== 'Scheduled' })
//        TO:  .filter((j) => j.isCompleted)
// 3. Adds: propertyName to the job augmentation object
// 4. Passes to CompletedJobsClient instead of ActiveJobsTable directly
```

### PropertyMultiSelect Usage Pattern (from Off Market entry)
```typescript
// Source: src/components/ui/property-multi-select.tsx lines 29-36
export interface PropertyMultiSelectProps {
  properties: PropertyOption[]
  selected: PropertyOption[]
  onChange: (selected: PropertyOption[]) => void
  mode?: 'single' | 'multi'          // default: 'multi'
  onCreateProperty?: (data: NewPropertyData) => Promise<PropertyOption>  // omit for read-only filter
  placeholder?: string
}
// Usage: <PropertyMultiSelect properties={opts} selected={sel} onChange={setSel} placeholder="Filter by property" />
```

### Auth Pattern (copy from property/page.tsx)
```typescript
// Source: src/app/(dashboard)/property/page.tsx lines 16-24
const supabase = await createClient()
const { data: { user } } = await supabase.auth.getUser()
if (!user) { redirect('/login') }
const assignedProperties: string[] = user.app_metadata?.property_ids ?? []
const role: string = user.app_metadata?.role ?? 'pm'
```

### Job isCompleted Field (confirmed in mapper)
```typescript
// Source: src/lib/airtable/tables/mappers.ts line 42
isCompleted: Boolean(f['Is Completed']),
// Airtable field: 'Is Completed' (checkbox) — true for completed jobs
```

### Job propertyName Field (available for property filtering)
```typescript
// Source: src/lib/airtable/tables/mappers.ts line 36
propertyName: f['Property Name'] ? String(f['Property Name']) : null,
// Also available on TurnRequest (tr.propertyName) — use tr.propertyName as more reliable
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `router.refresh()` after writes | `revalidateTag` in server action | Phase 3 | Not directly relevant — this page is read-only |
| `unstable_cache` | `use cache` directive | Next.js 15 Phase 3 | All data fetching uses `use cache` |
| Synchronous `params` in dynamic routes | `await params` (Promise) | Next.js 15 | No dynamic segments on this page — not applicable |
| Separate job fetch | Jobs resolved via `resolveLinkedJobs` in turn-request fetch | Phase 3 | Do not call `fetchJobs()` directly |

---

## Open Questions

1. **Navigation entry point — where to link to /property/completed-jobs**
   - What we know: Requirements say "any user can navigate to" the page; no UI location is specified
   - What's unclear: Sidebar nav, Active Jobs table header link, or both?
   - Recommendation: Add a "View completed jobs" link in the `active-jobs-table.tsx` card header as the minimal viable navigation. If a sidebar nav exists, add there too.

2. **PropertyMultiSelect — hide or show when user has only one property**
   - What we know: PM dashboard hides the property selector when `assignedProperties.length <= 1`; for this page, the filter list is derived from actual completed jobs, not assigned properties
   - What's unclear: Should the filter hide when there is only one distinct property in the completed jobs list, or always show?
   - Recommendation: Hide the filter when `propertyOptions.length <= 1` (consistent with PM dashboard behavior). A single-property PM needs no filter.

3. **Page layout — standalone or wrapped in PMDashboard shell**
   - What we know: `PMDashboard` provides the property selector and header for the PM page; the layout at `(dashboard)/layout.tsx` provides the shell
   - What's unclear: Whether the Completed Jobs page should share the `PMDashboard` wrapper (and thus show the single-property selector in the header) or be a standalone page
   - Recommendation: Do NOT wrap in `PMDashboard`. Build a minimal standalone page header within the route page. `PMDashboard` is tightly coupled to the Active/Turn workflow. The `(dashboard)/layout.tsx` outer shell is still active.

---

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest 4.0.18 + @testing-library/react |
| Config file | `vitest.config.ts` (root) |
| Quick run command | `npx vitest run src/components/ui/__tests__/property-multi-select.test.tsx` |
| Full suite command | `npm test` |

### Phase Requirements -> Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| COMP-01 | Page renders without auth redirect when user is present | manual smoke | `npm run dev` + visit `/property/completed-jobs` | N/A — page file is new |
| COMP-02 | PropertyMultiSelect filters completed jobs to selected properties | unit | `npx vitest run src/components/ui/__tests__/property-multi-select.test.tsx` | ✅ (existing tests cover component; filter logic in `CompletedJobsClient` needs manual smoke) |
| COMP-03 | `CompletedJobs` fetches all turns and filters jobs by `isCompleted === true` | unit | `npx vitest run` | ❌ Wave 0 — logic is in server component; test as pure filter function |

### Sampling Rate
- **Per task commit:** `npx tsc --noEmit --pretty 2>&1 | head -20`
- **Per wave merge:** `npm test`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] No new test files required for the pure logic — the `isCompleted` filter and `useMemo` filter are both simple. If the planner adds a unit test for the `CompletedJobsClient` filter logic, add `src/app/(dashboard)/property/completed-jobs/_components/completed-jobs-client.test.tsx`.
- [ ] Existing `property-multi-select.test.tsx` covers COMP-02 component behavior — no new tests needed for the component itself.

*(Primarily smoke-testable — the key logic is a one-liner filter delegating to existing tested components.)*

---

## Sources

### Primary (HIGH confidence)
- Direct codebase read: `src/app/(dashboard)/property/_components/active-jobs-table.tsx` — exact component interface confirmed; columns and sort behavior verified
- Direct codebase read: `src/app/(dashboard)/property/_components/active-jobs.tsx` — fetch pattern, job augmentation, deduplication, in-flight filter confirmed
- Direct codebase read: `src/app/(dashboard)/property/page.tsx` — auth pattern confirmed; Suspense structure confirmed
- Direct codebase read: `src/components/ui/property-multi-select.tsx` — `PropertyMultiSelectProps` interface confirmed; `onCreateProperty` is optional
- Direct codebase read: `src/lib/types/airtable.ts` — `Job.isCompleted: boolean` confirmed; `Job.propertyName: string | null` confirmed
- Direct codebase read: `src/lib/airtable/tables/mappers.ts` — `isCompleted: Boolean(f['Is Completed'])` confirmed; `propertyName: f['Property Name']` confirmed
- Direct codebase read: `src/lib/types/auth.ts` — `ROLE_ALLOWED_ROUTES` confirmed; all three roles allow `/property/**`
- Direct codebase read: `src/lib/airtable/tables/turn-requests.ts` — `fetchTurnRequestsForUser` confirmed; jobs already resolved in the cached result
- Direct codebase read: `.planning/config.json` — `nyquist_validation: true` — Validation Architecture section required

### Secondary (MEDIUM confidence)
- Phase 13 Research + Plan 03 — `ActiveJobsTable` column list and sort behavior verified; reuse confirmed as the intended pattern per COMP-03 requirement text

### Tertiary (LOW confidence)
- None

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — no new dependencies; all libraries verified in codebase
- Architecture: HIGH — `CompletedJobs` server component is a direct variant of `ActiveJobs`; `CompletedJobsClient` follows `useState` + `useMemo` standard React pattern
- PropertyMultiSelect integration: HIGH — component interface verified; `onCreateProperty` confirmed optional
- Open questions: LOW — navigation entry point and layout choice are unspecified product decisions; flagged for planner to resolve

**Research date:** 2026-03-19
**Valid until:** 2026-04-19 (stable stack; Next.js 15 and React 19 APIs settled; Airtable schema unchanged)
