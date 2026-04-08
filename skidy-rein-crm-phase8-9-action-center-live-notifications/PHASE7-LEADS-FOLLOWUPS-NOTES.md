# Phase 7 — Leads + Follow-ups (first real-data batch)

## What changed
- Added `CreateFollowUpInput` type in `src/types/crm.ts`
- Expanded `src/services/follow-ups.service.ts` to support:
  - `listFollowUpsByLead()`
  - `createFollowUp()`
  - smarter local/Supabase sync for linked leads
  - lead activity logging when follow-ups are created/completed/reopened
  - auto-updating `nextFollowUpAt` on the linked lead
  - stage-based default follow-up suggestions
- Updated `src/app/(dashboard)/leads/[id]/page.tsx` to include:
  - related follow-ups section
  - inline quick-create follow-up form
  - complete / reopen actions per follow-up
  - pipeline style build fix (`boxShadow` instead of invalid `ringColor`)
- Updated `src/types/database.types.ts` to include `Relationships: []` for current tables to avoid Supabase type narrowing issues in builds.

## Why this batch first
This is the safest Phase 7 entry point because Leads + Follow-ups are the operational core of the CRM. Once these two flows are solid, the same pattern can be applied to Students / Parents / Teachers / Payments / Schedule / Reports.

## Expected result
- Lead details now behaves more like a real operational CRM screen instead of a read-only profile.
- Follow-up actions affect both follow-up state and the linked lead's next follow-up field.
- Activity log becomes closer to the real operational timeline.
