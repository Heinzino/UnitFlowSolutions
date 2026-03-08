# Domain Pitfalls

**Domain:** Airtable-backed Next.js property management dashboard
**Researched:** 2026-03-08
**Confidence:** HIGH (based on actual project data analysis + known Airtable API behavior)

## Critical Pitfalls

Mistakes that cause rewrites, data corruption, or broken user experiences.

---

### Pitfall 1: Property Name Mismatch Between Supabase Roles and Airtable Data

**What goes wrong:** The `Property_Managers` table in Airtable stores `"Park Point Apartments"` in the "Property Managed" field, but the `Properties` table stores `"Park Point"` as the property name. When Supabase `user_profiles.assigned_properties` is populated (presumably matching one of these), `filterByFormula` queries will silently return zero records if the wrong variant is used. Users log in and see an empty dashboard with no error.

**Evidence from data:**
- `Property_Managers` CSV: `Park Point Apartments` (line 2)
- `Properties` CSV: `Park Point` (lines 2-4)
- Other properties match (`Sunrise Villas`, `Oak Terrace`) but this inconsistency exists for the primary test property.

**Why it happens:** Airtable has no referential integrity enforcement. The "Property Managed" field in Property_Managers is free text, not a linked record to the Properties table. Humans type different variants.

**Consequences:**
- Property Managers see empty dashboards despite having active turns
- Silent failure -- no error thrown, just zero results from `filterByFormula`
- Debugging is painful because the query looks correct syntactically

**Prevention:**
1. Build a property name normalization layer in `src/lib/airtable/properties.ts` that fetches all canonical property names from the Properties table and maps known variants
2. On app startup (or cached), load the canonical property name list and validate `user_profiles.assigned_properties` against it
3. Use `FIND()` for partial matching in `filterByFormula` as a fallback: `FIND("Park Point", {Property Name})` instead of exact equality
4. Add a health-check endpoint or admin page that flags mismatches between Supabase assigned properties and Airtable property names

**Detection (warning signs):**
- A user reports "I see no data" after login
- During development: write a test that fetches all distinct property names from Properties table and compares against Property_Managers "Property Managed" values
- Log when `filterByFormula` returns 0 records for a user who should have data

**Phase:** Address in Phase 3 (Airtable API Integration Layer). The normalization layer must exist before any view is built.

---

### Pitfall 2: Airtable Linked Records Return Opaque Record IDs, Not Data

**What goes wrong:** When you fetch a Turn Request record, the `Jobs` field contains an array like `["rec1abc", "rec2def"]` -- raw Airtable record IDs, not job objects. Developers build the UI expecting nested data (like a SQL JOIN) and get meaningless ID strings. This forces a second round of API calls to resolve each linked record, which quickly exhausts the 5 req/sec rate limit.

**Why it happens:** Airtable's REST API is not a relational database. Linked record fields only return record IDs. Lookup fields (like "Property Name" on Jobs) DO return resolved values because they're computed fields, but linked records themselves are just ID arrays.

**Consequences:**
- N+1 query explosion: 10 turn requests with 3 jobs each = 10 + 30 = 40 API calls for one page load
- Rate limit hit (429 errors) within seconds on pages that display turn details
- Slow page loads even with rate limiting (queued requests)

**Prevention:**
1. Use batch resolution: collect all linked record IDs across all fetched records, deduplicate, then fetch in a single `OR(RECORD_ID()='rec1', RECORD_ID()='rec2', ...)` call (Airtable allows up to ~15-20 record IDs per formula before hitting URL length limits)
2. Rely on Lookup fields wherever possible -- the Airtable schema already has lookups like "Property Name" and "Vendor Name" on the Jobs table, which return resolved values without extra API calls
3. Cache resolved records aggressively -- linked records rarely change between requests
4. For the Turn Request detail page, fetch Jobs filtered by Turn Request ID rather than resolving individual record IDs: `filterByFormula: OR({Request ID (from Turn Requests)}=38, {Request ID (from Turn Requests)}=39)`

