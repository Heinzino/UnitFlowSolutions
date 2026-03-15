# Phase 9: Documentation & Verification Cleanup - Research

**Researched:** 2026-03-15
**Domain:** Documentation gap closure — VERIFICATION.md authoring, REQUIREMENTS.md corrections, SUMMARY frontmatter repairs
**Confidence:** HIGH

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| DATA-01 | All Airtable access is server-side only (API key never exposed to browser) | Verified in 03-01-SUMMARY.md + 03-VALIDATION.md; client.test.ts and rate-limiter.test.ts exist and pass |
| DATA-02 | Read data from all 9 Airtable tables with correct TypeScript type mappings | Verified in 03-02-SUMMARY.md; mappers.test.ts has 13 tests covering all mapping scenarios |
| DATA-03 | Cache responses with 60s TTL using Next.js caching with tag-based revalidation | Verified in 03-01-SUMMARY.md; next.config.ts confirmed with cacheComponents: true + airtableData profile |
| DATA-04 | Rate limiter prevents exceeding Airtable's 5 req/sec limit | Verified in 03-01-SUMMARY.md; rate-limiter.test.ts tests burst, delay, refill scenarios |
| DATA-05 | Linked record IDs resolved via batch fetches (no N+1 queries) | Verified in 03-02-SUMMARY.md; buildJobFilterFormula tested in mappers.test.ts |
| DATA-06 | Write operations (status updates) bust relevant cache tags immediately | Verified in 03-03-SUMMARY.md; job-status.test.ts has 5 tests including revalidateTag assertions |
| NOTIF-01 | Descoped — middle column notifications not built | 07-VERIFICATION.md and 07-CONTEXT.md document the descope decision explicitly |
| NOTIF-02 | Descoped — alert type notifications not built | Same as NOTIF-01 |
| NOTIF-03 | Descoped — notification icons/timestamps not built | Same as NOTIF-01 |
| NOTIF-04 | Descoped — notification navigation not built | Same as NOTIF-01 |
| AUTH-02 | User redirected to role-appropriate dashboard (PM → /property, RM → /property, Exec → /executive) | REQUIREMENTS.md still says "DM → /district" — stale after Phase 6 rm rename; fix needed |
</phase_requirements>

---

## Summary

Phase 9 is a pure documentation and records-management phase. No production code changes. All three tasks involve editing planning documents to close gaps identified by the v1.0 milestone audit (`.planning/v1.0-MILESTONE-AUDIT.md`).

**Gap 1 — Phase 3 missing VERIFICATION.md:** Phase 3 was executed and all 6 DATA requirements (DATA-01 through DATA-06) were satisfied across three plans, but no formal VERIFICATION.md was written at the time. The code is correct; only the documentation is missing. The verification document must be written by inspecting the existing artifacts from 03-01-SUMMARY.md, 03-02-SUMMARY.md, 03-03-SUMMARY.md and the test files that currently exist on disk.

**Gap 2 — REQUIREMENTS.md documentation mismatches:** NOTIF-01 through NOTIF-04 are marked `[x] Complete` but were explicitly descoped. AUTH-02 still references "DM → /district" — stale since Phase 6 renamed the role from `dm` to `rm` and remapped the route from `/district` to `/property`.

**Gap 3 — Phase 7 SUMMARY frontmatter gaps:** VIZ-01, VIZ-02, VIZ-03, and VIZ-04 are missing from `requirements_completed` fields in the 07-XX-SUMMARY.md files. The audit (v1.0-MILESTONE-AUDIT.md line 110) flags this as tech debt. VIZ-03 was satisfied in 07-01, VIZ-04 was pre-existing from Phase 4 and re-verified in 07-01, VIZ-01 and VIZ-02 were satisfied in 07-03.

**Primary recommendation:** Treat this phase as three independent document-editing tasks. No code execution, no test runs, no server interaction needed. All evidence for verification claims already exists in the SUMMARY files, test output counts, and the milestone audit.

---

## What Each Gap Requires

### Gap 1: Write 03-VERIFICATION.md

