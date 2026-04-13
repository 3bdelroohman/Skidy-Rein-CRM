import { getPaymentDisplayState, getPaymentEffectiveDueDate, listPaymentsByStudent } from "@/services/payments.service";
import type { PaymentItem } from "@/types/crm";

export interface StudentFinanceSnapshot {
  latestPayment: PaymentItem | null;
  nextPendingPayment: PaymentItem | null;
  totalBilled: number;
  totalCollected: number;
  openPayments: number;
  invoiceCount: number;
  currentState: "paid" | "pending" | "overdue" | "partial" | "refunded" | "deferred" | "none";
}

function sortByDueDesc(items: PaymentItem[]): PaymentItem[] {
  return [...items].sort((a, b) => getPaymentEffectiveDueDate(b).localeCompare(getPaymentEffectiveDueDate(a)));
}

function sortByDueAsc(items: PaymentItem[]): PaymentItem[] {
  return [...items].sort((a, b) => getPaymentEffectiveDueDate(a).localeCompare(getPaymentEffectiveDueDate(b)));
}

export async function getStudentFinanceSnapshot(studentId: string): Promise<StudentFinanceSnapshot> {
  const payments = sortByDueDesc(await listPaymentsByStudent(studentId));
  const latestPayment = payments[0] ?? null;
  const pendingLike = sortByDueAsc(
    payments.filter((payment) => {
      const state = getPaymentDisplayState(payment);
      return state === "pending" || state === "overdue" || state === "partial" || state === "deferred";
    }),
  );

  return {
    latestPayment,
    nextPendingPayment: pendingLike[0] ?? null,
    totalBilled: payments.reduce((sum, payment) => sum + payment.amount, 0),
    totalCollected: payments
      .filter((payment) => payment.status === "paid" || payment.status === "partial")
      .reduce((sum, payment) => sum + payment.amount, 0),
    openPayments: pendingLike.length,
    invoiceCount: payments.length,
    currentState: latestPayment ? getPaymentDisplayState(latestPayment) : "none",
  };
}
