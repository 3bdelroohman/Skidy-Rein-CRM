"use client";

import { useState, useRef, useEffect } from "react";
import { usePathname } from "next/navigation";
import { useTheme } from "next-themes";
import {
  Search,
  Bell,
  Moon,
  Sun,
  Globe,
  Menu,
  CheckCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useUIStore } from "@/stores/ui-store";
import { useCurrentUser } from "@/providers/user-provider";
import { navigationGroups } from "@/config/navigation";

/** Mock notifications — will be replaced with Supabase later */
interface Notification {
  id: string;
  titleAr: string;
  titleEn: string;
  time: string;
  read: boolean;
  type: "warning" | "info" | "success";
}

const INITIAL_NOTIFICATIONS: Notification[] = [
  {
    id: "1",
    titleAr: "3 عملاء جدد ما اترد عليهم",
    titleEn: "3 new leads with no response",
    time: "منذ ساعتين",
    read: false,
    type: "warning",
  },
  {
    id: "2",
    titleAr: "سارة محمد — غابت 3 حصص متتالية",
    titleEn: "Sara Mohamed — missed 3 classes",
    time: "منذ 3 ساعات",
    read: false,
    type: "warning",
  },
  {
    id: "3",
    titleAr: "2 مدفوعات متأخرة أكتر من أسبوع",
    titleEn: "2 overdue payments (1+ week)",
    time: "منذ 5 ساعات",
    read: false,
    type: "warning",
  },
  {
    id: "4",
    titleAr: "5 متابعات مجدولة لليوم",
    titleEn: "5 follow-ups scheduled for today",
    time: "اليوم",
    read: true,
    type: "info",
  },
  {
    id: "5",
    titleAr: "تم تسجيل طالب جديد بنجاح",
    titleEn: "New student enrolled successfully",
    time: "أمس",
    read: true,
    type: "success",
  },
];

/** Get page title from current pathname */
function usePageTitle(): { ar: string; en: string } {
  const pathname = usePathname();

  for (const group of navigationGroups) {
    for (const item of group.items) {
      if (item.href === "/" && pathname === "/") {
        return { ar: item.titleAr, en: item.titleEn };
      }
      if (item.href !== "/" && pathname.startsWith(item.href)) {
        return { ar: item.titleAr, en: item.titleEn };
      }
    }
  }

  return { ar: "لوحة التحكم", en: "Dashboard" };
}

