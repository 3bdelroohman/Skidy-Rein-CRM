import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@/types/database.types";
import type { CreateParentInput, ParentListItem } from "@/types/crm";
import { isBrowser, readStorage, writeStorage } from "@/services/storage";

const PARENTS_KEY = "skidy.crm.parents";

function getSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key || !isBrowser()) return null;
  return createBrowserClient<Database>(url, key);
}

function sortParents(items: ParentListItem[]): ParentListItem[] {
  return [...items].sort((a, b) => a.fullName.localeCompare(b.fullName, "ar"));
}

function asString(value: unknown, fallback = ""): string {
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : fallback;
}

function asNullableString(value: unknown): string | null {
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : null;
}

function asNumber(value: unknown, fallback = 0): number {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
  }
  return fallback;
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

function mapRow(
  row: Database["public"]["Tables"]["parents"]["Row"] | Record<string, unknown>,
): ParentListItem {
  const record = row as Record<string, unknown>;

  return {
    id: asString(record.id, crypto.randomUUID()),
    fullName: asString(record.full_name ?? record.fullName, "ÙˆÙ„ÙŠ Ø£Ù…Ø± ØºÙŠØ± Ù…Ø­Ø¯Ø¯"),
    phone: asString(record.phone, "â€”"),
    whatsapp: asNullableString(record.whatsapp),
    email: asNullableString(record.email),
    city: asNullableString(record.city),
    childrenCount: 0,
    children: [],
  };
}

function getLocalParents(): ParentListItem[] {
  return sortParents(readStorage(PARENTS_KEY, [] as ParentListItem[]));
}

function saveLocalParents(items: ParentListItem[]): void {
  writeStorage(PARENTS_KEY, sortParents(items));
}

function clearLocalParents(): void {
  writeStorage(PARENTS_KEY, []);
}

function findExistingParent(items: ParentListItem[], input: CreateParentInput): ParentListItem | null {
  const phone = normalizePhone(input.phone);
  const whatsapp = normalizePhone(input.whatsapp);
  const name = normalizeName(input.fullName);

  return (
    items.find((parent) => phone.length > 0 && normalizePhone(parent.phone) === phone) ??
    items.find((parent) => whatsapp.length > 0 && normalizePhone(parent.whatsapp) === whatsapp) ??
    items.find((parent) => name.length > 0 && normalizeName(parent.fullName) === name && phone.length > 0 && normalizePhone(parent.phone) === phone) ??
    null
  );
}

export async function listParents(): Promise<ParentListItem[]> {
  const supabase = getSupabaseClient();
  if (!supabase) {
    clearLocalParents();
    return [];
  }

  try {
    const { data, error } = await supabase
      .from("parents")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("[parents] failed to load from Supabase", error);
      clearLocalParents();
      return [];
    }

    if (!data || data.length === 0) {
      clearLocalParents();
      return [];
    }

    const mapped = data.map((row: Database["public"]["Tables"]["parents"]["Row"]) => mapRow(row));
    saveLocalParents(mapped);
    return mapped;
  } catch (error) {
    console.error("[parents] unexpected load failure", error);
    clearLocalParents();
    return [];
  }
}

export async function getParentById(id: string): Promise<ParentListItem | null> {
  const items = await listParents();
  return items.find((parent) => parent.id === id) ?? null;
}

export async function createParent(input: CreateParentInput): Promise<ParentListItem> {
  const fullName = input.fullName.trim();
  const phone = input.phone.trim();

  if (!fullName || !phone) {
    throw new Error("Ø§Ø³Ù… ÙˆÙ„ÙŠ Ø§Ù„Ø£Ù…Ø± ÙˆØ±Ù‚Ù… Ø§Ù„Ù‡Ø§ØªÙ Ù…Ø·Ù„ÙˆØ¨Ø§Ù†.");
  }

  const supabase = getSupabaseClient();
  if (!supabase) {
    throw new Error("ØªØ¹Ø°Ø± Ø§Ù„Ø§ØªØµØ§Ù„ Ø¨Ù‚Ø§Ø¹Ø¯Ø© Ø§Ù„Ø¨ÙŠØ§Ù†Ø§Øª. ØªØ£ÙƒØ¯ Ù…Ù† Ø¥Ø¹Ø¯Ø§Ø¯Ø§Øª Supabase Ø«Ù… Ø£Ø¹Ø¯ Ø§Ù„Ù…Ø­Ø§ÙˆÙ„Ø©.");
  }

  const existing = findExistingParent(await listParents(), input);
  if (existing) {
    return existing;
  }

  const payload: Database["public"]["Tables"]["parents"]["Insert"] = {
    full_name: fullName,
    phone,
    whatsapp: input.whatsapp?.trim() || phone,
    email: input.email?.trim() || null,
    city: input.city?.trim() || null,
        created_at: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from("parents")
    .insert(payload)
    .select("*")
    .single();

  if (error || !data) {
    console.error("[parents] create failed", error);
    throw new Error(error?.message || "ØªØ¹Ø°Ø± Ø¥Ù†Ø´Ø§Ø¡ Ø³Ø¬Ù„ ÙˆÙ„ÙŠ Ø§Ù„Ø£Ù…Ø±.");
  }

  const created = mapRow(data);
  saveLocalParents([created, ...getLocalParents().filter((item) => item.id !== created.id)]);
  return created;
}


/** Delete a parent permanently */
export async function deleteParent(id: string): Promise<boolean> {
  const supabase = getSupabaseClient();
  if (!supabase) throw new Error("Supabase client not available");

  const { data: before } = await supabase
    .from("parents")
    .select("id")
    .eq("id", id)
    .maybeSingle();

  if (!before) throw new Error("Parent not found");

  // Check for linked students
  const { data: students } = await supabase
    .from("students")
    .select("id")
    .eq("parent_id", id)
    .limit(1);

  if (students && students.length > 0) {
    throw new Error("لا يمكن حذف ولي الأمر لأن لديه طلاب مرتبطين");
  }

  const { error } = await supabase.from("parents").delete().eq("id", id);
  if (error) throw new Error(error.message || "Failed to delete parent");

  const local = readStorage<{id:string}[]>(PARENTS_KEY, []);
  writeStorage(PARENTS_KEY, local.filter((p) => p.id !== id));

  return true;
}

