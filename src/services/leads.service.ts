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
import { MOCK_TEAM } from "@/lib/mock-data";
import { isBrowser, readStorage, sortByDateDesc, writeStorage } from "@/services/storage";
import { ensureLeadEnrollment } from "@/services/enrollment.service";

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

function getLocalLeads(): LeadListItem[] {
  return sortByDateDesc(readStorage(LEADS_KEY, [] as LeadListItem[]), (lead) => lead.createdAt);
}

function saveLocalLeads(leads: LeadListItem[]): void {
  writeStorage(LEADS_KEY, sortByDateDesc(leads, (lead) => lead.createdAt));
}

function clearLocalLeads(): void {
  writeStorage(LEADS_KEY, []);
}

function getLocalActivities(): LeadActivityItem[] {
  return sortByDateDesc(readStorage(ACTIVITIES_KEY, [] as LeadActivityItem[]), (activity) => activity.date);
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
    parentName: asString(record.parent_name ?? record.parentName, "ولي أمر غير محدد"),
    parentPhone: asString(record.parent_phone ?? record.parentPhone, "—"),
    childName: asString(record.child_name ?? record.childName, "طفل بدون اسم"),
    childAge: asNumber(record.child_age ?? record.childAge, 0),
    stage: asStage(record.stage),
    temperature: asTemperature(record.temperature),
    source: asString(record.source, "other") as LeadListItem["source"],
    suggestedCourse: asNullableString(record.suggested_course ?? record.suggestedCourse) as LeadListItem["suggestedCourse"],
    assignedTo: asString(record.assigned_to ?? record.assignedTo, ""),
    assignedToName: asString(record.assigned_to_name ?? record.assignedToName, "غير مخصص"),
    lastContactAt: asNullableString(record.last_contact_at ?? record.lastContactAt),
    nextFollowUpAt: asNullableString(record.next_follow_up_at ?? record.nextFollowUpAt),
    notes: asNullableString(record.notes),
    createdAt: asString(record.created_at ?? record.createdAt, new Date().toISOString()),
    lossReason: asLossReason(record.loss_reason ?? record.lossReason),
  };
}

