---
phase: 09
slug: documentation-and-verification-cleanup
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-15
---

# Phase 09 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest 4.0.18 |
| **Config file** | `vitest.config.ts` |
| **Quick run command** | `npx vitest run --reporter=verbose` |
| **Full suite command** | `npx vitest run --reporter=verbose` |
| **Estimated runtime** | ~5 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx vitest run --reporter=verbose`
- **After every plan wave:** Run `npx vitest run --reporter=verbose`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 5 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 09-01-01 | 01 | 1 | DATA-01..06 | manual-review | Read source files + existing tests | N/A | pending |
| 09-01-02 | 01 | 1 | NOTIF-01..04 | manual-review | Read REQUIREMENTS.md lines 78-81 | N/A | pending |
| 09-01-03 | 01 | 1 | AUTH-02 | manual-review | Read REQUIREMENTS.md line 11 | N/A | pending |
| 09-01-04 | 01 | 1 | VIZ-01..04 | manual-review | Read 07-XX-SUMMARY.md frontmatter | N/A | pending |

*Status: pending · green · red · flaky*

---

## Wave 0 Requirements

Existing infrastructure covers all phase requirements. Phase 9 creates no new code files — all tasks are documentation edits verified by file inspection.

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| 03-VERIFICATION.md evidence accuracy | DATA-01..06 | Evidence claims must match actual source files | Read each source file referenced in Observable Truths; confirm claims are accurate |
| NOTIF descope markers correct | NOTIF-01..04 | Checkbox state is visual markdown | Read REQUIREMENTS.md lines 78-81; confirm `[ ]` unchecked with strikethrough |
| AUTH-02 description updated | AUTH-02 | String replacement verification | Read REQUIREMENTS.md line 11; confirm `RM → /property` (not `DM → /district`) |
| VIZ frontmatter present | VIZ-01..04 | YAML key existence check | Read 07-01-SUMMARY.md and 07-03-SUMMARY.md frontmatter; confirm `requirements-completed` fields |

---

## Validation Sign-Off

- [ ] All tasks have manual-review verification or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 5s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
