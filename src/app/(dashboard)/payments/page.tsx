"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { AlertCircle, ArrowLeft, ArrowRight, Plus, Search, Wallet } from "lucide-react";
import { formatCurrencyEgp, formatDate } from "@/lib/formatters";
import { getPaymentMethodLabel, getPaymentStatusLabel, t } from "@/lib/locale";
import { cn } from "@/lib/utils";
import { getPaymentsSummary, listPayments } from "@/services/payments.service";
import { useUIStore } from "@/stores/ui-store";
import { useCurrentUser } from "@/providers/user-provider";
import { canManagePaymentsForUser } from "@/config/roles";
import type { PaymentItem } from "@/types/crm";
import type { PaymentStatus } from "@/types/common.types";

const PAYMENT_STATUS_META: Record<PaymentStatus, { color: string; bg: string }> = {
  paid: { color: "#059669", bg: "#ECFDF5" },
  pending: { color: "#D97706", bg: "#FFFBEB" },
  overdue: { color: "#DC2626", bg: "#FEF2F2" },
  refunded: { color: "#6B7280", bg: "#F3F4F6" },
  partial: { color: "#2563EB", bg: "#EFF6FF" },
};

export default function PaymentsPage() {
  const locale = useUIStore((state) => state.locale);
  const isAr = locale === "ar";
  const user = useCurrentUser();
  const canManagePayments = canManagePaymentsForUser(user);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<PaymentStatus | "all">("all");
  const [payments, setPayments] = useState<PaymentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState({
    totalExpected: 0,
    totalCollected: 0,
    totalOverdue: 0,
    dueToday: 0,
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
    load();
    return () => {
      isMounted = false;
    };
  }, []);

  const filtered = useMemo(() => {
    return payments.filter((payment) => {
      const query = search.trim().toLowerCase();
      const matchSearch = !query || payment.studentName.toLowerCase().includes(query) || payment.parentName.toLowerCase().includes(query) || (payment.invoiceNumber ?? "").toLowerCase().includes(query);
      const matchStatus = statusFilter === "all" || payment.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [payments, search, statusFilter]);

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-border bg-card p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="flex items-center gap-2 text-2xl font-bold text-foreground">
              <Wallet size={28} className="text-brand-600" />
              {t(locale, "المدفوعات", "Payments")}
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {t(locale, "التحصيل هنا مبني على باقة 4 جلسات، ويمكن تأجيل الاستحقاق حسب اتفاق ولي الأمر.", "Collections here are based on a 4-session block and the due date can be deferred if the parent agrees.")}
            </p>
          </div>

          {canManagePayments ? (
            <Link href="/payments/new" className="inline-flex items-center gap-2 rounded-xl bg-brand-700 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-600">
              <Plus size={16} />
              {t(locale, "إضافة دفعة", "Add payment")}
            </Link>
          ) : null}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 xl:grid-cols-5">
        <MetricCard label={t(locale, "إجمالي المستحق", "Total expected")} value={formatCurrencyEgp(summary.totalExpected, locale)} colorClass="text-foreground" />
        <MetricCard label={t(locale, "إجمالي المحصل", "Total collected")} value={formatCurrencyEgp(summary.totalCollected, locale)} colorClass="text-success-600" />
        <MetricCard label={t(locale, "إجمالي المتأخر", "Total overdue")} value={formatCurrencyEgp(summary.totalOverdue, locale)} colorClass="text-danger-600" />
        <MetricCard label={t(locale, "مستحق اليوم", "Due today")} value={summary.dueToday.toLocaleString(isAr ? "ar-EG" : "en-US")} colorClass="text-amber-600" />
        <MetricCard label={t(locale, "نسبة التحصيل", "Collection rate")} value={`${summary.collectionRate}%`} colorClass="text-brand-600" />
      </div>

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
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
        <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as PaymentStatus | "all")} className="rounded-xl border border-border bg-card px-4 py-2.5 text-sm text-foreground">
          <option value="all">{t(locale, "كل حالات الدفع", "All payment statuses")}</option>
          {Object.keys(PAYMENT_STATUS_META).map((key) => (
            <option key={key} value={key}>{getPaymentStatusLabel(key as PaymentStatus, locale)}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="rounded-2xl border border-border bg-card p-12 text-center text-muted-foreground">{t(locale, "جارِ تحميل بيانات المدفوعات...", "Loading payments...")}</div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-border bg-card">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1060px] text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className={cn("px-4 py-3 font-semibold text-muted-foreground", isAr ? "text-right" : "text-left")}>{t(locale, "الطالب", "Student")}</th>
                  <th className={cn("px-4 py-3 font-semibold text-muted-foreground", isAr ? "text-right" : "text-left")}>{t(locale, "ولي الأمر", "Parent")}</th>
                  <th className={cn("px-4 py-3 font-semibold text-muted-foreground", isAr ? "text-right" : "text-left")}>{t(locale, "الباقة", "Billing block")}</th>
                  <th className={cn("px-4 py-3 font-semibold text-muted-foreground", isAr ? "text-right" : "text-left")}>{t(locale, "المبلغ", "Amount")}</th>
                  <th className={cn("px-4 py-3 font-semibold text-muted-foreground", isAr ? "text-right" : "text-left")}>{t(locale, "الحالة", "Status")}</th>
                  <th className={cn("px-4 py-3 font-semibold text-muted-foreground", isAr ? "text-right" : "text-left")}>{t(locale, "طريقة الدفع", "Method")}</th>
                  <th className={cn("px-4 py-3 font-semibold text-muted-foreground", isAr ? "text-right" : "text-left")}>{t(locale, "الاستحقاق", "Due date")}</th>
                  <th className={cn("px-4 py-3 font-semibold text-muted-foreground", isAr ? "text-right" : "text-left")}>{t(locale, "الفاتورة", "Invoice")}</th>
                  <th className={cn("px-4 py-3 font-semibold text-muted-foreground", isAr ? "text-right" : "text-left")}>{t(locale, "التفاصيل", "Details")}</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((payment) => {
                  const meta = PAYMENT_STATUS_META[payment.status];
                  return (
                    <tr key={payment.id} className={cn("border-b border-border last:border-0 transition-colors hover:bg-muted/30", payment.status === "overdue" && "bg-danger-50/50") }>
                      <td className="px-4 py-3 font-semibold text-foreground">{payment.studentName}</td>
                      <td className="px-4 py-3 text-foreground">{payment.parentName}</td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">
                        <div>{t(locale, `${payment.sessionsCovered} جلسات`, `${payment.sessionsCovered} sessions`)}</div>
                        <div>{payment.blockStartDate ? formatDate(payment.blockStartDate, locale) : "—"} {isAr ? "→" : "→"} {payment.blockEndDate ? formatDate(payment.blockEndDate, locale) : t(locale, "مفتوح", "Open")}</div>
                        {payment.deferredUntil ? <div className="mt-1 text-amber-600">{t(locale, `مؤجل حتى ${formatDate(payment.deferredUntil, locale)}`, `Deferred until ${formatDate(payment.deferredUntil, locale)}`)}</div> : null}
                      </td>
                      <td className="px-4 py-3 font-semibold text-foreground">{formatCurrencyEgp(payment.amount, locale)}</td>
                      <td className="px-4 py-3"><span className="rounded-full px-2.5 py-1 text-xs font-semibold" style={{ backgroundColor: meta.bg, color: meta.color }}>{getPaymentStatusLabel(payment.status, locale)}</span></td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">{getPaymentMethodLabel(payment.method, locale)}</td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">{formatDate(payment.dueDate, locale)}</td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">{payment.invoiceNumber ?? "—"}</td>
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

      {summary.upcoming.length > 0 ? (
        <div className="rounded-2xl border border-border bg-card p-5">
          <div className="mb-4 flex items-center gap-2 text-foreground">
            <AlertCircle size={18} className="text-amber-600" />
            <h2 className="font-bold">{t(locale, "أقرب استحقاقات قادمة", "Upcoming due payments")}</h2>
          </div>
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {summary.upcoming.map((payment) => (
              <Link key={payment.id} href={`/payments/${payment.id}`} className="rounded-2xl border border-border p-4 transition-colors hover:bg-muted/30">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="font-semibold text-foreground">{payment.studentName}</p>
                    <p className="text-xs text-muted-foreground">{payment.parentName}</p>
                  </div>
                  <span className="text-sm font-bold text-brand-700">{formatCurrencyEgp(payment.amount, locale)}</span>
                </div>
                <p className="mt-2 text-xs text-muted-foreground">{formatDate(payment.dueDate, locale)}</p>
              </Link>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function MetricCard({ label, value, colorClass }: { label: string; value: string; colorClass: string }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <p className="text-xs font-semibold text-muted-foreground">{label}</p>
      <p className={cn("mt-2 text-xl font-bold", colorClass)}>{value}</p>
    </div>
  );
}