**Detection:**
- Monitor API call count per page load during development
- Any page that makes more than 3-4 Airtable API calls is a red flag
- Watch for 429 responses in server logs

**Phase:** Address in Phase 3. The linked record resolution strategy must be designed before building views.

---

### Pitfall 3: Airtable Rate Limit (5 req/sec) Causes Cascading Failures Under Concurrent Users

**What goes wrong:** The 5 req/sec limit is per API key, not per user. When User A triggers a cache miss and User B does the same 200ms later, both generate real API calls. With 6-15 users checking the dashboard at similar times (e.g., morning standup), uncached requests pile up. A naive implementation queues requests but the queue grows faster than it drains, causing timeouts.

**Why it happens:** Next.js Server Components on Vercel run in serverless functions. Each invocation is independent -- there is no shared in-memory rate limiter across function instances. A token-bucket in `rate-limiter.ts` only works within a single function invocation.

**Consequences:**
- 429 errors from Airtable (30-second backoff required)
- Cascading timeouts: one slow request blocks the queue, subsequent requests time out
- Vercel serverless function timeout (default 10s on Hobby, 60s on Pro) kills in-flight requests
- Users see loading spinners that never resolve

**Prevention:**
1. Cache is the primary defense, not rate limiting. With 60s `unstable_cache`, the rate limiter should almost never activate. Verify that cache is working by checking that repeat page loads within 60s produce zero Airtable API calls.
2. For the rate limiter to work across serverless instances, consider using Vercel KV (Redis) for a shared token bucket -- but this is likely overkill for 6-15 users. Simpler approach: rely entirely on cache and accept that cold starts may briefly exceed the limit.
3. Implement retry with exponential backoff on 429 responses (Airtable recommends 30s, but try shorter intervals first: 1s, 2s, 4s)
4. Batch parallel fetches using `Promise.all()` but limit concurrency to 4 simultaneous requests using a semaphore pattern
5. Pre-warm cache on deployment or via a cron job that hits the main data endpoints

**Detection:**
- Log every real Airtable API call (not cache hits) with timestamps
- Alert if more than 5 calls happen within any 1-second window
- Monitor for 429 responses

**Phase:** Address in Phase 3 (rate-limiter.ts and cache.ts). Test under simulated concurrent load before Phase 4.

---

### Pitfall 4: `unstable_cache` Is Literally Unstable -- API May Change Between Next.js Versions

**What goes wrong:** The PLAN.md specifies `unstable_cache` for caching Airtable responses. This API is marked unstable in Next.js and has changed behavior between versions. In Next.js 15, `unstable_cache` was replaced/supplemented by the `use cache` directive and `cacheLife`/`cacheTag` APIs. Building the entire data layer on an unstable API means a Next.js upgrade could break all caching silently.

**Why it happens:** Next.js moves fast and deprecates experimental APIs. The `unstable_` prefix is a literal warning.

**Consequences:**
- After a Next.js upgrade, caching may silently stop working -- every page load hits Airtable directly
- Rate limit immediately exceeded under normal usage
- Or worse: cache behavior changes (e.g., longer default TTL) and users see stale data for minutes

**Prevention:**
1. Wrap all caching behind an abstraction layer in `src/lib/airtable/cache.ts` so the caching mechanism can be swapped without touching every data function
2. Check the Next.js version at project start and use the stable caching API available for that version. For Next.js 15+, prefer `use cache` with `cacheLife` and `cacheTag` if available in stable form.
3. Pin the Next.js version in `package.json` (exact version, not `^`) to prevent accidental upgrades
4. Add a cache health check: a test or monitoring that verifies cache hits are occurring

**Detection:**
- After any Next.js upgrade, check server logs for increased Airtable API call volume
- Write a test that fetches the same data twice within 60s and asserts only 1 real API call was made
- Monitor Airtable API usage in the Airtable dashboard

