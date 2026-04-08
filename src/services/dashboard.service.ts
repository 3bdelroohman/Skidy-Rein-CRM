import { STAGE_CONFIGS } from "@/config/stages";
import { DASHBOARD_TASK_STATUS_META, PRIORITY_META } from "@/config/status-meta";
import { formatCurrencyEgp, formatTime } from "@/lib/formatters";
import { getConversionTerm, t } from "@/lib/locale";
import { listFollowUps } from "@/services/follow-ups.service";
import { listLeads } from "@/services/leads.service";
import { listStudents } from "@/services/students.service";
import type { DashboardContext, DashboardFollowUpItem, DashboardOverview } from "@/types/crm";
import type { Locale } from "@/types/common.types";

function isManagementRole(role: DashboardContext["role"]): boolean {
  return role === "admin" || role === "owner";
}

function normalizeName(value: string): string {
  return value.trim().toLowerCase();
}

function matchesAssignee(nameAr: string, ctx: DashboardContext): boolean {
  const targets = [normalizeName(ctx.fullNameAr), normalizeName(ctx.fullName)];
  return targets.includes(normalizeName(nameAr));
}

export async function getDashboardOverview(
  context: DashboardContext,
  locale: Locale = "ar",
): Promise<DashboardOverview> {
  const [leads, students, followUps] = await Promise.all([listLeads(), listStudents(), listFollowUps()]);

  const activeStudents = students.filter((student) => student.status === "active").length;
  const recentLeads = leads.filter((lead) => {
    const createdAt = new Date(lead.createdAt).getTime();
    const threshold = Date.now() - 1000 * 60 * 60 * 24 * 7;
    return createdAt >= threshold;
  }).length;
  const monthlyRevenue = students.reduce((sum, student) => sum + student.totalPaid, 0);
  const atRiskStudents = students.filter((student) => student.status === "at_risk").length;
  const bookedTrials = leads.filter((lead) => lead.stage === "trial_booked").length;
  const overdueFollowUps = followUps.filter((item) => item.status === "overdue").length;
  const conversionRate = leads.length > 0 ? Math.round((leads.filter((lead) => lead.stage === "won").length / leads.length) * 100) : 0;

  const allTasks: DashboardFollowUpItem[] = followUps.map((item) => ({
    id: item.id,
    name: item.leadName,
    reason: item.title,
    assignee: item.assignedTo,
    dot: PRIORITY_META[item.priority].color,
    time: formatTime(item.scheduledAt, locale),
    status: item.status === "overdue" ? "urgent" : item.status === "completed" ? "completed" : "pending",
  }));

  const employeeTasks = isManagementRole(context.role)
    ? allTasks
    : allTasks.filter((task) => matchesAssignee(task.assignee, context));

  const alerts = [
    overdueFollowUps > 0
      ? {
          icon: "warning",
          text: t(locale, `${overdueFollowUps} متابعات متأخرة تحتاج تدخل الآن`, `${overdueFollowUps} overdue follow-ups need immediate action`),
          type: "danger" as const,
        }
      : null,
    atRiskStudents > 0
      ? {
          icon: "notification",
          text: t(locale, `${atRiskStudents} طلاب بحاجة متابعة`, `${atRiskStudents} students need attention`),
          type: "warning" as const,
        }
      : null,
    bookedTrials > 0
      ? {
          icon: "calendar",
          text: t(locale, `${bookedTrials} سيشن تجريبية محجوزة حالياً`, `${bookedTrials} trial sessions currently booked`),
          type: "info" as const,
        }
      : null,
    recentLeads > 0
      ? {
          icon: "success",
          text: t(locale, `${recentLeads} عملاء جدد خلال آخر 7 أيام`, `${recentLeads} new leads over the last 7 days`),
          type: "success" as const,
        }
      : null,
  ].filter((item): item is NonNullable<typeof item> => Boolean(item));

  const funnelBase = Math.max(1, leads.length);
  const funnel = ["new", "qualified", "trial_proposed", "trial_booked", "trial_attended", "won"] as const;

  const numberLocale = locale === "ar" ? "ar-EG" : "en-US";

  return {
    managementStats: [
      {
        label: t(locale, "طلاب نشطون", "Active students"),
        value: activeStudents.toLocaleString(numberLocale),
        change: recentLeads > 0 ? `+${recentLeads}` : "0",
        bg: "#4F46E5",
      },
      {
        label: t(locale, "عملاء جدد", "New leads"),
        value: recentLeads.toLocaleString(numberLocale),
        change: recentLeads > 0 ? t(locale, "+نشط", "+Active") : "0",
        bg: "#8B5CF6",
      },
      {
        label: t(locale, "إيراد الشهر", "Monthly revenue"),
        value: formatCurrencyEgp(monthlyRevenue, locale),
        change: monthlyRevenue > 0 ? t(locale, "+محسوب", "+Calculated") : "0",
        bg: "#10B981",
      },
      {
        label: getConversionTerm("conversionRate", locale),
        value: `${conversionRate}%`,
        change: conversionRate > 0 ? t(locale, "+محدث", "+Updated") : "0",
        bg: "#0D9488",
      },
    ],
    secondaryStats: [
      { label: t(locale, "سيشن تجريبية", "Trial sessions"), value: bookedTrials.toLocaleString(numberLocale), icon: "calendar", bg: "#EFF6FF", color: "#2563EB" },
      { label: t(locale, "طلاب بحاجة متابعة", "Students at risk"), value: atRiskStudents.toLocaleString(numberLocale), icon: "warning", bg: "#FEF2F2", color: "#DC2626" },
      { label: t(locale, "متابعات متأخرة", "Overdue follow-ups"), value: overdueFollowUps.toLocaleString(numberLocale), icon: "clock", bg: "#FFFBEB", color: "#D97706" },
      { label: t(locale, "مشتركون جدد", "New enrollments"), value: leads.filter((lead) => lead.stage === "won").length.toLocaleString(numberLocale), icon: "graduation", bg: "#F5F3FF", color: "#7C3AED" },
    ],
    alerts,
    funnel: funnel.map((stage) => {
      const count = leads.filter((lead) => lead.stage === stage).length;
      return {
        label: locale === "ar" ? STAGE_CONFIGS[stage].labelAr : STAGE_CONFIGS[stage].labelEn,
        value: count,
        pct: `${Math.round((count / funnelBase) * 100)}%`,
        color: STAGE_CONFIGS[stage].color,
      };
    }),
    followUps: employeeTasks.map((task) => ({
      ...task,
      reason: task.reason,
      name: task.name,
      assignee: task.assignee,
      status: task.status,
      dot: task.dot,
      time: task.time,
    })),
  };
}

export function getDashboardTaskLabel(status: keyof typeof DASHBOARD_TASK_STATUS_META, locale: Locale): string {
  const meta = DASHBOARD_TASK_STATUS_META[status];
  return locale === "ar" ? meta.label : meta.labelEn;
}
