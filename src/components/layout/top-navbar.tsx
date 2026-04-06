"use client";

import { usePathname } from "next/navigation";
import { useTheme } from "next-themes";
import {
  Search,
  Bell,
  Moon,
  Sun,
  Globe,
  Menu,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useUIStore } from "@/stores/ui-store";
import { navigationGroups } from "@/config/navigation";

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
  const { locale, setLocale, toggleMobileSidebar, sidebarOpen } =
    useUIStore();
  const pageTitle = usePageTitle();
  const isAr = locale === "ar";

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
        <button
          className={cn(
            "relative p-2 rounded-xl transition-colors",
            "text-muted-foreground hover:text-foreground",
            "hover:bg-muted"
          )}
          aria-label="الإشعارات"
        >
          <Bell size={18} />
          {/* Notification Badge */}
          <span
            className={cn(
              "absolute top-1 left-1",
              "w-2 h-2 rounded-full",
              "bg-danger-500",
              "ring-2 ring-background"
            )}
          />
        </button>

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