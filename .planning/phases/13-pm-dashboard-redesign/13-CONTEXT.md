# Phase 13: PM Dashboard Redesign - Context

**Gathered:** 2026-03-18
**Status:** Ready for planning

<domain>
## Phase Boundary

Replace the PM dashboard's 6 KPI boxes with a new set of 6, add inline lease-ready date entry to the Open Turns list, enable marking turns as Done via the existing status dropdown, and add a new Active Jobs table below the turn list. The overdue/on-schedule two-section split is preserved. Property filter continues scoping all data. Covers PMDB-01 through PMDB-06.

</domain>

<decisions>
## Implementation Decisions

### Turn Closing Contract
- Done and lease-ready date are fully independent operations
- Clicking "Done" in the TurnStatusDropdown sets status only — does NOT auto-fill lease-ready date
- A turn can be Done with no lease-ready date, or have a lease-ready date but not be Done yet
- "Done" is added as a selectable option in the existing TurnStatusDropdown — NO separate DoneButton component

### KPI Boxes (6 total, 3x2 grid)
- Row 1 (overview): Active Turns, Avg Turn Time, Revenue Exposure
- Row 2 (action): Completed This Period, Jobs In Progress, Turns Near Deadline
- Clean replacement — old KPIs (Completed 30d, Completed 7d, Projected Spend MTD) are removed entirely
- Alert-state cards: Revenue Exposure uses `alert-past` variant when value > 0; Turns Near Deadline uses `alert-trending` variant when count > 0

### KPI Definitions
- **Active Turns**: count of turns where status !== "Done" (unchanged from current)
- **Avg Turn Time**: average timeToCompleteUnit for Done turns (unchanged from current)
- **Revenue Exposure**: sum of ($60 × days over target) for each turn past its target date. Calculation: if today > turn.targetDate, exposure = (today - targetDate in days) × $60. Turns with no targetDate are excluded from the sum but counted in the footnote. Rate: REVENUE_EXPOSURE_RATE_PER_DAY = 60 (confirmed)
- **Completed This Period**: count of turns completed in rolling 30-day window (COMPLETED_PERIOD_DAYS = 30)
- **Jobs In Progress**: count of all non-completed jobs across PM's turns (!job.isCompleted). Includes In Progress, Blocked, NEEDS ATTENTION, Ready — total active workload
- **Turns Near Deadline**: count of turns where targetDate is within 3 calendar days from now (NEAR_DEADLINE_DAYS = 3)

### Revenue Exposure Footnote
- Rendered below Revenue Exposure KPI card when excluded turn count > 0
- Copy: "{N} turn(s) excluded (no target date)"
- Turns excluded = those with null targetDate (cannot calculate days over target)

### Open Turns List
- Keep the overdue/on-schedule two-section split from Phase 5 (pink header for overdue, hidden when empty)
- NO new Age column — existing columns stay as-is
- NO separate DoneButton column — Done is a status dropdown option
- Only column change: Ready To Lease Date becomes an editable inline `<input type="date">` with blur-triggered save
- Columns remain: Property, Unit, Status (dropdown with Done option), Ready To Lease (editable input), Off Market Date, Jobs, Price

