# Phase 11: Vacant Unit Entry - Research

**Researched:** 2026-03-16
**Domain:** Next.js 16 App Router — dynamic form UI, server actions, Airtable write, role-scoped data
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Repeatable Sub-form UX**
- Stacked card layout: each unit is a white card with unit number input + floor plan dropdown side by side, plus a remove (×) button
- Form starts with one empty unit card pre-filled (user fills it in, optionally adds more)
- "Add Another Unit" button below the cards to add rows
- No maximum unit limit per submission
- Inline red border validation on submit: highlight empty unit number or unselected floor plan with red borders and brief error text on the specific card
- Warn on duplicate unit numbers (yellow highlight) but allow submission

**Submission & Feedback**
- Direct submit — no confirmation modal
- Submit button has dynamic label reflecting unit count: "Add 3 Vacant Units" (singular for 1, disabled when 0 valid units)
- Spinner on submit button with "Adding units..." text; form disabled during submission
- Success: green card showing property name, count of units created, and list of unit numbers + floor plans. "Add More Units" button resets unit rows but keeps property selected
- API errors: red toast notification via existing Toaster component, form stays filled for retry
- Partial failure: success card shows units that were created, plus a red section listing failed units with error messages. Form auto-populates with only the failed unit rows for retry
- No undo — v1.1 is create-only; mistakes corrected in Airtable directly
- Page title/heading: "Add Vacant Units"

**Navigation Placement**
- "Add Vacant" nav item in main nav area (alongside Properties, Vendors, Executive)
- Visible to ALL roles — not in admin section
- DoorOpen icon from lucide-react
- Route: `/vacant`
- Also appears in mobile bottom tab bar

**Property Scoping & Selection**
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

### Deferred Ideas (OUT OF SCOPE)
None — discussion stayed within phase scope
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| UNIT-01 | User can access "Add Vacant Units" from the sidebar | Add DoorOpen nav item to sidebar.tsx navItems array and bottom-tab-bar.tsx tabItems array, no roles filter |
| UNIT-02 | User can select a property from a searchable dropdown (dynamic from Airtable) | Reuse PropertyMultiSelect in mode='single'; server component fetches + deduplicates properties via fetchProperties() |
| UNIT-03 | PM users only see properties they are assigned to in the dropdown | Server component reads app_metadata.property_ids from Supabase user; filter allProperties before building PropertyOption list |
| UNIT-04 | User can add multiple units via a repeatable sub-form (unit number + floor plan) | Client component manages UnitRow[] array in useState; dynamic add/remove rows |
| UNIT-05 | Floor plan is a dropdown with exact values from FLOOR_PLANS constant | Import FLOOR_PLANS from property-multi-select.tsx — values already match requirements exactly |
| UNIT-06 | Submitting creates records in Airtable Properties table with all required fields | addVacantUnits server action; per-unit Airtable create calls using same pattern as createProperty; parseFloorPlan helper reused |
| UNIT-07 | User can create a new property inline (with street address) if it doesn't exist | PropertyMultiSelect onCreateProperty callback; addVacantUnits action handles inline creation path |
| UNIT-08 | Street address is looked up from existing property; required only when creating a new property | PropertyMultiSelect returns PropertyOption with streetAddress; auto-fill for existing, required input for new |
</phase_requirements>

---

## Summary

Phase 11 is almost entirely additive — no schema changes, no new libraries, no new design patterns. The project already has every building block needed: PropertyMultiSelect with single-mode and inline creation, the createProperty Airtable write pattern with parseFloorPlan, the server action auth guard pattern, and the success card / toast error UI pattern from Phase 10. The key new work is (1) a dynamic list of unit cards managed in client state, (2) a new `addVacantUnits` server action that accepts an array of units and creates one Airtable record per unit, and (3) wiring navigation into sidebar and bottom-tab-bar for all roles.

The most complex piece is the partial-failure UX: when some Airtable creates succeed and others fail, the client must show a hybrid success/error card and re-populate the form with only the failed rows. This requires the server action to return a structured result (created: [], failed: [{ unit, error }]) rather than a simple success/error shape.

