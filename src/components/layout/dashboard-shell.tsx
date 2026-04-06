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

  return (
    <div
      className="min-h-screen bg-background"
      dir={locale === "ar" ? "rtl" : "ltr"}
    >
      {/* Desktop Sidebar */}
      <Sidebar />

      {/* Mobile Navigation */}
      <MobileNav />

      {/* Main Content Area */}
      <main
        className={cn(
          "min-h-screen transition-all duration-300",
          sidebarOpen ? "lg:mr-[260px]" : "lg:mr-[72px]"
        )}
      >
        {/* Top Navbar */}
        <TopNavbar />

        {/* Page Content */}
        <div className="p-4 lg:p-6">{children}</div>
      </main>
    </div>
  );
}