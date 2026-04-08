import { createBrowserClient } from "@supabase/ssr";
import type { PaymentMethod, PaymentStatus } from "@/types/common.types";
import type { Database } from "@/types/database.types";
import type { PaymentDetails, PaymentItem } from "@/types/crm";
import { isBrowser, readStorage, sortByDateAsc, sortByDateDesc, writeStorage } from "@/services/storage";
import { listParents } from "@/services/parents.service";
import { listStudents } from "@/services/students.service";

const PAYMENTS_KEY = "skidy.crm.payments";
const VALID_METHODS: PaymentMethod[] = ["bank_transfer", "card", "wallet", "cash", "instapay"];
const VALID_STATUSES: PaymentStatus[] = ["paid", "pending", "overdue", "refunded", "partial"];

const DEFAULT_PAYMENTS: PaymentItem[] = [
  { id: "1", studentId: "1", studentName: "يوسف أحمد", parentName: "أحمد محمد", parentId: null, amount: 750, status: "paid", method: "instapay", dueDate: "2026-04-01", paidAt: "2026-03-30", notes: null },
  { id: "2", studentId: "2", studentName: "ملك سارة", parentName: "سارة أحمد", parentId: null, amount: 750, status: "paid", method: "bank_transfer", dueDate: "2026-04-01", paidAt: "2026-04-01", notes: null },
  { id: "3", studentId: "4", studentName: "سلمى خالد", parentName: "خالد عبدالله", parentId: null, amount: 750, status: "overdue", method: null, dueDate: "2026-03-15", paidAt: null, notes: null },
  { id: "4", studentId: "5", studentName: "عمر محمد", parentName: "محمد علي", parentId: null, amount: 750, status: "pending", method: null, dueDate: "2026-04-10", paidAt: null, notes: null },
  { id: "5", studentId: "6", studentName: "ليلى هدى", parentName: "هدى إبراهيم", parentId: null, amount: 750, status: "paid", method: "wallet", dueDate: "2026-04-01", paidAt: "2026-04-02", notes: null },
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

function sortPayments(items: PaymentItem[]): PaymentItem[] {
  return sortByDateDesc(items, (payment) => payment.dueDate);
}

function getLocalPayments(): PaymentItem[] {
  return sortPayments(readStorage(PAYMENTS_KEY, DEFAULT_PAYMENTS));
}

function saveLocalPayments(items: PaymentItem[]): void {
  writeStorage(PAYMENTS_KEY, sortPayments(items));
}

function mapPaymentRow(
  row: Database["public"]["Tables"]["payments"]["Row"] | Record<string, unknown>,
  studentsMap: Map<string, Awaited<ReturnType<typeof listStudents>>[number]>,
  parentsMap: Map<string, Awaited<ReturnType<typeof listParents>>[number]>,
): PaymentItem {
  const record = row as Record<string, unknown>;
  const studentId = asNullableString(record.student_id ?? record.studentId);
  const student = studentId ? studentsMap.get(studentId) ?? null : null;
  const parent = student?.parentId ? parentsMap.get(student.parentId) ?? null : null;

  return {
    id: asString(record.id, crypto.randomUUID()),
    studentId,
    studentName: student?.fullName ?? asString(record.student_name ?? record.studentName, "طالب غير محدد"),
    parentId: student?.parentId ?? parent?.id ?? asNullableString(record.parent_id ?? record.parentId),
    parentName: parent?.fullName ?? student?.parentName ?? asString(record.parent_name ?? record.parentName, "ولي أمر غير محدد"),
    amount: asNumber(record.amount),
    status: asStatus(record.status),
    method: asMethod(record.method),
    dueDate: asString(record.due_date ?? record.dueDate, new Date().toISOString()),
    paidAt: asNullableString(record.paid_at ?? record.paidAt),
    notes: asNullableString(record.notes),
  } satisfies PaymentItem;
}

async function buildMaps() {
  const [students, parents] = await Promise.all([listStudents(), listParents()]);
  return {
    students,
    parents,
    studentsMap: new Map(students.map((student) => [student.id, student])),
    parentsMap: new Map(parents.map((parent) => [parent.id, parent])),
  };
}

export async function listPayments(): Promise<PaymentItem[]> {
  const fallback = getLocalPayments();
  const supabase = getSupabaseClient();
  if (!supabase) return fallback;

  try {
    const [{ data, error }, { studentsMap, parentsMap }] = await Promise.all([
      supabase.from("payments").select("*").order("due_date", { ascending: false }),
      buildMaps(),
    ]);

    if (error || !data || data.length === 0) return fallback;

    const mapped = data.map((row) => mapPaymentRow(row, studentsMap, parentsMap));
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

export async function getPaymentDetails(id: string): Promise<PaymentDetails | null> {
  const [payments, students, parents] = await Promise.all([listPayments(), listStudents(), listParents()]);
  const payment = payments.find((item) => item.id === id) ?? null;
  if (!payment) return null;

  const student = payment.studentId ? students.find((item) => item.id === payment.studentId) ?? null : null;
  const parent = payment.parentId
    ? parents.find((item) => item.id === payment.parentId) ?? null
    : parents.find((item) => item.fullName === payment.parentName || item.phone === student?.parentPhone) ?? null;

  const siblingPayments = payments.filter((item) => {
    if (item.id === payment.id) return false;
    if (parent?.id && item.parentId === parent.id) return true;
    return item.parentName === payment.parentName;
  });

  const paymentHistory = sortPayments(
    payments.filter((item) => item.studentId && item.studentId === payment.studentId),
  );

  return {
    ...payment,
    student,
    parent,
    siblingPayments,
    paymentHistory,
  };
}

export async function listPaymentsByStudent(studentId: string): Promise<PaymentItem[]> {
  const payments = await listPayments();
  return payments.filter((payment) => payment.studentId === studentId);
}

export async function updatePaymentStatus(
  id: string,
  status: PaymentStatus,
  method?: PaymentMethod | null,
): Promise<PaymentItem | null> {
  const current = await listPayments();
  const existing = current.find((payment) => payment.id === id) ?? null;
  if (!existing) return null;

  const nextPaidAt = status === "paid" || status === "partial" ? new Date().toISOString() : null;
  const nextMethod = method === undefined ? existing.method : method;

  const updatedItems = current.map((payment) => {
    if (payment.id !== id) return payment;
    return {
      ...payment,
      status,
      method: nextMethod,
      paidAt: nextPaidAt,
    } satisfies PaymentItem;
  });

  saveLocalPayments(updatedItems);

  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      await supabase
        .from("payments")
        .update({
          status,
          method: nextMethod,
          paid_at: nextPaidAt,
        })
        .eq("id", id);
    } catch {
      // keep local state as safe fallback for demo mode
    }
  }

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
  const dueToday = payments.filter((payment) => payment.dueDate.slice(0, 10) === new Date().toISOString().slice(0, 10)).length;
  const upcoming = sortByDateAsc(
    payments.filter((payment) => payment.status === "pending"),
    (payment) => payment.dueDate,
  ).slice(0, 5);

  return {
    totalExpected,
    totalCollected,
    totalOverdue,
    dueToday,
    collectionRate: totalExpected > 0 ? Math.round((totalCollected / totalExpected) * 100) : 0,
    upcoming,
  };
}
