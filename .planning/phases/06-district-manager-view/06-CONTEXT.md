# Phase 6: Role Rename (DM → RM) - Context

**Gathered:** 2026-03-14
**Status:** Ready for planning

<domain>
## Phase Boundary

Lightweight cleanup phase. The original "District Manager View" is no longer needed — the user decided that Regional Managers use the same PM view, just with more properties assigned. This phase renames the `dm` role to `rm` (Regional Manager), updates routing so RMs land on `/property`, removes the `/district` placeholder, and updates role labels throughout the app.

No new UI, no new components, no new data fetching. The existing PM view already handles multi-property users via `assignedProperties` and `PropertySelector`.

</domain>

<decisions>
## Implementation Decisions

### Role Structure (Redesigned)
- **No District Manager role** — removed entirely
- Three roles: `pm` (Property Manager), `rm` (Regional Manager), `exec` (Executive)
- Regional Manager = Property Manager with more properties assigned
- PMs report to one Regional Manager; RM is assigned to many properties
- Executive sees all properties (unchanged)

### Routing
- Both PMs and RMs land on `/property` — one route, one view
- `/district` route removed entirely (delete placeholder page)
- Middleware role routing updated: `rm` → `/property` (same as `pm`)
- `ROLE_ALLOWED_ROUTES` updated to remove `dm` entries, add `rm` with same `/property` access

### Role Display
- Sidebar/header shows "Regional Manager" for RM users via `ROLE_LABELS`
- `ROLE_LABELS` updated: remove `dm: 'District Manager'`, add `rm: 'Regional Manager'`
- The only visible difference between PM and RM is the role label — everything else is identical

### Supabase Metadata
- Existing DM users in Supabase need `role: 'dm'` changed to `role: 'rm'` in app_metadata
- This is a manual Supabase update (no admin panel exists)

### Claude's Discretion
- Whether to keep `/district` as a redirect to `/property` or delete outright
- Any cleanup of DM-specific references in comments or test files

</decisions>

<specifics>
## Specific Ideas

- "Keep it simple — Regional Manager is just a PM with more properties"
- The PM view's property dropdown already handles the multi-property use case naturally
- No portfolio overview cards or separate dashboard needed

</specifics>

<code_context>
## Existing Code Insights

### Files to Modify
- `src/lib/types/auth.ts`: `UserRole` type, `ROLE_ROUTES`, `ROLE_ALLOWED_ROUTES`, `ROLE_LABELS` — rename `dm` → `rm`
- `src/lib/supabase/middleware.ts`: Role routing logic references `dm`
- `src/components/layout/sidebar.tsx`: May reference DM-specific routes or labels
- `src/components/layout/app-shell.tsx`: Role display in header

### Files to Remove
- `src/app/(dashboard)/district/page.tsx`: Placeholder DM page (replace with redirect or delete)

### Established Patterns
- `ROLE_ROUTES` is single source of truth for role → route mapping (Phase 2 decision)
- Middleware reads role from `user.app_metadata.role` and routes accordingly

### No New Integration Points
- No new components, data fetching, or server actions needed

</code_context>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 06-district-manager-view*
*Context gathered: 2026-03-14*
