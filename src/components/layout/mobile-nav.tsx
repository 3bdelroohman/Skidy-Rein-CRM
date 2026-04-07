"use client";

import { usePathname } from "next/navigation";
import { useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { X, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";
import { useUIStore } from "@/stores/ui-store";
import { useCurrentUser } from "@/providers/user-provider";
import { signOutClient } from "@/lib/actions/auth.actions";
import { navigationGroups } from "@/config/navigation";
import { ROLE_PERMISSIONS } from "@/config/roles";

export function MobileNav() {
  const pathname = usePathname();
  const { mobileSidebarOpen, setMobileSidebarOpen, locale } = useUIStore();
  const isAr = locale === "ar";

  // Real user — not hardcoded!
  const user = useCurrentUser();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const displayName = isAr ? user.fullNameAr : user.fullName;
  const initial = user.fullName.charAt(0).toUpperCase();
  const roleLabel = isAr
    ? ROLE_PERMISSIONS[user.role].labelAr
    : ROLE_PERMISSIONS[user.role].labelEn;

  // Filter nav by REAL user role
  const filteredGroups = navigationGroups
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => item.roles.includes(user.role)),
    }))
    .filter((group) => group.items.length > 0);

  const isActive = (href: string): boolean => {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  };

  const handleClose = () => setMobileSidebarOpen(false);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    await signOutClient();
  };

  return (
    <AnimatePresence>
      {mobileSidebarOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm lg:hidden"
            onClick={handleClose}
          />

          {/* Panel */}
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className={cn(
              "fixed top-0 right-0 z-50 h-screen w-[280px]",
              "bg-brand-950 lg:hidden",
              "flex flex-col"
            )}
          >
            {/* Header */}
            <div className="h-16 flex items-center justify-between px-4 border-b border-white/10">
              <div className="flex items-center gap-3">
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center"
                  style={{ background: "#4338CA" }}
                >
                  <span className="text-white font-bold text-sm">SR</span>
                </div>
                <div>
                  <p className="text-white font-bold text-sm">Skidy Rein</p>
                  <p className="text-white/50 text-[10px]">
                    {isAr ? "لوحة التحكم" : "Dashboard"}
                  </p>
                </div>
              </div>

              <button
                onClick={handleClose}
                className="p-2 rounded-xl text-white/40 hover:text-white hover:bg-white/10 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Navigation */}
            <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-6">
              {filteredGroups.map((group) => (
                <div key={group.labelEn}>
                  <p className="text-white/40 text-[10px] font-semibold uppercase tracking-wider px-3 mb-2">
                    {isAr ? group.labelAr : group.labelEn}
                  </p>

                  <div className="space-y-1">
                    {group.items.map((item) => {
                      const active = isActive(item.href);
                      const Icon = item.icon;

                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          onClick={handleClose}
                          className={cn(
                            "flex items-center gap-3 px-3 py-2.5 rounded-xl",
                            "text-sm transition-all duration-200",
                            active
                              ? "bg-brand-700 text-white shadow-lg shadow-brand-700/30"
                              : "text-white/60 hover:bg-white/8 hover:text-white"
                          )}
                        >
                          <Icon
                            size={20}
                            className={cn(
                              active ? "text-cream-200" : "text-white/50"
                            )}
                          />
                          <span>{isAr ? item.titleAr : item.titleEn}</span>

                          {item.badge && item.badge > 0 && (
                            <span className="mr-auto bg-danger-500 text-white text-[10px] font-bold rounded-full px-1.5 py-0.5">
                              {item.badge}
                            </span>
                          )}
                        </Link>
                      );
                    })}
                  </div>
                </div>
              ))}
            </nav>

            {/* User Info + Logout */}
            <div className="border-t border-white/10 p-3">
              <div className="flex items-center gap-3 rounded-xl p-2 bg-white/5">
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                  style={{ background: "#4338CA" }}
                >
                  <span className="text-white text-xs font-bold">
                    {initial}
                  </span>
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-white text-xs font-semibold truncate">
                    {displayName}
                  </p>
                  <p className="text-white/40 text-[10px]">{roleLabel}</p>
                </div>

                <button
                  onClick={handleLogout}
                  disabled={isLoggingOut}
                  className={cn(
                    "text-white/30 hover:text-red-400 transition-colors",
                    isLoggingOut && "opacity-50 cursor-not-allowed"
                  )}
                  title={isAr ? "تسجيل الخروج" : "Sign Out"}
                >
                  {isLoggingOut ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <LogOut size={16} />
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}