"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { BookOpen, Mail, Phone, Search } from "lucide-react";
import { useUIStore } from "@/stores/ui-store";
import { COURSE_TYPE_LABELS, COURSE_TYPE_EN_LABELS } from "@/config/labels";
import { getEmploymentTypeLabel, t } from "@/lib/locale";
import { cn } from "@/lib/utils";
import { listTeachers } from "@/services/teachers.service";
import type { TeacherListItem } from "@/types/crm";
import { EmptySearchState, LoadingState } from "@/components/shared/page-state";

export default function TeachersPage() {
  const locale = useUIStore((state) => state.locale);
  const isAr = locale === "ar";
  const [search, setSearch] = useState("");
  const [teachers, setTeachers] = useState<TeacherListItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    async function load() {
      setLoading(true);
      const data = await listTeachers();
      if (isMounted) {
        setTeachers(data);
        setLoading(false);
      }
    }
    load();
    return () => {
      isMounted = false;
    };
  }, []);

  const filtered = useMemo(() => {
    return teachers.filter(
      (teacher) =>
        !search ||
        teacher.fullName.includes(search) ||
        teacher.specialization.some((item) => (isAr ? COURSE_TYPE_LABELS[item] : COURSE_TYPE_EN_LABELS[item]).toLowerCase().includes(search.toLowerCase())),
    );
  }, [teachers, search, isAr]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-bold text-foreground">
          <BookOpen size={28} className="text-brand-600" />
          {t(locale, "المدرسين", "Teachers")}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">{t(locale, "إدارة فريق المدرسين والتخصصات والأعباء الحالية", "Manage teachers, specializations, and current load")}</p>
      </div>

      <div className="relative max-w-md">
        <Search size={18} className={cn("absolute top-1/2 -translate-y-1/2 text-muted-foreground", isAr ? "right-3" : "left-3")} />
        <input type="text" value={search} onChange={(event) => setSearch(event.target.value)} placeholder={t(locale, "بحث بالاسم أو التخصص...", "Search by name or specialization...")} className={cn("w-full rounded-xl border border-border bg-card py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-ring", isAr ? "pr-10 pl-4" : "pl-10 pr-4")} />
      </div>

      {loading ? (
        <LoadingState
          titleAr="جارِ تحميل المدرسين"
          titleEn="Loading teachers"
          descriptionAr="يتم الآن تجهيز ملفات المدرسين والتخصصات المرتبطة بهم."
          descriptionEn="Teacher profiles and specializations are being prepared."
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((teacher) => (
            <Link key={teacher.id} href={`/teachers/${teacher.id}`} className="rounded-2xl border border-border bg-card p-4 transition-all hover:-translate-y-0.5 hover:shadow-brand-md">
              <div className="mb-3 flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-700">
                  <span className="font-bold text-white">{teacher.fullName.replace("أ. ", "").charAt(0)}</span>
                </div>
                <div>
                  <p className="font-bold text-foreground">{teacher.fullName}</p>
                  <p className="text-xs text-muted-foreground">{getEmploymentTypeLabel(teacher.employment, locale)}</p>
                </div>
                {teacher.isActive && <span className={cn("rounded-full bg-success-50 px-2 py-0.5 text-[10px] font-semibold text-success-600", isAr ? "mr-auto" : "ml-auto")}>{t(locale, "نشط", "Active")}</span>}
              </div>

              <div className="mb-3 flex flex-wrap gap-1.5">
                {teacher.specialization.map((item) => (
                  <span key={item} className="rounded-full bg-brand-50 px-2 py-0.5 text-[10px] text-brand-700 dark:bg-brand-950 dark:text-brand-300">{isAr ? COURSE_TYPE_LABELS[item] : COURSE_TYPE_EN_LABELS[item]}</span>
                ))}
              </div>

              <div className="grid grid-cols-2 gap-2 text-center text-xs">
                <div className="rounded-xl bg-muted/50 p-2">
                  <p className="text-lg font-bold text-foreground">{teacher.classesCount}</p>
                  <p className="text-muted-foreground">{t(locale, "كلاسات", "Classes")}</p>
                </div>
                <div className="rounded-xl bg-muted/50 p-2">
                  <p className="text-lg font-bold text-foreground">{teacher.studentsCount}</p>
                  <p className="text-muted-foreground">{t(locale, "طلاب", "Students")}</p>
                </div>
              </div>

              <div className="mt-3 space-y-1.5 border-t border-border pt-3 text-xs text-muted-foreground">
                <div className="flex items-center gap-2"><Phone size={14} />{teacher.phone}</div>
                <div className="flex items-center gap-2"><Mail size={14} />{teacher.email}</div>
              </div>
            </Link>
          ))}
          {!loading && filtered.length === 0 && <div className="col-span-full"><EmptySearchState /></div>}
        </div>
      )}
    </div>
  );
}
