# Feature Research

**Domain:** Property management turnover dashboard — v1.2 Dashboard Redesign
**Researched:** 2026-03-18
**Confidence:** HIGH (v1.0 baseline from production codebase analysis; v1.2 targets derived from PROJECT.md requirements + industry research)

---

## Scope of This Document

This is a **milestone-scoped update** to the original FEATURES.md (dated 2026-03-08). It covers what changes and what is new for the v1.2 Dashboard Redesign milestone. The v1.0 feature set is shipped and validated. This document answers: "What features belong in this redesign, what is mandatory vs. differentiating, and what should we explicitly not build?"

The v1.2 target features per PROJECT.md:
- Terminology rename (Make Ready → Turns/Jobs, Vacant → Off Market)
- PM dashboard: 6 KPI boxes, Open Turns with lease-ready date entry + manual Done, Active Jobs table, Revenue Exposure
- RM dashboard: 6 aggregated boxes, Property Insights list, Avg Turn Time bar graph, PM-level drill-down
- Executive dashboard: 6 redesigned boxes, Top 10 Properties by Revenue Exposure
- Completed Jobs page with property filter

---

## Feature Landscape

### Table Stakes (Users Expect These)

Features users assume exist in a professional dashboard. Missing these = product feels unfinished or regresses from v1.0.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| 6 KPI boxes per role (PM, RM, Exec) | Industry standard: property management dashboards universally lead with a KPI row. Users in property management expect at-a-glance metrics at the top. Buildium, AppFolio, and Bold BI all use this pattern. | MEDIUM | Each role gets a distinct set of 6 boxes appropriate to their scope. PM: unit-level. RM: property-level aggregation. Exec: portfolio-level. |
| Turn list with status + age | The core PM daily view. Every property management platform surfaces active turns with overdue flagging first. Without this, PMs have no reason to open the dashboard. | LOW | Already exists in v1.0. v1.2 adds lease-ready date entry and "Done" action inline. |
| Active Jobs table (flat, sortable) | PMs need to scan all in-flight jobs across their turns without opening each turn one at a time. Distinct from the turn list — jobs are the work, turns are the unit. This separation is the core redesign goal. | MEDIUM | New in v1.2. Sort by vendor, status, days open. Data extracted from already-fetched turn requests (no additional API call). |
| Revenue Exposure KPI | "How much money are we losing from units sitting vacant past target?" Industry standard: days vacant is tracked as a direct revenue metric. Buildium, Second Nature, and Revela all cite days-to-lease and vacancy cost as core KPIs. The dollar figure makes urgency tangible. | MEDIUM | $60/day × days over target per active turn. Surfaced as a KPI box with currency formatting. Must handle null target dates explicitly (count excluded, not silently $0). |
| Avg Turn Time KPI | "How fast are units turning?" Universally tracked in property management operations. Benchmarks: most make-readies finish within 72 hours; 7-10 days is a common target range for full turns. | LOW | Calculated from vacantDate → readyToLeaseDate on completed turns. Pure arithmetic on existing fields. |
| Inline lease-ready date entry | PMs must close out a turn by recording when the unit is ready to lease. Without this write capability, turns stay open forever. The date triggers the Revenue Exposure stop-clock. | MEDIUM | New Server Action. Inline date input per turn row. Optimistic UI (show date immediately, revert on error). Fire only on blur/confirm, not on each keystroke. |
| Manual "Done" on turns | PM needs to mark a turn complete without navigating to a separate record. Standard pattern in task management tools. If completing a turn requires extra clicks, PMs will skip it. | LOW | Reuses existing updateTurnRequestStatus() action. New "Mark Done" button in turn row. |
| Property Insights list (RM view) | Regional Managers need per-property stats in one view. Drilling into each property individually is what the current /property page requires — that defeats the purpose of the RM view. The industry pattern: RM dashboards show a ranked list of properties by metric. | MEDIUM | Per-property aggregation: active turns, avg turn time, revenue exposure. Computed in JS from a single fetchTurnRequestsForUser() call. |
| Avg Turn Time bar graph (RM view) | Visual comparison of turn time across properties is the fastest way for an RM to spot problem properties. Bar charts for per-property comparisons are universal in property management BI tools. | LOW | Recharts BarChart. One bar per property. Color-coded: green (<7 days), amber (7-14), red (>14). Existing VendorCompletionChart is the exact pattern. |
| Completed Jobs page with property filter | Historical record of what was done. PMs need to verify completed work and audit vendor performance. A filterable completed-jobs table is a standard feature in work-order-style property management tools. | LOW | New route /property/completed-jobs. Reuses ActiveJobsTable with isCompleted filter. Property filter via existing PropertyMultiSelect. |
| Top 10 Properties by Revenue Exposure (Exec) | Executives need to know which properties are burning the most money from extended vacancies. Ranked-list tables are the standard executive pattern for "where to focus." | LOW | Sorted PropertyInsight[] by revenueExposure desc, top 10. Shares computePropertyInsights() with RM view. |
| Consistent terminology across all views | "Make Ready", "Vacant", and "District Manager" were internal Airtable labels, not client business terminology. Using "Turns", "Jobs", "Off Market", and "Regional Manager" is expected by users who were asked to verify the v1.1 build. | LOW | Display string changes only. Airtable field values (status enums) do not change. TypeScript identifiers updated in second pass. |
| Optimistic UI for inline edits | Users expect immediate feedback when they update a field. A 1-2 second lag before seeing their change registered (waiting for Airtable write + cache bust) makes the interface feel broken. | MEDIUM | Already implemented for job status updates in v1.0. v1.2 extends the useOptimistic + useTransition + sonner toast pattern to lease-ready date entry. |
| Loading states on new pages/sections | Any new route or Suspense boundary without a loading skeleton will show a blank flash. This is a table stakes UX concern. | LOW | loading.tsx convention for new routes. Skeleton shapes matching KPI card dimensions and table rows. |

