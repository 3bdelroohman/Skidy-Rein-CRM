"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, ArrowRight, ReceiptText, TriangleAlert } from "lucide-react";
import { toast } from "sonner";

import { PageStateCard } from "@/components/shared/page-state";
import { canManagePaymentsForUser } from "@/config/roles";
import { useCurrentUser } from "@/providers/user-provider";
import { createPayment } from "@/services/payments.service";
import { listStudents } from "@/services/students.service";
import { useUIStore } from "@/stores/ui-store";
import type { PaymentMethod, PaymentStatus } from "@/types/common.types";
import type { StudentListItem } from "@/types/crm";
import { t } from "@/lib/locale";
import { cn } from "@/lib/utils";

const STATUS_OPTIONS: PaymentStatus[] = ["pending", "paid", "partial", "overdue"];
const METHOD_OPTIONS: Array<PaymentMethod | ""> = ["", "instapay", "bank_transfer", "wallet", "cash", "card"];

function normalizeSessionBlock(value: string): number {
  const parsed = Number(value || 4);
  if (!Number.isFinite(parsed)) return 4;
  return Math.max(4, Math.ceil(parsed / 4) * 4);
}

export default function NewPaymentPage() {
  const locale = useUIStore((state) => state.locale);
  const isAr = locale === "ar";
  const user = useCurrentUser();
  const canManage = canManagePaymentsForUser(user);
  const router = useRouter();
  const searchParams = useSearchParams();
  const [students, setStudents] = useState<StudentListItem[]>([]);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    studentId: "",
    amount: "1200",
    status: "pending" as PaymentStatus,
    method: "" as PaymentMethod | "",
    dueDate: new Date().toISOString().slice(0, 10),
    blockStartDate: new Date().toISOString().slice(0, 10),
    blockEndDate: "",
    deferredUntil: "",
    notes: "",
    sessionsCovered: "4",
  });

  useEffect(() => {
    listStudents().then((items) => {
      setStudents(items);
      const requestedStudentId = searchParams.get("studentId");
      if (requestedStudentId && items.some((student) => student.id === requestedStudentId)) {
        setForm((prev) => ({ ...prev, studentId: prev.studentId || requestedStudentId }));
      }
    });
  }, [searchParams]);

  const selectedStudent = useMemo(
    () => students.find((student) => student.id === form.studentId) ?? null,
    [students, form.studentId],
  );
  const normalizedSessions = useMemo(() => normalizeSessionBlock(form.sessionsCovered), [form.sessionsCovered]);
  const amountNumber = Number(form.amount || 0);
  const hasRoundedSessions = normalizedSessions !== Number(form.sessionsCovered || 0);

  if (!canManage) {
    return (
      <PageStateCard
        variant="danger"
        titleAr="لا تملك صلاحية إدارة المدفوعات"
        titleEn="You cannot manage payments"
        descriptionAr="إدارة المدفوعات محصورة على الأدوار المخولة فقط داخل الفريق المالي. يمكنك مشاهدة السجلات لكن لا يمكنك إنشاء دفعة جديدة."
        descriptionEn="Payment management is restricted to the approved finance users. You can review records but cannot create a new payment."
        actionHref="/payments"
        actionLabelAr="العودة إلى المدفوعات"
        actionLabelEn="Back to payments"
      />
    );
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!form.studentId) {
      toast.error(t(locale, "اختر الطالب أولاً", "Choose a student first"));
      return;
    }

    if (!Number.isFinite(amountNumber) || amountNumber <= 0) {
      toast.error(t(locale, "أدخل مبلغًا صحيحًا أكبر من صفر", "Enter a valid amount greater than zero"));
      return;
    }

    setSaving(true);
    try {
      const created = await createPayment({
        studentId: form.studentId,
        amount: amountNumber,
        status: form.status,
        method: form.method || null,
        dueDate: form.dueDate,
        sessionsCovered: normalizedSessions,
        blockStartDate: form.blockStartDate || null,
        blockEndDate: form.blockEndDate || null,
        deferredUntil: form.deferredUntil || null,
        notes: form.notes || null,
      });
      toast.success(t(locale, "تم إنشاء الدفعة بنجاح", "Payment created successfully"));
      router.push(`/payments/${created.id}`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t(locale, "تعذر إنشاء الدفعة", "Could not create payment"));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <button onClick={() => router.push("/payments")} className="rounded-xl p-2 text-muted-foreground transition-colors hover:bg-muted">
          {isAr ? <ArrowRight size={20} /> : <ArrowLeft size={20} />}
        </button>
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold text-foreground"><ReceiptText size={24} className="text-brand-600" />{t(locale, "إضافة دفعة جديدة", "Add new payment")}</h1>
          <p className="text-sm text-muted-foreground">{t(locale, "الفاتورة الافتراضية تغطي 4 جلسات. إذا أدخلت 5 أو 6 جلسات فسيتم تقريبها تلقائيًا إلى أقرب مضاعف لـ 4 حتى يبقى منطق الفوترة ثابتًا وواضحًا.", "The default invoice covers 4 sessions. If you enter 5 or 6 sessions, it will be rounded up to the nearest multiple of 4 so the billing logic stays consistent and clear.")}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-5 rounded-2xl border border-border bg-card p-5">
          <Field label={t(locale, "الطالب", "Student")}>
            <select value={form.studentId} onChange={(event) => setForm((prev) => ({ ...prev, studentId: event.target.value }))} className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm text-foreground">
              <option value="">{t(locale, "اختر الطالب", "Choose student")}</option>
              {students.map((student) => (
                <option key={student.id} value={student.id}>{student.fullName}</option>
              ))}
            </select>
          </Field>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label={t(locale, "المبلغ", "Amount")}>
              <input type="number" min="1" value={form.amount} onChange={(event) => setForm((prev) => ({ ...prev, amount: event.target.value }))} className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm text-foreground" />
            </Field>
            <Field label={t(locale, "عدد الجلسات", "Sessions covered")}>
              <input type="number" min="4" step="1" value={form.sessionsCovered} onChange={(event) => setForm((prev) => ({ ...prev, sessionsCovered: event.target.value }))} className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm text-foreground" />
            </Field>
          </div>

          {hasRoundedSessions ? (
            <div className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-100">
              <TriangleAlert size={18} className="mt-0.5 shrink-0" />
              <p>
                {t(locale, `سيتم إصدار الفاتورة على ${normalizedSessions} جلسات بدل ${form.sessionsCovered} لأن دورة الفوترة معتمدة على مضاعفات 4 جلسات.`, `The invoice will be issued for ${normalizedSessions} sessions instead of ${form.sessionsCovered}, because the billing cycle is locked to multiples of 4 sessions.`)}
              </p>
            </div>
          ) : null}

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label={t(locale, "الحالة", "Status")}>
              <select value={form.status} onChange={(event) => setForm((prev) => ({ ...prev, status: event.target.value as PaymentStatus }))} className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm text-foreground">
                {STATUS_OPTIONS.map((status) => (<option key={status} value={status}>{status}</option>))}
              </select>
            </Field>
            <Field label={t(locale, "طريقة الدفع", "Payment method")}>
              <select value={form.method} onChange={(event) => setForm((prev) => ({ ...prev, method: event.target.value as PaymentMethod | "" }))} className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm text-foreground">
                <option value="">{t(locale, "لاحقًا", "Later")}</option>
                {METHOD_OPTIONS.filter(Boolean).map((method) => (<option key={method} value={method}>{method}</option>))}
              </select>
            </Field>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Field label={t(locale, "بداية الباقة", "Block start")}>
              <input type="date" value={form.blockStartDate} onChange={(event) => setForm((prev) => ({ ...prev, blockStartDate: event.target.value }))} className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm text-foreground" />
            </Field>
            <Field label={t(locale, "نهاية الباقة", "Block end")}>
              <input type="date" value={form.blockEndDate} onChange={(event) => setForm((prev) => ({ ...prev, blockEndDate: event.target.value }))} className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm text-foreground" />
            </Field>
            <Field label={t(locale, "تاريخ الاستحقاق", "Due date")}>
              <input type="date" value={form.dueDate} onChange={(event) => setForm((prev) => ({ ...prev, dueDate: event.target.value }))} className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm text-foreground" />
            </Field>
          </div>

          <Field label={t(locale, "تأجيل الدفع حتى", "Deferred until")}>
            <input type="date" value={form.deferredUntil} onChange={(event) => setForm((prev) => ({ ...prev, deferredUntil: event.target.value }))} className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm text-foreground" />
          </Field>

          <Field label={t(locale, "ملاحظة", "Note")}>
            <textarea value={form.notes} onChange={(event) => setForm((prev) => ({ ...prev, notes: event.target.value }))} rows={4} className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm text-foreground" placeholder={t(locale, "مثال: اتفقنا أن يتم السداد بعد انتهاء الأربع جلسات", "Example: the parent will pay after the four sessions are completed")} />
          </Field>
        </div>

        <div className="space-y-5 rounded-2xl border border-border bg-card p-5">
          <h2 className="text-lg font-bold text-foreground">{t(locale, "ملخص سريع", "Quick summary")}</h2>
          <SummaryRow label={t(locale, "الطالب", "Student")} value={selectedStudent?.fullName ?? "—"} />
          <SummaryRow label={t(locale, "ولي الأمر", "Parent")} value={selectedStudent?.parentName ?? "—"} />
          <SummaryRow label={t(locale, "الفوترة", "Billing")} value={t(locale, `باقة ${normalizedSessions} جلسات`, `${normalizedSessions}-session block`)} />
          <SummaryRow label={t(locale, "المبلغ", "Amount")} value={form.amount ? `${form.amount} ${isAr ? "ج.م" : "EGP"}` : "—"} />
          <SummaryRow label={t(locale, "الاستحقاق", "Due date")} value={form.dueDate || "—"} />
          <SummaryRow label={t(locale, "التأجيل", "Deferred until")} value={form.deferredUntil || t(locale, "بدون تأجيل", "No deferment")} />

          <button type="submit" disabled={saving} className={cn("w-full rounded-xl bg-brand-700 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-brand-600", saving && "opacity-70")}>{saving ? t(locale, "جارِ الإنشاء...", "Creating...") : t(locale, "إنشاء الدفعة وإصدار فاتورة", "Create payment & issue invoice")}</button>
        </div>
      </form>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block space-y-2">
      <span className="text-sm font-semibold text-foreground">{label}</span>
      {children}
    </label>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-border py-2 last:border-0">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-sm font-medium text-foreground">{value}</span>
    </div>
  );
}
