# Phase 1: Scaffolding and Design System - Research

**Researched:** 2026-03-08
**Domain:** Next.js project setup, Tailwind CSS theming, component library architecture
**Confidence:** HIGH

## Summary

Phase 1 is a greenfield scaffolding phase: create a Next.js application with a custom theme from THEME.md, build 10 reusable UI components using Radix UI primitives, and implement a responsive layout shell. No data fetching, no authentication -- purely the visual foundation every subsequent phase builds on.

The current stable version of Next.js is **16.1** (released December 2025). It ships with Turbopack as the default bundler, React 19.2, and the App Router. Tailwind CSS **v4** uses a CSS-first configuration model via `@theme` directives rather than the old `tailwind.config.js` file. Radix UI now ships as a **single `radix-ui` package** with namespace imports. Lucide React provides the rounded, outlined icon set that matches THEME.md's iconography guidelines.

**Primary recommendation:** Use `create-next-app@latest` (Next.js 16), Tailwind CSS v4 with CSS-first `@theme` configuration, Radix UI for accessible primitives, and Lucide React for icons. Define all THEME.md design tokens as Tailwind theme variables in `globals.css`.

<user_constraints>

## User Constraints (from CONTEXT.md)

### Locked Decisions
- Minimal icon-only sidebar with no text labels -- tooltips on hover for context
- Universal icon set for all roles (same icons regardless of PM/DM/Exec). Role-gating handled at page level, not sidebar level
- Sidebar icons: Dashboard, Properties, Vendors, Notifications, Settings, Logout
- Active state: filled green circle background per THEME.md
- No notification column (middle column) until Phase 7 -- two-column layout (sidebar + main) for now
- On mobile (<768px): sidebar icons move to a floating bottom tab bar with rounded corners and gap from screen edge, active tab highlighted with emerald fill
- Radix UI primitives (dropdowns, tooltips, dialogs) with custom Tailwind styling -- accessibility out of the box
- No shadcn/ui, no full component framework
- 10 required components: Button, Card, KPICard, Badge, Table, Input, Skeleton, StatusBadge, TrendIndicator, CurrencyDisplay
- Dev-only demo page at /components route to showcase all components with sample data (removed before production)
- StatusBadge: Filled pill style with solid colored background and white text; Status colors: green (Completed/Ready), red (NEEDS ATTENTION), yellow (Blocked), blue (In Progress)
- Table: No heavy borders, subtle row dividers, rows highlight on hover (subtle green tint), clicking a row navigates to detail view, on mobile transforms into stacked card list
- KPI Cards: dark square icon badge top-left, large bold number, trend arrow + percentage below, alert cards use colored background fill (pink for past target, yellow for trending past target), built-in loading prop renders Skeleton
- Responsive Breakpoints: Desktop (1280px+) icon sidebar + main, Tablet (768-1279px) same as desktop, Mobile (<768px) floating bottom tab bar, KPI cards stack vertically, tables become card lists

### Claude's Discretion
- Exact icon choices (Lucide, Heroicons, or similar rounded icon set)
- Skeleton animation style and timing
- Card shadow depth and border-radius fine-tuning within THEME.md's 16px guideline
- Button variant system (primary, secondary, ghost, etc.)
- Input field styling details
- Demo page layout and organization
- TrendIndicator and CurrencyDisplay component internals

### Deferred Ideas (OUT OF SCOPE)
None -- discussion stayed within phase scope

</user_constraints>

<phase_requirements>

## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| UI-01 | THEME.md color palette applied (forest green background, white cards, emerald accents) | Tailwind v4 @theme directive maps all THEME.md hex values to CSS variables; use custom color namespace |
| UI-02 | Plus Jakarta Sans for headings, Geist for body text, tabular-nums for statistics | next/font/google for Plus Jakarta Sans, geist npm package for Geist font, font-variant-numeric: tabular-nums via Tailwind |
| UI-03 | Reusable component library: Button, Card, KPICard, Badge, Table, Input, Skeleton, StatusBadge, TrendIndicator, CurrencyDisplay | Radix UI primitives for accessible foundations; custom Tailwind styling per THEME.md; all 10 components documented |
| UI-04 | Layout shell: narrow icon sidebar + main content area (two-column for now per CONTEXT.md) | Next.js App Router layout.tsx with CSS grid/flex; sidebar as fixed-width column; Radix Tooltip for icon labels |
| UI-05 | Responsive layout -- desktop/tablet sidebar + main, mobile bottom tab bar + stacked cards | Tailwind responsive prefixes (md:, lg:); conditional rendering or CSS-only approach for bottom tab bar |

</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| next | 16.x (latest) | Full-stack React framework | App Router, Server Components, Turbopack default, Vercel deployment target |
| react / react-dom | 19.x | UI library | Ships with Next.js 16, required |
| tailwindcss | 4.x | Utility-first CSS | CSS-first config with @theme, 70% smaller output than v3, standard for Next.js |
| @tailwindcss/postcss | 4.x | PostCSS plugin for Tailwind v4 | Required for Tailwind v4 integration |
| postcss | latest | CSS processing | Required by Tailwind v4 |
| typescript | 5.x | Type safety | Next.js 16 requires TypeScript 5.1+ |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| radix-ui | latest | Accessible UI primitives (Tooltip, DropdownMenu, Dialog) | Sidebar tooltips, any dropdown/dialog needs; provides WAI-ARIA compliance |
| lucide-react | 0.577+ | Rounded outlined icons | Sidebar icons, KPI card icons, all iconography per THEME.md's "rounded, outlined" style |
| geist | latest | Geist font package | Body text font; integrates with next/font |
| clsx | latest | Conditional className merging | Component variant logic, combining Tailwind classes conditionally |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Lucide React | Heroicons | Lucide has more icons (1500+), rounded style matches THEME.md better, actively maintained |
| clsx | tailwind-merge | tailwind-merge resolves conflicts but adds 3KB; clsx sufficient for this use case |
| Radix UI | Headless UI | Radix has more primitives, better compound component API, single package install |

**Installation:**
```bash
npx create-next-app@latest unit-flow-solutions --typescript --app --tailwind --eslint
cd unit-flow-solutions
npm install radix-ui lucide-react geist clsx
```

Note: `create-next-app` in Next.js 16 scaffolds with Tailwind CSS v4 by default (CSS-first config, no tailwind.config.js). If the scaffold generates Tailwind v3 config, manually upgrade per the Tailwind v4 guide.

## Architecture Patterns

### Recommended Project Structure
```
src/
├── app/
│   ├── layout.tsx           # Root layout: fonts, theme wrapper, sidebar
│   ├── page.tsx             # Landing/redirect (placeholder)
│   ├── globals.css          # Tailwind import + @theme config with THEME.md tokens
│   └── components/
│       └── page.tsx         # Dev-only component demo page
├── components/
│   ├── ui/                  # Primitive UI components
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── kpi-card.tsx
│   │   ├── badge.tsx
│   │   ├── table.tsx
│   │   ├── input.tsx
│   │   ├── skeleton.tsx
│   │   ├── status-badge.tsx
│   │   ├── trend-indicator.tsx
│   │   └── currency-display.tsx
│   └── layout/              # Layout components
│       ├── sidebar.tsx      # Icon-only sidebar with tooltips
│       ├── bottom-tab-bar.tsx # Mobile floating tab bar
│       └── app-shell.tsx    # Main layout shell combining sidebar + content
└── lib/
    └── utils.ts             # cn() helper using clsx
```

### Pattern 1: Tailwind v4 CSS-First Theme Configuration
**What:** Define all design tokens from THEME.md as Tailwind theme variables directly in CSS using the `@theme` directive.
**When to use:** Always -- this replaces tailwind.config.js in v4.

