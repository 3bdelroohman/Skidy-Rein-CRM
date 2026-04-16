import { createBrowserClient } from "@supabase/ssr";
import type { CommChannel, FollowUpType, LeadStage, Priority } from "@/types/common.types";
import type { Database } from "@/types/database.types";
import type { CreateFollowUpInput, FollowUpItem, LeadActivityItem, LeadListItem } from "@/types/crm";
import { MOCK_FOLLOW_UPS } from "@/lib/mock-data";
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
type FollowUpRow = Database["public"]["Tables"]["follow_ups"]["Row"];
type LeadNameEntry = { childName: string; parentName: string };

/* ------------------------------------------------------------------ */
/*  Supabase helpers                                                   */
/* ------------------------------------------------------------------ */

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

function mockFollowUps(): FollowUpItem[] {
  return MOCK_FOLLOW_UPS.map((item) => ({ ...item }));
}

/* ------------------------------------------------------------------ */
/*  Value coercion helpers                                             */
/* ------------------------------------------------------------------ */

function _asString(value: unknown, fallback = ""): string {
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

/* ------------------------------------------------------------------ */
/*  Lead name resolution                                               */
/*  follow_ups has NO lead_name / parent_name columns.                 */
/*  We batch-fetch from leads to get child_name + parent_name.         */
/* ------------------------------------------------------------------ */

async function resolveLeadNames(
  rows: FollowUpRow[],
  supabase: ReturnType<typeof getSupabaseClient>,
): Promise<Map<string, LeadNameEntry>> {
  const map = new Map<string, LeadNameEntry>();
  if (!supabase) return map;

  const leadIds = [
    ...new Set(rows.map((r) => r.lead_id).filter((id): id is string => Boolean(id))),
  ];
  if (leadIds.length === 0) return map;

  try {
    const { data } = await supabase
      .from("leads")
      .select("id, child_name, parent_name")
      .in("id", leadIds);

    if (data) {
      for (const lead of data) {
        map.set(lead.id, {
          childName: lead.child_name ?? "",
          parentName: lead.parent_name ?? "",
        });
      }
    }
  } catch {
    // silent - mapRow will use fallbacks
  }

  return map;
}

/* ------------------------------------------------------------------ */
/*  Row mapping                                                        */
/*  Derives status from is_completed (boolean) - NOT from a phantom    */
/*  "status" column. Reads names from the resolved map.                */
/* ------------------------------------------------------------------ */

function mapRow(
  row: FollowUpRow,
  names?: Map<string, LeadNameEntry>,
): FollowUpItem {
  const scheduledAt = row.scheduled_at ?? new Date().toISOString();
  const isCompleted = row.is_completed === true;
  const leadEntry = row.lead_id ? names?.get(row.lead_id) : undefined;

  return {
    id: row.id ?? crypto.randomUUID(),
    leadId: row.lead_id ?? null,
    title: row.title || "\u0645\u062a\u0627\u0628\u0639\u0629",
    leadName: leadEntry?.childName || "\u0639\u0645\u064a\u0644 \u063a\u064a\u0631 \u0645\u062d\u062f\u062f",
    parentName: leadEntry?.parentName || "\u0648\u0644\u064a \u0623\u0645\u0631 \u063a\u064a\u0631 \u0645\u062d\u062f\u062f",
    type: asType(row.type),
    channel: asChannel(row.channel),
    priority: asPriority(row.priority),
    scheduledAt,
    status: isCompleted ? "completed" : resolveOpenStatus(scheduledAt),
    assignedTo: row.assigned_to ?? "\u063a\u064a\u0631 \u0645\u062e\u0635\u0635",
  };
}

/* ------------------------------------------------------------------ */
/*  Local storage helpers                                              */
/* ------------------------------------------------------------------ */

function getLocalFollowUps(): FollowUpItem[] {
  const seed = shouldUseDemoFallback() ? mockFollowUps() : ([] as FollowUpItem[]);
  return sortByDateAsc(readStorage(FOLLOW_UPS_KEY, seed), (item) => item.scheduledAt);
}

function saveLocalFollowUps(items: FollowUpItem[]): void {
  writeStorage(FOLLOW_UPS_KEY, sortByDateAsc(items, (item) => item.scheduledAt));
}

function clearLocalFollowUps(): void {
  writeStorage(FOLLOW_UPS_KEY, []);
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

/* ------------------------------------------------------------------ */
/*  Activity helper                                                    */
/*  lead_activities has NO "type" column - stored in metadata (jsonb)  */
/*  created_at is auto-generated - do NOT send it                      */
/* ------------------------------------------------------------------ */

function createLeadActivity(
  leadId: string | null | undefined,
  action: string,
  by: string,
  type: LeadActivityItem["type"],
): LeadActivityItem | null {
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
      metadata: { type: activity.type, actor_name: by },
    });
  }

  return activity;
}

