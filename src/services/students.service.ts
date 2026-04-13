import { createBrowserClient } from "@supabase/ssr";
import type { StudentStatus } from "@/types/common.types";
import type { Database } from "@/types/database.types";
import type { StudentListItem } from "@/types/crm";
import { MOCK_STUDENTS } from "@/lib/mock-data";
import { isBrowser, readStorage, sortByDateDesc, writeStorage } from "@/services/storage";

const STUDENTS_KEY = "skidy.crm.students";
const VALID_STATUSES: StudentStatus[] = ["trial", "active", "paused", "at_risk", "completed", "churned"];

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

function mockStudents(): StudentListItem[] {
  return MOCK_STUDENTS.map((student) => ({ ...student, parentId: null }));
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

function asStatus(value: unknown): StudentStatus {
  return VALID_STATUSES.includes(value as StudentStatus) ? (value as StudentStatus) : "trial";
}

function asNullableString(value: unknown): string | null {
  return typeof value === "string" && value.trim().length > 0 ? value : null;
}

function mapRow(row: Database["public"]["Tables"]["students"]["Row"] | Record<string, unknown>): StudentListItem {
  const record = row as Record<string, unknown>;
  return {
    id: asString(record.id, crypto.randomUUID()),
    fullName: asString(record.full_name ?? record.fullName, "طالب غير محدد"),
    age: asNumber(record.age, 0),
    parentId: asNullableString(record.parent_id ?? record.parentId),
    parentName: asString(record.parent_name ?? record.parentName, "ولي أمر غير محدد"),
    parentPhone: asString(record.parent_phone ?? record.parentPhone, "—"),
    status: asStatus(record.status),
    currentCourse: (typeof (record.current_course ?? record.currentCourse) === "string"
      ? (record.current_course ?? record.currentCourse)
      : null) as StudentListItem["currentCourse"],
    className: typeof (record.class_name ?? record.className) === "string" ? (record.class_name ?? record.className) as string : null,
    enrollmentDate: asString(record.enrollment_date ?? record.enrollmentDate, new Date().toISOString()),
    sessionsAttended: asNumber(record.sessions_attended ?? record.sessionsAttended, 0),
    totalPaid: asNumber(record.total_paid ?? record.totalPaid, 0),
  };
}

function getLocalStudents(): StudentListItem[] {
  const seed = shouldUseDemoFallback() ? mockStudents() : ([] as StudentListItem[]);
  return sortByDateDesc(readStorage(STUDENTS_KEY, seed), (student) => student.enrollmentDate);
}

function saveLocalStudents(students: StudentListItem[]): void {
  writeStorage(STUDENTS_KEY, sortByDateDesc(students, (student) => student.enrollmentDate));
}

function clearLocalStudents(): void {
  writeStorage(STUDENTS_KEY, []);
}

export async function listStudents(): Promise<StudentListItem[]> {
  const demoFallback = shouldUseDemoFallback() ? getLocalStudents() : [];
  const supabase = getSupabaseClient();
  if (!supabase) return demoFallback;

  try {
    const { data, error } = await supabase
      .from("students")
      .select("*")
      .order("enrollment_date", { ascending: false });

    if (error) {
      console.error("[students] failed to load from Supabase", error);
      clearLocalStudents();
      return [];
    }

    if (!data || data.length === 0) {
      clearLocalStudents();
      return [];
    }

    const mapped = data.map((row: Database["public"]["Tables"]["students"]["Row"]) => mapRow(row));
    saveLocalStudents(mapped);
    return mapped;
  } catch (error) {
    console.error("[students] unexpected load failure", error);
    clearLocalStudents();
    return [];
  }
}

export async function getStudentById(id: string): Promise<StudentListItem | null> {
  const items = await listStudents();
  return items.find((student) => student.id === id) ?? null;
}
