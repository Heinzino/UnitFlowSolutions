# Requirements: UnitFlowSolutions (ScheduleSimple)

**Defined:** 2026-03-08
**Core Value:** Property Managers can instantly see which turns are overdue, which jobs are stuck, and take action without hunting through Airtable — fewer clicks to the information that matters.

## v1 Requirements

### Authentication

- [x] **AUTH-01**: User can log in with email and password via Supabase
- [x] **AUTH-02**: User is redirected to their role-appropriate dashboard after login (PM → /property, RM → /property, Exec → /executive)
- [x] **AUTH-03**: Unauthenticated users are redirected to login page
- [x] **AUTH-04**: User session persists across browser refresh
- [x] **AUTH-05**: User can log out from any page
- [x] **AUTH-06**: Users can only access routes matching their role (PM cannot access /executive)

### Property Scoping

- [x] **SCOPE-01**: Property Managers see only turns/jobs for their assigned properties
- [x] **SCOPE-02**: District Managers see data for their assigned property set
- [x] **SCOPE-03**: Executives see data across all properties with no filter
- [x] **SCOPE-04**: Property name matching between Supabase and Airtable is normalized to handle inconsistencies

### Design System

- [x] **UI-01**: THEME.md color palette applied (forest green background, white cards, emerald accents)
- [x] **UI-02**: Plus Jakarta Sans for headings, Geist for body text, tabular-nums for statistics
- [x] **UI-03**: Reusable component library: Button, Card, KPICard, Badge, Table, Input, Skeleton, StatusBadge, TrendIndicator, CurrencyDisplay
- [x] **UI-04**: Three-column layout shell: narrow icon sidebar, notification panel, main content area
- [x] **UI-05**: Responsive layout — desktop (1280px+) three-column, tablet (768-1279px) sidebar + main, mobile (<768px) bottom tab bar + stacked cards

### Airtable Integration

- [x] **DATA-01**: All Airtable access is server-side only (API key never exposed to browser)
- [x] **DATA-02**: Read data from all 9 Airtable tables with correct TypeScript type mappings
- [x] **DATA-03**: Cache responses with 60s TTL using Next.js caching with tag-based revalidation
- [x] **DATA-04**: Rate limiter prevents exceeding Airtable's 5 req/sec limit
- [x] **DATA-05**: Linked record IDs are resolved via batch fetches (no N+1 queries)
- [x] **DATA-06**: Write operations (status updates) bust relevant cache tags immediately

### Property Manager View

- [x] **PM-01**: Turn request list with "Make Readys Past Target Time" section displayed first (overdue-first)
- [x] **PM-02**: Turn request list with "Active Make Readys (On Schedule)" section below
- [x] **PM-03**: Turn list columns: Property Name (badge), Unit Number, Status (pill), Ready To Lease Date, Vacant Date, Jobs (linked IDs), Price
- [x] **PM-04**: Property filter dropdown when PM has multiple assigned properties
- [x] **PM-05**: KPI cards: Number of Active Make Readys, Make Readys Completed (30 days), Make Readys Completed (7 days)
- [x] **PM-06**: KPI cards: Average Make Ready Time, Projected Spend (MTD), Make Readys Past Target Time (pink alert card)
- [x] **PM-07**: Turn detail page showing all linked jobs with: Job ID, Vendor Name, Vendor Type, Status badge, Start/End dates, Price
- [x] **PM-08**: Inline job status update — PM can change job status (NEEDS ATTENTION / Blocked / In Progress / Completed / Ready) from turn detail without navigating away
- [x] **PM-09**: Loading skeleton states matching card and table layouts

### Executive View

- [x] **EXEC-01**: KPI cards row 1: Active Jobs Open, Jobs Trending Past Target (2 days from completion)
- [x] **EXEC-02**: KPI cards row 2: Jobs Completed (30 days), Backlog Delta (opened minus completed)
- [x] **EXEC-03**: KPI cards row 3: Average Time To Complete a Job, Projected Cost Exposure (MTD)
- [x] **EXEC-04**: Make Ready Overview section: Active Make Readys Open
- [x] **EXEC-05**: Alert cards: Make Readys Past Target Time (pink, NEEDS ATTENTION), Make Readys Trending Past Target Date (yellow, 2 days warning)
- [x] **EXEC-06**: All KPI data computed across all properties (no filter)
- [x] **EXEC-07**: Loading skeleton states

### District Manager View

> *Redesigned in Phase 6: Regional Managers reuse the PM view with PropertySelector for multi-property access. The original portfolio UI was dropped per user decision (see 06-CONTEXT.md).*

- [x] **DM-01**: UserRole type contains 'rm' (Regional Manager) replacing 'dm'; ROLE_ROUTES maps rm to /property; ROLE_LABELS maps rm to 'Regional Manager'
- [x] **DM-02**: RM users see the same PM KPI cards and turn list via shared /property route — no separate KPI view needed
- [x] **DM-03**: RM users with multiple properties see PropertySelector dropdown in header for multi-property access (reuses existing PM components)
- [x] **DM-04**: /district URL redirects to /property gracefully; all existing tests pass and TypeScript compiles with zero errors after rename

### Vendor Metrics

- [x] **VEND-01**: Vendor table showing: Vendor Name, Num Jobs Completed, Average Completion Time (Days), Num Jobs Assigned, Jobs (linked ID badges)

### Notification Panel

