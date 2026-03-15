---
phase: 8
slug: code-fixes-and-integration-wiring
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-15
---

# Phase 8 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest ^4.0.18 |
| **Config file** | `vitest.config.ts` |
| **Quick run command** | `npm test -- --reporter=verbose` |
| **Full suite command** | `npm test` |
| **Estimated runtime** | ~5 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npm test -- --reporter=verbose`
- **After every plan wave:** Run `npm test`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 5 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 8-01-01 | 01 | 1 | VIZ-03 | unit | `npm test -- executive-kpis` | ❌ W0 | ⬜ pending |
| 8-01-02 | 01 | 1 | DM-03 | unit | `npm test -- property-selector-wrapper` | ❌ W0 | ⬜ pending |
| 8-01-03 | 01 | 1 | UI-01 | unit | `npm test -- sidebar` | ❌ W0 | ⬜ pending |
| 8-01-04 | 01 | 1 | — | doc fix | manual review | N/A | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] Add `describe('isGood prop semantics')` block to `src/lib/kpis/executive-kpis.test.ts` — covers VIZ-03
- [ ] `src/components/layout/__tests__/property-selector-wrapper.test.tsx` — covers DM-03, mocks `next/navigation`
- [ ] `src/components/layout/__tests__/sidebar.test.tsx` — covers UI-01 nav href correctness

*All three test files are new or need new describe blocks.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| 07-VERIFICATION.md corrected | — | Documentation fix | Review diff: Truth #3 should no longer claim isGood=false was passed |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 5s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