```css
/* src/app/globals.css */
@import "tailwindcss";

@theme {
  /* Colors from THEME.md */
  --color-forest: #0F4A2A;
  --color-forest-light: #1a6b3d;
  --color-emerald: #22C55E;
  --color-emerald-dark: #16A34A;
  --color-chartreuse: #CAEF45;
  --color-card: #FFFFFF;
  --color-text-primary: #111827;
  --color-text-secondary: #6B7280;
  --color-positive: #22C55E;
  --color-negative: #EF4444;
  --color-link: #14B8A6;
  --color-status-ready: #22C55E;
  --color-status-attention: #EF4444;
  --color-status-blocked: #EAB308;
  --color-status-progress: #3B82F6;
  --color-alert-past-target: #FDE2E7;
  --color-alert-trending: #FEF3C7;

  /* Typography -- font families set via CSS variables from next/font */
  --font-heading: var(--font-plus-jakarta-sans);
  --font-body: var(--font-geist-sans);

  /* Spacing / Radius */
  --radius-card: 16px;
  --radius-pill: 9999px;
  --radius-badge: 8px;
}
```

Usage in components: `bg-forest`, `text-emerald`, `rounded-card`, `font-heading`, `font-body`.

### Pattern 2: Font Setup with next/font and Tailwind v4
**What:** Load Plus Jakarta Sans via next/font/google and Geist via the geist package, expose as CSS variables, reference in @theme.
**When to use:** Root layout setup.

```tsx
// src/app/layout.tsx
import { Plus_Jakarta_Sans } from "next/font/google";
import { GeistSans } from "geist/font/sans";
import "./globals.css";

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-plus-jakarta-sans",
  display: "swap",
  weight: ["400", "500", "600", "700", "800"],
});

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${plusJakarta.variable} ${GeistSans.variable}`}>
      <body className="bg-forest text-text-primary font-body antialiased">
        {children}
      </body>
    </html>
  );
}
```

### Pattern 3: Component with Variants using clsx
**What:** Build component variants using clsx for conditional class composition.
**When to use:** All UI components that have visual variants (Button, StatusBadge, etc.).

```tsx
// src/components/ui/button.tsx
import { clsx } from "clsx";
import { type ButtonHTMLAttributes, forwardRef } from "react";

type ButtonVariant = "primary" | "secondary" | "ghost" | "cta";
type ButtonSize = "sm" | "md" | "lg";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = "primary", size = "md", className, children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={clsx(
          "inline-flex items-center justify-center font-heading font-semibold transition-colors rounded-pill",
          {
            "bg-emerald text-white hover:bg-emerald-dark": variant === "primary",
            "bg-card text-text-primary border border-gray-200 hover:bg-gray-50": variant === "secondary",
            "bg-transparent text-text-secondary hover:text-text-primary": variant === "ghost",
            "bg-chartreuse text-forest font-bold hover:brightness-95": variant === "cta",
          },
          {
            "px-3 py-1.5 text-sm": size === "sm",
            "px-4 py-2 text-base": size === "md",
            "px-6 py-3 text-lg": size === "lg",
          },
          className
        )}
        {...props}
      >
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";
export { Button };
```

### Pattern 4: Radix UI Tooltip for Sidebar Icons
**What:** Use Radix Tooltip primitive with custom Tailwind styling for sidebar icon labels.
**When to use:** Sidebar component -- each icon gets a tooltip on hover.

```tsx
// Using the new single-package import
import { Tooltip } from "radix-ui";

