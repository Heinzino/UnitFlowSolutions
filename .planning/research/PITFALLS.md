# Pitfalls Research

**Domain:** Adding Turn/Job separation, inline date entry, revenue exposure, property-level aggregation, RM dashboard, and Completed Jobs page to existing Airtable-backed Next.js dashboard (v1.2 Dashboard Redesign)
**Researched:** 2026-03-18
**Confidence:** HIGH — based on direct code analysis of the 8,753-LOC codebase, typed interfaces, KPI functions, Airtable data model, and 202-test suite. Updated from 2026-03-17 version.

---

## Critical Pitfalls

### Pitfall 1: Turn "Done" State Conflicts With Job Lifecycle Separation

**What goes wrong:**
The v1.2 design separates Turn lifecycle from Job lifecycle: jobs completing does not close the turn. But the existing codebase closes a turn by setting `turn.status === 'Done'`. The new design requires a `leaseReadyDate` field (set manually) as the turn-closing signal, while jobs can be individually completed without closing the turn. If both mechanisms exist simultaneously — the old `TurnStatusDropdown` still writes `Done` to `status`, and the new inline date entry also writes to `readyToLeaseDate` — a turn can be in a "Done" status but have no lease-ready date, or have a lease-ready date but not be "Done". This creates broken state where KPI calculations disagree on how many active turns exist.

**Why it happens:**
The existing `TurnStatusDropdown` component (`turn-status-dropdown.tsx`) allows writing `Done` directly. The new flow requires keeping turns open until the PM enters a lease-ready date. Developers add the new flow without removing or gating the old one, since the old component is used in the current turn list that still works.

**How to avoid:**
Decide before building whether "Done" status is set by: (a) the PM entering a lease-ready date (new design intent), or (b) a separate status dropdown (existing behavior). If (a), gate the `TurnStatusDropdown` so it no longer offers "Done" as an option, or remove it from the redesigned turn list entirely. The `TurnRequest.readyToLeaseDate` field already exists in the type — use its presence/absence as the source of truth for whether a turn is closed. Write a single `markTurnDone(requestId, leaseReadyDate)` server action that sets both fields atomically.

**Warning signs:**
- `computePMKPIs` Active Turns count differs from the count visible in the turn list
- A turn appears in the "Active" section but has a lease-ready date set
- KPI test for `activeTurns` passes but the dashboard shows wrong numbers

**Phase to address:**
Phase implementing the PM dashboard redesign (Open Turns list with lease-ready date entry). Define the closing signal before writing any UI code.

---

### Pitfall 2: Revenue Exposure Calculation Silently Returns $0 When `targetDate` Is Null

**What goes wrong:**
Revenue Exposure is `$60 × days_over_target`, where `days_over_target = today - targetDate`. The `TurnRequest.targetDate` field is `string | null` in the existing type. When `targetDate` is null (turn has no target set, or was created without one), the calculation silently produces 0 instead of an error or a flagged value. With multiple turns missing target dates, the "Total Revenue Exposure" KPI card shows a number that is significantly lower than reality. PMs make decisions based on an understated figure.

**Why it happens:**
This mirrors the existing `NaN` pitfall — Airtable formula fields return empty when inputs are missing, and the existing codebase already has precedent for this pattern: `daysVacantUntilReady` is `number | null` and the current KPI code uses `?? 0` as a fallback, which silently zeroes out missing data. Developers copy this pattern to the revenue exposure calculation.

**How to avoid:**
In the revenue exposure aggregation function, explicitly separate turns into three buckets:
1. `targetDate` present, over target — contribute to exposure
2. `targetDate` present, not over target — $0 exposure
3. `targetDate` null — unknown, exclude from total but count separately

Surface the "unknown" count on the KPI card: "Revenue Exposure: $4,200 (3 turns without target dates excluded)." This prevents the KPI from silently understating. In the unit tests, include a test case with mixed null/non-null target dates and assert both the dollar figure and the excluded count.

**Warning signs:**
- Revenue Exposure KPI shows $0 when turns are clearly overdue
- Airtable shows target dates set, but the dashboard shows lower exposure than expected
- The aggregation function uses `targetDate ?? someDate` without a separate null count

**Phase to address:**
Phase implementing Revenue Exposure KPI. Write the null-handling policy before writing the formula.

