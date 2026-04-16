"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { InvoiceToolbar } from "@/components/payments/invoice-toolbar";
import { LoadingState, PageStateCard } from "@/components/shared/page-state";
import { t } from "@/lib/locale";
import { useUIStore } from "@/stores/ui-store";
import { getBillingCycleText, getPaymentDetails, getPaymentDisplayState, getPaymentEffectiveDueDate } from "@/services/payments.service";
import type { PaymentDetails } from "@/types/crm";

/** Convert Eastern-Arabic digits to Western 0-9 */
function _w(s: string): string {
  return s
    .replace(/[\u0660-\u0669]/g, (d) => String(d.charCodeAt(0) - 0x0660))
    .replace(/[\u06F0-\u06F9]/g, (d) => String(d.charCodeAt(0) - 0x06F0));
}


function formatCurrency(value: number, locale: "ar" | "en"): string {
  return _w(new Intl.NumberFormat(locale === "ar" ? "ar-EG" : "en-US", {
    style: "currency",
    currency: "EGP",
    maximumFractionDigits: 0,
  }).format(value));
}

function formatDateLabel(value: string | null | undefined, locale: "ar" | "en"): string {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value.slice(0, 10);
  return _w(new Intl.DateTimeFormat(locale === "ar" ? "ar-EG" : "en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(date));
}

function normalizePhone(value: string | null | undefined): string {
  const digits = (value ?? "").replace(/\D/g, "");
  if (!digits) return "";
  if (digits.startsWith("20")) return digits;
  if (digits.startsWith("0")) return `20${digits.slice(1)}`;
  return digits;
}

function getStatusLabel(status: ReturnType<typeof getPaymentDisplayState>, locale: "ar" | "en"): string {
  const labels = {
    paid: t(locale, "مدفوع", "Paid"),
    pending: t(locale, "قيد الانتظار", "Pending"),
    overdue: t(locale, "متأخر", "Overdue"),
    partial: t(locale, "مدفوع جزئيًا", "Partially paid"),
    refunded: t(locale, "مرتجع", "Refunded"),
    deferred: t(locale, "مؤجل", "Deferred"),
  } as const;
  return labels[status];
}

function getMethodLabel(method: PaymentDetails["method"], locale: "ar" | "en"): string {
  if (!method) return t(locale, "لاحقًا", "Later");

  const labels: Record<NonNullable<PaymentDetails["method"]>, string> = {
    instapay: t(locale, "إنستا باي", "Instapay"),
    bank_transfer: t(locale, "تحويل بنكي", "Bank transfer"),
    wallet: t(locale, "محفظة", "Wallet"),
    cash: t(locale, "كاش", "Cash"),
    card: t(locale, "بطاقة", "Card"),
  };

  return labels[method];
}

export function PaymentInvoiceView({ paymentId }: { paymentId: string }) {
  const locale = useUIStore((state) => state.locale);
  const isAr = locale === "ar";
  const [payment, setPayment] = useState<PaymentDetails | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function load() {
      setLoading(true);
      const details = await getPaymentDetails(paymentId);
      if (isMounted) {
        setPayment(details);
        setLoading(false);
      }
    }

    void load();

    return () => {
      isMounted = false;
    };
  }, [paymentId]);

  const shareTargets = useMemo(() => {
    if (!payment) return { whatsappUrl: undefined, mailtoUrl: undefined };

    const parentPhone = payment.parent?.phone ?? payment.student?.parentPhone ?? null;
    const parentEmail = payment.parent?.email ?? null;
    const invoiceNumber = payment.invoiceNumber ?? payment.id;
    const studentName = payment.studentName;
    const amount = formatCurrency(payment.amount, locale);
    const sessions = String(payment.sessionsCovered);
    const effectiveDueDate = formatDateLabel(getPaymentEffectiveDueDate(payment), locale);

    const whatsappMessage = encodeURIComponent(
      t(
        locale,
        `حضرتك، هذه فاتورة ${invoiceNumber} الخاصة بالطالب ${studentName} من Skidy Rein بقيمة ${amount} لعدد ${sessions} جلسات. موعد الاستحقاق الفعلي: ${effectiveDueDate}.`,
        `Here is invoice ${invoiceNumber} for ${studentName} from Skidy Rein. Amount: ${amount} for ${sessions} sessions. Effective due date: ${effectiveDueDate}.`,
      ),
    );
    const normalizedPhone = normalizePhone(parentPhone);
    const whatsappUrl = normalizedPhone ? `https://wa.me/${normalizedPhone}?text=${whatsappMessage}` : undefined;

    const mailtoBody = encodeURIComponent(
      t(
        locale,
        `مرحبًا،\n\nهذه فاتورة ${invoiceNumber} الخاصة بالطالب ${studentName}.\nالقيمة: ${amount}\nعدد الجلسات: ${sessions}\nالاستحقاق الفعلي: ${effectiveDueDate}\n\nSkidy Rein`,
        `Hello,\n\nThis is invoice ${invoiceNumber} for ${studentName}.\nAmount: ${amount}\nSessions: ${sessions}\nEffective due date: ${effectiveDueDate}\n\nSkidy Rein`,
      ),
    );
    const mailtoUrl = parentEmail
      ? `mailto:${parentEmail}?subject=${encodeURIComponent(`${t(locale, "فاتورة", "Invoice")} ${invoiceNumber} - Skidy Rein`)}&body=${mailtoBody}`
      : undefined;

    return { whatsappUrl, mailtoUrl };
  }, [payment, locale]);

  if (loading) {
    return (
      <LoadingState
        titleAr="جارِ تجهيز الفاتورة"
        titleEn="Preparing invoice"
        descriptionAr="يتم تحميل بيانات الدفعة والطباعة الآن من السجل الحقيقي."
        descriptionEn="The real payment record is being loaded for print and sharing."
      />
    );
  }

  if (!payment) {
    return (
      <PageStateCard
        variant="warning"
        titleAr="الفاتورة غير متاحة"
        titleEn="Invoice not available"
        descriptionAr="لم يتم العثور على سجل الدفعة المطلوب أو أن السجل لم يعد متاحًا."
        descriptionEn="The requested payment record was not found or is no longer available."
        actionHref="/payments"
        actionLabelAr="العودة إلى المدفوعات"
        actionLabelEn="Back to payments"
      />
    );
  }

  const invoiceNumber = payment.invoiceNumber ?? `SKR-${new Date().getFullYear()}-${payment.id.slice(0, 6).toUpperCase()}`;
  const displayStatus = getPaymentDisplayState(payment);
  const issuedAt = payment.invoiceIssuedAt ?? payment.paidAt ?? payment.dueDate;
  const effectiveDueDate = getPaymentEffectiveDueDate(payment);
  const note = payment.publicNote ?? "—";
  const parentName = payment.parent?.fullName ?? payment.parentName;
  const parentPhone = payment.parent?.phone ?? payment.student?.parentPhone ?? "—";
  const parentEmail = payment.parent?.email ?? "—";

  const rows = [
    [t(locale, "رقم الفاتورة", "Invoice number"), invoiceNumber],
    [t(locale, "الطالب", "Student"), payment.studentName],
    [t(locale, "ولي الأمر", "Parent"), parentName],
    [t(locale, "المبلغ", "Amount"), formatCurrency(payment.amount, locale)],
    [t(locale, "عدد الجلسات", "Sessions covered"), String(payment.sessionsCovered)],
    [t(locale, "الحالة", "Status"), getStatusLabel(displayStatus, locale)],
    [t(locale, "طريقة الدفع", "Payment method"), getMethodLabel(payment.method, locale)],
    [t(locale, "تاريخ الإصدار", "Issued at"), formatDateLabel(issuedAt, locale)],
    [t(locale, "الاستحقاق الأصلي", "Original due date"), formatDateLabel(payment.dueDate, locale)],
    [t(locale, "الاستحقاق الفعلي", "Effective due date"), formatDateLabel(effectiveDueDate, locale)],
    [t(locale, "بداية الباقة", "Block start"), formatDateLabel(payment.blockStartDate, locale)],
    [t(locale, "نهاية الباقة", "Block end"), formatDateLabel(payment.blockEndDate, locale)],
    [t(locale, "التأجيل حتى", "Deferred until"), formatDateLabel(payment.deferredUntil, locale)],
    [t(locale, "ملاحظات الاتفاق", "Agreement notes"), note],
  ] as const;

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-8 print:bg-white" dir={isAr ? "rtl" : "ltr"}>
      <div className="mx-auto flex max-w-5xl flex-col gap-6">
        <div className="flex items-center justify-between gap-3 print:hidden">
          <Link
            href={`/payments/${paymentId}`}
            className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
          >
            {t(locale, "العودة إلى الدفعة", "Back to payment")}
          </Link>
          <InvoiceToolbar whatsappUrl={shareTargets.whatsappUrl} mailtoUrl={shareTargets.mailtoUrl} />
        </div>

        <div className="overflow-hidden rounded-[32px] border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 bg-gradient-to-l from-indigo-600 to-violet-600 px-8 py-8 text-white">
            <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
              <div className="space-y-2">
                <p className="text-sm text-white/80">Skidy Rein</p>
                <h1 className="text-3xl font-bold">{t(locale, "فاتورة تحصيل — Skidy Rein", "Collection invoice — Skidy Rein")}</h1>
                <p className="text-sm text-white/85">{t(locale, "أكاديمية برمجة للأطفال • مستند مالي جاهز للطباعة والحفظ كـ PDF", "Kids coding academy • print-ready financial document")}</p>
              </div>
              <div className="rounded-2xl bg-white/10 px-5 py-4 text-sm backdrop-blur">
                <p className="text-white/75">{t(locale, "رقم الفاتورة", "Invoice number")}</p>
                <p className="mt-1 text-lg font-semibold">{invoiceNumber}</p>
              </div>
            </div>
          </div>

          <div className="grid gap-6 px-8 py-8 lg:grid-cols-[1.4fr_0.8fr]">
            <div className="space-y-6">
              <div className="rounded-3xl border border-slate-200 p-5">
                <h2 className="mb-4 text-xl font-semibold text-slate-900">{t(locale, "تفاصيل الفاتورة", "Invoice details")}</h2>
                <div className="grid gap-x-6 gap-y-4 sm:grid-cols-2">
                  {rows.map(([label, value]) => (
                    <div key={label} className="border-b border-dashed border-slate-200 pb-3 last:border-b-0 last:pb-0">
                      <p className="text-sm text-slate-500">{label}</p>
                      <p className="mt-1 font-medium text-slate-900">{value}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-3xl border border-slate-200 p-5">
                <h2 className="mb-4 text-xl font-semibold text-slate-900">{t(locale, "بيانات التواصل", "Contact details")}</h2>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <p className="text-sm text-slate-500">{t(locale, "ولي الأمر", "Parent")}</p>
                    <p className="mt-1 font-medium text-slate-900">{parentName}</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-500">{t(locale, "الهاتف", "Phone")}</p>
                    <p className="mt-1 font-medium text-slate-900">{parentPhone || "—"}</p>
                  </div>
                  <div className="sm:col-span-2">
                    <p className="text-sm text-slate-500">{t(locale, "البريد", "Email")}</p>
                    <p className="mt-1 font-medium text-slate-900">{parentEmail || "—"}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="rounded-3xl border border-emerald-200 bg-emerald-50 p-5">
                <p className="text-sm text-emerald-700">{t(locale, "إجمالي المستحق", "Total amount due")}</p>
                <p className="mt-2 text-3xl font-bold text-emerald-900">{formatCurrency(payment.amount, locale)}</p>
                <p className="mt-2 text-sm text-emerald-800">{getBillingCycleText(payment, locale)}</p>
              </div>

              <div className="rounded-3xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-900">
                <p className="font-semibold">{t(locale, "ملاحظة تشغيلية", "Operational note")}</p>
                <p className="mt-2 leading-7">
                  {t(
                    locale,
                    "هذه الفاتورة مرتبطة بباقة جلسات وليست باشتراك شهري ثابت. لذلك قد تنتهي الأربع جلسات خلال شهر واحد أو أكثر من شهر، كما يمكن تأجيل الاستحقاق بالاتفاق مع ولي الأمر.",
                    "This invoice is tied to a session block, not a fixed monthly subscription. The four sessions may finish within one month or over several months, and the due date can be deferred by agreement with the parent.",
                  )}
                </p>
              </div>

              <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5 text-sm text-slate-700">
                <p className="font-semibold text-slate-900">Skidy Rein</p>
                <p className="mt-2 leading-7">{t(locale, "يمكن حفظ هذه الصفحة مباشرة كملف PDF من نافذة الطباعة أو مشاركتها مع ولي الأمر عبر واتساب أو البريد.", "This page can be saved directly as a PDF from the print dialog or shared with the parent via WhatsApp or email.")}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