**What to produce:** A VERIFICATION.md file at `.planning/phases/03-airtable-data-layer/03-VERIFICATION.md` following the same structure used in 07-VERIFICATION.md and 08-VERIFICATION.md.

**Evidence already available (no new investigation needed):**

| DATA Req | Evidence Source | Key Claim |
|----------|----------------|-----------|
| DATA-01 | 03-01-SUMMARY.md + client.test.ts exists | API key checked via `AIRTABLE_API_KEY` env var; no `NEXT_PUBLIC_` prefix; env var guard throws at module load time |
| DATA-02 | 03-02-SUMMARY.md + mappers.test.ts 13 tests | mapTurnRequest, mapJob, mapProperty, mapVendor, etc. tested; all 9 table interfaces defined |
| DATA-03 | 03-01-SUMMARY.md + next.config.ts | cacheComponents: true, airtableData profile (stale:60, revalidate:60, expire:300) |
| DATA-04 | 03-01-SUMMARY.md + rate-limiter.test.ts 3 tests | TokenBucket capacity=5, refillRate=5/1000, burst/delay/refill tests |
| DATA-05 | 03-02-SUMMARY.md + mappers.test.ts | buildJobFilterFormula builds OR({Job ID}=N,...) for batch fetch; resolveLinkedJobs uses single fetchJobsByIds call |
| DATA-06 | 03-03-SUMMARY.md + job-status.test.ts 5 tests | updateJobStatus calls revalidateTag(tag, { expire: 0 }) for all 5 cache tags on success |

**Verification approach for each requirement:** Static code inspection (grep/read files). No live Airtable API calls needed because:
- DATA-01 verified by absence of NEXT_PUBLIC_ prefix in env var usage
- DATA-02 verified by existence of interfaces + passing mapper tests
- DATA-03 verified by reading next.config.ts for cacheComponents key
- DATA-04 verified by reading rate-limiter.ts implementation + test count
- DATA-05 verified by reading turn-requests.ts resolveLinkedJobs function + mappers.test.ts
- DATA-06 verified by reading job-status.ts + job-status.test.ts revalidateTag assertions

**Verification format to follow:** Match 07-VERIFICATION.md structure exactly:
- Frontmatter with status, score, human_verification list
- Goal Achievement section with Observable Truths table
- Required Artifacts section with file-by-file evidence
- Key Link Verification section
- Requirements Coverage section
- Commits Verified section (from SUMMARY files)

**Human verification items for Phase 3:** The only behavior that requires a live environment is:
1. Actual Airtable API calls — confirms field mapping is correct against live data (not just unit-tested mocks)
2. Cache TTL behavior — confirms 60s caching actually occurs in a running Next.js app

All other DATA requirements are verifiable statically.

**Files to inspect when writing 03-VERIFICATION.md:**

| File | What to verify |
|------|---------------|
| `src/lib/airtable/client.ts` | No NEXT_PUBLIC_ prefix; env var guard at module load |
| `src/lib/airtable/rate-limiter.ts` | TokenBucket class with capacity=5, refillRate=5/1000 |
| `src/lib/airtable/tables/mappers.ts` | mapJob, mapTurnRequest, buildJobFilterFormula |
| `src/lib/airtable/tables/turn-requests.ts` | resolveLinkedJobs single-call batch pattern |
| `src/app/actions/job-status.ts` | revalidateTag(tag, { expire: 0 }) calls, 5-tag cascade |
| `next.config.ts` | cacheComponents: true + airtableData profile |
| `src/lib/airtable/__tests__/client.test.ts` | 3 tests (env var guards) |
| `src/lib/airtable/__tests__/rate-limiter.test.ts` | 3 tests (burst, delay, refill) |
| `src/lib/airtable/__tests__/mappers.test.ts` | 13 tests (mapping + formula builder) |
| `src/app/actions/__tests__/job-status.test.ts` | 5 tests (happy path, invalid status, job not found, revalidateTag calls) |

**Commits to list (from SUMMARY files):**

