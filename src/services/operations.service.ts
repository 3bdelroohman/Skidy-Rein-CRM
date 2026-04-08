
import { formatCurrencyEgp, formatDate } from "@/lib/formatters";
import { getDayLabel, t } from "@/lib/locale";
import { listFollowUps } from "@/services/follow-ups.service";
import { listLeads } from "@/services/leads.service";
import { getPaymentsSummary, listPayments } from "@/services/payments.service";
import { getScheduleOverview, listScheduleSessions } from "@/services/schedule.service";
import { listStudents } from "@/services/students.service";
import type {
  ActionCenterData,
  ActionCenterItem,
  ActionCenterMetric,
  AppNotificationItem,
  DashboardContext,
} from "@/types/crm";
import type { Locale } from "@/types/common.types";

function isManagementRole(role: DashboardContext["role"]): boolean {
  return role === "admin" || role === "owner";
}

function isSalesRole(role: DashboardContext["role"]): boolean {
  return role === "sales";
}

function isOpsRole(role: DashboardContext["role"]): boolean {
  return role === "ops";
}

function normalizeName(value: string): string {
  return value.trim().toLowerCase();
}

function matchesAssignee(nameAr: string, ctx: DashboardContext): boolean {
  const targets = [normalizeName(ctx.fullNameAr), normalizeName(ctx.fullName)];
  return targets.includes(normalizeName(nameAr));
}

function getNumberLocale(locale: Locale): string {
  return locale === "ar" ? "ar-EG" : "en-US";
}

export function getActionToneStyles(priority: ActionCenterItem["priority"]): { bg: string; color: string; border: string } {
  switch (priority) {
    case "critical":
      return { bg: "#FEF2F2", color: "#DC2626", border: "#FCA5A5" };
    case "high":
      return { bg: "#FFFBEB", color: "#D97706", border: "#FCD34D" };
    case "medium":
      return { bg: "#EEF2FF", color: "#4338CA", border: "#C7D2FE" };
    default:
      return { bg: "#EFF6FF", color: "#2563EB", border: "#BFDBFE" };
  }
}

