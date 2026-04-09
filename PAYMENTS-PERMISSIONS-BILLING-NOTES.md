# Payments Permissions + Billing Logic Batch

## Included
- Restrict payments management to Abdelrahman (admin), Khaled (owner), and Alaa only.
- Deny access to payments pages for other users.
- Show Add Payment button only for authorized users.
- Hide quick payment actions and invoice issuance from unauthorized users.
- Improve billing language around 4-session blocks.
- Treat deferred payments as a first-class display state.
- Improve payments summary to count deferred items and use effective due dates.
- Protect invoice routes server-side.
- Polish invoice design with stronger Skidy Rein identity.

## Files
- src/config/roles.ts
- src/services/payments.service.ts
- src/app/(dashboard)/payments/page.tsx
- src/app/(dashboard)/payments/new/page.tsx
- src/app/(dashboard)/payments/[id]/page.tsx
- src/app/(dashboard)/payments/[id]/invoice/page.tsx
- src/app/(dashboard)/payments/invoice/[id]/page.tsx
- src/components/payments/payment-invoice-view.tsx
