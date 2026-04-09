import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@/types/database.types";
import type { ParentListItem } from "@/types/crm";
import { MOCK_PARENTS } from "@/lib/mock-data";
import { isBrowser, readStorage, writeStorage } from "@/services/storage";

const PARENTS_KEY = "skidy.crm.parents";

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

function sortParents(items: ParentListItem[]): ParentListItem[] {
  return [...items].sort((a, b) => a.fullName.localeCompare(b.fullName, "ar"));
}

function mockParents(): ParentListItem[] {
  return MOCK_PARENTS.map((parent) => ({ ...parent }));
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

function mapRow(
  row: Database["public"]["Tables"]["parents"]["Row"] | Record<string, unknown>,
): ParentListItem {
  const record = row as Record<string, unknown>;
  const fallback = MOCK_PARENTS.find(
    (parent) =>
      parent.fullName === asString(record.full_name) ||
      parent.phone === asString(record.phone),
  );

  return {
    id: asString(record.id, crypto.randomUUID()),
    fullName: asString(record.full_name ?? record.fullName, "ولي أمر غير محدد"),
    phone: asString(record.phone, "—"),
    whatsapp: asNullableString(record.whatsapp) ?? fallback?.whatsapp ?? null,
    email: asNullableString(record.email) ?? fallback?.email ?? null,
    city: asNullableString(record.city) ?? fallback?.city ?? null,
    childrenCount: asNumber(record.children_count ?? record.childrenCount, fallback?.childrenCount ?? 0),
    children: fallback?.children ?? [],
  };
}

function getLocalParents(): ParentListItem[] {
  const seed = shouldUseDemoFallback() ? mockParents() : ([] as ParentListItem[]);
  return sortParents(readStorage(PARENTS_KEY, seed));
}

function saveLocalParents(items: ParentListItem[]): void {
  writeStorage(PARENTS_KEY, sortParents(items));
}

function clearLocalParents(): void {
  writeStorage(PARENTS_KEY, []);
}

export async function listParents(): Promise<ParentListItem[]> {
  const demoFallback = shouldUseDemoFallback() ? getLocalParents() : [];
  const supabase = getSupabaseClient();
  if (!supabase) return demoFallback;

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
