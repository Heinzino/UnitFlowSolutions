# Project Research Summary

**Project:** UnitFlowSolutions — v1.2 Dashboard Redesign
**Domain:** Property management turnover dashboard — Turn/Job separation, role-specific KPIs, inline editing, property-level aggregation
**Researched:** 2026-03-18
**Confidence:** HIGH

## Executive Summary

This is a milestone-scoped enhancement (v1.2) to an existing, production Next.js 16 dashboard backed by Airtable and Supabase Auth. The central goal is a conceptual redesign: separating Turn lifecycle (unit-level events) from Job lifecycle (vendor tasks), giving each user role a purpose-built view, and surfacing actionable financial metrics absent in the current build. Research is grounded entirely in direct source analysis of the 8,753-LOC codebase — every pattern reference points to a validated, in-production file. Zero new npm dependencies are required.

The recommended approach follows three sequenced concerns: first establish correct data model and compute functions in pure TypeScript (testable before any UI exists), then fix terminology globally before writing new components, then build dashboards from the highest-urgency role (PM) to the lowest (Executive). Every new UI feature has an exact existing analog to follow: `JobStatusDropdown` for inline date entry, `VendorTable` for the Active Jobs table, `VendorCompletionChart` for the Avg Turn Time bar graph. The architecture pattern throughout is Server Component data fetch to typed props to Client Island for interactivity.

The primary risks are behavioral rather than technical: the Turn "Done" state can be set via two competing paths if the old `TurnStatusDropdown` is not gated; Revenue Exposure silently returns incorrect values when `targetDate` is null; and the Active Jobs table will generate N+1 Airtable calls if implemented naively. All three risks have clear prevention strategies documented in PITFALLS.md and are addressed by the phased build order derived from ARCHITECTURE.md.

---

## Key Findings

### Recommended Stack

The base stack (Next.js 16, Tailwind v4, Supabase Auth, Airtable SDK, Recharts 3.8.0, Vitest, lucide-react, sonner) is unchanged and fully installed. No new packages are warranted for v1.2. Every new feature maps directly to an existing production pattern, and the primary risk is adding unnecessary dependencies rather than missing ones.

**Core technologies — unchanged:**
- `Next.js 16 App Router` — routing, Server Components, `'use cache'` + `cacheTag` for Airtable caching
- `Recharts 3.8.0` — all new bar charts follow the existing `VendorCompletionChart` pattern; no migration needed
- `Airtable SDK 0.12.2` — data layer via `lib/airtable/tables/`; existing `TurnRequest` and `Job` types carry all fields needed for v1.2
- `useOptimistic` + `useTransition` (React 19) — inline edit pattern established in `JobStatusDropdown`; extended to `LeaseReadyInput`
- `Intl.NumberFormat` — currency formatting already used in `pm-kpis.tsx`; no number-formatting library needed

**Confirmed non-additions (do not add):**
- Any date picker library — native `<input type="date">` is sufficient for a single inline field
- TanStack Table — `VendorTable` already implements sort/filter in ~120 lines
- `date-fns` — day-diff arithmetic is 2 lines of raw `Date` math
- Zustand/Jotai — sort/filter state is local to one component

See `.planning/research/STACK.md` for full alternatives-considered table and per-feature pattern mapping.

### Expected Features

All v1.2 features are mandatory for the milestone to be considered complete — none can be deferred to v1.3 without leaving the dashboard in a partially redesigned state.

**Must have (table stakes):**
- 6 KPI boxes per role (PM, RM, Executive) — industry-standard lead row; role-appropriate metrics
- Turn list with inline lease-ready date entry and manual "Done" — core PM daily workflow; without write capability turns stay open indefinitely
- Active Jobs table on PM dashboard — flat, sortable; turns are the unit lifecycle, jobs are the work; this separation is the central redesign goal
- Revenue Exposure KPI — dollar figure with null-target-date count disclosed; industry standard metric
- Avg Turn Time KPI and bar graph — universally tracked in property management operations
- RM dashboard at `/regional` — RMs currently land on the PM view; a dedicated aggregated view is required
- Property Insights list (RM) — per-property stats with drill-down to PM view
- Executive Top 10 Properties by Revenue Exposure — exception-based executive reporting
- Completed Jobs page with property filter — auditable history; separate route from active work
- Terminology rename (Turns/Jobs/Off Market/Regional Manager) — display string and TypeScript identifier correctness