### Differentiators (Competitive Advantage)

Features that make this dashboard demonstrably better than the Airtable native interface — the standard it competes against. These map directly to the app's stated core value: "fewer clicks to the information that matters."

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| Turn vs. Job separation (semantic clarity) | Airtable conflates "units being turned" with "jobs assigned to vendors." The redesign surfaces turns as the primary object and jobs as the work attached to them. This matches how PMs actually think. No competitor has this separation built around a custom turnover workflow. | HIGH | The central architectural change of v1.2. Every feature depends on this conceptual model being clear in the UI. |
| Revenue Exposure with null-date disclosure | Most PM dashboards show a revenue number without qualifying it. Surfacing "X turns excluded (no target date)" prevents the KPI from lying to users. This is a trust-building differentiator — users know the number means what it says. | LOW | Extra line on KPI box. Negligible implementation cost for high credibility gain. |
| RM property drill-down reusing PM components | RM clicks a property in the Property Insights list and sees the full PM view scoped to that property — no duplicate UI. The drill-down is seamless. Competitors either show flat tables at the RM level or separate views that feel disconnected. | MEDIUM | /property?property=X pattern already in place. RM drill-down is routing, not a new component build. |
| Single-call RM aggregation (no per-property API cost) | RM Property Insights are computed in JS from one Airtable call, not N calls per property. This means no perceptible slowdown as the RM's portfolio grows from 2 to 10 properties. Generic BI tools hit the data source once per widget. | MEDIUM | groupTurnsByProperty() in rm-kpis.ts. Critical for performance scaling without infrastructure changes. |
| Color-coded turn time bar graph | Green/amber/red bars on the Avg Turn Time chart give the RM an instant visual triage — no numbers required to identify a problem property. Color thresholds (7/14 days) align with industry benchmarks for make-ready targets. | LOW | getBarColor() function. Already established pattern in VendorCompletionChart. |
| Role-appropriate KPI box selections | Each of the three roles gets 6 boxes chosen for their scope of work: PM sees unit-level action items; RM sees cross-property comparison metrics; Exec sees portfolio health and exposure. No other view in the app is designed for the wrong person. | MEDIUM | Three distinct compute functions + component sets. High design value for low marginal cost once one role is done. |
| Lease-ready date as turn-closing signal | Using the lease-ready date (rather than a status dropdown) as the turn-closing event ties the workflow to a real business event: "the unit is ready to rent." This prevents premature turn closure and ensures the Revenue Exposure stop-clock only resets when the work is actually done. | MEDIUM | Requires careful design decision: the turn "Done" state must be gated on readyToLeaseDate presence. Server action sets both fields atomically. |

