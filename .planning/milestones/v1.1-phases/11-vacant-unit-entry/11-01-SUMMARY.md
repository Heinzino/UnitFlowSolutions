---
phase: 11-vacant-unit-entry
plan: "01"
subsystem: navigation
tags: [navigation, sidebar, bottom-tab-bar, routing, auth]
dependency_graph:
  requires: []
  provides: [/vacant in navigation for all roles, /vacant in ROLE_ALLOWED_ROUTES]
  affects: [src/components/layout/sidebar.tsx, src/components/layout/bottom-tab-bar.tsx, src/lib/types/auth.ts]
tech_stack:
  added: []
  patterns: [DoorOpen lucide icon, no-roles-filter nav item (visible to all)]
key_files:
  modified:
    - src/components/layout/sidebar.tsx
    - src/components/layout/bottom-tab-bar.tsx
    - src/lib/types/auth.ts
    - src/components/layout/__tests__/layout.test.tsx
decisions:
  - DoorOpen icon chosen for Add Vacant nav item (locked in 11-CONTEXT.md)
  - No roles filter on Add Vacant nav item — visible to all authenticated users (pm, rm, exec)
  - /vacant added to ROLE_ALLOWED_ROUTES for all three roles to prevent middleware redirect
metrics:
  duration: "~2 min"
  completed_date: "2026-03-18"
  tasks_completed: 2
  files_modified: 4
---

# Phase 11 Plan 01: Add Vacant Navigation Summary

**One-liner:** Added DoorOpen "Add Vacant" nav item to sidebar and bottom tab bar for all roles with /vacant in ROLE_ALLOWED_ROUTES.

## What Was Built

- `src/components/layout/sidebar.tsx` — Added `DoorOpen` to lucide-react imports; appended `{ icon: DoorOpen, label: "Add Vacant", href: "/vacant" }` to `navItems` (no roles filter, visible to all authenticated users)
- `src/components/layout/bottom-tab-bar.tsx` — Same DoorOpen import and entry added to `tabItems`
- `src/lib/types/auth.ts` — Added `'/vacant'` to `ROLE_ALLOWED_ROUTES` for `exec`, `rm`, and `pm` roles
- `src/components/layout/__tests__/layout.test.tsx` — Updated link count assertions (2 → 3), added PM-user tests verifying Add Vacant link/tab render in both Sidebar and BottomTabBar

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Add DoorOpen nav item and update ROLE_ALLOWED_ROUTES | 194617f | sidebar.tsx, bottom-tab-bar.tsx, auth.ts |
| 2 | Extend layout tests for Add Vacant nav item | 0041b8f | layout.test.tsx |

## Verification

- `npx vitest run --reporter=verbose src/components/layout/__tests__/layout.test.tsx` — 13/13 passed
- `grep "DoorOpen" sidebar.tsx bottom-tab-bar.tsx` — present in both files
- `grep "'/vacant'" auth.ts` — present for exec, rm, and pm

## Deviations from Plan

None — plan executed exactly as written.

## Self-Check: PASSED

- `src/components/layout/sidebar.tsx` — FOUND: DoorOpen in imports and navItems
- `src/components/layout/bottom-tab-bar.tsx` — FOUND: DoorOpen in imports and tabItems
- `src/lib/types/auth.ts` — FOUND: /vacant in all 3 role arrays
- `src/components/layout/__tests__/layout.test.tsx` — FOUND: new tests added, 13/13 passing
- Commits 194617f and 0041b8f — FOUND in git log
