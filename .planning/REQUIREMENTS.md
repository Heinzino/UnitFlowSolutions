# Requirements: UnitFlowSolutions (ScheduleSimple)

**Defined:** 2026-03-15
**Core Value:** Property Managers can instantly see which turns are overdue, which jobs are stuck, and take action without hunting through Airtable — fewer clicks to the information that matters.

## v1.1 Requirements

Requirements for milestone v1.1: Admin Tools & Unit Management.

### User Management

- [ ] **USER-01**: Admin can create a new Supabase user with name, email, role, and assigned properties
- [x] **USER-02**: "Create New User" sidebar item is visible only to heinz@readymation.com and jgiles@cdvsolutions.com
- [x] **USER-03**: Properties dropdown is dynamically populated from Airtable Properties table (searchable)
- [x] **USER-04**: Admin can create a new property inline (with street address) if it doesn't exist in the list

### Vacant Unit Entry

- [ ] **UNIT-01**: User can access "Add Vacant Units" from the sidebar
- [ ] **UNIT-02**: User can select a property from a searchable dropdown (dynamic from Airtable)
- [ ] **UNIT-03**: PM users only see properties they are assigned to in the dropdown
- [ ] **UNIT-04**: User can add multiple units via a repeatable sub-form (unit number + floor plan)
- [ ] **UNIT-05**: Floor plan is a dropdown with exact values: Studio / Loft, 1br 1ba, 1br 2ba, 2br 1ba, 2br 1.5ba, 3br 2ba, 3br 3ba
- [ ] **UNIT-06**: Submitting creates records in Airtable Properties table with property name, unit number, floor plan, parsed bedrooms/bathrooms, city (Columbia), state (SC), and street address
- [ ] **UNIT-07**: User can create a new property inline (with street address) if it doesn't exist
- [ ] **UNIT-08**: Street address is looked up from existing property; required only when creating a new property

## Future Requirements

- Inline pricing approval (accept/flag vendor quotes from turn detail)
- Notes on turn requests (add/view notes per unit turnover)
- Middle column notification/alert system (descoped from v1.0)
- Maintenance Manager role view

## Out of Scope

| Feature | Reason |
|---------|--------|
| Editing existing users | v1.1 is create-only; edit/delete deferred |
| Bulk CSV user import | Keep it simple — one-at-a-time creation |
| Unit editing/deletion | v1.1 is create-only for vacant units |
| Airtable schema changes | Dashboard works with existing schema |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| USER-01 | Phase 10 | Pending |
| USER-02 | Phase 10 | Complete |
| USER-03 | Phase 10 | Complete |
| USER-04 | Phase 10 | Complete |
| UNIT-01 | Phase 11 | Pending |
| UNIT-02 | Phase 11 | Pending |
| UNIT-03 | Phase 11 | Pending |
| UNIT-04 | Phase 11 | Pending |
| UNIT-05 | Phase 11 | Pending |
| UNIT-06 | Phase 11 | Pending |
| UNIT-07 | Phase 11 | Pending |
| UNIT-08 | Phase 11 | Pending |

**Coverage:**
- v1.1 requirements: 12 total
- Mapped to phases: 12
- Unmapped: 0 ✓

---
*Requirements defined: 2026-03-15*
*Last updated: 2026-03-15 — traceability mapped after roadmap creation*
