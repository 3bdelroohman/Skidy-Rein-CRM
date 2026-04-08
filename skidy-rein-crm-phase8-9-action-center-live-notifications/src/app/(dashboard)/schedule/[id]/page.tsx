"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, CalendarDays, Clock, GraduationCap, UserCircle, Users } from "lucide-react";
import { formatCourseLabel } from "@/lib/formatters";
import { getDayLabel, t } from "@/lib/locale";
import { cn } from "@/lib/utils";
import { getScheduleSessionDetails } from "@/services/schedule.service";
import { useUIStore } from "@/stores/ui-store";
import type { ScheduleSessionDetails } from "@/types/crm";
import { LoadingState, PageStateCard } from "@/components/shared/page-state";

export default function ScheduleSessionDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const locale = useUIStore((state) => state.locale);
  const isAr = locale === "ar";
  const [session, setSession] = useState<ScheduleSessionDetails | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    async function load() {
      setLoading(true);
      const sessionData = await getScheduleSessionDetails(id);
      if (isMounted) {
        setSession(sessionData);
        setLoading(false);
      }
    }
    load();
    return () => {
      isMounted = false;
    };
  }, [id]);

  if (loading) {
    return (
      <LoadingState
        titleAr="جارِ تحميل الجلسة"
        titleEn="Loading session"
        descriptionAr="يتم الآن تجهيز بيانات الكلاس والطلاب المرتبطين بهذه الجلسة."
        descriptionEn="The class session and linked students are being prepared."
      />
    );
  }

  if (!session) {
    return (
      <PageStateCard
        variant="warning"
        titleAr="الجلسة غير موجودة"
        titleEn="Session not found"
        descriptionAr="قد يكون رابط الجلسة غير صحيح أو أن هذه الحصة لم تعد موجودة في الجدول."
        descriptionEn="The session link may be incorrect or this class no longer exists in the schedule."
        actionHref="/schedule"
        actionLabelAr="العودة إلى الجدول"
        actionLabelEn="Back to schedule"
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => router.push("/schedule")} className="rounded-xl p-2 text-muted-foreground transition-colors hover:bg-muted">
            {isAr ? <ArrowRight size={20} /> : <ArrowLeft size={20} />}
          </button>
          <div>
            <h1 className="text-2xl font-bold text-foreground">{session.className}</h1>
            <p className="text-sm text-muted-foreground">{getDayLabel(session.day, locale)} — {session.startTime} / {session.endTime}</p>
          </div>
        </div>
        <span className="rounded-full bg-brand-50 px-3 py-1 text-sm font-semibold text-brand-700 dark:bg-brand-950 dark:text-brand-300">
          {formatCourseLabel(session.course, locale)}
        </span>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[0.95fr_1.05fr]">
        <div className="space-y-6">
          <div className="rounded-2xl border border-border bg-card p-5">
            <h3 className="mb-4 flex items-center gap-2 font-bold text-foreground"><CalendarDays size={18} className="text-brand-600" />{t(locale, "تفاصيل الجلسة", "Session details")}</h3>
            <div className="space-y-3">
              <InfoRow label={t(locale, "اليوم", "Day")} value={getDayLabel(session.day, locale)} align={isAr ? "left" : "right"} />
              <InfoRow label={t(locale, "الوقت", "Time")} value={`${session.startTime} — ${session.endTime}`} align={isAr ? "left" : "right"} />
              <InfoRow label={t(locale, "المدرس", "Teacher")} value={session.teacher} align={isAr ? "left" : "right"} />
              <InfoRow label={t(locale, "عدد الطلاب", "Students count")} value={`${session.students}`} align={isAr ? "left" : "right"} />
              <InfoRow label={t(locale, "المسار", "Track")} value={formatCourseLabel(session.course, locale)} align={isAr ? "left" : "right"} />
              {session.sessionDate ? <InfoRow label={t(locale, "تاريخ الجلسة", "Session date")} value={session.sessionDate} align={isAr ? "left" : "right"} /> : null}
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-card p-5">
            <h3 className="mb-4 flex items-center gap-2 font-bold text-foreground"><Clock size={18} className="text-brand-600" />{t(locale, "ملخص تشغيلي", "Operational snapshot")}</h3>
            <div className="grid grid-cols-2 gap-3">
              <MetricTile label={t(locale, "الجلسات الشقيقة", "Sibling sessions")} value={session.siblingSessions.length.toString()} />
              <MetricTile label={t(locale, "أولياء الأمور المرتبطون", "Linked parents")} value={session.linkedParents.length.toString()} />
            </div>
          </div>

          {session.teacherRecord ? (
            <Link href={`/teachers/${session.teacherRecord.id}`} className="block rounded-2xl border border-border bg-card p-5 transition-colors hover:bg-muted/30">
              <p className="text-sm font-semibold text-foreground">{t(locale, "فتح ملف المدرس", "Open teacher profile")}</p>
              <p className="mt-1 text-xs text-muted-foreground">{session.teacherRecord.fullName}</p>
            </Link>
          ) : null}
        </div>

        <div className="space-y-6">
          <div className="rounded-2xl border border-border bg-card p-5">
            <h3 className="mb-4 flex items-center gap-2 font-bold text-foreground"><GraduationCap size={18} className="text-brand-600" />{t(locale, "الطلاب المرتبطون بالكلاس", "Students linked to this class")}</h3>
            {session.linkedStudents.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
                {t(locale, "لا يوجد طلاب مرتبطون بهذا الكلاس حالياً", "No students are linked to this class yet")}
              </div>
            ) : (
              <div className="space-y-3">
                {session.linkedStudents.map((student) => (
                  <Link key={student.id} href={`/students/${student.id}`} className="flex items-center justify-between gap-3 rounded-2xl border border-border p-3 transition-colors hover:bg-muted/30">
                    <div>
                      <p className="font-semibold text-foreground">{student.fullName}</p>
                      <p className="text-xs text-muted-foreground">{student.parentName}</p>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <UserCircle size={14} />
                      <span>{student.sessionsAttended} {t(locale, "حصة", "sessions")}</span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>

          <div className="rounded-2xl border border-border bg-card p-5">
            <h3 className="mb-4 flex items-center gap-2 font-bold text-foreground"><Users size={18} className="text-brand-600" />{t(locale, "أولياء الأمور المرتبطون", "Linked parents")}</h3>
            {session.linkedParents.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
                {t(locale, "لا يوجد أولياء أمور مرتبطون بشكل مباشر بهذه الجلسة", "No parents are directly linked to this session")}
              </div>
            ) : (
              <div className="space-y-3">
                {session.linkedParents.map((parent) => (
                  <Link key={parent.id} href={`/parents/${parent.id}`} className="block rounded-2xl border border-border p-3 transition-colors hover:bg-muted/30">
                    <p className="font-semibold text-foreground">{parent.fullName}</p>
                    <p className="text-xs text-muted-foreground">{parent.phone}</p>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function InfoRow({ label, value, align = "left" }: { label: string; value: string; align?: "left" | "right" }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-border/70 py-2 last:border-0">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className={cn("text-sm font-medium text-foreground", align === "left" ? "text-left" : "text-right")}>{value}</span>
    </div>
  );
}

function MetricTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-border bg-background p-4">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-2 text-2xl font-bold text-foreground">{value}</p>
    </div>
  );
}
