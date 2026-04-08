import { PIPELINE_STAGES, STAGE_CONFIGS } from "@/config/stages";
import { formatCurrencyEgp } from "@/lib/formatters";
import { getConversionTerm, getLossReasonLabel, getStageLabel, t } from "@/lib/locale";
import { listFollowUps } from "@/services/follow-ups.service";
import { listLeads } from "@/services/leads.service";
import { getPaymentsSummary } from "@/services/payments.service";
import { getScheduleOverview } from "@/services/schedule.service";
import { listStudents } from "@/services/students.service";
import type { ReportsData, ReportsSummaryItem } from "@/types/crm";
import type { LeadStage, Locale, LossReason } from "@/types/common.types";

const LOSS_REASON_ORDER: LossReason[] = [
  "price",
  "wants_offline",
  "no_laptop",
  "age_mismatch",
  "no_response",
  "exams_deferred",
  "not_convinced_online",
  "chose_competitor",
  "other",
];

function differenceInDays(start: string, end: string | null): number {
  const startDate = new Date(start).getTime();
  const endDate = end ? new Date(end).getTime() : Date.now();
  const diff = Math.abs(endDate - startDate);
  return Math.max(1, Math.round(diff / (1000 * 60 * 60 * 24)));
}

function averageStageAge(stage: LeadStage, createdAtValues: string[]): number {
  if (createdAtValues.length === 0) return 0;
  const total = createdAtValues.reduce((sum, createdAt) => sum + differenceInDays(createdAt, null), 0);
  return Math.round(total / createdAtValues.length);
}

