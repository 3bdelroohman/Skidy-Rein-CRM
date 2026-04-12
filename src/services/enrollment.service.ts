import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@/types/database.types";

function getSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key || typeof window === "undefined") return null;
  return createBrowserClient<Database>(url, key);
}

type LeadRow = Database["public"]["Tables"]["leads"]["Row"];
type ParentRow = Database["public"]["Tables"]["parents"]["Row"];
type StudentRow = Database["public"]["Tables"]["students"]["Row"];

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

function samePhone(a: string | null | undefined, b: string | null | undefined): boolean {
  const left = normalizePhone(a);
  const right = normalizePhone(b);
  return left.length > 0 && left === right;
}

function sameName(a: string | null | undefined, b: string | null | undefined): boolean {
  const left = normalizeName(a);
  const right = normalizeName(b);
  return left.length > 0 && left === right;
}

function requireLeadIdentity(lead: LeadRow): void {
  if (!lead.parent_name || !lead.parent_phone || !lead.child_name || !lead.child_age) {
    throw new Error("لا يمكن تحويل العميل إلى طالب لأن بيانات الطفل أو ولي الأمر غير مكتملة.");
  }
}

async function getLeadById(leadId: string, supabase: ReturnType<typeof getSupabaseClient>) {
  const { data, error } = await supabase!
    .from("leads")
    .select("*")
    .eq("id", leadId)
    .maybeSingle();

  if (error || !data) {
    throw new Error(error?.message || "تعذر العثور على العميل المحتمل المطلوب.");
  }

  return data as LeadRow;
}

function findParent(lead: LeadRow, parents: ParentRow[]): ParentRow | null {
  return (
    parents.find((parent) => lead.parent_id && parent.id === lead.parent_id) ??
    parents.find((parent) => samePhone(parent.phone, lead.parent_phone)) ??
    parents.find((parent) => samePhone(parent.whatsapp, lead.parent_phone)) ??
    parents.find((parent) => sameName(parent.full_name, lead.parent_name)) ??
    null
  );
}

function findStudent(lead: LeadRow, parent: ParentRow, students: StudentRow[]): StudentRow | null {
  return (
    students.find((student) => student.parent_id && student.parent_id === parent.id && sameName(student.full_name, lead.child_name)) ??
    students.find((student) => sameName(student.full_name, lead.child_name) && samePhone(student.parent_phone, parent.phone ?? lead.parent_phone)) ??
    students.find((student) => sameName(student.full_name, lead.child_name) && sameName(student.parent_name, parent.full_name ?? lead.parent_name)) ??
    null
  );
}

async function refreshParentChildrenCount(supabase: ReturnType<typeof getSupabaseClient>, parent: ParentRow, students: StudentRow[]) {
  const linked = students.filter((student) => {
    if (student.parent_id && parent.id && student.parent_id === parent.id) return true;
    if (samePhone(student.parent_phone, parent.phone)) return true;
    return sameName(student.parent_name, parent.full_name);
  }).length;

  await supabase!
    .from("parents")
    .update({ children_count: linked })
    .eq("id", parent.id);
}

