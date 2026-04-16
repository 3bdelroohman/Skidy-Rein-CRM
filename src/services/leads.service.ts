import { createBrowserClient } from "@supabase/ssr";
import { STAGE_LABELS } from "@/config/labels";
import type { LeadStage, LeadTemperature, LossReason } from "@/types/common.types";
import type { Database } from "@/types/database.types";
import type {
  CreateLeadInput,
  LeadActivityItem,
  LeadListItem,
  UpdateLeadInput,
} from "@/types/crm";
import { MOCK_LEADS, MOCK_LEAD_ACTIVITIES, MOCK_TEAM } from "@/lib/mock-data";
import { isBrowser, readStorage, sortByDateDesc, writeStorage } from "@/services/storage";
import { ensureLeadEnrollment } from "./enrollment.service";

const LEADS_KEY = "skidy.crm.leads";
const ACTIVITIES_KEY = "skidy.crm.lead-activities";

const VALID_STAGES: LeadStage[] = [
  "new",
  "qualified",
  "trial_proposed",
  "trial_booked",
  "trial_attended",
  "offer_sent",
  "won",
  "lost",
];

const VALID_TEMPERATURES: LeadTemperature[] = ["hot", "warm", "cold"];
const VALID_LOSS_REASONS: LossReason[] = [
  "price",
  "wants_offline",
  "no_laptop",
  "age_mismatch",
  "no_response",
  "exams_deferred",
  "not_convinced_online",
  "chose_competitor",
  "other",
];

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

function mockLeads(): LeadListItem[] {
  return MOCK_LEADS.map((lead) => ({ ...lead }));
}

function mockActivities(): LeadActivityItem[] {
  return MOCK_LEAD_ACTIVITIES.map((activity) => ({ ...activity }));
}

function getLocalLeads(): LeadListItem[] {
  const seed = shouldUseDemoFallback() ? mockLeads() : ([] as LeadListItem[]);
  return sortByDateDesc(readStorage(LEADS_KEY, seed), (lead) => lead.createdAt);
}

function saveLocalLeads(leads: LeadListItem[]): void {
  writeStorage(LEADS_KEY, sortByDateDesc(leads, (lead) => lead.createdAt));
}

function clearLocalLeads(): void {
  writeStorage(LEADS_KEY, []);
}

function getLocalActivities(): LeadActivityItem[] {
  const seed = shouldUseDemoFallback() ? mockActivities() : ([] as LeadActivityItem[]);
  return sortByDateDesc(readStorage(ACTIVITIES_KEY, seed), (activity) => activity.date);
}

function saveLocalActivities(activities: LeadActivityItem[]): void {
  writeStorage(ACTIVITIES_KEY, sortByDateDesc(activities, (activity) => activity.date));
}

