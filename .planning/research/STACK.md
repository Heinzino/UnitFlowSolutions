# Technology Stack

**Project:** UnitFlowSolutions (ScheduleSimple) — Property Management Turnover Dashboard
**Researched:** 2026-03-08
**Verification note:** WebSearch and WebFetch were unavailable during research. Version numbers are based on training data (cutoff ~May 2025). Verify exact latest versions with `npm view <package> version` before scaffolding.

---

## Recommended Stack

### Core Framework

| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| Next.js | ^15.1 | Full-stack framework, App Router, Server Components, Server Actions | Already decided in PROJECT.md. App Router provides server-side Airtable access, `unstable_cache` for caching, Server Actions for mutations, and native Vercel deployment. v15 stabilized many App Router APIs. | HIGH |
| TypeScript | ^5.6 | Type safety | Catch Airtable field name typos at compile time. Essential for mapping 9 Airtable tables to typed interfaces. | HIGH |
| React | ^19.0 | UI library (bundled with Next.js 15) | Next.js 15 ships with React 19. Server Components are first-class. `use()` hook available for data patterns. | HIGH |

### Authentication

| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| @supabase/supabase-js | ^2.45 | Supabase client SDK | Already decided. Handles auth state, session management, and querying the `user_profiles` table for role mapping. | MEDIUM (verify version) |
| @supabase/ssr | ^0.5 | Server-side auth for Next.js App Router | Required for cookie-based session management in Server Components and middleware. Replaces the deprecated `@supabase/auth-helpers-nextjs`. | MEDIUM (verify version) |

### Data Source

| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| airtable | ^0.12 | Official Airtable SDK | Already decided. Provides typed access to Airtable REST API with pagination handling (`.eachPage()`), formula filtering, and field selection. The official SDK is the safest choice for staying compatible with Airtable API changes. | MEDIUM (verify version) |

**Important note on the `airtable` npm package:** The official SDK is adequate but has quirks. It uses a callback-based API (`.eachPage()`) rather than async/await natively. Wrap it in Promise-based helpers early. The alternative is raw `fetch` against `https://api.airtable.com/v0/`, which gives you full control over request/response handling and works better with Next.js caching. See "Alternatives Considered" below.

### Styling

| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| Tailwind CSS | ^3.4 or ^4.0 | Utility-first CSS | Already decided in PLAN.md. Fast iteration on the custom THEME.md design tokens. Excellent with Server Components (no runtime CSS-in-JS needed). If scaffolding with `create-next-app`, Tailwind v4 may be the default -- use whichever version the scaffolding installs. | MEDIUM (v4 may be default by now) |

**Tailwind v3 vs v4 decision:** Tailwind v4 was released in early 2025 with a new CSS-first configuration model (no `tailwind.config.ts`). If `create-next-app` scaffolds v4, use it -- the new `@theme` directive in CSS replaces the config file and is simpler for custom tokens. If it scaffolds v3, that is also fine. Do NOT manually downgrade or upgrade; use what the scaffolding provides.

### Charting & Visualization

| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| Recharts | ^2.13 | Bar charts, gauges, data visualization | Already decided in PLAN.md. Built on D3 + React. Handles the vendor bar charts and KPI visualizations. Lightweight enough for this use case. Supports responsive containers out of the box. | MEDIUM (verify version) |

### Icons

| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| lucide-react | ^0.460 | Icon library | Already decided in PLAN.md. Tree-shakeable, consistent rounded style that matches THEME.md's "approachable" icon direction. Better than Heroicons for this design language. | MEDIUM (verify version) |

### Fonts

| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| next/font (Plus Jakarta Sans) | bundled | Heading font | Use `next/font/google` for zero-layout-shift font loading. Plus Jakarta Sans is the geometric rounded sans specified in THEME.md. | HIGH |
| next/font (Geist) | bundled | Body/data font | Geist is Vercel's own font, available via `next/font/local` or the `geist` npm package. Clean, legible at small sizes. Perfect for data tables and numbers. `create-next-app` may include it by default. | HIGH |

### Infrastructure

| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| Vercel | N/A | Hosting & deployment | Already decided. Zero-config Next.js deployment. Edge middleware for auth. ISR/caching built in. Free tier easily handles 6-15 users. | HIGH |
| Supabase (hosted) | N/A | Auth provider + user_profiles DB | Already set up per PROJECT.md. Free tier handles this user volume. Only stores auth and role data, not business data. | HIGH |
| Airtable (existing) | N/A | Business data source of truth | Existing base with 9 tables. No changes to schema. Dashboard reads/writes via REST API. | HIGH |

### Supporting Libraries

