# Technology Stack

**Project:** UnitFlowSolutions — v1.2 Dashboard Redesign
**Domain:** Property management dashboard — Turn/Job separation, new KPI calculations, inline editing, property bar chart comparisons
**Researched:** 2026-03-18
**Confidence:** HIGH (all critical decisions based on existing validated code; no new external libraries required)

---

## Scope of This Document

This is a **milestone-scoped** update to the original STACK.md (dated 2026-03-08). It covers only what is **new or changed** for v1.2. The base stack (Next.js 16, Tailwind v4, Supabase Auth, Airtable SDK, Recharts 3, Vitest, lucide-react, sonner) is validated and unchanged.

---

## What is NOT Needed (Do Not Add)

Before listing additions, it is worth being explicit: the main risk in v1.2 is **adding dependencies that are not warranted**.

| Temptation | Why to Resist | What to Use Instead |
|------------|---------------|---------------------|
| A date picker library (react-datepicker, react-day-picker, etc.) | Lease-ready date entry is a single `<input type="date">` in a table cell — no calendar UI needed, no range selection, no custom styling requirements that outweigh the bundle cost | Native `<input type="date">` styled with Tailwind |
| TanStack Table / react-table | Active Jobs table needs sort + filter but the existing VendorTable (already in production) implements exactly this pattern with `useState` + sort logic in ~120 lines — no library needed | Extend the existing hand-built table pattern |
| A filter/facet library | Property filter on Completed Jobs page is a `<select>` or a variant of the existing `PropertyMultiSelect` component | Reuse `PropertyMultiSelect` |
| A new charting library | Avg Turn Time bar graph (RM view) and Top 10 Properties by Revenue Exposure (Executive view) are standard grouped/sorted bar charts — Recharts `BarChart` already handles this; the existing `VendorCompletionChart` is the exact pattern | Recharts `BarChart` with `ResponsiveContainer` |
| A tooltip library | Recharts ships its own `<Tooltip>` component already used in the codebase | Recharts Tooltip |
| A currency/number formatting library | `Intl.NumberFormat` is used in `pm-kpis.tsx` for currency — already pattern-established | `Intl.NumberFormat` |
| Zustand / Jotai | Active Jobs sort/filter state is local to one component | `useState` |
| date-fns (new addition) | Avg Turn Time needs date arithmetic (diff in days between two dates). The project currently uses none, but the existing `pm-kpis.ts` does this with raw `Date` math. For simple day-diff calculations, raw `Date` arithmetic is sufficient | Raw `Date` arithmetic — do not add date-fns |

---

## Recommended Stack Additions

### No New Dependencies Required

After analyzing the v1.2 feature set against the existing codebase, **no new npm packages are needed**. Every new feature maps to an existing pattern:

| New Feature | Existing Pattern to Follow | File(s) |
|-------------|---------------------------|---------|
| Active Jobs table with sort + filter | VendorTable — `useState` sort, ChevronUp/Down icons, custom `<Table>` primitives | `src/app/(dashboard)/vendors/_components/vendor-table.tsx` |
| Lease-ready date entry (inline editable) | JobStatusDropdown — `useOptimistic` + `useTransition` + Server Action + `sonner` toast | `src/app/(dashboard)/property/_components/job-status-dropdown.tsx` |
| Revenue Exposure KPI box | KPICard + `Intl.NumberFormat` | `src/components/ui/kpi-card.tsx`, `src/app/(dashboard)/property/_components/pm-kpis.tsx` |
| Avg Turn Time KPI box | Same KPICard with `Math.round()` days display | Already pattern in `computePMKPIs` |
| Job Completion Tracker KPI box | KPICard with count | Already pattern |
| Avg Turn Time bar graph (RM) | VendorCompletionChart — `BarChart`, `Bar`, `XAxis`, `YAxis`, `ResponsiveContainer` | `src/app/(dashboard)/executive/_components/vendor-completion-chart.tsx` |
| Top 10 Properties by Revenue Exposure (Executive) | Same BarChart pattern, horizontal layout | Same Recharts components |
| Property-level drill-down (RM) | Existing property selector + filtered data fetch | `src/components/layout/property-selector.tsx` |
| Completed Jobs page with property filter | PropertyMultiSelect already handles multi-property selection | `src/components/ui/property-multi-select.tsx` |
| Manual "Done" on Open Turns | Server Action + revalidateTag pattern from `updateJobStatus` | `src/app/actions/job-status.ts` |

---

## Implementation Guidance for Each New Capability

### 1. Lease-Ready Date Entry (Inline Editable `<input type="date">`)

**Pattern:** Follow `JobStatusDropdown` exactly — `useOptimistic` + `useTransition` + Server Action.