async function ensureLeadEnrollmentInternal(
  lead: LeadRow,
  supabase: ReturnType<typeof getSupabaseClient>,
  parents: ParentRow[],
  students: StudentRow[],
): Promise<{ parentId: string; studentId: string }> {
  requireLeadIdentity(lead);

  let parent = findParent(lead, parents);

  if (!parent) {
    const { data, error } = await supabase!
      .from("parents")
      .insert({
        full_name: lead.parent_name,
        phone: lead.parent_phone,
        whatsapp: lead.parent_whatsapp ?? lead.parent_phone,
        children_count: 0,
        created_at: new Date().toISOString(),
      })
      .select("*")
      .single();

    if (error || !data) {
      throw new Error(error?.message || "تعذر إنشاء سجل ولي الأمر.");
    }

    parent = data as ParentRow;
    parents.unshift(parent);
  }

  let student = findStudent(lead, parent, students);

  if (!student) {
    const { data, error } = await supabase!
      .from("students")
      .insert({
        full_name: lead.child_name,
        age: lead.child_age,
        parent_id: parent.id,
        parent_name: parent.full_name,
        parent_phone: parent.phone ?? lead.parent_phone,
        status: "active",
        current_course: lead.suggested_course ?? null,
        class_name: null,
        enrollment_date: lead.won_at ?? new Date().toISOString(),
        sessions_attended: 0,
        total_paid: 0,
        created_at: new Date().toISOString(),
      })
      .select("*")
      .single();

    if (error || !data) {
      throw new Error(error?.message || "تعذر إنشاء سجل الطالب.");
    }

    student = data as StudentRow;
    students.unshift(student);
  } else if (!student.parent_id || student.parent_id !== parent.id) {
    const { data, error } = await supabase!
      .from("students")
      .update({
        parent_id: parent.id,
        parent_name: parent.full_name,
        parent_phone: parent.phone ?? lead.parent_phone,
        current_course: student.current_course ?? lead.suggested_course ?? null,
      })
      .eq("id", student.id)
      .select("*")
      .single();

    if (!error && data) {
      student = data as StudentRow;
      const index = students.findIndex((item) => item.id === student!.id);
      if (index >= 0) students[index] = student;
    }
  }

  if (lead.parent_id !== parent.id || !lead.won_at) {
    await supabase!
      .from("leads")
      .update({
        parent_id: parent.id,
        won_at: lead.won_at ?? new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", lead.id);
  }

  await refreshParentChildrenCount(supabase, parent, students);

  return { parentId: parent.id, studentId: student.id };
}

export async function ensureLeadEnrollment(leadId: string): Promise<{ parentId: string; studentId: string }> {
  const supabase = getSupabaseClient();
  if (!supabase) {
    throw new Error("تعذر الاتصال بقاعدة البيانات. تأكد من إعدادات Supabase ثم أعد المحاولة.");
  }

  const lead = await getLeadById(leadId, supabase);
  const [{ data: parents, error: parentsError }, { data: students, error: studentsError }] = await Promise.all([
    supabase.from("parents").select("*"),
    supabase.from("students").select("*"),
  ]);

  if (parentsError || studentsError) {
    throw new Error(parentsError?.message || studentsError?.message || "تعذر تحميل بيانات الربط الحالية.");
  }

  return ensureLeadEnrollmentInternal(lead, supabase, parents ?? [], students ?? []);
}

export async function syncWonLeadsToEnrollments(): Promise<number> {
  const supabase = getSupabaseClient();
  if (!supabase) return 0;

  const [{ data: leads, error: leadsError }, { data: parents, error: parentsError }, { data: students, error: studentsError }] = await Promise.all([
    supabase.from("leads").select("*").eq("stage", "won").order("created_at", { ascending: false }),
    supabase.from("parents").select("*"),
    supabase.from("students").select("*"),
  ]);

  if (leadsError || parentsError || studentsError) {
    console.error("[enrollment] sync failed", leadsError || parentsError || studentsError);
    return 0;
  }

  let repaired = 0;
  const mutableParents = [...(parents ?? [])] as ParentRow[];
  const mutableStudents = [...(students ?? [])] as StudentRow[];

  for (const lead of leads ?? []) {
    try {
      const parentBefore = mutableParents.length;
      const studentBefore = mutableStudents.length;
      await ensureLeadEnrollmentInternal(lead as LeadRow, supabase, mutableParents, mutableStudents);
      if (mutableParents.length > parentBefore || mutableStudents.length > studentBefore) {
        repaired += 1;
      }
    } catch (error) {
      console.warn("[enrollment] skipped won lead during sync", lead.id, error);
    }
  }

  return repaired;
}


export async function getEnrollmentTargetsForLead(
  leadId: string,
): Promise<{ parentId: string | null; studentId: string | null }> {
  const supabase = getSupabaseClient();
  if (!supabase) {
    return { parentId: null, studentId: null };
  }

  try {
    const lead = await getLeadById(leadId, supabase);
    const [{ data: parents }, { data: students }] = await Promise.all([
      supabase.from("parents").select("*"),
      supabase.from("students").select("*"),
    ]);

    const parent = findParent(lead, (parents ?? []) as ParentRow[]);
    if (!parent) {
      return { parentId: lead.parent_id ?? null, studentId: null };
    }

    const student = findStudent(lead, parent, (students ?? []) as StudentRow[]);
    return { parentId: parent.id, studentId: student?.id ?? null };
  } catch (error) {
    console.warn("[enrollment] failed to resolve enrollment targets", leadId, error);
    return { parentId: null, studentId: null };
  }
}
