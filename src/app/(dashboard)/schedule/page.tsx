"use client";

import { useState } from "react";
import { CalendarDays, ChevronRight, ChevronLeft, Clock, Users } from "lucide-react";
import { cn } from "@/lib/utils";

const DAYS = ["الأحد", "الإثنين", "الثلاثاء", "الأربعاء", "الخميس"];

const MOCK_SCHEDULE = [
  { id: "1", day: 0, startTime: "16:00", endTime: "17:00", className: "Scratch A", teacher: "أ. محمود", students: 5, course: "scratch" },
  { id: "2", day: 0, startTime: "17:30", endTime: "18:30", className: "Python A", teacher: "أ. دينا", students: 4, course: "python" },
  { id: "3", day: 1, startTime: "16:00", endTime: "17:00", className: "Scratch B", teacher: "أ. كريم", students: 3, course: "scratch" },
  { id: "4", day: 2, startTime: "16:00", endTime: "17:00", className: "Scratch A", teacher: "أ. محمود", students: 5, course: "scratch" },
  { id: "5", day: 2, startTime: "17:30", endTime: "18:30", className: "Python B", teacher: "أ. دينا", students: 6, course: "python" },
  { id: "6", day: 3, startTime: "16:00", endTime: "17:00", className: "Scratch B", teacher: "أ. كريم", students: 3, course: "scratch" },
  { id: "7", day: 3, startTime: "18:00", endTime: "19:00", className: "Web Dev", teacher: "أ. كريم", students: 4, course: "web" },
  { id: "8", day: 4, startTime: "16:00", endTime: "17:00", className: "Python A", teacher: "أ. دينا", students: 4, course: "python" },
];

const COURSE_COLORS: Record<string, { bg: string; border: string; text: string }> = {
  scratch: { bg: "bg-amber-50 dark:bg-amber-950/30", border: "border-amber-300 dark:border-amber-700", text: "text-amber-700 dark:text-amber-300" },
  python: { bg: "bg-blue-50 dark:bg-blue-950/30", border: "border-blue-300 dark:border-blue-700", text: "text-blue-700 dark:text-blue-300" },
  web: { bg: "bg-emerald-50 dark:bg-emerald-950/30", border: "border-emerald-300 dark:border-emerald-700", text: "text-emerald-700 dark:text-emerald-300" },
  ai: { bg: "bg-purple-50 dark:bg-purple-950/30", border: "border-purple-300 dark:border-purple-700", text: "text-purple-700 dark:text-purple-300" },
};

export default function SchedulePage() {
  const [currentWeek, setCurrentWeek] = useState("6 - 10 أبريل 2026");

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <CalendarDays size={28} className="text-brand-600" />
            الجدول الأسبوعي
          </h1>
          <p className="text-muted-foreground text-sm mt-1">جدول الحصص والكلاسات</p>
        </div>
        <div className="flex items-center gap-2">
          <button className="p-2 rounded-xl hover:bg-muted transition-colors text-muted-foreground"><ChevronRight size={20} /></button>
          <span className="text-sm font-semibold text-foreground px-3">{currentWeek}</span>
          <button className="p-2 rounded-xl hover:bg-muted transition-colors text-muted-foreground"><ChevronLeft size={20} /></button>
        </div>
      </div>

      {/* Desktop Grid */}
      <div className="hidden md:grid grid-cols-5 gap-3">
        {DAYS.map((day, dayIndex) => (
          <div key={day} className="space-y-2">
            <div className="bg-muted/50 rounded-xl px-3 py-2 text-center">
              <p className="font-bold text-foreground text-sm">{day}</p>
            </div>
            {MOCK_SCHEDULE.filter((s) => s.day === dayIndex).map((session) => {
              const colors = COURSE_COLORS[session.course] || COURSE_COLORS.scratch;
              return (
                <div key={session.id} className={cn("rounded-xl border p-3 transition-all hover:shadow-brand-sm cursor-pointer", colors.bg, colors.border)}>
                  <p className={cn("font-bold text-sm", colors.text)}>{session.className}</p>
                  <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                    <Clock size={12} />
                    <span className="direction-ltr">{session.startTime} - {session.endTime}</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">{session.teacher}</p>
                  <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                    <Users size={12} />
                    <span>{session.students} طلاب</span>
                  </div>
                </div>
              );
            })}
            {MOCK_SCHEDULE.filter((s) => s.day === dayIndex).length === 0 && (
              <div className="border-2 border-dashed border-border rounded-xl p-4 text-center text-xs text-muted-foreground">لا يوجد حصص</div>
            )}
          </div>
        ))}
      </div>

      {/* Mobile List */}
      <div className="md:hidden space-y-4">
        {DAYS.map((day, dayIndex) => {
          const daySessions = MOCK_SCHEDULE.filter((s) => s.day === dayIndex);
          if (daySessions.length === 0) return null;
          return (
            <div key={day}>
              <p className="font-bold text-foreground text-sm mb-2">{day}</p>
              <div className="space-y-2">
                {daySessions.map((session) => {
                  const colors = COURSE_COLORS[session.course] || COURSE_COLORS.scratch;
                  return (
                    <div key={session.id} className={cn("rounded-xl border p-3 flex items-center justify-between", colors.bg, colors.border)}>
                      <div>
                        <p className={cn("font-bold text-sm", colors.text)}>{session.className}</p>
                        <p className="text-xs text-muted-foreground">{session.teacher} — {session.students} طلاب</p>
                      </div>
                      <span className="text-xs text-muted-foreground direction-ltr">{session.startTime}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}