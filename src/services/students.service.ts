import { createBrowserClient } from "@supabase/ssr";
import type { StudentStatus } from "@/types/common.types";
import type { Database } from "@/types/database.types";
import type { CreateStudentInput, StudentListItem } from "@/types/crm";
import { isBrowser, readStorage, sortByDateDesc, writeStorage } from "@/services/storage";

const STUDENTS_KEY = "skidy.crm.students";
const VALID_STATUSES: StudentStatus[] = ["trial", "active", "paused", "at_risk", "completed", "churned"];

function getSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key || !isBrowser()) return null;
  return createBrowserClient<Database>(url, key);
}

function asString(value: unknown, fallback = ""): string {
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : fallback;
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
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : null;
}

function normalizePhone(value: string | null | undefined): string {
  return (value ?? "").replace(/\D/g, "").replace(/^20/, "");
}

function normalizeName(value: string | null | undefined): string {
  return (value ?? "")
    .toLowerCase()
    .replace(/[\u064B-\u065F]/g, "")
    .replace(/\s+/g, " ")
    .trim();
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
  return sortByDateDesc(readStorage(STUDENTS_KEY, [] as StudentListItem[]), (student) => student.enrollmentDate);
}

function saveLocalStudents(students: StudentListItem[]): void {
  writeStorage(STUDENTS_KEY, sortByDateDesc(students, (student) => student.enrollmentDate));
}

function clearLocalStudents(): void {
  writeStorage(STUDENTS_KEY, []);
}

function findExistingStudent(items: StudentListItem[], input: CreateStudentInput): StudentListItem | null {
  const studentName = normalizeName(input.fullName);
  const parentName = normalizeName(input.parentName);
  const parentPhone = normalizePhone(input.parentPhone);

  return (
    items.find((student) => input.parentId && student.parentId === input.parentId && normalizeName(student.fullName) === studentName) ??
    items.find((student) => normalizeName(student.fullName) === studentName && parentPhone.length > 0 && normalizePhone(student.parentPhone) === parentPhone) ??
    items.find((student) => normalizeName(student.fullName) === studentName && normalizeName(student.parentName) === parentName) ??
    null
  );
}

export async function listStudents(): Promise<StudentListItem[]> {
  const supabase = getSupabaseClient();
  if (!supabase) {
    clearLocalStudents();
    return [];
  }

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

export async function createStudent(input: CreateStudentInput): Promise<StudentListItem> {
  const fullName = input.fullName.trim();
  const parentName = input.parentName.trim();
  const parentPhone = input.parentPhone.trim();

  if (!fullName || !parentName || !parentPhone) {
    throw new Error("اسم الطالب وبيانات ولي الأمر الأساسية مطلوبة.");
  }

  if (!Number.isFinite(input.age) || input.age < 4 || input.age > 18) {
    throw new Error("عمر الطالب يجب أن يكون بين 4 و18 سنة.");
  }

  const supabase = getSupabaseClient();
  if (!supabase) {
    throw new Error("تعذر الاتصال بقاعدة البيانات. تأكد من إعدادات Supabase ثم أعد المحاولة.");
  }

  const existing = findExistingStudent(await listStudents(), input);
  if (existing) {
    return existing;
  }

  const payload: Database["public"]["Tables"]["students"]["Insert"] = {
    full_name: fullName,
    age: input.age,
    parent_id: input.parentId ?? null,
    parent_name: parentName,
    parent_phone: parentPhone,
    status: input.status ?? "active",
    current_course: input.currentCourse ?? null,
    class_name: input.className ?? null,
    enrollment_date: input.enrollmentDate ?? new Date().toISOString(),
    sessions_attended: input.sessionsAttended ?? 0,
    total_paid: input.totalPaid ?? 0,
    created_at: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from("students")
    .insert(payload)
    .select("*")
    .single();

  if (error || !data) {
    console.error("[students] create failed", error);
    throw new Error(error?.message || "تعذر إنشاء سجل الطالب.");
  }

  const created = mapRow(data);
  saveLocalStudents([created, ...getLocalStudents().filter((item) => item.id !== created.id)]);
  return created;
}