| Commit | Source |
|--------|--------|
| 2bb0778 | 03-01-SUMMARY.md Task 1 |
| 49c4385 | 03-01-SUMMARY.md Task 2 |
| 06fe74d | 03-02-SUMMARY.md Task 1 |
| 901e801 | 03-02-SUMMARY.md Task 2 |
| 65abcf2 | 03-03-SUMMARY.md Task 1 |
| a19ae6d | 03-03-SUMMARY.md Task 2 |

---

### Gap 2: Fix REQUIREMENTS.md

**File to edit:** `.planning/REQUIREMENTS.md`

**Change 1 — NOTIF markers:**

Current state (lines 78-81):
```markdown
- [ ] **NOTIF-01**: ~~Middle column displays auto-derived notifications from Airtable data~~ *Descoped — existing alert cards sufficient*
- [ ] **NOTIF-02**: ~~Alert types: Job status "NEEDS ATTENTION" (red), Counter Quote pending (dollar icon), Job approaching deadline within 2 days (clock), Turn past target time (warning)~~ *Descoped*
- [ ] **NOTIF-03**: ~~Each notification shows icon, description text, and timestamp or amount~~ *Descoped*
- [ ] **NOTIF-04**: ~~Clicking a notification navigates to the relevant turn/job detail page~~ *Descoped*
```

Current state is already CORRECT — the checkbox is unchecked `[ ]` and the text is struck-through with `*Descoped*` annotations. The audit's complaint was that these were marked `[x] Complete`. A careful re-read of REQUIREMENTS.md lines 78-81 shows they are already using `[ ]` (unchecked) with strikethrough text and *Descoped* labels.

**IMPORTANT FINDING:** The current REQUIREMENTS.md already has the NOTIF items correctly marked as unchecked with descoped text. The audit identified a mismatch (NOTIF marked [x] Complete) but the file may have already been corrected before the audit was written, or the audit was referring to a different version. The planner MUST read the actual current REQUIREMENTS.md lines 78-81 before making changes to confirm current state and avoid double-editing.

**Change 2 — AUTH-02 description:**

Current state (line 11):
```markdown
- [x] **AUTH-02**: User is redirected to their role-appropriate dashboard after login (PM → /property, DM → /district, Exec → /executive)
```

Required state:
```markdown
- [x] **AUTH-02**: User is redirected to their role-appropriate dashboard after login (PM → /property, RM → /property, Exec → /executive)
```

The change is: `DM → /district` becomes `RM → /property`.

**Why:** Phase 6 renamed `dm` role to `rm`, remapped route from `/district` to `/property`, and ROLE_ROUTES in auth.ts was updated. The requirement description in REQUIREMENTS.md still uses the old pre-Phase-6 terminology. This is confirmed by STATE.md decision "[Phase 06-01]: UserRole renamed dm to rm" and the audit's tech debt item "AUTH-02 description in REQUIREMENTS.md still says 'DM → /district'".

---

### Gap 3: Fix Phase 7 SUMMARY Frontmatter

**Files to edit:** The three Phase 7 SUMMARY frontmatter sections need `requirements_completed` fields updated.

**What the audit says:** "VIZ-01 through VIZ-04 missing from SUMMARY frontmatter requirements_completed fields" (v1.0-MILESTONE-AUDIT.md line 110).

**What the SUMMARYs currently show:**

| File | Current `requirements_completed` | What's missing |
|------|----------------------------------|----------------|
| 07-01-SUMMARY.md | No `requirements_completed` field in frontmatter (has `decisions:` but no req list) | VIZ-03, VIZ-04 |
| 07-02-SUMMARY.md | `requirements-completed: [VEND-01]` | Nothing missing (VEND-01 is correct) |
| 07-03-SUMMARY.md | No `requirements_completed` field in frontmatter | VIZ-01, VIZ-02 |

**Mapping of VIZ requirements to plans (from 07-VERIFICATION.md lines 127-130):**
- VIZ-01 (vendor performance bar chart): satisfied by Plan 07-03 → add to 07-03-SUMMARY.md
- VIZ-02 (completion gauge): satisfied by Plan 07-03 → add to 07-03-SUMMARY.md
- VIZ-03 (trend indicators on KPI cards): satisfied by Plan 07-01 → add to 07-01-SUMMARY.md
- VIZ-04 (color-coded alert cards): pre-existing from Phase 4, re-verified by Plan 07-01 → add to 07-01-SUMMARY.md

