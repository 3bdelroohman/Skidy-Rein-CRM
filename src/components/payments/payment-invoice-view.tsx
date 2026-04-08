import Link from "next/link";
import { notFound } from "next/navigation";

import { getPaymentDetails } from "@/services/payments.service";
import { InvoiceToolbar } from "@/components/payments/invoice-toolbar";

type JsonRecord = Record<string, unknown>;

function asRecord(value: unknown): JsonRecord | null {
  return value !== null && typeof value === "object" && !Array.isArray(value)
    ? (value as JsonRecord)
    : null;
}

function asString(value: unknown, fallback = "—"): string {
  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed.length ? trimmed : fallback;
  }
  if (typeof value === "number") return String(value);
  return fallback;
}

function asNumber(value: unknown, fallback = 0): number {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
  }
  return fallback;
}

function formatCurrencyEgp(value: number): string {
  return new Intl.NumberFormat("ar-EG", {
    style: "currency",
    currency: "EGP",
    maximumFractionDigits: 0,
  }).format(value);
}

function normalizePhone(value: string): string {
  const digits = value.replace(/\D/g, "");
  if (!digits) return "";
  if (digits.startsWith("20")) return digits;
  if (digits.startsWith("0")) return `20${digits.slice(1)}`;
  return digits;
}