function SidebarIcon({ icon: Icon, label, href, isActive }: SidebarIconProps) {
  return (
    <Tooltip.Provider delayDuration={200}>
      <Tooltip.Root>
        <Tooltip.Trigger asChild>
          <a
            href={href}
            className={clsx(
              "flex items-center justify-center w-10 h-10 rounded-full transition-colors",
              isActive
                ? "bg-emerald text-white"
                : "text-white/60 hover:text-white hover:bg-white/10"
            )}
          >
            <Icon size={20} />
          </a>
        </Tooltip.Trigger>
        <Tooltip.Portal>
          <Tooltip.Content
            side="right"
            sideOffset={8}
            className="bg-text-primary text-white text-sm px-3 py-1.5 rounded-badge shadow-lg"
          >
            {label}
            <Tooltip.Arrow className="fill-text-primary" />
          </Tooltip.Content>
        </Tooltip.Portal>
      </Tooltip.Root>
    </Tooltip.Provider>
  );
}
```

### Pattern 5: Responsive Layout Shell
**What:** Two-column layout on desktop/tablet, bottom tab bar on mobile.
**When to use:** Root layout or app shell component.

```tsx
// src/components/layout/app-shell.tsx
export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-forest">
      {/* Desktop/Tablet: sidebar on left */}
      <aside className="hidden md:flex fixed left-0 top-0 bottom-0 w-16 flex-col items-center py-6 gap-2 bg-forest border-r border-white/10 z-50">
        <Sidebar />
      </aside>

      {/* Main content area */}
      <main className="md:ml-16 p-4 md:p-6 lg:p-8 pb-24 md:pb-6">
        {children}
      </main>

      {/* Mobile: floating bottom tab bar */}
      <nav className="md:hidden fixed bottom-4 left-4 right-4 bg-forest/95 backdrop-blur-sm rounded-2xl px-2 py-2 flex justify-around items-center shadow-2xl z-50">
        <BottomTabBar />
      </nav>
    </div>
  );
}
```

### Anti-Patterns to Avoid
- **Using tailwind.config.js with Tailwind v4:** Tailwind v4 uses CSS-first `@theme` configuration. Do not create a tailwind.config.js file. All theme customization goes in globals.css.
- **Installing individual @radix-ui/* packages:** Radix UI now ships as a single `radix-ui` package. Individual packages still work but the unified package prevents version conflicts.
- **Hard-coding colors instead of theme tokens:** Every color from THEME.md must be a Tailwind theme variable. Never use raw hex values in component classes.
- **Building custom tooltip/dropdown logic:** Use Radix primitives. Hand-rolling accessible tooltips and dropdowns is error-prone (focus management, keyboard nav, screen readers).
- **Using `middleware.ts` for new Next.js 16 projects:** The file is deprecated in Next.js 16. Use `proxy.ts` instead (relevant for Phase 2, but good to know now).

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Tooltips | Custom hover/position logic | Radix Tooltip | Focus management, keyboard dismissal, collision detection, screen reader support |
| Dropdown menus | Custom open/close state | Radix DropdownMenu | Arrow key navigation, typeahead, submenus, outside-click handling |
| Dialogs/modals | Custom overlay + trap focus | Radix Dialog | Focus trapping, scroll lock, escape dismissal, inert background |
| Icon system | Custom SVG sprite or icon font | Lucide React | Tree-shakeable, consistent stroke weight, 1500+ icons, TypeScript support |
| Number formatting (currency) | Manual toLocaleString wrapper | Intl.NumberFormat | Handles all locales, currency symbols, decimal precision natively |
| Class merging | Manual string concatenation | clsx | Handles undefined/null/false values, cleaner API for conditional classes |
| Font loading | Manual @font-face rules | next/font | Automatic optimization, zero layout shift, self-hosting, CSS variable output |

**Key insight:** This phase establishes patterns that every subsequent phase inherits. Getting accessibility and theming right here means Phases 2-7 compose existing components rather than fighting them.

## Common Pitfalls

### Pitfall 1: Tailwind v4 Theme Variable Naming
**What goes wrong:** Defining `@theme` variables with wrong prefix or format, leading to non-functional utility classes.
**Why it happens:** Tailwind v4 uses specific namespaces (`--color-*`, `--font-*`, `--radius-*`) to generate utility classes. Using the wrong namespace means the utility won't exist.
**How to avoid:** Use the documented namespaces: `--color-` for bg-/text- utilities, `--font-` for font- utilities, `--radius-` for rounded- utilities. Test each token produces working classes.
**Warning signs:** Tailwind classes not applying in browser, no autocomplete in IDE.

### Pitfall 2: Geist Font Variable Not Applying
**What goes wrong:** The Geist font CSS variable doesn't connect to Tailwind's font-body utility.
**Why it happens:** The `geist` npm package exports the font with a specific variable name (`--font-geist-sans`). If `@theme` references a different variable name, the connection breaks.
**How to avoid:** Check the exact CSS variable name exported by `GeistSans.variable` and match it in the `@theme` `--font-body` definition. Verify in browser DevTools that the CSS variable resolves.
**Warning signs:** Body text falls back to system fonts.

### Pitfall 3: Next.js 16 Async Params
**What goes wrong:** Build errors when accessing `params` or `searchParams` synchronously in page components.
**Why it happens:** Next.js 16 requires `await params` and `await searchParams` -- synchronous access was removed.
**How to avoid:** Always destructure params from an awaited promise: `const { slug } = await params;`
**Warning signs:** TypeScript errors about params being a Promise, runtime errors about synchronous access.

### Pitfall 4: Mobile Tab Bar Overlapping Content
**What goes wrong:** Page content hidden behind the fixed bottom tab bar on mobile.
**Why it happens:** Fixed positioning removes the element from flow; content doesn't account for the bar height.
**How to avoid:** Add `pb-24 md:pb-6` (or similar) to the main content area to pad bottom on mobile.
**Warning signs:** Last items in scrollable lists cut off on mobile viewport.

### Pitfall 5: StatusBadge Color Contrast
**What goes wrong:** Yellow status badge with white text fails WCAG contrast requirements.
**Why it happens:** Yellow (#EAB308) on white text has insufficient contrast ratio.
**How to avoid:** Use dark text (near-black) on the yellow/blocked badge specifically. Green, red, and blue can use white text safely.
**Warning signs:** Accessibility audit failures, hard-to-read badges.

### Pitfall 6: Skeleton Loading Dimensions
**What goes wrong:** Skeleton components flash or cause layout shift when real content loads.
**Why it happens:** Skeleton dimensions don't match actual component dimensions.
**How to avoid:** For KPICard, the user specified a `loading` prop that renders a skeleton matching card dimensions. Build skeletons with identical height/width/padding as their real counterparts.
**Warning signs:** Content jumps when data loads, flickering.

## Code Examples

### KPICard with Loading State
```tsx
// src/components/ui/kpi-card.tsx
import { clsx } from "clsx";
import { type LucideIcon } from "lucide-react";
import { Skeleton } from "./skeleton";
import { TrendIndicator } from "./trend-indicator";

