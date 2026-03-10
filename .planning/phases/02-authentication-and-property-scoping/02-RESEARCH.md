# Phase 2: Authentication and Property Scoping - Research

**Researched:** 2026-03-10
**Domain:** Supabase SSR authentication, Next.js App Router middleware, role-based routing, property scoping
**Confidence:** HIGH

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Login Page Design**
- Centered white card on forest green background — consistent with dashboard's card-based design language
- App name "ScheduleSimple" heading with a short tagline below (e.g., "Property management, simplified")
- Chartreuse (#CAEF45) Sign In button — matches THEME.md primary CTA color
- Login errors displayed inline below the relevant field (red text under email or password)
- No email pre-fill / "remember me" — clean form every time (shared device consideration)

**Session & Logout Behavior**
- No session timeout — session persists until explicit logout or browser clear (6-15 internal users, daily/weekly check cadence)
- Instant logout — click logout icon in sidebar, immediately logged out, redirected to login. No confirmation dialog
- Silent redirect to login on session invalidation — no error message, just the login page

**Access Denied Experience**
- Silent redirect to role dashboard when accessing unauthorized routes (PM visiting /executive silently goes to /property)
- Silent redirect to dashboard when accessing unauthorized property IDs (e.g., /property/999 for unassigned property)
- Root URL (/) does role-based redirect — authenticated users land on their role dashboard, unauthenticated users go to login
- Sidebar shows all icons for all roles (Phase 1 decision: universal icon set, role-gating at page level)

**Property Context Indicator**
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

### Deferred Ideas (OUT OF SCOPE)
None — discussion stayed within phase scope
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| AUTH-01 | User can log in with email and password via Supabase | Supabase `signInWithPassword` via Server Action, `@supabase/ssr` browser client |
| AUTH-02 | User is redirected to their role-appropriate dashboard after login (PM → /property, DM → /district, Exec → /executive) | Role read from `app_metadata.role` on user object after `getUser()`; redirect in Server Action |
| AUTH-03 | Unauthenticated users are redirected to login page | Middleware calls `getUser()`, redirects to `/login` if null |
| AUTH-04 | User session persists across browser refresh | `@supabase/ssr` stores session in HTTP-only cookies; middleware refreshes tokens on each request |
| AUTH-05 | User can log out from any page | Server Action calls `supabase.auth.signOut()`, clears cookies, redirects to `/login`; sidebar logout button invokes it |
| AUTH-06 | Users can only access routes matching their role (PM cannot access /executive) | Middleware reads `app_metadata.role` from `getUser()` and redirects unauthorized role to their own dashboard |
| SCOPE-01 | Property Managers see only turns/jobs for their assigned properties | `app_metadata.property_ids` array stored on user; middleware/DAL passes this to page data fetchers |
| SCOPE-02 | District Managers see data for their assigned property set | Same `app_metadata.property_ids` pattern; DMs get multi-property array |
| SCOPE-03 | Executives see data across all properties with no filter | Role check: `role === 'exec'` → no property filter applied |
| SCOPE-04 | Property name matching between Supabase and Airtable is normalized | Normalize both sides to lowercase + trim; store canonical names in Supabase; documented approach below |
</phase_requirements>

---

## Summary

This phase wires Supabase email/password authentication into a Next.js 16 App Router application using the `@supabase/ssr` package. The pattern is: HTTP-only cookies for session storage, a middleware file that runs on every request to refresh tokens and protect routes, Server Actions for login/logout mutations, and server components that call `supabase.auth.getUser()` to read user identity at render time.

The critical architectural decision is where to store role and property assignment data. Using `app_metadata` (set only via service-role API, not modifiable by users) is the secure, zero-query approach for roles. Property assignment — an array of property IDs — should also live in `app_metadata.property_ids` for this small, internally-managed user base (6-15 users). This avoids a database round-trip on every request and keeps the data access layer simple for Phase 2.

Property name normalization between Supabase (where property IDs are stored) and Airtable (where data is keyed by property name strings) requires a deterministic mapping step. The recommended approach is to store the canonical Airtable property name strings directly in `app_metadata.property_ids` and apply a lowercase+trim normalization function when comparing against Airtable records.

**Primary recommendation:** Use `@supabase/ssr` with middleware-based token refresh, `app_metadata` for role and property assignment, and Server Actions for auth mutations. No context provider needed — server components read user data directly.

---

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `@supabase/supabase-js` | ^2.x | Supabase client SDK, auth operations | Official SDK, required for all Supabase operations |
| `@supabase/ssr` | ^0.x | SSR-safe client factories with cookie handling | Official Supabase package replacing deprecated `auth-helpers-nextjs` |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `next/navigation` `redirect()` | built-in | Server-side redirects from Server Actions and middleware | Post-login, post-logout, unauthorized access |
| `next/headers` `cookies()` | built-in | Read/write cookies in server context | Used internally by `@supabase/ssr` server client |
| `react` `useActionState` | React 19 (already installed) | Login form error state from Server Actions | Login form validation feedback |
| `zod` | optional | Form field validation schema | Only if adding strict input validation; not strictly required for internal tool |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| `@supabase/ssr` | `@supabase/auth-helpers-nextjs` | auth-helpers is deprecated as of 2024; do not use |
| `app_metadata` for role | separate `public.profiles` table | Table requires extra DB query per request; app_metadata is zero-cost once authenticated; acceptable for small user count |
| Server Action login | Client component with `supabase.auth.signInWithPassword` | Client-side approach exposes less server control; Server Action allows role-based redirect on same request |

**Installation:**
```bash
npm install @supabase/supabase-js @supabase/ssr
```

---

## Architecture Patterns

### Recommended Project Structure

```
src/
├── app/
│   ├── login/
│   │   └── page.tsx          # Login page (no AppShell)
│   ├── property/
│   │   └── page.tsx          # PM dashboard (auth-protected)
│   ├── district/
│   │   └── page.tsx          # DM dashboard (auth-protected)
│   ├── executive/
│   │   └── page.tsx          # Exec dashboard (auth-protected)
│   ├── actions/
│   │   └── auth.ts           # login(), logout() Server Actions
│   └── layout.tsx            # Root layout — wrap with AuthProvider if needed
├── lib/
│   └── supabase/
│       ├── client.ts         # createBrowserClient (for client components)
│       ├── server.ts         # createServerClient (for server components & actions)
│       └── middleware.ts     # updateSession helper used by src/middleware.ts
├── middleware.ts             # Route protection + token refresh
└── components/
    └── layout/
        └── app-shell.tsx     # Updated: conditionally hide on /login, show user name/role
```

### Pattern 1: Middleware — Token Refresh and Route Protection

**What:** Runs on every request. Refreshes Supabase session cookie, redirects unauthenticated users to login, and enforces role-based route access.

**When to use:** This is the sole gatekeeper for routes. Do NOT replicate route protection logic in every page component — keep it centralized here.

```typescript
// src/middleware.ts
// Source: https://supabase.com/docs/guides/getting-started/ai-prompts/nextjs-supabase-auth
import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

const ROLE_ROUTES: Record<string, string> = {
  pm:   '/property',
  dm:   '/district',
  exec: '/executive',
}

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // CRITICAL: Do not add any code between createServerClient and getUser()
  const { data: { user } } = await supabase.auth.getUser()

  const path = request.nextUrl.pathname

  // Unauthenticated: send to login (except login page itself)
  if (!user && path !== '/login') {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  // Authenticated on login page: redirect to role dashboard
  if (user && path === '/login') {
    const role = user.app_metadata?.role as string | undefined
    const dest = ROLE_ROUTES[role ?? ''] ?? '/property'
    const url = request.nextUrl.clone()
    url.pathname = dest
    return NextResponse.redirect(url)
  }

  // Authenticated: enforce role route access
  if (user) {
    const role = user.app_metadata?.role as string | undefined
    const ownRoute = ROLE_ROUTES[role ?? '']
    const isRoleRoute = Object.values(ROLE_ROUTES).some(r => path.startsWith(r))
    if (isRoleRoute && ownRoute && !path.startsWith(ownRoute)) {
      const url = request.nextUrl.clone()
      url.pathname = ownRoute
      return NextResponse.redirect(url)
    }
    // Root redirect
    if (path === '/' && ownRoute) {
      const url = request.nextUrl.clone()
      url.pathname = ownRoute
      return NextResponse.redirect(url)
    }
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
```

### Pattern 2: Server Client — Reading Auth in Server Components

**What:** Creates a Supabase client bound to the request's cookie store for use in server components, layouts, and Server Actions.

**When to use:** Any time server-side code needs the current user or their metadata.

```typescript
// src/lib/supabase/server.ts
// Source: https://supabase.com/docs/guides/getting-started/ai-prompts/nextjs-supabase-auth
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // Called from a Server Component — middleware handles persistence
          }
        },
      },
    }
  )
}
```

### Pattern 3: Browser Client — Client Component Auth

**What:** Creates a browser-safe Supabase client for use in `"use client"` components (e.g., logout button, auth state listener).

```typescript
// src/lib/supabase/client.ts
// Source: https://supabase.com/docs/guides/getting-started/ai-prompts/nextjs-supabase-auth
import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
```

### Pattern 4: Login Server Action

**What:** Handles form submission server-side. Calls Supabase `signInWithPassword`, reads role from user object, redirects to role dashboard.

**When to use:** Login form `action=` prop. Server Actions execute on the server; credentials never reach the browser.

```typescript
// src/app/actions/auth.ts
'use server'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

const ROLE_ROUTES: Record<string, string> = {
  pm:   '/property',
  dm:   '/district',
  exec: '/executive',
}

export async function login(prevState: unknown, formData: FormData) {
  const supabase = await createClient()

  const { data, error } = await supabase.auth.signInWithPassword({
    email: formData.get('email') as string,
    password: formData.get('password') as string,
  })

  if (error) {
    return { error: error.message }
  }

  const role = data.user?.app_metadata?.role as string | undefined
  const dest = ROLE_ROUTES[role ?? ''] ?? '/property'
  redirect(dest)
}

export async function logout() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/login')
}
```

### Pattern 5: Reading User Data in Server Components

**What:** Server components call `getUser()` directly to access user identity and metadata.

```typescript
// Example: src/app/property/page.tsx (Server Component)
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function PropertyPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Middleware already redirects if unauthenticated; this is defence-in-depth
  if (!user) redirect('/login')

  const propertyIds = user.app_metadata?.property_ids as string[] | undefined ?? []
  const userName = user.user_metadata?.full_name as string | undefined ?? user.email

  return (
    // header shows userName, propertyIds drive data fetching
    <div>...</div>
  )
}
```

### Pattern 6: AppShell Conditional Rendering

**What:** The login page must NOT render inside AppShell (no sidebar, no header). Use Next.js route groups or check the path.

**Recommended approach:** Use a route group `(dashboard)` with its own layout that wraps AppShell, and put `/login` outside the group.

```
src/app/
├── (dashboard)/
│   ├── layout.tsx       # Contains AppShell; all authenticated pages live here
│   ├── property/page.tsx
│   ├── district/page.tsx
│   └── executive/page.tsx
├── login/
│   └── page.tsx         # Standalone, no AppShell
└── layout.tsx           # Root layout — fonts, body only
```

### Anti-Patterns to Avoid

- **Never use `supabase.auth.getSession()` in server code or middleware.** It does not revalidate the token. Always use `getUser()`.
- **Never use `auth-helpers-nextjs` (`@supabase/auth-helpers-nextjs`).** It is deprecated. Use `@supabase/ssr` exclusively.
- **Never use individual `get`, `set`, `remove` cookie methods** in the `createServerClient` cookie config. Use only `getAll` and `setAll`.
- **Never add code between `createServerClient` and `supabase.auth.getUser()` in middleware.** This breaks session refresh.
- **Never store role in `user_metadata`.** Users can modify `user_metadata` client-side. Use `app_metadata` (only modifiable via service role).
- **Never protect routes only in page components.** Middleware is the only reliable gatekeeper because Server Components do not run on navigation to prefetched routes.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Cookie-based session storage | Custom JWT + cookie logic | `@supabase/ssr` `createServerClient` / `createBrowserClient` | Token refresh, HttpOnly cookies, and edge compatibility are handled; hand-rolled versions miss token rotation |
| Token refresh on each request | Manual cookie inspection and JWT refresh | Middleware with `getUser()` | Supabase's `getUser()` call triggers refresh automatically and syncs cookies in the response |
| Password hashing | Custom bcrypt workflow | Supabase Auth | Auth handles hashing, salting, and secure comparison |
| Role enforcement | Checking role in every page | Middleware `ROLE_ROUTES` pattern + page-level `getUser()` defence | Centralized: one place to change routing rules |

**Key insight:** `@supabase/ssr` was built specifically to solve the hard parts of SSR auth (token refresh, HttpOnly cookies, edge runtime compatibility). Everything a hand-rolled solution would need to re-implement is already there.

---

## Common Pitfalls

### Pitfall 1: Using `getSession()` Instead of `getUser()` in Server Code

**What goes wrong:** Session data from cookies is not re-validated against the Supabase server. A user with an expired or tampered token may still appear authenticated.

**Why it happens:** Developers carry over patterns from legacy Supabase auth helpers that relied on `getSession()`.

**How to avoid:** Always use `await supabase.auth.getUser()` in middleware, Server Components, and Server Actions. `getSession()` is only safe for client components where re-validation is handled differently.

**Warning signs:** Code that calls `getSession()` in `middleware.ts`, Server Actions, or any `async` Server Component.

### Pitfall 2: Cookie Config Using Individual `get/set/remove` Instead of `getAll/setAll`

**What goes wrong:** The `@supabase/ssr` package requires `getAll` and `setAll` in the cookie configuration. Using the older individual method API causes a TypeScript error and broken session handling.

**Why it happens:** Many blog posts and older Supabase docs show the deprecated API.

**How to avoid:** Copy the exact cookie config from the official AI prompt guide (see Code Examples above). Always use `getAll` and `setAll`.

**Warning signs:** TypeScript errors on the cookie configuration object; session not persisting.

### Pitfall 3: AppShell Rendering on Login Page

**What goes wrong:** The login page renders inside the dashboard layout (sidebar, header, etc.), which looks wrong and may attempt to read user context that doesn't exist yet.

**Why it happens:** All routes share `layout.tsx` which includes `AppShell`.

**How to avoid:** Use a Next.js route group `(dashboard)` for all authenticated pages. The login route lives outside the group and has its own minimal layout (or no layout at all beyond root fonts/body).

**Warning signs:** Sidebar visible on `/login`, AppShell accessing user data before authentication.

### Pitfall 4: Role Stored in `user_metadata` (User-Editable)

**What goes wrong:** Any authenticated user can call `supabase.auth.updateUser({ data: { role: 'exec' } })` from the browser console and elevate their own role.

**Why it happens:** `user_metadata` is the "obvious" place to store custom user data, and it's returned on the same `user` object as `app_metadata`.

**How to avoid:** Store `role` and `property_ids` in `app_metadata` exclusively. Update it using the admin API with the service role key (server-side only, never exposed to browser).

**Warning signs:** `user_metadata.role` being read for access control decisions.

### Pitfall 5: Middleware `supabaseResponse` Variable Getting Out of Sync

**What goes wrong:** If the `supabaseResponse` reference is not correctly rebuilt inside `setAll`, the refreshed session cookies are not attached to the response that the browser receives. The user gets logged out on the next request.

**Why it happens:** The `setAll` callback must both update `request.cookies` (for Server Components in this request) AND create a new `NextResponse` (for the browser's next request). Skipping either step breaks session continuity.

**How to avoid:** Use the exact middleware pattern from the official guide — the `supabaseResponse` variable is reassigned inside `setAll`. Do not simplify this pattern.

**Warning signs:** Users intermittently logged out; auth works in dev but breaks under load or after token expiry.

### Pitfall 6: Property Name Mismatch Between Supabase and Airtable

**What goes wrong:** `app_metadata.property_ids` contains "Oak Estates" but Airtable has "Oak Estates " (trailing space) or "oak estates" (different case). The property filter returns zero results.

**Why it happens:** Data was entered manually in both systems without a shared canonical format.

**How to avoid:** Normalize both sides at comparison time using `str.toLowerCase().trim()`. Store the property identifiers in Supabase already in normalized form. Document the normalization function once and use it everywhere.

**Warning signs:** Property filter silently shows empty data; PM sees "No properties assigned" despite correct assignment in Supabase.

---

## Code Examples

### Login Form with `useActionState`

```typescript
// src/app/login/page.tsx
'use client'
import { useActionState } from 'react'
import { login } from '@/app/actions/auth'
import { Button, Card, Input } from '@/components/ui'

export default function LoginPage() {
  const [state, action, pending] = useActionState(login, undefined)

  return (
    <div className="min-h-screen bg-forest flex items-center justify-center">
      <Card className="w-full max-w-sm p-8">
        <h1 className="font-heading font-bold text-2xl text-text-primary mb-1">
          ScheduleSimple
        </h1>
        <p className="text-text-secondary text-sm mb-8">
          Property management, simplified
        </p>
        <form action={action} className="flex flex-col gap-4">
          <Input
            type="email"
            name="email"
            label="Email"
            placeholder="you@company.com"
            autoComplete="off"
            error={state?.fieldErrors?.email?.[0]}
          />
          <Input
            type="password"
            name="password"
            label="Password"
            placeholder="••••••••"
            autoComplete="off"
            error={state?.fieldErrors?.password?.[0]}
          />
          {state?.error && (
            <p className="text-sm text-negative">{state.error}</p>
          )}
          <Button
            type="submit"
            variant="cta"
            disabled={pending}
            className="w-full mt-2"
          >
            {pending ? 'Signing in...' : 'Sign In'}
          </Button>
        </form>
      </Card>
    </div>
  )
}
```

### Logout Button (Client Component)

```typescript
// Used inside Sidebar — calls Server Action
import { logout } from '@/app/actions/auth'

// In the sidebar component, replace the onClick stub:
<button
  onClick={() => logout()}
  className="flex items-center gap-3 px-3 py-2.5 rounded-xl ..."
>
  <LogOut size={18} />
  <span>Logout</span>
</button>

// OR use a form to call Server Action without JS:
<form action={logout}>
  <button type="submit" ...>Logout</button>
</form>
```

### User Header (Server Component)

```typescript
// src/components/layout/user-header.tsx
import { createClient } from '@/lib/supabase/server'
import { Badge } from '@/components/ui'

const ROLE_LABELS: Record<string, string> = {
  pm:   'Property Manager',
  dm:   'District Manager',
  exec: 'Executive',
}

export async function UserHeader() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const role = user.app_metadata?.role as string | undefined
  const name = user.user_metadata?.full_name as string | undefined ?? user.email

  return (
    <div className="flex items-center gap-3">
      <span className="text-sm font-medium text-text-primary">{name}</span>
      {role && (
        <Badge variant="emerald">{ROLE_LABELS[role] ?? role}</Badge>
      )}
    </div>
  )
}
```

### Property Name Normalization

```typescript
// src/lib/normalize-property-name.ts
export function normalizePropertyName(name: string): string {
  return name.toLowerCase().trim()
}

// Usage: filter Airtable records by assigned properties
export function propertyMatches(
  airtableName: string,
  assignedNames: string[]
): boolean {
  const normalized = normalizePropertyName(airtableName)
  return assignedNames.map(normalizePropertyName).includes(normalized)
}
```

### Supabase Admin: Setting User Role and Properties (One-Time Setup Script)

```typescript
// scripts/set-user-role.ts (server-side only, uses SERVICE_ROLE_KEY)
// Run from Next.js API route or a standalone script — never in browser
import { createClient } from '@supabase/supabase-js'

const adminClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!, // never NEXT_PUBLIC_ prefix
)

await adminClient.auth.admin.updateUserById(userId, {
  app_metadata: {
    role: 'pm',                              // 'pm' | 'dm' | 'exec'
    property_ids: ['Oak Estates', 'Pine Ridge'], // canonical Airtable names
  },
})
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `@supabase/auth-helpers-nextjs` | `@supabase/ssr` | 2023-2024 | Old package is deprecated; new package has explicit `getAll`/`setAll` cookie API |
| `getSession()` in server code | `getUser()` everywhere server-side | Ongoing Supabase guidance | `getUser()` re-validates with server; `getSession()` trusts stale cookie |
| Individual `get`/`set`/`remove` in cookie config | `getAll` / `setAll` only | `@supabase/ssr` v0.3+ | Required API change; old blogs show wrong pattern |
| Context provider pattern for auth state | Server Components call `getUser()` directly | Next.js App Router (2023+) | No provider needed for SSR; client components use browser client if needed |
| Next.js `middleware.ts` called `middleware` | Docs now reference `proxy.ts` pattern | Next.js 16 docs (2026) | Next.js docs renamed concept to "Proxy" but the file is still `middleware.ts`; both patterns are identical |

**Deprecated/outdated:**
- `@supabase/auth-helpers-nextjs`: replaced by `@supabase/ssr`; do not install
- `supabase.auth.getSession()` in server code: insecure, replaced by `getUser()`
- Individual cookie `get`/`set`/`remove` in `createServerClient` config: replaced by `getAll`/`setAll`

---

## Open Questions

1. **Supabase project exists and users are pre-created**
   - What we know: The app has 6-15 internal users. Auth requires a Supabase project with email/password users and `app_metadata.role` + `app_metadata.property_ids` set.
   - What's unclear: Whether the Supabase project is already provisioned, and whether users and property assignments are already set.
   - Recommendation: Phase 2 plan should include a task to document the admin setup steps (creating Supabase project, setting env vars, seeding user `app_metadata` via service role). This is likely manual one-time work, not automated code.

2. **`NEXT_PUBLIC_SUPABASE_ANON_KEY` vs `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`**
   - What we know: Supabase is transitioning to a new key format (`sb_publishable_xxx`). The official AI prompt guide uses `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`. The classic setup uses `NEXT_PUBLIC_SUPABASE_ANON_KEY`. Both work during the transition.
   - What's unclear: Which key format the project's Supabase instance uses.
   - Recommendation: Use `NEXT_PUBLIC_SUPABASE_ANON_KEY` as the env var name (widely documented); the value can be either format. Note in `.env.local.example`.

3. **Property dropdown component reuse with Phase 5 (PM-04)**
   - What we know: CONTEXT.md notes the property dropdown should be a reusable component for Phase 5.
   - What's unclear: Exact API/props shape needed for Phase 5 reuse.
   - Recommendation: Design the `PropertySelector` component with a generic `onSelect: (propertyId: string) => void` prop and document it as the Phase 5 entry point. Avoid over-engineering; Phase 5 will refine it.

---

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Vitest 4.x with @testing-library/react |
| Config file | `vitest.config.ts` (exists) |
| Quick run command | `npm test -- --reporter=dot` |
| Full suite command | `npm test` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| AUTH-01 | Login form submits email+password, calls `signInWithPassword` | unit | `npm test -- src/app/login` | ❌ Wave 0 |
| AUTH-02 | Post-login redirect targets correct route per role | unit | `npm test -- src/app/actions` | ❌ Wave 0 |
| AUTH-03 | Middleware redirects unauthenticated request to `/login` | unit | `npm test -- src/middleware` | ❌ Wave 0 |
| AUTH-04 | Session cookie present after login (persists across refresh) | manual | Manual browser refresh test | manual-only |
| AUTH-05 | Logout clears session and redirects to `/login` | unit | `npm test -- src/app/actions` | ❌ Wave 0 |
| AUTH-06 | Middleware redirects PM from `/executive` to `/property` | unit | `npm test -- src/middleware` | ❌ Wave 0 |
| SCOPE-01 | `propertyMatches()` returns true for assigned property names | unit | `npm test -- src/lib` | ❌ Wave 0 |
| SCOPE-02 | DM user object has multi-property `property_ids` array | unit | `npm test -- src/lib` | ❌ Wave 0 |
| SCOPE-03 | Exec user has no property filter applied (empty/undefined array = all) | unit | `npm test -- src/lib` | ❌ Wave 0 |
| SCOPE-04 | `normalizePropertyName` handles trailing spaces and case differences | unit | `npm test -- src/lib` | ❌ Wave 0 |

### Sampling Rate
- **Per task commit:** `npm test -- --reporter=dot src/app/actions src/middleware src/lib`
- **Per wave merge:** `npm test`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps

- [ ] `src/app/login/__tests__/login-page.test.tsx` — covers AUTH-01 (form renders, submits, shows error)
- [ ] `src/app/actions/__tests__/auth.test.ts` — covers AUTH-02, AUTH-05 (login redirect by role, logout)
- [ ] `src/middleware.test.ts` — covers AUTH-03, AUTH-06 (unauthenticated redirect, role enforcement)
- [ ] `src/lib/__tests__/normalize-property-name.test.ts` — covers SCOPE-01, SCOPE-02, SCOPE-03, SCOPE-04

**Testing note on Supabase mocking:** Tests for login/logout Server Actions and middleware must mock `@supabase/ssr`. Use `vi.mock('@supabase/ssr')` to stub `createServerClient` and `createBrowserClient`. Middleware tests mock `NextRequest`/`NextResponse` from `next/server`. No real Supabase connection needed for unit tests.

---

## Sources

### Primary (HIGH confidence)
- [Supabase Docs: Setting up Server-Side Auth for Next.js](https://supabase.com/docs/guides/auth/server-side/nextjs) — middleware pattern, getUser() guidance
- [Supabase Docs: AI Prompt — Next.js v16 + Supabase Auth](https://supabase.com/docs/guides/getting-started/ai-prompts/nextjs-supabase-auth) — exact code for createServerClient, middleware, browser client
- [Supabase Docs: Creating a Supabase client for SSR](https://supabase.com/docs/guides/auth/server-side/creating-a-client) — cookie config API (getAll/setAll)
- [Next.js Docs: Authentication Guide](https://nextjs.org/docs/app/guides/authentication) — Server Action login pattern, useActionState, Data Access Layer, route protection
- [Supabase Docs: Managing User Data](https://supabase.com/docs/guides/auth/managing-user-data) — user_metadata vs app_metadata distinction

### Secondary (MEDIUM confidence)
- [Supabase Discussion #32746: user role in middleware](https://github.com/orgs/supabase/discussions/32746) — confirmed `user.app_metadata.role` access pattern, verified against official docs
- [Supabase Discussion #1148: Custom claims for multi-tenancy](https://github.com/orgs/supabase/discussions/1148) — app_metadata security model for roles

### Tertiary (LOW confidence — not used for core patterns)
- [NextJS Middleware Auth Examples Discussion #34842](https://github.com/orgs/supabase/discussions/34842) — flagged as potential source of outdated patterns; not relied upon

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — verified against official Supabase SSR docs and Next.js auth guide
- Architecture patterns: HIGH — code examples from official Supabase AI prompt guide for Next.js 16
- Pitfalls: HIGH — sourced from official "never use getSession()" and "getAll/setAll only" warnings in official docs
- Property normalization: MEDIUM — reasonable approach, real data not yet validated (flagged in STATE.md as concern for Phase 3)

**Research date:** 2026-03-10
**Valid until:** 2026-06-10 (90 days — Supabase SSR API is stable; re-check if `@supabase/ssr` minor version changes)
