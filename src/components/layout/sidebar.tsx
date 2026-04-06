"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { useTransition } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, LogOut, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useUIStore } from "@/stores/ui-store";
import { useCurrentUser } from "@/providers/user-provider";
import { signOutAction } from "@/lib/actions/auth.actions";
import { navigationGroups } from "@/config/navigation";
import { ROLE_PERMISSIONS } from "@/config/roles";

// ── Animation variants ──
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

  // ── Real user from context ──
  const user = useCurrentUser();
  const [isLoggingOut, startTransition] = useTransition();

  // ── Derived user display ──
  const displayName = isAr ? user.fullNameAr : user.fullName;
  const initial = user.fullName.charAt(0).toUpperCase();
  const roleLabel = isAr
    ? ROLE_PERMISSIONS[user.role].labelAr
    : ROLE_PERMISSIONS[user.role].labelEn;

  // ── Filter nav items by role ──
  const filteredGroups = navigationGroups
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => item.roles.includes(user.role)),
    }))
    .filter((group) => group.items.length > 0);

  // ── Check active state ──
  const isActive = (href: string): boolean => {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  };

  // ── Logout handler ──
  const handleLogout = () => {
    startTransition(() => {
      signOutAction();
    });
  };

  return (
    <motion.aside
      variants={sidebarVariants}
      animate={sidebarOpen ? "expanded" : "collapsed"}
      transition={{ duration: 0.3, ease: "easeInOut" }}
      className={cn(
        "hidden lg:flex flex-col fixed top-0 right-0 h-screen z-40",
        "border-l border-white/10 bg-brand-950"
      )}
    >
      {/* ═══ Logo Area ═══ */}
      <div className="h-16 flex items-center gap-3 px-4 border-b border-white/10">
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
          style={{ background: "#4338CA" }}
        >
          <span className="text-white font-bold text-sm">SR</span>
        </div>

        <AnimatePresence>
          {sidebarOpen && (
            <motion.div
              variants={textVariants}
              initial="hide"
              animate="show"
              exit="hide"
              transition={{ duration: 0.2 }}
            >
              <p className="text-white font-bold text-sm leading-tight">
                Skidy Rein
              </p>
              <p className="text-white/50 text-[10px]">
                {isAr ? "لوحة التحكم" : "Dashboard"}
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ═══ Navigation ═══ */}
      <nav className="flex-1 overflow-y-auto py-4 px-2 space-y-6">
        {filteredGroups.map((group) => (
          <div key={group.labelEn}>
            {/* Group Label */}
            <AnimatePresence>
              {sidebarOpen && (
                <motion.p
                  variants={textVariants}
                  initial="hide"
                  animate="show"
                  exit="hide"
                  className="text-white/40 text-[10px] font-semibold uppercase tracking-wider px-3 mb-2"
                >
                  {isAr ? group.labelAr : group.labelEn}
                </motion.p>
              )}
            </AnimatePresence>

            {/* Nav Items */}
            <div className="space-y-1">
              {group.items.map((item) => {
                const active = isActive(item.href);
                const Icon = item.icon;

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "flex items-center gap-3 rounded-xl transition-all duration-200",
                      "text-sm group relative",
                      sidebarOpen
                        ? "px-3 py-2.5"
                        : "justify-center py-2.5 px-0",
                      active
                        ? "bg-brand-700 text-white shadow-lg shadow-brand-700/30"
                        : "text-white/60 hover:bg-white/8 hover:text-white"
                    )}
                  >
                    <Icon
                      className={cn(
                        "shrink-0 transition-colors",
                        active
                          ? "text-cream-200"
                          : "text-white/50 group-hover:text-white"
                      )}
                      size={20}
                    />

                    <AnimatePresence>
                      {sidebarOpen && (
                        <motion.span
                          variants={textVariants}
                          initial="hide"
                          animate="show"
                          exit="hide"
                          transition={{ duration: 0.15 }}
                        >
                          {isAr ? item.titleAr : item.titleEn}
                        </motion.span>
                      )}
                    </AnimatePresence>

                    {/* Badge */}
                    {item.badge && item.badge > 0 && (
                      <span
                        className={cn(
                          "bg-danger-500 text-white text-[10px] font-bold rounded-full",
                          sidebarOpen
                            ? "mr-auto px-1.5 py-0.5"
                            : "absolute -top-1 -left-1 w-4 h-4 flex items-center justify-center"
                        )}
                      >
                        {item.badge}
                      </span>
                    )}

                    {/* Tooltip عند Collapse */}
                    {!sidebarOpen && (
                      <div
                        className={cn(
                          "absolute right-full mr-2 px-2 py-1 rounded-lg text-xs",
                          "bg-gray-900 text-white whitespace-nowrap",
                          "opacity-0 group-hover:opacity-100 pointer-events-none",
                          "transition-opacity duration-200"
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

      {/* ═══ Bottom Section ═══ */}
      <div className="border-t border-white/10 p-2 space-y-2">
        {/* Collapse Toggle */}
        <button
          onClick={toggleSidebar}
          className={cn(
            "w-full flex items-center gap-2 rounded-xl py-2 transition-colors",
            "text-white/40 hover:text-white hover:bg-white/8",
            sidebarOpen ? "px-3" : "justify-center"
          )}
        >
          {sidebarOpen ? (
            <>
              <ChevronRight size={18} />
              <motion.span
                variants={textVariants}
                initial="hide"
                animate="show"
                exit="hide"
                className="text-xs"
              >
                {isAr ? "طي القائمة" : "Collapse"}
              </motion.span>
            </>
          ) : (
            <ChevronLeft size={18} />
          )}
        </button>

        {/* User Info */}
        <div
          className={cn(
            "flex items-center gap-3 rounded-xl p-2",
            "bg-white/5"
          )}
        >
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
            style={{ background: "#4338CA" }}
          >
            <span className="text-white text-xs font-bold">{initial}</span>
          </div>

          <AnimatePresence>
            {sidebarOpen && (
              <motion.div
                variants={textVariants}
                initial="hide"
                animate="show"
                exit="hide"
                className="flex-1 min-w-0"
              >
                <p className="text-white text-xs font-semibold truncate">
                  {displayName}
                </p>
                <p className="text-white/40 text-[10px]">{roleLabel}</p>
              </motion.div>
            )}
          </AnimatePresence>

          {sidebarOpen && (
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
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <LogOut size={16} />
              )}
            </button>
          )}
        </div>
      </div>
    </motion.aside>
  );
}