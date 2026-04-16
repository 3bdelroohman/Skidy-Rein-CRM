"use client";

import { use, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ArrowLeft, ArrowRight, BookOpen, CalendarDays, Calculator, FileText, Mail, Phone, PlusCircle, Save, Trash2, Users } from "lucide-react";
import { useUIStore } from "@/stores/ui-store";
import { formatCourseLabel, formatCurrencyEgp, formatDate } from "@/lib/formatters";
import { getEmploymentTypeLabel, t } from "@/lib/locale";
import { getTeacherDetails } from "@/services/relations.service";
import { getTeacherEvaluation, saveTeacherEvaluation } from "@/services/teacher-evaluations.service";
import { computeTeacherFinanceSummary, getTeacherFinanceConfig, saveTeacherFinanceConfig } from "@/services/teacher-finance.service";
import { reassignTeacherRelations } from "@/services/teacher-reassignment.service";
import { deleteTeacher, listTeachers } from "@/services/teachers.service";
import { buildStudentReportSnapshot } from "@/services/student-report.service";
import { LoadingState, PageStateCard } from "@/components/shared/page-state";
import type { CourseType, TeacherDetails, TeacherListItem } from "@/types/crm";

const TRACKS: CourseType[] = ["scratch", "python", "web", "ai"];

