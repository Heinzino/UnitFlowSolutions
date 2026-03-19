---
phase: 13
slug: pm-dashboard-redesign
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-18
---

# Phase 13 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest 4.0.18 |
| **Config file** | `vitest.config.ts` (root) |
| **Quick run command** | `npx vitest run src/lib/kpis/pm-kpis.test.ts` |
| **Full suite command** | `npm test` |
| **Estimated runtime** | ~15 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx vitest run src/lib/kpis/pm-kpis.test.ts`
- **After every plan wave:** Run `npm test`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 13-01-01 | 01 | 1 | PMDB-01 | unit | `npx vitest run src/lib/kpis/pm-kpis.test.ts` | ✅ (update existing) | ⬜ pending |
| 13-01-02 | 01 | 1 | PMDB-01 | unit | `npx vitest run src/lib/kpis/pm-kpis.test.ts` | ❌ W0 | ⬜ pending |
| 13-01-03 | 01 | 1 | PMDB-01 | unit | `npx vitest run src/lib/kpis/pm-kpis.test.ts` | ❌ W0 | ⬜ pending |
| 13-01-04 | 01 | 1 | PMDB-06 | unit | `npx vitest run src/lib/kpis/pm-kpis.test.ts` | ❌ W0 | ⬜ pending |
| 13-01-05 | 01 | 1 | PMDB-06 | unit | `npx vitest run src/lib/kpis/pm-kpis.test.ts` | ❌ W0 | ⬜ pending |
| 13-02-01 | 02 | 1 | PMDB-02 | manual smoke | `npm run dev` + visual check | N/A | ⬜ pending |
| 13-03-01 | 03 | 2 | PMDB-03 | unit (action) | `npx vitest run src/app/actions/__tests__/` | ❌ W0 | ⬜ pending |
| 13-04-01 | 04 | 2 | PMDB-04 | unit (component) | `npx vitest run` | ❌ W0 | ⬜ pending |
| 13-05-01 | 05 | 2 | PMDB-05 | unit | `npx vitest run` | ❌ W0 | ⬜ pending |
| 13-05-02 | 05 | 2 | PMDB-05 | unit | `npx vitest run src/lib/kpis/pm-kpis.test.ts` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `src/lib/kpis/pm-kpis.test.ts` — add tests for `jobsInProgress`, `turnsNearDeadline`, `revenueExposure`, `revenueExposureExcludedCount` (extends existing file)
- [ ] `src/app/actions/lease-ready-date.ts` — new server action file (no test file yet; add to `src/app/actions/__tests__/` pattern if integration tests exist)
- [ ] Component-level tests for `DoneButton` and `ActiveJobsTable` if project has component test coverage

*Existing `pm-kpis.test.ts` covers `activeTurns`, `completedLast30d`, `avgTurnTime`, `projectedSpendMTD`, `pastTargetCount` — these tests must be updated for the renamed fields*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Turn age column displays `daysOffMarketUntilReady` | PMDB-02 | Visual rendering in table row | `npm run dev` → navigate to PM dashboard → verify age column shows numeric days |
| Lease-ready date input saves on blur | PMDB-03 | Requires browser blur event | `npm run dev` → click date input → enter date → click elsewhere → verify toast + saved |
| Done button hides row optimistically | PMDB-04 | Requires visual confirmation of row removal | `npm run dev` → click Done on a turn → verify row disappears → refresh → verify still gone |
| Revenue Exposure footnote shows excluded count | PMDB-06 | Visual rendering below KPI card | `npm run dev` → verify footnote text below Revenue Exposure KPI |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
