"use client";

import { useState, useMemo } from "react";
import { UserCircle, Search, Phone, Mail, MapPin } from "lucide-react";
import { cn } from "@/lib/utils";
import { MOCK_PARENTS } from "@/lib/mock-data";

export default function ParentsPage() {
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    return MOCK_PARENTS.filter((p) => !search || p.fullName.includes(search) || p.phone.includes(search));
  }, [search]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <UserCircle size={28} className="text-brand-600" />
          أولياء الأمور
        </h1>
        <p className="text-muted-foreground text-sm mt-1">بيانات أولياء الأمور وأطفالهم</p>
      </div>

      <div className="relative max-w-md">
        <Search size={18} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="بحث بالاسم أو الهاتف..." className={cn("w-full pr-10 pl-4 py-2.5 rounded-xl", "bg-card border border-border text-foreground placeholder:text-muted-foreground", "focus:ring-2 focus:ring-ring text-sm")} />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((p) => (
          <div key={p.id} className="bg-card rounded-2xl border border-border p-4 hover:shadow-brand-md transition-all cursor-pointer">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-brand-100 dark:bg-brand-900 flex items-center justify-center">
                <span className="text-brand-700 dark:text-brand-300 font-bold text-sm">{p.fullName.charAt(0)}</span>
              </div>
              <div>
                <p className="font-bold text-foreground">{p.fullName}</p>
                <p className="text-xs text-muted-foreground">{p.childrenCount} أطفال</p>
              </div>
            </div>
            <div className="space-y-2 text-xs">
              <div className="flex items-center gap-2 text-muted-foreground"><Phone size={14} />{p.phone}</div>
              {p.email && <div className="flex items-center gap-2 text-muted-foreground"><Mail size={14} />{p.email}</div>}
              {p.city && <div className="flex items-center gap-2 text-muted-foreground"><MapPin size={14} />{p.city}</div>}
            </div>
            <div className="mt-3 pt-3 border-t border-border">
              <p className="text-xs text-muted-foreground">الأطفال: <span className="text-foreground font-medium">{p.children.join("، ")}</span></p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}