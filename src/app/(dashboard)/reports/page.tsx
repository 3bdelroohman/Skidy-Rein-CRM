"use client";

import { useEffect, useState } from "react";
import {
  ArrowDownRight,
  ArrowUpRight,
  BarChart3,
  Clock,
  Target,
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
          {t(locale, "قراءة تنفيذية لمعدل الاشتراك، القمع البيعي، أسباب الفقد، وأداء الفريق", "Executive view of enrollment rate, sales funnel, loss reasons, and team performance")}
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
                <h3 className="mb-4 font-bold text-foreground">{t(locale, "قراءة سريعة", "Quick read")}</h3>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                  <InsightTile title={getConversionTerm("conversionRate", locale)} value={data.kpis[0]?.value || "—"} />
                  <InsightTile title={t(locale, "أكثر سبب فقد", "Top loss reason")} value={data.lossReasons[0] ? getLocalizedLossReason(data.lossReasons[0].key, locale) : "—"} />
                  <InsightTile title={t(locale, "أفضل عضو", "Top rep")} value={data.salesPerformance[0]?.name || "—"} />
                </div>
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
                          <td className="px-4 py-3 font-bold text-foreground">{locale === "ar" ? item.revenue.toLocaleString("ar-EG") : item.revenue.toLocaleString("en-US")} {t(locale, "ج.م", "EGP")}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function InsightTile({ title, value }: { title: string; value: string }) {
  return (
    <div className="rounded-2xl border border-border bg-background p-4">
      <p className="text-xs text-muted-foreground">{title}</p>
      <p className="mt-2 text-base font-bold text-foreground">{value}</p>
    </div>
  );
}
