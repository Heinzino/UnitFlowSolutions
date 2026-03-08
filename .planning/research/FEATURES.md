# Feature Research

**Domain:** Property management unit turnover (make ready) dashboard
**Researched:** 2026-03-08
**Confidence:** HIGH (based on project context, existing Airtable interface analysis, reference screenshots, and domain knowledge of property management operations software)

## Feature Landscape

### Table Stakes (Users Expect These)

Features users assume exist. Missing these = product feels incomplete or worse than the Airtable interface it replaces.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Role-based authentication | Users currently share Airtable views; role separation is a core reason for the dashboard | MEDIUM | Supabase handles auth, but middleware routing and property scoping add complexity |
| Property-scoped data visibility | PMs must only see their properties; executives see all. This is the #1 pain point with Airtable's "everyone sees everything" UI | MEDIUM | Filter logic in every query; mismatch between property names in Airtable vs Supabase is a known risk |
| Turn request list with status | The core data view. PMs live in this list daily. Must show property, unit, status, dates, linked jobs, price | LOW | Direct mapping from Airtable Turn Requests table. Two sections: overdue and on-schedule |
| Overdue/attention-needed turns surfaced first | The #1 workflow: "what needs my attention right now?" Burying overdue items = worse than Airtable | LOW | Sort/filter logic on target dates. Pink alert card for "Past Target Time" matches existing Airtable interface |
| Job status tracking per turn | Each turn has multiple vendor jobs. PMs need to see which jobs are stuck, blocked, or need attention | LOW | Read from Jobs table, display as rows in turn detail. Status badge coloring is critical UX |
| KPI summary cards | Executives and PMs both need at-a-glance metrics. This is the dashboard's reason to exist vs a spreadsheet | MEDIUM | Aggregation logic over Airtable data. ~10 distinct KPI calculations needed |
| Inline job status updates | "Update status without leaving the page" is explicitly called out as the pain point. If users must navigate away, they might as well use Airtable | MEDIUM | Server actions that write to Airtable API then bust cache. Optimistic UI recommended |
| Turn detail drill-down | Click a turn to see all linked jobs, dates, pricing, notes. The turn is the core business object | LOW | Route: /property/turns/[requestId]. Fetches linked job records |
| Vendor metrics view | Who's performing, who's not. Table of vendors with completion rates and job counts | LOW | Already exists in Airtable interface (see VendorMetrics.png). Direct read from Vendors table rollup fields |
| Property filter/selector | PMs with multiple properties or DMs need to filter by property. Existing Airtable interface has this | LOW | Dropdown populated from user's assigned_properties array |
| Responsive layout | PMs check on-site from tablets/phones. If the dashboard doesn't work on mobile, they fall back to Airtable | MEDIUM | Three-column desktop, two-column tablet, stacked mobile. Bottom tab bar on mobile replaces sidebar |
| Loading states / skeletons | Data comes from a remote API with 60s cache. Blank screens feel broken | LOW | Skeleton components matching card shapes. Next.js loading.tsx convention |

### Differentiators (Competitive Advantage)

