---
phase: 05-property-manager-view
verified: 2026-03-14T17:10:00Z
status: human_needed
score: 14/14 automated must-haves verified
re_verification: false
human_verification:
  - test: "Open /property as a PM with multiple properties and confirm the property selector appears. Select one property and verify both KPI cards and the turn list both update to show only that property's data."
    expected: "KPIs and turn list both reflect the selected property. Selecting 'All Properties' restores combined data. A PM with only one assigned property sees no selector."
    why_human: "URL-driven filter update requires browser rendering. Suspense remount behavior is not verifiable statically."
  - test: "Confirm the turn list shows the overdue section (pink header, 'Make Readys Past Target Time') above the on-schedule section when at least one turn has daysVacantUntilReady > 10. Confirm the overdue section is absent when no such turns exist."
    expected: "Overdue section appears first with pink header styling. It is completely absent (no empty card) when no overdue turns exist."
    why_human: "Conditional section rendering and pink header colour depend on live Airtable data and computed CSS."
  - test: "In the turn list Status column, click the interactive dropdown for a turn request and change its status. Verify optimistic update, toast success message ('Turn #N updated to Status'), and that the change persists after a page refresh."
    expected: "Status pill updates instantly. Toast appears and auto-dismisses in 3 s. On refresh the new status is shown."
    why_human: "Optimistic UI, server action round-trip, and Airtable write cannot be verified statically."
  - test: "In the turn list Jobs column, click one of the green badge pills (e.g. '#42'). Verify it navigates to /property/job/42 showing the job detail page with all fields: Vendor Name, Vendor Type, Status dropdown, Start Date, End Date, Price, Duration, Delta, Request Type."
    expected: "Job detail page loads. JobStatusDropdown is present and functional. Back link leads to the parent turn request (or /property if no parent)."
    why_human: "Navigation, dynamic route resolution, and live data rendering require a browser."
  - test: "Click a turn row (not the status dropdown, not a job pill) and verify it navigates to /property/turn/[id]. Verify clicking the status dropdown or a job pill does NOT trigger row navigation."
    expected: "Row click goes to turn detail. Dropdown and job pill clicks are intercepted by stopPropagation and do not trigger navigation."
    why_human: "Click-propagation behaviour requires interactive browser testing."
  - test: "On the turn detail page, change a job's status via the JobStatusDropdown. Verify optimistic update, success toast ('Job #N updated to Status'), and revert + error toast on a forced failure."
    expected: "Status updates inline without page navigation. Toast confirms. On failure status reverts."
    why_human: "Optimistic revert requires triggering a server error, which cannot be done statically."
  - test: "Resize the browser to below 768 px wide. Verify the turn list switches from a table layout to a stacked card layout. Verify job pills still appear in card layout and the turn status dropdown still shows."
    expected: "Table hidden, card list visible on mobile. Job pills are clickable links. TurnStatusDropdown renders in card header."
    why_human: "Responsive CSS breakpoints require a browser viewport."
---

# Phase 05: Property Manager View — Verification Report

**Phase Goal:** Property Managers can see their overdue turns first, drill into job details, and update job statuses inline -- the core "fewer clicks" workflow
**Verified:** 2026-03-14T17:10:00Z
**Status:** human_needed
**Re-verification:** No — initial verification