PM property scoping is straightforward: the server component reads `user.app_metadata.property_ids` (an array of property name strings) and pre-filters allProperties before passing to the client, so the client never receives out-of-scope properties.

**Primary recommendation:** Implement as four tasks — (1) navigation, (2) server action, (3) page server component, (4) client form component with dynamic rows.

---

## Standard Stack

All libraries are already installed. No new dependencies required.

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| next | 16.1.6 | App Router, server components, server actions | Project standard |
| react | 19.2.3 | Client component hooks (useState, useEffect) | Project standard |
| airtable | 0.12.2 | Properties table write | Same pattern as Phase 10 |
| @supabase/ssr | 0.9.0 | Server-side auth / user role reading | Same pattern as Phase 10 |
| lucide-react | 0.577.0 | DoorOpen icon for nav | Project standard icon library |
| sonner | 2.0.7 | Toast notifications for API errors | Already used in CreateUserForm |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| clsx | 2.1.1 | Conditional class composition | Any conditional Tailwind classes |
| server-only | 0.0.1 | Enforce server action module boundary | All server action files |

### Alternatives Considered
None — all decisions are locked.

**Installation:** No new packages needed.

---

## Architecture Patterns

### New Files Required
```
src/
├── app/
│   ├── (dashboard)/
│   │   └── vacant/
│   │       └── page.tsx                  # Server component: auth check, property fetch, PM filter
│   └── actions/
│       └── vacant.ts                     # addVacantUnits server action
└── components/
    └── layout/
        ├── sidebar.tsx                   # Add DoorOpen nav item (edit existing)
        └── bottom-tab-bar.tsx            # Add DoorOpen tab item (edit existing)
```

The client form is co-located in the same route folder following Phase 10's pattern:
```
src/app/(dashboard)/vacant/
├── page.tsx                              # Server component
└── add-vacant-form.tsx                  # 'use client' form component
```

### Pattern 1: Server Component Page with Auth Check and Role-Scoped Data

Mirrors `create-user/page.tsx` exactly. Auth guard redirects non-authenticated users. PM role filter applied before rendering.

```typescript
// src/app/(dashboard)/vacant/page.tsx
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { ROLE_ROUTES } from '@/lib/types/auth'
import type { UserRole } from '@/lib/types/auth'
import { fetchProperties } from '@/lib/airtable/tables/properties'
import type { PropertyOption } from '@/components/ui/property-multi-select'
import { AddVacantForm } from './add-vacant-form'

export default async function VacantPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect(ROLE_ROUTES['pm'])
  }

  const role = (user.app_metadata?.role as UserRole) ?? 'pm'
  const assignedPropertyIds: string[] = user.app_metadata?.property_ids ?? []

  // Fetch all properties and deduplicate by name (table has one record per unit)
  const allProperties = await fetchProperties()
  const uniqueMap = new Map<string, PropertyOption>()
  for (const p of allProperties) {
    if (!uniqueMap.has(p.propertyName)) {
      uniqueMap.set(p.propertyName, { name: p.propertyName, streetAddress: p.streetAddress })
    }
  }

  // PM users see only their assigned properties
  const properties: PropertyOption[] = Array.from(uniqueMap.values())
    .filter((p) => role !== 'pm' || assignedPropertyIds.includes(p.name))
    .sort((a, b) => a.name.localeCompare(b.name))

  return (
    <div className="max-w-2xl mx-auto py-8 px-4">
      <h1 className="text-2xl font-heading font-bold text-white mb-6">Add Vacant Units</h1>
      <AddVacantForm properties={properties} />
    </div>
  )
}
```

### Pattern 2: Dynamic Row State Management

The repeatable sub-form is a client component managing an array of row objects. Each row has a stable id for React keys.