**Should have (differentiators):**
- Revenue Exposure null-date disclosure ("3 turns excluded") — builds trust that the KPI number means what it says
- Color-coded turn time bar chart (green/amber/red at 7/14-day thresholds) — instant visual triage without reading numbers
- Single-call RM aggregation (one fetch, in-memory partition) — zero performance degradation as portfolio grows
- Lease-ready date as the turn-closing signal — ties workflow to a real business event rather than a status dropdown

**Defer to v2+:**
- Configurable KPI boxes — unnecessary at 6-15 users; role-specific defaults already represent correct customization
- Date range filtering on Completed Jobs — property filter covers the primary RM/PM use case
- Revenue Exposure forecasting — requires historical data storage not in current architecture
- Avg Turn Time trend (time series) — requires snapshot accumulation; point-in-time metric is sufficient now
- Real-time push updates — Airtable has no WebSocket API; 60s cache revalidation matches domain cadence

See `.planning/research/FEATURES.md` for the full dependency graph, competitor analysis, and feature prioritization matrix.

### Architecture Approach

The v1.2 integration is additive: two new routes (`/regional`, `/property/completed-jobs`), one new KPI module (`rm-kpis.ts`), one new server action (`turn-request-dates.ts`), and one new data fetch function (`fetchJobsForUser()`). Existing routes and data functions are modified but not restructured. The four established architectural patterns — Server Component data fetch, Client Island for interactivity, pure compute functions in `lib/kpis/`, Server Action + `revalidateTag` for writes — are sufficient for every new feature. No Airtable schema changes are needed.

**Major components:**
1. `rm-kpis.ts` (new) — `computeRMKPIs()`, `computePropertyInsights()`, `computeRevenueExposure()` — pure aggregations shared by both RM and Executive views
2. `ActiveJobsTable` (new client component) — sortable jobs table following `VendorTable` pattern; data from `fetchJobsForUser()` (one filtered Airtable call, not via `resolveLinkedJobs` N+1)
3. `LeaseReadyInput` (new client component) — inline `<input type="date">` with `useOptimistic` + `useTransition`; follows `JobStatusDropdown` exactly
4. `/regional/page.tsx` (new route) — Server Component Suspense-wrapped RM dashboard; `ROLE_ROUTES.rm` updated from `/property` to `/regional`
5. `setLeaseReadyDate()` (new server action in `turn-request-dates.ts`) — writes `readyToLeaseDate` to Airtable, busts both `CACHE_TAGS.turnRequests` (list) and `CACHE_TAGS.turnRequest(id)` (per-record)
6. Modified `pm-kpis.ts` + `executive-kpis.ts` — new `PMKPIResult` and `ExecutiveKPIResult` interfaces; existing tests break by design and guide the refactor

**Key data flow decisions:**
- Active Jobs table data source: `fetchJobsForUser()` — one filtered Airtable call, not via `resolveLinkedJobs` N+1
- RM Property Insights: one `fetchTurnRequestsForUser()` call for all properties, partitioned in JS with `groupTurnsByProperty()` — not N per-property calls
- Completed Jobs filter: applied at Airtable query level in `fetchJobsForUser({ completedOnly: true })` — not client-side

See `.planning/research/ARCHITECTURE.md` for the full component responsibility table, data flow diagrams, and anti-pattern guide.

### Critical Pitfalls

