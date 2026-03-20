---
phase: 14
slug: completed-jobs-page
status: draft
nyquist_compliant: true
wave_0_complete: true
created: 2026-03-19
---

# Phase 14 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | jest 29.x / vitest |
| **Config file** | jest.config.js or vitest.config.ts |
| **Quick run command** | `npx tsc --noEmit` |
| **Full suite command** | `npx tsc --noEmit` |
| **Estimated runtime** | ~15 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx tsc --noEmit`
- **After every plan wave:** Run `npx tsc --noEmit`
- **Before `/gsd:verify-work`:** TypeScript must compile cleanly
- **Max feedback latency:** 15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | Status |
|---------|------|------|-------------|-----------|-------------------|--------|
| 14-01-01 | 01 | 1 | COMP-01 | type-check | `npx tsc --noEmit --pretty 2>&1 \| head -30` | pending |
| 14-01-02 | 01 | 1 | COMP-02, COMP-03 | type-check | `npx tsc --noEmit --pretty 2>&1 \| head -30` | pending |
| 14-01-03 | 01 | 1 | COMP-01 | type-check | `npx tsc --noEmit --pretty 2>&1 \| head -30` | pending |

*Status: pending / green / red / flaky*

---

## Wave 0 Justification

**No Wave 0 test stubs required.** Rationale:

This phase is a UI assembly phase that creates a new page route by composing existing, already-tested components (`ActiveJobsTable`, `PropertyMultiSelect`, `PMTurnListSkeleton`). The new code is:

1. **Server data fetching** — `fetchTurnRequestsForUser` is already tested; the new code is a filter/map pipeline with no branching logic beyond `j.isCompleted`.
2. **Client state** — `useMemo` filter with a trivial `Set.has()` check. No complex state machines or business rules.
3. **Error boundary** — standard Next.js `error.tsx` pattern with static copy.

The TypeScript compiler (`npx tsc --noEmit`) provides the primary automated verification: it confirms all imports resolve, props match interfaces, and types flow correctly across the server/client boundary. Manual verification (visiting the page) confirms runtime behavior.

Adding unit tests for the `isCompleted` filter or `useMemo` logic would test JavaScript builtins (`Array.filter`, `Set.has`) rather than meaningful business logic. The cost/benefit does not justify Wave 0 stubs for this phase.

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Visual column alignment matches Active Jobs table | COMP-03 | Visual comparison | Navigate to both pages, compare column order and widths |
| PropertyMultiSelect dropdown UX | COMP-02 | Interactive behavior | Select/deselect properties, verify filter updates |
| Error boundary renders on server failure | COMP-01 | Requires simulated server error | Temporarily throw in CompletedJobs server component |

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify commands (tsc --noEmit)
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 justified as not required (smoke-only coverage accepted)
- [x] No watch-mode flags in any verify command
- [x] Feedback latency < 30s
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
