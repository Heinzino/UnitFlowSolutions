---
phase: 5
slug: property-manager-view
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-13
---

# Phase 5 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest + jsdom |
| **Config file** | `vitest.config.ts` |
| **Quick run command** | `npx vitest run src/lib/kpis/pm-kpis.test.ts` |
| **Full suite command** | `npx vitest run` |
| **Estimated runtime** | ~15 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx vitest run src/lib/kpis/pm-kpis.test.ts`
- **After every plan wave:** Run `npx vitest run`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 05-01-01 | 01 | 1 | PM-01 | unit | `npx vitest run src/lib/kpis/pm-kpis.test.ts` | ❌ W0 | ⬜ pending |
| 05-01-02 | 01 | 1 | PM-02 | unit | `npx vitest run src/lib/kpis/pm-kpis.test.ts` | ❌ W0 | ⬜ pending |
| 05-01-03 | 01 | 1 | PM-03 | unit (type check) | `npx tsc --noEmit` | ✅ | ⬜ pending |
| 05-01-04 | 01 | 1 | PM-05 | unit | `npx vitest run src/lib/kpis/pm-kpis.test.ts` | ❌ W0 | ⬜ pending |
| 05-01-05 | 01 | 1 | PM-06 | unit | `npx vitest run src/lib/kpis/pm-kpis.test.ts` | ❌ W0 | ⬜ pending |
| 05-02-01 | 02 | 1 | PM-04 | unit | `npx vitest run src/components/layout/__tests__/layout.test.tsx` | ✅ | ⬜ pending |
| 05-02-02 | 02 | 2 | PM-07 | unit | `npx vitest run src/lib/airtable/__tests__/mappers.test.ts` | ✅ | ⬜ pending |
| 05-02-03 | 02 | 2 | PM-08 | unit | `npx vitest run src/app/actions/__tests__/job-status.test.ts` | ✅ | ⬜ pending |
| 05-02-04 | 02 | 2 | PM-09 | unit | `npx vitest run src/components/ui/__tests__/components.test.tsx` | ✅ | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `src/lib/kpis/pm-kpis.test.ts` — stubs for PM-01, PM-02, PM-05, PM-06 (computePMKPIs pure function)

*Existing infrastructure from Phases 1-4 covers PM-03, PM-04, PM-07, PM-08, PM-09.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Overdue section renders above on-schedule section | PM-01, PM-02 | Visual layout ordering | Open PM dashboard, verify "Past Target Time" section appears above "Active Make Readys" |
| KPI cards display with correct styling/variants | PM-05, PM-06 | Visual styling | Check pink alert variant on Past Target Time card |
| Property filter dropdown UX | PM-04 | Interactive component | Select different properties, verify list updates; confirm dropdown hidden when single property |
| Turn detail page navigation | PM-07 | Route transition | Click a turn row, verify detail page loads with all linked jobs |
| Inline status update reflects without page reload | PM-08 | Optimistic UI | Change job status on detail page, verify immediate update without navigation |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
