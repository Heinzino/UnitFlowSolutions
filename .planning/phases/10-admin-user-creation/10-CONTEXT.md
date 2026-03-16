# Phase 10: Admin User Creation - Context

**Gathered:** 2026-03-15
**Status:** Ready for planning

<domain>
## Phase Boundary

Authorized admins (two specific email addresses) can create new Supabase users with name, email, role, and property assignments from a dedicated page in the dashboard. This phase covers the form, access control, property multi-select with inline creation, and post-creation feedback. Editing/deleting users is out of scope (v1.1 is create-only).

</domain>

<decisions>
## Implementation Decisions

### Form Layout & Flow
- Dedicated page at `/admin/create-user` with its own sidebar nav item
- Single white card with all fields vertically stacked: first name, last name, email, role dropdown, property multi-select
- No stepper/wizard — all fields visible at once

### Property Assignment UX
- Searchable dropdown with checkboxes for multi-select
- Selected properties shown as chips/tags below the input with remove (×) buttons
- All properties visible regardless of selected role — admin picks freely
- "Create new property" option at bottom of dropdown, expanding inline fields (name + street address) within the dropdown
- New property saved to Airtable immediately on "Add" click, then appears as a selectable option
- Build as a shared/reusable component for Phase 11 (Vacant Unit Entry) — supports both single-select and multi-select modes

### Admin Access Control
- Hardcoded email allowlist: `['heinz@readymation.com', 'jgiles@cdvsolutions.com']`
- Sidebar: "Create User" appears below main nav items, above logout, separated by dividers — visible only to admin emails
- Also appears in mobile bottom tab bar for admin users
- Non-admin navigating to `/admin/create-user` is silently redirected to their default role route
- No new role or metadata flag — just email check against the allowlist

### Password Handling
- Auto-generate a random password on user creation
- Display password once in the success card with a copy button
- Admin shares credentials with the new user manually

### Post-Creation Feedback
- Success: green banner/card showing email, role, and generated password with copy button
- Form resets after success, with "Create Another User" button
- Validation errors: inline red text below each invalid field, validated on submit
- API errors (e.g., email exists): red toast notification via existing Toaster component, form stays filled for retry

### Claude's Discretion
- Exact password generation algorithm and length
- Loading state during form submission
- Mobile layout adjustments for the form
- Exact divider styling in sidebar for admin section

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Requirements
- `.planning/REQUIREMENTS.md` — USER-01 through USER-04 define the acceptance criteria for this phase

### Auth & Role System
- `src/lib/types/auth.ts` — UserRole type, ROLE_ROUTES, ROLE_ALLOWED_ROUTES, AppMetadata interface (role + property_ids)
- `src/lib/supabase/server.ts` — Server-side Supabase client (admin API calls must use this)
- `src/lib/supabase/client.ts` — Client-side Supabase client (for reading current user)
- `src/app/actions/auth.ts` — Existing server actions pattern (login/logout)

### Layout & Navigation
- `src/components/layout/sidebar.tsx` — Sidebar with role-based nav items (NavItem interface with `roles` array)
- `src/components/layout/bottom-tab-bar.tsx` — Mobile navigation (same pattern as sidebar)
- `src/components/layout/app-shell.tsx` — App shell wrapping sidebar + content

### Properties & Data
- `src/lib/airtable/tables/properties.ts` — fetchProperties() with caching, Property type mapping
- `src/components/layout/property-selector.tsx` — Existing single-select property selector (reference for styling, but Phase 10 needs a new multi-select component)

### UI Components
- `src/components/ui/` — Existing design system: button, input, card, toaster, badge, skeleton

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `Button`, `Input`, `Card` components in `src/components/ui/` — use for form fields and layout
- `Toaster` component — use for API error notifications
- `PropertySelector` — reference for dropdown styling/behavior, but needs new multi-select variant
- `fetchProperties()` — already fetches from Airtable with caching; reuse for populating the dropdown

### Established Patterns
- Role-based nav filtering: `navItems.filter(item => !item.roles || item.roles.includes(role))` — extend for admin email check
- Server actions in `src/app/actions/` — follow same pattern for user creation action
- `use cache` with cache tags — existing caching pattern for Airtable data
- `app_metadata` stores `role` and `property_ids` — new user creation must set these via Supabase Admin API

### Integration Points
- Sidebar (`sidebar.tsx`) and BottomTabBar (`bottom-tab-bar.tsx`) need admin email check + new nav item
- New route: `src/app/(dashboard)/admin/create-user/page.tsx`
- New server action: `src/app/actions/admin.ts` (or similar) for Supabase Admin API `createUser`
- Supabase Admin API requires `SUPABASE_SERVICE_ROLE_KEY` — server-side only, never exposed to client

</code_context>

<specifics>
## Specific Ideas

- Success card layout matches the ASCII mockup: email, role, password with copy button, and "Create Another User" action
- Sidebar admin section visually separated with dividers above and below
- Inline property creation happens within the dropdown itself, not as a modal or separate section

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 10-admin-user-creation*
*Context gathered: 2026-03-15*