- [ ] **NOTIF-01**: ~~Middle column displays auto-derived notifications from Airtable data~~ *Descoped — existing alert cards sufficient*
- [ ] **NOTIF-02**: ~~Alert types: Job status "NEEDS ATTENTION" (red), Counter Quote pending (dollar icon), Job approaching deadline within 2 days (clock), Turn past target time (warning)~~ *Descoped*
- [ ] **NOTIF-03**: ~~Each notification shows icon, description text, and timestamp or amount~~ *Descoped*
- [ ] **NOTIF-04**: ~~Clicking a notification navigates to the relevant turn/job detail page~~ *Descoped*

### Charts & Visualization

- [x] **VIZ-01**: Vendor performance bar chart (rounded-top bars, green fill, diagonal hatch for non-highlighted)
- [x] **VIZ-02**: Completion gauge (semi-circular arc, dark-to-light green gradient, centered number)
- [x] **VIZ-03**: Trend indicators on KPI cards (arrow up/down + percentage + color)
- [x] **VIZ-04**: Color-coded alert cards: pink for past target, yellow for trending past target

## v2 Requirements

### Pricing & Notes

- **PRICE-01**: Inline pricing approval — PM can accept or flag vendor quotes from turn detail
- **PRICE-02**: Display current price from Vendor_Pricing alongside any counter quote
- **NOTE-01**: Add notes to turn requests via text area in turn detail
- **NOTE-02**: View existing notes on turn requests

### Photos

- **PHOTO-01**: Display existing Airtable attachment photos on turn detail (read-only)

### Admin

- **ADMIN-01**: Admin panel for creating/managing Supabase user accounts and role assignments

## Out of Scope

| Feature | Reason |
|---------|--------|
| Real-time chat/messaging | Massive complexity, communication happens via phone/email and is fine |
| Video/photo uploads | Storage complexity, field staff upload directly to Airtable |
| OAuth/social login | 6-15 internal users, email/password sufficient |
| Mobile native app | Responsive web covers mobile use cases |
| Custom report builder | Undermines the "opinionated views per role" value proposition |
| Airtable schema changes | Dashboard works with existing schema, changes would break other workflows |
| Real-time sync (WebSocket) | Airtable has no WebSocket API, 60s cache is sufficient for daily/weekly check cadence |
| Vendor self-service portal | Different user base and auth model, separate product |
| Offline mode | Read-heavy tool, connectivity not a reported issue |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| UI-01 | Phase 1 | Complete |
| UI-02 | Phase 1 | Complete |
| UI-03 | Phase 1 | Complete |
| UI-04 | Phase 1 | Complete |
| UI-05 | Phase 1 | Complete |
| AUTH-01 | Phase 2 | Complete |
| AUTH-02 | Phase 2 | Complete |
| AUTH-03 | Phase 2 | Complete |
| AUTH-04 | Phase 2 | Complete |
| AUTH-05 | Phase 2 | Complete |
| AUTH-06 | Phase 2 | Complete |
| SCOPE-01 | Phase 2 | Complete |
| SCOPE-02 | Phase 2 | Complete |
| SCOPE-03 | Phase 2 | Complete |
| SCOPE-04 | Phase 2 | Complete |
| DATA-01 | Phase 9 | Complete |
| DATA-02 | Phase 9 | Complete |
| DATA-03 | Phase 9 | Complete |
| DATA-04 | Phase 9 | Complete |
| DATA-05 | Phase 9 | Complete |
| DATA-06 | Phase 9 | Complete |
| EXEC-01 | Phase 4 | Complete |
| EXEC-02 | Phase 4 | Complete |
| EXEC-03 | Phase 4 | Complete |
| EXEC-04 | Phase 4 | Complete |
| EXEC-05 | Phase 4 | Complete |
| EXEC-06 | Phase 4 | Complete |
| EXEC-07 | Phase 4 | Complete |
| PM-01 | Phase 5 | Complete |
| PM-02 | Phase 5 | Complete |
| PM-03 | Phase 5 | Complete |
| PM-04 | Phase 5 | Complete |
| PM-05 | Phase 5 | Complete |
| PM-06 | Phase 5 | Complete |
| PM-07 | Phase 5 | Complete |
| PM-08 | Phase 5 | Complete |
| PM-09 | Phase 5 | Complete |
| DM-01 | Phase 6 | Complete |
| DM-02 | Phase 6 | Complete |
| DM-03 | Phase 6 | Complete |
| DM-04 | Phase 6 | Complete |
| NOTIF-01 | Phase 9 | Pending (descoped) |
| NOTIF-02 | Phase 9 | Pending (descoped) |
| NOTIF-03 | Phase 9 | Pending (descoped) |
| NOTIF-04 | Phase 9 | Pending (descoped) |
| VIZ-01 | Phase 7 | Complete |
| VIZ-02 | Phase 7 | Complete |
| VIZ-03 | Phase 8 | Complete |
| VIZ-04 | Phase 7 | Complete |
| VEND-01 | Phase 7 | Complete |

**Coverage:**
- v1 requirements: 50 total
- Satisfied: 39
- Pending (gap closure): 7 (VIZ-03, DATA-01–06)
- Pending (descoped): 4 (NOTIF-01–04)
- Mapped to phases: 50
- Unmapped: 0

---
*Requirements defined: 2026-03-08*
*Last updated: 2026-03-08 after roadmap creation*
