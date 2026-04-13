"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, FileText, Printer, ReceiptText } from "lucide-react";
import { useUIStore } from "@/stores/ui-store";
import { t } from "@/lib/locale";
import { getCourseFormLabel } from "@/config/course-roadmap";
import { formatCurrencyEgp, formatDate } from "@/lib/formatters";
import { getStudentDetails } from "@/services/relations.service";
import { buildStudentJourney } from "@/services/student-journey.service";
import { buildStudentMonthlyReportDraft, buildStudentReportSnapshot } from "@/services/student-report.service";
import { getStudentFinanceSnapshot, type StudentFinanceSnapshot } from "@/services/student-finance.service";
import { LoadingState, PageStateCard } from "@/components/shared/page-state";
import type { StudentDetails } from "@/types/crm";

export default function StudentReportPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const locale = useUIStore((state) => state.locale);
  const isAr = locale === "ar";
  const [student, setStudent] = useState<StudentDetails | null>(null);
  const [finance, setFinance] = useState<StudentFinanceSnapshot | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    Promise.all([getStudentDetails(id), getStudentFinanceSnapshot(id)]).then(([studentData, financeData]) => {
      if (mounted) {
        setStudent(studentData);
        setFinance(financeData);
        setLoading(false);
      }
    });
    return () => {
      mounted = false;
    };
  }, [id]);

  if (loading) {
    return <LoadingState titleAr="جارِ تجهيز التقرير" titleEn="Preparing report" descriptionAr="يتم الآن جمع رحلة الطالب والمدرس والكلاس والمدفوعات داخل ملخص واحد." descriptionEn="Combining the student journey, teacher, class, and payments into one report summary." />;
  }

  if (!student) {
    return <PageStateCard variant="warning" titleAr="التقرير غير متاح" titleEn="Report unavailable" descriptionAr="تعذر العثور على ملف الطالب المطلوب لإخراج التقرير." descriptionEn="The target student profile could not be found to generate the report." actionHref="/students" actionLabelAr="العودة إلى الطلاب" actionLabelEn="Back to students" />;
  }

  const snapshot = buildStudentReportSnapshot(student);
  const draft = buildStudentMonthlyReportDraft(student);
  const journey = buildStudentJourney(student);
  const financeState = getFinanceStateLabel(finance?.currentState ?? "none", locale);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Link href={`/students/${student.id}`} className="rounded-xl p-2 text-muted-foreground transition-colors hover:bg-muted">
            {isAr ? <ArrowRight size={18} /> : <ArrowLeft size={18} />}
          </Link>
          <div>
            <h1 className="flex items-center gap-2 text-2xl font-bold text-foreground"><FileText size={24} className="text-brand-600" />{t(locale, "التقرير الشهري للطالب", "Student monthly report")}</h1>
            <p className="text-sm text-muted-foreground">{student.fullName} — {student.parentName}</p>
          </div>
        </div>
        <button onClick={() => window.print()} className="inline-flex items-center gap-2 rounded-xl border border-border px-4 py-2 text-sm font-semibold text-foreground transition-colors hover:bg-muted">
          <Printer size={16} />
          {t(locale, "طباعة", "Print")}
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-5">
        <ReportBox labelAr="التاريخ" labelEn="Date" value={formatDate(new Date().toISOString(), locale)} />
        <ReportBox labelAr="المسار الحالي" labelEn="Current track" value={student.currentCourse ? getCourseFormLabel(student.currentCourse, locale) : t(locale, "غير محدد", "Not set")} />
        <ReportBox labelAr="المدرس الحالي" labelEn="Current teacher" value={snapshot.teacherName ?? t(locale, "غير مرتبط بعد", "Not linked yet")} />
        <ReportBox labelAr="الكلاس الحالي" labelEn="Current class" value={snapshot.className ?? t(locale, "غير مسجل", "Not assigned")} />
        <ReportBox labelAr="الحالة المالية" labelEn="Finance state" value={financeState} />
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <div className="rounded-2xl border border-border bg-card p-5 xl:col-span-2">
          <h2 className="text-lg font-bold text-foreground">{t(locale, "ملخص الأداء", "Performance summary")}</h2>
          <p className="mt-3 text-sm leading-7 text-muted-foreground">{locale === "ar" ? draft.summaryAr : draft.summaryEn}</p>

          <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
            <ListCard title={t(locale, "نقاط القوة", "Strengths")} items={locale === "ar" ? draft.strengthsAr : draft.strengthsEn} />
            <ListCard title={t(locale, "نقاط التركيز", "Focus areas")} items={locale === "ar" ? draft.focusAreasAr : draft.focusAreasEn} />
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-2xl border border-border bg-card p-5">
            <h3 className="text-base font-bold text-foreground">{t(locale, "الدورة الحالية", "Current cycle")}</h3>
            <div className="mt-4 space-y-3">
              <ReportBox labelAr="الحصص المنجزة" labelEn="Sessions completed" value={String(student.sessionsAttended)} compact />
              <ReportBox labelAr="آخر نقطة مكتملة" labelEn="Last completed checkpoint" value={snapshot.currentCheckpoint > 0 ? String(snapshot.currentCheckpoint) : t(locale, "لم تكتمل بعد", "Not completed yet")} compact />
              <ReportBox labelAr="النقطة القادمة" labelEn="Next checkpoint" value={String(snapshot.nextCheckpoint)} compact />
              <ReportBox labelAr="المتبقي" labelEn="Remaining" value={`${snapshot.sessionsUntilNext} ${t(locale, "حصص", "sessions")}`} compact />
            </div>
            <div className="mt-4 rounded-xl bg-muted/40 p-3">
              <p className="text-xs text-muted-foreground">{t(locale, "التقدم داخل الدورة الحالية", "Progress inside current cycle")}</p>
              <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-muted">
                <div className="h-full rounded-full bg-brand-600" style={{ width: `${snapshot.progressPercent}%` }} />
              </div>
              <p className="mt-2 text-sm font-semibold text-foreground">{snapshot.progressPercent}%</p>
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-card p-5">
            <h3 className="flex items-center gap-2 text-base font-bold text-foreground"><ReceiptText size={18} className="text-brand-600" />{t(locale, "ملخص مالي", "Finance summary")}</h3>
            <div className="mt-4 space-y-3">
              <ReportBox labelAr="إجمالي المفوتر" labelEn="Total billed" value={formatCurrencyEgp(finance?.totalBilled ?? 0, locale)} compact />
              <ReportBox labelAr="إجمالي المحصل" labelEn="Total collected" value={formatCurrencyEgp(finance?.totalCollected ?? 0, locale)} compact />
              <ReportBox labelAr="الفاتورة القادمة" labelEn="Next invoice" value={finance?.nextPendingPayment ? formatDate(finance.nextPendingPayment.dueDate, locale) : t(locale, "لا توجد", "None")} compact />
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-card p-5">
            <h3 className="text-base font-bold text-foreground">{t(locale, "الهدف التالي", "Next goal")}</h3>
            <p className="mt-3 text-sm leading-7 text-muted-foreground">{locale === "ar" ? draft.nextGoalAr : draft.nextGoalEn}</p>
            <p className="mt-4 text-xs text-muted-foreground">{locale === "ar" ? journey.stageAr : journey.stageEn}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function ReportBox({ labelAr, labelEn, value, compact = false }: { labelAr: string; labelEn: string; value: string; compact?: boolean }) {
  const locale = useUIStore((state) => state.locale);
  return <div className={`rounded-2xl border border-border bg-card ${compact ? "p-3" : "p-5"}`}><p className="text-xs text-muted-foreground">{locale === "ar" ? labelAr : labelEn}</p><p className="mt-1 font-semibold text-foreground">{value}</p></div>;
}

function ListCard({ title, items }: { title: string; items: string[] }) {
  return <div className="rounded-2xl border border-border bg-background p-4"><h3 className="font-semibold text-foreground">{title}</h3><ul className="mt-3 space-y-2 text-sm text-muted-foreground">{items.map((item) => <li key={item} className="flex gap-2"><span className="mt-1 h-1.5 w-1.5 rounded-full bg-brand-600" /><span>{item}</span></li>)}</ul></div>;
}

function getFinanceStateLabel(state: StudentFinanceSnapshot["currentState"], locale: "ar" | "en"): string {
  const labels = {
    paid: { ar: "مدفوع", en: "Paid" },
    pending: { ar: "قيد الانتظار", en: "Pending" },
    overdue: { ar: "متأخر", en: "Overdue" },
    partial: { ar: "دفع جزئي", en: "Partial" },
    refunded: { ar: "مسترد", en: "Refunded" },
    deferred: { ar: "مؤجل", en: "Deferred" },
    none: { ar: "لا توجد فواتير بعد", en: "No invoices yet" },
  } as const;

  return locale === "ar" ? labels[state].ar : labels[state].en;
}
