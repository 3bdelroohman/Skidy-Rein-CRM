"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, ArrowRight, CalendarDays, CalendarPlus, Clock, Search, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import { listScheduleSessions, getScheduleOverview } from "@/services/schedule.service";
import { useUIStore } from "@/stores/ui-store";
import { getCourseLabel, getDayLabel, t } from "@/lib/locale";
import type { CourseType } from "@/types/common.types";
import type { ScheduleSessionItem } from "@/types/crm";

const COURSE_COLORS = {
  scratch: { bg: "bg-brand-50", border: "border-brand-200", text: "text-brand-700" },
  python: { bg: "bg-emerald-50", border: "border-emerald-200", text: "text-emerald-700" },
  web: { bg: "bg-amber-50", border: "border-amber-200", text: "text-amber-700" },
  ai: { bg: "bg-purple-50", border: "border-purple-200", text: "text-purple-700" },
} as const;

export default function SchedulePage() {
  const locale = useUIStore((state) => state.locale);
  const isAr = locale === "ar";
  const [search, setSearch] = useState("");
  const [courseFilter, setCourseFilter] = useState<CourseType | "all">("all");
  const [sessions, setSessions] = useState<ScheduleSessionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [overview, setOverview] = useState({
    sessionsCount: 0,
    totalStudents: 0,
    uniqueTeachers: 0,
    busiestDay: 0,
    busiestDayCount: 0,
  });

  useEffect(() => {
    let isMounted = true;
    async function load() {
      setLoading(true);
      const [data, nextOverview] = await Promise.all([listScheduleSessions(), getScheduleOverview()]);
      if (isMounted) {
        setSessions(data);
        setOverview(nextOverview);
        setLoading(false);
      }
    }
    load();
    return () => {
      isMounted = false;
    };
  }, []);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return sessions.filter((session) => {
      const matchCourse = courseFilter === "all" || session.course === courseFilter;
      const matchSearch =
        !query ||
        session.className.toLowerCase().includes(query) ||
        session.teacher.toLowerCase().includes(query);
      return matchCourse && matchSearch;
    });
  }, [courseFilter, search, sessions]);

  const grouped = useMemo(() => {
    return Array.from({ length: 7 }, (_, dayIndex) => ({
      dayIndex,
      day: getDayLabel(dayIndex, locale),
      items: filtered
        .filter((session) => session.day === dayIndex)
        .sort((a, b) => a.startTime.localeCompare(b.startTime)),
    }));
  }, [filtered, locale]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 rounded-3xl border border-border bg-card p-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold text-foreground">
            <CalendarDays size={28} className="text-brand-600" />
            {t(locale, "الجدول", "Schedule")}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {t(locale, "عرض أسبوعي للكلاسات، الأحمال، وأهم الجلسات الجارية", "Weekly view of classes, load, and ongoing sessions")}
          </p>
        </div>

        <Link href="/schedule/new" className="inline-flex items-center gap-2 rounded-xl bg-brand-700 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-600">
          <CalendarPlus size={18} />
          {t(locale, "إضافة حصة / حدث", "Add session / event")}
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        <MiniMetric label={t(locale, "عدد الجلسات", "Sessions")} value={overview.sessionsCount} />
        <MiniMetric label={t(locale, "إجمالي المقاعد", "Total seats")} value={overview.totalStudents} />
        <MiniMetric label={t(locale, "عدد المدرسين", "Teachers")} value={overview.uniqueTeachers} />
        <MiniMetric label={t(locale, "أكثر يوم ازدحامًا", "Busiest day")} value={`${getDayLabel(overview.busiestDay, locale)} • ${overview.busiestDayCount}`} />
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search size={18} className={cn("absolute top-1/2 -translate-y-1/2 text-muted-foreground", isAr ? "right-3" : "left-3")} />
          <input
            type="text"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder={t(locale, "بحث باسم الكلاس أو المدرس...", "Search by class or teacher...")}
            className={cn(
              "w-full rounded-xl border border-border bg-card py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-ring",
              isAr ? "pr-10 pl-4" : "pl-10 pr-4",
            )}
          />
        </div>
        <select
          value={courseFilter}
          onChange={(event) => setCourseFilter(event.target.value as CourseType | "all")}
          className="rounded-xl border border-border bg-card px-4 py-2.5 text-sm text-foreground"
        >
          <option value="all">{t(locale, "كل المسارات", "All tracks")}</option>
          <option value="scratch">{getCourseLabel("scratch", locale)}</option>
          <option value="python">{getCourseLabel("python", locale)}</option>
          <option value="web">{getCourseLabel("web", locale)}</option>
          <option value="ai">{getCourseLabel("ai", locale)}</option>
        </select>
      </div>

      {loading ? (
        <div className="rounded-2xl border border-border bg-card p-12 text-center text-muted-foreground">
          {t(locale, "جارِ تحميل الجدول...", "Loading schedule...")}
        </div>
      ) : (
        <>
          <div className="hidden gap-3 xl:grid xl:grid-cols-7">
            {grouped.map(({ day, items }) => (
              <div key={day} className="rounded-2xl border border-border bg-card p-2.5">
                <div className="mb-2 border-b border-border pb-2 text-center text-sm font-bold text-foreground">{day}</div>
                <div className="space-y-2">
                  {items.length === 0 ? (
                    <EmptyDay label={t(locale, "لا توجد جلسات", "No sessions")} />
                  ) : (
                    items.map((session) => {
                      const colors = COURSE_COLORS[session.course];
                      return (
                        <Link key={session.id} href={`/schedule/${session.id}`} className={cn("block rounded-xl border p-2.5 transition-all hover:-translate-y-0.5 hover:shadow-sm", colors.bg, colors.border)}>
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <p className={cn("text-[13px] font-bold leading-5", colors.text)}>{session.className}</p>
                              <p className="mt-1 text-[10px] text-muted-foreground">{getCourseLabel(session.course, locale)}</p>
                            </div>
                            <span className="rounded-lg bg-white/70 px-1.5 py-1 text-[10px] text-muted-foreground dark:bg-black/20">{session.startTime}</span>
                          </div>
                          <div className="mt-2 space-y-1 text-[10px] text-muted-foreground">
                            <div className="flex items-center gap-1.5"><Clock size={12} />{session.startTime} — {session.endTime}</div>
                            <div className="flex items-center gap-1.5"><Users size={12} />{session.teacher} • {session.students} {t(locale, "طلاب", "students")}</div>
                          </div>
                        </Link>
                      );
                    })
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="space-y-5 xl:hidden">
            {grouped.map(({ day, items }) => (
              <div key={day} className="space-y-2">
                <p className="text-sm font-bold text-foreground">{day}</p>
                {items.length === 0 ? (
                  <EmptyDay label={t(locale, "لا توجد جلسات", "No sessions")} />
                ) : (
                  items.map((session) => {
                    const colors = COURSE_COLORS[session.course];
                    return (
                      <Link key={session.id} href={`/schedule/${session.id}`} className={cn("block rounded-xl border p-3 transition-colors hover:bg-muted/20", colors.bg, colors.border)}>
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <p className={cn("text-sm font-bold", colors.text)}>{session.className}</p>
                            <p className="text-xs text-muted-foreground">{session.teacher} — {session.students} {t(locale, "طلاب", "students")}</p>
                          </div>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <span>{session.startTime}</span>
                            {isAr ? <ArrowLeft size={12} /> : <ArrowRight size={12} />}
                          </div>
                        </div>
                      </Link>
                    );
                  })
                )}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function MiniMetric({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-2 text-2xl font-bold text-foreground">{value}</p>
    </div>
  );
}

function EmptyDay({ label }: { label: string }) {
  return <div className="rounded-xl border border-dashed border-border p-4 text-center text-xs text-muted-foreground">{label}</div>;
}
