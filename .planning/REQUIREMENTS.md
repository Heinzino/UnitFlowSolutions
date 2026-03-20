# Requirements: UnitFlowSolutions v1.2 Dashboard Redesign

**Defined:** 2026-03-18
**Core Value:** Property Managers can instantly see which turns are overdue, which jobs are stuck, and take action without hunting through Airtable — fewer clicks to the information that matters.

## v1.2 Requirements

### Terminology

- [x] **TERM-01**: All dashboard views display "Turns" instead of "Make Ready" for unit turnover events
- [x] **TERM-02**: All dashboard views display "Jobs" instead of "Make Ready" for vendor work items
- [x] **TERM-03**: All dashboard views display "Off Market" instead of "Vacant" for unit status
- [x] **TERM-04**: TypeScript identifiers updated to match new terminology (types, variables, file names)

### PM Dashboard

- [x] **PMDB-01**: PM dashboard displays 6 KPI boxes (active turns, avg turn time, revenue exposure, completed this period, jobs in progress, turns near deadline)
- [x] **PMDB-02**: PM can view Open Turns list with turn age and status visible
- [x] **PMDB-03**: PM can enter a lease-ready date inline on each Open Turn row (blur-triggered server action with optimistic UI)
- [x] **PMDB-04**: PM can mark a turn as "Done" via inline button on the Open Turns list
- [x] **PMDB-05**: PM can view Active Jobs table showing all in-flight jobs across their turns (sortable by vendor, status, days open)
- [x] **PMDB-06**: Revenue Exposure KPI displays dollar amount ($60/day × days over target) with count of excluded turns (no target date)

### RM Dashboard

- [x] **RMDB-01**: RM dashboard served at /regional route with middleware routing rm role to /regional
- [x] **RMDB-02**: RM dashboard displays 6 aggregated KPI boxes (cross-property metrics)
- [x] **RMDB-03**: RM can view Property Insights list showing per-property stats (active turns, avg turn time, revenue exposure)
- [x] **RMDB-04**: RM can drill down from Property Insights to PM-level view scoped to selected property
- [x] **RMDB-05**: RM can view Avg Turn Time bar graph with per-property bars color-coded by threshold (green <7d, amber 7-14d, red >14d)

### Executive Dashboard

- [ ] **EXEC-01**: Executive dashboard displays 6 redesigned KPI boxes (portfolio-level metrics)
- [ ] **EXEC-02**: Executive can view Top 10 Properties by Revenue Exposure ranked table

### Completed Jobs

- [x] **COMP-01**: User can navigate to Completed Jobs page at /property/completed-jobs
- [x] **COMP-02**: User can filter completed jobs by property via PropertyMultiSelect
- [x] **COMP-03**: Completed Jobs table reuses Active Jobs table component with server-side isCompleted filter

## Future Requirements

### Notifications

- **NOTF-01**: Middle column notification/alert system
- **NOTF-02**: Derived alerts matching actual user needs

### Inline Operations

- **INLN-01**: Inline pricing approval (accept/flag vendor quotes from turn detail)
- **INLN-02**: Notes on turn requests (add/view notes per unit turnover)

### Roles

- **ROLE-01**: Maintenance Manager role view

## Out of Scope

| Feature | Reason |
|---------|--------|
| Configurable KPI boxes | Fixed per-role sets sufficient for 6-15 users |
| Date range filtering on Completed Jobs | Property filter covers primary use case |
| Revenue Exposure forecasting | Requires historical data storage not in scope |
| Avg Turn Time historical trending | Point-in-time metric only; no snapshot storage |
| Bulk editable job fields in Active Jobs table | Status, Start Date, End Date editable inline; bulk/multi-field edit in Airtable |
| Real-time push updates (WebSocket/SSE) | Airtable has no WebSocket API; 60s cache sufficient |
| Multi-column sort on tables | Single-column sort covers 95% of use cases |
| Per-user notification preferences | Role-based scoping already limits noise |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| TERM-01 | Phase 12 | Complete |
| TERM-02 | Phase 12 | Complete |
| TERM-03 | Phase 12 | Complete |
| TERM-04 | Phase 12 | Complete |
| PMDB-01 | Phase 13 | Complete |
| PMDB-02 | Phase 13 | Complete |
| PMDB-03 | Phase 13 | Complete |
| PMDB-04 | Phase 13 | Complete |
| PMDB-05 | Phase 13 | Complete |
| PMDB-06 | Phase 13 | Complete |
| COMP-01 | Phase 14 | Complete |
| COMP-02 | Phase 14 | Complete |
| COMP-03 | Phase 14 | Complete |
| RMDB-01 | Phase 15 | Complete |
| RMDB-02 | Phase 15 | Complete |
| RMDB-03 | Phase 15 | Complete |
| RMDB-04 | Phase 15 | Complete |
| RMDB-05 | Phase 15 | Complete |
| EXEC-01 | Phase 16 | Pending |
| EXEC-02 | Phase 16 | Pending |

**Coverage:**
- v1.2 requirements: 20 total
- Mapped to phases: 20
- Unmapped: 0 ✓

---
*Requirements defined: 2026-03-18*
*Last updated: 2026-03-19 — Phase 13 complete, all PMDB-* requirements marked complete*
