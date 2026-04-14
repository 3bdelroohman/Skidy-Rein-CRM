"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, Save, UserRound } from "lucide-react";
import { toast } from "sonner";
import { t } from "@/lib/locale";
import { guardParentDuplicate, type DuplicateCheckResult } from "@/services/duplicate-guard.service";
import { useUIStore } from "@/stores/ui-store";
import { getCourseFamilyFromTrack, getCourseTrackGroups, getCourseTrackLabel, getCourseTrackOptions, getDefaultTrackIdForFamily, suggestCourseByAge } from "@/config/course-roadmap";
import type { CreateParentInput } from "@/types/crm";

interface ParentFormProps {
  title: string;
  description: string;
  submitLabel: string;
  successMessage: string;
  onSubmit: (payload: CreateParentInput) => Promise<void>;
  cancelHref?: string;
  initialValues?: Partial<{
    fullName: string;
    phone: string;
    whatsapp: string;
    email: string;
    city: string;
    firstStudentName: string;
    firstStudentAge: number;
    firstStudentCourse: CreateParentInput["firstStudentCourse"];
    firstStudentClassName: string;
  }>;
}

export function ParentForm({
  title,
  description,
  submitLabel,
  successMessage,
  onSubmit,
  cancelHref = "/parents",
  initialValues,
}: ParentFormProps) {
  const router = useRouter();
  const locale = useUIStore((state) => state.locale);
  const isAr = locale === "ar";
  const [loading, setLoading] = useState(false);
  const [duplicateResult, setDuplicateResult] = useState<DuplicateCheckResult | null>(null);
  const [form, setForm] = useState({
    fullName: initialValues?.fullName ?? "",
    phone: initialValues?.phone ?? "",
    whatsapp: initialValues?.whatsapp ?? "",
    email: initialValues?.email ?? "",
    city: initialValues?.city ?? "",
    firstStudentName: initialValues?.firstStudentName ?? "",
    firstStudentAge: initialValues?.firstStudentAge ? String(initialValues.firstStudentAge) : "",
    firstStudentTrackId: getDefaultTrackIdForFamily(initialValues?.firstStudentCourse ?? null),
    firstStudentClassName: initialValues?.firstStudentClassName ?? "",
  });

  const trackOptions = useMemo(() => getCourseTrackOptions(locale), [locale]);
  const trackGroups = useMemo(() => getCourseTrackGroups(locale), [locale]);

  useEffect(() => {
    const hasEnoughData = form.fullName.trim().length > 1 && (form.phone.trim().length > 5 || form.whatsapp.trim().length > 5);
    if (!hasEnoughData) {
      setDuplicateResult(null);
      return;
    }

    let cancelled = false;
    const timeout = window.setTimeout(async () => {
      const result = await guardParentDuplicate({
        fullName: form.fullName.trim(),
        phone: form.phone.trim(),
        whatsapp: form.whatsapp.trim() || undefined,
      });
      if (!cancelled) setDuplicateResult(result);
    }, 300);

    return () => {
      cancelled = true;
      window.clearTimeout(timeout);
    };
  }, [form.fullName, form.phone, form.whatsapp]);

  const updateField = (field: keyof typeof form, value: string) => {
    setForm((prev) => {
      const next = { ...prev, [field]: value };
      if (field === "firstStudentAge") {
        const age = Number(value);
        if (Number.isFinite(age) && age >= 4 && !next.firstStudentTrackId) {
          const family = suggestCourseByAge(age);
          next.firstStudentTrackId = trackOptions.find((item) => item.family === family)?.value ?? "";
        }
      }
      return next;
    });
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!form.fullName.trim() || !form.phone.trim()) {
      toast.error(t(locale, "اسم ولي الأمر ورقم الهاتف مطلوبان", "Parent name and phone are required"));
      return;
    }

    if (form.firstStudentName.trim() && !form.firstStudentAge.trim()) {
      toast.error(t(locale, "إذا أدخلت اسم الطالب الأول يجب إدخال العمر أيضًا", "If you enter a first student name, age is also required"));
      return;
    }

    const duplicate = await guardParentDuplicate({
      fullName: form.fullName.trim(),
      phone: form.phone.trim(),
      whatsapp: form.whatsapp.trim() || undefined,
    });

    if (duplicate?.blocking) {
      toast.error(t(locale, duplicate.messageAr, duplicate.messageEn));
      return;
    }

    setLoading(true);
    try {
      await onSubmit({
        fullName: form.fullName.trim(),
        phone: form.phone.trim(),
        whatsapp: form.whatsapp.trim() || form.phone.trim(),
        email: form.email.trim() || undefined,
        city: form.city.trim() || undefined,
        firstStudentName: form.firstStudentName.trim() || undefined,
        firstStudentAge: form.firstStudentAge.trim() ? Number(form.firstStudentAge) : undefined,
        firstStudentCourse: getCourseFamilyFromTrack(form.firstStudentTrackId),
        firstStudentClassName: form.firstStudentClassName.trim() || undefined,
      });
      toast.success(successMessage);
    } catch (error) {
      toast.error(
        error instanceof Error && error.message.trim().length > 0
          ? error.message
          : t(locale, "تعذر إنشاء سجل ولي الأمر", "Failed to create parent record"),
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-center gap-3">
        <button onClick={() => router.push(cancelHref)} className="rounded-xl p-2 text-muted-foreground transition-colors hover:bg-muted">
          {isAr ? <ArrowRight size={20} /> : <ArrowLeft size={20} />}
        </button>
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold text-foreground">
            <UserRound size={28} className="text-brand-600" />
            {title}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="rounded-2xl border border-border bg-card p-5">
          {duplicateResult?.blocking ? (
            <div className="mb-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
              <p className="font-semibold">{t(locale, "تنبيه تكرار محتمل", "Potential duplicate warning")}</p>
              <p className="mt-1">{t(locale, duplicateResult.messageAr, duplicateResult.messageEn)}</p>
            </div>
          ) : null}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FormField label={t(locale, "اسم ولي الأمر *", "Parent name *")} value={form.fullName} onChange={(value) => updateField("fullName", value)} placeholder={t(locale, "مثال: أحمد محمد", "Example: Ahmed Mohamed")} />
            <FormField label={t(locale, "رقم الهاتف *", "Phone number *")} value={form.phone} onChange={(value) => updateField("phone", value)} placeholder="01012345678" type="tel" />
            <FormField label="WhatsApp" value={form.whatsapp} onChange={(value) => updateField("whatsapp", value)} placeholder={t(locale, "إن وجد رقم مختلف", "If different from phone number")} type="tel" />
            <FormField label="Email" value={form.email} onChange={(value) => updateField("email", value)} placeholder="name@example.com" type="email" />
            <div className="sm:col-span-2">
              <FormField label={t(locale, "المدينة", "City")} value={form.city} onChange={(value) => updateField("city", value)} placeholder={t(locale, "مثال: القاهرة", "Example: Cairo")} />
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-card p-5">
          <div className="mb-4">
            <h2 className="text-base font-semibold text-foreground">{t(locale, "الطالب الأول (اختياري)", "First student (optional)")}</h2>
            <p className="mt-1 text-xs text-muted-foreground">{t(locale, "اكتب بيانات الطالب الآن إذا كنت تريد إنشاء ولي الأمر والطالب معًا من نفس الفورم.", "Enter the student now if you want to create the parent and student together from the same form.")}</p>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FormField label={t(locale, "اسم الطالب", "Student name")} value={form.firstStudentName} onChange={(value) => updateField("firstStudentName", value)} placeholder={t(locale, "مثال: يوسف", "Example: Youssef")} />
            <FormField label={t(locale, "العمر", "Age")} value={form.firstStudentAge} onChange={(value) => updateField("firstStudentAge", value)} placeholder="10" type="number" min={4} max={18} />
            <div className="sm:col-span-2">
              <FormSelect label={t(locale, "الكورس / المسار", "Course / track")} value={form.firstStudentTrackId} onChange={(value) => updateField("firstStudentTrackId", value)} options={trackGroups.flatMap((group) => group.options.map((option) => ({ value: option.value, label: option.label, group: group.label })))} placeholder={t(locale, "اختر الكورس الأنسب", "Choose the most suitable course")} />
              {form.firstStudentTrackId ? <p className="mt-2 text-xs leading-5 text-muted-foreground">{getCourseTrackLabel(form.firstStudentTrackId, locale)}</p> : null}
            </div>
            <div className="sm:col-span-2">
              <FormField label={t(locale, "اسم الكلاس", "Class name")} value={form.firstStudentClassName} onChange={(value) => updateField("firstStudentClassName", value)} placeholder={t(locale, "اختياري", "Optional")} />
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3">
          <button type="button" onClick={() => router.push(cancelHref)} className="rounded-xl px-6 py-2.5 text-sm font-semibold text-muted-foreground transition-colors hover:bg-muted">
            {t(locale, "إلغاء", "Cancel")}
          </button>
          <button type="submit" disabled={loading} className="flex items-center gap-2 rounded-xl bg-brand-700 px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-50">
            {loading ? <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" /> : <><Save size={18} />{submitLabel}</>}
          </button>
        </div>
      </form>
    </div>
  );
}

function FormField({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  min,
  max,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: string;
  min?: number;
  max?: number;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-foreground">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        min={min}
        max={max}
        className="w-full rounded-xl border border-input bg-muted/50 px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-transparent focus:ring-2 focus:ring-ring"
      />
    </div>
  );
}

function FormSelect({
  label,
  value,
  onChange,
  options,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: Array<{ value: string; label: string; group?: string }>;
  placeholder?: string;
}) {
  const grouped = options.reduce<Record<string, Array<{ value: string; label: string }>>>((acc, option) => {
    const key = option.group ?? "";
    if (!acc[key]) acc[key] = [];
    acc[key].push({ value: option.value, label: option.label });
    return acc;
  }, {});

  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-foreground">{label}</label>
      <select value={value} onChange={(event) => onChange(event.target.value)} className="w-full rounded-xl border border-input bg-muted/50 px-4 py-2.5 text-sm text-foreground focus:border-transparent focus:ring-2 focus:ring-ring">
        {placeholder ? <option value="">{placeholder}</option> : null}
        {Object.entries(grouped).map(([group, groupOptions]) =>
          group ? (
            <optgroup key={group} label={group}>
              {groupOptions.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </optgroup>
          ) : (
            groupOptions.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))
          ),
        )}
      </select>
    </div>
  );
}
