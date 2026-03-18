---
phase: 11-vacant-unit-entry
verified: 2026-03-17T20:20:00Z
status: human_needed
score: 8/8 must-haves verified
human_verification:
  - test: "Navigate to /vacant as a PM user and verify the property dropdown is scoped to assigned properties only"
    expected: "PM user sees only properties whose names appear in their app_metadata.property_ids array; RM and exec users see all properties"
    why_human: "Server-side PM filtering requires a real Supabase auth session with app_metadata.property_ids populated — cannot be verified with unit tests alone"
  - test: "Submit a valid form with 2+ units and confirm records appear in Airtable Properties table"
    expected: "One Airtable record per unit, each containing Property Name, Street Address, Unit Number, Floor Plan, Bedrooms, Bathrooms, City=Columbia, State=SC; green success card lists all added units"
    why_human: "Airtable write requires live credentials and a real network call; unit tests mock the Airtable client"
  - test: "Use the inline 'Create new property' flow in the PropertyMultiSelect dropdown and verify a unit record is created"
    expected: "New property appears in the dropdown as selected; a toast confirms 'Created [name] with unit [number]'; new Airtable record present"
    why_human: "UNIT-07 inline creation path calls addVacantUnits through handleCreateProperty — requires live auth + Airtable"
  - test: "Simulate a partial Airtable failure (e.g. by temporarily revoking API access mid-batch) to confirm partial failure UI"
    expected: "Success card shows created units; red section lists failed units; 'Add More Units' pre-populates failed rows in the form"
    why_human: "Partial failure path requires live Airtable error; cannot be triggered in automated tests without environment manipulation"
  - test: "Check 'Add Off Market' nav item label is acceptable — the requirement (UNIT-01) says 'Add Vacant Units' but the implementation uses 'Add Off Market'"
    expected: "Product owner confirms 'Add Off Market' is the accepted user-facing label replacing 'Add Vacant'"
    why_human: "Label was changed per user feedback (commit 6ad46ae) after visual checkpoint. REQUIREMENTS.md still references 'Add Vacant Units'. Needs product owner sign-off to close the terminology gap."
---

# Phase 11: Vacant Unit Entry — Verification Report

**Phase Goal:** All roles can add vacant units to Airtable through a repeatable, property-scoped form
**Verified:** 2026-03-17T20:20:00Z
**Status:** human_needed (all automated checks pass; 5 items require human/integration verification)
**Re-verification:** No — initial verification

---

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | Add Vacant nav item appears in sidebar for all authenticated users (PM, RM, Executive) | VERIFIED | `sidebar.tsx` line 32: `{ icon: DoorOpen, label: "Add Off Market", href: "/vacant" }` — no roles filter; layout tests confirm /vacant link renders for PM users |
| 2 | Add Vacant tab appears in mobile bottom tab bar for all authenticated users | VERIFIED | `bottom-tab-bar.tsx` line 30: same entry without roles filter; layout tests pass for PM, no-user, and admin cases |
| 3 | /vacant route is in ROLE_ALLOWED_ROUTES for all three roles | VERIFIED | `auth.ts` lines 11-13: exec, rm, pm all include '/vacant' |
| 4 | addVacantUnits creates one Airtable Properties record per unit with all required fields | VERIFIED | `vacant.ts` lines 52-64: base('Properties').create() with 8 fields + { typecast: true }; 9 unit tests pass |
| 5 | addVacantUnits returns structured result with created[] and failed[] arrays for partial failure handling | VERIFIED | `vacant.ts` lines 45-69: per-unit try/catch populates separate arrays; partial failure test passes |
| 6 | Any authenticated user can call addVacantUnits (not admin-gated) | VERIFIED | No ADMIN_EMAILS import or check in vacant.ts; test "accepts any authenticated user" passes |
| 7 | User can select a property from a searchable dropdown populated from Airtable | VERIFIED | `page.tsx` calls fetchProperties(), deduplicates, passes as prop to AddVacantForm; form renders PropertyMultiSelect in single mode |
| 8 | User can add multiple units with unit number + floor plan in repeatable card sub-form | VERIFIED | `add-vacant-form.tsx`: UnitRow[] state, addRow/removeRow/updateRow helpers; tests confirm add/remove behavior and floor plan dropdown with all 7 FLOOR_PLANS values |

**Score:** 8/8 truths verified

---

## Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `src/components/layout/sidebar.tsx` | DoorOpen nav item in navItems array | VERIFIED | Line 32: DoorOpen with href='/vacant', no roles filter; label is "Add Off Market" |
| `src/components/layout/bottom-tab-bar.tsx` | DoorOpen tab in tabItems array | VERIFIED | Line 30: identical entry in tabItems |
| `src/lib/types/auth.ts` | /vacant in ROLE_ALLOWED_ROUTES for pm, rm, exec | VERIFIED | Lines 11-13: all three roles include '/vacant' |
| `src/components/layout/__tests__/layout.test.tsx` | Tests verifying Add Vacant link renders for all roles | VERIFIED | 13 tests; includes "renders 'Add Off Market' link for PM user" and "renders 'Add Off Market' tab for PM user" |
| `src/app/actions/vacant.ts` | addVacantUnits server action | VERIFIED | 'use server' line 1, 'import server-only' line 2, exports addVacantUnits and AddVacantUnitsResult |
| `src/app/actions/vacant.test.ts` | Unit tests for addVacantUnits | VERIFIED | 9 tests, all pass — auth, fields, parsing, partial failure, rate limiter, cache, non-admin auth |
| `src/app/(dashboard)/vacant/page.tsx` | Server component with auth check, property fetch, PM filtering | VERIFIED | Async default export, fetchProperties(), PM filter at line 34, renders AddVacantForm |
| `src/app/(dashboard)/vacant/add-vacant-form.tsx` | Client form with repeatable unit cards, PropertyMultiSelect single mode, success/failure UI | VERIFIED | 'use client' line 1, exports AddVacantForm, all plan-specified behaviors implemented |
| `src/app/(dashboard)/vacant/__tests__/add-vacant-form.test.tsx` | Unit tests for form rendering, row management, validation, floor plan values | VERIFIED | 10 tests, all pass |

---

## Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `sidebar.tsx` | /vacant route | `navItems` entry with `href="/vacant"` | WIRED | Line 32: href='/vacant' confirmed |
| `auth.ts` | middleware route check | ROLE_ALLOWED_ROUTES includes /vacant for all roles | WIRED | Lines 11-13: exec, rm, pm arrays all contain '/vacant' |
| `vacant.ts` | Airtable Properties table | `base('Properties').create()` | WIRED | Line 52: base('Properties').create() with full field object |
| `vacant.ts` | cache invalidation | `revalidateTag(CACHE_TAGS.properties)` | WIRED | Line 74: conditional call on `created.length > 0` |
| `page.tsx` | properties data | `fetchProperties()` | WIRED | Line 24: const allProperties = await fetchProperties() |
| `page.tsx` | AddVacantForm component | `<AddVacantForm properties={properties} />` | WIRED | Line 41: renders AddVacantForm with scoped properties prop |
| `add-vacant-form.tsx` | server action | `addVacantUnits()` call | WIRED | Lines 74 and 117: called in handleCreateProperty and handleSubmit |
| `add-vacant-form.tsx` | property-multi-select | `PropertyMultiSelect mode="single"` | WIRED | Line 231: PropertyMultiSelect with mode="single" and onCreateProperty |

---

## Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|------------|-------------|--------|----------|
| UNIT-01 | 11-01 | User can access "Add Vacant Units" from the sidebar | SATISFIED | Nav item at href='/vacant' exists in sidebar and bottom tab bar for all roles; NOTE: user-facing label is "Add Off Market" not "Add Vacant" — see human verification item 5 |
| UNIT-02 | 11-03 | User can select a property from a searchable dropdown (dynamic from Airtable) | SATISFIED | page.tsx fetches from Airtable, passes to AddVacantForm; PropertyMultiSelect renders with "Select a property..." placeholder; test passes |
| UNIT-03 | 11-03 | PM users only see properties they are assigned to in the dropdown | SATISFIED (automated); human verification needed | page.tsx line 34: `.filter((p) => role !== 'pm' || assignedPropertyIds.includes(p.name))`; logic correct but requires live auth session to fully confirm |
| UNIT-04 | 11-03 | User can add multiple units via a repeatable sub-form (unit number + floor plan) | SATISFIED | UnitRow[] state with add/remove/update; tests confirm add row, remove row, validation errors |
| UNIT-05 | 11-03 | Floor plan is a dropdown with exact values: Studio / Loft, 1br 1ba, 1br 2ba, 2br 1ba, 2br 1.5ba, 3br 2ba, 3br 3ba | SATISFIED | FLOOR_PLANS constant from property-multi-select.tsx has exactly 7 values; test confirms all 7 render as select options |
| UNIT-06 | 11-02 | Submitting creates records in Airtable Properties table with property name, unit number, floor plan, parsed bedrooms/bathrooms, city (Columbia), state (SC), and street address | SATISFIED (automated); live Airtable verification needed | vacant.ts creates records with all 8 fields including City=Columbia, State=SC; 8-field test passes |
| UNIT-07 | 11-02, 11-03 | User can create a new property inline (with street address) if it doesn't exist | SATISFIED (automated) | handleCreateProperty in add-vacant-form.tsx calls addVacantUnits with new property data; adds to availableProperties state; live verification needed |
| UNIT-08 | 11-03 | Street address is looked up from existing property; required only when creating a new property | SATISFIED | add-vacant-form.tsx line 237: `setStreetAddress(sel[0].streetAddress)` on property select; read-only display at line 246; test "shows street address below property selector" passes |

