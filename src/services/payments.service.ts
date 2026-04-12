import { createBrowserClient } from "@supabase/ssr";

import type { PaymentMethod, PaymentStatus } from "@/types/common.types";
import type { Database } from "@/types/database.types";
import type { CreatePaymentInput, PaymentDetails, PaymentItem } from "@/types/crm";
import { isBrowser, sortByDateAsc, sortByDateDesc } from "@/services/storage";
import { listParents } from "@/services/parents.service";
import { listStudents } from "@/services/students.service";

const VALID_METHODS: PaymentMethod[] = ["bank_transfer", "card", "wallet", "cash", "instapay"];
const VALID_STATUSES: PaymentStatus[] = ["paid", "pending", "overdue", "refunded", "partial"];
const PAYMENT_META_PREFIX = "__SKIDY_PAYMENT_META__:";
const DEFAULT_SESSION_BLOCK = 4;

type PaymentRow = Database["public"]["Tables"]["payments"]["Row"];
type PaymentInsert = Database["public"]["Tables"]["payments"]["Insert"];
type PaymentUpdate = Database["public"]["Tables"]["payments"]["Update"];

interface PaymentMeta {
  sessionsCovered?: number;
  blockStartDate?: string | null;
  blockEndDate?: string | null;
  deferredUntil?: string | null;
  invoiceNumber?: string | null;
  invoiceIssuedAt?: string | null;
  publicNote?: string | null;
  archivedAt?: string | null;
  archivedBy?: string | null;
}

interface PaymentArchiveState {
  archived: boolean;
  archivedAt: string | null;
  archivedBy: string | null;
}

interface ListPaymentsOptions {
  includeArchived?: boolean;
}

function getSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key || !isBrowser()) return null;
  return createBrowserClient<Database>(url, key);
}

function getTodayDateKey(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
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

function normalizeDateKey(value: string | null | undefined): string | null {
  if (!value || typeof value !== "string") return null;
  return value.slice(0, 10);
}

function normalizeSessionBlock(value: number | null | undefined): number {
  const numeric = typeof value === "number" && Number.isFinite(value) ? value : DEFAULT_SESSION_BLOCK;
  return Math.max(DEFAULT_SESSION_BLOCK, Math.ceil(numeric / DEFAULT_SESSION_BLOCK) * DEFAULT_SESSION_BLOCK);
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
  return {
    publicNote: publicNote || meta.publicNote || null,
    meta,
  };
}

function buildPaymentNotes(publicNote: string | null | undefined, meta: PaymentMeta): string {
  const compactMeta: PaymentMeta = {
    sessionsCovered: normalizeSessionBlock(meta.sessionsCovered ?? DEFAULT_SESSION_BLOCK),
    blockStartDate: meta.blockStartDate ?? null,
    blockEndDate: meta.blockEndDate ?? null,
    deferredUntil: meta.deferredUntil ?? null,
    invoiceNumber: meta.invoiceNumber ?? null,
    invoiceIssuedAt: meta.invoiceIssuedAt ?? null,
    publicNote: publicNote?.trim() ? publicNote.trim() : null,
    archivedAt: meta.archivedAt ?? null,
    archivedBy: meta.archivedBy ?? null,
  };

  const parts = [`${PAYMENT_META_PREFIX}${JSON.stringify(compactMeta)}`];
  if (publicNote?.trim()) parts.push(publicNote.trim());
  return parts.join("\n");
}

function getArchiveStateFromNotes(rawNotes: string | null | undefined): PaymentArchiveState {
  const { meta } = parsePaymentMeta(rawNotes);
  return {
    archived: Boolean(meta.archivedAt),
    archivedAt: meta.archivedAt ?? null,
    archivedBy: meta.archivedBy ?? null,
  };
}

function sortPayments(items: PaymentItem[]): PaymentItem[] {
  return sortByDateDesc(items, (payment) => getPaymentEffectiveDueDate(payment));
}

function generateInvoiceNumber(existing: PaymentItem[]): string {
  const year = new Date().getFullYear();
  const maxSequence = existing.reduce((max, payment) => {
    const source = payment.invoiceNumber ?? "";
    const match = source.match(/SKR-(\d{4})-(\d{4,})/);
    if (!match) return max;
    const [, rawYear, rawSequence] = match;
    if (Number(rawYear) !== year) return max;
    const next = Number(rawSequence);
    return Number.isFinite(next) ? Math.max(max, next) : max;
  }, 0);

  return `SKR-${year}-${String(maxSequence + 1).padStart(4, "0")}`;
}

function getEffectiveDueDate(payment: Pick<PaymentItem, "dueDate" | "deferredUntil">): string {
  return payment.deferredUntil && payment.deferredUntil.length > 0 ? payment.deferredUntil : payment.dueDate;
}

function isDeferredPayment(payment: Pick<PaymentItem, "status" | "deferredUntil">): boolean {
  if (!payment.deferredUntil) return false;
  return payment.status === "pending" || payment.status === "overdue";
}

function isPastDate(value: string): boolean {
  const dateKey = normalizeDateKey(value);
  if (!dateKey) return false;
  return dateKey < getTodayDateKey();
}

function mapPaymentRow(
  row: PaymentRow | Record<string, unknown>,
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
    parentName:
      parent?.fullName ?? student?.parentName ?? asString(record.parent_name ?? record.parentName, "ولي أمر غير محدد"),
    amount: asNumber(record.amount),
    status: asStatus(record.status),
    method: asMethod(record.method),
    dueDate: asString(record.due_date ?? record.dueDate, new Date().toISOString()),
    paidAt: asNullableString(record.paid_at ?? record.paidAt),
    notes: rawNotes,
    publicNote,
    sessionsCovered: normalizeSessionBlock(meta.sessionsCovered ?? DEFAULT_SESSION_BLOCK),
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
    studentsMap: new Map(students.map((student) => [student.id, student] as const)),
    parentsMap: new Map(parents.map((parent) => [parent.id, parent] as const)),
  };
}

