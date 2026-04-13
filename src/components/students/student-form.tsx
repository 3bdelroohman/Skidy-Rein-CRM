"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, GraduationCap, Save } from "lucide-react";
import { toast } from "sonner";
import { getCourseFamilyFromTrack, getCourseTrackGroups, getCourseTrackLabel, getCourseTrackOptions, suggestCourseByAge } from "@/config/course-roadmap";
import { STUDENT_STATUS_META, getMetaLabel } from "@/config/status-meta";
import { t } from "@/lib/locale";
import { guardStudentDuplicate } from "@/services/duplicate-guard.service";
import { useUIStore } from "@/stores/ui-store";
import type { CourseType, StudentStatus } from "@/types/common.types";
import type { CreateStudentInput } from "@/types/crm";

interface StudentFormProps {
  title: string;
  description: string;
  submitLabel: string;
  successMessage: string;
  onSubmit: (payload: CreateStudentInput) => Promise<void>;
  cancelHref?: string;
  initialValues?: Partial<{
    fullName: string;
    age: number;
    parentName: string;
    parentPhone: string;
    currentCourse: CourseType | null;
    status: StudentStatus;
    className: string;
  }>;
}

export function StudentForm({
  title,
  description,
  submitLabel,
  successMessage,
  onSubmit,
  cancelHref = "/students",
  initialValues,
}: StudentFormProps) {
  const router = useRouter();
  const locale = useUIStore((state) => state.locale);
  const isAr = locale === "ar";
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    fullName: initialValues?.fullName ?? "",
    age: initialValues?.age ? String(initialValues.age) : "",
    parentName: initialValues?.parentName ?? "",
    parentPhone: initialValues?.parentPhone ?? "",
    selectedTrackId: "",
    status: initialValues?.status ?? ("active" as StudentStatus),
    className: initialValues?.className ?? "",
    hasPriorExperience: false,
  });

  const trackOptions = useMemo(() => getCourseTrackOptions(locale), [locale]);
  const trackGroups = useMemo(() => getCourseTrackGroups(locale), [locale]);
  const statusOptions = useMemo(
    () => Object.entries(STUDENT_STATUS_META).map(([value, meta]) => ({ value: value as StudentStatus, label: getMetaLabel(meta, locale) })),
    [locale],
  );

  const updateField = (field: keyof typeof form, value: string | boolean) => {
    setForm((prev) => {
      const next = { ...prev, [field]: value } as typeof form;
      if (field === "age") {
        const age = parseInt(value as string, 10);
        if (!Number.isNaN(age)) {
          const family = suggestCourseByAge(age, next.hasPriorExperience);
          const suggestedTrack = trackOptions.find((item) => item.family === family)?.value ?? "";
          if (!next.selectedTrackId) next.selectedTrackId = suggestedTrack;
        }
      }
      if (field === "hasPriorExperience") {
        const age = parseInt(next.age, 10);
        if (!Number.isNaN(age) && !next.selectedTrackId) {
          const family = suggestCourseByAge(age, Boolean(value));
          next.selectedTrackId = trackOptions.find((item) => item.family === family)?.value ?? "";
        }
      }
      return next;
    });
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!form.fullName.trim() || !form.parentName.trim() || !form.parentPhone.trim() || !form.age.trim()) {
      toast.error(t(locale, "يرجى ملء الحقول المطلوبة", "Please fill in the required fields"));
      return;
    }

    const age = parseInt(form.age, 10);
    if (Number.isNaN(age) || age < 4 || age > 18) {
      toast.error(t(locale, "العمر يجب أن يكون بين 4 و 18 سنة", "Age must be between 4 and 18"));
      return;
    }

    const duplicate = await guardStudentDuplicate({
      fullName: form.fullName.trim(),
      parentName: form.parentName.trim(),
      parentPhone: form.parentPhone.trim(),
    });

    if (duplicate?.blocking) {
      toast.error(t(locale, duplicate.messageAr, duplicate.messageEn));
      return;
    }

    setLoading(true);
    try {
      await onSubmit({
        fullName: form.fullName.trim(),
        age,
        parentName: form.parentName.trim(),
        parentPhone: form.parentPhone.trim(),
        currentCourse: getCourseFamilyFromTrack(form.selectedTrackId),
        status: form.status,
        className: form.className.trim() || null,
      });
      toast.success(successMessage);
    } catch (error) {
      toast.error(
        error instanceof Error && error.message.trim().length > 0
          ? error.message
          : t(locale, "تعذر إنشاء سجل الطالب", "Failed to create student record"),
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
            <GraduationCap size={28} className="text-brand-600" />
            {title}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="rounded-2xl border border-border bg-card p-5">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FormField label={t(locale, "اسم الطالب *", "Student name *")} value={form.fullName} onChange={(value) => updateField("fullName", value)} placeholder={t(locale, "مثال: يوسف", "Example: Youssef")} />
            <FormField label={t(locale, "العمر *", "Age *")} value={form.age} onChange={(value) => updateField("age", value)} placeholder="10" type="number" min={4} max={18} />
            <FormField label={t(locale, "اسم ولي الأمر *", "Parent name *")} value={form.parentName} onChange={(value) => updateField("parentName", value)} placeholder={t(locale, "مثال: أحمد محمد", "Example: Ahmed Mohamed")} />
            <FormField label={t(locale, "رقم ولي الأمر *", "Parent phone *")} value={form.parentPhone} onChange={(value) => updateField("parentPhone", value)} placeholder="01012345678" type="tel" />
            <div className="space-y-2 sm:col-span-2">
              <FormSelect label={t(locale, "الكورس / المسار", "Course / track")} value={form.selectedTrackId} onChange={(value) => updateField("selectedTrackId", value)} options={trackGroups.flatMap((group) => group.options.map((option) => ({ value: option.value, label: option.label, group: group.label })))} placeholder={t(locale, "اختر الكورس الأنسب", "Choose the most suitable course")} />
              {form.selectedTrackId ? <p className="text-xs leading-5 text-muted-foreground">{getCourseTrackLabel(form.selectedTrackId, locale)}</p> : null}
            </div>
            <FormSelect label={t(locale, "الحالة", "Status")} value={form.status} onChange={(value) => updateField("status", value)} options={statusOptions} />
            <div className="sm:col-span-2">
              <FormField label={t(locale, "اسم الكلاس", "Class name")} value={form.className} onChange={(value) => updateField("className", value)} placeholder={t(locale, "مثال: Scratch Saturday 6 PM", "Example: Scratch Saturday 6 PM")} />
            </div>
            <label className="flex cursor-pointer items-center gap-2 text-sm text-foreground sm:col-span-2">
              <input type="checkbox" checked={form.hasPriorExperience} onChange={(event) => updateField("hasPriorExperience", event.target.checked)} className="h-4 w-4 rounded border-border text-brand-600 focus:ring-brand-500" />
              {t(locale, "عنده خبرة سابقة", "Has prior experience")}
            </label>
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