### Anti-Features (Commonly Requested, Often Problematic)

Features that seem useful at v1.2 scale but should be deliberately excluded.

| Feature | Why Requested | Why Problematic | Alternative |
|---------|---------------|-----------------|-------------|
| Real-time push updates (WebSocket / SSE) | "I want to see when a vendor completes a job without refreshing" | Airtable has no WebSocket API. Polling + cache creates complexity without meaningful UX gain — turns take days, not seconds. The 60s cache revalidation is already near-real-time for this domain's cadence. | Cache bust on writes (already in place). Natural 60s revalidation for reads. |
| Configurable KPI boxes (drag-to-reorder, pick metrics) | "Can I choose which 6 boxes I see?" | With 6-15 users, the cost of building a configuration system exceeds the value. The three role-specific views already represent the right customization for this org. Config UIs also tend to reveal gaps in the default design. | Fixed, opinionated KPI sets per role. Add/change KPIs in code if users request specific changes — the code is approachable and changes take minutes. |
| Multi-column sort on Active Jobs table | "I want to sort by status, then by days open, then by vendor" | Complex multi-column sort for an internal table used by 6-15 users is engineering overhead with near-zero payoff. Single-column sort covers 95% of use cases (sort by days open to find stale jobs). | Single-column sort with toggle direction. Follow the existing VendorTable pattern. |
| Date range filtering on Completed Jobs | "Show me only jobs completed between March 1 and March 15" | Date range filtering requires a date picker or two date inputs, state management, and edge-case handling (invalid ranges, future dates). Property filter alone covers the RM/PM workflow (see which properties need attention). Date filtering can be added in a targeted future phase if usage data shows the need. | Property filter via existing PropertyMultiSelect. Filter to a specific property is the primary use case for Completed Jobs. |
| Editable job fields inline in the Active Jobs table | "Can I update the vendor or job type from the table?" | The Active Jobs table is a view, not an edit surface. Updating job details requires navigating to the Airtable record or a future turn-detail edit surface. Adding inline editing to the table adds optimistic state management and cache invalidation complexity for fields that change infrequently. | Keep Active Jobs table read-only except for status (already handled by inline status updates on the turn list). |
| Per-user notification preferences | "I only want to see alerts for certain properties" | Notification preferences require a settings model, persistence (Supabase table or user metadata), and UI. At 6-15 users with already-scoped data (each user only sees their properties), preferences add no meaningful signal reduction. | Role-based data scoping already limits noise. Exec sees all properties; PM sees only theirs. No preferences needed. |
| Avg Turn Time trend over time (time series chart) | "Show me whether turn times are improving week over week" | Requires storing historical snapshots (Airtable data is point-in-time). The existing caching layer does not accumulate historical state. Building a time series would require either a database for snapshots or a computed rollup. | Current-period Avg Turn Time KPI box is sufficient. Trend arrow (delta vs. last period) is a v2 feature if historical data storage is added. |
| Revenue Exposure forecast | "Project next month's exposure based on current trends" | Forecasting requires historical vacancy data, move-out scheduling data, and statistical modeling. None of this is in scope for a dashboard that reads only current Airtable state. | Surface current actual exposure clearly. Forecasting is a separate product capability. |

