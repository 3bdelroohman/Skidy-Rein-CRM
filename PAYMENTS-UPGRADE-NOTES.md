# Payments Upgrade

## Includes
- `src/services/reports.service.ts` fix for `ReportsSummaryItem[]`
- Payment permissions helper: only Admin, Owner, and Alaa (sales identity match) can manage payments
- `src/app/(dashboard)/payments/page.tsx` upgraded list with clear Add Payment button and 4-session billing display
- `src/app/(dashboard)/payments/new/page.tsx` new payment creation form
- `src/app/(dashboard)/payments/[id]/page.tsx` invoice actions + gated status updates
- `src/app/(dashboard)/payments/[id]/invoice/page.tsx` branded printable invoice page
- `src/services/payments.service.ts` upgraded payment model with:
  - 4-session billing block
  - optional deferred due date
  - invoice number generation
  - WhatsApp/email share message
  - createPayment()
- `src/types/crm.ts` payment typing extensions
- `src/config/roles.ts` helper for payment manager identity

## Notes
- The invoice is rendered as a branded printable page.
- Save as PDF uses the browser print dialog.
- WhatsApp/email sending currently sends the invoice summary message; attaching a generated PDF automatically would require an extra backend/storage/email provider step.
- Extra billing metadata is persisted inside the existing `payments.notes` field using a structured prefix, so it works without changing the current Supabase table schema.
