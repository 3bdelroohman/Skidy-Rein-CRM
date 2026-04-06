"use client";

import { useState } from "react";
import { Settings, User, Bell, Palette, Globe, Shield, Save } from "lucide-react";
import { useTheme } from "next-themes";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useUIStore } from "@/stores/ui-store";

export default function SettingsPage() {
  const { theme, setTheme } = useTheme();
  const { locale, setLocale } = useUIStore();
  const [notifications, setNotifications] = useState({ email: true, whatsapp: true, browser: false });

  const handleSave = () => toast.success("تم حفظ الإعدادات بنجاح");

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <Settings size={28} className="text-brand-600" />
          الإعدادات
        </h1>
        <p className="text-muted-foreground text-sm mt-1">إعدادات النظام والتفضيلات</p>
      </div>

      {/* Profile */}
      <div className="bg-card rounded-2xl border border-border p-5">
        <h3 className="font-bold text-foreground mb-4 flex items-center gap-2"><User size={18} className="text-brand-600" />الملف الشخصي</h3>
        <div className="flex items-center gap-4 mb-4">
          <div className="w-16 h-16 rounded-2xl bg-brand-700 flex items-center justify-center"><span className="text-white font-bold text-2xl">A</span></div>
          <div>
            <p className="font-bold text-foreground text-lg">Abdelrahman</p>
            <p className="text-muted-foreground text-sm">مدير النظام</p>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">الاسم</label>
            <input type="text" defaultValue="Abdelrahman" className={cn("w-full px-4 py-2.5 rounded-xl text-sm", "bg-muted/50 border border-input text-foreground")} />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">البريد</label>
            <input type="email" defaultValue="admin@skidyrein.com" className={cn("w-full px-4 py-2.5 rounded-xl text-sm", "bg-muted/50 border border-input text-foreground")} />
          </div>
        </div>
      </div>

      {/* Appearance */}
      <div className="bg-card rounded-2xl border border-border p-5">
        <h3 className="font-bold text-foreground mb-4 flex items-center gap-2"><Palette size={18} className="text-brand-600" />المظهر</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">السمة</label>
            <select value={theme} onChange={(e) => setTheme(e.target.value)} className="w-full px-4 py-2.5 rounded-xl text-sm bg-muted/50 border border-input text-foreground">
              <option value="light">فاتح</option>
              <option value="dark">داكن</option>
              <option value="system">تلقائي</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">اللغة</label>
            <select value={locale} onChange={(e) => setLocale(e.target.value as "ar" | "en")} className="w-full px-4 py-2.5 rounded-xl text-sm bg-muted/50 border border-input text-foreground">
              <option value="ar">عربي</option>
              <option value="en">English</option>
            </select>
          </div>
        </div>
      </div>

      {/* Notifications */}
      <div className="bg-card rounded-2xl border border-border p-5">
        <h3 className="font-bold text-foreground mb-4 flex items-center gap-2"><Bell size={18} className="text-brand-600" />الإشعارات</h3>
        <div className="space-y-3">
          {[
            { key: "email", label: "إشعارات البريد" },
            { key: "whatsapp", label: "إشعارات WhatsApp" },
            { key: "browser", label: "إشعارات المتصفح" },
          ].map((item) => (
            <label key={item.key} className="flex items-center justify-between p-3 rounded-xl hover:bg-muted/50 cursor-pointer transition-colors">
              <span className="text-sm text-foreground">{item.label}</span>
              <input
                type="checkbox"
                checked={notifications[item.key as keyof typeof notifications]}
                onChange={(e) => setNotifications((prev) => ({ ...prev, [item.key]: e.target.checked }))}
                className="w-5 h-5 rounded border-border text-brand-600 focus:ring-brand-500"
              />
            </label>
          ))}
        </div>
      </div>

      {/* Save */}
      <div className="flex justify-end">
        <button onClick={handleSave} className={cn("px-6 py-2.5 rounded-xl text-sm font-semibold", "bg-brand-700 text-white hover:bg-brand-600 transition-colors", "flex items-center gap-2")}>
          <Save size={18} />
          حفظ الإعدادات
        </button>
      </div>
    </div>
  );
}