---

### Pitfall 3: Partial Terminology Rename Leaves Inconsistent Strings Scattered Across Codebase

**What goes wrong:**
"Make Ready → Turn", "Make Readys → Turns", "Vacant → Off Market" appear in: KPI card labels (`pm-kpis.tsx` line 40: `"Active Make Readys"`), section headers (`pm-turn-list.tsx` line 189: `"Make Readys Past Target Time"`, line 192: `"Active Make Readys (On Schedule)"`), KPI interface property names (`PMKPIResult.activeMakeReadys`), and test descriptions (`pm-kpis.test.ts`). A partial rename where the UI strings are updated but the TypeScript interface names, test descriptions, and server action names are not updated creates a codebase where a developer reads `activeMakeReadys` in the code but sees "Active Turns" in the UI — permanent cognitive dissonance that makes the codebase harder to reason about.

**Why it happens:**
The rename spans UI display strings, TypeScript identifiers, test descriptions, and comments. There is no single file to change. Developers update what is visible (UI labels) and miss what is internal (interface properties, variable names, test names, server action names).

**How to avoid:**
Use a two-pass approach. Pass 1: update all display strings (UI labels, section headers, page titles) — these are user-facing. Pass 2: update TypeScript identifiers (`activeMakeReadys → activeTurns`, result type `PMKPIResult.activeMakeReadys → activeTurns`), test descriptions, and inline comments. Use `grep -r "Make Ready\|makeReady\|make_ready\|MakeReady"` to find all occurrences before starting. The rename is a standalone phase — do not mix it with feature additions or it becomes impossible to review.

**Warning signs:**
- PR diff shows UI label changes but interface property names unchanged
- A test description says "make ready" while the KPI function is now called "turn"
- New features added to the codebase use both terminologies in the same file

**Phase to address:**
Dedicated terminology rename phase, completed before any new feature is added. It should be a standalone, reviewable diff.

---

### Pitfall 4: Inline Date Input Creates Two Data Entry Paths That Fight Over Cache Invalidation

**What goes wrong:**
Adding an inline `<input type="date">` to the Open Turns list row means a PM can set `readyToLeaseDate` directly from the list without navigating to the turn detail page. The turn detail page already shows `readyToLeaseDate` as a read-only display field. After the PM sets the date inline and the server action fires, `revalidateTag(CACHE_TAGS.turnRequests)` busts the cache. However, if the PM has the turn detail page open in another tab (or opens it 5 seconds later during the 60s cache window), they see the old read-only value because the detail page fetches `fetchTurnRequestById(id)` which has its own cache entry tagged `CACHE_TAGS.turnRequest(id)`. The two cache tags are not busted together.

**Why it happens:**
Looking at `turn-requests.ts`: `fetchTurnRequests()` uses `cacheTag(CACHE_TAGS.turnRequests)` and `fetchTurnRequestById()` uses `cacheTag(CACHE_TAGS.turnRequests, CACHE_TAGS.turnRequest(id))`. A write to `readyToLeaseDate` that only calls `revalidateTag(CACHE_TAGS.turnRequests)` will bust the list but not the per-turn cache key if the developer forgets the second tag.

**How to avoid:**
The `setLeaseReadyDate` server action must call both `revalidateTag(CACHE_TAGS.turnRequests)` and `revalidateTag(CACHE_TAGS.turnRequest(requestId))`. Write this as a rule in the server action file comment. Add a test that verifies both cache tags are invalidated after a date write — inspect the `revalidateTag` mock calls.

**Warning signs:**
- After setting a lease-ready date inline, navigating to the turn detail shows the old date
- The turn disappears from the Open Turns list (cache busted) but the detail page still shows it as open

**Phase to address:**
Phase implementing the inline lease-ready date entry server action.

---

### Pitfall 5: RM Property-Level Aggregation Requires a Second `fetchTurnRequests` Call Per Property — Multiplying API Costs

**What goes wrong:**
The RM dashboard needs per-property stats (active turns per property, avg turn time per property, revenue exposure per property) for the Property Insights list. The naive implementation fetches turn requests filtered per property: one `fetchTurnRequestsForUser(role, [propertyName])` call per property. With 5 properties, that is 5 separate Airtable API calls at page load. The current PM view makes 1 call for all assigned properties. The RM view would make 5× as many calls, and these are not all cache-hits if the RM is the first user of the day.

