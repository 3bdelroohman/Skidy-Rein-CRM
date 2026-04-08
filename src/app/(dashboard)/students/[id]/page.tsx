"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, GraduationCap, Phone, UserCircle } from "lucide-react";
import { useUIStore } from "@/stores/ui-store";
import { STUDENT_STATUS_META, getMetaLabel } from "@/config/status-meta";
import { getCourseLabel, t } from "@/lib/locale";
import { formatCurrencyEgp, formatDate } from "@/lib/formatters";
import { getStudentById } from "@/services/students.service";
import type { StudentListItem } from "@/types/crm";

export default function StudentDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const locale = useUIStore((state) => state.locale);
  const [student, setStudent] = useState<StudentListItem | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    getStudentById(id).then((data) => {
      if (mounted) {
        setStudent(data);
        setLoading(false);
      }
    });
    return () => {
      mounted = false;
    };
  }, [id]);

  if (loading) return <div className="rounded-2xl border border-border bg-card p-12 text-center text-muted-foreground">{t(locale, "جارِ تحميل بيانات الطالب...", "Loading student details...")}</div>;
  if (!student) return <div className="rounded-2xl border border-border bg-card p-12 text-center text-muted-foreground">{t(locale, "الطالب غير موجود", "Student not found")}</div>;

  const status = STUDENT_STATUS_META[student.status];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/students" className="rounded-xl p-2 text-muted-foreground transition-colors hover:bg-muted"><ArrowLeft size={18} /></Link>
        <div>
          <h1 className="text-2xl font-bold text-foreground">{student.fullName}</h1>
          <p className="text-sm text-muted-foreground">{student.parentName} — {student.parentPhone}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="rounded-2xl border border-border bg-card p-5 lg:col-span-2">
          <div className="mb-4 flex items-center gap-2">
            <GraduationCap size={20} className="text-brand-600" />
            <h2 className="text-lg font-bold text-foreground">{t(locale, "ملف الطالب", "Student profile")}</h2>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Info label={t(locale, "العمر", "Age")} value={`${student.age} ${t(locale, "سنة", "years")}`} />
            <Info label={t(locale, "الحالة", "Status")} value={getMetaLabel(status, locale)} />
            <Info label={t(locale, "الكورس الحالي", "Current course")} value={student.currentCourse ? getCourseLabel(student.currentCourse, locale) : t(locale, "غير محدد", "Not set")} />
            <Info label={t(locale, "الكلاس", "Class")} value={student.className ?? t(locale, "غير مسجل", "Not assigned")} />
            <Info label={t(locale, "تاريخ الالتحاق", "Enrollment date")} value={formatDate(student.enrollmentDate, locale)} />
            <Info label={t(locale, "عدد الحصص", "Sessions attended")} value={student.sessionsAttended.toString()} />
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-2xl border border-border bg-card p-5">
            <h3 className="mb-3 flex items-center gap-2 font-bold text-foreground"><UserCircle size={18} className="text-brand-600" />{t(locale, "ولي الأمر", "Parent")}</h3>
            <div className="space-y-3">
              <Info label={t(locale, "الاسم", "Name")} value={student.parentName} />
              <Info label={t(locale, "الهاتف", "Phone")} value={student.parentPhone} />
            </div>
          </div>
          <div className="rounded-2xl border border-border bg-card p-5">
            <h3 className="mb-3 flex items-center gap-2 font-bold text-foreground"><Phone size={18} className="text-brand-600" />{t(locale, "المالية", "Payments")}</h3>
            <Info label={t(locale, "إجمالي المدفوع", "Total paid")} value={formatCurrencyEgp(student.totalPaid, locale)} />
          </div>
        </div>
      </div>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return <div className="rounded-xl bg-muted/40 p-3"><p className="text-xs text-muted-foreground">{label}</p><p className="mt-1 font-semibold text-foreground">{value}</p></div>;
}
