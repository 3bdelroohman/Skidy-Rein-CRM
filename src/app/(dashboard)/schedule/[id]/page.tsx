"use client";

import { use, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, CalendarDays, Clock, GraduationCap, UserCircle } from "lucide-react";
import { formatCourseLabel } from "@/lib/formatters";
import { getDayLabel, t } from "@/lib/locale";
import { cn } from "@/lib/utils";
import { getScheduleSessionById } from "@/services/schedule.service";
import { listStudents } from "@/services/students.service";
import { useUIStore } from "@/stores/ui-store";
import type { ScheduleSessionItem, StudentListItem } from "@/types/crm";

export default function ScheduleSessionDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const locale = useUIStore((state) => state.locale);
  const isAr = locale === "ar";
  const [session, setSession] = useState<ScheduleSessionItem | null>(null);
  const [students, setStudents] = useState<StudentListItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    async function load() {
      setLoading(true);
      const [sessionData, allStudents] = await Promise.all([getScheduleSessionById(id), listStudents()]);
      if (isMounted) {
        setSession(sessionData);
        setStudents(allStudents);
        setLoading(false);
      }
    }
    load();
    return () => {
      isMounted = false;
    };
  }, [id]);

  const relatedStudents = useMemo(() => {
    if (!session) return [];
    return students.filter((student) => student.className === session.className);
  }, [session, students]);

  if (loading) {
    return <div className="rounded-2xl border border-border bg-card p-12 text-center text-muted-foreground">{t(locale, "جارِ تحميل الجلسة...", "Loading session...")}</div>;
  }

  if (!session) {
    return (
      <div className="rounded-2xl border border-border bg-card p-12 text-center text-muted-foreground">
        <p>{t(locale, "الجلسة غير موجودة", "Session not found")}</p>
        <button onClick={() => router.push("/schedule")} className="mt-4 text-sm font-semibold text-brand-600 hover:underline">
          {t(locale, "العودة للجدول", "Back to schedule")}
        </button>
      </div>
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
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-card p-5">
            <h3 className="mb-4 flex items-center gap-2 font-bold text-foreground"><Clock size={18} className="text-brand-600" />{t(locale, "ملخص تشغيلي", "Operational snapshot")}</h3>
            <div className="grid grid-cols-2 gap-3">
              <MetricTile label={t(locale, "الجلسات المماثلة", "Similar sessions")} value={students.filter((student) => student.currentCourse === session.course).length.toString()} />
              <MetricTile label={t(locale, "طلاب داخل الكلاس", "Students in class")} value={relatedStudents.length.toString()} />
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-card p-5">
          <h3 className="mb-4 flex items-center gap-2 font-bold text-foreground"><GraduationCap size={18} className="text-brand-600" />{t(locale, "الطلاب المرتبطون بالكلاس", "Students linked to this class")}</h3>
          {relatedStudents.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
              {t(locale, "لا يوجد طلاب مرتبطون بهذا الكلاس حالياً", "No students are linked to this class yet")}
            </div>
          ) : (
            <div className="space-y-3">
              {relatedStudents.map((student) => (
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