| Library | Version | Purpose | When to Use | Confidence |
|---------|---------|---------|-------------|------------|
| clsx | ^2.1 | Conditional CSS class merging | Every component that conditionally applies Tailwind classes (status badges, alert cards, active states). Tiny (228B). | HIGH |
| tailwind-merge | ^2.5 | Tailwind class conflict resolution | Combine with clsx in a `cn()` utility. Prevents `p-4 p-6` conflicts when merging component props with defaults. | HIGH |
| date-fns | ^4.1 | Date formatting and calculation | Computing overdue status, "days until target", "last 30 days" filters, relative time displays. Lighter than dayjs for tree-shaking. | MEDIUM (verify version) |
| zod | ^3.23 | Runtime validation | Validate Airtable API responses (schema can drift), validate Server Action inputs, and type-narrow user profile data from Supabase. | HIGH |

### Dev Dependencies

| Library | Version | Purpose | Confidence |
|---------|---------|---------|------------|
| eslint | ^9.0 | Linting (flat config) | HIGH |
| eslint-config-next | ^15.1 | Next.js ESLint rules | HIGH |
| prettier | ^3.4 | Code formatting | HIGH |
| prettier-plugin-tailwindcss | ^0.6 | Auto-sort Tailwind classes | HIGH |

---

## Alternatives Considered

| Category | Recommended | Alternative | Why Not |
|----------|-------------|-------------|---------|
| Airtable client | `airtable` npm SDK | Raw `fetch` to Airtable REST API | The SDK handles pagination automatically via `.eachPage()` and field type coercion. However, if you find the SDK's callback API awkward with Next.js caching, switching to raw `fetch` is a valid Phase 1 decision. Raw fetch gives you native `next: { revalidate: 60, tags: [...] }` cache control. **Either approach works -- pick one and commit.** |
| UI components | Hand-built primitives | shadcn/ui | The THEME.md design language is highly custom (forest green bg, 16px radius cards, chartreuse CTAs). Installing shadcn/ui then overriding everything adds indirection. For ~10 components, hand-building to spec is faster and produces cleaner code. Exception: if you want shadcn's Dialog/Dropdown primitives for the notification panel drawer, install individual components a la carte. |
| State management | Server Components + Server Actions | React Query / SWR | With ~60s cache revalidation and Server Components doing all data fetching, client-side caching is unnecessary. The 6-15 user base does not need optimistic updates or real-time sync. Server Actions with `revalidateTag()` handle the write-then-refresh cycle cleanly. |
| CSS framework | Tailwind CSS | CSS Modules / Styled Components | CSS-in-JS has runtime cost and does not work in Server Components. CSS Modules work but lack the speed of utility classes for rapid prototyping. Tailwind is the clear winner for this stack. |
| Charts | Recharts | visx / Nivo / Chart.js | Recharts has the simplest API for the chart types needed (bar chart, gauge). visx is more flexible but requires more D3 knowledge. Nivo is heavier. Chart.js requires a wrapper for React. For 2-3 chart components, Recharts is right-sized. |
| Icons | lucide-react | Heroicons / Phosphor | Lucide's rounded style matches THEME.md better than Heroicons' sharper aesthetic. Phosphor is comparable but less widely adopted in the Next.js ecosystem. |
| Date library | date-fns | dayjs / Temporal API | dayjs is fine too -- the difference is marginal. date-fns tree-shakes better. Temporal API is not yet broadly available without polyfills. |
| Form validation | zod | yup / joi | Zod has first-class TypeScript inference. Server Actions benefit from `z.parse()` for input validation. Yup is fine but Zod is the ecosystem standard with Next.js. |
| Auth library | @supabase/ssr | NextAuth.js | Supabase is already set up. NextAuth adds unnecessary complexity when Supabase handles the full auth flow. |

---

## What NOT to Use

| Technology | Why Not |
|------------|---------|
| Prisma / Drizzle | No local database. Airtable is the sole data source. ORMs have no role here. |
| tRPC | Overkill for this architecture. Server Components fetch data directly; Server Actions handle mutations. No API layer to type. |
| Redux / Zustand | No complex client state. Server Components handle data; the only client state is UI toggles (drawer open, filter selection) which `useState` handles fine. |
| Socket.io / Pusher | No real-time requirements. 60s cache revalidation is sufficient for 6-15 users checking periodically. |
| Storybook | The component count (~15-20) does not justify the setup overhead. Test components in the actual app during development. |
| Docker | Vercel handles deployment. No need to containerize a Next.js app deployed to Vercel. |
| @tanstack/react-table | The tables in this app are simple (5-8 columns, <100 rows). A hand-built `<table>` with Tailwind is simpler and more maintainable than wiring up TanStack for basic sort/filter. |
| next-auth / Auth.js | Supabase already provides auth. Adding another auth layer creates confusion about which system is authoritative. |