**Why it happens:**
The existing `fetchTurnRequestsForUser` function already exists and accepts a property array. It is tempting to call it per-property in a `Promise.all()`. This looks clean but generates N Airtable calls (or N separate `use cache` cache entries that all need to warm).

**How to avoid:**
Fetch all turn requests for all RM-assigned properties in a single call, then partition by property name in JavaScript. The existing `fetchTurnRequestsForUser(role, assignedProperties)` already supports multiple properties in one call. Write a `groupTurnsByProperty(turnRequests)` aggregation function that takes the full result set and returns a `Map<propertyName, TurnRequest[]>`. Derive all per-property stats from this map without additional fetches.

**Warning signs:**
- The RM page triggers N Airtable API calls on cold cache instead of 1
- Server logs show `rateLimiter.acquire()` called more than 2-3 times per RM page load

**Phase to address:**
Phase implementing the RM aggregation functions and Property Insights list.

---

### Pitfall 6: Active Jobs Table Doubles the Data Fetching Already Done by the Turn List

**What goes wrong:**
The redesigned PM dashboard has two sections: Open Turns list (fetching `TurnRequest[]` with resolved jobs) and a new Active Jobs table (showing all in-flight jobs directly). A naive implementation fetches `fetchJobsForUser(assignedProperties)` separately for the Active Jobs table on top of the `fetchTurnRequestsForUser` call already made for the Open Turns section. The turn requests already have their jobs resolved via `resolveLinkedJobs` in the existing data layer — each `TurnRequest.jobs` is populated. Fetching jobs again is redundant and wastes API budget.

**Why it happens:**
The Active Jobs table is a new feature. The developer adds a new data fetch for it without noticing that `TurnRequest.jobs` already contains the job data. The two fetched datasets are structurally different (one is jobs filtered by property, the other is jobs nested in turn requests), making the duplication non-obvious.

**How to avoid:**
Extract jobs from the already-fetched turn requests: `turnRequests.flatMap(tr => tr.jobs ?? [])`. Filter to non-completed jobs. The Active Jobs table is a view over this data, not a separate data source. No additional Airtable API call needed. If the Active Jobs table needs fields not available via the turn request's linked job resolution (for example, fields not currently mapped in `mapJob`), extend the `Job` type and `mapJob` function rather than adding a second fetch.

**Warning signs:**
- The PM page server component makes more than 1 Airtable API call on cache miss
- The Active Jobs table and the jobs shown in turn rows show different data

**Phase to address:**
Phase implementing the Active Jobs table. Audit the data dependency graph before writing the fetch.

---

### Pitfall 7: Test Suite Breaks When KPI Interface Properties Are Renamed During Redesign

**What goes wrong:**
The 202-test suite includes `pm-kpis.test.ts` and `executive-kpis.test.ts` that test against named result properties: `result.activeMakeReadys`, `result.projectedSpendMTD`, etc. When v1.2 adds new KPI fields (Revenue Exposure, Avg Turn Time, turns-vs-jobs separation) and renames existing ones, the test files must be updated in lockstep. A developer who updates `computePMKPIs` to return `activeTurns` instead of `activeMakeReadys` but does not update the test file gets TypeScript errors at test time — not a runtime surprise, but the tests go red and CI blocks until fixed. The risk is the reverse: tests are updated to match the new interface, but the old test cases are deleted rather than updated, losing coverage.

**Why it happens:**
Renaming an interface property requires changing: the interface definition, the compute function, the component that reads the property, and the test assertions. It is easy to delete old test cases during this multi-file edit and not write new ones for the renamed properties.

**How to avoid:**
When updating KPI interfaces for v1.2, update — do not delete — the existing test cases. The count of test cases for `computePMKPIs` should be at least as large after the rename as before. Add new test cases for new KPI fields (Revenue Exposure) before implementing the formula. New fields that have null-handling edge cases (target date missing, no completed turns) require dedicated test cases.

**Warning signs:**
- The test file line count decreases during a KPI refactor
- A CI run has fewer tests than the prior run after a rename
- `pm-kpis.test.ts` tests compile but no longer test the renamed properties

**Phase to address:**
All phases that touch `computePMKPIs`, `PMKPIResult`, or `ExecutiveKPIResult`.

