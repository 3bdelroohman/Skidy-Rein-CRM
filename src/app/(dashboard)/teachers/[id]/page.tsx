"use client";

import { use, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, BookOpen, CalendarDays, FileText, Phone, RefreshCcw, Save, Star, Trash2, Users } from "lucide-react";
import { toast } from "sonner";
import { useUIStore } from "@/stores/ui-store";
import { formatCourseLabel } from "@/lib/formatters";
import { buildStudentReportSnapshot } from "@/services/student-report.service";
import { getEmploymentTypeLabel, t } from "@/lib/locale";
import { getTeacherDetails } from "@/services/relations.service";
import { saveTeacherEvaluation } from "@/services/teacher-evaluations.service";
import { deleteTeacher, listTeachers } from "@/services/teachers.service";
import { reassignTeacherRelations } from "@/services/teacher-reassignment.service";
import { LoadingState, PageStateCard } from "@/components/shared/page-state";
import type { TeacherDetails, TeacherListItem } from "@/types/crm";

type TeacherLinkedStudentForReport = TeacherDetails["linkedStudents"][number] & {
  teachers?: { fullName: string }[];
  relatedSessions?: { className: string }[];
};

export default function TeacherDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const locale = useUIStore((state) => state.locale);
  const isAr = locale === "ar";
  const router = useRouter();
  const [teacher, setTeacher] = useState<TeacherDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [rating, setRating] = useState("3");
  const [notes, setNotes] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [reassigning, setReassigning] = useState(false);
  const [candidates, setCandidates] = useState<TeacherListItem[]>([]);
  const [reassignTo, setReassignTo] = useState("");

  async function loadTeacherPage() {
    setLoading(true);
    const [data, teacherItems] = await Promise.all([getTeacherDetails(id), listTeachers()]);
    setTeacher(data);
    setRating(data?.manualRating ? String(data.manualRating) : "3");
    setNotes(data?.evaluationNotes ?? "");

    const nextCandidates = teacherItems
      .filter((item) => item.id !== id && item.isActive)
      .sort((a, b) => a.fullName.localeCompare(b.fullName, "ar"));

    setCandidates(nextCandidates);
    setReassignTo((prev) => (prev && nextCandidates.some((item) => item.id === prev) ? prev : nextCandidates[0]?.id ?? ""));
    setLoading(false);
  }

  useEffect(() => {
    let mounted = true;
    (async () => {
      const [data, teacherItems] = await Promise.all([getTeacherDetails(id), listTeachers()]);
      if (!mounted) return;
      setTeacher(data);
      setRating(data?.manualRating ? String(data.manualRating) : "3");
      setNotes(data?.evaluationNotes ?? "");
      const nextCandidates = teacherItems
        .filter((item) => item.id !== id && item.isActive)
        .sort((a, b) => a.fullName.localeCompare(b.fullName, "ar"));
      setCandidates(nextCandidates);
      setReassignTo(nextCandidates[0]?.id ?? "");
      setLoading(false);
    })();
    return () => {
      mounted = false;
    };
  }, [id]);

  const reportSummaries = useMemo(
    () => teacher?.linkedStudents.map((student) => ({ student, snapshot: buildStudentReportSnapshot(student as TeacherLinkedStudentForReport) })) ?? [],
    [teacher],
  );
  const readyReports = reportSummaries.filter((item) => item.snapshot.ready).length;
  const needsAttention = reportSummaries.length - readyReports;
  const nextCheckpoint = [...reportSummaries].sort((a, b) => a.snapshot.sessionsUntilNext - b.snapshot.sessionsUntilNext)[0] ?? null;
  const hasBlockingSessions = (teacher?.linkedSessions?.length ?? 0) > 0;

  async function handleDeleteTeacher() {
    if (!teacher) return;
    if (hasBlockingSessions) {
      toast.error(t(locale, "انقل الحصص أولًا إلى مدرس آخر ثم احذف المدرس.", "Reassign sessions first, then delete the teacher."));
      return;
    }

    const confirmed = window.confirm(
      t(locale, "سيتم حذف المدرس نهائيًا. هل تريد المتابعة؟", "This will permanently delete the teacher. Do you want to continue?"),
    );
    if (!confirmed) return;

    setDeleting(true);
    const ok = await deleteTeacher(teacher.id);
    setDeleting(false);

    if (!ok) {
      toast.error(t(locale, "تعذر حذف المدرس", "Failed to delete teacher"));
      return;
    }

    toast.success(t(locale, "تم حذف المدرس", "Teacher deleted"));
    router.push("/teachers");
  }

  async function handleReassignTeacher() {
    if (!teacher || !reassignTo) return;
    setReassigning(true);
    const result = await reassignTeacherRelations(teacher.id, reassignTo);
    setReassigning(false);

    if (result.classesUpdated === 0 && result.sessionsUpdated === 0) {
      toast.error(t(locale, "لم يتم العثور على حصص مرتبطة لنقلها", "No linked sessions were found to reassign"));
      return;
    }

    toast.success(
      t(
        locale,
        `تم نقل ${result.classesUpdated} كلاس و ${result.sessionsUpdated} جلسة إلى المدرس الجديد`,
        `Reassigned ${result.classesUpdated} classes and ${result.sessionsUpdated} sessions to the new teacher`,
      ),
    );

    await loadTeacherPage();
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
      <div className="flex items-center gap-3">
        <Link href="/teachers" className="rounded-xl p-2 text-muted-foreground transition-colors hover:bg-muted">
          {isAr ? <ArrowRight size={18} /> : <ArrowLeft size={18} />}
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-foreground">{teacher.fullName}</h1>
          <p className="text-sm text-muted-foreground">{getEmploymentTypeLabel(teacher.employment, locale)}</p>
        </div>
      </div>

      <div className="rounded-2xl border border-brand-200 bg-brand-50/50 p-4 dark:border-brand-900/50 dark:bg-brand-950/20">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-bold text-foreground">{t(locale, "نقل ارتباطات المدرس", "Teacher reassignment")}</p>
            <p className="mt-1 text-xs text-muted-foreground">
              {t(
                locale,
                "إذا أردت حذف المدرس، انقل الحصص المرتبطة أولًا إلى مدرس آخر ثم احذف الملف بأمان.",
                "If you want to delete this teacher, reassign linked sessions first, then delete the profile safely.",
              )}
            </p>
          </div>
          <div className="grid w-full gap-3 lg:max-w-xl lg:grid-cols-[minmax(0,1fr)_auto]">
            <select
              value={reassignTo}
              onChange={(event) => setReassignTo(event.target.value)}
              className="w-full rounded-xl border border-input bg-background px-4 py-2.5 text-sm text-foreground focus:border-transparent focus:ring-2 focus:ring-ring"
            >
              {candidates.length === 0 ? (
                <option value="">{t(locale, "لا يوجد مدرس آخر نشط", "No other active teacher")}</option>
              ) : (
                candidates.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.fullName}
                  </option>
                ))
              )}
            </select>
            <button
              type="button"
              onClick={handleReassignTeacher}
              disabled={reassigning || !reassignTo || !hasBlockingSessions}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand-700 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <RefreshCcw size={16} />
              {reassigning ? t(locale, "جارِ النقل...", "Reassigning...") : t(locale, "نقل الحصص لهذا المدرس", "Reassign sessions")}
            </button>
          </div>
        </div>
        <div className="mt-3 flex flex-wrap gap-2 text-xs text-muted-foreground">
          <span className="rounded-full bg-background px-3 py-1">{t(locale, "حصص مرتبطة", "Linked sessions")}: {teacher.linkedSessions.length}</span>
          <span className="rounded-full bg-background px-3 py-1">{t(locale, "طلاب ظاهرون في الملف", "Visible students")}: {teacher.linkedStudents.length}</span>
        </div>
      </div>

      <div className="rounded-2xl border border-red-200 bg-red-50/70 p-4 dark:border-red-900/50 dark:bg-red-950/20">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-bold text-foreground">{t(locale, "حذف المدرس", "Delete teacher")}</p>
            <p className="mt-1 text-xs text-muted-foreground">
              {hasBlockingSessions
                ? t(locale, "انقل الحصص المرتبطة أولًا ثم احذف المدرس.", "Reassign linked sessions first, then delete the teacher.")
                : t(locale, "سيتم حذف المدرس نهائيًا من النظام.", "The teacher will be permanently removed from the system.")}
            </p>
          </div>
          <button
            type="button"
            onClick={handleDeleteTeacher}
            disabled={deleting || hasBlockingSessions}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-red-200 bg-white px-4 py-2 text-sm font-semibold text-red-700 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-red-900/50 dark:bg-transparent dark:text-red-300 dark:hover:bg-red-950/30"
          >
            <Trash2 size={16} />
            {deleting ? t(locale, "جارِ الحذف...", "Deleting...") : t(locale, "حذف المدرس", "Delete teacher")}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="rounded-2xl border border-border bg-card p-5 lg:col-span-2">
          <h2 className="mb-4 flex items-center gap-2 text-lg font-bold text-foreground"><BookOpen size={20} className="text-brand-600" />{t(locale, "التخصصات والدورات", "Specializations and courses")}</h2>
          <div className="mb-6 flex flex-wrap gap-2">
            {teacher.specialization.map((item) => <span key={item} className="rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-700 dark:bg-brand-950 dark:text-brand-300">{formatCourseLabel(item, locale)}</span>)}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Metric label={t(locale, "الكلاسات الحالية", "Current classes")} value={teacher.classesCount.toString()} />
            <Metric label={t(locale, "إجمالي الطلاب", "Total students")} value={teacher.studentsCount.toString()} />
          </div>

          <div className="mt-6 flex flex-wrap gap-2">
            <Link href={`/schedule/new?teacherId=${teacher.id}${teacher.specialization[0] ? `&course=${teacher.specialization[0]}` : ""}`} className="rounded-xl bg-brand-600 px-3 py-2 text-xs font-semibold text-white transition-opacity hover:opacity-90">
              {t(locale, "إضافة حصة لهذا المدرس", "Add session for this teacher")}
            </Link>
          </div>

          <div className="mt-6">
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
        </div>

        <div className="rounded-2xl border border-border bg-card p-5">
          <h3 className="mb-3 flex items-center gap-2 font-bold text-foreground"><Users size={18} className="text-brand-600" />{t(locale, "بيانات التواصل", "Contact details")}</h3>
          <div className="space-y-3">
            <Info icon={Phone} label={t(locale, "الهاتف", "Phone")} value={teacher.phone} href={`tel:${teacher.phone}`} />
            <Info icon={BookOpen} label={t(locale, "الحالة", "Status")} value={teacher.isActive ? t(locale, "نشط", "Active") : t(locale, "غير نشط", "Inactive")} />
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-card p-5">
          <h3 className="mb-3 flex items-center gap-2 font-bold text-foreground"><Star size={18} className="text-brand-600" />{t(locale, "التقييم", "Evaluation")}</h3>
          <div className="space-y-3">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-foreground">{t(locale, "التقييم العام", "Overall rating")}</label>
              <select value={rating} onChange={(event) => setRating(event.target.value)} className="w-full rounded-xl border border-input bg-muted/50 px-4 py-2.5 text-sm text-foreground focus:border-transparent focus:ring-2 focus:ring-ring">
                {[1,2,3,4,5].map((item) => <option key={item} value={item}>{item}/5</option>)}
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-foreground">{t(locale, "ملاحظات التقييم", "Evaluation notes")}</label>
              <textarea value={notes} onChange={(event) => setNotes(event.target.value)} rows={4} className="w-full rounded-xl border border-input bg-muted/50 px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-transparent focus:ring-2 focus:ring-ring" />
            </div>
            <button
              type="button"
              onClick={() => {
                const saved = saveTeacherEvaluation({ teacherId: teacher.id, rating: Number(rating), notes });
                setTeacher((prev) => prev ? { ...prev, manualRating: saved.rating, evaluationNotes: saved.notes, evaluationUpdatedAt: saved.updatedAt } : prev);
              }}
              className="inline-flex items-center gap-2 rounded-xl bg-brand-700 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-600"
            >
              <Save size={16} />
              {t(locale, "حفظ التقييم", "Save evaluation")}
            </button>
            {teacher.evaluationUpdatedAt ? <p className="text-xs text-muted-foreground">{t(locale, "آخر تحديث", "Last updated")}: {new Date(teacher.evaluationUpdatedAt).toLocaleString(isAr ? "ar-EG" : "en-US")}</p> : null}
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-card p-5">
          <h3 className="mb-3 flex items-center gap-2 font-bold text-foreground"><FileText size={18} className="text-brand-600" />{t(locale, "المتابعة التشغيلية", "Operational follow-up")}</h3>
          <div className="space-y-3">
            <Metric label={t(locale, "تقارير جاهزة", "Reports ready")} value={String(readyReports)} />
            <Metric label={t(locale, "تحتاج متابعة", "Need follow-up")} value={String(needsAttention)} />
          </div>
          {nextCheckpoint ? (
            <div className="mt-4 rounded-xl bg-muted/40 p-3 text-sm text-muted-foreground">
              <p className="font-semibold text-foreground">{nextCheckpoint.student.fullName}</p>
              <p className="mt-1">{t(locale, "الأقرب للتقرير التالي", "Closest to next report")}: {nextCheckpoint.snapshot.sessionsUntilNext} {t(locale, "حصص", "sessions")}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <Link href={`/students/${nextCheckpoint.student.id}/report`} className="rounded-xl border border-border px-3 py-2 text-xs font-semibold text-foreground transition-colors hover:bg-muted">
                  {t(locale, "فتح التقرير", "Open report")}
                </Link>
                <Link href={`/students/${nextCheckpoint.student.id}`} className="rounded-xl border border-border px-3 py-2 text-xs font-semibold text-foreground transition-colors hover:bg-muted">
                  {t(locale, "ملف الطالب", "Student profile")}
                </Link>
              </div>
            </div>
          ) : null}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
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

        <div className="rounded-2xl border border-border bg-card p-5">
          <h3 className="mb-4 flex items-center gap-2 font-bold text-foreground"><Users size={18} className="text-brand-600" />{t(locale, "الطلاب المرتبطون", "Linked students")}</h3>
          {teacher.linkedStudents.length === 0 ? (
            <EmptyCopy locale={locale} ar="لا يوجد طلاب مرتبطون بهذا المدرس حتى الآن" en="No students are linked to this teacher yet" />
          ) : (
            <div className="space-y-3">
              {teacher.linkedStudents.map((student) => (
                <Link key={student.id} href={`/students/${student.id}`} className="flex items-center justify-between gap-3 rounded-2xl border border-border bg-background p-4 transition-colors hover:bg-muted/40">
                  <div>
                    <p className="font-semibold text-foreground">{student.fullName}</p>
                    <p className="mt-1 text-xs text-muted-foreground">{student.className ?? t(locale, "غير مسجل", "Not assigned")}</p>
                    <p className="mt-2 text-[11px] text-brand-700 dark:text-brand-300">{t(locale, "افتح تقرير الطالب من الملف", "Open the student report from the profile")}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">{student.parentName}</span>
                    <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] text-muted-foreground">{buildStudentReportSnapshot(student as TeacherLinkedStudentForReport).ready ? t(locale, "تقرير جاهز", "Report ready") : t(locale, "قيد المتابعة", "In progress")}</span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return <div className="rounded-xl bg-muted/40 p-3 text-center"><p className="text-xs text-muted-foreground">{label}</p><p className="mt-1 text-2xl font-bold text-foreground">{value}</p></div>;
}

function Info({ icon: Icon, label, value, href }: { icon: typeof Phone; label: string; value: string; href?: string }) {
  const content = <div className="rounded-xl bg-muted/40 p-3"><div className="flex items-center gap-2 text-xs text-muted-foreground"><Icon size={14} />{label}</div><p className="mt-1 font-semibold text-foreground">{value}</p></div>;
  if (!href) return content;
  return <a href={href} className="block transition-opacity hover:opacity-85">{content}</a>;
}

function EmptyCopy({ locale, ar, en }: { locale: "ar" | "en"; ar: string; en: string }) {
  return <div className="rounded-2xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">{t(locale, ar, en)}</div>;
}
