"use client";

import { useRouter } from "next/navigation";
import { Clock, Phone } from "lucide-react";
import { cn } from "@/lib/utils";
import { KANBAN_STAGES, STAGE_CONFIGS } from "@/config/stages";
import { TemperatureBadge } from "@/components/leads/temperature-badge";
import { formatCourseLabel } from "@/lib/formatters";
import { getStageLabel, t } from "@/lib/locale";
import { useUIStore } from "@/stores/ui-store";
import type { LeadListItem } from "@/types/crm";

interface LeadsKanbanProps {
  leads: LeadListItem[];
}

export function LeadsKanban({ leads }: LeadsKanbanProps) {
  const router = useRouter();
  const locale = useUIStore((state) => state.locale);

  return (
    <div className="flex gap-3 overflow-x-auto pb-4">
      {KANBAN_STAGES.map((stageKey) => {
        const config = STAGE_CONFIGS[stageKey];
        const stageLeads = leads.filter((lead) => lead.stage === stageKey);

        return (
          <div key={stageKey} className="flex w-[280px] shrink-0 flex-col">
            <div className="mb-2 flex items-center justify-between rounded-xl px-3 py-2" style={{ backgroundColor: config.bgColor }}>
              <div className="flex items-center gap-2">
                <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: config.color }} />
                <span className="text-xs font-bold" style={{ color: config.textColor }}>{getStageLabel(stageKey, locale)}</span>
              </div>
              <span className="rounded-full px-2 py-0.5 text-xs font-bold text-white" style={{ backgroundColor: config.color }}>{stageLeads.length}</span>
            </div>

            <div className="flex-1 space-y-2">
              {stageLeads.map((lead) => (
                <div key={lead.id} onClick={() => router.push(`/leads/${lead.id}`)} className={cn("group cursor-pointer rounded-xl border border-border bg-card p-3 transition-all hover:shadow-brand-md")}>
                  <div className="mb-2 flex items-start justify-between">
                    <div>
                      <p className="text-sm font-bold text-foreground">{lead.childName}</p>
                      <p className="text-xs text-muted-foreground">{lead.childAge} {t(locale, "سنة", "years")}</p>
                    </div>
                    <TemperatureBadge temperature={lead.temperature} />
                  </div>

                  <div className="mb-2 flex items-center gap-1.5 text-xs text-muted-foreground"><Phone size={12} /><span>{lead.parentName}</span></div>

                  {lead.suggestedCourse && <span className="rounded-full bg-brand-50 px-2 py-0.5 text-[10px] text-brand-700 dark:bg-brand-950 dark:text-brand-300">{formatCourseLabel(lead.suggestedCourse, locale)}</span>}
                  {lead.notes && <p className="mt-2 line-clamp-2 text-[11px] text-muted-foreground">{lead.notes}</p>}

                  <div className="mt-2 flex items-center justify-between border-t border-border pt-2">
                    <span className="text-[10px] text-muted-foreground">{lead.assignedToName}</span>
                    {lead.nextFollowUpAt && <span className="flex items-center gap-1 text-[10px] text-warning-600"><Clock size={10} />{t(locale, "متابعة", "Follow-up")}</span>}
                  </div>
                </div>
              ))}

              {stageLeads.length === 0 && <div className="rounded-xl border-2 border-dashed border-border p-6 text-center"><p className="text-xs text-muted-foreground">{t(locale, "لا يوجد عملاء", "No leads")}</p></div>}
            </div>
          </div>
        );
      })}
    </div>
  );
}
