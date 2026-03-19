---
phase: 12
slug: terminology-rename
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-18
---

# Phase 12 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest 4.0.18 |
| **Config file** | `vitest.config.ts` |
| **Quick run command** | `npm test -- --reporter=dot` |
| **Full suite command** | `npm test` |
| **Estimated runtime** | ~10 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx tsc --noEmit && npm test -- --reporter=dot`
- **After every plan wave:** Run `npm test`
- **Before `/gsd:verify-work`:** Full suite must be green + grep verifications
- **Max feedback latency:** 15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 12-01-01 | 01 | 1 | TERM-04 | type-check | `npx tsc --noEmit` | N/A | ⬜ pending |
| 12-01-02 | 01 | 1 | TERM-04 | unit | `npm test -- pm-kpis` | ✅ `pm-kpis.test.ts` | ⬜ pending |
| 12-01-03 | 01 | 1 | TERM-04 | unit | `npm test -- executive-kpis` | ✅ `executive-kpis.test.ts` | ⬜ pending |
| 12-01-04 | 01 | 2 | TERM-04 | unit | `npm test -- mappers` | ✅ `mappers.test.ts` | ⬜ pending |
| 12-01-05 | 01 | 3 | TERM-01 | grep | `grep -r "Make Ready\|makeReady" src/` returns 0 | N/A | ⬜ pending |
| 12-01-06 | 01 | 3 | TERM-03 | grep | `grep -rn "Vacant Date\|Days Vacant" src/` returns 0 in UI files | N/A | ⬜ pending |
| 12-01-07 | 01 | 4 | TERM-01, TERM-04 | unit | `npm test` (full suite) | ✅ | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

Existing infrastructure covers all phase requirements. No new test files needed — the rename updates existing tests in-place.

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Sidebar displays "Add Off Market" | TERM-03 | Already done — verify only | Open app, check sidebar nav label |
| Bottom tab bar displays "Add Off Market" | TERM-03 | Already done — verify only | Open app on mobile, check bottom nav |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