---

## Feature Dependencies

```
[Terminology Rename (display strings + TS identifiers)]
    |
    (must complete before new components are written)
    |
    v
[New KPI Compute Functions (pm-kpis.ts, executive-kpis.ts, rm-kpis.ts NEW)]
    |
    +--required-by--> [PM 6-Box KPI Component]
    +--required-by--> [RM 6-Box KPI Component]
    +--required-by--> [Executive 6-Box KPI Component]
    +--required-by--> [Revenue Exposure KPI Box]
    |
    v
[fetchJobsForUser() (new function in jobs.ts)]
    |
    +--required-by--> [Active Jobs Table component]
    +--required-by--> [Completed Jobs Page]

[setLeaseReadyDate() Server Action (new)]
    |
    +--required-by--> [Inline Lease-Ready Date Input]
    +--required-by--> [Manual "Done" on turns]

[Active Jobs Table component]
    |
    +--required-by--> [Completed Jobs Page]  (reused with isCompleted filter)

[computePropertyInsights() in rm-kpis.ts]
    |
    +--required-by--> [Property Insights List (RM view)]
    +--required-by--> [Avg Turn Time Bar Graph (RM view)]
    +--required-by--> [Top 10 Properties by Revenue Exposure (Exec view)]

[/regional route (new)]
    |
    +--requires--> [middleware ROLE_ALLOWED_ROUTES updated for rm role]
    +--requires--> [RM KPI compute functions]

[Completed Jobs Page (/property/completed-jobs)]
    |
    +--requires--> [Active Jobs Table component]
    +--enhances--> [property filter via PropertyMultiSelect]
```

### Dependency Notes

- **Terminology rename before new components:** New components should use final terminology from day 1. Renaming after building doubles the work and creates a gap where old/new strings coexist.
- **KPI compute functions before KPI components:** Components that render new boxes cannot be written until the compute functions are defined and tested. The function signature is the contract.
- **computePropertyInsights() is shared:** Both RM Property Insights and Executive Top 10 depend on the same function. Build once in rm-kpis.ts, import in executive-kpis.ts.
- **Active Jobs Table before Completed Jobs Page:** The Completed Jobs Page is the Active Jobs Table with a filter flipped. Reversing the order would create the more complex component first and then have to simplify it.
- **fetchJobsForUser() is the Active Jobs table's data source:** The table cannot be built without this function. The function should be built and tested before the table component is touched.
- **setLeaseReadyDate() must set both readyToLeaseDate AND status atomically:** The lease-ready date is the turn-closing signal. The server action must set both fields in one Airtable PATCH to avoid the state conflict pitfall (turn Done status mismatches lease-ready date presence).

---

## MVP Definition (v1.2 Milestone)

### Milestone Core (Ship Together)

The features that constitute the v1.2 Dashboard Redesign milestone. All are required; none can be deferred to v1.3 without leaving the dashboard in a partially-redesigned state.

- [ ] Terminology rename — all views use "Turns", "Jobs", "Off Market", "Regional Manager". TypeScript identifiers and display strings both updated.
- [ ] PM 6-Box KPI row — new boxes with updated calculations (active turns, avg turn time, revenue exposure, completed this period, jobs in progress, turns near deadline)
- [ ] Revenue Exposure KPI box — dollar figure with null-target-date count disclosed
- [ ] Inline lease-ready date entry on Open Turns list — date input per row, optimistic update, blur-triggered server action
- [ ] Manual "Done" button on Open Turns list — reuses updateTurnRequestStatus()
- [ ] Active Jobs table on PM dashboard — sortable, filtered to non-completed, data from flatMap over turn requests
- [ ] RM dashboard at /regional — 6 aggregated KPI boxes
- [ ] Property Insights list on RM dashboard — per-property stats, drill-down links
- [ ] Avg Turn Time bar graph on RM dashboard — color-coded by threshold
- [ ] Executive dashboard redesign — 6 updated KPI boxes
- [ ] Top 10 Properties by Revenue Exposure on Executive dashboard
- [ ] Completed Jobs page (/property/completed-jobs) — property filter, reuses ActiveJobsTable
- [ ] Middleware updated to route rm → /regional

