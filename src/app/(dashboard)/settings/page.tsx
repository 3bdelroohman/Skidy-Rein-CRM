"use client";

import { useMemo, useRef, useState, type ChangeEvent, type ReactNode } from "react";
import {
  Bell,
  Database,
  Download,
  Eye,
  EyeOff,
  KeyRound,
  Languages,
  MoonStar,
  Palette,
  RotateCcw,
  Save,
  Settings,
  ShieldCheck,
  Trash2,
  Upload,
  User,
} from "lucide-react";
import { useTheme } from "next-themes";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { useUIStore } from "@/stores/ui-store";
import { t } from "@/lib/locale";
import {
  clearStorageByPrefix,
  CRM_STORAGE_PREFIX,
  exportStorageSnapshot,
  getStorageEntriesByPrefix,
  importStorageSnapshot,
  parseStorageSnapshot,
} from "@/services/storage";

export default function SettingsPage() {
  const { theme, setTheme } = useTheme();
  const { locale, setLocale, sidebarOpen, setSidebarOpen } = useUIStore();
  const [notifications, setNotifications] = useState({ email: true, whatsapp: true, browser: false });
  const [profile, setProfile] = useState({ name: "Abdelrahman", email: "admin@skidyrein.com" });
  const [passwordForm, setPasswordForm] = useState({ next: "", confirm: "" });
  const [showPassword, setShowPassword] = useState({ next: false, confirm: false });
  const [busy, setBusy] = useState<null | "save" | "reset" | "clear" | "export" | "import" | "password">(null);
  const backupInputRef = useRef<HTMLInputElement | null>(null);
  const supabase = useMemo(() => createClient(), []);

  const previewText = useMemo(
    () => ({
      title: t(locale, "معاينة سريعة", "Quick preview"),
      body: t(
        locale,
        "هذه التفضيلات تُطبَّق محليًا داخل المتصفح الحالي، وهي مناسبة جدًا لنسخة التشغيل الداخلي والـ demo.",
        "These preferences are applied locally in the current browser and work well for the internal and demo build.",
      ),
    }),
    [locale],
  );

  const localDataCount = useMemo(() => getStorageEntriesByPrefix(CRM_STORAGE_PREFIX).length, []);

  const passwordChecks = useMemo(() => ({
    length: passwordForm.next.length >= 8,
    letter: /[A-Za-z]/.test(passwordForm.next),
    number: /\d/.test(passwordForm.next),
    match: passwordForm.next.length > 0 && passwordForm.next === passwordForm.confirm,
  }), [passwordForm]);

  const handleChangePassword = async () => {
    if (!passwordChecks.length || !passwordChecks.letter || !passwordChecks.number) {
      toast.error(
        t(
          locale,
          "كلمة المرور الجديدة يجب أن تكون 8 أحرف على الأقل وتحتوي على حروف وأرقام.",
          "The new password must be at least 8 characters and include letters and numbers.",
        ),
      );
      return;
    }

    if (!passwordChecks.match) {
      toast.error(t(locale, "تأكيد كلمة المرور غير مطابق.", "Password confirmation does not match."));
      return;
    }

    try {
      setBusy("password");
      const { error } = await supabase.auth.updateUser({ password: passwordForm.next });

      if (error) {
        toast.error(error.message);
        return;
      }

      setPasswordForm({ next: "", confirm: "" });
      toast.success(
        t(
          locale,
          "تم تحديث كلمة المرور بنجاح. استخدم الكلمة الجديدة في تسجيلات الدخول القادمة.",
          "Password updated successfully. Use the new password for future sign-ins.",
        ),
      );
    } finally {
      setBusy(null);
    }
  };

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

  const handleExportBackup = async () => {
    try {
      setBusy("export");
      const snapshot = exportStorageSnapshot(CRM_STORAGE_PREFIX);
      const blob = new Blob([JSON.stringify(snapshot, null, 2)], { type: "application/json" });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      const datePart = new Date().toISOString().slice(0, 19).replace(/[T:]/g, "-");
      link.href = url;
      link.download = `skidy-rein-backup-${datePart}.json`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast.success(t(locale, "تم تنزيل نسخة احتياطية محلية بنجاح", "Local backup exported successfully"));
    } finally {
      setBusy(null);
    }
  };

  const handleImportBackup = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setBusy("import");
      const content = await file.text();
      const snapshot = parseStorageSnapshot(content);

      if (!snapshot) {
        toast.error(t(locale, "ملف النسخة الاحتياطية غير صالح", "Invalid backup file"));
        return;
      }

      const { imported } = importStorageSnapshot(snapshot, {
        clearExisting: true,
        expectedPrefix: CRM_STORAGE_PREFIX,
      });

      toast.success(
        t(
          locale,
          `تم استيراد ${imported} عنصر من النسخة الاحتياطية. سيُعاد تحميل الصفحة الآن.`,
          `Imported ${imported} backup entries. The page will reload now.`,
        ),
      );
      window.setTimeout(() => window.location.reload(), 500);
    } catch {
      toast.error(t(locale, "تعذر استيراد النسخة الاحتياطية", "Could not import the backup"));
    } finally {
      event.target.value = "";
      setBusy(null);
    }
  };

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="rounded-3xl border border-border bg-card p-6">
        <h1 className="flex items-center gap-2 text-2xl font-bold text-foreground">
          <Settings size={28} className="text-brand-600" />
          {t(locale, "الإعدادات", "Settings")}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {t(
            locale,
            "مركز واحد لتفضيلات العرض واللغة والإشعارات وإدارة بيانات النسخة المحلية",
            "One place for appearance, language, notifications, and local demo data controls",
          )}
        </p>
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

          <Card title={t(locale, "أمان الحساب", "Account security")} icon={ShieldCheck}>
            <div className="space-y-4">
              <div className="rounded-2xl border border-border bg-background p-4">
                <p className="text-sm font-semibold text-foreground">{t(locale, "تغيير كلمة المرور", "Change password")}</p>
              </div>

              <div className="grid grid-cols-1 gap-4">
                <PasswordField
                  label={t(locale, "كلمة المرور الجديدة", "New password")}
                  value={passwordForm.next}
                  visible={showPassword.next}
                  onToggleVisibility={() => setShowPassword((prev) => ({ ...prev, next: !prev.next }))}
                  onChange={(value) => setPasswordForm((prev) => ({ ...prev, next: value }))}
                />
                <PasswordField
                  label={t(locale, "تأكيد كلمة المرور", "Confirm password")}
                  value={passwordForm.confirm}
                  visible={showPassword.confirm}
                  onToggleVisibility={() => setShowPassword((prev) => ({ ...prev, confirm: !prev.confirm }))}
                  onChange={(value) => setPasswordForm((prev) => ({ ...prev, confirm: value }))}
                />
              </div>

              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                <PasswordCheck label={t(locale, "8 أحرف أو أكثر", "8 characters or more")} passed={passwordChecks.length} />
                <PasswordCheck label={t(locale, "يحتوي على حروف", "Contains letters")} passed={passwordChecks.letter} />
                <PasswordCheck label={t(locale, "يحتوي على أرقام", "Contains numbers")} passed={passwordChecks.number} />
                <PasswordCheck label={t(locale, "التأكيد مطابق", "Confirmation matches")} passed={passwordChecks.match} />
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-muted/30 p-4">
                <div className="space-y-1">
                  <p className="text-sm font-semibold text-foreground">{t(locale, "تحديث كلمة المرور للحساب الحالي", "Update password for the current account")}</p>
                  <p className="text-xs text-muted-foreground">
                    {t(
                      locale,
                      "إذا انتهت الجلسة الحالية أو انتهت صلاحيتها، قد تحتاج إلى تسجيل الدخول مرة أخرى ثم إعادة المحاولة.",
                      "If the current session has expired, you may need to sign in again before retrying.",
                    )}
                  </p>
                </div>
                <button
                  onClick={handleChangePassword}
                  disabled={busy === "password"}
                  className={cn(
                    "inline-flex items-center gap-2 rounded-xl bg-brand-700 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-60",
                  )}
                >
                  <KeyRound size={16} />
                  {busy === "password" ? t(locale, "جارِ التحديث...", "Updating...") : t(locale, "تحديث كلمة المرور", "Update password")}
                </button>
              </div>
            </div>
          </Card>

          <Card title={t(locale, "المظهر واللغة", "Appearance & language")} icon={Palette}>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <SelectField
                label={t(locale, "السمة", "Theme")}
                value={theme ?? "system"}
                onChange={(value) => setTheme(value)}
                options={[
                  { value: "light", label: t(locale, "فاتح", "Light") },
                  { value: "dark", label: t(locale, "داكن", "Dark") },
                  { value: "system", label: t(locale, "تلقائي", "System") },
                ]}
              />
              <SelectField
                label={t(locale, "اللغة", "Language")}
                value={locale}
                onChange={(value) => setLocale(value as "ar" | "en")}
                options={[
                  { value: "ar", label: "العربية" },
                  { value: "en", label: "English" },
                ]}
              />
            </div>
            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <ToggleRow
                icon={Languages}
                title={t(locale, "الشريط الجانبي موسّع", "Expanded sidebar")}
                description={t(locale, "تحكم سريع في عرض القائمة الرئيسية", "Quick control over main sidebar size")}
                checked={sidebarOpen}
                onChange={setSidebarOpen}
              />
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
                  <input
                    type="checkbox"
                    checked={notifications[item.key as keyof typeof notifications]}
                    onChange={(event) => setNotifications((prev) => ({ ...prev, [item.key]: event.target.checked }))}
                    className="h-5 w-5 rounded border-border text-brand-600 focus:ring-brand-500"
                  />
                </label>
              ))}
            </div>
          </Card>
        </div>

        <div className="space-y-6">
          <Card title={t(locale, "إدارة بيانات النسخة", "Demo data controls")} icon={Database}>
            <div className="mb-4 rounded-2xl border border-border bg-background p-4">
              <p className="text-sm font-semibold text-foreground">{t(locale, "البيانات المحلية الحالية", "Current local data")}</p>
              <p className="mt-1 text-sm text-muted-foreground">
                {t(locale, `يوجد ${localDataCount} مفاتيح محلية مرتبطة بالـ CRM داخل هذا المتصفح.`, `There are ${localDataCount} local CRM storage entries in this browser.`)}
              </p>
            </div>

            <div className="space-y-3">
              <ActionPanel
                icon={Download}
                title={t(locale, "تنزيل نسخة احتياطية", "Export backup")}
                description={t(locale, "احفظ نسخة JSON من بيانات الـ demo المحلية قبل التجارب الكبيرة أو قبل الاستبدال بملفات جديدة.", "Save a JSON backup of the local demo data before large experiments or before replacing the project files.")}
                buttonLabel={t(locale, "تنزيل النسخة الاحتياطية", "Export backup")}
                onClick={handleExportBackup}
                variant="primary"
                busy={busy === "export"}
              />

              <ActionPanel
                icon={Upload}
                title={t(locale, "استيراد نسخة احتياطية", "Import backup")}
                description={t(locale, "استرجع حالة المتصفح الحالية من ملف backup JSON سبق تنزيله من النظام نفسه.", "Restore the current browser state from a backup JSON exported from the CRM.")}
                buttonLabel={t(locale, "اختيار ملف النسخة الاحتياطية", "Choose backup file")}
                onClick={() => backupInputRef.current?.click()}
                variant="secondary"
                busy={busy === "import"}
              />

              <ActionPanel
                icon={RotateCcw}
                title={t(locale, "إعادة تحميل البيانات التجريبية", "Restore demo data")}
                description={t(locale, "مفيد عندما تريد العودة إلى نسخة نظيفة بعد التجربة أو التدريب.", "Useful when you want to go back to a clean internal demo state.")}
                buttonLabel={t(locale, "استعادة النسخة التجريبية", "Restore demo state")}
                onClick={handleResetDemoData}
                variant="primary"
                busy={busy === "reset"}
              />

              <ActionPanel
                icon={Trash2}
                title={t(locale, "مسح البيانات المحلية", "Clear local data")}
                description={t(locale, "يمسح البيانات المخزنة محليًا داخل المتصفح فقط، دون المساس بقاعدة البيانات الفعلية.", "Clears only browser-saved local data without touching the real database.")}
                buttonLabel={t(locale, "مسح البيانات المحلية", "Clear local data")}
                onClick={handleClearLocalData}
                variant="danger"
                busy={busy === "clear"}
              />
            </div>

            <input ref={backupInputRef} type="file" accept="application/json" className="hidden" onChange={handleImportBackup} />
          </Card>

          <Card title={t(locale, "ملاحظات تشغيلية", "Operational notes")} icon={Settings}>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>{t(locale, "• تغيير اللغة والسمة يُحفَظ محليًا في المتصفح الحالي.", "• Theme and language are stored locally in the current browser.")}</li>
              <li>{t(locale, "• جزء من النظام يعمل على وضع fallback محلي عند غياب أو تعطل الاتصال بقاعدة البيانات.", "• Parts of the CRM use local fallback mode if the database is unavailable.")}</li>
              <li>{t(locale, "• تصدير نسخة احتياطية محلية قبل أي تعديل كبير خطوة أمان ممتازة.", "• Exporting a local backup before major changes is a strong safety practice.")}</li>
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