---

### Pitfall 8: Revenue Exposure Date Arithmetic Produces Negative Values for On-Target Turns

**What goes wrong:**
Revenue Exposure = `$60 × max(0, daysSinceTarget)`. If `daysSinceTarget` is computed as `Math.floor((today - targetDate) / MS_PER_DAY)` and a turn has a target date in the future (it is on schedule), the result is negative. Passing a negative value to the `$60 × days` formula produces a negative revenue exposure. A PM managing 4 on-target turns and 1 overdue turn by 3 days sees Revenue Exposure = `($60 × -5) + ($60 × -3) + ($60 × -8) + ($60 × -2) + ($60 × 3) = -$900` which is nonsensical.

**Why it happens:**
The calculation is `(today - targetDate) × $60` without a `max(0, ...)` clamp. The `daysVacantUntilReady` field in `TurnRequest` is an Airtable computed field that may also return negative values for on-track turns (days until ready, not days past ready).

**How to avoid:**
Use `Math.max(0, daysSinceTarget)` in the revenue exposure formula. In unit tests, include cases where `targetDate` is in the future and assert `exposure === 0`. Document the formula in the function comment: "Revenue Exposure: sum of ($60 × max(0, floor((today - targetDate) / 86400000))) for all active turns with a target date."

**Warning signs:**
- Revenue Exposure KPI shows a negative number
- Total Revenue Exposure is lower than any single overdue turn's individual exposure
- The formula is written as `days * 60` without a clamp

**Phase to address:**
Phase implementing Revenue Exposure KPI computation.

---

### Pitfall 9: RM Middleware Route Update Missed — RM Users Land on Old `/property` View

**What goes wrong:**
The v1.2 design creates a new `/regional` route for the RM dashboard. Currently, `/district/page.tsx` simply redirects to `/property`, so RM users see the PM view with an RM-role filter applied. When the new `/regional` route is built, RM users should be redirected to `/regional` instead of `/property`. If `middleware.ts` and the root redirect logic are not updated, RM users continue landing on `/property` after login and never reach their new dedicated dashboard. The `/regional` route exists but is unreachable through normal navigation.

**Why it happens:**
The middleware `ROLE_ALLOWED_ROUTES` map and the root post-login redirect for the `rm` role both reference `/property`. When a new route is added for RM, both locations must be updated. Developers build the new page and sidebar link but forget the middleware update because middleware is a separate file from the component code.

**How to avoid:**
The RM dashboard phase must include: (1) add `/regional` to `ROLE_ALLOWED_ROUTES` for the `rm` role, (2) update the root redirect for `rm` from `/property` to `/regional`, (3) verify that the old `/district` → `/property` redirect still works or update it to `/regional`. Write a test that simulates RM login and asserts the redirect target is `/regional`.

**Warning signs:**
- The `/regional` page renders correctly when navigated to directly, but RM users always land on `/property` after login
- Sidebar shows the "Regional" link but clicking it causes a 404 or auth redirect
- Manual testing skips checking what happens immediately after login

**Phase to address:**
Phase implementing the RM (`/regional`) dashboard — middleware update is a required deliverable of that phase, not a follow-up.

---

### Pitfall 10: `resolveLinkedJobs` N+1 Pattern Used for the Active Jobs Table

**What goes wrong:**
The Active Jobs table needs a flat list of `Job` records. `resolveLinkedJobs` in `turn-requests.ts` resolves jobs by making one Airtable API call per job record ID found in a turn request. For a PM with 10 open turns averaging 3 jobs each, this is 30 individual Airtable job-record fetches at cold cache. If a developer uses this path to populate the Active Jobs table (by fetching turn requests with resolved jobs, then flattening), they pay for N+1-style resolution unnecessarily. The direct `fetchJobs()` function returns all job records in a single Airtable call filtered by formula.

**Why it happens:**
The existing `fetchTurnRequestsForUser()` path is familiar — it is used everywhere in the PM view. Reusing it for the Active Jobs table feels like code reuse. The `resolveLinkedJobs` cost is invisible at development scale (few records) and only becomes apparent under production load.