function assertSupabaseConfigured() {
  const supabase = getSupabaseClient();
  if (!supabase) {
    throw new Error("Supabase client is not available in the current browser session.");
  }
  return supabase;
}

async function readPaymentRows(): Promise<PaymentRow[]> {
  const supabase = assertSupabaseConfigured();
  const { data, error } = await supabase.from("payments").select("*").order("due_date", { ascending: false });

  if (error) {
    console.error("[payments] failed to load from Supabase", error);
    throw new Error(error.message || "Failed to load payments");
  }

  return (data ?? []) as PaymentRow[];
}

function toPaymentInsert(input: {
  id: string;
  studentId: string;
  amount: number;
  status: PaymentStatus;
  method: PaymentMethod | null;
  dueDate: string;
  paidAt: string | null;
  notes: string;
}): PaymentInsert {
  return {
    id: input.id,
    student_id: input.studentId,
    amount: input.amount,
    status: input.status,
    method: input.method,
    due_date: input.dueDate,
    paid_at: input.paidAt,
    notes: input.notes,
  } satisfies PaymentInsert;
}

function toPaymentStatusUpdate(payment: PaymentItem, status: PaymentStatus, method: PaymentMethod | null, paidAt: string | null): PaymentUpdate {
  return {
    status,
    method,
    paid_at: paidAt,
    notes: payment.notes,
  } satisfies PaymentUpdate;
}

export async function listPayments(options: ListPaymentsOptions = {}): Promise<PaymentItem[]> {
  const { includeArchived = false } = options;
  const supabase = getSupabaseClient();
  if (!supabase) return [];

  try {
    const [rows, { studentsMap, parentsMap }] = await Promise.all([readPaymentRows(), buildMaps()]);
    const mapped = rows.map((row) => mapPaymentRow(row, studentsMap, parentsMap));

    if (includeArchived) {
      return sortPayments(mapped);
    }

    return sortPayments(mapped.filter((payment) => !getPaymentArchiveState(payment).archived));
  } catch (error) {
    console.error("[payments] unexpected load failure", error);
    return [];
  }
}

