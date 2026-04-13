"use client";

import { use, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  Baby,
  CalendarPlus2,
  CheckCircle2,
  Clock,
  Edit,
  MessageSquare,
  RotateCcw,
  User,
} from "lucide-react";
import { toast } from "sonner";
import { StageBadge } from "@/components/leads/stage-badge";
import { TemperatureBadge } from "@/components/leads/temperature-badge";
import { NEXT_STAGE_MAP, PIPELINE_STAGES, STAGE_CONFIGS } from "@/config/stages";
import { formatCourseLabel, formatDate, formatDateTime, formatLeadSource } from "@/lib/formatters";
import { getStageLabel, t } from "@/lib/locale";
import { cn } from "@/lib/utils";
import { useCurrentUser } from "@/providers/user-provider";
import { useUIStore } from "@/stores/ui-store";
import { getLeadById, listLeadActivities, updateLeadStage } from "@/services/leads.service";
import {
  createFollowUp,
  listFollowUpsByLead,
  markFollowUpCompleted,
  reopenFollowUp,
  suggestFollowUpTitle,
  suggestFollowUpTypeByStage,
} from "@/services/follow-ups.service";
import { getCommChannelLabel, getFollowUpTypeLabel } from "@/lib/locale";
import { FOLLOW_UP_STATUS_META, PRIORITY_META, getMetaLabel } from "@/config/status-meta";
import type { CreateFollowUpInput, FollowUpItem, LeadActivityItem, LeadListItem } from "@/types/crm";
import { LoadingState, PageStateCard } from "@/components/shared/page-state";

