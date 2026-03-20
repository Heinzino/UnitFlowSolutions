---
phase: 16
slug: executive-dashboard-redesign
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-19
---

# Phase 16 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest + jsdom + @testing-library/react |
| **Config file** | `vitest.config.ts` |
| **Quick run command** | `npx vitest run src/lib/kpis/executive-kpis.test.ts` |
| **Full suite command** | `npx vitest run` |
| **Estimated runtime** | ~15 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx vitest run src/lib/kpis/executive-kpis.test.ts`
- **After every plan wave:** Run `npx vitest run`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| TBD | 01 | 1 | EXEC-01 | unit (compute) | `npx vitest run src/lib/kpis/executive-kpis.test.ts` | ✅ (update needed) | ⬜ pending |
| TBD | 01 | 1 | EXEC-01 | unit (type check) | `npx tsc --noEmit` | ✅ | ⬜ pending |
| TBD | 02 | 1 | EXEC-02 | unit (compute) | `npx vitest run src/lib/kpis/executive-kpis.test.ts` | ❌ W0 | ⬜ pending |
| TBD | 02 | 1 | EXEC-02 | unit (compute) | `npx vitest run src/lib/kpis/executive-kpis.test.ts` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] New test cases for per-property revenue exposure computation in `src/lib/kpis/executive-kpis.test.ts`
- [ ] Remove test cases for `activeTurnsOpen`, `pastTargetAlerts`, `trendingAlerts` from `executive-kpis.test.ts`
- [ ] Delete `src/app/(dashboard)/executive/_components/executive-charts.test.tsx` — tests deleted component
- [ ] Delete `src/lib/kpis/health-score.test.ts` — tests deleted module

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| 6 KPI boxes render visually with correct layout (3x2 grid) | EXEC-01 | Visual layout verification | Load `/executive` dashboard, verify 3-column grid with 6 KPI cards |
| Top 10 table renders inside Card with heading | EXEC-02 | Visual layout verification | Load `/executive` dashboard, verify table appears below KPIs in Card wrapper |
| Mobile responsive layout | EXEC-01, EXEC-02 | Viewport-dependent | Resize browser to mobile, verify single-column KPIs and scrollable table |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