export function TopNavbar() {
  const { theme, setTheme } = useTheme();
  const { locale, setLocale, toggleMobileSidebar } = useUIStore();
  const pageTitle = usePageTitle();
  const isAr = locale === "ar";
  const user = useCurrentUser();

  // Notifications state
  const [notifications, setNotifications] = useState<Notification[]>(
    INITIAL_NOTIFICATIONS
  );
  const [showNotifications, setShowNotifications] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);

  const unreadCount = notifications.filter((n) => !n.read).length;

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        notifRef.current &&
        !notifRef.current.contains(event.target as Node)
      ) {
        setShowNotifications(false);
      }
    }

    if (showNotifications) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showNotifications]);

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const markAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  // Filter notifications by role
  const visibleNotifications = notifications.filter((n) => {
    if (user.role === "sales") {
      return ["1", "3", "4"].includes(n.id);
    }
    if (user.role === "ops") {
      return ["2", "4", "5"].includes(n.id);
    }
    return true; // admin + owner see all
  });

  const visibleUnreadCount = visibleNotifications.filter((n) => !n.read).length;

  const typeIcon = (type: Notification["type"]): string => {
    switch (type) {
      case "warning":
        return "⚠️";
      case "success":
        return "✅";
      case "info":
        return "ℹ️";
    }
  };

  return (
    <header
      className={cn(
        "sticky top-0 z-30 h-16",
        "flex items-center justify-between gap-4 px-4 lg:px-6",
        "border-b border-border",
        "glass"
      )}
    >
      {/* ═══ Right Side: Menu + Title ═══ */}
      <div className="flex items-center gap-3">
        {/* Mobile Menu Button */}
        <button
          onClick={toggleMobileSidebar}
          className={cn(
            "lg:hidden p-2 rounded-xl transition-colors",
            "text-muted-foreground hover:text-foreground",
            "hover:bg-muted"
          )}
          aria-label="فتح القائمة"
        >
          <Menu size={20} />
        </button>

        {/* Page Title */}
        <div>
          <h1 className="font-bold text-foreground text-base lg:text-lg">
            {isAr ? pageTitle.ar : pageTitle.en}
          </h1>
        </div>
      </div>

      {/* ═══ Left Side: Actions ═══ */}
      <div className="flex items-center gap-1 lg:gap-2">
        {/* Search */}
        <button
          className={cn(
            "p-2 rounded-xl transition-colors",
            "text-muted-foreground hover:text-foreground",
            "hover:bg-muted"
          )}
          aria-label="بحث"
        >
          <Search size={18} />
        </button>

        {/* Notifications */}
        <div ref={notifRef} className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className={cn(
              "relative p-2 rounded-xl transition-colors",
              "text-muted-foreground hover:text-foreground",
              "hover:bg-muted",
              showNotifications && "bg-muted text-foreground"
            )}
            aria-label="الإشعارات"
          >
            <Bell size={18} />
            {/* Badge — only show if unread */}
            {visibleUnreadCount > 0 && (
              <span
                className={cn(
                  "absolute top-1 left-1",
                  "w-2 h-2 rounded-full",
                  "bg-danger-500",
                  "ring-2 ring-background"
                )}
              />
            )}
          </button>

          {/* Dropdown */}
          {showNotifications && (
            <div
              className={cn(
                "absolute top-full mt-2",
                "left-0 lg:left-auto lg:right-0",
                "w-[320px] max-h-[400px]",
                "bg-card border border-border rounded-2xl shadow-brand-lg",
                "overflow-hidden z-50"
              )}
            >
              {/* Header */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-border">
                <h3 className="font-semibold text-foreground text-sm">
                  {isAr ? "الإشعارات" : "Notifications"}
                </h3>
                {visibleUnreadCount > 0 && (
                  <button
                    onClick={markAllAsRead}
                    className="flex items-center gap-1 text-xs text-brand-600 hover:text-brand-700 transition-colors"
                  >
                    <CheckCheck size={14} />
                    {isAr ? "قراءة الكل" : "Mark all read"}
                  </button>
                )}
              </div>

              {/* List */}
              <div className="overflow-y-auto max-h-[320px]">
                {visibleNotifications.length === 0 ? (
                  <div className="px-4 py-8 text-center text-muted-foreground text-sm">
                    {isAr ? "لا توجد إشعارات" : "No notifications"}
                  </div>
                ) : (
                  visibleNotifications.map((notif) => (
                    <button
                      key={notif.id}
                      onClick={() => markAsRead(notif.id)}
                      className={cn(
                        "w-full text-right px-4 py-3 flex items-start gap-3",
                        "hover:bg-muted/50 transition-colors border-b border-border last:border-0",
                        !notif.read && "bg-brand-50/50 dark:bg-brand-950/20"
                      )}
                    >
                      <span className="text-base mt-0.5">
                        {typeIcon(notif.type)}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p
                          className={cn(
                            "text-sm",
                            notif.read
                              ? "text-muted-foreground"
                              : "text-foreground font-medium"
                          )}
                        >
                          {isAr ? notif.titleAr : notif.titleEn}
                        </p>
                        <p className="text-[10px] text-muted-foreground mt-1">
                          {notif.time}
                        </p>
                      </div>
                      {!notif.read && (
                        <span className="w-2 h-2 rounded-full bg-brand-600 shrink-0 mt-2" />
                      )}
                    </button>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Theme Toggle */}
        <button
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          className={cn(
            "p-2 rounded-xl transition-colors",
            "text-muted-foreground hover:text-foreground",
            "hover:bg-muted"
          )}
          aria-label="تغيير السمة"
        >
          {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
        </button>

        {/* Locale Toggle */}
        <button
          onClick={() => setLocale(isAr ? "en" : "ar")}
          className={cn(
            "flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl transition-colors",
            "text-muted-foreground hover:text-foreground",
            "hover:bg-muted text-xs font-semibold"
          )}
          aria-label="تبديل اللغة"
        >
          <Globe size={16} />
          <span>{isAr ? "EN" : "ع"}</span>
        </button>
      </div>
    </header>
  );
}