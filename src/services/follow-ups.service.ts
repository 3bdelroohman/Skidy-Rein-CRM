import { createBrowserClient } from "@supabase/ssr";
import type { CommChannel, FollowUpType, Priority } from "@/types/common.types";
import type { Database } from "@/types/database.types";
import type { FollowUpItem } from "@/types/crm";
import { MOCK_FOLLOW_UPS } from "@/lib/mock-data";
import { isBrowser, readStorage, sortByDateAsc, writeStorage } from "@/services/storage";

const FOLLOW_UPS_KEY = "skidy.crm.follow-ups";
const VALID_TYPES: FollowUpType[] = [
  "first_contact",
  "qualification",
  "trial_reminder",
  "post_trial",
  "no_show",
  "closing",
  "payment_reminder",
  "re_engagement",
];
const VALID_CHANNELS: CommChannel[] = ["whatsapp", "email", "call", "sms"];
const VALID_PRIORITIES: Priority[] = ["low", "medium", "high", "urgent"];

type FollowUpOpenStatus = Exclude<FollowUpItem["status"], "completed">;

function getSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key || !isBrowser()) return null;
  return createBrowserClient<Database>(url, key);
}

function mockFollowUps(): FollowUpItem[] {
  return MOCK_FOLLOW_UPS.map((item) => ({ ...item }));
}

function asString(value: unknown, fallback = ""): string {
  return typeof value === "string" && value.trim().length > 0 ? value : fallback;
}

function asType(value: unknown): FollowUpType {
  return VALID_TYPES.includes(value as FollowUpType) ? (value as FollowUpType) : "first_contact";
}

function asChannel(value: unknown): CommChannel {
  return VALID_CHANNELS.includes(value as CommChannel) ? (value as CommChannel) : "whatsapp";
}

function asPriority(value: unknown): Priority {
  return VALID_PRIORITIES.includes(value as Priority) ? (value as Priority) : "medium";
}

function resolveOpenStatus(scheduledAt: string): FollowUpOpenStatus {
  const timestamp = new Date(scheduledAt).getTime();
  return timestamp < Date.now() ? "overdue" : "pending";
}

function asStatus(value: unknown, scheduledAt: string): FollowUpItem["status"] {
  if (value === "completed") return "completed";
  return value === "overdue" ? "overdue" : resolveOpenStatus(scheduledAt);
}

function mapRow(row: Database["public"]["Tables"]["follow_ups"]["Row"] | Record<string, unknown>): FollowUpItem {
  const record = row as Record<string, unknown>;
  const scheduledAt = asString(record.scheduled_at ?? record.scheduledAt, new Date().toISOString());
  return {
    id: asString(record.id, crypto.randomUUID()),
    leadId: typeof record.lead_id === "string" ? record.lead_id : null,
    title: asString(record.title, "متابعة"),
    leadName: asString(record.lead_name ?? record.leadName, "عميل غير محدد"),
    parentName: asString(record.parent_name ?? record.parentName, "ولي أمر غير محدد"),
    type: asType(record.type),
    channel: asChannel(record.channel),
    priority: asPriority(record.priority),
    scheduledAt,
    status: asStatus(record.status, scheduledAt),
    assignedTo: asString(record.assigned_to ?? record.assignedTo, "غير مخصص"),
  };
}

function getLocalFollowUps(): FollowUpItem[] {
  return sortByDateAsc(readStorage(FOLLOW_UPS_KEY, mockFollowUps()), (item) => item.scheduledAt);
}

function saveLocalFollowUps(items: FollowUpItem[]): void {
  writeStorage(FOLLOW_UPS_KEY, sortByDateAsc(items, (item) => item.scheduledAt));
}

export async function listFollowUps(): Promise<FollowUpItem[]> {
  const fallback = getLocalFollowUps();
  const supabase = getSupabaseClient();
  if (!supabase) return fallback;

  try {
    const { data, error } = await supabase
      .from("follow_ups")
      .select("*")
      .order("scheduled_at", { ascending: true });

    if (error || !data || data.length === 0) return fallback;

    const mapped = data.map((row: Database["public"]["Tables"]["follow_ups"]["Row"]) => mapRow(row));
    saveLocalFollowUps(mapped);
    return mapped;
  } catch {
    return fallback;
  }
}

export async function updateFollowUpStatus(
  id: string,
  status: FollowUpItem["status"],
): Promise<FollowUpItem | null> {
  const current = getLocalFollowUps();
  const existing = current.find((item) => item.id === id);
  if (!existing) return null;

  const nextStatus = status === "completed" ? "completed" : resolveOpenStatus(existing.scheduledAt);
  const updated: FollowUpItem = { ...existing, status: nextStatus };
  saveLocalFollowUps(current.map((item) => (item.id === id ? updated : item)));

  const supabase = getSupabaseClient();
  if (!supabase) return updated;

  try {
    await supabase
      .from("follow_ups")
      .update({
        status: nextStatus,
        completed_at: nextStatus === "completed" ? new Date().toISOString() : null,
      })
      .eq("id", id);
  } catch {
    // local state remains source of truth in fallback mode
  }

  return updated;
}

export async function markFollowUpCompleted(id: string): Promise<FollowUpItem | null> {
  return updateFollowUpStatus(id, "completed");
}

export async function reopenFollowUp(id: string): Promise<FollowUpItem | null> {
  return updateFollowUpStatus(id, "pending");
}