export async function getPaymentById(id: string, options: ListPaymentsOptions = {}): Promise<PaymentItem | null> {
  const items = await listPayments({ includeArchived: options.includeArchived ?? true });
  return items.find((payment) => payment.id === id) ?? null;
}

export async function getPaymentDetails(id: string): Promise<PaymentDetails | null> {
  const [allPayments, activePayments, students, parents] = await Promise.all([
    listPayments({ includeArchived: true }),
    listPayments(),
    listStudents(),
    listParents(),
  ]);

  const payment = allPayments.find((item) => item.id === id) ?? null;
  if (!payment) return null;

  const archiveState = getPaymentArchiveState(payment);
  const student = payment.studentId ? students.find((item) => item.id === payment.studentId) ?? null : null;
  const parent = payment.parentId
    ? parents.find((item) => item.id === payment.parentId) ?? null
    : parents.find((item) => item.fullName === payment.parentName || item.phone === student?.parentPhone) ?? null;

  const siblingPayments = activePayments.filter((item) => {
    if (item.id === payment.id) return false;
    if (parent?.id && item.parentId === parent.id) return true;
    return item.parentName === payment.parentName;
  });

  const paymentHistory = sortPayments(
    activePayments.filter((item) => item.studentId && item.studentId === payment.studentId),
  );

  return {
    ...payment,
    notes: payment.notes,
    publicNote: payment.publicNote,
    student,
    parent,
    siblingPayments,
    paymentHistory: archiveState.archived ? paymentHistory.filter((item) => item.id !== payment.id) : paymentHistory,
  };
}

export async function listPaymentsByStudent(studentId: string): Promise<PaymentItem[]> {
  const payments = await listPayments();
  return payments.filter((payment) => payment.studentId === studentId);
}

export async function createPayment(input: CreatePaymentInput): Promise<PaymentItem> {
  if (!input.studentId) {
    throw new Error("Student is required before creating a payment.");
  }

  if (!Number.isFinite(input.amount) || input.amount <= 0) {
    throw new Error("Payment amount must be greater than zero.");
  }

  const supabase = assertSupabaseConfigured();
  const [{ studentsMap, parentsMap }, current] = await Promise.all([
    buildMaps(),
    listPayments({ includeArchived: true }),
  ]);
  const student = studentsMap.get(input.studentId) ?? null;
  const parent = student?.parentId ? parentsMap.get(student.parentId) ?? null : null;
  const now = new Date().toISOString();
  const paymentId = crypto.randomUUID();
  const invoiceNumber = generateInvoiceNumber(current);
  const sessionsCovered = normalizeSessionBlock(input.sessionsCovered ?? DEFAULT_SESSION_BLOCK);
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

  const { error } = await supabase.from("payments").insert(
    toPaymentInsert({
      id: paymentId,
      studentId: input.studentId,
      amount: input.amount,
      status: input.status,
      method: input.method,
      dueDate: input.dueDate,
      paidAt: payment.paidAt,
      notes,
    }),
  );

  if (error) {
    console.error("[payments] create failed", error);
    throw new Error(error.message || "Failed to create payment");
  }

  return payment;
}

