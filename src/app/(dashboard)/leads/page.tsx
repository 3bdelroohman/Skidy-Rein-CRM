"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Filter, LayoutGrid, List, Plus, Search, Users } from "lucide-react";
import { StageBadge } from "@/components/leads/stage-badge";
import { TemperatureBadge } from "@/components/leads/temperature-badge";
import { LeadsKanban } from "@/components/leads/leads-kanban";
import { FILTER_EN_LABELS, FILTER_LABELS, TEMPERATURE_EN_LABELS, TEMPERATURE_LABELS } from "@/config/labels";
import { STAGE_CONFIGS } from "@/config/stages";
import { t, getStageLabel } from "@/lib/locale";
import { useUIStore } from "@/stores/ui-store";
import { cn } from "@/lib/utils";
import { listLeads } from "@/services/leads.service";
import type { LeadListItem } from "@/types/crm";
import type { LeadStage, LeadTemperature } from "@/types/common.types";

export default function LeadsPage() {
  const router = useRouter();
  const locale = useUIStore((state) => state.locale);
  const isAr = locale === "ar";
  const [search, setSearch] = useState("");
  const [stageFilter, setStageFilter] = useState<LeadStage | "all">("all");
  const [tempFilter, setTempFilter] = useState<LeadTemperature | "all">("all");
  const [view, setView] = useState<"table" | "kanban">("table");
  const [leads, setLeads] = useState<LeadListItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    async function load() {
      setLoading(true);
      const data = await listLeads();
      if (isMounted) {
        setLeads(data);
        setLoading(false);
      }
    }
    load();
    return () => {
      isMounted = false;
    };
  }, []);

  const filteredLeads = useMemo(() => {
    return leads.filter((lead) => {
      const matchesSearch = search === "" || lead.childName.includes(search) || lead.parentName.includes(search) || lead.parentPhone.includes(search);
      const matchesStage = stageFilter === "all" || lead.stage === stageFilter;
      const matchesTemp = tempFilter === "all" || lead.temperature === tempFilter;
      return matchesSearch && matchesStage && matchesTemp;
    });
  }, [leads, search, stageFilter, tempFilter]);

  const stageStats = useMemo(() => {
    const stats: Record<string, number> = { all: leads.length };
    leads.forEach((lead) => {
      stats[lead.stage] = (stats[lead.stage] || 0) + 1;
    });
    return stats;
  }, [leads]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold text-foreground"><Users size={28} className="text-brand-600" />{t(locale, "العملاء المحتملين", "Leads")}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{t(locale, "إدارة ومتابعة مسار العملاء المحتملين", "Manage and track the lead pipeline")}</p>
        </div>

        <Link href="/leads/new" className={cn("inline-flex items-center gap-2 rounded-xl px-4 py-2.5 bg-brand-700 text-sm font-semibold text-white shadow-brand-md transition-colors hover:bg-brand-600")}>
          <Plus size={18} />
          {t(locale, "إضافة عميل", "Add lead")}
        </Link>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-2">
        <button onClick={() => setStageFilter("all")} className={cn("shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold transition-colors", stageFilter === "all" ? "bg-brand-700 text-white" : "bg-muted text-muted-foreground hover:bg-muted/80")}>{(isAr ? FILTER_LABELS.allStages : FILTER_EN_LABELS.allStages)} ({stageStats.all || 0})</button>
        {Object.values(STAGE_CONFIGS).map((stage) => (
          <button key={stage.key} onClick={() => setStageFilter(stage.key)} className="shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold transition-colors hover:opacity-90" style={{ backgroundColor: stageFilter === stage.key ? stage.color : stage.bgColor, color: stageFilter === stage.key ? "white" : stage.textColor }}>
            {getStageLabel(stage.key, locale)} ({stageStats[stage.key] || 0})
          </button>
        ))}
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search size={18} className={cn("absolute top-1/2 -translate-y-1/2 text-muted-foreground", isAr ? "right-3" : "left-3")} />
          <input type="text" value={search} onChange={(event) => setSearch(event.target.value)} placeholder={t(locale, "ابحث باسم الطفل أو ولي الأمر أو الهاتف", "Search by child, parent, or phone")} className={cn("w-full rounded-xl border border-border bg-card py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-ring", isAr ? "pr-10 pl-4" : "pl-10 pr-4")} />
        </div>

        <div className="flex gap-2">
          <div className="relative">
            <Filter size={16} className={cn("absolute top-1/2 -translate-y-1/2 text-muted-foreground", isAr ? "right-3" : "left-3")} />
            <select value={tempFilter} onChange={(event) => setTempFilter(event.target.value as LeadTemperature | "all")} className={cn("appearance-none rounded-xl border border-border bg-card py-2.5 text-sm text-foreground", isAr ? "pr-9 pl-4" : "pl-9 pr-4")}>
              <option value="all">{isAr ? FILTER_LABELS.allTemperatures : FILTER_EN_LABELS.allTemperatures}</option>
              {Object.entries(isAr ? TEMPERATURE_LABELS : TEMPERATURE_EN_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
            </select>
          </div>

          <div className="flex rounded-xl border border-border bg-card p-1">
            <button onClick={() => setView("table")} className={cn("rounded-lg px-3 py-1.5 transition-colors", view === "table" ? "bg-brand-700 text-white" : "text-muted-foreground")} title={t(locale, "عرض جدول", "Table view")}><List size={16} /></button>
            <button onClick={() => setView("kanban")} className={cn("rounded-lg px-3 py-1.5 transition-colors", view === "kanban" ? "bg-brand-700 text-white" : "text-muted-foreground")} title={t(locale, "عرض كانبان", "Kanban view")}><LayoutGrid size={16} /></button>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="rounded-2xl border border-border bg-card p-12 text-center text-muted-foreground">{t(locale, "جارِ تحميل العملاء...", "Loading leads...")}</div>
      ) : filteredLeads.length === 0 ? (
        <div className="rounded-2xl border border-border bg-card p-12 text-center text-muted-foreground">{t(locale, "لا يوجد عملاء مطابقون للفلاتر الحالية", "No leads match the current filters")}</div>
      ) : view === "kanban" ? (
        <LeadsKanban leads={filteredLeads} />
      ) : (
        <div className="overflow-hidden rounded-2xl border border-border bg-card">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className={cn("px-4 py-3 font-semibold text-muted-foreground", isAr ? "text-right" : "text-left")}>{t(locale, "الطفل", "Child")}</th>
                  <th className={cn("px-4 py-3 font-semibold text-muted-foreground", isAr ? "text-right" : "text-left")}>{t(locale, "ولي الأمر", "Parent")}</th>
                  <th className={cn("px-4 py-3 font-semibold text-muted-foreground", isAr ? "text-right" : "text-left")}>{t(locale, "المرحلة", "Stage")}</th>
                  <th className={cn("px-4 py-3 font-semibold text-muted-foreground", isAr ? "text-right" : "text-left")}>{t(locale, "الاهتمام", "Temperature")}</th>
                  <th className={cn("px-4 py-3 font-semibold text-muted-foreground", isAr ? "text-right" : "text-left")}>{t(locale, "المسؤول", "Owner")}</th>
                  <th className={cn("px-4 py-3 font-semibold text-muted-foreground", isAr ? "text-right" : "text-left")}>{t(locale, "آخر متابعة", "Last contact")}</th>
                </tr>
              </thead>
              <tbody>
                {filteredLeads.map((lead) => (
                  <tr key={lead.id} onClick={() => router.push(`/leads/${lead.id}`)} className="cursor-pointer border-b border-border transition-colors last:border-0 hover:bg-muted/30">
                    <td className="px-4 py-3"><p className="font-semibold text-foreground">{lead.childName}</p><p className="text-xs text-muted-foreground">{lead.childAge} {t(locale, "سنة", "years")}</p></td>
                    <td className="px-4 py-3"><p className="text-foreground">{lead.parentName}</p><p className="text-xs text-muted-foreground">{lead.parentPhone}</p></td>
                    <td className="px-4 py-3"><StageBadge stage={lead.stage} /></td>
                    <td className="px-4 py-3"><TemperatureBadge temperature={lead.temperature} /></td>
                    <td className="px-4 py-3 text-foreground">{lead.assignedToName}</td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">{lead.lastContactAt ? new Date(lead.lastContactAt).toLocaleDateString(isAr ? "ar-EG" : "en-US") : t(locale, "لم يتم", "Not yet")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