**Key decisions:**
- Use native `<input type="date">` — no external library. Browser-native date picker is sufficient for a single date field per row. Styling with Tailwind (`border rounded px-2 py-1 text-sm`) is adequate; no cross-browser calendar appearance required for internal PM tooling.
- The input goes inline in the Open Turns list row, not in a modal.
- On `onChange`, fire a Server Action that calls `base('TurnRequests').update(recordId, { 'Lease Ready Date': isoDate })` and `revalidateTag` the turn request cache.
- Optimistic update: show the selected date immediately; revert + toast error on failure.
- The Server Action follows the same structure as `updateJobStatus` — validate input, acquire rate limiter, update Airtable, bust 5 cache tags, return `{ success, error? }`.

**Wire-up:**
```typescript
// In a 'use client' component
const [optimisticDate, setOptimisticDate] = useOptimistic(currentLeaseReadyDate)
const [isPending, startTransition] = useTransition()

function handleDateChange(e: React.ChangeEvent<HTMLInputElement>) {
  const newDate = e.target.value // 'YYYY-MM-DD' string
  startTransition(async () => {
    setOptimisticDate(newDate)
    const result = await updateLeaseReadyDate(turnId, newDate)
    if (!result.success) {
      setOptimisticDate(currentLeaseReadyDate)
      toast.error('Failed to update lease date')
    }
  })
}
```

### 2. Active Jobs Table (Sort + Filter)

**Pattern:** Follow `VendorTable` exactly — no new library.

**Columns required (PM view):** Unit, Property, Job Type, Vendor, Status, Days Open
**Sort keys:** All columns should be sortable — same `SortKey` union type + `handleSort` toggle pattern.
**Filter:** Status filter via a `<select>` above the table (same pattern as property selector). Local `useState` for `filterStatus`.

**Data source:** Jobs linked to active Turns — the existing `fetchTurnRequests` returns jobs as nested records. Flatten them for the table rows in a pure function, no new fetch needed.

### 3. Avg Turn Time Bar Graph (RM View)

**Pattern:** `VendorCompletionChart` is the exact model — horizontal `BarChart` with `ResponsiveContainer`.

**Data shape:**
```typescript
interface PropertyTurnTimeData {
  propertyName: string
  avgDays: number
}
```

**Chart config:** Same as `VendorCompletionChart` — `layout="vertical"`, `YAxis type="category"`, `XAxis type="number"`. Color logic: green (<7 days), blue (7-14), red (>14) — same `getBarColor` function.

**Calculation:** `avgDays` = mean of `(turn completion date - turn start date)` for completed turns per property. This is pure arithmetic on existing Airtable fields — no new data source.

### 4. Top 10 Properties by Revenue Exposure (Executive View)

**Pattern:** Same `BarChart` as above. Sort descending by Revenue Exposure, take top 10.

**Revenue Exposure definition (must confirm with client):** Likely `sum(daily rent * days vacant)` per active turn. The `TurnRequest` records need a "daily rent" or "monthly rent" field. Verify this field exists in the Airtable schema before building the calculation.

**Flag:** Revenue Exposure calculation definition is a business logic question, not a technical one. The Recharts chart itself is straightforward once the number is computed.

### 5. KPI Calculations — Avg Turn Time, Revenue Exposure, Job Completion Tracker

All three are pure TypeScript functions in `src/lib/kpis/`. Follow the pattern in `src/lib/kpis/pm-kpis.ts` — take the `TurnRequest[]` array, return computed values, export a single `computeXKPIs()` function per role.

**Date arithmetic without date-fns:**
```typescript
function daysBetween(start: string, end: string): number {
  const msPerDay = 1000 * 60 * 60 * 24
  return Math.round((new Date(end).getTime() - new Date(start).getTime()) / msPerDay)
}
```
This is sufficient for day-diff calculations. Do not add `date-fns` just for this.

### 6. Property Filter on Completed Jobs Page

**Pattern:** Reuse `PropertyMultiSelect` component from v1.1. It already handles multi-property selection with inline creation and is tested (13 tests passing).

**Implementation:** Pass `selectedProperties` state as a URL search param or prop to filter the jobs list. Since Completed Jobs is a new page, use local `useState` — simpler and consistent with the rest of the app. URL params not needed for an internal tool.

---

## Recharts Version Notes

The project runs **Recharts 3.8.0** (confirmed in `package.json`). Recharts 3 introduced:
- Rewritten state management (fixes many long-standing bugs)
- `width="auto"` on YAxis for automatic width calculation
- New hooks: `useXAxisDomain`, `useYAxisDomain`
- Z-index support across surfaces

