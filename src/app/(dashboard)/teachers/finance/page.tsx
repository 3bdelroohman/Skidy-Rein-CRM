"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, ArrowRight, Calculator, PlusCircle, Wallet } from "lucide-react";
import { useUIStore } from "@/stores/ui-store";
import { t } from "@/lib/locale";
import { formatCurrencyEgp } from "@/lib/formatters";
import { getTeacherDetails } from "@/services/relations.service";
import { listTeachers } from "@/services/teachers.service";
import { computeTeacherFinanceSummary, getTeacherFinanceConfig } from "@/services/teacher-finance.service";
import { LoadingState, PageStateCard } from "@/components/shared/page-state";
import type { TeacherDetails } from "@/types/crm";

interface TeacherFinanceView {
  teacher: TeacherDetails;
  weeklyEstimated: number;
  monthlyEstimated: number;
  averagePerSession: number;
  linkedSessions: number;
}

export default function TeachersFinancePage() {
  const locale = useUIStore((state) => state.locale);
  const isAr = locale === "ar";
  const [items, setItems] = useState<TeacherFinanceView[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    (async () => {
      const teachers = await listTeachers();
      const details = (await Promise.all(teachers.map((teacher) => getTeacherDetails(teacher.id)))).filter(Boolean) as TeacherDetails[];
      if (!mounted) return;
      const next = details.map((teacher) => {
        const config = getTeacherFinanceConfig(teacher.id);
        const summary = computeTeacherFinanceSummary(teacher.linkedSessions, config);
        return {
          teacher,
          weeklyEstimated: summary.weeklyEstimated,
          monthlyEstimated: summary.monthlyEstimated,
          averagePerSession: summary.averagePerSession,
          linkedSessions: summary.linkedSessions,
        };
      });
      setItems(next.sort((a, b) => b.monthlyEstimated - a.monthlyEstimated || a.teacher.fullName.localeCompare(b.teacher.fullName, "ar")));
      setLoading(false);
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const totals = useMemo(() => ({
    weekly: items.reduce((sum, item) => sum + item.weeklyEstimated, 0),
    monthly: items.reduce((sum, item) => sum + item.monthlyEstimated, 0),
    sessions: items.reduce((sum, item) => sum + item.linkedSessions, 0),
  }), [items]);

  if (loading) {
    return (
      <LoadingState
        titleAr="جارِ تحميل الحسابات المالية للمدرسين"
        titleEn="Loading teachers finance"
        descriptionAr="يتم الآن تجهيز التقدير الأسبوعي والشهري للمدرسين بحسب الحصص والتراكات المرتبطة."
        descriptionEn="Preparing weekly and monthly teacher estimates based on linked sessions and tracks."
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/teachers" className="rounded-xl p-2 text-muted-foreground transition-colors hover:bg-muted">
          {isAr ? <ArrowRight size={18} /> : <ArrowLeft size={18} />}
        </Link>
        <div className="flex-1">
          <h1 className="flex items-center gap-2 text-2xl font-bold text-foreground"><Wallet size={26} className="text-brand-600" />{t(locale, "حسابات المدرسين", "Teacher accounts")}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{t(locale, "تقدير أسبوعي وشهري لمستحقات المدرسين بناءً على الحصص المرتبطة وإعدادات كل مدرس.", "Weekly and monthly estimates for teacher dues based on linked sessions and each teacher's pay settings.")}</p>
        </div>
        <Link href="/teachers/new" className="inline-flex items-center gap-2 rounded-xl bg-brand-700 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-600"><PlusCircle size={16} />{t(locale, "إضافة مدرس", "Add teacher")}</Link>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <SummaryCard locale={locale} icon={Wallet} labelAr="إجمالي أسبوعي" labelEn="Weekly total" value={formatCurrencyEgp(totals.weekly, locale)} />
        <SummaryCard locale={locale} icon={Wallet} labelAr="إجمالي شهري تقديري" labelEn="Estimated monthly total" value={formatCurrencyEgp(totals.monthly, locale)} />
        <SummaryCard locale={locale} icon={Calculator} labelAr="إجمالي الحصص" labelEn="Total sessions" value={String(totals.sessions)} />
      </div>

      {items.length === 0 ? (
        <PageStateCard
          variant="default"
          titleAr="لا توجد بيانات مالية للمدرسين بعد"
          titleEn="No teacher finance data yet"
          descriptionAr="أضف مدرسين واربطهم بحصص ثم حدّد إعدادات المقابل المالي من ملف كل مدرس."
          descriptionEn="Add teachers, link them to sessions, then define payout settings from each teacher profile."
          actionHref="/teachers"
          actionLabelAr="العودة إلى المدرسين"
          actionLabelEn="Back to teachers"
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
          {items.map((item) => (
            <Link key={item.teacher.id} href={`/teachers/${item.teacher.id}`} className="rounded-2xl border border-border bg-card p-5 transition-all hover:-translate-y-0.5 hover:shadow-brand-md">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-lg font-bold text-foreground">{item.teacher.fullName}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{item.teacher.linkedStudents.length} {t(locale, "طلاب", "students")} • {item.linkedSessions} {t(locale, "حصص", "sessions")}</p>
                </div>
                <span className="rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-700 dark:bg-brand-950 dark:text-brand-300">{formatCurrencyEgp(item.monthlyEstimated, locale)}</span>
              </div>
              <div className="mt-4 grid grid-cols-3 gap-3 text-center text-xs">
                <MiniMetric locale={locale} labelAr="أسبوعي" labelEn="Weekly" value={formatCurrencyEgp(item.weeklyEstimated, locale)} />
                <MiniMetric locale={locale} labelAr="شهري" labelEn="Monthly" value={formatCurrencyEgp(item.monthlyEstimated, locale)} />
                <MiniMetric locale={locale} labelAr="متوسط الحصة" labelEn="Avg session" value={formatCurrencyEgp(item.averagePerSession, locale)} />
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

function SummaryCard({ locale, icon: Icon, labelAr, labelEn, value }: { locale: "ar" | "en"; icon: typeof Wallet; labelAr: string; labelEn: string; value: string }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <div className="flex items-center gap-2 text-sm text-muted-foreground"><Icon size={16} />{t(locale, labelAr, labelEn)}</div>
      <p className="mt-3 text-2xl font-bold text-foreground">{value}</p>
    </div>
  );
}

function MiniMetric({ locale, labelAr, labelEn, value }: { locale: "ar" | "en"; labelAr: string; labelEn: string; value: string }) {
  return <div className="rounded-xl bg-muted/40 p-3"><p className="text-[11px] text-muted-foreground">{t(locale, labelAr, labelEn)}</p><p className="mt-1 font-bold text-foreground">{value}</p></div>;
}