**Note on frontmatter key naming:** 07-02-SUMMARY.md uses `requirements-completed` (hyphen), while 03-01-SUMMARY.md uses `requirements-completed` (hyphen). The planner should use `requirements-completed` (hyphen) for consistency.

**Specific edits needed:**

For `07-01-SUMMARY.md`: add `requirements-completed: [VIZ-03, VIZ-04]` to the frontmatter (after existing `metrics:` block or alongside other fields).

For `07-03-SUMMARY.md`: add `requirements-completed: [VIZ-01, VIZ-02]` to the frontmatter (after existing `metrics:` block or alongside other fields).

---

## Standard Stack

This phase has no code dependencies. All work is documentation editing.

| Tool | Version | Purpose |
|------|---------|---------|
| File editor (Write/Edit tool) | N/A | Edit .md files in .planning/ directories |
| Grep/Read tools | N/A | Verify current state of files before editing |
| Git (gsd-tools commit) | N/A | Commit documentation changes |

---

## Architecture Patterns

### Pattern: Verification Document Structure

All VERIFICATION.md files in this project follow a consistent structure (derived from 07-VERIFICATION.md and 08-VERIFICATION.md):

```
---
phase: [phase-slug]
verified: [ISO date]
status: passed | human_needed | partial
score: N/N must-haves verified
human_verification:
  - test: "[test description]"
    expected: "[what to observe]"
    why_human: "[why browser/live env needed]"
---

# Phase N: [Name] — Verification Report

**Phase Goal:** [one sentence]
**Verified:** [date]
**Status:** [status]

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | [claim] | VERIFIED | [code evidence - file:line or grep result] |

**Score:** N/N truths verified

## Required Artifacts

| Artifact | Status | Details |
|----------|--------|---------|
| `path/to/file.ts` | VERIFIED | [what was checked] |

## Key Link Verification

| From | To | Via | Status | Evidence |
|------|----|-----|--------|---------|

## Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|------------|-------------|--------|---------|

## Anti-Patterns Found

[None or list]

## Human Verification Required

### N. [Test Name]
**Test:** [instruction]
**Expected:** [result]
**Why human:** [reason]

## Commits Verified

| Commit | Description |
|--------|-------------|
| [sha] | [message] |

_Verified: [date]_
_Verifier: Claude (gsd-verifier)_
```

### Pattern: Observable Truths for DATA Requirements

For each DATA requirement, the Observable Truth should be a verifiable code claim:

| Requirement | Truth Pattern |
|-------------|--------------|
| DATA-01 | "No `process.env.NEXT_PUBLIC_` access pattern in Airtable client files; API key accessed as `process.env.AIRTABLE_API_KEY`" |
| DATA-02 | "All 9 TypeScript interfaces exist in `src/lib/types/airtable.ts`; 13 mapper tests pass" |
| DATA-03 | "`cacheComponents: true` present in next.config.ts; `airtableData` profile with stale:60, revalidate:60, expire:300 present" |
| DATA-04 | "TokenBucket class instantiated with capacity=5, refillRate=5/1000; 3 rate-limiter tests pass (burst, delay, refill)" |
| DATA-05 | "`resolveLinkedJobs` collects all jobIds, calls `fetchJobsByIds` once; `buildJobFilterFormula` produces OR() formula" |
| DATA-06 | "`updateJobStatus` calls `revalidateTag(tag, { expire: 0 })` for 5 tags; 5 job-status tests pass including revalidateTag assertion" |

### Anti-Patterns to Avoid

- **Fabricating verification evidence:** Only write Observable Truths that can be confirmed by reading actual files. Do not claim "test X passes" without reading the test file to confirm it exists and contains the test.
- **Changing code while writing verification:** Phase 9 is documentation only. If a code issue is found during verification, log it to deferred-items.md rather than fixing inline.
- **Conflating phase completion with verification:** The VERIFICATION.md records what was verified (with evidence), not what was assumed.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| VERIFICATION.md structure | Custom format | Follow 07-VERIFICATION.md exactly | Consistent format enables audit tooling and human scanning |
| Finding test counts | Guessing | Read test files to count describe/it blocks | Accurate evidence required |
| Finding commit hashes | Guessing | Read SUMMARY frontmatter for task commit SHAs | SUMMARY files are the authoritative source |

