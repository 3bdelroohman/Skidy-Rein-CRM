"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Mail, MapPin, Phone, Search, UserCircle } from "lucide-react";
import { useUIStore } from "@/stores/ui-store";
import { t } from "@/lib/locale";
import { cn } from "@/lib/utils";
import { listParents } from "@/services/parents.service";
import type { ParentListItem } from "@/types/crm";

export default function ParentsPage() {
  const locale = useUIStore((state) => state.locale);
  const isAr = locale === "ar";
  const [search, setSearch] = useState("");
  const [parents, setParents] = useState<ParentListItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    async function load() {
      setLoading(true);
      const data = await listParents();
      if (isMounted) {
        setParents(data);
        setLoading(false);
      }
    }
    load();
    return () => {
      isMounted = false;
    };
  }, []);

  const filtered = useMemo(() => {
    return parents.filter(
      (parent) =>
        !search ||
        parent.fullName.includes(search) ||
        parent.phone.includes(search) ||
        parent.children.some((child) => child.includes(search)),
    );
  }, [parents, search]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-bold text-foreground">
          <UserCircle size={28} className="text-brand-600" />
          {t(locale, "أولياء الأمور", "Parents")}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">{t(locale, "سجل واضح لبيانات أولياء الأمور ووسائل التواصل والأطفال المرتبطين بهم", "A clean directory of parents, contact details, and linked children")}</p>
      </div>

      <div className="relative max-w-md">
        <Search size={18} className={cn("absolute top-1/2 -translate-y-1/2 text-muted-foreground", isAr ? "right-3" : "left-3")} />
        <input type="text" value={search} onChange={(event) => setSearch(event.target.value)} placeholder={t(locale, "بحث بالاسم أو الهاتف أو اسم الطفل...", "Search by name, phone, or child name...")} className={cn("w-full rounded-xl border border-border bg-card py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-ring", isAr ? "pr-10 pl-4" : "pl-10 pr-4")} />
      </div>

      {loading ? (
        <div className="rounded-2xl border border-border bg-card p-12 text-center text-muted-foreground">{t(locale, "جارِ تحميل بيانات أولياء الأمور...", "Loading parents...")}</div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((parent) => (
            <Link key={parent.id} href={`/parents/${parent.id}`} className="rounded-2xl border border-border bg-card p-4 transition-all hover:-translate-y-0.5 hover:shadow-brand-md">
              <div className="mb-3 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-100 font-bold text-brand-700 dark:bg-brand-900 dark:text-brand-300">
                  {parent.fullName.charAt(0)}
                </div>
                <div>
                  <p className="font-bold text-foreground">{parent.fullName}</p>
                  <p className="text-xs text-muted-foreground">{parent.childrenCount} {t(locale, "طفل", parent.childrenCount === 1 ? "child" : "children")}</p>
                </div>
              </div>

              <div className="space-y-2 text-xs">
                <div className="flex items-center gap-2 text-muted-foreground"><Phone size={14} />{parent.phone}</div>
                {parent.email && <div className="flex items-center gap-2 text-muted-foreground"><Mail size={14} />{parent.email}</div>}
                {parent.city && <div className="flex items-center gap-2 text-muted-foreground"><MapPin size={14} />{parent.city}</div>}
              </div>

              <div className="mt-3 border-t border-border pt-3">
                <p className="text-xs text-muted-foreground">{t(locale, "الأطفال", "Children")}</p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {parent.children.length === 0 ? (
                    <span className="rounded-full bg-muted px-2 py-1 text-[10px] text-muted-foreground">{t(locale, "لا توجد أسماء مرتبطة بعد", "No linked children yet")}</span>
                  ) : (
                    parent.children.map((child) => (
                      <span key={child} className="rounded-full bg-brand-50 px-2.5 py-1 text-[10px] font-semibold text-brand-700 dark:bg-brand-950 dark:text-brand-300">{child}</span>
                    ))
                  )}
                </div>
              </div>
            </Link>
          ))}
          {!loading && filtered.length === 0 && <div className="col-span-full rounded-2xl border border-dashed border-border bg-card p-12 text-center text-muted-foreground">{t(locale, "لا توجد نتائج مطابقة", "No matching results")}</div>}
        </div>
      )}
    </div>
  );
}
