"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowDownRight,
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  BarChart3,
  Clock,
  Target,
  TrendingUp,
  Users,
  Wallet,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { getConversionTerm, t } from "@/lib/locale";
import { getLocalizedFunnelStage, getLocalizedLossReason, getReportsData } from "@/services/reports.service";
import { useUIStore } from "@/stores/ui-store";
import type { ReportsData } from "@/types/crm";

const KPI_ICON_MAP = {
  target: Target,
  wallet: Wallet,
  users: Users,
  clock: Clock,
} as const;

const TONE_STYLES = {
  brand: { bg: "#EEF2FF", color: "#4338CA", border: "#C7D2FE" },
  success: { bg: "#ECFDF5", color: "#059669", border: "#A7F3D0" },
  warning: { bg: "#FFFBEB", color: "#D97706", border: "#FCD34D" },
  danger: { bg: "#FEF2F2", color: "#DC2626", border: "#FCA5A5" },
  info: { bg: "#EFF6FF", color: "#2563EB", border: "#BFDBFE" },
} as const;

export default function ReportsPage() {
  const locale = useUIStore((state) => state.locale);
  const isAr = locale === "ar";
  const [data, setData] = useState<ReportsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    async function load() {
      setLoading(true);
      const reports = await getReportsData(locale);
      if (isMounted) {
        setData(reports);
        setLoading(false);
      }
    }
    load();
    return () => {
      isMounted = false;
    };
  }, [locale]);

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-border bg-card p-6">
        <h1 className="flex items-center gap-2 text-2xl font-bold text-foreground">
          <BarChart3 size={28} className="text-brand-600" />
          {t(locale, "التقارير", "Reports")}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {t(locale, "قراءة تنفيذية لمعدل الاشتراك، القمع البيعي، التحصيل، وسرعة التشغيل", "Executive view of enrollment rate, funnel, collections, and operating velocity")}
        </p>
      </div>

      {loading || !data ? (
        <div className="rounded-2xl border border-border bg-card p-12 text-center text-muted-foreground">
          {t(locale, "جارِ تجهيز التقرير...", "Preparing report...")}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
            {data.kpis.map((kpi) => {
              const Icon = KPI_ICON_MAP[kpi.icon];
              return (
                <div key={kpi.label} className="rounded-2xl border border-border bg-card p-4">
                  <div className="mb-3 flex items-center justify-between">
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-brand-50 text-brand-700 dark:bg-brand-950 dark:text-brand-300">
                      <Icon size={20} />
                    </div>
                    <span className={cn("flex items-center gap-0.5 text-xs font-semibold", kpi.up ? "text-success-600" : "text-danger-600")}>
                      {kpi.up ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                      {kpi.change}
                    </span>
                  </div>
                  <p className="text-2xl font-bold text-foreground">{kpi.value}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{kpi.label}</p>
                </div>
              );
            })}
          </div>

          <div className="grid grid-cols-1 gap-4 xl:grid-cols-4">
            <SummaryCard title={t(locale, "نسبة التحصيل", "Collection rate")} value={`${data.collection.rate}%`} subtitle={t(locale, "من الإجمالي المتوقع لهذا الشهر", "From this month expected total")} tone={data.collection.rate >= 80 ? "success" : data.collection.rate >= 60 ? "warning" : "danger"} />
            <SummaryCard title={t(locale, "المحصل", "Collected")} value={formatMoney(data.collection.collected, locale)} subtitle={t(locale, "دخل فعلي مسجل", "Recorded actual cash in")} tone="success" />
            <SummaryCard title={t(locale, "المتأخر", "Overdue")} value={formatMoney(data.collection.overdue, locale)} subtitle={t(locale, "يحتاج تحصيل عاجل", "Needs urgent collection")} tone={data.collection.overdue > 0 ? "danger" : "info"} />
            <SummaryCard title={t(locale, "المتوقع", "Expected")} value={formatMoney(data.collection.expected, locale)} subtitle={t(locale, "إجمالي الفواتير الحالية", "Current billing total")} tone="brand" />
          </div>

          <div className="grid grid-cols-1 gap-6 xl:grid-cols-[0.95fr_1.05fr]">
            <div className="space-y-6">
              <div className="rounded-2xl border border-border bg-card p-5">
                <h3 className="mb-4 font-bold text-foreground">{t(locale, "قمع المبيعات", "Sales funnel")}</h3>
                <div className="space-y-4">
                  {data.funnel.map((item) => {
                    const base = Math.max(1, data.funnel[0]?.count || 1);
                    return (
                      <div key={item.stage} className="space-y-2">
                        <div className="flex items-center justify-between gap-3 text-sm">
                          <span className="font-medium text-foreground">{getLocalizedFunnelStage(item.stage, locale)}</span>
                          <span className="text-muted-foreground">{item.count}</span>
                        </div>
                        <div className="h-3 overflow-hidden rounded-full bg-muted/60">
                          <div className="h-full rounded-full transition-all" style={{ width: `${(item.count / base) * 100}%`, backgroundColor: item.color }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="rounded-2xl border border-border bg-card p-5">
                <div className="mb-4 flex items-center gap-2 text-foreground">
                  <TrendingUp size={18} className="text-brand-600" />
                  <h3 className="font-bold">{t(locale, "سرعة المراحل", "Stage velocity")}</h3>
                </div>
                {data.stageVelocity.length === 0 ? (
                  <EmptyBlock label={t(locale, "لا توجد بيانات كافية لحساب سرعة المراحل", "Not enough data to calculate stage velocity")} />
                ) : (
                  <div className="space-y-3">
                    {data.stageVelocity.map((item) => (
                      <div key={item.stage} className="flex items-center justify-between gap-3 rounded-2xl border border-border bg-background p-4">
                        <div>
                          <p className="font-semibold text-foreground">{getLocalizedFunnelStage(item.stage, locale)}</p>
                          <p className="text-xs text-muted-foreground">{t(locale, "متوسط زمن البقاء في هذه المرحلة", "Average time spent in this stage")}</p>
                        </div>
                        <div className="text-left">
                          <p className="text-xl font-bold text-foreground">{item.days}</p>
                          <p className="text-xs text-muted-foreground">{t(locale, "يوم", "days")}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-6">
              <div className="rounded-2xl border border-border bg-card p-5">
                <h3 className="mb-4 font-bold text-foreground">{t(locale, "أسباب عدم الاشتراك", "Loss reasons")}</h3>
                <div className="space-y-3">
                  {data.lossReasons.map((item) => (
                    <div key={item.key} className="flex items-center gap-3">
                      <span className="w-40 shrink-0 text-xs text-foreground">{getLocalizedLossReason(item.key, locale)}</span>
                      <div className="h-6 flex-1 overflow-hidden rounded-lg bg-muted/50">
                        <div className="h-full rounded-lg bg-danger-400" style={{ width: `${item.pct}%` }} />
                      </div>
                      <span className="w-10 text-left text-xs text-muted-foreground">{item.pct}%</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-2xl border border-border bg-card p-5">
                <h3 className="mb-4 font-bold text-foreground">{t(locale, "ملخص تشغيلي", "Operational summary")}</h3>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {data.operationalSummary.map((item) => (
                    <SummaryCard key={item.title} title={item.title} value={item.value} subtitle={item.subtitle} tone={item.tone} />
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.05fr_0.95fr]">
            <div className="rounded-2xl border border-border bg-card p-5">
              <h3 className="mb-4 font-bold text-foreground">{t(locale, "أداء فريق المبيعات", "Sales team performance")}</h3>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[640px] text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className={cn("px-4 py-2 font-semibold text-muted-foreground", isAr ? "text-right" : "text-left")}>{t(locale, "الاسم", "Name")}</th>
                      <th className={cn("px-4 py-2 font-semibold text-muted-foreground", isAr ? "text-right" : "text-left")}>{t(locale, "العملاء", "Leads")}</th>
                      <th className={cn("px-4 py-2 font-semibold text-muted-foreground", isAr ? "text-right" : "text-left")}>{getConversionTerm("successfulConversion", locale)}</th>
                      <th className={cn("px-4 py-2 font-semibold text-muted-foreground", isAr ? "text-right" : "text-left")}>{getConversionTerm("conversionRate", locale)}</th>
                      <th className={cn("px-4 py-2 font-semibold text-muted-foreground", isAr ? "text-right" : "text-left")}>{t(locale, "الإيراد", "Revenue")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.salesPerformance.map((item) => (
                      <tr key={item.name} className="border-b border-border last:border-0">
                        <td className="px-4 py-3 font-semibold text-foreground">{item.name}</td>
                        <td className="px-4 py-3 text-foreground">{item.leads}</td>
                        <td className="px-4 py-3 font-bold text-success-600">{item.won}</td>
                        <td className="px-4 py-3 text-foreground">{item.rate}</td>
                        <td className="px-4 py-3 font-bold text-foreground">{locale === "ar" ? item.revenue.toLocaleString("en-US") : item.revenue.toLocaleString("en-US")} {t(locale, "ج.م", "EGP")}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="rounded-2xl border border-border bg-card p-5">
              <div className="mb-4 flex items-center gap-2 text-foreground">
                <Target size={18} className="text-brand-600" />
                <h3 className="font-bold">{t(locale, "توصيات التنفيذ التالية", "Recommended next moves")}</h3>
              </div>
              {data.recommendations.length === 0 ? (
                <EmptyBlock label={t(locale, "لا توجد توصيات إضافية الآن", "There are no extra recommendations right now")} />
              ) : (
                <div className="space-y-3">
                  {data.recommendations.map((item) => {
                    const tone = item.priority === "high" ? "danger" : item.priority === "medium" ? "warning" : "brand";
                    const styles = TONE_STYLES[tone];
                    return (
                      <Link key={`${item.href}-${item.title}`} href={item.href} className="block rounded-2xl border p-4 transition-all hover:-translate-y-0.5 hover:shadow-sm" style={{ background: styles.bg, borderColor: styles.border }}>
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="font-semibold" style={{ color: styles.color }}>{item.title}</p>
                            <p className="mt-2 text-sm text-muted-foreground">{item.description}</p>
                          </div>
                          {isAr ? <ArrowLeft size={16} style={{ color: styles.color }} /> : <ArrowRight size={16} style={{ color: styles.color }} />}
                        </div>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function SummaryCard({ title, value, subtitle, tone }: { title: string; value: string; subtitle: string; tone: keyof typeof TONE_STYLES }) {
  const styles = TONE_STYLES[tone];
  return (
    <div className="rounded-2xl border p-4" style={{ background: styles.bg, borderColor: styles.border }}>
      <p className="text-xs font-semibold" style={{ color: styles.color }}>{title}</p>
      <p className="mt-2 text-2xl font-bold text-foreground">{value}</p>
      <p className="mt-2 text-xs text-muted-foreground">{subtitle}</p>
    </div>
  );
}

function EmptyBlock({ label }: { label: string }) {
  return <div className="rounded-2xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">{label}</div>;
}

function formatMoney(value: number, locale: "ar" | "en") {
  return `${locale === "ar" ? value.toLocaleString("en-US") : value.toLocaleString("en-US")} ${t(locale, "ج.م", "EGP")}`;
}