### Active Jobs Table (new section)
- Placed below Open Turns list on the PM dashboard
- Shows jobs where status is NOT "Completed", NOT "Invoice Sent", NOT "Scheduled" — regardless of parent turn status
- Default sort: Days Open descending (oldest/most urgent first)
- Sortable columns: Vendor, Status, Days Open
- Non-sortable columns: Unit, Turn
- Days Open calculation: today minus job.startDate (in days). Null startDate shows "---"
- Unit column links to turn detail page (/property/turn/[turnId])
- Turn column (showing turn #ID) also links to turn detail page
- Empty state: "No active jobs" heading + "There are no in-flight jobs across your open turns." body

### Claude's Discretion
- Loading skeleton arrangement for new KPI grid + Active Jobs section
- Sort indicator icon implementation (ChevronUp/ChevronDown from Lucide)
- Exact Active Jobs server component data fetching strategy (batch jobs or per-turn)
- How to compute "days" for Revenue Exposure (ceil, floor, or round)
- Mobile responsive treatment for Active Jobs table (card list like turn list, or horizontal scroll)
- Icon choices for new KPI cards (Jobs In Progress, Turns Near Deadline, Revenue Exposure)

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Requirements and roadmap
- `.planning/REQUIREMENTS.md` — PMDB-01 through PMDB-06 define exact acceptance criteria
- `.planning/ROADMAP.md` §Phase 13 — Success criteria, phase goal, dependencies

### UI design contract
- `.planning/phases/13-pm-dashboard-redesign/13-UI-SPEC.md` — Visual/interaction specs, component inventory, copywriting contract (NOTE: DoneButton component in UI-SPEC is superseded by this CONTEXT — Done uses TurnStatusDropdown instead)

### Research
- `.planning/phases/13-pm-dashboard-redesign/13-RESEARCH.md` — Technical research, pitfalls, validation architecture

### Existing PM dashboard code
- `src/app/(dashboard)/property/_components/pm-kpis.tsx` — Current KPI component (will be modified)
- `src/app/(dashboard)/property/_components/pm-turn-list.tsx` — Current turn list (will be modified)
- `src/app/(dashboard)/property/_components/turn-status-dropdown.tsx` — Status dropdown (add Done option)
- `src/lib/kpis/pm-kpis.ts` — KPI compute functions (will be extended)
- `src/lib/types/airtable.ts` — TurnRequest and Job interfaces (data model reference)

### Prior phase context
- `.planning/phases/05-property-manager-view/05-CONTEXT.md` — Original PM view decisions (overdue split, status dropdown, optimistic UI patterns)
- `.planning/phases/12-terminology-rename/12-CONTEXT.md` — Terminology rename decisions (Airtable field boundary)

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `KPICard` (src/components/ui/kpi-card.tsx): default, highlighted, alert-past, alert-trending variants — used for all 6 KPI boxes
- `TurnStatusDropdown` (src/app/(dashboard)/property/_components/turn-status-dropdown.tsx): existing status dropdown — add "Done" as an option
- `Table` compound component (src/components/ui/table.tsx): reuse for Active Jobs table
- `StatusBadge` (src/components/ui/status-badge.tsx): status-to-color mapping for job status cells
- `Badge` (src/components/ui/badge.tsx): property name badges in turn rows
- `CurrencyDisplay` (src/components/ui/currency-display.tsx): format Revenue Exposure dollar amount
- `Skeleton` (src/components/ui/skeleton.tsx): loading state primitives
- `fetchTurnRequestsForUser()`: existing data fetch with caching + rate limiting
- `fetchJobsByIds()`: batch linked record resolution for job data
- `computePMKPIs()`: existing compute function — extend with new fields

### Established Patterns
- `_components/` directory for page-specific components (Phase 4/5 pattern)
- Suspense wraps data-fetching child, page.tsx is synchronous
- Optimistic UI + Sonner toast for writes (Phase 3/5 pattern)
- `use cache` + `cacheLife` + `cacheTag` for server-side caching
- Property filter scopes everything on the page (Phase 5 decision)
- Pink overdue section header with `bg-alert-past-target` (Phase 5 pattern)
- Server action pattern: `src/app/actions/` directory

### Integration Points
- PM dashboard page: `src/app/(dashboard)/property/page.tsx` — add Active Jobs section as new Suspense child
- Server action for lease-ready date: new file `src/app/actions/lease-ready-date.ts`
- Cache tags to bust on lease-ready date write and Done status change
- Job status filter: need to exclude "Completed", "Invoice Sent", "Scheduled" statuses

</code_context>

<specifics>
## Specific Ideas

- PMs check daily — core loop: scan KPIs -> spot issues -> drill into turns/jobs -> take action. KPI row is the primary focal point
- Revenue Exposure makes financial impact of delays visible at a glance — $60/day is a real business cost metric
- Jobs In Progress counts ALL non-completed jobs (not just "In Progress" status) to show total active workload
- Active Jobs table links both Unit and Turn columns to detail pages for quick drill-down from job context
- "Done" via status dropdown keeps the interaction pattern consistent with all other status changes — no new UI pattern to learn

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 13-pm-dashboard-redesign*
*Context gathered: 2026-03-18*