---

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | computePMKPIs returns correct values for all 6 KPI fields | VERIFIED | 22 unit tests pass (`npx vitest run src/lib/kpis/pm-kpis.test.ts`: 22/22 green) |
| 2 | JobStatusDropdown updates optimistically and reverts on failure | VERIFIED | `job-status-dropdown.tsx` lines 38–79: `useOptimistic` + `useTransition`, success/error toast + `setOptimisticStatus(currentStatus)` revert |
| 3 | Skeleton components render without errors | VERIFIED | `pm-kpi-skeleton.tsx` (6x `KPICard loading=true`), `pm-turn-list-skeleton.tsx` (Card + Skeleton rows) — both substantive, no stubs |
| 4 | PM dashboard page authenticates user and renders PMDashboard | VERIFIED | `property/page.tsx`: `createClient()` + `getUser()` + `redirect('/login')` guard; renders `PMDashboard` with children |
| 5 | Overdue section appears first with pink header; hidden when empty | VERIFIED | `pm-turn-list.tsx` lines 219–226: `{overdue.length > 0 && <TurnSection ... headerClassName="bg-alert-past-target ...">}` |
| 6 | On-schedule section always visible below overdue | VERIFIED | `pm-turn-list.tsx` lines 229–233: unconditional `<TurnSection title="Active Make Readys (On Schedule)" ...>` |
| 7 | Turn list shows all PM-03 columns (Property, Unit, Status, RTL Date, Vacant Date, Jobs, Price) | VERIFIED | `TurnTableRows` in `pm-turn-list.tsx` lines 76–99: all 7 columns present; desktop `TableHead` list lines 173–180 confirms headers |
| 8 | Property filter (PropertySelector) hidden when PM has only one property | VERIFIED | `pm-dashboard.tsx` line 45: `{assignedProperties.length > 1 && (<PropertySelector ...>)}` |
| 9 | KPI cards: 6 metrics in 3x2 grid; Past Target Time uses alert-past variant when count > 0 | VERIFIED | `pm-kpis.tsx` lines 34–68: grid `sm:grid-cols-3`, 6 `KPICard`s; line 67: `variant={kpis.pastTargetCount > 0 ? 'alert-past' : 'default'}` |
| 10 | Turn rows navigate to /property/turn/[id] via ClickableTurnRow | VERIFIED | `pm-turn-list.tsx` line 80: `<ClickableTurnRow href={'/property/turn/${turn.requestId}'}>`; `clickable-turn-row.tsx`: `router.push(href)` on click |
| 11 | Turn list Status column shows TurnStatusDropdown (interactive); Jobs column shows clickable badge pills linking to /property/job/[id] | VERIFIED | `pm-turn-list.tsx` line 87: `<TurnStatusDropdown requestId={turn.requestId} ...>`; `JobsCell` lines 52–58: `<Link href={'/property/job/${job.jobId}'}>`; stopPropagation on wrapper div |
| 12 | Turn detail page at /property/turn/[id] with auth, notFound, turn header + jobs table | VERIFIED | `turn/[id]/page.tsx`: async params, auth guard, `parseInt` + `notFound()`, `fetchTurnRequestById`, renders `TurnDetailView`; `turn-detail-view.tsx`: full header card + jobs table with all PM-07 columns + `JobStatusDropdown` per job |
| 13 | Job detail page at /property/job/[id] with full job info and JobStatusDropdown | VERIFIED | `job/[id]/page.tsx`: auth, `fetchJobById`, `notFound()`; `job-detail-view.tsx`: 8-field grid, `JobStatusDropdown`, turn request back-link |
| 14 | Mobile card layout for turn list and job badge pills in mobile view | VERIFIED | `pm-turn-list.tsx` lines 189–193: `div.md:hidden` rendering `TurnCard`; `TurnCard` uses `MobileJobsList`; `mobile-jobs-list.tsx`: Link badge pills to `/property/job/${job.jobId}` with stopPropagation |

**Score:** 14/14 truths verified (automated)

---

### Required Artifacts