/* ------------------------------------------------------------------ */
/*  Lead sync helpers                                                  */
/* ------------------------------------------------------------------ */

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

/* ------------------------------------------------------------------ */
/*  List all follow-ups                                                */
/* ------------------------------------------------------------------ */

export async function listFollowUps(): Promise<FollowUpItem[]> {
  const demoFallback = shouldUseDemoFallback() ? getLocalFollowUps() : [];
  const supabase = getSupabaseClient();
  if (!supabase) return demoFallback;

  try {
    const { data, error } = await supabase
      .from("follow_ups")
      .select("*")
      .order("scheduled_at", { ascending: true });

    if (error) {
      console.error("[follow-ups] failed to load from Supabase", error);
      clearLocalFollowUps();
      return [];
    }

    if (!data || data.length === 0) {
      clearLocalFollowUps();
      return [];
    }

    const names = await resolveLeadNames(data, supabase);
    const mapped = data.map((row) => mapRow(row, names));
    saveLocalFollowUps(mapped);
    return mapped;
  } catch (error) {
    console.error("[follow-ups] unexpected load failure", error);
    clearLocalFollowUps();
    return [];
  }
}

/* ------------------------------------------------------------------ */
/*  List follow-ups by lead                                            */
/* ------------------------------------------------------------------ */

export async function listFollowUpsByLead(leadId: string): Promise<FollowUpItem[]> {
  const demoFallback = shouldUseDemoFallback() ? getLocalFollowUps().filter((item) => item.leadId === leadId) : [];
  const supabase = getSupabaseClient();
  if (!supabase) return demoFallback;

  try {
    const { data, error } = await supabase
      .from("follow_ups")
      .select("*")
      .eq("lead_id", leadId)
      .order("scheduled_at", { ascending: true });

    if (error) {
      console.error("[follow-ups] failed to load lead follow-ups", error);
      const rest = getLocalFollowUps().filter((item) => item.leadId !== leadId);
      saveLocalFollowUps(rest);
      return [];
    }

    if (!data || data.length === 0) {
      const rest = getLocalFollowUps().filter((item) => item.leadId !== leadId);
      saveLocalFollowUps(rest);
      return [];
    }

    const names = await resolveLeadNames(data, supabase);
    const mapped = data.map((row) => mapRow(row, names));
    const rest = getLocalFollowUps().filter((item) => item.leadId !== leadId);
    saveLocalFollowUps([...rest, ...mapped]);
    return mapped;
  } catch (error) {
    console.error("[follow-ups] unexpected lead follow-ups failure", error);
    return [];
  }
}

/* ------------------------------------------------------------------ */
/*  Create follow-up                                                   */
/*  REMOVED ghost columns: lead_name, status                           */
/*  ADDED: is_completed (real boolean column)                          */
/* ------------------------------------------------------------------ */

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

  const typeLabel = item.type === "trial_reminder"
    ? "\u062a\u0630\u0643\u064a\u0631 \u0628\u0627\u0644\u0633\u064a\u0634\u0646 \u0627\u0644\u062a\u062c\u0631\u064a\u0628\u064a\u0629"
    : item.title;
  createLeadActivity(
    item.leadId,
    "\u062a\u0645 \u0625\u0646\u0634\u0627\u0621 \u0645\u062a\u0627\u0628\u0639\u0629 \u062c\u062f\u064a\u062f\u0629: " + typeLabel,
    item.assignedTo,
    "contact",
  );
  await syncLeadNextFollowUp(item.leadId, next);

  const supabase = getSupabaseClient();
  if (!supabase) {
    if (shouldUseDemoFallback()) return item;
    throw new Error("Supabase client is not available");
  }

  try {
    const { data, error } = await supabase
      .from("follow_ups")
      .insert({
        lead_id: item.leadId,
        title: item.title,
        type: item.type,
        channel: item.channel,
        priority: item.priority,
        scheduled_at: item.scheduledAt,
        is_completed: false,
        assigned_to: item.assignedTo,
      })
      .select("*")
      .maybeSingle();

    if (!error && data) {
      const names = new Map<string, LeadNameEntry>();
      if (data.lead_id) {
        names.set(data.lead_id, {
          childName: item.leadName,
          parentName: item.parentName,
        });
      }
      const synced = mapRow(data, names);
      const merged = getLocalFollowUps().map((existing) =>
        existing.id === item.id ? synced : existing,
      );
      saveLocalFollowUps(merged);
      await syncLeadNextFollowUp(item.leadId, merged);
      return synced;
    }
  } catch (error) {
    console.error("[follow-ups] create failed", error);
    if (shouldUseDemoFallback()) return item;
    throw error instanceof Error ? error : new Error("Failed to create follow-up");
  }

  return item;
}

