
"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
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
  CheckCircle2,
  Info,
  TriangleAlert,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useUIStore } from "@/stores/ui-store";
import { useCurrentUser } from "@/providers/user-provider";
import { navigationGroups } from "@/config/navigation";
import { GlobalSearch } from "@/components/layout/global-search";
import { getActionCenterData } from "@/services/operations.service";
import type { AppNotificationItem } from "@/types/crm";

type Notification = AppNotificationItem & { read: boolean };

function usePageTitle(): { ar: string; en: string } {
  const pathname = usePathname();
  for (const group of navigationGroups) {
    for (const item of group.items) {
      if (item.href === "/" && pathname === "/") return { ar: item.titleAr, en: item.titleEn };
      if (item.href !== "/" && pathname.startsWith(item.href)) return { ar: item.titleAr, en: item.titleEn };
    }
  }
  return { ar: "لوحة التحكم", en: "Dashboard" };
}

function mapNotifications(items: AppNotificationItem[]): Notification[] {
  return items.map((item) => ({
    ...item,
    read: item.readDefault ?? false,
  }));
}

export function TopNavbar() {
  const { theme, setTheme } = useTheme();
  const { locale, setLocale, toggleMobileSidebar } = useUIStore();
  const pageTitle = usePageTitle();
  const isAr = locale === "ar";
  const user = useCurrentUser();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let isMounted = true;
    async function loadNotifications() {
      const data = await getActionCenterData(
        {
          role: user.role,
          fullName: user.fullName,
          fullNameAr: user.fullNameAr,
        },
        locale,
      );
      if (isMounted) {
        setNotifications(mapNotifications(data.notifications));
      }
    }
    void loadNotifications();
    return () => {
      isMounted = false;
    };
  }, [locale, user.fullName, user.fullNameAr, user.role]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
    }
    if (showNotifications) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showNotifications]);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setShowSearch(true);
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const markAllAsRead = () => setNotifications((prev) => prev.map((item) => ({ ...item, read: true })));
  const markAsRead = (id: string) => setNotifications((prev) => prev.map((item) => (item.id === id ? { ...item, read: true } : item)));
  const visibleUnreadCount = notifications.filter((item) => !item.read).length;

  function typeIcon(type: Notification["type"]): LucideIcon {
    if (type === "warning") return TriangleAlert;
    if (type === "success") return CheckCircle2;
    return Info;
  }

  return (
    <>
      <header className={cn("sticky top-0 z-30 flex h-16 items-center justify-between gap-4 border-b border-border px-4 lg:px-6", "glass")}>
        <div className="flex items-center gap-3">
          <button onClick={toggleMobileSidebar} className="rounded-xl p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground lg:hidden" aria-label={isAr ? "فتح القائمة" : "Open menu"}>
            <Menu size={20} />
          </button>
          <div>
            <h1 className="text-base font-bold text-foreground lg:text-lg">{isAr ? pageTitle.ar : pageTitle.en}</h1>
            <p className="hidden text-xs text-muted-foreground sm:block">Skidy Rein CRM</p>
          </div>
        </div>

        <div className="flex items-center gap-1 lg:gap-2">
          <button onClick={() => setShowSearch(true)} className="flex items-center gap-2 rounded-xl p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground" aria-label={isAr ? "بحث" : "Search"}>
            <Search size={18} />
            <span className="hidden rounded-md border border-border px-1.5 py-0.5 text-[10px] font-semibold text-muted-foreground lg:inline-block">Ctrl K</span>
          </button>

          <div ref={notifRef} className="relative">
            <button onClick={() => setShowNotifications((prev) => !prev)} className={cn("relative rounded-xl p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground", showNotifications && "bg-muted text-foreground")} aria-label={isAr ? "الإشعارات" : "Notifications"}>
              <Bell size={18} />
              {visibleUnreadCount > 0 && <span className="absolute left-1 top-1 h-2 w-2 rounded-full bg-danger-500 ring-2 ring-background" />}
            </button>

            {showNotifications && (
              <div className={cn("absolute top-full mt-2 w-[340px] max-h-[420px] overflow-hidden rounded-2xl border border-border bg-card shadow-brand-lg z-50", isAr ? "left-0 lg:left-auto lg:right-0" : "right-0") }>
                <div className="flex items-center justify-between border-b border-border px-4 py-3">
                  <h3 className="text-sm font-semibold text-foreground">{isAr ? "الإشعارات" : "Notifications"}</h3>
                  {visibleUnreadCount > 0 && (
                    <button onClick={markAllAsRead} className="flex items-center gap-1 text-xs text-brand-600 transition-colors hover:text-brand-700">
                      <CheckCheck size={14} />
                      {isAr ? "قراءة الكل" : "Mark all read"}
                    </button>
                  )}
                </div>
                <div className="max-h-[340px] overflow-y-auto">
                  {notifications.length === 0 ? (
                    <div className="p-6 text-center text-sm text-muted-foreground">{isAr ? "لا توجد إشعارات حالياً" : "No notifications right now"}</div>
                  ) : (
                    notifications.map((notification) => {
                      const Icon = typeIcon(notification.type);
                      return (
                        <Link key={notification.id} href={notification.href} onClick={() => markAsRead(notification.id)} className={cn("flex w-full items-start gap-3 border-b border-border px-4 py-3 text-start transition-colors last:border-0 hover:bg-muted/50", !notification.read && "bg-brand-50/40 dark:bg-brand-950/10")}>
                          <div className={cn("mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl", notification.type === "warning" && "bg-danger-50 text-danger-600 dark:bg-danger-950/20", notification.type === "success" && "bg-success-50 text-success-600 dark:bg-success-950/20", notification.type === "info" && "bg-brand-50 text-brand-600 dark:bg-brand-950/20")}>
                            <Icon size={16} />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-start justify-between gap-2">
                              <p className={cn("text-sm text-foreground", !notification.read && "font-semibold")}>{notification.title}</p>
                              {!notification.read && <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-brand-600" />}
                            </div>
                            <p className="mt-1 text-[11px] text-muted-foreground">{notification.timeLabel}</p>
                          </div>
                        </Link>
                      );
                    })
                  )}
                </div>
                <div className="border-t border-border p-3">
                  <Link href="/action-center" className="block rounded-xl border border-border px-3 py-2 text-center text-sm font-medium text-foreground transition-colors hover:bg-muted">
                    {isAr ? "فتح مركز العمليات" : "Open action center"}
                  </Link>
                </div>
              </div>
            )}
          </div>

          <button onClick={() => setTheme(theme === "dark" ? "light" : "dark")} className="rounded-xl p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground" aria-label={isAr ? "تبديل السمة" : "Toggle theme"}>
            {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
          </button>

          <button onClick={() => setLocale(isAr ? "en" : "ar")} className="flex items-center gap-1 rounded-xl p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground" aria-label={isAr ? "تبديل اللغة" : "Toggle language"}>
            <Globe size={18} />
            <span className="text-xs font-semibold">{isAr ? "EN" : "ع"}</span>
          </button>
        </div>
      </header>

      <GlobalSearch open={showSearch} onClose={() => setShowSearch(false)} />
    </>
  );
}