**How to avoid:**
Add a `fetchJobsForUser(role, propertyNames)` function to `jobs.ts` following the pattern of `fetchTurnRequestsForUser`. This makes a single Airtable formula-filtered fetch for jobs belonging to the specified properties. Use this function exclusively for the Active Jobs table and the Completed Jobs page. The resolved-jobs path via turn requests is only appropriate when you need jobs in the context of their parent turn (e.g., the Open Turns list where jobs are shown under each turn row).

**Warning signs:**
- The PM page server component calls `resolveLinkedJobs` more than once
- The Active Jobs table data load is noticeably slow compared to the Open Turns list
- Server logs show 15+ Airtable requests on a single PM page load

**Phase to address:**
Phase implementing the Active Jobs table. Add `fetchJobsForUser()` before writing the table component.

---

### Pitfall 11: Completed Jobs Page Applies `isCompleted` Filter Client-Side, Shipping All Jobs to Browser

**What goes wrong:**
The Completed Jobs page shows jobs where `job.isCompleted === true`. If the filter is applied client-side in the `ActiveJobsTable` component (via `useState` or a prop filter), all jobs — including active ones — are fetched server-side and serialized into the initial page payload. For a property with 200 completed jobs and 40 active ones, the browser receives all 240 records even though only completed ones are displayed. This is a data exposure concern (active job details sent to browser unnecessarily) and a payload size concern.

**Why it happens:**
The Completed Jobs page is designed to reuse `ActiveJobsTable` with an `isCompleted` toggle. It is tempting to pass `jobs.filter(j => j.isCompleted)` in the server component or let the client component handle the filter. Both approaches are correct for display but wrong for data minimization.

**How to avoid:**
Filter at the fetch layer. Pass `{ completedOnly: true }` (or equivalent) to `fetchJobsForUser()` so the Airtable query includes `isCompleted: true` in its filter formula. This ensures only completed jobs are fetched, serialized, and sent to the browser. The server component for the Completed Jobs page should receive only `Job[]` where every record is completed — no client-side filtering needed.

**Warning signs:**
- The Completed Jobs page network payload includes jobs with `isCompleted: false`
- The Airtable filter formula in `fetchJobsForUser()` does not include a completed-status condition
- The component receives a `jobs` prop and filters it internally

**Phase to address:**
Phase implementing the Completed Jobs page. The filtering decision must be made in the fetch function, not the component.

---

## Technical Debt Patterns

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|----------------|-----------------|
| Keep `activeMakeReadys` property name, only update display label | Fast rename — one file change | Interface mismatch with new terminology; new developers confused when reading code | Never — rename the identifier too |
| Fetch jobs separately for Active Jobs table instead of extracting from turn requests | Simpler code — no restructuring of data flow | Doubles Airtable API calls; may hit rate limit on RM view | Never — extract from already-fetched data |
| Use `?? 0` fallback for null `targetDate` in revenue exposure | No null checks needed | Silently understates exposure; KPI card lies | Never — null target dates must be counted separately |
| Skip test updates when renaming KPI interface properties | Faster iteration | Tests compile but cover the wrong thing; coverage gap invisible | Never |
| Build RM aggregation as N per-property fetches | Matches existing per-property fetch pattern | N× API calls; cache warm cost scales with property count | Only if RM has exactly 1 property (i.e., never useful) |
| Add inline date input as uncontrolled component (no optimistic UI) | No state management needed | PM sees no feedback after date entry; unclear if save worked | Only for prototype/demo, not production |
| Apply `isCompleted` filter client-side on Completed Jobs page | Reuses `ActiveJobsTable` unmodified | All jobs (including active) serialized to browser; data exposure | Never — filter at the Airtable query level |
| Pre-format currency in KPI compute functions (e.g., `"$1,200"`) | No formatting logic in components | Cannot sort numerically; cannot make arithmetic assertions in tests; locale handling impossible | Never — return raw numbers, format in components |
| Skip middleware update when adding `/regional` route | Route works when navigated to directly | RM users land on PM view after login; new route unreachable via normal flow | Never — middleware update is part of the route phase |

---

## Integration Gotchas

