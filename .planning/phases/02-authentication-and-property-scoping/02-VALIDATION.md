---
phase: 2
slug: authentication-and-property-scoping
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-10
---

# Phase 2 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest 4.x with @testing-library/react |
| **Config file** | `vitest.config.ts` (exists) |
| **Quick run command** | `npm test -- --reporter=dot` |
| **Full suite command** | `npm test` |
| **Estimated runtime** | ~15 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npm test -- --reporter=dot src/app/actions src/middleware src/lib`
- **After every plan wave:** Run `npm test`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 02-01-01 | 01 | 1 | AUTH-01 | unit | `npm test -- src/app/login` | ❌ W0 | ⬜ pending |
| 02-01-02 | 01 | 1 | AUTH-02 | unit | `npm test -- src/app/actions` | ❌ W0 | ⬜ pending |
| 02-01-03 | 01 | 1 | AUTH-03 | unit | `npm test -- src/middleware` | ❌ W0 | ⬜ pending |
| 02-01-04 | 01 | 1 | AUTH-04 | manual | Manual browser refresh test | manual-only | ⬜ pending |
| 02-01-05 | 01 | 1 | AUTH-05 | unit | `npm test -- src/app/actions` | ❌ W0 | ⬜ pending |
| 02-01-06 | 01 | 1 | AUTH-06 | unit | `npm test -- src/middleware` | ❌ W0 | ⬜ pending |
| 02-02-01 | 02 | 1 | SCOPE-01 | unit | `npm test -- src/lib` | ❌ W0 | ⬜ pending |
| 02-02-02 | 02 | 1 | SCOPE-02 | unit | `npm test -- src/lib` | ❌ W0 | ⬜ pending |
| 02-02-03 | 02 | 1 | SCOPE-03 | unit | `npm test -- src/lib` | ❌ W0 | ⬜ pending |
| 02-02-04 | 02 | 1 | SCOPE-04 | unit | `npm test -- src/lib` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `src/app/login/__tests__/login-page.test.tsx` — stubs for AUTH-01 (form renders, submits, shows error)
- [ ] `src/app/actions/__tests__/auth.test.ts` — stubs for AUTH-02, AUTH-05 (login redirect by role, logout)
- [ ] `src/middleware.test.ts` — stubs for AUTH-03, AUTH-06 (unauthenticated redirect, role enforcement)
- [ ] `src/lib/__tests__/normalize-property-name.test.ts` — stubs for SCOPE-01, SCOPE-02, SCOPE-03, SCOPE-04

**Testing note:** Tests must mock `@supabase/ssr` using `vi.mock('@supabase/ssr')` to stub `createServerClient` and `createBrowserClient`. Middleware tests mock `NextRequest`/`NextResponse` from `next/server`. No real Supabase connection needed for unit tests.

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Session persists across browser refresh | AUTH-04 | Requires real browser session cookies | 1. Log in 2. Refresh page 3. Verify still authenticated |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
