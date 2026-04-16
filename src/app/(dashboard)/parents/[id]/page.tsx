"use client";

import { use, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, Mail, MapPin, MessageCircle, Phone, UserCircle, UserPlus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useUIStore } from "@/stores/ui-store";
import { STUDENT_STATUS_META, getMetaLabel } from "@/config/status-meta";
import { t, getCourseLabel, getStageLabel } from "@/lib/locale";
import { formatCurrencyEgp } from "@/lib/formatters";
import { extractLeadIdFromProjectionId, getParentDetails } from "@/services/relations.service";
import { buildStudentReportSnapshot } from "@/services/student-report.service";
import { deleteParent } from "@/services/parents.service";
import { LoadingState, PageStateCard } from "@/components/shared/page-state";
import type { ParentDetails } from "@/types/crm";

export default function ParentDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const locale = useUIStore((state) => state.locale);
  const isAr = locale === "ar";
  const [parent, setParent] = useState<ParentDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const router = useRouter();

  useEffect(() => {
    let mounted = true;
    getParentDetails(id).then((data) => {
      if (mounted) {
        setParent(data);
        setLoading(false);
      }
    });
    return () => {
      mounted = false;
    };
  }, [id]);

  const childrenSnapshots = useMemo(() => {
    if (!parent || !parent.childrenRecords) return [];
    return parent.childrenRecords.map((student) => {
      const sourceLeadId = extractLeadIdFromProjectionId(student.id);
      const snapshot = buildStudentReportSnapshot(student);
      const scheduleHref = `/schedule/new?className=${encodeURIComponent(student.className ?? "")}${student.currentCourse ? `&course=${student.currentCourse}` : ""}`;
      const createActualHref = `/students/new?parentName=${encodeURIComponent(parent.fullName)}&parentPhone=${encodeURIComponent(parent.phone)}&childName=${encodeURIComponent(student.fullName)}${student.age > 0 ? `&childAge=${student.age}` : ""}${student.currentCourse ? `&currentCourse=${student.currentCourse}` : ""}${student.className ? `&className=${encodeURIComponent(student.className)}` : ""}`;

      return { student, sourceLeadId, snapshot, scheduleHref, createActualHref };
    });
  }, [parent]);

  const projectedCount = childrenSnapshots.filter((item) => item.sourceLeadId).length;
  const actualCount = childrenSnapshots.length - projectedCount;
  const reportReadyCount = childrenSnapshots.filter((item) => item.snapshot.ready).length;
  const needsAttentionCount = childrenSnapshots.length - reportReadyCount;

  const handleDeleteParent = async () => {
    if (!parent) return;
    const confirmed = window.confirm(locale === "ar" ? "هل تريد حذف ولي الأمر نهائيًا؟" : "Delete this parent permanently?");
    if (!confirmed) return;
    setDeleting(true);
    try {
      await deleteParent(parent.id);
      toast.success(locale === "ar" ? "تم حذف ولي الأمر" : "Parent deleted");
      router.push("/parents");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : (locale === "ar" ? "تعذر حذف ولي الأمر" : "Could not delete parent"));
    } finally {
      setDeleting(false);
    }
  };



  if (loading) {
    return (
      <LoadingState
        titleAr="جارِ تحميل بيانات ولي الأمر"
        titleEn="Loading parent details"
        descriptionAr="يتم الآن تجهيز بيانات التواصل وربط الأطفال والعملاء المحتملين المرتبطين بهذا الملف."
        descriptionEn="Preparing contact details and linking students and open leads for this parent profile."
      />
    );
  }

  if (!parent) {
    return (
      <PageStateCard
        variant="warning"
        titleAr="ولي الأمر غير موجود"
        titleEn="Parent not found"
        descriptionAr="قد يكون الملف غير متاح أو أن الرابط لم يعد صالحًا. ارجع إلى قائمة أولياء الأمور واختر الملف الصحيح."
        descriptionEn="This parent profile may be unavailable or the link is no longer valid. Go back to the parents list and open the correct record."
        actionHref="/parents"
        actionLabelAr="العودة إلى أولياء الأمور"
        actionLabelEn="Back to parents"
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Link href="/parents" className="rounded-xl p-2 text-muted-foreground transition-colors hover:bg-muted">
            {isAr ? <ArrowRight size={18} /> : <ArrowLeft size={18} />}
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-foreground">{parent.fullName}</h1>
            <p className="text-sm text-muted-foreground">{parent.phone}</p>
          </div>
        <button onClick={handleDeleteParent} disabled={deleting} className="inline-flex items-center gap-2 rounded-2xl bg-red-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-red-700 disabled:opacity-50">
          <Trash2 size={16} />
          {deleting ? (locale === "ar" ? "جارِ الحذف..." : "Deleting...") : (locale === "ar" ? "حذف" : "Delete")}
        </button>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Link href={`/students/new?parentName=${encodeURIComponent(parent.fullName)}&parentPhone=${encodeURIComponent(parent.phone)}`} className="inline-flex items-center gap-2 rounded-xl bg-brand-600 px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90">
            <UserPlus size={16} />
            {t(locale, "إضافة طالب لهذا ولي الأمر", "Add student for this parent")}
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-4">
        <SummaryBox title={t(locale, "ملفات فعلية", "Real profiles")} value={String(actualCount)} />
        <SummaryBox title={t(locale, "من العملاء الحاليين", "From current customers")} value={String(projectedCount)} />
        <SummaryBox title={t(locale, "تقارير جاهزة", "Reports ready")} value={String(reportReadyCount)} />
        <SummaryBox title={t(locale, "يحتاج متابعة", "Needs follow-up")} value={String(needsAttentionCount)} />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="rounded-2xl border border-border bg-card p-5 lg:col-span-2">
          <h2 className="mb-4 flex items-center gap-2 text-lg font-bold text-foreground"><UserCircle size={20} className="text-brand-600" />{t(locale, "بيانات التواصل", "Contact details")}</h2>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Info icon={Phone} label={t(locale, "الهاتف", "Phone")} value={parent.phone} href={`tel:${parent.phone}`} />
            <Info icon={MessageCircle} label="WhatsApp" value={parent.whatsapp ?? t(locale, "غير متوفر", "Not available")} href={parent.whatsapp ? `https://wa.me/2${parent.whatsapp.replace(/\D/g, "")}` : undefined} external />
            <Info icon={Mail} label={t(locale, "البريد", "Email")} value={parent.email ?? t(locale, "غير متوفر", "Not available")} href={parent.email ? `mailto:${parent.email}` : undefined} />
            <Info icon={MapPin} label={t(locale, "المدينة", "City")} value={parent.city ?? t(locale, "غير محددة", "Not set")} />
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-card p-5">
          <h3 className="mb-3 font-bold text-foreground">{t(locale, "ملخص العلاقات", "Relationship summary")}</h3>
          <div className="space-y-3">
            <SummaryRow label={t(locale, "عدد الأطفال", "Children count")} value={String(parent.childrenCount)} />
            <SummaryRow label={t(locale, "طلاب نشطون", "Active students")} value={String(parent.activeStudents)} />
            <SummaryRow label={t(locale, "إجمالي المدفوع", "Total paid")} value={formatCurrencyEgp(parent.totalPaid, locale)} />
            <SummaryRow label={t(locale, "عملاء محتملون مفتوحون", "Open leads")} value={String(parent.openLeads.length)} />
            <SummaryRow label={t(locale, "المسؤول", "Owner")} value={parent.ownerName ?? t(locale, "غير مخصص", "Unassigned")} />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <div className="rounded-2xl border border-border bg-card p-5">
          <h3 className="mb-4 font-bold text-foreground">{t(locale, "الأطفال المرتبطون", "Linked children")}</h3>
          {childrenSnapshots.length === 0 ? (
            <EmptyCopy locale={locale} ar="لا توجد ملفات طلاب مرتبطة بهذا الرقم أو الاسم حتى الآن" en="No student profiles are linked to this parent yet" />
          ) : (
            <div className="space-y-4">
              {childrenSnapshots.map(({ student, sourceLeadId, snapshot, scheduleHref, createActualHref }) => (
                <div key={student.id} className="rounded-2xl border border-border bg-background p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-semibold text-foreground">{student.fullName}</p>
                        <span className="rounded-full px-2.5 py-1 text-[11px] font-semibold" style={{ backgroundColor: STUDENT_STATUS_META[student.status].bg, color: STUDENT_STATUS_META[student.status].color }}>
                          {getMetaLabel(STUDENT_STATUS_META[student.status], locale)}
                        </span>
                        {sourceLeadId ? (
                          <span className="rounded-full bg-warning-100 px-2.5 py-1 text-[11px] font-semibold text-warning-700 dark:bg-warning-950 dark:text-warning-300">
                            {t(locale, "من العملاء الحاليين", "From current customers")}
                          </span>
                        ) : null}
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {student.className ?? t(locale, "غير مسجل", "Not assigned")}
                        {student.currentCourse ? ` • ${getCourseLabel(student.currentCourse, locale)}` : ""}
                      </p>
                      <p className="mt-2 text-xs text-muted-foreground">
                        {t(locale, "المتبقي للتقرير التالي", "Remaining to next report")}: {snapshot.sessionsUntilNext} {t(locale, "حصص", "sessions")}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2">
                    {sourceLeadId ? (
                      <>
                        <Link href={`/leads/${sourceLeadId}`} className="rounded-xl border border-border px-3 py-2 text-xs font-semibold text-foreground transition-colors hover:bg-muted">
                          {t(locale, "فتح العميل الأصلي", "Open source lead")}
                        </Link>
                        <Link href={createActualHref} className="rounded-xl bg-brand-600 px-3 py-2 text-xs font-semibold text-white transition-opacity hover:opacity-90">
                          {t(locale, "إنشاء ملف طالب فعلي", "Create real student profile")}
                        </Link>
                        <Link href={scheduleHref} className="rounded-xl border border-border px-3 py-2 text-xs font-semibold text-foreground transition-colors hover:bg-muted">
                          {t(locale, "إضافة حصة", "Add session")}
                        </Link>
                      </>
                    ) : (
                      <>
                        <Link href={`/students/${student.id}`} className="rounded-xl bg-brand-600 px-3 py-2 text-xs font-semibold text-white transition-opacity hover:opacity-90">
                          {t(locale, "فتح ملف الطالب", "Open student profile")}
                        </Link>
                        <Link href={`/students/${student.id}/report`} className="rounded-xl border border-border px-3 py-2 text-xs font-semibold text-foreground transition-colors hover:bg-muted">
                          {t(locale, "التقرير", "Report")}
                        </Link>
                        <Link href={`/payments/new?studentId=${student.id}`} className="rounded-xl border border-border px-3 py-2 text-xs font-semibold text-foreground transition-colors hover:bg-muted">
                          {t(locale, "دفعة", "Payment")}
                        </Link>
                        <Link href={scheduleHref} className="rounded-xl border border-border px-3 py-2 text-xs font-semibold text-foreground transition-colors hover:bg-muted">
                          {t(locale, "حصة", "Session")}
                        </Link>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-border bg-card p-5">
          <h3 className="mb-4 font-bold text-foreground">{t(locale, "العملاء المحتملون المرتبطون", "Linked open leads")}</h3>
          {parent.openLeads.length === 0 ? (
            <EmptyCopy locale={locale} ar="لا توجد فرص بيع مفتوحة مرتبطة بهذا الملف" en="No open leads are linked to this profile" />
          ) : (
            <div className="space-y-3">
              {parent.openLeads.map((lead) => (
                <Link key={lead.id} href={`/leads/${lead.id}`} className="block rounded-2xl border border-border bg-background p-4 transition-colors hover:bg-muted/40">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="font-semibold text-foreground">{lead.childName}</p>
                      <p className="mt-1 text-xs text-muted-foreground">{lead.parentPhone}</p>
                    </div>
                    <span className="rounded-full bg-muted px-2.5 py-1 text-[11px] text-muted-foreground">{getStageLabel(lead.stage, locale)}</span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Info({ icon: Icon, label, value, href, external = false }: { icon: typeof Phone; label: string; value: string; href?: string; external?: boolean }) {
  const content = (
    <div className="flex items-start gap-3 rounded-xl bg-muted/40 p-3">
      <span className="mt-0.5 rounded-xl bg-background p-2 text-brand-600"><Icon size={16} /></span>
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="mt-1 break-words font-semibold text-foreground">{value}</p>
      </div>
    </div>
  );

  if (!href) return content;
  return <a href={href} target={external ? "_blank" : undefined} rel={external ? "noreferrer" : undefined} className="block transition-opacity hover:opacity-90">{content}</a>;
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return <div className="flex items-center justify-between gap-3 rounded-xl bg-muted/40 p-3"><span className="text-sm text-muted-foreground">{label}</span><span className="font-semibold text-foreground">{value}</span></div>;
}

function SummaryBox({ title, value }: { title: string; value: string }) {
  return <div className="rounded-2xl border border-border bg-card p-5"><p className="text-sm text-muted-foreground">{title}</p><p className="mt-2 text-2xl font-bold text-foreground">{value}</p></div>;
}

function EmptyCopy({ locale, ar, en }: { locale: "ar" | "en"; ar: string; en: string }) {
  return <div className="rounded-2xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">{t(locale, ar, en)}</div>;
}
