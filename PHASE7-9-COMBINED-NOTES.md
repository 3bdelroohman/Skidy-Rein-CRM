# Phase 7–9 Combined Batch

## Included in this batch
- Dashboard real operational signals driven by services
- Reports expanded with collection summary, stage velocity, and recommendations
- Faster execution path by combining:
  - Phase 7 Batch 4: Dashboard + Reports real-data alignment
  - Phase 8: UX/operational polish for executive reading
  - Phase 9 (lightweight first pass): action-oriented recommendations and automation-style priorities

## Key improvements
- Dashboard now surfaces:
  - collection rate
  - schedule load
  - leads without next follow-up
  - booked vs attended trial snapshot
  - operational recommendations
  - fast execution cards
- Reports now surface:
  - collection summary
  - operational summary
  - stage velocity
  - recommended next moves

## Files changed
- src/types/crm.ts
- src/services/dashboard.service.ts
- src/services/reports.service.ts
- src/app/(dashboard)/page.tsx
- src/app/(dashboard)/reports/page.tsx

## Test after replace
- /
- /reports
- locale switch ar/en
- dashboard cards and quick action links
- reports summary cards and recommendations