type KPICardVariant = "default" | "alert-past" | "alert-trending";

interface KPICardProps {
  icon: LucideIcon;
  label: string;
  value: string | number;
  trend?: { direction: "up" | "down"; percentage: number };
  variant?: KPICardVariant;
  loading?: boolean;
}

export function KPICard({ icon: Icon, label, value, trend, variant = "default", loading = false }: KPICardProps) {
  if (loading) {
    return (
      <div className="bg-card rounded-card p-6 shadow-sm">
        <Skeleton className="w-10 h-10 rounded-badge mb-4" />
        <Skeleton className="w-24 h-8 mb-2" />
        <Skeleton className="w-16 h-4" />
      </div>
    );
  }

  return (
    <div
      className={clsx("rounded-card p-6 shadow-sm", {
        "bg-card": variant === "default",
        "bg-alert-past-target": variant === "alert-past",
        "bg-alert-trending": variant === "alert-trending",
      })}
    >
      <div className="w-10 h-10 bg-forest rounded-badge flex items-center justify-center mb-4">
        <Icon size={20} className="text-white" />
      </div>
      <p className="text-text-secondary text-sm mb-1">{label}</p>
      <p className="text-3xl font-heading font-bold tabular-nums">{value}</p>
      {trend && <TrendIndicator direction={trend.direction} percentage={trend.percentage} />}
    </div>
  );
}
```

### StatusBadge
```tsx
// src/components/ui/status-badge.tsx
import { clsx } from "clsx";

