---
phase: 3
slug: airtable-data-layer
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-11
---

# Phase 3 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest 4.0.18 |
| **Config file** | `vitest.config.ts` (project root) |
| **Quick run command** | `npx vitest run --reporter=verbose src/lib/airtable` |
| **Full suite command** | `npx vitest run --reporter=verbose` |
| **Estimated runtime** | ~5 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx vitest run --reporter=verbose src/lib/airtable`
- **After every plan wave:** Run `npx vitest run --reporter=verbose`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 10 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 03-01-01 | 01 | 1 | DATA-01 | unit | `npx vitest run src/lib/airtable/__tests__/client.test.ts` | ❌ W0 | ⬜ pending |
| 03-01-02 | 01 | 1 | DATA-02 | unit | `npx vitest run src/lib/airtable/__tests__/mappers.test.ts` | ❌ W0 | ⬜ pending |
| 03-01-03 | 01 | 1 | DATA-04 | unit | `npx vitest run src/lib/airtable/__tests__/rate-limiter.test.ts` | ❌ W0 | ⬜ pending |
| 03-02-01 | 02 | 1 | DATA-02 | unit | `npx vitest run src/lib/airtable/__tests__/mappers.test.ts` | ❌ W0 | ⬜ pending |
| 03-02-02 | 02 | 1 | DATA-05 | unit | `npx vitest run src/lib/airtable/__tests__/mappers.test.ts` | ❌ W0 | ⬜ pending |
| 03-03-01 | 03 | 2 | DATA-03 | smoke | `npx next build` | ❌ W0 | ⬜ pending |
| 03-03-02 | 03 | 2 | DATA-06 | unit (mocked) | `npx vitest run src/app/actions/__tests__/job-status.test.ts` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `src/lib/airtable/__tests__/client.test.ts` — stubs for DATA-01 (env var guard, server-only export)
- [ ] `src/lib/airtable/__tests__/rate-limiter.test.ts` — stubs for DATA-04 (token bucket timing, acquire blocks)
- [ ] `src/lib/airtable/__tests__/mappers.test.ts` — stubs for DATA-02, DATA-05 (field mapping, OR() formula builder)
- [ ] `src/app/actions/__tests__/job-status.test.ts` — stubs for DATA-06 (mocked Airtable + revalidateTag)
- [ ] `src/lib/airtable/` directory — create directory structure

*If none: "Existing infrastructure covers all phase requirements."*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| `cacheComponents: true` config produces cached responses | DATA-03 | Requires running Next.js dev/prod server with Airtable connection | 1. Run `npm run build` 2. Verify no cache warnings 3. Hit a page using cached data twice, confirm second request is faster |
| Property scoping filters data per user role | DATA-02 | Requires Supabase auth context with different roles | 1. Login as PM 2. Verify only assigned properties shown 3. Login as Exec 4. Verify all properties shown |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 10s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