export default function TeacherDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const locale = useUIStore((state) => state.locale);
  const isAr = locale === "ar";
  const [teacher, setTeacher] = useState<TeacherDetails | null>(null);
  const [alternatives, setAlternatives] = useState<TeacherListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [replacementId, setReplacementId] = useState("");
  const [rating, setRating] = useState("3");
  const [notes, setNotes] = useState("");
  const [sessionRate60, setSessionRate60] = useState("120");
  const [sessionRate90, setSessionRate90] = useState("180");
  const [sessionRate120, setSessionRate120] = useState("240");
  const [trackAdjustments, setTrackAdjustments] = useState<Record<CourseType, string>>({ scratch: "0", python: "20", web: "30", ai: "40" });
  const [financeNotes, setFinanceNotes] = useState("");

  async function load() {
    setLoading(true);
    const [data, teachers] = await Promise.all([getTeacherDetails(id), listTeachers()]);
    setTeacher(data);
    setAlternatives(teachers.filter((item) => item.id !== id));
    if (data) {
      const evaluation = getTeacherEvaluation(id);
      const finance = await getTeacherFinanceConfig(id);
      setRating(evaluation?.rating ? String(evaluation.rating) : "3");
      setNotes(evaluation?.notes ?? "");
      setSessionRate60(String(finance.sessionRate60));
      setSessionRate90(String(finance.sessionRate90));
      setSessionRate120(String(finance.sessionRate120));
      setTrackAdjustments({
        scratch: String(finance.trackAdjustments.scratch ?? 0),
        python: String(finance.trackAdjustments.python ?? 20),
        web: String(finance.trackAdjustments.web ?? 30),
        ai: String(finance.trackAdjustments.ai ?? 40),
      });
      setFinanceNotes(finance.notes ?? "");
      setReplacementId((prev) => prev || teachers.find((item) => item.id !== id)?.id || "");
    }
    setLoading(false);
  }

  useEffect(() => {
    let mounted = true;
    (async () => {
      if (!mounted) return;
      await load();
    })();
    return () => {
      mounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const financeSummary = useMemo(() => {
    if (!teacher) return null;
    return computeTeacherFinanceSummary(teacher.linkedSessions, {
      teacherId: teacher.id,
      sessionRate60: Number(sessionRate60) || 120,
      sessionRate90: Number(sessionRate90) || 180,
      sessionRate120: Number(sessionRate120) || 240,
      trackAdjustments: {
        scratch: Number(trackAdjustments.scratch) || 0,
        python: Number(trackAdjustments.python) || 20,
        web: Number(trackAdjustments.web) || 30,
        ai: Number(trackAdjustments.ai) || 40,
      },
      notes: financeNotes.trim() || null,
      updatedAt: null,
    });
  }, [teacher, sessionRate60, sessionRate90, sessionRate120, trackAdjustments, financeNotes]);

  const reportSummary = useMemo(() => {
    if (!teacher) return { ready: 0, needsAttention: 0 };
    const snapshots = teacher.linkedStudents.map((student) => buildStudentReportSnapshot(student));
    return {
      ready: snapshots.filter((item) => item.ready).length,
      needsAttention: snapshots.filter((item) => !item.ready).length,
    };
  }, [teacher]);

  async function handleSaveEvaluation() {
    if (!teacher) return;
    setBusy("evaluation");
    try {
      saveTeacherEvaluation({ teacherId: teacher.id, rating: Number(rating) || null, notes });
      toast.success(t(locale, "تم حفظ تقييم المدرس", "Teacher evaluation saved"));
      await load();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t(locale, "تعذر حفظ التقييم", "Could not save evaluation"));
    } finally {
      setBusy(null);
    }
  }

  async function handleSaveFinance() {
    if (!teacher) return;
    setBusy("finance");
    try {
      await saveTeacherFinanceConfig({
        teacherId: teacher.id,
        sessionRate60: Number(sessionRate60) || 120,
        sessionRate90: Number(sessionRate90) || 180,
        sessionRate120: Number(sessionRate120) || 240,
        trackAdjustments: {
          scratch: Number(trackAdjustments.scratch) || 0,
          python: Number(trackAdjustments.python) || 20,
          web: Number(trackAdjustments.web) || 30,
          ai: Number(trackAdjustments.ai) || 40,
        },
        notes: financeNotes,
      });
      toast.success(t(locale, "تم حفظ الإعدادات المالية", "Finance settings saved"));
      await load();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t(locale, "تعذر حفظ الإعدادات المالية", "Could not save finance settings"));
    } finally {
      setBusy(null);
    }
  }

  async function handleReassign() {
    if (!teacher || !replacementId) return;
    setBusy("reassign");
    try {
      const result = await reassignTeacherRelations(teacher.id, replacementId);
      toast.success(t(locale, `تم نقل ${result.sessionsUpdated} حصص و ${result.classesUpdated} كلاسات`, `Moved ${result.sessionsUpdated} sessions and ${result.classesUpdated} classes`));
      await load();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t(locale, "تعذر نقل الحصص", "Could not reassign sessions"));
    } finally {
      setBusy(null);
    }
  }

  async function handleDelete() {
    if (!teacher) return;
    if (teacher.linkedSessions.length > 0) {
      toast.error(t(locale, "انقل الحصص أولًا قبل حذف المدرس", "Reassign the sessions before deleting this teacher"));
      return;
    }
    const confirmed = window.confirm(t(locale, "هل تريد حذف هذا المدرس نهائيًا؟", "Delete this teacher permanently?"));
    if (!confirmed) return;
    setBusy("delete");
    try {
      const deleted = await deleteTeacher(teacher.id);
      if (!deleted) throw new Error(t(locale, "تعذر حذف المدرس", "Could not delete teacher"));
      toast.success(t(locale, "تم حذف المدرس", "Teacher deleted"));
      router.push("/teachers");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t(locale, "تعذر حذف المدرس", "Could not delete teacher"));
    } finally {
      setBusy(null);
    }
  }

  if (loading) {
    return (
      <LoadingState
        titleAr="جارِ تحميل بيانات المدرس"
        titleEn="Loading teacher details"
        descriptionAr="يتم الآن تجهيز ملف المدرس وربط الجلسات والطلاب المرتبطين به."
        descriptionEn="Preparing the teacher profile with linked sessions and students."
      />
    );
  }

  if (!teacher) {
    return (
      <PageStateCard
        variant="warning"
        titleAr="المدرس غير موجود"
        titleEn="Teacher not found"
        descriptionAr="قد يكون هذا الملف محذوفًا أو أن الرابط غير صحيح. ارجع إلى قائمة المدرسين ثم افتح الملف الصحيح."
        descriptionEn="This teacher profile may have been removed or the link is incorrect. Go back to the teachers list and open the correct record."
        actionHref="/teachers"
        actionLabelAr="العودة إلى المدرسين"
        actionLabelEn="Back to teachers"
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex items-center gap-3">
          <Link href="/teachers" className="rounded-xl p-2 text-muted-foreground transition-colors hover:bg-muted">
            {isAr ? <ArrowRight size={18} /> : <ArrowLeft size={18} />}
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-foreground">{teacher.fullName}</h1>
            <p className="text-sm text-muted-foreground">{getEmploymentTypeLabel(teacher.employment, locale)}</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href={`/schedule/new?teacherId=${teacher.id}`} className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-2.5 text-sm font-semibold text-foreground transition-colors hover:bg-muted">
            <PlusCircle size={16} />{t(locale, "إضافة حصة لهذا المدرس", "Add session for this teacher")}
          </Link>
          <Link href="/teachers/finance" className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-2.5 text-sm font-semibold text-foreground transition-colors hover:bg-muted">
            <Calculator size={16} />{t(locale, "حسابات المدرسين", "Teacher accounts")}
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <Metric label={t(locale, "الكلاسات الحالية", "Current classes")} value={teacher.classesCount.toString()} />
        <Metric label={t(locale, "إجمالي الطلاب", "Total students")} value={teacher.studentsCount.toString()} />
        <Metric label={t(locale, "تقارير جاهزة", "Reports ready")} value={String(reportSummary.ready)} />
        <Metric label={t(locale, "يحتاج متابعة", "Need follow-up")} value={String(reportSummary.needsAttention)} />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="rounded-2xl border border-border bg-card p-5 lg:col-span-2">
          <h2 className="mb-4 flex items-center gap-2 text-lg font-bold text-foreground"><BookOpen size={20} className="text-brand-600" />{t(locale, "التخصصات والدورات", "Specializations and courses")}</h2>
          <div className="mb-6 flex flex-wrap gap-2">
            {teacher.specialization.map((item) => <span key={item} className="rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-700 dark:bg-brand-950 dark:text-brand-300">{formatCourseLabel(item, locale)}</span>)}
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <h3 className="mb-3 text-sm font-bold text-foreground">{t(locale, "الدورات المفعّلة حاليًا", "Currently active courses")}</h3>
              <div className="flex flex-wrap gap-2">
                {teacher.activeCourses.length === 0 ? (
                  <span className="text-sm text-muted-foreground">{t(locale, "لا توجد كلاسات مربوطة بعد", "No linked classes yet")}</span>
                ) : (
                  teacher.activeCourses.map((course) => (
                    <span key={course} className="rounded-full bg-muted px-3 py-1 text-xs font-medium text-foreground">{formatCourseLabel(course, locale)}</span>
                  ))
                )}
              </div>
            </div>
            <div className="space-y-3">
              <Info icon={Phone} label={t(locale, "الهاتف", "Phone")} value={teacher.phone} href={`tel:${teacher.phone}`} />
              <Info icon={Mail} label={t(locale, "البريد", "Email")} value={teacher.email ?? t(locale, "غير متوفر", "N/A")} href={teacher.email ? `mailto:${teacher.email}` : undefined} />
              <Info icon={BookOpen} label={t(locale, "الحالة", "Status")} value={teacher.isActive ? t(locale, "نشط", "Active") : t(locale, "غير نشط", "Inactive")} />
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-card p-5">
          <h3 className="mb-3 flex items-center gap-2 font-bold text-foreground"><FileText size={18} className="text-brand-600" />{t(locale, "التقييم", "Evaluation")}</h3>
          <div className="space-y-3">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-foreground">{t(locale, "التقييم من 5", "Rating out of 5")}</label>
              <select value={rating} onChange={(event) => setRating(event.target.value)} className="w-full rounded-xl border border-input bg-muted/50 px-4 py-2.5 text-sm text-foreground focus:border-transparent focus:ring-2 focus:ring-ring">
                {[1,2,3,4,5].map((item) => <option key={item} value={String(item)}>{item}</option>)}
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-foreground">{t(locale, "ملاحظات", "Notes")}</label>
              <textarea value={notes} onChange={(event) => setNotes(event.target.value)} rows={4} className="w-full rounded-xl border border-input bg-muted/50 px-4 py-2.5 text-sm text-foreground focus:border-transparent focus:ring-2 focus:ring-ring" />
            </div>
            {teacher.evaluationUpdatedAt ? <p className="text-xs text-muted-foreground">{t(locale, "آخر تحديث", "Last updated")}: {formatDate(teacher.evaluationUpdatedAt, locale)}</p> : null}
            <button onClick={handleSaveEvaluation} disabled={busy !== null} className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-brand-700 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-600 disabled:opacity-50"><Save size={16} />{t(locale, "حفظ التقييم", "Save evaluation")}</button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <div className="rounded-2xl border border-border bg-card p-5">
          <h3 className="mb-4 flex items-center gap-2 font-bold text-foreground"><Calculator size={18} className="text-brand-600" />{t(locale, "الجزء المالي", "Finance")}</h3>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <MoneyField label={t(locale, "سعر 60 دقيقة", "60 min rate")} value={sessionRate60} onChange={setSessionRate60} />
            <MoneyField label={t(locale, "سعر 90 دقيقة", "90 min rate")} value={sessionRate90} onChange={setSessionRate90} />
            <MoneyField label={t(locale, "سعر 120 دقيقة", "120 min rate")} value={sessionRate120} onChange={setSessionRate120} />
          </div>
          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {TRACKS.map((track) => (
              <MoneyField key={track} label={formatCourseLabel(track, locale)} value={trackAdjustments[track]} onChange={(value) => setTrackAdjustments((prev) => ({ ...prev, [track]: value }))} />
            ))}
          </div>
          <div className="mt-4">
            <label className="mb-1.5 block text-sm font-medium text-foreground">{t(locale, "ملاحظات مالية", "Finance notes")}</label>
            <textarea value={financeNotes} onChange={(event) => setFinanceNotes(event.target.value)} rows={3} className="w-full rounded-xl border border-input bg-muted/50 px-4 py-2.5 text-sm text-foreground focus:border-transparent focus:ring-2 focus:ring-ring" />
          </div>
          {financeSummary ? (
            <div className="mt-4 grid grid-cols-2 gap-3 xl:grid-cols-4">
              <Metric label={t(locale, "أسبوعي", "Weekly")} value={formatCurrencyEgp(financeSummary.weeklyEstimated, locale)} compact />
              <Metric label={t(locale, "شهري", "Monthly")} value={formatCurrencyEgp(financeSummary.monthlyEstimated, locale)} compact />
              <Metric label={t(locale, "متوسط الحصة", "Avg session")} value={formatCurrencyEgp(financeSummary.averagePerSession, locale)} compact />
              <Metric label={t(locale, "الحصص", "Sessions")} value={String(financeSummary.linkedSessions)} compact />
            </div>
          ) : null}
          <button onClick={handleSaveFinance} disabled={busy !== null} className="mt-4 inline-flex items-center gap-2 rounded-xl bg-brand-700 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-600 disabled:opacity-50"><Save size={16} />{t(locale, "حفظ الإعدادات المالية", "Save finance settings")}</button>
        </div>

        <div className="space-y-4">
          <div className="rounded-2xl border border-border bg-card p-5">
            <h3 className="mb-4 flex items-center gap-2 font-bold text-foreground"><CalendarDays size={18} className="text-brand-600" />{t(locale, "إعادة تعيين قبل الحذف", "Reassign before deletion")}</h3>
            <div className="space-y-3">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-foreground">{t(locale, "مدرس بديل", "Replacement teacher")}</label>
                <select value={replacementId} onChange={(event) => setReplacementId(event.target.value)} className="w-full rounded-xl border border-input bg-muted/50 px-4 py-2.5 text-sm text-foreground focus:border-transparent focus:ring-2 focus:ring-ring">
                  <option value="">{t(locale, "اختر مدرسًا", "Choose teacher")}</option>
                  {alternatives.map((item) => <option key={item.id} value={item.id}>{item.fullName}</option>)}
                </select>
              </div>
              <p className="text-xs text-muted-foreground">{t(locale, "إذا كان المدرس مرتبطًا بحصص، انقلها أولًا ثم احذف المدرس بأمان.", "If the teacher is linked to sessions, move them first, then delete the teacher safely.")}</p>
              <div className="flex flex-wrap gap-2">
                <button onClick={handleReassign} disabled={!replacementId || busy !== null || teacher.linkedSessions.length === 0} className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-2.5 text-sm font-semibold text-foreground transition-colors hover:bg-muted disabled:opacity-50">
                  <CalendarDays size={16} />{t(locale, "نقل الحصص والكلاسات", "Move sessions and classes")}
                </button>
                <button onClick={handleDelete} disabled={busy !== null || teacher.linkedSessions.length > 0} className="inline-flex items-center gap-2 rounded-xl bg-danger-500 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-danger-600 disabled:opacity-50">
                  <Trash2 size={16} />{t(locale, "حذف المدرس", "Delete teacher")}
                </button>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-card p-5">
            <h3 className="mb-4 flex items-center gap-2 font-bold text-foreground"><CalendarDays size={18} className="text-brand-600" />{t(locale, "الجلسات المرتبطة", "Linked sessions")}</h3>
            {teacher.linkedSessions.length === 0 ? (
              <EmptyCopy locale={locale} ar="لا توجد جلسات مرتبطة بهذا المدرس حاليًا" en="No sessions are linked to this teacher yet" />
            ) : (
              <div className="space-y-3">
                {teacher.linkedSessions.map((session) => (
                  <Link key={session.id} href={`/schedule/${session.id}`} className="block rounded-2xl border border-border bg-background p-4 transition-colors hover:bg-muted/40">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="font-semibold text-foreground">{session.className}</p>
                        <p className="mt-1 text-xs text-muted-foreground">{session.startTime} → {session.endTime}</p>
                      </div>
                      <span className="rounded-full bg-muted px-2.5 py-1 text-[11px] text-muted-foreground">{formatCourseLabel(session.course, locale)}</span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-card p-5">
        <h3 className="mb-4 flex items-center gap-2 font-bold text-foreground"><Users size={18} className="text-brand-600" />{t(locale, "الطلاب المرتبطون", "Linked students")}</h3>
        {teacher.linkedStudents.length === 0 ? (
          <EmptyCopy locale={locale} ar="لا يوجد طلاب مرتبطون بهذا المدرس حتى الآن" en="No students are linked to this teacher yet" />
        ) : (
          <div className="space-y-3">
            {teacher.linkedStudents.map((student) => {
              const snapshot = buildStudentReportSnapshot(student);
              return (
                <Link key={student.id} href={`/students/${student.id}`} className="flex flex-col gap-2 rounded-2xl border border-border bg-background p-4 transition-colors hover:bg-muted/40 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="font-semibold text-foreground">{student.fullName}</p>
                    <p className="mt-1 text-xs text-muted-foreground">{student.className ?? t(locale, "غير مسجل", "Not assigned")} • {student.parentName}</p>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <span className="rounded-full bg-muted px-2.5 py-1 text-muted-foreground">{snapshot.ready ? t(locale, "تقرير جاهز", "Report ready") : t(locale, "متابعة", "Follow-up")}</span>
                    <span className="rounded-full bg-brand-50 px-2.5 py-1 text-brand-700 dark:bg-brand-950 dark:text-brand-300">{t(locale, "المتبقي", "Remaining")}: {snapshot.sessionsUntilNext}</span>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function Metric({ label, value, compact = false }: { label: string; value: string; compact?: boolean }) {
  return <div className={`rounded-xl bg-muted/40 ${compact ? "p-3 text-center" : "p-4 text-center"}`}><p className={`${compact ? "text-[11px]" : "text-xs"} text-muted-foreground`}>{label}</p><p className={`mt-1 ${compact ? "text-base" : "text-2xl"} font-bold text-foreground`}>{value}</p></div>;
}

function Info({ icon: Icon, label, value, href }: { icon: typeof Phone; label: string; value: string; href?: string }) {
  const content = <div className="rounded-xl bg-muted/40 p-3"><div className="flex items-center gap-2 text-xs text-muted-foreground"><Icon size={14} />{label}</div><p className="mt-1 font-semibold text-foreground">{value}</p></div>;
  if (!href) return content;
  return <a href={href} className="block transition-opacity hover:opacity-85">{content}</a>;
}

function EmptyCopy({ locale, ar, en }: { locale: "ar" | "en"; ar: string; en: string }) {
  return <div className="rounded-2xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">{t(locale, ar, en)}</div>;
}

function MoneyField({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return <div><label className="mb-1.5 block text-xs font-medium text-foreground">{label}</label><input inputMode="numeric" value={value} onChange={(event) => onChange(event.target.value)} className="w-full rounded-xl border border-input bg-muted/50 px-3 py-2.5 text-sm text-foreground focus:border-transparent focus:ring-2 focus:ring-ring" /></div>;
}