Features that make this dashboard better than Airtable or generic project management tools for this specific domain.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| Smart notification panel (derived alerts) | Automatically surfaces "NEEDS ATTENTION" jobs, counter quotes pending review, approaching deadlines. Users never miss critical items. Airtable has no notification layer | MEDIUM | Derive notifications from Airtable data (not a separate table). Middle column in layout. Logic: jobs with status "NEEDS ATTENTION", counter quotes populated, jobs within 2 days of end date, turns past target |
| Inline pricing approval | Accept or flag vendor quotes directly from the turn detail. Currently requires navigating multiple Airtable views. Saves 5+ clicks per decision | MEDIUM | Server action writes approval to Airtable. Show current price from Vendor_Pricing, counter quote if exists, approve/flag buttons |
| District Manager portfolio view | Multi-property overview with drill-down. Airtable has no concept of a "portfolio" view. DMs currently manually check each property | MEDIUM | Property cards grid with mini-stats (active turns, completion rate, pending approvals). Drill-down reuses PM components |
| Role-appropriate dashboards (3 distinct views) | Each role gets exactly what they need. Executive = health snapshot. PM = daily action list. DM = portfolio overview. Airtable gives everyone the same interface | HIGH | Three separate route groups with distinct layouts and data queries. Major UX win but significant build effort |
| Color-coded alert cards (pink/yellow severity) | Visual urgency hierarchy. Pink = past target (action required NOW). Yellow = trending past target (act soon). White = on track. Immediate visual triage without reading every row | LOW | CSS classes on KPI cards. Already visible in reference screenshots. Simple but high-impact UX |
| Notes on turn requests | Add contextual notes per turn. Currently PMs communicate about turns via separate channels (email, text). Centralizes communication on the business object | LOW | Text area in turn detail, server action appends to Airtable Notes field. Simple but valuable for accountability |
| Charts and data visualization | Vendor performance bar charts, completion gauges, trend indicators. Transforms raw numbers into actionable insight. Airtable's native charts are limited | MEDIUM | Recharts library. Vendor bar chart, semi-circular gauge, trend arrows with percentages |
| Backlog delta KPI | "Jobs opened minus jobs completed" over 30 days. Negative = clearing backlog, positive = falling behind. Simple metric but not available in standard Airtable views | LOW | Computed from two existing queries. Powerful executive insight in a single number |

### Anti-Features (Commonly Requested, Often Problematic)

| Feature | Why Requested | Why Problematic | Alternative |
|---------|---------------|-----------------|-------------|
| Real-time chat/messaging | "PMs and vendors need to communicate" | Adds massive complexity (WebSocket, message persistence, notifications). Communication about turns already happens via phone/email and is fine. Building chat pulls focus from the core value: visibility | Notes on turn requests. If richer communication needed later, integrate with existing tools (Slack, email) |
| Photo/video uploads for unit conditions | "Need to document unit condition during turns" | Storage complexity (Airtable attachment limits, image processing, CDN). Significant scope expansion. Photos are already uploaded directly to Airtable by field staff | Defer to v2. Airtable attachment field can display existing photos read-only in the dashboard without upload complexity |
| Admin panel for user management | "Need to add/remove users without touching Supabase" | Only 6-15 users, changes happen rarely (new PM hire). Building a full admin panel is disproportionate effort | Manual Supabase account creation. Add admin panel if/when user count grows significantly |
| OAuth/social login | "Easier than remembering passwords" | Adds OAuth provider configuration complexity. These are internal business users, not consumers. Password managers solve the problem | Email/password via Supabase. 6-15 internal users can handle a password |
| Custom report builder | "Let users create their own KPI views" | Massive complexity. The whole point of the dashboard is opinionated views per role. Customization undermines the "fewer clicks to what matters" value proposition | Fixed, well-designed KPI cards per role. If new metrics needed, add them to the codebase |
| Mobile native app | "PMs are on-site, need mobile" | Two codebases (or React Native complexity). Responsive web covers mobile use cases. PWA possible later if needed | Responsive web design. Test on mobile Safari/Chrome. Add to home screen works fine |
| Real-time data sync (WebSocket/SSE) | "I want to see updates immediately when vendors complete jobs" | Airtable has no WebSocket API. Would require polling or a webhook relay. 60s cache is already near-real-time for this domain. Turns take days, not seconds | 60-second cache revalidation + immediate cache bust on writes from the dashboard. For the weekly/daily check cadence, this is more than sufficient |
| Vendor portal (self-service for vendors) | "Let vendors update their own job status" | Entirely different user base, auth model, and permission system. Vendors use phone/text to communicate with PMs. Building a vendor-facing app is a separate product | Keep vendor communication out-of-band. PM updates job status based on vendor communication. Consider vendor portal as a separate v2+ product if demand exists |
| Airtable schema modifications | "The schema could be better organized" | The dashboard reads existing schema as-is. Changing schema breaks existing Airtable automations, views, and workflows that other stakeholders depend on | Work with existing schema. Map Airtable field names to clean TypeScript interfaces in the API layer |
| Offline mode | "PMs walk properties without internet" | Complex sync logic, conflict resolution, storage. The dashboard is a read-heavy tool with occasional writes | Progressive enhancement: cache last-viewed data in service worker for read-only offline access (v2+) |

## Feature Dependencies