function clearLocalActivities(): void {
  writeStorage(ACTIVITIES_KEY, []);
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

function asStage(value: unknown): LeadStage {
  return VALID_STAGES.includes(value as LeadStage) ? (value as LeadStage) : "new";
}

function asTemperature(value: unknown): LeadTemperature {
  return VALID_TEMPERATURES.includes(value as LeadTemperature)
    ? (value as LeadTemperature)
    : "warm";
}

function asLossReason(value: unknown): LossReason | null {
  return VALID_LOSS_REASONS.includes(value as LossReason)
    ? (value as LossReason)
    : null;
}

function isUuid(value: string | null | undefined): value is string {
  return typeof value === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

async function resolveAssignedToUuid(preferred: string): Promise<string | null> {
  const supabase = getSupabaseClient();
  if (!supabase) return isUuid(preferred) ? preferred : null;

  if (isUuid(preferred)) return preferred;

  try {
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error || !user?.id || !isUuid(user.id)) return null;
    return user.id;
  } catch {
    return null;
  }
}

function mapLeadRow(row: Database["public"]["Tables"]["leads"]["Row"] | Record<string, unknown>): LeadListItem {
  const record = row as Record<string, unknown>;
  return {
    id: asString(record.id, crypto.randomUUID()),
    parentName: asString(record.parent_name ?? record.parentName, "\u0648\u0644\u064a \u0623\u0645\u0631 \u063a\u064a\u0631 \u0645\u062d\u062f\u062f"),
    parentPhone: asString(record.parent_phone ?? record.parentPhone, "\u2013"),
    childName: asString(record.child_name ?? record.childName, "\u0637\u0641\u0644 \u0628\u062f\u0648\u0646 \u0627\u0633\u0645"),
    childAge: asNumber(record.child_age ?? record.childAge, 0),
    stage: asStage(record.stage),
    temperature: asTemperature(record.temperature),
    source: asString(record.source, "other") as LeadListItem["source"],
    suggestedCourse: asNullableString(record.suggested_course ?? record.suggestedCourse) as LeadListItem["suggestedCourse"],
    assignedTo: asString(record.assigned_to ?? record.assignedTo, ""),
    assignedToName: asString(record.assignedToName, "\u063a\u064a\u0631 \u0645\u062e\u0635\u0635"),
    lastContactAt: asNullableString(record.last_contact_at ?? record.lastContactAt),
    nextFollowUpAt: asNullableString(record.next_follow_up_at ?? record.nextFollowUpAt),
    notes: asNullableString(record.notes),
    createdAt: asString(record.created_at ?? record.createdAt, new Date().toISOString()),
    lossReason: asLossReason(record.loss_reason ?? record.lossReason),
  };
}

function mapActivityRow(row: Database["public"]["Tables"]["lead_activities"]["Row"] | Record<string, unknown>): LeadActivityItem {
  const record = row as Record<string, unknown>;
  const meta = (typeof record.metadata === "object" && record.metadata !== null ? record.metadata : {}) as Record<string, unknown>;
  const activityType = asString(meta.type ?? record.type, "");
  return {
    id: asString(record.id, crypto.randomUUID()),
    leadId: asString(record.lead_id ?? record.leadId),
    action: asString(record.action ?? record.description, "\u062a\u062d\u062f\u064a\u062b \u0639\u0644\u0649 \u0627\u0644\u0639\u0645\u064a\u0644"),
    date: asString(record.created_at ?? record.date, new Date().toISOString()),
    by: asString(meta.actor_name ?? record.performed_by ?? record.by, "\u0627\u0644\u0646\u0638\u0627\u0645"),
    type: (["create", "contact", "stage", "note"] as const).includes(activityType as LeadActivityItem["type"])
      ? (activityType as LeadActivityItem["type"])
      : "note",
  };
}

async function syncLeadsFromSupabase(): Promise<LeadListItem[] | null> {
  const supabase = getSupabaseClient();
  if (!supabase) return null;

  const { data, error } = await supabase.from("leads").select("*").order("created_at", { ascending: false });
  if (error) {
    console.error("[leads] failed to load from Supabase", error);
    clearLocalLeads();
    return [];
  }

  if (!data || data.length === 0) {
    clearLocalLeads();
    return [];
  }

  const mapped = data.map((row: Database["public"]["Tables"]["leads"]["Row"]) => mapLeadRow(row));
  saveLocalLeads(mapped);
  return mapped;
}

async function syncActivitiesFromSupabase(leadId: string): Promise<LeadActivityItem[] | null> {
  const supabase = getSupabaseClient();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from("lead_activities")
    .select("*")
    .eq("lead_id", leadId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[lead_activities] failed to load from Supabase", error);
    const existing = getLocalActivities().filter((activity) => activity.leadId !== leadId);
    saveLocalActivities(existing);
    return [];
  }

  if (!data || data.length === 0) {
    const existing = getLocalActivities().filter((activity) => activity.leadId !== leadId);
    saveLocalActivities(existing);
    return [];
  }

  const mapped = data.map((row: Database["public"]["Tables"]["lead_activities"]["Row"]) => mapActivityRow(row));
  const existing = getLocalActivities().filter((activity) => activity.leadId !== leadId);
  saveLocalActivities([...existing, ...mapped]);
  return mapped;
}

export async function listLeads(): Promise<LeadListItem[]> {
  const demoFallback = shouldUseDemoFallback() ? getLocalLeads() : [];
  try {
    return (await syncLeadsFromSupabase()) ?? demoFallback;
  } catch (error) {
    console.error("[leads] unexpected load failure", error);
    clearLocalLeads();
    return [];
  }
}

export async function getLeadById(id: string): Promise<LeadListItem | null> {
  const local = getLocalLeads().find((lead) => lead.id === id);
  if (local) return local;

  const supabase = getSupabaseClient();
  if (!supabase) return null;

  try {
    const { data, error } = await supabase.from("leads").select("*").eq("id", id).maybeSingle();
    if (error || !data) return null;
    const mapped = mapLeadRow(data);
    const next = [mapped, ...getLocalLeads().filter((lead) => lead.id !== id)];
    saveLocalLeads(next);
    return mapped;
  } catch {
    return null;
  }
}

export async function listLeadActivities(leadId: string): Promise<LeadActivityItem[]> {
  const demoFallback = shouldUseDemoFallback() ? getLocalActivities().filter((activity) => activity.leadId === leadId) : [];
  try {
    return (await syncActivitiesFromSupabase(leadId)) ?? demoFallback;
  } catch (error) {
    console.error("[lead_activities] unexpected load failure", error);
    return [];
  }
}

export async function createLead(input: CreateLeadInput): Promise<LeadListItem> {
  const createdAt = new Date().toISOString();
  const draftLead: LeadListItem = {
    id: crypto.randomUUID(),
    childName: input.childName,
    childAge: input.childAge,
    parentName: input.parentName,
    parentPhone: input.parentPhone,
    stage: "new",
    temperature: input.temperature,
    source: input.source,
    suggestedCourse: input.suggestedCourse,
    assignedTo: input.assignedTo,
    assignedToName:
      input.assignedToName ||
      MOCK_TEAM.find((member) => member.id === input.assignedTo)?.name ||
      "\u063a\u064a\u0631 \u0645\u062e\u0635\u0635",
    lastContactAt: null,
    nextFollowUpAt: null,
    notes: input.notes ?? null,
    createdAt,
    lossReason: null,
  };

  const supabase = getSupabaseClient();

  if (!supabase) {
    if (!shouldUseDemoFallback()) {
      throw new Error("\u062a\u0639\u0630\u0631 \u0627\u0644\u0627\u062a\u0635\u0627\u0644 \u0628\u0642\u0627\u0639\u062f\u0629 \u0627\u0644\u0628\u064a\u0627\u0646\u0627\u062a. \u0623\u0639\u062f \u0627\u0644\u0645\u062d\u0627\u0648\u0644\u0629 \u0628\u0639\u062f \u062a\u0633\u062c\u064a\u0644 \u0627\u0644\u062f\u062e\u0648\u0644 \u0623\u0648 \u0627\u0644\u062a\u062d\u0642\u0642 \u0645\u0646 \u0627\u0644\u0625\u0639\u062f\u0627\u062f\u0627\u062a.");
    }

    const current = getLocalLeads();
    saveLocalLeads([draftLead, ...current]);

    const demoActivity: LeadActivityItem = {
      id: crypto.randomUUID(),
      leadId: draftLead.id,
      action: "\u062a\u0645 \u0625\u0646\u0634\u0627\u0621 \u0627\u0644\u0639\u0645\u064a\u0644 \u0627\u0644\u0645\u062d\u062a\u0645\u0644",
      date: createdAt,
      by: draftLead.assignedToName,
      type: "create",
    };
    saveLocalActivities([demoActivity, ...getLocalActivities()]);

    return draftLead;
  }

  try {
    const assignedToUuid = await resolveAssignedToUuid(input.assignedTo);
    if (!assignedToUuid) {
      throw new Error("\u062a\u0639\u0630\u0631 \u062a\u062d\u062f\u064a\u062f \u0627\u0644\u0645\u0633\u0624\u0648\u0644 \u0627\u0644\u0635\u062d\u064a\u062d \u0639\u0646 \u0627\u0644\u0639\u0645\u064a\u0644. \u062a\u0623\u0643\u062f \u0645\u0646 \u062a\u0633\u062c\u064a\u0644 \u0627\u0644\u062f\u062e\u0648\u0644 \u0623\u0648 \u0628\u064a\u0627\u0646\u0627\u062a \u0627\u0644\u0645\u0633\u0624\u0648\u0644.");
    }

    const insertPayload: Database["public"]["Tables"]["leads"]["Insert"] = {
      parent_name: draftLead.parentName,
      parent_phone: draftLead.parentPhone,
      parent_whatsapp: input.parentWhatsapp ?? null,
      child_name: draftLead.childName,
      child_age: draftLead.childAge,
      stage: draftLead.stage,
      temperature: draftLead.temperature,
      source: draftLead.source as Database["public"]["Enums"]["lead_source"],
      has_laptop: input.hasLaptop ?? false,
      has_prior_experience: input.hasPriorExperience ?? false,
      child_interests: input.childInterests ?? null,
      suggested_course: draftLead.suggestedCourse as Database["public"]["Enums"]["course_type"] | null,
      price_range_shared: false,
      whatsapp_collected: Boolean((input.parentWhatsapp ?? input.parentPhone).trim()),
      assigned_to: assignedToUuid,
      notes: draftLead.notes,
    };


    // --- Duplicate check ---
    const _normPhone = (insertPayload.parent_phone ?? "").replace(/\D/g, "").replace(/^20/, "");
    if (_normPhone.length >= 10 && insertPayload.child_name) {
      const { data: _existing } = await supabase
        .from("leads")
        .select("id, parent_phone, child_name, stage")
        .ilike("child_name", insertPayload.child_name)
        .limit(100);

      const _dup = (_existing ?? []).find((r) => {
        const rp = (r.parent_phone ?? "").replace(/\D/g, "").replace(/^20/, "");
        return rp === _normPhone;
      });

      if (_dup) {
        throw new Error(
          "\u064a\u0648\u062c\u062f \u0639\u0645\u064a\u0644 \u0645\u062d\u062a\u0645\u0644 \u0628\u0646\u0641\u0633 \u0631\u0642\u0645 \u0627\u0644\u0647\u0627\u062a\u0641 \u0648\u0627\u0633\u0645 \u0627\u0644\u0637\u0641\u0644 (ID: " + _dup.id.slice(0, 8) + ")"
        );
      }
    }
    // --- End duplicate check ---

    const { data, error } = await supabase
      .from("leads")
      .insert(insertPayload)
      .select("*")
      .single();

    if (error) {
      console.error("[leads] create failed", error);
      throw new Error(error.message || "\u062a\u0639\u0630\u0631 \u062d\u0641\u0638 \u0627\u0644\u0639\u0645\u064a\u0644 \u0641\u064a \u0642\u0627\u0639\u062f\u0629 \u0627\u0644\u0628\u064a\u0627\u0646\u0627\u062a");
    }

    if (!data) {
      throw new Error("\u062a\u0645 \u0625\u0631\u0633\u0627\u0644 \u0637\u0644\u0628 \u0627\u0644\u062d\u0641\u0638 \u0644\u0643\u0646 \u0644\u0645 \u064a\u0631\u062c\u0639 \u0623\u064a \u0633\u062c\u0644 \u0645\u0646 \u0642\u0627\u0639\u062f\u0629 \u0627\u0644\u0628\u064a\u0627\u0646\u0627\u062a");
    }

    const synced = mapLeadRow(data);
    const current = getLocalLeads().filter((item) => item.id !== synced.id);
    saveLocalLeads([{ ...synced, assignedToName: draftLead.assignedToName }, ...current]);

    const activityPayload: Database["public"]["Tables"]["lead_activities"]["Insert"] = {
      lead_id: synced.id,
      action: "\u062a\u0645 \u0625\u0646\u0634\u0627\u0621 \u0627\u0644\u0639\u0645\u064a\u0644 \u0627\u0644\u0645\u062d\u062a\u0645\u0644",
      metadata: { type: "create", actor_name: draftLead.assignedToName },
    };

    const { error: activityError } = await supabase.from("lead_activities").insert(activityPayload);
    if (activityError) {
      console.warn("[lead_activities] create activity failed", activityError);
    }

    return { ...synced, assignedToName: draftLead.assignedToName };
  } catch (error) {
    console.error("[leads] create failed", error);
    throw error instanceof Error ? error : new Error("\u062a\u0639\u0630\u0631 \u062d\u0641\u0638 \u0627\u0644\u0639\u0645\u064a\u0644");
  }
}

export async function updateLead(
  leadId: string,
  input: UpdateLeadInput,
  actorName = input.assignedToName || "\u0627\u0644\u0646\u0638\u0627\u0645",
): Promise<LeadListItem | null> {
  const current = getLocalLeads();
  const existing = current.find((lead) => lead.id === leadId);
  if (!existing) return null;

  const updated: LeadListItem = {
    ...existing,
    childName: input.childName,
    childAge: input.childAge,
    parentName: input.parentName,
    parentPhone: input.parentPhone,
    source: input.source,
    temperature: input.temperature,
    suggestedCourse: input.suggestedCourse,
    assignedTo: input.assignedTo,
    assignedToName: input.assignedToName,
    notes: input.notes ?? null,
    stage: input.stage ?? existing.stage,
    lossReason: input.lossReason ?? existing.lossReason ?? null,
    nextFollowUpAt: input.nextFollowUpAt ?? existing.nextFollowUpAt,
    lastContactAt: new Date().toISOString(),
  };

  saveLocalLeads(current.map((lead) => (lead.id === leadId ? updated : lead)));

  const activity: LeadActivityItem = {
    id: crypto.randomUUID(),
    leadId,
    action: "\u062a\u0645 \u062a\u062d\u062f\u064a\u062b \u0628\u064a\u0627\u0646\u0627\u062a \u0627\u0644\u0639\u0645\u064a\u0644",
    date: new Date().toISOString(),
    by: actorName,
    type: "note",
  };
  saveLocalActivities([activity, ...getLocalActivities()]);

  const supabase = getSupabaseClient();
  if (!supabase) {
    if (shouldUseDemoFallback()) return updated;
    throw new Error("Supabase client is not available");
  }

  try {
    const assignedToUuid = await resolveAssignedToUuid(updated.assignedTo);
    if (!assignedToUuid) {
      throw new Error("\u062a\u0639\u0630\u0631 \u062a\u062d\u062f\u064a\u062f \u0627\u0644\u0645\u0633\u0624\u0648\u0644 \u0627\u0644\u0635\u062d\u064a\u062d \u0639\u0646 \u0627\u0644\u0639\u0645\u064a\u0644.");
    }

    const { error: updateError } = await supabase
      .from("leads")
      .update({
        parent_name: updated.parentName,
        parent_phone: updated.parentPhone,
        child_name: updated.childName,
        child_age: updated.childAge,
        stage: updated.stage,
        temperature: updated.temperature,
        source: updated.source as Database["public"]["Enums"]["lead_source"],
        suggested_course: updated.suggestedCourse as Database["public"]["Enums"]["course_type"] | null,
        assigned_to: assignedToUuid,
        notes: updated.notes,
        loss_reason: updated.lossReason,
        next_follow_up_at: updated.nextFollowUpAt,
        last_contact_at: updated.lastContactAt,
      })
      .eq("id", leadId);

    if (updateError) {
      throw updateError;
    }

    const { error: activityError } = await supabase.from("lead_activities").insert({
      lead_id: leadId,
      action: activity.action,
      metadata: { type: activity.type, actor_name: actorName },
    });

    if (activityError) {
      console.warn("[lead_activities] update activity failed", activityError);
    }
  } catch (error) {
    console.error("[leads] update failed", error);
    if (shouldUseDemoFallback()) return updated;
    throw error instanceof Error ? error : new Error("Failed to update lead");
  }

  return updated;
}

export async function updateLeadStage(
  leadId: string,
  stage: LeadStage,
  actorName: string,
): Promise<LeadListItem | null> {
  const current = getLocalLeads();
  const existing = current.find((lead) => lead.id === leadId);
  if (!existing) return null;

  const previousStage = existing.stage;

  const updated: LeadListItem = {
    ...existing,
    stage,
    lastContactAt: new Date().toISOString(),
  };

  saveLocalLeads(current.map((lead) => (lead.id === leadId ? updated : lead)));

  const activity: LeadActivityItem = {
    id: crypto.randomUUID(),
    leadId,
    action: `\u062a\u0645 \u0646\u0642\u0644 \u0627\u0644\u0645\u0631\u062d\u0644\u0629 \u0625\u0644\u0649 ${STAGE_LABELS[stage]}`,
    date: new Date().toISOString(),
    by: actorName,
    type: "stage",
  };
  saveLocalActivities([activity, ...getLocalActivities()]);

  const supabase = getSupabaseClient();
  if (!supabase) {
    if (shouldUseDemoFallback()) return updated;
    throw new Error("Supabase client is not available");
  }

  try {
    await supabase
      .from("leads")
      .update({
        stage,
        last_contact_at: updated.lastContactAt,
      })
      .eq("id", leadId);

    await supabase.from("lead_activities").insert({
      lead_id: leadId,
      action: activity.action,
      from_stage: previousStage,
      to_stage: stage,
      metadata: { type: "stage", actor_name: actorName },
    });

    // --- Auto-enrollment on won ---
    if (stage === "won") {
      try {
        await ensureLeadEnrollment(leadId);
        console.log("[leads] auto-enrolled lead", leadId);
      } catch (enrollErr) {
        console.warn("[leads] auto-enrollment failed", leadId, enrollErr);
      }
    }
    // --- End auto-enrollment ---

  } catch (error) {
    console.error("[leads] stage update failed", error);
    if (shouldUseDemoFallback()) return updated;
    throw error instanceof Error ? error : new Error("Failed to update lead stage");
  }

  return updated;
}


/** Delete a lead permanently */
export async function deleteLead(id: string): Promise<boolean> {
  const supabase = getSupabaseClient();
  if (!supabase) throw new Error("Supabase client not available");

  const { data: before } = await supabase
    .from("leads")
    .select("id")
    .eq("id", id)
    .maybeSingle();

  if (!before) throw new Error("Lead not found");

  // Delete related activities first
  await supabase.from("lead_activities").delete().eq("lead_id", id);

  const { error } = await supabase.from("leads").delete().eq("id", id);
  if (error) throw new Error(error.message || "Failed to delete lead");

  // Clean local storage
  const local = readStorage<{id:string}[]>(LEADS_KEY, []);
  writeStorage(LEADS_KEY, local.filter((l) => l.id !== id));

  return true;
}