export async function PaymentInvoiceView({ paymentId }: { paymentId: string }) {
  const details = await getPaymentDetails(paymentId);

  if (!details) {
    notFound();
  }

  const detailsRecord = asRecord(details);
  if (!detailsRecord) {
    notFound();
  }

  const payment = asRecord(detailsRecord.payment) ?? detailsRecord;
  const student = asRecord(detailsRecord.student);
  const parent = asRecord(detailsRecord.parent) ?? asRecord(detailsRecord.guardian);

  const invoiceNumber =
    asString(payment?.invoiceNumber, "") !== "—"
      ? asString(payment?.invoiceNumber)
      : asString(payment?.invoice_number, "") !== "—"
        ? asString(payment?.invoice_number)
        : `SKR-${new Date().getFullYear()}-${paymentId.padStart(4, "0")}`;

  const amount = asNumber(payment?.amount);
  const sessionsCount = asNumber(
    payment?.sessionsCount ?? payment?.sessions_count ?? payment?.blockSize ?? payment?.block_size,
    4,
  );
  const status = asString(payment?.status, "pending");
  const method = asString(payment?.method, "لاحقًا");
  const issuedAt = asString(payment?.created_at ?? payment?.issuedAt ?? payment?.issued_at, new Date().toISOString().slice(0, 10));
  const dueDate = asString(payment?.dueDate ?? payment?.due_date, "—");
  const packageStart = asString(payment?.packageStart ?? payment?.package_start ?? payment?.startDate ?? payment?.start_date, "—");
  const packageEnd = asString(payment?.packageEnd ?? payment?.package_end ?? payment?.endDate ?? payment?.end_date, "—");
  const deferredUntil = asString(payment?.deferredUntil ?? payment?.deferred_until, "—");
  const notes = asString(payment?.notes, "—");

  const studentName = asString(student?.name ?? payment?.studentName ?? payment?.student_name, "الطالب");
  const parentName = asString(parent?.name ?? payment?.parentName ?? payment?.parent_name, "ولي الأمر");
  const parentPhone = asString(parent?.phone ?? payment?.parentPhone ?? payment?.parent_phone, "");
  const parentEmail = asString(parent?.email ?? payment?.parentEmail ?? payment?.parent_email, "");

  const whatsappMessage = encodeURIComponent(
    `حضرتك، هذه فاتورة ${invoiceNumber} الخاصة بالطالب ${studentName} من Skidy Rein بقيمة ${formatCurrencyEgp(amount)} لعدد ${sessionsCount} جلسات.`,
  );
  const whatsappUrl = normalizePhone(parentPhone)
    ? `https://wa.me/${normalizePhone(parentPhone)}?text=${whatsappMessage}`
    : undefined;

  const mailtoBody = encodeURIComponent(
    `مرحبًا،

هذه فاتورة ${invoiceNumber} الخاصة بالطالب ${studentName}.
القيمة: ${formatCurrencyEgp(amount)}
عدد الجلسات: ${sessionsCount}
تاريخ الاستحقاق: ${dueDate}

Skidy Rein`,
  );
  const mailtoUrl = parentEmail && parentEmail !== "—"
    ? `mailto:${parentEmail}?subject=${encodeURIComponent(`فاتورة ${invoiceNumber} - Skidy Rein`)}&body=${mailtoBody}`
    : undefined;

  const rows = [
    ["رقم الفاتورة", invoiceNumber],
    ["الطالب", studentName],
    ["ولي الأمر", parentName],
    ["المبلغ", formatCurrencyEgp(amount)],
    ["عدد الجلسات", String(sessionsCount)],
    ["الحالة", status],
    ["طريقة الدفع", method],
    ["تاريخ الإصدار", issuedAt],
    ["تاريخ الاستحقاق", dueDate],
    ["بداية الباقة", packageStart],
    ["نهاية الباقة", packageEnd],
    ["تأجيل الدفع", deferredUntil],
    ["ملاحظات", notes],
  ] as const;

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-8 print:bg-white">
      <div className="mx-auto flex max-w-5xl flex-col gap-6">
        <div className="flex items-center justify-between print:hidden">
          <Link
            href={`/payments/${paymentId}`}
            className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
          >
            العودة إلى الدفعة
          </Link>
          <InvoiceToolbar whatsappUrl={whatsappUrl} mailtoUrl={mailtoUrl} />
        </div>

        <div className="overflow-hidden rounded-[32px] border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 bg-gradient-to-l from-indigo-600 to-violet-600 px-8 py-8 text-white">
            <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
              <div className="space-y-2">
                <p className="text-sm text-white/80">Skidy Rein</p>
                <h1 className="text-3xl font-bold">فاتورة تحصيل</h1>
                <p className="text-sm text-white/85">أكاديمية برمجة للأطفال — مستند مالي داخلي/للعميل</p>
              </div>
              <div className="rounded-2xl bg-white/10 px-5 py-4 text-sm backdrop-blur">
                <p className="text-white/75">رقم الفاتورة</p>
                <p className="mt-1 text-lg font-semibold">{invoiceNumber}</p>
              </div>
            </div>
          </div>

          <div className="grid gap-6 px-8 py-8 lg:grid-cols-[1.4fr_0.8fr]">
            <div className="space-y-6">
              <div className="rounded-3xl border border-slate-200 p-5">
                <h2 className="mb-4 text-xl font-semibold text-slate-900">تفاصيل الفاتورة</h2>
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
                <h2 className="mb-4 text-xl font-semibold text-slate-900">بيانات التواصل</h2>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <p className="text-sm text-slate-500">ولي الأمر</p>
                    <p className="mt-1 font-medium text-slate-900">{parentName}</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-500">الهاتف</p>
                    <p className="mt-1 font-medium text-slate-900">{parentPhone || "—"}</p>
                  </div>
                  <div className="sm:col-span-2">
                    <p className="text-sm text-slate-500">البريد</p>
                    <p className="mt-1 font-medium text-slate-900">{parentEmail || "—"}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="rounded-3xl border border-emerald-200 bg-emerald-50 p-5">
                <p className="text-sm text-emerald-700">إجمالي المستحق</p>
                <p className="mt-2 text-3xl font-bold text-emerald-900">{formatCurrencyEgp(amount)}</p>
                <p className="mt-2 text-sm text-emerald-800">الفوترة هنا مبنية على باقة من {sessionsCount} جلسات، وليس على شهر ثابت.</p>
              </div>

              <div className="rounded-3xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-900">
                <p className="font-semibold">ملاحظة تشغيلية</p>
                <p className="mt-2 leading-7">
                  يمكن أن تنتهي الباقة خلال شهر واحد أو أكثر من شهر حسب انتظام حضور الجلسات، ويمكن أيضًا تأجيل الدفع بالاتفاق مع ولي الأمر.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
