# Phase 1: Scaffolding and Design System - Context

**Gathered:** 2026-03-08
**Status:** Ready for planning

<domain>
## Phase Boundary

Next.js project setup with Tailwind theme from THEME.md, reusable UI component library (10 components), and responsive layout shell. No data fetching, no authentication — just the visual building blocks every subsequent phase composes into views.

Requirements covered: UI-01, UI-02, UI-03, UI-04, UI-05

</domain>

<decisions>
## Implementation Decisions

### Sidebar & Navigation
- Minimal icon-only sidebar with no text labels — tooltips on hover for context
- Universal icon set for all roles (same icons regardless of PM/DM/Exec). Role-gating handled at page level, not sidebar level
- Sidebar icons: Dashboard, Properties, Vendors, Notifications, Settings, Logout
- Active state: filled green circle background per THEME.md
- No notification column (middle column) until Phase 7 — two-column layout (sidebar + main) for now
- On mobile (<768px): sidebar icons move to a floating bottom tab bar with rounded corners and gap from screen edge, active tab highlighted with emerald fill

### Component Library
- Radix UI primitives (dropdowns, tooltips, dialogs) with custom Tailwind styling — accessibility out of the box
- No shadcn/ui, no full component framework
- 10 required components: Button, Card, KPICard, Badge, Table, Input, Skeleton, StatusBadge, TrendIndicator, CurrencyDisplay
- Dev-only demo page at /components route to showcase all components with sample data (removed before production)

### StatusBadge
- Filled pill style with solid colored background and white text
- Status colors: green (Completed/Ready), red (NEEDS ATTENTION), yellow (Blocked), blue (In Progress)
- High visual contrast for quick scanning in tables

### Table
- No heavy borders — subtle row dividers per THEME.md
- Rows highlight on hover (subtle green tint)
- Clicking a row navigates to detail view — no explicit action buttons needed
- On mobile: table transforms into stacked card list (each row becomes a card showing key fields)

### KPI Cards
- Follow THEME.md design: dark square icon badge top-left, large bold number, trend arrow + percentage below
- Trend indicators compare current value vs. previous 30-day window
- Alert cards (pink for past target / NEEDS ATTENTION, yellow for trending past target) use colored background fill — stand out from white standard KPI cards
- Built-in loading prop: KPICard renders its own Skeleton matching card dimensions when loading=true

### Responsive Breakpoints
- Desktop (1280px+): icon sidebar + main content (no notification column yet)
- Tablet (768-1279px): same as desktop — icon sidebar already narrow enough for tablet
- Mobile (<768px): sidebar hidden, floating bottom tab bar with same icons, KPI cards stack vertically (full width), tables become card lists

### Claude's Discretion
- Exact icon choices (Lucide, Heroicons, or similar rounded icon set)
- Skeleton animation style and timing
- Card shadow depth and border-radius fine-tuning within THEME.md's 16px guideline
- Button variant system (primary, secondary, ghost, etc.)
- Input field styling details
- Demo page layout and organization
- TrendIndicator and CurrencyDisplay component internals

</decisions>

<specifics>
## Specific Ideas

- THEME.md is the visual source of truth — dark forest green background (#0F4A2A), white cards, emerald accents (#22C55E / #16A34A), chartreuse CTAs (#CAEF45)
- Typography: Plus Jakarta Sans for headings, Geist for body text, tabular-nums for statistics
- Reference screenshots in AirtableReference/ show the existing Airtable interface being replaced — these inform data layout but the new dashboard should look significantly more polished
- KPI cards should feel like the THEME.md description: "icon in a rounded dark square badge, large bold number, small trend indicator"
- Mobile bottom tab bar should feel like iOS tab bar — floating with rounded corners

</specifics>

<code_context>
## Existing Code Insights

### Reusable Assets
- None — greenfield project, no existing code

### Established Patterns
- None yet — Phase 1 establishes the patterns all subsequent phases follow

### Integration Points
- THEME.md defines colors, typography, spacing, and component style guidelines
- SnapshotData/ contains CSV exports from all 9 Airtable tables (useful for realistic mock data)
- AirtableReference/ contains screenshots of the existing interface (layout reference)

</code_context>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 01-scaffolding-and-design-system*
*Context gathered: 2026-03-08*
