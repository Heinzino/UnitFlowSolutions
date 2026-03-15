# Project Retrospective

*A living document updated after each milestone. Lessons feed forward into future planning.*

## Milestone: v1.0 — MVP

**Shipped:** 2026-03-15
**Phases:** 9 | **Plans:** 24 | **Sessions:** ~15

### What Was Built
- Role-based dashboard system (Executive, PM, RM) with Supabase auth
- Airtable data layer with caching (60s TTL), rate limiting (5 req/sec), batch resolution
- Executive dashboard with 6 KPI cards, trend arrows, health gauge, vendor chart
- PM dashboard with overdue-first turn list, inline job/turn status updates
- Vendor metrics page with sortable table and job badge navigation
- Responsive layout with sidebar (desktop) and bottom tab bar (mobile)

### What Worked
- Phase-based execution with parallel plan waves kept momentum high — 9 phases in 7 days
- Server Components + `use cache` eliminated client-side data fetching complexity
- Verification loop (plan → check → revise) caught issues before execution
- Documentation-only Phase 9 cleanly closed all audit gaps without code churn

### What Was Inefficient
- DM → RM rename in Phase 6 required touching auth types, routes, middleware, and tests — earlier stakeholder alignment would have avoided this
- NOTIF-01..04 were planned but descoped mid-milestone — should have been flagged as stretch goals earlier
- 5 Airtable fetch functions built in Phase 3 are unused (Properties, Quotes, etc.) — over-built for current feature set
- Build pre-render issue on dynamic routes persisted across phases without resolution

### Patterns Established
- `use cache` + `cacheLife` + `cacheTag` for server-side data caching with tag-based invalidation
- Role-aware navigation (sidebar/bottom tabs filter items by user role)
- KPI compute functions as pure, testable modules separate from UI
- Phase VERIFICATION.md as formal evidence-based verification documents

### Key Lessons
1. Build only the fetch functions the UI actually needs — unused code is silent tech debt
2. Role naming should be confirmed with stakeholders before building auth infrastructure
3. `computeTrend` should return null for 0% changes — misleading UI for no-change scenarios
4. Next.js 16 `use cache` replaces `unstable_cache` — project started with the right API

### Cost Observations
- Model mix: ~20% opus (orchestration), ~80% sonnet (research, planning, execution, verification)
- Sessions: ~15 across 7 days
- Notable: Parallel wave execution (2 agents) significantly reduced wall-clock time for independent plans

---

## Cross-Milestone Trends

### Process Evolution

| Milestone | Sessions | Phases | Key Change |
|-----------|----------|--------|------------|
| v1.0 | ~15 | 9 | Established GSD workflow with research → plan → verify → execute cycle |

### Cumulative Quality

| Milestone | Tests | Coverage | Tech Debt Items |
|-----------|-------|----------|-----------------|
| v1.0 | 158 | Unit + Integration | 4 |

### Top Lessons (Verified Across Milestones)

1. Phase-based execution with verification loops catches integration issues before they compound
2. Documentation phases (cleanup/verification) are worth the investment — they close audit gaps cleanly
