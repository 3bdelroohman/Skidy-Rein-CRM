"use client";

import { useUIStore } from "@/stores/ui-store";
import { cn } from "@/lib/utils";
import { Sidebar } from "./sidebar";
import { TopNavbar } from "./top-navbar";
import { MobileNav } from "./mobile-nav";

interface DashboardShellProps {
  children: React.ReactNode;
}

export function DashboardShell({ children }: DashboardShellProps) {
  const { sidebarOpen, locale } = useUIStore();
  const isAr = locale === "ar";

  return (
    <div className="min-h-screen bg-background" dir={isAr ? "rtl" : "ltr"}>
      <Sidebar />
      <MobileNav />

      <main
        className={cn(
          "min-h-screen transition-all duration-300",
          isAr
            ? sidebarOpen
              ? "lg:mr-[260px]"
              : "lg:mr-[72px]"
            : sidebarOpen
              ? "lg:ml-[260px]"
              : "lg:ml-[72px]",
        )}
      >
        <TopNavbar />
        <div className="p-4 lg:p-6">{children}</div>
      </main>
    </div>
  );
}
