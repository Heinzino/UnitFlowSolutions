---
phase: 4
slug: executive-dashboard
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-12
---

# Phase 4 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest 4.0.18 + @testing-library/react 16.3.2 |
| **Config file** | `vitest.config.ts` (exists) |
| **Quick run command** | `npm test -- --reporter=verbose src/lib/kpis` |
| **Full suite command** | `npm test` |
| **Estimated runtime** | ~10 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npm test -- --reporter=verbose src/lib/kpis`
- **After every plan wave:** Run `npm test`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 10 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 04-01-01 | 01 | 0 | EXEC-05 | unit | `npm test -- src/lib/airtable/__tests__/mappers.test.ts` | exists (needs update) | ⬜ pending |
| 04-01-02 | 01 | 1 | EXEC-01 | unit | `npm test -- src/lib/kpis/executive-kpis.test.ts` | ❌ W0 | ⬜ pending |
| 04-01-03 | 01 | 1 | EXEC-02 | unit | `npm test -- src/lib/kpis/executive-kpis.test.ts` | ❌ W0 | ⬜ pending |
| 04-01-04 | 01 | 1 | EXEC-03 | unit | `npm test -- src/lib/kpis/executive-kpis.test.ts` | ❌ W0 | ⬜ pending |
| 04-01-05 | 01 | 1 | EXEC-04 | unit | `npm test -- src/lib/kpis/executive-kpis.test.ts` | ❌ W0 | ⬜ pending |
| 04-01-06 | 01 | 1 | EXEC-05 | unit | `npm test -- src/lib/kpis/executive-kpis.test.ts` | ❌ W0 | ⬜ pending |
| 04-01-07 | 01 | 1 | EXEC-06 | unit | `npm test -- src/lib/kpis/executive-kpis.test.ts` | ❌ W0 | ⬜ pending |
| 04-02-01 | 02 | 2 | EXEC-07 | unit | `npm test -- src/app` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `src/lib/kpis/executive-kpis.test.ts` — stubs for EXEC-01 through EXEC-06 compute logic
- [ ] `src/lib/types/airtable.ts` — add `delta: number | null` to Job interface
- [ ] `src/lib/airtable/tables/mappers.ts` — add `f['Delta']` mapping in `mapJob()`
- [ ] `src/lib/airtable/__tests__/mappers.test.ts` — add `delta` field assertion to existing `mapJob` tests

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Alert cards pink/yellow styling | EXEC-05 | Visual CSS verification | Inspect alert cards in browser — pink for past target, yellow for trending |
| Loading skeleton displays | EXEC-07 | Suspense timing visual | Throttle network in DevTools, verify skeleton cards appear |
| KPI card layout matches design | EXEC-01–04 | Layout/design fidelity | Compare rendered page to Dribbble reference |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 10s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
