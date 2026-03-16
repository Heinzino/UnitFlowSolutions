---
phase: 10
slug: admin-user-creation
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-15
---

# Phase 10 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest + Testing Library (jsdom) |
| **Config file** | `vitest.config.ts` |
| **Quick run command** | `npx vitest run src/app/actions/admin.test.ts src/components/ui/__tests__/property-multi-select.test.tsx` |
| **Full suite command** | `npx vitest run` |
| **Estimated runtime** | ~15 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx vitest run src/app/actions/admin.test.ts src/components/ui/__tests__/property-multi-select.test.tsx`
- **After every plan wave:** Run `npx vitest run`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 10-01-01 | 01 | 0 | USER-01 | unit | `npx vitest run src/app/actions/admin.test.ts -x` | ❌ W0 | ⬜ pending |
| 10-01-02 | 01 | 0 | USER-03 | unit | `npx vitest run src/components/ui/__tests__/property-multi-select.test.tsx -x` | ❌ W0 | ⬜ pending |
| 10-01-03 | 01 | 0 | USER-02 | unit | `npx vitest run src/components/layout/__tests__/layout.test.tsx -x` | ✅ update | ⬜ pending |
| 10-02-01 | 02 | 1 | USER-01 | unit | `npx vitest run src/app/actions/admin.test.ts -x` | ❌ W0 | ⬜ pending |
| 10-02-02 | 02 | 1 | USER-01 | unit | `npx vitest run src/app/actions/admin.test.ts -x` | ❌ W0 | ⬜ pending |
| 10-03-01 | 03 | 1 | USER-02 | unit | `npx vitest run src/components/layout/__tests__/layout.test.tsx -x` | ✅ update | ⬜ pending |
| 10-04-01 | 04 | 2 | USER-03 | unit | `npx vitest run src/components/ui/__tests__/property-multi-select.test.tsx -x` | ❌ W0 | ⬜ pending |
| 10-04-02 | 04 | 2 | USER-04 | unit | `npx vitest run src/app/actions/admin.test.ts -x` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `src/app/actions/admin.test.ts` — stubs for USER-01, USER-04 (mock Supabase admin client and Airtable base)
- [ ] `src/components/ui/__tests__/property-multi-select.test.tsx` — stubs for USER-03, USER-04 UI
- [ ] Update `src/components/layout/__tests__/layout.test.tsx` — add admin email mock test cases for USER-02

*Existing infrastructure covers test framework — Vitest already configured.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Copy-to-clipboard password button works | USER-01 | `navigator.clipboard` requires secure context + user gesture | 1. Create a user 2. Click copy button on success card 3. Paste into text editor 4. Verify password matches |
| Mobile bottom tab bar shows admin item | USER-02 | Viewport-dependent rendering | 1. Open dev tools mobile view 2. Log in as admin email 3. Verify "Create User" in bottom tab bar |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
