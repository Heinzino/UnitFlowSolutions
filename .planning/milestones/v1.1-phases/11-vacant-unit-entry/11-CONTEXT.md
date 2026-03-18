# Phase 11: Vacant Unit Entry - Context

**Gathered:** 2026-03-16
**Status:** Ready for planning

<domain>
## Phase Boundary

All roles (PM, RM, Executive) can add one or more vacant units to Airtable using a repeatable sub-form scoped to their accessible properties. Property Managers see only their assigned properties; RM and Executive see all. Inline new property creation is supported. This phase is create-only — editing/deleting units is out of scope.

</domain>

<decisions>
## Implementation Decisions

### Repeatable Sub-form UX
- Stacked card layout: each unit is a white card with unit number input + floor plan dropdown side by side, plus a remove (×) button
- Form starts with one empty unit card pre-filled (user fills it in, optionally adds more)
- "Add Another Unit" button below the cards to add rows
- No maximum unit limit per submission
- Inline red border validation on submit: highlight empty unit number or unselected floor plan with red borders and brief error text on the specific card
- Warn on duplicate unit numbers (yellow highlight) but allow submission

### Submission & Feedback
- Direct submit — no confirmation modal
- Submit button has dynamic label reflecting unit count: "Add 3 Vacant Units" (singular for 1, disabled when 0 valid units)
- Spinner on submit button with "Adding units..." text; form disabled during submission
- Success: green card showing property name, count of units created, and list of unit numbers + floor plans. "Add More Units" button resets unit rows but keeps property selected
- API errors: red toast notification via existing Toaster component, form stays filled for retry
- Partial failure: success card shows units that were created, plus a red section listing failed units with error messages. Form auto-populates with only the failed unit rows for retry
- No undo — v1.1 is create-only; mistakes corrected in Airtable directly
- Page title/heading: "Add Vacant Units"

### Navigation Placement
- "Add Vacant" nav item in main nav area (alongside Properties, Vendors, Executive)
- Visible to ALL roles — not in admin section
- DoorOpen icon from lucide-react
- Route: `/vacant`
- Also appears in mobile bottom tab bar

### Property Scoping & Selection
- Reuse PropertyMultiSelect component in `mode='single'` for property selection
- Street address auto-fills from the selected property
- Inline "Create new property" already built into PropertyMultiSelect — reuse as-is
- PM users: server-side filtering of properties by `app_metadata.property_ids` before sending to client
- RM/Executive: see all properties
- Street address required when creating a new property (per UNIT-08)
- New `addVacantUnits` server action (any authenticated user can call) — separate from admin-only `createProperty`

### Claude's Discretion
- Exact card spacing and responsive layout adjustments
- Loading skeleton for property list fetch
- Mobile layout stacking for unit cards
- Server action implementation details (batching Airtable calls, error aggregation)
- Whether to show street address as read-only text or a disabled input below property selector

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Requirements
- `.planning/REQUIREMENTS.md` — UNIT-01 through UNIT-08 define the acceptance criteria for this phase

### Reusable Components from Phase 10
- `src/components/ui/property-multi-select.tsx` — PropertyMultiSelect with single/multi mode, FLOOR_PLANS constant, NewPropertyData interface, onCreateProperty callback
- `src/app/actions/admin.ts` — createProperty server action (admin-only reference for Airtable record creation pattern + parseFloorPlan helper)

### Auth & Role System
- `src/lib/types/auth.ts` — UserRole type, ROLE_ROUTES, AppMetadata interface (role + property_ids)
- `src/lib/supabase/server.ts` — Server-side Supabase client (for reading current user's role/properties)

### Layout & Navigation
- `src/components/layout/sidebar.tsx` — Sidebar with navItems array, admin section pattern, DoorOpen icon to be added
- `src/components/layout/bottom-tab-bar.tsx` — Mobile navigation (same pattern as sidebar)

### Properties & Data
- `src/lib/airtable/tables/properties.ts` — fetchProperties() with caching, Property type mapping
- `src/lib/airtable/client.ts` — base() and rateLimiter for Airtable API calls
- `src/lib/airtable/cache-tags.ts` — CACHE_TAGS.properties for cache invalidation

### UI Components
- `src/components/ui/` — Existing design system: button, input, card, toaster, badge, skeleton

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `PropertyMultiSelect` (property-multi-select.tsx): Already supports `mode='single'`, searchable dropdown, inline property creation with unit number + floor plan fields, FLOOR_PLANS constant exported
- `createProperty` server action (admin.ts): Full Airtable record creation pattern with parseFloorPlan(), typecast:true, cache invalidation — use as template for the new addVacantUnits action
- `Toaster` component: For API error notifications
- `Card`, `Button`, `Input` components: For form layout

### Established Patterns
- Server actions in `src/app/actions/` with auth verification at the top
- `use cache` with cache tags for Airtable data
- `app_metadata.property_ids` stores property names as strings — use for PM filtering
- Sidebar navItems array with optional `roles` filter
- Admin section with email allowlist (ADMIN_EMAILS) — Phase 11 nav item does NOT use this pattern

### Integration Points
- Sidebar (`sidebar.tsx`): Add "Add Vacant" to navItems array (no roles filter — visible to all)
- BottomTabBar (`bottom-tab-bar.tsx`): Add matching tab
- New route: `src/app/(dashboard)/vacant/page.tsx`
- New server action: `src/app/actions/vacant.ts` — addVacantUnits (auth check: any logged-in user, PM property scoping)
- PropertyMultiSelect used in single mode with filtered property list
- Airtable Properties table: same record structure as createProperty (Property Name, Unit Number, Floor Plan, Bedrooms, Bathrooms, City, State, Street Address)

</code_context>

<specifics>
## Specific Ideas

- Success card layout matches the mockup: checkmark, count header, property name, bulleted unit list, "Add More Units" button
- Dynamic submit button: "Add 1 Vacant Unit" / "Add 3 Vacant Units" / disabled when no valid units
- Partial failure recovery: success card + form auto-populated with only failed rows
- "Add More Units" keeps the property selected (user is likely adding more to the same property)
- Duplicate unit number detection: yellow warning highlight, not a blocker

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 11-vacant-unit-entry*
*Context gathered: 2026-03-16*
