import { PaymentInvoiceView } from "@/components/payments/payment-invoice-view";

export default async function PaymentInvoiceAliasPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <PaymentInvoiceView paymentId={id} />;
}