---

## Installation

```bash
# Scaffold (use latest create-next-app, accept defaults for App Router + TypeScript + Tailwind + src directory)
npx create-next-app@latest . --typescript --tailwind --eslint --app --src-dir

# Core dependencies
npm install @supabase/supabase-js @supabase/ssr airtable recharts lucide-react

# Utility libraries
npm install clsx tailwind-merge date-fns zod

# Dev dependencies
npm install -D prettier prettier-plugin-tailwindcss

# Fonts (Geist may already be included by create-next-app)
npm install geist
```

### Environment Variables (`.env.local`)

```
# Supabase (public -- used by browser client)
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# Airtable (server-only -- NEVER prefix with NEXT_PUBLIC_)
AIRTABLE_API_KEY=your-pat-token
AIRTABLE_BASE_ID=your-base-id
```

### Utility Setup (`src/lib/utils.ts`)

```typescript
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

---

## Airtable SDK vs Raw Fetch Decision

This deserves explicit guidance because it affects the entire data layer architecture.

### Option A: Official `airtable` SDK (Recommended for starting)
```typescript
import Airtable from 'airtable';
const base = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY })
  .base(process.env.AIRTABLE_BASE_ID!);

// Callback-based pagination -- wrap in a Promise
async function getAllRecords(tableName: string, options?: object) {
  const records: any[] = [];
  await base(tableName).select(options).eachPage((page, fetchNextPage) => {
    records.push(...page);
    fetchNextPage();
  });
  return records;
}
```
**Pro:** Handles pagination, retries, field type mapping.
**Con:** Callback API does not integrate with Next.js `fetch` caching natively. You must use `unstable_cache` wrapper instead of `next: { revalidate }`.

### Option B: Raw `fetch` (Consider if caching feels awkward)
```typescript
async function airtableFetch(table: string, params?: URLSearchParams) {
  const url = `https://api.airtable.com/v0/${process.env.AIRTABLE_BASE_ID}/${encodeURIComponent(table)}?${params}`;
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${process.env.AIRTABLE_API_KEY}` },
    next: { revalidate: 60, tags: [`airtable-${table.toLowerCase()}`] },
  });
  return res.json();
}
```
**Pro:** Native Next.js fetch caching with `revalidate` and `tags`. No `unstable_cache` needed.
**Con:** Must handle pagination manually (check for `offset` in response, loop until done). Must handle rate limiting yourself.

### Recommendation
Start with the official SDK + `unstable_cache` wrapper as specified in PLAN.md. The SDK's pagination handling saves significant boilerplate for tables like Jobs that may have 100+ records. If `unstable_cache` behavior becomes problematic (it has been evolving in Next.js 15), switch to raw fetch.

---

## Caching Architecture Decision

The PLAN.md specifies `unstable_cache` with 60s revalidation and tag-based busting. This is the correct approach given the constraints.

**Why `unstable_cache` over `fetch` caching:**
- The Airtable SDK uses its own HTTP client internally, not Next.js `fetch`. So Next.js automatic fetch deduplication and caching do not apply.
- `unstable_cache` wraps any async function (including SDK calls) with file-system or in-memory caching.
- Tag-based revalidation via `revalidateTag()` in Server Actions provides instant cache-busting on writes.

**Note on naming:** Despite the `unstable_` prefix, this API has been stable in practice since Next.js 14. Next.js 15 may have renamed it to `cacheLife` / `cacheTag` or stabilized it as `cache()`. Verify the current API name when scaffolding.

---

## Version Verification Checklist

Run these commands before committing to versions:

```bash
npm view next version           # Expected: 15.x
npm view @supabase/supabase-js version  # Expected: 2.x
npm view @supabase/ssr version  # Expected: 0.5.x (may have reached 1.0)
npm view airtable version       # Expected: 0.12.x
npm view recharts version       # Expected: 2.x
npm view lucide-react version   # Expected: 0.4xx+
npm view tailwindcss version    # Expected: 3.4.x or 4.x
npm view date-fns version       # Expected: 4.x
npm view zod version            # Expected: 3.x
```

---

## Sources

- PROJECT.md and PLAN.md (project decisions already made)
- THEME.md (design language constraints)
- Training data knowledge of Next.js 15, Supabase, Airtable SDK, and React ecosystem (cutoff ~May 2025)
- **LOW confidence on exact version numbers** -- must verify with `npm view` before installation
- **HIGH confidence on library choices** -- these are the standard, well-established tools for this exact stack
