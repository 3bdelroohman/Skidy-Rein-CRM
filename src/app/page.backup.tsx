export default function RootPage() {
  return (
    <div
      dir="rtl"
      className="min-h-screen flex items-center justify-center bg-background"
    >
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold text-foreground">
          Skidy Rein CRM
        </h1>
        <p className="text-muted-foreground text-lg">
          مرحباً — النظام يعمل بنجاح
        </p>
        <a
          href="/dashboard"
          className="inline-block px-6 py-3 rounded-xl text-white font-semibold"
          style={{ background: "#4338CA" }}
        >
          دخول لوحة التحكم
        </a>
      </div>
    </div>
  );
}