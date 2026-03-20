---
phase: 14
slug: completed-jobs-page
status: draft
nyquist_compliant: false
wave_0_complete: false
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
| **Quick run command** | `npm test -- --watchAll=false` |
| **Full suite command** | `npm test -- --watchAll=false` |
| **Estimated runtime** | ~30 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npm test -- --watchAll=false`
- **After every plan wave:** Run `npm test -- --watchAll=false`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 30 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 14-01-01 | 01 | 1 | COMP-01 | integration | `npm test -- --watchAll=false` | ❌ W0 | ⬜ pending |
| 14-01-02 | 01 | 1 | COMP-02 | integration | `npm test -- --watchAll=false` | ❌ W0 | ⬜ pending |
| 14-01-03 | 01 | 1 | COMP-03 | integration | `npm test -- --watchAll=false` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] Test stubs for COMP-01 (completed jobs route/page)
- [ ] Test stubs for COMP-02 (PropertyMultiSelect filtering)
- [ ] Test stubs for COMP-03 (table columns/sort matching ActiveJobsTable)

*Existing infrastructure covers test framework setup.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Visual column alignment matches Active Jobs table | COMP-03 | Visual comparison | Navigate to both pages, compare column order and widths |
| PropertyMultiSelect dropdown UX | COMP-02 | Interactive behavior | Select/deselect properties, verify filter updates |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 30s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
