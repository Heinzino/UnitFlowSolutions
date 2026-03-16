# Phase 10: Admin User Creation - Research

**Researched:** 2026-03-15
**Domain:** Supabase Admin API, Next.js Server Actions, Airtable write, custom multi-select component
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Form Layout & Flow**
- Dedicated page at `/admin/create-user` with its own sidebar nav item
- Single white card with all fields vertically stacked: first name, last name, email, role dropdown, property multi-select
- No stepper/wizard — all fields visible at once

**Property Assignment UX**
- Searchable dropdown with checkboxes for multi-select
- Selected properties shown as chips/tags below the input with remove (×) buttons
- All properties visible regardless of selected role — admin picks freely
- "Create new property" option at bottom of dropdown, expanding inline fields (name + street address) within the dropdown
- New property saved to Airtable immediately on "Add" click, then appears as a selectable option
- Build as a shared/reusable component for Phase 11 (Vacant Unit Entry) — supports both single-select and multi-select modes

**Admin Access Control**
- Hardcoded email allowlist: `['heinz@readymation.com', 'jgiles@cdvsolutions.com']`
- Sidebar: "Create User" appears below main nav items, above logout, separated by dividers — visible only to admin emails
- Also appears in mobile bottom tab bar for admin users
- Non-admin navigating to `/admin/create-user` is silently redirected to their default role route
- No new role or metadata flag — just email check against the allowlist

**Password Handling**
- Auto-generate a random password on user creation
- Display password once in the success card with a copy button
- Admin shares credentials with the new user manually

**Post-Creation Feedback**
- Success: green banner/card showing email, role, and generated password with copy button
- Form resets after success, with "Create Another User" button
- Validation errors: inline red text below each invalid field, validated on submit
- API errors (e.g., email exists): red toast notification via existing Toaster component, form stays filled for retry

### Claude's Discretion
- Exact password generation algorithm and length
- Loading state during form submission
- Mobile layout adjustments for the form
- Exact divider styling in sidebar for admin section

### Deferred Ideas (OUT OF SCOPE)
None — discussion stayed within phase scope
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| USER-01 | Admin can create a new Supabase user with name, email, role, and assigned properties | Supabase Admin API `createUser` with `app_metadata: { role, property_ids }` + new server action in `src/app/actions/admin.ts` |
| USER-02 | "Create New User" sidebar item is visible only to heinz@readymation.com and jgiles@cdvsolutions.com | Extend Sidebar and BottomTabBar to read `user.email` alongside `role`; add `adminEmails` allowlist constant |
| USER-03 | Properties dropdown is dynamically populated from Airtable Properties table (searchable) | `fetchProperties()` already exists; new `PropertyMultiSelect` component wraps it with search input + checkbox list |
| USER-04 | Admin can create a new property inline (with street address) if it doesn't exist in the list | First Airtable write in the codebase — `base('Properties').create(fields)` inside a server action; invalidate `CACHE_TAGS.properties` after write |
</phase_requirements>

---

## Summary

Phase 10 introduces three distinct implementation domains that must work together: (1) Supabase Admin API user creation via a server action using the service-role key, (2) email-based admin access control grafted onto the existing role-based sidebar/navigation system, and (3) the first Airtable write operation in the codebase (creating a new property record).

The existing codebase provides strong scaffolding. The server action pattern (`src/app/actions/auth.ts`), the navigation filtering pattern in `sidebar.tsx` and `bottom-tab-bar.tsx`, and `fetchProperties()` with cache tagging are all reusable. The main new complexity is the `PropertyMultiSelect` component — a custom, controlled dropdown with search, checkbox multi-select, chip display, and an inline "create property" expansion panel — which must be designed as a shared component for Phase 11 reuse.

The Supabase Admin API requires `SUPABASE_SERVICE_ROLE_KEY`, which is already listed in `.env.local.example` and confirmed present. No new dependencies are needed — everything builds on `@supabase/supabase-js` (already installed), the Airtable client (already installed), and existing UI primitives.

**Primary recommendation:** Build a dedicated `createAdminClient()` in `src/lib/supabase/admin.ts` that uses the service-role key, keeping it strictly server-side. Follow the existing server action pattern for the create-user action. Build `PropertyMultiSelect` as a standalone client component in `src/components/ui/` for Phase 11 reuse.