---

## Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| None found | — | — | — | — |

Checked all 7 core files for: TODO/FIXME/placeholder comments, empty implementations (return null/return {}/return []), console.log-only handlers, and stub patterns. None detected.

---

## Label Rename: "Add Vacant" → "Add Off Market"

A post-checkpoint user feedback change (commit `6ad46ae`) renamed all user-facing labels from "Vacant" to "Off Market". This affects:

- Sidebar nav label: "Add Off Market" (href remains /vacant)
- Bottom tab bar label: "Add Off Market" (href remains /vacant)
- Page heading: "Add Off Market Units"
- Submit button labels: "Add Off Market Units" / "Add 1 Off Market Unit" / "Add N Off Market Units"
- Success card heading: "N Off Market Unit(s) Added to [property]"

The route (/vacant), Airtable field values, and all non-UI identifiers are unchanged. REQUIREMENTS.md still uses "Add Vacant Units" in the description of UNIT-01. This is a terminology gap between the requirement text and the implementation label. All automated tests have been updated to match the new label and pass.

---

## Human Verification Required

### 1. PM property scoping in a real session

**Test:** Log in as a PM user whose `app_metadata.property_ids` contains exactly 2 property names. Navigate to /vacant. Open the property dropdown.
**Expected:** Only those 2 assigned properties appear in the dropdown. A PM with no assigned properties sees the empty state message ("No properties assigned to your account...").
**Why human:** Server-side filter logic is correct in code, but requires a live Supabase session with real app_metadata.property_ids to confirm the filtering produces correct output.

### 2. End-to-end Airtable record creation

**Test:** Select an existing property, add 2 units (e.g. "101" / "2br 1ba" and "102" / "Studio / Loft"), click "Add 2 Off Market Units". Then check the Airtable Properties table.
**Expected:** 2 new records appear with Property Name, Street Address, Unit Number, Floor Plan, Bedrooms, Bathrooms, City=Columbia, State=SC all correctly populated. Green success card lists both units.
**Why human:** Airtable writes require live credentials; unit tests mock the client.

### 3. Inline property creation (UNIT-07)

**Test:** In the PropertyMultiSelect dropdown, click "Create new property", fill in property name, street address, unit number, floor plan. Submit the inline form.
**Expected:** Toast confirms "Created [property name] with unit [unit number]"; new property appears as selected in the dropdown with street address auto-filled; record exists in Airtable.
**Why human:** Requires live Airtable write + auth session.

### 4. Partial failure UX

**Test:** Temporarily configure an invalid Airtable API key or induce a timeout, then submit a form with 2 units where one succeeds and one fails.
**Expected:** Success card appears showing the created unit(s). Red section below shows the failed unit(s) with the error message. Clicking "Add More Units" shows the form pre-populated with the failed rows.
**Why human:** Requires live environment with a controlled failure condition.

### 5. "Add Off Market" label sign-off (UNIT-01 terminology)

**Test:** Review the sidebar label ("Add Off Market") against the requirement text (UNIT-01: "User can access 'Add Vacant Units' from the sidebar").
**Expected:** Product owner confirms "Add Off Market" is the accepted label replacing "Add Vacant Units" in all user-facing text. If accepted, REQUIREMENTS.md UNIT-01 description should be updated to match.
**Why human:** This is a product decision — the code is consistent with the rename, but the requirements document still uses the old wording.

---

## Test Results Summary

All 32 automated tests pass across all three test files:

- `src/components/layout/__tests__/layout.test.tsx` — 13/13 passed
- `src/app/actions/vacant.test.ts` — 9/9 passed
- `src/app/(dashboard)/vacant/__tests__/add-vacant-form.test.tsx` — 10/10 passed

---

## Gaps Summary

No gaps blocking goal achievement. All 8 observable truths are verified by code inspection and automated tests. The phase goal — "All roles can add vacant units to Airtable through a repeatable, property-scoped form" — is architecturally complete.

Five items are flagged for human verification:
- Items 1-4: Integration behaviors that require live Supabase auth and Airtable credentials
- Item 5: Product sign-off on the "Add Off Market" label replacing "Add Vacant" in user-facing text

---

_Verified: 2026-03-17T20:20:00Z_
_Verifier: Claude (gsd-verifier)_