| Artifact | Plan | Status | Details |
|----------|------|--------|---------|
| `src/lib/kpis/pm-kpis.ts` | 01 | VERIFIED | 94 lines; exports `PMKPIResult` interface and `computePMKPIs`; imports `TurnRequest` from airtable types |
| `src/lib/kpis/pm-kpis.test.ts` | 01 | VERIFIED | 255 lines; 22 tests; fake timers; covers all 6 KPI fields + edge cases |
| `src/app/(dashboard)/property/_components/job-status-dropdown.tsx` | 01 | VERIFIED | 143 lines; `"use client"`; `useOptimistic` + `useTransition`; portal dropdown; `stopPropagation`; Sonner toasts; calls `updateJobStatus` |
| `src/app/(dashboard)/property/_components/pm-kpi-skeleton.tsx` | 01 | VERIFIED | 18 lines; exports `PMKPISkeleton`; 6x `KPICard loading=true` in 3-col grid |
| `src/app/(dashboard)/property/_components/pm-turn-list-skeleton.tsx` | 01 | VERIFIED | 17 lines; exports `PMTurnListSkeleton`; Card + Skeleton header + 5 row skeletons |
| `src/app/(dashboard)/property/page.tsx` | 02 | VERIFIED | 49 lines; auth guard; URL searchParams property filter; `PMDashboard` + keyed `Suspense` boundaries for `PMKPIs` and `PMTurnList` |
| `src/app/(dashboard)/property/_components/pm-dashboard.tsx` | 02 | VERIFIED | 59 lines; `"use client"`; exports `PMDashboard`; `PropertySelector` gated on `assignedProperties.length > 1`; URL-driven filter via `useSearchParams` + `router.push` |
| `src/app/(dashboard)/property/_components/pm-kpis.tsx` | 02 | VERIFIED | 70 lines; exports `PMKPIs`; async server component; calls `fetchTurnRequestsForUser` + `computePMKPIs`; 6 KPI cards |
| `src/app/(dashboard)/property/_components/pm-turn-list.tsx` | 02 | VERIFIED | 235 lines; exports `PMTurnList`; async server component; overdue/on-schedule partition; `TurnStatusDropdown` in Status column; `JobsCell` with badge pill Links; `ClickableTurnRow`; dual desktop/mobile layout |
| `src/app/(dashboard)/property/turn/[id]/page.tsx` | 03 | VERIFIED | 33 lines; async params (Next.js 15 pattern); auth + `fetchTurnRequestById` + `notFound()`; renders `TurnDetailView` |
| `src/app/(dashboard)/property/turn/[id]/_components/turn-detail-view.tsx` | 03 | VERIFIED | 224 lines; exports `TurnDetailView`; back link; turn header card; jobs Table with all PM-07 columns; `JobStatusDropdown` per job row; Job ID links to `/property/job/[id]`; mobile `JobCard` |
| `src/app/actions/turn-request-status.ts` | 04 | VERIFIED | 48 lines; `"use server"`; `updateTurnRequestStatus`; validates against `TURN_REQUEST_STATUSES`; Airtable select + update; busts 3 cache tags |
| `src/app/(dashboard)/property/_components/turn-status-dropdown.tsx` | 04 | VERIFIED | 139 lines; `"use client"`; exports `TurnStatusDropdown`; mirrors `JobStatusDropdown` pattern exactly; portal dropdown; `useOptimistic` + `useTransition`; `stopPropagation` |
| `src/app/(dashboard)/property/job/[id]/page.tsx` | 04 | VERIFIED | 33 lines; async params; auth + `fetchJobById` + `notFound()`; renders `JobDetailView` |
| `src/app/(dashboard)/property/job/[id]/_components/job-detail-view.tsx` | 04 | VERIFIED | 157 lines; exports `JobDetailView`; `JobStatusDropdown` in header; 8-field detail grid; turn request back-link card |
| `src/app/(dashboard)/property/_components/mobile-jobs-list.tsx` | 04 | VERIFIED | 21 lines; server component (no `"use client"`); Link badge pills to `/property/job/${job.jobId}`; `stopPropagation` on wrapper |
| `src/app/(dashboard)/property/_components/clickable-turn-row.tsx` | 02 | VERIFIED | 23 lines; `"use client"`; `router.push(href)` on `TableRow` click |

---

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `pm-kpis.tsx` | `pm-kpis.ts` | `computePMKPIs` | WIRED | Line 10: `import { computePMKPIs } from '@/lib/kpis/pm-kpis'`; line 20: `computePMKPIs(turnRequests)` called |
| `pm-kpis.tsx` | `turn-requests.ts` | `fetchTurnRequestsForUser` | WIRED | Line 9: import; line 19: `await fetchTurnRequestsForUser(...)` |
| `pm-turn-list.tsx` | `turn-requests.ts` | `fetchTurnRequestsForUser` | WIRED | Line 2: import; line 201: `await fetchTurnRequestsForUser(...)` |
| `pm-turn-list.tsx` | `turn-status-dropdown.tsx` | `TurnStatusDropdown` | WIRED | Line 15: import; line 87 + 109: rendered in Status column (desktop + mobile card) |
| `pm-turn-list.tsx` | `/property/job/[id]` | `Link href` in `JobsCell` | WIRED | Lines 52–58: `<Link href={'/property/job/${job.jobId}'}>`; also fallback badge links to turn |
| `pm-dashboard.tsx` | `property-selector.tsx` | `PropertySelector` | WIRED | Line 4: import; line 47: `<PropertySelector ...>` rendered when multi-property |
| `turn/[id]/page.tsx` | `turn-requests.ts` | `fetchTurnRequestById` | WIRED | Line 3: import; line 27: `await fetchTurnRequestById(requestId)` |
| `turn-detail-view.tsx` | `job-status-dropdown.tsx` | `JobStatusDropdown` | WIRED | Line 13: import; lines 195–199 + 55–59: rendered per job in desktop table and mobile card |
| `turn-detail-view.tsx` | `/property/job/[id]` | `Link href` on Job ID | WIRED | Lines 188–190: `<Link href={'/property/job/${job.jobId}'}>`; also mobile `JobCard` line 52 |
| `turn-status-dropdown.tsx` | `turn-request-status.ts` | `updateTurnRequestStatus` | WIRED | Line 8: import; line 67: `await updateTurnRequestStatus(requestId, newStatus)` |
| `job/[id]/page.tsx` | `jobs.ts` | `fetchJobById` | WIRED | Line 3: import; line 27: `await fetchJobById(jobId)` |
| `job-detail-view.tsx` | `job-status-dropdown.tsx` | `JobStatusDropdown` | WIRED | Line 4: import; line 56: `<JobStatusDropdown jobId={job.jobId} ...>` |
| `pm-kpis.ts` | `airtable.ts` | `TurnRequest` type | WIRED | Line 5: `import type { TurnRequest } from '@/lib/types/airtable'` |
| `job-status-dropdown.tsx` | `job-status.ts` | `updateJobStatus` | WIRED | Line 8: import; line 71: `await updateJobStatus(jobId, turnRequestId, newStatus)` |

