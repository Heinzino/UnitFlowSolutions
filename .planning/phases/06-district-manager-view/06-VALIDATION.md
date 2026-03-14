---
phase: 6
slug: district-manager-view
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-14
---

# Phase 6 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest (vitest.config.ts) |
| **Config file** | vitest.config.ts (project root) |
| **Quick run command** | `npx vitest run src/middleware.test.ts src/components/layout/__tests__/layout.test.tsx` |
| **Full suite command** | `npx vitest run` |
| **Estimated runtime** | ~15 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx vitest run src/middleware.test.ts src/components/layout/__tests__/layout.test.tsx`
- **After every plan wave:** Run `npx vitest run`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 06-01-01 | 01 | 1 | DM-01 | unit | `npx vitest run src/lib/__tests__/auth-types.test.ts` | ❌ W0 | ⬜ pending |
| 06-01-02 | 01 | 1 | DM-01 | unit | `npx vitest run src/components/layout/__tests__/layout.test.tsx` | ✅ | ⬜ pending |
| 06-01-03 | 01 | 1 | DM-03 | manual | Manual: log in as RM user, verify dropdown | N/A | ⬜ pending |
| 06-01-04 | 01 | 1 | DM-04 | manual | Manual: observe skeleton on slow connection | N/A | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `src/lib/__tests__/auth-types.test.ts` — verify `UserRole` union contains `'rm'` not `'dm'`; verify `ROLE_ROUTES.rm === '/property'`; verify `ROLE_LABELS.rm === 'Regional Manager'`

*Existing test infrastructure covers the broader suite; only the new type constant assertions need a new file.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| PropertySelector dropdown appears for RM users | DM-03 | Requires authenticated RM user session | Log in as RM user, verify property selector dropdown is visible and functional |
| Loading skeletons display for RM | DM-04 | Visual verification on slow connection | Throttle network in DevTools, navigate as RM user, verify skeleton states appear |
| Supabase metadata updated | DM-01 | External system manual operation | Verify all former DM users have `role: 'rm'` in Supabase app_metadata |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
