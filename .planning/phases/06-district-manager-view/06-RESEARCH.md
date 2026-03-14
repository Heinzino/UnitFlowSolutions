# Phase 6: Role Rename (DM → RM) - Research

**Researched:** 2026-03-14
**Domain:** TypeScript type refactor, Next.js routing, role-based access control cleanup
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- No District Manager role — removed entirely
- Three roles: `pm` (Property Manager), `rm` (Regional Manager), `exec` (Executive)
- Regional Manager = Property Manager with more properties assigned; PMs report to one RM; RM is assigned to many properties
- Executive sees all properties (unchanged)
- Both PMs and RMs land on `/property` — one route, one view
- `/district` route removed entirely (delete placeholder page)
- Middleware role routing updated: `rm` → `/property` (same as `pm`)
- `ROLE_ALLOWED_ROUTES` updated to remove `dm` entries, add `rm` with same `/property` access
- Sidebar/header shows "Regional Manager" for RM users via `ROLE_LABELS`
- `ROLE_LABELS` updated: remove `dm: 'District Manager'`, add `rm: 'Regional Manager'`
- Existing DM users in Supabase need `role: 'dm'` changed to `role: 'rm'` in app_metadata (manual update)
- No new UI, no new components, no new data fetching

### Claude's Discretion
- Whether to keep `/district` as a redirect to `/property` or delete outright
- Any cleanup of DM-specific references in comments or test files

### Deferred Ideas (OUT OF SCOPE)
None — discussion stayed within phase scope
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| DM-01 | Portfolio overview with one card per assigned property showing: property name, active turns, completion rate, pending approvals | SUPERSEDED by CONTEXT.md: no portfolio overview needed — RM uses PM view directly. Requirement is satisfied by RM landing on `/property` with existing PM components. |
| DM-02 | KPI row: Turn completion rate (gauge), Jobs pending approval, Overdue items (alert styling if > 0) | SUPERSEDED: existing PM KPI row already satisfies this for RM users via shared `/property` route. |
| DM-03 | Click property card to drill-down into that property's data (reuses PM turn list and KPI components) | SUPERSEDED: PropertySelector dropdown already provides this for multi-property users. |
| DM-04 | Loading skeleton states | SUPERSEDED: PM view already has skeleton states (PM-09 complete). |
</phase_requirements>

> **Note on DM-01 through DM-04:** All four requirements are satisfied by the existing PM view. The CONTEXT.md redesign decision makes these requirements complete-by-proxy once the `rm` role is routed to `/property`. The implementation work is: rename `dm` → `rm` in the type system and remove the `/district` dead code.

---

## Summary

Phase 6 is a lightweight type-system and routing cleanup. The original "District Manager View" scope (DM-01 through DM-04) has been redesigned: Regional Managers reuse the existing PM view (`/property`) without any new UI. The only work is renaming the `dm` role literal to `rm` in the TypeScript type union and all its consumers, updating routing constants so `rm` maps to `/property`, and deleting (or redirecting) the `/district` placeholder page.

The full scope of `dm` references has been audited. There are exactly five files containing `dm` or `district` references that need changes: `src/lib/types/auth.ts` (the source of truth), `src/components/layout/user-header.tsx` (one hardcoded `role === "dm"` check), and `src/app/(dashboard)/district/page.tsx` (the placeholder to delete or redirect). The middleware (`src/lib/supabase/middleware.ts`) consumes `ROLE_ROUTES` and `ROLE_ALLOWED_ROUTES` from `auth.ts` dynamically — it has no hardcoded `dm` strings and will automatically pick up the rename.

**Primary recommendation:** Update `auth.ts` first (single source of truth), then fix `user-header.tsx`, then delete/redirect `district/page.tsx`. Update tests that reference `dm` in assertions. Manual Supabase metadata update is a deployment step, not a code step.

---

## Standard Stack

This phase uses only existing project stack — no new libraries required.

### Core (already installed)
| Library | Version | Purpose | Why Used |
|---------|---------|---------|----------|
| TypeScript | project-native | Type union rename | Compile-time enforcement of valid roles |
| Next.js | project-native | Route group deletion | App Router file-system routing |
| `@supabase/ssr` | project-native | Auth metadata | Role stored in `user.app_metadata.role` |