---

### Requirements Coverage

| Requirement | Source Plan(s) | Description | Status | Evidence |
|-------------|---------------|-------------|--------|----------|
| PM-01 | 01, 02, 04 | Overdue turns displayed first with distinct section | SATISFIED | `pm-turn-list.tsx`: overdue section rendered first, `bg-alert-past-target` header, hidden when empty |
| PM-02 | 01, 02, 04 | On-schedule turns section below overdue | SATISFIED | `pm-turn-list.tsx`: unconditional `TurnSection` "Active Make Readys (On Schedule)" |
| PM-03 | 01, 02, 04 | Turn list columns: Property (badge), Unit, Status (interactive), RTL Date, Vacant Date, Jobs (linked IDs), Price | SATISFIED | `TurnTableRows`: Badge, unitNumber, `TurnStatusDropdown`, formatDate x2, `JobsCell` (badge pill Links), `formatPrice` |
| PM-04 | 01, 02, 04 | Property filter dropdown for multi-property PMs | SATISFIED | `pm-dashboard.tsx`: `PropertySelector` gated on `assignedProperties.length > 1`; URL-driven filter via `searchParams` |
| PM-05 | 01 | KPI cards: Active Make Readys, Completed 30d, Completed 7d | SATISFIED | `pm-kpis.ts`: `activeMakeReadys`, `completedLast30d`, `completedLast7d` computed and unit-tested; `pm-kpis.tsx`: 3 cards rendered |
| PM-06 | 01 | KPI cards: Avg Make Ready Time, Projected Spend MTD, Past Target Time (pink) | SATISFIED | `pm-kpis.ts`: `avgMakeReadyTime`, `projectedSpendMTD`, `pastTargetCount`; `pm-kpis.tsx`: alert-past variant when count > 0 |
| PM-07 | 03, 04 | Turn detail page: all jobs with Job ID, Vendor, Type, Status, Start/End dates, Price | SATISFIED | `turn-detail-view.tsx` desktop table: 7 columns confirmed in `TableHead` rows 175–181; Job ID links to job detail |
| PM-08 | 03, 04 | Inline job status update from turn detail without navigation | SATISFIED | `turn-detail-view.tsx`: `JobStatusDropdown` per job row; optimistic update + toast feedback in `job-status-dropdown.tsx` |
| PM-09 | 01 | Loading skeleton states for KPI grid and turn list | SATISFIED | `PMKPISkeleton` (6x KPICard loading=true in 3-col grid) + `PMTurnListSkeleton` (header + 5 row skeletons); both wired as Suspense fallbacks in `page.tsx` |

All 9 requirements satisfied. No orphaned requirements found.

---

### Anti-Patterns Found

None. Full scan of all phase 05 source files found:
- Zero `TODO`, `FIXME`, `XXX`, `HACK`, or `PLACEHOLDER` comments
- Zero empty return stubs (`return null`, `return {}`, `return []`) in component code
- Zero console.log-only implementations
- TypeScript: `npx tsc --noEmit` exits with zero errors

---

### Human Verification Required

The following 7 items require a browser to verify. All automated checks (unit tests, static analysis, wiring grep) pass.

