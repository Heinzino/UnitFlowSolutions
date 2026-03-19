---
phase: 13-pm-dashboard-redesign
plan: 02
subsystem: property-dashboard
tags: [server-action, client-component, airtable, optimistic-ui, sortable-table]
dependency_graph:
  requires: []
  provides:
    - updateLeaseReadyDate server action
    - LeaseReadyDateInput client component
    - ActiveJobsTable client component
    - ActiveJobs server component
  affects:
    - src/app/(dashboard)/property/page.tsx (consumer in Plan 03)
tech_stack:
  added: []
  patterns:
    - useOptimistic + useTransition + toast for blur-triggered inline editing
    - key prop remount for optimistic revert (RESEARCH.md Pitfall 5)
    - server action patterned on updateTurnRequestStatus with rateLimiter + revalidateTag
    - flatMap + Map deduplication for extracting jobs from turn requests
key_files:
  created:
    - src/app/actions/lease-ready-date.ts
    - src/app/(dashboard)/property/_components/lease-ready-date-input.tsx
    - src/app/(dashboard)/property/_components/active-jobs-table.tsx
    - src/app/(dashboard)/property/_components/active-jobs.tsx
  modified: []
decisions:
  - Ready status jobs included in ActiveJobs per user decision (in-flight workload)
  - Airtable update uses undefined not null to clear date field (SDK constraint)
  - StatusBadge mapping function converts JobStatus strings to Status badge keys
metrics:
  duration_seconds: 158
  completed_date: "2026-03-19"
  tasks_completed: 2
  files_created: 4
  files_modified: 0
---

# Phase 13 Plan 02: New Components for Lease-Ready Date and Active Jobs Summary

**One-liner:** Four new files — server action for Ready To Lease Date, inline date input with optimistic blur-save, and a sortable Active Jobs table with server-side job fetching and deduplication.

## Tasks Completed

| # | Task | Commit | Files |
|---|------|--------|-------|
| 1 | Create updateLeaseReadyDate server action and LeaseReadyDateInput | b78acbd | lease-ready-date.ts, lease-ready-date-input.tsx |
| 2 | Create ActiveJobsTable and ActiveJobs components | a58d40a | active-jobs-table.tsx, active-jobs.tsx |

## Decisions Made

1. **Airtable null clearing:** Used `undefined` instead of `null` when clearing the Ready To Lease Date field. The Airtable SDK's TypeScript types do not accept `null` for field values — `undefined` is the correct way to clear a field.

2. **StatusBadge mapping:** `StatusBadge` component expects `Status` type keys (`'completed'`, `'ready'`, `'attention'`, `'blocked'`, `'in-progress'`), but `Job.status` uses `JobStatus` strings (`'Completed'`, `'Ready'`, etc.). Added `toStatusBadgeStatus()` mapping function in `ActiveJobsTable`.

3. **Ready jobs included:** `ActiveJobs` excludes only `Completed`, `Invoice Sent`, and `Scheduled` statuses. `Ready` status jobs are intentionally included as they represent in-flight workload per CONTEXT.md user decision.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed Airtable SDK null constraint**
- **Found during:** Task 1 TypeScript verification
- **Issue:** `base('Turn Requests').update()` does not accept `null` for field values per TypeScript overloads
- **Fix:** Changed `date ?? null` to `date ?? undefined` for field clearing
- **Files modified:** src/app/actions/lease-ready-date.ts
- **Commit:** b78acbd (inline fix before commit)

**Pre-existing TypeScript errors (out of scope):**
- `src/app/actions/admin.ts:111` — revalidateTag missing profile argument
- `src/app/actions/vacant.ts:74` — same
- `src/components/layout/bottom-tab-bar.tsx:47` — email type constraint
- `src/components/layout/sidebar.tsx:50` — email type constraint
- `src/lib/kpis/pm-kpis.test.ts` — missing exported constants

None of these are in files modified by this plan and none blocked task execution.

## Self-Check: PASSED

All 4 files confirmed on disk. Both task commits (b78acbd, a58d40a) confirmed in git log.
