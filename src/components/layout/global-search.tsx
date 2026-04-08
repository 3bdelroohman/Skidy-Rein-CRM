"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import {
  CalendarDays,
  GraduationCap,
  Search,
  UserCircle,
  Users,
  Wallet,
  X,
} from "lucide-react";
import { formatCurrencyEgp, formatCourseLabel } from "@/lib/formatters";
import { t } from "@/lib/locale";
import { listLeads } from "@/services/leads.service";
import { listParents } from "@/services/parents.service";
import { listPayments } from "@/services/payments.service";
import { listScheduleSessions } from "@/services/schedule.service";
import { listStudents } from "@/services/students.service";
import { listTeachers } from "@/services/teachers.service";
import { useUIStore } from "@/stores/ui-store";
import type {
  LeadListItem,
  ParentListItem,
  PaymentItem,
  ScheduleSessionItem,
  StudentListItem,
  TeacherListItem,
} from "@/types/crm";

type SearchScope = "all" | "leads" | "students" | "parents" | "teachers" | "payments" | "schedule";

interface GlobalSearchProps {
  open: boolean;
  onClose: () => void;
}

const SCOPE_ORDER: SearchScope[] = ["all", "leads", "students", "parents", "teachers", "payments", "schedule"];

function includesAny(haystack: Array<string | null | undefined>, query: string): boolean {
  const normalizedQuery = query.trim().toLowerCase();
  return haystack.some((value) => value?.toLowerCase().includes(normalizedQuery));
}