---

## Common Pitfalls

### Pitfall 1: NOTIF Items Already Correctly Marked
**What goes wrong:** Planner assumes NOTIF-01 through NOTIF-04 need the checkbox changed from `[x]` to `[ ]`, but the current REQUIREMENTS.md already has `[ ]` with strikethrough text.
**Why it happens:** The audit's complaint about "NOTIF marked [x] Complete" may have been stale or referring to a different version of the file. Current file (as of 2026-03-08) shows them already unchecked.
**How to avoid:** The planner MUST read the current REQUIREMENTS.md lines 78-81 before editing to verify current state. If already `[ ]` with descoped text, no change is needed for those lines.
**Warning signs:** Edit would produce identical content.

### Pitfall 2: Wrong Field Name on SUMMARY Frontmatter
**What goes wrong:** Adding `requirements_completed` (underscore) when the existing pattern in the codebase uses `requirements-completed` (hyphen).
**Why it happens:** Inconsistency between YAML key naming conventions.
**How to avoid:** Use `requirements-completed` (hyphen) to match 07-02-SUMMARY.md and 03-XX-SUMMARY.md conventions.

### Pitfall 3: Fabricating Commit SHAs in VERIFICATION.md
**What goes wrong:** Writing invented commit hashes in the "Commits Verified" section.
**Why it happens:** Trying to complete the section without reading the actual SUMMARY files.
**How to avoid:** Extract commit SHAs from the relevant SUMMARY files before writing the VERIFICATION.md. The commits for Phase 3 are documented in the SUMMARY frontmatter and the "Task Commits" tables.

### Pitfall 4: Missing the Pre-existing UAT.md
**What goes wrong:** Writing VERIFICATION.md that conflicts with the existing 03-UAT.md.
**Why it happens:** 03-UAT.md exists at `.planning/phases/03-airtable-data-layer/03-UAT.md` and contains partial test results including one "issue" (Next.js blocking route error). The VERIFICATION.md must note this is a pre-existing issue (fixed in Phase 4 via Suspense wrapping), not an unresolved problem.
**How to avoid:** Read 03-UAT.md before writing VERIFICATION.md. Reference it in the VERIFICATION.md as historical context.

### Pitfall 5: AUTH-02 Change Scope
**What goes wrong:** Editing AUTH-02 to say "RM → /property, DM → /property" (adding DM back) instead of just "RM → /property" (replacing DM entirely).
**Why it happens:** Trying to preserve backward compatibility.
**How to avoid:** The correct change is a straight replacement: `DM → /district` becomes `RM → /property`. The `dm` role no longer exists in the codebase.

---

## Code Examples

### REQUIREMENTS.md AUTH-02 Line (Before and After)

**Before (current):**
```markdown
- [x] **AUTH-02**: User is redirected to their role-appropriate dashboard after login (PM → /property, DM → /district, Exec → /executive)
```

**After (correct):**
```markdown
- [x] **AUTH-02**: User is redirected to their role-appropriate dashboard after login (PM → /property, RM → /property, Exec → /executive)
```

### SUMMARY Frontmatter Addition Pattern

**07-01-SUMMARY.md — add to frontmatter:**
```yaml
requirements-completed: [VIZ-03, VIZ-04]
```

**07-03-SUMMARY.md — add to frontmatter:**
```yaml
requirements-completed: [VIZ-01, VIZ-02]
```

### 03-VERIFICATION.md Observable Truths Structure (DATA)

