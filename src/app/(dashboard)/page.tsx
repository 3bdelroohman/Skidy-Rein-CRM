"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  BellDot,
  CalendarDays,
  CheckCircle2,
  ClipboardCheck,
  Clock,
  GraduationCap,
  Phone,
  Target,
  TrendingUp,
  TriangleAlert,
  Users,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import { DASHBOARD_TASK_STATUS_META } from "@/config/status-meta";
import { cn } from "@/lib/utils";
import { useCurrentUser } from "@/providers/user-provider";
import { getDashboardOperationToneStyles, getDashboardOverview } from "@/services/dashboard.service";
import { getOwnerSnapshot, type OwnerSnapshotItem } from "@/services/owner-summary.service";
import { useUIStore } from "@/stores/ui-store";
import { t } from "@/lib/locale";
import type { DashboardActionItem, DashboardOverview, DashboardOperationItem } from "@/types/crm";

function isManagement(role: string): boolean {
  return role === "admin" || role === "owner";
}

const DASHBOARD_GLYPHS: Record<string, LucideIcon> = {
  wallet: Wallet,
  users: Users,
  clock: Clock,
  calendar: CalendarDays,
  warning: TriangleAlert,
  success: CheckCircle2,
  graduation: GraduationCap,
  notification: BellDot,
};

const ACTION_TONE_STYLES: Record<DashboardActionItem["tone"], { bg: string; color: string; border: string }> = {
  brand: { bg: "#EEF2FF", color: "#4338CA", border: "#C7D2FE" },
  success: { bg: "#ECFDF5", color: "#059669", border: "#A7F3D0" },
  warning: { bg: "#FFFBEB", color: "#D97706", border: "#FCD34D" },
  info: { bg: "#EFF6FF", color: "#2563EB", border: "#BFDBFE" },
};

