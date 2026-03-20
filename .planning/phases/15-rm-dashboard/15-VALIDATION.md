---
phase: 15
slug: rm-dashboard
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-19
---

# Phase 15 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest |
| **Config file** | vitest.config.ts |
| **Quick run command** | `npx vitest run --reporter=verbose` |
| **Full suite command** | `npx vitest run --reporter=verbose` |
| **Estimated runtime** | ~30 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx vitest run --reporter=verbose`
- **After every plan wave:** Run `npx vitest run --reporter=verbose`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 30 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 15-01-01 | 01 | 1 | RMDB-01 | unit | `npx vitest run` | ❌ W0 | ⬜ pending |
| 15-01-02 | 01 | 1 | RMDB-02 | unit | `npx vitest run` | ❌ W0 | ⬜ pending |
| 15-01-03 | 01 | 1 | RMDB-03 | unit | `npx vitest run` | ❌ W0 | ⬜ pending |
| 15-01-04 | 01 | 1 | RMDB-04 | unit | `npx vitest run` | ❌ W0 | ⬜ pending |
| 15-01-05 | 01 | 1 | RMDB-05 | unit | `npx vitest run` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] Test stubs for RMDB-01 through RMDB-05
- [ ] Shared fixtures for RM role mocking and multi-property data

*Existing vitest infrastructure covers framework needs.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| RM login routes to /regional | RMDB-01 | Requires auth flow with Supabase session | Login as RM user, verify redirect to /regional |
| Bar chart color coding | RMDB-05 | Visual verification of green/amber/red colors | Check chart bars match threshold ranges |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 30s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
