
import { STAGE_CONFIGS } from "@/config/stages";
import { DASHBOARD_TASK_STATUS_META, PRIORITY_META } from "@/config/status-meta";
import { formatCurrencyEgp, formatTime } from "@/lib/formatters";
import { getConversionTerm, t } from "@/lib/locale";
import { listFollowUps } from "@/services/follow-ups.service";
import { listLeads } from "@/services/leads.service";
import { getPaymentsSummary, listPayments } from "@/services/payments.service";
import { getScheduleOverview, listScheduleSessions } from "@/services/schedule.service";
import { listStudents } from "@/services/students.service";
import type { DashboardActionItem, DashboardContext, DashboardFollowUpItem, DashboardOverview, DashboardOperationItem } from "@/types/crm";
import type { Locale } from "@/types/common.types";

function isManagementRole(role: DashboardContext["role"]): boolean {
  return role === "admin" || role === "owner";
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

function getToneBg(tone: DashboardOperationItem["tone"]): string {
  switch (tone) {
    case "success":
      return "#ECFDF5";
    case "warning":
      return "#FFFBEB";
    case "danger":
      return "#FEF2F2";
    case "info":
      return "#EFF6FF";
    default:
      return "#EEF2FF";
  }
}

export async function getDashboardOverview(
  context: DashboardContext,
  locale: Locale = "ar",
): Promise<DashboardOverview> {
  const [leads, students, followUps, payments, paymentsSummary, scheduleOverview, sessions] = await Promise.all([
    listLeads(),
    listStudents(),
    listFollowUps(),
    listPayments(),
    getPaymentsSummary(),
    getScheduleOverview(),
    listScheduleSessions(),
  ]);

  const isOps = isOpsRole(context.role);
  const activeStudents = students.filter((student) => student.status === "active").length;
  const recentLeads = leads.filter((lead) => {
    const createdAt = new Date(lead.createdAt).getTime();
    const threshold = Date.now() - 1000 * 60 * 60 * 24 * 7;
    return createdAt >= threshold;
  }).length;
  const monthlyRevenue = students.reduce((sum, student) => sum + student.totalPaid, 0);
  const atRiskStudents = students.filter((student) => student.status === "at_risk").length;
  const trialStudents = students.filter((student) => student.status === "trial").length;
  const bookedTrials = leads.filter((lead) => lead.stage === "trial_booked").length;
  const attendedTrials = leads.filter((lead) => lead.stage === "trial_attended").length;
  const overdueFollowUps = followUps.filter((item) => item.status === "overdue").length;
  const conversionRate = leads.length > 0 ? Math.round((leads.filter((lead) => lead.stage === "won").length / leads.length) * 100) : 0;
  const leadsMissingFollowUp = leads.filter((lead) => lead.stage !== "won" && lead.stage !== "lost" && !lead.nextFollowUpAt).length;
  const trialNoShows = leads.filter((lead) => lead.stage === "trial_booked" && !lead.lastContactAt).length;
  const overduePaymentsCount = payments.filter((payment) => payment.status === "overdue").length;
  const pendingPaymentsCount = payments.filter((payment) => payment.status === "pending").length;

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
    : isOps
      ? []
      : allTasks.filter((task) => matchesAssignee(task.assignee, context));

  const alerts = [
    !isOps && overdueFollowUps > 0
      ? {
          icon: "warning",
          text: t(locale, `${overdueFollowUps} متابعات متأخرة تحتاج تدخل الآن`, `${overdueFollowUps} overdue follow-ups need immediate action`),
          type: "danger" as const,
        }
      : null,
    overduePaymentsCount > 0
      ? {
          icon: "wallet",
          text: t(locale, `${overduePaymentsCount} دفعات متأخرة بقيمة ${formatCurrencyEgp(paymentsSummary.totalOverdue, locale)}`, `${overduePaymentsCount} overdue payments worth ${formatCurrencyEgp(paymentsSummary.totalOverdue, locale)}`),
          type: "warning" as const,
        }
      : null,
    atRiskStudents > 0
      ? {
          icon: "notification",
          text: t(locale, `${atRiskStudents} طلاب بحاجة متابعة`, `${atRiskStudents} students need attention`),
          type: "warning" as const,
        }
      : null,
    !isOps && recentLeads > 0
      ? {
          icon: "success",
          text: t(locale, `${recentLeads} عملاء جدد خلال آخر 7 أيام`, `${recentLeads} new leads over the last 7 days`),
          type: "success" as const,
        }
      : null,
  ].filter((item): item is NonNullable<typeof item> => Boolean(item));

  const salesFunnelBase = Math.max(1, leads.length);
  const opsFunnelBase = Math.max(1, students.length);
  const numberLocale = locale === "ar" ? "ar-EG" : "en-US";

  const operations: DashboardOperationItem[] = isOps
    ? [
        {
          title: t(locale, "جلسات هذا الأسبوع", "Sessions this week"),
          value: scheduleOverview.sessionsCount.toLocaleString(numberLocale),
          subtitle: t(locale, `${scheduleOverview.uniqueTeachers} مدرسين • ${scheduleOverview.totalStudents} مقعد`, `${scheduleOverview.uniqueTeachers} teachers • ${scheduleOverview.totalStudents} seats`),
          tone: "info",
        },
        {
          title: t(locale, "طلاب بحاجة متابعة", "Students at risk"),
          value: atRiskStudents.toLocaleString(numberLocale),
          subtitle: t(locale, "ملفات تحتاج تدخلًا تشغيليًا الآن", "Student files that need operational intervention"),
          tone: atRiskStudents > 0 ? "warning" : "success",
        },
        {
          title: t(locale, "الطلاب التجريبيون", "Trial students"),
          value: trialStudents.toLocaleString(numberLocale),
          subtitle: t(locale, "راجع الحضور والتحويل إلى اشتراك", "Review attendance and conversion to enrollment"),
          tone: trialStudents > 0 ? "brand" : "info",
        },
        {
          title: t(locale, "تحصيل الشهر", "Collection this month"),
          value: `${paymentsSummary.collectionRate}%`,
          subtitle: t(locale, `${formatCurrencyEgp(paymentsSummary.totalCollected, locale)} من ${formatCurrencyEgp(paymentsSummary.totalExpected, locale)}`, `${formatCurrencyEgp(paymentsSummary.totalCollected, locale)} out of ${formatCurrencyEgp(paymentsSummary.totalExpected, locale)}`),
          tone: paymentsSummary.collectionRate >= 80 ? "success" : paymentsSummary.collectionRate >= 60 ? "warning" : "danger",
        },
      ]
    : [
        {
          title: t(locale, "تحصيل الشهر", "Collection this month"),
          value: `${paymentsSummary.collectionRate}%`,
          subtitle: t(locale, `${formatCurrencyEgp(paymentsSummary.totalCollected, locale)} من ${formatCurrencyEgp(paymentsSummary.totalExpected, locale)}`, `${formatCurrencyEgp(paymentsSummary.totalCollected, locale)} out of ${formatCurrencyEgp(paymentsSummary.totalExpected, locale)}`),
          tone: paymentsSummary.collectionRate >= 80 ? "success" : paymentsSummary.collectionRate >= 60 ? "warning" : "danger",
        },
        {
          title: t(locale, "جلسات هذا الأسبوع", "Sessions this week"),
          value: scheduleOverview.sessionsCount.toLocaleString(numberLocale),
          subtitle: t(locale, `${scheduleOverview.uniqueTeachers} مدرسين • ${scheduleOverview.totalStudents} مقعد`, `${scheduleOverview.uniqueTeachers} teachers • ${scheduleOverview.totalStudents} seats`),
          tone: "info",
        },
        {
          title: t(locale, "عملاء بلا متابعة قادمة", "Leads without next follow-up"),
          value: leadsMissingFollowUp.toLocaleString(numberLocale),
          subtitle: t(locale, "احتكاك تشغيلي يجب تنظيفه", "Operational friction that needs cleanup"),
          tone: leadsMissingFollowUp > 0 ? "warning" : "success",
        },
        {
          title: t(locale, "الحصص التجريبية المحجوزة", "Booked trial sessions"),
          value: bookedTrials.toLocaleString(numberLocale),
          subtitle: t(locale, `${attendedTrials.toLocaleString(numberLocale)} حضروا بالفعل`, `${attendedTrials.toLocaleString(numberLocale)} already attended`),
          tone: bookedTrials > attendedTrials ? "brand" : "success",
        },
      ];

  const quickActions: DashboardActionItem[] = isManagementRole(context.role)
    ? [
        {
          title: t(locale, "لوحة العملاء", "Leads board"),
          description: t(locale, "راجع المراحل المتوقفة والعملاء الأقرب للاشتراك", "Review stalled stages and the leads closest to enrollment"),
          href: "/leads",
          tone: "brand",
        },
        {
          title: t(locale, "مركز العمليات", "Action center"),
          description: t(locale, "شاهد كل العناصر الحرجة والتنفيذية في مكان واحد", "See all critical and operational items in one place"),
          href: "/action-center",
          tone: "warning",
        },
        {
          title: t(locale, "التحصيل والمدفوعات", "Collections & payments"),
          description: t(locale, "أغلق المتأخرات وارفع معدل التحصيل", "Close overdue balances and improve collection rate"),
          href: "/payments",
          tone: "success",
        },
        {
          title: t(locale, "التقارير التنفيذية", "Executive reports"),
          description: t(locale, "راجع السرعة، القمع، والفرص الضائعة", "Review velocity, funnel, and missed opportunities"),
          href: "/reports",
          tone: "info",
        },
      ]
    : isOps
      ? [
          {
            title: t(locale, "مركز العمليات", "Action center"),
            description: t(locale, "افتح المهام التشغيلية العاجلة في شاشة واحدة", "Open urgent operational tasks in one screen"),
            href: "/action-center",
            tone: "warning",
          },
          {
            title: t(locale, "الطلاب", "Students"),
            description: t(locale, "راجع الطلاب المعرضين للخطر والحالات التجريبية", "Review at-risk and trial students"),
            href: "/students",
            tone: "brand",
          },
          {
            title: t(locale, "الجدول", "Schedule"),
            description: t(locale, "راجع جلسات اليوم والمدرسين المرتبطين", "Review today's sessions and linked teachers"),
            href: "/schedule",
            tone: "info",
          },
          {
            title: t(locale, "المدفوعات", "Payments"),
            description: t(locale, "تابع الحالات المتأخرة والمستحقة اليوم", "Follow overdue and due-today payments"),
            href: "/payments",
            tone: "success",
          },
        ]
      : [
          {
            title: t(locale, "العملاء المحتملون", "Leads"),
            description: t(locale, "حدّث المراحل وسجّل آخر تواصل", "Update stages and capture the latest contact"),
            href: "/leads",
            tone: "brand",
          },
          {
            title: t(locale, "المتابعات", "Follow-ups"),
            description: t(locale, "أغلق المهام المفتوحة قبل نهاية اليوم", "Close open tasks before the day ends"),
            href: "/follow-ups",
            tone: "warning",
          },
          {
            title: t(locale, "المدفوعات", "Payments"),
            description: t(locale, "راجع الحالات المعلقة والمتأخرة", "Review pending and overdue payments"),
            href: "/payments",
            tone: "success",
          },
        ];

  const recommendations = [
    !isOps && overdueFollowUps > 0 ? t(locale, "ابدأ من مركز العمليات لإغلاق المتابعات المتأخرة أولاً", "Start from the action center to close overdue follow-ups first") : null,
    overduePaymentsCount > 0 ? t(locale, "أرسل تذكيرات دفع مركزة للعائلات المتأخرة اليوم", "Send focused payment reminders to overdue families today") : null,
    !isOps && trialNoShows > 0 ? t(locale, "راجع الحصص التجريبية غير المؤكدة لتقليل الـ no-show", "Review unconfirmed trial sessions to reduce no-shows") : null,
    !isOps && leadsMissingFollowUp > 0 ? t(locale, "أضف مواعيد متابعة للعملاء المفتوحين حتى لا يتسربوا من القمع", "Add follow-up dates for open leads so they do not leak from the funnel") : null,
    isOps && atRiskStudents > 0 ? t(locale, "ابدأ بالطلاب المعرضين للخطر لأنهم أقرب خسارة تشغيلية الآن", "Start with at-risk students because they are the nearest operational risk right now") : null,
    isOps && scheduleOverview.sessionsCount > 0 ? t(locale, "راجع جدول اليوم وتأكد من اكتمال الربط بين المدرسين والطلاب", "Review today's schedule and confirm teacher-student assignment completeness") : null,
    sessions.length === 0 ? t(locale, "لا توجد جلسات مسجلة حالياً، راجع ربط الجداول بالبيانات", "No sessions are registered right now, review schedule data mapping") : null,
  ].filter((item): item is string => Boolean(item));

  return {
    managementStats: isOps
      ? [
          {
            label: t(locale, "طلاب نشطون", "Active students"),
            value: activeStudents.toLocaleString(numberLocale),
            change: trialStudents > 0 ? `+${trialStudents}` : "0",
            bg: "#4F46E5",
          },
          {
            label: t(locale, "جلسات الأسبوع", "Weekly sessions"),
            value: scheduleOverview.sessionsCount.toLocaleString(numberLocale),
            change: scheduleOverview.uniqueTeachers > 0 ? `+${scheduleOverview.uniqueTeachers}` : "0",
            bg: "#8B5CF6",
          },
          {
            label: t(locale, "إيراد الشهر", "Monthly revenue"),
            value: formatCurrencyEgp(monthlyRevenue, locale),
            change: monthlyRevenue > 0 ? t(locale, "+محسوب", "+Calculated") : "0",
            bg: "#10B981",
          },
          {
            label: t(locale, "طلاب بحاجة متابعة", "Students at risk"),
            value: atRiskStudents.toLocaleString(numberLocale),
            change: atRiskStudents > 0 ? t(locale, "+مهم", "+Important") : "0",
            bg: "#0D9488",
          },
        ]
      : [
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
    secondaryStats: isOps
      ? [
          { label: t(locale, "جلسات اليوم", "Today's sessions"), value: sessions.length.toLocaleString(numberLocale), icon: "calendar", bg: "#EFF6FF", color: "#2563EB" },
          { label: t(locale, "طلاب بحاجة متابعة", "Students at risk"), value: atRiskStudents.toLocaleString(numberLocale), icon: "warning", bg: "#FEF2F2", color: "#DC2626" },
          { label: t(locale, "طلاب تجريبيون", "Trial students"), value: trialStudents.toLocaleString(numberLocale), icon: "clock", bg: "#FFFBEB", color: "#D97706" },
          { label: t(locale, "مدفوعات معلقة", "Pending payments"), value: pendingPaymentsCount.toLocaleString(numberLocale), icon: "wallet", bg: "#F5F3FF", color: "#7C3AED" },
        ]
      : [
          { label: t(locale, "سيشن تجريبية", "Trial sessions"), value: bookedTrials.toLocaleString(numberLocale), icon: "calendar", bg: "#EFF6FF", color: "#2563EB" },
          { label: t(locale, "طلاب بحاجة متابعة", "Students at risk"), value: atRiskStudents.toLocaleString(numberLocale), icon: "warning", bg: "#FEF2F2", color: "#DC2626" },
          { label: t(locale, "متابعات متأخرة", "Overdue follow-ups"), value: overdueFollowUps.toLocaleString(numberLocale), icon: "clock", bg: "#FFFBEB", color: "#D97706" },
          { label: t(locale, "مدفوعات معلقة", "Pending payments"), value: pendingPaymentsCount.toLocaleString(numberLocale), icon: "wallet", bg: "#F5F3FF", color: "#7C3AED" },
        ],
    alerts,
    funnel: isOps
      ? [
          {
            label: t(locale, "نشط", "Active"),
            value: activeStudents,
            pct: `${Math.round((activeStudents / opsFunnelBase) * 100)}%`,
            color: "#4F46E5",
          },
          {
            label: t(locale, "تجريبي", "Trial"),
            value: trialStudents,
            pct: `${Math.round((trialStudents / opsFunnelBase) * 100)}%`,
            color: "#F59E0B",
          },
          {
            label: t(locale, "بحاجة متابعة", "At risk"),
            value: atRiskStudents,
            pct: `${Math.round((atRiskStudents / opsFunnelBase) * 100)}%`,
            color: "#EF4444",
          },
          {
            label: t(locale, "مكتمل", "Completed"),
            value: students.filter((student) => student.status === "completed").length,
            pct: `${Math.round((students.filter((student) => student.status === "completed").length / opsFunnelBase) * 100)}%`,
            color: "#10B981",
          },
        ]
      : (["new", "qualified", "trial_proposed", "trial_booked", "trial_attended", "won"] as const).map((stage) => {
          const count = leads.filter((lead) => lead.stage === stage).length;
          return {
            label: locale === "ar" ? STAGE_CONFIGS[stage].labelAr : STAGE_CONFIGS[stage].labelEn,
            value: count,
            pct: `${Math.round((count / salesFunnelBase) * 100)}%`,
            color: STAGE_CONFIGS[stage].color,
          };
        }),
    followUps: employeeTasks,
    operations,
    quickActions,
    recommendations,
  };
}

export function getDashboardTaskLabel(status: keyof typeof DASHBOARD_TASK_STATUS_META, locale: Locale): string {
  const meta = DASHBOARD_TASK_STATUS_META[status];
  return locale === "ar" ? meta.label : meta.labelEn;
}

export function getDashboardOperationToneStyles(tone: DashboardOperationItem["tone"]): { bg: string; color: string } {
  return {
    bg: getToneBg(tone),
    color:
      tone === "danger"
        ? "#DC2626"
        : tone === "warning"
          ? "#D97706"
          : tone === "success"
            ? "#059669"
            : tone === "info"
              ? "#2563EB"
              : "#4338CA",
  };
}
