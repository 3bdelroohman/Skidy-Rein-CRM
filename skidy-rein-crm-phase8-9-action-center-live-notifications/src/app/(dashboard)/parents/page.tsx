"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { MessageCircle, Search, Users } from "lucide-react";
import { useUIStore } from "@/stores/ui-store";
import { t } from "@/lib/locale";
import { cn } from "@/lib/utils";
import { listParentsWithRelations } from "@/services/relations.service";
import type { ParentListItem } from "@/types/crm";
import { EmptySearchState, LoadingState } from "@/components/shared/page-state";

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
      const data = await listParentsWithRelations();
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
    const query = search.trim().toLowerCase();
    return parents.filter((parent) => {
      if (!query) return true;
      return (
        parent.fullName.toLowerCase().includes(query) ||
        parent.phone.includes(query) ||
        parent.children.some((child) => child.toLowerCase().includes(query))
      );
    });
  }, [parents, search]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-bold text-foreground">
          <Users size={28} className="text-brand-600" />
          {t(locale, "أولياء الأمور", "Parents")}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">{t(locale, "متابعة بيانات التواصل وربط أولياء الأمور بالأطفال والعملاء المحتملين", "Track contact details and link parents with students and open leads")}</p>
      </div>

      <div className="relative max-w-md">
        <Search size={18} className={cn("absolute top-1/2 -translate-y-1/2 text-muted-foreground", isAr ? "right-3" : "left-3")} />
        <input type="text" value={search} onChange={(event) => setSearch(event.target.value)} placeholder={t(locale, "بحث بالاسم أو الهاتف أو اسم الطفل", "Search by name, phone, or child name")} className={cn("w-full rounded-xl border border-border bg-card py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-ring", isAr ? "pr-10 pl-4" : "pl-10 pr-4")} />
      </div>

      {loading ? (
        <LoadingState
          titleAr="جارِ تحميل أولياء الأمور"
          titleEn="Loading parents"
          descriptionAr="يتم الآن تجهيز ملفات أولياء الأمور وربط الأطفال والعملاء المحتملين المرتبطين بهم."
          descriptionEn="Preparing parent profiles and linking related students and open leads."
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((parent) => (
            <Link key={parent.id} href={`/parents/${parent.id}`} className="rounded-2xl border border-border bg-card p-4 transition-all hover:-translate-y-0.5 hover:shadow-brand-md">
              <div className="mb-3 flex items-start justify-between gap-3">
                <div>
                  <p className="font-bold text-foreground">{parent.fullName}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{parent.phone}</p>
                </div>
                {parent.whatsapp ? <span className="rounded-full bg-success-50 px-2 py-0.5 text-[10px] font-semibold text-success-600">WhatsApp</span> : null}
              </div>

              <div className="grid grid-cols-2 gap-2 text-center text-xs">
                <div className="rounded-xl bg-muted/50 p-2">
                  <p className="text-lg font-bold text-foreground">{parent.childrenCount}</p>
                  <p className="text-muted-foreground">{t(locale, "أطفال", "Children")}</p>
                </div>
                <div className="rounded-xl bg-muted/50 p-2">
                  <p className="text-lg font-bold text-foreground">{parent.city ?? "—"}</p>
                  <p className="text-muted-foreground">{t(locale, "المدينة", "City")}</p>
                </div>
              </div>

              <div className="mt-3 border-t border-border pt-3">
                <p className="mb-2 text-xs font-semibold text-muted-foreground">{t(locale, "الأطفال المرتبطون", "Linked children")}</p>
                <div className="flex flex-wrap gap-1.5">
                  {parent.children.length === 0 ? (
                    <span className="text-xs text-muted-foreground">{t(locale, "لا يوجد طلاب مرتبطون بعد", "No students linked yet")}</span>
                  ) : (
                    parent.children.map((child) => (
                      <span key={child} className="rounded-full bg-brand-50 px-2 py-0.5 text-[10px] text-brand-700 dark:bg-brand-950 dark:text-brand-300">{child}</span>
                    ))
                  )}
                </div>
              </div>

              <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
                <MessageCircle size={14} />
                <span>{parent.whatsapp ?? t(locale, "واتساب غير متوفر", "WhatsApp not available")}</span>
              </div>
            </Link>
          ))}
          {!loading && filtered.length === 0 ? <div className="col-span-full"><EmptySearchState /></div> : null}
        </div>
      )}
    </div>
  );
}
