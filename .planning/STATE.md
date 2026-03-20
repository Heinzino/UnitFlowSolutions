---
gsd_state_version: 1.0
milestone: v1.2
milestone_name: Dashboard Redesign
status: unknown
stopped_at: Completed 15-02-PLAN.md
last_updated: "2026-03-20T02:22:56.048Z"
progress:
  total_phases: 5
  completed_phases: 4
  total_plans: 8
  completed_plans: 8
---

# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-03-18)

**Core value:** Property Managers can instantly see which turns are overdue, which jobs are stuck, and take action without hunting through Airtable — fewer clicks to the information that matters.
**Current focus:** Phase 16 — executive-dashboard (next)

## Current Position

Phase: 15 (rm-dashboard) — COMPLETE
Plan: 2 of 2 (all plans complete)

## Performance Metrics

**Velocity:**

- v1.0: 24 plans across 9 phases (2026-03-09 → 2026-03-15)
- v1.1: 7 plans across 2 phases (2026-03-15 → 2026-03-17)
- v1.2: 3 plans across 1 phase (complete)
- Total shipped: 37 plans, 13 phases, 241 tests

## Accumulated Context

### Decisions

Decisions are logged in PROJECT.md Key Decisions table.
All v1.0 and v1.1 decisions archived — see `.planning/milestones/` for details.

**v1.2 open decisions (must be resolved before Phase 13):**

- Turn closing contract: Is "Done" set via lease-ready date entry only, or does TurnStatusDropdown retain a "Done" option? (see PITFALLS.md Pitfall 1)
- Executive KPI box definitions: All 6 v1.2 Executive KPI definitions not yet specified

**v1.2 resolved decisions (13-01):**

- PM KPI box definitions 4-6: completedThisPeriod (30d), jobsInProgress (!isCompleted dedup), revenueExposure ($60/day over target), turnsNearDeadline (3-day window)
- Revenue Exposure rate/target: $60/day and targetDays computed from offMarketDate->targetDate span — defined as named constants (REVENUE_EXPOSURE_RATE_PER_DAY, NEAR_DEADLINE_DAYS)
- jobsInProgress filter: !j.isCompleted (not status allowlist) — Ready counts as active workload
- [Phase 12-terminology-rename]: Airtable field strings ('Vacant Date', 'Days Vacant Until Ready') remain frozen; only TypeScript property names renamed
- [Phase 12-terminology-rename]: Type-layer rename creates intentional TypeScript compile errors in consumers, making Plan 02 self-verifying via tsc --noEmit
- [Phase 13]: ActiveJobs excludes Completed/Invoice Sent/Scheduled; Ready status included as in-flight workload
- [Phase 13]: Airtable field clear uses undefined not null per SDK TypeScript constraint
- [Phase 13-03]: KPICard footer prop added for supplemental content rendered inside card box with border-t separator
- [Phase 13-03]: JobDateInput mirrors LeaseReadyDateInput pattern; takes both dates + field discriminator for single server action call
- [Phase 13-03]: Job links in ActiveJobsTable guarded with turnRequestId !== undefined check
- [Phase 14-completed-jobs-page]: isCompleted boolean used to filter completed jobs (not status string) — catches all completed statuses
- [Phase 14-completed-jobs-page]: ActiveJobsTable title prop defaults to 'Active Jobs' for backwards compat; View completed jobs link conditional on title === 'Active Jobs'
- [Phase 15-rm-dashboard]: ROLE_ROUTES.rm changed to '/regional' — RM users route to regional dashboard on login; ROLE_ALLOWED_ROUTES.rm now includes '/regional'
- [Phase 15-rm-dashboard]: Sidebar/BottomTabBar active state for /regional uses startsWith to support sub-route drill-down; all other nav items use exact match
- [Phase 15-rm-dashboard]: PropertyInsights renders both table and chart — single Suspense boundary per RESEARCH.md
- [Phase 15-rm-dashboard]: getBarColor amber threshold >=7 days so 7 days is amber not green
- [Phase 15-rm-dashboard]: Drill-down reuses PMKPIs/PMTurnList/ActiveJobs with role='rm' — no duplication

### Pending Todos

- Confirm Executive KPI box definitions before Phase 16 plan execution begins

### Blockers/Concerns

None blocking roadmap. Phase 13 and Phase 16 each have open product questions (see Pending Todos) that must be resolved before plans execute — not before plans are written.

## Session Continuity

Last session: 2026-03-20T02:22:37.842Z
Stopped at: Completed 15-02-PLAN.md
Resume with: `/gsd:execute-phase 16` (next: Executive dashboard)
