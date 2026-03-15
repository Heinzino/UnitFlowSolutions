---
phase: 7
slug: notifications-charts-and-vendor-metrics
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-14
---

# Phase 7 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest 4.x + jsdom + @testing-library/react |
| **Config file** | vitest.config.ts (root) |
| **Quick run command** | `npm test -- --reporter=verbose` |
| **Full suite command** | `npm test` |
| **Estimated runtime** | ~15 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npm test -- src/lib/kpis/`
- **After every plan wave:** Run `npm test`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 07-01-01 | 01 | 1 | VIZ-03 | unit | `npm test -- src/lib/kpis/executive-kpis.test.ts` | ✅ | ⬜ pending |
| 07-01-02 | 01 | 1 | NOTIF-01-04 | unit | `npm test -- src/components/layout/__tests__/layout.test.tsx` | ✅ | ⬜ pending |
| 07-01-03 | 01 | 1 | VEND-01 | unit | `npm test -- src/app/(dashboard)/vendors` | ❌ W0 | ⬜ pending |
| 07-02-01 | 02 | 2 | VIZ-02 | unit | `npm test -- src/lib/kpis/health-score.test.ts` | ❌ W0 | ⬜ pending |
| 07-02-02 | 02 | 2 | VIZ-01 | smoke | `npm test -- src/app/(dashboard)/executive` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `npm install recharts` — required before any chart component can be written or tested
- [ ] `src/lib/kpis/health-score.test.ts` — unit tests for computeHealthScore (null case, boundary thresholds >= 88, >= 75, < 75)
- [ ] `src/app/(dashboard)/executive/_components/executive-charts.test.tsx` — smoke test: renders HealthGauge and VendorCostChart without throwing
- [ ] `src/app/(dashboard)/vendors/_components/vendor-table.test.tsx` — renders table rows, sort click changes order

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Health gauge visual appearance (semi-circular arc, gradient, color thresholds) | VIZ-02 | SVG visual fidelity requires visual inspection | Load exec dashboard, verify gauge arc renders as semi-circle with correct color for score range |
| Vendor bar chart visual style (rounded tops, horizontal layout) | VIZ-01 | Recharts rendering is a visual concern | Load exec dashboard, verify horizontal bars with rounded right caps |
| Chart responsive behavior on mobile | VIZ-01, VIZ-02 | Requires viewport testing | Resize browser to mobile width, verify charts stack/scroll correctly |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
