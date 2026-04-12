"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, Save, UserRound } from "lucide-react";
import { toast } from "sonner";
import { t } from "@/lib/locale";
import { useUIStore } from "@/stores/ui-store";
import type { CreateParentInput } from "@/types/crm";

interface ParentFormProps {
  title: string;
  description: string;
  submitLabel: string;
  successMessage: string;
  onSubmit: (payload: CreateParentInput) => Promise<void>;
  cancelHref?: string;
}

export function ParentForm({
  title,
  description,
  submitLabel,
  successMessage,
  onSubmit,
  cancelHref = "/parents",
}: ParentFormProps) {
  const router = useRouter();
  const locale = useUIStore((state) => state.locale);
  const isAr = locale === "ar";
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    fullName: "",
    phone: "",
    whatsapp: "",
    email: "",
    city: "",
  });

  const updateField = (field: keyof typeof form, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!form.fullName.trim() || !form.phone.trim()) {
      toast.error(t(locale, "اسم ولي الأمر ورقم الهاتف مطلوبان", "Parent name and phone are required"));
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
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: string;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-foreground">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="w-full rounded-xl border border-input bg-muted/50 px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-transparent focus:ring-2 focus:ring-ring"
      />
    </div>
  );
}
