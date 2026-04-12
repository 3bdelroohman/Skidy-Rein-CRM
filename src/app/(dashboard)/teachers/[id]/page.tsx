"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, BookOpen, CalendarDays, Phone, Save, Star, Users } from "lucide-react";
import { useUIStore } from "@/stores/ui-store";
import { formatCourseLabel } from "@/lib/formatters";
import { getEmploymentTypeLabel, t } from "@/lib/locale";
import { getTeacherDetails } from "@/services/relations.service";
import { saveTeacherEvaluation } from "@/services/teacher-evaluations.service";
import { LoadingState, PageStateCard } from "@/components/shared/page-state";
import type { TeacherDetails } from "@/types/crm";

export default function TeacherDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const locale = useUIStore((state) => state.locale);
  const isAr = locale === "ar";
  const [teacher, setTeacher] = useState<TeacherDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [rating, setRating] = useState("3");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    let mounted = true;
    getTeacherDetails(id).then((data) => {
      if (mounted) {
        setTeacher(data);
        setRating(data?.manualRating ? String(data.manualRating) : "3");
        setNotes(data?.evaluationNotes ?? "");
        setLoading(false);
      }
    });
    return () => {
      mounted = false;
    };
  }, [id]);

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
                  </div>
                  <span className="text-xs text-muted-foreground">{student.parentName}</span>
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