export default function LeadDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const locale = useUIStore((state) => state.locale);
  const isAr = locale === "ar";
  const user = useCurrentUser();
  const [lead, setLead] = useState<LeadListItem | null>(null);
  const [activities, setActivities] = useState<LeadActivityItem[]>([]);
  const [followUps, setFollowUps] = useState<FollowUpItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [changingStage, setChangingStage] = useState<string | null>(null);
  const [savingFollowUp, setSavingFollowUp] = useState(false);
  const [togglingFollowUp, setTogglingFollowUp] = useState<string | null>(null);
  const [followUpForm, setFollowUpForm] = useState<{ title: string; scheduledAt: string; priority: CreateFollowUpInput["priority"]; channel: CreateFollowUpInput["channel"]; }>({
    title: "",
    scheduledAt: "",
    priority: "medium",
    channel: "whatsapp",
  });

  useEffect(() => {
    let isMounted = true;
    async function load() {
      setLoading(true);
      const [leadData, activityData, followUpData] = await Promise.all([
        getLeadById(id),
        listLeadActivities(id),
        listFollowUpsByLead(id),
      ]);
      if (isMounted) {
        setLead(leadData);
        setActivities(activityData);
        setFollowUps(followUpData);
        setLoading(false);
      }
    }
    load();
    return () => {
      isMounted = false;
    };
  }, [id]);

  const currentStageConfig = useMemo(() => (lead ? STAGE_CONFIGS[lead.stage] : null), [lead]);
  const nextStages = useMemo(() => (lead ? NEXT_STAGE_MAP[lead.stage] ?? [] : []), [lead]);

  useEffect(() => {
    if (!lead) return;
    const defaultDate = lead.nextFollowUpAt ?? new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().slice(0, 16);
    setFollowUpForm({
      title: suggestFollowUpTitle(lead.stage, lead.childName),
      scheduledAt: defaultDate.slice(0, 16),
      priority: lead.temperature === "hot" ? "high" : lead.temperature === "cold" ? "low" : "medium",
      channel: "whatsapp",
    });
  }, [lead]);

  const handleStageChange = async (stage: LeadListItem["stage"]) => {
    if (!lead) return;
    setChangingStage(stage);
    const updated = await updateLeadStage(id, stage, user.fullNameAr || user.fullName);
    const refreshedActivities = await listLeadActivities(id);
    if (updated) {
      setLead(updated);
      setActivities(refreshedActivities);
      toast.success(t(locale, `تم نقل العميل إلى ${getStageLabel(stage, locale)}`, `Lead moved to ${getStageLabel(stage, locale)}`));
    }
    setChangingStage(null);
  };


  const handleCreateFollowUp = async () => {
    if (!lead || !followUpForm.title.trim() || !followUpForm.scheduledAt) return;

    setSavingFollowUp(true);
    const created = await createFollowUp({
      leadId: lead.id,
      leadName: lead.childName,
      parentName: lead.parentName,
      title: followUpForm.title.trim(),
      type: suggestFollowUpTypeByStage(lead.stage),
      channel: followUpForm.channel,
      priority: followUpForm.priority,
      scheduledAt: new Date(followUpForm.scheduledAt).toISOString(),
      assignedTo: lead.assignedToName,
    });

    const [refreshedLead, refreshedActivities, refreshedFollowUps] = await Promise.all([
      getLeadById(id),
      listLeadActivities(id),
      listFollowUpsByLead(id),
    ]);

    setLead(refreshedLead);
    setActivities(refreshedActivities);
    setFollowUps(refreshedFollowUps.length > 0 ? refreshedFollowUps : [created, ...followUps]);
    setSavingFollowUp(false);
    toast.success(t(locale, "تم إنشاء متابعة جديدة", "New follow-up created"));
  };

  const handleFollowUpToggle = async (followUpId: string, completed: boolean) => {
    setTogglingFollowUp(followUpId);
    const updated = completed ? await reopenFollowUp(followUpId) : await markFollowUpCompleted(followUpId);
    if (updated) {
      const refreshedActivities = await listLeadActivities(id);
      const refreshedLead = await getLeadById(id);
      setActivities(refreshedActivities);
      setLead(refreshedLead);
      setFollowUps((current) => current.map((item) => (item.id === followUpId ? updated : item)));
    }
    setTogglingFollowUp(null);
  };

  if (loading) {
    return (
      <LoadingState
        titleAr="جارِ تحميل بيانات العميل"
        titleEn="Loading lead details"
        descriptionAr="يتم الآن تجهيز ملف العميل وسجل النشاطات ومسار البيع المرتبط به."
        descriptionEn="The lead profile, activity log, and sales pipeline are being prepared."
      />
    );
  }

  if (!lead || !currentStageConfig) {
    return (
      <PageStateCard
        variant="warning"
        titleAr="العميل غير موجود"
        titleEn="Lead not found"
        descriptionAr="قد يكون هذا الملف محذوفًا أو أن الرابط غير صحيح. ارجع إلى قائمة العملاء المحتملين ثم افتح الملف الصحيح."
        descriptionEn="This lead may have been removed or the link is incorrect. Go back to the leads list and open the correct record."
        actionHref="/leads"
        actionLabelAr="العودة إلى العملاء المحتملين"
        actionLabelEn="Back to leads"
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => router.push("/leads")} className="rounded-xl p-2 text-muted-foreground transition-colors hover:bg-muted">
            {isAr ? <ArrowRight size={20} /> : <ArrowLeft size={20} />}
          </button>
          <div>
            <h1 className="text-2xl font-bold text-foreground">{lead.childName}</h1>
            <p className="text-sm text-muted-foreground">{lead.parentName} — {lead.parentPhone}</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <StageBadge stage={lead.stage} />
          <TemperatureBadge temperature={lead.temperature} />
          <Link href={`/leads/${id}/edit`} className="inline-flex items-center gap-2 rounded-2xl bg-brand-700 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-600">
            <Edit size={16} />
            {t(locale, "تعديل البيانات", "Edit details")}
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <div className="rounded-2xl border border-border bg-card p-4">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <h3 className="font-bold text-foreground">{t(locale, "مسار البيع", "Sales pipeline")}</h3>
              <span className="text-xs text-muted-foreground">{t(locale, "المرحلة الحالية", "Current stage")}: {getStageLabel(lead.stage, locale)}</span>
            </div>

            <div className="rounded-2xl border border-border/70 bg-muted/20 p-3">
              <div className="max-w-full overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                <div className="flex min-w-max items-center gap-2">
                  {PIPELINE_STAGES.map((stageKey, index) => {
                    const stage = STAGE_CONFIGS[stageKey];
                    const isActive = stage.key === lead.stage;
                    const isPast = stage.order < currentStageConfig.order;

                    return (
                      <div key={stage.key} className="flex shrink-0 items-center gap-2">
                        <div
                          className={cn(
                            "inline-flex min-h-11 items-center justify-center rounded-full border px-4 text-xs font-semibold whitespace-nowrap transition-all",
                            isActive && "shadow-sm ring-2 ring-offset-1 ring-offset-background",
                            isPast && !isActive && "opacity-80",
                          )}
                          style={{
                            backgroundColor: isActive ? stage.color : stage.bgColor,
                            color: isActive ? "#ffffff" : stage.textColor,
                            borderColor: isActive ? stage.color : `${stage.color}33`,
                            boxShadow: isActive ? `0 0 0 3px ${stage.color}22` : undefined,
                          }}
                        >
                          {getStageLabel(stage.key, locale)}
                        </div>
                        {index < PIPELINE_STAGES.length - 1 && (
                          <div className="flex items-center gap-1 px-1 text-muted-foreground/70">
                            <div className="h-px w-4 bg-border" />
                            {isAr ? <ArrowLeft size={12} /> : <ArrowRight size={12} />}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {nextStages.length > 0 && (
              <div className="mt-4 border-t border-border pt-4">
                <p className="mb-3 text-xs text-muted-foreground">{t(locale, "نقل إلى", "Move to")}</p>
                <div className="flex flex-wrap gap-2">
                  {nextStages.map((stage) => (
                    <button
                      key={stage}
                      disabled={changingStage === stage}
                      onClick={() => handleStageChange(stage)}
                      className="inline-flex items-center gap-1.5 rounded-full border px-3.5 py-2 text-xs font-semibold transition-all hover:-translate-y-0.5 hover:shadow-sm disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
                      style={{
                        borderColor: STAGE_CONFIGS[stage].color,
                        color: STAGE_CONFIGS[stage].textColor,
                        backgroundColor: STAGE_CONFIGS[stage].bgColor,
                      }}
                    >
                      {changingStage === stage ? t(locale, "جارِ النقل...", "Moving...") : getStageLabel(stage, locale)}
                      {isAr ? <ArrowLeft size={13} className="opacity-70" /> : <ArrowRight size={13} className="opacity-70" />}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="rounded-2xl border border-border bg-card p-4">
              <h3 className="mb-3 flex items-center gap-2 font-bold text-foreground"><Baby size={18} className="text-brand-600" />{t(locale, "معلومات الطفل", "Child information")}</h3>
              <div className="space-y-3">
                <InfoRow label={t(locale, "الاسم", "Name")} value={lead.childName} align={isAr ? "left" : "right"} />
                <InfoRow label={t(locale, "العمر", "Age")} value={`${lead.childAge} ${t(locale, "سنة", "years")}`} align={isAr ? "left" : "right"} />
                <InfoRow label={t(locale, "الكورس المقترح", "Suggested course")} value={formatCourseLabel(lead.suggestedCourse, locale)} align={isAr ? "left" : "right"} />
              </div>
            </div>

            <div className="rounded-2xl border border-border bg-card p-4">
              <h3 className="mb-3 flex items-center gap-2 font-bold text-foreground"><User size={18} className="text-brand-600" />{t(locale, "ولي الأمر", "Parent")}</h3>
              <div className="space-y-3">
                <InfoRow label={t(locale, "الاسم", "Name")} value={lead.parentName} align={isAr ? "left" : "right"} />
                <InfoRow label={t(locale, "الهاتف", "Phone")} value={lead.parentPhone} align={isAr ? "left" : "right"} />
                <InfoRow label={t(locale, "المصدر", "Source")} value={formatLeadSource(lead.source, locale)} align={isAr ? "left" : "right"} />
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-card p-4">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <h3 className="flex items-center gap-2 font-bold text-foreground"><CalendarPlus2 size={18} className="text-brand-600" />{t(locale, "المتابعات المرتبطة", "Related follow-ups")}</h3>
              <span className="text-xs text-muted-foreground">{followUps.length} {t(locale, "متابعة", "items")}</span>
            </div>

            <div className="grid grid-cols-1 gap-3 rounded-2xl border border-dashed border-border bg-muted/20 p-3 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className="mb-1.5 block text-xs font-medium text-muted-foreground">{t(locale, "عنوان المتابعة", "Follow-up title")}</label>
                <input
                  value={followUpForm.title}
                  onChange={(event) => setFollowUpForm((current) => ({ ...current, title: event.target.value }))}
                  className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm text-foreground focus:border-transparent focus:ring-2 focus:ring-ring"
                  placeholder={t(locale, "مثال: متابعة بعد العرض", "Example: Follow up after offer")}
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-muted-foreground">{t(locale, "موعد المتابعة", "Schedule")}</label>
                <input
                  type="datetime-local"
                  value={followUpForm.scheduledAt}
                  onChange={(event) => setFollowUpForm((current) => ({ ...current, scheduledAt: event.target.value }))}
                  className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm text-foreground focus:border-transparent focus:ring-2 focus:ring-ring"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-muted-foreground">{t(locale, "الأولوية", "Priority")}</label>
                  <select
                    value={followUpForm.priority}
                    onChange={(event) => setFollowUpForm((current) => ({ ...current, priority: event.target.value as CreateFollowUpInput["priority"] }))}
                    className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm text-foreground focus:border-transparent focus:ring-2 focus:ring-ring"
                  >
                    <option value="low">{t(locale, "غير مستعجل", "Low")}</option>
                    <option value="medium">{t(locale, "مهم", "Medium")}</option>
                    <option value="high">{t(locale, "عاجل", "High")}</option>
                    <option value="urgent">{t(locale, "عاجل جداً", "Urgent")}</option>
                  </select>
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-muted-foreground">{t(locale, "القناة", "Channel")}</label>
                  <select
                    value={followUpForm.channel}
                    onChange={(event) => setFollowUpForm((current) => ({ ...current, channel: event.target.value as CreateFollowUpInput["channel"] }))}
                    className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm text-foreground focus:border-transparent focus:ring-2 focus:ring-ring"
                  >
                    <option value="whatsapp">WhatsApp</option>
                    <option value="call">{t(locale, "مكالمة", "Call")}</option>
                    <option value="email">Email</option>
                    <option value="sms">SMS</option>
                  </select>
                </div>
              </div>
              <div className="sm:col-span-2">
                <button
                  onClick={handleCreateFollowUp}
                  disabled={savingFollowUp || !followUpForm.title.trim() || !followUpForm.scheduledAt}
                  className="inline-flex items-center gap-2 rounded-xl bg-brand-700 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <CalendarPlus2 size={16} />
                  {savingFollowUp ? t(locale, "جارِ إنشاء المتابعة...", "Creating follow-up...") : t(locale, "إضافة متابعة", "Add follow-up")}
                </button>
              </div>
            </div>

            <div className="mt-4 space-y-3">
              {followUps.length === 0 ? (
                <p className="text-sm text-muted-foreground">{t(locale, "لا توجد متابعات مرتبطة بهذا العميل بعد", "No follow-ups linked to this lead yet")}</p>
              ) : (
                followUps.map((item) => {
                  const status = FOLLOW_UP_STATUS_META[item.status];
                  const priority = PRIORITY_META[item.priority];
                  const completed = item.status === "completed";
                  return (
                    <div key={item.id} className={cn("rounded-2xl border border-border p-3", completed && "opacity-70")}>
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <p className={cn("text-sm font-semibold text-foreground", completed && "line-through")}>{item.title}</p>
                          <p className="mt-1 text-xs text-muted-foreground">{getFollowUpTypeLabel(item.type, locale)} • {getCommChannelLabel(item.channel, locale)} • {formatDateTime(item.scheduledAt, locale)}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="rounded-full px-2 py-0.5 text-[10px] font-semibold" style={{ backgroundColor: priority.bg, color: priority.color }}>
                            {getMetaLabel(priority, locale)}
                          </span>
                          <span className="rounded-full px-2 py-0.5 text-[10px] font-semibold" style={{ backgroundColor: status.bg, color: status.color }}>
                            {getMetaLabel(status, locale)}
                          </span>
                        </div>
                      </div>
                      <div className="mt-3 flex items-center justify-between border-t border-border pt-3">
                        <span className="text-xs text-muted-foreground">{item.assignedTo}</span>
                        <button
                          onClick={() => handleFollowUpToggle(item.id, completed)}
                          disabled={togglingFollowUp === item.id}
                          className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-background px-3 py-1.5 text-xs font-semibold text-foreground transition-colors hover:bg-muted disabled:opacity-60"
                        >
                          {completed ? <RotateCcw size={12} /> : <CheckCircle2 size={12} />}
                          {togglingFollowUp === item.id
                            ? t(locale, "جارِ الحفظ...", "Saving...")
                            : completed
                              ? t(locale, "إعادة الفتح", "Reopen")
                              : t(locale, "تم التنفيذ", "Mark done")}
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-card p-4">
            <h3 className="mb-3 flex items-center gap-2 font-bold text-foreground"><MessageSquare size={18} className="text-brand-600" />{t(locale, "ملاحظات", "Notes")}</h3>
            <p className="text-sm leading-relaxed text-foreground">{lead.notes ?? t(locale, "لا توجد ملاحظات بعد", "No notes yet")}</p>
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-2xl border border-border bg-card p-4">
            <h3 className="mb-3 font-bold text-foreground">{t(locale, "معلومات سريعة", "Quick info")}</h3>
            <div className="space-y-3">
              <InfoRow label={t(locale, "المسؤول", "Owner")} value={lead.assignedToName} align={isAr ? "left" : "right"} />
              <InfoRow label={t(locale, "تاريخ الإنشاء", "Created at")} value={formatDate(lead.createdAt, locale)} align={isAr ? "left" : "right"} />
              <InfoRow label={t(locale, "آخر تواصل", "Last contact")} value={formatDate(lead.lastContactAt, locale)} align={isAr ? "left" : "right"} />
              <InfoRow label={t(locale, "المتابعة القادمة", "Next follow-up")} value={formatDateTime(lead.nextFollowUpAt, locale)} align={isAr ? "left" : "right"} />
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-card p-4">
            <h3 className="mb-4 flex items-center gap-2 font-bold text-foreground"><Clock size={18} className="text-brand-600" />{t(locale, "سجل النشاطات", "Activity log")}</h3>
            <div className="space-y-4">
              {activities.length === 0 ? (
                <p className="text-sm text-muted-foreground">{t(locale, "لا توجد نشاطات مسجلة حتى الآن", "No activities logged yet")}</p>
              ) : (
                activities.map((activity, index) => (
                  <div key={activity.id} className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <div className={cn("h-2.5 w-2.5 shrink-0 rounded-full", activity.type === "create" && "bg-brand-500", activity.type === "contact" && "bg-success-500", activity.type === "stage" && "bg-warning-500", activity.type === "note" && "bg-muted-foreground")} />
                      {index < activities.length - 1 && <div className="mt-1 w-0.5 flex-1 bg-border" />}
                    </div>
                    <div className="pb-4">
                      <p className="text-sm text-foreground">{activity.action}</p>
                      <p className="mt-0.5 text-[10px] text-muted-foreground">{formatDateTime(activity.date, locale)} — {activity.by}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function InfoRow({ label, value, align = "left" }: { label: string; value: string; align?: "left" | "right" }) {
  return (
    <div className="flex items-center justify-between gap-4 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className={cn("font-medium text-foreground", align === "left" ? "text-left" : "text-right")}>{value}</span>
    </div>
  );
}
