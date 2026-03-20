---
phase: 13-pm-dashboard-redesign
verified: 2026-03-19T18:10:00Z
status: human_needed
score: 13/13 must-haves verified
human_verification:
  - test: "Navigate to /property and verify 6 KPI boxes render with correct labels in 3x2 grid"
    expected: "Row 1: Active Turns, Avg Turn Time, Revenue Exposure. Row 2: Completed This Period, Jobs In Progress, Turns Near Deadline. Alert coloring active when values > 0."
    why_human: "Visual rendering, variant color application, and grid layout require visual inspection"
  - test: "Click date input on an Open Turn row, select a date, click elsewhere (blur)"
    expected: "Toast 'Lease-ready date updated' appears; date persists after page refresh"
    why_human: "Optimistic update flow, Airtable write, and cache bust require live environment to verify end-to-end"
  - test: "Use the Status dropdown on any turn and select Done"
    expected: "Turn disappears from the Open Turns list; toast confirms the action"
    why_human: "Cache invalidation and server re-render post-Done requires live session"
  - test: "Scroll below Open Turns and verify Active Jobs section renders"
    expected: "Table shows Vendor, Status, Days Open, Start Date, End Date, Unit, Turn columns. Empty state shows 'No active jobs' copy."
    why_human: "Active Jobs section placement and table column set require visual inspection"
  - test: "Click Vendor column header in Active Jobs; click Days Open header twice"
    expected: "Vendor sort: chevron indicator appears, rows reorder alphabetically. Days Open: first click sorts desc, second click sorts asc."
    why_human: "Sort direction toggle and ChevronUp/ChevronDown rendering require interactive testing"
  - test: "Revenue Exposure KPI footnote — with at least one active turn missing targetDate"
    expected: "Text '{N} turn(s) excluded (no target date)' appears inside the KPI card below a border-t separator"
    why_human: "Footer rendering inside KPICard and data-dependent conditional display require real Airtable data"
---

# Phase 13: PM Dashboard Redesign Verification Report

**Phase Goal:** Replace the PM dashboard KPI cards and turn list with redesigned metrics, inline lease-ready date editing, and an Active Jobs section.
**Verified:** 2026-03-19T18:10:00Z
**Status:** human_needed
**Re-verification:** No — initial verification

---

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | computePMKPIs returns new 7-field PMKPIResult (completedThisPeriod, jobsInProgress, revenueExposure, revenueExposureExcludedCount, turnsNearDeadline) | VERIFIED | `src/lib/kpis/pm-kpis.ts` lines 15-23 define the exact 7-field interface |
| 2 | Revenue Exposure formula calculates $60/day over target correctly | VERIFIED | `pm-kpis.ts` lines 77-85 implement the formula; 39/39 tests pass including explicit `$60/day over target` test case |
| 3 | Turns Near Deadline counts active turns within 3 days of targetDate | VERIFIED | `pm-kpis.ts` lines 99-104 implement the [todayStart, todayStart+3days] inclusive window; test coverage confirmed |
| 4 | Jobs In Progress counts ALL non-completed jobs (!j.isCompleted) from active turns with deduplication | VERIFIED | `pm-kpis.ts` lines 68-70; uses `!j.isCompleted` filter; deduplicated via Map by jobId |
| 5 | All existing tests updated, no references to old field names in code | VERIFIED | Old field names (`completedLast30d`, `completedLast7d`, `projectedSpendMTD`, `pastTargetCount`) appear only in comments |
| 6 | updateLeaseReadyDate server action writes Ready To Lease Date and busts 3 cache tags | VERIFIED | `src/app/actions/lease-ready-date.ts` lines 25-30: updates Airtable field, busts `turnRequest(id)`, `turnRequests`, and `kpis` tags |
| 7 | LeaseReadyDateInput shows date input, saves on blur, reverts on failure, shows toast | VERIFIED | `lease-ready-date-input.tsx` lines 18-31: onBlur handler with useOptimistic revert and toast.success/toast.error |
| 8 | ActiveJobsTable renders jobs with sorting by vendor, status, and days open | VERIFIED | `active-jobs-table.tsx` lines 26-56: 3-column sort with ChevronUp/ChevronDown indicators |
| 9 | ActiveJobs server component flattens, deduplicates, and filters in-flight jobs from active turns | VERIFIED | `active-jobs.tsx` lines 13-36: flatMap, Map deduplication, excludes Completed/Invoice Sent/Scheduled; Ready included |
| 10 | PM dashboard shows 6 KPI boxes in correct order with correct labels and alert variants | VERIFIED | `pm-kpis.tsx` lines 37-77: all 6 labels present, correct variant conditions |
| 11 | Revenue Exposure KPI has footnote showing excluded count when > 0 (rendered inside card) | VERIFIED | `pm-kpis.tsx` lines 52-58: uses `footer` prop on KPICard; `kpi-card.tsx` lines 81-85 render it inside card with border-t separator |
| 12 | Open Turns table has inline LeaseReadyDateInput; columns unchanged (no Age column) | VERIFIED | `pm-turn-list.tsx` line 95: `<LeaseReadyDateInput>` in Ready To Lease cell; headers are Property, Unit, Status, Ready To Lease, Off Market Date, Jobs, Price — no Age column |
| 13 | Active Jobs section appears below Open Turns on the PM dashboard page | VERIFIED | `page.tsx` line 49-51: third Suspense block `<ActiveJobs>` added after PMTurnList block |

