"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, CalendarPlus, Save } from "lucide-react";
import { toast } from "sonner";
import { t, getDayLabel } from "@/lib/locale";
import { useUIStore } from "@/stores/ui-store";
import type { CourseType } from "@/types/common.types";
import type { CreateScheduleEntryInput, TeacherListItem } from "@/types/crm";
import { listTeachers } from "@/services/teachers.service";

interface ScheduleEntryFormProps {
  title: string;
  description: string;
  submitLabel: string;
  successMessage: string;
  onSubmit: (payload: CreateScheduleEntryInput) => Promise<void>;
  cancelHref?: string;
  initialValues?: {
    className?: string;
    teacherId?: string;
    course?: CourseType;
  };
}

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

export function ScheduleEntryForm({ title, description, submitLabel, successMessage, onSubmit, cancelHref = "/schedule", initialValues }: ScheduleEntryFormProps) {
  const router = useRouter();
  const locale = useUIStore((state) => state.locale);
  const isAr = locale === "ar";
  const [loading, setLoading] = useState(false);
  const [teachers, setTeachers] = useState<TeacherListItem[]>([]);
  const [form, setForm] = useState({
    className: initialValues?.className ?? "",
    teacherId: initialValues?.teacherId ?? "",
    course: initialValues?.course ?? ("scratch" as CourseType),
    day: "0",
    startTime: "16:00",
    endTime: "17:00",
  });

  useEffect(() => {
    listTeachers().then((items) => {
      setTeachers(items);
      setForm((prev) => {
        const hasRequestedTeacher = prev.teacherId && items.some((teacher) => teacher.id === prev.teacherId);
        return { ...prev, teacherId: hasRequestedTeacher ? prev.teacherId : prev.teacherId || items[0]?.id || "" };
      });
    });
  }, []);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!form.className.trim() || !form.teacherId) {
      toast.error(t(locale, "اسم الحصة والمدرس مطلوبان", "Class name and teacher are required"));
      return;
    }
    if (form.endTime <= form.startTime) {
      toast.error(t(locale, "وقت النهاية يجب أن يكون بعد وقت البداية", "End time must be after start time"));
      return;
    }
    setLoading(true);
    try {
      await onSubmit({
        className: form.className.trim(),
        teacherId: form.teacherId,
        course: form.course,
        day: Number(form.day),
        startTime: form.startTime,
        endTime: form.endTime,
      });
      toast.success(successMessage);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t(locale, "تعذر إضافة الحصة", "Could not create schedule entry"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-center gap-3">
        <button onClick={() => router.push(cancelHref)} className="rounded-xl p-2 text-muted-foreground transition-colors hover:bg-muted">{isAr ? <ArrowRight size={20} /> : <ArrowLeft size={20} />}</button>
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold text-foreground"><CalendarPlus size={28} className="text-brand-600" />{title}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="rounded-2xl border border-border bg-card p-5">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label={t(locale, "اسم الحصة / الحدث *", "Session / event name *")} value={form.className} onChange={(value) => setForm((prev) => ({ ...prev, className: value }))} />
            <div>
              <label className="mb-1.5 block text-sm font-medium text-foreground">{t(locale, "المدرس *", "Teacher *")}</label>
              <select value={form.teacherId} onChange={(event) => setForm((prev) => ({ ...prev, teacherId: event.target.value }))} className="w-full rounded-xl border border-input bg-muted/50 px-4 py-2.5 text-sm text-foreground focus:border-transparent focus:ring-2 focus:ring-ring">
                {teachers.map((teacher) => <option key={teacher.id} value={teacher.id}>{teacher.fullName}</option>)}
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-foreground">{t(locale, "المسار", "Track")}</label>
              <select value={form.course} onChange={(event) => setForm((prev) => ({ ...prev, course: event.target.value as CourseType }))} className="w-full rounded-xl border border-input bg-muted/50 px-4 py-2.5 text-sm text-foreground focus:border-transparent focus:ring-2 focus:ring-ring">
                {COURSE_OPTIONS.map((course) => <option key={course} value={course}>{getCourseLabel(course, locale)}</option>)}
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-foreground">{t(locale, "اليوم", "Day")}</label>
              <select value={form.day} onChange={(event) => setForm((prev) => ({ ...prev, day: event.target.value }))} className="w-full rounded-xl border border-input bg-muted/50 px-4 py-2.5 text-sm text-foreground focus:border-transparent focus:ring-2 focus:ring-ring">
                {Array.from({ length: 7 }, (_, day) => <option key={day} value={day}>{getDayLabel(day, locale)}</option>)}
              </select>
            </div>
            <Field label={t(locale, "وقت البداية", "Start time")} value={form.startTime} onChange={(value) => setForm((prev) => ({ ...prev, startTime: value }))} type="time" />
            <Field label={t(locale, "وقت النهاية", "End time")} value={form.endTime} onChange={(value) => setForm((prev) => ({ ...prev, endTime: value }))} type="time" />
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
  return <div><label className="mb-1.5 block text-sm font-medium text-foreground">{label}</label><input type={type} value={value} onChange={(event) => onChange(event.target.value)} className="w-full rounded-xl border border-input bg-muted/50 px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-transparent focus:ring-2 focus:ring-ring" /></div>;
}
