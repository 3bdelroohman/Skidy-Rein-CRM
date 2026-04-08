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
  const user = useCurrentUser();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const displayName = isAr ? user.fullNameAr : user.fullName;
  const initial = user.fullName.charAt(0).toUpperCase();
  const roleLabel = isAr ? ROLE_PERMISSIONS[user.role].labelAr : ROLE_PERMISSIONS[user.role].labelEn;

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
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm lg:hidden"
            onClick={handleClose}
          />

          <motion.div
            initial={{ x: isAr ? "100%" : "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: isAr ? "100%" : "-100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className={cn(
              "fixed top-0 z-50 h-screen w-[280px] bg-brand-950 lg:hidden flex flex-col",
              isAr ? "right-0" : "left-0",
            )}
          >
            <div className="flex h-16 items-center justify-between border-b border-white/10 px-4">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl" style={{ background: "#4338CA" }}>
                  <span className="text-sm font-bold text-white">SR</span>
                </div>
                <div>
                  <p className="text-sm font-bold text-white">Skidy Rein</p>
                  <p className="text-[10px] text-white/50">{isAr ? "لوحة التحكم" : "Dashboard"}</p>
                </div>
              </div>

              <button onClick={handleClose} className="rounded-xl p-2 text-white/40 transition-colors hover:bg-white/10 hover:text-white">
                <X size={20} />
              </button>
            </div>

            <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
              {filteredGroups.map((group) => (
                <div key={group.labelEn}>
                  <p className={cn("mb-2 px-3 text-[10px] font-semibold uppercase tracking-wider text-white/40", !isAr && "text-left")}>
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
                            "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-all duration-200",
                            active
                              ? "bg-brand-700 text-white shadow-lg shadow-brand-700/30"
                              : "text-white/60 hover:bg-white/8 hover:text-white",
                          )}
                        >
                          <Icon size={20} className={cn(active ? "text-cream-200" : "text-white/50")} />
                          <span>{isAr ? item.titleAr : item.titleEn}</span>

                          {item.badge && item.badge > 0 && (
                            <span className={cn("bg-danger-500 text-white text-[10px] font-bold rounded-full px-1.5 py-0.5", isAr ? "mr-auto" : "ml-auto")}>
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

            <div className="border-t border-white/10 p-3">
              <div className="flex items-center gap-3 rounded-xl bg-white/5 p-2">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg" style={{ background: "#4338CA" }}>
                  <span className="text-xs font-bold text-white">{initial}</span>
                </div>

                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-semibold text-white">{displayName}</p>
                  <p className="text-[10px] text-white/40">{roleLabel}</p>
                </div>

                <button
                  onClick={handleLogout}
                  disabled={isLoggingOut}
                  className={cn("text-white/30 transition-colors hover:text-red-400", isLoggingOut && "cursor-not-allowed opacity-50")}
                  title={isAr ? "تسجيل الخروج" : "Sign out"}
                >
                  {isLoggingOut ? <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" /> : <LogOut size={16} />}
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
