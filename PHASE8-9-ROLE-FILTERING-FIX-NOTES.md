# Phase 8/9 Role Filtering Fix

## Fixed
- Notifications Bell now respects role scope more strictly.
- Ops users no longer receive sales-only alerts such as:
  - new leads waiting for response
  - overdue sales follow-ups
  - leads without next follow-up
  - trial confirmation alerts tied to sales pipeline
- Action Center keeps showing for ops, but with operational content instead of sales-heavy content.
- Dashboard signals, cards, quick actions, and recommendations are now role-aware.

## Updated files
- src/services/operations.service.ts
- src/services/dashboard.service.ts
- src/components/layout/top-navbar.tsx

## Expected result for Ops
- See: students at risk, overdue/due payments, today sessions, trial students, weekly load
- Do not see: sales pipeline alerts, lead follow-up pressure, lead cleanup tasks

## Expected result for Sales
- Still sees lead/follow-up pressure, pipeline-related signals, and sales execution alerts

## Expected result for Admin/Owner
- Continues to see the full cross-functional view