---

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `@supabase/supabase-js` | ^2.99.1 | Admin API: `createUser`, `app_metadata` | Already installed; the only way to use Supabase Admin API in JS |
| `airtable` | ^0.12.2 | Write new property record | Already installed; `base('Properties').create()` is the Airtable JS SDK write pattern |
| `next` | 16.1.6 | Server Actions (`'use server'`), `revalidateTag` | Already installed; server actions are the established pattern in this codebase |
| `sonner` | ^2.0.7 | Toast for API errors | Already installed; used by existing `Toaster` component |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `lucide-react` | ^0.577.0 | Icons for nav item, chips × button | Already in design system; use `UserPlus` or `UserCog` for "Create User" nav icon |
| `clsx` | (transitive) | Conditional className in new component | Already used throughout codebase |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Custom `PropertyMultiSelect` | Headless UI, Radix Combobox | Custom is warranted because it needs inline property creation panel — external libraries would fight that UX requirement |
| `crypto.randomBytes` for password | `nanoid`, `uuid` | `crypto` is built into Node.js/Edge runtime, no extra dependency needed |

**Installation:** No new packages required. All dependencies already present.

---

## Architecture Patterns

### Recommended Project Structure

```
src/
├── app/
│   ├── (dashboard)/
│   │   └── admin/
│   │       └── create-user/
│   │           └── page.tsx              # Admin create-user page (server component)
│   └── actions/
│       └── admin.ts                      # New server actions: createUser, createProperty
├── components/
│   ├── layout/
│   │   ├── sidebar.tsx                   # MODIFIED: add admin email check + Create User item
│   │   └── bottom-tab-bar.tsx            # MODIFIED: same as sidebar
│   └── ui/
│       └── property-multi-select.tsx     # NEW: shared reusable component
└── lib/
    └── supabase/
        └── admin.ts                      # NEW: createAdminClient() with service-role key
```

### Pattern 1: Admin Supabase Client (server-only)

**What:** A separate Supabase client factory that uses `SUPABASE_SERVICE_ROLE_KEY` instead of the anon key. This client bypasses Row-Level Security and has full auth admin privileges.

**When to use:** Only inside Server Actions or Route Handlers. Never in client components or middleware.

```typescript
// src/lib/supabase/admin.ts
// Source: Supabase docs https://supabase.com/docs/guides/auth/server-side/creating-a-client
import 'server-only'
import { createClient } from '@supabase/supabase-js'

export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  )
}
```

**Critical:** Import `'server-only'` at the top. This causes a build error if accidentally imported in a client component.

### Pattern 2: createUser Server Action

**What:** Server action in `src/app/actions/admin.ts` that (a) validates caller is an admin email, (b) generates a password, (c) calls `supabase.auth.admin.createUser()` with `app_metadata`, (d) returns the result.

```typescript
// src/app/actions/admin.ts
'use server'
import { createClient as createServerClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

const ADMIN_EMAILS = ['heinz@readymation.com', 'jgiles@cdvsolutions.com']

export async function createUser(prevState: unknown, formData: FormData) {
  // 1. Verify caller is admin
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || !ADMIN_EMAILS.includes(user.email ?? '')) {
    return { error: 'Unauthorized' }
  }

  // 2. Extract form data
  const email = formData.get('email') as string
  const role = formData.get('role') as string
  const propertyIds = formData.getAll('property_ids') as string[]

  // 3. Generate password
  const password = generatePassword()

  // 4. Create user via Admin API
  const adminClient = createAdminClient()
  const { data, error } = await adminClient.auth.admin.createUser({
    email,
    password,
    email_confirm: true,          // skip confirmation email
    app_metadata: { role, property_ids: propertyIds },
    user_metadata: {
      first_name: formData.get('first_name'),
      last_name: formData.get('last_name'),
    },
  })

  if (error) return { error: error.message }
  return { success: true, email, role, password }
}
```

**Key flag:** `email_confirm: true` skips the confirmation email — the admin delivers credentials manually. This is the correct pattern since users don't self-register.

### Pattern 3: Airtable Write (first write in codebase)