**Score:** 13/13 truths verified

---

## Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `src/lib/kpis/pm-kpis.ts` | Updated PMKPIResult interface and computePMKPIs function | VERIFIED | 116 lines; exports PMKPIResult, computePMKPIs, REVENUE_EXPOSURE_RATE_PER_DAY, NEAR_DEADLINE_DAYS, COMPLETED_PERIOD_DAYS |
| `src/lib/kpis/pm-kpis.test.ts` | Unit tests for all 7 KPI fields | VERIFIED | 39 tests; all pass; tests new field names only |
| `src/app/actions/lease-ready-date.ts` | updateLeaseReadyDate server action | VERIFIED | 37 lines; 'use server'; exports updateLeaseReadyDate; writes 'Ready To Lease Date' |
| `src/app/(dashboard)/property/_components/lease-ready-date-input.tsx` | Client component for inline date editing | VERIFIED | 45 lines; 'use client'; exports LeaseReadyDateInput; uses useOptimistic + onBlur + toast |
| `src/app/(dashboard)/property/_components/active-jobs-table.tsx` | Client component for sortable jobs table | VERIFIED | 181 lines; 'use client'; exports ActiveJobsTable; 3 sortable cols with chevrons; includes JobStatusDropdown and JobDateInput columns (plan deviation — enhanced beyond spec) |
| `src/app/(dashboard)/property/_components/active-jobs.tsx` | Server component for fetching and filtering jobs | VERIFIED | 37 lines; exports ActiveJobs; calls fetchTurnRequestsForUser; deduplicates; filters |
| `src/app/(dashboard)/property/_components/pm-kpis.tsx` | 6 KPI boxes with new fields, Revenue Exposure footnote | VERIFIED | 80 lines; all 6 labels present; footer prop used for excluded count |
| `src/app/(dashboard)/property/_components/pm-turn-list.tsx` | Open Turns with LeaseReadyDateInput | VERIFIED | Contains LeaseReadyDateInput; correct columns; updated empty state copy |
| `src/app/(dashboard)/property/page.tsx` | Page with Active Jobs Suspense section | VERIFIED | 3 Suspense blocks: kpis, turns, jobs; ActiveJobs imported and rendered |
| `src/components/ui/kpi-card.tsx` | KPICard with footer prop | VERIFIED | Lines 15, 81-85: footer?: React.ReactNode; rendered inside card with border-t separator |
| `src/app/(dashboard)/property/_components/job-date-input.tsx` | JobDateInput for inline job date editing | VERIFIED | 62 lines (plan deviation — added during Fix 2); mirrors LeaseReadyDateInput pattern |
| `src/app/actions/job-dates.ts` | Server action for job start/end dates | VERIFIED (existence) | Present on disk (plan deviation — added during Fix 2) |

---

## Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `pm-kpis.ts` | `airtable.ts` | `import type { TurnRequest }` | WIRED | Line 5: `import type { TurnRequest } from '@/lib/types/airtable'` |
| `pm-kpis.tsx` | `pm-kpis.ts` | `kpis.revenueExposure` used in render | WIRED | Line 10 import; lines 32, 51, 53 use revenueExposure and revenueExposureExcludedCount |
| `lease-ready-date-input.tsx` | `lease-ready-date.ts` | `import updateLeaseReadyDate` | WIRED | Line 5: `import { updateLeaseReadyDate } from '@/app/actions/lease-ready-date'` |
| `active-jobs.tsx` | `active-jobs-table.tsx` | `<ActiveJobsTable jobs={inflightJobs} />` | WIRED | Line 2 import; line 36 renders with filtered jobs array |
| `lease-ready-date.ts` | `cache-tags.ts` | `revalidateTag(CACHE_TAGS.*)` | WIRED | Lines 28-30: busts turnRequest, turnRequests, and kpis tags |
| `pm-turn-list.tsx` | `lease-ready-date-input.tsx` | `<LeaseReadyDateInput>` per row | WIRED | Line 18 import; line 95: `<LeaseReadyDateInput requestId={turn.requestId} currentDate={turn.readyToLeaseDate} />` |
| `page.tsx` | `active-jobs.tsx` | `<ActiveJobs>` in Suspense | WIRED | Line 9 import; line 50: `<ActiveJobs assignedProperties={effectiveProperties} role={role} />` |

---

## Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|------------|-------------|--------|----------|
| PMDB-01 | Plan 01, Plan 03 | PM dashboard displays 6 KPI boxes | SATISFIED | pm-kpis.tsx renders all 6: Active Turns, Avg Turn Time, Revenue Exposure, Completed This Period, Jobs In Progress, Turns Near Deadline |
| PMDB-02 | Plan 03 | PM can view Open Turns list with turn age and status visible | SATISFIED | pm-turn-list.tsx: Off Market Date column shows turn age; Status column shows TurnStatusDropdown; no Age column required per CONTEXT.md locked decision |
| PMDB-03 | Plan 02, Plan 03 | PM can enter lease-ready date inline on each Open Turn row | SATISFIED | LeaseReadyDateInput wired in TurnTableRows; blur-triggered server action; optimistic update; toast feedback |
| PMDB-04 | Plan 03 | PM can mark a turn as Done via inline button | SATISFIED | TurnStatusDropdown (pre-existing) has `TURN_STATUSES = ['Done', 'In progress']`; no new code needed per CONTEXT.md |
| PMDB-05 | Plan 02, Plan 03 | PM can view Active Jobs table sortable by vendor, status, days open | SATISFIED | ActiveJobsTable with 3 sortable columns; ActiveJobs mounts on page in Suspense |
| PMDB-06 | Plan 01, Plan 03 | Revenue Exposure KPI with $60/day formula and excluded turn count | SATISFIED | pm-kpis.ts implements formula; pm-kpis.tsx renders footnote via KPICard footer prop |

All 6 requirements assigned to Phase 13 are satisfied. No orphaned requirements found.

---

## Anti-Patterns Found

| File | Pattern | Severity | Impact |
|------|---------|----------|--------|
| `lease-ready-date.ts` line 28 | `revalidateTag(..., { expire: 0 })` — `expire` option not in standard Next.js revalidateTag API signature | Info | Consistent with existing `turn-request-status.ts` which uses the same pattern; likely a project-specific extension or benign extra arg that Next.js ignores |

No blockers or warnings found. No TODO/FIXME/placeholder comments in phase files. No empty implementations. No stubs.

---

## Human Verification Required

### 1. 6 KPI Box Visual Rendering

**Test:** Navigate to /property and inspect the KPI section.
**Expected:** 3x2 grid. Row 1: Active Turns (home icon), Avg Turn Time (clock icon), Revenue Exposure (dollar icon with alert-past background if value > 0). Row 2: Completed This Period (check circle), Jobs In Progress (briefcase), Turns Near Deadline (alert triangle with alert-trending background if value > 0).
**Why human:** Alert variant colors, icon rendering, and grid layout require visual inspection in browser.

### 2. Inline Lease-Ready Date Edit (End-to-End)

**Test:** Click into the date input on any Open Turn row, select a date, click outside the input.
**Expected:** Optimistic update shows new date immediately; toast "Lease-ready date updated" appears; after page refresh the date persists (confirming Airtable write + cache bust worked).
**Why human:** Requires live Airtable connection; optimistic revert path (if Airtable fails) also needs manual testing.

### 3. Mark Turn as Done

**Test:** Open the Status dropdown on any turn in Open Turns, select "Done".
**Expected:** Turn disappears from the list (cache busted, server re-renders without it); toast confirms the action.
**Why human:** Cache invalidation behavior requires live session to confirm.

### 4. Active Jobs Section Presence and Column Set

**Test:** Scroll below Open Turns on the PM dashboard.
**Expected:** "Active Jobs" section with table columns: Vendor, Status, Days Open, Start Date, End Date, Unit, Turn. Empty state shows "No active jobs" and subtext "There are no in-flight jobs across your open turns."
**Why human:** Visual confirmation of section placement and exact column set requires browser inspection.

### 5. Active Jobs Table Sort Interaction

**Test:** Click the "Vendor" column header, then click "Days Open" column header twice.
**Expected:** Vendor click: ChevronUp or ChevronDown appears next to "Vendor", rows sort alphabetically. Days Open: first click shows desc chevron (highest first), second click toggles to asc.
**Why human:** Interactive sort state and chevron direction require live browser testing.

### 6. Revenue Exposure Footnote Inside Card

**Test:** With at least one active turn that has no target date set, observe the Revenue Exposure KPI card.
**Expected:** Text "{N} turn(s) excluded (no target date)" appears inside the KPI card below a thin separator line (not outside the card).
**Why human:** Conditional rendering depends on real data; KPICard footer position (inside vs. outside card bounds) requires visual confirmation.

---

## Gaps Summary

No gaps found. All 13 observable truths are verified in the codebase. All 6 phase requirements (PMDB-01 through PMDB-06) are satisfied by concrete implementation. The phase delivered two bonus artifacts beyond the original plan scope (`job-date-input.tsx` and `job-dates.ts`) that enable inline job date editing in the Active Jobs table — these are enhancements, not gaps.

Automated verification is complete. The remaining items are human verification for visual rendering, interactive behavior, and end-to-end Airtable integration that cannot be confirmed programmatically.

---

_Verified: 2026-03-19T18:10:00Z_
_Verifier: Claude (gsd-verifier)_