export async function updatePaymentStatus(id: string, status: PaymentStatus, method?: PaymentMethod | null): Promise<PaymentItem | null> {
  const current = await listPayments({ includeArchived: true });
  const existing = current.find((payment) => payment.id === id) ?? null;
  if (!existing) return null;

  const archiveState = getPaymentArchiveState(existing);
  if (archiveState.archived) {
    throw new Error("Archived payments cannot be updated until they are restored.");
  }

  const nextPaidAt = status === "paid" || status === "partial" ? new Date().toISOString() : null;
  const nextMethod = method === undefined ? existing.method : method;
  const nextDeferredUntil = status === "paid" ? null : existing.deferredUntil;
  const nextNotes = buildPaymentNotes(existing.publicNote, {
    sessionsCovered: existing.sessionsCovered,
    blockStartDate: existing.blockStartDate,
    blockEndDate: existing.blockEndDate,
    deferredUntil: nextDeferredUntil,
    invoiceNumber: existing.invoiceNumber,
    invoiceIssuedAt: existing.invoiceIssuedAt,
    archivedAt: null,
    archivedBy: null,
  });

  const nextItem: PaymentItem = {
    ...existing,
    status,
    method: nextMethod,
    paidAt: nextPaidAt,
    deferredUntil: nextDeferredUntil,
    notes: nextNotes,
  };

  const supabase = assertSupabaseConfigured();
  const { error } = await supabase
    .from("payments")
    .update(toPaymentStatusUpdate(nextItem, status, nextMethod, nextPaidAt))
    .eq("id", id);

  if (error) {
    console.error("[payments] status update failed", error);
    throw new Error(error.message || "Failed to update payment status");
  }

  return nextItem;
}

export async function archivePayment(id: string, archivedBy?: string | null): Promise<PaymentItem | null> {
  const current = await listPayments({ includeArchived: true });
  const existing = current.find((payment) => payment.id === id) ?? null;
  if (!existing) return null;

  const archiveState = getPaymentArchiveState(existing);
  if (archiveState.archived) return existing;

  const now = new Date().toISOString();
  const nextNotes = buildPaymentNotes(existing.publicNote, {
    sessionsCovered: existing.sessionsCovered,
    blockStartDate: existing.blockStartDate,
    blockEndDate: existing.blockEndDate,
    deferredUntil: existing.deferredUntil,
    invoiceNumber: existing.invoiceNumber,
    invoiceIssuedAt: existing.invoiceIssuedAt,
    archivedAt: now,
    archivedBy: archivedBy ?? null,
  });

  const nextItem: PaymentItem = {
    ...existing,
    notes: nextNotes,
  };

  const supabase = assertSupabaseConfigured();
  const { error } = await supabase.from("payments").update({ notes: nextNotes } satisfies PaymentUpdate).eq("id", id);

  if (error) {
    console.error("[payments] archive failed", error);
    throw new Error(error.message || "Failed to archive payment");
  }

  return nextItem;
}

export async function restoreArchivedPayment(id: string): Promise<PaymentItem | null> {
  const current = await listPayments({ includeArchived: true });
  const existing = current.find((payment) => payment.id === id) ?? null;
  if (!existing) return null;

  const archiveState = getPaymentArchiveState(existing);
  if (!archiveState.archived) return existing;

  const nextNotes = buildPaymentNotes(existing.publicNote, {
    sessionsCovered: existing.sessionsCovered,
    blockStartDate: existing.blockStartDate,
    blockEndDate: existing.blockEndDate,
    deferredUntil: existing.deferredUntil,
    invoiceNumber: existing.invoiceNumber,
    invoiceIssuedAt: existing.invoiceIssuedAt,
    archivedAt: null,
    archivedBy: null,
  });

  const nextItem: PaymentItem = {
    ...existing,
    notes: nextNotes,
  };

  const supabase = assertSupabaseConfigured();
  const { error } = await supabase.from("payments").update({ notes: nextNotes } satisfies PaymentUpdate).eq("id", id);

  if (error) {
    console.error("[payments] restore failed", error);
    throw new Error(error.message || "Failed to restore payment");
  }

  return nextItem;
}

export async function deletePayment(id: string): Promise<boolean> {
  const supabase = assertSupabaseConfigured();
  const { error } = await supabase.from("payments").delete().eq("id", id);

  if (error) {
    console.error("[payments] delete failed", error);
    throw new Error(error.message || "Failed to delete payment");
  }

  return true;
}

export function getPaymentArchiveState(payment: Pick<PaymentItem, "notes">): PaymentArchiveState {
  return getArchiveStateFromNotes(payment.notes);
}