| Integration | Common Mistake | Correct Approach |
|-------------|----------------|------------------|
| Airtable `readyToLeaseDate` write | Write only to `readyToLeaseDate` without setting `status: 'Done'` | Decide the closing contract: either set both fields atomically, or use presence of `readyToLeaseDate` as the sole source of truth for closed state. Pick one and document it. |
| `use cache` + `cacheTag` on turn list vs. per-turn fetch | Busting `CACHE_TAGS.turnRequests` after inline date write but not `CACHE_TAGS.turnRequest(id)` | The `setLeaseReadyDate` action must call `revalidateTag` for both cache keys: the list tag and the per-record tag. |
| RM aggregation from existing per-unit data | Calling `fetchTurnRequestsForUser` per property in `Promise.all` | Call once for all RM properties, partition in JavaScript with `groupTurnsByProperty`. |
| Active Jobs table data source | Adding `fetchJobs()` call separately from the turn list fetch | Extract jobs from `turnRequests.flatMap(tr => tr.jobs ?? [])` — jobs are already resolved by `resolveLinkedJobs`. |
| Revenue exposure with null `targetDate` | Using `tr.targetDate ?? new Date().toISOString()` or `?? 0` | Track null-target-date turns separately, exclude from dollar total, surface the count as a footnote on the KPI card. |
| Middleware route guards | Adding `/regional` page without adding it to `ROLE_ALLOWED_ROUTES` for `rm` | Every new route must be added to `ROLE_ALLOWED_ROUTES` in the middleware AND the role's post-login redirect must be updated. |
| Completed Jobs fetch scope | Fetching all jobs then filtering `isCompleted` client-side | Pass a `completedOnly` parameter to `fetchJobsForUser()` so the Airtable formula excludes active jobs at the source. |
| KPI compute function return types | Returning pre-formatted strings (`"$1,200"`, `"14 days"`) from compute functions | Return raw `number` values; apply `Intl.NumberFormat` or string interpolation in the component layer. |

---

## Performance Traps

| Trap | Symptoms | Prevention | When It Breaks |
|------|----------|------------|----------------|
| N per-property fetches for RM Property Insights | RM page load triggers 5+ Airtable calls on cold cache; rate limiter queues requests | Single fetch + in-memory partition by property name | From the first RM user if >2 properties |
| Duplicate jobs fetch (Active Jobs table + turn list) | PM page triggers 2 Airtable calls instead of 1; joins take twice as long | Extract jobs from resolved turn requests | From day 1 of Active Jobs table feature |
| Re-computing revenue exposure per render | Revenue exposure recalculated on every component render if not memoized | Put revenue exposure calculation inside the `computePMKPIs` pure function (already called once per Suspense boundary) | Not a real-scale problem with 6-15 users, but worth keeping clean |
| Inline date input triggers full page revalidation for every keypress | User types a date character-by-character; each character fires a server action | Use a controlled `<input>` that fires the server action only on `blur` or explicit save button, not `onChange` | From the first PM user entering a date |
| `resolveLinkedJobs` used for flat jobs table | PM page shows 30+ Airtable calls in server logs; Active Jobs table is slow to load | Add `fetchJobsForUser()` that makes one filtered Airtable call; use this for the Active Jobs and Completed Jobs pages | At any scale — even small data sets pay the N+1 cost |

---

## Security Mistakes

| Mistake | Risk | Prevention |
|---------|------|------------|
| Adding `setLeaseReadyDate` server action without role check | A user with `exec` or `rm` role who cannot normally edit turns calls the action directly | Every server action must verify `user.app_metadata.role` allows writes; PMs write, RMs/Execs are read-only on turn date actions |
| Exposing `targetDate` in a client-side calculation | Revenue exposure formula client-side leaks business data to browser devtools | All revenue exposure computation in server components or server actions; never in `'use client'` components |
| Inline date input that writes directly to Airtable without sanitization | Malformed date string written to Airtable corrupts the `readyToLeaseDate` field | Parse and validate the date string server-side before writing: `new Date(input)` must produce a valid date; reject otherwise |
| Completed Jobs page fetching all jobs then filtering client-side | Active job details (vendor, price, status) sent to browser unnecessarily | Apply `isCompleted: true` filter in the Airtable fetch formula, not in the component |
| `/regional` route not added to middleware `ROLE_ALLOWED_ROUTES` | Exec or PM users can access RM-scoped data by navigating directly to `/regional` | Add `/regional` to `ROLE_ALLOWED_ROUTES` with `rm`-only access; middleware rejects other roles |

---

## UX Pitfalls