### No New Dependencies
This phase adds no npm packages.

---

## Architecture Patterns

### Pattern 1: Single Source of Truth — `auth.ts`
**What:** All role constants (`UserRole` union, `ROLE_ROUTES`, `ROLE_ALLOWED_ROUTES`, `ROLE_LABELS`) live in `src/lib/types/auth.ts`. Middleware and components import from this file.
**When to use:** Always — never hardcode role strings outside this file.
**Current state:**
```typescript
// src/lib/types/auth.ts  (BEFORE)
export type UserRole = 'pm' | 'dm' | 'exec'

export const ROLE_ROUTES: Record<UserRole, string> = {
  pm: '/property',
  dm: '/district',   // <-- rename to rm: '/property'
  exec: '/executive',
}

export const ROLE_ALLOWED_ROUTES: Partial<Record<UserRole, string[]>> = {
  exec: ['/executive', '/property'],
  dm: ['/district', '/property'],  // <-- rename to rm: ['/property']
}

export const ROLE_LABELS: Record<UserRole, string> = {
  pm: 'Property Manager',
  dm: 'District Manager',  // <-- rename to rm: 'Regional Manager'
  exec: 'Executive',
}
```
**Target state:**
```typescript
// src/lib/types/auth.ts  (AFTER)
export type UserRole = 'pm' | 'rm' | 'exec'

export const ROLE_ROUTES: Record<UserRole, string> = {
  pm: '/property',
  rm: '/property',
  exec: '/executive',
}

export const ROLE_ALLOWED_ROUTES: Partial<Record<UserRole, string[]>> = {
  exec: ['/executive', '/property'],
  rm: ['/property'],
}

export const ROLE_LABELS: Record<UserRole, string> = {
  pm: 'Property Manager',
  rm: 'Regional Manager',
  exec: 'Executive',
}
```

### Pattern 2: user-header.tsx Hardcoded Role Check
**What:** `user-header.tsx` line 24 has a hardcoded `role === "dm"` check that controls whether the header shows "All Properties" instead of the property selector.
**Problem:** RM users have multiple assigned properties and should see the `PropertySelector` dropdown, not "All Properties". The "All Properties" label is exec-only.
**Target state:** Change `role === "exec" || role === "dm"` to `role === "exec"` only. RM users with multiple properties will then correctly fall through to the `PropertySelectorWrapper` branch.
```typescript
// user-header.tsx  (AFTER)
if (role === "exec") {
  propertyContext = (
    <span className="text-sm text-white/70">All Properties</span>
  );
}
```

### Pattern 3: /district Route Disposal
**What:** `src/app/(dashboard)/district/page.tsx` is a placeholder page that references "District Manager Dashboard".
**Decision:** Claude's discretion — redirect or delete.
**Recommendation:** Replace the page with a redirect to `/property`. This is safer than deletion because any bookmarked or cached `/district` URL will gracefully recover rather than 404. Use Next.js `redirect()` from `next/navigation`:
```typescript
// src/app/(dashboard)/district/page.tsx  (AFTER)
import { redirect } from 'next/navigation'

export default function DistrictPage() {
  redirect('/property')
}
```
The middleware `ROLE_ALLOWED_ROUTES` for `rm` no longer includes `/district`, so middleware will redirect `rm` users away from `/district` before they even hit the page component. The page-level redirect is a belt-and-suspenders for any residual direct URL access.

### Anti-Patterns to Avoid
- **Don't delete `/district` outright without a redirect:** Bookmarked URLs and Supabase redirect configurations might still point there. A redirect is zero-cost insurance.
- **Don't change middleware.ts directly:** It has no hardcoded `dm` strings — it reads from `ROLE_ROUTES` and `ROLE_ALLOWED_ROUTES` dynamically. Editing it for this phase is unnecessary and risks breaking working auth logic.
- **Don't leave `rm` out of `ROLE_ALLOWED_ROUTES`:** The middleware logic checks `allowedRoutes` first, falling back to `ownRoute`. If `rm` has no entry in `ROLE_ALLOWED_ROUTES`, it defaults to checking `ownRoute` (`/property`), which is functionally correct — but explicitly listing it is clearer and matches how `exec` is defined.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead |
|---------|-------------|-------------|
| RM property selector in header | Custom property list UI | Existing `PropertySelectorWrapper` + `PropertySelector` — already handles 1 to N properties |
| Multi-property data filtering for RM | New data layer | Existing `assignedProperties` filtering in PM view — RM users get same filtering by having multiple entries in `property_ids` |
| Role guard for RM routes | Custom route guard | Existing `ROLE_ALLOWED_ROUTES` mechanism in middleware — just add the `rm` entry |

