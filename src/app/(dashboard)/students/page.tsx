"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { GraduationCap, Search } from "lucide-react";
import { useUIStore } from "@/stores/ui-store";
import { getFilterLabel, t } from "@/lib/locale";
import { STUDENT_STATUS_META, getMetaLabel } from "@/config/status-meta";
import { formatCourseLabel, formatCurrencyEgp } from "@/lib/formatters";
import { cn } from "@/lib/utils";
import { listStudents } from "@/services/students.service";
import type { StudentListItem } from "@/types/crm";
import type { StudentStatus } from "@/types/common.types";
import { EmptySearchState, LoadingState } from "@/components/shared/page-state";

export default function StudentsPage() {
  const locale = useUIStore((state) => state.locale);
  const isAr = locale === "ar";
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StudentStatus | "all">("all");
  const [students, setStudents] = useState<StudentListItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    async function load() {
      setLoading(true);
      const data = await listStudents();
      if (isMounted) {
        setStudents(data);
        setLoading(false);
      }
    }
    load();
    return () => {
      isMounted = false;
    };
  }, []);

  const filtered = useMemo(() => {
    return students.filter((student) => {
      const matchSearch = !search || student.fullName.includes(search) || student.parentName.includes(search);
      const matchStatus = statusFilter === "all" || student.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [search, statusFilter, students]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-bold text-foreground">
          <GraduationCap size={28} className="text-brand-600" />
          {t(locale, "الطلاب", "Students")}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">{t(locale, "رؤية أوضح للطلاب الحاليين والحالات التي تحتاج متابعة", "A clearer view of current students and cases that need attention")}</p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search size={18} className={cn("absolute top-1/2 -translate-y-1/2 text-muted-foreground", isAr ? "right-3" : "left-3")} />
          <input type="text" value={search} onChange={(event) => setSearch(event.target.value)} placeholder={t(locale, "بحث بالاسم أو ولي الأمر", "Search by student or parent")} className={cn("w-full rounded-xl bg-card py-2.5 text-sm text-foreground border border-border placeholder:text-muted-foreground focus:ring-2 focus:ring-ring", isAr ? "pr-10 pl-4" : "pl-10 pr-4")} />
        </div>
        <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as StudentStatus | "all")} className="rounded-xl border border-border bg-card px-4 py-2.5 text-sm text-foreground">
          <option value="all">{getFilterLabel("allStudentStatuses", locale)}</option>
          {Object.entries(STUDENT_STATUS_META).map(([key, meta]) => (
            <option key={key} value={key}>{getMetaLabel(meta, locale)}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <LoadingState
          titleAr="جارِ تحميل الطلاب"
          titleEn="Loading students"
          descriptionAr="يتم الآن تجهيز ملفات الطلاب والحالات الدراسية المرتبطة بهم."
          descriptionEn="Student records and related statuses are being prepared."
        />
      ) : (
        <div className="overflow-hidden rounded-2xl border border-border bg-card">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className={cn("px-4 py-3 font-semibold text-muted-foreground", isAr ? "text-right" : "text-left")}>{t(locale, "الطالب", "Student")}</th>
                  <th className={cn("px-4 py-3 font-semibold text-muted-foreground", isAr ? "text-right" : "text-left")}>{t(locale, "ولي الأمر", "Parent")}</th>
                  <th className={cn("px-4 py-3 font-semibold text-muted-foreground", isAr ? "text-right" : "text-left")}>{t(locale, "الحالة", "Status")}</th>
                  <th className={cn("px-4 py-3 font-semibold text-muted-foreground", isAr ? "text-right" : "text-left")}>{t(locale, "الكورس", "Course")}</th>
                  <th className={cn("px-4 py-3 font-semibold text-muted-foreground", isAr ? "text-right" : "text-left")}>{t(locale, "الكلاس", "Class")}</th>
                  <th className={cn("px-4 py-3 font-semibold text-muted-foreground", isAr ? "text-right" : "text-left")}>{t(locale, "الحضور", "Attendance")}</th>
                  <th className={cn("px-4 py-3 font-semibold text-muted-foreground", isAr ? "text-right" : "text-left")}>{t(locale, "المدفوع", "Paid")}</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((student) => {
                  const meta = STUDENT_STATUS_META[student.status];
                  return (
                    <tr key={student.id} className="border-b border-border last:border-0 transition-colors hover:bg-muted/30">
                      <td className="px-4 py-3">
                        <Link href={`/students/${student.id}`} className="group block">
                          <p className="font-semibold text-foreground transition-colors group-hover:text-brand-600">{student.fullName}</p>
                          <p className="text-xs text-muted-foreground">{student.age} {t(locale, "سنة", "years")}</p>
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-foreground">{student.parentName}</td>
                      <td className="px-4 py-3"><span className="rounded-full px-2.5 py-1 text-xs font-semibold" style={{ backgroundColor: meta.bg, color: meta.color }}>{getMetaLabel(meta, locale)}</span></td>
                      <td className="px-4 py-3"><span className="rounded-full bg-brand-50 px-2 py-0.5 text-xs text-brand-700 dark:bg-brand-950 dark:text-brand-300">{formatCourseLabel(student.currentCourse, locale)}</span></td>
                      <td className="px-4 py-3 text-xs text-foreground">{student.className ?? t(locale, "غير مسجل", "Not assigned")}</td>
                      <td className="px-4 py-3 text-foreground">{student.sessionsAttended} {t(locale, "حصة", "sessions")}</td>
                      <td className="px-4 py-3 font-semibold text-foreground">{formatCurrencyEgp(student.totalPaid, locale)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {!loading && filtered.length === 0 && <EmptySearchState />}
        </div>
      )}
    </div>
  );
}
