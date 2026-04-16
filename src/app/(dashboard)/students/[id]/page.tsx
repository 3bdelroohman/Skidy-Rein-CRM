"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, CalendarDays, CalendarPlus, FileText, GraduationCap, MessageCircle, Phone, ReceiptText, UserCircle, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useUIStore } from "@/stores/ui-store";
import { STUDENT_STATUS_META, getMetaLabel } from "@/config/status-meta";
import { getCourseLabel, t } from "@/lib/locale";
import { formatCurrencyEgp, formatDate } from "@/lib/formatters";
import { extractLeadIdFromProjectionId, getStudentDetails } from "@/services/relations.service";
import { deleteStudent } from "@/services/students.service";
import { LoadingState, PageStateCard } from "@/components/shared/page-state";
import type { StudentDetails } from "@/types/crm";

export default function StudentDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const locale = useUIStore((state) => state.locale);
  const isAr = locale === "ar";
  const [student, setStudent] = useState<StudentDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const router = useRouter();

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

  const handleDeleteStudent = async () => {
    if (!student) return;
    const confirmed = window.confirm(locale === "ar" ? "هل تريد حذف هذا الطالب نهائيًا؟" : "Delete this student permanently?");
    if (!confirmed) return;
    setDeleting(true);
    try {
      await deleteStudent(student.id);
      toast.success(locale === "ar" ? "تم حذف الطالب" : "Student deleted");
      router.push("/students");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : (locale === "ar" ? "تعذر حذف الطالب" : "Could not delete student"));
    } finally {
      setDeleting(false);
    }
  };



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
  const sourceLeadId = extractLeadIdFromProjectionId(student.id);
  const primaryTeacher = student.teachers[0] ?? null;
  const linkedClassName = student.className ?? "";
  const scheduleHref = `/schedule/new?className=${encodeURIComponent(linkedClassName)}${student.currentCourse ? `&course=${student.currentCourse}` : ""}${primaryTeacher ? `&teacherId=${primaryTeacher.id}` : ""}`;
  const createActualHref = `/students/new?parentName=${encodeURIComponent(student.parentName)}&parentPhone=${encodeURIComponent(student.parentPhone)}&childName=${encodeURIComponent(student.fullName)}${student.age > 0 ? `&childAge=${student.age}` : ""}${student.currentCourse ? `&currentCourse=${student.currentCourse}` : ""}${student.className ? `&className=${encodeURIComponent(student.className)}` : ""}`;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Link href="/students" className="rounded-xl p-2 text-muted-foreground transition-colors hover:bg-muted">
            {isAr ? <ArrowRight size={18} /> : <ArrowLeft size={18} />}
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-foreground">{student.fullName}</h1>
            <p className="text-sm text-muted-foreground">{student.parentName} — {student.parentPhone}</p>
          </div>
        <button onClick={handleDeleteStudent} disabled={deleting} className="inline-flex items-center gap-2 rounded-2xl bg-red-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-red-700 disabled:opacity-50">
          <Trash2 size={16} />
          {deleting ? (locale === "ar" ? "جارِ الحذف..." : "Deleting...") : (locale === "ar" ? "حذف" : "Delete")}
        </button>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {sourceLeadId ? (
            <>
              <Link href={`/leads/${sourceLeadId}`} className="inline-flex items-center gap-2 rounded-xl border border-border px-4 py-2 text-sm font-semibold text-foreground transition-colors hover:bg-muted">
                <FileText size={16} />
                {t(locale, "العميل الأصلي", "Source lead")}
              </Link>
              <Link href={createActualHref} className="inline-flex items-center gap-2 rounded-xl bg-brand-600 px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90">
                <UserCircle size={16} />
                {t(locale, "إنشاء ملف طالب فعلي", "Create real student profile")}
              </Link>
            </>
          ) : (
            <>
              <Link href={`/students/${student.id}/report`} className="inline-flex items-center gap-2 rounded-xl border border-border px-4 py-2 text-sm font-semibold text-foreground transition-colors hover:bg-muted">
                <FileText size={16} />
                {t(locale, "التقرير الشهري", "Monthly report")}
              </Link>
              <Link href={`/payments/new?studentId=${student.id}`} className="inline-flex items-center gap-2 rounded-xl border border-border px-4 py-2 text-sm font-semibold text-foreground transition-colors hover:bg-muted">
                <ReceiptText size={16} />
                {t(locale, "إضافة دفعة", "Add payment")}
              </Link>
              <Link href={scheduleHref} className="inline-flex items-center gap-2 rounded-xl border border-border px-4 py-2 text-sm font-semibold text-foreground transition-colors hover:bg-muted">
                <CalendarPlus size={16} />
                {t(locale, "إضافة حصة", "Add session")}
              </Link>
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-4">
        <QuickStat title={t(locale, "الحالة", "Status")} value={getMetaLabel(status, locale)} />
        <QuickStat title={t(locale, "المدرس الحالي", "Current teacher")} value={primaryTeacher?.fullName ?? t(locale, "غير مرتبط بعد", "Not linked yet")} />
        <QuickStat title={t(locale, "الكلاس الحالي", "Current class")} value={student.className ?? t(locale, "غير مسجل", "Not assigned")} />
        <QuickStat title={t(locale, "المسؤول", "Owner")} value={student.ownerName ?? t(locale, "غير مخصص", "Unassigned")} />
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
            <Info label={t(locale, "الكورس الحالي", "Current course")} value={student.currentCourse ? getCourseLabel(student.currentCourse, locale) : t(locale, "غير محدد", "Not set")} />
            <Info label={t(locale, "الكلاس", "Class")} value={student.className ?? t(locale, "غير مسجل", "Not assigned")} />
            <Info label={t(locale, "تاريخ الالتحاق", "Enrollment date")} value={formatDate(student.enrollmentDate, locale)} />
            <Info label={t(locale, "عدد الحصص", "Sessions attended")} value={student.sessionsAttended.toString()} />
            <Info label={t(locale, "إجمالي المدفوع", "Total paid")} value={formatCurrencyEgp(student.totalPaid, locale)} />
            <Info label={t(locale, "المسؤول", "Owner")} value={student.ownerName ?? t(locale, "غير مخصص", "Unassigned")} />
          </div>
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
              <a href={`tel:${student.parentPhone}`} className="rounded-xl border border-border px-3 py-2 text-xs font-semibold text-foreground transition-colors hover:bg-muted">
                {t(locale, "اتصال", "Call")}
              </a>
              <a href={`https://wa.me/2${student.parentPhone.replace(/\D/g, "")}`} target="_blank" rel="noreferrer" className="rounded-xl border border-border px-3 py-2 text-xs font-semibold text-foreground transition-colors hover:bg-muted">
                {t(locale, "واتساب", "WhatsApp")}
              </a>
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
                      <p className="mt-1 text-xs text-muted-foreground">{session.startTime} → {session.endTime}</p>
                    </div>
                    <span className="rounded-full bg-muted px-2.5 py-1 text-[11px] text-muted-foreground">{getCourseLabel(session.course, locale)}</span>
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

function QuickStat({ title, value }: { title: string; value: string }) {
  return <div className="rounded-2xl border border-border bg-card p-5"><p className="text-sm text-muted-foreground">{title}</p><p className="mt-2 font-semibold text-foreground">{value}</p></div>;
}

function Info({ label, value }: { label: string; value: string }) {
  return <div className="rounded-xl bg-muted/40 p-3"><p className="text-xs text-muted-foreground">{label}</p><p className="mt-1 font-semibold text-foreground">{value}</p></div>;
}

function EmptyCopy({ locale, ar, en }: { locale: "ar" | "en"; ar: string; en: string }) {
  return <div className="rounded-2xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">{t(locale, ar, en)}</div>;
}