```markdown
| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | Airtable API key accessed as `process.env.AIRTABLE_API_KEY` (no NEXT_PUBLIC_ prefix); env var guard throws at module load time if missing | VERIFIED | `src/lib/airtable/client.ts`: `if (!process.env.AIRTABLE_API_KEY) throw new Error(...)`. 3 client.test.ts tests: missing API key, missing base ID, no NEXT_PUBLIC_ access pattern. |
| 2 | All 9 TypeScript interfaces defined in `src/lib/types/airtable.ts`; mapper functions produce correct camelCase output | VERIFIED | `src/lib/types/airtable.ts`: TurnRequest, Job, Property, Vendor, VendorPricing, Quote, Executive, PropertyManager, MaintenanceManager interfaces + JOB_STATUSES. `mappers.test.ts`: 13 tests pass covering mapJob, mapTurnRequest, buildJobFilterFormula. |
| 3 | `cacheComponents: true` enabled; `airtableData` cache profile defined with stale:60, revalidate:60, expire:300 | VERIFIED | `next.config.ts`: cacheComponents: true. airtableData profile confirmed in 03-01-SUMMARY.md (exact values). |
| 4 | Token bucket rate limiter instantiated with capacity=5, refillRate=5/1000; 3 tests validate burst, queue-on-exceed, and refill behavior | VERIFIED | `src/lib/airtable/rate-limiter.ts`: `new TokenBucket(5, 5/1000)` exported as singleton. `rate-limiter.test.ts`: 3 tests (burst 5 immediate, 6th queued, refill). |
| 5 | `resolveLinkedJobs` deduplicates all turn request jobIds and fetches in a single `fetchJobsByIds` call; `buildJobFilterFormula` produces OR() formula | VERIFIED | `src/lib/airtable/tables/turn-requests.ts`: resolveLinkedJobs collects unique IDs across all TRs, calls fetchJobsByIds once, distributes results. `mappers.test.ts`: buildJobFilterFormula tests confirm OR({Job ID}=N,...) output. |
| 6 | `updateJobStatus` calls `revalidateTag(tag, { expire: 0 })` for 5 cache tags immediately after successful Airtable update | VERIFIED | `src/app/actions/job-status.ts`: 5 revalidateTag calls (job-{id}, turn-request-{id}, jobs, turn-requests, kpis). `job-status.test.ts`: 5 tests including assertion that all 5 tags are busted with { expire: 0 }. |
```

---

## State of the Art

| Situation | What This Means for Phase 9 |
|-----------|---------------------------|
| Phase 3 code fully implemented and tested | VERIFICATION.md is pure documentation — inspect existing artifacts, write evidence-based claims |
| NOTIF items status in REQUIREMENTS.md | Read file first; may already be correct; edit only if actually `[x]` unchecked |
| Phase 6 rm/dm rename | AUTH-02 needs one targeted string replacement (DM → /district → RM → /property) |
| 07-VERIFICATION.md already corrected in Phase 8 | VIZ-03 isGood issue is already fixed; VERIFICATION.md Truth #3 already updated (08-01-SUMMARY.md confirms) |
| VIZ-01, VIZ-02, VIZ-04 not in any SUMMARY frontmatter | These need to be added to the correct SUMMARY files based on which plan implemented each requirement |

---

## Open Questions

1. **NOTIF item checkbox state in REQUIREMENTS.md**
   - What we know: REQUIREMENTS.md was created 2026-03-08. The NOTIF items show `[ ]` (unchecked) with strikethrough text and *Descoped* annotations.
   - What's unclear: The audit (written 2026-03-15) says NOTIF items are "marked [x] Complete — should be updated to reflect descope." This may be referring to a different column (the Traceability table) or a version of the file that predated the descope annotations being added.
   - Recommendation: The planner MUST read the actual REQUIREMENTS.md lines 78-81 (Notification Panel section) AND lines 168-171 (Traceability table NOTIF rows) before any edit. The Traceability table rows say "Pending (descoped)" which is correct. The checkbox rows appear to already be `[ ]` unchecked.

2. **07-01-SUMMARY.md and 07-03-SUMMARY.md exact frontmatter YAML key position**
   - What we know: These files have frontmatter blocks. 07-02-SUMMARY.md uses `requirements-completed: [VEND-01]` as a top-level key after `metrics:`.
   - What's unclear: Whether 07-01 and 07-03 frontmatter have any placeholder for this field.
   - Recommendation: Read the actual frontmatter before inserting. Add `requirements-completed:` after the last existing top-level key in the frontmatter block.

