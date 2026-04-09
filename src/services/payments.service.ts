import { createBrowserClient } from "@supabase/ssr";
import type { PaymentMethod, PaymentStatus } from "@/types/common.types";
import type { Database } from "@/types/database.types";
import type { CreatePaymentInput, PaymentDetails, PaymentItem } from "@/types/crm";
import { isBrowser, readStorage, sortByDateAsc, sortByDateDesc, writeStorage } from "@/services/storage";
import { listParents } from "@/services/parents.service";
import { listStudents } from "@/services/students.service";

const PAYMENTS_KEY = "skidy.crm.payments";
const VALID_METHODS: PaymentMethod[] = ["bank_transfer", "card", "wallet", "cash", "instapay"];
const VALID_STATUSES: PaymentStatus[] = ["paid", "pending", "overdue", "refunded", "partial"];
const PAYMENT_META_PREFIX = "__SKIDY_PAYMENT_META__:";

interface PaymentMeta {
  sessionsCovered?: number;
  blockStartDate?: string | null;
  blockEndDate?: string | null;
  deferredUntil?: string | null;
  invoiceNumber?: string | null;
  invoiceIssuedAt?: string | null;
  publicNote?: string | null;
}

const DEFAULT_PAYMENTS: PaymentItem[] = [
  { id: "1", studentId: "1", studentName: "يوسف أحمد", parentName: "أحمد محمد", parentId: null, amount: 750, status: "paid", method: "instapay", dueDate: "2026-04-01", paidAt: "2026-03-30", notes: null, publicNote: null, sessionsCovered: 4, blockStartDate: "2026-03-01", blockEndDate: "2026-03-28", deferredUntil: null, invoiceNumber: "SKR-2026-0001", invoiceIssuedAt: "2026-03-01" },
  { id: "2", studentId: "2", studentName: "ملك سارة", parentName: "سارة أحمد", parentId: null, amount: 750, status: "paid", method: "bank_transfer", dueDate: "2026-04-01", paidAt: "2026-04-01", notes: null, publicNote: null, sessionsCovered: 4, blockStartDate: "2026-03-03", blockEndDate: "2026-03-31", deferredUntil: null, invoiceNumber: "SKR-2026-0002", invoiceIssuedAt: "2026-03-03" },
  { id: "3", studentId: "4", studentName: "سلمى خالد", parentName: "خالد عبدالله", parentId: null, amount: 750, status: "overdue", method: null, dueDate: "2026-03-15", paidAt: null, notes: null, publicNote: "تم تأجيل السداد لحين اكتمال الأربع جلسات", sessionsCovered: 4, blockStartDate: "2026-02-10", blockEndDate: "2026-03-15", deferredUntil: "2026-03-22", invoiceNumber: "SKR-2026-0003", invoiceIssuedAt: "2026-02-10" },
  { id: "4", studentId: "5", studentName: "عمر محمد", parentName: "محمد علي", parentId: null, amount: 750, status: "pending", method: null, dueDate: "2026-04-10", paidAt: null, notes: null, publicNote: null, sessionsCovered: 4, blockStartDate: "2026-04-01", blockEndDate: null, deferredUntil: null, invoiceNumber: "SKR-2026-0004", invoiceIssuedAt: "2026-04-01" },
  { id: "5", studentId: "6", studentName: "ليلى هدى", parentName: "هدى إبراهيم", parentId: null, amount: 750, status: "paid", method: "wallet", dueDate: "2026-04-01", paidAt: "2026-04-02", notes: null, publicNote: null, sessionsCovered: 4, blockStartDate: "2026-03-05", blockEndDate: "2026-04-02", deferredUntil: null, invoiceNumber: "SKR-2026-0005", invoiceIssuedAt: "2026-03-05" },
];

function getSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key || !isBrowser()) return null;
  return createBrowserClient<Database>(url, key);
}

function isDemoModeEnabled(): boolean {
  return process.env.NEXT_PUBLIC_ALLOW_DEMO_FALLBACK === "true";
}

