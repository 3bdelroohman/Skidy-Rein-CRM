import { createBrowserClient } from "@supabase/ssr";
import type { CourseType, EmploymentType } from "@/types/common.types";
import type { Database } from "@/types/database.types";
import type { TeacherListItem } from "@/types/crm";
import { MOCK_TEACHERS } from "@/lib/mock-data";
import { isBrowser, readStorage, writeStorage } from "@/services/storage";

const TEACHERS_KEY = "skidy.crm.teachers";
const VALID_EMPLOYMENTS: EmploymentType[] = ["full_time", "part_time", "freelance"];
const VALID_COURSES: CourseType[] = ["scratch", "python", "web", "ai"];

function getSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key || !isBrowser()) return null;
  return createBrowserClient<Database>(url, key);
}


function isDemoModeEnabled(): boolean {
  return process.env.NEXT_PUBLIC_ALLOW_DEMO_FALLBACK === "true";
}

function shouldUseDemoFallback(): boolean {
  return !getSupabaseClient() && isDemoModeEnabled();
}

function sortTeachers(items: TeacherListItem[]): TeacherListItem[] {
  return [...items].sort((a, b) => a.fullName.localeCompare(b.fullName, "ar"));
}

function mockTeachers(): TeacherListItem[] {
  return MOCK_TEACHERS.map((teacher) => ({ ...teacher }));
}

function asString(value: unknown, fallback = ""): string {
  return typeof value === "string" && value.trim().length > 0 ? value : fallback;
}

function asNumber(value: unknown, fallback = 0): number {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
  }
  return fallback;
}

function asEmployment(value: unknown): EmploymentType {
  return VALID_EMPLOYMENTS.includes(value as EmploymentType) ? (value as EmploymentType) : "part_time";
}

function asSpecialization(value: unknown, fallback: CourseType[] = []): CourseType[] {
  if (Array.isArray(value)) {
    return value.filter((item): item is CourseType => VALID_COURSES.includes(item as CourseType));
  }
  if (typeof value === "string") {
    return value
      .split(",")
      .map((item) => item.trim())
      .filter((item): item is CourseType => VALID_COURSES.includes(item as CourseType));
  }
  return fallback;
}

function mapRow(
  row: Database["public"]["Tables"]["teachers"]["Row"] | Record<string, unknown>,
): TeacherListItem {
  const record = row as Record<string, unknown>;
  const fallback = MOCK_TEACHERS.find(
    (teacher) => teacher.fullName === asString(record.full_name) || teacher.email === asString(record.email),
  );

  return {
    id: asString(record.id, crypto.randomUUID()),
    fullName: asString(record.full_name ?? record.fullName, "مدرس غير محدد"),
    phone: asString(record.phone, fallback?.phone ?? "—"),
    email: asString(record.email, fallback?.email ?? "—"),
    specialization: asSpecialization(record.specialization, fallback?.specialization ?? []),
    employment: asEmployment(record.employment ?? fallback?.employment),
    classesCount: asNumber(record.classes_count ?? record.classesCount, fallback?.classesCount ?? 0),
    studentsCount: asNumber(record.students_count ?? record.studentsCount, fallback?.studentsCount ?? 0),
    isActive: Boolean(record.is_active ?? record.isActive ?? fallback?.isActive ?? true),
  };
}

function getLocalTeachers(): TeacherListItem[] {
  const seed = shouldUseDemoFallback() ? mockTeachers() : ([] as TeacherListItem[]);
  return sortTeachers(readStorage(TEACHERS_KEY, seed));
}

function saveLocalTeachers(items: TeacherListItem[]): void {
  writeStorage(TEACHERS_KEY, sortTeachers(items));
}

function clearLocalTeachers(): void {
  writeStorage(TEACHERS_KEY, []);
}

export async function listTeachers(): Promise<TeacherListItem[]> {
  const demoFallback = shouldUseDemoFallback() ? getLocalTeachers() : [];
  const supabase = getSupabaseClient();
  if (!supabase) return demoFallback;

  try {
    const { data, error } = await supabase
      .from("teachers")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("[teachers] failed to load from Supabase", error);
      clearLocalTeachers();
      return [];
    }

    if (!data || data.length === 0) {
      clearLocalTeachers();
      return [];
    }

    const mapped = data.map((row: Database["public"]["Tables"]["teachers"]["Row"]) => mapRow(row));
    saveLocalTeachers(mapped);
    return mapped;
  } catch (error) {
    console.error("[teachers] unexpected load failure", error);
    clearLocalTeachers();
    return [];
  }
}

export async function getTeacherById(id: string): Promise<TeacherListItem | null> {
  const items = await listTeachers();
  return items.find((teacher) => teacher.id === id) ?? null;
}