None of these new features are required for v1.2. The existing `BarChart` + `ResponsiveContainer` pattern works identically in v3 as in v2. No migration needed.

**Grouped bars for property comparison:** Use multiple `<Bar>` components with different `dataKey` values in one `<BarChart>`. No `stackId` needed for side-by-side grouped bars — just multiple `<Bar>` components.

---

## Confirmed Existing Versions (from package.json)

| Package | Installed Version | v1.2 Status |
|---------|------------------|-------------|
| next | 16.1.6 | No change |
| react | 19.2.3 | No change |
| recharts | ^3.8.0 | No change — supports all needed chart types |
| lucide-react | ^0.577.0 | No change — all needed icons present |
| sonner | ^2.0.7 | No change — toast for inline edit feedback |
| radix-ui | ^1.4.3 | No change |
| @supabase/ssr | ^0.9.0 | No change |
| @supabase/supabase-js | ^2.99.1 | No change |
| tailwindcss | ^4 | No change |
| clsx | ^2.1.1 | No change |
| airtable | ^0.12.2 | No change |
| geist | ^1.7.0 | No change |
| vitest | ^4.0.18 | No change |

---

## Installation

No new packages. Zero `npm install` commands for v1.2.

---

## Alternatives Considered

| Feature | Considered | Rejected Because | Use Instead |
|---------|------------|-----------------|-------------|
| Lease-ready date entry | `react-datepicker` | Adds ~42KB bundle, brings its own CSS, requires theming — all for a single date field. Native `<input type="date">` is fully accessible and sufficient for internal tooling. | `<input type="date">` |
| Active Jobs table | `@tanstack/react-table` | The existing VendorTable shows the full sort/filter pattern in 120 lines of TypeScript. TanStack Table requires ~50 lines of configuration before any UI renders. Overkill for a 6-column table. | Hand-built table following VendorTable pattern |
| Avg Turn Time bar chart | A new charting library | Recharts 3 is already installed, the VendorCompletionChart is the exact same chart type. No new library warranted. | Recharts BarChart |
| Revenue Exposure currency display | `accounting.js`, `numeral.js` | `Intl.NumberFormat` already used in `pm-kpis.tsx` for currency formatting. No new dependency. | `Intl.NumberFormat` |
| Property filter state | `nuqs` (URL state management) | URL params are useful for shareable URLs but not required for this internal tool. `useState` is simpler and consistent with the rest of the app. | `useState` |

---

## What NOT to Use

| Avoid | Why | Use Instead |
|-------|-----|-------------|
| `react-datepicker` / `react-day-picker` / any calendar library | Bundle weight (30-80KB) not justified for a single inline date field per turn row | `<input type="date">` with Tailwind styling |
| `@tanstack/react-table` | Already avoided in v1.0/v1.1; Active Jobs table is the same complexity as VendorTable which was built without it | Hand-built table pattern from VendorTable |
| A new date arithmetic library | Day-diff math is 2 lines of `Date` arithmetic | Raw `Date` math — `(new Date(end).getTime() - new Date(start).getTime()) / msPerDay` |
| A separate filter/facet library | Property filter is a single dropdown | `<select>` or existing `PropertyMultiSelect` |
| `tailwind-merge` | Not installed in this project — `clsx` alone is used throughout | `clsx` as already established |

---

## Version Compatibility

All packages installed. No new packages. No compatibility concerns for v1.2.

---

## Sources

- `package.json` — confirmed installed versions (HIGH confidence)
- `src/app/(dashboard)/vendors/_components/vendor-table.tsx` — sort/filter pattern verified to exist (HIGH confidence)
- `src/app/(dashboard)/property/_components/job-status-dropdown.tsx` — inline edit + optimistic pattern verified to exist (HIGH confidence)
- `src/app/(dashboard)/executive/_components/vendor-completion-chart.tsx` — bar chart pattern verified to exist (HIGH confidence)
- `src/app/actions/job-status.ts` — Server Action + cache bust pattern verified to exist (HIGH confidence)
- `src/lib/kpis/pm-kpis.ts` — KPI calculation pattern verified to exist (HIGH confidence)
- `src/components/ui/property-multi-select.tsx` — property filter component verified to exist (HIGH confidence)
- Recharts GitHub releases — v3 feature notes: https://github.com/recharts/recharts/releases (MEDIUM confidence)
- React `useOptimistic` docs: https://react.dev/reference/react/useOptimistic (HIGH confidence)

---

*Stack research for: UnitFlowSolutions v1.2 Dashboard Redesign*
*Researched: 2026-03-18*
*Scope: Additions and changes only — base stack documented in v1.0 STACK.md*
