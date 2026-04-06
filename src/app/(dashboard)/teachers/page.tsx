"use client";

import { useState, useMemo } from "react";
import { BookOpen, Search, Mail, Phone } from "lucide-react";
import { cn } from "@/lib/utils";
import { MOCK_TEACHERS } from "@/lib/mock-data";

const EMP_MAP: Record<string, string> = { full_time: "دوام كامل", part_time: "دوام جزئي", freelance: "مستقل" };

export default function TeachersPage() {
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    return MOCK_TEACHERS.filter((t) => !search || t.fullName.includes(search));
  }, [search]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <BookOpen size={28} className="text-brand-600" />
          المدرسين
        </h1>
        <p className="text-muted-foreground text-sm mt-1">إدارة فريق المدرسين</p>
      </div>

      <div className="relative max-w-md">
        <Search size={18} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="بحث..." className={cn("w-full pr-10 pl-4 py-2.5 rounded-xl", "bg-card border border-border text-foreground placeholder:text-muted-foreground", "focus:ring-2 focus:ring-ring text-sm")} />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((t) => (
          <div key={t.id} className="bg-card rounded-2xl border border-border p-4 hover:shadow-brand-md transition-all">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 rounded-xl bg-brand-700 flex items-center justify-center">
                <span className="text-white font-bold">{t.fullName.charAt(2)}</span>
              </div>
              <div>
                <p className="font-bold text-foreground">{t.fullName}</p>
                <p className="text-xs text-muted-foreground">{EMP_MAP[t.employment]}</p>
              </div>
              {t.isActive && <span className="mr-auto text-[10px] bg-success-50 text-success-600 px-2 py-0.5 rounded-full font-semibold">نشط</span>}
            </div>
            <div className="flex flex-wrap gap-1.5 mb-3">
              {t.specialization.map((s) => (
                <span key={s} className="text-[10px] bg-brand-50 text-brand-700 px-2 py-0.5 rounded-full dark:bg-brand-950 dark:text-brand-300">{s}</span>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs text-center">
              <div className="bg-muted/50 rounded-xl p-2">
                <p className="text-foreground font-bold text-lg">{t.classesCount}</p>
                <p className="text-muted-foreground">كلاسات</p>
              </div>
              <div className="bg-muted/50 rounded-xl p-2">
                <p className="text-foreground font-bold text-lg">{t.studentsCount}</p>
                <p className="text-muted-foreground">طلاب</p>
              </div>
            </div>
            <div className="mt-3 pt-3 border-t border-border space-y-1.5 text-xs text-muted-foreground">
              <div className="flex items-center gap-2"><Phone size={14} />{t.phone}</div>
              <div className="flex items-center gap-2"><Mail size={14} />{t.email}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}