export function GlobalSearch({ open, onClose }: GlobalSearchProps) {
  const locale = useUIStore((state) => state.locale);
  const isAr = locale === "ar";

  const [query, setQuery] = useState("");
  const [scope, setScope] = useState<SearchScope>("all");
  const [loading, setLoading] = useState(false);
  const [leads, setLeads] = useState<LeadListItem[]>([]);
  const [students, setStudents] = useState<StudentListItem[]>([]);
  const [parents, setParents] = useState<ParentListItem[]>([]);
  const [teachers, setTeachers] = useState<TeacherListItem[]>([]);
  const [payments, setPayments] = useState<PaymentItem[]>([]);
  const [schedule, setSchedule] = useState<ScheduleSessionItem[]>([]);

  useEffect(() => {
    if (!open) return;

    let mounted = true;
    async function load() {
      setLoading(true);
      const [leadItems, studentItems, parentItems, teacherItems, paymentItems, scheduleItems] = await Promise.all([
        listLeads(),
        listStudents(),
        listParents(),
        listTeachers(),
        listPayments(),
        listScheduleSessions(),
      ]);

      if (!mounted) return;
      setLeads(leadItems);
      setStudents(studentItems);
      setParents(parentItems);
      setTeachers(teacherItems);
      setPayments(paymentItems);
      setSchedule(scheduleItems);
      setLoading(false);
    }

    void load();
    return () => {
      mounted = false;
    };
  }, [open]);

  useEffect(() => {
    if (!open) {
      setQuery("");
      setScope("all");
    }
  }, [open]);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        if (open) onClose();
      }
      if (event.key === "Escape" && open) onClose();
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose, open]);

  const filtered = useMemo(() => {
    const normalized = query.trim();
    const canShowAll = normalized.length === 0;

    const leadResults = (scope === "all" || scope === "leads")
      ? leads.filter((item) => canShowAll || includesAny([item.childName, item.parentName, item.parentPhone, item.assignedToName], normalized)).slice(0, 6)
      : [];

    const studentResults = (scope === "all" || scope === "students")
      ? students.filter((item) => canShowAll || includesAny([item.fullName, item.parentName, item.parentPhone, item.className], normalized)).slice(0, 6)
      : [];

    const parentResults = (scope === "all" || scope === "parents")
      ? parents.filter((item) => canShowAll || includesAny([item.fullName, item.phone, item.whatsapp, item.email, item.city], normalized)).slice(0, 6)
      : [];

    const teacherResults = (scope === "all" || scope === "teachers")
      ? teachers.filter((item) => canShowAll || includesAny([item.fullName, item.phone, item.email], normalized)).slice(0, 6)
      : [];

    const paymentResults = (scope === "all" || scope === "payments")
      ? payments.filter((item) => canShowAll || includesAny([item.studentName, item.parentName, item.status, item.method], normalized)).slice(0, 6)
      : [];

    const scheduleResults = (scope === "all" || scope === "schedule")
      ? schedule.filter((item) => canShowAll || includesAny([item.className, item.teacher, item.startTime, item.endTime], normalized)).slice(0, 6)
      : [];

    return {
      leadResults,
      studentResults,
      parentResults,
      teacherResults,
      paymentResults,
      scheduleResults,
      total:
        leadResults.length +
        studentResults.length +
        parentResults.length +
        teacherResults.length +
        paymentResults.length +
        scheduleResults.length,
    };
  }, [leads, parents, payments, query, schedule, scope, students, teachers]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-start justify-center bg-black/40 px-4 py-10 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-4xl rounded-3xl border border-border bg-card shadow-2xl" onClick={(event) => event.stopPropagation()}>
        <div className="flex items-center gap-3 border-b border-border p-4">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-brand-50 text-brand-700 dark:bg-brand-950 dark:text-brand-300">
            <Search size={20} />
          </div>
          <div className="flex-1">
            <input
              autoFocus
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={t(locale, "ابحث عن عميل أو طالب أو دفعة أو كلاس...", "Search leads, students, payments, or classes...")}
              className="w-full bg-transparent text-base text-foreground outline-none placeholder:text-muted-foreground"
            />
            <p className="mt-1 text-xs text-muted-foreground">{t(locale, "اختصار لوحة المفاتيح: Ctrl/Cmd + K", "Keyboard shortcut: Ctrl/Cmd + K")}</p>
          </div>
          <button onClick={onClose} className="rounded-xl p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground" aria-label={t(locale, "إغلاق", "Close")}>
            <X size={18} />
          </button>
        </div>

        <div className="flex flex-wrap gap-2 border-b border-border px-4 py-3">
          {SCOPE_ORDER.map((item) => (
            <button
              key={item}
              onClick={() => setScope(item)}
              className={item === scope ? "rounded-full bg-brand-700 px-3 py-1.5 text-xs font-semibold text-white" : "rounded-full bg-muted px-3 py-1.5 text-xs font-semibold text-muted-foreground transition-colors hover:text-foreground"}
            >
              {getScopeLabel(item, locale)}
            </button>
          ))}
        </div>

        <div className="max-h-[70vh] overflow-y-auto p-4">
          {loading ? (
            <div className="rounded-2xl border border-border bg-background p-10 text-center text-sm text-muted-foreground">
              {t(locale, "جارِ تجهيز نتائج البحث...", "Preparing search results...")}
            </div>
          ) : filtered.total === 0 ? (
            <div className="rounded-2xl border border-dashed border-border bg-background p-10 text-center text-sm text-muted-foreground">
              {t(locale, "لا توجد نتائج مطابقة الآن", "No matching results right now")}
            </div>
          ) : (
            <div className="space-y-5">
              <ResultSection title={t(locale, "العملاء المحتملون", "Leads")} count={filtered.leadResults.length}>
                {filtered.leadResults.map((item) => (
                  <ResultLink key={item.id} href={`/leads/${item.id}`} title={item.childName} subtitle={`${item.parentName} — ${item.parentPhone}`} meta={item.assignedToName} icon={Users} onSelect={onClose} />
                ))}
              </ResultSection>

              <ResultSection title={t(locale, "الطلاب", "Students")} count={filtered.studentResults.length}>
                {filtered.studentResults.map((item) => (
                  <ResultLink key={item.id} href={`/students/${item.id}`} title={item.fullName} subtitle={`${item.parentName} — ${item.parentPhone}`} meta={item.className ?? t(locale, "غير مسجل", "Not assigned")} icon={GraduationCap} onSelect={onClose} />
                ))}
              </ResultSection>

              <ResultSection title={t(locale, "أولياء الأمور", "Parents")} count={filtered.parentResults.length}>
                {filtered.parentResults.map((item) => (
                  <ResultLink key={item.id} href={`/parents/${item.id}`} title={item.fullName} subtitle={item.phone} meta={item.city ?? t(locale, "غير محددة", "Not set")} icon={UserCircle} onSelect={onClose} />
                ))}
              </ResultSection>

              <ResultSection title={t(locale, "المدرسون", "Teachers")} count={filtered.teacherResults.length}>
                {filtered.teacherResults.map((item) => (
                  <ResultLink key={item.id} href={`/teachers/${item.id}`} title={item.fullName} subtitle={item.email} meta={`${item.classesCount} ${t(locale, "كلاس", "classes")}`} icon={Users} onSelect={onClose} />
                ))}
              </ResultSection>

              <ResultSection title={t(locale, "المدفوعات", "Payments")} count={filtered.paymentResults.length}>
                {filtered.paymentResults.map((item) => (
                  <ResultLink key={item.id} href={`/payments/${item.id}`} title={item.studentName} subtitle={item.parentName} meta={formatCurrencyEgp(item.amount, locale)} icon={Wallet} onSelect={onClose} />
                ))}
              </ResultSection>

              <ResultSection title={t(locale, "الجدول", "Schedule")} count={filtered.scheduleResults.length}>
                {filtered.scheduleResults.map((item) => (
                  <ResultLink key={item.id} href={`/schedule/${item.id}`} title={item.className} subtitle={`${item.teacher} — ${item.startTime} → ${item.endTime}`} meta={formatCourseLabel(item.course, locale)} icon={CalendarDays} onSelect={onClose} />
                ))}
              </ResultSection>
            </div>
          )}
        </div>

        <div className="border-t border-border px-4 py-3 text-xs text-muted-foreground">
          {isAr ? "نتائج سريعة للتنقل داخل النظام" : "Quick navigation results across the CRM"}
        </div>
      </div>
    </div>
  );
}

