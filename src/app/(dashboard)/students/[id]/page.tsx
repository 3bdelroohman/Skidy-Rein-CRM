"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, CalendarDays, GraduationCap, MessageCircle, UserCircle, ClipboardList } from "lucide-react";
import { useUIStore } from "@/stores/ui-store";
import { STUDENT_STATUS_META, getMetaLabel } from "@/config/status-meta";
import { getCourseFormLabel, getCourseTracks } from "@/config/course-roadmap";
import { t } from "@/lib/locale";
import { formatCurrencyEgp, formatDate } from "@/lib/formatters";
import { getStudentDetails } from "@/services/relations.service";
import { buildStudentJourney } from "@/services/student-journey.service";
import { buildStudentReportSnapshot } from "@/services/student-report.service";
import { LoadingState, PageStateCard } from "@/components/shared/page-state";
import type { StudentDetails } from "@/types/crm";

export default function StudentDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const locale = useUIStore((state) => state.locale);
  const isAr = locale === "ar";
  const [student, setStudent] = useState<StudentDetails | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    getStudentDetails(id).then((data) => {
      if (mounted) {
        setStudent(data);
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
        titleAr="جارِ تحميل ملف الطالب"
        titleEn="Loading student profile"
        descriptionAr="يتم الآن تجهيز الربط بين الطالب وولي الأمر والمدرسين والجلسات المرتبطة."
        descriptionEn="Linking the student with the parent, teachers, and related sessions now."
      />
    );
  }

  if (!student) {
    return (
      <PageStateCard
        variant="warning"
        titleAr="الطالب غير موجود"
        titleEn="Student not found"
        descriptionAr="قد يكون هذا الملف محذوفًا أو أن الرابط غير صحيح. ارجع إلى قائمة الطلاب ثم اختر الملف الصحيح."
        descriptionEn="This student profile may have been removed or the link is incorrect. Go back to the students list and open the correct record."
        actionHref="/students"
        actionLabelAr="العودة إلى الطلاب"
        actionLabelEn="Back to students"
      />
    );
  }

  const status = STUDENT_STATUS_META[student.status];
  const courseTracks = student.currentCourse ? getCourseTracks(student.currentCourse, locale) : [];
  const journey = buildStudentJourney(student);
  const report = buildStudentReportSnapshot(student);
  const primaryTeacher = student.teachers[0] ?? null;
  const linkedClassName = report.className ?? student.className ?? t(locale, "غير مسجل", "Not assigned");

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/students" className="rounded-xl p-2 text-muted-foreground transition-colors hover:bg-muted">
          {isAr ? <ArrowRight size={18} /> : <ArrowLeft size={18} />}
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-foreground">{student.fullName}</h1>
          <p className="text-sm text-muted-foreground">{student.parentName} — {student.parentPhone}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="rounded-2xl border border-border bg-card p-5 lg:col-span-2">
          <div className="mb-4 flex items-center gap-2">
            <GraduationCap size={20} className="text-brand-600" />
            <h2 className="text-lg font-bold text-foreground">{t(locale, "ملف الطالب", "Student profile")}</h2>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Info label={t(locale, "العمر", "Age")} value={`${student.age} ${t(locale, "سنة", "years")}`} />
            <Info label={t(locale, "الحالة", "Status")} value={getMetaLabel(status, locale)} />
            <Info label={t(locale, "الكورس الحالي", "Current course")} value={student.currentCourse ? getCourseFormLabel(student.currentCourse, locale) : t(locale, "غير محدد", "Not set")} />
            <Info label={t(locale, "الكلاس", "Class")} value={linkedClassName} />
            <Info label={t(locale, "تاريخ الالتحاق", "Enrollment date")} value={formatDate(student.enrollmentDate, locale)} />
            <Info label={t(locale, "عدد الحصص", "Sessions attended")} value={student.sessionsAttended.toString()} />
            <Info label={t(locale, "إجمالي المدفوع", "Total paid")} value={formatCurrencyEgp(student.totalPaid, locale)} />
            <Info label={t(locale, "المدرس الحالي", "Current teacher")} value={report.teacherName ?? t(locale, "غير مرتبط بعد", "Not linked yet")} />
          </div>
          {courseTracks.length > 0 ? (
            <div className="mt-4 border-t border-border pt-4">
              <p className="mb-2 text-xs text-muted-foreground">{t(locale, "المسارات المرتبطة", "Mapped tracks")}</p>
              <div className="flex flex-wrap gap-2">
                {courseTracks.map((track) => (
                  <span key={track} className="rounded-full bg-brand-50 px-3 py-1 text-xs font-medium text-brand-700 dark:bg-brand-950 dark:text-brand-300">
                    {track}
                  </span>
                ))}
              </div>
            </div>
          ) : null}
        </div>

        <div className="space-y-4">
          <div className="rounded-2xl border border-border bg-card p-5">
            <h3 className="mb-3 flex items-center gap-2 font-bold text-foreground"><UserCircle size={18} className="text-brand-600" />{t(locale, "ولي الأمر", "Parent")}</h3>
            <div className="space-y-3">
              <Info label={t(locale, "الاسم", "Name")} value={student.parent?.fullName ?? student.parentName} />
              <Info label={t(locale, "الهاتف", "Phone")} value={student.parent?.phone ?? student.parentPhone} />
              {student.parent?.whatsapp ? <Info label="WhatsApp" value={student.parent.whatsapp} /> : null}
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              {student.parent ? (
                <Link href={`/parents/${student.parent.id}`} className="rounded-xl bg-brand-600 px-3 py-2 text-xs font-semibold text-white transition-opacity hover:opacity-90">
                  {t(locale, "فتح ملف ولي الأمر", "Open parent profile")}
                </Link>
              ) : null}
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-card p-5">
            <h3 className="mb-3 flex items-center gap-2 font-bold text-foreground"><MessageCircle size={18} className="text-brand-600" />{t(locale, "المدرسون المرتبطون", "Linked teachers")}</h3>
            <div className="flex flex-wrap gap-2">
              {student.teachers.length === 0 ? (
                <span className="text-sm text-muted-foreground">{t(locale, "لا يوجد مدرس مرتبط بعد", "No linked teacher yet")}</span>
              ) : (
                student.teachers.map((teacher) => (
                  <Link key={teacher.id} href={`/teachers/${teacher.id}`} className="rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-700 dark:bg-brand-950 dark:text-brand-300">
                    {teacher.fullName}
                  </Link>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <div className="rounded-2xl border border-border bg-card p-5 xl:col-span-2">
          <h3 className="mb-4 font-bold text-foreground">{t(locale, "رحلة الطالب", "Student journey")}</h3>
          <div className="mb-4 rounded-2xl bg-brand-50 p-4 dark:bg-brand-950/40">
            <p className="text-xs text-muted-foreground">{t(locale, "المرحلة الحالية", "Current stage")}</p>
            <p className="mt-1 text-base font-bold text-foreground">{locale === "ar" ? journey.stageAr : journey.stageEn}</p>
            <p className="mt-2 text-xs text-muted-foreground">
              {journey.reportReady ? t(locale, "يمكن لاحقًا استخراج تقرير ولي الأمر من هذه الرحلة.", "Parent reporting can later be generated from this journey.") : t(locale, "سيصبح التقرير الشهري منطقيًا بعد إكمال 4 حصص على الأقل.", "The monthly report becomes meaningful after at least 4 sessions.")}
            </p>
          </div>
          <div className="space-y-3">
            {journey.milestones.map((item) => (
              <div key={item.id} className="rounded-2xl border border-border bg-background p-4">
                <p className="text-sm font-semibold text-foreground">{locale === "ar" ? item.titleAr : item.titleEn}</p>
                <p className="mt-1 text-xs text-muted-foreground">{locale === "ar" ? item.detailAr : item.detailEn}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-2xl border border-border bg-card p-5">
            <h3 className="mb-3 flex items-center gap-2 font-bold text-foreground"><MessageCircle size={18} className="text-brand-600" />{t(locale, "المدرس الحالي", "Current teacher")}</h3>
            {primaryTeacher ? (
              <div className="space-y-3">
                <Info label={t(locale, "الاسم", "Name")} value={primaryTeacher.fullName} />
                <Info label={t(locale, "الهاتف", "Phone")} value={primaryTeacher.phone} />
                <Info label={t(locale, "الكلاس المرتبط", "Linked class")} value={linkedClassName} />
                <Info label={t(locale, "التخصص", "Specialization")} value={primaryTeacher.specialization.map((item) => getCourseFormLabel(item, locale)).join(" • ")} />
                <Link href={`/teachers/${primaryTeacher.id}`} className="inline-flex rounded-xl bg-brand-600 px-3 py-2 text-xs font-semibold text-white transition-opacity hover:opacity-90">
                  {t(locale, "فتح ملف المدرس", "Open teacher profile")}
                </Link>
              </div>
            ) : (
              <EmptyCopy locale={locale} ar="لم يتم ربط مدرس أساسي بهذا الطالب بعد" en="No primary teacher has been linked to this student yet" />
            )}
          </div>

          <div className="rounded-2xl border border-border bg-card p-5">
            <h3 className="mb-3 flex items-center gap-2 font-bold text-foreground"><ClipboardList size={18} className="text-brand-600" />{t(locale, "مصدر التقرير القادم", "Next report source")}</h3>
            <div className="space-y-3">
              <Info label={t(locale, "آخر نقطة مكتملة", "Last completed checkpoint")} value={report.currentCheckpoint > 0 ? `${report.currentCheckpoint}` : t(locale, "لم يكتمل بعد", "Not completed yet")} />
              <Info label={t(locale, "النقطة القادمة", "Next checkpoint")} value={`${report.nextCheckpoint} ${t(locale, "حصص", "sessions")}`} />
              <Info label={t(locale, "المتبقي", "Remaining")} value={`${report.sessionsUntilNext} ${t(locale, "حصص", "sessions")}`} />
              <div className="rounded-xl bg-muted/40 p-3">
                <p className="text-xs text-muted-foreground">{t(locale, "التقدم داخل الدورة الحالية", "Progress inside current cycle")}</p>
                <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-muted">
                  <div className="h-full rounded-full bg-brand-600 transition-all" style={{ width: `${report.progressPercent}%` }} />
                </div>
                <p className="mt-2 text-xs font-medium text-foreground">{report.progressPercent}%</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <div className="rounded-2xl border border-border bg-card p-5">
          <h3 className="mb-4 flex items-center gap-2 font-bold text-foreground"><CalendarDays size={18} className="text-brand-600" />{t(locale, "الجلسات المرتبطة", "Linked sessions")}</h3>
          {student.relatedSessions.length === 0 ? (
            <EmptyCopy locale={locale} ar="لا توجد جلسات مرتبطة بهذا الطالب حتى الآن" en="No sessions are linked to this student yet" />
          ) : (
            <div className="space-y-3">
              {student.relatedSessions.map((session) => (
                <Link key={session.id} href={`/schedule/${session.id}`} className="block rounded-2xl border border-border bg-background p-4 transition-colors hover:bg-muted/40">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="font-semibold text-foreground">{session.className}</p>
                      <p className="mt-1 text-xs text-muted-foreground">{session.teacher} • {session.startTime} → {session.endTime}</p>
                    </div>
                    <span className="rounded-full bg-muted px-2.5 py-1 text-[11px] text-muted-foreground">{getCourseFormLabel(session.course, locale)}</span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-border bg-card p-5">
          <h3 className="mb-4 font-bold text-foreground">{t(locale, "الإخوة / الملفات المرتبطة", "Siblings / related profiles")}</h3>
          {student.siblings.length === 0 ? (
            <EmptyCopy locale={locale} ar="لا توجد ملفات أخرى مرتبطة بنفس ولي الأمر" en="No additional student profiles are linked to this parent" />
          ) : (
            <div className="space-y-3">
              {student.siblings.map((item) => (
                <Link key={item.id} href={`/students/${item.id}`} className="flex items-center justify-between gap-3 rounded-2xl border border-border bg-background p-4 transition-colors hover:bg-muted/40">
                  <div>
                    <p className="font-semibold text-foreground">{item.fullName}</p>
                    <p className="mt-1 text-xs text-muted-foreground">{item.className ?? t(locale, "غير مسجل", "Not assigned")}</p>
                  </div>
                  <span className="rounded-full px-2.5 py-1 text-[11px] font-semibold" style={{ backgroundColor: STUDENT_STATUS_META[item.status].bg, color: STUDENT_STATUS_META[item.status].color }}>
                    {getMetaLabel(STUDENT_STATUS_META[item.status], locale)}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return <div className="rounded-xl bg-muted/40 p-3"><p className="text-xs text-muted-foreground">{label}</p><p className="mt-1 font-semibold text-foreground">{value}</p></div>;
}

function EmptyCopy({ locale, ar, en }: { locale: "ar" | "en"; ar: string; en: string }) {
  return <div className="rounded-2xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">{t(locale, ar, en)}</div>;
}
