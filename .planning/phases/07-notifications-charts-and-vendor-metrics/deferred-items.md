# Deferred Items — Phase 07

## Pre-existing Build Issue: /property/job/[id] Prerender Error

**Discovered during:** 07-02 Task 2 build verification
**Issue:** Route `/property/job/[id]` causes `next build` to fail at prerender step with:
  "Uncached data was accessed outside of <Suspense>"

**Root cause:** `fetchJobById` in `src/app/(dashboard)/property/job/[id]/page.tsx` is called
directly in the server component without a Suspense boundary or `use cache` directive.
This pre-existed before 07-02 changes. TypeScript compilation passes cleanly.

**Not caused by:** 07-02 changes (Vendor type, vendors.ts, vendor-table.tsx, page.tsx)

**Fix needed:** Wrap data-fetching in an inner async server component with a Suspense boundary
(same pattern as executive/page.tsx and property/page.tsx), or add `use cache` to fetchJobById.

**Scope:** This is a pre-existing issue from Phase 05-03. Should be addressed in a follow-up fix.
