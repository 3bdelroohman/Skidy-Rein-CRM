"use client";

import { useRouter } from "next/navigation";
import { Phone, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { KANBAN_STAGES, STAGE_CONFIGS } from "@/config/stages";
import { TemperatureBadge } from "./temperature-badge";
import type { MockLead } from "@/lib/mock-data";

interface LeadsKanbanProps {
  leads: MockLead[];
}

export function LeadsKanban({ leads }: LeadsKanbanProps) {
  const router = useRouter();

  return (
    <div className="flex gap-3 overflow-x-auto pb-4">
      {KANBAN_STAGES.map((stageKey) => {
        const config = STAGE_CONFIGS[stageKey];
        const stageLeads = leads.filter((l) => l.stage === stageKey);

        return (
          <div
            key={stageKey}
            className="shrink-0 w-[280px] flex flex-col"
          >
            {/* Column Header */}
            <div
              className="flex items-center justify-between px-3 py-2 rounded-xl mb-2"
              style={{ backgroundColor: config.bgColor }}
            >
              <div className="flex items-center gap-2">
                <div
                  className="w-2.5 h-2.5 rounded-full"
                  style={{ backgroundColor: config.color }}
                />
                <span
                  className="text-xs font-bold"
                  style={{ color: config.textColor }}
                >
                  {config.labelAr}
                </span>
              </div>
              <span
                className="text-xs font-bold px-2 py-0.5 rounded-full"
                style={{
                  backgroundColor: config.color,
                  color: "white",
                }}
              >
                {stageLeads.length}
              </span>
            </div>

            {/* Cards */}
            <div className="space-y-2 flex-1">
              {stageLeads.map((lead) => (
                <div
                  key={lead.id}
                  onClick={() => router.push(`/leads/${lead.id}`)}
                  className={cn(
                    "bg-card border border-border rounded-xl p-3",
                    "hover:shadow-brand-md transition-all cursor-pointer",
                    "group"
                  )}
                >
                  {/* Child Name + Temp */}
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="font-bold text-foreground text-sm">
                        {lead.childName}
                      </p>
                      <p className="text-muted-foreground text-xs">
                        {lead.childAge} سنة
                      </p>
                    </div>
                    <TemperatureBadge temperature={lead.temperature} />
                  </div>

                  {/* Parent */}
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-2">
                    <Phone size={12} />
                    <span>{lead.parentName}</span>
                  </div>

                  {/* Course */}
                  {lead.suggestedCourse && (
                    <span className="text-[10px] bg-brand-50 text-brand-700 px-2 py-0.5 rounded-full dark:bg-brand-950 dark:text-brand-300">
                      {lead.suggestedCourse}
                    </span>
                  )}

                  {/* Notes */}
                  {lead.notes && (
                    <p className="text-[11px] text-muted-foreground mt-2 line-clamp-2">
                      {lead.notes}
                    </p>
                  )}

                  {/* Footer */}
                  <div className="flex items-center justify-between mt-2 pt-2 border-t border-border">
                    <span className="text-[10px] text-muted-foreground">
                      {lead.assignedToName}
                    </span>
                    {lead.nextFollowUpAt && (
                      <span className="text-[10px] text-warning-600 flex items-center gap-1">
                        <Clock size={10} />
                        متابعة
                      </span>
                    )}
                  </div>
                </div>
              ))}

              {stageLeads.length === 0 && (
                <div className="border-2 border-dashed border-border rounded-xl p-6 text-center">
                  <p className="text-muted-foreground text-xs">
                    لا يوجد عملاء
                  </p>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}