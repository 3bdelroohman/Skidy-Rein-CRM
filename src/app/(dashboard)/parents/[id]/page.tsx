"use client";

import { use, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Mail, MapPin, Phone, UserCircle, MessageCircle } from "lucide-react";
import { useUIStore } from "@/stores/ui-store";
import { t } from "@/lib/locale";
import { getParentById } from "@/services/parents.service";
import { listStudents } from "@/services/students.service";
import type { ParentListItem, StudentListItem } from "@/types/crm";

export default function ParentDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const locale = useUIStore((state) => state.locale);
  const isAr = locale === "ar";
  const [parent, setParent] = useState<ParentListItem | null>(null);
  const [students, setStudents] = useState<StudentListItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    Promise.all([getParentById(id), listStudents()]).then(([parentData, studentData]) => {
      if (mounted) {
        setParent(parentData);
        setStudents(studentData);
        setLoading(false);
      }
    });
    return () => {
      mounted = false;
    };
  }, [id]);

  const relatedStudents = useMemo(() => {
    if (!parent) return [];
    return students.filter((student) => student.parentPhone === parent.phone || student.parentName === parent.fullName);
  }, [parent, students]);

  if (loading) return <div className="rounded-2xl border border-border bg-card p-12 text-center text-muted-foreground">{t(locale, "جارِ تحميل بيانات ولي الأمر...", "Loading parent details...")}</div>;
  if (!parent) return <div className="rounded-2xl border border-border bg-card p-12 text-center text-muted-foreground">{t(locale, "ولي الأمر غير موجود", "Parent not found")}</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/parents" className="rounded-xl p-2 text-muted-foreground transition-colors hover:bg-muted">{isAr ? <ArrowRight size={18} /> : <ArrowLeft size={18} />}</Link>
        <div>
          <h1 className="text-2xl font-bold text-foreground">{parent.fullName}</h1>
          <p className="text-sm text-muted-foreground">{parent.phone}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="rounded-2xl border border-border bg-card p-5 lg:col-span-2">
          <h2 className="mb-4 flex items-center gap-2 text-lg font-bold text-foreground"><UserCircle size={20} className="text-brand-600" />{t(locale, "بيانات التواصل", "Contact details")}</h2>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Info icon={Phone} label={t(locale, "الهاتف", "Phone")} value={parent.phone} href={`tel:${parent.phone}`} />
            <Info icon={MessageCircle} label="WhatsApp" value={parent.whatsapp ?? t(locale, "غير متوفر", "Not available")} href={parent.whatsapp ? `https://wa.me/2${parent.whatsapp}` : undefined} external />
            <Info icon={Mail} label={t(locale, "البريد", "Email")} value={parent.email ?? t(locale, "غير متوفر", "Not available")} href={parent.email ? `mailto:${parent.email}` : undefined} />
            <Info icon={MapPin} label={t(locale, "المدينة", "City")} value={parent.city ?? t(locale, "غير محددة", "Not set")} />
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-card p-5">
          <h3 className="mb-3 font-bold text-foreground">{t(locale, "ملخص سريع", "Quick summary")}</h3>
          <div className="space-y-3">
            <SummaryRow label={t(locale, "عدد الأطفال", "Children count")} value={String(parent.childrenCount)} />
            <SummaryRow label={t(locale, "واتساب", "WhatsApp")} value={parent.whatsapp ? t(locale, "متوفر", "Available") : t(locale, "غير متوفر", "Not available")} />
            <SummaryRow label={t(locale, "ملف طالب مرتبط", "Linked student profile")} value={relatedStudents.length > 0 ? t(locale, "نعم", "Yes") : t(locale, "لا", "No")} />
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-card p-5">
        <h3 className="mb-4 font-bold text-foreground">{t(locale, "الأطفال المرتبطون", "Linked children")}</h3>
        {relatedStudents.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
            {t(locale, "لا توجد ملفات طلاب مرتبطة بهذا الرقم أو الاسم حتى الآن", "No student profiles are linked to this parent yet")}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {relatedStudents.map((student) => (
              <Link key={student.id} href={`/students/${student.id}`} className="rounded-2xl border border-border bg-background p-4 transition-colors hover:bg-muted/40">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="font-semibold text-foreground">{student.fullName}</p>
                    <p className="mt-1 text-xs text-muted-foreground">{student.className ?? t(locale, "غير مسجل", "Not assigned")}</p>
                  </div>
                  <span className="text-xs text-muted-foreground">{student.age} {t(locale, "سنة", "years")}</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function Info({ icon: Icon, label, value, href, external }: { icon: typeof Phone; label: string; value: string; href?: string; external?: boolean }) {
  const content = (
    <div className="rounded-xl bg-muted/40 p-3">
      <div className="flex items-center gap-2 text-xs text-muted-foreground"><Icon size={14} />{label}</div>
      <p className="mt-1 font-semibold text-foreground">{value}</p>
    </div>
  );

  if (!href) return content;
  return (
    <a href={href} target={external ? "_blank" : undefined} rel={external ? "noreferrer" : undefined} className="block transition-opacity hover:opacity-85">
      {content}
    </a>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-border/70 py-2 last:border-0">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-sm font-medium text-foreground">{value}</span>
    </div>
  );
}
