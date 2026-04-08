"use client";

import { useMemo, useState, type ReactNode } from "react";
import { Bell, Database, Languages, MoonStar, Palette, RotateCcw, Save, Settings, Trash2, User } from "lucide-react";
import { useTheme } from "next-themes";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useUIStore } from "@/stores/ui-store";
import { t } from "@/lib/locale";
import { clearStorageByPrefix } from "@/services/storage";

const CRM_STORAGE_PREFIX = "skidy.crm.";

export default function SettingsPage() {
  const { theme, setTheme } = useTheme();
  const { locale, setLocale, sidebarOpen, setSidebarOpen } = useUIStore();
  const [notifications, setNotifications] = useState({ email: true, whatsapp: true, browser: false });
  const [profile, setProfile] = useState({ name: "Abdelrahman", email: "admin@skidyrein.com" });
  const [busy, setBusy] = useState<null | "save" | "reset" | "clear">(null);

  const previewText = useMemo(
    () => ({
      title: t(locale, "معاينة سريعة", "Quick preview"),
      body: t(locale, "هذه التفضيلات تُطبَّق محليًا داخل المتصفح الحالي، وهي مناسبة جدًا لنسخة التشغيل الداخلي والـ demo.", "These preferences are applied locally in the current browser and work well for the internal and demo build."),
    }),
    [locale],
  );

  const handleSave = async () => {
    setBusy("save");
    await new Promise((resolve) => setTimeout(resolve, 250));
    toast.success(t(locale, "تم حفظ الإعدادات بنجاح", "Settings saved successfully"));
    setBusy(null);
  };

  const handleResetDemoData = async () => {
    setBusy("reset");
    clearStorageByPrefix(CRM_STORAGE_PREFIX);
    toast.success(t(locale, "تمت إعادة بيانات النسخة التجريبية. سيُعاد تحميل الصفحة الآن.", "Demo data was restored. The page will reload now."));
    window.setTimeout(() => window.location.reload(), 500);
  };

  const handleClearLocalData = async () => {
    setBusy("clear");
    clearStorageByPrefix(CRM_STORAGE_PREFIX);
    toast.success(t(locale, "تم مسح البيانات المحلية المحفوظة. سيُعاد تحميل الصفحة الآن.", "Saved local data was cleared. The page will reload now."));
    window.setTimeout(() => window.location.reload(), 500);
  };

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="rounded-3xl border border-border bg-card p-6">
        <h1 className="flex items-center gap-2 text-2xl font-bold text-foreground">
          <Settings size={28} className="text-brand-600" />
          {t(locale, "الإعدادات", "Settings")}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">{t(locale, "مركز واحد لتفضيلات العرض واللغة والإشعارات وإدارة بيانات النسخة المحلية", "One place for appearance, language, notifications, and local demo data controls")}</p>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-6">
          <Card title={t(locale, "الملف الشخصي", "Profile")} icon={User}>
            <div className="mb-4 flex items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-700 text-2xl font-bold text-white">A</div>
              <div>
                <p className="text-lg font-bold text-foreground">{profile.name}</p>
                <p className="text-sm text-muted-foreground">{t(locale, "مدير النظام", "System admin")}</p>
              </div>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label={t(locale, "الاسم", "Name")} value={profile.name} onChange={(value) => setProfile((prev) => ({ ...prev, name: value }))} />
              <Field label={t(locale, "البريد", "Email")} type="email" value={profile.email} onChange={(value) => setProfile((prev) => ({ ...prev, email: value }))} />
            </div>
          </Card>

          <Card title={t(locale, "المظهر واللغة", "Appearance & language")} icon={Palette}>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <SelectField label={t(locale, "السمة", "Theme")} value={theme ?? "system"} onChange={(value) => setTheme(value)} options={[{ value: "light", label: t(locale, "فاتح", "Light") }, { value: "dark", label: t(locale, "داكن", "Dark") }, { value: "system", label: t(locale, "تلقائي", "System") }]} />
              <SelectField label={t(locale, "اللغة", "Language")} value={locale} onChange={(value) => setLocale(value as "ar" | "en")} options={[{ value: "ar", label: "العربية" }, { value: "en", label: "English" }]} />
            </div>
            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <ToggleRow icon={Languages} title={t(locale, "الشريط الجانبي موسّع", "Expanded sidebar")} description={t(locale, "تحكم سريع في عرض القائمة الرئيسية", "Quick control over main sidebar size")} checked={sidebarOpen} onChange={setSidebarOpen} />
              <StaticPreview icon={theme === "dark" ? MoonStar : Palette} title={previewText.title} description={previewText.body} />
            </div>
          </Card>

          <Card title={t(locale, "الإشعارات", "Notifications")} icon={Bell}>
            <div className="space-y-3">
              {[
                { key: "email", labelAr: "إشعارات البريد", labelEn: "Email notifications" },
                { key: "whatsapp", labelAr: "إشعارات واتساب", labelEn: "WhatsApp notifications" },
                { key: "browser", labelAr: "إشعارات المتصفح", labelEn: "Browser notifications" },
              ].map((item) => (
                <label key={item.key} className="flex cursor-pointer items-center justify-between rounded-2xl border border-border bg-background p-3 transition-colors hover:bg-muted/50">
                  <span className="text-sm text-foreground">{t(locale, item.labelAr, item.labelEn)}</span>
                  <input type="checkbox" checked={notifications[item.key as keyof typeof notifications]} onChange={(event) => setNotifications((prev) => ({ ...prev, [item.key]: event.target.checked }))} className="h-5 w-5 rounded border-border text-brand-600 focus:ring-brand-500" />
                </label>
              ))}
            </div>
          </Card>
        </div>

        <div className="space-y-6">
          <Card title={t(locale, "إدارة بيانات النسخة", "Demo data controls")} icon={Database}>
            <div className="space-y-3">
              <ActionPanel icon={RotateCcw} title={t(locale, "إعادة تحميل البيانات التجريبية", "Restore demo data")} description={t(locale, "مفيد عندما تريد العودة إلى نسخة نظيفة بعد التجربة أو التدريب.", "Useful when you want to go back to a clean internal demo state.")} buttonLabel={t(locale, "استعادة النسخة التجريبية", "Restore demo state")} onClick={handleResetDemoData} variant="primary" busy={busy === "reset"} />
              <ActionPanel icon={Trash2} title={t(locale, "مسح البيانات المحلية", "Clear local data")} description={t(locale, "يمسح البيانات المخزنة محليًا داخل المتصفح فقط، دون المساس بقاعدة البيانات الفعلية.", "Clears only browser-saved local data without touching the real database.")} buttonLabel={t(locale, "مسح البيانات المحلية", "Clear local data")} onClick={handleClearLocalData} variant="danger" busy={busy === "clear"} />
            </div>
          </Card>

          <Card title={t(locale, "ملاحظات تشغيلية", "Operational notes")} icon={Settings}>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>{t(locale, "• تغيير اللغة والسمة يُحفَظ محليًا في المتصفح الحالي.", "• Theme and language are stored locally in the current browser.")}</li>
              <li>{t(locale, "• جزء من النظام يعمل على وضع fallback محلي عند غياب أو تعطل الاتصال بقاعدة البيانات.", "• Parts of the CRM use local fallback mode if the database is unavailable.")}</li>
              <li>{t(locale, "• إعادة البيانات التجريبية مفيدة قبل تسليم نسخة عرض أو بدء تجربة جديدة.", "• Restoring demo data is useful before a showcase or a fresh demo session.")}</li>
            </ul>
          </Card>

          <div className="flex justify-end">
            <button onClick={handleSave} disabled={busy === "save"} className={cn("flex items-center gap-2 rounded-xl bg-brand-700 px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-50")}>
              <Save size={18} />
              {busy === "save" ? t(locale, "جارِ الحفظ...", "Saving...") : t(locale, "حفظ الإعدادات", "Save settings")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Card({ title, icon: Icon, children }: { title: string; icon: typeof Settings; children: ReactNode }) {
  return (
    <section className="rounded-2xl border border-border bg-card p-5">
      <h3 className="mb-4 flex items-center gap-2 font-bold text-foreground">
        <Icon size={18} className="text-brand-600" />
        {title}
      </h3>
      {children}
    </section>
  );
}

function Field({ label, value, onChange, type = "text" }: { label: string; value: string; onChange: (value: string) => void; type?: string }) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-foreground">{label}</label>
      <input type={type} value={value} onChange={(event) => onChange(event.target.value)} className="w-full rounded-xl border border-input bg-muted/50 px-4 py-2.5 text-sm text-foreground" />
    </div>
  );
}

