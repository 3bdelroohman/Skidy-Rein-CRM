"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  Baby,
  MessageSquare,
  Save,
  Thermometer,
  User,
  UserPlus,
} from "lucide-react";
import { toast } from "sonner";
import {
  COURSE_TYPE_EN_LABELS,
  COURSE_TYPE_LABELS,
  LEAD_SOURCE_EN_LABELS,
  LEAD_SOURCE_LABELS,
  TEMPERATURE_EN_LABELS,
  TEMPERATURE_LABELS,
} from "@/config/labels";
import { MOCK_TEAM } from "@/lib/mock-data";
import { t } from "@/lib/locale";
import { cn } from "@/lib/utils";
import { useUIStore } from "@/stores/ui-store";
import type { CreateLeadInput } from "@/types/crm";
import type { CourseType, LeadSource, LeadTemperature } from "@/types/common.types";

export interface LeadFormValues {
  childName: string;
  childAge: string;
  parentName: string;
  parentPhone: string;
  parentWhatsapp: string;
  source: LeadSource;
  temperature: LeadTemperature;
  suggestedCourse: CourseType | "";
  assignedTo: string;
  hasLaptop: boolean;
  hasPriorExperience: boolean;
  childInterests: string;
  notes: string;
}

interface LeadFormProps {
  title: string;
  description: string;
  submitLabel: string;
  successMessage: string;
  initialValues?: Partial<LeadFormValues>;
  onSubmit: (payload: CreateLeadInput) => Promise<void>;
  cancelHref?: string;
}

const DEFAULT_VALUES: LeadFormValues = {
  childName: "",
  childAge: "",
  parentName: "",
  parentPhone: "",
  parentWhatsapp: "",
  source: "facebook_ad",
  temperature: "warm",
  suggestedCourse: "",
  assignedTo: MOCK_TEAM[0]?.id ?? "",
  hasLaptop: false,
  hasPriorExperience: false,
  childInterests: "",
  notes: "",
};

