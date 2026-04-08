"use client";

import { use, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, CalendarDays, ReceiptText, UserRound, Wallet } from "lucide-react";
import { toast } from "sonner";
import { formatCurrencyEgp, formatDate } from "@/lib/formatters";
import { getPaymentMethodLabel, getPaymentStatusLabel, t } from "@/lib/locale";
import { cn } from "@/lib/utils";
import { getPaymentDetails, updatePaymentStatus } from "@/services/payments.service";
import { useUIStore } from "@/stores/ui-store";
import type { PaymentDetails } from "@/types/crm";
import type { PaymentMethod, PaymentStatus } from "@/types/common.types";
import { LoadingState, PageStateCard } from "@/components/shared/page-state";

const STATUS_META: Record<PaymentStatus, { bg: string; color: string }> = {
  paid: { bg: "#ECFDF5", color: "#059669" },
  pending: { bg: "#FFFBEB", color: "#D97706" },
  overdue: { bg: "#FEF2F2", color: "#DC2626" },
  refunded: { bg: "#F3F4F6", color: "#6B7280" },
  partial: { bg: "#EFF6FF", color: "#2563EB" },
};

const STATUS_ACTIONS: Array<{ status: PaymentStatus; method?: PaymentMethod | null }> = [
  { status: "paid", method: "instapay" },
  { status: "partial", method: "instapay" },
  { status: "pending" },
  { status: "overdue" },
];