```typescript
// Inside add-vacant-form.tsx
interface UnitRow {
  id: string          // stable key for React (crypto.randomUUID())
  unitNumber: string
  floorPlan: string
  // Validation state
  unitNumberError: boolean
  floorPlanError: boolean
  duplicateWarning: boolean
}

const [rows, setRows] = useState<UnitRow[]>([emptyRow()])

function emptyRow(): UnitRow {
  return { id: crypto.randomUUID(), unitNumber: '', floorPlan: '', unitNumberError: false, floorPlanError: false, duplicateWarning: false }
}

function addRow() {
  setRows(prev => [...prev, emptyRow()])
}

function removeRow(id: string) {
  setRows(prev => prev.filter(r => r.id !== id))
}

function updateRow(id: string, field: 'unitNumber' | 'floorPlan', value: string) {
  setRows(prev => prev.map(r => r.id === id ? { ...r, [field]: value } : r))
}
```

### Pattern 3: addVacantUnits Server Action with Structured Return

The action accepts one property (name + streetAddress) and an array of unit entries. It creates records sequentially (one rateLimiter.acquire() per call), collects results, and returns a structured shape for partial-failure handling.

```typescript
// src/app/actions/vacant.ts
'use server'
import 'server-only'
import { createClient } from '@/lib/supabase/server'
import { base, rateLimiter } from '@/lib/airtable/client'
import { CACHE_TAGS } from '@/lib/airtable/cache-tags'
import { revalidateTag } from 'next/cache'

interface UnitInput {
  unitNumber: string
  floorPlan: string
}

interface UnitResult {
  unitNumber: string
  floorPlan: string
  error?: string
}

interface AddVacantUnitsResult {
  created: UnitResult[]
  failed: UnitResult[]
}

export async function addVacantUnits(
  propertyName: string,
  streetAddress: string,
  units: UnitInput[]
): Promise<AddVacantUnitsResult | { error: string }> {
  // 1. Auth check — any logged-in user may call
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  // 2. Create one Airtable record per unit
  const created: UnitResult[] = []
  const failed: UnitResult[] = []

  for (const unit of units) {
    const { bedrooms, bathrooms } = parseFloorPlan(unit.floorPlan)
    try {
      await rateLimiter.acquire()
      await base('Properties').create(
        {
          'Property Name': propertyName,
          'Street Address': streetAddress,
          'Unit Number': unit.unitNumber,
          'Floor Plan': unit.floorPlan,
          'Bedrooms': bedrooms,
          'Bathrooms': bathrooms,
          'City': 'Columbia',
          'State': 'SC',
        },
        { typecast: true }
      )
      created.push({ unitNumber: unit.unitNumber, floorPlan: unit.floorPlan })
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      failed.push({ unitNumber: unit.unitNumber, floorPlan: unit.floorPlan, error: message })
    }
  }

  // 3. Invalidate cache only if at least one unit was created
  if (created.length > 0) {
    revalidateTag(CACHE_TAGS.properties)
  }

  return { created, failed }
}
```

### Pattern 4: Submit Validation Before Calling Server Action

Unlike Phase 10 forms (which use `useActionState` + FormData), this form calls the server action directly as an async function because it passes a typed array (not FormData). Client-side validation runs before the call.

