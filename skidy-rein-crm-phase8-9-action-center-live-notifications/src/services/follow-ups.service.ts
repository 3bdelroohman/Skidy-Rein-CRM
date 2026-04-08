import { createBrowserClient } from "@supabase/ssr";
import type { CommChannel, FollowUpType, LeadStage, Priority } from "@/types/common.types";
import type { Database } from "@/types/database.types";
import type { CreateFollowUpInput, FollowUpItem, LeadActivityItem, LeadListItem } from "@/types/crm";
import { MOCK_FOLLOW_UPS } from "@/lib/mock-data";
import { STAGE_LABELS } from "@/config/labels";
import { isBrowser, readStorage, sortByDateAsc, sortByDateDesc, writeStorage } from "@/services/storage";

const FOLLOW_UPS_KEY = "skidy.crm.follow-ups";
const LEADS_KEY = "skidy.crm.leads";
const ACTIVITIES_KEY = "skidy.crm.lead-activities";
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

function getLocalLeads(): LeadListItem[] {
  return sortByDateDesc(readStorage(LEADS_KEY, [] as LeadListItem[]), (lead) => lead.createdAt);
}

function saveLocalLeads(leads: LeadListItem[]): void {
  writeStorage(LEADS_KEY, sortByDateDesc(leads, (lead) => lead.createdAt));
}

function getLocalActivities(): LeadActivityItem[] {
  return sortByDateDesc(readStorage(ACTIVITIES_KEY, [] as LeadActivityItem[]), (activity) => activity.date);
}

function saveLocalActivities(activities: LeadActivityItem[]): void {
  writeStorage(ACTIVITIES_KEY, sortByDateDesc(activities, (activity) => activity.date));
}

function createLeadActivity(leadId: string | null | undefined, action: string, by: string, type: LeadActivityItem["type"]): LeadActivityItem | null {
  if (!leadId) return null;

  const activity: LeadActivityItem = {
    id: crypto.randomUUID(),
    leadId,
    action,
    by,
    type,
    date: new Date().toISOString(),
  };

  saveLocalActivities([activity, ...getLocalActivities()]);

  const supabase = getSupabaseClient();
  if (supabase) {
    void supabase.from("lead_activities").insert({
      lead_id: leadId,
      action: activity.action,
      by_name: activity.by,
      type: activity.type,
      created_at: activity.date,
    });
  }

  return activity;
}

function deriveNextFollowUpAt(leadId: string | null | undefined, items: FollowUpItem[]): string | null {
  if (!leadId) return null;
  const next = items
    .filter((item) => item.leadId === leadId && item.status !== "completed")
    .sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime())[0];
  return next?.scheduledAt ?? null;
}