---

## Validation Architecture

The `workflow.nyquist_validation` is `true` in `.planning/config.json`, so this section is required.

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest 4.0.18 |
| Config file | `vitest.config.ts` (project root) |
| Quick run command | `npx vitest run --reporter=verbose` |
| Full suite command | `npx vitest run --reporter=verbose` |

### Phase Requirements → Test Map

Phase 9 is documentation-only. No new production code is written, so no new automated tests are needed.

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| DATA-01 | Server-only Airtable access (no NEXT_PUBLIC_) | manual-review | Read client.ts + client.test.ts | ✅ Exists |
| DATA-02 | 9 TypeScript interfaces + mapper correctness | manual-review | Read types/airtable.ts + mappers.test.ts | ✅ Exists |
| DATA-03 | cacheComponents: true in next.config.ts | manual-review | Read next.config.ts | ✅ Exists |
| DATA-04 | Rate limiter with capacity=5 | manual-review | Read rate-limiter.ts + rate-limiter.test.ts | ✅ Exists |
| DATA-05 | Batch job resolution (no N+1) | manual-review | Read turn-requests.ts + mappers.test.ts | ✅ Exists |
| DATA-06 | Cache bust on write (5 tags, expire:0) | manual-review | Read job-status.ts + job-status.test.ts | ✅ Exists |
| NOTIF-01..04 | Descoped — no implementation | manual-review | Verify [ ] checkbox + strikethrough text in REQUIREMENTS.md | ✅ File exists |
| AUTH-02 | Description reflects RM → /property | manual-review | Read REQUIREMENTS.md line 11 | ✅ File exists |

### Sampling Rate
- **Per task commit:** `npx vitest run --reporter=verbose` (verify no regressions from documentation edits)
- **Per wave merge:** `npx vitest run --reporter=verbose`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
None — existing test infrastructure covers all phase requirements. Phase 9 creates no new code files.

---

## Sources

### Primary (HIGH confidence)
- `.planning/v1.0-MILESTONE-AUDIT.md` — authoritative gap list; all Phase 9 tasks derived from audit findings
- `.planning/phases/03-airtable-data-layer/03-01-SUMMARY.md` — DATA-01, DATA-03, DATA-04 completion evidence
- `.planning/phases/03-airtable-data-layer/03-02-SUMMARY.md` — DATA-02, DATA-05 completion evidence
- `.planning/phases/03-airtable-data-layer/03-03-SUMMARY.md` — DATA-06 completion evidence, commit SHAs
- `.planning/phases/07-notifications-charts-and-vendor-metrics/07-VERIFICATION.md` — NOTIF descope documentation, VIZ requirement coverage, VERIFICATION.md format reference
- `.planning/phases/08-code-fixes-and-integration-wiring/08-VERIFICATION.md` — VERIFICATION.md format reference, confirmed isGood fix
- `.planning/REQUIREMENTS.md` — current state of NOTIF checkbox markers and AUTH-02 description
- `.planning/STATE.md` — confirms "[Phase 06-01]: UserRole renamed dm to rm" decision

### Secondary (MEDIUM confidence)
- `.planning/phases/07-notifications-charts-and-vendor-metrics/07-CONTEXT.md` — NOTIF descope rationale (alert cards sufficient)
- `.planning/phases/03-airtable-data-layer/03-UAT.md` — partial UAT results; documents pre-existing issue (Next.js blocking route, fixed in Phase 4)

---

## Metadata

**Confidence breakdown:**
- What needs to change: HIGH — derived directly from audit findings with specific file/line references
- How to write VERIFICATION.md: HIGH — format defined by existing examples (07-VERIFICATION.md, 08-VERIFICATION.md)
- Evidence for DATA requirements: HIGH — all evidence already documented in SUMMARY files and can be confirmed by reading source files
- NOTIF item current state: MEDIUM — audit says [x] Complete but file shows [ ] unchecked; planner must verify before editing

**Research date:** 2026-03-15
**Valid until:** 2026-04-15 (static documentation; no external dependencies)
