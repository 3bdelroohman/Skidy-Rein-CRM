import { createBrowserClient } from "@supabase/ssr";
import type { CourseType, EmploymentType } from "@/types/common.types";
import type { CreateTeacherInput, TeacherListItem } from "@/types/crm";
import type { Database } from "@/types/database.types";
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

function normalizeName(value: string | null | undefined): string {
  return (value ?? "").toLowerCase().replace(/[\u064B-\u065F]/g, "").replace(/\s+/g, " ").trim();
}

function normalizePhone(value: string | null | undefined): string {
  const digits = (value ?? "").replace(/\D/g, "");
  if (digits.startsWith("20") && digits.length > 11) return digits.slice(2);
  if (digits.startsWith("2") && digits.length === 12) return digits.slice(1);
  return digits;
}

function mapRow(row: Record<string, unknown>): TeacherListItem {
  const fallback = MOCK_TEACHERS.find(
    (teacher) => teacher.fullName === asString(row.full_name) || teacher.email === asString(row.email),
  );

  return {
    id: asString(row.id, crypto.randomUUID()),
    fullName: asString(row.full_name ?? row.fullName, "Ù…Ø¯Ø±Ø³ ØºÙŠØ± Ù…Ø­Ø¯Ø¯"),
    phone: asString(row.phone, fallback?.phone ?? "â€”"),
    email: asString(row.email, fallback?.email ?? "") || null,
    specialization: asSpecialization(row.specialization, fallback?.specialization ?? []),
    employment: asEmployment(row.employment ?? fallback?.employment),
    classesCount: 0,
    studentsCount: 0,
    isActive: Boolean(row.is_active ?? row.isActive ?? fallback?.isActive ?? true),
  };
}

function getLocalTeachers(): TeacherListItem[] {
  return sortTeachers(readStorage(TEACHERS_KEY, mockTeachers()));
}

function saveLocalTeachers(items: TeacherListItem[]): void {
  writeStorage(TEACHERS_KEY, sortTeachers(items));
}

export async function listTeachers(): Promise<TeacherListItem[]> {
  const fallback = getLocalTeachers();
  const supabase = getSupabaseClient();
  if (!supabase) return fallback;

  try {
    const { data, error } = await supabase.from("teachers").select("*").order("created_at", { ascending: false });
    if (error || !data || data.length === 0) return fallback;
    const mapped = data.map((row) => mapRow(row as Record<string, unknown>));
    saveLocalTeachers(mapped);
    return mapped;
  } catch {
    return fallback;
  }
}

export async function getTeacherById(id: string): Promise<TeacherListItem | null> {
  const items = await listTeachers();
  return items.find((teacher) => teacher.id === id) ?? null;
}

export async function createTeacher(input: CreateTeacherInput): Promise<TeacherListItem> {
  const supabase = getSupabaseClient();
  if (!supabase) {
    throw new Error("ØªØ¹Ø°Ø± Ø§Ù„Ø§ØªØµØ§Ù„ Ø¨Ù‚Ø§Ø¹Ø¯Ø© Ø§Ù„Ø¨ÙŠØ§Ù†Ø§Øª. Ø£Ø¹Ø¯ Ø§Ù„Ù…Ø­Ø§ÙˆÙ„Ø© Ø¨Ø¹Ø¯ ØªØ³Ø¬ÙŠÙ„ Ø§Ù„Ø¯Ø®ÙˆÙ„ Ø£Ùˆ Ø§Ù„ØªØ­Ù‚Ù‚ Ù…Ù† Ø§Ù„Ø¥Ø¹Ø¯Ø§Ø¯Ø§Øª.");
  }

  const existing = await listTeachers();
  const duplicate = existing.find((teacher) => {
    const samePhone = normalizePhone(teacher.phone) === normalizePhone(input.phone);
    const inputEmail = (input.email ?? "").trim().toLowerCase();
    const teacherEmail = (teacher.email ?? "").trim().toLowerCase();
    const sameEmail = teacherEmail.length > 0 && inputEmail.length > 0 && teacherEmail === inputEmail;
    const sameName = normalizeName(teacher.fullName) === normalizeName(input.fullName);
    return samePhone || sameEmail || (sameName && samePhone);
  });

  if (duplicate) {
    throw new Error("ÙŠÙˆØ¬Ø¯ Ù…Ø¯Ø±Ø³ Ù…Ø³Ø¬Ù„ Ø¨Ø§Ù„ÙØ¹Ù„ Ø¨Ù†ÙØ³ Ø§Ù„Ø§Ø³Ù… Ø£Ùˆ Ø§Ù„Ù‡Ø§ØªÙ Ø£Ùˆ Ø§Ù„Ø¨Ø±ÙŠØ¯ Ø§Ù„Ø¥Ù„ÙƒØªØ±ÙˆÙ†ÙŠ.");
  }

  const payload: Database["public"]["Tables"]["teachers"]["Insert"] = {
    full_name: input.fullName,
    phone: input.phone,
    email: input.email?.trim() || null,
    employment: input.employment,
    specialization: input.specialization,
    is_active: input.isActive ?? true,
    created_at: new Date().toISOString(),
  };

  const { data, error } = await supabase.from("teachers").insert(payload).select("*").single();
  if (error || !data) {
    throw new Error(error?.message || "ØªØ¹Ø°Ø± Ø¥Ù†Ø´Ø§Ø¡ Ø³Ø¬Ù„ Ø§Ù„Ù…Ø¯Ø±Ø³");
  }

  const created = mapRow(data as Record<string, unknown>);
  saveLocalTeachers([created, ...getLocalTeachers().filter((teacher) => teacher.id !== created.id)]);
  return created;
}


export async function deleteTeacher(id: string): Promise<boolean> {
  const supabase = getSupabaseClient();
  if (!supabase) {
    throw new Error("ØªØ¹Ø°Ø± Ø§Ù„Ø§ØªØµØ§Ù„ Ø¨Ù‚Ø§Ø¹Ø¯Ø© Ø§Ù„Ø¨ÙŠØ§Ù†Ø§Øª. Ø£Ø¹Ø¯ Ø§Ù„Ù…Ø­Ø§ÙˆÙ„Ø© Ø¨Ø¹Ø¯ ØªØ³Ø¬ÙŠÙ„ Ø§Ù„Ø¯Ø®ÙˆÙ„ Ø£Ùˆ Ø§Ù„ØªØ­Ù‚Ù‚ Ù…Ù† Ø§Ù„Ø¥Ø¹Ø¯Ø§Ø¯Ø§Øª.");
  }

  const { error } = await supabase.from("teachers").delete().eq("id", id);
  if (error) {
    throw new Error(error.message || "ØªØ¹Ø°Ø± Ø­Ø°Ù Ø§Ù„Ù…Ø¯Ø±Ø³");
  }

  saveLocalTeachers(getLocalTeachers().filter((teacher) => teacher.id !== id));
  return true;
}