export function buildInvoiceShareMessage(payment: PaymentItem, locale: "ar" | "en" = "ar"): string {
  const effectiveDueDate = getPaymentEffectiveDueDate(payment).slice(0, 10);

  if (locale === "ar") {
    return [
      `فاتورة ${payment.invoiceNumber ?? payment.id}`,
      `الطالب: ${payment.studentName}`,
      `ولي الأمر: ${payment.parentName}`,
      `عدد الجلسات: ${payment.sessionsCovered}`,
      `المبلغ: ${payment.amount} ج.م`,
      `الاستحقاق الفعلي: ${effectiveDueDate}`,
      payment.deferredUntil ? `مؤجل حتى: ${payment.deferredUntil.slice(0, 10)}` : null,
      `شركة Skidy Rein`,
    ]
      .filter(Boolean)
      .join("\n");
  }

  return [
    `Invoice ${payment.invoiceNumber ?? payment.id}`,
    `Student: ${payment.studentName}`,
    `Parent: ${payment.parentName}`,
    `Sessions: ${payment.sessionsCovered}`,
    `Amount: EGP ${payment.amount}`,
    `Effective due date: ${effectiveDueDate}`,
    payment.deferredUntil ? `Deferred until: ${payment.deferredUntil.slice(0, 10)}` : null,
    `Skidy Rein`,
  ]
    .filter(Boolean)
    .join("\n");
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
  const today = getTodayDateKey();
  const dueToday = payments.filter((payment) => normalizeDateKey(getEffectiveDueDate(payment)) === today).length;
  const deferredCount = payments.filter((payment) => isDeferredPayment(payment) && !isPastDate(getEffectiveDueDate(payment))).length;
  const upcoming = sortByDateAsc(
    payments.filter((payment) => {
      if (payment.status !== "pending" && payment.status !== "overdue") return false;
      const effectiveDue = normalizeDateKey(getEffectiveDueDate(payment));
      return Boolean(effectiveDue && effectiveDue >= today);
    }),
    (payment) => getEffectiveDueDate(payment),
  ).slice(0, 5);

  return {
    totalExpected,
    totalCollected,
    totalOverdue,
    dueToday,
    deferredCount,
    collectionRate: totalExpected > 0 ? Math.round((totalCollected / totalExpected) * 100) : 0,
    upcoming,
  };
}

export function getPaymentDisplayState(payment: PaymentItem): "paid" | "pending" | "overdue" | "partial" | "refunded" | "deferred" {
  if (isDeferredPayment(payment) && !isPastDate(getEffectiveDueDate(payment))) return "deferred";
  return payment.status;
}

export function getPaymentEffectiveDueDate(payment: Pick<PaymentItem, "dueDate" | "deferredUntil">): string {
  return getEffectiveDueDate({ dueDate: payment.dueDate, deferredUntil: payment.deferredUntil });
}

export function getBillingCycleText(
  payment: Pick<PaymentItem, "sessionsCovered" | "blockStartDate" | "blockEndDate" | "deferredUntil">,
  locale: "ar" | "en" = "ar",
): string {
  const sessions = normalizeSessionBlock(payment.sessionsCovered ?? DEFAULT_SESSION_BLOCK);

  if (locale === "ar") {
    const dateRange = payment.blockStartDate || payment.blockEndDate
      ? ` — ${payment.blockStartDate?.slice(0, 10) ?? "..."} → ${payment.blockEndDate?.slice(0, 10) ?? "..."}`
      : "";
    const deferred = payment.deferredUntil ? ` — مؤجلة حتى ${payment.deferredUntil.slice(0, 10)}` : "";
    return `باقة ${sessions} جلسات${dateRange}${deferred}`;
  }

  const dateRange = payment.blockStartDate || payment.blockEndDate
    ? ` — ${payment.blockStartDate?.slice(0, 10) ?? "..."} → ${payment.blockEndDate?.slice(0, 10) ?? "..."}`
    : "";
  const deferred = payment.deferredUntil ? ` — deferred until ${payment.deferredUntil.slice(0, 10)}` : "";
  return `${sessions}-session billing block${dateRange}${deferred}`;
}
