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


function normalizeName(value: string | null | undefined): string {
  return (value ?? "")
    .toLowerCase()
    .replace(/[\u064B-\u065F]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

interface ParentLookup {
  full_name: string;
  phone: string;
}

function mapRow(
  row: Database["public"]["Tables"]["students"]["Row"] | Record<string, unknown>,
  parentLookup?: ParentLookup | null,
): StudentListItem {
  const record = row as Record<string, unknown>;
  return {
    id: asString(record.id, crypto.randomUUID()),
    fullName: asString(record.full_name ?? record.fullName, "\u0637\u0627\u0644\u0628 \u063a\u064a\u0631 \u0645\u062d\u062f\u062f"),
    age: asNumber(record.age, 0),
    parentId: asNullableString(record.parent_id ?? record.parentId),
    parentName: asString(parentLookup?.full_name ?? record.parentName, "\u0648\u0644\u064a \u0623\u0645\u0631 \u063a\u064a\u0631 \u0645\u062d\u062f\u062f"),
    parentPhone: asString(parentLookup?.phone ?? record.parentPhone, "\u2013"),
    status: asStatus(record.status),
    currentCourse: (typeof (record.current_course ?? record.currentCourse) === "string"
      ? (record.current_course ?? record.currentCourse)
      : null) as StudentListItem["currentCourse"],
    className: null,
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
  const parentId = input.parentId;

  return (
    items.find((student) => parentId && student.parentId === parentId && normalizeName(student.fullName) === studentName) ??
    items.find((student) => normalizeName(student.fullName) === studentName && student.parentId === parentId) ??
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
    const [studentsRes, parentsRes] = await Promise.all([
      supabase.from("students").select("*").order("enrollment_date", { ascending: false }),
      supabase.from("parents").select("id, full_name, phone"),
    ]);

    if (studentsRes.error) {
      console.error("[students] failed to load from Supabase", studentsRes.error);
      clearLocalStudents();
      return [];
    }

    if (!studentsRes.data || studentsRes.data.length === 0) {
      clearLocalStudents();
      return [];
    }

    const parentsMap = new Map<string, ParentLookup>();
    (parentsRes.data ?? []).forEach((p) => parentsMap.set(p.id, { full_name: p.full_name, phone: p.phone }));

    const mapped = studentsRes.data.map((row) => {
      const parentInfo = row.parent_id ? parentsMap.get(row.parent_id) ?? null : null;
      return mapRow(row, parentInfo);
    });

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

  if (!fullName) {
    throw new Error("\u0627\u0633\u0645 \u0627\u0644\u0637\u0627\u0644\u0628 \u0645\u0637\u0644\u0648\u0628.");
  }

  if (!input.parentId) {
    throw new Error("\u064a\u062c\u0628 \u0631\u0628\u0637 \u0627\u0644\u0637\u0627\u0644\u0628 \u0628\u0648\u0644\u064a \u0623\u0645\u0631.");
  }

  if (!Number.isFinite(input.age) || input.age < 4 || input.age > 18) {
    throw new Error("\u0639\u0645\u0631 \u0627\u0644\u0637\u0627\u0644\u0628 \u064a\u062c\u0628 \u0623\u0646 \u064a\u0643\u0648\u0646 \u0628\u064a\u0646 4 \u064818 \u0633\u0646\u0629.");
  }

  const supabase = getSupabaseClient();
  if (!supabase) {
    throw new Error("\u062a\u0639\u0630\u0631 \u0627\u0644\u0627\u062a\u0635\u0627\u0644 \u0628\u0642\u0627\u0639\u062f\u0629 \u0627\u0644\u0628\u064a\u0627\u0646\u0627\u062a.");
  }

  const existing = findExistingStudent(await listStudents(), input);
  if (existing) {
    return existing;
  }

  const payload: Database["public"]["Tables"]["students"]["Insert"] = {
    full_name: fullName,
    age: input.age,
    parent_id: input.parentId,
    status: input.status ?? "active",
    current_course: input.currentCourse ?? null,
    enrollment_date: input.enrollmentDate ?? new Date().toISOString().split("T")[0],
    sessions_attended: input.sessionsAttended ?? 0,
    total_paid: input.totalPaid ?? 0,
  };

  const { data, error } = await supabase
    .from("students")
    .insert(payload)
    .select("*")
    .single();

  if (error || !data) {
    console.error("[students] create failed", error);
    throw new Error(error?.message || "\u062a\u0639\u0630\u0631 \u0625\u0646\u0634\u0627\u0621 \u0633\u062c\u0644 \u0627\u0644\u0637\u0627\u0644\u0628.");
  }

  const { data: parentData } = await supabase
    .from("parents")
    .select("full_name, phone")
    .eq("id", input.parentId)
    .maybeSingle();

  const created = mapRow(data, parentData);
  saveLocalStudents([created, ...getLocalStudents().filter((item) => item.id !== created.id)]);
  return created;
}


/** Delete a student permanently */
export async function deleteStudent(id: string): Promise<boolean> {
  const supabase = getSupabaseClient();
  if (!supabase) throw new Error("Supabase client not available");

  const { data: before } = await supabase
    .from("students")
    .select("id")
    .eq("id", id)
    .maybeSingle();

  if (!before) throw new Error("\u0627\u0644\u0637\u0627\u0644\u0628 \u063A\u064A\u0631 \u0645\u0648\u062C\u0648\u062F");

  // Delete related enrollments
  await supabase.from("class_enrollments").delete().eq("student_id", id);

  // Delete related attendance
  await supabase.from("attendance").delete().eq("student_id", id);

  // Delete related payments
  await supabase.from("payments").delete().eq("student_id", id);

  // Delete related follow-ups
  await supabase.from("follow_ups").delete().eq("student_id", id);

  const { error } = await supabase.from("students").delete().eq("id", id);
  if (error) throw new Error(error.message || "Failed to delete student");

  saveLocalStudents(getLocalStudents().filter((s) => s.id !== id));
  return true;
}