function ResultSection({ title, count, children }: { title: string; count: number; children: ReactNode }) {
  if (!count) return null;
  return (
    <section className="space-y-2">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-foreground">{title}</h3>
        <span className="text-xs text-muted-foreground">{count}</span>
      </div>
      <div className="grid grid-cols-1 gap-2 md:grid-cols-2">{children}</div>
    </section>
  );
}

function ResultLink({
  href,
  title,
  subtitle,
  meta,
  icon: Icon,
  onSelect,
}: {
  href: string;
  title: string;
  subtitle: string;
  meta: string;
  icon: typeof Search;
  onSelect: () => void;
}) {
  return (
    <Link href={href} onClick={onSelect} className="flex items-center gap-3 rounded-2xl border border-border bg-background p-3 transition-all hover:-translate-y-0.5 hover:border-brand-200 hover:shadow-sm dark:hover:border-brand-900">
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
        <Icon size={18} />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-3">
          <p className="truncate text-sm font-semibold text-foreground">{title}</p>
          <span className="shrink-0 text-[11px] text-muted-foreground">{meta}</span>
        </div>
        <p className="truncate text-xs text-muted-foreground">{subtitle}</p>
      </div>
    </Link>
  );
}

function getScopeLabel(scope: SearchScope, locale: "ar" | "en"): string {
  const map = {
    all: locale === "ar" ? "الكل" : "All",
    leads: locale === "ar" ? "العملاء" : "Leads",
    students: locale === "ar" ? "الطلاب" : "Students",
    parents: locale === "ar" ? "أولياء الأمور" : "Parents",
    teachers: locale === "ar" ? "المدرسون" : "Teachers",
    payments: locale === "ar" ? "المدفوعات" : "Payments",
    schedule: locale === "ar" ? "الجدول" : "Schedule",
  } as const;

  return map[scope];
}
