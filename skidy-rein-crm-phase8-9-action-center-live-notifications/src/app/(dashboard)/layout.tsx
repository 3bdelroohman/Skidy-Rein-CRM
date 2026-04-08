import { requireAuth } from "@/lib/auth";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { UserProvider } from "@/providers/user-provider";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireAuth();

  return (
    <UserProvider user={user}>
      <DashboardShell>{children}</DashboardShell>
    </UserProvider>
  );
}