export function LeadForm({
  title,
  description,
  submitLabel,
  successMessage,
  initialValues,
  onSubmit,
  cancelHref = "/leads",
}: LeadFormProps) {
  const router = useRouter();
  const locale = useUIStore((state) => state.locale);
  const isAr = locale === "ar";
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState<LeadFormValues>({
    ...DEFAULT_VALUES,
    ...initialValues,
  });

  useEffect(() => {
    if (!initialValues) return;
    setForm({
      ...DEFAULT_VALUES,
      ...initialValues,
    });
  }, [initialValues]);

  const sourceOptions = useMemo(
    () => Object.entries(isAr ? LEAD_SOURCE_LABELS : LEAD_SOURCE_EN_LABELS).map(([value, label]) => ({ value: value as LeadSource, label })),
    [isAr],
  );

  const courseOptions = useMemo(
    () => Object.entries(isAr ? COURSE_TYPE_LABELS : COURSE_TYPE_EN_LABELS).map(([value, label]) => ({ value: value as CourseType, label })),
    [isAr],
  );

  const temperatureOptions = useMemo(
    () => Object.entries(isAr ? TEMPERATURE_LABELS : TEMPERATURE_EN_LABELS).map(([value, label]) => ({ value: value as LeadTemperature, label })),
    [isAr],
  );

  const salesTeam = useMemo(() => MOCK_TEAM.filter((member) => member.role === "sales"), []);

  const updateField = (field: keyof LeadFormValues, value: string | boolean) => {
    setForm((prev) => {
      const next = { ...prev, [field]: value } as LeadFormValues;
      if (field === "childAge") {
        const age = parseInt(value as string, 10);
        if (age >= 8 && age <= 12) next.suggestedCourse = "scratch";
        else if (age > 12) next.suggestedCourse = "python";
      }
      return next;
    });
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!form.childName || !form.parentName || !form.parentPhone || !form.childAge) {
      toast.error(t(locale, "يرجى ملء الحقول المطلوبة", "Please fill in the required fields"));
      return;
    }

    const age = parseInt(form.childAge, 10);
    if (Number.isNaN(age) || age < 4 || age > 18) {
      toast.error(t(locale, "العمر يجب أن يكون بين 4 و 18 سنة", "Age must be between 4 and 18"));
      return;
    }

    setLoading(true);
    try {
      const assignedToName = MOCK_TEAM.find((member) => member.id === form.assignedTo)?.name ?? t(locale, "غير مخصص", "Unassigned");

      await onSubmit({
        childName: form.childName,
        childAge: age,
        parentName: form.parentName,
        parentPhone: form.parentPhone,
        parentWhatsapp: form.parentWhatsapp || undefined,
        source: form.source,
        temperature: form.temperature,
        suggestedCourse: form.suggestedCourse || null,
        assignedTo: form.assignedTo,
        assignedToName,
        hasLaptop: form.hasLaptop,
        hasPriorExperience: form.hasPriorExperience,
        childInterests: form.childInterests || undefined,
        notes: form.notes || undefined,
      });

      toast.success(successMessage);
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
            <UserPlus size={28} className="text-brand-600" />
            {title}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="rounded-2xl border border-border bg-card p-5">
          <h3 className="mb-4 flex items-center gap-2 font-bold text-foreground">
            <Baby size={18} className="text-brand-600" />
            {t(locale, "معلومات الطفل", "Child information")}
          </h3>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FormField label={t(locale, "اسم الطفل *", "Child name *")} value={form.childName} onChange={(value) => updateField("childName", value)} placeholder={t(locale, "مثال: يوسف", "Example: Youssef")} />
            <FormField label={t(locale, "العمر *", "Age *")} type="number" value={form.childAge} onChange={(value) => updateField("childAge", value)} placeholder="10" min={4} max={18} />
            <FormSelect label={t(locale, "الكورس المقترح", "Suggested course")} value={form.suggestedCourse} onChange={(value) => updateField("suggestedCourse", value)} options={courseOptions} placeholder={t(locale, "يتحدد تلقائياً حسب العمر", "Auto-selected based on age")} />
            <FormField label={t(locale, "اهتمامات الطفل", "Child interests")} value={form.childInterests} onChange={(value) => updateField("childInterests", value)} placeholder={t(locale, "ألعاب، برمجة، تصميم...", "Games, coding, design...")} />

            <div className="flex flex-wrap items-center gap-6 sm:col-span-2">
              <label className="flex cursor-pointer items-center gap-2 text-sm text-foreground">
                <input type="checkbox" checked={form.hasLaptop} onChange={(event) => updateField("hasLaptop", event.target.checked)} className="h-4 w-4 rounded border-border text-brand-600 focus:ring-brand-500" />
                {t(locale, "عنده لابتوب", "Has a laptop")}
              </label>
              <label className="flex cursor-pointer items-center gap-2 text-sm text-foreground">
                <input type="checkbox" checked={form.hasPriorExperience} onChange={(event) => updateField("hasPriorExperience", event.target.checked)} className="h-4 w-4 rounded border-border text-brand-600 focus:ring-brand-500" />
                {t(locale, "عنده خبرة سابقة", "Has prior experience")}
              </label>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-card p-5">
          <h3 className="mb-4 flex items-center gap-2 font-bold text-foreground">
            <User size={18} className="text-brand-600" />
            {t(locale, "ولي الأمر", "Parent")}
          </h3>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FormField label={t(locale, "اسم ولي الأمر *", "Parent name *")} value={form.parentName} onChange={(value) => updateField("parentName", value)} placeholder={t(locale, "مثال: أحمد محمد", "Example: Ahmed Mohamed")} />
            <FormField label={t(locale, "رقم الهاتف *", "Phone number *")} value={form.parentPhone} onChange={(value) => updateField("parentPhone", value)} placeholder="01012345678" type="tel" />
            <FormField label="WhatsApp" value={form.parentWhatsapp} onChange={(value) => updateField("parentWhatsapp", value)} placeholder={t(locale, "إن وجد رقم مختلف", "If different from phone number")} type="tel" />
            <FormSelect label={t(locale, "المصدر", "Source")} value={form.source} onChange={(value) => updateField("source", value)} options={sourceOptions} />
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-card p-5">
          <h3 className="mb-4 flex items-center gap-2 font-bold text-foreground">
            <Thermometer size={18} className="text-brand-600" />
            {t(locale, "معلومات البيع", "Sales details")}
          </h3>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FormSelect label={t(locale, "تصنيف الاهتمام", "Interest level")} value={form.temperature} onChange={(value) => updateField("temperature", value as LeadTemperature)} options={temperatureOptions} />
            <FormSelect label={t(locale, "المسؤول", "Owner")} value={form.assignedTo} onChange={(value) => updateField("assignedTo", value)} options={salesTeam.map((member) => ({ value: member.id, label: member.name }))} />
          </div>

          <div className="mt-4">
            <label className="mb-1.5 block text-sm font-medium text-foreground">
              <MessageSquare size={14} className={cn("inline", isAr ? "ml-1" : "mr-1")} />
              {t(locale, "ملاحظات", "Notes")}
            </label>
            <textarea
              value={form.notes}
              onChange={(event) => updateField("notes", event.target.value)}
              placeholder={t(locale, "أي تفاصيل تساعد الفريق في المتابعة", "Any details that help the team follow up")}
              rows={3}
              className={cn("w-full resize-none rounded-xl border border-input bg-muted/50 px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-transparent focus:ring-2 focus:ring-ring")}
            />
          </div>
        </div>

        <div className="flex items-center justify-end gap-3">
          <button type="button" onClick={() => router.push(cancelHref)} className="rounded-xl px-6 py-2.5 text-sm font-semibold text-muted-foreground transition-colors hover:bg-muted">
            {t(locale, "إلغاء", "Cancel")}
          </button>
          <button type="submit" disabled={loading} className={cn("flex items-center gap-2 rounded-xl bg-brand-700 px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-50")}>
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
  options: Array<{ value: string; label: string }>;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-foreground">{label}</label>
      <select value={value} onChange={(event) => onChange(event.target.value)} className="w-full rounded-xl border border-input bg-muted/50 px-4 py-2.5 text-sm text-foreground focus:border-transparent focus:ring-2 focus:ring-ring">
        {placeholder ? <option value="">{placeholder}</option> : null}
        {options.map((option) => (
          <option key={option.value} value={option.value}>{option.label}</option>
        ))}
      </select>
    </div>
  );
}