type Status = "completed" | "ready" | "attention" | "blocked" | "in-progress";

const statusConfig: Record<Status, { label: string; bg: string; text: string }> = {
  completed: { label: "Completed", bg: "bg-status-ready", text: "text-white" },
  ready: { label: "Ready", bg: "bg-status-ready", text: "text-white" },
  attention: { label: "NEEDS ATTENTION", bg: "bg-status-attention", text: "text-white" },
  blocked: { label: "Blocked", bg: "bg-status-blocked", text: "text-text-primary" },
  "in-progress": { label: "In Progress", bg: "bg-status-progress", text: "text-white" },
};

export function StatusBadge({ status }: { status: Status }) {
  const config = statusConfig[status];
  return (
    <span className={clsx("inline-flex px-3 py-1 text-xs font-semibold rounded-pill", config.bg, config.text)}>
      {config.label}
    </span>
  );
}
```

### TrendIndicator
```tsx
// src/components/ui/trend-indicator.tsx
import { TrendingUp, TrendingDown } from "lucide-react";
import { clsx } from "clsx";

interface TrendIndicatorProps {
  direction: "up" | "down";
  percentage: number;
}

export function TrendIndicator({ direction, percentage }: TrendIndicatorProps) {
  const Icon = direction === "up" ? TrendingUp : TrendingDown;
  const isPositive = direction === "up";

  return (
    <div className={clsx("flex items-center gap-1 text-sm mt-1", isPositive ? "text-positive" : "text-negative")}>
      <Icon size={14} />
      <span className="tabular-nums font-medium">{percentage.toFixed(1)}%</span>
    </div>
  );
}
```

### CurrencyDisplay
```tsx
// src/components/ui/currency-display.tsx
const formatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

export function CurrencyDisplay({ amount, className }: { amount: number; className?: string }) {
  return <span className={clsx("tabular-nums", className)}>{formatter.format(amount)}</span>;
}
```

### Skeleton
```tsx
// src/components/ui/skeleton.tsx
import { clsx } from "clsx";

