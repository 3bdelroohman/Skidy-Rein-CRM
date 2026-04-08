# Phase 8 + 9 — Action Center + Live Notifications

## What changed
- Added a new `/action-center` route as a daily execution board.
- Added `operations.service.ts` to derive operational actions from:
  - leads
  - follow-ups
  - students
  - payments
  - schedule
- Replaced static top-navbar notifications with live notifications derived from current operational data.
- Added sidebar navigation entry for **Action Center / مركز العمليات**.
- Added middleware access control for `/action-center`.
- Updated dashboard and reports to point certain execution-focused links toward the new action center.

## Why this batch matters
This batch moves the system from passive reporting to active execution.
Instead of showing numbers only, it now highlights what the team should act on next.

## Files added
- `src/services/operations.service.ts`
- `src/app/(dashboard)/action-center/page.tsx`

## Files updated
- `src/types/crm.ts`
- `src/config/navigation.ts`
- `src/middleware.ts`
- `src/components/layout/top-navbar.tsx`
- `src/services/dashboard.service.ts`
- `src/services/reports.service.ts`