1. **Turn "Done" signal conflict** — `TurnStatusDropdown` still writes `Done` to `status` while the new design uses `readyToLeaseDate` as the closing signal. Gate or remove the old dropdown in the redesigned turn list; write a single `markTurnDone()` server action that sets both fields atomically. Define the closing contract before writing any UI code.

2. **Revenue Exposure silent undercount with null `targetDate`** — using `?? 0` fallback produces a KPI card that understates reality. Explicitly bucket turns into "over target", "on target", and "no target date set". Surface the excluded count on the card as: "Revenue Exposure: $4,200 (3 turns excluded)".

3. **Revenue Exposure negative values for on-target turns** — computing `(today - targetDate) × $60` without `Math.max(0, ...)` produces negative exposure for turns ahead of schedule. Always clamp: `Math.max(0, daysSinceTarget)`.

4. **Active Jobs table N+1 via `resolveLinkedJobs`** — reusing the `fetchTurnRequestsForUser` path to populate a flat jobs table calls one Airtable API per job record. Add `fetchJobsForUser()` to `jobs.ts` for a single filtered fetch instead.

5. **RM middleware route not updated** — the new `/regional` route is unreachable through normal login flow if `ROLE_ROUTES.rm` is not changed from `/property` to `/regional` in `auth.ts`. The middleware update is a required deliverable of the RM phase, not a follow-up.

6. **Cache tag split on inline date write** — `setLeaseReadyDate()` must bust both `CACHE_TAGS.turnRequests` (list cache) and `CACHE_TAGS.turnRequest(id)` (per-record cache). Missing the per-record tag causes stale data on the turn detail page.

See `.planning/research/PITFALLS.md` for all 11 critical pitfalls with warning signs, recovery strategies, and a "Looks Done But Isn't" checklist.

---

## Implications for Roadmap

Based on combined research, the following 6-phase structure is recommended. Each phase is independently shippable and depends on all preceding phases.

### Phase 1: Shared KPI Foundations
**Rationale:** Pure TypeScript compute functions with no UI. Test suite confirms math correctness before any component depends on it. The KPI interfaces are the contracts that all downstream components import — they must be stable and tested first. Existing tests break by design at the start of this phase; that breakage is the intended regression guard.
**Delivers:** `rm-kpis.ts` (new), updated `pm-kpis.ts` and `executive-kpis.ts` with v1.2 interfaces, all KPI tests updated with maintained coverage count.
**Addresses:** Revenue Exposure, Avg Turn Time, Property Insights aggregation, Executive portfolio KPIs.
**Avoids:** Pitfall 2 (Revenue Exposure null handling), Pitfall 7 (test count loss during rename), Pitfall 8 (negative Revenue Exposure).

### Phase 2: Terminology Rename
**Rationale:** Display strings and TypeScript identifiers must use final terminology before new components are written. New code should be born with correct labels, not renamed post-hoc. This is a standalone, fully reviewable diff with zero logic changes — the cleanest possible PR.
**Delivers:** All UI labels, section headers, TypeScript identifiers, test descriptions, and inline comments using "Turns", "Jobs", "Off Market", "Regional Manager". Verified with `grep -r "Make Ready\|makeReady"` returning 0 results in `src/`.
**Avoids:** Pitfall 3 (partial rename creating permanent cognitive dissonance).

### Phase 3: PM Dashboard Redesign
**Rationale:** PMs are the primary daily users. Unblocked after Phases 1 and 2. `ActiveJobsTable` and `LeaseReadyInput` are independent workstreams within this phase and can be developed in parallel by two developers.
**Delivers:** Updated `PMKPIs` component (6 new boxes), `fetchJobsForUser()` in `jobs.ts` (with tests), `ActiveJobsTable` client component, `setLeaseReadyDate()` server action (with tests), `LeaseReadyInput` client component, updated `PMTurnList` with inline date entry per row.
**Uses:** `useOptimistic` + `useTransition` pattern from `JobStatusDropdown`; `VendorTable` sort/filter pattern; Server Action + `revalidateTag` pattern from `job-status.ts`.
**Avoids:** Pitfall 1 (Turn Done signal — define contract before writing UI), Pitfall 4 (cache tag split — bust both list and per-record tags), Pitfall 6 (duplicate jobs fetch — extract from already-fetched turns), Pitfall 10 (N+1 via resolveLinkedJobs — use fetchJobsForUser instead).

