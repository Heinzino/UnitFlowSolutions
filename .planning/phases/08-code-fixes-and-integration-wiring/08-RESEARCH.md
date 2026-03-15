# Phase 8: Code Fixes & Integration Wiring - Research

**Researched:** 2026-03-15
**Domain:** Next.js 16 / React 19 — bug fixes, URL-driven state, navigation wiring
**Confidence:** HIGH

---

## Summary

Phase 8 closes three concrete gaps found in the v1.0 milestone audit. All three gaps exist in already-written code — this is a targeted repair phase, not a greenfield build. No new dependencies are needed. All fixes are 1–10 line changes to existing files.

**Gap 1 (VIZ-03):** `executive-kpis.tsx` passes `trends.activeJobsOpen` and `trends.avgTimeToComplete` to `KPICard` without `isGood: false`. The `TrendIndicator` component already supports the `isGood` prop and its logic is correct (`isPositive = isGood ? direction==="up" : direction==="down"`). The fix is adding `isGood: false` to the two trend objects at the call site.

**Gap 2 (DM-03):** `PropertySelectorWrapper` in `property-selector-wrapper.tsx` manages selection with `useState` only — it never pushes a URL param. `PMDashboard` already demonstrates the correct pattern: `useRouter` + `useSearchParams` + `router.push('/property?property=X')`. The header wrapper needs the same URL-push pattern.

**Gap 3 (UI-01):** Both `sidebar.tsx` and `bottom-tab-bar.tsx` define `navItems`/`tabItems` arrays with `href: "/"` for Dashboard and `href: "/settings"` for Settings. Dashboard should point to the role-appropriate route; the simplest fix is to change `href` to `/property` (the default landing for pm/rm) or remove the Dashboard nav item since Properties already links there. Settings has no route — the item should be removed from both nav arrays.

