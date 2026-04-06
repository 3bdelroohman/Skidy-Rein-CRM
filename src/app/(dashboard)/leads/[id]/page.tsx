"use client";

import { use } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  User,
  Baby,
  Clock,
  MessageSquare,
  Edit,
  ChevronLeft,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { MOCK_LEADS } from "@/lib/mock-data";
import { StageBadge } from "@/components/leads/stage-badge";
import { TemperatureBadge } from "@/components/leads/temperature-badge";
import { STAGE_CONFIGS } from "@/config/stages";

// Valid next stages for each stage
const NEXT_STAGES: Partial<Record<string, string[]>> = {
  new: ["qualified", "lost"],
  qualified: ["trial_proposed", "lost"],
  trial_proposed: ["trial_booked", "lost"],
  trial_booked: ["trial_attended", "trial_proposed", "lost"],
  trial_attended: ["offer_sent", "lost"],
  offer_sent: ["won", "lost"],
  won: [],
  lost: ["new"],
};

const MOCK_ACTIVITIES = [
  {
    id: "1",
    action: "تم إنشاء الـ Lead",
    date: "2026-04-05 08:00",
    by: "الاء",
    type: "create",
  },
  {
    id: "2",
    action: "أول تواصل عبر WhatsApp",
    date: "2026-04-05 09:30",
    by: "الاء",
    type: "contact",
  },
  {
    id: "3",
    action: "تم التأهيل — سن مناسب + لابتوب",
    date: "2026-04-05 09:45",
    by: "الاء",
    type: "stage",
  },
  {
    id: "4",
    action: "تم عرض السيشن التجريبي",
    date: "2026-04-05 10:00",
    by: "الاء",
    type: "stage",
  },
];