function SelectField({ label, value, onChange, options }: { label: string; value: string; onChange: (value: string) => void; options: Array<{ value: string; label: string }> }) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-foreground">{label}</label>
      <select value={value} onChange={(event) => onChange(event.target.value)} className="w-full rounded-xl border border-input bg-muted/50 px-4 py-2.5 text-sm text-foreground">
        {options.map((option) => (
          <option key={option.value} value={option.value}>{option.label}</option>
        ))}
      </select>
    </div>
  );
}

function ToggleRow({ icon: Icon, title, description, checked, onChange }: { icon: typeof Settings; title: string; description: string; checked: boolean; onChange: (value: boolean) => void }) {
  return (
    <label className="flex cursor-pointer items-start justify-between gap-4 rounded-2xl border border-border bg-background p-4 transition-colors hover:bg-muted/50">
      <div className="flex items-start gap-3">
        <div className="mt-0.5 flex h-10 w-10 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
          <Icon size={18} />
        </div>
        <div>
          <p className="text-sm font-semibold text-foreground">{title}</p>
          <p className="mt-1 text-xs text-muted-foreground">{description}</p>
        </div>
      </div>
      <input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} className="mt-1 h-5 w-5 rounded border-border text-brand-600 focus:ring-brand-500" />
    </label>
  );
}

