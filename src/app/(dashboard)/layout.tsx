import { requireAuth } from "@/lib/auth";
import { DashboardShell } from "@/components/layout/dashboard-shell";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // سيعمل redirect لـ /login لو مفيش user
  await requireAuth();

  return <DashboardShell>{children}</DashboardShell>;
}