| Pitfall | User Impact | Better Approach |
|---------|-------------|-----------------|
| Inline date input with no save confirmation | PM enters a date, nothing visible happens; they click again, setting it twice or clearing it | Show a subtle "Saved" indicator (checkmark or green flash) after the server action resolves; use optimistic UI to show the date immediately |
| Revenue Exposure shown as "$0" when target dates are missing | PM trusts the number; real exposure is hidden | Show "$X,XXX + 3 turns without target dates" rather than an incomplete total |
| "Active Jobs" table showing all jobs including completed ones | Table is too long; PMs scan for stuck jobs but see completed ones first | Filter to non-completed jobs only; add a "Show completed" toggle or a link to the Completed Jobs page |
| Turn lifecycle closed by entering lease-ready date but turn still appears in list for ~60s | PM enters the date, turn disappears, PM thinks it vanished; checks Airtable to confirm | Optimistic removal: remove the turn from the list client-side immediately on date entry, before the server revalidation completes |
| RM Property Insights list showing KPIs calculated differently than PM view | RM sees "3 active turns" for Property A, PM logs in and sees "4 active turns" for same property | Use the same computation function (`computePMKPIs`) for both views; RM view applies it per-property to a filtered subset |
| RM users landing on PM view after login (wrong dashboard) | RM users see PM-scoped data rather than their aggregated multi-property view | Update root redirect for `rm` role to `/regional`; do not leave it pointing to `/property` |
| Completed Jobs page shows all properties without a filter indicator | Users don't realize they can filter; assume they are seeing all jobs | Default to "All Properties" selected with a visible filter control; show the count of matching jobs |

---

## "Looks Done But Isn't" Checklist

- [ ] **Terminology rename:** Visual scan of UI shows "Turns" everywhere — verify TypeScript identifiers, test descriptions, and server action names in `grep -r "makeReady\|make_ready\|MakeReady\|Make Ready" src/`
- [ ] **Revenue Exposure KPI:** KPI card shows a dollar number — verify it shows "$0" for turns with future target dates (not negative), and surfaces a count of turns with null target dates
- [ ] **Inline lease-ready date:** Date input appears in the turn row — verify: (a) server action sets `status: 'Done'` or equivalent, (b) both `CACHE_TAGS.turnRequests` and `CACHE_TAGS.turnRequest(id)` are busted, (c) the turn disappears from the Active list after saving
- [ ] **Active Jobs table:** Table renders jobs — verify data comes from `turnRequests.flatMap(tr => tr.jobs)` or `fetchJobsForUser()` (not via `resolveLinkedJobs` N+1 path), and that completed jobs are filtered out
- [ ] **RM Property Insights:** Per-property stats show correct numbers — verify aggregation uses a single `fetchTurnRequestsForUser` call and partitions in JavaScript, not N separate calls
- [ ] **Turn/Job separation:** Completing all jobs on a turn does NOT close the turn — verify a turn with all `Job.status === 'Completed'` still appears in the Open Turns list until a lease-ready date is entered
- [ ] **Test count maintained:** After KPI interface rename, test count in `pm-kpis.test.ts` is >= the count before the rename
- [ ] **Role guard on server actions:** `setLeaseReadyDate` and any write server action rejects non-PM roles with an appropriate error
- [ ] **RM middleware routing:** After RM login, user lands on `/regional` (not `/property`); direct navigation to `/regional` by exec or PM roles results in redirect, not 200 OK
- [ ] **Completed Jobs fetch scope:** Network tab on Completed Jobs page shows no jobs with `isCompleted: false` in the serialized payload
- [ ] **KPI return types:** `computePMKPIs()`, `computeRMKPIs()`, `computeExecutiveKPIs()` all return raw numbers — no string values like `"$1,200"` in the returned objects

---

## Recovery Strategies