/* ------------------------------------------------------------------ */
/*  Update follow-up status                                            */
/*  FIXED: uses is_completed + completed_at                            */
/*  instead of ghost "status" column                                   */
/* ------------------------------------------------------------------ */

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
      ? "\u062a\u0645 \u0625\u0646\u0647\u0627\u0621 \u0645\u062a\u0627\u0628\u0639\u0629 " + updated.title
      : "\u062a\u0645\u062a \u0625\u0639\u0627\u062f\u0629 \u0641\u062a\u062d \u0645\u062a\u0627\u0628\u0639\u0629 " + updated.title;
    createLeadActivity(
      updated.leadId,
      action,
      updated.assignedTo,
      nextStatus === "completed" ? "contact" : "note",
    );
  }

  await syncLeadNextFollowUp(updated.leadId, merged);

  const supabase = getSupabaseClient();
  if (!supabase) {
    if (shouldUseDemoFallback()) return updated;
    throw new Error("Supabase client is not available");
  }

  try {
    await supabase
      .from("follow_ups")
      .update({
        is_completed: nextStatus === "completed",
        completed_at: nextStatus === "completed" ? new Date().toISOString() : null,
      })
      .eq("id", id);
  } catch (error) {
    console.error("[follow-ups] status update failed", error);
    if (shouldUseDemoFallback()) return updated;
    throw error instanceof Error ? error : new Error("Failed to update follow-up status");
  }

  return updated;
}

export async function markFollowUpCompleted(id: string): Promise<FollowUpItem | null> {
  return updateFollowUpStatus(id, "completed");
}

export async function reopenFollowUp(id: string): Promise<FollowUpItem | null> {
  return updateFollowUpStatus(id, "pending");
}

/* ------------------------------------------------------------------ */
/*  Stage-based suggestions                                            */
/* ------------------------------------------------------------------ */

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
      return "\u0623\u0648\u0644 \u062a\u0648\u0627\u0635\u0644 \u2013 " + childName;
    case "qualified":
      return "\u0627\u0633\u062a\u0643\u0645\u0627\u0644 \u0627\u0644\u062a\u0623\u0647\u064a\u0644 \u2013 " + childName;
    case "trial_proposed":
      return "\u062a\u0623\u0643\u064a\u062f \u0645\u0648\u0639\u062f \u0627\u0644\u0633\u064a\u0634\u0646 \u2013 " + childName;
    case "trial_booked":
      return "\u062a\u0630\u0643\u064a\u0631 \u0628\u0627\u0644\u0633\u064a\u0634\u0646 \u2013 " + childName;
    case "trial_attended":
      return "\u0645\u062a\u0627\u0628\u0639\u0629 \u0628\u0639\u062f \u0627\u0644\u0633\u064a\u0634\u0646 \u2013 " + childName;
    case "offer_sent":
      return "\u0645\u062a\u0627\u0628\u0639\u0629 \u0627\u0644\u0639\u0631\u0636 \u2013 " + childName;
    case "lost":
      return "\u0625\u0639\u0627\u062f\u0629 \u062a\u0648\u0627\u0635\u0644 \u2013 " + childName;
    default:
      return "\u0645\u062a\u0627\u0628\u0639\u0629 \u0627\u0644\u062f\u0641\u0639 \u2013 " + childName;
  }
}