### Add After v1.2 Validation

Features in PROJECT.md Future scope, triggered by user feedback:

- [ ] Inline pricing approval — after PMs confirm the approval workflow is the right UX
- [ ] Notes on turn requests — after confirming PMs want centralized notes vs. out-of-band communication
- [ ] Middle column notification/alert system — after validating that derived alerts match actual user needs
- [ ] Maintenance Manager role view — after confirming Maintenance Manager hire and workflow requirements

### Deliberately Out of Scope (v1.2)

Items explicitly excluded to keep v1.2 bounded:

- [ ] Configurable KPI boxes — fixed per-role sets only
- [ ] Date range filtering on Completed Jobs — property filter is sufficient
- [ ] Revenue Exposure forecasting — current exposure only, no projections
- [ ] Avg Turn Time historical trending — point-in-time metric only
- [ ] Editable job fields in Active Jobs table — read-only except status

---

## Feature Prioritization Matrix (v1.2)

| Feature | User Value | Implementation Cost | Priority |
|---------|------------|---------------------|----------|
| Terminology rename | HIGH (correctness/trust) | LOW | P1 |
| New PM 6-box KPI row | HIGH | MEDIUM | P1 |
| Revenue Exposure KPI | HIGH | MEDIUM | P1 |
| Inline lease-ready date entry | HIGH | MEDIUM | P1 |
| Active Jobs table | HIGH | MEDIUM | P1 |
| Completed Jobs page | HIGH | LOW | P1 |
| RM /regional dashboard | HIGH | MEDIUM | P1 |
| Property Insights list (RM) | HIGH | MEDIUM | P1 |
| Top 10 by Revenue Exposure (Exec) | MEDIUM | LOW | P1 |
| Avg Turn Time bar graph (RM) | MEDIUM | LOW | P1 |
| Executive 6-box redesign | MEDIUM | MEDIUM | P1 |
| Manual "Done" button on turns | MEDIUM | LOW | P1 |
| Middleware RM route update | HIGH (blocker) | LOW | P1 |
| Revenue Exposure null disclosure | MEDIUM | LOW | P2 (add to KPI box) |
| Color-coded bar chart thresholds | LOW | LOW | P2 |

**Priority key:**
- P1: Required for the v1.2 milestone to be considered complete
- P2: Should add within v1.2 but does not block milestone completion
- P3: Future — does not belong in v1.2

---

## Industry Context: What This Domain Considers Standard

Research findings from property management dashboard platforms (Buildium, Second Nature, Leonardo247, Bold BI, Revela) and general dashboard UX pattern analysis:

**KPI card conventions:**
- Property management dashboards universally lead with a summary row of 4-8 KPI cards
- Cards follow: label (top), value (large center), delta/trend (bottom smaller text)
- Color-coded status indicators (green/amber/red) are expected, not differentiating
- Currency formatting for financial KPIs is expected (Intl.NumberFormat is sufficient)

**Turn/vacancy tracking standards:**
- "Days-to-Lease" (vacancy duration) is an industry-standard KPI tracked by every property management platform
- Revenue loss from vacancy is calculated as daily rent × days vacant — the specific constant ($60/day in this app) is a client-defined business rule, not an industry formula
- "Make-ready time" (turn time) benchmarks: under 72 hours for simple turns; 7-10 days for full refurbs. Color thresholds of 7/14 days are reasonable for bar chart coloring
- Most property management platforms separate "turns" (unit lifecycle events) from "work orders/jobs" (vendor tasks). The v1.2 redesign aligns with this industry standard

