"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Search,
  Plus,
  Filter,
  Users,
  LayoutGrid,
  List,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { MOCK_LEADS } from "@/lib/mock-data";
import { StageBadge } from "@/components/leads/stage-badge";
import { TemperatureBadge } from "@/components/leads/temperature-badge";
import { LeadsKanban } from "@/components/leads/leads-kanban";
import { STAGE_CONFIGS } from "@/config/stages";
import type { LeadStage, LeadTemperature } from "@/types/common.types";

export default function LeadsPage() {
  const router = useRouter();

  const [search, setSearch] = useState("");
  const [stageFilter, setStageFilter] = useState<LeadStage | "all">("all");
  const [tempFilter, setTempFilter] = useState<LeadTemperature | "all">("all");
  const [view, setView] = useState<"table" | "kanban">("table");

  const filteredLeads = useMemo(() => {
    return MOCK_LEADS.filter((lead) => {
      const matchesSearch =
        search === "" ||
        lead.childName.includes(search) ||
        lead.parentName.includes(search) ||
        lead.parentPhone.includes(search);

      const matchesStage =
        stageFilter === "all" || lead.stage === stageFilter;

      const matchesTemp =
        tempFilter === "all" || lead.temperature === tempFilter;

      return matchesSearch && matchesStage && matchesTemp;
    });
  }, [search, stageFilter, tempFilter]);

  const stageStats = useMemo(() => {
    const stats: Record<string, number> = { all: MOCK_LEADS.length };
    MOCK_LEADS.forEach((lead) => {
      stats[lead.stage] = (stats[lead.stage] || 0) + 1;
    });
    return stats;
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Users size={28} className="text-brand-600" />
            العملاء المحتملين
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            إدارة ومتابعة جميع العملاء المحتملين
          </p>
        </div>

        <Link
          href="/leads/new"
          className={cn(
            "inline-flex items-center gap-2 px-4 py-2.5 rounded-xl",
            "bg-brand-700 text-white font-semibold text-sm",
            "hover:bg-brand-600 transition-colors",
            "shadow-brand-md"
          )}
        >
          <Plus size={18} />
          إضافة عميل
        </Link>
      </div>

      {/* Stage Filter Chips */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        <button
          onClick={() => setStageFilter("all")}
          className={cn(
            "shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold transition-colors",
            stageFilter === "all"
              ? "bg-brand-700 text-white"
              : "bg-muted text-muted-foreground hover:bg-muted/80"
          )}
        >
          الكل ({stageStats.all})
        </button>
        {Object.values(STAGE_CONFIGS).map((stage) => (
          <button
            key={stage.key}
            onClick={() => setStageFilter(stage.key)}
            className={cn(
              "shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold transition-colors",
              stageFilter === stage.key
                ? "text-white"
                : "text-muted-foreground hover:opacity-80"
            )}
            style={{
              backgroundColor:
                stageFilter === stage.key ? stage.color : stage.bgColor,
              color: stageFilter === stage.key ? "white" : stage.textColor,
            }}
          >
            {stage.labelAr} ({stageStats[stage.key] || 0})
          </button>
        ))}
      </div>

      {/* Search + Filters + View Toggle */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <Search
            size={18}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
          />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="بحث بالاسم أو الهاتف..."
            className={cn(
              "w-full pr-10 pl-4 py-2.5 rounded-xl",
              "bg-card border border-border",
              "text-foreground placeholder:text-muted-foreground",
              "focus:ring-2 focus:ring-ring text-sm"
            )}
          />
        </div>

        {/* Temperature Filter */}
        <select
          value={tempFilter}
          onChange={(e) =>
            setTempFilter(e.target.value as LeadTemperature | "all")
          }
          className={cn(
            "px-4 py-2.5 rounded-xl text-sm",
            "bg-card border border-border text-foreground"
          )}
        >
          <option value="all">كل الحرارات</option>
          <option value="hot">🔴 ساخن</option>
          <option value="warm">🟡 دافئ</option>
          <option value="cold">🔵 بارد</option>
        </select>

        {/* View Toggle */}
        <div className="flex bg-muted rounded-xl p-1">
          <button
            onClick={() => setView("table")}
            className={cn(
              "p-2 rounded-lg transition-colors",
              view === "table"
                ? "bg-card text-foreground shadow-sm"
                : "text-muted-foreground"
            )}
          >
            <List size={18} />
          </button>
          <button
            onClick={() => setView("kanban")}
            className={cn(
              "p-2 rounded-lg transition-colors",
              view === "kanban"
                ? "bg-card text-foreground shadow-sm"
                : "text-muted-foreground"
            )}
          >
            <LayoutGrid size={18} />
          </button>
        </div>
      </div>

      {/* Content View */}
      {view === "table" ? (
        <div className="bg-card rounded-2xl border border-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="text-right px-4 py-3 font-semibold text-muted-foreground">
                    الطفل
                  </th>
                  <th className="text-right px-4 py-3 font-semibold text-muted-foreground">
                    ولي الأمر
                  </th>
                  <th className="text-right px-4 py-3 font-semibold text-muted-foreground">
                    المرحلة
                  </th>
                  <th className="text-right px-4 py-3 font-semibold text-muted-foreground">
                    الحرارة
                  </th>
                  <th className="text-right px-4 py-3 font-semibold text-muted-foreground">
                    المسؤول
                  </th>
                  <th className="text-right px-4 py-3 font-semibold text-muted-foreground">
                    الكورس
                  </th>
                  <th className="text-right px-4 py-3 font-semibold text-muted-foreground">
                    ملاحظات
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredLeads.map((lead) => (
                  <tr
                    key={lead.id}
                    onClick={() => router.push(`/leads/${lead.id}`)}
                    className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors cursor-pointer"
                  >
                    <td className="px-4 py-3">
                      <div>
                        <p className="font-semibold text-foreground">
                          {lead.childName}
                        </p>
                        <p className="text-muted-foreground text-xs">
                          {lead.childAge} سنة
                        </p>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div>
                        <p className="text-foreground">{lead.parentName}</p>
                        <p className="text-muted-foreground text-xs direction-ltr text-right">
                          {lead.parentPhone}
                        </p>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <StageBadge stage={lead.stage} />
                    </td>
                    <td className="px-4 py-3">
                      <TemperatureBadge temperature={lead.temperature} />
                    </td>
                    <td className="px-4 py-3 text-foreground">
                      {lead.assignedToName}
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs bg-brand-50 text-brand-700 px-2 py-0.5 rounded-full dark:bg-brand-950 dark:text-brand-300">
                        {lead.suggestedCourse ?? "—"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground text-xs max-w-[200px] truncate">
                      {lead.notes ?? "—"}
                    </td>
                  </tr>
                ))}

                {filteredLeads.length === 0 && (
                  <tr>
                    <td
                      colSpan={7}
                      className="px-4 py-12 text-center text-muted-foreground"
                    >
                      لا توجد نتائج
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <LeadsKanban leads={filteredLeads} />
      )}
    </div>
  );
}