---

## Common Pitfalls

### Pitfall 1: TypeScript Compile Errors After Rename
**What goes wrong:** Renaming `'dm'` to `'rm'` in the `UserRole` union causes compile errors anywhere the literal `'dm'` is used outside of `auth.ts`.
**Why it happens:** TypeScript narrows string literals; any `=== 'dm'` or `as 'dm'` will fail to compile.
**How to avoid:** Run `tsc --noEmit` after updating `auth.ts` to catch all reference sites. The audit found: `user-header.tsx` line 24 is the only hardcoded `'dm'` string outside `auth.ts`.
**Warning signs:** Build errors mentioning `'dm'` is not assignable to `UserRole`.

### Pitfall 2: RM Users See "All Properties" Instead of Dropdown
**What goes wrong:** Forgetting to update `user-header.tsx` — RM users get the exec-style "All Properties" label even though they have specific property assignments.
**Why it happens:** The old `dm` role was treated like `exec` in the header (both showed "All Properties" for simplicity).
**How to avoid:** The `user-header.tsx` change is mandatory — remove `|| role === "dm"` from the exec branch.

### Pitfall 3: Supabase Users Locked Out
**What goes wrong:** Existing Supabase users with `role: 'dm'` in `app_metadata` will fail middleware routing because `'dm'` is no longer a valid `UserRole`. The middleware falls back to `ownRoute ?? '/'` when role is unrecognized — they get redirected to `/` which then redirects to `/` infinitely (no ownRoute found).
**Why it happens:** Supabase metadata is not updated atomically with the code deploy.
**How to avoid:** Update Supabase `app_metadata` for all DM users to `role: 'rm'` **before or immediately after** deploying this code change. This is a manual Supabase admin operation (no admin UI exists in this app).
**Warning signs:** DM users unable to log in or getting redirect loops after deploy.

### Pitfall 4: Test Assertions Referencing 'dm'
**What goes wrong:** Tests that assert on role values using the literal `'dm'` will fail after the rename.
**Why it happens:** Tests may construct mock users with `role: 'dm'` in app_metadata.
**How to avoid:** Search test files for `'dm'` and update to `'rm'`. The middleware test (`src/middleware.test.ts`) only tests `config.matcher` — no role literals. No other test files appear to reference `dm` based on the audit.

---

## Code Examples

### Verified: Middleware role routing (no changes needed)
```typescript
// src/lib/supabase/middleware.ts — reads ROLE_ROUTES dynamically, no dm hardcoding
const dest = (role && ROLE_ROUTES[role as keyof typeof ROLE_ROUTES]) ?? '/property'
```
This line automatically handles `rm` once `auth.ts` is updated.

### Verified: Middleware access enforcement (no changes needed)
```typescript
// Middleware checks ROLE_ALLOWED_ROUTES dynamically
const allowedRoutes = role ? ROLE_ALLOWED_ROUTES[role as keyof typeof ROLE_ALLOWED_ROUTES] : undefined
const isAllowed = allowedRoutes?.some((r) => path.startsWith(r)) ?? (ownRoute ? path.startsWith(ownRoute) : false)
```
Adding `rm: ['/property']` to `ROLE_ALLOWED_ROUTES` in `auth.ts` is sufficient.

### Next.js redirect in page component
```typescript
// Pattern used throughout this codebase — see district/page.tsx and login redirects
import { redirect } from 'next/navigation'
export default function DistrictPage() {
  redirect('/property')
}
```

---

## Complete File Change Inventory