```
[Supabase Auth + Role Mapping]
    |
    +--requires--> [Property-Scoped Data Queries]
    |                   |
    |                   +--requires--> [Turn Request List]
    |                   |                   |
    |                   |                   +--requires--> [Turn Detail / Job View]
    |                   |                   |                   |
    |                   |                   |                   +--enhances--> [Inline Status Updates]
    |                   |                   |                   +--enhances--> [Pricing Approval]
    |                   |                   |                   +--enhances--> [Notes]
    |                   |                   |
    |                   |                   +--enhances--> [Overdue-First Sorting]
    |                   |
    |                   +--requires--> [KPI Aggregation Functions]
    |                   |                   |
    |                   |                   +--requires--> [Executive KPI Dashboard]
    |                   |                   +--requires--> [PM KPI Cards]
    |                   |                   +--requires--> [DM Portfolio Overview]
    |                   |
    |                   +--requires--> [Vendor Data Queries]
    |                                       |
    |                                       +--requires--> [Vendor Metrics Page]
    |                                       +--enhances--> [Charts / Visualizations]
    |
    +--requires--> [Layout Shell (Sidebar + Content)]
                        |
                        +--enhances--> [Notification Panel (Middle Column)]

[Design System Components]
    |
    +--required-by--> [All Views]
    +--required-by--> [KPI Cards]
    +--required-by--> [Status Badges]

[Airtable API Layer + Cache + Rate Limiter]
    |
    +--required-by--> [All Data Queries]
```

### Dependency Notes

- **Auth requires Property Scoping:** Without knowing which properties a user is assigned to, no data can be fetched correctly. Auth and role mapping must come before any view.
- **All views require the Airtable API layer:** The data layer (client, caching, rate limiting, type definitions) must exist before any view can render real data.
- **Design system required by all views:** Button, Card, KPICard, Badge, Table components are used across every view. Build these first to avoid duplication.
- **Turn Detail requires Turn List:** The detail page is a drill-down from the list. The list must exist for navigation to work.
- **Notification Panel enhances Layout Shell:** The notification panel occupies the middle column. The shell layout must support three columns, but notifications can be added after the shell works with two columns.
- **Charts enhance Vendor Metrics:** Charts add visual impact but the vendor metrics page works as a plain table first.

## MVP Definition

### Launch With (v1)

The minimum to replace the Airtable interface for daily PM workflows.

- [ ] Supabase auth with role-based login and property scoping -- users must log in and see only their data
- [ ] Design system components (Button, Card, KPICard, Badge, Table, StatusBadge) -- every view depends on these
- [ ] Layout shell with sidebar navigation -- structural foundation for all views
- [ ] Airtable API layer with caching and rate limiting -- every feature depends on data access
- [ ] Property Manager turn list with overdue-first sorting -- the #1 daily workflow
- [ ] Turn detail with linked jobs and status badges -- the core drill-down
- [ ] PM KPI cards (active make readys, completed 30d/7d, avg time, projected spend, past target) -- at-a-glance health
- [ ] Executive KPI dashboard (all 8+ metrics from reference screenshot) -- weekly health snapshot
- [ ] Inline job status updates -- the core "fewer clicks" value prop
- [ ] Responsive layout (desktop + tablet + mobile basics) -- PMs check on-site

### Add After Validation (v1.x)

Features to add once core workflows are validated with real users.

- [ ] Inline pricing approval -- add when PMs confirm the approval workflow matches their needs
- [ ] Notes on turn requests -- add when PMs confirm they want centralized notes vs. existing communication channels
- [ ] District Manager portfolio view -- add when DM user validates the portfolio card layout and drill-down
- [ ] Smart notification panel (middle column) -- add after validating that derived alerts match what users actually need to see
- [ ] Charts and data visualization (vendor bar charts, gauges) -- add after confirming which visualizations executives actually reference

### Future Consideration (v2+)

Features to defer until product-market fit is established.

- [ ] Photo display from Airtable attachments -- read-only display of existing photos. Defer upload capability
- [ ] Vendor metrics page with charts -- useful but not core to PM/DM daily workflow
- [ ] Weekly summary digest (email or in-app) -- valuable for executives but requires notification infrastructure
- [ ] Admin panel for user management -- only when user count grows beyond manual Supabase management
- [ ] PWA / offline support -- only if PMs report connectivity issues on-site
- [ ] Audit log for status changes and pricing approvals -- accountability feature, add when compliance requirements emerge