export default function PaymentDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const locale = useUIStore((state) => state.locale);
  const isAr = locale === "ar";
  const [payment, setPayment] = useState<PaymentDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<PaymentStatus | null>(null);

  useEffect(() => {
    let isMounted = true;
    async function load() {
      setLoading(true);
      const data = await getPaymentDetails(id);
      if (isMounted) {
        setPayment(data);
        setLoading(false);
      }
    }
    load();
    return () => {
      isMounted = false;
    };
  }, [id]);

  async function handleStatusChange(status: PaymentStatus, method?: PaymentMethod | null) {
    setSaving(status);
    const updated = await updatePaymentStatus(id, status, method);
    if (updated) {
      const refreshed = await getPaymentDetails(id);
      setPayment(refreshed);
      toast.success(t(locale, "تم تحديث حالة الدفع", "Payment status updated"));
    }
    setSaving(null);
  }

  const siblingTotal = useMemo(
    () => payment?.siblingPayments.reduce((sum, item) => sum + item.amount, 0) ?? 0,
    [payment],
  );

  if (loading) {
    return (
      <LoadingState
        titleAr="جارِ تحميل بيانات الدفعة"
        titleEn="Loading payment details"
        descriptionAr="يتم الآن تجهيز تفاصيل السداد والحالة الحالية للدفعة."
        descriptionEn="Payment details and the current collection status are being prepared."
      />
    );
  }

  if (!payment) {
    return (
      <PageStateCard
        variant="warning"
        titleAr="الدفعة غير موجودة"
        titleEn="Payment not found"
        descriptionAr="قد تكون هذه الدفعة محذوفة أو أن الرابط غير صحيح. ارجع إلى صفحة المدفوعات ثم اختر السجل الصحيح."
        descriptionEn="This payment may have been removed or the link is incorrect. Go back to the payments page and open the correct record."
        actionHref="/payments"
        actionLabelAr="العودة إلى المدفوعات"
        actionLabelEn="Back to payments"
      />
    );
  }

  const meta = STATUS_META[payment.status];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => router.push("/payments")} className="rounded-xl p-2 text-muted-foreground transition-colors hover:bg-muted">
            {isAr ? <ArrowRight size={20} /> : <ArrowLeft size={20} />}
          </button>
          <div>
            <h1 className="text-2xl font-bold text-foreground">{payment.studentName}</h1>
            <p className="text-sm text-muted-foreground">{payment.parentName}</p>
          </div>
        </div>

        <span className="inline-flex rounded-full px-3 py-1 text-sm font-semibold" style={{ backgroundColor: meta.bg, color: meta.color }}>
          {getPaymentStatusLabel(payment.status, locale)}
        </span>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-6">
          <div className="rounded-2xl border border-border bg-card p-5">
            <h3 className="mb-4 flex items-center gap-2 font-bold text-foreground"><ReceiptText size={18} className="text-brand-600" />{t(locale, "تفاصيل الدفعة", "Payment details")}</h3>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <InfoRow label={t(locale, "الطالب", "Student")} value={payment.studentName} align={isAr ? "left" : "right"} />
              <InfoRow label={t(locale, "ولي الأمر", "Parent")} value={payment.parentName} align={isAr ? "left" : "right"} />
              <InfoRow label={t(locale, "المبلغ", "Amount")} value={formatCurrencyEgp(payment.amount, locale)} align={isAr ? "left" : "right"} />
              <InfoRow label={t(locale, "طريقة الدفع", "Payment method")} value={getPaymentMethodLabel(payment.method, locale)} align={isAr ? "left" : "right"} />
              <InfoRow label={t(locale, "تاريخ الاستحقاق", "Due date")} value={formatDate(payment.dueDate, locale)} align={isAr ? "left" : "right"} />
              <InfoRow label={t(locale, "تاريخ الدفع", "Paid at")} value={formatDate(payment.paidAt, locale)} align={isAr ? "left" : "right"} />
            </div>
            {payment.notes ? (
              <div className="mt-4 rounded-2xl border border-border bg-background p-4 text-sm text-muted-foreground">
                {payment.notes}
              </div>
            ) : null}
          </div>

          <div className="rounded-2xl border border-border bg-card p-5">
            <h3 className="mb-4 flex items-center gap-2 font-bold text-foreground"><Wallet size={18} className="text-brand-600" />{t(locale, "إجراءات سريعة", "Quick actions")}</h3>
            <div className="flex flex-wrap gap-2">
              {STATUS_ACTIONS.map((action) => {
                const actionMeta = STATUS_META[action.status];
                return (
                  <button
                    key={action.status}
                    type="button"
                    disabled={saving === action.status}
                    onClick={() => handleStatusChange(action.status, action.method)}
                    className={cn("rounded-full border px-4 py-2 text-xs font-semibold transition-all hover:-translate-y-0.5 hover:shadow-sm disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0")}
                    style={{ backgroundColor: actionMeta.bg, color: actionMeta.color, borderColor: `${actionMeta.color}44` }}
                  >
                    {saving === action.status ? t(locale, "جارِ التحديث...", "Updating...") : getPaymentStatusLabel(action.status, locale)}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-card p-5">
            <h3 className="mb-4 font-bold text-foreground">{t(locale, "سجل الطالب المالي", "Student payment history")}</h3>
            {payment.paymentHistory.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
                {t(locale, "لا توجد دفعات أخرى مرتبطة بهذا الطالب", "There are no other payments linked to this student")}
              </div>
            ) : (
              <div className="space-y-3">
                {payment.paymentHistory.map((item) => (
                  <Link key={item.id} href={`/payments/${item.id}`} className="flex items-center justify-between gap-3 rounded-2xl border border-border p-3 transition-colors hover:bg-muted/30">
                    <div>
                      <p className="font-semibold text-foreground">{formatCurrencyEgp(item.amount, locale)}</p>
                      <p className="text-xs text-muted-foreground">{formatDate(item.dueDate, locale)}</p>
                    </div>
                    <span className="rounded-full px-2.5 py-1 text-xs font-semibold" style={{ backgroundColor: STATUS_META[item.status].bg, color: STATUS_META[item.status].color }}>
                      {getPaymentStatusLabel(item.status, locale)}
                    </span>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-2xl border border-border bg-card p-5">
            <h3 className="mb-4 flex items-center gap-2 font-bold text-foreground"><CalendarDays size={18} className="text-brand-600" />{t(locale, "ملخص سريع", "Quick summary")}</h3>
            <div className="space-y-3">
              <InfoRow label={t(locale, "الحالة الحالية", "Current status")} value={getPaymentStatusLabel(payment.status, locale)} align={isAr ? "left" : "right"} />
              <InfoRow label={t(locale, "قابل للتحصيل", "Collectible amount")} value={formatCurrencyEgp(payment.amount, locale)} align={isAr ? "left" : "right"} />
              <InfoRow label={t(locale, "مدفوعات مرتبطة بالأسرة", "Family related payments")} value={formatCurrencyEgp(siblingTotal, locale)} align={isAr ? "left" : "right"} />
              <InfoRow label={t(locale, "مرجع الطالب", "Student record")} value={payment.studentId ? t(locale, "متوفر", "Available") : t(locale, "غير مرتبط", "Unlinked")} align={isAr ? "left" : "right"} />
            </div>
          </div>

          {payment.studentId ? (
            <Link href={`/students/${payment.studentId}`} className="block rounded-2xl border border-border bg-card p-5 transition-colors hover:bg-muted/30">
              <p className="text-sm font-semibold text-foreground">{t(locale, "فتح ملف الطالب", "Open student profile")}</p>
              <p className="mt-1 text-xs text-muted-foreground">{payment.studentName}</p>
            </Link>
          ) : null}

          {payment.parent ? (
            <Link href={`/parents/${payment.parent.id}`} className="block rounded-2xl border border-border bg-card p-5 transition-colors hover:bg-muted/30">
              <div className="flex items-center gap-2 text-foreground"><UserRound size={16} className="text-brand-600" /><span className="text-sm font-semibold">{t(locale, "فتح ملف ولي الأمر", "Open parent profile")}</span></div>
              <p className="mt-1 text-xs text-muted-foreground">{payment.parent.fullName}</p>
            </Link>
          ) : null}

          {payment.siblingPayments.length > 0 ? (
            <div className="rounded-2xl border border-border bg-card p-5">
              <h3 className="mb-4 font-bold text-foreground">{t(locale, "دفعات الأسرة الأخرى", "Other family payments")}</h3>
              <div className="space-y-3">
                {payment.siblingPayments.slice(0, 4).map((item) => (
                  <Link key={item.id} href={`/payments/${item.id}`} className="block rounded-2xl border border-border p-3 transition-colors hover:bg-muted/30">
                    <div className="flex items-center justify-between gap-2">
                      <div>
                        <p className="font-semibold text-foreground">{item.studentName}</p>
                        <p className="text-xs text-muted-foreground">{formatDate(item.dueDate, locale)}</p>
                      </div>
                      <span className="text-sm font-bold text-foreground">{formatCurrencyEgp(item.amount, locale)}</span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function InfoRow({ label, value, align = "left" }: { label: string; value: string; align?: "left" | "right" }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-border/70 py-2 last:border-0">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className={cn("text-sm font-medium text-foreground", align === "left" ? "text-left" : "text-right")}>{value}</span>
    </div>
  );
}