**Additionally:** `07-VERIFICATION.md` contains an incorrect claim (Truth #3, line 41-42) asserting `isGood=false` was already passed in `executive-kpis.tsx`. This claim was written optimistically and does not match the actual code. The verification document must be corrected.

**Primary recommendation:** Fix all three gaps in a single focused plan with four tasks: (1) fix executive-kpis.tsx trend props, (2) fix PropertySelectorWrapper to push URL, (3) fix nav item hrefs/removals, (4) correct 07-VERIFICATION.md.

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| VIZ-03 | Trend indicators on KPI cards (arrow up/down + percentage + color) | `TrendIndicator` already accepts `isGood?: boolean`; `KPICard` already passes it through. Fix is adding `isGood: false` to two `trend` prop objects in `executive-kpis.tsx` lines 44 and 66. |
| DM-03 | RM users with multiple properties see PropertySelector dropdown in header for multi-property access | `PMDashboard` already implements the correct URL-push pattern. `PropertySelectorWrapper` needs identical `useRouter`/`useSearchParams` wiring replacing the current `useState`-only implementation. |
| UI-01 | THEME.md color palette applied — but audit also surfaced nav href bugs under this requirement | Dashboard `href="/"` causes extra middleware redirect; Settings `href="/settings"` produces 404. Both `sidebar.tsx` and `bottom-tab-bar.tsx` need their nav arrays corrected. |
</phase_requirements>

---

## Standard Stack

No new libraries required. All fixes use existing project dependencies.

### Core (already installed)
| Library | Version | Purpose | Relevant to Phase 8 |
|---------|---------|---------|---------------------|
| next | 16.1.6 | App framework, routing | `useRouter`, `useSearchParams`, `router.push` for URL-driven selector |
| react | 19.2.3 | UI runtime | `useState` already in wrapper — to be replaced with URL pattern |
| typescript | ^5 | Type checking | No new types needed |
| vitest | ^4.0.18 | Test runner | `npm test` — quick run command |

**Installation:** No new packages needed.

---

## Architecture Patterns

### Pattern 1: URL-Driven Property Selection (already proven in PMDashboard)

**What:** Client component reads `?property=` search param via `useSearchParams()`, pushes updates via `router.push()`. Server component reads `searchParams` prop and passes filtered data to children. Suspense `key` on `?property` value forces server component remount when filter changes.

**When to use:** Any client selector that must scope server-fetched data.

**The working pattern (from `pm-dashboard.tsx`):**
```typescript
// Source: src/app/(dashboard)/property/_components/pm-dashboard.tsx
'use client';
import { useRouter, useSearchParams } from 'next/navigation';

const router = useRouter();
const searchParams = useSearchParams();
const selectedProperty = searchParams.get('property') ?? '';

function handleSelect(value: string) {
  const params = new URLSearchParams(searchParams.toString());
  if (value === 'All Properties' || value === '') {
    params.delete('property');
  } else {
    params.set('property', value);
  }
  router.push(`/property${params.toString() ? `?${params.toString()}` : ''}`);
}
```

**The broken pattern (current `property-selector-wrapper.tsx`):**
```typescript
// Source: src/components/layout/property-selector-wrapper.tsx
// BUG: useState only — selection never reaches URL, server never rescopes
const [selectedProperty, setSelectedProperty] = useState<string>(properties[0] ?? '');
return <PropertySelector ... onSelect={setSelectedProperty} />;
```

**The fix:** Replace `useState` + `setSelectedProperty` with `useRouter` + `useSearchParams` + `router.push('/property?property=X')`. The wrapper already receives `properties: string[]` from the server component `UserHeader`. No prop interface changes needed.

**Important constraint:** The header `PropertySelectorWrapper` must push to `/property` (the same route that reads `searchParams`). It does not need to know the current route — it always scopes the `/property` page.

### Pattern 2: isGood Prop for Inverted Trend Semantics

**What:** `TrendIndicator` accepts `isGood?: boolean` (default `true`). When `isGood=false`, an upward arrow is red (`text-negative`) and a downward arrow is green (`text-positive`). Used for metrics where higher values are worse.

**The TrendIndicator logic (confirmed correct — no changes needed here):**
```typescript
// Source: src/components/ui/trend-indicator.tsx
const isPositive = isGood ? direction === "up" : direction === "down";
const colorClass = isPositive ? "text-positive" : "text-negative";
```

**The broken call sites in `executive-kpis.tsx`:**
```typescript
// Line 44 — Active Jobs Open (higher = worse): MISSING isGood: false
trend={trends.activeJobsOpen ?? undefined}

// Line 66 — Avg Time to Complete (higher = worse): MISSING isGood: false
trend={trends.avgTimeToComplete ?? undefined}
```

**The fix (two lines changed):**
```typescript
// Line 44
trend={trends.activeJobsOpen ? { ...trends.activeJobsOpen, isGood: false } : undefined}

// Line 66
trend={trends.avgTimeToComplete ? { ...trends.avgTimeToComplete, isGood: false } : undefined}
```

The `KPICard` trend prop type is `{ direction: "up" | "down"; percentage: number; isGood?: boolean }` — spreading and adding `isGood: false` is type-safe.

### Pattern 3: Nav Item Correction

**What:** Static `navItems` / `tabItems` arrays in `sidebar.tsx` and `bottom-tab-bar.tsx` need href corrections.

**Current state:**
```typescript
// sidebar.tsx and bottom-tab-bar.tsx — identical arrays
const navItems = [
  { icon: LayoutDashboard, label: "Dashboard", href: "/" },      // BAD: redirect
  { icon: Building2,       label: "Properties", href: "/property" }, // OK
  { icon: Users,           label: "Vendors",    href: "/vendors" },  // OK
  { icon: Settings,        label: "Settings",   href: "/settings" }, // BAD: 404
];
```

**Fix options for Dashboard item:**
- Option A: Change `href` to `/property` — consistent with the default landing for all roles
- Option B: Remove the Dashboard nav item entirely — Properties already covers it

**Fix options for Settings item:**
- Option A: Remove the Settings item entirely — no route exists, no v1 requirement for it
- Option B: Keep it but disable it — adds complexity for no value

**Recommended fix:** Remove both Dashboard and Settings items from both `sidebar.tsx` and `bottom-tab-bar.tsx`. This leaves three functional nav items: Properties (`/property`), Vendors (`/vendors`), and the Logout button (sidebar) / no logout in bottom tab bar. If removing Dashboard feels wrong, change it to `/property` instead of removing — but the audit just says the `href="/"` redirect is bad, not that the item itself must exist.

**Note on `Settings` import:** Both files import `Settings` from `lucide-react`. Removing the nav item means removing the import too to avoid TypeScript unused-import lint warnings (or the project's ESLint `no-unused-vars` may flag it).

### Anti-Patterns to Avoid

- **Do not add new state to `PropertySelectorWrapper`** — the URL is the single source of truth; useState causes split-brain between header and page selector.
- **Do not change `TrendIndicator` or `computeKPITrends`** — both are correct. Only the call site in `executive-kpis.tsx` needs fixing.
- **Do not add an `isGood` field to the `TrendData` type in `executive-kpis.ts`** — `TrendData` is a pure data type returned by the computation layer. The `isGood` semantic belongs to the presentation layer (`executive-kpis.tsx`), not the data layer. This keeps the compute functions reusable.
- **Do not add a `/settings` route as a fix** — that is out of scope for Phase 8. Remove the nav item.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| URL state management | Custom event bus, context, or prop drilling | `useRouter` + `useSearchParams` (Next.js built-in) | Already used correctly in `PMDashboard`; consistent pattern across the app |
| isGood spreading | New computed field in `TrendData` or separate prop | Spread at call site: `{ ...trend, isGood: false }` | Keeps data and presentation layers separate; no type changes needed |

---

## Common Pitfalls

### Pitfall 1: Forgetting `'use client'` on PropertySelectorWrapper after adding hooks

**What goes wrong:** `useRouter` and `useSearchParams` are client-only hooks. The file already has `'use client'` at the top. Do not accidentally remove it.
**How to avoid:** Confirm `'use client'` remains on line 1 after editing.

### Pitfall 2: Null-checking TrendData before spreading

**What goes wrong:** `trends.activeJobsOpen` is `TrendData = { direction, percentage } | null`. Spreading null crashes. The existing pattern `trends.activeJobsOpen ?? undefined` handles null by passing `undefined` to `trend`. The fix must preserve this null-guard while adding `isGood: false` only when the trend is non-null.
**How to avoid:** Use the ternary form: `trends.activeJobsOpen ? { ...trends.activeJobsOpen, isGood: false } : undefined`

### Pitfall 3: PropertySelectorWrapper pushing to wrong route

**What goes wrong:** If the header selector pushes to the current pathname instead of `/property`, an exec user on `/executive` who switches property would push to `/executive?property=X`, which the executive page does not read.
**How to avoid:** Hard-code `/property` as the destination in the header wrapper. The header selector is only shown to RM users who land on `/property`. The `UserHeader` server component conditionally renders `PropertySelectorWrapper` only when `role === 'rm'` (multi-property), so it is always in the context of the PM/RM property dashboard.

### Pitfall 4: Test for isGood behavior is missing

**What goes wrong:** No test currently verifies that `executive-kpis.tsx` passes `isGood: false`. The existing test file (`executive-kpis.test.ts`) tests the compute functions, not the component. The fix should add a test in the component or a separate integration test — but since `executive-kpis.tsx` is a server component, a render test requires React's `renderToString` or a smoke test pattern.
**How to avoid:** Add a plain TypeScript assertion or snapshot test verifying the `isGood` value is present in the rendered props. Alternatively, the correction to `07-VERIFICATION.md` (correcting the false claim) serves as the documentation fix; a code review of the diff is sufficient for this targeted fix.

### Pitfall 5: Incorrect active state in sidebar after removing Dashboard item

**What goes wrong:** `Sidebar` and `BottomTabBar` use `activePath === item.href` to highlight the active item. If Dashboard (`href="/"`) was active when visiting `/property`, removing it means no "active" class was being set anyway — so there is no visual regression.
**How to avoid:** Verify that Properties (`href="/property"`) correctly highlights when `activePath === '/property'`. It already does.

---

## Code Examples

### Fix 1: executive-kpis.tsx — Add isGood: false to two trend props

```typescript
// Source: src/app/(dashboard)/executive/_components/executive-kpis.tsx
// Lines 40-67 — the two changed lines are 44 and 66

<KPICard
  icon={Briefcase}
  label="Active Jobs Open"
  value={kpis.activeJobsOpen}
  trend={trends.activeJobsOpen ? { ...trends.activeJobsOpen, isGood: false } : undefined}
/>

<KPICard
  icon={Clock}
  label="Avg Time to Complete"
  value={avgTimeDisplay}
  trend={trends.avgTimeToComplete ? { ...trends.avgTimeToComplete, isGood: false } : undefined}
/>
```

### Fix 2: property-selector-wrapper.tsx — Replace useState with URL push

```typescript
// Source: src/components/layout/property-selector-wrapper.tsx
'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { PropertySelector } from './property-selector';

interface PropertySelectorWrapperProps {
  properties: string[];
}

export function PropertySelectorWrapper({ properties }: PropertySelectorWrapperProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const selectedProperty = searchParams.get('property') ?? properties[0] ?? '';

  function handleSelect(value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value === '' || value === properties[0]) {
      params.delete('property');
    } else {
      params.set('property', value);
    }
    router.push(`/property${params.toString() ? `?${params.toString()}` : ''}`);
  }

  return (
    <PropertySelector
      properties={properties}
      selectedProperty={selectedProperty}
      onSelect={handleSelect}
    />
  );
}
```

### Fix 3: sidebar.tsx and bottom-tab-bar.tsx — Remove broken nav items

```typescript
// sidebar.tsx — remove Dashboard (href="/") and Settings (href="/settings") items
// Remove Settings import from lucide-react if unused
const navItems: NavItem[] = [
  { icon: Building2, label: "Properties", href: "/property" },
  { icon: Users, label: "Vendors", href: "/vendors" },
];
```

```typescript
// bottom-tab-bar.tsx — same removal
// Remove Settings import from lucide-react if unused
const tabItems: TabItem[] = [
  { icon: Building2, label: "Properties", href: "/property" },
  { icon: Users, label: "Vendors", href: "/vendors" },
];
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `useRouter` + `push` required `next/router` (Pages Router) | `useRouter` + `useSearchParams` from `next/navigation` (App Router) | Next.js 13 App Router | Already used correctly in PMDashboard; same pattern applies to wrapper fix |

---

## Open Questions

1. **Should Dashboard nav item become `/property` or be removed?**
   - What we know: The audit says `href="/"` causes an unnecessary redirect. It does not say the nav item itself should be removed.
   - What's unclear: Whether the user wants a "Dashboard" shortcut or if Properties is sufficient.
   - Recommendation: Remove both Dashboard and Settings. The sidebar already has three functional items (Properties, Vendors, Logout button). A "Dashboard" nav item pointing to `/property` is redundant with the Properties item. If the user disagrees during review, adding it back to `/property` is trivial.

2. **Should PropertySelectorWrapper also work when the user is already on `/property` with a property selected?**
   - What we know: `useSearchParams` reads the current URL's params. When the user is at `/property?property=Sunrise`, `searchParams.get('property')` returns `'Sunrise'`, correctly showing the active selection.
   - What's unclear: None — the URL-sync pattern handles this naturally.
   - Recommendation: No special handling needed.

---

## Validation Architecture

> `workflow.nyquist_validation` is `true` in `.planning/config.json` — section included.

### Test Framework

| Property | Value |
|----------|-------|
| Framework | vitest ^4.0.18 |
| Config file | `vitest.config.ts` (project root) |
| Quick run command | `npm test -- --reporter=verbose` |
| Full suite command | `npm test` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| VIZ-03 | `isGood: false` present on activeJobsOpen and avgTimeToComplete trend props | unit (prop inspection) | `npm test -- executive-kpis` | ❌ Wave 0 — new test needed in existing file |
| DM-03 | PropertySelectorWrapper calls router.push with ?property= param | unit (mock router) | `npm test -- property-selector-wrapper` | ❌ Wave 0 — new test file |
| UI-01 | Sidebar navItems has no href="/" and no href="/settings" | unit (static check) | `npm test -- sidebar` | ❌ Wave 0 — new test file |

**Note:** The VIZ-03 test can be added to the existing `executive-kpis.test.ts` as a new `describe` block testing the component output (or as a standalone assertion on the prop values passed). Given that `executive-kpis.tsx` is a server component, the simplest test approach is to verify the spread produces the correct shape: a pure object test on `{ ...trend, isGood: false }` semantics, not a render test.

**Simplest viable test for VIZ-03:** In `executive-kpis.test.ts`, add a test that verifies when `computeKPITrends` returns a non-null `activeJobsOpen`, the spread `{ ...trend, isGood: false }` has `isGood === false`. This is a pure data test, no rendering required.

### Sampling Rate

- **Per task commit:** `npm test`
- **Per wave merge:** `npm test`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps

- [ ] Add `describe('isGood prop semantics')` block to `src/lib/kpis/executive-kpis.test.ts` — covers VIZ-03
- [ ] `src/components/layout/__tests__/property-selector-wrapper.test.tsx` — covers DM-03, mocks `next/navigation`
- [ ] `src/components/layout/__tests__/sidebar.test.tsx` — covers UI-01 nav href correctness

---

## Sources

### Primary (HIGH confidence)

- Direct code inspection — `src/app/(dashboard)/executive/_components/executive-kpis.tsx` (lines 44, 66)
- Direct code inspection — `src/components/layout/property-selector-wrapper.tsx` (full file)
- Direct code inspection — `src/components/ui/trend-indicator.tsx` (isGood logic)
- Direct code inspection — `src/components/ui/kpi-card.tsx` (trend prop type)
- Direct code inspection — `src/lib/kpis/executive-kpis.ts` (TrendData type)
- Direct code inspection — `src/components/layout/sidebar.tsx` and `bottom-tab-bar.tsx` (navItems arrays)
- Direct code inspection — `src/app/(dashboard)/property/_components/pm-dashboard.tsx` (URL-push reference implementation)
- `.planning/v1.0-MILESTONE-AUDIT.md` — authoritative gap list with file/line references

### Secondary (MEDIUM confidence)

- Next.js 16 App Router docs (prior knowledge) — `useRouter`, `useSearchParams` from `next/navigation` are stable App Router APIs; no breaking changes expected

### Tertiary (LOW confidence)

- None

---

## Metadata

**Confidence breakdown:**
- Gap identification: HIGH — gaps directly verified against source code; audit is precise
- Fix approach (VIZ-03): HIGH — TrendIndicator logic confirmed correct; only call site needs change
- Fix approach (DM-03): HIGH — PMDashboard provides exact reference implementation in same codebase
- Fix approach (UI-01): HIGH — static array change with no runtime complexity
- Test strategy: MEDIUM — server component test approach requires care; pure data test recommended

**Research date:** 2026-03-15
**Valid until:** 2026-04-15 (stable Next.js App Router APIs, no fast-moving dependencies)