```typescript
// Inside add-vacant-form.tsx
async function handleSubmit() {
  // 1. Validate: property selected
  if (!selectedProperty) { setPropertyError(true); return }

  // 2. Validate each row
  let hasErrors = false
  const unitNumbers = rows.map(r => r.unitNumber.trim())
  const validatedRows = rows.map(r => {
    const unitNumberError = !r.unitNumber.trim()
    const floorPlanError = !r.floorPlan
    const count = unitNumbers.filter(n => n === r.unitNumber.trim() && n !== '').length
    const duplicateWarning = count > 1 && r.unitNumber.trim() !== ''
    if (unitNumberError || floorPlanError) hasErrors = true
    return { ...r, unitNumberError, floorPlanError, duplicateWarning }
  })
  setRows(validatedRows)
  if (hasErrors) return

  // 3. Call server action
  setSubmitting(true)
  const result = await addVacantUnits(
    selectedProperty.name,
    selectedProperty.streetAddress,
    rows.map(r => ({ unitNumber: r.unitNumber.trim(), floorPlan: r.floorPlan }))
  )
  setSubmitting(false)

  if ('error' in result) {
    toast.error(result.error)
    return
  }

  // 4. Handle result
  if (result.failed.length === 0) {
    // Full success
    setSuccessData({ property: selectedProperty.name, created: result.created })
    setShowSuccess(true)
  } else if (result.created.length > 0) {
    // Partial success
    setSuccessData({ property: selectedProperty.name, created: result.created, failed: result.failed })
    setShowSuccess(true)
    // Re-populate rows with only failed units for retry
    setRows(result.failed.map(f => ({ ...emptyRow(), unitNumber: f.unitNumber, floorPlan: f.floorPlan })))
    // Don't clear selectedProperty
  } else {
    // All failed — toast the first error
    toast.error(result.failed[0]?.error ?? 'All units failed to create')
  }
}
```

### Pattern 5: Navigation — Add to navItems (no roles filter)

The "Add Vacant" item goes into the main `navItems` array in both sidebar.tsx and bottom-tab-bar.tsx WITHOUT a `roles` filter, making it visible to all authenticated users.

```typescript
// sidebar.tsx navItems array — add this entry
{ icon: DoorOpen, label: 'Add Vacant', href: '/vacant' },
// Import: import { ..., DoorOpen } from 'lucide-react'
```

### Pattern 6: Submit Button Dynamic Label

```typescript
const validUnitCount = rows.filter(r => r.unitNumber.trim() && r.floorPlan).length
const buttonLabel = submitting
  ? 'Adding units...'
  : validUnitCount === 0
    ? 'Add Vacant Units'
    : validUnitCount === 1
      ? 'Add 1 Vacant Unit'
      : `Add ${validUnitCount} Vacant Units`
const buttonDisabled = submitting || validUnitCount === 0
```

### Anti-Patterns to Avoid

- **Using `useActionState` with FormData for array payloads:** FormData serializes arrays as repeated string entries — messy for dynamic row arrays. Call the server action directly as an async function instead.
- **Single Airtable batch create for multiple units:** The `base.create(records[])` batch API exists but complicates per-unit error isolation. Sequential individual creates allow per-unit error tracking and partial failure reporting.
- **Blocking on all-or-nothing:** If one unit fails, the others should still be created. The loop continues regardless of individual failures.
- **Forgetting rateLimiter.acquire() per Airtable call:** The rate limiter must be called before each individual create, not once before the loop.
- **Adding `/vacant` to ROLE_ALLOWED_ROUTES in auth.ts:** Middleware currently redirects based on ROLE_ROUTES but the existing allowed routes list is used elsewhere; the `/vacant` route must be added to ROLE_ALLOWED_ROUTES for all roles or middleware will redirect users away from it.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Property dropdown with search + inline create | Custom select | PropertyMultiSelect (already exists) | Already has single mode, search, inline creation, full test coverage |
| Floor plan parsing | Custom regex | parseFloorPlan() from admin.ts | Already tested, handles all FLOOR_PLANS values including Studio/Loft edge case |
| Toast notifications | Custom alert component | sonner `toast.error()` | Already wired via Toaster in layout |
| Auth check in server action | Manual cookie reading | `createClient()` from supabase/server | Already the project pattern, handles all cookie edge cases |
| Cache invalidation | Manual | `revalidateTag(CACHE_TAGS.properties)` | Same tag used by fetchProperties() cache |
| Stable row keys | index-based keys | `crypto.randomUUID()` | Index keys break React reconciliation when rows are removed mid-list |

**Key insight:** This phase's "new" work is almost entirely wiring existing pieces together. The only genuinely new code is the dynamic row array state management and the structured partial-failure result handling.

---

## Common Pitfalls

