"use client";

import { BarChart3, TrendingUp, Users, Wallet, Target, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { cn } from "@/lib/utils";

const FUNNEL_DATA = [
  { stage: "جديد", count: 45, color: "#6366F1" },
  { stage: "مؤهل", count: 32, color: "#8B5CF6" },
  { stage: "تم عرض Trial", count: 25, color: "#EC4899" },
  { stage: "تم الحجز", count: 20, color: "#F59E0B" },
  { stage: "حضر Trial", count: 16, color: "#10B981" },
  { stage: "تم إرسال العرض", count: 12, color: "#3B82F6" },
  { stage: "تم الدفع", count: 8, color: "#059669" },
];

const KPI_DATA = [
  { label: "معدل التحويل", value: "17.8%", change: "+2.3%", up: true, icon: Target },
  { label: "إيراد الشهر", value: "45,000 ج.م", change: "+10%", up: true, icon: Wallet },
  { label: "طلاب جدد", value: "8", change: "+3", up: true, icon: Users },
  { label: "متوسط وقت التحويل", value: "5.2 يوم", change: "-0.8", up: true, icon: TrendingUp },
];

const LOSS_REASONS = [
  { reason: "السعر", count: 12, pct: 35 },
  { reason: "لا يرد", count: 8, pct: 23 },
  { reason: "يريد أوفلاين", count: 5, pct: 15 },
  { reason: "مؤجل للامتحانات", count: 4, pct: 12 },
  { reason: "لا يوجد لابتوب", count: 3, pct: 9 },
  { reason: "أخرى", count: 2, pct: 6 },
];

const SALES_PERFORMANCE = [
  { name: "الاء", leads: 25, won: 5, rate: "20%", revenue: 22500 },
  { name: "سمر", leads: 20, won: 3, rate: "15%", revenue: 22500 },
];

export default function ReportsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <BarChart3 size={28} className="text-brand-600" />
          التقارير
        </h1>
        <p className="text-muted-foreground text-sm mt-1">تحليلات الأداء والمبيعات — أبريل 2026</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {KPI_DATA.map((kpi) => {
          const Icon = kpi.icon;
          return (
            <div key={kpi.label} className="bg-card rounded-2xl border border-border p-4">
              <div className="flex items-center justify-between mb-2">
                <Icon size={20} className="text-brand-600" />
                <span className={cn("text-xs font-semibold flex items-center gap-0.5", kpi.up ? "text-success-600" : "text-danger-600")}>
                  {kpi.up ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                  {kpi.change}
                </span>
              </div>
              <p className="text-2xl font-bold text-foreground">{kpi.value}</p>
              <p className="text-xs text-muted-foreground mt-1">{kpi.label}</p>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Funnel */}
        <div className="bg-card rounded-2xl border border-border p-5">
          <h3 className="font-bold text-foreground mb-4">قمع المبيعات</h3>
          <div className="space-y-3">
            {FUNNEL_DATA.map((item, i) => (
              <div key={item.stage} className="flex items-center gap-3">
                <span className="text-xs text-muted-foreground w-28 shrink-0 text-left">{item.stage}</span>
                <div className="flex-1 h-8 bg-muted/50 rounded-lg overflow-hidden">
                  <div className="h-full rounded-lg flex items-center px-2 transition-all" style={{ width: `${(item.count / FUNNEL_DATA[0].count) * 100}%`, backgroundColor: item.color }}>
                    <span className="text-white text-xs font-bold">{item.count}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Loss Reasons */}
        <div className="bg-card rounded-2xl border border-border p-5">
          <h3 className="font-bold text-foreground mb-4">أسباب الخسارة</h3>
          <div className="space-y-3">
            {LOSS_REASONS.map((item) => (
              <div key={item.reason} className="flex items-center gap-3">
                <span className="text-xs text-foreground w-32 shrink-0">{item.reason}</span>
                <div className="flex-1 h-6 bg-muted/50 rounded-lg overflow-hidden">
                  <div className="h-full bg-danger-400 rounded-lg" style={{ width: `${item.pct}%` }} />
                </div>
                <span className="text-xs text-muted-foreground w-8 text-left">{item.pct}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Sales Performance */}
      <div className="bg-card rounded-2xl border border-border p-5">
        <h3 className="font-bold text-foreground mb-4">أداء فريق المبيعات</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-right px-4 py-2 font-semibold text-muted-foreground">الاسم</th>
                <th className="text-right px-4 py-2 font-semibold text-muted-foreground">Leads</th>
                <th className="text-right px-4 py-2 font-semibold text-muted-foreground">Won</th>
                <th className="text-right px-4 py-2 font-semibold text-muted-foreground">معدل التحويل</th>
                <th className="text-right px-4 py-2 font-semibold text-muted-foreground">الإيراد</th>
              </tr>
            </thead>
            <tbody>
              {SALES_PERFORMANCE.map((s) => (
                <tr key={s.name} className="border-b border-border last:border-0">
                  <td className="px-4 py-3 font-semibold text-foreground">{s.name}</td>
                  <td className="px-4 py-3 text-foreground">{s.leads}</td>
                  <td className="px-4 py-3 text-success-600 font-bold">{s.won}</td>
                  <td className="px-4 py-3 text-foreground">{s.rate}</td>
                  <td className="px-4 py-3 font-bold text-foreground">{s.revenue.toLocaleString()} ج.م</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}