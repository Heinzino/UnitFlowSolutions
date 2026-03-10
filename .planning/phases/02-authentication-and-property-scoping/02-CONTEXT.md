# Phase 2: Authentication and Property Scoping - Context

**Gathered:** 2026-03-09
**Status:** Ready for planning

<domain>
## Phase Boundary

Users can securely log in with email/password via Supabase, get routed to their role-appropriate dashboard (PM to /property, DM to /district, Exec to /executive), and see only data for their assigned properties. Covers AUTH-01 through AUTH-06 and SCOPE-01 through SCOPE-04.

</domain>

<decisions>
## Implementation Decisions

### Login Page Design
- Centered white card on forest green background — consistent with dashboard's card-based design language
- App name "ScheduleSimple" heading with a short tagline below (e.g., "Property management, simplified")
- Chartreuse (#CAEF45) Sign In button — matches THEME.md primary CTA color
- Login errors displayed inline below the relevant field (red text under email or password)
- No email pre-fill / "remember me" — clean form every time (shared device consideration)

### Session & Logout Behavior
- No session timeout — session persists until explicit logout or browser clear (6-15 internal users, daily/weekly check cadence)
- Instant logout — click logout icon in sidebar, immediately logged out, redirected to login. No confirmation dialog
- Silent redirect to login on session invalidation — no error message, just the login page

### Access Denied Experience
- Silent redirect to role dashboard when accessing unauthorized routes (PM visiting /executive silently goes to /property)
- Silent redirect to dashboard when accessing unauthorized property IDs (e.g., /property/999 for unassigned property)
- Root URL (/) does role-based redirect — authenticated users land on their role dashboard, unauthenticated users go to login
- Sidebar shows all icons for all roles (Phase 1 decision: universal icon set, role-gating at page level)

### Property Context Indicator
- Property name/context shown in the main content page header
- PMs with multiple properties get a dropdown to switch properties in the header
- DMs see "All Properties" (drill-down comes in Phase 6)
- Executives always see "All Properties" (no filter)
- User's name and role badge displayed top-right of main content header
- Empty state when no properties assigned: "No properties assigned to your account. Contact your administrator."

### Claude's Discretion
- Supabase auth implementation details (middleware pattern, token refresh strategy)
- Property assignment data model in Supabase (user_metadata vs separate table)
- Property name normalization approach for Supabase-to-Airtable matching
- Loading states during auth checks
- Login form validation details (email format, password requirements display)
- Mobile responsive adjustments to login page

</decisions>

<specifics>
## Specific Ideas

- Login page should feel minimal and professional — centered card on green, not cluttered
- All "access denied" scenarios use silent redirects — no error pages, no friction. Internal tool with trusted users
- Property context is always visible in the header so users always know what data they're looking at
- The property dropdown for PMs should be built as a reusable component since Phase 5 (PM-04) also requires a property filter dropdown

</specifics>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/components/ui/button.tsx`: Button component with variants — use for Sign In CTA
- `src/components/ui/card.tsx`: Card component with shadow/rounded variants — use for login card
- `src/components/ui/input.tsx`: Input component — use for email/password fields
- `src/components/ui/badge.tsx`: Badge component — use for role badge in header
- `src/components/ui/skeleton.tsx`: Skeleton component — use for auth loading states
- `src/components/layout/app-shell.tsx`: Layout shell wraps all pages — auth context provider goes here
- `src/components/layout/sidebar.tsx`: Sidebar with logout icon already present

### Established Patterns
- Tailwind CSS with THEME.md custom tokens (forest green, emerald, chartreuse)
- Plus Jakarta Sans for headings, Geist for body text
- Component library in `src/components/ui/` with barrel export via `index.ts`
- AppShell wraps all pages via root layout.tsx

### Integration Points
- `src/app/layout.tsx`: Root layout with AppShell — needs auth provider wrapping
- `src/components/layout/sidebar.tsx`: Logout icon needs onClick handler wired to Supabase signOut
- New routes needed: `/login`, `/property`, `/district`, `/executive` (or route groups)
- Middleware for route protection at `src/middleware.ts`

</code_context>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 02-authentication-and-property-scoping*
*Context gathered: 2026-03-09*