| Pitfall | Recovery Cost | Recovery Steps |
|---------|---------------|----------------|
| Turn closed by old status dropdown AND new date entry — inconsistent state | MEDIUM | Write a one-time data repair script: fetch all turns where `status === 'Done'` but `readyToLeaseDate` is null, and vice versa; log the inconsistencies for manual review in Airtable |
| Revenue Exposure showing wrong totals due to null handling | LOW | Fix the aggregation function, update tests; no data corruption (read-only calculation) |
| Cache tag not invalidated after inline date write — stale data displayed | LOW | Add missing `revalidateTag` call to server action; users will see fresh data after next natural 60s cache expiry |
| RM page slow due to N per-property fetches — discovered in production | MEDIUM | Refactor to single fetch + in-memory partition; deploy; cache warms on next RM load |
| Test count decreases after KPI rename — coverage gap | MEDIUM | Restore deleted test cases from git history; add new cases for renamed properties; add CI test count assertion to prevent recurrence |
| RM users landing on wrong dashboard post-login | LOW | Update middleware redirect for `rm` role; redeploy; no data consequences |
| Completed Jobs page leaking active job data to browser | LOW-MEDIUM | Add `completedOnly` filter to `fetchJobsForUser()`; redeploy; no data corruption (read-only issue) |
| KPI compute functions returning pre-formatted strings | LOW | Update return type to raw numbers; update components to format; update tests |

---

## Pitfall-to-Phase Mapping

| Pitfall | Prevention Phase | Verification |
|---------|------------------|--------------|
| Turn Done signal conflicts (Pitfall 1) | PM dashboard redesign phase — before writing any turn-closing UI | Integration test: turn with all completed jobs still appears in Open Turns list |
| Revenue Exposure null target dates (Pitfall 2) | Revenue Exposure KPI phase — before writing the formula | Unit test: mixed null/non-null target dates produces correct total + excluded count |
| Partial terminology rename (Pitfall 3) | Terminology rename phase (standalone, first phase) | `grep -r "Make Ready\|makeReady" src/` returns 0 results |
| Cache tag split on inline date write (Pitfall 4) | Inline lease-ready date phase — server action implementation | Test: mock `revalidateTag`, assert both tags are called |
| RM N-fetch aggregation (Pitfall 5) | RM dashboard phase — before writing per-property stats | Server log: RM page triggers exactly 1 Airtable call on cold cache |
| Active Jobs duplicate fetch (Pitfall 6) | Active Jobs table phase — data dependency audit before new fetch | Server log: PM page triggers exactly 1 Airtable call on cold cache |
| KPI test coverage loss during rename (Pitfall 7) | All KPI-touching phases | Test count >= prior count; CI fails if count decreases |
| Revenue Exposure negative values (Pitfall 8) | Revenue Exposure KPI phase — formula implementation | Unit test: turn with future target date produces $0 exposure |
| RM middleware routing missing (Pitfall 9) | RM dashboard phase — middleware update is part of the phase scope | Integration test: RM login redirects to `/regional`; exec login to `/regional` redirects away |
| `resolveLinkedJobs` N+1 for Active Jobs (Pitfall 10) | Active Jobs table phase — data layer decision made before component | Server log: Active Jobs table triggers 1 Airtable call, not N |
| Completed Jobs client-side filter (Pitfall 11) | Completed Jobs page phase — filter decision in fetch function | Browser network tab: page payload contains only `isCompleted: true` records |

---

## Sources

- Direct code analysis: `src/lib/kpis/pm-kpis.ts`, `src/lib/kpis/executive-kpis.ts`, `src/lib/types/airtable.ts`, `src/lib/airtable/tables/turn-requests.ts`
- Component analysis: `src/app/(dashboard)/property/_components/pm-turn-list.tsx`, `pm-kpis.tsx`
- Cache architecture: `src/lib/airtable/cache-tags.ts`, `use cache` + `cacheTag` pattern in turn-requests.ts
- Test inventory: 20 test files, 202 passing tests — `pm-kpis.test.ts`, `executive-kpis.test.ts` are the KPI coverage files
- Middleware analysis: `src/middleware.ts` — `ROLE_ALLOWED_ROUTES`, post-login redirect logic
- Architecture research: `.planning/research/ARCHITECTURE.md` — anti-patterns section, build order, component responsibility table
- v1.2 requirements: `.planning/PROJECT.md` (Active requirements section, Current Milestone)
- Prior pitfalls research: `.planning/research/PITFALLS.md` v1.0 (2026-03-17) — Airtable API pitfalls, now extended with v1.2-specific integration and routing pitfalls

---
*Pitfalls research for: v1.2 Dashboard Redesign — Turn/Job separation, inline date entry, revenue exposure, property-level aggregation, RM routing, Completed Jobs page*
*Researched: 2026-03-18*