### Phase 4: Completed Jobs Page
**Rationale:** Trivial after Phase 3. Reuses `ActiveJobsTable` with `isCompleted` filter applied at the fetch layer, not the component. One new route with a sidebar link.
**Delivers:** `/property/completed-jobs/page.tsx`, `loading.tsx`, sidebar link, `completedOnly` filter parameter added to `fetchJobsForUser()`.
**Avoids:** Pitfall 11 (client-side `isCompleted` filter sending active job data to browser).

### Phase 5: RM Dashboard
**Rationale:** Depends on Phase 1 (`rm-kpis.ts`). The route change (`rm: '/regional'`) is the highest-risk change in the milestone — doing it after PM work is stable means RM users still have `/property` as a fallback during development. The middleware update is a mandatory deliverable of this phase, not optional cleanup.
**Delivers:** `ROLE_ROUTES.rm = '/regional'` and updated `ROLE_ALLOWED_ROUTES` in `auth.ts`, `/regional/page.tsx` + `loading.tsx`, `RMKPIs` component (6 aggregated boxes), `PropertyInsightsList` Server Component, `AvgTurnTimeBarChart` Recharts client component (color-coded by 7/14-day thresholds).
**Uses:** `computePropertyInsights()` from Phase 1; existing `fetchTurnRequestsForUser()` (single call for all RM properties); `VendorCompletionChart` as the chart template.
**Avoids:** Pitfall 5 (N per-property fetches — one call, partition in JS), Pitfall 9 (RM middleware route missing — middleware update is in scope).

### Phase 6: Executive Dashboard Redesign
**Rationale:** Fewest users, lowest urgency, no downstream dependencies. `computePropertyInsights()` from Phase 1 already handles the Top 10 Properties calculation. This phase is primarily UI composition over pre-existing logic.
**Delivers:** Updated `ExecutiveKPIs` component (6 new boxes using updated `executive-kpis.ts`), `TopPropertiesTable` Server Component (sorted `PropertyInsight[]`, top 10 by Revenue Exposure), updated `ExecutiveCharts` layout.
**Uses:** `computePropertyInsights()` from Phase 1 (shared with RM view); existing `fetchTurnRequests()` (unscoped exec call).

### Phase Ordering Rationale

- KPI logic before UI: tests confirm formula correctness before any component uses the results; TypeScript interface changes are the intended early-warning mechanism
- Terminology before new components: no post-build rename pass; every new component is born with correct labels
- PM before RM: higher daily urgency; RM drill-down also benefits from seeing PM view stable first
- Completed Jobs after Active Jobs: shares the same component; building it first would mean building the more complex version first and then simplifying
- RM route change after PM is stable: minimizes disruption during development; RM users have `/property` as fallback
- Executive last: lowest usage frequency; nothing downstream depends on it

### Research Flags

Phases with standard patterns — no additional research needed before planning:
- **Phase 2 (Terminology Rename):** Pure string and identifier replacement; no design decisions required.
- **Phase 4 (Completed Jobs Page):** Reuses Phase 3 component; only decision is the fetch filter parameter.
- **Phase 6 (Executive Redesign):** Chart and table patterns established; data function shared from Phase 1.

Phases that warrant a focused design decision before execution begins:
- **Phase 3 (PM Dashboard):** The Turn closing signal decision (Pitfall 1) must be made and documented before any turn-closing UI is written. The "Done" state contract — `readyToLeaseDate` presence vs. status dropdown — determines whether `TurnStatusDropdown` is gated or removed entirely from the redesigned turn list.
- **Phase 5 (RM Dashboard):** Revenue Exposure definition for RM Property Insights needs client confirmation: is `$60/day × max(0, days over 10-day target)` correct for the RM-level per-property aggregation, or does the rate/target vary by property?

