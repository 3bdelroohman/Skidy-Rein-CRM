import { PIPELINE_STAGES, STAGE_CONFIGS } from "@/config/stages";
import { formatCurrencyEgp } from "@/lib/formatters";
import { getConversionTerm, getLossReasonLabel, getStageLabel, t } from "@/lib/locale";
import { listLeads } from "@/services/leads.service";
import { listStudents } from "@/services/students.service";
import type { ReportsData } from "@/types/crm";
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

export async function getReportsData(locale: Locale = "ar"): Promise<ReportsData> {
  const [leads, students] = await Promise.all([listLeads(), listStudents()]);

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
  };
}

export function getLocalizedLossReason(reason: LossReason, locale: Locale): string {
  return getLossReasonLabel(reason, locale);
}

export function getLocalizedFunnelStage(stage: LeadStage, locale: Locale): string {
  return getStageLabel(stage, locale);
}
