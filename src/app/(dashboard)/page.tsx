export default function DashboardPage() {
  const stats = [
    { label: "طلاب نشطين", value: "100", change: "+5%", bg: "#4F46E5" },
    { label: "عملاء جدد", value: "12", change: "+20%", bg: "#8B5CF6" },
    { label: "إيراد الشهر", value: "٤٥,٠٠٠ ج.م", change: "+10%", bg: "#10B981" },
    { label: "نسبة التحصيل", value: "92%", change: "+3%", bg: "#0D9488" },
  ];

  const secondaryStats = [
    { label: "حصص تجريبية", value: "3", icon: "📅", bg: "#EFF6FF", color: "#2563EB" },
    { label: "طلاب معرّضين", value: "4", icon: "⚠️", bg: "#FEF2F2", color: "#DC2626" },
    { label: "متأخرات دفع", value: "2", icon: "⏰", bg: "#FFFBEB", color: "#D97706" },
    { label: "كلاسات ممتلئة", value: "2", icon: "📚", bg: "#F5F3FF", color: "#7C3AED" },
  ];

  const alerts = [
    { icon: "⚠️", text: "3 عملاء جدد ما اتردّ عليهم (أكتر من ساعتين)", type: "danger" },
    { icon: "⚠️", text: "سارة محمد — غابت 3 حصص متتالية", type: "danger" },
    { icon: "⚠️", text: "2 مدفوعات متأخرة أكتر من أسبوع", type: "warning" },
    { icon: "📌", text: "كلاس Python أ — ممتلئ + 2 في الانتظار", type: "info" },
    { icon: "✅", text: "5 متابعات مجدولة لليوم", type: "success" },
  ];

  const getAlertBg = (type: string) => {
    switch (type) {
      case "danger": return { background: "#FEF2F2", borderColor: "#FECACA", color: "#991B1B" };
      case "warning": return { background: "#FFFBEB", borderColor: "#FDE68A", color: "#92400E" };
      case "info": return { background: "#EEF2FF", borderColor: "#C7D2FE", color: "#3730A3" };
      case "success": return { background: "#ECFDF5", borderColor: "#A7F3D0", color: "#065F46" };
      default: return {};
    }
  };

  const funnel = [
    { label: "عملاء جدد", value: 20, pct: "100%", color: "#6366F1" },
    { label: "تم التواصل", value: 16, pct: "80%", color: "#3B82F6" },
    { label: "مؤهلين", value: 12, pct: "60%", color: "#8B5CF6" },
    { label: "تم العرض", value: 10, pct: "50%", color: "#A855F7" },
    { label: "حصة تجريبية", value: 8, pct: "40%", color: "#06B6D4" },
    { label: "تم الدفع", value: 4, pct: "20%", color: "#10B981" },
  ];

  const followUps = [
    { name: "محمد أحمد", reason: "متابعة بعد التجربة", assignee: "الاء", dot: "#6366F1" },
    { name: "سارة خالد", reason: "متابعة اعتراض سعر", assignee: "سمر", dot: "#6366F1" },
    { name: "أم يوسف", reason: "غياب 3 حصص — تواصل فوري", assignee: "هاجر", dot: "#10B981" },
    { name: "خالد محمود", reason: "تذكير دفع — متأخر 10 أيام", assignee: "الاء", dot: "#F59E0B" },
  ];

  return (
    <div className="space-y-6">
      {/* Welcome */}
      <div>
        <h2 className="text-2xl font-bold text-foreground">مرحباً، Abdelrahman 👋</h2>
        <p className="text-muted-foreground mt-1">هنا ملخص ما يحدث في الأكاديمية اليوم</p>
      </div>

      {/* Primary Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="relative overflow-hidden rounded-2xl p-5 text-white"
            style={{ background: `linear-gradient(135deg, ${stat.bg}, ${stat.bg}dd)` }}
          >
            <div className="relative z-10">
              <p className="text-sm font-medium text-white/80">{stat.label}</p>
              <p className="text-3xl font-bold mt-1">{stat.value}</p>
              <div className="mt-2 flex items-center gap-2">
                <span className="text-xs px-2 py-0.5 rounded-lg" style={{ background: "rgba(255,255,255,0.2)" }}>
                  {stat.change}
                </span>
                <span className="text-xs text-white/50">عن الشهر الماضي</span>
              </div>
            </div>
            <div className="absolute -bottom-4 -left-4 w-24 h-24 rounded-full" style={{ background: "rgba(255,255,255,0.05)" }} />
            <div className="absolute -top-8 -right-8 w-32 h-32 rounded-full" style={{ background: "rgba(255,255,255,0.05)" }} />
          </div>
        ))}
      </div>

      {/* Secondary Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {secondaryStats.map((stat) => (
          <div key={stat.label} className="flex items-center gap-3 p-4 rounded-2xl border border-border bg-card">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center text-lg" style={{ background: stat.bg }}>
              {stat.icon}
            </div>
            <div>
              <p className="text-2xl font-bold" style={{ color: stat.color }}>{stat.value}</p>
              <p className="text-xs text-muted-foreground">{stat.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Alerts */}
      <div className="rounded-2xl border border-border bg-card p-5">
        <h3 className="text-base font-bold mb-3 flex items-center gap-2">
          <span>🔔</span> تنبيهات عاجلة
        </h3>
        <div className="space-y-2">
          {alerts.map((alert, i) => (
            <div
              key={i}
              className="flex items-center gap-3 p-3 rounded-xl border text-sm font-medium"
              style={getAlertBg(alert.type)}
            >
              <span>{alert.icon}</span>
              <span>{alert.text}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Funnel + Follow-ups */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Funnel */}
        <div className="rounded-2xl border border-border bg-card p-5">
          <h3 className="text-base font-bold mb-4 flex items-center gap-2">
            <span>📊</span> قمع المبيعات — هذا الشهر
          </h3>
          <div className="space-y-3">
            {funnel.map((item) => (
              <div key={item.label} className="space-y-1.5">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">{item.label}</span>
                  <div className="flex items-center gap-2">
                    <span className="font-bold">{item.value}</span>
                    <span className="text-xs text-muted-foreground">
                      {Math.round((item.value / 20) * 100)}%
                    </span>
                  </div>
                </div>
                <div className="h-2.5 rounded-full overflow-hidden" style={{ background: "#F1F5F9" }}>
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{ width: item.pct, background: item.color }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Follow-ups */}
        <div className="rounded-2xl border border-border bg-card p-5">
          <h3 className="text-base font-bold mb-4 flex items-center gap-2">
            <span>📋</span> متابعات اليوم
          </h3>
          <div className="space-y-2">
            {followUps.map((item, i) => (
              <div
                key={i}
                className="flex items-center gap-3 p-3 rounded-xl border border-border hover:bg-muted/50 transition-colors cursor-pointer"
              >
                <div className="w-2 h-2 rounded-full shrink-0" style={{ background: item.dot }} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate">{item.name}</p>
                  <p className="text-xs text-muted-foreground truncate">{item.reason}</p>
                </div>
                <span className="text-xs px-2 py-1 rounded-lg bg-muted text-muted-foreground shrink-0">
                  {item.assignee}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}