function shouldUseDemoFallback(): boolean {
  return !getSupabaseClient() && isDemoModeEnabled();
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

function parsePaymentMeta(raw: string | null | undefined): { publicNote: string | null; meta: PaymentMeta } {
  const value = typeof raw === "string" ? raw : "";
  if (!value.startsWith(PAYMENT_META_PREFIX)) {
    return { publicNote: value || null, meta: {} };
  }

  const [header, ...rest] = value.split("\n");
  let meta: PaymentMeta = {};
  try {
    meta = JSON.parse(header.slice(PAYMENT_META_PREFIX.length)) as PaymentMeta;
  } catch {
    meta = {};
  }

  const publicNote = rest.join("\n").trim();
  return { publicNote: publicNote || meta.publicNote || null, meta };
}

function buildPaymentNotes(publicNote: string | null | undefined, meta: PaymentMeta): string {
  const compactMeta: PaymentMeta = {
    sessionsCovered: meta.sessionsCovered ?? 4,
    blockStartDate: meta.blockStartDate ?? null,
    blockEndDate: meta.blockEndDate ?? null,
    deferredUntil: meta.deferredUntil ?? null,
    invoiceNumber: meta.invoiceNumber ?? null,
    invoiceIssuedAt: meta.invoiceIssuedAt ?? null,
    publicNote: publicNote?.trim() ? publicNote.trim() : null,
  };

  const parts = [`${PAYMENT_META_PREFIX}${JSON.stringify(compactMeta)}`];
  if (publicNote?.trim()) parts.push(publicNote.trim());
  return parts.join("\n");
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

function clearLocalPayments(): void {
  writeStorage(PAYMENTS_KEY, []);
}

function generateInvoiceNumber(existing: PaymentItem[]): string {
  const year = new Date().getFullYear();
  return `SKR-${year}-${String(existing.length + 1).padStart(4, "0")}`;
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
  const rawNotes = asNullableString(record.notes);
  const { publicNote, meta } = parsePaymentMeta(rawNotes);

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
    notes: rawNotes,
    publicNote,
    sessionsCovered: meta.sessionsCovered ?? 4,
    blockStartDate: meta.blockStartDate ?? null,
    blockEndDate: meta.blockEndDate ?? null,
    deferredUntil: meta.deferredUntil ?? null,
    invoiceNumber: meta.invoiceNumber ?? null,
    invoiceIssuedAt: meta.invoiceIssuedAt ?? null,
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
  const demoFallback = shouldUseDemoFallback() ? getLocalPayments() : [];
  const supabase = getSupabaseClient();
  if (!supabase) return demoFallback;

  try {
    const [{ data, error }, { studentsMap, parentsMap }] = await Promise.all([
      supabase.from("payments").select("*").order("due_date", { ascending: false }),
      buildMaps(),
    ]);

    if (error) {
      console.error("[payments] failed to load from Supabase", error);
      return [];
    }

    if (!data || data.length === 0) {
      clearLocalPayments();
      return [];
    }

    const mapped = data.map((row) => mapPaymentRow(row, studentsMap, parentsMap));
    saveLocalPayments(mapped);
    return mapped;
  } catch (error) {
    console.error("[payments] unexpected load failure", error);
    return [];
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

  const paymentHistory = sortPayments(payments.filter((item) => item.studentId && item.studentId === payment.studentId));

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

export async function createPayment(input: CreatePaymentInput): Promise<PaymentItem> {
  const [{ studentsMap, parentsMap }, current] = await Promise.all([buildMaps(), listPayments()]);
  const student = studentsMap.get(input.studentId) ?? null;
  const parent = student?.parentId ? parentsMap.get(student.parentId) ?? null : null;
  const now = new Date().toISOString();
  const paymentId = crypto.randomUUID();
  const invoiceNumber = generateInvoiceNumber(current);
  const sessionsCovered = Math.max(1, input.sessionsCovered ?? 4);
  const notes = buildPaymentNotes(input.notes, {
    sessionsCovered,
    blockStartDate: input.blockStartDate ?? null,
    blockEndDate: input.blockEndDate ?? null,
    deferredUntil: input.deferredUntil ?? null,
    invoiceNumber,
    invoiceIssuedAt: now,
  });

  const payment: PaymentItem = {
    id: paymentId,
    studentId: input.studentId,
    studentName: student?.fullName ?? "طالب غير محدد",
    parentId: student?.parentId ?? parent?.id ?? null,
    parentName: parent?.fullName ?? student?.parentName ?? "ولي أمر غير محدد",
    amount: input.amount,
    status: input.status,
    method: input.method,
    dueDate: input.dueDate,
    paidAt: input.status === "paid" || input.status === "partial" ? now : null,
    notes,
    publicNote: input.notes?.trim() ? input.notes.trim() : null,
    sessionsCovered,
    blockStartDate: input.blockStartDate ?? null,
    blockEndDate: input.blockEndDate ?? null,
    deferredUntil: input.deferredUntil ?? null,
    invoiceNumber,
    invoiceIssuedAt: now,
  };

  const supabase = getSupabaseClient();
  if (!supabase) {
    const localCurrent = getLocalPayments();
    saveLocalPayments([payment, ...localCurrent]);
    return payment;
  }

  const { error } = await supabase.from("payments").insert({
    id: paymentId,
    student_id: input.studentId,
    amount: input.amount,
    status: input.status,
    method: input.method,
    due_date: input.dueDate,
    paid_at: payment.paidAt,
    notes,
  });

  if (error) {
    console.error("[payments] create failed", error);
    throw new Error(error.message || "Failed to create payment");
  }

  saveLocalPayments([payment, ...current]);
  return payment;
}

export async function updatePaymentStatus(id: string, status: PaymentStatus, method?: PaymentMethod | null): Promise<PaymentItem | null> {
  const current = await listPayments();
  const existing = current.find((payment) => payment.id === id) ?? null;
  if (!existing) return null;

  const nextPaidAt = status === "paid" || status === "partial" ? new Date().toISOString() : null;
  const nextMethod = method === undefined ? existing.method : method;

  const updatedItems = current.map((payment) => {
    if (payment.id !== id) return payment;
    const nextDeferredUntil = status === "paid" ? null : payment.deferredUntil;
    const nextNotes = buildPaymentNotes(payment.publicNote, {
      sessionsCovered: payment.sessionsCovered,
      blockStartDate: payment.blockStartDate,
      blockEndDate: payment.blockEndDate,
      deferredUntil: nextDeferredUntil,
      invoiceNumber: payment.invoiceNumber,
      invoiceIssuedAt: payment.invoiceIssuedAt,
    });
    return {
      ...payment,
      status,
      method: nextMethod,
      paidAt: nextPaidAt,
      deferredUntil: nextDeferredUntil,
      notes: nextNotes,
    } satisfies PaymentItem;
  });

  const nextItem = updatedItems.find((payment) => payment.id === id) ?? null;
  const supabase = getSupabaseClient();
  if (!supabase) {
    saveLocalPayments(updatedItems);
    return nextItem;
  }

  const { error } = await supabase
    .from("payments")
    .update({
      status,
      method: nextMethod,
      paid_at: nextPaidAt,
      notes: nextItem?.notes ?? existing.notes ?? null,
    })
    .eq("id", id);

  if (error) {
    console.error("[payments] status update failed", error);
    throw new Error(error.message || "Failed to update payment status");
  }

  saveLocalPayments(updatedItems);
  return nextItem;
}

export function buildInvoiceShareMessage(payment: PaymentItem, locale: "ar" | "en" = "ar"): string {
  if (locale === "ar") {
    return [
      `فاتورة ${payment.invoiceNumber ?? payment.id}`,
      `الطالب: ${payment.studentName}`,
      `ولي الأمر: ${payment.parentName}`,
      `عدد الجلسات: ${payment.sessionsCovered}`,
      `المبلغ: ${payment.amount} ج.م`,
      `الاستحقاق: ${payment.dueDate.slice(0, 10)}`,
      payment.deferredUntil ? `مؤجل حتى: ${payment.deferredUntil.slice(0, 10)}` : null,
      `شركة Skidy Rein`,
    ].filter(Boolean).join("\n");
  }

  return [
    `Invoice ${payment.invoiceNumber ?? payment.id}`,
    `Student: ${payment.studentName}`,
    `Parent: ${payment.parentName}`,
    `Sessions: ${payment.sessionsCovered}`,
    `Amount: EGP ${payment.amount}`,
    `Due date: ${payment.dueDate.slice(0, 10)}`,
    payment.deferredUntil ? `Deferred until: ${payment.deferredUntil.slice(0, 10)}` : null,
    `Skidy Rein`,
  ].filter(Boolean).join("\n");
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
  const upcoming = sortByDateAsc(payments.filter((payment) => payment.status === "pending"), (payment) => payment.dueDate).slice(0, 5);

  return {
    totalExpected,
    totalCollected,
    totalOverdue,
    dueToday,
    collectionRate: totalExpected > 0 ? Math.round((totalCollected / totalExpected) * 100) : 0,
    upcoming,
  };
}
