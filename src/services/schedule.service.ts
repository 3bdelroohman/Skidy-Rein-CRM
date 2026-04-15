import { createBrowserClient } from "@supabase/ssr";
import type { CourseType } from "@/types/common.types";
import type { Database } from "@/types/database.types";
import type { CreateScheduleEntryInput, ParentListItem, ScheduleSessionDetails, ScheduleSessionItem, StudentListItem, TeacherListItem } from "@/types/crm";
import { isBrowser, readStorage, writeStorage } from "@/services/storage";
import { listParents } from "@/services/parents.service";
import { listStudents } from "@/services/students.service";
import { listTeachers } from "@/services/teachers.service";

const SCHEDULE_KEY = "skidy.crm.schedule";
const ALLOW_DEMO = process.env.NEXT_PUBLIC_ALLOW_DEMO_FALLBACK === "true";
const VALID_COURSES: CourseType[] = ["scratch", "python", "web", "ai"];

const DEFAULT_SCHEDULE: ScheduleSessionItem[] = [
  { id: "1", classId: "class-1", teacherId: "1", day: 0, startTime: "16:00", endTime: "17:00", className: "Scratch A", teacher: "Ø£. Ù…Ø­Ù…ÙˆØ¯", students: 5, course: "scratch", sessionDate: null },
  { id: "2", classId: "class-2", teacherId: "2", day: 0, startTime: "17:30", endTime: "18:30", className: "Python A", teacher: "Ø£. Ø¯ÙŠÙ†Ø§", students: 4, course: "python", sessionDate: null },
  { id: "3", classId: "class-3", teacherId: "3", day: 1, startTime: "16:00", endTime: "17:00", className: "Scratch B", teacher: "Ø£. ÙƒØ±ÙŠÙ…", students: 6, course: "scratch", sessionDate: null },
  { id: "4", classId: "class-4", teacherId: "2", day: 2, startTime: "18:00", endTime: "19:00", className: "AI Intro", teacher: "Ø£. Ø¯ÙŠÙ†Ø§", students: 3, course: "ai", sessionDate: null },
  { id: "5", classId: "class-5", teacherId: "3", day: 3, startTime: "17:00", endTime: "18:00", className: "Web Starters", teacher: "Ø£. ÙƒØ±ÙŠÙ…", students: 4, course: "web", sessionDate: null },
  { id: "6", classId: "class-6", teacherId: "1", day: 4, startTime: "16:30", endTime: "17:30", className: "Scratch Trial", teacher: "Ø£. Ù…Ø­Ù…ÙˆØ¯", students: 5, course: "scratch", sessionDate: null },
];

type RawClassRow = {
  id?: string | null;
  teacher_id?: string | null;
  name?: string | null;
  course?: string | null;
  start_time?: string | null;
  end_time?: string | null;
  day_of_week?: number | string | null;
  weekday?: number | string | null;
  day?: number | string | null;
};

type RawSessionRow = {
  id?: string | null;
  class_id?: string | null;
  teacher_id?: string | null;
  title?: string | null;
  status?: string | null;
  start_time?: string | null;
  end_time?: string | null;
  session_date?: string | null;
  day_of_week?: number | string | null;
  weekday?: number | string | null;
  day?: number | string | null;
};

type RawEnrollmentRow = {
  class_id?: string | null;
  is_active?: boolean | null;
};

function getSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key || !isBrowser()) return null;
  return createBrowserClient<Database>(url, key);
}

function sortSessions(items: ScheduleSessionItem[]): ScheduleSessionItem[] {
  return [...items].sort((a, b) => {
    if (a.day !== b.day) return a.day - b.day;
    return a.startTime.localeCompare(b.startTime);
  });
}

function asString(value: unknown, fallback = ""): string {
  return typeof value === "string" && value.trim().length > 0 ? value : fallback;
}

function asNullableString(value: unknown): string | null {
  return typeof value === "string" && value.trim().length > 0 ? value : null;
}

function asNumber(value: unknown, fallback = 0): number {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
  }
  return fallback;
}

function asCourse(value: unknown, fallback: CourseType = "scratch"): CourseType {
  return VALID_COURSES.includes(value as CourseType) ? (value as CourseType) : fallback;
}

