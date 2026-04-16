
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, BellRing, CalendarClock, CircleAlert, FolderOpenDot, Wallet, Users2 } from "lucide-react";
import { useCurrentUser } from "@/providers/user-provider";
import { useUIStore } from "@/stores/ui-store";
import { t } from "@/lib/locale";
import { getActionCenterData, getActionToneStyles } from "@/services/operations.service";
import type { ActionCenterData, ActionCenterItem } from "@/types/crm";

const ICONS = {
  follow_up: BellRing,
  lead: FolderOpenDot,
  payment: Wallet,
  student: Users2,
  schedule: CalendarClock,
} as const;

export default function ActionCenterPage() {
  const user = useCurrentUser();
  const locale = useUIStore((state) => state.locale);
  // const isAr = locale === "ar";
  const [data, setData] = useState<ActionCenterData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    async function load() {
      setLoading(true);
      const next = await getActionCenterData(
        {
          role: user.role,
          fullName: user.fullName,
          fullNameAr: user.fullNameAr,
        },
        locale,
      );
      if (isMounted) {
        setData(next);
        setLoading(false);
      }
    }
    void load();
    return () => {
      isMounted = false;
    };
  }, [locale, user.fullName, user.fullNameAr, user.role]);

  if (loading || !data) {
    return (
      <div className="rounded-2xl border border-border bg-card p-12 text-center text-muted-foreground">
        {t(locale, "جارِ تحميل مركز العمليات...", "Loading action center...")}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-border bg-card p-6 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-border bg-muted/50 px-3 py-1 text-xs font-medium text-muted-foreground">
              <BellRing size={14} />
              {t(locale, "لوحة تنفيذ يومية", "Daily execution board")}
            </div>
            <h1 className="mt-3 text-2xl font-bold text-foreground">
              {t(locale, "مركز العمليات", "Action Center")}
            </h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
              {t(locale, "هذه الشاشة تجمع كل الأشياء التي تحتاج قرارًا أو متابعة الآن، حتى لا يضيع الفريق بين الصفحات المختلفة.", "This screen brings together the items that need a decision or follow-up now, so the team does not get lost between separate pages.")}
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3 lg:w-[420px]">
            {data.metrics.map((metric) => {
              const tone = metric.tone === "danger"
                ? { bg: "#FEF2F2", color: "#DC2626" }
                : metric.tone === "warning"
                  ? { bg: "#FFFBEB", color: "#D97706" }
                  : metric.tone === "success"
                    ? { bg: "#ECFDF5", color: "#059669" }
                    : metric.tone === "info"
                      ? { bg: "#EFF6FF", color: "#2563EB" }
                      : { bg: "#EEF2FF", color: "#4338CA" };
              return (
                <div key={metric.label} className="rounded-2xl border border-border p-4" style={{ background: tone.bg }}>
                  <p className="text-xs font-medium text-muted-foreground">{metric.label}</p>
                  <p className="mt-2 text-2xl font-bold" style={{ color: tone.color }}>{metric.value}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <ActionSection locale={locale} title={t(locale, "حرج الآن", "Critical now")} description={t(locale, "هذه العناصر لها أثر مباشر على الاشتراك أو التحصيل أو الاحتفاظ بالطالب.", "These items directly affect enrollment, collection, or retention.")} items={data.critical} />
      <ActionSection locale={locale} title={t(locale, "يحتاج إغلاق اليوم", "Should be closed today")} description={t(locale, "لو تأخرت هذه العناصر، ستتحول بسرعة إلى احتكاك تشغيلي أو فرص ضائعة.", "If delayed, these items will quickly become operational friction or missed opportunities.")} items={data.mediumPriority} />
      <ActionSection locale={locale} title={t(locale, "للاطلاع والتنظيم", "For visibility and planning")} description={t(locale, "ليست حرجة الآن، لكنها تساعدك تحافظ على وضوح التشغيل خلال اليوم.", "Not critical now, but they help maintain operational clarity through the day.")} items={data.informational} />
    </div>
  );
}

function ActionSection({
  locale,
  title,
  description,
  items,
}: {
  locale: "ar" | "en";
  title: string;
  description: string;
  items: ActionCenterItem[];
}) {
  const isAr = locale === "ar";
  const Arrow = isAr ? ArrowLeft : ArrowRight;

  return (
    <section className="rounded-3xl border border-border bg-card p-5 shadow-sm">
      <div className="mb-4 flex items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-foreground">{title}</h2>
          <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        </div>
        <span className="inline-flex h-9 min-w-9 items-center justify-center rounded-full border border-border bg-background px-3 text-sm font-semibold text-foreground">
          {items.length}
        </span>
      </div>

      {items.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-background px-4 py-10 text-center text-sm text-muted-foreground">
          {t(locale, "لا توجد عناصر في هذا القسم الآن", "There are no items in this section right now")}
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((item) => {
            const Icon = ICONS[item.category] ?? CircleAlert;
            const tone = getActionToneStyles(item.priority);
            return (
              <Link key={item.id} href={item.href} className="group flex items-start gap-4 rounded-2xl border border-border bg-background p-4 transition-all hover:-translate-y-0.5 hover:shadow-md">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl" style={{ background: tone.bg, color: tone.color }}>
                  <Icon size={20} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-sm font-semibold text-foreground">{item.title}</h3>
                    <span className="rounded-full border px-2 py-0.5 text-[11px] font-medium" style={{ borderColor: tone.border, background: tone.bg, color: tone.color }}>
                      {item.priority === "critical"
                        ? t(locale, "حرج", "Critical")
                        : item.priority === "high"
                          ? t(locale, "عالٍ", "High")
                          : item.priority === "medium"
                            ? t(locale, "متوسط", "Medium")
                            : t(locale, "معلومة", "Info")}
                    </span>
                  </div>
                  <p className="mt-1 text-sm leading-6 text-muted-foreground">{item.description}</p>
                  {(item.owner || item.meta) && (
                    <div className="mt-2 flex flex-wrap gap-2 text-xs text-muted-foreground">
                      {item.owner ? <span className="rounded-full bg-muted px-2 py-1">{item.owner}</span> : null}
                      {item.meta ? <span className="rounded-full bg-muted px-2 py-1">{item.meta}</span> : null}
                    </div>
                  )}
                </div>
                <div className="mt-1 text-muted-foreground transition-transform group-hover:translate-x-0.5">
                  <Arrow size={18} />
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </section>
  );
}
