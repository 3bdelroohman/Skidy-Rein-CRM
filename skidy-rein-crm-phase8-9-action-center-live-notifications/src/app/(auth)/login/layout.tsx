/**
 * Auth layout — centered, no sidebar
 * @author Abdelrahman
 */
export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div
      className="min-h-screen flex items-center justify-center bg-background p-4"
      dir="rtl"
    >
      {children}
    </div>
  );
}