function mapActivityRow(row: Database["public"]["Tables"]["lead_activities"]["Row"] | Record<string, unknown>): LeadActivityItem {
  const record = row as Record<string, unknown>;
  return {
    id: asString(record.id, crypto.randomUUID()),
    leadId: asString(record.lead_id ?? record.leadId),
    action: asString(record.action, "تحديث على العميل"),
    date: asString(record.created_at ?? record.date, new Date().toISOString()),
    by: asString(record.by_name ?? record.by, "النظام"),
    type: (["create", "contact", "stage", "note"] as const).includes(record.type as LeadActivityItem["type"])
      ? (record.type as LeadActivityItem["type"])
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
  try {
    return (await syncLeadsFromSupabase()) ?? [];
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
  try {
    return (await syncActivitiesFromSupabase(leadId)) ?? [];
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
      "غير مخصص",
    lastContactAt: null,
    nextFollowUpAt: null,
    notes: input.notes ?? null,
    createdAt,
    lossReason: null,
  };

  const supabase = getSupabaseClient();

  if (!supabase) {
    throw new Error("تعذر الاتصال بقاعدة البيانات. أعد المحاولة بعد تسجيل الدخول أو التحقق من الإعدادات.");
  }

  try {
    const assignedToUuid = await resolveAssignedToUuid(input.assignedTo);
    if (!assignedToUuid) {
      throw new Error("تعذر تحديد المسؤول الصحيح عن العميل. تأكد من تسجيل الدخول أو بيانات المسؤول.");
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
      created_at: draftLead.createdAt,
    };

    const { data, error } = await supabase
      .from("leads")
      .insert(insertPayload)
      .select("*")
      .single();

    if (error) {
      console.error("[leads] create failed", error);
      throw new Error(error.message || "تعذر حفظ العميل في قاعدة البيانات");
    }

    if (!data) {
      throw new Error("تم إرسال طلب الحفظ لكن لم يرجع أي سجل من قاعدة البيانات");
    }

    const synced = mapLeadRow(data);
    const current = getLocalLeads().filter((item) => item.id !== synced.id);
    saveLocalLeads([{ ...synced, assignedToName: draftLead.assignedToName }, ...current]);

    const activityPayload: Database["public"]["Tables"]["lead_activities"]["Insert"] = {
      lead_id: synced.id,
      action: "تم إنشاء العميل المحتمل",
      type: "create",
      created_at: createdAt,
    };

    const { error: activityError } = await supabase.from("lead_activities").insert(activityPayload);
    if (activityError) {
      console.warn("[lead_activities] create activity failed", activityError);
    }

    return { ...synced, assignedToName: draftLead.assignedToName };
  } catch (error) {
    console.error("[leads] create failed", error);
    throw error instanceof Error ? error : new Error("تعذر حفظ العميل");
  }
}

export async function updateLead(
  leadId: string,
  input: UpdateLeadInput,
  actorName = input.assignedToName || "النظام",
): Promise<LeadListItem | null> {
  const existing = await getLeadById(leadId);
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

  const activity: LeadActivityItem = {
    id: crypto.randomUUID(),
    leadId,
    action: "تم تحديث بيانات العميل",
    date: new Date().toISOString(),
    by: actorName,
    type: "note",
  };

  const supabase = getSupabaseClient();
  if (!supabase) {
    throw new Error("تعذر الاتصال بقاعدة البيانات. تأكد من إعدادات Supabase ثم أعد المحاولة.");
  }

  try {
    const assignedToUuid = await resolveAssignedToUuid(updated.assignedTo);
    if (!assignedToUuid) {
      throw new Error("تعذر تحديد المسؤول الصحيح عن العميل.");
    }

    const { data, error: updateError } = await supabase
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
        updated_at: new Date().toISOString(),
      })
      .eq("id", leadId)
      .select("*")
      .single();

    if (updateError || !data) {
      throw updateError ?? new Error("تعذر تحديث العميل.");
    }

    const synced = { ...mapLeadRow(data), assignedToName: updated.assignedToName };
    saveLocalLeads([synced, ...getLocalLeads().filter((lead) => lead.id !== leadId)]);

    const { error: activityError } = await supabase.from("lead_activities").insert({
      lead_id: leadId,
      action: activity.action,
      type: activity.type,
      by_name: activity.by,
      created_at: activity.date,
    });

    if (activityError) {
      console.warn("[lead_activities] update activity failed", activityError);
    } else {
      saveLocalActivities([activity, ...getLocalActivities().filter((item) => item.id !== activity.id)]);
    }

    return synced;
  } catch (error) {
    console.error("[leads] update failed", error);
    throw error instanceof Error ? error : new Error("Failed to update lead");
  }
}

export async function updateLeadStage(
  leadId: string,
  stage: LeadStage,
  actorName: string,
): Promise<LeadListItem | null> {
  const existing = await getLeadById(leadId);
  if (!existing) return null;

  const updatedAt = new Date().toISOString();
  const updated: LeadListItem = {
    ...existing,
    stage,
    lastContactAt: updatedAt,
  };

  const activity: LeadActivityItem = {
    id: crypto.randomUUID(),
    leadId,
    action: `تم نقل المرحلة إلى ${STAGE_LABELS[stage]}`,
    date: updatedAt,
    by: actorName,
    type: "stage",
  };

  const supabase = getSupabaseClient();
  if (!supabase) {
    throw new Error("تعذر الاتصال بقاعدة البيانات. تأكد من إعدادات Supabase ثم أعد المحاولة.");
  }

  try {
    if (stage === "won") {
      await ensureLeadEnrollment(leadId);
    }

    const { data, error } = await supabase
      .from("leads")
      .update({
        stage,
        last_contact_at: updated.lastContactAt,
        won_at: stage === "won" ? updatedAt : null,
        lost_at: stage === "lost" ? updatedAt : null,
        updated_at: updatedAt,
      })
      .eq("id", leadId)
      .select("*")
      .single();

    if (error || !data) {
      throw error ?? new Error("تعذر تحديث مرحلة العميل.");
    }

    const { error: activityError } = await supabase.from("lead_activities").insert({
      lead_id: leadId,
      action: activity.action,
      type: activity.type,
      by_name: activity.by,
      created_at: activity.date,
    });

    if (activityError) {
      console.warn("[lead_activities] stage activity failed", activityError);
    } else {
      saveLocalActivities([activity, ...getLocalActivities().filter((item) => item.id !== activity.id)]);
    }

    const synced = mapLeadRow(data);
    saveLocalLeads([synced, ...getLocalLeads().filter((lead) => lead.id !== leadId)]);
    return synced;
  } catch (error) {
    console.error("[leads] stage update failed", error);
    throw error instanceof Error ? error : new Error("Failed to update lead stage");
  }
}
