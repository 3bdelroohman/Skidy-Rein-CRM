import { DashboardShell } from "@/components/layout/dashboard-shell";

/**
 * Dashboard Layout
 * Wraps all dashboard pages with sidebar + navbar
 * @author Abdelrahman
 */
export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <DashboardShell>{children}</DashboardShell>;
}