function normalizeName(value: string | null | undefined): string {
  return (value ?? "")
    .toLowerCase()
    .replace(/Ø£\.?\s*/g, "")
    .replace(/[\u064B-\u065F]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function getLocalSchedule(): ScheduleSessionItem[] {
  return sortSessions(readStorage(SCHEDULE_KEY, ALLOW_DEMO ? DEFAULT_SCHEDULE : []));
}

function saveLocalSchedule(items: ScheduleSessionItem[]): void {
  writeStorage(SCHEDULE_KEY, sortSessions(items));
}

function clearLocalSchedule(): void {
  writeStorage(SCHEDULE_KEY, []);
}

function inferTeacher(
  teacherId: string | null,
  rawTeacher: unknown,
  teachers: TeacherListItem[],
): TeacherListItem | null {
  if (teacherId) {
    const direct = teachers.find((teacher) => teacher.id === teacherId);
    if (direct) return direct;
  }

  const byName = asString(rawTeacher);
  if (!byName) return null;
  const target = normalizeName(byName);
  return teachers.find((teacher) => {
    const name = normalizeName(teacher.fullName);
    return name.includes(target) || target.includes(name);
  }) ?? null;
}

function extractDay(source: { day_of_week?: unknown; weekday?: unknown; day?: unknown }, fallback = 0): number {
  return asNumber(source.day_of_week ?? source.weekday ?? source.day, fallback);
}

function mapSessionFromClass(
  row: RawClassRow,
  teachers: TeacherListItem[],
  enrollmentCount: number,
): ScheduleSessionItem {
  const teacher = inferTeacher(asNullableString(row.teacher_id), null, teachers);
  const id = asString(row.id, `class-${Math.random().toString(36).slice(2, 8)}`);

  return {
    id,
    classId: asNullableString(row.id),
    teacherId: asNullableString(row.teacher_id),
    day: extractDay(row, 0),
    startTime: asString(row.start_time, "16:00"),
    endTime: asString(row.end_time, "17:00"),
    className: asString(row.name, "Class"),
    teacher: teacher?.fullName ?? "Ù…Ø¯Ø±Ø³ ØºÙŠØ± Ù…Ø­Ø¯Ø¯",
    students: enrollmentCount,
    course: asCourse(row.course),
    sessionDate: null,
  } satisfies ScheduleSessionItem;
}

function mapSessionFromSession(
  row: RawSessionRow,
  classMap: Map<string, RawClassRow>,
  teachers: TeacherListItem[],
  studentsCount: number,
): ScheduleSessionItem {
  const classRow = row.class_id ? classMap.get(row.class_id) ?? null : null;
  const teacher = inferTeacher(asNullableString(row.teacher_id ?? classRow?.teacher_id), null, teachers);
  const id = asString(row.id, `session-${Math.random().toString(36).slice(2, 8)}`);

  return {
    id,
    classId: asNullableString(row.class_id),
    teacherId: asNullableString(row.teacher_id ?? classRow?.teacher_id),
    day: extractDay(row, extractDay(classRow ?? {}, 0)),
    startTime: asString(row.start_time ?? classRow?.start_time, "16:00"),
    endTime: asString(row.end_time ?? classRow?.end_time, "17:00"),
    className: asString(row.title ?? classRow?.name, "Session"),
    teacher: teacher?.fullName ?? "Ù…Ø¯Ø±Ø³ ØºÙŠØ± Ù…Ø­Ø¯Ø¯",
    students: studentsCount,
    course: asCourse(classRow?.course, "scratch"),
    sessionDate: asNullableString(row.session_date),
  } satisfies ScheduleSessionItem;
}

async function buildStudentsTeachersParents(): Promise<{
  students: StudentListItem[];
  teachers: TeacherListItem[];
  parents: ParentListItem[];
}> {
  const [students, teachers, parents] = await Promise.all([listStudents(), listTeachers(), listParents()]);
  return { students, teachers, parents };
}

export async function listScheduleSessions(): Promise<ScheduleSessionItem[]> {
  const local = getLocalSchedule();
  const supabase = getSupabaseClient();
  if (!supabase) return local.length > 0 ? local : (ALLOW_DEMO ? DEFAULT_SCHEDULE : []);

  try {
    const [{ students, teachers }, classesResponse, sessionsResponse, enrollmentsResponse] = await Promise.all([
      buildStudentsTeachersParents(),
      supabase.from("classes").select("*"),
      supabase.from("sessions").select("*").order("session_date", { ascending: false }),
      supabase.from("class_enrollments").select("*"),
    ]);

    const classesRows = ((classesResponse.data ?? []) as RawClassRow[]);
    const sessionRows = ((sessionsResponse.data ?? []) as RawSessionRow[]);
    const enrollmentRows = ((enrollmentsResponse.data ?? []) as RawEnrollmentRow[]);

    if (classesResponse.error || sessionsResponse.error || enrollmentsResponse.error) {
      console.error("[schedule] failed to load from Supabase", classesResponse.error || sessionsResponse.error || enrollmentsResponse.error);
      clearLocalSchedule();
      return ALLOW_DEMO && local.length === 0 ? DEFAULT_SCHEDULE : [];
    }

    if (classesRows.length === 0 && sessionRows.length === 0) {
      clearLocalSchedule();
      return ALLOW_DEMO && local.length === 0 ? DEFAULT_SCHEDULE : [];
    }

    const enrollmentCountByClassId = new Map<string, number>();
    enrollmentRows.forEach((row) => {
      if (!row.class_id) return;
      const isActive = row.is_active ?? true;
      if (!isActive) return;
      enrollmentCountByClassId.set(row.class_id, (enrollmentCountByClassId.get(row.class_id) ?? 0) + 1);
    });

    const classMap = new Map(
      classesRows
        .map((row) => [asString(row.id), row] as const)
        .filter(([id]) => id.length > 0),
    );

    const classIdsWithSessions = new Set(
      sessionRows.map((row) => row.class_id).filter((id): id is string => typeof id === "string" && id.length > 0),
    );

    const mappedFromSessions = sessionRows.map((row) => {
      const studentsCount = row.class_id ? (enrollmentCountByClassId.get(row.class_id) ?? 0) : 0;
      return mapSessionFromSession(row, classMap, teachers, studentsCount);
    });

    const mappedStandaloneClasses = classesRows
      .filter((row) => {
        const id = asString(row.id);
        return !id || !classIdsWithSessions.has(id);
      })
      .map((row) => {
        const id = asString(row.id);
        const fallbackStudents = students.filter((student) => student.className === row.name).length;
        return mapSessionFromClass(row, teachers, enrollmentCountByClassId.get(id) ?? fallbackStudents);
      });

    const merged = sortSessions([...mappedFromSessions, ...mappedStandaloneClasses]);
    saveLocalSchedule(merged);
    return merged;
  } catch (error) {
    console.error("[schedule] unexpected failure", error);
    clearLocalSchedule();
    return ALLOW_DEMO && local.length === 0 ? DEFAULT_SCHEDULE : [];
  }
}

export async function getScheduleSessionById(id: string): Promise<ScheduleSessionItem | null> {
  const items = await listScheduleSessions();
  return items.find((session) => session.id === id) ?? null;
}

export async function getScheduleSessionDetails(id: string): Promise<ScheduleSessionDetails | null> {
  const [session, students, teachers, parents, allSessions] = await Promise.all([
    getScheduleSessionById(id),
    listStudents(),
    listTeachers(),
    listParents(),
    listScheduleSessions(),
  ]);

  if (!session) return null;

  const teacherRecord = session.teacherId
    ? teachers.find((teacher) => teacher.id === session.teacherId) ?? null
    : teachers.find((teacher) => normalizeName(teacher.fullName) === normalizeName(session.teacher)) ?? null;

  const linkedStudents = students.filter((student) => {
    const classMatch = student.className ? normalizeName(student.className) === normalizeName(session.className) : false;
    const courseMatch = student.currentCourse === session.course;
    return classMatch || courseMatch;
  });

  const linkedParentIds = Array.from(new Set(linkedStudents.map((student) => student.parentId).filter((value): value is string => Boolean(value))));
  const linkedParents = parents.filter((parent) => linkedParentIds.includes(parent.id));
  const siblingSessions = allSessions.filter(
    (item) => item.id !== session.id && ((session.classId && item.classId === session.classId) || normalizeName(item.className) === normalizeName(session.className)),
  );

  return {
    ...session,
    teacherRecord,
    linkedStudents,
    linkedParentIds,
    linkedParents,
    siblingSessions,
  };
}

export async function getScheduleOverview(): Promise<{
  sessionsCount: number;
  totalStudents: number;
  uniqueTeachers: number;
  busiestDay: number;
  busiestDayCount: number;
}> {
  const sessions = await listScheduleSessions();
  const totalStudents = sessions.reduce((sum, session) => sum + session.students, 0);
  const uniqueTeachers = new Set(sessions.map((session) => session.teacherId ?? session.teacher)).size;
  const busiestDay = sessions.reduce<Record<number, number>>((acc, session) => {
    acc[session.day] = (acc[session.day] ?? 0) + 1;
    return acc;
  }, {});

  const busiestDayEntry = Object.entries(busiestDay).sort((a, b) => Number(b[1]) - Number(a[1]))[0];

  return {
    sessionsCount: sessions.length,
    totalStudents,
    uniqueTeachers,
    busiestDay: busiestDayEntry ? Number(busiestDayEntry[0]) : 0,
    busiestDayCount: busiestDayEntry ? Number(busiestDayEntry[1]) : 0,
  };
}


export async function createScheduleEntry(input: CreateScheduleEntryInput): Promise<ScheduleSessionItem> {
  const supabase = getSupabaseClient();
  if (!supabase) {
    throw new Error("Supabase client not available. Login first.");
  }

  const teachers = await listTeachers();
  const teacher = teachers.find((item) => item.id === input.teacherId) ?? null;
  if (!teacher) {
    throw new Error("Select a valid teacher before saving.");
  }

  const existing = await listScheduleSessions();
  const clash = existing.find((session) => {
    if ((session.teacherId ?? "") !== input.teacherId) return false;
    if (session.day !== input.day) return false;
    const startsInside = input.startTime >= session.startTime && input.startTime < session.endTime;
    const endsInside = input.endTime > session.startTime && input.endTime <= session.endTime;
    const wraps = input.startTime <= session.startTime && input.endTime >= session.endTime;
    return startsInside || endsInside || wraps;
  });

  if (clash) {
    throw new Error("Schedule conflict with " + clash.className + " for the same teacher.");
  }

  // Look up course_id from courses table using course type
  const { data: courses } = await supabase
    .from("courses")
    .select("id")
    .eq("type", input.course)
    .eq("is_active", true)
    .limit(1);
  const courseId = courses?.[0]?.id ?? null;
  if (!courseId) {
    throw new Error("Course type not found in courses table. Make sure it exists.");
  }

  // Calculate session_date from day-of-week number
  const today = new Date();
  const currentDay = today.getDay();
  const targetDay = input.day;
  const daysUntil = (targetDay - currentDay + 7) % 7;
  const sessionDate = new Date(today);
  sessionDate.setDate(today.getDate() + (daysUntil === 0 ? 0 : daysUntil));
  const sessionDateStr = sessionDate.toISOString().split("T")[0];

  // Step 1: Create class (NO time fields - those belong to sessions)
  const { data: classData, error: classError } = await supabase
    .from("classes")
    .insert({
      name: input.className,
      course_id: courseId,
      teacher_id: input.teacherId,
      max_students: 10,
      current_students: 0,
      start_date: sessionDateStr,
      is_active: true,
    })
    .select("*")
    .single();

  if (classError || !classData) {
    throw new Error(classError?.message || "Failed to create class");
  }

  // Step 2: Create session WITH time fields
  const { data: sessionData, error: sessionError } = await supabase
    .from("sessions")
    .insert({
      class_id: classData.id,
      teacher_id: input.teacherId,
      session_date: sessionDateStr,
      start_time: input.startTime,
      end_time: input.endTime,
    })
    .select("*")
    .single();

  if (sessionError || !sessionData) {
    // Rollback: delete the class we just created
    await supabase.from("classes").delete().eq("id", classData.id);
    throw new Error(sessionError?.message || "Failed to create session");
  }

  const created: ScheduleSessionItem = {
    id: sessionData.id,
    classId: classData.id,
    teacherId: input.teacherId,
    day: input.day,
    startTime: input.startTime,
    endTime: input.endTime,
    className: input.className,
    teacher: teacher.fullName,
    students: 0,
    course: input.course,
    sessionDate: sessionDateStr,
  };

  saveLocalSchedule([created, ...getLocalSchedule().filter((item) => item.id !== created.id)]);
  return created;
}


