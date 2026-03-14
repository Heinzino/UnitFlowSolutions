---
phase: 05-property-manager-view
plan: "04"
subsystem: pm-dashboard
tags: [gap-closure, uat, turn-status, job-detail, interactive-dropdown, server-actions]
dependency_graph:
  requires: [05-01, 05-02, 05-03]
  provides: [turn-status-interactive-dropdown, job-detail-page, job-badge-links]
  affects: [pm-turn-list, mobile-jobs-list, turn-detail-view]
tech_stack:
  added: []
  patterns: [useOptimistic, useTransition, portal-dropdown, server-action, optimistic-ui]
key_files:
  created:
    - src/app/actions/turn-request-status.ts
    - src/app/(dashboard)/property/_components/turn-status-dropdown.tsx
    - src/app/(dashboard)/property/job/[id]/page.tsx
    - src/app/(dashboard)/property/job/[id]/_components/job-detail-view.tsx
  modified:
    - src/app/(dashboard)/property/_components/pm-turn-list.tsx
    - src/app/(dashboard)/property/_components/mobile-jobs-list.tsx
    - src/app/(dashboard)/property/turn/[id]/_components/turn-detail-view.tsx
decisions:
  - "[Phase 05-04]: TurnStatusDropdown mirrors JobStatusDropdown pattern exactly — same portal, useOptimistic, stopPropagation wrapper"
  - "[Phase 05-04]: mobile-jobs-list converted from client component to server component — no longer needs useEffect, just renders Links"
  - "[Phase 05-04]: JobsCell stopPropagation on wrapper div prevents ClickableTurnRow navigation when clicking job badge pills"
metrics:
  duration: 3min
  completed: "2026-03-14"
  tasks_completed: 3
  files_modified: 7
requirements: [PM-01, PM-02, PM-03, PM-04, PM-05, PM-06, PM-07, PM-08, PM-09]
---

# Phase 05 Plan 04: UAT Gap Closure — Job Links and Turn Status Dropdown Summary

**One-liner:** Interactive TurnStatusDropdown in Status column, clickable job badge pills linking to new /property/job/[id] detail page, closing UAT test 4 gap.

## What Was Built

Closed the UAT test 4 gap where the Jobs column had the wrong UX (JobStatusDropdown instead of clickable badge pills). Moved interactive status control to the Turn Request's own Status column via a new TurnStatusDropdown, and created a dedicated job detail page as the link target for job badge pills.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Create TurnStatusDropdown and server action | 22d9346 | turn-request-status.ts, turn-status-dropdown.tsx |
| 2 | Create job detail page | 159443a | job/[id]/page.tsx, job-detail-view.tsx |
| 3 | Wire TurnStatusDropdown and update job links | 43c4788 | pm-turn-list.tsx, mobile-jobs-list.tsx, turn-detail-view.tsx |

## Key Implementation Details

**updateTurnRequestStatus server action** — follows exact pattern of job-status.ts: validates against TURN_REQUEST_STATUSES const, uses rateLimiter.acquire(), finds record by `{Request ID}=requestId`, updates Airtable, busts `turnRequest(id)`, `turnRequests`, and `kpis` cache tags using the two-argument `revalidateTag(tag, { expire: 0 })` form.

**TurnStatusDropdown** — client component mirroring JobStatusDropdown: useOptimistic + useTransition, createPortal to document.body for dropdown menu, status colors (Done=emerald, In progress=blue), stopPropagation wrapper div prevents row navigation, toast success/error feedback.

**JobDetailView** — server component with JobStatusDropdown as the only client leaf. Displays full job fields in 2x4 grid matching turn-detail styling. Back link points to parent turn request if turnRequestId exists. Optional turn request link card shown below.

**MobileJobsList rewrite** — converted from client component (was using 'use client' to render JobStatusDropdown) to server component (now renders Link pills). Simpler, no client JS needed.

**pm-turn-list.tsx** — removed TurnStatusDisplay function and StatusBadge import, replaced with TurnStatusDropdown. JobsCell now links each resolved job badge to `/property/job/${job.jobId}` with stopPropagation on the wrapper div. TurnCard mobile view also uses TurnStatusDropdown.

## Deviations from Plan

None — plan executed exactly as written.

## Verification Checklist

- [x] Turn list Status column shows interactive TurnStatusDropdown (not static badge)
- [x] Turn list Jobs column shows clickable badge pills linking to /property/job/[id]
- [x] Mobile jobs list shows clickable badge pills (not JobStatusDropdown)
- [x] Turn detail page Job IDs link to /property/job/[id]
- [x] Job detail page shows full job info with JobStatusDropdown for inline updates
- [x] All dropdown interactions have stopPropagation to prevent row navigation
- [x] npx tsc --noEmit passes with zero errors

## Self-Check: PASSED

All created files exist on disk. All three task commits (22d9346, 159443a, 43c4788) verified in git log.