### Pitfall 1: ROLE_ALLOWED_ROUTES Not Updated for /vacant
**What goes wrong:** Middleware redirects PM/RM users away from `/vacant` because the route is not in their allowed list.
**Why it happens:** `ROLE_ALLOWED_ROUTES` in `auth.ts` controls which routes each role may access; `/vacant` is not currently listed for any role.
**How to avoid:** Add `/vacant` to the allowed routes for all three roles (`pm`, `rm`, `exec`) in `ROLE_ALLOWED_ROUTES`.
**Warning signs:** Users are redirected to `/property` immediately after navigating to `/vacant`.

### Pitfall 2: Partial Failure UI State Conflict
**What goes wrong:** After partial failure, the success card shows AND the form shows failed rows, but selecting "Add More Units" clears the failed rows instead of keeping them for retry.
**Why it happens:** The "Add More Units" handler resets rows to one empty row, but partial failure requires pre-populated failed rows.
**How to avoid:** On partial failure, show the success card (with failed section), set rows to failed unit rows, and do NOT clear them when success card is dismissed. The "Add More Units" button on the success card should reset to one empty row ONLY when all units succeeded.

### Pitfall 3: PM Property Scoping — property_ids Array Contains Names, Not IDs
**What goes wrong:** Filtering by IDs when property_ids contains property name strings.
**Why it happens:** The v1.0 auth decision stored property names in `app_metadata.property_ids` to match the original auth pattern (confirmed in STATE.md: "property_ids in app_metadata stores property names (strings)").
**How to avoid:** Filter `allProperties` using `assignedPropertyIds.includes(p.propertyName)` — compare names to names.

### Pitfall 4: Street Address Not Available After Inline Property Creation
**What goes wrong:** When a user creates a new property inline, the `createProperty` server action is still admin-only. The vacant form calls `addVacantUnits` directly, but the inline creation in PropertyMultiSelect calls `onCreateProperty` callback — which must call a non-admin-gated server action.
**Why it happens:** `createProperty` in `admin.ts` checks for ADMIN_EMAILS. PM/RM/exec users who try to create a new property inline would get Unauthorized.
**How to avoid:** The `addVacantUnits` action must handle inline property creation itself (it already receives `streetAddress`), OR a separate `createPropertyPublic` action (auth: any logged-in user) must be used for the `onCreateProperty` callback. The cleanest approach: the `onCreateProperty` callback in the vacant form calls `addVacantUnits` with a single unit derived from the PropertyMultiSelect's inline form fields, which is already auth-gated for any user. However the PropertyMultiSelect's inline create already calls `onCreateProperty` which returns a `PropertyOption` — the callback is provided by the vacant form, so it can call whatever action is appropriate. Use the `createProperty` function signature as a template but extract `parseFloorPlan` + Airtable write into a new `addVacantUnits` action that is NOT admin-gated.

### Pitfall 5: Submit Button "Disabled When 0 Valid Units" vs Row Count
**What goes wrong:** Button becomes disabled when all rows have missing unit number or floor plan but the user intended to only submit one fully-filled row.
**Why it happens:** `validUnitCount` counts only fully-filled rows (both fields present), not total rows.
**How to avoid:** The button should be disabled when `validUnitCount === 0` AND not `submitting`. If the user has partially-filled rows, validation on submit will highlight them. Do NOT prevent submission; let validation run and show per-card errors.

### Pitfall 6: rateLimiter Not Called Per Unit in Sequential Loop
**What goes wrong:** Airtable rate limit errors appear for submissions with multiple units.
**Why it happens:** `rateLimiter.acquire()` is called once before the loop instead of once per iteration.
**How to avoid:** Call `await rateLimiter.acquire()` inside the loop, before each `base('Properties').create()` call, matching the pattern in `createProperty`.

---

## Code Examples

### Floor Plan Parsing (reuse from admin.ts)
```typescript
// Source: src/app/actions/admin.ts — parseFloorPlan()
function parseFloorPlan(floorPlan: string): { bedrooms: number; bathrooms: number } {
  if (floorPlan === 'Studio / Loft') return { bedrooms: 0, bathrooms: 1 }
  const match = floorPlan.match(/^(\d+)br\s+(\d+(?:\.\d+)?)ba$/)
  if (!match) return { bedrooms: 0, bathrooms: 0 }
  return { bedrooms: Number(match[1]), bathrooms: Number(match[2]) }
}
// Copy this function into src/app/actions/vacant.ts — do not import from admin.ts
// (admin.ts is already gated with ADMIN_EMAILS check; vacant.ts is separate)
```