**Role hierarchy patterns:**
- Property management software universally implements: Site/PM level, Regional/Portfolio level, Executive/Owner level
- PM level: unit-specific, actionable, daily cadence
- Regional level: property comparison, weekly cadence, identifies outliers
- Executive level: portfolio health, financial exposure, exception reports (Top N problems)

**Interactive table standards:**
- Status updates inline in tables are expected; navigation away to edit is a UX regression
- Single-column sort with toggle direction is table stakes for any multi-row list
- "Completed" items should be filterable out of the default view (a separate page or a hidden-by-default section)

**Dashboard UX table stakes (general):**
- Loading states / skeletons for any async data fetch
- Empty states with actionable messaging (not just blank cards)
- Toast feedback on inline writes (success/error)
- Consistent card layout (title position, value position, supplementary text position)

---

## Competitor Feature Analysis

| Feature | Airtable Native (baseline) | Leonardo247 | Buildium / AppFolio | Our v1.2 Approach |
|---------|---------------------------|-------------|---------------------|-------------------|
| Turn tracking | Table rows, manual status | Make Ready Board with real-time task status, mobile check-in/out | Basic maintenance tracking | Turn list + Active Jobs table separated; Open Turns as primary PM view |
| KPI dashboard | Airtable Interface blocks (rigid) | Not KPI-focused | Summary metrics on main dashboard | 6-box KPI rows per role, role-appropriate metrics |
| Revenue exposure | Not tracked | Not native | Vacancy rate % only (no dollar calc) | Dollar-denominated Revenue Exposure per turn, disclosed null handling |
| RM / regional view | None — everyone sees same interface | Multi-property overview | Portfolio views (enterprise plans) | /regional route with Property Insights list + drill-down to PM view |
| Completed jobs history | Filter on status column | Archived tasks | Basic history | Dedicated /property/completed-jobs with property filter |
| Inline status updates | Edit record in modal | Mobile task check-in/out | Mostly edit record | Inline update in list row with optimistic UI |
| Terminology | "Make Ready" / "Vacant" | "Make Ready" / "Unit Turn" | "Work Orders" | "Turns" / "Jobs" / "Off Market" (client-specific) |

---

## Sources

- Project requirements: `.planning/PROJECT.md` — v1.2 milestone Active requirements (HIGH confidence)
- Architecture analysis: `.planning/research/ARCHITECTURE.md` — integration map and data shapes confirmed (HIGH confidence)
- Industry KPI standards: [Buildium — 11 Property Management KPIs](https://www.buildium.com/blog/property-management-kpis-to-track/), [Revela — Top 12 KPIs](https://www.revela.co/resources/property-management-kpis), [Second Nature — Top 20 KPIs](https://www.secondnature.com/blog/property-management-kpis) (MEDIUM confidence — general PM domain, not turn-specific)
- Turn tracking software patterns: [Leonardo247 — Make Ready Streamlining](https://leonardo247.com/2023/property-operations/make-ready-made-easy-streamlining-your-unit-turn-process/), [Lula — What is a Make-Ready](https://lula.life/articles/what-is-a-make-ready) (MEDIUM confidence)
- Dashboard UX patterns: [Pencil & Paper — Dashboard Design Patterns](https://www.pencilandpaper.io/articles/ux-pattern-analysis-data-dashboards), [UXPin — Dashboard Design Principles](https://www.uxpin.com/studio/blog/dashboard-design-principles/) (MEDIUM confidence — general, not PM-specific)
- Role-based dashboard conventions: [Bold BI Property Management Dashboard](https://www.boldbi.com/dashboard-examples/property-management/property-management-dashboard/), [inetsoft — Rental Property Management Dashboards](https://www.inetsoft.com/info/rental-property-management-dashboards/) (MEDIUM confidence)

---

*Feature research for: UnitFlowSolutions v1.2 Dashboard Redesign*
*Researched: 2026-03-18*
*Scope: v1.2 milestone features only — v1.0 feature baseline documented in prior version of this file (2026-03-08)*