function ToggleRow({ icon: Icon, title, description, checked, onChange }: { icon: typeof Languages; title: string; description: string; checked: boolean; onChange: (value: boolean) => void }) {
  return (
    <label className="flex cursor-pointer items-center gap-3 rounded-2xl border border-border bg-background p-4 transition-colors hover:bg-muted/40">
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-700 dark:bg-brand-950 dark:text-brand-300">
        <Icon size={18} />
      </div>
      <div className="flex-1">
        <p className="text-sm font-semibold text-foreground">{title}</p>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
      <input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} className="h-5 w-5 rounded border-border text-brand-600 focus:ring-brand-500" />
    </label>
  );
}

function StaticPreview({ icon: Icon, title, description }: { icon: typeof Palette; title: string; description: string }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-border bg-background p-4">
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-700 dark:bg-brand-950 dark:text-brand-300">
        <Icon size={18} />
      </div>
      <div>
        <p className="text-sm font-semibold text-foreground">{title}</p>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
    </div>
  );
}

function PasswordField({ label, value, onChange, visible, onToggleVisibility }: { label: string; value: string; onChange: (value: string) => void; visible: boolean; onToggleVisibility: () => void }) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-foreground">{label}</label>
      <div className="relative">
        <input
          type={visible ? "text" : "password"}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="w-full rounded-xl border border-input bg-muted/50 px-4 py-2.5 pe-12 text-sm text-foreground"
        />
        <button
          type="button"
          onClick={onToggleVisibility}
          className="absolute inset-y-0 end-0 flex items-center px-3 text-muted-foreground transition-colors hover:text-foreground"
          aria-label={visible ? "Hide password" : "Show password"}
        >
          {visible ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      </div>
    </div>
  );
}