export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={clsx("animate-pulse bg-gray-200 rounded-badge", className)}
      aria-hidden="true"
    />
  );
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| tailwind.config.js (JS config) | @theme directive in CSS (CSS-first) | Tailwind v4, Jan 2025 | No config file needed; theme variables defined in globals.css |
| Individual @radix-ui/* packages | Single `radix-ui` package | Late 2024 | Simpler install, no version conflicts between primitives |
| middleware.ts | proxy.ts | Next.js 16, Oct 2025 | Clearer naming; middleware.ts deprecated |
| unstable_cache | "use cache" directive | Next.js 16 | New caching model via Cache Components (relevant for Phase 3) |
| Synchronous params/searchParams | Async params/searchParams (await) | Next.js 15+ (enforced in 16) | All page/layout params must be awaited |
| next/font with tailwind.config.js fontFamily | next/font with @theme --font-* CSS vars | Tailwind v4 | Font CSS variables map directly to @theme namespace |

**Deprecated/outdated:**
- `tailwind.config.js` -- not needed for Tailwind v4; all config via CSS `@theme`
- `middleware.ts` -- deprecated in Next.js 16; use `proxy.ts` (Phase 2 concern)
- `@radix-ui/react-tooltip` (individual pkg) -- still works but single `radix-ui` package preferred
- `experimental.ppr` config -- removed in Next.js 16; replaced by `cacheComponents`

## Open Questions

1. **Exact Geist font CSS variable name**
   - What we know: The `geist` npm package exports `GeistSans` with a `.variable` property that creates a CSS custom property
   - What's unclear: The exact variable name (likely `--font-geist-sans` based on convention)
   - Recommendation: During implementation, log `GeistSans.variable` and match it in the `@theme` `--font-body` definition

2. **Tailwind v4 + create-next-app scaffold version**
   - What we know: `create-next-app@latest` scaffolds with Tailwind; Next.js 16 is current
   - What's unclear: Whether the current scaffold uses Tailwind v4 by default or v3
   - Recommendation: After scaffolding, check `package.json` for tailwindcss version. If v3, upgrade to v4 and switch to CSS-first config

3. **tabular-nums utility in Tailwind v4**
   - What we know: THEME.md requires `font-variant-numeric: tabular-nums` for statistics
   - What's unclear: Whether Tailwind v4 includes the `tabular-nums` utility class out of the box
   - Recommendation: Test the `tabular-nums` class; if missing, add as a custom utility or use inline style

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest + React Testing Library (standard for Next.js component testing) |
| Config file | none -- see Wave 0 |
| Quick run command | `npx vitest run --reporter=verbose` |
| Full suite command | `npx vitest run` |

### Phase Requirements to Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| UI-01 | THEME.md colors render correctly on page | smoke / manual | Visual inspection in browser | N/A -- Wave 0 |
| UI-02 | Correct fonts load (Plus Jakarta Sans headings, Geist body) | smoke / manual | Visual inspection + DevTools check | N/A -- Wave 0 |
| UI-03 | All 10 components render without errors | unit | `npx vitest run src/components/ui/ --reporter=verbose` | -- Wave 0 |
| UI-04 | Two-column layout shell renders (sidebar + main) | unit | `npx vitest run src/components/layout/ --reporter=verbose` | -- Wave 0 |
| UI-05 | Responsive classes applied correctly | unit | `npx vitest run src/components/layout/ --reporter=verbose` | -- Wave 0 |

### Sampling Rate
- **Per task commit:** `npx vitest run --reporter=verbose`
- **Per wave merge:** `npx vitest run`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `vitest.config.ts` -- Vitest configuration for Next.js (with @vitejs/plugin-react)
- [ ] `tests/setup.ts` -- Testing Library setup (cleanup, custom matchers)
- [ ] Framework install: `npm install -D vitest @vitejs/plugin-react @testing-library/react @testing-library/jest-dom jsdom`
- [ ] `src/components/ui/__tests__/` -- test directory for component unit tests
- [ ] `src/components/layout/__tests__/` -- test directory for layout component tests

## Sources

### Primary (HIGH confidence)
- [Next.js 16 blog post](https://nextjs.org/blog/next-16) -- breaking changes, React 19.2, proxy.ts, async params
- [Next.js installation docs](https://nextjs.org/docs/app/getting-started/installation) -- create-next-app defaults
- [Tailwind CSS v4 Next.js guide](https://tailwindcss.com/docs/guides/nextjs) -- installation steps
- [Tailwind CSS v4 theme variables](https://tailwindcss.com/docs/theme) -- @theme directive syntax and namespaces
- [Radix UI getting started](https://www.radix-ui.com/primitives/docs/overview/getting-started) -- single package install, namespace imports
- [Lucide React npm](https://www.npmjs.com/package/lucide-react) -- version 0.577+, actively maintained

### Secondary (MEDIUM confidence)
- [Geist font npm](https://www.npmjs.com/package/geist) -- integration pattern with next/font
- [Plus Jakarta Sans on Google Fonts](https://fonts.google.com/specimen/Plus+Jakarta+Sans) -- available via next/font/google
- [Tailwind CSS v4 blog post](https://tailwindcss.com/blog/tailwindcss-v4) -- CSS-first config, performance improvements

### Tertiary (LOW confidence)
- WebSearch results on font CSS variable naming -- exact variable names need runtime verification

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- verified via official docs and release notes for all libraries
- Architecture: HIGH -- patterns follow official Next.js 16 App Router conventions and Tailwind v4 docs
- Pitfalls: HIGH -- based on documented breaking changes (Next.js 16 async params, Tailwind v4 config) and accessibility standards (WCAG contrast)
- Font integration: MEDIUM -- next/font + Tailwind v4 integration pattern verified in multiple sources but exact variable names need runtime confirmation

**Research date:** 2026-03-08
**Valid until:** 2026-04-07 (30 days -- stable stack, unlikely to change)