async function syncLeadNextFollowUp(leadId: string | null | undefined, items: FollowUpItem[]): Promise<void> {
  if (!leadId) return;

  const leads = getLocalLeads();
  const existing = leads.find((lead) => lead.id === leadId);
  if (!existing) return;

  const nextFollowUpAt = deriveNextFollowUpAt(leadId, items);
  const updatedLead: LeadListItem = {
    ...existing,
    nextFollowUpAt,
    lastContactAt: existing.lastContactAt ?? new Date().toISOString(),
  };

  saveLocalLeads(leads.map((lead) => (lead.id === leadId ? updatedLead : lead)));

  const supabase = getSupabaseClient();
  if (!supabase) return;

  await supabase
    .from("leads")
    .update({
      next_follow_up_at: nextFollowUpAt,
      last_contact_at: updatedLead.lastContactAt,
    })
    .eq("id", leadId);
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

export async function listFollowUpsByLead(leadId: string): Promise<FollowUpItem[]> {
  const fallback = getLocalFollowUps().filter((item) => item.leadId === leadId);
  const supabase = getSupabaseClient();
  if (!supabase) return fallback;

  try {
    const { data, error } = await supabase
      .from("follow_ups")
      .select("*")
      .eq("lead_id", leadId)
      .order("scheduled_at", { ascending: true });

    if (error || !data) return fallback;

    const mapped = data.map((row: Database["public"]["Tables"]["follow_ups"]["Row"]) => mapRow(row));
    const rest = getLocalFollowUps().filter((item) => item.leadId !== leadId);
    saveLocalFollowUps([...rest, ...mapped]);
    return mapped;
  } catch {
    return fallback;
  }
}

export async function createFollowUp(input: CreateFollowUpInput): Promise<FollowUpItem> {
  const scheduledAt = input.scheduledAt;
  const item: FollowUpItem = {
    id: crypto.randomUUID(),
    leadId: input.leadId ?? null,
    leadName: input.leadName,
    parentName: input.parentName,
    title: input.title,
    type: input.type,
    channel: input.channel,
    priority: input.priority,
    scheduledAt,
    status: resolveOpenStatus(scheduledAt),
    assignedTo: input.assignedTo,
  };

  const current = getLocalFollowUps();
  const next = [...current, item];
  saveLocalFollowUps(next);

  const typeLabel = item.type === "trial_reminder" ? "تذكير بالسيشن التجريبية" : item.title;
  createLeadActivity(item.leadId, `تم إنشاء متابعة جديدة: ${typeLabel}`, item.assignedTo, "contact");
  await syncLeadNextFollowUp(item.leadId, next);

  const supabase = getSupabaseClient();
  if (!supabase) return item;

  try {
    const { data, error } = await supabase
      .from("follow_ups")
      .insert({
        lead_id: item.leadId,
        title: item.title,
        lead_name: item.leadName,
        parent_name: item.parentName,
        type: item.type,
        channel: item.channel,
        priority: item.priority,
        scheduled_at: item.scheduledAt,
        status: item.status,
        assigned_to: item.assignedTo,
      })
      .select("*")
      .maybeSingle();

    if (!error && data) {
      const synced = mapRow(data);
      const merged = getLocalFollowUps().map((existing) => (existing.id === item.id ? synced : existing));
      saveLocalFollowUps(merged);
      await syncLeadNextFollowUp(item.leadId, merged);
      return synced;
    }
  } catch {
    // local fallback remains active
  }

  return item;
}

async function updateFollowUpStatus(
  id: string,
  status: FollowUpItem["status"],
): Promise<FollowUpItem | null> {
  const current = getLocalFollowUps();
  const existing = current.find((item) => item.id === id);
  if (!existing) return null;

  const nextStatus = status === "completed" ? "completed" : resolveOpenStatus(existing.scheduledAt);
  const updated: FollowUpItem = { ...existing, status: nextStatus };
  const merged = current.map((item) => (item.id === id ? updated : item));
  saveLocalFollowUps(merged);

  if (updated.leadId) {
    const action = nextStatus === "completed"
      ? `تم إنهاء متابعة ${updated.title}`
      : `تمت إعادة فتح متابعة ${updated.title}`;
    createLeadActivity(updated.leadId, action, updated.assignedTo, nextStatus === "completed" ? "contact" : "note");
  }

  await syncLeadNextFollowUp(updated.leadId, merged);

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

export function suggestFollowUpTypeByStage(stage: LeadStage): FollowUpType {
  switch (stage) {
    case "new":
      return "first_contact";
    case "qualified":
      return "qualification";
    case "trial_proposed":
    case "trial_booked":
      return "trial_reminder";
    case "trial_attended":
      return "post_trial";
    case "offer_sent":
      return "closing";
    case "lost":
      return "re_engagement";
    default:
      return "payment_reminder";
  }
}

export function suggestFollowUpTitle(stage: LeadStage, childName: string): string {
  switch (stage) {
    case "new":
      return `أول تواصل — ${childName}`;
    case "qualified":
      return `استكمال التأهيل — ${childName}`;
    case "trial_proposed":
      return `تأكيد موعد السيشن — ${childName}`;
    case "trial_booked":
      return `تذكير بالسيشن — ${childName}`;
    case "trial_attended":
      return `متابعة بعد السيشن — ${childName}`;
    case "offer_sent":
      return `متابعة العرض — ${childName}`;
    case "lost":
      return `إعادة تواصل — ${childName}`;
    default:
      return `متابعة الدفع — ${childName}`;
  }
}