export async function getReportsData(locale: Locale = "ar"): Promise<ReportsData> {
  const [leads, students, followUps, paymentsSummary, scheduleOverview] = await Promise.all([
    listLeads(),
    listStudents(),
    listFollowUps(),
    getPaymentsSummary(),
    getScheduleOverview(),
  ]);

  const totalLeads = leads.length;
  const wonLeads = leads.filter((lead) => lead.stage === "won");
  const lostLeads = leads.filter((lead) => lead.stage === "lost");
  const revenue = students.reduce((sum, student) => sum + student.totalPaid, 0);
  const recentStudents = students.filter((student) => {
    const enrolledAt = new Date(student.enrollmentDate).getTime();
    const threshold = Date.now() - 1000 * 60 * 60 * 24 * 30;
    return enrolledAt >= threshold;
  }).length;

  const averageDecisionDays = wonLeads.length
    ? Math.round(
        wonLeads.reduce((sum, lead) => sum + differenceInDays(lead.createdAt, lead.lastContactAt), 0) / wonLeads.length,
      )
    : 0;

  const conversionRate = totalLeads > 0 ? (wonLeads.length / totalLeads) * 100 : 0;
  const overdueFollowUps = followUps.filter((item) => item.status === "overdue").length;
  const atRiskStudents = students.filter((student) => student.status === "at_risk").length;
  const leadsWithoutFollowUp = leads.filter((lead) => lead.stage !== "won" && lead.stage !== "lost" && !lead.nextFollowUpAt).length;

  const funnel = PIPELINE_STAGES.filter((stage) => stage !== "lost").map((stage) => ({
    stage,
    count: leads.filter((lead) => lead.stage === stage).length,
    color: STAGE_CONFIGS[stage].color,
  }));

  const lossCounts = LOSS_REASON_ORDER.map((key) => {
    const count = lostLeads.filter((lead) => lead.lossReason === key).length;
    return {
      key,
      count,
      pct: lostLeads.length > 0 ? Math.round((count / lostLeads.length) * 100) : 0,
    };
  }).filter((item) => item.count > 0);

  const salesMap = new Map<string, { leads: number; won: number }>();
  leads.forEach((lead) => {
    const entry = salesMap.get(lead.assignedToName) ?? { leads: 0, won: 0 };
    entry.leads += 1;
    if (lead.stage === "won") entry.won += 1;
    salesMap.set(lead.assignedToName, entry);
  });

  const totalWon = Math.max(1, wonLeads.length);
  const salesPerformance = Array.from(salesMap.entries())
    .map(([name, stats]) => ({
      name,
      leads: stats.leads,
      won: stats.won,
      rate: `${Math.round((stats.won / Math.max(1, stats.leads)) * 100)}%`,
      revenue: Math.round((stats.won / totalWon) * revenue),
    }))
    .sort((a, b) => b.won - a.won);

  const stageVelocity = PIPELINE_STAGES.filter((stage) => stage !== "won" && stage !== "lost")
    .map((stage) => ({
      stage,
      days: averageStageAge(stage, leads.filter((lead) => lead.stage === stage).map((lead) => lead.createdAt)),
    }))
    .filter((item) => item.days > 0)
    .sort((a, b) => b.days - a.days);

  const operationalSummary: ReportsSummaryItem[] = [
    {
      title: t(locale, "متابعات متأخرة", "Overdue follow-ups"),
      value: overdueFollowUps.toLocaleString(locale === "ar" ? "ar-EG" : "en-US"),
      subtitle: t(locale, "كل تأخير هنا يعني فرصة أبطأ أو مهدورة", "Every delay here means a slower or missed opportunity"),
      tone: overdueFollowUps > 0 ? "danger" : "success",
    },
    {
      title: t(locale, "طلاب بحاجة متابعة", "Students at risk"),
      value: atRiskStudents.toLocaleString(locale === "ar" ? "ar-EG" : "en-US"),
      subtitle: t(locale, "راقب التوقف والغياب قبل الانسحاب", "Watch pauses and absence before they churn"),
      tone: atRiskStudents > 0 ? "warning" : "success",
    },
    {
      title: t(locale, "التحصيل الحالي", "Current collection"),
      value: `${paymentsSummary.collectionRate}%`,
      subtitle: t(locale, `${formatCurrencyEgp(paymentsSummary.totalCollected, locale)} تم تحصيلها`, `${formatCurrencyEgp(paymentsSummary.totalCollected, locale)} collected so far`),
      tone: paymentsSummary.collectionRate >= 80 ? "success" : paymentsSummary.collectionRate >= 60 ? "warning" : "danger",
    },
    {
      title: t(locale, "حمولة الجدول", "Schedule load"),
      value: scheduleOverview.sessionsCount.toLocaleString(locale === "ar" ? "ar-EG" : "en-US"),
      subtitle: t(locale, `${scheduleOverview.uniqueTeachers} مدرسين فعّالين`, `${scheduleOverview.uniqueTeachers} active teachers`),
      tone: "info",
    },
  ];

  const recommendations = [
    overdueFollowUps > 0
      ? {
          title: t(locale, "أولوية اليوم: اغلاق المتابعات المتأخرة", "Priority today: close overdue follow-ups"),
          description: t(locale, "ابدأ بالعملاء الأقرب للحجز أو الإغلاق حتى لا يبردوا داخل القمع", "Start with leads closest to booking or closing so they do not cool off inside the funnel"),
          href: "/follow-ups",
          priority: "high" as const,
        }
      : null,
    paymentsSummary.totalOverdue > 0
      ? {
          title: t(locale, "معالجة التأخرات المالية", "Address overdue balances"),
          description: t(locale, "اربط المتابعات المالية بالمدفوعات المتأخرة لرفع معدل التحصيل بسرعة", "Tie financial follow-ups to overdue balances to improve collections fast"),
          href: "/payments",
          priority: "high" as const,
        }
      : null,
    leadsWithoutFollowUp > 0
      ? {
          title: t(locale, "تنظيف العملاء المفتوحين", "Clean up open leads"),
          description: t(locale, "هناك عملاء بلا موعد متابعة قادم، وهذا يسبب تسربًا هادئًا من القمع", "Some leads have no next follow-up date, which quietly leaks your funnel"),
          href: "/leads",
          priority: "medium" as const,
        }
      : null,
    stageVelocity[0]
      ? {
          title: t(locale, "أبطأ مرحلة تحتاج قرارًا", "Slowest stage needs a decision"),
          description: t(locale, `${getStageLabel(stageVelocity[0].stage, locale)} تمكث ${stageVelocity[0].days} أيام في المتوسط`, `${getStageLabel(stageVelocity[0].stage, locale)} stays for ${stageVelocity[0].days} days on average`),
          href: "/reports",
          priority: "medium" as const,
        }
      : null,
  ].filter((item): item is NonNullable<typeof item> => Boolean(item));

  return {
    kpis: [
      {
        label: getConversionTerm("conversionRate", locale),
        value: `${conversionRate.toFixed(1)}%`,
        change: wonLeads.length > 0 ? `+${wonLeads.length}` : "0",
        up: wonLeads.length > 0,
        icon: "target",
      },
      {
        label: t(locale, "إيراد الشهر", "Monthly revenue"),
        value: formatCurrencyEgp(revenue, locale),
        change: revenue > 0 ? t(locale, "+محدّث", "+Updated") : "0",
        up: revenue > 0,
        icon: "wallet",
      },
      {
        label: t(locale, "طلاب جدد", "New students"),
        value: recentStudents.toLocaleString(locale === "ar" ? "ar-EG" : "en-US"),
        change: recentStudents > 0 ? `+${recentStudents}` : "0",
        up: recentStudents > 0,
        icon: "users",
      },
      {
        label: getConversionTerm("averageConversionTime", locale),
        value: averageDecisionDays > 0 ? t(locale, `${averageDecisionDays} يوم`, `${averageDecisionDays} days`) : "—",
        change: averageDecisionDays > 0 && averageDecisionDays <= 5 ? t(locale, "أسرع", "Faster") : t(locale, "يحتاج تحسين", "Needs work"),
        up: averageDecisionDays > 0 && averageDecisionDays <= 5,
        icon: "clock",
      },
    ],
    funnel,
    lossReasons: lossCounts.length > 0 ? lossCounts : [{ key: "other", count: 0, pct: 0 }],
    salesPerformance,
    collection: {
      expected: paymentsSummary.totalExpected,
      collected: paymentsSummary.totalCollected,
      overdue: paymentsSummary.totalOverdue,
      rate: paymentsSummary.collectionRate,
    },
    stageVelocity,
    operationalSummary,
    recommendations,
  };
}

export function getLocalizedLossReason(reason: LossReason, locale: Locale): string {
  return getLossReasonLabel(reason, locale);
}

export function getLocalizedFunnelStage(stage: LeadStage, locale: Locale): string {
  return getStageLabel(stage, locale);
}