function PasswordCheck({ label, passed }: { label: string; passed: boolean }) {
  return (
    <div
      className={cn(
        "rounded-xl border px-3 py-2 text-sm font-medium transition-colors",
        passed
          ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-950/30 dark:text-emerald-300"
          : "border-border bg-background text-muted-foreground",
      )}
    >
      {label}
    </div>
  );
}

function ActionPanel({ icon: Icon, title, description, buttonLabel, onClick, variant, busy }: { icon: typeof Database; title: string; description: string; buttonLabel: string; onClick: () => void; variant: "primary" | "secondary" | "danger"; busy: boolean }) {
  const buttonClassName = {
    primary: "bg-brand-700 text-white hover:bg-brand-600",
    secondary: "border border-border bg-background text-foreground hover:bg-muted",
    danger: "bg-destructive text-white hover:bg-destructive/90",
  }[variant];

  return (
    <div className="rounded-2xl border border-border bg-background p-4">
      <div className="flex items-start gap-3">
        <div className="mt-0.5 flex h-10 w-10 items-center justify-center rounded-xl bg-muted text-brand-700 dark:text-brand-300">
          <Icon size={18} />
        </div>
        <div className="flex-1">
          <p className="text-sm font-semibold text-foreground">{title}</p>
          <p className="mt-1 text-xs leading-5 text-muted-foreground">{description}</p>
          <button onClick={onClick} disabled={busy} className={cn("mt-3 inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-60", buttonClassName)}>
            <Icon size={16} />
            {busy ? "..." : buttonLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
