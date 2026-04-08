"use client";

import { usePathname } from "next/navigation";
import { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";
import { useUIStore } from "@/stores/ui-store";
import { useCurrentUser } from "@/providers/user-provider";
import { signOutClient } from "@/lib/actions/auth.actions";
import { navigationGroups } from "@/config/navigation";
import { ROLE_PERMISSIONS } from "@/config/roles";

const sidebarVariants = {
  expanded: { width: 260 },
  collapsed: { width: 72 },
};

const textVariants = {
  show: { opacity: 1, x: 0, display: "block" },
  hide: { opacity: 0, x: -10, transitionEnd: { display: "none" } },
};

export function Sidebar() {
  const pathname = usePathname();
  const { sidebarOpen, toggleSidebar, locale } = useUIStore();
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

  const handleLogout = async () => {
    setIsLoggingOut(true);
    await signOutClient();
  };

  return (
    <motion.aside
      variants={sidebarVariants}
      animate={sidebarOpen ? "expanded" : "collapsed"}
      transition={{ duration: 0.3, ease: "easeInOut" }}
      className={cn(
        "hidden lg:flex fixed top-0 h-screen z-40 flex-col bg-brand-950",
        isAr ? "right-0 border-l border-white/10" : "left-0 border-r border-white/10",
      )}
    >
      <div className="flex h-16 items-center gap-3 border-b border-white/10 px-4">
        <div className="h-9 w-9 shrink-0 rounded-xl flex items-center justify-center" style={{ background: "#4338CA" }}>
          <span className="text-sm font-bold text-white">SR</span>
        </div>

        <AnimatePresence>
          {sidebarOpen && (
            <motion.div variants={textVariants} initial="hide" animate="show" exit="hide" transition={{ duration: 0.2 }}>
              <p className="text-sm font-bold leading-tight text-white">Skidy Rein</p>
              <p className="text-[10px] text-white/50">{isAr ? "لوحة التحكم" : "Dashboard"}</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <nav className="flex-1 overflow-y-auto px-2 py-4 space-y-6">
        {filteredGroups.map((group) => (
          <div key={group.labelEn}>
            <AnimatePresence>
              {sidebarOpen && (
                <motion.p
                  variants={textVariants}
                  initial="hide"
                  animate="show"
                  exit="hide"
                  className={cn(
                    "mb-2 px-3 text-[10px] font-semibold uppercase tracking-wider text-white/40",
                    !isAr && "text-left",
                  )}
                >
                  {isAr ? group.labelAr : group.labelEn}
                </motion.p>
              )}
            </AnimatePresence>

            <div className="space-y-1">
              {group.items.map((item) => {
                const active = isActive(item.href);
                const Icon = item.icon;

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "group relative flex items-center gap-3 rounded-xl text-sm transition-all duration-200",
                      sidebarOpen ? "px-3 py-2.5" : "justify-center px-0 py-2.5",
                      active
                        ? "bg-brand-700 text-white shadow-lg shadow-brand-700/30"
                        : "text-white/60 hover:bg-white/8 hover:text-white",
                    )}
                  >
                    <Icon className={cn("shrink-0 transition-colors", active ? "text-cream-200" : "text-white/50 group-hover:text-white")} size={20} />

                    <AnimatePresence>
                      {sidebarOpen && (
                        <motion.span variants={textVariants} initial="hide" animate="show" exit="hide" transition={{ duration: 0.15 }}>
                          {isAr ? item.titleAr : item.titleEn}
                        </motion.span>
                      )}
                    </AnimatePresence>

                    {item.badge && item.badge > 0 && (
                      <span
                        className={cn(
                          "bg-danger-500 text-white text-[10px] font-bold rounded-full",
                          sidebarOpen
                            ? isAr
                              ? "mr-auto px-1.5 py-0.5"
                              : "ml-auto px-1.5 py-0.5"
                            : "absolute -top-1 -left-1 flex h-4 w-4 items-center justify-center",
                        )}
                      >
                        {item.badge}
                      </span>
                    )}

                    {!sidebarOpen && (
                      <div
                        className={cn(
                          "pointer-events-none absolute px-2 py-1 text-xs whitespace-nowrap rounded-lg bg-gray-900 text-white opacity-0 transition-opacity duration-200 group-hover:opacity-100",
                          isAr ? "right-full mr-2" : "left-full ml-2",
                        )}
                      >
                        {isAr ? item.titleAr : item.titleEn}
                      </div>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      <div className="space-y-2 border-t border-white/10 p-2">
        <button
          onClick={toggleSidebar}
          className={cn(
            "flex w-full items-center gap-2 rounded-xl py-2 text-white/40 transition-colors hover:bg-white/8 hover:text-white",
            sidebarOpen ? "px-3" : "justify-center",
          )}
        >
          {isAr ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
          {sidebarOpen && (
            <motion.span variants={textVariants} initial="hide" animate="show" exit="hide" className="text-xs">
              {isAr ? "طي القائمة" : "Collapse"}
            </motion.span>
          )}
        </button>

        <div className={cn("flex items-center gap-3 rounded-xl bg-white/5 p-2", !sidebarOpen && "justify-center") }>
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl" style={{ background: "#4338CA" }}>
            <span className="text-xs font-bold text-white">{initial}</span>
          </div>

          <AnimatePresence>
            {sidebarOpen && (
              <motion.div variants={textVariants} initial="hide" animate="show" exit="hide" className="min-w-0 flex-1">
                <p className="truncate text-xs font-semibold text-white">{displayName}</p>
                <p className="text-[10px] text-white/40">{roleLabel}</p>
              </motion.div>
            )}
          </AnimatePresence>

          {sidebarOpen && (
            <button
              onClick={handleLogout}
              disabled={isLoggingOut}
              className={cn("text-white/30 transition-colors hover:text-red-400", isLoggingOut && "cursor-not-allowed opacity-50")}
              title={isAr ? "تسجيل الخروج" : "Sign out"}
            >
              {isLoggingOut ? <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" /> : <LogOut size={16} />}
            </button>
          )}
        </div>
      </div>
    </motion.aside>
  );
}