**Phase:** Address in Phase 1 (scaffolding -- pin Next.js version) and Phase 3 (build the cache abstraction layer).

---

### Pitfall 5: Airtable `filterByFormula` URL Length Limit Breaks Large Queries

**What goes wrong:** When resolving linked records or filtering by multiple property names, the formula string is embedded in the URL query parameter. URLs have practical limits (~2000 characters for safe browser/proxy compatibility, ~16KB for Airtable's API). A formula like `OR(RECORD_ID()='recXXX', RECORD_ID()='recYYY', ...)` with 50+ record IDs exceeds this limit and the request silently truncates or returns a 422 error.

**Why it happens:** Airtable's REST API passes the filter formula as a URL query parameter, not a POST body. The more records you try to batch-resolve, the longer the URL.

**Consequences:**
- 422 Unprocessable Entity errors on pages with many linked records
- Missing data -- if the URL silently truncates, some records are never fetched
- Particularly dangerous for the Executive view which aggregates across ALL properties

**Prevention:**
1. Chunk batch record ID resolution into groups of 10-15 IDs per request
2. For the Executive view, avoid record-ID-based resolution entirely. Instead, fetch all records from a table (e.g., all Jobs) and filter in-memory using JavaScript. The total record count is small enough (currently ~40 jobs) that fetching all and filtering client-side is more efficient than complex formulas.
3. Use Airtable views (pre-filtered server-side) as an alternative to complex formulas where possible
4. Monitor formula string length before sending the request -- log a warning if it exceeds 1500 characters

**Detection:**
- 422 errors in server logs from Airtable
- A page that works with 5 properties but breaks when a 6th is added
- Executive dashboard showing fewer jobs than Airtable native interface

**Phase:** Address in Phase 3 when building the query layer. Test with realistic data volume.

---

## Moderate Pitfalls

### Pitfall 6: Airtable Pagination Returns Max 100 Records Per Page

**What goes wrong:** The Airtable SDK's `.select()` returns at most 100 records per page. If you don't iterate through all pages, you silently lose records. The current dataset is small (~40 jobs), but as the business grows, a property with 100+ historical turn requests will silently truncate.

**Prevention:**
1. Always use the SDK's `.all()` method or `.eachPage()` callback to ensure full pagination
2. Never use `.firstPage()` for production queries -- it's a trap that works during development and breaks in production
3. Log the record count returned vs the total expected (Airtable doesn't provide a total count, so compare against known benchmarks)

**Detection:**
- Data counts in the dashboard don't match Airtable's native interface
- KPI aggregations (e.g., "Jobs Completed Last 30 Days") show lower numbers than expected

**Phase:** Phase 3. Enforce in code review -- every Airtable query must use `.all()`.

---

### Pitfall 7: Server Actions for Writes Don't Validate Against Stale UI State

**What goes wrong:** User A views a job with status "NEEDS ATTENTION" and clicks "Approve Pricing." Between when they loaded the page and when they clicked, User B already changed the status to "Completed." The server action blindly overwrites Airtable with the stale action, reverting the job to an incorrect state.

**Why it happens:** Airtable has no optimistic concurrency control (no ETags, no version fields). The last write wins.

**Consequences:**
- Data regression -- completed jobs get reverted to earlier statuses
- Particularly dangerous for pricing approval: a quote could be approved after it was already rejected and a new vendor assigned

**Prevention:**
1. In every server action, fetch the current record state from Airtable before applying the update. If the status has changed since the UI was rendered, reject the action and force a page refresh.
2. Use `revalidateTag()` after every write to ensure the UI reflects the latest state
3. For critical actions (pricing approval), add a confirmation step that shows the current state fetched in real-time

**Detection:**
- Users report that changes "disappear" or "revert"
- Airtable audit log shows rapid back-and-forth status changes

**Phase:** Phase 5 (Property Manager actions). Implement the "read-before-write" pattern in server actions.

---

### Pitfall 8: Duplicate Vendor Records in Airtable Cause Incorrect Aggregations

**What goes wrong:** The Vendors table has duplicate entries -- "NextGen Flooring" appears twice with slightly different record IDs but the same name. Aggregation functions that count "Jobs per Vendor" will split the count across duplicates, showing misleading metrics on the Vendor Metrics page.

**Evidence from data:**
- Vendors CSV lines 6-7: Two "NextGen Flooring" records with different record IDs, different phone number formats, and different job assignments

**Prevention:**
1. Aggregate vendor metrics by vendor NAME, not by record ID. Group duplicates together in the aggregation layer.
2. Add a data quality check that flags duplicate vendor names on the Vendor Metrics page (a small warning banner)
3. Do NOT attempt to deduplicate in Airtable from the dashboard -- this is "work with existing schema" territory

**Detection:**
- Vendor Metrics page shows the same vendor name multiple times with different stats
- Total job counts per vendor don't add up to the total jobs in the system

**Phase:** Phase 7 (Vendor Metrics page). Handle in the aggregation functions.

---

### Pitfall 9: Airtable Attachment URLs Are Temporary (Expire After ~2 Hours)

**What goes wrong:** Attachment fields (photos on Turn Requests, invoices on Jobs) return URLs that include authentication tokens with a TTL. If you cache the Airtable response for 60 seconds, the URLs work. But if you cache longer, store URLs in any persistent cache, or render them in a page that stays open for hours, the images break with 403 errors.

**Why it happens:** Airtable generates signed URLs for attachments that expire. This is documented but easy to miss.

**Consequences:**
- Broken image icons on turn detail pages
- Invoice PDFs that can't be downloaded
- Users think the data is corrupted

**Prevention:**
1. Never persist Airtable attachment URLs in any long-term cache or database
2. The 60s cache TTL is safe -- URLs last ~2 hours. But add a comment in the code explaining why attachment caching must stay short.
3. If displaying attachments, add error handling (fallback placeholder image, retry button that re-fetches)
4. For Phase 2 scope (photos are out of scope), this is a "when you get there" warning

**Detection:**
- Broken images appearing after a page has been open for a while
- 403 errors in browser console for airtableusercontent.com URLs

**Phase:** Relevant when attachments are implemented (currently out of scope for v1, but Notes with attachments are in Phase 5). Document this constraint early.

---

### Pitfall 10: Middleware Fetching Supabase Profile on Every Request Creates Latency

**What goes wrong:** The PLAN.md specifies that middleware fetches the user role from `user_profiles` on every request to enforce route protection. Middleware runs on the edge (Vercel Edge Runtime) but Supabase queries add 50-200ms per request. On a page with multiple Server Component parallel fetches, this latency compounds.

**Prevention:**
1. Cache the user profile in the Supabase session JWT claims or in a short-lived cookie after first fetch
2. Only fetch the full profile from `user_profiles` on login and role changes, not on every request
3. Middleware should only verify the session token (fast) and read role from the token/cookie, not query the database

**Detection:**
- Every navigation feels slow (200ms+ before the page even starts rendering)
- Supabase dashboard shows high query volume on `user_profiles`

**Phase:** Phase 2 (Authentication). Design the session/role caching strategy before building middleware.

---

## Minor Pitfalls

### Pitfall 11: Airtable Field Names with Spaces and Parentheses Break Destructuring

**What goes wrong:** Airtable field names like `"Duration (Days, If Completed)"`, `"Counter Quote (NEW)"`, and `"Start Date NEW"` contain spaces, parentheses, and mixed casing. JavaScript destructuring and dot notation don't work. Developers write `record.fields.Status` (works) and then `record.fields.Counter Quote (NEW)` (syntax error).

**Prevention:**
1. In `src/lib/airtable/types.ts`, define a field name mapping that converts Airtable field names to clean TypeScript property names
2. Build a record transformer function that maps raw Airtable records to typed objects with clean keys
3. Never access `record.fields[...]` directly outside the data layer -- always go through the typed interface

**Phase:** Phase 3. The type definitions and field mapping are foundational.

---

### Pitfall 12: `NaN` Values in Airtable Computed Fields

**What goes wrong:** The Turn Requests CSV shows `Time to Complete Unit (Days)` = `NaN` for record 42 (a turn request with no Target Date set). Airtable formula fields that divide by zero or reference empty fields produce `NaN`. If the dashboard passes this to KPI computations or chart components, React will render "NaN" as text or crash.

**Evidence from data:** Turn Request 42: `Time to Complete Unit (Days)` = `NaN`, `Target Date` is empty

**Prevention:**
1. In the record transformer, coerce `NaN` and `null` numeric fields to `0` or `undefined` with explicit handling
2. KPI aggregation functions must filter out `NaN` values before computing averages (otherwise one `NaN` poisons the entire average)
3. Display components should show "N/A" or "--" for undefined/NaN values, never the raw string

**Phase:** Phase 3 (data layer) and Phase 4 (KPI display).

---

### Pitfall 13: Vercel Serverless Function Cold Starts + Airtable Latency Stack

**What goes wrong:** On Vercel's Hobby plan, serverless functions have a 10-second timeout. A cold start (500ms-1s) plus rate-limited Airtable calls (200-400ms each) plus multiple sequential fetches can exceed 10 seconds. The Executive dashboard with 6+ KPI cards, each requiring an Airtable call, is the most vulnerable.

**Prevention:**
1. Use `Promise.all()` for parallel data fetches within a single Server Component
2. Fetch data at the page level and pass to components as props, rather than each component fetching independently
3. Consider Vercel Pro for 60s timeout if cold start + Airtable latency becomes a problem
4. Pre-warm critical routes with a cron job (Vercel cron or external)

**Phase:** Phase 4 (Executive dashboard). Monitor function execution times.

---

## Phase-Specific Warnings

| Phase Topic | Likely Pitfall | Mitigation |
|-------------|---------------|------------|
| Phase 1: Scaffolding | Pitfall 4: unstable_cache API instability | Pin Next.js version, build cache abstraction |
| Phase 2: Auth | Pitfall 10: Middleware latency from DB queries | Cache role in JWT/cookie, not per-request DB query |
| Phase 2: Auth | Pitfall 1: Property name mismatch | Validate assigned_properties against Airtable canonical names |
| Phase 3: Airtable Layer | Pitfall 2: Linked record N+1 queries | Batch resolution, prefer lookup fields |
| Phase 3: Airtable Layer | Pitfall 3: Rate limit under concurrency | Cache-first strategy, concurrency limiter |
| Phase 3: Airtable Layer | Pitfall 5: filterByFormula URL length | Chunk ID batches, fetch-all for small tables |
| Phase 3: Airtable Layer | Pitfall 6: Silent pagination truncation | Always use `.all()`, never `.firstPage()` |
| Phase 3: Airtable Layer | Pitfall 11: Messy field names | Field name mapping in types.ts |
| Phase 3: Airtable Layer | Pitfall 12: NaN in computed fields | Coerce in record transformer |
| Phase 4: Executive View | Pitfall 13: Cold start + latency stack | Parallel fetches, single page-level data load |
| Phase 5: PM Actions | Pitfall 7: Stale write conflicts | Read-before-write in server actions |
| Phase 7: Vendor Metrics | Pitfall 8: Duplicate vendor records | Aggregate by name, not record ID |

## Sources

- Airtable REST API documentation (rate limits: 5 req/sec per base, pagination: 100 records max, attachment URL expiry)
- Direct analysis of project CSV snapshots in `SnapshotData/` (property name mismatch, NaN values, duplicate vendors)
- Next.js App Router documentation (unstable_cache deprecation path, Server Component data fetching patterns)
- PLAN.md architecture decisions and identified challenges
- Vercel serverless function limits (timeout constraints per plan tier)
