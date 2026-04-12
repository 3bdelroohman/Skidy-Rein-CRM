"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, BookOpen, Save } from "lucide-react";
import { toast } from "sonner";
import { t, getEmploymentTypeLabel } from "@/lib/locale";
import { useUIStore } from "@/stores/ui-store";
import type { CourseType, EmploymentType } from "@/types/common.types";
import type { CreateTeacherInput } from "@/types/crm";

const COURSE_OPTIONS: CourseType[] = ["scratch", "python", "web", "ai"];

function getCourseLabel(course: CourseType, locale: "ar" | "en") {
  const labels: Record<CourseType, { ar: string; en: string }> = {
    scratch: { ar: "Scratch", en: "Scratch" },
    python: { ar: "Python", en: "Python" },
    web: { ar: "Web", en: "Web" },
    ai: { ar: "AI", en: "AI" },
  };
  return locale === "ar" ? labels[course].ar : labels[course].en;
}

interface TeacherFormProps {
  title: string;
  description: string;
  submitLabel: string;
  successMessage: string;
  onSubmit: (payload: CreateTeacherInput) => Promise<void>;
  cancelHref?: string;
}

export function TeacherForm({ title, description, submitLabel, successMessage, onSubmit, cancelHref = "/teachers" }: TeacherFormProps) {
  const router = useRouter();
  const locale = useUIStore((state) => state.locale);
  const isAr = locale === "ar";
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    fullName: "",
    phone: "",
    employment: "part_time" as EmploymentType,
    specialization: ["scratch"] as CourseType[],
  });

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!form.fullName.trim() || !form.phone.trim()) {
      toast.error(t(locale, "اسم المدرس والهاتف مطلوبان", "Teacher name and phone are required"));
      return;
    }
    if (form.specialization.length === 0) {
      toast.error(t(locale, "اختر مسارًا واحدًا على الأقل", "Choose at least one specialization"));
      return;
    }

    setLoading(true);
    try {
      await onSubmit({
        fullName: form.fullName.trim(),
        phone: form.phone.trim(),
        employment: form.employment,
        specialization: form.specialization,
      });
      toast.success(successMessage);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t(locale, "تعذر إنشاء المدرس", "Could not create teacher"));
    } finally {
      setLoading(false);
    }
  };

  const toggleCourse = (course: CourseType) => {
    setForm((prev) => {
      const exists = prev.specialization.includes(course);
      const next = exists ? prev.specialization.filter((item) => item !== course) : [...prev.specialization, course];
      return { ...prev, specialization: next };
    });
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-center gap-3">
        <button onClick={() => router.push(cancelHref)} className="rounded-xl p-2 text-muted-foreground transition-colors hover:bg-muted">
          {isAr ? <ArrowRight size={20} /> : <ArrowLeft size={20} />}
        </button>
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold text-foreground"><BookOpen size={28} className="text-brand-600" />{title}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="rounded-2xl border border-border bg-card p-5">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label={t(locale, "اسم المدرس *", "Teacher name *")} value={form.fullName} onChange={(value) => setForm((prev) => ({ ...prev, fullName: value }))} />
            <Field label={t(locale, "الهاتف *", "Phone *")} value={form.phone} onChange={(value) => setForm((prev) => ({ ...prev, phone: value }))} type="tel" />
            <div className="sm:col-span-2">
              <label className="mb-1.5 block text-sm font-medium text-foreground">{t(locale, "نوع التعاقد", "Employment type")}</label>
              <select value={form.employment} onChange={(event) => setForm((prev) => ({ ...prev, employment: event.target.value as EmploymentType }))} className="w-full rounded-xl border border-input bg-muted/50 px-4 py-2.5 text-sm text-foreground focus:border-transparent focus:ring-2 focus:ring-ring">
                {(["full_time", "part_time", "freelance"] as EmploymentType[]).map((item) => (
                  <option key={item} value={item}>{getEmploymentTypeLabel(item, locale)}</option>
                ))}
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className="mb-2 block text-sm font-medium text-foreground">{t(locale, "المسارات التي يدرّسها", "Taught tracks")}</label>
              <div className="flex flex-wrap gap-2">
                {COURSE_OPTIONS.map((course) => {
                  const active = form.specialization.includes(course);
                  return (
                    <button key={course} type="button" onClick={() => toggleCourse(course)} className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors ${active ? "border-brand-600 bg-brand-600 text-white" : "border-border bg-card text-foreground hover:bg-muted"}`}>
                      {getCourseLabel(course, locale)}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3">
          <button type="button" onClick={() => router.push(cancelHref)} className="rounded-xl px-6 py-2.5 text-sm font-semibold text-muted-foreground transition-colors hover:bg-muted">{t(locale, "إلغاء", "Cancel")}</button>
          <button type="submit" disabled={loading} className="flex items-center gap-2 rounded-xl bg-brand-700 px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-50">
            {loading ? <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" /> : <><Save size={18} />{submitLabel}</>}
          </button>
        </div>
      </form>
    </div>
  );
}

function Field({ label, value, onChange, type = "text" }: { label: string; value: string; onChange: (value: string) => void; type?: string }) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-foreground">{label}</label>
      <input type={type} value={value} onChange={(event) => onChange(event.target.value)} className="w-full rounded-xl border border-input bg-muted/50 px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-transparent focus:ring-2 focus:ring-ring" />
    </div>
  );
}
