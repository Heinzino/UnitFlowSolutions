---
status: complete
phase: 05-property-manager-view
source: [05-01-SUMMARY.md, 05-02-SUMMARY.md, 05-03-SUMMARY.md]
started: 2026-03-14T12:00:00Z
updated: 2026-03-14T12:00:00Z
---

## Current Test
<!-- OVERWRITE each test - shows where we are -->

[testing complete]

## Tests

### 1. PM Dashboard Loads with KPI Cards
expected: Navigate to /property while logged in as a Property Manager. Page loads showing 6 KPI cards in a 3-column grid. Cards display: Active Turns, Past Target Time, Average Days Vacant, Projected Spend MTD, Turns Completed MTD, Avg Cost Per Turn — all with numeric values from Airtable data.
result: pass

### 2. Property Filter Changes Dashboard Data
expected: If you manage multiple properties, a property selector dropdown appears at the top. Selecting a specific property refreshes KPI cards and turn list to show only that property's data. Selecting "All Properties" shows combined data. If you manage only one property, no selector is shown.
result: pass

### 3. Turn List Shows Overdue Turns First
expected: Below the KPI cards, the turn list shows two sections. Overdue turns appear first with a pink/alert header. On-schedule turns appear below. If no turns are overdue, the overdue section is not shown at all (no empty pink header).
result: pass

### 4. Turn List Columns Display Correctly
expected: Each turn row shows: Property Name (as a badge), Unit Number, Status (colored status badge), Ready To Lease Date, Vacant Date, Jobs (with inline status dropdowns), and Price.
result: issue
reported: "Jobs column shows status dropdowns but user wants clickable badge pills with job IDs that link to job detail. Turn status should be the interactive dropdown instead. Jobs detail page needed as link target."
severity: major

### 5. Job Status Dropdown Updates Inline
expected: In the turn list, each job shows a status dropdown. Changing a job's status instantly updates the display (optimistic update). A toast notification confirms the change. If the server update fails, the status reverts to the previous value and an error toast appears.
result: skipped
reason: UX redesign needed per test 4 — jobs will become clickable badges, status dropdown moves to turn request

### 6. Turn Row Navigates to Detail Page
expected: Clicking on a turn row navigates to /property/turn/[id] showing the turn detail page. Clicking on a job status dropdown does NOT trigger navigation (dropdown works independently).
result: pass

### 7. Turn Detail Header Shows Key Fields
expected: The turn detail page shows a header card with: Unit number, Property Name (badge), Status (colored badge), Ready To Lease Date, Vacant Date, Price, and Days Vacant.
result: pass

### 8. Turn Detail Jobs Table
expected: Below the header, a jobs table shows all jobs for this turn with columns: Job ID, Vendor Name, Vendor Type, Status (interactive dropdown), Start Date, End Date, Price. Job status dropdowns work the same as on the dashboard (optimistic + toast).
result: skipped
reason: UX redesign needed per test 4 — job interaction model changing

### 9. Back Navigation from Turn Detail
expected: The turn detail page shows a "< Back to turns" link at the top. Clicking it navigates back to /property (the PM dashboard).
result: pass

### 10. Mobile Responsive Turn List
expected: On a narrow screen (under 768px), the turn list switches from a table layout to stacked cards. Each card shows the turn's key info. Job status dropdowns still work without triggering navigation.
result: pass

## Summary

total: 10
passed: 7
issues: 1
pending: 0
skipped: 2

## Gaps

- truth: "Each turn row shows jobs with inline status dropdowns"
  status: failed
  reason: "User reported: Jobs column should show clickable badge pills with job IDs linking to job detail page. Turn request status should be the interactive dropdown instead. Current status dropdowns on jobs are not the right UX."
  severity: major
  test: 4
  root_cause: "UX mismatch — JobStatusDropdown placed on jobs column but user wants it on turn status column. Jobs should be simple clickable links."
  artifacts:
    - path: "src/app/(dashboard)/property/_components/pm-turn-list.tsx"
      issue: "JobsCell renders JobStatusDropdown per job — should render clickable badge pills instead"
    - path: "src/app/(dashboard)/property/_components/job-status-dropdown.tsx"
      issue: "Component targets job status but user wants turn request status dropdown"
  missing:
    - "Clickable job badges linking to job detail page"
    - "Turn status dropdown component for inline turn request status updates"
    - "Job detail page route"
  debug_session: ""