export default function DashboardPage() {
  const user = useCurrentUser();
  const locale = useUIStore((state) => state.locale);
  const isAr = locale === "ar";
  const [overview, setOverview] = useState<DashboardOverview | null>(null);
  const [ownerSnapshot, setOwnerSnapshot] = useState<OwnerSnapshotItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    async function load() {
      setLoading(true);
      const [data, ownerData] = await Promise.all([getDashboardOverview(
        {
          role: user.role,
          fullName: user.fullName,
          fullNameAr: user.fullNameAr,
        },
        locale,
      ), getOwnerSnapshot()]);
      if (isMounted) {
        setOverview(data);
        setOwnerSnapshot(ownerData.slice(0, 4));
        setLoading(false);
      }
    }
    load();
    return () => {
      isMounted = false;
    };
  }, [locale, user.fullName, user.fullNameAr, user.role]);

  const displayName = isAr ? user.fullNameAr : user.fullName;
  const isMgmt = isManagement(user.role);

  const quickLinks = useMemo(() => {
    if (user.role === "sales") {
      return [
        { label: t(locale, "العملاء المحتملون", "Leads"), href: "/leads", icon: Users, color: "#6366F1", bg: "#EEF2FF" },
        { label: t(locale, "المتابعات", "Follow-ups"), href: "/follow-ups", icon: ClipboardCheck, color: "#8B5CF6", bg: "#F5F3FF" },
        { label: t(locale, "المدفوعات", "Payments"), href: "/payments", icon: Wallet, color: "#10B981", bg: "#ECFDF5" },
        { label: t(locale, "الطلاب", "Students"), href: "/students", icon: GraduationCap, color: "#0D9488", bg: "#F0FDFA" },
      ];
    }

    return [
      { label: t(locale, "الطلاب", "Students"), href: "/students", icon: GraduationCap, color: "#059669", bg: "#ECFDF5" },
      { label: t(locale, "الجدول", "Schedule"), href: "/schedule", icon: CalendarDays, color: "#2563EB", bg: "#EFF6FF" },
      { label: t(locale, "المتابعات", "Follow-ups"), href: "/follow-ups", icon: ClipboardCheck, color: "#8B5CF6", bg: "#F5F3FF" },
      { label: t(locale, "المدفوعات", "Payments"), href: "/payments", icon: Wallet, color: "#D97706", bg: "#FFFBEB" },
    ];
  }, [locale, user.role]);

  const pendingCount = overview?.followUps.filter((item) => item.status !== "completed").length ?? 0;
  const completedCount = overview?.followUps.filter((item) => item.status === "completed").length ?? 0;
  const urgentCount = overview?.followUps.filter((item) => item.status === "urgent").length ?? 0;

  if (loading || !overview) {
    return (
      <div className="rounded-2xl border border-border bg-card p-12 text-center text-muted-foreground">
        {t(locale, "جارِ تحميل لوحة التحكم...", "Loading dashboard...")}
      </div>
    );
  }

  if (!isMgmt) {
    return (
      <div className="space-y-6">
        <HeroCard title={t(locale, `مرحباً، ${displayName}`, `Welcome, ${displayName}`)} subtitle={t(locale, "هذه أهم الأشياء التي تحتاج انتباهك الآن", "Here is what needs your attention right now")} />

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <MiniStat icon={ClipboardCheck} value={overview.followUps.length} label={t(locale, "متابعات اليوم", "Today follow-ups")} bg="#EEF2FF" color="#6366F1" />
          <MiniStat icon={CheckCircle2} value={completedCount} label={t(locale, "مكتملة", "Completed")} bg="#ECFDF5" color="#059669" />
          <MiniStat icon={Clock} value={pendingCount} label={t(locale, "معلّقة", "Pending")} bg="#FFFBEB" color="#D97706" />
          <MiniStat icon={AlertCircle} value={urgentCount} label={t(locale, "عاجلة", "Urgent")} bg="#FEF2F2" color="#DC2626" />
        </div>

        <OwnershipSnapshot locale={locale} title={t(locale, "ملخص المسؤولين", "Owner snapshot")} items={ownerSnapshot} />

                <DashboardSectionTitle title={t(locale, "وصول سريع", "Quick access")} />
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {quickLinks.map((link) => {
            const Icon = link.icon;
            return (
              <Link key={link.href} href={link.href} className="group flex flex-col items-center gap-2 rounded-2xl border border-border bg-card p-4 transition-all hover:-translate-y-0.5 hover:shadow-md">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl transition-transform group-hover:scale-105" style={{ background: link.bg }}>
                  <Icon size={24} style={{ color: link.color }} />
                </div>
                <span className="text-xs font-semibold text-foreground">{link.label}</span>
              </Link>
            );
          })}
        </div>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.2fr_0.8fr]">
          <div className="space-y-6">
            <TaskCard
              locale={locale}
              isAr={isAr}
              tasks={overview.followUps}
              title={t(locale, "مهامي اليوم", "My tasks today")}
              emptyLabel={t(locale, "لا توجد متابعات لك اليوم", "No follow-ups for you today")}
            />

            <div className="rounded-2xl border border-border bg-card p-5">
              <DashboardSectionTitle title={t(locale, "ما يجب التركيز عليه", "What to focus on")} icon={Target} />
              {overview.recommendations.length === 0 ? (
                <EmptyPanel label={t(locale, "كل شيء تحت السيطرة الآن", "Everything is under control right now")} />
              ) : (
                <div className="space-y-3">
                  {overview.recommendations.map((item) => (
                    <div key={item} className="rounded-2xl border border-border bg-background p-4 text-sm text-foreground">
                      {item}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="space-y-6">
            <OperationsGrid locale={locale} items={overview.operations} compact />
            <QuickActionGrid title={t(locale, "الخطوات التالية", "Next steps")} locale={locale} isAr={isAr} actions={overview.quickActions} compact />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <HeroCard title={t(locale, `مرحباً، ${displayName}`, `Welcome, ${displayName}`)} subtitle={t(locale, "هذه لقطة تشغيلية سريعة للأكاديمية الآن", "This is your operational snapshot for the academy right now")} />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {overview.managementStats.map((stat) => (
          <div key={stat.label} className="relative overflow-hidden rounded-3xl p-5 text-white" style={{ background: `linear-gradient(135deg, ${stat.bg}, ${stat.bg}dd)` }}>
            <p className="text-sm opacity-90">{stat.label}</p>
            <p className="mt-2 text-3xl font-bold">{stat.value}</p>
            {stat.change && <p className="mt-2 text-xs opacity-80">{stat.change}</p>}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        {overview.secondaryStats.map((stat) => {
          const Icon = stat.icon ? DASHBOARD_GLYPHS[stat.icon] : Clock;
          return (
            <div key={stat.label} className="rounded-2xl border border-border bg-card p-4">
              <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-2xl" style={{ background: stat.bg }}>
                <Icon size={20} style={{ color: stat.color }} />
              </div>
              <p className="text-sm font-medium text-muted-foreground">{stat.label}</p>
              <p className="mt-1 text-2xl font-bold text-foreground">{stat.value}</p>
            </div>
          );
        })}
      </div>

      <OperationsGrid locale={locale} items={overview.operations} />

      <OwnershipSnapshot locale={locale} title={t(locale, "توزيع المسؤولية", "Ownership distribution")} items={ownerSnapshot} />

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <div className="space-y-6">
          <div className="rounded-2xl border border-border bg-card p-5">
            <DashboardSectionTitle title={t(locale, "تنبيهات سريعة", "Quick alerts")} icon={BellDot} />
            {overview.alerts.length === 0 ? (
              <EmptyPanel label={t(locale, "لا توجد تنبيهات حرجة الآن", "There are no urgent alerts right now")} />
            ) : (
              <div className="space-y-2">
                {overview.alerts.map((alert) => {
                  const Icon = DASHBOARD_GLYPHS[alert.icon] ?? AlertCircle;
                  return (
                    <div key={`${alert.icon}-${alert.text}`} className={cn("flex items-start gap-3 rounded-2xl border p-3", alert.type === "danger" && "border-red-200 bg-red-50/40 dark:border-red-900/30 dark:bg-red-950/10", alert.type === "warning" && "border-amber-200 bg-amber-50/40 dark:border-amber-900/30 dark:bg-amber-950/10", alert.type === "info" && "border-blue-200 bg-blue-50/40 dark:border-blue-900/30 dark:bg-blue-950/10", alert.type === "success" && "border-emerald-200 bg-emerald-50/40 dark:border-emerald-900/30 dark:bg-emerald-950/10")}>
                      <div className="mt-0.5 flex h-8 w-8 items-center justify-center rounded-xl bg-background/80 text-foreground">
                        <Icon size={16} />
                      </div>
                      <p className="text-sm text-foreground">{alert.text}</p>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <TaskCard
            locale={locale}
            isAr={isAr}
            tasks={overview.followUps.slice(0, 6)}
            title={t(locale, "مهام اليوم", "Today tasks")}
            emptyLabel={t(locale, "لا توجد مهام مسجلة الآن", "No tasks recorded right now")}
          />
        </div>

        <div className="space-y-6">
          <div className="rounded-2xl border border-border bg-card p-5">
            <DashboardSectionTitle title={t(locale, "قراءة سريعة للمسار", "Pipeline snapshot")} icon={TrendingUp} />
            <div className="space-y-4">
              {overview.funnel.map((item) => (
                <div key={item.label} className="space-y-2">
                  <div className="flex items-center justify-between gap-3 text-sm">
                    <span className="font-medium text-foreground">{item.label}</span>
                    <span className="text-muted-foreground">{item.value} • {item.pct}</span>
                  </div>
                  <div className="h-3 overflow-hidden rounded-full bg-muted/60">
                    <div className="h-full rounded-full" style={{ width: item.pct, backgroundColor: item.color }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <QuickActionGrid title={t(locale, "تشغيل سريع", "Fast execution")} locale={locale} isAr={isAr} actions={overview.quickActions} />

          <div className="rounded-2xl border border-border bg-card p-5">
            <DashboardSectionTitle title={t(locale, "توصيات تشغيلية", "Operational recommendations")} icon={Target} />
            {overview.recommendations.length === 0 ? (
              <EmptyPanel label={t(locale, "لا توجد توصيات إضافية الآن", "There are no extra recommendations right now")} />
            ) : (
              <div className="space-y-3">
                {overview.recommendations.map((item) => (
                  <div key={item} className="rounded-2xl border border-border bg-background p-4 text-sm text-foreground">
                    {item}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function HeroCard({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="rounded-3xl border border-border bg-card p-6">
      <h2 className="text-2xl font-bold text-foreground">{title}</h2>
      <p className="mt-1 text-muted-foreground">{subtitle}</p>
    </div>
  );
}

function DashboardSectionTitle({ title, icon: Icon, className }: { title: string; icon?: LucideIcon; className?: string }) {
  return (
    <h3 className={cn("mb-4 flex items-center gap-2 text-base font-bold text-foreground", className)}>
      {Icon ? <Icon size={18} className="text-brand-600" /> : null}
      {title}
    </h3>
  );
}

function MiniStat({ icon: Icon, value, label, bg, color }: { icon: LucideIcon; value: number; label: string; bg: string; color: string }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-2xl" style={{ background: bg }}>
        <Icon size={18} style={{ color }} />
      </div>
      <p className="text-2xl font-bold text-foreground">{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
}

function OperationsGrid({ locale, items, compact = false }: { locale: "ar" | "en"; items: DashboardOperationItem[]; compact?: boolean }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <DashboardSectionTitle title={t(locale, "إشارات التشغيل", "Operational signals")} icon={TrendingUp} />
      <div className={cn("grid gap-3", compact ? "grid-cols-1" : "grid-cols-1 sm:grid-cols-2 xl:grid-cols-4")}>
        {items.map((item) => {
          const tone = getDashboardOperationToneStyles(item.tone);
          return (
            <div key={item.title} className="rounded-2xl border p-4" style={{ background: tone.bg, borderColor: `${tone.color}33` }}>
              <p className="text-xs font-semibold" style={{ color: tone.color }}>{item.title}</p>
              <p className="mt-2 text-2xl font-bold text-foreground">{item.value}</p>
              <p className="mt-2 text-xs text-muted-foreground">{item.subtitle}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function QuickActionGrid({ title, locale, isAr, actions, compact = false }: { title: string; locale: "ar" | "en"; isAr: boolean; actions: DashboardActionItem[]; compact?: boolean }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <DashboardSectionTitle title={title} icon={Target} />
      <div className={cn("grid gap-3", compact ? "grid-cols-1" : "grid-cols-1 sm:grid-cols-2")}>
        {actions.map((action) => {
          const tone = ACTION_TONE_STYLES[action.tone];
          return (
            <Link key={`${action.href}-${action.title}`} href={action.href} className="group rounded-2xl border p-4 transition-all hover:-translate-y-0.5 hover:shadow-sm" style={{ borderColor: tone.border, background: tone.bg }}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-semibold" style={{ color: tone.color }}>{action.title}</p>
                  <p className="mt-2 text-sm text-muted-foreground">{action.description}</p>
                </div>
                {isAr ? <ArrowLeft size={16} style={{ color: tone.color }} /> : <ArrowRight size={16} style={{ color: tone.color }} />}
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

function TaskCard({ locale, isAr, tasks, title, emptyLabel }: { locale: "ar" | "en"; isAr: boolean; tasks: DashboardOverview["followUps"]; title: string; emptyLabel: string }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <div className="mb-4 flex items-center justify-between">
        <DashboardSectionTitle title={title} icon={ClipboardCheck} className="mb-0" />
        <Link href="/follow-ups" className="flex items-center gap-1 text-xs font-semibold text-brand-600 transition-colors hover:text-brand-700">
          {t(locale, "عرض الكل", "View all")}
          {isAr ? <ArrowLeft size={14} /> : <ArrowRight size={14} />}
        </Link>
      </div>

      {tasks.length === 0 ? (
        <EmptyPanel label={emptyLabel} />
      ) : (
        <div className="space-y-2">
          {tasks.map((item) => {
            const badge = DASHBOARD_TASK_STATUS_META[item.status];
            const badgeLabel = isAr ? badge.label : badge.labelEn;
            return (
              <div key={item.id} className={cn("flex items-center gap-3 rounded-2xl border p-3 transition-colors", item.status === "completed" ? "border-border/50 opacity-60" : "border-border hover:bg-muted/50", item.status === "urgent" && "border-red-200 bg-red-50/30 dark:border-red-900/30 dark:bg-red-950/10")}>
                <div className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: item.dot }} />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className={cn("truncate text-sm font-semibold", item.status === "completed" && "line-through")}>{item.name}</p>
                    <span className="shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold" style={{ background: badge.bg, color: badge.color }}>
                      {badgeLabel}
                    </span>
                  </div>
                  <p className="truncate text-xs text-muted-foreground">{item.reason}</p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <span className="text-[11px] text-muted-foreground">{item.time}</span>
                  {item.status !== "completed" && (
                    <a href={`https://wa.me/?text=${encodeURIComponent(`${t(locale, "متابعة", "Follow-up")}: ${item.name} — ${item.reason}`)}`} target="_blank" rel="noopener noreferrer" className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-xl bg-brand-50 text-brand-600 transition-colors hover:bg-brand-100 dark:bg-brand-950 dark:text-brand-400">
                      <Phone size={14} />
                    </a>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function EmptyPanel({ label }: { label: string }) {
  return <div className="rounded-2xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">{label}</div>;
}


function OwnershipSnapshot({ locale, title, items }: { locale: "ar" | "en"; title: string; items: OwnerSnapshotItem[] }) {
  if (items.length === 0) return null;
  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <DashboardSectionTitle title={title} icon={Users} />
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
        {items.map((item) => (
          <div key={item.key} className="rounded-2xl border border-border bg-background p-4">
            <p className="text-sm font-semibold text-foreground">{item.displayName}</p>
            <div className="mt-3 space-y-1 text-xs text-muted-foreground">
              <p>{t(locale, "عملاء محتملون", "Leads")}: <span className="font-semibold text-foreground">{item.leadCount}</span></p>
              <p>{t(locale, "مشترك", "Won")}: <span className="font-semibold text-foreground">{item.wonLeadCount}</span></p>
              <p>{t(locale, "أولياء أمور", "Parents")}: <span className="font-semibold text-foreground">{item.parentCount}</span></p>
              <p>{t(locale, "طلاب", "Students")}: <span className="font-semibold text-foreground">{item.studentCount}</span></p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
