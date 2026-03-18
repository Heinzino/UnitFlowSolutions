---
phase: 11
slug: vacant-unit-entry
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-16
---

# Phase 11 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest 4.0.18 + React Testing Library 16.3.2 |
| **Config file** | `vitest.config.ts` |
| **Quick run command** | `npx vitest run --reporter=verbose src/app/actions/vacant.test.ts` |
| **Full suite command** | `npm test` |
| **Estimated runtime** | ~15 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx vitest run --reporter=verbose src/app/actions/vacant.test.ts`
- **After every plan wave:** Run `npm test`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 11-01-01 | 01 | 1 | UNIT-01 | unit | `npx vitest run src/components/layout/__tests__/layout.test.tsx` | ✅ (extend) | ⬜ pending |
| 11-02-01 | 02 | 1 | UNIT-02 | unit | `npx vitest run src/app/(dashboard)/vacant/__tests__/add-vacant-form.test.tsx` | ❌ W0 | ⬜ pending |
| 11-02-02 | 02 | 1 | UNIT-03 | unit | `npx vitest run src/app/actions/vacant.test.ts` | ❌ W0 | ⬜ pending |
| 11-02-03 | 02 | 1 | UNIT-04 | unit | `npx vitest run src/app/(dashboard)/vacant/__tests__/add-vacant-form.test.tsx` | ❌ W0 | ⬜ pending |
| 11-02-04 | 02 | 1 | UNIT-05 | unit | `npx vitest run src/app/(dashboard)/vacant/__tests__/add-vacant-form.test.tsx` | ❌ W0 | ⬜ pending |
| 11-03-01 | 03 | 2 | UNIT-06 | unit | `npx vitest run src/app/actions/vacant.test.ts` | ❌ W0 | ⬜ pending |
| 11-03-02 | 03 | 2 | UNIT-07 | unit | `npx vitest run src/app/(dashboard)/vacant/__tests__/add-vacant-form.test.tsx` | ❌ W0 | ⬜ pending |
| 11-03-03 | 03 | 2 | UNIT-08 | unit | `npx vitest run src/app/(dashboard)/vacant/__tests__/add-vacant-form.test.tsx` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `src/app/actions/vacant.test.ts` — stubs for UNIT-03, UNIT-06 (server action tests, mock pattern from admin.test.ts)
- [ ] `src/app/(dashboard)/vacant/__tests__/add-vacant-form.test.tsx` — stubs for UNIT-02, UNIT-04, UNIT-05, UNIT-07, UNIT-08 (form component tests)

*(UNIT-01 extends existing `src/components/layout/__tests__/layout.test.tsx` — no new file needed)*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Visual styling of stacked cards | N/A (Claude's discretion) | CSS visual verification | Inspect form on desktop and mobile viewports |

*All functional behaviors have automated verification.*

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
