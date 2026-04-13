import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@/types/database.types";
import type { ScheduleSessionItem } from "@/types/crm";
import { getTeacherById } from "@/services/teachers.service";
import { isBrowser, readStorage, writeStorage } from "@/services/storage";

const SCHEDULE_KEY = "skidy.crm.schedule";

function getSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key || !isBrowser()) return null;
  return createBrowserClient<Database>(url, key);
}

function normalizeName(value: string | null | undefined): string {
  return (value ?? "")
    .toLowerCase()
    .replace(/أ\.?\s*/g, "")
    .replace(/[\u064B-\u065F]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function sortSessions(items: ScheduleSessionItem[]): ScheduleSessionItem[] {
  return [...items].sort((a, b) => {
    if (a.day !== b.day) return a.day - b.day;
    return a.startTime.localeCompare(b.startTime);
  });
}

export interface TeacherReassignmentResult {
  classesUpdated: number;
  sessionsUpdated: number;
}

export async function reassignTeacherRelations(
  fromTeacherId: string,
  toTeacherId: string,
): Promise<TeacherReassignmentResult> {
  if (!fromTeacherId || !toTeacherId || fromTeacherId === toTeacherId) {
    return { classesUpdated: 0, sessionsUpdated: 0 };
  }

  const [fromTeacher, toTeacher] = await Promise.all([
    getTeacherById(fromTeacherId),
    getTeacherById(toTeacherId),
  ]);

  if (!fromTeacher || !toTeacher) {
    return { classesUpdated: 0, sessionsUpdated: 0 };
  }

  let classesUpdated = 0;
  let sessionsUpdated = 0;

  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      const { data: classRows } = await supabase.from("classes").select("id").eq("teacher_id", fromTeacherId);
      classesUpdated = classRows?.length ?? 0;
      if (classesUpdated > 0) {
        await supabase.from("classes").update({ teacher_id: toTeacherId }).eq("teacher_id", fromTeacherId);
      }

      const { data: sessionRows } = await supabase.from("sessions").select("id").eq("teacher_id", fromTeacherId);
      sessionsUpdated = sessionRows?.length ?? 0;
      if (sessionsUpdated > 0) {
        await supabase.from("sessions").update({ teacher_id: toTeacherId }).eq("teacher_id", fromTeacherId);
      }
    } catch {
      // noop; local cache update below still helps the current UI reflect the new assignment
    }
  }

  if (isBrowser()) {
    const current = readStorage(SCHEDULE_KEY, [] as ScheduleSessionItem[]);
    if (Array.isArray(current) && current.length > 0) {
      const fromName = normalizeName(fromTeacher.fullName);
      const next = current.map((session) => {
        const sessionTeacher = normalizeName(session.teacher);
        const matchesId = session.teacherId === fromTeacherId;
        const matchesName = sessionTeacher.length > 0 && (sessionTeacher === fromName || sessionTeacher.includes(fromName) || fromName.includes(sessionTeacher));
        if (!matchesId && !matchesName) return session;
        return {
          ...session,
          teacherId: toTeacherId,
          teacher: toTeacher.fullName,
        } satisfies ScheduleSessionItem;
      });

      writeStorage(SCHEDULE_KEY, sortSessions(next));
    }
  }

  return { classesUpdated, sessionsUpdated };
}
