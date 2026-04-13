import { createBrowserClient } from "@supabase/ssr";
import { getCourseFormLabel } from "@/config/course-roadmap";
import { listScheduleSessions } from "@/services/schedule.service";
import { getStudentById } from "@/services/students.service";
import { listTeachers } from "@/services/teachers.service";
import type { Database } from "@/types/database.types";
import type { CourseType, StudentListItem } from "@/types/crm";

export interface EnrollmentClassOption {
  key: string;
  className: string;
  course: CourseType;
  teacherId: string | null;
  teacherName: string;
  day: number;
  startTime: string;
  endTime: string;
}

function getSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key || typeof window === "undefined") return null;
  return createBrowserClient<Database>(url, key);
}

function uniqueKey(className: string, course: CourseType, teacherId: string | null) {
  return `${className}__${course}__${teacherId ?? ""}`;
}

function mapOptionLabel(option: EnrollmentClassOption, locale: "ar" | "en"): string {
  const dayLabelsAr = ["الأحد", "الاثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"];
  const dayLabelsEn = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const day = locale === "ar" ? dayLabelsAr[option.day] ?? option.day : dayLabelsEn[option.day] ?? option.day;
  return locale === "ar"
    ? `${option.className} — ${getCourseFormLabel(option.course, locale)} — ${option.teacherName} — ${day} ${option.startTime}`
    : `${option.className} — ${getCourseFormLabel(option.course, locale)} — ${option.teacherName} — ${day} ${option.startTime}`;
}

export function getEnrollmentOptionLabel(option: EnrollmentClassOption, locale: "ar" | "en"): string {
  return mapOptionLabel(option, locale);
}

export async function listEnrollmentClassOptions(preferredCourse?: CourseType | null): Promise<EnrollmentClassOption[]> {
  const [sessions, teachers] = await Promise.all([listScheduleSessions(), listTeachers()]);
  const teacherMap = new Map(teachers.map((teacher) => [teacher.id, teacher.fullName]));
  const map = new Map<string, EnrollmentClassOption>();

  for (const session of sessions) {
    const key = uniqueKey(session.className, session.course, session.teacherId ?? null);
    if (!map.has(key)) {
      map.set(key, {
        key,
        className: session.className,
        course: session.course,
        teacherId: session.teacherId ?? null,
        teacherName: session.teacherId ? (teacherMap.get(session.teacherId) ?? session.teacher) : session.teacher,
        day: session.day,
        startTime: session.startTime,
        endTime: session.endTime,
      });
    }
  }

  return Array.from(map.values()).sort((a, b) => {
    const prefA = preferredCourse && a.course === preferredCourse ? 1 : 0;
    const prefB = preferredCourse && b.course === preferredCourse ? 1 : 0;
    if (prefA !== prefB) return prefB - prefA;
    return a.day - b.day || a.startTime.localeCompare(b.startTime) || a.className.localeCompare(b.className, "ar");
  });
}

export async function updateStudentEnrollment(studentId: string, input: { className: string | null; currentCourse: CourseType | null; }): Promise<StudentListItem | null> {
  const supabase = getSupabaseClient();
  if (!supabase) {
    throw new Error("تعذر الاتصال بقاعدة البيانات. تأكد من إعدادات Supabase ثم أعد المحاولة.");
  }

  const payload: Database["public"]["Tables"]["students"]["Update"] = {
    class_name: input.className,
    current_course: input.currentCourse,
  };

  const { error } = await supabase.from("students").update(payload).eq("id", studentId);
  if (error) {
    throw new Error(error.message || "تعذر تحديث ربط الطالب بالكلاس.");
  }

  return getStudentById(studentId);
}