export default function LeadDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();

  const lead = MOCK_LEADS.find((l) => l.id === id);

  if (!lead) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <p className="text-muted-foreground text-lg">Lead غير موجود</p>
        <button
          onClick={() => router.push("/leads")}
          className="mt-4 text-brand-600 hover:underline text-sm"
        >
          رجوع للقائمة
        </button>
      </div>
    );
  }

  const currentStageConfig = STAGE_CONFIGS[lead.stage];
  const nextStages = (NEXT_STAGES[lead.stage] || []) as string[];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push("/leads")}
            className="p-2 rounded-xl hover:bg-muted transition-colors text-muted-foreground"
          >
            <ArrowRight size={20} />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              {lead.childName}
            </h1>
            <p className="text-muted-foreground text-sm">
              {lead.parentName} — {lead.parentPhone}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <StageBadge stage={lead.stage} />
          <TemperatureBadge temperature={lead.temperature} />
          <button
            className={cn(
              "inline-flex items-center gap-2 px-4 py-2 rounded-xl",
              "bg-brand-700 text-white text-sm font-semibold",
              "hover:bg-brand-600 transition-colors"
            )}
          >
            <Edit size={16} />
            تعديل
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Info — 2 columns */}
        <div className="lg:col-span-2 space-y-6">
          {/* Pipeline Progress */}
          <div className="bg-card rounded-2xl border border-border p-4">
            <h3 className="font-bold text-foreground mb-4">مسار المبيعات</h3>
            <div className="flex items-center gap-1 overflow-x-auto pb-2">
              {Object.values(STAGE_CONFIGS).map((stage, index) => {
                const isActive = stage.key === lead.stage;
                const isPast = stage.order < currentStageConfig.order;

                return (
                  <div key={stage.key} className="flex items-center">
                    <div
                      className={cn(
                        "shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold transition-all",
                        isActive && "ring-2 ring-offset-2 scale-110",
                        isPast && "opacity-60"
                      )}
                      style={{
                        backgroundColor: isActive
                          ? stage.color
                          : stage.bgColor,
                        color: isActive ? "white" : stage.textColor,
                        boxShadow: isActive
                          ? `0 0 0 2px white, 0 0 0 4px ${stage.color}`
                          : "none",
                      }}
                    >
                      {stage.labelAr}
                    </div>
                    {index < Object.values(STAGE_CONFIGS).length - 1 && (
                      <ChevronLeft
                        size={14}
                        className="text-muted-foreground mx-0.5 shrink-0"
                      />
                    )}
                  </div>
                );
              })}
            </div>

            {/* Stage Actions */}
            {nextStages.length > 0 && (
              <div className="mt-4 pt-4 border-t border-border">
                <p className="text-xs text-muted-foreground mb-2">
                  نقل إلى:
                </p>
                <div className="flex flex-wrap gap-2">
                  {nextStages.map((stageKey) => {
                    const stageConfig = STAGE_CONFIGS[stageKey];
                    return (
                      <button
                        key={stageKey}
                        className={cn(
                          "px-3 py-1.5 rounded-xl text-xs font-semibold",
                          "border-2 transition-all hover:scale-105"
                        )}
                        style={{
                          borderColor: stageConfig.color,
                          color: stageConfig.textColor,
                          backgroundColor: stageConfig.bgColor,
                        }}
                      >
                        {stageConfig.labelAr}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Info Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Child Info */}
            <div className="bg-card rounded-2xl border border-border p-4">
              <h3 className="font-bold text-foreground mb-3 flex items-center gap-2">
                <Baby size={18} className="text-brand-600" />
                معلومات الطفل
              </h3>
              <div className="space-y-3">
                <InfoRow label="الاسم" value={lead.childName} />
                <InfoRow label="العمر" value={`${lead.childAge} سنة`} />
                <InfoRow
                  label="الكورس المقترح"
                  value={lead.suggestedCourse ?? "لم يحدد"}
                />
              </div>
            </div>

            {/* Parent Info */}
            <div className="bg-card rounded-2xl border border-border p-4">
              <h3 className="font-bold text-foreground mb-3 flex items-center gap-2">
                <User size={18} className="text-brand-600" />
                ولي الأمر
              </h3>
              <div className="space-y-3">
                <InfoRow label="الاسم" value={lead.parentName} />
                <InfoRow label="الهاتف" value={lead.parentPhone} />
                <InfoRow label="المصدر" value={lead.source} />
              </div>
            </div>
          </div>

          {/* Notes */}
          <div className="bg-card rounded-2xl border border-border p-4">
            <h3 className="font-bold text-foreground mb-3 flex items-center gap-2">
              <MessageSquare size={18} className="text-brand-600" />
              ملاحظات
            </h3>
            <p className="text-foreground text-sm leading-relaxed">
              {lead.notes ?? "لا توجد ملاحظات"}
            </p>
          </div>
        </div>

        {/* Sidebar — Activity Timeline */}
        <div className="space-y-6">
          {/* Quick Info */}
          <div className="bg-card rounded-2xl border border-border p-4">
            <h3 className="font-bold text-foreground mb-3">معلومات سريعة</h3>
            <div className="space-y-3">
              <InfoRow label="المسؤول" value={lead.assignedToName} />
              <InfoRow
                label="تاريخ الإنشاء"
                value={new Date(lead.createdAt).toLocaleDateString("ar-EG")}
              />
              <InfoRow
                label="آخر تواصل"
                value={
                  lead.lastContactAt
                    ? new Date(lead.lastContactAt).toLocaleDateString("ar-EG")
                    : "لم يتم"
                }
              />
              <InfoRow
                label="المتابعة القادمة"
                value={
                  lead.nextFollowUpAt
                    ? new Date(lead.nextFollowUpAt).toLocaleDateString("ar-EG")
                    : "غير محددة"
                }
              />
            </div>
          </div>

          {/* Activity Timeline */}
          <div className="bg-card rounded-2xl border border-border p-4">
            <h3 className="font-bold text-foreground mb-4 flex items-center gap-2">
              <Clock size={18} className="text-brand-600" />
              سجل النشاطات
            </h3>
            <div className="space-y-4">
              {MOCK_ACTIVITIES.map((activity, index) => (
                <div key={activity.id} className="flex gap-3">
                  {/* Timeline Line */}
                  <div className="flex flex-col items-center">
                    <div
                      className={cn(
                        "w-2.5 h-2.5 rounded-full shrink-0",
                        activity.type === "create" && "bg-brand-500",
                        activity.type === "contact" && "bg-success-500",
                        activity.type === "stage" && "bg-warning-500"
                      )}
                    />
                    {index < MOCK_ACTIVITIES.length - 1 && (
                      <div className="w-0.5 flex-1 bg-border mt-1" />
                    )}
                  </div>

                  {/* Content */}
                  <div className="pb-4">
                    <p className="text-sm text-foreground">
                      {activity.action}
                    </p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      {activity.date} — {activity.by}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="text-sm font-medium text-foreground">{value}</span>
    </div>
  );
}