**What:** Create a new property record in Airtable `Properties` table, then invalidate the `properties` cache tag so `fetchProperties()` returns fresh data.

```typescript
// Inside src/app/actions/admin.ts (or a new lib function)
// Source: Airtable JS SDK https://github.com/Airtable/airtable.js
import { revalidateTag } from 'next/cache'
import { base, rateLimiter } from '@/lib/airtable/client'
import { CACHE_TAGS } from '@/lib/airtable/cache-tags'

export async function createProperty(name: string, streetAddress: string) {
  await rateLimiter.acquire()
  const record = await base('Properties').create({
    'Property Name': name,
    'Street Address': streetAddress,
    // City and State not required for Phase 10 (admin flow)
    // — Phase 11 clarifies defaults
  })
  revalidateTag(CACHE_TAGS.properties)
  return { id: record.id, name, streetAddress }
}
```

**Important:** `revalidateTag` must be called outside any `'use cache'` context — only valid in a `'use server'` action. The `base('Properties').create()` method returns the created record including its Airtable record ID, which can be used as `property_id` in the user's `app_metadata`.

### Pattern 4: Admin Email Check in Navigation

**What:** Sidebar and BottomTabBar currently read only `role` from `app_metadata`. Admin check must also read `user.email` and compare to the hardcoded allowlist.

**How to extend (minimal change):**
```typescript
// In sidebar.tsx — extend the existing useEffect
const [role, setRole] = useState<UserRole>('pm')
const [isAdmin, setIsAdmin] = useState(false)

useEffect(() => {
  const supabase = createClient()
  supabase.auth.getUser().then(({ data: { user } }) => {
    if (user) {
      setRole((user.app_metadata?.role as UserRole) ?? 'pm')
      setIsAdmin(ADMIN_EMAILS.includes(user.email ?? ''))
    }
  }).catch(() => {})
}, [])
```

Then render the admin nav item conditionally on `isAdmin`, in a separate section between the main nav and logout, separated by `<hr>` or `<div className="border-t border-gray-100">`.

### Pattern 5: PropertyMultiSelect Component Interface

**What:** A client component that must support both single-select (Phase 11) and multi-select (Phase 10) modes, with search filtering, chip display, and inline property creation.

```typescript
// src/components/ui/property-multi-select.tsx
interface PropertyOption {
  id: string          // Airtable record ID (used for property_ids in app_metadata)
  name: string
  streetAddress?: string
}

interface PropertyMultiSelectProps {
  properties: PropertyOption[]
  selected: PropertyOption[]       // multi-select: array; single-select: array of 1
  onChange: (selected: PropertyOption[]) => void
  mode?: 'single' | 'multi'        // defaults to 'multi'
  onCreateProperty?: (name: string, address: string) => Promise<PropertyOption>
  placeholder?: string
}
```

**Design notes:**
- `onCreateProperty` is async — it calls the server action, receives the new record, and adds it to both the dropdown list and the selected chips
- The component is uncontrolled regarding the property list internally — the parent passes `properties` as a prop (fetched server-side and passed down)
- Click-outside closes the dropdown (same pattern as existing `PropertySelector`)

### Anti-Patterns to Avoid

- **Using the regular server client for admin operations:** The regular client uses the anon key — `auth.admin.*` methods require the service-role key. Using the wrong client returns a 403 silently.
- **Calling `revalidateTag` inside a cached function:** `revalidateTag` is only valid in server actions. Calling it inside a `'use cache'` function throws at runtime.
- **Exposing SUPABASE_SERVICE_ROLE_KEY to the client:** Any env var without `NEXT_PUBLIC_` prefix is already safe, but adding `import 'server-only'` to `admin.ts` enforces this at build time.
- **Passing Airtable record IDs as property_ids before verifying the record was created:** The `base().create()` call returns the record ID — only use it after confirming no error.
- **Route protection via UI only:** The middleware does not know about the admin email allowlist. Add a server-side check inside the page component (or the server action) — not just hiding the nav item.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Secure random password | Custom entropy loop | `crypto.getRandomValues()` / Node `crypto.randomBytes()` | Built into runtime; handles entropy correctly |
| User creation | Direct `INSERT` into Supabase `auth.users` table | `supabase.auth.admin.createUser()` | Direct inserts bypass auth triggers, break session creation, skip email confirmation flow |
| Cache invalidation after Airtable write | Manual cache bust via API route | `revalidateTag(CACHE_TAGS.properties)` inside server action | Built into Next.js 15+ cache system; already used by this codebase |
| Copy-to-clipboard | `document.execCommand('copy')` | `navigator.clipboard.writeText()` | Modern API, no deprecation risk; works in all supported browsers |

