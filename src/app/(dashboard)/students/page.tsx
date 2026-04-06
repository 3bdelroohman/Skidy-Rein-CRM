"use client";

import { useState, useMemo } from "react";
import { GraduationCap, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { MOCK_STUDENTS } from "@/lib/mock-data";

const STATUS_MAP: Record<string, { label: string; color: string; bg: string }> = {
  trial: { label: "تجريبي", color: "#D97706", bg: "#FFFBEB" },
  active: { label: "نشط", color: "#059669", bg: "#ECFDF5" },
  paused: { label: "متوقف", color: "#6B7280", bg: "#F3F4F6" },
  at_risk: { label: "معرّض", color: "#DC2626", bg: "#FEF2F2" },
  completed: { label: "مكتمل", color: "#2563EB", bg: "#EFF6FF" },
  churned: { label: "مغادر", color: "#991B1B", bg: "#FEF2F2" },
};

export default function StudentsPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const filtered = useMemo(() => {
    return MOCK_STUDENTS.filter((s) => {
      const matchSearch = !search || s.fullName.includes(search) || s.parentName.includes(search);
      const matchStatus = statusFilter === "all" || s.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [search, statusFilter]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <GraduationCap size={28} className="text-brand-600" />
          الطلاب
        </h1>
        <p className="text-muted-foreground text-sm mt-1">إدارة ومتابعة الطلاب المسجلين</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={18} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="بحث بالاسم..." className={cn("w-full pr-10 pl-4 py-2.5 rounded-xl", "bg-card border border-border text-foreground placeholder:text-muted-foreground", "focus:ring-2 focus:ring-ring text-sm")} />
        </div>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="px-4 py-2.5 rounded-xl text-sm bg-card border border-border text-foreground">
          <option value="all">كل الحالات</option>
          {Object.entries(STATUS_MAP).map(([key, val]) => (
            <option key={key} value={key}>{val.label}</option>
          ))}
        </select>
      </div>

      <div className="bg-card rounded-2xl border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="text-right px-4 py-3 font-semibold text-muted-foreground">الطالب</th>
                <th className="text-right px-4 py-3 font-semibold text-muted-foreground">ولي الأمر</th>
                <th className="text-right px-4 py-3 font-semibold text-muted-foreground">الحالة</th>
                <th className="text-right px-4 py-3 font-semibold text-muted-foreground">الكورس</th>
                <th className="text-right px-4 py-3 font-semibold text-muted-foreground">الكلاس</th>
                <th className="text-right px-4 py-3 font-semibold text-muted-foreground">الحضور</th>
                <th className="text-right px-4 py-3 font-semibold text-muted-foreground">المدفوع</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((s) => (
                <tr key={s.id} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors cursor-pointer">
                  <td className="px-4 py-3">
                    <p className="font-semibold text-foreground">{s.fullName}</p>
                    <p className="text-muted-foreground text-xs">{s.age} سنة</p>
                  </td>
                  <td className="px-4 py-3 text-foreground">{s.parentName}</td>
                  <td className="px-4 py-3">
                    <span className="text-xs font-semibold px-2.5 py-1 rounded-full" style={{ backgroundColor: STATUS_MAP[s.status]?.bg, color: STATUS_MAP[s.status]?.color }}>{STATUS_MAP[s.status]?.label}</span>
                  </td>
                  <td className="px-4 py-3"><span className="text-xs bg-brand-50 text-brand-700 px-2 py-0.5 rounded-full dark:bg-brand-950 dark:text-brand-300">{s.currentCourse ?? "—"}</span></td>
                  <td className="px-4 py-3 text-foreground text-xs">{s.className ?? "غير مسجل"}</td>
                  <td className="px-4 py-3 text-foreground">{s.sessionsAttended} حصة</td>
                  <td className="px-4 py-3 text-foreground font-semibold">{s.totalPaid.toLocaleString()} ج.م</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}