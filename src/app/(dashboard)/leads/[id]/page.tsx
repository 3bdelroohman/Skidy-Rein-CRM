"use client";

import { use, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  Baby,
  Clock,
  Edit,
  MessageSquare,
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
import type { LeadActivityItem, LeadListItem } from "@/types/crm";

export default function LeadDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const locale = useUIStore((state) => state.locale);
  const isAr = locale === "ar";
  const user = useCurrentUser();
  const [lead, setLead] = useState<LeadListItem | null>(null);
  const [activities, setActivities] = useState<LeadActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [changingStage, setChangingStage] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    async function load() {
      setLoading(true);
      const [leadData, activityData] = await Promise.all([getLeadById(id), listLeadActivities(id)]);
      if (isMounted) {
        setLead(leadData);
        setActivities(activityData);
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

  if (loading) {
    return <div className="rounded-2xl border border-border bg-card p-12 text-center text-muted-foreground">{t(locale, "جارِ تحميل بيانات العميل...", "Loading lead details...")}</div>;
  }

  if (!lead || !currentStageConfig) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <p className="text-lg text-muted-foreground">{t(locale, "العميل غير موجود", "Lead not found")}</p>
        <button onClick={() => router.push("/leads")} className="mt-4 text-sm text-brand-600 hover:underline">{t(locale, "رجوع للقائمة", "Back to leads")}</button>
      </div>
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
                            ringColor: `${stage.color}22`
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
