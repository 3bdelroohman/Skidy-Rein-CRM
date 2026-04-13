"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { AlertCircle, ArrowLeft, ArrowRight, PlusCircle, Search, Wallet } from "lucide-react";

import { formatCurrencyEgp, formatDate } from "@/lib/formatters";
import { getPaymentStatusLabel, t } from "@/lib/locale";
import { cn } from "@/lib/utils";
import {
  getBillingCycleText,
  getPaymentDisplayState,
  getPaymentEffectiveDueDate,
  getPaymentsSummary,
  listPayments,
} from "@/services/payments.service";
import { useUIStore } from "@/stores/ui-store";
import type { PaymentItem } from "@/types/crm";
import type { PaymentStatus } from "@/types/common.types";
import { useCurrentUser } from "@/providers/user-provider";
import { canAccessPaymentsForUser, canManagePaymentsForUser } from "@/config/roles";
import { PageStateCard } from "@/components/shared/page-state";

type DisplayStatus = PaymentStatus | "deferred";

const PAYMENT_STATUS_META: Record<DisplayStatus, { color: string; bg: string }> = {
  paid: { color: "#059669", bg: "#ECFDF5" },
  pending: { color: "#D97706", bg: "#FFFBEB" },
  overdue: { color: "#DC2626", bg: "#FEF2F2" },
  refunded: { color: "#6B7280", bg: "#F3F4F6" },
  partial: { color: "#2563EB", bg: "#EFF6FF" },
  deferred: { color: "#7C3AED", bg: "#F5F3FF" },
};

function getDisplayStatusLabel(status: DisplayStatus, locale: "ar" | "en") {
  return status === "deferred" ? t(locale, "مؤجل", "Deferred") : getPaymentStatusLabel(status, locale);
}

