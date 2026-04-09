import { redirect } from "next/navigation";

import { PaymentInvoiceView } from "@/components/payments/payment-invoice-view";
import { requireAuth } from "@/lib/auth";
import { canManagePaymentsForUser } from "@/config/roles";

export default async function PaymentInvoiceLegacyRoute({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireAuth();
  if (!canManagePaymentsForUser(user)) {
    redirect("/payments");
  }
  const { id } = await params;
  return <PaymentInvoiceView paymentId={id} />;
}