function StaticPreview({ icon: Icon, title, description }: { icon: typeof Settings; title: string; description: string }) {
  return (
    <div className="rounded-2xl border border-border bg-background p-4">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
          <Icon size={18} />
        </div>
        <div>
          <p className="text-sm font-semibold text-foreground">{title}</p>
          <p className="mt-1 text-xs leading-6 text-muted-foreground">{description}</p>
        </div>
      </div>
    </div>
  );
}

function ActionPanel({ icon: Icon, title, description, buttonLabel, onClick, variant, busy }: { icon: typeof Settings; title: string; description: string; buttonLabel: string; onClick: () => void; variant: "primary" | "danger"; busy: boolean }) {
  return (
    <div className="rounded-2xl border border-border bg-background p-4">
      <div className="flex items-start gap-3">
        <div className={cn("flex h-10 w-10 items-center justify-center rounded-2xl", variant === "danger" ? "bg-danger-50 text-danger-600 dark:bg-danger-950/20" : "bg-brand-50 text-brand-700 dark:bg-brand-950 dark:text-brand-300")}>
          <Icon size={18} />
        </div>
        <div className="flex-1">
          <p className="text-sm font-semibold text-foreground">{title}</p>
          <p className="mt-1 text-xs leading-6 text-muted-foreground">{description}</p>
          <button onClick={onClick} disabled={busy} className={cn("mt-4 rounded-xl px-4 py-2 text-xs font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50", variant === "danger" ? "bg-danger-600 text-white hover:bg-danger-500" : "bg-brand-700 text-white hover:bg-brand-600")}>
            {busy ? "..." : buttonLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