**Key insight:** The Supabase Admin API is specifically designed for exactly this use case (admin-initiated user creation). Working around it via direct DB access creates orphaned auth state.

---

## Common Pitfalls

### Pitfall 1: `email_confirm: true` is Required
**What goes wrong:** Without `email_confirm: true`, Supabase sends a confirmation email to the new user. Since this is admin-initiated creation where the admin delivers credentials manually, the user gets a confusing confirmation email before they know an account exists.
**Why it happens:** `email_confirm` defaults to `false`.
**How to avoid:** Always pass `email_confirm: true` in `createUser()`.
**Warning signs:** New user receives an unexpected confirmation email.

### Pitfall 2: Admin Route Not Protected at Page Level
**What goes wrong:** Hiding the nav item is not sufficient access control. A non-admin who knows the URL `/admin/create-user` can navigate directly.
**Why it happens:** The middleware only enforces `ROLE_ALLOWED_ROUTES` which don't include `/admin`.
**How to avoid:** Add an email check at the top of the page server component, redirect to role default if not admin. The middleware needs to know `/admin` is a valid route (don't add a catch-all block) — handle in the page.
**Warning signs:** Non-admin users can access the form by direct URL.

### Pitfall 3: `property_ids` Contains Names Instead of IDs
**What goes wrong:** `app_metadata.property_ids` should contain Airtable record IDs (e.g., `rec1234abcd`), not property names. The existing `fetchProperties()` returns `Property` objects without the Airtable record ID — the mapper does not include it.
**Why it happens:** `mapProperty()` in `properties.ts` maps fields but does not capture `record.id`.
**How to avoid:** Update `mapProperty` (or add a new mapper) to include the Airtable record ID as a field. The `PropertyOption` interface needs `id: string` to be the Airtable record ID.
**Warning signs:** Property assignment appears to work but `property_ids` array contains string names; role-based property filtering in Phase 11 breaks.

### Pitfall 4: Airtable Write Without Rate Limiter
**What goes wrong:** Creating a property without `await rateLimiter.acquire()` can hit Airtable's 5 requests/second limit and cause 429 errors, especially if two admins act simultaneously.
**Why it happens:** Forgetting to apply the same rate-limiter pattern used by all existing Airtable reads.
**How to avoid:** Always wrap Airtable API calls with `await rateLimiter.acquire()` first.

### Pitfall 5: Existing Layout Test Assertions Break
**What goes wrong:** `src/components/layout/__tests__/layout.test.tsx` asserts that `Sidebar` renders exactly 2 links. After adding the admin "Create User" link, this test will fail for admin users.
**Why it happens:** The test renders `<Sidebar activePath="/" />` with default state (no mock for the Supabase `getUser` call, so `isAdmin` stays `false`).
**How to avoid:** The test should still pass because `isAdmin` defaults to `false` and the Supabase mock returns no user — the admin item won't render. Verify this remains true after the refactor. If the test does break, add a mock that returns a non-admin user.

### Pitfall 6: `revalidateTag` Called After Cached Function Exit
**What goes wrong:** If `createProperty` is called inside a `'use cache'` context, `revalidateTag` throws: "Cannot call revalidateTag inside cache scope."
**Why it happens:** Next.js prevents mutation side-effects inside cached functions.
**How to avoid:** Keep `createProperty` as a `'use server'` action, never a cached function.

---

## Code Examples

### Password Generation (no dependency)
```typescript
// Source: Node.js crypto built-in
function generatePassword(length = 16): string {
  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$%'
  const bytes = new Uint8Array(length)
  crypto.getRandomValues(bytes)
  return Array.from(bytes, (b) => chars[b % chars.length]).join('')
}
```

Recommended length: 16 characters. Excludes visually ambiguous characters (0, O, 1, l, I).

### Supabase Admin createUser (full call)
```typescript
// Source: https://supabase.com/docs/reference/javascript/auth-admin-createuser
const { data, error } = await adminClient.auth.admin.createUser({
  email,
  password,
  email_confirm: true,
  app_metadata: {
    role,                     // 'pm' | 'rm' | 'exec'
    property_ids: propertyIds, // string[] of Airtable record IDs
  },
  user_metadata: {
    first_name: firstName,
    last_name: lastName,
  },
})
```

### Airtable Record Create
```typescript
// Source: Airtable JS SDK — base(tableName).create(fields)
const record = await base('Properties').create({
  'Property Name': name,
  'Street Address': streetAddress,
})
// record.id is the Airtable record ID (e.g., 'recXXXXXXXXXX')
revalidateTag(CACHE_TAGS.properties)
return { id: record.id, name, streetAddress }
```

### fetchProperties with record ID (mapper update required)
```typescript
// CURRENT mapProperty does NOT include record.id — must be updated:
function mapProperty(record: AirtableRecord<FieldSet>): PropertyOption {
  const f = record.fields as Record<string, unknown>
  return {
    id: record.id,                           // ADD THIS
    propertyName: String(f['Property Name'] ?? ''),
    streetAddress: String(f['Street Address'] ?? ''),
    // ... other fields
  }
}
```

### Copy to Clipboard Pattern
```typescript
// Inline in success card component
async function handleCopy(text: string) {
  await navigator.clipboard.writeText(text)
  // Optional: brief visual confirmation (e.g., button text changes to "Copied!")
}
```

### Admin Email Check in Middleware (non-admin redirect)
```typescript
// In the page server component: src/app/(dashboard)/admin/create-user/page.tsx
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { ROLE_ROUTES } from '@/lib/types/auth'

const ADMIN_EMAILS = ['heinz@readymation.com', 'jgiles@cdvsolutions.com']

export default async function CreateUserPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user || !ADMIN_EMAILS.includes(user.email ?? '')) {
    const role = user?.app_metadata?.role
    redirect(ROLE_ROUTES[role as keyof typeof ROLE_ROUTES] ?? '/property')
  }

  // ... render page
}
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Supabase `signUp()` for user creation | `auth.admin.createUser()` with service-role key | Supabase v2 | Admin-initiated creation without user self-registering; `email_confirm` can be set to skip email flow |
| Direct Airtable writes everywhere | Rate-limiter wrapping all calls | Established in this codebase | Prevents 429 errors on Airtable free tier |
| Separate Supabase clients per use case | Distinct `createClient` (anon) vs `createAdminClient` (service role) | Standard pattern | Service role bypasses RLS — should never be shared with the anon client factory |

**Deprecated/outdated:**
- `document.execCommand('copy')`: Replaced by `navigator.clipboard.writeText()` — modern API, no deprecation risk in current browser targets.

---

## Open Questions

1. **Airtable record ID as `property_id`**
   - What we know: `app_metadata.property_ids` is an array of strings; existing codebase uses property names in some places (e.g., `PropertySelector` receives string names)
   - What's unclear: Whether existing role-based property filtering reads `property_ids` as names or IDs — need to check how Phase 9 and earlier phases consume `property_ids` from `app_metadata`
   - Recommendation: Audit how `app_metadata.property_ids` is consumed in existing dashboard pages before implementing; if the ecosystem uses names, store names instead of IDs (or store both)

2. **`fetchProperties()` returns deduplicated property names or all records?**
   - What we know: Airtable `Properties` table has one record per unit (unit number + floor plan are per-record), not one record per property
   - What's unclear: Whether the dropdown should show unique property names (deduplicated) or every record
   - Recommendation: Deduplicate by `propertyName` in the component or the mapper for display; store by record ID for assignment only if that's the established pattern

---

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Vitest + Testing Library (jsdom) |
| Config file | `vitest.config.ts` |
| Quick run command | `npx vitest run src/app/actions/ src/components/ui/property-multi-select.tsx` |
| Full suite command | `npx vitest run` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| USER-01 | `createUser` action returns `{ success, email, role, password }` on valid input | unit | `npx vitest run src/app/actions/admin.test.ts -x` | ❌ Wave 0 |
| USER-01 | `createUser` action returns `{ error: 'Unauthorized' }` for non-admin caller | unit | `npx vitest run src/app/actions/admin.test.ts -x` | ❌ Wave 0 |
| USER-01 | `createUser` action returns `{ error }` when Supabase returns an error (e.g., email exists) | unit | `npx vitest run src/app/actions/admin.test.ts -x` | ❌ Wave 0 |
| USER-02 | Sidebar renders "Create User" link when email is in allowlist | unit | `npx vitest run src/components/layout/__tests__/layout.test.tsx -x` | ✅ (update needed) |
| USER-02 | Sidebar does NOT render "Create User" link for non-admin | unit | `npx vitest run src/components/layout/__tests__/layout.test.tsx -x` | ✅ (update needed) |
| USER-03 | `PropertyMultiSelect` renders all passed properties in dropdown | unit | `npx vitest run src/components/ui/__tests__/property-multi-select.test.tsx -x` | ❌ Wave 0 |
| USER-03 | `PropertyMultiSelect` filters visible options when search term is typed | unit | `npx vitest run src/components/ui/__tests__/property-multi-select.test.tsx -x` | ❌ Wave 0 |
| USER-04 | `createProperty` action returns `{ id, name, streetAddress }` on valid input | unit | `npx vitest run src/app/actions/admin.test.ts -x` | ❌ Wave 0 |
| USER-04 | `PropertyMultiSelect` shows inline creation panel on "Create new property" click | unit | `npx vitest run src/components/ui/__tests__/property-multi-select.test.tsx -x` | ❌ Wave 0 |

### Sampling Rate
- **Per task commit:** `npx vitest run src/app/actions/admin.test.ts src/components/ui/__tests__/property-multi-select.test.tsx`
- **Per wave merge:** `npx vitest run`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `src/app/actions/admin.test.ts` — covers USER-01, USER-04 (mock Supabase admin client and Airtable base)
- [ ] `src/components/ui/__tests__/property-multi-select.test.tsx` — covers USER-03, USER-04 UI
- [ ] Update `src/components/layout/__tests__/layout.test.tsx` — add admin email mock test cases for USER-02

---

## Sources

### Primary (HIGH confidence)
- Supabase JS reference: https://supabase.com/docs/reference/javascript/auth-admin-createuser — `createUser` method signature, `email_confirm`, `app_metadata` params
- Supabase SSR client guide: https://supabase.com/docs/guides/auth/server-side/creating-a-client — service-role admin client pattern
- Codebase: `src/lib/airtable/tables/properties.ts` — confirmed `fetchProperties()` pattern and `mapProperty` mapper
- Codebase: `src/app/actions/auth.ts` — confirmed server action pattern to follow
- Codebase: `src/components/layout/sidebar.tsx` — confirmed `navItems.filter` pattern and client component structure
- Codebase: `.env.local.example` — confirmed `SUPABASE_SERVICE_ROLE_KEY` already defined

### Secondary (MEDIUM confidence)
- Airtable JS SDK (airtable npm): `base(tableName).create(fields)` write pattern — verified from SDK docs and `base(tableName).select().all()` being the existing read pattern in this codebase
- Node.js built-in `crypto.getRandomValues()`: standard secure password generation without dependencies

### Tertiary (LOW confidence)
- WebSearch result on Supabase new API key format (2025): New secret key format introduced; backward compatible. Verify with `@supabase/supabase-js@^2.99.1` that both key formats work — but this project uses the existing key format so no action needed.

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all packages already installed and in use; Admin API method verified against official docs
- Architecture: HIGH — follows exact patterns already established in codebase; no guesswork on server action shape or nav filtering
- Pitfalls: HIGH for Supabase/cache pitfalls (verified); MEDIUM for Airtable ID vs name question (open question flagged)
- Component design: MEDIUM — `PropertyMultiSelect` is new; interface design is prescriptive but implementation has discretion

**Research date:** 2026-03-15
**Valid until:** 2026-04-15 (stable stack; Supabase Admin API is mature)