export async function getActionCenterData(
  context: DashboardContext,
  locale: Locale = "ar",
): Promise<ActionCenterData> {
  const [leads, followUps, students, payments, paymentsSummary, sessions, scheduleOverview] = await Promise.all([
    listLeads(),
    listFollowUps(),
    listStudents(),
    listPayments(),
    getPaymentsSummary(),
    listScheduleSessions(),
    getScheduleOverview(),
  ]);

  const todayIso = new Date().toISOString().slice(0, 10);
  const todayDay = new Date().getDay();
  const numberLocale = getNumberLocale(locale);

  const scopedFollowUps = isManagementRole(context.role)
    ? followUps
    : followUps.filter((item) => matchesAssignee(item.assignedTo, context));

  const overdueFollowUps = scopedFollowUps.filter((item) => item.status === "overdue");
  const dueTodayFollowUps = scopedFollowUps.filter((item) => {
    if (item.status === "completed") return false;
    return item.scheduledAt.slice(0, 10) === todayIso;
  });

  const scopedLeads = isManagementRole(context.role)
    ? leads
    : isSalesRole(context.role)
      ? leads.filter((lead) => matchesAssignee(lead.assignedToName, context))
      : [];

  const leadsWithoutFollowUp = scopedLeads.filter(
    (lead) => lead.stage !== "won" && lead.stage !== "lost" && !lead.nextFollowUpAt,
  );
  const trialBookedStale = scopedLeads.filter((lead) => lead.stage === "trial_booked" && !lead.nextFollowUpAt);

  const overduePayments = payments.filter((payment) => payment.status === "overdue");
  const dueTodayPayments = payments.filter(
    (payment) => payment.status === "pending" && payment.dueDate.slice(0, 10) === todayIso,
  );

  const atRiskStudents = students.filter((student) => student.status === "at_risk");
  const dueTodayTrials = students.filter((student) => student.status === "trial");
  const todaySessions = sessions.filter((session) => session.day === todayDay);

  const critical: ActionCenterItem[] = [];
  const mediumPriority: ActionCenterItem[] = [];
  const informational: ActionCenterItem[] = [];

  if (!isOpsRole(context.role)) {
    critical.push(
      ...overdueFollowUps.map((item) => ({
        id: `follow-up-overdue-${item.id}`,
        title: t(locale, `متابعة متأخرة: ${item.leadName}`, `Overdue follow-up: ${item.leadName}`),
        description: t(locale, item.title, item.title),
        href: item.leadId ? `/leads/${item.leadId}` : "/follow-ups",
        category: "follow_up" as const,
        priority: "critical" as const,
        owner: item.assignedTo,
        meta: formatDate(item.scheduledAt, locale),
      })),
    );

    mediumPriority.push(
      ...dueTodayFollowUps.map((item) => ({
        id: `follow-up-today-${item.id}`,
        title: t(locale, `متابعة اليوم: ${item.leadName}`, `Today follow-up: ${item.leadName}`),
        description: t(locale, item.title, item.title),
        href: item.leadId ? `/leads/${item.leadId}` : "/follow-ups",
        category: "follow_up" as const,
        priority: "high" as const,
        owner: item.assignedTo,
        meta: formatDate(item.scheduledAt, locale),
      })),
      ...leadsWithoutFollowUp.map((lead) => ({
        id: `lead-missing-next-${lead.id}`,
        title: t(locale, `عميل بلا متابعة قادمة: ${lead.childName}`, `Lead without next follow-up: ${lead.childName}`),
        description: t(locale, `${lead.parentName} • ${lead.parentPhone}`, `${lead.parentName} • ${lead.parentPhone}`),
        href: `/leads/${lead.id}`,
        category: "lead" as const,
        priority: "high" as const,
        owner: lead.assignedToName,
        meta: t(locale, "غير محدد", "Not scheduled"),
      })),
      ...trialBookedStale.map((lead) => ({
        id: `trial-stale-${lead.id}`,
        title: t(locale, `سيشن تجريبية تحتاج تأكيد: ${lead.childName}`, `Trial session needs confirmation: ${lead.childName}`),
        description: t(locale, `${lead.parentName} • ${lead.assignedToName}`, `${lead.parentName} • ${lead.assignedToName}`),
        href: `/leads/${lead.id}`,
        category: "lead" as const,
        priority: "medium" as const,
        owner: lead.assignedToName,
      })),
    );
  }

  critical.push(
    ...overduePayments.map((payment) => ({
      id: `payment-overdue-${payment.id}`,
      title: t(locale, `دفعة متأخرة: ${payment.parentName}`, `Overdue payment: ${payment.parentName}`),
      description: t(locale, `${payment.studentName} • ${formatCurrencyEgp(payment.amount, locale)}`, `${payment.studentName} • ${formatCurrencyEgp(payment.amount, locale)}`),
      href: `/payments/${payment.id}`,
      category: "payment" as const,
      priority: "critical" as const,
      meta: formatDate(payment.dueDate, locale),
    })),
    ...atRiskStudents.map((student) => ({
      id: `student-risk-${student.id}`,
      title: t(locale, `طالب بحاجة متابعة: ${student.fullName}`, `Student at risk: ${student.fullName}`),
      description: t(locale, `${student.parentName} • ${student.className ?? "بدون مجموعة"}`, `${student.parentName} • ${student.className ?? "No group"}`),
      href: `/students/${student.id}`,
      category: "student" as const,
      priority: "high" as const,
      meta: student.currentCourse ?? undefined,
    })),
  );

  mediumPriority.push(
    ...dueTodayPayments.map((payment) => ({
      id: `payment-today-${payment.id}`,
      title: t(locale, `استحقاق اليوم: ${payment.parentName}`, `Due today: ${payment.parentName}`),
      description: t(locale, `${payment.studentName} • ${formatCurrencyEgp(payment.amount, locale)}`, `${payment.studentName} • ${formatCurrencyEgp(payment.amount, locale)}`),
      href: `/payments/${payment.id}`,
      category: "payment" as const,
      priority: "medium" as const,
      meta: formatDate(payment.dueDate, locale),
    })),
    ...dueTodayTrials.map((student) => ({
      id: `trial-student-${student.id}`,
      title: t(locale, `طالب تجريبي يحتاج متابعة: ${student.fullName}`, `Trial student needs follow-up: ${student.fullName}`),
      description: t(locale, `${student.parentName} • ${student.currentCourse ?? "بدون كورس"}`, `${student.parentName} • ${student.currentCourse ?? "No course"}`),
      href: `/students/${student.id}`,
      category: "student" as const,
      priority: "medium" as const,
    })),
  );

  informational.push(
    ...todaySessions.map((session) => ({
      id: `session-${session.id}`,
      title: t(locale, `جلسة اليوم: ${session.className}`, `Today's session: ${session.className}`),
      description: t(locale, `${session.teacher} • ${session.startTime} - ${session.endTime}`, `${session.teacher} • ${session.startTime} - ${session.endTime}`),
      href: `/schedule/${session.id}`,
      category: "schedule" as const,
      priority: "info" as const,
      meta: getDayLabel(session.day, locale),
    })),
  );

  const metrics: ActionCenterMetric[] = isOpsRole(context.role)
    ? [
        {
          label: t(locale, "طلاب بحاجة متابعة", "Students at risk"),
          value: atRiskStudents.length.toLocaleString(numberLocale),
          tone: atRiskStudents.length > 0 ? "warning" : "success",
        },
        {
          label: t(locale, "مدفوعات متأخرة", "Overdue payments"),
          value: overduePayments.length.toLocaleString(numberLocale),
          tone: overduePayments.length > 0 ? "danger" : "success",
        },
        {
          label: t(locale, "جلسات اليوم", "Today's sessions"),
          value: todaySessions.length.toLocaleString(numberLocale),
          tone: "info",
        },
        {
          label: t(locale, "حمولة الأسبوع", "Weekly load"),
          value: scheduleOverview.sessionsCount.toLocaleString(numberLocale),
          tone: "brand",
        },
      ]
    : [
        {
          label: t(locale, "إجراءات حرجة", "Critical actions"),
          value: critical.length.toLocaleString(numberLocale),
          tone: critical.length > 0 ? "danger" : "success",
        },
        {
          label: t(locale, "تحصيل الشهر", "Collection rate"),
          value: `${paymentsSummary.collectionRate}%`,
          tone: paymentsSummary.collectionRate >= 80 ? "success" : paymentsSummary.collectionRate >= 60 ? "warning" : "danger",
        },
        {
          label: t(locale, "جلسات اليوم", "Today's sessions"),
          value: todaySessions.length.toLocaleString(numberLocale),
          tone: "info",
        },
        {
          label: t(locale, "العملاء المفتوحون بلا متابعة", "Open leads without follow-up"),
          value: leadsWithoutFollowUp.length.toLocaleString(numberLocale),
          tone: leadsWithoutFollowUp.length > 0 ? "warning" : "success",
        },
      ];

  const notifications: AppNotificationItem[] = [...critical, ...mediumPriority]
    .slice(0, 6)
    .map((item, index) => ({
      id: item.id,
      title: item.title,
      timeLabel: item.meta ?? t(locale, "الآن", "Now"),
      href: item.href,
      type: item.priority === "critical" ? "warning" : item.priority === "high" ? "warning" : item.priority === "medium" ? "info" : "success",
      readDefault: index > 1,
    }));

  if (notifications.length === 0) {
    notifications.push({
      id: "healthy-system",
      title: t(locale, "لا توجد تنبيهات حرجة الآن", "No urgent alerts right now"),
      timeLabel: t(locale, "الآن", "Now"),
      href: "/action-center",
      type: "success",
      readDefault: false,
    });
  }

  return {
    metrics,
    critical: critical.slice(0, 12),
    mediumPriority: mediumPriority.slice(0, 16),
    informational: informational.slice(0, 8),
    notifications,
  };
}
