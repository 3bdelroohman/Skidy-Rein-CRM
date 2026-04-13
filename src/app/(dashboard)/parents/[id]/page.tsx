"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, CalendarPlus, FileText, Mail, MapPin, MessageCircle, Phone, ReceiptText, UserCircle } from "lucide-react";
import { useUIStore } from "@/stores/ui-store";
import { STUDENT_STATUS_META, getMetaLabel } from "@/config/status-meta";
import { t, getStageLabel } from "@/lib/locale";
import { formatCurrencyEgp } from "@/lib/formatters";
import { buildStudentReportSnapshot } from "@/services/student-report.service";
import { extractLeadIdFromProjectionId, getParentDetails } from "@/services/relations.service";
import { LoadingState, PageStateCard } from "@/components/shared/page-state";
import type { ParentDetails } from "@/types/crm";


export default function ParentDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const locale = useUIStore((state) => state.locale);
  const isAr = locale === "ar";
  const [parent, setParent] = useState<ParentDetails | null>(null);
  const [loading, setLoading] = useState(true);

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

  const projectedLeadId = parent ? extractLeadIdFromProjectionId(parent.id) : null;

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

  const firstChild = parent.childrenRecords[0] ?? null;
  const childrenWithSnapshots = parent.childrenRecords.map((student) => ({
    student,
    snapshot: buildStudentReportSnapshot(student),
    sourceLeadId: extractLeadIdFromProjectionId(student.id),
  }));
  const reportReadyCount = childrenWithSnapshots.filter((item) => item.snapshot.ready).length;
  const needsReportCount = childrenWithSnapshots.length - reportReadyCount;
  const nextCheckpointStudent = [...childrenWithSnapshots].sort((a, b) => a.snapshot.sessionsUntilNext - b.snapshot.sessionsUntilNext)[0] ?? null;
  const realChildrenCount = childrenWithSnapshots.filter((item) => !item.sourceLeadId).length;
  const projectedChildrenCount = childrenWithSnapshots.length - realChildrenCount;

  function buildCreateStudentHref(studentName?: string, studentAge?: number, currentCourse?: string | null, className?: string | null) {
    const params = new URLSearchParams({
      parentName: parent?.fullName ?? "",
      parentPhone: parent?.phone ?? "",
    });

    if (studentName) params.set("childName", studentName);
    if (typeof studentAge === "number" && studentAge > 0) params.set("childAge", String(studentAge));
    if (currentCourse) params.set("currentCourse", currentCourse);
    if (className) params.set("className", className);

    return `/students/new?${params.toString()}`;
  }


  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Link href="/parents" className="rounded-xl p-2 text-muted-foreground transition-colors hover:bg-muted">
            {isAr ? <ArrowRight size={18} /> : <ArrowLeft size={18} />}
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-foreground">{parent.fullName}</h1>
            <p className="text-sm text-muted-foreground">{parent.phone}</p>
          </div>
        </div>

        <Link
          href={`/students/new?parentName=${encodeURIComponent(parent.fullName)}&parentPhone=${encodeURIComponent(parent.phone)}`}
          className="inline-flex items-center gap-2 rounded-xl bg-brand-700 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-600"
        >
          {t(locale, "إضافة طالب لهذا ولي الأمر", "Add student for this parent")}
        </Link>
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
            <SummaryRow label={t(locale, "ملفات فعلية", "Real records")} value={String(realChildrenCount)} />
            <SummaryRow label={t(locale, "من العملاء الحاليين", "Projected from won leads")} value={String(projectedChildrenCount)} />
            <SummaryRow label={t(locale, "إجمالي المدفوع", "Total paid")} value={formatCurrencyEgp(parent.totalPaid, locale)} />
            <SummaryRow label={t(locale, "عملاء محتملون مفتوحون", "Open leads")} value={String(parent.openLeads.length)} />
            <SummaryRow label={t(locale, "المسؤول", "Owner")} value={parent.ownerName ?? t(locale, "غير مخصص", "Unassigned")} />
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            {projectedLeadId ? (
              <Link href={`/leads/${projectedLeadId}`} className="inline-flex items-center rounded-xl border border-border px-4 py-2 text-sm font-semibold text-foreground transition-colors hover:bg-muted">
                {t(locale, "فتح العميل الأصلي", "Open source lead")}
              </Link>
            ) : null}
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-card p-5">
          <h3 className="mb-3 flex items-center gap-2 font-bold text-foreground"><ReceiptText size={18} className="text-brand-600" />{t(locale, "المتابعة التشغيلية", "Operational snapshot")}</h3>
          <div className="space-y-3">
            <SummaryRow label={t(locale, "تقارير جاهزة", "Reports ready")} value={String(reportReadyCount)} />
            <SummaryRow label={t(locale, "تحتاج متابعة", "Need follow-up")} value={String(needsReportCount)} />
            <SummaryRow label={t(locale, "الطفل الأقرب للتقرير", "Closest to report")} value={nextCheckpointStudent ? nextCheckpointStudent.student.fullName : t(locale, "لا يوجد", "None")} />
          </div>
          {nextCheckpointStudent ? (
            <p className="mt-3 text-xs text-muted-foreground">
              {t(locale, "المتبقي", "Remaining")}: {nextCheckpointStudent.snapshot.sessionsUntilNext} {t(locale, "حصص", "sessions")}
            </p>
          ) : null}
        </div>

        <div className="rounded-2xl border border-border bg-card p-5">
          <h3 className="mb-3 flex items-center gap-2 font-bold text-foreground"><FileText size={18} className="text-brand-600" />{t(locale, "إجراءات سريعة", "Quick actions")}</h3>
          <div className="flex flex-wrap gap-2">
            <Link
              href={`/students/new?parentName=${encodeURIComponent(parent.fullName)}&parentPhone=${encodeURIComponent(parent.phone)}`}
              className="inline-flex items-center rounded-xl bg-brand-700 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-600"
            >
              {t(locale, "إضافة طالب", "Add student")}
            </Link>
            {firstChild ? (
              extractLeadIdFromProjectionId(firstChild.id) ? (
                <>
                  <Link href={buildCreateStudentHref(firstChild.fullName, firstChild.age, firstChild.currentCourse, firstChild.className)} className="inline-flex items-center rounded-xl border border-border px-4 py-2 text-sm font-semibold text-foreground transition-colors hover:bg-muted">
                    {t(locale, "إنشاء أول ملف طالب", "Create first student record")}
                  </Link>
                  <Link href={`/leads/${extractLeadIdFromProjectionId(firstChild.id)}`} className="inline-flex items-center rounded-xl border border-border px-4 py-2 text-sm font-semibold text-foreground transition-colors hover:bg-muted">
                    {t(locale, "فتح العميل الأصلي", "Open source lead")}
                  </Link>
                </>
              ) : (
                <>
                  <Link href={`/students/${firstChild.id}/report`} className="inline-flex items-center rounded-xl border border-border px-4 py-2 text-sm font-semibold text-foreground transition-colors hover:bg-muted">
                    {t(locale, "تقرير أول طالب", "First child report")}
                  </Link>
                  <Link href={`/payments/new?studentId=${firstChild.id}`} className="inline-flex items-center rounded-xl border border-border px-4 py-2 text-sm font-semibold text-foreground transition-colors hover:bg-muted">
                    {t(locale, "إضافة دفعة", "Add payment")}
                  </Link>
                </>
              )
            ) : null}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <div className="rounded-2xl border border-border bg-card p-5">
          <h3 className="mb-4 font-bold text-foreground">{t(locale, "الأطفال المرتبطون", "Linked children")}</h3>
          {parent.childrenRecords.length === 0 ? (
            <div className="space-y-3">
              <EmptyCopy locale={locale} ar="لا توجد ملفات طلاب مرتبطة بهذا الرقم أو الاسم حتى الآن" en="No student profiles are linked to this parent yet" />
              <Link
                href={`/students/new?parentName=${encodeURIComponent(parent.fullName)}&parentPhone=${encodeURIComponent(parent.phone)}`}
                className="inline-flex items-center rounded-xl border border-border px-4 py-2 text-sm font-semibold text-foreground transition-colors hover:bg-muted"
              >
                {t(locale, "إنشاء طالب الآن", "Create student now")}
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {childrenWithSnapshots.map(({ student, snapshot, sourceLeadId }) => {
                const studentHref = sourceLeadId ? `/leads/${sourceLeadId}` : `/students/${student.id}`;
                const scheduleHref = `/schedule/new?parentName=${encodeURIComponent(parent.fullName)}&studentName=${encodeURIComponent(student.fullName)}${student.className ? `&className=${encodeURIComponent(student.className)}` : ""}${student.currentCourse ? `&course=${student.currentCourse}` : ""}`;
                return (
                  <div key={student.id} className="rounded-2xl border border-border bg-background p-4">
                    <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-semibold text-foreground">{student.fullName}</p>
                          {sourceLeadId ? <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-semibold text-amber-700">{t(locale, "من العملاء الحاليين", "From won lead")}</span> : null}
                          <span className="rounded-full px-2.5 py-1 text-[11px] font-semibold" style={{ backgroundColor: STUDENT_STATUS_META[student.status].bg, color: STUDENT_STATUS_META[student.status].color }}>
                            {getMetaLabel(STUDENT_STATUS_META[student.status], locale)}
                          </span>
                        </div>
                        <p className="mt-1 text-xs text-muted-foreground">{student.className ?? t(locale, "غير مسجل", "Not assigned")}</p>
                        <p className="mt-2 text-xs text-muted-foreground">
                          {t(locale, "الحصص المنجزة", "Sessions attended")}: {student.sessionsAttended} • {t(locale, "المتبقي للتقرير", "Remaining to report")}: {snapshot.sessionsUntilNext}
                        </p>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <Link href={studentHref} className="rounded-xl border border-border px-3 py-2 text-xs font-semibold text-foreground transition-colors hover:bg-muted">
                          {sourceLeadId ? t(locale, "فتح العميل الأصلي", "Open source lead") : t(locale, "فتح ملف الطالب", "Open student profile")}
                        </Link>
                        {sourceLeadId ? (
                          <Link href={buildCreateStudentHref(student.fullName, student.age, student.currentCourse, student.className)} className="rounded-xl bg-brand-600 px-3 py-2 text-xs font-semibold text-white transition-opacity hover:opacity-90">
                            {t(locale, "إنشاء ملف طالب فعلي", "Create real student record")}
                          </Link>
                        ) : (
                          <>
                            <Link href={`/students/${student.id}/report`} className="rounded-xl border border-border px-3 py-2 text-xs font-semibold text-foreground transition-colors hover:bg-muted">
                              {t(locale, "التقرير", "Report")}
                            </Link>
                            <Link href={`/payments/new?studentId=${student.id}`} className="rounded-xl border border-border px-3 py-2 text-xs font-semibold text-foreground transition-colors hover:bg-muted">
                              {t(locale, "دفعة", "Payment")}
                            </Link>
                          </>
                        )}
                        <Link href={scheduleHref} className="inline-flex items-center gap-1 rounded-xl border border-border px-3 py-2 text-xs font-semibold text-foreground transition-colors hover:bg-muted">
                          <CalendarPlus size={14} />
                          {t(locale, "حصة", "Session")}
                        </Link>
                      </div>
                    </div>
                  </div>
                );
              })}
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

function EmptyCopy({ locale, ar, en }: { locale: "ar" | "en"; ar: string; en: string }) {
  return <div className="rounded-2xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">{t(locale, ar, en)}</div>;
}
