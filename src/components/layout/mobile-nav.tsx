"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useUIStore } from "@/stores/ui-store";
import { navigationGroups, type UserRole } from "@/config/navigation";

const CURRENT_USER_ROLE: UserRole = "admin";

export function MobileNav() {
  const pathname = usePathname();
  const { mobileSidebarOpen, setMobileSidebarOpen, locale } = useUIStore();
  const isAr = locale === "ar";

  const filteredGroups = navigationGroups
    .map((group) => ({
      ...group,
      items: group.items.filter((item) =>
        item.roles.includes(CURRENT_USER_ROLE)
      ),
    }))
    .filter((group) => group.items.length > 0);

  const isActive = (href: string): boolean => {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  };

  const handleClose = () => setMobileSidebarOpen(false);

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
                              active
                                ? "text-cream-200"
                                : "text-white/50"
                            )}
                          />
                          <span>
                            {isAr ? item.titleAr : item.titleEn}
                          </span>

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
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}