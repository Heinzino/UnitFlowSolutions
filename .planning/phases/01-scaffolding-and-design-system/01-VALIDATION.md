---
phase: 1
slug: scaffolding-and-design-system
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-08
---

# Phase 1 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest + React Testing Library |
| **Config file** | none — Wave 0 installs |
| **Quick run command** | `npx vitest run --reporter=verbose` |
| **Full suite command** | `npx vitest run` |
| **Estimated runtime** | ~10 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx vitest run --reporter=verbose`
- **After every plan wave:** Run `npx vitest run`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 10 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 01-01-01 | 01 | 0 | UI-01 | smoke/manual | Visual inspection in browser | N/A | ⬜ pending |
| 01-02-01 | 02 | 1 | UI-02 | smoke/manual | Visual inspection + DevTools check | N/A | ⬜ pending |
| 01-03-01 | 03 | 1 | UI-03 | unit | `npx vitest run src/components/ui/ --reporter=verbose` | ❌ W0 | ⬜ pending |
| 01-04-01 | 04 | 1 | UI-04 | unit | `npx vitest run src/components/layout/ --reporter=verbose` | ❌ W0 | ⬜ pending |
| 01-05-01 | 05 | 1 | UI-05 | unit | `npx vitest run src/components/layout/ --reporter=verbose` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `vitest.config.ts` — Vitest configuration for Next.js (with @vitejs/plugin-react)
- [ ] `tests/setup.ts` — Testing Library setup (cleanup, custom matchers)
- [ ] Framework install: `npm install -D vitest @vitejs/plugin-react @testing-library/react @testing-library/jest-dom jsdom`
- [ ] `src/components/ui/__tests__/` — test directory for component unit tests
- [ ] `src/components/layout/__tests__/` — test directory for layout component tests

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| THEME.md colors render correctly | UI-01 | Visual verification of color tokens | Load app, compare forest green bg, white cards, emerald accents against THEME.md |
| Correct fonts load | UI-02 | Font rendering is visual | Inspect headings for Plus Jakarta Sans, body for Geist in DevTools |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 10s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
