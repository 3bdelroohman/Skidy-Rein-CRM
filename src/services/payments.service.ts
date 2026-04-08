import { createBrowserClient } from "@supabase/ssr";
import type { PaymentMethod, PaymentStatus } from "@/types/common.types";
import type { Database } from "@/types/database.types";
import type { PaymentItem } from "@/types/crm";
import { isBrowser, readStorage, sortByDateAsc, sortByDateDesc, writeStorage } from "@/services/storage";
import { listStudents } from "@/services/students.service";

const PAYMENTS_KEY = "skidy.crm.payments";
const VALID_METHODS: PaymentMethod[] = [
  "bank_transfer",
  "card",
  "wallet",
  "cash",
  "instapay",
];
const VALID_STATUSES: PaymentStatus[] = [
  "paid",
  "pending",
  "overdue",
  "refunded",
  "partial",
];

const DEFAULT_PAYMENTS: PaymentItem[] = [
  { id: "1", studentId: "1", studentName: "يوسف أحمد", parentName: "أحمد محمد", amount: 750, status: "paid", method: "instapay", dueDate: "2026-04-01", paidAt: "2026-03-30" },
  { id: "2", studentId: "2", studentName: "ملك سارة", parentName: "سارة أحمد", amount: 750, status: "paid", method: "bank_transfer", dueDate: "2026-04-01", paidAt: "2026-04-01" },
  { id: "3", studentId: "4", studentName: "سلمى خالد", parentName: "خالد عبدالله", amount: 750, status: "overdue", method: null, dueDate: "2026-03-15", paidAt: null },
  { id: "4", studentId: "5", studentName: "عمر محمد", parentName: "محمد علي", amount: 750, status: "pending", method: null, dueDate: "2026-04-10", paidAt: null },
  { id: "5", studentId: "6", studentName: "ليلى هدى", parentName: "هدى إبراهيم", amount: 750, status: "paid", method: "wallet", dueDate: "2026-04-01", paidAt: "2026-04-02" },
];

function getSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key || !isBrowser()) return null;
  return createBrowserClient<Database>(url, key);
}

function asString(value: unknown, fallback = ""): string {
  return typeof value === "string" && value.trim().length > 0 ? value : fallback;
}

function asNullableString(value: unknown): string | null {
  return typeof value === "string" && value.trim().length > 0 ? value : null;
}

function asNumber(value: unknown, fallback = 0): number {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
  }
  return fallback;
}

function asStatus(value: unknown): PaymentStatus {
  return VALID_STATUSES.includes(value as PaymentStatus) ? (value as PaymentStatus) : "pending";
}

function asMethod(value: unknown): PaymentMethod | null {
  return VALID_METHODS.includes(value as PaymentMethod) ? (value as PaymentMethod) : null;
}

function getLocalPayments(): PaymentItem[] {
  return sortByDateDesc(readStorage(PAYMENTS_KEY, DEFAULT_PAYMENTS), (payment) => payment.dueDate);
}

function saveLocalPayments(items: PaymentItem[]): void {
  writeStorage(PAYMENTS_KEY, sortByDateDesc(items, (payment) => payment.dueDate));
}

export async function listPayments(): Promise<PaymentItem[]> {
  const fallback = getLocalPayments();
  const supabase = getSupabaseClient();
  if (!supabase) return fallback;

  try {
    const [paymentsResponse, students] = await Promise.all([
      supabase.from("payments").select("*").order("due_date", { ascending: false }),
      listStudents(),
    ]);

    if (paymentsResponse.error || !paymentsResponse.data || paymentsResponse.data.length === 0) {
      return fallback;
    }

    const studentMap = new Map(students.map((student) => [student.id, student]));
    const mapped = paymentsResponse.data.map((row: Database["public"]["Tables"]["payments"]["Row"]) => {
      const student = row.student_id ? studentMap.get(row.student_id) : null;
      return {
        id: asString(row.id, crypto.randomUUID()),
        studentId: asNullableString(row.student_id),
        studentName: student?.fullName ?? "طالب غير محدد",
        parentName: student?.parentName ?? "ولي أمر غير محدد",
        amount: asNumber(row.amount),
        status: asStatus(row.status),
        method: asMethod((row as unknown as Record<string, unknown>).method),
        dueDate: asString(row.due_date, new Date().toISOString()),
        paidAt: asNullableString(row.paid_at),
      } satisfies PaymentItem;
    });

    saveLocalPayments(mapped);
    return mapped;
  } catch {
    return fallback;
  }
}

export async function getPaymentById(id: string): Promise<PaymentItem | null> {
  const items = await listPayments();
  return items.find((payment) => payment.id === id) ?? null;
}

export async function updatePaymentStatus(
  id: string,
  status: PaymentStatus,
  method?: PaymentMethod | null,
): Promise<PaymentItem | null> {
  const current = await listPayments();
  const updatedItems = current.map((payment) => {
    if (payment.id !== id) return payment;

    const paidAt = status === "paid" || status === "partial" ? new Date().toISOString() : null;
    return {
      ...payment,
      status,
      method: method === undefined ? payment.method : method,
      paidAt,
    } satisfies PaymentItem;
  });

  saveLocalPayments(updatedItems);
  return updatedItems.find((payment) => payment.id === id) ?? null;
}

export async function getPaymentsSummary() {
  const payments = await listPayments();
  const totalExpected = payments.reduce((sum, payment) => sum + payment.amount, 0);
  const totalCollected = payments
    .filter((payment) => payment.status === "paid" || payment.status === "partial")
    .reduce((sum, payment) => sum + payment.amount, 0);
  const totalOverdue = payments
    .filter((payment) => payment.status === "overdue")
    .reduce((sum, payment) => sum + payment.amount, 0);
  const upcoming = sortByDateAsc(
    payments.filter((payment) => payment.status === "pending"),
    (payment) => payment.dueDate,
  ).slice(0, 5);

  return {
    totalExpected,
    totalCollected,
    totalOverdue,
    collectionRate: totalExpected > 0 ? Math.round((totalCollected / totalExpected) * 100) : 0,
    upcoming,
  };
}