---

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | All claims verified against `package.json` and in-production source files; no external API research required; zero new dependencies identified |
| Features | HIGH | v1.2 requirements from `PROJECT.md` are the primary source; industry context (Buildium, Leonardo247, AppFolio) is MEDIUM confidence but used only for framing, not decisions |
| Architecture | HIGH | Every component reference, data shape, cache tag, and routing constant confirmed by direct file reads; no assumptions from training data |
| Pitfalls | HIGH | All 11 pitfalls derived from actual code analysis — type definitions, function signatures, cache topology, middleware source; not inferred from general best practices |

**Overall confidence: HIGH**

### Gaps to Address

- **Revenue Exposure rate and target days:** The `$60/day` and `10-day target` constants are treated as business rules in research files but have not been verified with the client. Confirm before Phase 1 compute function implementation, or define them as named constants in a single config file so a client-directed change is a one-line update.
- **PM KPI box definitions 4-6:** ARCHITECTURE.md notes the exact fields for the remaining 3 PM KPI boxes (beyond active turns, avg turn time, revenue exposure) are "TBD with client." Phase 3 is blocked until these are defined.
- **Executive KPI box definitions:** All 6 Executive KPI box definitions change in v1.2. The exact new definitions are not specified in the research files. Phase 6 requires client input before implementation.
- **Turn closing contract:** Whether "Done" is set via lease-ready date entry only, or whether `TurnStatusDropdown` retains a "Done" option, is a product decision not yet made explicit. Must be resolved as the first action of Phase 3 (see Pitfall 1).

---

## Sources

### Primary (HIGH confidence — direct source file analysis)
- `src/lib/types/auth.ts` — ROLE_ROUTES, ROLE_ALLOWED_ROUTES, UserRole
- `src/lib/airtable/cache-tags.ts` — full cache tag topology
- `src/lib/airtable/tables/turn-requests.ts` — fetchTurnRequestsForUser, resolveLinkedJobs
- `src/lib/airtable/tables/jobs.ts` — fetchJobs, fetchJobsByIds
- `src/lib/airtable/tables/mappers.ts` — all mapped TurnRequest and Job fields confirmed
- `src/lib/kpis/pm-kpis.ts` — current PMKPIResult interface and computePMKPIs
- `src/app/(dashboard)/property/_components/job-status-dropdown.tsx` — useOptimistic + useTransition pattern
- `src/app/(dashboard)/vendors/_components/vendor-table.tsx` — sort/filter table pattern
- `src/app/(dashboard)/executive/_components/vendor-completion-chart.tsx` — BarChart pattern
- `src/app/actions/job-status.ts` — Server Action + revalidateTag syntax confirmed
- `package.json` — all installed package versions confirmed
- `.planning/PROJECT.md` — v1.2 milestone requirements

### Secondary (MEDIUM confidence — industry sources)
- Buildium — [11 Property Management KPIs](https://www.buildium.com/blog/property-management-kpis-to-track/) — KPI card conventions
- Revela — [Top 12 KPIs](https://www.revela.co/resources/property-management-kpis) — vacancy duration metrics
- Leonardo247 — [Make Ready Streamlining](https://leonardo247.com/2023/property-operations/make-ready-made-easy-streamlining-your-unit-turn-process/) — turn/job separation patterns
- Bold BI — [Property Management Dashboard](https://www.boldbi.com/dashboard-examples/property-management/property-management-dashboard/) — role hierarchy patterns
- React docs — [useOptimistic](https://react.dev/reference/react/useOptimistic) — optimistic UI pattern
- Recharts GitHub — [v3 release notes](https://github.com/recharts/recharts/releases) — v3 feature notes

---

*Research completed: 2026-03-18*
*Ready for roadmap: yes*