| File | Change Type | What Changes |
|------|-------------|-------------|
| `src/lib/types/auth.ts` | Modify | `UserRole` union: `'dm'` → `'rm'`; all three ROLE_* constants updated |
| `src/components/layout/user-header.tsx` | Modify | Line 24: remove `|| role === "dm"` from exec branch |
| `src/app/(dashboard)/district/page.tsx` | Replace | Replace full implementation with single `redirect('/property')` |
| Supabase `app_metadata` | Manual ops | Change `role: 'dm'` → `role: 'rm'` for all DM users |

**No other files require changes.** Middleware reads auth.ts constants dynamically. Sidebar and AppShell have no DM-specific code. No DM-specific test files exist.

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `dm` role with separate `/district` route | `rm` role shares `/property` route | Phase 6 context decision | Eliminates duplicate view maintenance |
| Portfolio overview cards per property | PM view + PropertySelector dropdown | Phase 6 context decision | Zero new code, existing UX handles it |

---

## Open Questions

1. **Supabase deployment timing**
   - What we know: manual `app_metadata` update required for existing DM users
   - What's unclear: how many DM users exist; whether update can happen before or must coincide with code deploy
   - Recommendation: Document the manual step explicitly in the plan's verification checklist; treat as blocking before marking phase complete

2. **`ROLE_ALLOWED_ROUTES` for `rm` — explicit vs. implicit**
   - What we know: without an `rm` entry, middleware falls back to `ownRoute` check, which is functionally correct
   - What's unclear: whether the implicit fallback is intentional or a coincidence
   - Recommendation: Add explicit `rm: ['/property']` entry to match the explicit `exec` entry pattern — clarity over cleverness

---

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest (vitest.config.ts) |
| Config file | vitest.config.ts (project root) |
| Quick run command | `npx vitest run src/middleware.test.ts src/components/layout/__tests__/layout.test.tsx` |
| Full suite command | `npx vitest run` |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| DM-01 | RM role routes to `/property` (no portfolio view needed) | unit | `npx vitest run src/middleware.test.ts` | Partial — middleware test exists but tests only config.matcher, not routing logic |
| DM-02 | RM KPIs via PM view (no new KPI logic) | unit | N/A — existing PM KPI tests cover this | Existing tests pass |
| DM-03 | PropertySelector dropdown works for RM users | manual smoke | Manual: log in as RM user, verify dropdown appears | N/A |
| DM-04 | Loading skeletons for RM (shared with PM) | manual smoke | Manual: observe skeleton on slow connection | N/A |

### Sampling Rate
- **Per task commit:** `npx vitest run src/middleware.test.ts`
- **Per wave merge:** `npx vitest run`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `src/lib/__tests__/auth-types.test.ts` — verify `UserRole` union contains `'rm'` not `'dm'`; verify `ROLE_ROUTES.rm === '/property'`; verify `ROLE_LABELS.rm === 'Regional Manager'` (these are pure type/constant assertions, no mocking needed)

*(Existing test infrastructure covers the broader suite; only the new type constant assertions need a new file)*

---

## Sources

### Primary (HIGH confidence)
- Direct code audit of `src/lib/types/auth.ts` — full content read, all `dm` references catalogued
- Direct code audit of `src/components/layout/user-header.tsx` — one hardcoded `dm` reference confirmed at line 24
- Direct code audit of `src/lib/supabase/middleware.ts` — confirmed zero hardcoded `dm` strings; reads constants dynamically
- Direct code audit of `src/app/(dashboard)/district/page.tsx` — placeholder page confirmed, no business logic
- Grep search across all `.ts`/`.tsx` files for `\bdm\b` and `district` — confirmed complete reference inventory

### Secondary (MEDIUM confidence)
- Phase 6 CONTEXT.md — user decisions locked; research validates technical feasibility against actual codebase

### Tertiary (LOW confidence)
- None

---

## Metadata

**Confidence breakdown:**
- File inventory: HIGH — full grep audit performed, all five touch points confirmed
- Auth.ts changes: HIGH — type and constant structure fully read; changes are mechanical renames
- Middleware safety: HIGH — confirmed no hardcoded role strings; dynamic constant reads
- user-header.tsx change: HIGH — single line change confirmed by reading file
- Supabase manual step: MEDIUM — no admin panel in codebase; depends on operator performing migration

**Research date:** 2026-03-14
**Valid until:** 2026-04-14 (stable codebase, no fast-moving dependencies)