## Feature Prioritization Matrix

| Feature | User Value | Implementation Cost | Priority |
|---------|------------|---------------------|----------|
| Supabase auth + role mapping | HIGH | MEDIUM | P1 |
| Design system components | HIGH | MEDIUM | P1 |
| Layout shell (3-column) | HIGH | MEDIUM | P1 |
| Airtable API layer + cache | HIGH | HIGH | P1 |
| PM turn list (overdue first) | HIGH | LOW | P1 |
| Turn detail with jobs | HIGH | LOW | P1 |
| PM KPI cards | HIGH | MEDIUM | P1 |
| Executive KPI dashboard | HIGH | MEDIUM | P1 |
| Inline job status updates | HIGH | MEDIUM | P1 |
| Responsive layout | HIGH | MEDIUM | P1 |
| Inline pricing approval | HIGH | MEDIUM | P2 |
| Notes on turns | MEDIUM | LOW | P2 |
| DM portfolio view | MEDIUM | MEDIUM | P2 |
| Notification panel | MEDIUM | MEDIUM | P2 |
| Charts / visualizations | MEDIUM | MEDIUM | P2 |
| Property filter dropdown | MEDIUM | LOW | P2 |
| Vendor metrics page | LOW | LOW | P2 |
| Photo display (read-only) | LOW | MEDIUM | P3 |
| Admin panel | LOW | MEDIUM | P3 |
| PWA / offline | LOW | HIGH | P3 |

**Priority key:**
- P1: Must have for launch -- daily PM and weekly executive workflows depend on these
- P2: Should have, add when possible -- enhance the experience but don't block initial adoption
- P3: Nice to have, future consideration -- defer until validated need

## Competitor Feature Analysis

| Feature | Airtable Native (current) | Yardi / RealPage (enterprise) | AppFolio (mid-market) | Our Approach |
|---------|---------------------------|-------------------------------|------------------------|--------------|
| Role-based views | No -- everyone sees the same interface | Yes -- complex role hierarchy | Yes -- simplified roles | Three distinct views (PM, DM, Exec) with property scoping |
| Turn tracking | Table rows with filters | Full work order system with vendor dispatch | Basic maintenance tracking | Turn-centric with linked jobs per turn |
| KPI dashboard | Airtable Interface blocks (limited) | Extensive reporting module | Basic reporting | Opinionated KPI cards matching existing Airtable metrics, optimized for at-a-glance |
| Vendor management | Separate table, manual lookups | Full vendor portal with bidding | Basic vendor directory | Read-only vendor metrics with performance data from Airtable rollups |
| Notifications | None | In-app + email + SMS | Email alerts | Derived from data (no separate notification table). In-app notification panel |
| Pricing approval | Navigate to record, edit field | Workflow engine with approval chains | Not specialized for turns | Inline approve/flag buttons on turn detail page |
| Mobile | Airtable mobile app (generic) | Dedicated mobile apps | Mobile app | Responsive web -- no app store friction |
| Cost | $20-45/user/month for Airtable licenses | $5-12/unit/month (enterprise pricing) | $1.40+/unit/month | Vercel hosting (free tier or ~$20/month). Eliminates per-user Airtable license costs |

## Sources

- Project context: `.planning/PROJECT.md` -- validated requirements and constraints
- Existing interface: `AirtableReference/` screenshots (ExecutiveDashboard.png, PropertyView.png, PropertyView2.png, VendorMetrics.png) -- current feature baseline
- Airtable schema: `SnapshotData/` CSV exports -- data model and field inventory
- Implementation plan: `PLAN.md` -- detailed architecture and phase breakdown
- Design language: `THEME.md` -- visual design constraints and component specifications
- Domain knowledge: Property management turnover operations, vendor coordination workflows, multi-property portfolio management patterns (MEDIUM confidence -- based on training data, not verified against current market sources)

---
*Feature research for: Property management unit turnover dashboard*
*Researched: 2026-03-08*
