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

function requireParentIdentity(lead: LeadRow): void {
  if (!lead.parent_name || !lead.parent_phone) {
    throw new Error("\u0644\u0627 \u064a\u0645\u0643\u0646 \u062a\u062d\u0648\u064a\u0644 \u0627\u0644\u0639\u0645\u064a\u0644 \u0627\u0644\u062d\u0627\u0644\u064a \u0644\u0623\u0646 \u0627\u0633\u0645 \u0648\u0644\u064a \u0627\u0644\u0623\u0645\u0631 \u0623\u0648 \u0631\u0642\u0645 \u0627\u0644\u0647\u0627\u062a\u0641 \u063a\u064a\u0631 \u0645\u0643\u062a\u0645\u0644.");
  }
}

function hasEnoughStudentIdentity(lead: LeadRow): boolean {
  return Boolean(lead.child_name && lead.child_age && lead.child_age >= 4);
}

async function getLeadById(leadId: string, supabase: ReturnType<typeof getSupabaseClient>) {
  const { data, error } = await supabase!
    .from("leads")
    .select("*")
    .eq("id", leadId)
    .maybeSingle();

  if (error || !data) {
    throw new Error(error?.message || "\u062a\u0639\u0630\u0631 \u0627\u0644\u0639\u062b\u0648\u0631 \u0639\u0644\u0649 \u0627\u0644\u0639\u0645\u064a\u0644 \u0627\u0644\u0645\u062d\u062a\u0645\u0644 \u0627\u0644\u0645\u0637\u0644\u0648\u0628.");
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
    students.find((student) => student.parent_id === parent.id && sameName(student.full_name, lead.child_name)) ??
    students.find((student) => sameName(student.full_name, lead.child_name) && student.parent_id === parent.id) ??
    null
  );
}

async function ensureLeadEnrollmentInternal(
  lead: LeadRow,
  supabase: ReturnType<typeof getSupabaseClient>,
  parents: ParentRow[],
  students: StudentRow[],
): Promise<{ parentId: string; studentId: string | null }> {
  requireParentIdentity(lead);

  let parent = findParent(lead, parents);

  if (!parent) {
    const { data, error } = await supabase!
      .from("parents")
      .insert({
        full_name: lead.parent_name,
        phone: lead.parent_phone,
        whatsapp: lead.parent_whatsapp ?? lead.parent_phone,
      })
      .select("*")
      .single();

    if (error || !data) {
      throw new Error(error?.message || "\u062a\u0639\u0630\u0631 \u0625\u0646\u0634\u0627\u0621 \u0633\u062c\u0644 \u0648\u0644\u064a \u0627\u0644\u0623\u0645\u0631.");
    }

    parent = data as ParentRow;
    parents.unshift(parent);
  }

  let student = hasEnoughStudentIdentity(lead) ? findStudent(lead, parent, students) : null;

  if (hasEnoughStudentIdentity(lead) && !student) {
    const { data, error } = await supabase!
      .from("students")
      .insert({
        full_name: lead.child_name,
        age: lead.child_age,
        parent_id: parent.id,
        status: "active" as const,
        current_course: lead.suggested_course ?? null,
        enrollment_date: lead.won_at ?? new Date().toISOString().split("T")[0],
        sessions_attended: 0,
        total_paid: 0,
      })
      .select("*")
      .single();

    if (error || !data) {
      throw new Error(error?.message || "\u062a\u0639\u0630\u0631 \u0625\u0646\u0634\u0627\u0621 \u0633\u062c\u0644 \u0627\u0644\u0637\u0627\u0644\u0628.");
    }

    student = data as StudentRow;
    students.unshift(student);
  } else if (student && (!student.parent_id || student.parent_id !== parent.id)) {
    const { data, error } = await supabase!
      .from("students")
      .update({
        parent_id: parent.id,
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
      })
      .eq("id", lead.id);
  }

  return { parentId: parent.id, studentId: student?.id ?? null };
}

export async function ensureLeadEnrollment(leadId: string): Promise<{ parentId: string; studentId: string | null }> {
  const supabase = getSupabaseClient();
  if (!supabase) {
    throw new Error("\u062a\u0639\u0630\u0631 \u0627\u0644\u0627\u062a\u0635\u0627\u0644 \u0628\u0642\u0627\u0639\u062f\u0629 \u0627\u0644\u0628\u064a\u0627\u0646\u0627\u062a. \u062a\u0623\u0643\u062f \u0645\u0646 \u0625\u0639\u062f\u0627\u062f\u0627\u062a Supabase \u062b\u0645 \u0623\u0639\u062f \u0627\u0644\u0645\u062d\u0627\u0648\u0644\u0629.");
  }

  const lead = await getLeadById(leadId, supabase);
  const [{ data: parents, error: parentsError }, { data: students, error: studentsError }] = await Promise.all([
    supabase.from("parents").select("*"),
    supabase.from("students").select("*"),
  ]);

  if (parentsError || studentsError) {
    throw new Error(parentsError?.message || studentsError?.message || "\u062a\u0639\u0630\u0631 \u062a\u062d\u0645\u064a\u0644 \u0628\u064a\u0627\u0646\u0627\u062a \u0627\u0644\u0631\u0628\u0637 \u0627\u0644\u062d\u0627\u0644\u064a\u0629.");
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
