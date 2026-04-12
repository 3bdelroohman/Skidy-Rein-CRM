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
    fullName: asString(record.full_name ?? record.fullName, "ولي أمر غير محدد"),
    phone: asString(record.phone, "—"),
    whatsapp: asNullableString(record.whatsapp),
    email: asNullableString(record.email),
    city: asNullableString(record.city),
    childrenCount: asNumber(record.children_count ?? record.childrenCount, 0),
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
    throw new Error("اسم ولي الأمر ورقم الهاتف مطلوبان.");
  }

  const supabase = getSupabaseClient();
  if (!supabase) {
    throw new Error("تعذر الاتصال بقاعدة البيانات. تأكد من إعدادات Supabase ثم أعد المحاولة.");
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
    children_count: input.childrenCount ?? 0,
    created_at: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from("parents")
    .insert(payload)
    .select("*")
    .single();

  if (error || !data) {
    console.error("[parents] create failed", error);
    throw new Error(error?.message || "تعذر إنشاء سجل ولي الأمر.");
  }

  const created = mapRow(data);
  saveLocalParents([created, ...getLocalParents().filter((item) => item.id !== created.id)]);
  return created;
}