export default function PaymentsPage() {
  const locale = useUIStore((state) => state.locale);
  const isAr = locale === "ar";
  const user = useCurrentUser();
  const canAccess = canAccessPaymentsForUser(user);
  const canManage = canManagePaymentsForUser(user);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<DisplayStatus | "all">("all");
  const [payments, setPayments] = useState<PaymentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState({
    totalExpected: 0,
    totalCollected: 0,
    totalOverdue: 0,
    dueToday: 0,
    deferredCount: 0,
    collectionRate: 0,
    upcoming: [] as PaymentItem[],
  });

  useEffect(() => {
    let isMounted = true;

    async function load() {
      setLoading(true);
      const [data, nextSummary] = await Promise.all([listPayments(), getPaymentsSummary()]);
      if (isMounted) {
        setPayments(data);
        setSummary(nextSummary);
        setLoading(false);
      }
    }

    if (canAccess) {
      void load();
    }

    return () => {
      isMounted = false;
    };
  }, [canAccess]);

  const filtered = useMemo(() => {
    return payments.filter((payment) => {
      const query = search.trim().toLowerCase();
      const displayStatus = getPaymentDisplayState(payment);
      const matchSearch =
        !query ||
        payment.studentName.toLowerCase().includes(query) ||
        payment.parentName.toLowerCase().includes(query) ||
        (payment.invoiceNumber ?? "").toLowerCase().includes(query);
      const matchStatus = statusFilter === "all" || displayStatus === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [payments, search, statusFilter]);

  const statusCounts = useMemo(() => {
    return {
      paid: payments.filter((payment) => getPaymentDisplayState(payment) === "paid").length,
      pending: payments.filter((payment) => getPaymentDisplayState(payment) === "pending").length,
      overdue: payments.filter((payment) => getPaymentDisplayState(payment) === "overdue").length,
      partial: payments.filter((payment) => getPaymentDisplayState(payment) === "partial").length,
      deferred: payments.filter((payment) => getPaymentDisplayState(payment) === "deferred").length,
    };
  }, [payments]);

  if (!canAccess) {
    return (
      <PageStateCard
        variant="warning"
        titleAr="المدفوعات متاحة للمسؤولين المعتمدين فقط"
        titleEn="Payments are restricted to approved users"
        descriptionAr="إدارة المدفوعات والفواتير داخل Skidy Rein محصورة على خالد وعبدالرحمن والاء فقط. يمكنك الرجوع إلى لوحة التحكم أو متابعة أي قسم آخر حسب دورك."
        descriptionEn="Payments and invoicing in Skidy Rein are restricted to Khaled, Abdelrahman, and Alaa only. You can go back to the dashboard or continue working in the sections allowed for your role."
        actionHref="/"
        actionLabelAr="العودة إلى لوحة التحكم"
        actionLabelEn="Back to dashboard"
      />
    );
  }

  const hasRealPayments = payments.length > 0;
  const hasFilteredResults = filtered.length > 0;

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-border bg-card p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="flex items-center gap-2 text-2xl font-bold text-foreground">
              <Wallet size={28} className="text-brand-600" />
              {t(locale, "المدفوعات والفوترة", "Payments & billing")}
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {t(
                locale,
                "الفاتورة الافتراضية مبنية على كل 4 جلسات، ويمكن تأجيل الاستحقاق عند الاتفاق مع ولي الأمر. السجلات المؤرشفة لا تظهر هنا حتى يبقى التشغيل اليومي نظيفًا.",
                "The default billing cycle is one invoice for every 4 sessions, with flexible deferral when agreed with the parent. Archived records are hidden from this list to keep daily operations clean.",
              )}
            </p>
          </div>
          {canManage ? (
            <Link href="/payments/new" className="inline-flex items-center gap-2 rounded-2xl bg-brand-700 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-600">
              <PlusCircle size={18} />
              {t(locale, "إضافة دفعة", "Add payment")}
            </Link>
          ) : null}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 xl:grid-cols-5">
        <MetricCard label={t(locale, "إجمالي المستحق", "Total expected")} value={formatCurrencyEgp(summary.totalExpected, locale)} colorClass="text-foreground" />
        <MetricCard label={t(locale, "إجمالي المحصل", "Total collected")} value={formatCurrencyEgp(summary.totalCollected, locale)} colorClass="text-success-600" />
        <MetricCard label={t(locale, "إجمالي المتأخر", "Total overdue")} value={formatCurrencyEgp(summary.totalOverdue, locale)} colorClass="text-danger-600" />
        <MetricCard label={t(locale, "مستحق اليوم", "Due today")} value={String(summary.dueToday)} colorClass="text-amber-600" />
        <MetricCard label={t(locale, "مؤجل حاليًا", "Currently deferred")} value={String(summary.deferredCount)} colorClass="text-violet-600" />
      </div>

      <div className="grid grid-cols-2 gap-3 xl:grid-cols-5">
        <StatusMiniCard label={getDisplayStatusLabel("paid", locale)} count={statusCounts.paid} status="paid" />
        <StatusMiniCard label={getDisplayStatusLabel("pending", locale)} count={statusCounts.pending} status="pending" />
        <StatusMiniCard label={getDisplayStatusLabel("overdue", locale)} count={statusCounts.overdue} status="overdue" />
        <StatusMiniCard label={getDisplayStatusLabel("partial", locale)} count={statusCounts.partial} status="partial" />
        <StatusMiniCard label={getDisplayStatusLabel("deferred", locale)} count={statusCounts.deferred} status="deferred" />
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="relative flex-1">
              <Search size={18} className={cn("absolute top-1/2 -translate-y-1/2 text-muted-foreground", isAr ? "right-3" : "left-3")} />
              <input
                type="text"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder={t(locale, "بحث بالطالب أو ولي الأمر أو رقم الفاتورة...", "Search by student, parent, or invoice number...")}
                className={cn("w-full rounded-xl border border-border bg-card py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-ring", isAr ? "pr-10 pl-4" : "pl-10 pr-4")}
              />
            </div>
            <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as DisplayStatus | "all")} className="rounded-xl border border-border bg-card px-4 py-2.5 text-sm text-foreground">
              <option value="all">{t(locale, "كل حالات الدفع", "All payment statuses")}</option>
              {(["paid", "pending", "overdue", "partial", "deferred"] as DisplayStatus[]).map((key) => (
                <option key={key} value={key}>{getDisplayStatusLabel(key, locale)}</option>
              ))}
            </select>
          </div>

          {loading ? (
            <div className="rounded-2xl border border-border bg-card p-12 text-center text-muted-foreground">
              {t(locale, "جارِ تحميل بيانات المدفوعات...", "Loading payments...")}
            </div>
          ) : !hasRealPayments ? (
            <PageStateCard
              icon={AlertCircle}
              titleAr="لا توجد مدفوعات حقيقية مسجلة بعد"
              titleEn="No real payments have been recorded yet"
              descriptionAr="القائمة الآن صادقة بالكامل: لا توجد بيانات تجريبية معروضة. ابدأ بإضافة أول دفعة حقيقية وسيظهر أثرها هنا وفي الفواتير والتقارير."
              descriptionEn="This list is now fully honest: no demo data is shown. Create the first real payment and it will appear here, in invoices, and in reports."
              actionHref={canManage ? "/payments/new" : undefined}
              actionLabelAr="إضافة أول دفعة"
              actionLabelEn="Create the first payment"
            />
          ) : !hasFilteredResults ? (
            <div className="flex items-center justify-center gap-2 rounded-2xl border border-border bg-card p-12 text-muted-foreground">
              <AlertCircle size={18} />
              {t(locale, "لا توجد مدفوعات مطابقة للفلاتر الحالية", "No payments match the current filters")}
            </div>
          ) : (
            <div className="overflow-hidden rounded-2xl border border-border bg-card">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[980px] text-sm">
                  <thead>
                    <tr className="border-b border-border bg-muted/50">
                      <th className={cn("px-4 py-3 font-semibold text-muted-foreground", isAr ? "text-right" : "text-left")}>{t(locale, "الطالب", "Student")}</th>
                      <th className={cn("px-4 py-3 font-semibold text-muted-foreground", isAr ? "text-right" : "text-left")}>{t(locale, "ولي الأمر", "Parent")}</th>
                      <th className={cn("px-4 py-3 font-semibold text-muted-foreground", isAr ? "text-right" : "text-left")}>{t(locale, "دورة الفوترة", "Billing cycle")}</th>
                      <th className={cn("px-4 py-3 font-semibold text-muted-foreground", isAr ? "text-right" : "text-left")}>{t(locale, "المبلغ", "Amount")}</th>
                      <th className={cn("px-4 py-3 font-semibold text-muted-foreground", isAr ? "text-right" : "text-left")}>{t(locale, "الحالة", "Status")}</th>
                      <th className={cn("px-4 py-3 font-semibold text-muted-foreground", isAr ? "text-right" : "text-left")}>{t(locale, "الاستحقاق الفعلي", "Effective due")}</th>
                      <th className={cn("px-4 py-3 font-semibold text-muted-foreground", isAr ? "text-right" : "text-left")}>{t(locale, "التفاصيل", "Details")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((payment) => {
                      const displayStatus = getPaymentDisplayState(payment);
                      const meta = PAYMENT_STATUS_META[displayStatus];
                      return (
                        <tr key={payment.id} className={cn("border-b border-border last:border-0 transition-colors hover:bg-muted/30", displayStatus === "overdue" && "bg-danger-50/50")}>
                          <td className="px-4 py-3"><p className="font-semibold text-foreground">{payment.studentName}</p></td>
                          <td className="px-4 py-3 text-foreground">{payment.parentName}</td>
                          <td className="px-4 py-3 text-xs text-muted-foreground">{getBillingCycleText(payment, locale)}</td>
                          <td className="px-4 py-3 font-semibold text-foreground">{formatCurrencyEgp(payment.amount, locale)}</td>
                          <td className="px-4 py-3">
                            <span className="rounded-full px-2.5 py-1 text-xs font-semibold" style={{ backgroundColor: meta.bg, color: meta.color }}>
                              {getDisplayStatusLabel(displayStatus, locale)}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-xs text-muted-foreground">{formatDate(getPaymentEffectiveDueDate(payment), locale)}</td>
                          <td className="px-4 py-3">
                            <Link href={`/payments/${payment.id}`} className="inline-flex items-center gap-1 rounded-full border border-brand-200 bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-700 transition-colors hover:bg-brand-100 dark:border-brand-900 dark:bg-brand-950 dark:text-brand-300">
                              {t(locale, "فتح", "Open")}
                              {isAr ? <ArrowLeft size={13} /> : <ArrowRight size={13} />}
                            </Link>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-border bg-card p-5">
          <h3 className="mb-4 text-base font-bold text-foreground">{t(locale, "أقرب الاستحقاقات القادمة", "Next billing checkpoints")}</h3>
          {summary.upcoming.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
              {t(locale, "لا توجد استحقاقات قادمة حالياً", "There are no upcoming billing checkpoints right now")}
            </div>
          ) : (
            <div className="space-y-3">
              {summary.upcoming.map((payment) => {
                const displayStatus = getPaymentDisplayState(payment);
                return (
                  <Link key={payment.id} href={`/payments/${payment.id}`} className="block rounded-2xl border border-border p-3 transition-colors hover:bg-muted/40">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="font-semibold text-foreground">{payment.studentName}</p>
                        <p className="text-xs text-muted-foreground">{getBillingCycleText(payment, locale)}</p>
                      </div>
                      <span className="text-sm font-bold text-foreground">{formatCurrencyEgp(payment.amount, locale)}</span>
                    </div>
                    <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
                      <span>{formatDate(getPaymentEffectiveDueDate(payment), locale)}</span>
                      <span>{getDisplayStatusLabel(displayStatus, locale)}</span>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function MetricCard({ label, value, colorClass }: { label: string; value: string; colorClass: string }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={cn("mt-2 text-2xl font-bold", colorClass)}>{value}</p>
    </div>
  );
}

function StatusMiniCard({ label, count, status }: { label: string; count: number; status: DisplayStatus }) {
  const meta = PAYMENT_STATUS_META[status];
  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <span className="inline-flex rounded-full px-2.5 py-1 text-xs font-semibold" style={{ backgroundColor: meta.bg, color: meta.color }}>
        {label}
      </span>
      <p className="mt-3 text-2xl font-bold text-foreground">{count}</p>
    </div>
  );
}
