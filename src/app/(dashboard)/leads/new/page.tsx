"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  UserPlus,
  Baby,
  User,
  Phone,
  Globe,
  Thermometer,
  GraduationCap,
  MessageSquare,
  Save,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { STAGE_CONFIGS } from "@/config/stages";
import { MOCK_TEAM } from "@/lib/mock-data";
import type {
  LeadStage,
  LeadTemperature,
  LeadSource,
  CourseType,
} from "@/types/common.types";

const SOURCE_OPTIONS: { value: LeadSource; label: string }[] = [
  { value: "facebook_ad", label: "إعلان فيسبوك" },
  { value: "instagram_ad", label: "إعلان إنستجرام" },
  { value: "group", label: "جروب" },
  { value: "referral", label: "ترشيح" },
  { value: "direct", label: "مباشر" },
  { value: "website", label: "الموقع" },
  { value: "other", label: "أخرى" },
];

const COURSE_OPTIONS: { value: CourseType; label: string }[] = [
  { value: "scratch", label: "Scratch (8-12 سنة)" },
  { value: "python", label: "Python (12+ سنة)" },
  { value: "web", label: "Web Development" },
  { value: "ai", label: "AI & Machine Learning" },
];

export default function NewLeadPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    childName: "",
    childAge: "",
    parentName: "",
    parentPhone: "",
    parentWhatsapp: "",
    source: "facebook_ad" as LeadSource,
    temperature: "warm" as LeadTemperature,
    suggestedCourse: "" as CourseType | "",
    assignedTo: MOCK_TEAM[0].id,
    hasLaptop: false,
    hasPriorExperience: false,
    childInterests: "",
    notes: "",
  });

  const updateField = (field: string, value: string | boolean) => {
    setForm((prev) => ({ ...prev, [field]: value }));

    // Auto-suggest course based on age
    if (field === "childAge") {
      const age = parseInt(value as string);
      if (age >= 8 && age <= 12) {
        setForm((prev) => ({ ...prev, suggestedCourse: "scratch" }));
      } else if (age > 12) {
        setForm((prev) => ({ ...prev, suggestedCourse: "python" }));
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.childName || !form.parentName || !form.parentPhone || !form.childAge) {
      toast.error("يرجى ملء جميع الحقول المطلوبة");
      return;
    }

    const age = parseInt(form.childAge);
    if (age < 4 || age > 18) {
      toast.error("العمر يجب أن يكون بين 4 و 18 سنة");
      return;
    }

    setLoading(true);

    // Mock save — will be replaced with Supabase
    setTimeout(() => {
      toast.success("تم إضافة العميل بنجاح");
      router.push("/leads");
      setLoading(false);
    }, 800);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => router.push("/leads")}
          className="p-2 rounded-xl hover:bg-muted transition-colors text-muted-foreground"
        >
          <ArrowRight size={20} />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <UserPlus size={28} className="text-brand-600" />
            إضافة عميل جديد
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            أدخل بيانات العميل المحتمل
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Child Info */}
        <div className="bg-card rounded-2xl border border-border p-5">
          <h3 className="font-bold text-foreground mb-4 flex items-center gap-2">
            <Baby size={18} className="text-brand-600" />
            معلومات الطفل
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField
              label="اسم الطفل *"
              value={form.childName}
              onChange={(v) => updateField("childName", v)}
              placeholder="مثال: يوسف"
            />
            <FormField
              label="العمر *"
              type="number"
              value={form.childAge}
              onChange={(v) => updateField("childAge", v)}
              placeholder="مثال: 10"
              min={4}
              max={18}
            />
            <FormSelect
              label="الكورس المقترح"
              value={form.suggestedCourse}
              onChange={(v) => updateField("suggestedCourse", v)}
              options={COURSE_OPTIONS}
              placeholder="يتحدد تلقائياً حسب العمر"
            />
            <FormField
              label="اهتمامات الطفل"
              value={form.childInterests}
              onChange={(v) => updateField("childInterests", v)}
              placeholder="ألعاب، برمجة، تصميم..."
            />

            <div className="flex items-center gap-6">
              <label className="flex items-center gap-2 text-sm text-foreground cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.hasLaptop}
                  onChange={(e) => updateField("hasLaptop", e.target.checked)}
                  className="w-4 h-4 rounded border-border text-brand-600 focus:ring-brand-500"
                />
                عنده لابتوب
              </label>
              <label className="flex items-center gap-2 text-sm text-foreground cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.hasPriorExperience}
                  onChange={(e) =>
                    updateField("hasPriorExperience", e.target.checked)
                  }
                  className="w-4 h-4 rounded border-border text-brand-600 focus:ring-brand-500"
                />
                خبرة سابقة
              </label>
            </div>
          </div>
        </div>

        {/* Parent Info */}
        <div className="bg-card rounded-2xl border border-border p-5">
          <h3 className="font-bold text-foreground mb-4 flex items-center gap-2">
            <User size={18} className="text-brand-600" />
            ولي الأمر
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField
              label="اسم ولي الأمر *"
              value={form.parentName}
              onChange={(v) => updateField("parentName", v)}
              placeholder="مثال: أحمد محمد"
            />
            <FormField
              label="رقم الهاتف *"
              value={form.parentPhone}
              onChange={(v) => updateField("parentPhone", v)}
              placeholder="01012345678"
              type="tel"
            />
            <FormField
              label="WhatsApp"
              value={form.parentWhatsapp}
              onChange={(v) => updateField("parentWhatsapp", v)}
              placeholder="نفس الرقم أو رقم مختلف"
              type="tel"
            />
            <FormSelect
              label="المصدر"
              value={form.source}
              onChange={(v) => updateField("source", v)}
              options={SOURCE_OPTIONS}
            />
          </div>
        </div>

        {/* Sales Info */}
        <div className="bg-card rounded-2xl border border-border p-5">
          <h3 className="font-bold text-foreground mb-4 flex items-center gap-2">
            <Thermometer size={18} className="text-brand-600" />
            معلومات المبيعات
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormSelect
              label="الحرارة"
              value={form.temperature}
              onChange={(v) => updateField("temperature", v)}
              options={[
                { value: "hot", label: "🔴 ساخن" },
                { value: "warm", label: "🟡 دافئ" },
                { value: "cold", label: "🔵 بارد" },
              ]}
            />
            <FormSelect
              label="المسؤول"
              value={form.assignedTo}
              onChange={(v) => updateField("assignedTo", v)}
              options={MOCK_TEAM.filter((t) => t.role === "sales").map(
                (t) => ({
                  value: t.id,
                  label: t.name,
                })
              )}
            />
          </div>

          <div className="mt-4">
            <label className="block text-sm font-medium text-foreground mb-1.5">
              <MessageSquare size={14} className="inline ml-1" />
              ملاحظات
            </label>
            <textarea
              value={form.notes}
              onChange={(e) => updateField("notes", e.target.value)}
              placeholder="أي ملاحظات إضافية..."
              rows={3}
              className={cn(
                "w-full px-4 py-2.5 rounded-xl text-sm",
                "bg-muted/50 border border-input text-foreground",
                "placeholder:text-muted-foreground",
                "focus:ring-2 focus:ring-ring focus:border-transparent",
                "resize-none"
              )}
            />
          </div>
        </div>

        {/* Submit */}
        <div className="flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={() => router.push("/leads")}
            className="px-6 py-2.5 rounded-xl text-sm font-semibold text-muted-foreground hover:bg-muted transition-colors"
          >
            إلغاء
          </button>
          <button
            type="submit"
            disabled={loading}
            className={cn(
              "px-6 py-2.5 rounded-xl text-sm font-semibold",
              "bg-brand-700 text-white",
              "hover:bg-brand-600 transition-colors",
              "disabled:opacity-50 disabled:cursor-not-allowed",
              "flex items-center gap-2"
            )}
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <Save size={18} />
                حفظ العميل
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}

// ── Reusable Form Components ──

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
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
  min?: number;
  max?: number;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-foreground mb-1.5">
        {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        min={min}
        max={max}
        className={cn(
          "w-full px-4 py-2.5 rounded-xl text-sm",
          "bg-muted/50 border border-input text-foreground",
          "placeholder:text-muted-foreground",
          "focus:ring-2 focus:ring-ring focus:border-transparent"
        )}
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
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
  placeholder?: string;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-foreground mb-1.5">
        {label}
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={cn(
          "w-full px-4 py-2.5 rounded-xl text-sm",
          "bg-muted/50 border border-input text-foreground",
          "focus:ring-2 focus:ring-ring focus:border-transparent"
        )}
      >
        {placeholder && (
          <option value="" disabled>
            {placeholder}
          </option>
        )}
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}