#### 1. Property Filter Updates Both KPIs and Turn List

**Test:** Open `/property` as a PM with multiple assigned properties. Confirm the property selector dropdown appears. Select one property. Verify both KPI cards and the turn list update to reflect only that property. Select "All Properties" and confirm combined data returns. Log in as a PM with a single property and confirm no selector appears.
**Expected:** Both `Suspense` boundaries (keyed on the `property` search param) remount and refetch for the selected scope. Single-property PMs see no selector.
**Why human:** URL-driven Suspense remount requires a live browser. The selector visibility check needs an authenticated multi-property session.

#### 2. Overdue Section Renders First with Pink Header (Live Data)

**Test:** Confirm that with real Airtable data, at least one turn has `daysVacantUntilReady > 10`. Verify the pink "Make Readys Past Target Time" section appears above "Active Make Readys (On Schedule)". Then verify no empty pink section appears when no overdue turns exist.
**Expected:** Pink section with distinct header appears first and only when data warrants it.
**Why human:** Depends on live Airtable data values and CSS colour rendering.

#### 3. TurnStatusDropdown — Optimistic Update and Toast

**Test:** On the PM dashboard turn list, click the Status dropdown for any turn. Change the status. Verify the pill updates instantly (optimistic), and a toast "Turn #N updated to Status" appears and auto-dismisses in 3 seconds. Reload the page and confirm the new status persists.
**Expected:** Optimistic update visible before server response. Persistence confirmed after page reload.
**Why human:** Server action round-trip and Airtable write require a live browser session.

#### 4. Job Badge Pills Navigate to Job Detail Page

**Test:** In the Jobs column of the turn list, click one of the green badge pills (e.g. `#42`). Verify navigation to `/property/job/42`. Confirm the job detail page shows all fields: Vendor Name, Vendor Type, Status dropdown (interactive), Start Date, End Date, Price, Duration, Delta, Request Type. Confirm the back link leads back to the parent turn request.
**Expected:** Job detail page fully populated with `JobStatusDropdown` functional. Back link correct.
**Why human:** Dynamic route resolution and live data rendering require a browser.

#### 5. Click Propagation: Row vs Dropdown vs Job Pill

**Test:** Click a turn row (any area not a dropdown or job pill) and verify navigation to `/property/turn/[id]`. Click the Status dropdown — verify it opens without triggering row navigation. Click a job badge pill — verify it navigates to the job detail page without triggering the turn row navigation.
**Expected:** Three interaction zones are isolated: row click, status dropdown, and job pill each behave independently.
**Why human:** `stopPropagation` interplay with `ClickableTurnRow`'s `router.push` requires interactive browser testing.

#### 6. JobStatusDropdown on Turn Detail — Optimistic Update and Failure Revert

**Test:** On `/property/turn/[id]`, change a job's status via `JobStatusDropdown`. Verify instant optimistic update and success toast "Job #N updated to Status". To test failure revert: temporarily disable network/Airtable and attempt a status change; verify the status reverts to its previous value and an error toast "Failed to update status. Please try again." appears.
**Expected:** Optimistic UI and failure revert work correctly on the turn detail page.
**Why human:** Triggering a server error and observing revert behaviour requires browser interaction.

#### 7. Mobile Responsive Layout

**Test:** Resize to below 768 px or use browser DevTools mobile emulation. On the PM dashboard, confirm the table is replaced by a stacked card list. Confirm turn status dropdowns appear in card headers. Confirm job pills appear in cards and link to `/property/job/[id]`. On the turn detail page, confirm the jobs table is replaced by mobile `JobCard` components.
**Expected:** `hidden md:block` table hidden; `md:hidden` card list visible. All interactivity preserved at mobile viewport.
**Why human:** CSS breakpoint behaviour requires a browser viewport.

---

### Notes on Page Architecture Deviation

`property/page.tsx` implements property filtering via URL `searchParams` rather than the `PMDashboard` client state pattern described in Plan 02. This is a superior approach — the server page reads the `property` query param and passes `effectiveProperties` directly to `PMKPIs` and `PMTurnList`, removing the need to thread filter state through client components. `PMDashboard` became a thinner client shell managing only the `PropertySelector` interaction (URL push). The goal — "PM with multiple properties can filter; KPIs and list both update" — is fully achieved.

---

_Verified: 2026-03-14T17:10:00Z_
_Verifier: Claude (gsd-verifier)_