### Airtable Record Creation Pattern (from admin.ts)
```typescript
// Source: src/app/actions/admin.ts — createProperty()
await rateLimiter.acquire()
await base('Properties').create(
  {
    'Property Name': name,
    'Street Address': streetAddress,
    'Unit Number': unitNumber,
    'Floor Plan': floorPlan,
    'Bedrooms': bedrooms,
    'Bathrooms': bathrooms,
    'City': 'Columbia',
    'State': 'SC',
  },
  { typecast: true },
)
```

### PropertyMultiSelect in single mode (from create-user-form.tsx)
```typescript
// Source: src/app/(dashboard)/admin/create-user/create-user-form.tsx
<PropertyMultiSelect
  properties={availableProperties}
  selected={selectedProperties}
  onChange={setSelectedProperties}
  mode="single"           // ← single mode for vacant form
  onCreateProperty={handleCreateProperty}
  placeholder="Select a property..."
/>
```

### ROLE_ALLOWED_ROUTES update required
```typescript
// Source: src/lib/types/auth.ts — add /vacant to all roles
export const ROLE_ALLOWED_ROUTES: Partial<Record<UserRole, string[]>> = {
  exec: ['/executive', '/property', '/vendors', '/vacant'],
  rm: ['/property', '/vendors', '/vacant'],
  pm: ['/property', '/vendors', '/vacant'],
}
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| FormData + useActionState | Direct async server action call with typed args | Phase 11 specific | Needed for array payloads; simpler types |
| Admin-gated createProperty | Any-auth addVacantUnits | Phase 11 | All roles can add units; PM scoping is at the data-fetch level |

---

## Open Questions

1. **Should `addVacantUnits` also handle the inline "create new property" path, or is a separate action needed?**
   - What we know: PropertyMultiSelect's `onCreateProperty` callback is async and returns `PropertyOption`. In the vacant form, this callback can call any server action — it does not have to be `createProperty` from admin.ts.
   - What's unclear: The inline creation in PropertyMultiSelect asks for unit number + floor plan alongside the property name/address. Does the vacant form's `onCreateProperty` callback create the Airtable record immediately (using the first unit from the inline form), or does it only register the property name/address and leave the unit for the main form?
   - Recommendation: The `onCreateProperty` callback should create the first Airtable record immediately (same as the admin flow) using `addVacantUnits` with the single unit from the inline form. This ensures the new property exists in Airtable. After the callback resolves, the main form's rows represent additional units for the same property. The planner should clarify this in the plan.

2. **Does the middleware need updating for /vacant route?**
   - What we know: `ROLE_ALLOWED_ROUTES` currently does not include `/vacant` for any role. The middleware likely uses this to validate access.
   - What's unclear: Whether middleware actively blocks unlisted routes or only redirects to the role's home route.
   - Recommendation: Add `/vacant` to ROLE_ALLOWED_ROUTES for all three roles as a safety measure. This is a one-line change per role.

---

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest 4.0.18 + React Testing Library 16.3.2 |
| Config file | `vitest.config.ts` |
| Quick run command | `npx vitest run --reporter=verbose src/app/actions/vacant.test.ts` |
| Full suite command | `npm test` |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| UNIT-01 | DoorOpen nav item rendered in sidebar for all roles | unit | `npx vitest run src/components/layout/__tests__/layout.test.tsx` | ✅ (extend existing) |
| UNIT-02 | PropertyMultiSelect rendered in single mode with property list | unit | `npx vitest run src/app/(dashboard)/vacant/__tests__/add-vacant-form.test.tsx` | ❌ Wave 0 |
| UNIT-03 | PM user receives only assigned properties in prop list | unit | `npx vitest run src/app/actions/vacant.test.ts` (server action); page logic tested via props | ❌ Wave 0 |
| UNIT-04 | Add row / remove row / row state updates correctly | unit | `npx vitest run src/app/(dashboard)/vacant/__tests__/add-vacant-form.test.tsx` | ❌ Wave 0 |
| UNIT-05 | Floor plan dropdown renders all 7 FLOOR_PLANS values | unit | `npx vitest run src/app/(dashboard)/vacant/__tests__/add-vacant-form.test.tsx` | ❌ Wave 0 |
| UNIT-06 | addVacantUnits calls base('Properties').create with all required fields | unit | `npx vitest run src/app/actions/vacant.test.ts` | ❌ Wave 0 |
| UNIT-07 | onCreateProperty callback wired and triggers inline creation | unit | `npx vitest run src/app/(dashboard)/vacant/__tests__/add-vacant-form.test.tsx` | ❌ Wave 0 |
| UNIT-08 | Street address auto-filled from existing property; required for new | unit | `npx vitest run src/app/(dashboard)/vacant/__tests__/add-vacant-form.test.tsx` | ❌ Wave 0 |

### Sampling Rate
- **Per task commit:** `npx vitest run --reporter=verbose src/app/actions/vacant.test.ts`
- **Per wave merge:** `npm test`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `src/app/actions/vacant.test.ts` — covers UNIT-03, UNIT-06; mock pattern matches admin.test.ts
- [ ] `src/app/(dashboard)/vacant/__tests__/add-vacant-form.test.tsx` — covers UNIT-02, UNIT-04, UNIT-05, UNIT-07, UNIT-08

*(UNIT-01 extends the existing `src/components/layout/__tests__/layout.test.tsx`)*

---

## Sources

### Primary (HIGH confidence)
- Direct code inspection of `src/app/actions/admin.ts` — createProperty pattern, parseFloorPlan, rateLimiter usage, Airtable field names
- Direct code inspection of `src/components/ui/property-multi-select.tsx` — PropertyMultiSelect interface, FLOOR_PLANS constant, mode='single' behavior, NewPropertyData interface
- Direct code inspection of `src/app/(dashboard)/admin/create-user/page.tsx` — server component auth + data fetch pattern
- Direct code inspection of `src/app/(dashboard)/admin/create-user/create-user-form.tsx` — useActionState, toast, success card, clientErrors patterns
- Direct code inspection of `src/components/layout/sidebar.tsx` and `bottom-tab-bar.tsx` — navItems array structure, roles filter pattern, ADMIN_EMAILS guard
- Direct code inspection of `src/lib/types/auth.ts` — ROLE_ALLOWED_ROUTES, AppMetadata interface, property_ids is string[]
- Direct code inspection of `src/lib/airtable/tables/properties.ts` — fetchProperties, cacheLife, cacheTag usage
- Direct code inspection of `src/lib/airtable/cache-tags.ts` — CACHE_TAGS.properties
- Direct code inspection of `src/app/actions/admin.test.ts` — vi.hoisted(), mock patterns for Airtable + Supabase in Vitest
- Direct code inspection of `package.json` — confirmed all required libraries already installed, no new dependencies needed
- Direct code inspection of `.planning/config.json` — nyquist_validation: true

### Secondary (MEDIUM confidence)
- `.planning/phases/11-vacant-unit-entry/11-CONTEXT.md` — user-locked implementation decisions
- `.planning/STATE.md` — confirmed property_ids stores names (strings), not Supabase UUIDs

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all libraries already installed and in use
- Architecture: HIGH — all patterns directly verified from existing source code
- Pitfalls: HIGH for ROLE_ALLOWED_ROUTES and property_ids naming (verified from source); MEDIUM for partial failure UX edge cases (logic-based)
- Test patterns: HIGH — existing admin.test.ts provides exact mock template

**Research date:** 2026-03-16
**Valid until:** 2026-04-16 (stable stack — no fast-moving dependencies)
