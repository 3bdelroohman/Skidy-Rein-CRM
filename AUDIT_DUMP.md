# AUDIT DUMP - 04/14/2026 18:48:37
## 1. PROJECT STRUCTURE
.github\workflows\ci.yml
.vscode\settings.json
docs\NEW-CHAT-PROMPT.txt
password_note_fix\src\app\(dashboard)\settings\page.tsx
scripts\cleanup-artifacts.ps1
scripts\project-inventory.ps1
src\app\(auth)\login\auth.ts
src\app\(auth)\login\layout.tsx
src\app\(auth)\login\page.tsx
src\app\(dashboard)\action-center\page.tsx
src\app\(dashboard)\follow-ups\page.tsx
src\app\(dashboard)\leads\new\page.tsx
src\app\(dashboard)\leads\[id]\edit\page.tsx
src\app\(dashboard)\leads\[id]\page.tsx
src\app\(dashboard)\leads\page.tsx
src\app\(dashboard)\parents\new\page.tsx
src\app\(dashboard)\parents\[id]\page.tsx
src\app\(dashboard)\parents\page.tsx
src\app\(dashboard)\payments\invoice\[id]\page.tsx
src\app\(dashboard)\payments\new\page.tsx
src\app\(dashboard)\payments\[id]\invoice\page.tsx
src\app\(dashboard)\payments\[id]\page.tsx
src\app\(dashboard)\payments\page.tsx
src\app\(dashboard)\reports\page.tsx
src\app\(dashboard)\schedule\new\page.tsx
src\app\(dashboard)\schedule\[id]\page.tsx
src\app\(dashboard)\schedule\page.tsx
src\app\(dashboard)\settings\page.tsx
src\app\(dashboard)\students\new\page.tsx
src\app\(dashboard)\students\[id]\report\page.tsx
src\app\(dashboard)\students\[id]\page.tsx
src\app\(dashboard)\students\page.tsx
src\app\(dashboard)\teachers\finance\page.tsx
src\app\(dashboard)\teachers\new\page.tsx
src\app\(dashboard)\teachers\[id]\page.tsx
src\app\(dashboard)\teachers\page.tsx
src\app\(dashboard)\layout.tsx
src\app\(dashboard)\loading.tsx
src\app\(dashboard)\not-found.tsx
src\app\(dashboard)\page.tsx
src\app\error.tsx
src\app\globals.css
src\app\layout.tsx
src\app\not-found.tsx
src\app\page.backup.tsx
src\components\layout\dashboard-shell.tsx
src\components\layout\global-search.tsx
src\components\layout\mobile-nav.tsx
src\components\layout\sidebar.tsx
src\components\layout\top-navbar.tsx
src\components\leads\lead-form.tsx
src\components\leads\leads-kanban.tsx
src\components\leads\stage-badge.tsx
src\components\leads\temperature-badge.tsx
src\components\parents\parent-form.tsx
src\components\payments\invoice-toolbar.tsx
src\components\payments\payment-invoice-view.tsx
src\components\providers\theme-provider.tsx
src\components\schedule\schedule-entry-form.tsx
src\components\shared\page-state.tsx
src\components\students\student-form.tsx
src\components\teachers\teacher-form.tsx
src\components\ui\button.tsx
src\config\course-roadmap.ts
src\config\labels.ts
src\config\navigation.ts
src\config\roles.ts
src\config\stages.ts
src\config\status-meta.ts
src\lib\actions\auth.actions.ts
src\lib\supabase\client.ts
src\lib\supabase\server.ts
src\lib\auth.ts
src\lib\formatters.ts
src\lib\locale.ts
src\lib\mock-data.ts
src\lib\utils.ts
src\providers\user-provider.tsx
src\services\dashboard.service.ts
src\services\duplicate-guard.service.ts
src\services\enrollment.service.ts
src\services\follow-ups.service.ts
src\services\leads.service.ts
src\services\operations.service.ts
src\services\owner-summary.service.ts
src\services\parents.service.ts
src\services\payments.service.ts
src\services\relations.service.ts
src\services\reports.service.ts
src\services\schedule.service.ts
src\services\schedule_service_repaired.ts
src\services\storage.ts
src\services\student-enrollment-control.service.ts
src\services\student-finance.service.ts
src\services\student-journey.service.ts
src\services\student-report.service.ts
src\services\students.service.ts
src\services\teacher-evaluations.service.ts
src\services\teacher-finance.service.ts
src\services\teacher-reassignment.service.ts
src\services\teachers.service.ts
src\stores\ui-store.ts
src\types\common.types.ts
src\types\crm.ts
src\types\database.types.ts
src\types\modules.d.ts
src\middleware.ts
supabase\migrations\client.ts
_ops\rogue-root-files\page.tsx.bak
_ops\route-backups\page.backup.tsx
_ops\apply-skidy-payments-batch-1.ps1
_ops\cleanup-artifacts.ps1
_ops\PHASE7-BATCH2-STUDENTS-PARENTS-TEACHERS-NOTES.md
_ops\PHASE7-BATCH3-PAYMENTS-SCHEDULE-NOTES.md
.env.example
.env.local
.gitignore
AGENTS.md
apply-delete-teacher.js
apply-global-search-teacher-email-fix.js
apply-parent-null-fix.js
apply-teacher-email-null-fix.js
apply-vercel-service-exports-fix.js
AUDIT_DUMP.md
CLAUDE.md
components.json
eslint.config.mjs
fix-crm-barrel-exports.js
fix-route-types.js
IMPLEMENTATION-NOTES.md
next-env.d.ts
next.config.ts
package-lock.json
package.json
PAYMENTS-PERMISSIONS-BILLING-NOTES.md
PAYMENTS-UPGRADE-NOTES.md
PHASE-NEXT-NAV-CLEANUP-NOTES.md
PHASE-NEXT-SECURITY-NOTES.md
PHASE7-9-COMBINED-NOTES.md
PHASE7-LEADS-FOLLOWUPS-NOTES.md
PHASE8-9-ROLE-FILTERING-FIX-NOTES.md
postcss.config.mjs
README.md
README.txt
remove-rogue-root-page.js
tsconfig.json
tsconfig.tsbuildinfo
## 2. SERVICES

### FILE: src\services\dashboard.service.ts
```ts

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
          text: t(locale, `${overdueFollowUps} Ù…ØªØ§Ø¨Ø¹Ø§Øª Ù…ØªØ£Ø®Ø±Ø© ØªØ­ØªØ§Ø¬ ØªØ¯Ø®Ù„ Ø§Ù„Ø¢Ù†`, `${overdueFollowUps} overdue follow-ups need immediate action`),
          type: "danger" as const,
        }
      : null,
    overduePaymentsCount > 0
      ? {
          icon: "wallet",
          text: t(locale, `${overduePaymentsCount} Ø¯ÙØ¹Ø§Øª Ù…ØªØ£Ø®Ø±Ø© Ø¨Ù‚ÙŠÙ…Ø© ${formatCurrencyEgp(paymentsSummary.totalOverdue, locale)}`, `${overduePaymentsCount} overdue payments worth ${formatCurrencyEgp(paymentsSummary.totalOverdue, locale)}`),
          type: "warning" as const,
        }
      : null,
    atRiskStudents > 0
      ? {
          icon: "notification",
          text: t(locale, `${atRiskStudents} Ø·Ù„Ø§Ø¨ Ø¨Ø­Ø§Ø¬Ø© Ù…ØªØ§Ø¨Ø¹Ø©`, `${atRiskStudents} students need attention`),
          type: "warning" as const,
        }
      : null,
    !isOps && recentLeads > 0
      ? {
          icon: "success",
          text: t(locale, `${recentLeads} Ø¹Ù…Ù„Ø§Ø¡ Ø¬Ø¯Ø¯ Ø®Ù„Ø§Ù„ Ø¢Ø®Ø± 7 Ø£ÙŠØ§Ù…`, `${recentLeads} new leads over the last 7 days`),
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
          title: t(locale, "Ø¬Ù„Ø³Ø§Øª Ù‡Ø°Ø§ Ø§Ù„Ø£Ø³Ø¨ÙˆØ¹", "Sessions this week"),
          value: scheduleOverview.sessionsCount.toLocaleString(numberLocale),
          subtitle: t(locale, `${scheduleOverview.uniqueTeachers} Ù…Ø¯Ø±Ø³ÙŠÙ† â€¢ ${scheduleOverview.totalStudents} Ù…Ù‚Ø¹Ø¯`, `${scheduleOverview.uniqueTeachers} teachers â€¢ ${scheduleOverview.totalStudents} seats`),
          tone: "info",
        },
        {
          title: t(locale, "Ø·Ù„Ø§Ø¨ Ø¨Ø­Ø§Ø¬Ø© Ù…ØªØ§Ø¨Ø¹Ø©", "Students at risk"),
          value: atRiskStudents.toLocaleString(numberLocale),
          subtitle: t(locale, "Ù…Ù„ÙØ§Øª ØªØ­ØªØ§Ø¬ ØªØ¯Ø®Ù„Ù‹Ø§ ØªØ´ØºÙŠÙ„ÙŠÙ‹Ø§ Ø§Ù„Ø¢Ù†", "Student files that need operational intervention"),
          tone: atRiskStudents > 0 ? "warning" : "success",
        },
        {
          title: t(locale, "Ø§Ù„Ø·Ù„Ø§Ø¨ Ø§Ù„ØªØ¬Ø±ÙŠØ¨ÙŠÙˆÙ†", "Trial students"),
          value: trialStudents.toLocaleString(numberLocale),
          subtitle: t(locale, "Ø±Ø§Ø¬Ø¹ Ø§Ù„Ø­Ø¶ÙˆØ± ÙˆØ§Ù„ØªØ­ÙˆÙŠÙ„ Ø¥Ù„Ù‰ Ø§Ø´ØªØ±Ø§Ùƒ", "Review attendance and conversion to enrollment"),
          tone: trialStudents > 0 ? "brand" : "info",
        },
        {
          title: t(locale, "ØªØ­ØµÙŠÙ„ Ø§Ù„Ø´Ù‡Ø±", "Collection this month"),
          value: `${paymentsSummary.collectionRate}%`,
          subtitle: t(locale, `${formatCurrencyEgp(paymentsSummary.totalCollected, locale)} Ù…Ù† ${formatCurrencyEgp(paymentsSummary.totalExpected, locale)}`, `${formatCurrencyEgp(paymentsSummary.totalCollected, locale)} out of ${formatCurrencyEgp(paymentsSummary.totalExpected, locale)}`),
          tone: paymentsSummary.collectionRate >= 80 ? "success" : paymentsSummary.collectionRate >= 60 ? "warning" : "danger",
        },
      ]
    : [
        {
          title: t(locale, "ØªØ­ØµÙŠÙ„ Ø§Ù„Ø´Ù‡Ø±", "Collection this month"),
          value: `${paymentsSummary.collectionRate}%`,
          subtitle: t(locale, `${formatCurrencyEgp(paymentsSummary.totalCollected, locale)} Ù…Ù† ${formatCurrencyEgp(paymentsSummary.totalExpected, locale)}`, `${formatCurrencyEgp(paymentsSummary.totalCollected, locale)} out of ${formatCurrencyEgp(paymentsSummary.totalExpected, locale)}`),
          tone: paymentsSummary.collectionRate >= 80 ? "success" : paymentsSummary.collectionRate >= 60 ? "warning" : "danger",
        },
        {
          title: t(locale, "Ø¬Ù„Ø³Ø§Øª Ù‡Ø°Ø§ Ø§Ù„Ø£Ø³Ø¨ÙˆØ¹", "Sessions this week"),
          value: scheduleOverview.sessionsCount.toLocaleString(numberLocale),
          subtitle: t(locale, `${scheduleOverview.uniqueTeachers} Ù…Ø¯Ø±Ø³ÙŠÙ† â€¢ ${scheduleOverview.totalStudents} Ù…Ù‚Ø¹Ø¯`, `${scheduleOverview.uniqueTeachers} teachers â€¢ ${scheduleOverview.totalStudents} seats`),
          tone: "info",
        },
        {
          title: t(locale, "Ø¹Ù…Ù„Ø§Ø¡ Ø¨Ù„Ø§ Ù…ØªØ§Ø¨Ø¹Ø© Ù‚Ø§Ø¯Ù…Ø©", "Leads without next follow-up"),
          value: leadsMissingFollowUp.toLocaleString(numberLocale),
          subtitle: t(locale, "Ø§Ø­ØªÙƒØ§Ùƒ ØªØ´ØºÙŠÙ„ÙŠ ÙŠØ¬Ø¨ ØªÙ†Ø¸ÙŠÙÙ‡", "Operational friction that needs cleanup"),
          tone: leadsMissingFollowUp > 0 ? "warning" : "success",
        },
        {
          title: t(locale, "Ø§Ù„Ø­ØµØµ Ø§Ù„ØªØ¬Ø±ÙŠØ¨ÙŠØ© Ø§Ù„Ù…Ø­Ø¬ÙˆØ²Ø©", "Booked trial sessions"),
          value: bookedTrials.toLocaleString(numberLocale),
          subtitle: t(locale, `${attendedTrials.toLocaleString(numberLocale)} Ø­Ø¶Ø±ÙˆØ§ Ø¨Ø§Ù„ÙØ¹Ù„`, `${attendedTrials.toLocaleString(numberLocale)} already attended`),
          tone: bookedTrials > attendedTrials ? "brand" : "success",
        },
      ];

  const quickActions: DashboardActionItem[] = isManagementRole(context.role)
    ? [
        {
          title: t(locale, "Ù„ÙˆØ­Ø© Ø§Ù„Ø¹Ù…Ù„Ø§Ø¡", "Leads board"),
          description: t(locale, "Ø±Ø§Ø¬Ø¹ Ø§Ù„Ù…Ø±Ø§Ø­Ù„ Ø§Ù„Ù…ØªÙˆÙ‚ÙØ© ÙˆØ§Ù„Ø¹Ù…Ù„Ø§Ø¡ Ø§Ù„Ø£Ù‚Ø±Ø¨ Ù„Ù„Ø§Ø´ØªØ±Ø§Ùƒ", "Review stalled stages and the leads closest to enrollment"),
          href: "/leads",
          tone: "brand",
        },
        {
          title: t(locale, "Ù…Ø±ÙƒØ² Ø§Ù„Ø¹Ù…Ù„ÙŠØ§Øª", "Action center"),
          description: t(locale, "Ø´Ø§Ù‡Ø¯ ÙƒÙ„ Ø§Ù„Ø¹Ù†Ø§ØµØ± Ø§Ù„Ø­Ø±Ø¬Ø© ÙˆØ§Ù„ØªÙ†ÙÙŠØ°ÙŠØ© ÙÙŠ Ù…ÙƒØ§Ù† ÙˆØ§Ø­Ø¯", "See all critical and operational items in one place"),
          href: "/action-center",
          tone: "warning",
        },
        {
          title: t(locale, "Ø§Ù„ØªØ­ØµÙŠÙ„ ÙˆØ§Ù„Ù…Ø¯ÙÙˆØ¹Ø§Øª", "Collections & payments"),
          description: t(locale, "Ø£ØºÙ„Ù‚ Ø§Ù„Ù…ØªØ£Ø®Ø±Ø§Øª ÙˆØ§Ø±ÙØ¹ Ù…Ø¹Ø¯Ù„ Ø§Ù„ØªØ­ØµÙŠÙ„", "Close overdue balances and improve collection rate"),
          href: "/payments",
          tone: "success",
        },
        {
          title: t(locale, "Ø§Ù„ØªÙ‚Ø§Ø±ÙŠØ± Ø§Ù„ØªÙ†ÙÙŠØ°ÙŠØ©", "Executive reports"),
          description: t(locale, "Ø±Ø§Ø¬Ø¹ Ø§Ù„Ø³Ø±Ø¹Ø©ØŒ Ø§Ù„Ù‚Ù…Ø¹ØŒ ÙˆØ§Ù„ÙØ±Øµ Ø§Ù„Ø¶Ø§Ø¦Ø¹Ø©", "Review velocity, funnel, and missed opportunities"),
          href: "/reports",
          tone: "info",
        },
      ]
    : isOps
      ? [
          {
            title: t(locale, "Ù…Ø±ÙƒØ² Ø§Ù„Ø¹Ù…Ù„ÙŠØ§Øª", "Action center"),
            description: t(locale, "Ø§ÙØªØ­ Ø§Ù„Ù…Ù‡Ø§Ù… Ø§Ù„ØªØ´ØºÙŠÙ„ÙŠØ© Ø§Ù„Ø¹Ø§Ø¬Ù„Ø© ÙÙŠ Ø´Ø§Ø´Ø© ÙˆØ§Ø­Ø¯Ø©", "Open urgent operational tasks in one screen"),
            href: "/action-center",
            tone: "warning",
          },
          {
            title: t(locale, "Ø§Ù„Ø·Ù„Ø§Ø¨", "Students"),
            description: t(locale, "Ø±Ø§Ø¬Ø¹ Ø§Ù„Ø·Ù„Ø§Ø¨ Ø§Ù„Ù…Ø¹Ø±Ø¶ÙŠÙ† Ù„Ù„Ø®Ø·Ø± ÙˆØ§Ù„Ø­Ø§Ù„Ø§Øª Ø§Ù„ØªØ¬Ø±ÙŠØ¨ÙŠØ©", "Review at-risk and trial students"),
            href: "/students",
            tone: "brand",
          },
          {
            title: t(locale, "Ø§Ù„Ø¬Ø¯ÙˆÙ„", "Schedule"),
            description: t(locale, "Ø±Ø§Ø¬Ø¹ Ø¬Ù„Ø³Ø§Øª Ø§Ù„ÙŠÙˆÙ… ÙˆØ§Ù„Ù…Ø¯Ø±Ø³ÙŠÙ† Ø§Ù„Ù…Ø±ØªØ¨Ø·ÙŠÙ†", "Review today's sessions and linked teachers"),
            href: "/schedule",
            tone: "info",
          },
          {
            title: t(locale, "Ø§Ù„Ù…Ø¯ÙÙˆØ¹Ø§Øª", "Payments"),
            description: t(locale, "ØªØ§Ø¨Ø¹ Ø§Ù„Ø­Ø§Ù„Ø§Øª Ø§Ù„Ù…ØªØ£Ø®Ø±Ø© ÙˆØ§Ù„Ù…Ø³ØªØ­Ù‚Ø© Ø§Ù„ÙŠÙˆÙ…", "Follow overdue and due-today payments"),
            href: "/payments",
            tone: "success",
          },
        ]
      : [
          {
            title: t(locale, "Ø§Ù„Ø¹Ù…Ù„Ø§Ø¡ Ø§Ù„Ù…Ø­ØªÙ…Ù„ÙˆÙ†", "Leads"),
            description: t(locale, "Ø­Ø¯Ù‘Ø« Ø§Ù„Ù…Ø±Ø§Ø­Ù„ ÙˆØ³Ø¬Ù‘Ù„ Ø¢Ø®Ø± ØªÙˆØ§ØµÙ„", "Update stages and capture the latest contact"),
            href: "/leads",
            tone: "brand",
          },
          {
            title: t(locale, "Ø§Ù„Ù…ØªØ§Ø¨Ø¹Ø§Øª", "Follow-ups"),
            description: t(locale, "Ø£ØºÙ„Ù‚ Ø§Ù„Ù…Ù‡Ø§Ù… Ø§Ù„Ù…ÙØªÙˆØ­Ø© Ù‚Ø¨Ù„ Ù†Ù‡Ø§ÙŠØ© Ø§Ù„ÙŠÙˆÙ…", "Close open tasks before the day ends"),
            href: "/follow-ups",
            tone: "warning",
          },
          {
            title: t(locale, "Ø§Ù„Ù…Ø¯ÙÙˆØ¹Ø§Øª", "Payments"),
            description: t(locale, "Ø±Ø§Ø¬Ø¹ Ø§Ù„Ø­Ø§Ù„Ø§Øª Ø§Ù„Ù…Ø¹Ù„Ù‚Ø© ÙˆØ§Ù„Ù…ØªØ£Ø®Ø±Ø©", "Review pending and overdue payments"),
            href: "/payments",
            tone: "success",
          },
        ];

  const recommendations = [
    !isOps && overdueFollowUps > 0 ? t(locale, "Ø§Ø¨Ø¯Ø£ Ù…Ù† Ù…Ø±ÙƒØ² Ø§Ù„Ø¹Ù…Ù„ÙŠØ§Øª Ù„Ø¥ØºÙ„Ø§Ù‚ Ø§Ù„Ù…ØªØ§Ø¨Ø¹Ø§Øª Ø§Ù„Ù…ØªØ£Ø®Ø±Ø© Ø£ÙˆÙ„Ø§Ù‹", "Start from the action center to close overdue follow-ups first") : null,
    overduePaymentsCount > 0 ? t(locale, "Ø£Ø±Ø³Ù„ ØªØ°ÙƒÙŠØ±Ø§Øª Ø¯ÙØ¹ Ù…Ø±ÙƒØ²Ø© Ù„Ù„Ø¹Ø§Ø¦Ù„Ø§Øª Ø§Ù„Ù…ØªØ£Ø®Ø±Ø© Ø§Ù„ÙŠÙˆÙ…", "Send focused payment reminders to overdue families today") : null,
    !isOps && trialNoShows > 0 ? t(locale, "Ø±Ø§Ø¬Ø¹ Ø§Ù„Ø­ØµØµ Ø§Ù„ØªØ¬Ø±ÙŠØ¨ÙŠØ© ØºÙŠØ± Ø§Ù„Ù…Ø¤ÙƒØ¯Ø© Ù„ØªÙ‚Ù„ÙŠÙ„ Ø§Ù„Ù€ no-show", "Review unconfirmed trial sessions to reduce no-shows") : null,
    !isOps && leadsMissingFollowUp > 0 ? t(locale, "Ø£Ø¶Ù Ù…ÙˆØ§Ø¹ÙŠØ¯ Ù…ØªØ§Ø¨Ø¹Ø© Ù„Ù„Ø¹Ù…Ù„Ø§Ø¡ Ø§Ù„Ù…ÙØªÙˆØ­ÙŠÙ† Ø­ØªÙ‰ Ù„Ø§ ÙŠØªØ³Ø±Ø¨ÙˆØ§ Ù…Ù† Ø§Ù„Ù‚Ù…Ø¹", "Add follow-up dates for open leads so they do not leak from the funnel") : null,
    isOps && atRiskStudents > 0 ? t(locale, "Ø§Ø¨Ø¯Ø£ Ø¨Ø§Ù„Ø·Ù„Ø§Ø¨ Ø§Ù„Ù…Ø¹Ø±Ø¶ÙŠÙ† Ù„Ù„Ø®Ø·Ø± Ù„Ø£Ù†Ù‡Ù… Ø£Ù‚Ø±Ø¨ Ø®Ø³Ø§Ø±Ø© ØªØ´ØºÙŠÙ„ÙŠØ© Ø§Ù„Ø¢Ù†", "Start with at-risk students because they are the nearest operational risk right now") : null,
    isOps && scheduleOverview.sessionsCount > 0 ? t(locale, "Ø±Ø§Ø¬Ø¹ Ø¬Ø¯ÙˆÙ„ Ø§Ù„ÙŠÙˆÙ… ÙˆØªØ£ÙƒØ¯ Ù…Ù† Ø§ÙƒØªÙ…Ø§Ù„ Ø§Ù„Ø±Ø¨Ø· Ø¨ÙŠÙ† Ø§Ù„Ù…Ø¯Ø±Ø³ÙŠÙ† ÙˆØ§Ù„Ø·Ù„Ø§Ø¨", "Review today's schedule and confirm teacher-student assignment completeness") : null,
    sessions.length === 0 ? t(locale, "Ù„Ø§ ØªÙˆØ¬Ø¯ Ø¬Ù„Ø³Ø§Øª Ù…Ø³Ø¬Ù„Ø© Ø­Ø§Ù„ÙŠØ§Ù‹ØŒ Ø±Ø§Ø¬Ø¹ Ø±Ø¨Ø· Ø§Ù„Ø¬Ø¯Ø§ÙˆÙ„ Ø¨Ø§Ù„Ø¨ÙŠØ§Ù†Ø§Øª", "No sessions are registered right now, review schedule data mapping") : null,
  ].filter((item): item is string => Boolean(item));

  return {
    managementStats: isOps
      ? [
          {
            label: t(locale, "Ø·Ù„Ø§Ø¨ Ù†Ø´Ø·ÙˆÙ†", "Active students"),
            value: activeStudents.toLocaleString(numberLocale),
            change: trialStudents > 0 ? `+${trialStudents}` : "0",
            bg: "#4F46E5",
          },
          {
            label: t(locale, "Ø¬Ù„Ø³Ø§Øª Ø§Ù„Ø£Ø³Ø¨ÙˆØ¹", "Weekly sessions"),
            value: scheduleOverview.sessionsCount.toLocaleString(numberLocale),
            change: scheduleOverview.uniqueTeachers > 0 ? `+${scheduleOverview.uniqueTeachers}` : "0",
            bg: "#8B5CF6",
          },
          {
            label: t(locale, "Ø¥ÙŠØ±Ø§Ø¯ Ø§Ù„Ø´Ù‡Ø±", "Monthly revenue"),
            value: formatCurrencyEgp(monthlyRevenue, locale),
            change: monthlyRevenue > 0 ? t(locale, "+Ù…Ø­Ø³ÙˆØ¨", "+Calculated") : "0",
            bg: "#10B981",
          },
          {
            label: t(locale, "Ø·Ù„Ø§Ø¨ Ø¨Ø­Ø§Ø¬Ø© Ù…ØªØ§Ø¨Ø¹Ø©", "Students at risk"),
            value: atRiskStudents.toLocaleString(numberLocale),
            change: atRiskStudents > 0 ? t(locale, "+Ù…Ù‡Ù…", "+Important") : "0",
            bg: "#0D9488",
          },
        ]
      : [
          {
            label: t(locale, "Ø·Ù„Ø§Ø¨ Ù†Ø´Ø·ÙˆÙ†", "Active students"),
            value: activeStudents.toLocaleString(numberLocale),
            change: recentLeads > 0 ? `+${recentLeads}` : "0",
            bg: "#4F46E5",
          },
          {
            label: t(locale, "Ø¹Ù…Ù„Ø§Ø¡ Ø¬Ø¯Ø¯", "New leads"),
            value: recentLeads.toLocaleString(numberLocale),
            change: recentLeads > 0 ? t(locale, "+Ù†Ø´Ø·", "+Active") : "0",
            bg: "#8B5CF6",
          },
          {
            label: t(locale, "Ø¥ÙŠØ±Ø§Ø¯ Ø§Ù„Ø´Ù‡Ø±", "Monthly revenue"),
            value: formatCurrencyEgp(monthlyRevenue, locale),
            change: monthlyRevenue > 0 ? t(locale, "+Ù…Ø­Ø³ÙˆØ¨", "+Calculated") : "0",
            bg: "#10B981",
          },
          {
            label: getConversionTerm("conversionRate", locale),
            value: `${conversionRate}%`,
            change: conversionRate > 0 ? t(locale, "+Ù…Ø­Ø¯Ø«", "+Updated") : "0",
            bg: "#0D9488",
          },
        ],
    secondaryStats: isOps
      ? [
          { label: t(locale, "Ø¬Ù„Ø³Ø§Øª Ø§Ù„ÙŠÙˆÙ…", "Today's sessions"), value: sessions.length.toLocaleString(numberLocale), icon: "calendar", bg: "#EFF6FF", color: "#2563EB" },
          { label: t(locale, "Ø·Ù„Ø§Ø¨ Ø¨Ø­Ø§Ø¬Ø© Ù…ØªØ§Ø¨Ø¹Ø©", "Students at risk"), value: atRiskStudents.toLocaleString(numberLocale), icon: "warning", bg: "#FEF2F2", color: "#DC2626" },
          { label: t(locale, "Ø·Ù„Ø§Ø¨ ØªØ¬Ø±ÙŠØ¨ÙŠÙˆÙ†", "Trial students"), value: trialStudents.toLocaleString(numberLocale), icon: "clock", bg: "#FFFBEB", color: "#D97706" },
          { label: t(locale, "Ù…Ø¯ÙÙˆØ¹Ø§Øª Ù…Ø¹Ù„Ù‚Ø©", "Pending payments"), value: pendingPaymentsCount.toLocaleString(numberLocale), icon: "wallet", bg: "#F5F3FF", color: "#7C3AED" },
        ]
      : [
          { label: t(locale, "Ø³ÙŠØ´Ù† ØªØ¬Ø±ÙŠØ¨ÙŠØ©", "Trial sessions"), value: bookedTrials.toLocaleString(numberLocale), icon: "calendar", bg: "#EFF6FF", color: "#2563EB" },
          { label: t(locale, "Ø·Ù„Ø§Ø¨ Ø¨Ø­Ø§Ø¬Ø© Ù…ØªØ§Ø¨Ø¹Ø©", "Students at risk"), value: atRiskStudents.toLocaleString(numberLocale), icon: "warning", bg: "#FEF2F2", color: "#DC2626" },
          { label: t(locale, "Ù…ØªØ§Ø¨Ø¹Ø§Øª Ù…ØªØ£Ø®Ø±Ø©", "Overdue follow-ups"), value: overdueFollowUps.toLocaleString(numberLocale), icon: "clock", bg: "#FFFBEB", color: "#D97706" },
          { label: t(locale, "Ù…Ø¯ÙÙˆØ¹Ø§Øª Ù…Ø¹Ù„Ù‚Ø©", "Pending payments"), value: pendingPaymentsCount.toLocaleString(numberLocale), icon: "wallet", bg: "#F5F3FF", color: "#7C3AED" },
        ],
    alerts,
    funnel: isOps
      ? [
          {
            label: t(locale, "Ù†Ø´Ø·", "Active"),
            value: activeStudents,
            pct: `${Math.round((activeStudents / opsFunnelBase) * 100)}%`,
            color: "#4F46E5",
          },
          {
            label: t(locale, "ØªØ¬Ø±ÙŠØ¨ÙŠ", "Trial"),
            value: trialStudents,
            pct: `${Math.round((trialStudents / opsFunnelBase) * 100)}%`,
            color: "#F59E0B",
          },
          {
            label: t(locale, "Ø¨Ø­Ø§Ø¬Ø© Ù…ØªØ§Ø¨Ø¹Ø©", "At risk"),
            value: atRiskStudents,
            pct: `${Math.round((atRiskStudents / opsFunnelBase) * 100)}%`,
            color: "#EF4444",
          },
          {
            label: t(locale, "Ù…ÙƒØªÙ…Ù„", "Completed"),
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
```

### FILE: src\services\duplicate-guard.service.ts
```ts
import { listLeads } from "@/services/leads.service";
import { listParents } from "@/services/parents.service";
import { listStudents } from "@/services/students.service";

function normalizeName(value: string | null | undefined): string {
  return (value ?? "")
    .toLowerCase()
    .replace(/[Ù‹-ÙŸ]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizePhone(value: string | null | undefined): string {
  const digits = (value ?? "").replace(/\D/g, "");
  if (digits.startsWith("20") && digits.length > 11) return digits.slice(2);
  if (digits.startsWith("2") && digits.length === 12) return digits.slice(1);
  return digits;
}

function sameName(a: string | null | undefined, b: string | null | undefined): boolean {
  const left = normalizeName(a);
  const right = normalizeName(b);
  return left.length > 0 && left === right;
}

function samePhone(a: string | null | undefined, b: string | null | undefined): boolean {
  const left = normalizePhone(a);
  const right = normalizePhone(b);
  return left.length > 0 && left === right;
}

export interface DuplicateCheckResult {
  blocking: boolean;
  messageAr: string;
  messageEn: string;
}

export async function guardLeadDuplicate(input: {
  childName: string;
  parentName: string;
  parentPhone: string;
  parentWhatsapp?: string | null;
}): Promise<DuplicateCheckResult | null> {
  const [leads, parents, students] = await Promise.all([listLeads(), listParents(), listStudents()]);

  const sameLeadPhone = leads.find((lead) => samePhone(lead.parentPhone, input.parentPhone) || samePhone(lead.parentPhone, input.parentWhatsapp));
  if (sameLeadPhone) {
    return {
      blocking: true,
      messageAr: `ÙŠÙˆØ¬Ø¯ Ø¹Ù…ÙŠÙ„ Ù…Ø­ØªÙ…Ù„ Ø¨Ù†ÙØ³ Ø±Ù‚Ù… ÙˆÙ„ÙŠ Ø§Ù„Ø£Ù…Ø± Ø¨Ø§Ù„ÙØ¹Ù„: ${sameLeadPhone.parentName} / ${sameLeadPhone.childName}`,
      messageEn: `A lead with the same parent phone already exists: ${sameLeadPhone.parentName} / ${sameLeadPhone.childName}`,
    };
  }

  const sameParent = parents.find((parent) => samePhone(parent.phone, input.parentPhone) || samePhone(parent.whatsapp, input.parentWhatsapp));
  if (sameParent) {
    return {
      blocking: true,
      messageAr: `ÙŠÙˆØ¬Ø¯ ÙˆÙ„ÙŠ Ø£Ù…Ø± Ù…Ø³Ø¬Ù„ Ø¨Ø§Ù„ÙØ¹Ù„ Ø¨Ù†ÙØ³ Ø§Ù„Ø±Ù‚Ù…: ${sameParent.fullName}`,
      messageEn: `A parent with the same phone is already registered: ${sameParent.fullName}`,
    };
  }

  const sameStudent = students.find((student) => sameName(student.fullName, input.childName) && (samePhone(student.parentPhone, input.parentPhone) || sameName(student.parentName, input.parentName)));
  if (sameStudent) {
    return {
      blocking: true,
      messageAr: `ÙŠÙˆØ¬Ø¯ Ø·Ø§Ù„Ø¨ Ù…Ø³Ø¬Ù„ Ø¨Ø§Ù„ÙØ¹Ù„ Ø¨Ù†ÙØ³ Ø§Ù„Ø§Ø³Ù… ÙˆØ¨ÙŠØ§Ù†Ø§Øª ÙˆÙ„ÙŠ Ø§Ù„Ø£Ù…Ø±: ${sameStudent.fullName}`,
      messageEn: `A student with the same name and parent details already exists: ${sameStudent.fullName}`,
    };
  }

  return null;
}

export async function guardParentDuplicate(input: {
  fullName: string;
  phone: string;
  whatsapp?: string | null;
}): Promise<DuplicateCheckResult | null> {
  const [parents, leads] = await Promise.all([listParents(), listLeads()]);

  const sameParent = parents.find((parent) => samePhone(parent.phone, input.phone) || samePhone(parent.whatsapp, input.whatsapp));
  if (sameParent) {
    return {
      blocking: true,
      messageAr: `ÙŠÙˆØ¬Ø¯ ÙˆÙ„ÙŠ Ø£Ù…Ø± Ø¨Ù†ÙØ³ Ø§Ù„Ø±Ù‚Ù… Ø¨Ø§Ù„ÙØ¹Ù„: ${sameParent.fullName}`,
      messageEn: `A parent with the same phone already exists: ${sameParent.fullName}`,
    };
  }

  const sameLead = leads.find((lead) => samePhone(lead.parentPhone, input.phone) || sameName(lead.parentName, input.fullName));
  if (sameLead) {
    return {
      blocking: true,
      messageAr: `Ù‡Ø°Ø§ ÙˆÙ„ÙŠ Ø£Ù…Ø± Ù…ÙˆØ¬ÙˆØ¯ Ø¨Ø§Ù„ÙØ¹Ù„ Ø¯Ø§Ø®Ù„ Ø§Ù„Ø¹Ù…Ù„Ø§Ø¡ Ø§Ù„Ù…Ø­ØªÙ…Ù„ÙŠÙ†: ${sameLead.parentName}`,
      messageEn: `This parent already exists in leads: ${sameLead.parentName}`,
    };
  }

  return null;
}

export async function guardStudentDuplicate(input: {
  fullName: string;
  parentName: string;
  parentPhone: string;
  parentId?: string | null;
}): Promise<DuplicateCheckResult | null> {
  const [students, leads] = await Promise.all([listStudents(), listLeads()]);

  const sameStudent = students.find((student) => {
    if (input.parentId && student.parentId && student.parentId === input.parentId && sameName(student.fullName, input.fullName)) return true;
    if (sameName(student.fullName, input.fullName) && samePhone(student.parentPhone, input.parentPhone)) return true;
    return sameName(student.fullName, input.fullName) && sameName(student.parentName, input.parentName);
  });

  if (sameStudent) {
    return {
      blocking: true,
      messageAr: `ÙŠÙˆØ¬Ø¯ Ø·Ø§Ù„Ø¨ Ù…Ø³Ø¬Ù„ Ø¨Ø§Ù„ÙØ¹Ù„ Ø¨Ù†ÙØ³ Ø§Ù„Ø§Ø³Ù… ØªØ­Øª Ù†ÙØ³ ÙˆÙ„ÙŠ Ø§Ù„Ø£Ù…Ø±: ${sameStudent.fullName}`,
      messageEn: `A student with the same name already exists under the same parent: ${sameStudent.fullName}`,
    };
  }

  const sameLead = leads.find((lead) => sameName(lead.childName, input.fullName) && (samePhone(lead.parentPhone, input.parentPhone) || sameName(lead.parentName, input.parentName)));
  if (sameLead) {
    return {
      blocking: true,
      messageAr: `Ù‡Ø°Ø§ Ø§Ù„Ø·Ø§Ù„Ø¨ Ù…ÙˆØ¬ÙˆØ¯ Ø¨Ø§Ù„ÙØ¹Ù„ ÙÙŠ Ø§Ù„Ø¹Ù…Ù„Ø§Ø¡ Ø§Ù„Ù…Ø­ØªÙ…Ù„ÙŠÙ†: ${sameLead.childName}`,
      messageEn: `This student already exists in leads: ${sameLead.childName}`,
    };
  }

  return null;
}
```

### FILE: src\services\enrollment.service.ts
```ts
import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@/types/database.types";

function getSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key || typeof window === "undefined") return null;
  return createBrowserClient<Database>(url, key);
}

type LeadRow = Database["public"]["Tables"]["leads"]["Row"];
type ParentRow = Database["public"]["Tables"]["parents"]["Row"];
type StudentRow = Database["public"]["Tables"]["students"]["Row"];

function normalizePhone(value: string | null | undefined): string {
  return (value ?? "").replace(/\D/g, "").replace(/^20/, "");
}

function normalizeName(value: string | null | undefined): string {
  return (value ?? "")
    .toLowerCase()
    .replace(/[\u064B-\u065F]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function samePhone(a: string | null | undefined, b: string | null | undefined): boolean {
  const left = normalizePhone(a);
  const right = normalizePhone(b);
  return left.length > 0 && left === right;
}

function sameName(a: string | null | undefined, b: string | null | undefined): boolean {
  const left = normalizeName(a);
  const right = normalizeName(b);
  return left.length > 0 && left === right;
}

function requireParentIdentity(lead: LeadRow): void {
  if (!lead.parent_name || !lead.parent_phone) {
    throw new Error("Ù„Ø§ ÙŠÙ…ÙƒÙ† ØªØ­ÙˆÙŠÙ„ Ø§Ù„Ø¹Ù…ÙŠÙ„ Ø§Ù„Ø­Ø§Ù„ÙŠ Ù„Ø£Ù† Ø§Ø³Ù… ÙˆÙ„ÙŠ Ø§Ù„Ø£Ù…Ø± Ø£Ùˆ Ø±Ù‚Ù… Ø§Ù„Ù‡Ø§ØªÙ ØºÙŠØ± Ù…ÙƒØªÙ…Ù„.");
  }
}

function hasEnoughStudentIdentity(lead: LeadRow): boolean {
  return Boolean(lead.child_name && lead.child_age && lead.child_age >= 4);
}

async function getLeadById(leadId: string, supabase: ReturnType<typeof getSupabaseClient>) {
  const { data, error } = await supabase!
    .from("leads")
    .select("*")
    .eq("id", leadId)
    .maybeSingle();

  if (error || !data) {
    throw new Error(error?.message || "ØªØ¹Ø°Ø± Ø§Ù„Ø¹Ø«ÙˆØ± Ø¹Ù„Ù‰ Ø§Ù„Ø¹Ù…ÙŠÙ„ Ø§Ù„Ù…Ø­ØªÙ…Ù„ Ø§Ù„Ù…Ø·Ù„ÙˆØ¨.");
  }

  return data as LeadRow;
}

function findParent(lead: LeadRow, parents: ParentRow[]): ParentRow | null {
  return (
    parents.find((parent) => lead.parent_id && parent.id === lead.parent_id) ??
    parents.find((parent) => samePhone(parent.phone, lead.parent_phone)) ??
    parents.find((parent) => samePhone(parent.whatsapp, lead.parent_phone)) ??
    parents.find((parent) => sameName(parent.full_name, lead.parent_name)) ??
    null
  );
}

function findStudent(lead: LeadRow, parent: ParentRow, students: StudentRow[]): StudentRow | null {
  return (
    students.find((student) => student.parent_id && student.parent_id === parent.id && sameName(student.full_name, lead.child_name)) ??
    students.find((student) => sameName(student.full_name, lead.child_name) && samePhone(student.parent_phone, parent.phone ?? lead.parent_phone)) ??
    students.find((student) => sameName(student.full_name, lead.child_name) && sameName(student.parent_name, parent.full_name ?? lead.parent_name)) ??
    null
  );
}

async function refreshParentChildrenCount(supabase: ReturnType<typeof getSupabaseClient>, parent: ParentRow, students: StudentRow[]) {
  const linked = students.filter((student) => {
    if (student.parent_id && parent.id && student.parent_id === parent.id) return true;
    if (samePhone(student.parent_phone, parent.phone)) return true;
    return sameName(student.parent_name, parent.full_name);
  }).length;

  await supabase!
    .from("parents")
    .update({ children_count: linked })
    .eq("id", parent.id);
}

async function ensureLeadEnrollmentInternal(
  lead: LeadRow,
  supabase: ReturnType<typeof getSupabaseClient>,
  parents: ParentRow[],
  students: StudentRow[],
): Promise<{ parentId: string; studentId: string | null }> {
  requireParentIdentity(lead);

  let parent = findParent(lead, parents);

  if (!parent) {
    const { data, error } = await supabase!
      .from("parents")
      .insert({
        full_name: lead.parent_name,
        phone: lead.parent_phone,
        whatsapp: lead.parent_whatsapp ?? lead.parent_phone,
        children_count: 0,
        created_at: new Date().toISOString(),
      })
      .select("*")
      .single();

    if (error || !data) {
      throw new Error(error?.message || "ØªØ¹Ø°Ø± Ø¥Ù†Ø´Ø§Ø¡ Ø³Ø¬Ù„ ÙˆÙ„ÙŠ Ø§Ù„Ø£Ù…Ø±.");
    }

    parent = data as ParentRow;
    parents.unshift(parent);
  }

  let student = hasEnoughStudentIdentity(lead) ? findStudent(lead, parent, students) : null;

  if (hasEnoughStudentIdentity(lead) && !student) {
    const { data, error } = await supabase!
      .from("students")
      .insert({
        full_name: lead.child_name,
        age: lead.child_age,
        parent_id: parent.id,
        parent_name: parent.full_name,
        parent_phone: parent.phone ?? lead.parent_phone,
        status: "active",
        current_course: lead.suggested_course ?? null,
        class_name: null,
        enrollment_date: lead.won_at ?? new Date().toISOString(),
        sessions_attended: 0,
        total_paid: 0,
        created_at: new Date().toISOString(),
      })
      .select("*")
      .single();

    if (error || !data) {
      throw new Error(error?.message || "ØªØ¹Ø°Ø± Ø¥Ù†Ø´Ø§Ø¡ Ø³Ø¬Ù„ Ø§Ù„Ø·Ø§Ù„Ø¨.");
    }

    student = data as StudentRow;
    students.unshift(student);
  } else if (student && (!student.parent_id || student.parent_id !== parent.id)) {
    const { data, error } = await supabase!
      .from("students")
      .update({
        parent_id: parent.id,
        parent_name: parent.full_name,
        parent_phone: parent.phone ?? lead.parent_phone,
        current_course: student.current_course ?? lead.suggested_course ?? null,
      })
      .eq("id", student.id)
      .select("*")
      .single();

    if (!error && data) {
      student = data as StudentRow;
      const index = students.findIndex((item) => item.id === student!.id);
      if (index >= 0) students[index] = student;
    }
  }

  if (lead.parent_id !== parent.id || !lead.won_at) {
    await supabase!
      .from("leads")
      .update({
        parent_id: parent.id,
        won_at: lead.won_at ?? new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", lead.id);
  }

  await refreshParentChildrenCount(supabase, parent, students);

  return { parentId: parent.id, studentId: student?.id ?? null };
}

export async function ensureLeadEnrollment(leadId: string): Promise<{ parentId: string; studentId: string | null }> {
  const supabase = getSupabaseClient();
  if (!supabase) {
    throw new Error("ØªØ¹Ø°Ø± Ø§Ù„Ø§ØªØµØ§Ù„ Ø¨Ù‚Ø§Ø¹Ø¯Ø© Ø§Ù„Ø¨ÙŠØ§Ù†Ø§Øª. ØªØ£ÙƒØ¯ Ù…Ù† Ø¥Ø¹Ø¯Ø§Ø¯Ø§Øª Supabase Ø«Ù… Ø£Ø¹Ø¯ Ø§Ù„Ù…Ø­Ø§ÙˆÙ„Ø©.");
  }

  const lead = await getLeadById(leadId, supabase);
  const [{ data: parents, error: parentsError }, { data: students, error: studentsError }] = await Promise.all([
    supabase.from("parents").select("*"),
    supabase.from("students").select("*"),
  ]);

  if (parentsError || studentsError) {
    throw new Error(parentsError?.message || studentsError?.message || "ØªØ¹Ø°Ø± ØªØ­Ù…ÙŠÙ„ Ø¨ÙŠØ§Ù†Ø§Øª Ø§Ù„Ø±Ø¨Ø· Ø§Ù„Ø­Ø§Ù„ÙŠØ©.");
  }

  return ensureLeadEnrollmentInternal(lead, supabase, parents ?? [], students ?? []);
}

export async function syncWonLeadsToEnrollments(): Promise<number> {
  const supabase = getSupabaseClient();
  if (!supabase) return 0;

  const [{ data: leads, error: leadsError }, { data: parents, error: parentsError }, { data: students, error: studentsError }] = await Promise.all([
    supabase.from("leads").select("*").eq("stage", "won").order("created_at", { ascending: false }),
    supabase.from("parents").select("*"),
    supabase.from("students").select("*"),
  ]);

  if (leadsError || parentsError || studentsError) {
    console.error("[enrollment] sync failed", leadsError || parentsError || studentsError);
    return 0;
  }

  let repaired = 0;
  const mutableParents = [...(parents ?? [])] as ParentRow[];
  const mutableStudents = [...(students ?? [])] as StudentRow[];

  for (const lead of leads ?? []) {
    try {
      const parentBefore = mutableParents.length;
      const studentBefore = mutableStudents.length;
      await ensureLeadEnrollmentInternal(lead as LeadRow, supabase, mutableParents, mutableStudents);
      if (mutableParents.length > parentBefore || mutableStudents.length > studentBefore) {
        repaired += 1;
      }
    } catch (error) {
      console.warn("[enrollment] skipped won lead during sync", lead.id, error);
    }
  }

  return repaired;
}


export async function getEnrollmentTargetsForLead(
  leadId: string,
): Promise<{ parentId: string | null; studentId: string | null }> {
  const supabase = getSupabaseClient();
  if (!supabase) {
    return { parentId: null, studentId: null };
  }

  try {
    const lead = await getLeadById(leadId, supabase);
    const [{ data: parents }, { data: students }] = await Promise.all([
      supabase.from("parents").select("*"),
      supabase.from("students").select("*"),
    ]);

    const parent = findParent(lead, (parents ?? []) as ParentRow[]);
    if (!parent) {
      return { parentId: lead.parent_id ?? null, studentId: null };
    }

    const student = findStudent(lead, parent, (students ?? []) as StudentRow[]);
    return { parentId: parent.id, studentId: student?.id ?? null };
  } catch (error) {
    console.warn("[enrollment] failed to resolve enrollment targets", leadId, error);
    return { parentId: null, studentId: null };
  }
}
```

### FILE: src\services\follow-ups.service.ts
```ts
import { createBrowserClient } from "@supabase/ssr";
import type { CommChannel, FollowUpType, LeadStage, Priority } from "@/types/common.types";
import type { Database } from "@/types/database.types";
import type { CreateFollowUpInput, FollowUpItem, LeadActivityItem, LeadListItem } from "@/types/crm";
import { MOCK_FOLLOW_UPS } from "@/lib/mock-data";
import { STAGE_LABELS } from "@/config/labels";
import { isBrowser, readStorage, sortByDateAsc, sortByDateDesc, writeStorage } from "@/services/storage";

const FOLLOW_UPS_KEY = "skidy.crm.follow-ups";
const LEADS_KEY = "skidy.crm.leads";
const ACTIVITIES_KEY = "skidy.crm.lead-activities";
const VALID_TYPES: FollowUpType[] = [
  "first_contact",
  "qualification",
  "trial_reminder",
  "post_trial",
  "no_show",
  "closing",
  "payment_reminder",
  "re_engagement",
];
const VALID_CHANNELS: CommChannel[] = ["whatsapp", "email", "call", "sms"];
const VALID_PRIORITIES: Priority[] = ["low", "medium", "high", "urgent"];

type FollowUpOpenStatus = Exclude<FollowUpItem["status"], "completed">;

function getSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key || !isBrowser()) return null;
  return createBrowserClient<Database>(url, key);
}

function isDemoModeEnabled(): boolean {
  return process.env.NEXT_PUBLIC_ALLOW_DEMO_FALLBACK === "true";
}

function shouldUseDemoFallback(): boolean {
  return !getSupabaseClient() && isDemoModeEnabled();
}

function mockFollowUps(): FollowUpItem[] {
  return MOCK_FOLLOW_UPS.map((item) => ({ ...item }));
}

function asString(value: unknown, fallback = ""): string {
  return typeof value === "string" && value.trim().length > 0 ? value : fallback;
}

function asType(value: unknown): FollowUpType {
  return VALID_TYPES.includes(value as FollowUpType) ? (value as FollowUpType) : "first_contact";
}

function asChannel(value: unknown): CommChannel {
  return VALID_CHANNELS.includes(value as CommChannel) ? (value as CommChannel) : "whatsapp";
}

function asPriority(value: unknown): Priority {
  return VALID_PRIORITIES.includes(value as Priority) ? (value as Priority) : "medium";
}

function resolveOpenStatus(scheduledAt: string): FollowUpOpenStatus {
  const timestamp = new Date(scheduledAt).getTime();
  return timestamp < Date.now() ? "overdue" : "pending";
}

function asStatus(value: unknown, scheduledAt: string): FollowUpItem["status"] {
  if (value === "completed") return "completed";
  return value === "overdue" ? "overdue" : resolveOpenStatus(scheduledAt);
}

function mapRow(row: Database["public"]["Tables"]["follow_ups"]["Row"] | Record<string, unknown>): FollowUpItem {
  const record = row as Record<string, unknown>;
  const scheduledAt = asString(record.scheduled_at ?? record.scheduledAt, new Date().toISOString());
  return {
    id: asString(record.id, crypto.randomUUID()),
    leadId: typeof record.lead_id === "string" ? record.lead_id : null,
    title: asString(record.title, "Ù…ØªØ§Ø¨Ø¹Ø©"),
    leadName: asString(record.lead_name ?? record.leadName, "Ø¹Ù…ÙŠÙ„ ØºÙŠØ± Ù…Ø­Ø¯Ø¯"),
    parentName: asString(record.parent_name ?? record.parentName, "ÙˆÙ„ÙŠ Ø£Ù…Ø± ØºÙŠØ± Ù…Ø­Ø¯Ø¯"),
    type: asType(record.type),
    channel: asChannel(record.channel),
    priority: asPriority(record.priority),
    scheduledAt,
    status: asStatus(record.status, scheduledAt),
    assignedTo: asString(record.assigned_to ?? record.assignedTo, "ØºÙŠØ± Ù…Ø®ØµØµ"),
  };
}

function getLocalFollowUps(): FollowUpItem[] {
  const seed = shouldUseDemoFallback() ? mockFollowUps() : ([] as FollowUpItem[]);
  return sortByDateAsc(readStorage(FOLLOW_UPS_KEY, seed), (item) => item.scheduledAt);
}

function saveLocalFollowUps(items: FollowUpItem[]): void {
  writeStorage(FOLLOW_UPS_KEY, sortByDateAsc(items, (item) => item.scheduledAt));
}

function clearLocalFollowUps(): void {
  writeStorage(FOLLOW_UPS_KEY, []);
}

function getLocalLeads(): LeadListItem[] {
  return sortByDateDesc(readStorage(LEADS_KEY, [] as LeadListItem[]), (lead) => lead.createdAt);
}

function saveLocalLeads(leads: LeadListItem[]): void {
  writeStorage(LEADS_KEY, sortByDateDesc(leads, (lead) => lead.createdAt));
}

function getLocalActivities(): LeadActivityItem[] {
  return sortByDateDesc(readStorage(ACTIVITIES_KEY, [] as LeadActivityItem[]), (activity) => activity.date);
}

function saveLocalActivities(activities: LeadActivityItem[]): void {
  writeStorage(ACTIVITIES_KEY, sortByDateDesc(activities, (activity) => activity.date));
}

function createLeadActivity(leadId: string | null | undefined, action: string, by: string, type: LeadActivityItem["type"]): LeadActivityItem | null {
  if (!leadId) return null;

  const activity: LeadActivityItem = {
    id: crypto.randomUUID(),
    leadId,
    action,
    by,
    type,
    date: new Date().toISOString(),
  };

  saveLocalActivities([activity, ...getLocalActivities()]);

  const supabase = getSupabaseClient();
  if (supabase) {
    void supabase.from("lead_activities").insert({
      lead_id: leadId,
      action: activity.action,
      by_name: activity.by,
      type: activity.type,
      created_at: activity.date,
    });
  }

  return activity;
}

function deriveNextFollowUpAt(leadId: string | null | undefined, items: FollowUpItem[]): string | null {
  if (!leadId) return null;
  const next = items
    .filter((item) => item.leadId === leadId && item.status !== "completed")
    .sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime())[0];
  return next?.scheduledAt ?? null;
}

async function syncLeadNextFollowUp(leadId: string | null | undefined, items: FollowUpItem[]): Promise<void> {
  if (!leadId) return;

  const leads = getLocalLeads();
  const existing = leads.find((lead) => lead.id === leadId);
  if (!existing) return;

  const nextFollowUpAt = deriveNextFollowUpAt(leadId, items);
  const updatedLead: LeadListItem = {
    ...existing,
    nextFollowUpAt,
    lastContactAt: existing.lastContactAt ?? new Date().toISOString(),
  };

  saveLocalLeads(leads.map((lead) => (lead.id === leadId ? updatedLead : lead)));

  const supabase = getSupabaseClient();
  if (!supabase) return;

  await supabase
    .from("leads")
    .update({
      next_follow_up_at: nextFollowUpAt,
      last_contact_at: updatedLead.lastContactAt,
    })
    .eq("id", leadId);
}

export async function listFollowUps(): Promise<FollowUpItem[]> {
  const demoFallback = shouldUseDemoFallback() ? getLocalFollowUps() : [];
  const supabase = getSupabaseClient();
  if (!supabase) return demoFallback;

  try {
    const { data, error } = await supabase
      .from("follow_ups")
      .select("*")
      .order("scheduled_at", { ascending: true });

    if (error) {
      console.error("[follow-ups] failed to load from Supabase", error);
      clearLocalFollowUps();
      return [];
    }

    if (!data || data.length === 0) {
      clearLocalFollowUps();
      return [];
    }

    const mapped = data.map((row: Database["public"]["Tables"]["follow_ups"]["Row"]) => mapRow(row));
    saveLocalFollowUps(mapped);
    return mapped;
  } catch (error) {
    console.error("[follow-ups] unexpected load failure", error);
    clearLocalFollowUps();
    return [];
  }
}

export async function listFollowUpsByLead(leadId: string): Promise<FollowUpItem[]> {
  const demoFallback = shouldUseDemoFallback() ? getLocalFollowUps().filter((item) => item.leadId === leadId) : [];
  const supabase = getSupabaseClient();
  if (!supabase) return demoFallback;

  try {
    const { data, error } = await supabase
      .from("follow_ups")
      .select("*")
      .eq("lead_id", leadId)
      .order("scheduled_at", { ascending: true });

    if (error) {
      console.error("[follow-ups] failed to load lead follow-ups", error);
      const rest = getLocalFollowUps().filter((item) => item.leadId !== leadId);
      saveLocalFollowUps(rest);
      return [];
    }

    if (!data || data.length === 0) {
      const rest = getLocalFollowUps().filter((item) => item.leadId !== leadId);
      saveLocalFollowUps(rest);
      return [];
    }

    const mapped = data.map((row: Database["public"]["Tables"]["follow_ups"]["Row"]) => mapRow(row));
    const rest = getLocalFollowUps().filter((item) => item.leadId !== leadId);
    saveLocalFollowUps([...rest, ...mapped]);
    return mapped;
  } catch (error) {
    console.error("[follow-ups] unexpected lead follow-ups failure", error);
    return [];
  }
}

export async function createFollowUp(input: CreateFollowUpInput): Promise<FollowUpItem> {
  const scheduledAt = input.scheduledAt;
  const item: FollowUpItem = {
    id: crypto.randomUUID(),
    leadId: input.leadId ?? null,
    leadName: input.leadName,
    parentName: input.parentName,
    title: input.title,
    type: input.type,
    channel: input.channel,
    priority: input.priority,
    scheduledAt,
    status: resolveOpenStatus(scheduledAt),
    assignedTo: input.assignedTo,
  };

  const current = getLocalFollowUps();
  const next = [...current, item];
  saveLocalFollowUps(next);

  const typeLabel = item.type === "trial_reminder" ? "ØªØ°ÙƒÙŠØ± Ø¨Ø§Ù„Ø³ÙŠØ´Ù† Ø§Ù„ØªØ¬Ø±ÙŠØ¨ÙŠØ©" : item.title;
  createLeadActivity(item.leadId, `ØªÙ… Ø¥Ù†Ø´Ø§Ø¡ Ù…ØªØ§Ø¨Ø¹Ø© Ø¬Ø¯ÙŠØ¯Ø©: ${typeLabel}`, item.assignedTo, "contact");
  await syncLeadNextFollowUp(item.leadId, next);

  const supabase = getSupabaseClient();
  if (!supabase) {
    if (shouldUseDemoFallback()) return item;
    throw new Error("Supabase client is not available");
  }

  try {
    const { data, error } = await supabase
      .from("follow_ups")
      .insert({
        lead_id: item.leadId,
        title: item.title,
        lead_name: item.leadName,
        parent_name: item.parentName,
        type: item.type,
        channel: item.channel,
        priority: item.priority,
        scheduled_at: item.scheduledAt,
        status: item.status,
        assigned_to: item.assignedTo,
      })
      .select("*")
      .maybeSingle();

    if (!error && data) {
      const synced = mapRow(data);
      const merged = getLocalFollowUps().map((existing) => (existing.id === item.id ? synced : existing));
      saveLocalFollowUps(merged);
      await syncLeadNextFollowUp(item.leadId, merged);
      return synced;
    }
  } catch (error) {
    console.error("[follow-ups] create failed", error);
    if (shouldUseDemoFallback()) return item;
    throw error instanceof Error ? error : new Error("Failed to create follow-up");
  }

  return item;
}

async function updateFollowUpStatus(
  id: string,
  status: FollowUpItem["status"],
): Promise<FollowUpItem | null> {
  const current = getLocalFollowUps();
  const existing = current.find((item) => item.id === id);
  if (!existing) return null;

  const nextStatus = status === "completed" ? "completed" : resolveOpenStatus(existing.scheduledAt);
  const updated: FollowUpItem = { ...existing, status: nextStatus };
  const merged = current.map((item) => (item.id === id ? updated : item));
  saveLocalFollowUps(merged);

  if (updated.leadId) {
    const action = nextStatus === "completed"
      ? `ØªÙ… Ø¥Ù†Ù‡Ø§Ø¡ Ù…ØªØ§Ø¨Ø¹Ø© ${updated.title}`
      : `ØªÙ…Øª Ø¥Ø¹Ø§Ø¯Ø© ÙØªØ­ Ù…ØªØ§Ø¨Ø¹Ø© ${updated.title}`;
    createLeadActivity(updated.leadId, action, updated.assignedTo, nextStatus === "completed" ? "contact" : "note");
  }

  await syncLeadNextFollowUp(updated.leadId, merged);

  const supabase = getSupabaseClient();
  if (!supabase) {
    if (shouldUseDemoFallback()) return updated;
    throw new Error("Supabase client is not available");
  }

  try {
    await supabase
      .from("follow_ups")
      .update({
        status: nextStatus,
        completed_at: nextStatus === "completed" ? new Date().toISOString() : null,
      })
      .eq("id", id);
  } catch (error) {
    console.error("[follow-ups] status update failed", error);
    if (shouldUseDemoFallback()) return updated;
    throw error instanceof Error ? error : new Error("Failed to update follow-up status");
  }

  return updated;
}

export async function markFollowUpCompleted(id: string): Promise<FollowUpItem | null> {
  return updateFollowUpStatus(id, "completed");
}

export async function reopenFollowUp(id: string): Promise<FollowUpItem | null> {
  return updateFollowUpStatus(id, "pending");
}

export function suggestFollowUpTypeByStage(stage: LeadStage): FollowUpType {
  switch (stage) {
    case "new":
      return "first_contact";
    case "qualified":
      return "qualification";
    case "trial_proposed":
    case "trial_booked":
      return "trial_reminder";
    case "trial_attended":
      return "post_trial";
    case "offer_sent":
      return "closing";
    case "lost":
      return "re_engagement";
    default:
      return "payment_reminder";
  }
}

export function suggestFollowUpTitle(stage: LeadStage, childName: string): string {
  switch (stage) {
    case "new":
      return `Ø£ÙˆÙ„ ØªÙˆØ§ØµÙ„ â€” ${childName}`;
    case "qualified":
      return `Ø§Ø³ØªÙƒÙ…Ø§Ù„ Ø§Ù„ØªØ£Ù‡ÙŠÙ„ â€” ${childName}`;
    case "trial_proposed":
      return `ØªØ£ÙƒÙŠØ¯ Ù…ÙˆØ¹Ø¯ Ø§Ù„Ø³ÙŠØ´Ù† â€” ${childName}`;
    case "trial_booked":
      return `ØªØ°ÙƒÙŠØ± Ø¨Ø§Ù„Ø³ÙŠØ´Ù† â€” ${childName}`;
    case "trial_attended":
      return `Ù…ØªØ§Ø¨Ø¹Ø© Ø¨Ø¹Ø¯ Ø§Ù„Ø³ÙŠØ´Ù† â€” ${childName}`;
    case "offer_sent":
      return `Ù…ØªØ§Ø¨Ø¹Ø© Ø§Ù„Ø¹Ø±Ø¶ â€” ${childName}`;
    case "lost":
      return `Ø¥Ø¹Ø§Ø¯Ø© ØªÙˆØ§ØµÙ„ â€” ${childName}`;
    default:
      return `Ù…ØªØ§Ø¨Ø¹Ø© Ø§Ù„Ø¯ÙØ¹ â€” ${childName}`;
  }
}
```

### FILE: src\services\leads.service.ts
```ts
import { createBrowserClient } from "@supabase/ssr";
import { STAGE_LABELS } from "@/config/labels";
import type { LeadStage, LeadTemperature, LossReason } from "@/types/common.types";
import type { Database } from "@/types/database.types";
import type {
  CreateLeadInput,
  LeadActivityItem,
  LeadListItem,
  UpdateLeadInput,
} from "@/types/crm";
import { MOCK_LEADS, MOCK_LEAD_ACTIVITIES, MOCK_TEAM } from "@/lib/mock-data";
import { isBrowser, readStorage, sortByDateDesc, writeStorage } from "@/services/storage";

const LEADS_KEY = "skidy.crm.leads";
const ACTIVITIES_KEY = "skidy.crm.lead-activities";

const VALID_STAGES: LeadStage[] = [
  "new",
  "qualified",
  "trial_proposed",
  "trial_booked",
  "trial_attended",
  "offer_sent",
  "won",
  "lost",
];

const VALID_TEMPERATURES: LeadTemperature[] = ["hot", "warm", "cold"];
const VALID_LOSS_REASONS: LossReason[] = [
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

function getSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key || !isBrowser()) return null;
  return createBrowserClient<Database>(url, key);
}

function isDemoModeEnabled(): boolean {
  return process.env.NEXT_PUBLIC_ALLOW_DEMO_FALLBACK === "true";
}

function shouldUseDemoFallback(): boolean {
  return !getSupabaseClient() && isDemoModeEnabled();
}

function mockLeads(): LeadListItem[] {
  return MOCK_LEADS.map((lead) => ({ ...lead }));
}

function mockActivities(): LeadActivityItem[] {
  return MOCK_LEAD_ACTIVITIES.map((activity) => ({ ...activity }));
}

function getLocalLeads(): LeadListItem[] {
  const seed = shouldUseDemoFallback() ? mockLeads() : ([] as LeadListItem[]);
  return sortByDateDesc(readStorage(LEADS_KEY, seed), (lead) => lead.createdAt);
}

function saveLocalLeads(leads: LeadListItem[]): void {
  writeStorage(LEADS_KEY, sortByDateDesc(leads, (lead) => lead.createdAt));
}

function clearLocalLeads(): void {
  writeStorage(LEADS_KEY, []);
}

function getLocalActivities(): LeadActivityItem[] {
  const seed = shouldUseDemoFallback() ? mockActivities() : ([] as LeadActivityItem[]);
  return sortByDateDesc(readStorage(ACTIVITIES_KEY, seed), (activity) => activity.date);
}

function saveLocalActivities(activities: LeadActivityItem[]): void {
  writeStorage(ACTIVITIES_KEY, sortByDateDesc(activities, (activity) => activity.date));
}

function clearLocalActivities(): void {
  writeStorage(ACTIVITIES_KEY, []);
}

function asString(value: unknown, fallback = ""): string {
  return typeof value === "string" && value.trim().length > 0 ? value : fallback;
}

function asNullableString(value: unknown): string | null {
  return typeof value === "string" && value.trim().length > 0 ? value : null;
}

function asNumber(value: unknown, fallback = 0): number {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
  }
  return fallback;
}

function asStage(value: unknown): LeadStage {
  return VALID_STAGES.includes(value as LeadStage) ? (value as LeadStage) : "new";
}

function asTemperature(value: unknown): LeadTemperature {
  return VALID_TEMPERATURES.includes(value as LeadTemperature)
    ? (value as LeadTemperature)
    : "warm";
}

function asLossReason(value: unknown): LossReason | null {
  return VALID_LOSS_REASONS.includes(value as LossReason)
    ? (value as LossReason)
    : null;
}

function isUuid(value: string | null | undefined): value is string {
  return typeof value === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

async function resolveAssignedToUuid(preferred: string): Promise<string | null> {
  const supabase = getSupabaseClient();
  if (!supabase) return isUuid(preferred) ? preferred : null;

  if (isUuid(preferred)) return preferred;

  try {
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error || !user?.id || !isUuid(user.id)) return null;
    return user.id;
  } catch {
    return null;
  }
}

function mapLeadRow(row: Database["public"]["Tables"]["leads"]["Row"] | Record<string, unknown>): LeadListItem {
  const record = row as Record<string, unknown>;
  return {
    id: asString(record.id, crypto.randomUUID()),
    parentName: asString(record.parent_name ?? record.parentName, "ÙˆÙ„ÙŠ Ø£Ù…Ø± ØºÙŠØ± Ù…Ø­Ø¯Ø¯"),
    parentPhone: asString(record.parent_phone ?? record.parentPhone, "â€”"),
    childName: asString(record.child_name ?? record.childName, "Ø·ÙÙ„ Ø¨Ø¯ÙˆÙ† Ø§Ø³Ù…"),
    childAge: asNumber(record.child_age ?? record.childAge, 0),
    stage: asStage(record.stage),
    temperature: asTemperature(record.temperature),
    source: asString(record.source, "other") as LeadListItem["source"],
    suggestedCourse: asNullableString(record.suggested_course ?? record.suggestedCourse) as LeadListItem["suggestedCourse"],
    assignedTo: asString(record.assigned_to ?? record.assignedTo, ""),
    assignedToName: asString(record.assigned_to_name ?? record.assignedToName, "ØºÙŠØ± Ù…Ø®ØµØµ"),
    lastContactAt: asNullableString(record.last_contact_at ?? record.lastContactAt),
    nextFollowUpAt: asNullableString(record.next_follow_up_at ?? record.nextFollowUpAt),
    notes: asNullableString(record.notes),
    createdAt: asString(record.created_at ?? record.createdAt, new Date().toISOString()),
    lossReason: asLossReason(record.loss_reason ?? record.lossReason),
  };
}

function mapActivityRow(row: Database["public"]["Tables"]["lead_activities"]["Row"] | Record<string, unknown>): LeadActivityItem {
  const record = row as Record<string, unknown>;
  return {
    id: asString(record.id, crypto.randomUUID()),
    leadId: asString(record.lead_id ?? record.leadId),
    action: asString(record.action, "ØªØ­Ø¯ÙŠØ« Ø¹Ù„Ù‰ Ø§Ù„Ø¹Ù…ÙŠÙ„"),
    date: asString(record.created_at ?? record.date, new Date().toISOString()),
    by: asString(record.by_name ?? record.by, "Ø§Ù„Ù†Ø¸Ø§Ù…"),
    type: (["create", "contact", "stage", "note"] as const).includes(record.type as LeadActivityItem["type"])
      ? (record.type as LeadActivityItem["type"])
      : "note",
  };
}

async function syncLeadsFromSupabase(): Promise<LeadListItem[] | null> {
  const supabase = getSupabaseClient();
  if (!supabase) return null;

  const { data, error } = await supabase.from("leads").select("*").order("created_at", { ascending: false });
  if (error) {
    console.error("[leads] failed to load from Supabase", error);
    clearLocalLeads();
    return [];
  }

  if (!data || data.length === 0) {
    clearLocalLeads();
    return [];
  }

  const mapped = data.map((row: Database["public"]["Tables"]["leads"]["Row"]) => mapLeadRow(row));
  saveLocalLeads(mapped);
  return mapped;
}

async function syncActivitiesFromSupabase(leadId: string): Promise<LeadActivityItem[] | null> {
  const supabase = getSupabaseClient();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from("lead_activities")
    .select("*")
    .eq("lead_id", leadId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[lead_activities] failed to load from Supabase", error);
    const existing = getLocalActivities().filter((activity) => activity.leadId !== leadId);
    saveLocalActivities(existing);
    return [];
  }

  if (!data || data.length === 0) {
    const existing = getLocalActivities().filter((activity) => activity.leadId !== leadId);
    saveLocalActivities(existing);
    return [];
  }

  const mapped = data.map((row: Database["public"]["Tables"]["lead_activities"]["Row"]) => mapActivityRow(row));
  const existing = getLocalActivities().filter((activity) => activity.leadId !== leadId);
  saveLocalActivities([...existing, ...mapped]);
  return mapped;
}

export async function listLeads(): Promise<LeadListItem[]> {
  const demoFallback = shouldUseDemoFallback() ? getLocalLeads() : [];
  try {
    return (await syncLeadsFromSupabase()) ?? demoFallback;
  } catch (error) {
    console.error("[leads] unexpected load failure", error);
    clearLocalLeads();
    return [];
  }
}

export async function getLeadById(id: string): Promise<LeadListItem | null> {
  const local = getLocalLeads().find((lead) => lead.id === id);
  if (local) return local;

  const supabase = getSupabaseClient();
  if (!supabase) return null;

  try {
    const { data, error } = await supabase.from("leads").select("*").eq("id", id).maybeSingle();
    if (error || !data) return null;
    const mapped = mapLeadRow(data);
    const next = [mapped, ...getLocalLeads().filter((lead) => lead.id !== id)];
    saveLocalLeads(next);
    return mapped;
  } catch {
    return null;
  }
}

export async function listLeadActivities(leadId: string): Promise<LeadActivityItem[]> {
  const demoFallback = shouldUseDemoFallback() ? getLocalActivities().filter((activity) => activity.leadId === leadId) : [];
  try {
    return (await syncActivitiesFromSupabase(leadId)) ?? demoFallback;
  } catch (error) {
    console.error("[lead_activities] unexpected load failure", error);
    return [];
  }
}

export async function createLead(input: CreateLeadInput): Promise<LeadListItem> {
  const createdAt = new Date().toISOString();
  const draftLead: LeadListItem = {
    id: crypto.randomUUID(),
    childName: input.childName,
    childAge: input.childAge,
    parentName: input.parentName,
    parentPhone: input.parentPhone,
    stage: "new",
    temperature: input.temperature,
    source: input.source,
    suggestedCourse: input.suggestedCourse,
    assignedTo: input.assignedTo,
    assignedToName:
      input.assignedToName ||
      MOCK_TEAM.find((member) => member.id === input.assignedTo)?.name ||
      "ØºÙŠØ± Ù…Ø®ØµØµ",
    lastContactAt: null,
    nextFollowUpAt: null,
    notes: input.notes ?? null,
    createdAt,
    lossReason: null,
  };

  const supabase = getSupabaseClient();

  if (!supabase) {
    if (!shouldUseDemoFallback()) {
      throw new Error("ØªØ¹Ø°Ø± Ø§Ù„Ø§ØªØµØ§Ù„ Ø¨Ù‚Ø§Ø¹Ø¯Ø© Ø§Ù„Ø¨ÙŠØ§Ù†Ø§Øª. Ø£Ø¹Ø¯ Ø§Ù„Ù…Ø­Ø§ÙˆÙ„Ø© Ø¨Ø¹Ø¯ ØªØ³Ø¬ÙŠÙ„ Ø§Ù„Ø¯Ø®ÙˆÙ„ Ø£Ùˆ Ø§Ù„ØªØ­Ù‚Ù‚ Ù…Ù† Ø§Ù„Ø¥Ø¹Ø¯Ø§Ø¯Ø§Øª.");
    }

    const current = getLocalLeads();
    saveLocalLeads([draftLead, ...current]);

    const demoActivity: LeadActivityItem = {
      id: crypto.randomUUID(),
      leadId: draftLead.id,
      action: "ØªÙ… Ø¥Ù†Ø´Ø§Ø¡ Ø§Ù„Ø¹Ù…ÙŠÙ„ Ø§Ù„Ù…Ø­ØªÙ…Ù„",
      date: createdAt,
      by: draftLead.assignedToName,
      type: "create",
    };
    saveLocalActivities([demoActivity, ...getLocalActivities()]);

    return draftLead;
  }

  try {
    const assignedToUuid = await resolveAssignedToUuid(input.assignedTo);
    if (!assignedToUuid) {
      throw new Error("ØªØ¹Ø°Ø± ØªØ­Ø¯ÙŠØ¯ Ø§Ù„Ù…Ø³Ø¤ÙˆÙ„ Ø§Ù„ØµØ­ÙŠØ­ Ø¹Ù† Ø§Ù„Ø¹Ù…ÙŠÙ„. ØªØ£ÙƒØ¯ Ù…Ù† ØªØ³Ø¬ÙŠÙ„ Ø§Ù„Ø¯Ø®ÙˆÙ„ Ø£Ùˆ Ø¨ÙŠØ§Ù†Ø§Øª Ø§Ù„Ù…Ø³Ø¤ÙˆÙ„.");
    }

    const insertPayload: Database["public"]["Tables"]["leads"]["Insert"] = {
      parent_name: draftLead.parentName,
      parent_phone: draftLead.parentPhone,
      parent_whatsapp: input.parentWhatsapp ?? null,
      child_name: draftLead.childName,
      child_age: draftLead.childAge,
      stage: draftLead.stage,
      temperature: draftLead.temperature,
      source: draftLead.source as Database["public"]["Enums"]["lead_source"],
      has_laptop: input.hasLaptop ?? false,
      has_prior_experience: input.hasPriorExperience ?? false,
      child_interests: input.childInterests ?? null,
      suggested_course: draftLead.suggestedCourse as Database["public"]["Enums"]["course_type"] | null,
      price_range_shared: false,
      whatsapp_collected: Boolean((input.parentWhatsapp ?? input.parentPhone).trim()),
      assigned_to: assignedToUuid,
      notes: draftLead.notes,
      created_at: draftLead.createdAt,
    };

    const { data, error } = await supabase
      .from("leads")
      .insert(insertPayload)
      .select("*")
      .single();

    if (error) {
      console.error("[leads] create failed", error);
      throw new Error(error.message || "ØªØ¹Ø°Ø± Ø­ÙØ¸ Ø§Ù„Ø¹Ù…ÙŠÙ„ ÙÙŠ Ù‚Ø§Ø¹Ø¯Ø© Ø§Ù„Ø¨ÙŠØ§Ù†Ø§Øª");
    }

    if (!data) {
      throw new Error("ØªÙ… Ø¥Ø±Ø³Ø§Ù„ Ø·Ù„Ø¨ Ø§Ù„Ø­ÙØ¸ Ù„ÙƒÙ† Ù„Ù… ÙŠØ±Ø¬Ø¹ Ø£ÙŠ Ø³Ø¬Ù„ Ù…Ù† Ù‚Ø§Ø¹Ø¯Ø© Ø§Ù„Ø¨ÙŠØ§Ù†Ø§Øª");
    }

    const synced = mapLeadRow(data);
    const current = getLocalLeads().filter((item) => item.id !== synced.id);
    saveLocalLeads([{ ...synced, assignedToName: draftLead.assignedToName }, ...current]);

    const activityPayload: Database["public"]["Tables"]["lead_activities"]["Insert"] = {
      lead_id: synced.id,
      action: "ØªÙ… Ø¥Ù†Ø´Ø§Ø¡ Ø§Ù„Ø¹Ù…ÙŠÙ„ Ø§Ù„Ù…Ø­ØªÙ…Ù„",
      type: "create",
      created_at: createdAt,
    };

    const { error: activityError } = await supabase.from("lead_activities").insert(activityPayload);
    if (activityError) {
      console.warn("[lead_activities] create activity failed", activityError);
    }

    return { ...synced, assignedToName: draftLead.assignedToName };
  } catch (error) {
    console.error("[leads] create failed", error);
    throw error instanceof Error ? error : new Error("ØªØ¹Ø°Ø± Ø­ÙØ¸ Ø§Ù„Ø¹Ù…ÙŠÙ„");
  }
}

export async function updateLead(
  leadId: string,
  input: UpdateLeadInput,
  actorName = input.assignedToName || "Ø§Ù„Ù†Ø¸Ø§Ù…",
): Promise<LeadListItem | null> {
  const current = getLocalLeads();
  const existing = current.find((lead) => lead.id === leadId);
  if (!existing) return null;

  const updated: LeadListItem = {
    ...existing,
    childName: input.childName,
    childAge: input.childAge,
    parentName: input.parentName,
    parentPhone: input.parentPhone,
    source: input.source,
    temperature: input.temperature,
    suggestedCourse: input.suggestedCourse,
    assignedTo: input.assignedTo,
    assignedToName: input.assignedToName,
    notes: input.notes ?? null,
    stage: input.stage ?? existing.stage,
    lossReason: input.lossReason ?? existing.lossReason ?? null,
    nextFollowUpAt: input.nextFollowUpAt ?? existing.nextFollowUpAt,
    lastContactAt: new Date().toISOString(),
  };

  saveLocalLeads(current.map((lead) => (lead.id === leadId ? updated : lead)));

  const activity: LeadActivityItem = {
    id: crypto.randomUUID(),
    leadId,
    action: "ØªÙ… ØªØ­Ø¯ÙŠØ« Ø¨ÙŠØ§Ù†Ø§Øª Ø§Ù„Ø¹Ù…ÙŠÙ„",
    date: new Date().toISOString(),
    by: actorName,
    type: "note",
  };
  saveLocalActivities([activity, ...getLocalActivities()]);

  const supabase = getSupabaseClient();
  if (!supabase) {
    if (shouldUseDemoFallback()) return updated;
    throw new Error("Supabase client is not available");
  }

  try {
    const assignedToUuid = await resolveAssignedToUuid(updated.assignedTo);
    if (!assignedToUuid) {
      throw new Error("ØªØ¹Ø°Ø± ØªØ­Ø¯ÙŠØ¯ Ø§Ù„Ù…Ø³Ø¤ÙˆÙ„ Ø§Ù„ØµØ­ÙŠØ­ Ø¹Ù† Ø§Ù„Ø¹Ù…ÙŠÙ„.");
    }

    const { error: updateError } = await supabase
      .from("leads")
      .update({
        parent_name: updated.parentName,
        parent_phone: updated.parentPhone,
        child_name: updated.childName,
        child_age: updated.childAge,
        stage: updated.stage,
        temperature: updated.temperature,
        source: updated.source as Database["public"]["Enums"]["lead_source"],
        suggested_course: updated.suggestedCourse as Database["public"]["Enums"]["course_type"] | null,
        assigned_to: assignedToUuid,
        notes: updated.notes,
        loss_reason: updated.lossReason,
        next_follow_up_at: updated.nextFollowUpAt,
        last_contact_at: updated.lastContactAt,
      })
      .eq("id", leadId);

    if (updateError) {
      throw updateError;
    }

    const { error: activityError } = await supabase.from("lead_activities").insert({
      lead_id: leadId,
      action: activity.action,
      type: activity.type,
      created_at: activity.date,
    });

    if (activityError) {
      console.warn("[lead_activities] update activity failed", activityError);
    }
  } catch (error) {
    console.error("[leads] update failed", error);
    if (shouldUseDemoFallback()) return updated;
    throw error instanceof Error ? error : new Error("Failed to update lead");
  }

  return updated;
}

export async function updateLeadStage(
  leadId: string,
  stage: LeadStage,
  actorName: string,
): Promise<LeadListItem | null> {
  const current = getLocalLeads();
  const existing = current.find((lead) => lead.id === leadId);
  if (!existing) return null;

  const updated: LeadListItem = {
    ...existing,
    stage,
    lastContactAt: new Date().toISOString(),
  };

  saveLocalLeads(current.map((lead) => (lead.id === leadId ? updated : lead)));

  const activity: LeadActivityItem = {
    id: crypto.randomUUID(),
    leadId,
    action: `ØªÙ… Ù†Ù‚Ù„ Ø§Ù„Ù…Ø±Ø­Ù„Ø© Ø¥Ù„Ù‰ ${STAGE_LABELS[stage]}`,
    date: new Date().toISOString(),
    by: actorName,
    type: "stage",
  };
  saveLocalActivities([activity, ...getLocalActivities()]);

  const supabase = getSupabaseClient();
  if (!supabase) {
    if (shouldUseDemoFallback()) return updated;
    throw new Error("Supabase client is not available");
  }

  try {
    await supabase
      .from("leads")
      .update({
        stage,
        last_contact_at: updated.lastContactAt,
      })
      .eq("id", leadId);

    await supabase.from("lead_activities").insert({
      lead_id: leadId,
      action: activity.action,
      type: activity.type,
      created_at: activity.date,
    });
  } catch (error) {
    console.error("[leads] stage update failed", error);
    if (shouldUseDemoFallback()) return updated;
    throw error instanceof Error ? error : new Error("Failed to update lead stage");
  }

  return updated;
}
```

### FILE: src\services\operations.service.ts
```ts

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
        title: t(locale, `Ù…ØªØ§Ø¨Ø¹Ø© Ù…ØªØ£Ø®Ø±Ø©: ${item.leadName}`, `Overdue follow-up: ${item.leadName}`),
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
        title: t(locale, `Ù…ØªØ§Ø¨Ø¹Ø© Ø§Ù„ÙŠÙˆÙ…: ${item.leadName}`, `Today follow-up: ${item.leadName}`),
        description: t(locale, item.title, item.title),
        href: item.leadId ? `/leads/${item.leadId}` : "/follow-ups",
        category: "follow_up" as const,
        priority: "high" as const,
        owner: item.assignedTo,
        meta: formatDate(item.scheduledAt, locale),
      })),
      ...leadsWithoutFollowUp.map((lead) => ({
        id: `lead-missing-next-${lead.id}`,
        title: t(locale, `Ø¹Ù…ÙŠÙ„ Ø¨Ù„Ø§ Ù…ØªØ§Ø¨Ø¹Ø© Ù‚Ø§Ø¯Ù…Ø©: ${lead.childName}`, `Lead without next follow-up: ${lead.childName}`),
        description: t(locale, `${lead.parentName} â€¢ ${lead.parentPhone}`, `${lead.parentName} â€¢ ${lead.parentPhone}`),
        href: `/leads/${lead.id}`,
        category: "lead" as const,
        priority: "high" as const,
        owner: lead.assignedToName,
        meta: t(locale, "ØºÙŠØ± Ù…Ø­Ø¯Ø¯", "Not scheduled"),
      })),
      ...trialBookedStale.map((lead) => ({
        id: `trial-stale-${lead.id}`,
        title: t(locale, `Ø³ÙŠØ´Ù† ØªØ¬Ø±ÙŠØ¨ÙŠØ© ØªØ­ØªØ§Ø¬ ØªØ£ÙƒÙŠØ¯: ${lead.childName}`, `Trial session needs confirmation: ${lead.childName}`),
        description: t(locale, `${lead.parentName} â€¢ ${lead.assignedToName}`, `${lead.parentName} â€¢ ${lead.assignedToName}`),
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
      title: t(locale, `Ø¯ÙØ¹Ø© Ù…ØªØ£Ø®Ø±Ø©: ${payment.parentName}`, `Overdue payment: ${payment.parentName}`),
      description: t(locale, `${payment.studentName} â€¢ ${formatCurrencyEgp(payment.amount, locale)}`, `${payment.studentName} â€¢ ${formatCurrencyEgp(payment.amount, locale)}`),
      href: `/payments/${payment.id}`,
      category: "payment" as const,
      priority: "critical" as const,
      meta: formatDate(payment.dueDate, locale),
    })),
    ...atRiskStudents.map((student) => ({
      id: `student-risk-${student.id}`,
      title: t(locale, `Ø·Ø§Ù„Ø¨ Ø¨Ø­Ø§Ø¬Ø© Ù…ØªØ§Ø¨Ø¹Ø©: ${student.fullName}`, `Student at risk: ${student.fullName}`),
      description: t(locale, `${student.parentName} â€¢ ${student.className ?? "Ø¨Ø¯ÙˆÙ† Ù…Ø¬Ù…ÙˆØ¹Ø©"}`, `${student.parentName} â€¢ ${student.className ?? "No group"}`),
      href: `/students/${student.id}`,
      category: "student" as const,
      priority: "high" as const,
      meta: student.currentCourse ?? undefined,
    })),
  );

  mediumPriority.push(
    ...dueTodayPayments.map((payment) => ({
      id: `payment-today-${payment.id}`,
      title: t(locale, `Ø§Ø³ØªØ­Ù‚Ø§Ù‚ Ø§Ù„ÙŠÙˆÙ…: ${payment.parentName}`, `Due today: ${payment.parentName}`),
      description: t(locale, `${payment.studentName} â€¢ ${formatCurrencyEgp(payment.amount, locale)}`, `${payment.studentName} â€¢ ${formatCurrencyEgp(payment.amount, locale)}`),
      href: `/payments/${payment.id}`,
      category: "payment" as const,
      priority: "medium" as const,
      meta: formatDate(payment.dueDate, locale),
    })),
    ...dueTodayTrials.map((student) => ({
      id: `trial-student-${student.id}`,
      title: t(locale, `Ø·Ø§Ù„Ø¨ ØªØ¬Ø±ÙŠØ¨ÙŠ ÙŠØ­ØªØ§Ø¬ Ù…ØªØ§Ø¨Ø¹Ø©: ${student.fullName}`, `Trial student needs follow-up: ${student.fullName}`),
      description: t(locale, `${student.parentName} â€¢ ${student.currentCourse ?? "Ø¨Ø¯ÙˆÙ† ÙƒÙˆØ±Ø³"}`, `${student.parentName} â€¢ ${student.currentCourse ?? "No course"}`),
      href: `/students/${student.id}`,
      category: "student" as const,
      priority: "medium" as const,
    })),
  );

  informational.push(
    ...todaySessions.map((session) => ({
      id: `session-${session.id}`,
      title: t(locale, `Ø¬Ù„Ø³Ø© Ø§Ù„ÙŠÙˆÙ…: ${session.className}`, `Today's session: ${session.className}`),
      description: t(locale, `${session.teacher} â€¢ ${session.startTime} - ${session.endTime}`, `${session.teacher} â€¢ ${session.startTime} - ${session.endTime}`),
      href: `/schedule/${session.id}`,
      category: "schedule" as const,
      priority: "info" as const,
      meta: getDayLabel(session.day, locale),
    })),
  );

  const metrics: ActionCenterMetric[] = isOpsRole(context.role)
    ? [
        {
          label: t(locale, "Ø·Ù„Ø§Ø¨ Ø¨Ø­Ø§Ø¬Ø© Ù…ØªØ§Ø¨Ø¹Ø©", "Students at risk"),
          value: atRiskStudents.length.toLocaleString(numberLocale),
          tone: atRiskStudents.length > 0 ? "warning" : "success",
        },
        {
          label: t(locale, "Ù…Ø¯ÙÙˆØ¹Ø§Øª Ù…ØªØ£Ø®Ø±Ø©", "Overdue payments"),
          value: overduePayments.length.toLocaleString(numberLocale),
          tone: overduePayments.length > 0 ? "danger" : "success",
        },
        {
          label: t(locale, "Ø¬Ù„Ø³Ø§Øª Ø§Ù„ÙŠÙˆÙ…", "Today's sessions"),
          value: todaySessions.length.toLocaleString(numberLocale),
          tone: "info",
        },
        {
          label: t(locale, "Ø­Ù…ÙˆÙ„Ø© Ø§Ù„Ø£Ø³Ø¨ÙˆØ¹", "Weekly load"),
          value: scheduleOverview.sessionsCount.toLocaleString(numberLocale),
          tone: "brand",
        },
      ]
    : [
        {
          label: t(locale, "Ø¥Ø¬Ø±Ø§Ø¡Ø§Øª Ø­Ø±Ø¬Ø©", "Critical actions"),
          value: critical.length.toLocaleString(numberLocale),
          tone: critical.length > 0 ? "danger" : "success",
        },
        {
          label: t(locale, "ØªØ­ØµÙŠÙ„ Ø§Ù„Ø´Ù‡Ø±", "Collection rate"),
          value: `${paymentsSummary.collectionRate}%`,
          tone: paymentsSummary.collectionRate >= 80 ? "success" : paymentsSummary.collectionRate >= 60 ? "warning" : "danger",
        },
        {
          label: t(locale, "Ø¬Ù„Ø³Ø§Øª Ø§Ù„ÙŠÙˆÙ…", "Today's sessions"),
          value: todaySessions.length.toLocaleString(numberLocale),
          tone: "info",
        },
        {
          label: t(locale, "Ø§Ù„Ø¹Ù…Ù„Ø§Ø¡ Ø§Ù„Ù…ÙØªÙˆØ­ÙˆÙ† Ø¨Ù„Ø§ Ù…ØªØ§Ø¨Ø¹Ø©", "Open leads without follow-up"),
          value: leadsWithoutFollowUp.length.toLocaleString(numberLocale),
          tone: leadsWithoutFollowUp.length > 0 ? "warning" : "success",
        },
      ];

  const notifications: AppNotificationItem[] = [...critical, ...mediumPriority]
    .slice(0, 6)
    .map((item, index) => ({
      id: item.id,
      title: item.title,
      timeLabel: item.meta ?? t(locale, "Ø§Ù„Ø¢Ù†", "Now"),
      href: item.href,
      type: item.priority === "critical" ? "warning" : item.priority === "high" ? "warning" : item.priority === "medium" ? "info" : "success",
      readDefault: index > 1,
    }));

  if (notifications.length === 0) {
    notifications.push({
      id: "healthy-system",
      title: t(locale, "Ù„Ø§ ØªÙˆØ¬Ø¯ ØªÙ†Ø¨ÙŠÙ‡Ø§Øª Ø­Ø±Ø¬Ø© Ø§Ù„Ø¢Ù†", "No urgent alerts right now"),
      timeLabel: t(locale, "Ø§Ù„Ø¢Ù†", "Now"),
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
```

### FILE: src\services\owner-summary.service.ts
```ts
import { listLeads } from "@/services/leads.service";
import { listParentsWithRelations, listStudentsWithRelations } from "@/services/relations.service";

export interface OwnerSnapshotItem {
  key: string;
  displayName: string;
  leadCount: number;
  wonLeadCount: number;
  parentCount: number;
  studentCount: number;
}

function normalizeName(value: string | null | undefined): string {
  return (value ?? "").trim().toLowerCase();
}

function titleize(value: string | null | undefined): string {
  const trimmed = (value ?? "").trim();
  return trimmed.length > 0 ? trimmed : "Unassigned";
}

export async function getOwnerSnapshot(): Promise<OwnerSnapshotItem[]> {
  const [leads, students, parents] = await Promise.all([
    listLeads(),
    listStudentsWithRelations(),
    listParentsWithRelations(),
  ]);

  const bucket = new Map<string, OwnerSnapshotItem>();

  const ensure = (name: string | null | undefined) => {
    const key = normalizeName(name) || '__unassigned__';
    if (!bucket.has(key)) {
      bucket.set(key, {
        key,
        displayName: titleize(name),
        leadCount: 0,
        wonLeadCount: 0,
        parentCount: 0,
        studentCount: 0,
      });
    }
    return bucket.get(key)!;
  };

  leads.forEach((lead) => {
    const entry = ensure(lead.assignedToName);
    entry.leadCount += 1;
    if (lead.stage === 'won') entry.wonLeadCount += 1;
  });

  parents.forEach((parent) => {
    const entry = ensure(parent.ownerName);
    entry.parentCount += 1;
  });

  students.forEach((student) => {
    const entry = ensure(student.ownerName);
    entry.studentCount += 1;
  });

  return Array.from(bucket.values()).sort((a, b) => (b.studentCount + b.parentCount + b.leadCount) - (a.studentCount + a.parentCount + a.leadCount));
}
```

### FILE: src\services\parents.service.ts
```ts
import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@/types/database.types";
import type { CreateParentInput, ParentListItem } from "@/types/crm";
import { isBrowser, readStorage, writeStorage } from "@/services/storage";

const PARENTS_KEY = "skidy.crm.parents";

function getSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key || !isBrowser()) return null;
  return createBrowserClient<Database>(url, key);
}

function sortParents(items: ParentListItem[]): ParentListItem[] {
  return [...items].sort((a, b) => a.fullName.localeCompare(b.fullName, "ar"));
}

function asString(value: unknown, fallback = ""): string {
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : fallback;
}

function asNullableString(value: unknown): string | null {
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : null;
}

function asNumber(value: unknown, fallback = 0): number {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
  }
  return fallback;
}

function normalizePhone(value: string | null | undefined): string {
  return (value ?? "").replace(/\D/g, "").replace(/^20/, "");
}

function normalizeName(value: string | null | undefined): string {
  return (value ?? "")
    .toLowerCase()
    .replace(/[\u064B-\u065F]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function mapRow(
  row: Database["public"]["Tables"]["parents"]["Row"] | Record<string, unknown>,
): ParentListItem {
  const record = row as Record<string, unknown>;

  return {
    id: asString(record.id, crypto.randomUUID()),
    fullName: asString(record.full_name ?? record.fullName, "ÙˆÙ„ÙŠ Ø£Ù…Ø± ØºÙŠØ± Ù…Ø­Ø¯Ø¯"),
    phone: asString(record.phone, "â€”"),
    whatsapp: asNullableString(record.whatsapp),
    email: asNullableString(record.email),
    city: asNullableString(record.city),
    childrenCount: asNumber(record.children_count ?? record.childrenCount, 0),
    children: [],
  };
}

function getLocalParents(): ParentListItem[] {
  return sortParents(readStorage(PARENTS_KEY, [] as ParentListItem[]));
}

function saveLocalParents(items: ParentListItem[]): void {
  writeStorage(PARENTS_KEY, sortParents(items));
}

function clearLocalParents(): void {
  writeStorage(PARENTS_KEY, []);
}

function findExistingParent(items: ParentListItem[], input: CreateParentInput): ParentListItem | null {
  const phone = normalizePhone(input.phone);
  const whatsapp = normalizePhone(input.whatsapp);
  const name = normalizeName(input.fullName);

  return (
    items.find((parent) => phone.length > 0 && normalizePhone(parent.phone) === phone) ??
    items.find((parent) => whatsapp.length > 0 && normalizePhone(parent.whatsapp) === whatsapp) ??
    items.find((parent) => name.length > 0 && normalizeName(parent.fullName) === name && phone.length > 0 && normalizePhone(parent.phone) === phone) ??
    null
  );
}

export async function listParents(): Promise<ParentListItem[]> {
  const supabase = getSupabaseClient();
  if (!supabase) {
    clearLocalParents();
    return [];
  }

  try {
    const { data, error } = await supabase
      .from("parents")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("[parents] failed to load from Supabase", error);
      clearLocalParents();
      return [];
    }

    if (!data || data.length === 0) {
      clearLocalParents();
      return [];
    }

    const mapped = data.map((row: Database["public"]["Tables"]["parents"]["Row"]) => mapRow(row));
    saveLocalParents(mapped);
    return mapped;
  } catch (error) {
    console.error("[parents] unexpected load failure", error);
    clearLocalParents();
    return [];
  }
}

export async function getParentById(id: string): Promise<ParentListItem | null> {
  const items = await listParents();
  return items.find((parent) => parent.id === id) ?? null;
}

export async function createParent(input: CreateParentInput): Promise<ParentListItem> {
  const fullName = input.fullName.trim();
  const phone = input.phone.trim();

  if (!fullName || !phone) {
    throw new Error("Ø§Ø³Ù… ÙˆÙ„ÙŠ Ø§Ù„Ø£Ù…Ø± ÙˆØ±Ù‚Ù… Ø§Ù„Ù‡Ø§ØªÙ Ù…Ø·Ù„ÙˆØ¨Ø§Ù†.");
  }

  const supabase = getSupabaseClient();
  if (!supabase) {
    throw new Error("ØªØ¹Ø°Ø± Ø§Ù„Ø§ØªØµØ§Ù„ Ø¨Ù‚Ø§Ø¹Ø¯Ø© Ø§Ù„Ø¨ÙŠØ§Ù†Ø§Øª. ØªØ£ÙƒØ¯ Ù…Ù† Ø¥Ø¹Ø¯Ø§Ø¯Ø§Øª Supabase Ø«Ù… Ø£Ø¹Ø¯ Ø§Ù„Ù…Ø­Ø§ÙˆÙ„Ø©.");
  }

  const existing = findExistingParent(await listParents(), input);
  if (existing) {
    return existing;
  }

  const payload: Database["public"]["Tables"]["parents"]["Insert"] = {
    full_name: fullName,
    phone,
    whatsapp: input.whatsapp?.trim() || phone,
    email: input.email?.trim() || null,
    city: input.city?.trim() || null,
    children_count: input.childrenCount ?? 0,
    created_at: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from("parents")
    .insert(payload)
    .select("*")
    .single();

  if (error || !data) {
    console.error("[parents] create failed", error);
    throw new Error(error?.message || "ØªØ¹Ø°Ø± Ø¥Ù†Ø´Ø§Ø¡ Ø³Ø¬Ù„ ÙˆÙ„ÙŠ Ø§Ù„Ø£Ù…Ø±.");
  }

  const created = mapRow(data);
  saveLocalParents([created, ...getLocalParents().filter((item) => item.id !== created.id)]);
  return created;
}
```

### FILE: src\services\payments.service.ts
```ts
import { createBrowserClient } from "@supabase/ssr";

import type { PaymentMethod, PaymentStatus } from "@/types/common.types";
import type { Database } from "@/types/database.types";
import type { CreatePaymentInput, PaymentDetails, PaymentItem } from "@/types/crm";
import { isBrowser, sortByDateAsc, sortByDateDesc } from "@/services/storage";
import { listParents } from "@/services/parents.service";
import { listStudents } from "@/services/students.service";

const VALID_METHODS: PaymentMethod[] = ["bank_transfer", "card", "wallet", "cash", "instapay"];
const VALID_STATUSES: PaymentStatus[] = ["paid", "pending", "overdue", "refunded", "partial"];
const PAYMENT_META_PREFIX = "__SKIDY_PAYMENT_META__:";
const DEFAULT_SESSION_BLOCK = 4;

type PaymentRow = Database["public"]["Tables"]["payments"]["Row"];
type PaymentInsert = Database["public"]["Tables"]["payments"]["Insert"];
type PaymentUpdate = Database["public"]["Tables"]["payments"]["Update"];

interface PaymentMeta {
  sessionsCovered?: number;
  blockStartDate?: string | null;
  blockEndDate?: string | null;
  deferredUntil?: string | null;
  invoiceNumber?: string | null;
  invoiceIssuedAt?: string | null;
  publicNote?: string | null;
  archivedAt?: string | null;
  archivedBy?: string | null;
}

interface PaymentArchiveState {
  archived: boolean;
  archivedAt: string | null;
  archivedBy: string | null;
}

interface ListPaymentsOptions {
  includeArchived?: boolean;
}

function getSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key || !isBrowser()) return null;
  return createBrowserClient<Database>(url, key);
}

function getTodayDateKey(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function asString(value: unknown, fallback = ""): string {
  return typeof value === "string" && value.trim().length > 0 ? value : fallback;
}

function asNullableString(value: unknown): string | null {
  return typeof value === "string" && value.trim().length > 0 ? value : null;
}

function asNumber(value: unknown, fallback = 0): number {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
  }
  return fallback;
}

function asStatus(value: unknown): PaymentStatus {
  return VALID_STATUSES.includes(value as PaymentStatus) ? (value as PaymentStatus) : "pending";
}

function asMethod(value: unknown): PaymentMethod | null {
  return VALID_METHODS.includes(value as PaymentMethod) ? (value as PaymentMethod) : null;
}

function normalizeDateKey(value: string | null | undefined): string | null {
  if (!value || typeof value !== "string") return null;
  return value.slice(0, 10);
}

function normalizeSessionBlock(value: number | null | undefined): number {
  const numeric = typeof value === "number" && Number.isFinite(value) ? value : DEFAULT_SESSION_BLOCK;
  return Math.max(DEFAULT_SESSION_BLOCK, Math.ceil(numeric / DEFAULT_SESSION_BLOCK) * DEFAULT_SESSION_BLOCK);
}

function parsePaymentMeta(raw: string | null | undefined): { publicNote: string | null; meta: PaymentMeta } {
  const value = typeof raw === "string" ? raw : "";
  if (!value.startsWith(PAYMENT_META_PREFIX)) {
    return { publicNote: value || null, meta: {} };
  }

  const [header, ...rest] = value.split("\n");
  let meta: PaymentMeta = {};
  try {
    meta = JSON.parse(header.slice(PAYMENT_META_PREFIX.length)) as PaymentMeta;
  } catch {
    meta = {};
  }

  const publicNote = rest.join("\n").trim();
  return {
    publicNote: publicNote || meta.publicNote || null,
    meta,
  };
}

function buildPaymentNotes(publicNote: string | null | undefined, meta: PaymentMeta): string {
  const compactMeta: PaymentMeta = {
    sessionsCovered: normalizeSessionBlock(meta.sessionsCovered ?? DEFAULT_SESSION_BLOCK),
    blockStartDate: meta.blockStartDate ?? null,
    blockEndDate: meta.blockEndDate ?? null,
    deferredUntil: meta.deferredUntil ?? null,
    invoiceNumber: meta.invoiceNumber ?? null,
    invoiceIssuedAt: meta.invoiceIssuedAt ?? null,
    publicNote: publicNote?.trim() ? publicNote.trim() : null,
    archivedAt: meta.archivedAt ?? null,
    archivedBy: meta.archivedBy ?? null,
  };

  const parts = [`${PAYMENT_META_PREFIX}${JSON.stringify(compactMeta)}`];
  if (publicNote?.trim()) parts.push(publicNote.trim());
  return parts.join("\n");
}

function getArchiveStateFromNotes(rawNotes: string | null | undefined): PaymentArchiveState {
  const { meta } = parsePaymentMeta(rawNotes);
  return {
    archived: Boolean(meta.archivedAt),
    archivedAt: meta.archivedAt ?? null,
    archivedBy: meta.archivedBy ?? null,
  };
}

function sortPayments(items: PaymentItem[]): PaymentItem[] {
  return sortByDateDesc(items, (payment) => getPaymentEffectiveDueDate(payment));
}

function generateInvoiceNumber(existing: PaymentItem[]): string {
  const year = new Date().getFullYear();
  const maxSequence = existing.reduce((max, payment) => {
    const source = payment.invoiceNumber ?? "";
    const match = source.match(/SKR-(\d{4})-(\d{4,})/);
    if (!match) return max;
    const [, rawYear, rawSequence] = match;
    if (Number(rawYear) !== year) return max;
    const next = Number(rawSequence);
    return Number.isFinite(next) ? Math.max(max, next) : max;
  }, 0);

  return `SKR-${year}-${String(maxSequence + 1).padStart(4, "0")}`;
}

function getEffectiveDueDate(payment: Pick<PaymentItem, "dueDate" | "deferredUntil">): string {
  return payment.deferredUntil && payment.deferredUntil.length > 0 ? payment.deferredUntil : payment.dueDate;
}

function isDeferredPayment(payment: Pick<PaymentItem, "status" | "deferredUntil">): boolean {
  if (!payment.deferredUntil) return false;
  return payment.status === "pending" || payment.status === "overdue";
}

function isPastDate(value: string): boolean {
  const dateKey = normalizeDateKey(value);
  if (!dateKey) return false;
  return dateKey < getTodayDateKey();
}

function mapPaymentRow(
  row: PaymentRow | Record<string, unknown>,
  studentsMap: Map<string, Awaited<ReturnType<typeof listStudents>>[number]>,
  parentsMap: Map<string, Awaited<ReturnType<typeof listParents>>[number]>,
): PaymentItem {
  const record = row as Record<string, unknown>;
  const studentId = asNullableString(record.student_id ?? record.studentId);
  const student = studentId ? studentsMap.get(studentId) ?? null : null;
  const parent = student?.parentId ? parentsMap.get(student.parentId) ?? null : null;
  const rawNotes = asNullableString(record.notes);
  const { publicNote, meta } = parsePaymentMeta(rawNotes);

  return {
    id: asString(record.id, crypto.randomUUID()),
    studentId,
    studentName: student?.fullName ?? asString(record.student_name ?? record.studentName, "Ø·Ø§Ù„Ø¨ ØºÙŠØ± Ù…Ø­Ø¯Ø¯"),
    parentId: student?.parentId ?? parent?.id ?? asNullableString(record.parent_id ?? record.parentId),
    parentName:
      parent?.fullName ?? student?.parentName ?? asString(record.parent_name ?? record.parentName, "ÙˆÙ„ÙŠ Ø£Ù…Ø± ØºÙŠØ± Ù…Ø­Ø¯Ø¯"),
    amount: asNumber(record.amount),
    status: asStatus(record.status),
    method: asMethod(record.method),
    dueDate: asString(record.due_date ?? record.dueDate, new Date().toISOString()),
    paidAt: asNullableString(record.paid_at ?? record.paidAt),
    notes: rawNotes,
    publicNote,
    sessionsCovered: normalizeSessionBlock(meta.sessionsCovered ?? DEFAULT_SESSION_BLOCK),
    blockStartDate: meta.blockStartDate ?? null,
    blockEndDate: meta.blockEndDate ?? null,
    deferredUntil: meta.deferredUntil ?? null,
    invoiceNumber: meta.invoiceNumber ?? null,
    invoiceIssuedAt: meta.invoiceIssuedAt ?? null,
  } satisfies PaymentItem;
}

async function buildMaps() {
  const [students, parents] = await Promise.all([listStudents(), listParents()]);
  return {
    students,
    parents,
    studentsMap: new Map(students.map((student) => [student.id, student] as const)),
    parentsMap: new Map(parents.map((parent) => [parent.id, parent] as const)),
  };
}

function assertSupabaseConfigured() {
  const supabase = getSupabaseClient();
  if (!supabase) {
    throw new Error("Supabase client is not available in the current browser session.");
  }
  return supabase;
}

async function readPaymentRows(): Promise<PaymentRow[]> {
  const supabase = assertSupabaseConfigured();
  const { data, error } = await supabase.from("payments").select("*").order("due_date", { ascending: false });

  if (error) {
    console.error("[payments] failed to load from Supabase", error);
    throw new Error(error.message || "Failed to load payments");
  }

  return (data ?? []) as PaymentRow[];
}

function toPaymentInsert(input: {
  id: string;
  studentId: string;
  amount: number;
  status: PaymentStatus;
  method: PaymentMethod | null;
  dueDate: string;
  paidAt: string | null;
  notes: string;
}): PaymentInsert {
  return {
    id: input.id,
    student_id: input.studentId,
    amount: input.amount,
    status: input.status,
    method: input.method,
    due_date: input.dueDate,
    paid_at: input.paidAt,
    notes: input.notes,
  } satisfies PaymentInsert;
}

function toPaymentStatusUpdate(payment: PaymentItem, status: PaymentStatus, method: PaymentMethod | null, paidAt: string | null): PaymentUpdate {
  return {
    status,
    method,
    paid_at: paidAt,
    notes: payment.notes,
  } satisfies PaymentUpdate;
}

export async function listPayments(options: ListPaymentsOptions = {}): Promise<PaymentItem[]> {
  const { includeArchived = false } = options;
  const supabase = getSupabaseClient();
  if (!supabase) return [];

  try {
    const [rows, { studentsMap, parentsMap }] = await Promise.all([readPaymentRows(), buildMaps()]);
    const mapped = rows.map((row) => mapPaymentRow(row, studentsMap, parentsMap));

    if (includeArchived) {
      return sortPayments(mapped);
    }

    return sortPayments(mapped.filter((payment) => !getPaymentArchiveState(payment).archived));
  } catch (error) {
    console.error("[payments] unexpected load failure", error);
    return [];
  }
}

export async function getPaymentById(id: string, options: ListPaymentsOptions = {}): Promise<PaymentItem | null> {
  const items = await listPayments({ includeArchived: options.includeArchived ?? true });
  return items.find((payment) => payment.id === id) ?? null;
}

export async function getPaymentDetails(id: string): Promise<PaymentDetails | null> {
  const [allPayments, activePayments, students, parents] = await Promise.all([
    listPayments({ includeArchived: true }),
    listPayments(),
    listStudents(),
    listParents(),
  ]);

  const payment = allPayments.find((item) => item.id === id) ?? null;
  if (!payment) return null;

  const archiveState = getPaymentArchiveState(payment);
  const student = payment.studentId ? students.find((item) => item.id === payment.studentId) ?? null : null;
  const parent = payment.parentId
    ? parents.find((item) => item.id === payment.parentId) ?? null
    : parents.find((item) => item.fullName === payment.parentName || item.phone === student?.parentPhone) ?? null;

  const siblingPayments = activePayments.filter((item) => {
    if (item.id === payment.id) return false;
    if (parent?.id && item.parentId === parent.id) return true;
    return item.parentName === payment.parentName;
  });

  const paymentHistory = sortPayments(
    activePayments.filter((item) => item.studentId && item.studentId === payment.studentId),
  );

  return {
    ...payment,
    notes: payment.notes,
    publicNote: payment.publicNote,
    student,
    parent,
    siblingPayments,
    paymentHistory: archiveState.archived ? paymentHistory.filter((item) => item.id !== payment.id) : paymentHistory,
  };
}

export async function listPaymentsByStudent(studentId: string): Promise<PaymentItem[]> {
  const payments = await listPayments();
  return payments.filter((payment) => payment.studentId === studentId);
}

export async function createPayment(input: CreatePaymentInput): Promise<PaymentItem> {
  if (!input.studentId) {
    throw new Error("Student is required before creating a payment.");
  }

  if (!Number.isFinite(input.amount) || input.amount <= 0) {
    throw new Error("Payment amount must be greater than zero.");
  }

  const supabase = assertSupabaseConfigured();
  const [{ studentsMap, parentsMap }, current] = await Promise.all([
    buildMaps(),
    listPayments({ includeArchived: true }),
  ]);
  const student = studentsMap.get(input.studentId) ?? null;
  const parent = student?.parentId ? parentsMap.get(student.parentId) ?? null : null;
  const now = new Date().toISOString();
  const paymentId = crypto.randomUUID();
  const invoiceNumber = generateInvoiceNumber(current);
  const sessionsCovered = normalizeSessionBlock(input.sessionsCovered ?? DEFAULT_SESSION_BLOCK);
  const notes = buildPaymentNotes(input.notes, {
    sessionsCovered,
    blockStartDate: input.blockStartDate ?? null,
    blockEndDate: input.blockEndDate ?? null,
    deferredUntil: input.deferredUntil ?? null,
    invoiceNumber,
    invoiceIssuedAt: now,
  });

  const payment: PaymentItem = {
    id: paymentId,
    studentId: input.studentId,
    studentName: student?.fullName ?? "Ø·Ø§Ù„Ø¨ ØºÙŠØ± Ù…Ø­Ø¯Ø¯",
    parentId: student?.parentId ?? parent?.id ?? null,
    parentName: parent?.fullName ?? student?.parentName ?? "ÙˆÙ„ÙŠ Ø£Ù…Ø± ØºÙŠØ± Ù…Ø­Ø¯Ø¯",
    amount: input.amount,
    status: input.status,
    method: input.method,
    dueDate: input.dueDate,
    paidAt: input.status === "paid" || input.status === "partial" ? now : null,
    notes,
    publicNote: input.notes?.trim() ? input.notes.trim() : null,
    sessionsCovered,
    blockStartDate: input.blockStartDate ?? null,
    blockEndDate: input.blockEndDate ?? null,
    deferredUntil: input.deferredUntil ?? null,
    invoiceNumber,
    invoiceIssuedAt: now,
  };

  const { error } = await supabase.from("payments").insert(
    toPaymentInsert({
      id: paymentId,
      studentId: input.studentId,
      amount: input.amount,
      status: input.status,
      method: input.method,
      dueDate: input.dueDate,
      paidAt: payment.paidAt,
      notes,
    }),
  );

  if (error) {
    console.error("[payments] create failed", error);
    throw new Error(error.message || "Failed to create payment");
  }

  return payment;
}

export async function updatePaymentStatus(id: string, status: PaymentStatus, method?: PaymentMethod | null): Promise<PaymentItem | null> {
  const current = await listPayments({ includeArchived: true });
  const existing = current.find((payment) => payment.id === id) ?? null;
  if (!existing) return null;

  const archiveState = getPaymentArchiveState(existing);
  if (archiveState.archived) {
    throw new Error("Archived payments cannot be updated until they are restored.");
  }

  const nextPaidAt = status === "paid" || status === "partial" ? new Date().toISOString() : null;
  const nextMethod = method === undefined ? existing.method : method;
  const nextDeferredUntil = status === "paid" ? null : existing.deferredUntil;
  const nextNotes = buildPaymentNotes(existing.publicNote, {
    sessionsCovered: existing.sessionsCovered,
    blockStartDate: existing.blockStartDate,
    blockEndDate: existing.blockEndDate,
    deferredUntil: nextDeferredUntil,
    invoiceNumber: existing.invoiceNumber,
    invoiceIssuedAt: existing.invoiceIssuedAt,
    archivedAt: null,
    archivedBy: null,
  });

  const nextItem: PaymentItem = {
    ...existing,
    status,
    method: nextMethod,
    paidAt: nextPaidAt,
    deferredUntil: nextDeferredUntil,
    notes: nextNotes,
  };

  const supabase = assertSupabaseConfigured();
  const { error } = await supabase
    .from("payments")
    .update(toPaymentStatusUpdate(nextItem, status, nextMethod, nextPaidAt))
    .eq("id", id);

  if (error) {
    console.error("[payments] status update failed", error);
    throw new Error(error.message || "Failed to update payment status");
  }

  return nextItem;
}

export async function archivePayment(id: string, archivedBy?: string | null): Promise<PaymentItem | null> {
  const current = await listPayments({ includeArchived: true });
  const existing = current.find((payment) => payment.id === id) ?? null;
  if (!existing) return null;

  const archiveState = getPaymentArchiveState(existing);
  if (archiveState.archived) return existing;

  const now = new Date().toISOString();
  const nextNotes = buildPaymentNotes(existing.publicNote, {
    sessionsCovered: existing.sessionsCovered,
    blockStartDate: existing.blockStartDate,
    blockEndDate: existing.blockEndDate,
    deferredUntil: existing.deferredUntil,
    invoiceNumber: existing.invoiceNumber,
    invoiceIssuedAt: existing.invoiceIssuedAt,
    archivedAt: now,
    archivedBy: archivedBy ?? null,
  });

  const nextItem: PaymentItem = {
    ...existing,
    notes: nextNotes,
  };

  const supabase = assertSupabaseConfigured();
  const { error } = await supabase.from("payments").update({ notes: nextNotes } satisfies PaymentUpdate).eq("id", id);

  if (error) {
    console.error("[payments] archive failed", error);
    throw new Error(error.message || "Failed to archive payment");
  }

  return nextItem;
}

export async function restoreArchivedPayment(id: string): Promise<PaymentItem | null> {
  const current = await listPayments({ includeArchived: true });
  const existing = current.find((payment) => payment.id === id) ?? null;
  if (!existing) return null;

  const archiveState = getPaymentArchiveState(existing);
  if (!archiveState.archived) return existing;

  const nextNotes = buildPaymentNotes(existing.publicNote, {
    sessionsCovered: existing.sessionsCovered,
    blockStartDate: existing.blockStartDate,
    blockEndDate: existing.blockEndDate,
    deferredUntil: existing.deferredUntil,
    invoiceNumber: existing.invoiceNumber,
    invoiceIssuedAt: existing.invoiceIssuedAt,
    archivedAt: null,
    archivedBy: null,
  });

  const nextItem: PaymentItem = {
    ...existing,
    notes: nextNotes,
  };

  const supabase = assertSupabaseConfigured();
  const { error } = await supabase.from("payments").update({ notes: nextNotes } satisfies PaymentUpdate).eq("id", id);

  if (error) {
    console.error("[payments] restore failed", error);
    throw new Error(error.message || "Failed to restore payment");
  }

  return nextItem;
}

export async function deletePayment(id: string): Promise<boolean> {
  const supabase = assertSupabaseConfigured();
  const { error } = await supabase.from("payments").delete().eq("id", id);

  if (error) {
    console.error("[payments] delete failed", error);
    throw new Error(error.message || "Failed to delete payment");
  }

  return true;
}

export function getPaymentArchiveState(payment: Pick<PaymentItem, "notes">): PaymentArchiveState {
  return getArchiveStateFromNotes(payment.notes);
}

export function buildInvoiceShareMessage(payment: PaymentItem, locale: "ar" | "en" = "ar"): string {
  const effectiveDueDate = getPaymentEffectiveDueDate(payment).slice(0, 10);

  if (locale === "ar") {
    return [
      `ÙØ§ØªÙˆØ±Ø© ${payment.invoiceNumber ?? payment.id}`,
      `Ø§Ù„Ø·Ø§Ù„Ø¨: ${payment.studentName}`,
      `ÙˆÙ„ÙŠ Ø§Ù„Ø£Ù…Ø±: ${payment.parentName}`,
      `Ø¹Ø¯Ø¯ Ø§Ù„Ø¬Ù„Ø³Ø§Øª: ${payment.sessionsCovered}`,
      `Ø§Ù„Ù…Ø¨Ù„Øº: ${payment.amount} Ø¬.Ù…`,
      `Ø§Ù„Ø§Ø³ØªØ­Ù‚Ø§Ù‚ Ø§Ù„ÙØ¹Ù„ÙŠ: ${effectiveDueDate}`,
      payment.deferredUntil ? `Ù…Ø¤Ø¬Ù„ Ø­ØªÙ‰: ${payment.deferredUntil.slice(0, 10)}` : null,
      `Ø´Ø±ÙƒØ© Skidy Rein`,
    ]
      .filter(Boolean)
      .join("\n");
  }

  return [
    `Invoice ${payment.invoiceNumber ?? payment.id}`,
    `Student: ${payment.studentName}`,
    `Parent: ${payment.parentName}`,
    `Sessions: ${payment.sessionsCovered}`,
    `Amount: EGP ${payment.amount}`,
    `Effective due date: ${effectiveDueDate}`,
    payment.deferredUntil ? `Deferred until: ${payment.deferredUntil.slice(0, 10)}` : null,
    `Skidy Rein`,
  ]
    .filter(Boolean)
    .join("\n");
}

export async function getPaymentsSummary() {
  const payments = await listPayments();
  const totalExpected = payments.reduce((sum, payment) => sum + payment.amount, 0);
  const totalCollected = payments
    .filter((payment) => payment.status === "paid" || payment.status === "partial")
    .reduce((sum, payment) => sum + payment.amount, 0);
  const totalOverdue = payments
    .filter((payment) => payment.status === "overdue")
    .reduce((sum, payment) => sum + payment.amount, 0);
  const today = getTodayDateKey();
  const dueToday = payments.filter((payment) => normalizeDateKey(getEffectiveDueDate(payment)) === today).length;
  const deferredCount = payments.filter((payment) => isDeferredPayment(payment) && !isPastDate(getEffectiveDueDate(payment))).length;
  const upcoming = sortByDateAsc(
    payments.filter((payment) => {
      if (payment.status !== "pending" && payment.status !== "overdue") return false;
      const effectiveDue = normalizeDateKey(getEffectiveDueDate(payment));
      return Boolean(effectiveDue && effectiveDue >= today);
    }),
    (payment) => getEffectiveDueDate(payment),
  ).slice(0, 5);

  return {
    totalExpected,
    totalCollected,
    totalOverdue,
    dueToday,
    deferredCount,
    collectionRate: totalExpected > 0 ? Math.round((totalCollected / totalExpected) * 100) : 0,
    upcoming,
  };
}

export function getPaymentDisplayState(payment: PaymentItem): "paid" | "pending" | "overdue" | "partial" | "refunded" | "deferred" {
  if (isDeferredPayment(payment) && !isPastDate(getEffectiveDueDate(payment))) return "deferred";
  return payment.status;
}

export function getPaymentEffectiveDueDate(payment: Pick<PaymentItem, "dueDate" | "deferredUntil">): string {
  return getEffectiveDueDate({ dueDate: payment.dueDate, deferredUntil: payment.deferredUntil });
}

export function getBillingCycleText(
  payment: Pick<PaymentItem, "sessionsCovered" | "blockStartDate" | "blockEndDate" | "deferredUntil">,
  locale: "ar" | "en" = "ar",
): string {
  const sessions = normalizeSessionBlock(payment.sessionsCovered ?? DEFAULT_SESSION_BLOCK);

  if (locale === "ar") {
    const dateRange = payment.blockStartDate || payment.blockEndDate
      ? ` â€” ${payment.blockStartDate?.slice(0, 10) ?? "..."} â†’ ${payment.blockEndDate?.slice(0, 10) ?? "..."}`
      : "";
    const deferred = payment.deferredUntil ? ` â€” Ù…Ø¤Ø¬Ù„Ø© Ø­ØªÙ‰ ${payment.deferredUntil.slice(0, 10)}` : "";
    return `Ø¨Ø§Ù‚Ø© ${sessions} Ø¬Ù„Ø³Ø§Øª${dateRange}${deferred}`;
  }

  const dateRange = payment.blockStartDate || payment.blockEndDate
    ? ` â€” ${payment.blockStartDate?.slice(0, 10) ?? "..."} â†’ ${payment.blockEndDate?.slice(0, 10) ?? "..."}`
    : "";
  const deferred = payment.deferredUntil ? ` â€” deferred until ${payment.deferredUntil.slice(0, 10)}` : "";
  return `${sessions}-session billing block${dateRange}${deferred}`;
}
```

### FILE: src\services\relations.service.ts
```ts
import type { CourseType } from "@/types/common.types";
import type {
  LeadListItem,
  ParentDetails,
  ParentListItem,
  ScheduleSessionItem,
  StudentDetails,
  StudentListItem,
  TeacherDetails,
  TeacherListItem,
} from "@/types/crm";
import { listLeads } from "@/services/leads.service";
import { listParents } from "@/services/parents.service";
import { listScheduleSessions } from "@/services/schedule.service";
import { getStudentById, listStudents } from "@/services/students.service";
import { listTeachers } from "@/services/teachers.service";
import { getTeacherEvaluation } from "@/services/teacher-evaluations.service";

const LEAD_PARENT_PROJECTION_PREFIX = "lead-projection-parent:";
const LEAD_STUDENT_PROJECTION_PREFIX = "lead-projection-student:";

function normalizeName(value: string | null | undefined): string {
  return (value ?? "")
    .toLowerCase()
    .replace(/Ø£\.?\s*/g, "")
    .replace(/[\u064B-\u065F]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizePhone(value: string | null | undefined): string {
  const digits = (value ?? "").replace(/\D/g, "");
  if (digits.startsWith("20") && digits.length > 11) return digits.slice(2);
  if (digits.startsWith("2") && digits.length === 12) return digits.slice(1);
  return digits;
}

function samePhone(a: string | null | undefined, b: string | null | undefined): boolean {
  const left = normalizePhone(a);
  const right = normalizePhone(b);
  return left.length > 0 && left === right;
}

function sameName(a: string | null | undefined, b: string | null | undefined): boolean {
  const left = normalizeName(a);
  const right = normalizeName(b);
  return left.length > 0 && left === right;
}

function findParentForStudent(student: StudentListItem, parents: ParentListItem[]): ParentListItem | null {
  if (student.parentId) {
    const direct = parents.find((parent) => parent.id === student.parentId);
    if (direct) return direct;
  }

  return (
    parents.find((parent) => samePhone(parent.phone, student.parentPhone)) ??
    parents.find((parent) => sameName(parent.fullName, student.parentName)) ??
    null
  );
}

function findStudentsForParent(parent: ParentListItem, students: StudentListItem[]): StudentListItem[] {
  return students.filter((student) => {
    if (student.parentId && student.parentId === parent.id) return true;
    if (samePhone(student.parentPhone, parent.phone)) return true;
    return sameName(student.parentName, parent.fullName);
  });
}

function scoreSessionForStudent(student: StudentListItem, session: ScheduleSessionItem): number {
  let score = 0;
  if (student.className && sameName(student.className, session.className)) score += 100;
  if (student.currentCourse && student.currentCourse === session.course) score += 10;
  return score;
}

function findSessionsForStudent(student: StudentListItem, sessions: ScheduleSessionItem[]): ScheduleSessionItem[] {
  return sessions
    .map((session) => ({ session, score: scoreSessionForStudent(student, session) }))
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score || a.session.day - b.session.day || a.session.startTime.localeCompare(b.session.startTime))
    .map((item) => item.session);
}

function findSessionsForTeacher(teacher: TeacherListItem, sessions: ScheduleSessionItem[]): ScheduleSessionItem[] {
  return sessions.filter((session) => {
    if (session.teacherId && session.teacherId === teacher.id) return true;
    const sessionTeacher = normalizeName(session.teacher);
    const teacherName = normalizeName(teacher.fullName);
    return sessionTeacher.length > 0 && (sessionTeacher.includes(teacherName) || teacherName.includes(sessionTeacher));
  });
}

function selectTeacherForSession(session: ScheduleSessionItem, teachers: TeacherListItem[]): TeacherListItem | null {
  if (session.teacherId) {
    const direct = teachers.find((teacher) => teacher.id === session.teacherId);
    if (direct) return direct;
  }

  const target = normalizeName(session.teacher);
  if (!target) return null;

  return (
    teachers.find((teacher) => {
      const name = normalizeName(teacher.fullName);
      return name.includes(target) || target.includes(name);
    }) ?? null
  );
}

function uniqueTeachers(teachers: TeacherListItem[]): TeacherListItem[] {
  const map = new Map<string, TeacherListItem>();
  teachers.forEach((teacher) => {
    if (!map.has(teacher.id)) map.set(teacher.id, teacher);
  });
  return Array.from(map.values());
}

function uniqueCourses(courses: CourseType[]): CourseType[] {
  return Array.from(new Set(courses));
}

function makeProjectedParentId(leadId: string): string {
  return `${LEAD_PARENT_PROJECTION_PREFIX}${leadId}`;
}

function makeProjectedStudentId(leadId: string): string {
  return `${LEAD_STUDENT_PROJECTION_PREFIX}${leadId}`;
}

export function extractLeadIdFromProjectionId(id: string | null | undefined): string | null {
  if (!id) return null;
  if (id.startsWith(LEAD_PARENT_PROJECTION_PREFIX)) return id.slice(LEAD_PARENT_PROJECTION_PREFIX.length);
  if (id.startsWith(LEAD_STUDENT_PROJECTION_PREFIX)) return id.slice(LEAD_STUDENT_PROJECTION_PREFIX.length);
  return null;
}

function findParentForLead(lead: LeadListItem, parents: ParentListItem[]): ParentListItem | null {
  return (
    parents.find((parent) => samePhone(parent.phone, lead.parentPhone)) ??
    parents.find((parent) => samePhone(parent.whatsapp, lead.parentPhone)) ??
    parents.find((parent) => sameName(parent.fullName, lead.parentName)) ??
    null
  );
}

function findStudentForLead(lead: LeadListItem, students: StudentListItem[], parent: ParentListItem | null): StudentListItem | null {
  return (
    students.find((student) => {
      if (!sameName(student.fullName, lead.childName)) return false;
      if (parent && student.parentId && student.parentId === parent.id) return true;
      if (samePhone(student.parentPhone, parent?.phone ?? lead.parentPhone)) return true;
      return sameName(student.parentName, parent?.fullName ?? lead.parentName);
    }) ?? null
  );
}

function findRelatedLeadForParent(parent: ParentListItem, leads: LeadListItem[]): LeadListItem | null {
  return (
    leads.find((lead) => samePhone(lead.parentPhone, parent.phone)) ??
    leads.find((lead) => samePhone(lead.parentPhone, parent.whatsapp)) ??
    leads.find((lead) => sameName(lead.parentName, parent.fullName)) ??
    null
  );
}

function findRelatedLeadForStudent(student: StudentListItem, leads: LeadListItem[], parent: ParentListItem | null): LeadListItem | null {
  return (
    leads.find((lead) => {
      if (!sameName(lead.childName, student.fullName)) return false;
      if (parent && samePhone(lead.parentPhone, parent.phone)) return true;
      if (samePhone(lead.parentPhone, student.parentPhone)) return true;
      return sameName(lead.parentName, parent?.fullName ?? student.parentName);
    }) ?? null
  );
}

async function buildEnrollmentViews(): Promise<{ parents: ParentListItem[]; students: StudentListItem[]; leads: LeadListItem[] }> {
  const [realParents, realStudents, leads] = await Promise.all([listParents(), listStudents(), listLeads()]);

  const wonLeads = leads.filter((lead) => lead.stage === "won");
  const projectedParents: ParentListItem[] = [];
  const projectedStudents: StudentListItem[] = [];

  const allParents = [...realParents];
  const allStudents = [...realStudents];

  for (const lead of wonLeads) {
    const hasParentIdentity = lead.parentName.trim().length > 0 || lead.parentPhone.trim().length > 0;
    if (!hasParentIdentity) continue;

    let parent = findParentForLead(lead, allParents);

    if (!parent) {
      parent = {
        id: makeProjectedParentId(lead.id),
        fullName: lead.parentName.trim() || "ÙˆÙ„ÙŠ Ø£Ù…Ø± Ù…Ù† Ø§Ù„Ø¹Ù…Ù„Ø§Ø¡ Ø§Ù„Ø­Ø§Ù„ÙŠÙŠÙ†",
        phone: lead.parentPhone.trim() || "â€”",
        whatsapp: lead.parentPhone.trim() || null,
        email: null,
        city: null,
        ownerId: lead.assignedTo || null,
        ownerName: lead.assignedToName || null,
        childrenCount: 0,
        children: [],
      };
      projectedParents.push(parent);
      allParents.push(parent);
    }

    const hasStudentIdentity = lead.childName.trim().length > 0;
    if (!hasStudentIdentity) continue;

    const existingStudent = findStudentForLead(lead, allStudents, parent);
    if (existingStudent) continue;

    const projectedStudent: StudentListItem = {
      id: makeProjectedStudentId(lead.id),
      fullName: lead.childName.trim(),
      age: Number.isFinite(lead.childAge) && lead.childAge > 0 ? lead.childAge : 0,
      parentId: parent.id,
      parentName: parent.fullName,
      parentPhone: parent.phone,
      ownerId: lead.assignedTo || null,
      ownerName: lead.assignedToName || null,
      status: "active",
      currentCourse: lead.suggestedCourse ?? null,
      className: null,
      enrollmentDate: lead.createdAt,
      sessionsAttended: 0,
      totalPaid: 0,
    };

    projectedStudents.push(projectedStudent);
    allStudents.push(projectedStudent);
  }

  const mergedStudents = [...realStudents, ...projectedStudents]
    .map((student) => {
      const parent = findParentForStudent(student, allParents);
      const relatedLead = findRelatedLeadForStudent(student, leads, parent);
      return {
        ...student,
        ownerId: student.ownerId ?? relatedLead?.assignedTo ?? parent?.ownerId ?? null,
        ownerName: student.ownerName ?? relatedLead?.assignedToName ?? parent?.ownerName ?? null,
      };
    })
    .sort((a, b) => b.enrollmentDate.localeCompare(a.enrollmentDate));

  const mergedParents = [...realParents, ...projectedParents].map((parent) => {
    const childrenRecords = findStudentsForParent(parent, mergedStudents);
    const relatedLead = findRelatedLeadForParent(parent, leads);
    return {
      ...parent,
      ownerId: parent.ownerId ?? relatedLead?.assignedTo ?? null,
      ownerName: parent.ownerName ?? relatedLead?.assignedToName ?? childrenRecords[0]?.ownerName ?? null,
      childrenCount: childrenRecords.length || parent.childrenCount,
      children: childrenRecords.map((student) => student.fullName),
    };
  });

  return { parents: mergedParents, students: mergedStudents, leads };
}

export async function listStudentsWithRelations(): Promise<StudentListItem[]> {
  const { students } = await buildEnrollmentViews();
  return students;
}

export async function getStudentDetails(id: string): Promise<StudentDetails | null> {
  const projectionLeadId = extractLeadIdFromProjectionId(id);
  const baseStudent = projectionLeadId
    ? (await listStudentsWithRelations()).find((student) => student.id === id) ?? null
    : await getStudentById(id);

  if (!baseStudent) return null;

  const [students, parents, teachers, sessions] = await Promise.all([
    listStudentsWithRelations(),
    listParentsWithRelations(),
    listTeachers(),
    listScheduleSessions(),
  ]);

  const student = students.find((item) => item.id === baseStudent.id) ?? baseStudent;
  const parent = findParentForStudent(student, parents);
  const siblings = parent
    ? findStudentsForParent(parent, students).filter((item) => item.id !== student.id)
    : students.filter((item) => item.id !== student.id && samePhone(item.parentPhone, student.parentPhone));

  const relatedSessions = findSessionsForStudent(student, sessions);
  const linkedTeachers = uniqueTeachers(
    relatedSessions
      .map((session) => selectTeacherForSession(session, teachers))
      .filter((teacher): teacher is TeacherListItem => teacher !== null),
  );

  return {
    ...student,
    parent,
    siblings,
    relatedSessions,
    teachers: linkedTeachers,
  };
}

export async function listParentsWithRelations(): Promise<ParentListItem[]> {
  const { parents } = await buildEnrollmentViews();
  return parents;
}

export async function getParentDetails(id: string): Promise<ParentDetails | null> {
  const [parents, students, leads] = await Promise.all([
    listParentsWithRelations(),
    listStudentsWithRelations(),
    listLeads(),
  ]);

  const parent = parents.find((item) => item.id === id) ?? null;
  if (!parent) return null;

  const childrenRecords = findStudentsForParent(parent, students);
  const openLeads = leads.filter((lead) => {
    if (lead.stage === "won") return false;
    if (samePhone(lead.parentPhone, parent.phone)) return true;
    return sameName(lead.parentName, parent.fullName);
  });

  return {
    ...parent,
    childrenCount: childrenRecords.length || parent.childrenCount,
    children: childrenRecords.map((student) => student.fullName),
    childrenRecords,
    activeStudents: childrenRecords.filter((student) => student.status === "active" || student.status === "trial").length,
    totalPaid: childrenRecords.reduce((sum, student) => sum + student.totalPaid, 0),
    openLeads,
  };
}

export async function listTeachersWithRelations(): Promise<TeacherListItem[]> {
  const [teachers, students, sessions] = await Promise.all([
    listTeachers(),
    listStudentsWithRelations(),
    listScheduleSessions(),
  ]);

  return teachers.map((teacher) => {
    const linkedSessions = findSessionsForTeacher(teacher, sessions);
    const classNames = linkedSessions.map((session) => normalizeName(session.className));
    const linkedStudents = students.filter((student) => {
      const classMatch = student.className ? classNames.includes(normalizeName(student.className)) : false;
      const courseMatch = student.currentCourse ? teacher.specialization.includes(student.currentCourse) : false;
      return classMatch || courseMatch;
    });

    return {
      ...teacher,
      classesCount: linkedSessions.length || teacher.classesCount,
      studentsCount: linkedStudents.length || teacher.studentsCount,
    };
  });
}

export async function getTeacherDetails(id: string): Promise<TeacherDetails | null> {
  const [teachers, students, sessions] = await Promise.all([
    listTeachersWithRelations(),
    listStudentsWithRelations(),
    listScheduleSessions(),
  ]);

  const teacher = teachers.find((item) => item.id === id) ?? null;
  if (!teacher) return null;

  const linkedSessions = findSessionsForTeacher(teacher, sessions);
  const classNames = linkedSessions.map((session) => normalizeName(session.className));
  const linkedStudents = students.filter((student) => {
    const classMatch = student.className ? classNames.includes(normalizeName(student.className)) : false;
    const courseMatch = student.currentCourse ? teacher.specialization.includes(student.currentCourse) : false;
    return classMatch || courseMatch;
  });

  const evaluation = getTeacherEvaluation(teacher.id);

  return {
    ...teacher,
    linkedSessions,
    linkedStudents,
    activeCourses: uniqueCourses(linkedSessions.map((session) => session.course)),
    manualRating: evaluation?.rating ?? null,
    evaluationNotes: evaluation?.notes ?? null,
    evaluationUpdatedAt: evaluation?.updatedAt ?? null,
  };
}
```

### FILE: src\services\reports.service.ts
```ts
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
      title: t(locale, "Ù…ØªØ§Ø¨Ø¹Ø§Øª Ù…ØªØ£Ø®Ø±Ø©", "Overdue follow-ups"),
      value: overdueFollowUps.toLocaleString(locale === "ar" ? "ar-EG" : "en-US"),
      subtitle: t(locale, "ÙƒÙ„ ØªØ£Ø®ÙŠØ± Ù‡Ù†Ø§ ÙŠØ¹Ù†ÙŠ ÙØ±ØµØ© Ø£Ø¨Ø·Ø£ Ø£Ùˆ Ù…Ù‡Ø¯ÙˆØ±Ø©", "Every delay here means a slower or missed opportunity"),
      tone: overdueFollowUps > 0 ? "danger" : "success",
    },
    {
      title: t(locale, "Ø·Ù„Ø§Ø¨ Ø¨Ø­Ø§Ø¬Ø© Ù…ØªØ§Ø¨Ø¹Ø©", "Students at risk"),
      value: atRiskStudents.toLocaleString(locale === "ar" ? "ar-EG" : "en-US"),
      subtitle: t(locale, "Ø±Ø§Ù‚Ø¨ Ø§Ù„ØªÙˆÙ‚Ù ÙˆØ§Ù„ØºÙŠØ§Ø¨ Ù‚Ø¨Ù„ Ø§Ù„Ø§Ù†Ø³Ø­Ø§Ø¨", "Watch pauses and absence before they churn"),
      tone: atRiskStudents > 0 ? "warning" : "success",
    },
    {
      title: t(locale, "Ø§Ù„ØªØ­ØµÙŠÙ„ Ø§Ù„Ø­Ø§Ù„ÙŠ", "Current collection"),
      value: `${paymentsSummary.collectionRate}%`,
      subtitle: t(locale, `${formatCurrencyEgp(paymentsSummary.totalCollected, locale)} ØªÙ… ØªØ­ØµÙŠÙ„Ù‡Ø§`, `${formatCurrencyEgp(paymentsSummary.totalCollected, locale)} collected so far`),
      tone: paymentsSummary.collectionRate >= 80 ? "success" : paymentsSummary.collectionRate >= 60 ? "warning" : "danger",
    },
    {
      title: t(locale, "Ø­Ù…ÙˆÙ„Ø© Ø§Ù„Ø¬Ø¯ÙˆÙ„", "Schedule load"),
      value: scheduleOverview.sessionsCount.toLocaleString(locale === "ar" ? "ar-EG" : "en-US"),
      subtitle: t(locale, `${scheduleOverview.uniqueTeachers} Ù…Ø¯Ø±Ø³ÙŠÙ† ÙØ¹Ù‘Ø§Ù„ÙŠÙ†`, `${scheduleOverview.uniqueTeachers} active teachers`),
      tone: "info",
    },
  ];

  const recommendations = [
    overdueFollowUps > 0
      ? {
          title: t(locale, "Ø£ÙˆÙ„ÙˆÙŠØ© Ø§Ù„ÙŠÙˆÙ…: Ø§ØºÙ„Ø§Ù‚ Ø§Ù„Ù…ØªØ§Ø¨Ø¹Ø§Øª Ø§Ù„Ù…ØªØ£Ø®Ø±Ø©", "Priority today: close overdue follow-ups"),
          description: t(locale, "Ø§Ø¨Ø¯Ø£ Ø¨Ø§Ù„Ø¹Ù…Ù„Ø§Ø¡ Ø§Ù„Ø£Ù‚Ø±Ø¨ Ù„Ù„Ø­Ø¬Ø² Ø£Ùˆ Ø§Ù„Ø¥ØºÙ„Ø§Ù‚ Ø­ØªÙ‰ Ù„Ø§ ÙŠØ¨Ø±Ø¯ÙˆØ§ Ø¯Ø§Ø®Ù„ Ø§Ù„Ù‚Ù…Ø¹", "Start with leads closest to booking or closing so they do not cool off inside the funnel"),
          href: "/follow-ups",
          priority: "high" as const,
        }
      : null,
    paymentsSummary.totalOverdue > 0
      ? {
          title: t(locale, "Ù…Ø¹Ø§Ù„Ø¬Ø© Ø§Ù„ØªØ£Ø®Ø±Ø§Øª Ø§Ù„Ù…Ø§Ù„ÙŠØ©", "Address overdue balances"),
          description: t(locale, "Ø§Ø±Ø¨Ø· Ø§Ù„Ù…ØªØ§Ø¨Ø¹Ø§Øª Ø§Ù„Ù…Ø§Ù„ÙŠØ© Ø¨Ø§Ù„Ù…Ø¯ÙÙˆØ¹Ø§Øª Ø§Ù„Ù…ØªØ£Ø®Ø±Ø© Ù„Ø±ÙØ¹ Ù…Ø¹Ø¯Ù„ Ø§Ù„ØªØ­ØµÙŠÙ„ Ø¨Ø³Ø±Ø¹Ø©", "Tie financial follow-ups to overdue balances to improve collections fast"),
          href: "/payments",
          priority: "high" as const,
        }
      : null,
    leadsWithoutFollowUp > 0
      ? {
          title: t(locale, "ØªÙ†Ø¸ÙŠÙ Ø§Ù„Ø¹Ù…Ù„Ø§Ø¡ Ø§Ù„Ù…ÙØªÙˆØ­ÙŠÙ†", "Clean up open leads"),
          description: t(locale, "Ù‡Ù†Ø§Ùƒ Ø¹Ù…Ù„Ø§Ø¡ Ø¨Ù„Ø§ Ù…ÙˆØ¹Ø¯ Ù…ØªØ§Ø¨Ø¹Ø© Ù‚Ø§Ø¯Ù…ØŒ ÙˆÙ‡Ø°Ø§ ÙŠØ³Ø¨Ø¨ ØªØ³Ø±Ø¨Ù‹Ø§ Ù‡Ø§Ø¯Ø¦Ù‹Ø§ Ù…Ù† Ø§Ù„Ù‚Ù…Ø¹", "Some leads have no next follow-up date, which quietly leaks your funnel"),
          href: "/leads",
          priority: "medium" as const,
        }
      : null,
    stageVelocity[0]
      ? {
          title: t(locale, "Ø£Ø¨Ø·Ø£ Ù…Ø±Ø­Ù„Ø© ØªØ­ØªØ§Ø¬ Ù‚Ø±Ø§Ø±Ù‹Ø§", "Slowest stage needs a decision"),
          description: t(locale, `${getStageLabel(stageVelocity[0].stage, locale)} ØªÙ…ÙƒØ« ${stageVelocity[0].days} Ø£ÙŠØ§Ù… ÙÙŠ Ø§Ù„Ù…ØªÙˆØ³Ø·`, `${getStageLabel(stageVelocity[0].stage, locale)} stays for ${stageVelocity[0].days} days on average`),
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
        label: t(locale, "Ø¥ÙŠØ±Ø§Ø¯ Ø§Ù„Ø´Ù‡Ø±", "Monthly revenue"),
        value: formatCurrencyEgp(revenue, locale),
        change: revenue > 0 ? t(locale, "+Ù…Ø­Ø¯Ù‘Ø«", "+Updated") : "0",
        up: revenue > 0,
        icon: "wallet",
      },
      {
        label: t(locale, "Ø·Ù„Ø§Ø¨ Ø¬Ø¯Ø¯", "New students"),
        value: recentStudents.toLocaleString(locale === "ar" ? "ar-EG" : "en-US"),
        change: recentStudents > 0 ? `+${recentStudents}` : "0",
        up: recentStudents > 0,
        icon: "users",
      },
      {
        label: getConversionTerm("averageConversionTime", locale),
        value: averageDecisionDays > 0 ? t(locale, `${averageDecisionDays} ÙŠÙˆÙ…`, `${averageDecisionDays} days`) : "â€”",
        change: averageDecisionDays > 0 && averageDecisionDays <= 5 ? t(locale, "Ø£Ø³Ø±Ø¹", "Faster") : t(locale, "ÙŠØ­ØªØ§Ø¬ ØªØ­Ø³ÙŠÙ†", "Needs work"),
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
```

### FILE: src\services\schedule.service.ts
```ts
import { createBrowserClient } from "@supabase/ssr";
import type { CourseType } from "@/types/common.types";
import type { Database } from "@/types/database.types";
import type { CreateScheduleEntryInput, ParentListItem, ScheduleSessionDetails, ScheduleSessionItem, StudentListItem, TeacherListItem } from "@/types/crm";
import { isBrowser, readStorage, writeStorage } from "@/services/storage";
import { listParents } from "@/services/parents.service";
import { listStudents } from "@/services/students.service";
import { listTeachers } from "@/services/teachers.service";

const SCHEDULE_KEY = "skidy.crm.schedule";
const ALLOW_DEMO = process.env.NEXT_PUBLIC_ALLOW_DEMO_FALLBACK === "true";
const VALID_COURSES: CourseType[] = ["scratch", "python", "web", "ai"];

const DEFAULT_SCHEDULE: ScheduleSessionItem[] = [
  { id: "1", classId: "class-1", teacherId: "1", day: 0, startTime: "16:00", endTime: "17:00", className: "Scratch A", teacher: "Ø£. Ù…Ø­Ù…ÙˆØ¯", students: 5, course: "scratch", sessionDate: null },
  { id: "2", classId: "class-2", teacherId: "2", day: 0, startTime: "17:30", endTime: "18:30", className: "Python A", teacher: "Ø£. Ø¯ÙŠÙ†Ø§", students: 4, course: "python", sessionDate: null },
  { id: "3", classId: "class-3", teacherId: "3", day: 1, startTime: "16:00", endTime: "17:00", className: "Scratch B", teacher: "Ø£. ÙƒØ±ÙŠÙ…", students: 6, course: "scratch", sessionDate: null },
  { id: "4", classId: "class-4", teacherId: "2", day: 2, startTime: "18:00", endTime: "19:00", className: "AI Intro", teacher: "Ø£. Ø¯ÙŠÙ†Ø§", students: 3, course: "ai", sessionDate: null },
  { id: "5", classId: "class-5", teacherId: "3", day: 3, startTime: "17:00", endTime: "18:00", className: "Web Starters", teacher: "Ø£. ÙƒØ±ÙŠÙ…", students: 4, course: "web", sessionDate: null },
  { id: "6", classId: "class-6", teacherId: "1", day: 4, startTime: "16:30", endTime: "17:30", className: "Scratch Trial", teacher: "Ø£. Ù…Ø­Ù…ÙˆØ¯", students: 5, course: "scratch", sessionDate: null },
];

type RawClassRow = {
  id?: string | null;
  teacher_id?: string | null;
  name?: string | null;
  course?: string | null;
  start_time?: string | null;
  end_time?: string | null;
  day_of_week?: number | string | null;
  weekday?: number | string | null;
  day?: number | string | null;
};

type RawSessionRow = {
  id?: string | null;
  class_id?: string | null;
  teacher_id?: string | null;
  title?: string | null;
  status?: string | null;
  start_time?: string | null;
  end_time?: string | null;
  session_date?: string | null;
  day_of_week?: number | string | null;
  weekday?: number | string | null;
  day?: number | string | null;
};

type RawEnrollmentRow = {
  class_id?: string | null;
  is_active?: boolean | null;
};

function getSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key || !isBrowser()) return null;
  return createBrowserClient<Database>(url, key);
}

function sortSessions(items: ScheduleSessionItem[]): ScheduleSessionItem[] {
  return [...items].sort((a, b) => {
    if (a.day !== b.day) return a.day - b.day;
    return a.startTime.localeCompare(b.startTime);
  });
}

function asString(value: unknown, fallback = ""): string {
  return typeof value === "string" && value.trim().length > 0 ? value : fallback;
}

function asNullableString(value: unknown): string | null {
  return typeof value === "string" && value.trim().length > 0 ? value : null;
}

function asNumber(value: unknown, fallback = 0): number {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
  }
  return fallback;
}

function asCourse(value: unknown, fallback: CourseType = "scratch"): CourseType {
  return VALID_COURSES.includes(value as CourseType) ? (value as CourseType) : fallback;
}

function normalizeName(value: string | null | undefined): string {
  return (value ?? "")
    .toLowerCase()
    .replace(/Ø£\.?\s*/g, "")
    .replace(/[\u064B-\u065F]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function getLocalSchedule(): ScheduleSessionItem[] {
  return sortSessions(readStorage(SCHEDULE_KEY, ALLOW_DEMO ? DEFAULT_SCHEDULE : []));
}

function saveLocalSchedule(items: ScheduleSessionItem[]): void {
  writeStorage(SCHEDULE_KEY, sortSessions(items));
}

function clearLocalSchedule(): void {
  writeStorage(SCHEDULE_KEY, []);
}

function inferTeacher(
  teacherId: string | null,
  rawTeacher: unknown,
  teachers: TeacherListItem[],
): TeacherListItem | null {
  if (teacherId) {
    const direct = teachers.find((teacher) => teacher.id === teacherId);
    if (direct) return direct;
  }

  const byName = asString(rawTeacher);
  if (!byName) return null;
  const target = normalizeName(byName);
  return teachers.find((teacher) => {
    const name = normalizeName(teacher.fullName);
    return name.includes(target) || target.includes(name);
  }) ?? null;
}

function extractDay(source: { day_of_week?: unknown; weekday?: unknown; day?: unknown }, fallback = 0): number {
  return asNumber(source.day_of_week ?? source.weekday ?? source.day, fallback);
}

function mapSessionFromClass(
  row: RawClassRow,
  teachers: TeacherListItem[],
  enrollmentCount: number,
): ScheduleSessionItem {
  const teacher = inferTeacher(asNullableString(row.teacher_id), null, teachers);
  const id = asString(row.id, `class-${Math.random().toString(36).slice(2, 8)}`);

  return {
    id,
    classId: asNullableString(row.id),
    teacherId: asNullableString(row.teacher_id),
    day: extractDay(row, 0),
    startTime: asString(row.start_time, "16:00"),
    endTime: asString(row.end_time, "17:00"),
    className: asString(row.name, "Class"),
    teacher: teacher?.fullName ?? "Ù…Ø¯Ø±Ø³ ØºÙŠØ± Ù…Ø­Ø¯Ø¯",
    students: enrollmentCount,
    course: asCourse(row.course),
    sessionDate: null,
  } satisfies ScheduleSessionItem;
}

function mapSessionFromSession(
  row: RawSessionRow,
  classMap: Map<string, RawClassRow>,
  teachers: TeacherListItem[],
  studentsCount: number,
): ScheduleSessionItem {
  const classRow = row.class_id ? classMap.get(row.class_id) ?? null : null;
  const teacher = inferTeacher(asNullableString(row.teacher_id ?? classRow?.teacher_id), null, teachers);
  const id = asString(row.id, `session-${Math.random().toString(36).slice(2, 8)}`);

  return {
    id,
    classId: asNullableString(row.class_id),
    teacherId: asNullableString(row.teacher_id ?? classRow?.teacher_id),
    day: extractDay(row, extractDay(classRow ?? {}, 0)),
    startTime: asString(row.start_time ?? classRow?.start_time, "16:00"),
    endTime: asString(row.end_time ?? classRow?.end_time, "17:00"),
    className: asString(row.title ?? classRow?.name, "Session"),
    teacher: teacher?.fullName ?? "Ù…Ø¯Ø±Ø³ ØºÙŠØ± Ù…Ø­Ø¯Ø¯",
    students: studentsCount,
    course: asCourse(classRow?.course, "scratch"),
    sessionDate: asNullableString(row.session_date),
  } satisfies ScheduleSessionItem;
}

async function buildStudentsTeachersParents(): Promise<{
  students: StudentListItem[];
  teachers: TeacherListItem[];
  parents: ParentListItem[];
}> {
  const [students, teachers, parents] = await Promise.all([listStudents(), listTeachers(), listParents()]);
  return { students, teachers, parents };
}

export async function listScheduleSessions(): Promise<ScheduleSessionItem[]> {
  const local = getLocalSchedule();
  const supabase = getSupabaseClient();
  if (!supabase) return local.length > 0 ? local : (ALLOW_DEMO ? DEFAULT_SCHEDULE : []);

  try {
    const [{ students, teachers }, classesResponse, sessionsResponse, enrollmentsResponse] = await Promise.all([
      buildStudentsTeachersParents(),
      supabase.from("classes").select("*"),
      supabase.from("sessions").select("*").order("session_date", { ascending: false }),
      supabase.from("class_enrollments").select("*"),
    ]);

    const classesRows = ((classesResponse.data ?? []) as RawClassRow[]);
    const sessionRows = ((sessionsResponse.data ?? []) as RawSessionRow[]);
    const enrollmentRows = ((enrollmentsResponse.data ?? []) as RawEnrollmentRow[]);

    if (classesResponse.error || sessionsResponse.error || enrollmentsResponse.error) {
      console.error("[schedule] failed to load from Supabase", classesResponse.error || sessionsResponse.error || enrollmentsResponse.error);
      clearLocalSchedule();
      return ALLOW_DEMO && local.length === 0 ? DEFAULT_SCHEDULE : [];
    }

    if (classesRows.length === 0 && sessionRows.length === 0) {
      clearLocalSchedule();
      return ALLOW_DEMO && local.length === 0 ? DEFAULT_SCHEDULE : [];
    }

    const enrollmentCountByClassId = new Map<string, number>();
    enrollmentRows.forEach((row) => {
      if (!row.class_id) return;
      const isActive = row.is_active ?? true;
      if (!isActive) return;
      enrollmentCountByClassId.set(row.class_id, (enrollmentCountByClassId.get(row.class_id) ?? 0) + 1);
    });

    const classMap = new Map(
      classesRows
        .map((row) => [asString(row.id), row] as const)
        .filter(([id]) => id.length > 0),
    );

    const classIdsWithSessions = new Set(
      sessionRows.map((row) => row.class_id).filter((id): id is string => typeof id === "string" && id.length > 0),
    );

    const mappedFromSessions = sessionRows.map((row) => {
      const studentsCount = row.class_id ? (enrollmentCountByClassId.get(row.class_id) ?? 0) : 0;
      return mapSessionFromSession(row, classMap, teachers, studentsCount);
    });

    const mappedStandaloneClasses = classesRows
      .filter((row) => {
        const id = asString(row.id);
        return !id || !classIdsWithSessions.has(id);
      })
      .map((row) => {
        const id = asString(row.id);
        const fallbackStudents = students.filter((student) => student.className === row.name).length;
        return mapSessionFromClass(row, teachers, enrollmentCountByClassId.get(id) ?? fallbackStudents);
      });

    const merged = sortSessions([...mappedFromSessions, ...mappedStandaloneClasses]);
    saveLocalSchedule(merged);
    return merged;
  } catch (error) {
    console.error("[schedule] unexpected failure", error);
    clearLocalSchedule();
    return ALLOW_DEMO && local.length === 0 ? DEFAULT_SCHEDULE : [];
  }
}

export async function getScheduleSessionById(id: string): Promise<ScheduleSessionItem | null> {
  const items = await listScheduleSessions();
  return items.find((session) => session.id === id) ?? null;
}

export async function getScheduleSessionDetails(id: string): Promise<ScheduleSessionDetails | null> {
  const [session, students, teachers, parents, allSessions] = await Promise.all([
    getScheduleSessionById(id),
    listStudents(),
    listTeachers(),
    listParents(),
    listScheduleSessions(),
  ]);

  if (!session) return null;

  const teacherRecord = session.teacherId
    ? teachers.find((teacher) => teacher.id === session.teacherId) ?? null
    : teachers.find((teacher) => normalizeName(teacher.fullName) === normalizeName(session.teacher)) ?? null;

  const linkedStudents = students.filter((student) => {
    const classMatch = student.className ? normalizeName(student.className) === normalizeName(session.className) : false;
    const courseMatch = student.currentCourse === session.course;
    return classMatch || courseMatch;
  });

  const linkedParentIds = Array.from(new Set(linkedStudents.map((student) => student.parentId).filter((value): value is string => Boolean(value))));
  const linkedParents = parents.filter((parent) => linkedParentIds.includes(parent.id));
  const siblingSessions = allSessions.filter(
    (item) => item.id !== session.id && ((session.classId && item.classId === session.classId) || normalizeName(item.className) === normalizeName(session.className)),
  );

  return {
    ...session,
    teacherRecord,
    linkedStudents,
    linkedParentIds,
    linkedParents,
    siblingSessions,
  };
}

export async function getScheduleOverview(): Promise<{
  sessionsCount: number;
  totalStudents: number;
  uniqueTeachers: number;
  busiestDay: number;
  busiestDayCount: number;
}> {
  const sessions = await listScheduleSessions();
  const totalStudents = sessions.reduce((sum, session) => sum + session.students, 0);
  const uniqueTeachers = new Set(sessions.map((session) => session.teacherId ?? session.teacher)).size;
  const busiestDay = sessions.reduce<Record<number, number>>((acc, session) => {
    acc[session.day] = (acc[session.day] ?? 0) + 1;
    return acc;
  }, {});

  const busiestDayEntry = Object.entries(busiestDay).sort((a, b) => Number(b[1]) - Number(a[1]))[0];

  return {
    sessionsCount: sessions.length,
    totalStudents,
    uniqueTeachers,
    busiestDay: busiestDayEntry ? Number(busiestDayEntry[0]) : 0,
    busiestDayCount: busiestDayEntry ? Number(busiestDayEntry[1]) : 0,
  };
}


export async function createScheduleEntry(input: CreateScheduleEntryInput): Promise<ScheduleSessionItem> {
  const supabase = getSupabaseClient();
  if (!supabase) {
    throw new Error("ØªØ¹Ø°Ø± Ø§Ù„Ø§ØªØµØ§Ù„ Ø¨Ù‚Ø§Ø¹Ø¯Ø© Ø§Ù„Ø¨ÙŠØ§Ù†Ø§Øª. Ø£Ø¹Ø¯ Ø§Ù„Ù…Ø­Ø§ÙˆÙ„Ø© Ø¨Ø¹Ø¯ ØªØ³Ø¬ÙŠÙ„ Ø§Ù„Ø¯Ø®ÙˆÙ„ Ø£Ùˆ Ø§Ù„ØªØ­Ù‚Ù‚ Ù…Ù† Ø§Ù„Ø¥Ø¹Ø¯Ø§Ø¯Ø§Øª.");
  }

  const teachers = await listTeachers();
  const teacher = teachers.find((item) => item.id === input.teacherId) ?? null;
  if (!teacher) {
    throw new Error("Ø§Ø®ØªØ± Ù…Ø¯Ø±Ø³Ù‹Ø§ ØµØ­ÙŠØ­Ù‹Ø§ Ù‚Ø¨Ù„ Ø­ÙØ¸ Ø§Ù„Ø­ØµØ©.");
  }

  const existing = await listScheduleSessions();
  const clash = existing.find((session) => {
    if ((session.teacherId ?? "") !== input.teacherId) return false;
    if (session.day !== input.day) return false;
    const startsInside = input.startTime >= session.startTime && input.startTime < session.endTime;
    const endsInside = input.endTime > session.startTime && input.endTime <= session.endTime;
    const wraps = input.startTime <= session.startTime && input.endTime >= session.endTime;
    return startsInside || endsInside || wraps;
  });

  if (clash) {
    throw new Error(`ÙŠÙˆØ¬Ø¯ ØªØ¹Ø§Ø±Ø¶ Ù…Ø¹ ${clash.className} Ù„Ù†ÙØ³ Ø§Ù„Ù…Ø¯Ø±Ø³ ÙÙŠ Ù‡Ø°Ø§ Ø§Ù„ØªÙˆÙ‚ÙŠØª.`);
  }

  const payload: Database["public"]["Tables"]["classes"]["Insert"] = {
    name: input.className,
    teacher_id: input.teacherId,
    start_time: input.startTime,
    end_time: input.endTime,
    is_active: true,
    created_at: new Date().toISOString(),
  };

  const { data, error } = await supabase.from("classes").insert(payload).select("*").single();
  if (error || !data) {
    throw new Error(error?.message || "ØªØ¹Ø°Ø± Ø¥Ù†Ø´Ø§Ø¡ Ø§Ù„Ø­ØµØ© ÙÙŠ Ø§Ù„Ø¬Ø¯ÙˆÙ„");
  }

  const created: ScheduleSessionItem = {
    id: asString((data as Record<string, unknown>).id, crypto.randomUUID()),
    classId: asNullableString((data as Record<string, unknown>).id),
    teacherId: input.teacherId,
    day: input.day,
    startTime: input.startTime,
    endTime: input.endTime,
    className: input.className,
    teacher: teacher.fullName,
    students: 0,
    course: input.course,
    sessionDate: null,
  };

  saveLocalSchedule([created, ...getLocalSchedule().filter((item) => item.id !== created.id)]);
  return created;
}
```

### FILE: src\services\student-enrollment-control.service.ts
```ts
import { createBrowserClient } from "@supabase/ssr";
import { getCourseFormLabel } from "@/config/course-roadmap";
import { listScheduleSessions } from "@/services/schedule.service";
import { getStudentById } from "@/services/students.service";
import { listTeachers } from "@/services/teachers.service";
import type { Database } from "@/types/database.types";
import type { CourseType, StudentListItem } from "@/types/crm";

export interface EnrollmentClassOption {
  key: string;
  className: string;
  course: CourseType;
  teacherId: string | null;
  teacherName: string;
  day: number;
  startTime: string;
  endTime: string;
}

function getSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key || typeof window === "undefined") return null;
  return createBrowserClient<Database>(url, key);
}

function uniqueKey(className: string, course: CourseType, teacherId: string | null) {
  return `${className}__${course}__${teacherId ?? ""}`;
}

function mapOptionLabel(option: EnrollmentClassOption, locale: "ar" | "en"): string {
  const dayLabelsAr = ["Ø§Ù„Ø£Ø­Ø¯", "Ø§Ù„Ø§Ø«Ù†ÙŠÙ†", "Ø§Ù„Ø«Ù„Ø§Ø«Ø§Ø¡", "Ø§Ù„Ø£Ø±Ø¨Ø¹Ø§Ø¡", "Ø§Ù„Ø®Ù…ÙŠØ³", "Ø§Ù„Ø¬Ù…Ø¹Ø©", "Ø§Ù„Ø³Ø¨Øª"];
  const dayLabelsEn = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const day = locale === "ar" ? dayLabelsAr[option.day] ?? option.day : dayLabelsEn[option.day] ?? option.day;
  return locale === "ar"
    ? `${option.className} â€” ${getCourseFormLabel(option.course, locale)} â€” ${option.teacherName} â€” ${day} ${option.startTime}`
    : `${option.className} â€” ${getCourseFormLabel(option.course, locale)} â€” ${option.teacherName} â€” ${day} ${option.startTime}`;
}

export function getEnrollmentOptionLabel(option: EnrollmentClassOption, locale: "ar" | "en"): string {
  return mapOptionLabel(option, locale);
}

export async function listEnrollmentClassOptions(preferredCourse?: CourseType | null): Promise<EnrollmentClassOption[]> {
  const [sessions, teachers] = await Promise.all([listScheduleSessions(), listTeachers()]);
  const teacherMap = new Map(teachers.map((teacher) => [teacher.id, teacher.fullName]));
  const map = new Map<string, EnrollmentClassOption>();

  for (const session of sessions) {
    const key = uniqueKey(session.className, session.course, session.teacherId ?? null);
    if (!map.has(key)) {
      map.set(key, {
        key,
        className: session.className,
        course: session.course,
        teacherId: session.teacherId ?? null,
        teacherName: session.teacherId ? (teacherMap.get(session.teacherId) ?? session.teacher) : session.teacher,
        day: session.day,
        startTime: session.startTime,
        endTime: session.endTime,
      });
    }
  }

  return Array.from(map.values()).sort((a, b) => {
    const prefA = preferredCourse && a.course === preferredCourse ? 1 : 0;
    const prefB = preferredCourse && b.course === preferredCourse ? 1 : 0;
    if (prefA !== prefB) return prefB - prefA;
    return a.day - b.day || a.startTime.localeCompare(b.startTime) || a.className.localeCompare(b.className, "ar");
  });
}

export async function updateStudentEnrollment(studentId: string, input: { className: string | null; currentCourse: CourseType | null; }): Promise<StudentListItem | null> {
  const supabase = getSupabaseClient();
  if (!supabase) {
    throw new Error("ØªØ¹Ø°Ø± Ø§Ù„Ø§ØªØµØ§Ù„ Ø¨Ù‚Ø§Ø¹Ø¯Ø© Ø§Ù„Ø¨ÙŠØ§Ù†Ø§Øª. ØªØ£ÙƒØ¯ Ù…Ù† Ø¥Ø¹Ø¯Ø§Ø¯Ø§Øª Supabase Ø«Ù… Ø£Ø¹Ø¯ Ø§Ù„Ù…Ø­Ø§ÙˆÙ„Ø©.");
  }

  const payload: Database["public"]["Tables"]["students"]["Update"] = {
    class_name: input.className,
    current_course: input.currentCourse,
  };

  const { error } = await supabase.from("students").update(payload).eq("id", studentId);
  if (error) {
    throw new Error(error.message || "ØªØ¹Ø°Ø± ØªØ­Ø¯ÙŠØ« Ø±Ø¨Ø· Ø§Ù„Ø·Ø§Ù„Ø¨ Ø¨Ø§Ù„ÙƒÙ„Ø§Ø³.");
  }

  return getStudentById(studentId);
}
```

### FILE: src\services\student-finance.service.ts
```ts
import { getPaymentDisplayState, getPaymentEffectiveDueDate, listPaymentsByStudent } from "@/services/payments.service";
import type { PaymentItem } from "@/types/crm";

export interface StudentFinanceSnapshot {
  latestPayment: PaymentItem | null;
  nextPendingPayment: PaymentItem | null;
  totalBilled: number;
  totalCollected: number;
  openPayments: number;
  invoiceCount: number;
  currentState: "paid" | "pending" | "overdue" | "partial" | "refunded" | "deferred" | "none";
}

function sortByDueDesc(items: PaymentItem[]): PaymentItem[] {
  return [...items].sort((a, b) => getPaymentEffectiveDueDate(b).localeCompare(getPaymentEffectiveDueDate(a)));
}

function sortByDueAsc(items: PaymentItem[]): PaymentItem[] {
  return [...items].sort((a, b) => getPaymentEffectiveDueDate(a).localeCompare(getPaymentEffectiveDueDate(b)));
}

export async function getStudentFinanceSnapshot(studentId: string): Promise<StudentFinanceSnapshot> {
  const payments = sortByDueDesc(await listPaymentsByStudent(studentId));
  const latestPayment = payments[0] ?? null;
  const pendingLike = sortByDueAsc(
    payments.filter((payment) => {
      const state = getPaymentDisplayState(payment);
      return state === "pending" || state === "overdue" || state === "partial" || state === "deferred";
    }),
  );

  return {
    latestPayment,
    nextPendingPayment: pendingLike[0] ?? null,
    totalBilled: payments.reduce((sum, payment) => sum + payment.amount, 0),
    totalCollected: payments
      .filter((payment) => payment.status === "paid" || payment.status === "partial")
      .reduce((sum, payment) => sum + payment.amount, 0),
    openPayments: pendingLike.length,
    invoiceCount: payments.length,
    currentState: latestPayment ? getPaymentDisplayState(latestPayment) : "none",
  };
}
```

### FILE: src\services\student-journey.service.ts
```ts
import type { StudentDetails } from "@/types/crm";
import { getCourseTrackMeta } from "@/config/course-roadmap";
import { buildStudentReportSnapshot } from "@/services/student-report.service";

export interface StudentJourneyMilestone {
  id: string;
  titleAr: string;
  titleEn: string;
  detailAr: string;
  detailEn: string;
  tone: "brand" | "success" | "warning" | "info";
}

export interface StudentJourneySummary {
  stageAr: string;
  stageEn: string;
  reportReady: boolean;
  milestones: StudentJourneyMilestone[];
}

export function buildStudentJourney(student: StudentDetails): StudentJourneySummary {
  const report = buildStudentReportSnapshot(student);
  const trackMeta = getCourseTrackMeta(student.currentCourse);

  const milestones: StudentJourneyMilestone[] = [
    {
      id: "enrollment",
      titleAr: "Ø¨Ø¯Ø§ÙŠØ© Ø§Ù„Ø±Ø­Ù„Ø©",
      titleEn: "Journey started",
      detailAr: `Ø§Ù„ØªØ­Ù‚ Ø¨ØªØ§Ø±ÙŠØ® ${student.enrollmentDate}`,
      detailEn: `Joined on ${student.enrollmentDate}`,
      tone: "brand",
    },
    {
      id: "class",
      titleAr: "Ø§Ù„ÙƒÙ„Ø§Ø³ Ø§Ù„Ø­Ø§Ù„ÙŠ",
      titleEn: "Current class",
      detailAr: report.className ? `Ø§Ù„Ø·Ø§Ù„Ø¨ Ù…Ø±ØªØ¨Ø· Ø§Ù„Ø¢Ù† Ø¨Ù€ ${report.className}` : "Ù„Ù… ÙŠØªÙ… Ø±Ø¨Ø· ÙƒÙ„Ø§Ø³ Ø¨Ø¹Ø¯",
      detailEn: report.className ? `Currently linked to ${report.className}` : "No class linked yet",
      tone: report.className ? "info" : "warning",
    },
    {
      id: "course",
      titleAr: "Ø§Ù„Ù…Ø³Ø§Ø± Ø§Ù„Ø­Ø§Ù„ÙŠ",
      titleEn: "Current track",
      detailAr: trackMeta ? `ÙŠØ¹Ù…Ù„ Ø§Ù„Ø¢Ù† Ø¯Ø§Ø®Ù„ ${trackMeta.labelAr}` : (student.currentCourse ? `ÙŠØ¹Ù…Ù„ Ø§Ù„Ø¢Ù† Ø¯Ø§Ø®Ù„ Ù…Ø³Ø§Ø± ${student.currentCourse}` : "Ù„Ù… ÙŠØªÙ… ØªØ­Ø¯ÙŠØ¯ Ø§Ù„Ù…Ø³Ø§Ø± Ø¨Ø¹Ø¯"),
      detailEn: trackMeta ? `Currently progressing in ${trackMeta.labelEn}` : (student.currentCourse ? `Currently progressing in ${student.currentCourse}` : "No track assigned yet"),
      tone: student.currentCourse ? "info" : "warning",
    },
    {
      id: "teacher",
      titleAr: "Ø§Ù„Ù…Ø¯Ø±Ø³ Ø§Ù„Ù…Ø±ØªØ¨Ø·",
      titleEn: "Assigned teacher",
      detailAr: report.teacherName ? `Ø§Ù„Ù…Ø¯Ø±Ø³ Ø§Ù„Ø­Ø§Ù„ÙŠ: ${report.teacherName}` : "Ù„Ù… ÙŠØªÙ… Ø±Ø¨Ø· Ù…Ø¯Ø±Ø³ Ø¨Ø¹Ø¯",
      detailEn: report.teacherName ? `Current teacher: ${report.teacherName}` : "No teacher linked yet",
      tone: report.teacherName ? "success" : "warning",
    },
    {
      id: "sessions",
      titleAr: "Ø§Ù„Ø¥Ù†Ø¬Ø§Ø² Ø¯Ø§Ø®Ù„ Ø§Ù„Ø­ØµØµ",
      titleEn: "Session progress",
      detailAr: `Ø£Ù†Ø¬Ø² ${student.sessionsAttended} Ø­ØµØ© Ø­ØªÙ‰ Ø§Ù„Ø¢Ù† â€” ${report.cycleLabelAr}`,
      detailEn: `Completed ${student.sessionsAttended} sessions so far â€” ${report.cycleLabelEn}`,
      tone: student.sessionsAttended >= 4 ? "success" : "info",
    },
    {
      id: "report",
      titleAr: "Ù†Ù‚Ø·Ø© Ø§Ù„ØªÙ‚Ø±ÙŠØ± Ø§Ù„Ù‚Ø§Ø¯Ù…Ø©",
      titleEn: "Next report checkpoint",
      detailAr: report.ready
        ? `Ø¢Ø®Ø± Ù†Ù‚Ø·Ø© ØªÙ‚Ø±ÙŠØ± Ù…ÙƒØªÙ…Ù„Ø© Ø¹Ù†Ø¯ ${report.currentCheckpoint} Ø­ØµØµØŒ ÙˆØ§Ù„Ù†Ù‚Ø·Ø© Ø§Ù„Ù‚Ø§Ø¯Ù…Ø© Ø¹Ù†Ø¯ ${report.nextCheckpoint}`
        : `Ø£ÙˆÙ„ ØªÙ‚Ø±ÙŠØ± ÙŠØµØ¨Ø­ Ø¬Ø§Ù‡Ø²Ù‹Ø§ Ø¨Ø¹Ø¯ ${report.sessionsUntilNext} Ø­ØµØµ Ø¥Ø¶Ø§ÙÙŠØ©`,
      detailEn: report.ready
        ? `Last completed checkpoint at ${report.currentCheckpoint} sessions, next one at ${report.nextCheckpoint}`
        : `First report becomes ready after ${report.sessionsUntilNext} more sessions`,
      tone: report.ready ? "success" : "info",
    },
    {
      id: "payments",
      titleAr: "Ø§Ù„Ø§Ù„ØªØ²Ø§Ù… Ø§Ù„Ù…Ø§Ù„ÙŠ",
      titleEn: "Payment progress",
      detailAr: `Ø¥Ø¬Ù…Ø§Ù„ÙŠ Ø§Ù„Ù…Ø¯ÙÙˆØ¹ ${student.totalPaid} Ø¬Ù†ÙŠÙ‡`,
      detailEn: `Total paid ${student.totalPaid} EGP`,
      tone: student.totalPaid > 0 ? "success" : "warning",
    },
  ];

  const reportReady = student.sessionsAttended >= 4;
  const stageAr = reportReady ? "Ø¬Ø§Ù‡Ø² Ù„Ù„ØªÙ‚Ø±ÙŠØ± Ø§Ù„Ø­Ø§Ù„ÙŠ" : "Ù…Ø§ Ø²Ø§Ù„ Ù‚Ø¨Ù„ Ø£ÙˆÙ„ Ù†Ù‚Ø·Ø© ØªÙ‚Ø±ÙŠØ±";
  const stageEn = reportReady ? "Ready for the current report checkpoint" : "Still before the first report checkpoint";

  return { stageAr, stageEn, reportReady, milestones };
}
```

### FILE: src\services\student-report.service.ts
```ts
import { getCourseFormLabel } from "@/config/course-roadmap";
import type { CourseType, ScheduleSessionItem, TeacherListItem } from "@/types/crm";

export interface StudentReportSnapshot {
  ready: boolean;
  currentCheckpoint: number;
  nextCheckpoint: number;
  sessionsInCurrentCycle: number;
  sessionsUntilNext: number;
  progressPercent: number;
  teacherName: string | null;
  className: string | null;
  cycleLabelAr: string;
  cycleLabelEn: string;
}

export interface StudentMonthlyReportDraft {
  summaryAr: string;
  summaryEn: string;
  strengthsAr: string[];
  strengthsEn: string[];
  focusAreasAr: string[];
  focusAreasEn: string[];
  nextGoalAr: string;
  nextGoalEn: string;
}

function ceilToCheckpoint(value: number, checkpoint = 4): number {
  if (value <= 0) return checkpoint;
  return Math.ceil(value / checkpoint) * checkpoint;
}

export interface StudentReportSubject {
  fullName: string;
  sessionsAttended: number;
  currentCourse: CourseType | null;
  className: string | null;
  teachers?: Pick<TeacherListItem, "fullName">[];
  relatedSessions?: Pick<ScheduleSessionItem, "className">[];
}

export function buildStudentReportSnapshot(student: StudentReportSubject): StudentReportSnapshot {
  const totalSessions = Math.max(0, student.sessionsAttended);
  const nextCheckpoint = ceilToCheckpoint(totalSessions + (totalSessions % 4 === 0 ? 4 : 0));
  const currentCheckpoint = totalSessions >= 4 ? Math.floor(totalSessions / 4) * 4 : 0;
  const sessionsInCurrentCycle = totalSessions % 4;
  const sessionsUntilNext = totalSessions === 0 ? 4 : (4 - sessionsInCurrentCycle) % 4 || 4;
  const progressPercent = Math.min(100, Math.max(0, Math.round((sessionsInCurrentCycle / 4) * 100)));

  return {
    ready: totalSessions >= 4,
    currentCheckpoint,
    nextCheckpoint,
    sessionsInCurrentCycle,
    sessionsUntilNext,
    progressPercent,
    teacherName: student.teachers?.[0]?.fullName ?? null,
    className: student.className ?? student.relatedSessions?.[0]?.className ?? null,
    cycleLabelAr: currentCheckpoint > 0 ? `ØªÙ‚Ø±ÙŠØ± Ø­ØªÙ‰ Ø§Ù„Ø­ØµØ© ${currentCheckpoint}` : "Ù‚Ø¨Ù„ Ø£ÙˆÙ„ ØªÙ‚Ø±ÙŠØ± Ø´Ù‡Ø±ÙŠ",
    cycleLabelEn: currentCheckpoint > 0 ? `Report through session ${currentCheckpoint}` : "Before the first monthly report",
  };
}

export function buildStudentMonthlyReportDraft(student: StudentReportSubject): StudentMonthlyReportDraft {
  const snapshot = buildStudentReportSnapshot(student);
  const courseLabelAr = student.currentCourse ? getCourseFormLabel(student.currentCourse, "ar") : "Ø§Ù„Ù…Ø³Ø§Ø± Ø§Ù„Ø­Ø§Ù„ÙŠ";
  const courseLabelEn = student.currentCourse ? getCourseFormLabel(student.currentCourse, "en") : "current track";
  const teacherName = snapshot.teacherName ?? "Ø§Ù„Ù…Ø¯Ø±Ø³ Ø§Ù„Ø­Ø§Ù„ÙŠ";
  const teacherNameEn = snapshot.teacherName ?? "current teacher";
  const className = snapshot.className ?? "Ø§Ù„ÙƒÙ„Ø§Ø³ Ø§Ù„Ø­Ø§Ù„ÙŠ";
  const classNameEn = snapshot.className ?? "current class";

  return {
    summaryAr: `Ø§Ù„Ø·Ø§Ù„Ø¨ Ù…Ø³ØªÙ…Ø± ÙÙŠ ${courseLabelAr} Ø¯Ø§Ø®Ù„ ${className} Ù…Ø¹ ${teacherName}. Ø£Ù†Ø¬Ø² ${student.sessionsAttended} Ø­ØµØ© Ø­ØªÙ‰ Ø§Ù„Ø¢Ù† ÙˆÙ†Ø³Ø¨Ø© Ø§Ù„ØªÙ‚Ø¯Ù… Ø§Ù„Ø­Ø§Ù„ÙŠØ© ${snapshot.progressPercent}%.`,
    summaryEn: `The student is progressing in ${courseLabelEn} within ${classNameEn} with ${teacherNameEn}. ${student.sessionsAttended} sessions are completed so far with ${snapshot.progressPercent}% progress in the current cycle.`,
    strengthsAr: [
      `Ø§Ù„Ø§Ù„ØªØ²Ø§Ù… Ø¨Ø§Ù„Ø­Ø¶ÙˆØ± ÙˆØµÙ„ Ø¥Ù„Ù‰ ${student.sessionsAttended} Ø­ØµØ©`,
      snapshot.teacherName ? `ÙŠÙˆØ¬Ø¯ Ù…Ø¯Ø±Ø³ Ù…Ø±ØªØ¨Ø· Ø¨ÙˆØ¶ÙˆØ­: ${teacherName}` : "ØªÙ… ØªØ­Ø¯ÙŠØ¯ Ø§Ù„Ù…Ø³Ø§Ø± Ø§Ù„Ø¹Ø§Ù… Ù„Ù„Ø·Ø§Ù„Ø¨",
      student.currentCourse ? `Ø§Ù„Ù…Ø³Ø§Ø± Ø§Ù„Ø­Ø§Ù„ÙŠ Ù…Ø­Ø¯Ø¯: ${courseLabelAr}` : "Ù‡Ù†Ø§Ùƒ Ø­Ø§Ø¬Ø© Ù„ØªØ­Ø¯ÙŠØ¯ Ø§Ù„Ù…Ø³Ø§Ø± Ø¨Ø¯Ù‚Ø© Ø£ÙƒØ¨Ø±",
    ],
    strengthsEn: [
      `Attendance has reached ${student.sessionsAttended} sessions`,
      snapshot.teacherName ? `A clear teacher link exists: ${teacherNameEn}` : "The general learning path is identified",
      student.currentCourse ? `The current track is defined: ${courseLabelEn}` : "The track still needs sharper definition",
    ],
    focusAreasAr: [
      snapshot.sessionsUntilNext > 0 ? `Ø§Ù„Ù…ØªØ¨Ù‚ÙŠ ${snapshot.sessionsUntilNext} Ø­ØµØµ Ù„Ù„ÙˆØµÙˆÙ„ Ø¥Ù„Ù‰ Ù†Ù‚Ø·Ø© Ø§Ù„ØªÙ‚Ø±ÙŠØ± Ø§Ù„ØªØ§Ù„ÙŠØ©` : "Ø¬Ø§Ù‡Ø² Ù„Ù†Ù‚Ø·Ø© Ø§Ù„ØªÙ‚Ø±ÙŠØ± Ø§Ù„ØªØ§Ù„ÙŠØ©",
      snapshot.className ? `Ø§Ù„Ø­ÙØ§Ø¸ Ø¹Ù„Ù‰ Ø§Ù„Ø§ØªØ³Ø§Ù‚ Ø¯Ø§Ø®Ù„ ${className}` : "ØªØ«Ø¨ÙŠØª Ø§Ù„ÙƒÙ„Ø§Ø³ Ø§Ù„Ù…Ù†Ø§Ø³Ø¨ Ù„Ù„Ø·Ø§Ù„Ø¨",
      snapshot.teacherName ? `Ù…ØªØ§Ø¨Ø¹Ø© Ø§Ù„Ø®Ø·Ø© Ù…Ø¹ ${teacherName}` : "ØªØ¹ÙŠÙŠÙ† Ù…Ø¯Ø±Ø³ Ø£Ø³Ø§Ø³ÙŠ ÙˆÙ…ØªØ§Ø¨Ø¹Ø© Ø§Ù„Ø®Ø·Ø© Ù…Ø¹Ù‡",
    ],
    focusAreasEn: [
      snapshot.sessionsUntilNext > 0 ? `${snapshot.sessionsUntilNext} sessions remain before the next checkpoint` : "Ready for the next checkpoint",
      snapshot.className ? `Maintain consistency inside ${classNameEn}` : "Stabilize the student inside the right class",
      snapshot.teacherName ? `Continue the plan with ${teacherNameEn}` : "Assign a primary teacher and continue the plan",
    ],
    nextGoalAr: snapshot.sessionsUntilNext > 0 ? `Ø§Ù„ÙˆØµÙˆÙ„ Ø¥Ù„Ù‰ Ø§Ù„Ø­ØµØ© ${snapshot.nextCheckpoint} Ù„Ø§Ø³ØªØ®Ø±Ø§Ø¬ Ø§Ù„ØªÙ‚Ø±ÙŠØ± Ø§Ù„Ø´Ù‡Ø±ÙŠ Ø§Ù„ØªØ§Ù„ÙŠ.` : "Ù…Ø±Ø§Ø¬Ø¹Ø© Ø§Ù„ØªÙ‚Ø±ÙŠØ± Ø§Ù„Ø´Ù‡Ø±ÙŠ Ø§Ù„Ø­Ø§Ù„ÙŠ ÙˆØªØ­Ø¯ÙŠØ« Ø§Ù„Ù‡Ø¯Ù Ø§Ù„ØªØ§Ù„ÙŠ.",
    nextGoalEn: snapshot.sessionsUntilNext > 0 ? `Reach session ${snapshot.nextCheckpoint} to unlock the next monthly report.` : "Review the current monthly report and define the next goal.",
  };
}
```

### FILE: src\services\students.service.ts
```ts
import { createBrowserClient } from "@supabase/ssr";
import type { StudentStatus } from "@/types/common.types";
import type { Database } from "@/types/database.types";
import type { CreateStudentInput, StudentListItem } from "@/types/crm";
import { isBrowser, readStorage, sortByDateDesc, writeStorage } from "@/services/storage";

const STUDENTS_KEY = "skidy.crm.students";
const VALID_STATUSES: StudentStatus[] = ["trial", "active", "paused", "at_risk", "completed", "churned"];

function getSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key || !isBrowser()) return null;
  return createBrowserClient<Database>(url, key);
}

function asString(value: unknown, fallback = ""): string {
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : fallback;
}

function asNumber(value: unknown, fallback = 0): number {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
  }
  return fallback;
}

function asStatus(value: unknown): StudentStatus {
  return VALID_STATUSES.includes(value as StudentStatus) ? (value as StudentStatus) : "trial";
}

function asNullableString(value: unknown): string | null {
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : null;
}

function normalizePhone(value: string | null | undefined): string {
  return (value ?? "").replace(/\D/g, "").replace(/^20/, "");
}

function normalizeName(value: string | null | undefined): string {
  return (value ?? "")
    .toLowerCase()
    .replace(/[\u064B-\u065F]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function mapRow(row: Database["public"]["Tables"]["students"]["Row"] | Record<string, unknown>): StudentListItem {
  const record = row as Record<string, unknown>;
  return {
    id: asString(record.id, crypto.randomUUID()),
    fullName: asString(record.full_name ?? record.fullName, "Ø·Ø§Ù„Ø¨ ØºÙŠØ± Ù…Ø­Ø¯Ø¯"),
    age: asNumber(record.age, 0),
    parentId: asNullableString(record.parent_id ?? record.parentId),
    parentName: asString(record.parent_name ?? record.parentName, "ÙˆÙ„ÙŠ Ø£Ù…Ø± ØºÙŠØ± Ù…Ø­Ø¯Ø¯"),
    parentPhone: asString(record.parent_phone ?? record.parentPhone, "â€”"),
    status: asStatus(record.status),
    currentCourse: (typeof (record.current_course ?? record.currentCourse) === "string"
      ? (record.current_course ?? record.currentCourse)
      : null) as StudentListItem["currentCourse"],
    className: typeof (record.class_name ?? record.className) === "string" ? (record.class_name ?? record.className) as string : null,
    enrollmentDate: asString(record.enrollment_date ?? record.enrollmentDate, new Date().toISOString()),
    sessionsAttended: asNumber(record.sessions_attended ?? record.sessionsAttended, 0),
    totalPaid: asNumber(record.total_paid ?? record.totalPaid, 0),
  };
}

function getLocalStudents(): StudentListItem[] {
  return sortByDateDesc(readStorage(STUDENTS_KEY, [] as StudentListItem[]), (student) => student.enrollmentDate);
}

function saveLocalStudents(students: StudentListItem[]): void {
  writeStorage(STUDENTS_KEY, sortByDateDesc(students, (student) => student.enrollmentDate));
}

function clearLocalStudents(): void {
  writeStorage(STUDENTS_KEY, []);
}

function findExistingStudent(items: StudentListItem[], input: CreateStudentInput): StudentListItem | null {
  const studentName = normalizeName(input.fullName);
  const parentName = normalizeName(input.parentName);
  const parentPhone = normalizePhone(input.parentPhone);

  return (
    items.find((student) => input.parentId && student.parentId === input.parentId && normalizeName(student.fullName) === studentName) ??
    items.find((student) => normalizeName(student.fullName) === studentName && parentPhone.length > 0 && normalizePhone(student.parentPhone) === parentPhone) ??
    items.find((student) => normalizeName(student.fullName) === studentName && normalizeName(student.parentName) === parentName) ??
    null
  );
}

export async function listStudents(): Promise<StudentListItem[]> {
  const supabase = getSupabaseClient();
  if (!supabase) {
    clearLocalStudents();
    return [];
  }

  try {
    const { data, error } = await supabase
      .from("students")
      .select("*")
      .order("enrollment_date", { ascending: false });

    if (error) {
      console.error("[students] failed to load from Supabase", error);
      clearLocalStudents();
      return [];
    }

    if (!data || data.length === 0) {
      clearLocalStudents();
      return [];
    }

    const mapped = data.map((row: Database["public"]["Tables"]["students"]["Row"]) => mapRow(row));
    saveLocalStudents(mapped);
    return mapped;
  } catch (error) {
    console.error("[students] unexpected load failure", error);
    clearLocalStudents();
    return [];
  }
}

export async function getStudentById(id: string): Promise<StudentListItem | null> {
  const items = await listStudents();
  return items.find((student) => student.id === id) ?? null;
}

export async function createStudent(input: CreateStudentInput): Promise<StudentListItem> {
  const fullName = input.fullName.trim();
  const parentName = input.parentName.trim();
  const parentPhone = input.parentPhone.trim();

  if (!fullName || !parentName || !parentPhone) {
    throw new Error("Ø§Ø³Ù… Ø§Ù„Ø·Ø§Ù„Ø¨ ÙˆØ¨ÙŠØ§Ù†Ø§Øª ÙˆÙ„ÙŠ Ø§Ù„Ø£Ù…Ø± Ø§Ù„Ø£Ø³Ø§Ø³ÙŠØ© Ù…Ø·Ù„ÙˆØ¨Ø©.");
  }

  if (!Number.isFinite(input.age) || input.age < 4 || input.age > 18) {
    throw new Error("Ø¹Ù…Ø± Ø§Ù„Ø·Ø§Ù„Ø¨ ÙŠØ¬Ø¨ Ø£Ù† ÙŠÙƒÙˆÙ† Ø¨ÙŠÙ† 4 Ùˆ18 Ø³Ù†Ø©.");
  }

  const supabase = getSupabaseClient();
  if (!supabase) {
    throw new Error("ØªØ¹Ø°Ø± Ø§Ù„Ø§ØªØµØ§Ù„ Ø¨Ù‚Ø§Ø¹Ø¯Ø© Ø§Ù„Ø¨ÙŠØ§Ù†Ø§Øª. ØªØ£ÙƒØ¯ Ù…Ù† Ø¥Ø¹Ø¯Ø§Ø¯Ø§Øª Supabase Ø«Ù… Ø£Ø¹Ø¯ Ø§Ù„Ù…Ø­Ø§ÙˆÙ„Ø©.");
  }

  const existing = findExistingStudent(await listStudents(), input);
  if (existing) {
    return existing;
  }

  const payload: Database["public"]["Tables"]["students"]["Insert"] = {
    full_name: fullName,
    age: input.age,
    parent_id: input.parentId ?? null,
    parent_name: parentName,
    parent_phone: parentPhone,
    status: input.status ?? "active",
    current_course: input.currentCourse ?? null,
    class_name: input.className ?? null,
    enrollment_date: input.enrollmentDate ?? new Date().toISOString(),
    sessions_attended: input.sessionsAttended ?? 0,
    total_paid: input.totalPaid ?? 0,
    created_at: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from("students")
    .insert(payload)
    .select("*")
    .single();

  if (error || !data) {
    console.error("[students] create failed", error);
    throw new Error(error?.message || "ØªØ¹Ø°Ø± Ø¥Ù†Ø´Ø§Ø¡ Ø³Ø¬Ù„ Ø§Ù„Ø·Ø§Ù„Ø¨.");
  }

  const created = mapRow(data);
  saveLocalStudents([created, ...getLocalStudents().filter((item) => item.id !== created.id)]);
  return created;
}
```

### FILE: src\services\teacher-evaluations.service.ts
```ts
import { readStorage, writeStorage } from "@/services/storage";

const KEY = "skidy.crm.teacher-evaluations";

export interface TeacherEvaluationRecord {
  teacherId: string;
  rating: number | null;
  notes: string | null;
  updatedAt: string;
}

function readAll(): Record<string, TeacherEvaluationRecord> {
  return readStorage<Record<string, TeacherEvaluationRecord>>(KEY, {});
}

function writeAll(data: Record<string, TeacherEvaluationRecord>) {
  writeStorage(KEY, data);
}

export function getTeacherEvaluation(teacherId: string): TeacherEvaluationRecord | null {
  const all = readAll();
  return all[teacherId] ?? null;
}

export function saveTeacherEvaluation(input: { teacherId: string; rating: number | null; notes?: string | null }) {
  const all = readAll();
  const record: TeacherEvaluationRecord = {
    teacherId: input.teacherId,
    rating: input.rating,
    notes: input.notes?.trim() || null,
    updatedAt: new Date().toISOString(),
  };
  all[input.teacherId] = record;
  writeAll(all);
  return record;
}
```

### FILE: src\services\teacher-finance.service.ts
```ts
import type { CourseType, ScheduleSessionItem } from "@/types/crm";
import { readStorage, writeStorage } from "@/services/storage";

const KEY = "skidy.crm.teacher-finance";

export interface TeacherFinanceConfig {
  teacherId: string;
  sessionRate60: number;
  sessionRate90: number;
  sessionRate120: number;
  trackAdjustments: Record<CourseType, number>;
  notes: string | null;
  updatedAt: string | null;
}

export interface TeacherFinanceLineItem {
  sessionId: string;
  className: string;
  course: CourseType;
  minutes: number;
  payout: number;
}

export interface TeacherFinanceSummary {
  linkedSessions: number;
  weeklyEstimated: number;
  monthlyEstimated: number;
  averagePerSession: number;
  lines: TeacherFinanceLineItem[];
}

type TeacherFinanceStorage = Record<string, TeacherFinanceConfig>;

const DEFAULT_TRACK_ADJUSTMENTS: Record<CourseType, number> = {
  scratch: 0,
  python: 20,
  web: 30,
  ai: 40,
};

function defaultConfig(teacherId: string): TeacherFinanceConfig {
  return {
    teacherId,
    sessionRate60: 120,
    sessionRate90: 180,
    sessionRate120: 240,
    trackAdjustments: { ...DEFAULT_TRACK_ADJUSTMENTS },
    notes: null,
    updatedAt: null,
  };
}

function readAll(): TeacherFinanceStorage {
  return readStorage<TeacherFinanceStorage>(KEY, {});
}

function writeAll(data: TeacherFinanceStorage) {
  writeStorage(KEY, data);
}

function safeNumber(value: number | null | undefined, fallback: number): number {
  return Number.isFinite(value) ? Number(value) : fallback;
}

export function getTeacherFinanceConfig(teacherId: string): TeacherFinanceConfig {
  const stored = readAll()[teacherId];
  const base = defaultConfig(teacherId);
  if (!stored) return base;

  return {
    teacherId,
    sessionRate60: safeNumber(stored.sessionRate60, base.sessionRate60),
    sessionRate90: safeNumber(stored.sessionRate90, base.sessionRate90),
    sessionRate120: safeNumber(stored.sessionRate120, base.sessionRate120),
    trackAdjustments: {
      scratch: safeNumber(stored.trackAdjustments?.scratch, base.trackAdjustments.scratch),
      python: safeNumber(stored.trackAdjustments?.python, base.trackAdjustments.python),
      web: safeNumber(stored.trackAdjustments?.web, base.trackAdjustments.web),
      ai: safeNumber(stored.trackAdjustments?.ai, base.trackAdjustments.ai),
    },
    notes: stored.notes ?? null,
    updatedAt: stored.updatedAt ?? null,
  };
}

export function saveTeacherFinanceConfig(input: {
  teacherId: string;
  sessionRate60: number;
  sessionRate90: number;
  sessionRate120: number;
  trackAdjustments: Record<CourseType, number>;
  notes?: string | null;
}) {
  const all = readAll();
  const record: TeacherFinanceConfig = {
    teacherId: input.teacherId,
    sessionRate60: safeNumber(input.sessionRate60, 120),
    sessionRate90: safeNumber(input.sessionRate90, 180),
    sessionRate120: safeNumber(input.sessionRate120, 240),
    trackAdjustments: {
      scratch: safeNumber(input.trackAdjustments.scratch, 0),
      python: safeNumber(input.trackAdjustments.python, 20),
      web: safeNumber(input.trackAdjustments.web, 30),
      ai: safeNumber(input.trackAdjustments.ai, 40),
    },
    notes: input.notes?.trim() || null,
    updatedAt: new Date().toISOString(),
  };
  all[input.teacherId] = record;
  writeAll(all);
  return record;
}

function toMinutes(startTime: string, endTime: string): number {
  const [startHour, startMinute] = startTime.split(":").map(Number);
  const [endHour, endMinute] = endTime.split(":").map(Number);
  if ([startHour, startMinute, endHour, endMinute].some((value) => !Number.isFinite(value))) return 60;
  const start = startHour * 60 + startMinute;
  let end = endHour * 60 + endMinute;
  if (end <= start) end += 24 * 60;
  return Math.max(30, end - start);
}

function getBaseSessionRate(minutes: number, config: TeacherFinanceConfig): number {
  if (minutes <= 60) return config.sessionRate60;
  if (minutes <= 90) return config.sessionRate90;
  if (minutes <= 120) return config.sessionRate120;
  const extraMinutes = minutes - 120;
  return config.sessionRate120 + Math.ceil(extraMinutes / 30) * (config.sessionRate60 / 2);
}

export function computeTeacherFinanceSummary(sessions: ScheduleSessionItem[], config: TeacherFinanceConfig): TeacherFinanceSummary {
  const lines = sessions.map((session) => {
    const minutes = toMinutes(session.startTime, session.endTime);
    const payout = getBaseSessionRate(minutes, config) + (config.trackAdjustments[session.course] ?? 0);
    return {
      sessionId: session.id,
      className: session.className,
      course: session.course,
      minutes,
      payout,
    };
  });

  const weeklyEstimated = lines.reduce((sum, item) => sum + item.payout, 0);
  const monthlyEstimated = Math.round(weeklyEstimated * 4.33);

  return {
    linkedSessions: lines.length,
    weeklyEstimated,
    monthlyEstimated,
    averagePerSession: lines.length > 0 ? Math.round(weeklyEstimated / lines.length) : 0,
    lines,
  };
}
```

### FILE: src\services\teacher-reassignment.service.ts
```ts
import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@/types/database.types";
import type { ScheduleSessionItem } from "@/types/crm";
import { getTeacherById } from "@/services/teachers.service";
import { isBrowser, readStorage, writeStorage } from "@/services/storage";

const SCHEDULE_KEY = "skidy.crm.schedule";

function getSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key || !isBrowser()) return null;
  return createBrowserClient<Database>(url, key);
}

function normalizeName(value: string | null | undefined): string {
  return (value ?? "")
    .toLowerCase()
    .replace(/Ø£\.?\s*/g, "")
    .replace(/[\u064B-\u065F]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function sortSessions(items: ScheduleSessionItem[]): ScheduleSessionItem[] {
  return [...items].sort((a, b) => {
    if (a.day !== b.day) return a.day - b.day;
    return a.startTime.localeCompare(b.startTime);
  });
}

export interface TeacherReassignmentResult {
  classesUpdated: number;
  sessionsUpdated: number;
}

export async function reassignTeacherRelations(
  fromTeacherId: string,
  toTeacherId: string,
): Promise<TeacherReassignmentResult> {
  if (!fromTeacherId || !toTeacherId || fromTeacherId === toTeacherId) {
    return { classesUpdated: 0, sessionsUpdated: 0 };
  }

  const [fromTeacher, toTeacher] = await Promise.all([
    getTeacherById(fromTeacherId),
    getTeacherById(toTeacherId),
  ]);

  if (!fromTeacher || !toTeacher) {
    return { classesUpdated: 0, sessionsUpdated: 0 };
  }

  let classesUpdated = 0;
  let sessionsUpdated = 0;

  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      const { data: classRows } = await supabase.from("classes").select("id").eq("teacher_id", fromTeacherId);
      classesUpdated = classRows?.length ?? 0;
      if (classesUpdated > 0) {
        await supabase.from("classes").update({ teacher_id: toTeacherId }).eq("teacher_id", fromTeacherId);
      }

      const { data: sessionRows } = await supabase.from("sessions").select("id").eq("teacher_id", fromTeacherId);
      sessionsUpdated = sessionRows?.length ?? 0;
      if (sessionsUpdated > 0) {
        await supabase.from("sessions").update({ teacher_id: toTeacherId }).eq("teacher_id", fromTeacherId);
      }
    } catch {
      // noop; local cache update below still helps the current UI reflect the new assignment
    }
  }

  if (isBrowser()) {
    const current = readStorage(SCHEDULE_KEY, [] as ScheduleSessionItem[]);
    if (Array.isArray(current) && current.length > 0) {
      const fromName = normalizeName(fromTeacher.fullName);
      const next = current.map((session) => {
        const sessionTeacher = normalizeName(session.teacher);
        const matchesId = session.teacherId === fromTeacherId;
        const matchesName = sessionTeacher.length > 0 && (sessionTeacher === fromName || sessionTeacher.includes(fromName) || fromName.includes(sessionTeacher));
        if (!matchesId && !matchesName) return session;
        return {
          ...session,
          teacherId: toTeacherId,
          teacher: toTeacher.fullName,
        } satisfies ScheduleSessionItem;
      });

      writeStorage(SCHEDULE_KEY, sortSessions(next));
    }
  }

  return { classesUpdated, sessionsUpdated };
}
```

### FILE: src\services\teachers.service.ts
```ts
import { createBrowserClient } from "@supabase/ssr";
import type { CourseType, EmploymentType } from "@/types/common.types";
import type { CreateTeacherInput, TeacherListItem } from "@/types/crm";
import type { Database } from "@/types/database.types";
import { MOCK_TEACHERS } from "@/lib/mock-data";
import { isBrowser, readStorage, writeStorage } from "@/services/storage";

const TEACHERS_KEY = "skidy.crm.teachers";
const VALID_EMPLOYMENTS: EmploymentType[] = ["full_time", "part_time", "freelance"];
const VALID_COURSES: CourseType[] = ["scratch", "python", "web", "ai"];

function getSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key || !isBrowser()) return null;
  return createBrowserClient<Database>(url, key);
}

function sortTeachers(items: TeacherListItem[]): TeacherListItem[] {
  return [...items].sort((a, b) => a.fullName.localeCompare(b.fullName, "ar"));
}

function mockTeachers(): TeacherListItem[] {
  return MOCK_TEACHERS.map((teacher) => ({ ...teacher }));
}

function asString(value: unknown, fallback = ""): string {
  return typeof value === "string" && value.trim().length > 0 ? value : fallback;
}

function asNumber(value: unknown, fallback = 0): number {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
  }
  return fallback;
}

function asEmployment(value: unknown): EmploymentType {
  return VALID_EMPLOYMENTS.includes(value as EmploymentType) ? (value as EmploymentType) : "part_time";
}

function asSpecialization(value: unknown, fallback: CourseType[] = []): CourseType[] {
  if (Array.isArray(value)) {
    return value.filter((item): item is CourseType => VALID_COURSES.includes(item as CourseType));
  }
  if (typeof value === "string") {
    return value
      .split(",")
      .map((item) => item.trim())
      .filter((item): item is CourseType => VALID_COURSES.includes(item as CourseType));
  }
  return fallback;
}

function normalizeName(value: string | null | undefined): string {
  return (value ?? "").toLowerCase().replace(/[\u064B-\u065F]/g, "").replace(/\s+/g, " ").trim();
}

function normalizePhone(value: string | null | undefined): string {
  const digits = (value ?? "").replace(/\D/g, "");
  if (digits.startsWith("20") && digits.length > 11) return digits.slice(2);
  if (digits.startsWith("2") && digits.length === 12) return digits.slice(1);
  return digits;
}

function mapRow(row: Record<string, unknown>): TeacherListItem {
  const fallback = MOCK_TEACHERS.find(
    (teacher) => teacher.fullName === asString(row.full_name) || teacher.email === asString(row.email),
  );

  return {
    id: asString(row.id, crypto.randomUUID()),
    fullName: asString(row.full_name ?? row.fullName, "Ù…Ø¯Ø±Ø³ ØºÙŠØ± Ù…Ø­Ø¯Ø¯"),
    phone: asString(row.phone, fallback?.phone ?? "â€”"),
    email: asString(row.email, fallback?.email ?? "") || null,
    specialization: asSpecialization(row.specialization, fallback?.specialization ?? []),
    employment: asEmployment(row.employment ?? fallback?.employment),
    classesCount: asNumber(row.classes_count ?? row.classesCount, fallback?.classesCount ?? 0),
    studentsCount: asNumber(row.students_count ?? row.studentsCount, fallback?.studentsCount ?? 0),
    isActive: Boolean(row.is_active ?? row.isActive ?? fallback?.isActive ?? true),
  };
}

function getLocalTeachers(): TeacherListItem[] {
  return sortTeachers(readStorage(TEACHERS_KEY, mockTeachers()));
}

function saveLocalTeachers(items: TeacherListItem[]): void {
  writeStorage(TEACHERS_KEY, sortTeachers(items));
}

export async function listTeachers(): Promise<TeacherListItem[]> {
  const fallback = getLocalTeachers();
  const supabase = getSupabaseClient();
  if (!supabase) return fallback;

  try {
    const { data, error } = await supabase.from("teachers").select("*").order("created_at", { ascending: false });
    if (error || !data || data.length === 0) return fallback;
    const mapped = data.map((row) => mapRow(row as Record<string, unknown>));
    saveLocalTeachers(mapped);
    return mapped;
  } catch {
    return fallback;
  }
}

export async function getTeacherById(id: string): Promise<TeacherListItem | null> {
  const items = await listTeachers();
  return items.find((teacher) => teacher.id === id) ?? null;
}

export async function createTeacher(input: CreateTeacherInput): Promise<TeacherListItem> {
  const supabase = getSupabaseClient();
  if (!supabase) {
    throw new Error("ØªØ¹Ø°Ø± Ø§Ù„Ø§ØªØµØ§Ù„ Ø¨Ù‚Ø§Ø¹Ø¯Ø© Ø§Ù„Ø¨ÙŠØ§Ù†Ø§Øª. Ø£Ø¹Ø¯ Ø§Ù„Ù…Ø­Ø§ÙˆÙ„Ø© Ø¨Ø¹Ø¯ ØªØ³Ø¬ÙŠÙ„ Ø§Ù„Ø¯Ø®ÙˆÙ„ Ø£Ùˆ Ø§Ù„ØªØ­Ù‚Ù‚ Ù…Ù† Ø§Ù„Ø¥Ø¹Ø¯Ø§Ø¯Ø§Øª.");
  }

  const existing = await listTeachers();
  const duplicate = existing.find((teacher) => {
    const samePhone = normalizePhone(teacher.phone) === normalizePhone(input.phone);
    const inputEmail = (input.email ?? "").trim().toLowerCase();
    const teacherEmail = (teacher.email ?? "").trim().toLowerCase();
    const sameEmail = teacherEmail.length > 0 && inputEmail.length > 0 && teacherEmail === inputEmail;
    const sameName = normalizeName(teacher.fullName) === normalizeName(input.fullName);
    return samePhone || sameEmail || (sameName && samePhone);
  });

  if (duplicate) {
    throw new Error("ÙŠÙˆØ¬Ø¯ Ù…Ø¯Ø±Ø³ Ù…Ø³Ø¬Ù„ Ø¨Ø§Ù„ÙØ¹Ù„ Ø¨Ù†ÙØ³ Ø§Ù„Ø§Ø³Ù… Ø£Ùˆ Ø§Ù„Ù‡Ø§ØªÙ Ø£Ùˆ Ø§Ù„Ø¨Ø±ÙŠØ¯ Ø§Ù„Ø¥Ù„ÙƒØªØ±ÙˆÙ†ÙŠ.");
  }

  const payload: Database["public"]["Tables"]["teachers"]["Insert"] = {
    full_name: input.fullName,
    phone: input.phone,
    email: input.email?.trim() || null,
    employment: input.employment,
    specialization: input.specialization,
    is_active: input.isActive ?? true,
    created_at: new Date().toISOString(),
  };

  const { data, error } = await supabase.from("teachers").insert(payload).select("*").single();
  if (error || !data) {
    throw new Error(error?.message || "ØªØ¹Ø°Ø± Ø¥Ù†Ø´Ø§Ø¡ Ø³Ø¬Ù„ Ø§Ù„Ù…Ø¯Ø±Ø³");
  }

  const created = mapRow(data as Record<string, unknown>);
  saveLocalTeachers([created, ...getLocalTeachers().filter((teacher) => teacher.id !== created.id)]);
  return created;
}


export async function deleteTeacher(id: string): Promise<boolean> {
  const supabase = getSupabaseClient();
  if (!supabase) {
    throw new Error("ØªØ¹Ø°Ø± Ø§Ù„Ø§ØªØµØ§Ù„ Ø¨Ù‚Ø§Ø¹Ø¯Ø© Ø§Ù„Ø¨ÙŠØ§Ù†Ø§Øª. Ø£Ø¹Ø¯ Ø§Ù„Ù…Ø­Ø§ÙˆÙ„Ø© Ø¨Ø¹Ø¯ ØªØ³Ø¬ÙŠÙ„ Ø§Ù„Ø¯Ø®ÙˆÙ„ Ø£Ùˆ Ø§Ù„ØªØ­Ù‚Ù‚ Ù…Ù† Ø§Ù„Ø¥Ø¹Ø¯Ø§Ø¯Ø§Øª.");
  }

  const { error } = await supabase.from("teachers").delete().eq("id", id);
  if (error) {
    throw new Error(error.message || "ØªØ¹Ø°Ø± Ø­Ø°Ù Ø§Ù„Ù…Ø¯Ø±Ø³");
  }

  saveLocalTeachers(getLocalTeachers().filter((teacher) => teacher.id !== id));
  return true;
}
```
## 3. DATABASE TYPES
```ts
/**
 * Minimal Supabase database typing for the current CRM modules.
 * This stays intentionally lightweight until the schema is generated from Supabase CLI.
 */

import type {
  CommChannel,
  CourseType,
  FollowUpType,
  LeadSource,
  LeadStage,
  LeadTemperature,
  LossReason,
  PaymentMethod,
  PaymentStatus,
  Priority,
  StudentStatus,
  UserRole,
} from "@/types/common.types";

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string | null;
          full_name: string | null;
          full_name_ar: string | null;
          role: UserRole | null;
          avatar_url: string | null;
          is_active: boolean | null;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: Partial<Database["public"]["Tables"]["profiles"]["Row"]> & {
          id: string;
        };
        Update: Partial<Database["public"]["Tables"]["profiles"]["Row"]>;
        Relationships: [];
      };
      leads: {
        Row: {
          id: string;
          parent_id: string | null;
          parent_name: string | null;
          parent_phone: string | null;
          parent_whatsapp: string | null;
          child_name: string | null;
          child_age: number | null;
          stage: LeadStage | null;
          temperature: LeadTemperature | null;
          source: LeadSource | null;
          has_laptop: boolean | null;
          has_prior_experience: boolean | null;
          child_interests: string | null;
          suggested_course: CourseType | null;
          price_range_shared: boolean | null;
          whatsapp_collected: boolean | null;
          main_objection: string | null;
          loss_reason: LossReason | null;
          loss_notes: string | null;
          assigned_to: string | null;
          assigned_to_name: string | null;
          first_contact_at: string | null;
          last_contact_at: string | null;
          next_follow_up_at: string | null;
          won_at: string | null;
          lost_at: string | null;
          notes: string | null;
          created_by: string | null;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: Partial<Database["public"]["Tables"]["leads"]["Row"]> & {
          id?: string;
        };
        Update: Partial<Database["public"]["Tables"]["leads"]["Row"]>;
        Relationships: [];
      };
      follow_ups: {
        Row: {
          id: string;
          lead_id: string | null;
          title: string | null;
          lead_name: string | null;
          parent_name: string | null;
          type: FollowUpType | null;
          channel: CommChannel | null;
          priority: Priority | null;
          scheduled_at: string | null;
          status: string | null;
          assigned_to: string | null;
          created_at: string | null;
          completed_at: string | null;
        };
        Insert: Partial<Database["public"]["Tables"]["follow_ups"]["Row"]> & {
          id?: string;
        };
        Update: Partial<Database["public"]["Tables"]["follow_ups"]["Row"]>;
        Relationships: [];
      };
      lead_activities: {
        Row: {
          id: string;
          lead_id: string | null;
          action: string | null;
          type: string | null;
          by_name: string | null;
          created_at: string | null;
        };
        Insert: Partial<Database["public"]["Tables"]["lead_activities"]["Row"]> & {
          id?: string;
        };
        Update: Partial<Database["public"]["Tables"]["lead_activities"]["Row"]>;
        Relationships: [];
      };
      students: {
        Row: {
          id: string;
          full_name: string | null;
          age: number | null;
          parent_id: string | null;
          parent_name: string | null;
          parent_phone: string | null;
          status: StudentStatus | null;
          current_course: CourseType | null;
          class_name: string | null;
          enrollment_date: string | null;
          sessions_attended: number | null;
          total_paid: number | null;
          created_at: string | null;
        };
        Insert: Partial<Database["public"]["Tables"]["students"]["Row"]> & {
          id?: string;
        };
        Update: Partial<Database["public"]["Tables"]["students"]["Row"]>;
        Relationships: [];
      };
      parents: {
        Row: {
          id: string;
          full_name: string | null;
          phone: string | null;
          whatsapp: string | null;
          email: string | null;
          city: string | null;
          children_count: number | null;
          created_at: string | null;
        };
        Insert: Partial<Database["public"]["Tables"]["parents"]["Row"]> & {
          id?: string;
        };
        Update: Partial<Database["public"]["Tables"]["parents"]["Row"]>;
        Relationships: [];
      };
      payments: {
        Row: {
          id: string;
          student_id: string | null;
          amount: number | null;
          status: PaymentStatus | null;
          method: PaymentMethod | null;
          due_date: string | null;
          paid_at: string | null;
          notes: string | null;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: Partial<Database["public"]["Tables"]["payments"]["Row"]> & {
          id?: string;
        };
        Update: Partial<Database["public"]["Tables"]["payments"]["Row"]>;
        Relationships: [];
      };
      classes: {
        Row: {
          id: string;
          name: string | null;
          course: string | null;
          teacher_id: string | null;
          day_of_week: number | null;
          start_time: string | null;
          end_time: string | null;
          is_active: boolean | null;
          created_at: string | null;
        };
        Insert: Partial<Database["public"]["Tables"]["classes"]["Row"]> & {
          id?: string;
        };
        Update: Partial<Database["public"]["Tables"]["classes"]["Row"]>;
        Relationships: [];
      };
      sessions: {
        Row: {
          id: string;
          class_id: string | null;
          teacher_id: string | null;
          title: string | null;
          status: string | null;
          start_time: string | null;
          end_time: string | null;
          session_date: string | null;
          day_of_week: number | null;
          created_at: string | null;
        };
        Insert: Partial<Database["public"]["Tables"]["sessions"]["Row"]> & {
          id?: string;
        };
        Update: Partial<Database["public"]["Tables"]["sessions"]["Row"]>;
        Relationships: [];
      };
      teachers: {
        Row: {
          id: string;
          full_name: string | null;
          phone: string | null;
          email: string | null;
          specialization: string[] | null;
          employment: string | null;
          classes_count: number | null;
          students_count: number | null;
          is_active: boolean | null;
          created_at: string | null;
        };
        Insert: Partial<Database["public"]["Tables"]["teachers"]["Row"]> & {
          id?: string;
        };
        Update: Partial<Database["public"]["Tables"]["teachers"]["Row"]>;
        Relationships: [];
      };
      class_enrollments: {
        Row: {
          id: string;
          class_id: string | null;
          student_id: string | null;
          is_active: boolean | null;
          created_at: string | null;
        };
        Insert: Partial<Database["public"]["Tables"]["class_enrollments"]["Row"]> & {
          id?: string;
        };
        Update: Partial<Database["public"]["Tables"]["class_enrollments"]["Row"]>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      get_my_role: {
        Args: Record<string, never>;
        Returns: UserRole | null;
      };
    };
    Enums: Record<string, never>;
  };
}

export type TableName = keyof Database["public"]["Tables"];
export type TableRow<T extends TableName> = Database["public"]["Tables"][T]["Row"];
export type TableInsert<T extends TableName> = Database["public"]["Tables"][T]["Insert"];
export type TableUpdate<T extends TableName> = Database["public"]["Tables"][T]["Update"];

```
## 4. STORES (ZUSTAND)
## 5. SUPABASE CLIENT CONFIG

### FILE: src\lib\supabase\client.ts
```ts
import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
```

### FILE: supabase\migrations\client.ts
```ts
import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
```
## 6. PAGE FILES

### FILE: password_note_fix\src\app\(dashboard)\settings\page.tsx
```tsx
"use client";

import { useMemo, useRef, useState, type ChangeEvent, type ReactNode } from "react";
import {
  Bell,
  Database,
  Download,
  Eye,
  EyeOff,
  KeyRound,
  Languages,
  MoonStar,
  Palette,
  RotateCcw,
  Save,
  Settings,
  ShieldCheck,
  Trash2,
  Upload,
  User,
} from "lucide-react";
import { useTheme } from "next-themes";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { useUIStore } from "@/stores/ui-store";
import { t } from "@/lib/locale";
import {
  clearStorageByPrefix,
  CRM_STORAGE_PREFIX,
  exportStorageSnapshot,
  getStorageEntriesByPrefix,
  importStorageSnapshot,
  parseStorageSnapshot,
} from "@/services/storage";

export default function SettingsPage() {
  const { theme, setTheme } = useTheme();
  const { locale, setLocale, sidebarOpen, setSidebarOpen } = useUIStore();
  const [notifications, setNotifications] = useState({ email: true, whatsapp: true, browser: false });
  const [profile, setProfile] = useState({ name: "Abdelrahman", email: "admin@skidyrein.com" });
  const [passwordForm, setPasswordForm] = useState({ next: "", confirm: "" });
  const [showPassword, setShowPassword] = useState({ next: false, confirm: false });
  const [busy, setBusy] = useState<null | "save" | "reset" | "clear" | "export" | "import" | "password">(null);
  const backupInputRef = useRef<HTMLInputElement | null>(null);
  const supabase = useMemo(() => createClient(), []);

  const previewText = useMemo(
    () => ({
      title: t(locale, "Ù…Ø¹Ø§ÙŠÙ†Ø© Ø³Ø±ÙŠØ¹Ø©", "Quick preview"),
      body: t(
        locale,
        "Ù‡Ø°Ù‡ Ø§Ù„ØªÙØ¶ÙŠÙ„Ø§Øª ØªÙØ·Ø¨Ù‘ÙŽÙ‚ Ù…Ø­Ù„ÙŠÙ‹Ø§ Ø¯Ø§Ø®Ù„ Ø§Ù„Ù…ØªØµÙØ­ Ø§Ù„Ø­Ø§Ù„ÙŠØŒ ÙˆÙ‡ÙŠ Ù…Ù†Ø§Ø³Ø¨Ø© Ø¬Ø¯Ù‹Ø§ Ù„Ù†Ø³Ø®Ø© Ø§Ù„ØªØ´ØºÙŠÙ„ Ø§Ù„Ø¯Ø§Ø®Ù„ÙŠ ÙˆØ§Ù„Ù€ demo.",
        "These preferences are applied locally in the current browser and work well for the internal and demo build.",
      ),
    }),
    [locale],
  );

  const localDataCount = useMemo(() => getStorageEntriesByPrefix(CRM_STORAGE_PREFIX).length, []);

  const passwordChecks = useMemo(() => ({
    length: passwordForm.next.length >= 8,
    letter: /[A-Za-z]/.test(passwordForm.next),
    number: /\d/.test(passwordForm.next),
    match: passwordForm.next.length > 0 && passwordForm.next === passwordForm.confirm,
  }), [passwordForm]);

  const handleChangePassword = async () => {
    if (!passwordChecks.length || !passwordChecks.letter || !passwordChecks.number) {
      toast.error(
        t(
          locale,
          "ÙƒÙ„Ù…Ø© Ø§Ù„Ù…Ø±ÙˆØ± Ø§Ù„Ø¬Ø¯ÙŠØ¯Ø© ÙŠØ¬Ø¨ Ø£Ù† ØªÙƒÙˆÙ† 8 Ø£Ø­Ø±Ù Ø¹Ù„Ù‰ Ø§Ù„Ø£Ù‚Ù„ ÙˆØªØ­ØªÙˆÙŠ Ø¹Ù„Ù‰ Ø­Ø±ÙˆÙ ÙˆØ£Ø±Ù‚Ø§Ù….",
          "The new password must be at least 8 characters and include letters and numbers.",
        ),
      );
      return;
    }

    if (!passwordChecks.match) {
      toast.error(t(locale, "ØªØ£ÙƒÙŠØ¯ ÙƒÙ„Ù…Ø© Ø§Ù„Ù…Ø±ÙˆØ± ØºÙŠØ± Ù…Ø·Ø§Ø¨Ù‚.", "Password confirmation does not match."));
      return;
    }

    try {
      setBusy("password");
      const { error } = await supabase.auth.updateUser({ password: passwordForm.next });

      if (error) {
        toast.error(error.message);
        return;
      }

      setPasswordForm({ next: "", confirm: "" });
      toast.success(
        t(
          locale,
          "ØªÙ… ØªØ­Ø¯ÙŠØ« ÙƒÙ„Ù…Ø© Ø§Ù„Ù…Ø±ÙˆØ± Ø¨Ù†Ø¬Ø§Ø­. Ø§Ø³ØªØ®Ø¯Ù… Ø§Ù„ÙƒÙ„Ù…Ø© Ø§Ù„Ø¬Ø¯ÙŠØ¯Ø© ÙÙŠ ØªØ³Ø¬ÙŠÙ„Ø§Øª Ø§Ù„Ø¯Ø®ÙˆÙ„ Ø§Ù„Ù‚Ø§Ø¯Ù…Ø©.",
          "Password updated successfully. Use the new password for future sign-ins.",
        ),
      );
    } finally {
      setBusy(null);
    }
  };

  const handleSave = async () => {
    setBusy("save");
    await new Promise((resolve) => setTimeout(resolve, 250));
    toast.success(t(locale, "ØªÙ… Ø­ÙØ¸ Ø§Ù„Ø¥Ø¹Ø¯Ø§Ø¯Ø§Øª Ø¨Ù†Ø¬Ø§Ø­", "Settings saved successfully"));
    setBusy(null);
  };

  const handleResetDemoData = async () => {
    setBusy("reset");
    clearStorageByPrefix(CRM_STORAGE_PREFIX);
    toast.success(t(locale, "ØªÙ…Øª Ø¥Ø¹Ø§Ø¯Ø© Ø¨ÙŠØ§Ù†Ø§Øª Ø§Ù„Ù†Ø³Ø®Ø© Ø§Ù„ØªØ¬Ø±ÙŠØ¨ÙŠØ©. Ø³ÙŠÙØ¹Ø§Ø¯ ØªØ­Ù…ÙŠÙ„ Ø§Ù„ØµÙØ­Ø© Ø§Ù„Ø¢Ù†.", "Demo data was restored. The page will reload now."));
    window.setTimeout(() => window.location.reload(), 500);
  };

  const handleClearLocalData = async () => {
    setBusy("clear");
    clearStorageByPrefix(CRM_STORAGE_PREFIX);
    toast.success(t(locale, "ØªÙ… Ù…Ø³Ø­ Ø§Ù„Ø¨ÙŠØ§Ù†Ø§Øª Ø§Ù„Ù…Ø­Ù„ÙŠØ© Ø§Ù„Ù…Ø­ÙÙˆØ¸Ø©. Ø³ÙŠÙØ¹Ø§Ø¯ ØªØ­Ù…ÙŠÙ„ Ø§Ù„ØµÙØ­Ø© Ø§Ù„Ø¢Ù†.", "Saved local data was cleared. The page will reload now."));
    window.setTimeout(() => window.location.reload(), 500);
  };

  const handleExportBackup = async () => {
    try {
      setBusy("export");
      const snapshot = exportStorageSnapshot(CRM_STORAGE_PREFIX);
      const blob = new Blob([JSON.stringify(snapshot, null, 2)], { type: "application/json" });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      const datePart = new Date().toISOString().slice(0, 19).replace(/[T:]/g, "-");
      link.href = url;
      link.download = `skidy-rein-backup-${datePart}.json`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast.success(t(locale, "ØªÙ… ØªÙ†Ø²ÙŠÙ„ Ù†Ø³Ø®Ø© Ø§Ø­ØªÙŠØ§Ø·ÙŠØ© Ù…Ø­Ù„ÙŠØ© Ø¨Ù†Ø¬Ø§Ø­", "Local backup exported successfully"));
    } finally {
      setBusy(null);
    }
  };

  const handleImportBackup = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setBusy("import");
      const content = await file.text();
      const snapshot = parseStorageSnapshot(content);

      if (!snapshot) {
        toast.error(t(locale, "Ù…Ù„Ù Ø§Ù„Ù†Ø³Ø®Ø© Ø§Ù„Ø§Ø­ØªÙŠØ§Ø·ÙŠØ© ØºÙŠØ± ØµØ§Ù„Ø­", "Invalid backup file"));
        return;
      }

      const { imported } = importStorageSnapshot(snapshot, {
        clearExisting: true,
        expectedPrefix: CRM_STORAGE_PREFIX,
      });

      toast.success(
        t(
          locale,
          `ØªÙ… Ø§Ø³ØªÙŠØ±Ø§Ø¯ ${imported} Ø¹Ù†ØµØ± Ù…Ù† Ø§Ù„Ù†Ø³Ø®Ø© Ø§Ù„Ø§Ø­ØªÙŠØ§Ø·ÙŠØ©. Ø³ÙŠÙØ¹Ø§Ø¯ ØªØ­Ù…ÙŠÙ„ Ø§Ù„ØµÙØ­Ø© Ø§Ù„Ø¢Ù†.`,
          `Imported ${imported} backup entries. The page will reload now.`,
        ),
      );
      window.setTimeout(() => window.location.reload(), 500);
    } catch {
      toast.error(t(locale, "ØªØ¹Ø°Ø± Ø§Ø³ØªÙŠØ±Ø§Ø¯ Ø§Ù„Ù†Ø³Ø®Ø© Ø§Ù„Ø§Ø­ØªÙŠØ§Ø·ÙŠØ©", "Could not import the backup"));
    } finally {
      event.target.value = "";
      setBusy(null);
    }
  };

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="rounded-3xl border border-border bg-card p-6">
        <h1 className="flex items-center gap-2 text-2xl font-bold text-foreground">
          <Settings size={28} className="text-brand-600" />
          {t(locale, "Ø§Ù„Ø¥Ø¹Ø¯Ø§Ø¯Ø§Øª", "Settings")}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {t(
            locale,
            "Ù…Ø±ÙƒØ² ÙˆØ§Ø­Ø¯ Ù„ØªÙØ¶ÙŠÙ„Ø§Øª Ø§Ù„Ø¹Ø±Ø¶ ÙˆØ§Ù„Ù„ØºØ© ÙˆØ§Ù„Ø¥Ø´Ø¹Ø§Ø±Ø§Øª ÙˆØ¥Ø¯Ø§Ø±Ø© Ø¨ÙŠØ§Ù†Ø§Øª Ø§Ù„Ù†Ø³Ø®Ø© Ø§Ù„Ù…Ø­Ù„ÙŠØ©",
            "One place for appearance, language, notifications, and local demo data controls",
          )}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-6">
          <Card title={t(locale, "Ø§Ù„Ù…Ù„Ù Ø§Ù„Ø´Ø®ØµÙŠ", "Profile")} icon={User}>
            <div className="mb-4 flex items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-700 text-2xl font-bold text-white">A</div>
              <div>
                <p className="text-lg font-bold text-foreground">{profile.name}</p>
                <p className="text-sm text-muted-foreground">{t(locale, "Ù…Ø¯ÙŠØ± Ø§Ù„Ù†Ø¸Ø§Ù…", "System admin")}</p>
              </div>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label={t(locale, "Ø§Ù„Ø§Ø³Ù…", "Name")} value={profile.name} onChange={(value) => setProfile((prev) => ({ ...prev, name: value }))} />
              <Field label={t(locale, "Ø§Ù„Ø¨Ø±ÙŠØ¯", "Email")} type="email" value={profile.email} onChange={(value) => setProfile((prev) => ({ ...prev, email: value }))} />
            </div>
          </Card>

          <Card title={t(locale, "Ø£Ù…Ø§Ù† Ø§Ù„Ø­Ø³Ø§Ø¨", "Account security")} icon={ShieldCheck}>
            <div className="space-y-4">
              <div className="rounded-2xl border border-border bg-background p-4">
                <p className="text-sm font-semibold text-foreground">{t(locale, "ØªØºÙŠÙŠØ± ÙƒÙ„Ù…Ø© Ø§Ù„Ù…Ø±ÙˆØ±", "Change password")}</p>
              </div>

              <div className="grid grid-cols-1 gap-4">
                <PasswordField
                  label={t(locale, "ÙƒÙ„Ù…Ø© Ø§Ù„Ù…Ø±ÙˆØ± Ø§Ù„Ø¬Ø¯ÙŠØ¯Ø©", "New password")}
                  value={passwordForm.next}
                  visible={showPassword.next}
                  onToggleVisibility={() => setShowPassword((prev) => ({ ...prev, next: !prev.next }))}
                  onChange={(value) => setPasswordForm((prev) => ({ ...prev, next: value }))}
                />
                <PasswordField
                  label={t(locale, "ØªØ£ÙƒÙŠØ¯ ÙƒÙ„Ù…Ø© Ø§Ù„Ù…Ø±ÙˆØ±", "Confirm password")}
                  value={passwordForm.confirm}
                  visible={showPassword.confirm}
                  onToggleVisibility={() => setShowPassword((prev) => ({ ...prev, confirm: !prev.confirm }))}
                  onChange={(value) => setPasswordForm((prev) => ({ ...prev, confirm: value }))}
                />
              </div>

              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                <PasswordCheck label={t(locale, "8 Ø£Ø­Ø±Ù Ø£Ùˆ Ø£ÙƒØ«Ø±", "8 characters or more")} passed={passwordChecks.length} />
                <PasswordCheck label={t(locale, "ÙŠØ­ØªÙˆÙŠ Ø¹Ù„Ù‰ Ø­Ø±ÙˆÙ", "Contains letters")} passed={passwordChecks.letter} />
                <PasswordCheck label={t(locale, "ÙŠØ­ØªÙˆÙŠ Ø¹Ù„Ù‰ Ø£Ø±Ù‚Ø§Ù…", "Contains numbers")} passed={passwordChecks.number} />
                <PasswordCheck label={t(locale, "Ø§Ù„ØªØ£ÙƒÙŠØ¯ Ù…Ø·Ø§Ø¨Ù‚", "Confirmation matches")} passed={passwordChecks.match} />
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-muted/30 p-4">
                <div className="space-y-1">
                  <p className="text-sm font-semibold text-foreground">{t(locale, "ØªØ­Ø¯ÙŠØ« ÙƒÙ„Ù…Ø© Ø§Ù„Ù…Ø±ÙˆØ± Ù„Ù„Ø­Ø³Ø§Ø¨ Ø§Ù„Ø­Ø§Ù„ÙŠ", "Update password for the current account")}</p>
                  <p className="text-xs text-muted-foreground">
                    {t(
                      locale,
                      "Ø¥Ø°Ø§ Ø§Ù†ØªÙ‡Øª Ø§Ù„Ø¬Ù„Ø³Ø© Ø§Ù„Ø­Ø§Ù„ÙŠØ© Ø£Ùˆ Ø§Ù†ØªÙ‡Øª ØµÙ„Ø§Ø­ÙŠØªÙ‡Ø§ØŒ Ù‚Ø¯ ØªØ­ØªØ§Ø¬ Ø¥Ù„Ù‰ ØªØ³Ø¬ÙŠÙ„ Ø§Ù„Ø¯Ø®ÙˆÙ„ Ù…Ø±Ø© Ø£Ø®Ø±Ù‰ Ø«Ù… Ø¥Ø¹Ø§Ø¯Ø© Ø§Ù„Ù…Ø­Ø§ÙˆÙ„Ø©.",
                      "If the current session has expired, you may need to sign in again before retrying.",
                    )}
                  </p>
                </div>
                <button
                  onClick={handleChangePassword}
                  disabled={busy === "password"}
                  className={cn(
                    "inline-flex items-center gap-2 rounded-xl bg-brand-700 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-60",
                  )}
                >
                  <KeyRound size={16} />
                  {busy === "password" ? t(locale, "Ø¬Ø§Ø±Ù Ø§Ù„ØªØ­Ø¯ÙŠØ«...", "Updating...") : t(locale, "ØªØ­Ø¯ÙŠØ« ÙƒÙ„Ù…Ø© Ø§Ù„Ù…Ø±ÙˆØ±", "Update password")}
                </button>
              </div>
            </div>
          </Card>

          <Card title={t(locale, "Ø§Ù„Ù…Ø¸Ù‡Ø± ÙˆØ§Ù„Ù„ØºØ©", "Appearance & language")} icon={Palette}>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <SelectField
                label={t(locale, "Ø§Ù„Ø³Ù…Ø©", "Theme")}
                value={theme ?? "system"}
                onChange={(value) => setTheme(value)}
                options={[
                  { value: "light", label: t(locale, "ÙØ§ØªØ­", "Light") },
                  { value: "dark", label: t(locale, "Ø¯Ø§ÙƒÙ†", "Dark") },
                  { value: "system", label: t(locale, "ØªÙ„Ù‚Ø§Ø¦ÙŠ", "System") },
                ]}
              />
              <SelectField
                label={t(locale, "Ø§Ù„Ù„ØºØ©", "Language")}
                value={locale}
                onChange={(value) => setLocale(value as "ar" | "en")}
                options={[
                  { value: "ar", label: "Ø§Ù„Ø¹Ø±Ø¨ÙŠØ©" },
                  { value: "en", label: "English" },
                ]}
              />
            </div>
            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <ToggleRow
                icon={Languages}
                title={t(locale, "Ø§Ù„Ø´Ø±ÙŠØ· Ø§Ù„Ø¬Ø§Ù†Ø¨ÙŠ Ù…ÙˆØ³Ù‘Ø¹", "Expanded sidebar")}
                description={t(locale, "ØªØ­ÙƒÙ… Ø³Ø±ÙŠØ¹ ÙÙŠ Ø¹Ø±Ø¶ Ø§Ù„Ù‚Ø§Ø¦Ù…Ø© Ø§Ù„Ø±Ø¦ÙŠØ³ÙŠØ©", "Quick control over main sidebar size")}
                checked={sidebarOpen}
                onChange={setSidebarOpen}
              />
              <StaticPreview icon={theme === "dark" ? MoonStar : Palette} title={previewText.title} description={previewText.body} />
            </div>
          </Card>

          <Card title={t(locale, "Ø§Ù„Ø¥Ø´Ø¹Ø§Ø±Ø§Øª", "Notifications")} icon={Bell}>
            <div className="space-y-3">
              {[
                { key: "email", labelAr: "Ø¥Ø´Ø¹Ø§Ø±Ø§Øª Ø§Ù„Ø¨Ø±ÙŠØ¯", labelEn: "Email notifications" },
                { key: "whatsapp", labelAr: "Ø¥Ø´Ø¹Ø§Ø±Ø§Øª ÙˆØ§ØªØ³Ø§Ø¨", labelEn: "WhatsApp notifications" },
                { key: "browser", labelAr: "Ø¥Ø´Ø¹Ø§Ø±Ø§Øª Ø§Ù„Ù…ØªØµÙØ­", labelEn: "Browser notifications" },
              ].map((item) => (
                <label key={item.key} className="flex cursor-pointer items-center justify-between rounded-2xl border border-border bg-background p-3 transition-colors hover:bg-muted/50">
                  <span className="text-sm text-foreground">{t(locale, item.labelAr, item.labelEn)}</span>
                  <input
                    type="checkbox"
                    checked={notifications[item.key as keyof typeof notifications]}
                    onChange={(event) => setNotifications((prev) => ({ ...prev, [item.key]: event.target.checked }))}
                    className="h-5 w-5 rounded border-border text-brand-600 focus:ring-brand-500"
                  />
                </label>
              ))}
            </div>
          </Card>
        </div>

        <div className="space-y-6">
          <Card title={t(locale, "Ø¥Ø¯Ø§Ø±Ø© Ø¨ÙŠØ§Ù†Ø§Øª Ø§Ù„Ù†Ø³Ø®Ø©", "Demo data controls")} icon={Database}>
            <div className="mb-4 rounded-2xl border border-border bg-background p-4">
              <p className="text-sm font-semibold text-foreground">{t(locale, "Ø§Ù„Ø¨ÙŠØ§Ù†Ø§Øª Ø§Ù„Ù…Ø­Ù„ÙŠØ© Ø§Ù„Ø­Ø§Ù„ÙŠØ©", "Current local data")}</p>
              <p className="mt-1 text-sm text-muted-foreground">
                {t(locale, `ÙŠÙˆØ¬Ø¯ ${localDataCount} Ù…ÙØ§ØªÙŠØ­ Ù…Ø­Ù„ÙŠØ© Ù…Ø±ØªØ¨Ø·Ø© Ø¨Ø§Ù„Ù€ CRM Ø¯Ø§Ø®Ù„ Ù‡Ø°Ø§ Ø§Ù„Ù…ØªØµÙØ­.`, `There are ${localDataCount} local CRM storage entries in this browser.`)}
              </p>
            </div>

            <div className="space-y-3">
              <ActionPanel
                icon={Download}
                title={t(locale, "ØªÙ†Ø²ÙŠÙ„ Ù†Ø³Ø®Ø© Ø§Ø­ØªÙŠØ§Ø·ÙŠØ©", "Export backup")}
                description={t(locale, "Ø§Ø­ÙØ¸ Ù†Ø³Ø®Ø© JSON Ù…Ù† Ø¨ÙŠØ§Ù†Ø§Øª Ø§Ù„Ù€ demo Ø§Ù„Ù…Ø­Ù„ÙŠØ© Ù‚Ø¨Ù„ Ø§Ù„ØªØ¬Ø§Ø±Ø¨ Ø§Ù„ÙƒØ¨ÙŠØ±Ø© Ø£Ùˆ Ù‚Ø¨Ù„ Ø§Ù„Ø§Ø³ØªØ¨Ø¯Ø§Ù„ Ø¨Ù…Ù„ÙØ§Øª Ø¬Ø¯ÙŠØ¯Ø©.", "Save a JSON backup of the local demo data before large experiments or before replacing the project files.")}
                buttonLabel={t(locale, "ØªÙ†Ø²ÙŠÙ„ Ø§Ù„Ù†Ø³Ø®Ø© Ø§Ù„Ø§Ø­ØªÙŠØ§Ø·ÙŠØ©", "Export backup")}
                onClick={handleExportBackup}
                variant="primary"
                busy={busy === "export"}
              />

              <ActionPanel
                icon={Upload}
                title={t(locale, "Ø§Ø³ØªÙŠØ±Ø§Ø¯ Ù†Ø³Ø®Ø© Ø§Ø­ØªÙŠØ§Ø·ÙŠØ©", "Import backup")}
                description={t(locale, "Ø§Ø³ØªØ±Ø¬Ø¹ Ø­Ø§Ù„Ø© Ø§Ù„Ù…ØªØµÙØ­ Ø§Ù„Ø­Ø§Ù„ÙŠØ© Ù…Ù† Ù…Ù„Ù backup JSON Ø³Ø¨Ù‚ ØªÙ†Ø²ÙŠÙ„Ù‡ Ù…Ù† Ø§Ù„Ù†Ø¸Ø§Ù… Ù†ÙØ³Ù‡.", "Restore the current browser state from a backup JSON exported from the CRM.")}
                buttonLabel={t(locale, "Ø§Ø®ØªÙŠØ§Ø± Ù…Ù„Ù Ø§Ù„Ù†Ø³Ø®Ø© Ø§Ù„Ø§Ø­ØªÙŠØ§Ø·ÙŠØ©", "Choose backup file")}
                onClick={() => backupInputRef.current?.click()}
                variant="secondary"
                busy={busy === "import"}
              />

              <ActionPanel
                icon={RotateCcw}
                title={t(locale, "Ø¥Ø¹Ø§Ø¯Ø© ØªØ­Ù…ÙŠÙ„ Ø§Ù„Ø¨ÙŠØ§Ù†Ø§Øª Ø§Ù„ØªØ¬Ø±ÙŠØ¨ÙŠØ©", "Restore demo data")}
                description={t(locale, "Ù…ÙÙŠØ¯ Ø¹Ù†Ø¯Ù…Ø§ ØªØ±ÙŠØ¯ Ø§Ù„Ø¹ÙˆØ¯Ø© Ø¥Ù„Ù‰ Ù†Ø³Ø®Ø© Ù†Ø¸ÙŠÙØ© Ø¨Ø¹Ø¯ Ø§Ù„ØªØ¬Ø±Ø¨Ø© Ø£Ùˆ Ø§Ù„ØªØ¯Ø±ÙŠØ¨.", "Useful when you want to go back to a clean internal demo state.")}
                buttonLabel={t(locale, "Ø§Ø³ØªØ¹Ø§Ø¯Ø© Ø§Ù„Ù†Ø³Ø®Ø© Ø§Ù„ØªØ¬Ø±ÙŠØ¨ÙŠØ©", "Restore demo state")}
                onClick={handleResetDemoData}
                variant="primary"
                busy={busy === "reset"}
              />

              <ActionPanel
                icon={Trash2}
                title={t(locale, "Ù…Ø³Ø­ Ø§Ù„Ø¨ÙŠØ§Ù†Ø§Øª Ø§Ù„Ù…Ø­Ù„ÙŠØ©", "Clear local data")}
                description={t(locale, "ÙŠÙ…Ø³Ø­ Ø§Ù„Ø¨ÙŠØ§Ù†Ø§Øª Ø§Ù„Ù…Ø®Ø²Ù†Ø© Ù…Ø­Ù„ÙŠÙ‹Ø§ Ø¯Ø§Ø®Ù„ Ø§Ù„Ù…ØªØµÙØ­ ÙÙ‚Ø·ØŒ Ø¯ÙˆÙ† Ø§Ù„Ù…Ø³Ø§Ø³ Ø¨Ù‚Ø§Ø¹Ø¯Ø© Ø§Ù„Ø¨ÙŠØ§Ù†Ø§Øª Ø§Ù„ÙØ¹Ù„ÙŠØ©.", "Clears only browser-saved local data without touching the real database.")}
                buttonLabel={t(locale, "Ù…Ø³Ø­ Ø§Ù„Ø¨ÙŠØ§Ù†Ø§Øª Ø§Ù„Ù…Ø­Ù„ÙŠØ©", "Clear local data")}
                onClick={handleClearLocalData}
                variant="danger"
                busy={busy === "clear"}
              />
            </div>

            <input ref={backupInputRef} type="file" accept="application/json" className="hidden" onChange={handleImportBackup} />
          </Card>

          <Card title={t(locale, "Ù…Ù„Ø§Ø­Ø¸Ø§Øª ØªØ´ØºÙŠÙ„ÙŠØ©", "Operational notes")} icon={Settings}>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>{t(locale, "â€¢ ØªØºÙŠÙŠØ± Ø§Ù„Ù„ØºØ© ÙˆØ§Ù„Ø³Ù…Ø© ÙŠÙØ­ÙÙŽØ¸ Ù…Ø­Ù„ÙŠÙ‹Ø§ ÙÙŠ Ø§Ù„Ù…ØªØµÙØ­ Ø§Ù„Ø­Ø§Ù„ÙŠ.", "â€¢ Theme and language are stored locally in the current browser.")}</li>
              <li>{t(locale, "â€¢ Ø¬Ø²Ø¡ Ù…Ù† Ø§Ù„Ù†Ø¸Ø§Ù… ÙŠØ¹Ù…Ù„ Ø¹Ù„Ù‰ ÙˆØ¶Ø¹ fallback Ù…Ø­Ù„ÙŠ Ø¹Ù†Ø¯ ØºÙŠØ§Ø¨ Ø£Ùˆ ØªØ¹Ø·Ù„ Ø§Ù„Ø§ØªØµØ§Ù„ Ø¨Ù‚Ø§Ø¹Ø¯Ø© Ø§Ù„Ø¨ÙŠØ§Ù†Ø§Øª.", "â€¢ Parts of the CRM use local fallback mode if the database is unavailable.")}</li>
              <li>{t(locale, "â€¢ ØªØµØ¯ÙŠØ± Ù†Ø³Ø®Ø© Ø§Ø­ØªÙŠØ§Ø·ÙŠØ© Ù…Ø­Ù„ÙŠØ© Ù‚Ø¨Ù„ Ø£ÙŠ ØªØ¹Ø¯ÙŠÙ„ ÙƒØ¨ÙŠØ± Ø®Ø·ÙˆØ© Ø£Ù…Ø§Ù† Ù…Ù…ØªØ§Ø²Ø©.", "â€¢ Exporting a local backup before major changes is a strong safety practice.")}</li>
              <li>{t(locale, "â€¢ Ø¥Ø¹Ø§Ø¯Ø© Ø§Ù„Ø¨ÙŠØ§Ù†Ø§Øª Ø§Ù„ØªØ¬Ø±ÙŠØ¨ÙŠØ© Ù…ÙÙŠØ¯Ø© Ù‚Ø¨Ù„ ØªØ³Ù„ÙŠÙ… Ù†Ø³Ø®Ø© Ø¹Ø±Ø¶ Ø£Ùˆ Ø¨Ø¯Ø¡ ØªØ¬Ø±Ø¨Ø© Ø¬Ø¯ÙŠØ¯Ø©.", "â€¢ Restoring demo data is useful before a showcase or a fresh demo session.")}</li>
            </ul>
          </Card>

          <div className="flex justify-end">
            <button onClick={handleSave} disabled={busy === "save"} className={cn("flex items-center gap-2 rounded-xl bg-brand-700 px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-50")}>
              <Save size={18} />
              {busy === "save" ? t(locale, "Ø¬Ø§Ø±Ù Ø§Ù„Ø­ÙØ¸...", "Saving...") : t(locale, "Ø­ÙØ¸ Ø§Ù„Ø¥Ø¹Ø¯Ø§Ø¯Ø§Øª", "Save settings")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Card({ title, icon: Icon, children }: { title: string; icon: typeof Settings; children: ReactNode }) {
  return (
    <section className="rounded-2xl border border-border bg-card p-5">
      <h3 className="mb-4 flex items-center gap-2 font-bold text-foreground">
        <Icon size={18} className="text-brand-600" />
        {title}
      </h3>
      {children}
    </section>
  );
}

function Field({ label, value, onChange, type = "text" }: { label: string; value: string; onChange: (value: string) => void; type?: string }) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-foreground">{label}</label>
      <input type={type} value={value} onChange={(event) => onChange(event.target.value)} className="w-full rounded-xl border border-input bg-muted/50 px-4 py-2.5 text-sm text-foreground" />
    </div>
  );
}

function SelectField({ label, value, onChange, options }: { label: string; value: string; onChange: (value: string) => void; options: Array<{ value: string; label: string }> }) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-foreground">{label}</label>
      <select value={value} onChange={(event) => onChange(event.target.value)} className="w-full rounded-xl border border-input bg-muted/50 px-4 py-2.5 text-sm text-foreground">
        {options.map((option) => (
          <option key={option.value} value={option.value}>{option.label}</option>
        ))}
      </select>
    </div>
  );
}

function ToggleRow({ icon: Icon, title, description, checked, onChange }: { icon: typeof Languages; title: string; description: string; checked: boolean; onChange: (value: boolean) => void }) {
  return (
    <label className="flex cursor-pointer items-center gap-3 rounded-2xl border border-border bg-background p-4 transition-colors hover:bg-muted/40">
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-700 dark:bg-brand-950 dark:text-brand-300">
        <Icon size={18} />
      </div>
      <div className="flex-1">
        <p className="text-sm font-semibold text-foreground">{title}</p>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
      <input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} className="h-5 w-5 rounded border-border text-brand-600 focus:ring-brand-500" />
    </label>
  );
}

function StaticPreview({ icon: Icon, title, description }: { icon: typeof Palette; title: string; description: string }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-border bg-background p-4">
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-700 dark:bg-brand-950 dark:text-brand-300">
        <Icon size={18} />
      </div>
      <div>
        <p className="text-sm font-semibold text-foreground">{title}</p>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
    </div>
  );
}

function PasswordField({ label, value, onChange, visible, onToggleVisibility }: { label: string; value: string; onChange: (value: string) => void; visible: boolean; onToggleVisibility: () => void }) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-foreground">{label}</label>
      <div className="relative">
        <input
          type={visible ? "text" : "password"}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="w-full rounded-xl border border-input bg-muted/50 px-4 py-2.5 pe-12 text-sm text-foreground"
        />
        <button
          type="button"
          onClick={onToggleVisibility}
          className="absolute inset-y-0 end-0 flex items-center px-3 text-muted-foreground transition-colors hover:text-foreground"
          aria-label={visible ? "Hide password" : "Show password"}
        >
          {visible ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      </div>
    </div>
  );
}

function PasswordCheck({ label, passed }: { label: string; passed: boolean }) {
  return (
    <div
      className={cn(
        "rounded-xl border px-3 py-2 text-sm font-medium transition-colors",
        passed
          ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-950/30 dark:text-emerald-300"
          : "border-border bg-background text-muted-foreground",
      )}
    >
      {label}
    </div>
  );
}

function ActionPanel({ icon: Icon, title, description, buttonLabel, onClick, variant, busy }: { icon: typeof Database; title: string; description: string; buttonLabel: string; onClick: () => void; variant: "primary" | "secondary" | "danger"; busy: boolean }) {
  const buttonClassName = {
    primary: "bg-brand-700 text-white hover:bg-brand-600",
    secondary: "border border-border bg-background text-foreground hover:bg-muted",
    danger: "bg-destructive text-white hover:bg-destructive/90",
  }[variant];

  return (
    <div className="rounded-2xl border border-border bg-background p-4">
      <div className="flex items-start gap-3">
        <div className="mt-0.5 flex h-10 w-10 items-center justify-center rounded-xl bg-muted text-brand-700 dark:text-brand-300">
          <Icon size={18} />
        </div>
        <div className="flex-1">
          <p className="text-sm font-semibold text-foreground">{title}</p>
          <p className="mt-1 text-xs leading-5 text-muted-foreground">{description}</p>
          <button onClick={onClick} disabled={busy} className={cn("mt-3 inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-60", buttonClassName)}>
            <Icon size={16} />
            {busy ? "..." : buttonLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
```

### FILE: src\app\(auth)\login\page.tsx
```tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Mail, Lock, LogIn, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import { createBrowserClient } from "@supabase/ssr";
import { cn } from "@/lib/utils";

function getSupabase() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const supabase = getSupabase();
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        toast.error(
          error.message === "Invalid login credentials"
            ? "Ø§Ù„Ø¨Ø±ÙŠØ¯ Ø£Ùˆ ÙƒÙ„Ù…Ø© Ø§Ù„Ù…Ø±ÙˆØ± ØºÙŠØ± ØµØ­ÙŠØ­Ø©"
            : error.message
        );
        return;
      }

      toast.success("ØªÙ… ØªØ³Ø¬ÙŠÙ„ Ø§Ù„Ø¯Ø®ÙˆÙ„ Ø¨Ù†Ø¬Ø§Ø­");
      // Dashboard â€” all roles have access to "/"
      router.replace("/");
      router.refresh();
    } catch {
      toast.error("Ø­Ø¯Ø« Ø®Ø·Ø£ ØºÙŠØ± Ù…ØªÙˆÙ‚Ø¹");
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="w-full max-w-md"
    >
      <div className="text-center mb-8">
        <div
          className="w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center shadow-brand-lg"
          style={{ background: "#4338CA" }}
        >
          <span className="text-white font-bold text-2xl">SR</span>
        </div>
        <h1 className="text-2xl font-bold text-foreground">Skidy Rein</h1>
        <p className="text-muted-foreground text-sm mt-1">
          ØªØ³Ø¬ÙŠÙ„ Ø§Ù„Ø¯Ø®ÙˆÙ„ Ù„Ù„ÙˆØ­Ø© Ø§Ù„ØªØ­ÙƒÙ…
        </p>
      </div>

      <div className="bg-card rounded-2xl border border-border p-6 shadow-brand-md">
        <form onSubmit={handleLogin} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">
              Ø§Ù„Ø¨Ø±ÙŠØ¯ Ø§Ù„Ø¥Ù„ÙƒØªØ±ÙˆÙ†ÙŠ
            </label>
            <div className="relative">
              <Mail
                size={18}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
              />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@skidyrein.com"
                required
                className={cn(
                  "w-full pr-10 pl-4 py-2.5 rounded-xl",
                  "bg-muted/50 border border-input",
                  "text-foreground placeholder:text-muted-foreground",
                  "focus:ring-2 focus:ring-ring focus:border-transparent",
                  "transition-all text-sm"
                )}
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">
              ÙƒÙ„Ù…Ø© Ø§Ù„Ù…Ø±ÙˆØ±
            </label>
            <div className="relative">
              <Lock
                size={18}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
              />
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢"
                required
                className={cn(
                  "w-full pr-10 pl-10 py-2.5 rounded-xl",
                  "bg-muted/50 border border-input",
                  "text-foreground placeholder:text-muted-foreground",
                  "focus:ring-2 focus:ring-ring focus:border-transparent",
                  "transition-all text-sm"
                )}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className={cn(
              "w-full py-2.5 rounded-xl font-semibold text-sm",
              "flex items-center justify-center gap-2",
              "bg-brand-700 text-white",
              "hover:bg-brand-600 transition-colors",
              "disabled:opacity-50 disabled:cursor-not-allowed"
            )}
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <LogIn size={18} />
                <span>ØªØ³Ø¬ÙŠÙ„ Ø§Ù„Ø¯Ø®ÙˆÙ„</span>
              </>
            )}
          </button>
        </form>
      </div>

      <p className="text-center text-muted-foreground text-xs mt-6">
        Skidy Rein CRM &copy; {new Date().getFullYear()}
      </p>
    </motion.div>
  );
}
```

### FILE: src\app\(dashboard)\page.tsx
```tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  BellDot,
  CalendarDays,
  CheckCircle2,
  ClipboardCheck,
  Clock,
  GraduationCap,
  Phone,
  Target,
  TrendingUp,
  TriangleAlert,
  Users,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import { DASHBOARD_TASK_STATUS_META } from "@/config/status-meta";
import { cn } from "@/lib/utils";
import { useCurrentUser } from "@/providers/user-provider";
import { getDashboardOperationToneStyles, getDashboardOverview } from "@/services/dashboard.service";
import { getOwnerSnapshot, type OwnerSnapshotItem } from "@/services/owner-summary.service";
import { useUIStore } from "@/stores/ui-store";
import { getConversionTerm, t } from "@/lib/locale";
import type { DashboardActionItem, DashboardOverview, DashboardOperationItem } from "@/types/crm";

function isManagement(role: string): boolean {
  return role === "admin" || role === "owner";
}

const DASHBOARD_GLYPHS: Record<string, LucideIcon> = {
  wallet: Wallet,
  users: Users,
  clock: Clock,
  calendar: CalendarDays,
  warning: TriangleAlert,
  success: CheckCircle2,
  graduation: GraduationCap,
  notification: BellDot,
};

const ACTION_TONE_STYLES: Record<DashboardActionItem["tone"], { bg: string; color: string; border: string }> = {
  brand: { bg: "#EEF2FF", color: "#4338CA", border: "#C7D2FE" },
  success: { bg: "#ECFDF5", color: "#059669", border: "#A7F3D0" },
  warning: { bg: "#FFFBEB", color: "#D97706", border: "#FCD34D" },
  info: { bg: "#EFF6FF", color: "#2563EB", border: "#BFDBFE" },
};

export default function DashboardPage() {
  const user = useCurrentUser();
  const locale = useUIStore((state) => state.locale);
  const isAr = locale === "ar";
  const [overview, setOverview] = useState<DashboardOverview | null>(null);
  const [ownerSnapshot, setOwnerSnapshot] = useState<OwnerSnapshotItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    async function load() {
      setLoading(true);
      const [data, ownerData] = await Promise.all([getDashboardOverview(
        {
          role: user.role,
          fullName: user.fullName,
          fullNameAr: user.fullNameAr,
        },
        locale,
      ), getOwnerSnapshot()]);
      if (isMounted) {
        setOverview(data);
        setOwnerSnapshot(ownerData.slice(0, 4));
        setLoading(false);
      }
    }
    load();
    return () => {
      isMounted = false;
    };
  }, [locale, user.fullName, user.fullNameAr, user.role]);

  const displayName = isAr ? user.fullNameAr : user.fullName;
  const isMgmt = isManagement(user.role);

  const quickLinks = useMemo(() => {
    if (user.role === "sales") {
      return [
        { label: t(locale, "Ø§Ù„Ø¹Ù…Ù„Ø§Ø¡ Ø§Ù„Ù…Ø­ØªÙ…Ù„ÙˆÙ†", "Leads"), href: "/leads", icon: Users, color: "#6366F1", bg: "#EEF2FF" },
        { label: t(locale, "Ø§Ù„Ù…ØªØ§Ø¨Ø¹Ø§Øª", "Follow-ups"), href: "/follow-ups", icon: ClipboardCheck, color: "#8B5CF6", bg: "#F5F3FF" },
        { label: t(locale, "Ø§Ù„Ù…Ø¯ÙÙˆØ¹Ø§Øª", "Payments"), href: "/payments", icon: Wallet, color: "#10B981", bg: "#ECFDF5" },
        { label: t(locale, "Ø§Ù„Ø·Ù„Ø§Ø¨", "Students"), href: "/students", icon: GraduationCap, color: "#0D9488", bg: "#F0FDFA" },
      ];
    }

    return [
      { label: t(locale, "Ø§Ù„Ø·Ù„Ø§Ø¨", "Students"), href: "/students", icon: GraduationCap, color: "#059669", bg: "#ECFDF5" },
      { label: t(locale, "Ø§Ù„Ø¬Ø¯ÙˆÙ„", "Schedule"), href: "/schedule", icon: CalendarDays, color: "#2563EB", bg: "#EFF6FF" },
      { label: t(locale, "Ø§Ù„Ù…ØªØ§Ø¨Ø¹Ø§Øª", "Follow-ups"), href: "/follow-ups", icon: ClipboardCheck, color: "#8B5CF6", bg: "#F5F3FF" },
      { label: t(locale, "Ø§Ù„Ù…Ø¯ÙÙˆØ¹Ø§Øª", "Payments"), href: "/payments", icon: Wallet, color: "#D97706", bg: "#FFFBEB" },
    ];
  }, [locale, user.role]);

  const pendingCount = overview?.followUps.filter((item) => item.status !== "completed").length ?? 0;
  const completedCount = overview?.followUps.filter((item) => item.status === "completed").length ?? 0;
  const urgentCount = overview?.followUps.filter((item) => item.status === "urgent").length ?? 0;

  if (loading || !overview) {
    return (
      <div className="rounded-2xl border border-border bg-card p-12 text-center text-muted-foreground">
        {t(locale, "Ø¬Ø§Ø±Ù ØªØ­Ù…ÙŠÙ„ Ù„ÙˆØ­Ø© Ø§Ù„ØªØ­ÙƒÙ…...", "Loading dashboard...")}
      </div>
    );
  }

  if (!isMgmt) {
    return (
      <div className="space-y-6">
        <HeroCard title={t(locale, `Ù…Ø±Ø­Ø¨Ø§Ù‹ØŒ ${displayName}`, `Welcome, ${displayName}`)} subtitle={t(locale, "Ù‡Ø°Ù‡ Ø£Ù‡Ù… Ø§Ù„Ø£Ø´ÙŠØ§Ø¡ Ø§Ù„ØªÙŠ ØªØ­ØªØ§Ø¬ Ø§Ù†ØªØ¨Ø§Ù‡Ùƒ Ø§Ù„Ø¢Ù†", "Here is what needs your attention right now")} />

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <MiniStat icon={ClipboardCheck} value={overview.followUps.length} label={t(locale, "Ù…ØªØ§Ø¨Ø¹Ø§Øª Ø§Ù„ÙŠÙˆÙ…", "Today follow-ups")} bg="#EEF2FF" color="#6366F1" />
          <MiniStat icon={CheckCircle2} value={completedCount} label={t(locale, "Ù…ÙƒØªÙ…Ù„Ø©", "Completed")} bg="#ECFDF5" color="#059669" />
          <MiniStat icon={Clock} value={pendingCount} label={t(locale, "Ù…Ø¹Ù„Ù‘Ù‚Ø©", "Pending")} bg="#FFFBEB" color="#D97706" />
          <MiniStat icon={AlertCircle} value={urgentCount} label={t(locale, "Ø¹Ø§Ø¬Ù„Ø©", "Urgent")} bg="#FEF2F2" color="#DC2626" />
        </div>

        <OwnershipSnapshot locale={locale} title={t(locale, "Ù…Ù„Ø®Øµ Ø§Ù„Ù…Ø³Ø¤ÙˆÙ„ÙŠÙ†", "Owner snapshot")} items={ownerSnapshot} />

                <DashboardSectionTitle title={t(locale, "ÙˆØµÙˆÙ„ Ø³Ø±ÙŠØ¹", "Quick access")} />
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {quickLinks.map((link) => {
            const Icon = link.icon;
            return (
              <Link key={link.href} href={link.href} className="group flex flex-col items-center gap-2 rounded-2xl border border-border bg-card p-4 transition-all hover:-translate-y-0.5 hover:shadow-md">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl transition-transform group-hover:scale-105" style={{ background: link.bg }}>
                  <Icon size={24} style={{ color: link.color }} />
                </div>
                <span className="text-xs font-semibold text-foreground">{link.label}</span>
              </Link>
            );
          })}
        </div>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.2fr_0.8fr]">
          <div className="space-y-6">
            <TaskCard
              locale={locale}
              isAr={isAr}
              tasks={overview.followUps}
              title={t(locale, "Ù…Ù‡Ø§Ù…ÙŠ Ø§Ù„ÙŠÙˆÙ…", "My tasks today")}
              emptyLabel={t(locale, "Ù„Ø§ ØªÙˆØ¬Ø¯ Ù…ØªØ§Ø¨Ø¹Ø§Øª Ù„Ùƒ Ø§Ù„ÙŠÙˆÙ…", "No follow-ups for you today")}
            />

            <div className="rounded-2xl border border-border bg-card p-5">
              <DashboardSectionTitle title={t(locale, "Ù…Ø§ ÙŠØ¬Ø¨ Ø§Ù„ØªØ±ÙƒÙŠØ² Ø¹Ù„ÙŠÙ‡", "What to focus on")} icon={Target} />
              {overview.recommendations.length === 0 ? (
                <EmptyPanel label={t(locale, "ÙƒÙ„ Ø´ÙŠØ¡ ØªØ­Øª Ø§Ù„Ø³ÙŠØ·Ø±Ø© Ø§Ù„Ø¢Ù†", "Everything is under control right now")} />
              ) : (
                <div className="space-y-3">
                  {overview.recommendations.map((item) => (
                    <div key={item} className="rounded-2xl border border-border bg-background p-4 text-sm text-foreground">
                      {item}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="space-y-6">
            <OperationsGrid locale={locale} items={overview.operations} compact />
            <QuickActionGrid title={t(locale, "Ø§Ù„Ø®Ø·ÙˆØ§Øª Ø§Ù„ØªØ§Ù„ÙŠØ©", "Next steps")} locale={locale} isAr={isAr} actions={overview.quickActions} compact />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <HeroCard title={t(locale, `Ù…Ø±Ø­Ø¨Ø§Ù‹ØŒ ${displayName}`, `Welcome, ${displayName}`)} subtitle={t(locale, "Ù‡Ø°Ù‡ Ù„Ù‚Ø·Ø© ØªØ´ØºÙŠÙ„ÙŠØ© Ø³Ø±ÙŠØ¹Ø© Ù„Ù„Ø£ÙƒØ§Ø¯ÙŠÙ…ÙŠØ© Ø§Ù„Ø¢Ù†", "This is your operational snapshot for the academy right now")} />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {overview.managementStats.map((stat) => (
          <div key={stat.label} className="relative overflow-hidden rounded-3xl p-5 text-white" style={{ background: `linear-gradient(135deg, ${stat.bg}, ${stat.bg}dd)` }}>
            <p className="text-sm opacity-90">{stat.label}</p>
            <p className="mt-2 text-3xl font-bold">{stat.value}</p>
            {stat.change && <p className="mt-2 text-xs opacity-80">{stat.change}</p>}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        {overview.secondaryStats.map((stat) => {
          const Icon = stat.icon ? DASHBOARD_GLYPHS[stat.icon] : Clock;
          return (
            <div key={stat.label} className="rounded-2xl border border-border bg-card p-4">
              <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-2xl" style={{ background: stat.bg }}>
                <Icon size={20} style={{ color: stat.color }} />
              </div>
              <p className="text-sm font-medium text-muted-foreground">{stat.label}</p>
              <p className="mt-1 text-2xl font-bold text-foreground">{stat.value}</p>
            </div>
          );
        })}
      </div>

      <OperationsGrid locale={locale} items={overview.operations} />

      <OwnershipSnapshot locale={locale} title={t(locale, "ØªÙˆØ²ÙŠØ¹ Ø§Ù„Ù…Ø³Ø¤ÙˆÙ„ÙŠØ©", "Ownership distribution")} items={ownerSnapshot} />

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <div className="space-y-6">
          <div className="rounded-2xl border border-border bg-card p-5">
            <DashboardSectionTitle title={t(locale, "ØªÙ†Ø¨ÙŠÙ‡Ø§Øª Ø³Ø±ÙŠØ¹Ø©", "Quick alerts")} icon={BellDot} />
            {overview.alerts.length === 0 ? (
              <EmptyPanel label={t(locale, "Ù„Ø§ ØªÙˆØ¬Ø¯ ØªÙ†Ø¨ÙŠÙ‡Ø§Øª Ø­Ø±Ø¬Ø© Ø§Ù„Ø¢Ù†", "There are no urgent alerts right now")} />
            ) : (
              <div className="space-y-2">
                {overview.alerts.map((alert) => {
                  const Icon = DASHBOARD_GLYPHS[alert.icon] ?? AlertCircle;
                  return (
                    <div key={`${alert.icon}-${alert.text}`} className={cn("flex items-start gap-3 rounded-2xl border p-3", alert.type === "danger" && "border-red-200 bg-red-50/40 dark:border-red-900/30 dark:bg-red-950/10", alert.type === "warning" && "border-amber-200 bg-amber-50/40 dark:border-amber-900/30 dark:bg-amber-950/10", alert.type === "info" && "border-blue-200 bg-blue-50/40 dark:border-blue-900/30 dark:bg-blue-950/10", alert.type === "success" && "border-emerald-200 bg-emerald-50/40 dark:border-emerald-900/30 dark:bg-emerald-950/10")}>
                      <div className="mt-0.5 flex h-8 w-8 items-center justify-center rounded-xl bg-background/80 text-foreground">
                        <Icon size={16} />
                      </div>
                      <p className="text-sm text-foreground">{alert.text}</p>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <TaskCard
            locale={locale}
            isAr={isAr}
            tasks={overview.followUps.slice(0, 6)}
            title={t(locale, "Ù…Ù‡Ø§Ù… Ø§Ù„ÙŠÙˆÙ…", "Today tasks")}
            emptyLabel={t(locale, "Ù„Ø§ ØªÙˆØ¬Ø¯ Ù…Ù‡Ø§Ù… Ù…Ø³Ø¬Ù„Ø© Ø§Ù„Ø¢Ù†", "No tasks recorded right now")}
          />
        </div>

        <div className="space-y-6">
          <div className="rounded-2xl border border-border bg-card p-5">
            <DashboardSectionTitle title={t(locale, "Ù‚Ø±Ø§Ø¡Ø© Ø³Ø±ÙŠØ¹Ø© Ù„Ù„Ù…Ø³Ø§Ø±", "Pipeline snapshot")} icon={TrendingUp} />
            <div className="space-y-4">
              {overview.funnel.map((item) => (
                <div key={item.label} className="space-y-2">
                  <div className="flex items-center justify-between gap-3 text-sm">
                    <span className="font-medium text-foreground">{item.label}</span>
                    <span className="text-muted-foreground">{item.value} â€¢ {item.pct}</span>
                  </div>
                  <div className="h-3 overflow-hidden rounded-full bg-muted/60">
                    <div className="h-full rounded-full" style={{ width: item.pct, backgroundColor: item.color }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <QuickActionGrid title={t(locale, "ØªØ´ØºÙŠÙ„ Ø³Ø±ÙŠØ¹", "Fast execution")} locale={locale} isAr={isAr} actions={overview.quickActions} />

          <div className="rounded-2xl border border-border bg-card p-5">
            <DashboardSectionTitle title={t(locale, "ØªÙˆØµÙŠØ§Øª ØªØ´ØºÙŠÙ„ÙŠØ©", "Operational recommendations")} icon={Target} />
            {overview.recommendations.length === 0 ? (
              <EmptyPanel label={t(locale, "Ù„Ø§ ØªÙˆØ¬Ø¯ ØªÙˆØµÙŠØ§Øª Ø¥Ø¶Ø§ÙÙŠØ© Ø§Ù„Ø¢Ù†", "There are no extra recommendations right now")} />
            ) : (
              <div className="space-y-3">
                {overview.recommendations.map((item) => (
                  <div key={item} className="rounded-2xl border border-border bg-background p-4 text-sm text-foreground">
                    {item}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function HeroCard({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="rounded-3xl border border-border bg-card p-6">
      <h2 className="text-2xl font-bold text-foreground">{title}</h2>
      <p className="mt-1 text-muted-foreground">{subtitle}</p>
    </div>
  );
}

function DashboardSectionTitle({ title, icon: Icon, className }: { title: string; icon?: LucideIcon; className?: string }) {
  return (
    <h3 className={cn("mb-4 flex items-center gap-2 text-base font-bold text-foreground", className)}>
      {Icon ? <Icon size={18} className="text-brand-600" /> : null}
      {title}
    </h3>
  );
}

function MiniStat({ icon: Icon, value, label, bg, color }: { icon: LucideIcon; value: number; label: string; bg: string; color: string }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-2xl" style={{ background: bg }}>
        <Icon size={18} style={{ color }} />
      </div>
      <p className="text-2xl font-bold text-foreground">{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
}

function OperationsGrid({ locale, items, compact = false }: { locale: "ar" | "en"; items: DashboardOperationItem[]; compact?: boolean }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <DashboardSectionTitle title={t(locale, "Ø¥Ø´Ø§Ø±Ø§Øª Ø§Ù„ØªØ´ØºÙŠÙ„", "Operational signals")} icon={TrendingUp} />
      <div className={cn("grid gap-3", compact ? "grid-cols-1" : "grid-cols-1 sm:grid-cols-2 xl:grid-cols-4")}>
        {items.map((item) => {
          const tone = getDashboardOperationToneStyles(item.tone);
          return (
            <div key={item.title} className="rounded-2xl border p-4" style={{ background: tone.bg, borderColor: `${tone.color}33` }}>
              <p className="text-xs font-semibold" style={{ color: tone.color }}>{item.title}</p>
              <p className="mt-2 text-2xl font-bold text-foreground">{item.value}</p>
              <p className="mt-2 text-xs text-muted-foreground">{item.subtitle}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function QuickActionGrid({ title, locale, isAr, actions, compact = false }: { title: string; locale: "ar" | "en"; isAr: boolean; actions: DashboardActionItem[]; compact?: boolean }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <DashboardSectionTitle title={title} icon={Target} />
      <div className={cn("grid gap-3", compact ? "grid-cols-1" : "grid-cols-1 sm:grid-cols-2")}>
        {actions.map((action) => {
          const tone = ACTION_TONE_STYLES[action.tone];
          return (
            <Link key={`${action.href}-${action.title}`} href={action.href} className="group rounded-2xl border p-4 transition-all hover:-translate-y-0.5 hover:shadow-sm" style={{ borderColor: tone.border, background: tone.bg }}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-semibold" style={{ color: tone.color }}>{action.title}</p>
                  <p className="mt-2 text-sm text-muted-foreground">{action.description}</p>
                </div>
                {isAr ? <ArrowLeft size={16} style={{ color: tone.color }} /> : <ArrowRight size={16} style={{ color: tone.color }} />}
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

function TaskCard({ locale, isAr, tasks, title, emptyLabel }: { locale: "ar" | "en"; isAr: boolean; tasks: DashboardOverview["followUps"]; title: string; emptyLabel: string }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <div className="mb-4 flex items-center justify-between">
        <DashboardSectionTitle title={title} icon={ClipboardCheck} className="mb-0" />
        <Link href="/follow-ups" className="flex items-center gap-1 text-xs font-semibold text-brand-600 transition-colors hover:text-brand-700">
          {t(locale, "Ø¹Ø±Ø¶ Ø§Ù„ÙƒÙ„", "View all")}
          {isAr ? <ArrowLeft size={14} /> : <ArrowRight size={14} />}
        </Link>
      </div>

      {tasks.length === 0 ? (
        <EmptyPanel label={emptyLabel} />
      ) : (
        <div className="space-y-2">
          {tasks.map((item) => {
            const badge = DASHBOARD_TASK_STATUS_META[item.status];
            const badgeLabel = isAr ? badge.label : badge.labelEn;
            return (
              <div key={item.id} className={cn("flex items-center gap-3 rounded-2xl border p-3 transition-colors", item.status === "completed" ? "border-border/50 opacity-60" : "border-border hover:bg-muted/50", item.status === "urgent" && "border-red-200 bg-red-50/30 dark:border-red-900/30 dark:bg-red-950/10")}>
                <div className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: item.dot }} />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className={cn("truncate text-sm font-semibold", item.status === "completed" && "line-through")}>{item.name}</p>
                    <span className="shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold" style={{ background: badge.bg, color: badge.color }}>
                      {badgeLabel}
                    </span>
                  </div>
                  <p className="truncate text-xs text-muted-foreground">{item.reason}</p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <span className="text-[11px] text-muted-foreground">{item.time}</span>
                  {item.status !== "completed" && (
                    <a href={`https://wa.me/?text=${encodeURIComponent(`${t(locale, "Ù…ØªØ§Ø¨Ø¹Ø©", "Follow-up")}: ${item.name} â€” ${item.reason}`)}`} target="_blank" rel="noopener noreferrer" className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-xl bg-brand-50 text-brand-600 transition-colors hover:bg-brand-100 dark:bg-brand-950 dark:text-brand-400">
                      <Phone size={14} />
                    </a>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function EmptyPanel({ label }: { label: string }) {
  return <div className="rounded-2xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">{label}</div>;
}


function OwnershipSnapshot({ locale, title, items }: { locale: "ar" | "en"; title: string; items: OwnerSnapshotItem[] }) {
  if (items.length === 0) return null;
  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <DashboardSectionTitle title={title} icon={Users} />
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
        {items.map((item) => (
          <div key={item.key} className="rounded-2xl border border-border bg-background p-4">
            <p className="text-sm font-semibold text-foreground">{item.displayName}</p>
            <div className="mt-3 space-y-1 text-xs text-muted-foreground">
              <p>{t(locale, "Ø¹Ù…Ù„Ø§Ø¡ Ù…Ø­ØªÙ…Ù„ÙˆÙ†", "Leads")}: <span className="font-semibold text-foreground">{item.leadCount}</span></p>
              <p>{t(locale, "Ù…Ø´ØªØ±Ùƒ", "Won")}: <span className="font-semibold text-foreground">{item.wonLeadCount}</span></p>
              <p>{t(locale, "Ø£ÙˆÙ„ÙŠØ§Ø¡ Ø£Ù…ÙˆØ±", "Parents")}: <span className="font-semibold text-foreground">{item.parentCount}</span></p>
              <p>{t(locale, "Ø·Ù„Ø§Ø¨", "Students")}: <span className="font-semibold text-foreground">{item.studentCount}</span></p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
```

### FILE: src\app\(dashboard)\action-center\page.tsx
```tsx

"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, BellRing, CalendarClock, CircleAlert, FolderOpenDot, Wallet, Users2 } from "lucide-react";
import { useCurrentUser } from "@/providers/user-provider";
import { useUIStore } from "@/stores/ui-store";
import { cn } from "@/lib/utils";
import { t } from "@/lib/locale";
import { getActionCenterData, getActionToneStyles } from "@/services/operations.service";
import type { ActionCenterData, ActionCenterItem } from "@/types/crm";

const ICONS = {
  follow_up: BellRing,
  lead: FolderOpenDot,
  payment: Wallet,
  student: Users2,
  schedule: CalendarClock,
} as const;

export default function ActionCenterPage() {
  const user = useCurrentUser();
  const locale = useUIStore((state) => state.locale);
  const isAr = locale === "ar";
  const [data, setData] = useState<ActionCenterData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    async function load() {
      setLoading(true);
      const next = await getActionCenterData(
        {
          role: user.role,
          fullName: user.fullName,
          fullNameAr: user.fullNameAr,
        },
        locale,
      );
      if (isMounted) {
        setData(next);
        setLoading(false);
      }
    }
    void load();
    return () => {
      isMounted = false;
    };
  }, [locale, user.fullName, user.fullNameAr, user.role]);

  if (loading || !data) {
    return (
      <div className="rounded-2xl border border-border bg-card p-12 text-center text-muted-foreground">
        {t(locale, "Ø¬Ø§Ø±Ù ØªØ­Ù…ÙŠÙ„ Ù…Ø±ÙƒØ² Ø§Ù„Ø¹Ù…Ù„ÙŠØ§Øª...", "Loading action center...")}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-border bg-card p-6 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-border bg-muted/50 px-3 py-1 text-xs font-medium text-muted-foreground">
              <BellRing size={14} />
              {t(locale, "Ù„ÙˆØ­Ø© ØªÙ†ÙÙŠØ° ÙŠÙˆÙ…ÙŠØ©", "Daily execution board")}
            </div>
            <h1 className="mt-3 text-2xl font-bold text-foreground">
              {t(locale, "Ù…Ø±ÙƒØ² Ø§Ù„Ø¹Ù…Ù„ÙŠØ§Øª", "Action Center")}
            </h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
              {t(locale, "Ù‡Ø°Ù‡ Ø§Ù„Ø´Ø§Ø´Ø© ØªØ¬Ù…Ø¹ ÙƒÙ„ Ø§Ù„Ø£Ø´ÙŠØ§Ø¡ Ø§Ù„ØªÙŠ ØªØ­ØªØ§Ø¬ Ù‚Ø±Ø§Ø±Ù‹Ø§ Ø£Ùˆ Ù…ØªØ§Ø¨Ø¹Ø© Ø§Ù„Ø¢Ù†ØŒ Ø­ØªÙ‰ Ù„Ø§ ÙŠØ¶ÙŠØ¹ Ø§Ù„ÙØ±ÙŠÙ‚ Ø¨ÙŠÙ† Ø§Ù„ØµÙØ­Ø§Øª Ø§Ù„Ù…Ø®ØªÙ„ÙØ©.", "This screen brings together the items that need a decision or follow-up now, so the team does not get lost between separate pages.")}
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3 lg:w-[420px]">
            {data.metrics.map((metric) => {
              const tone = metric.tone === "danger"
                ? { bg: "#FEF2F2", color: "#DC2626" }
                : metric.tone === "warning"
                  ? { bg: "#FFFBEB", color: "#D97706" }
                  : metric.tone === "success"
                    ? { bg: "#ECFDF5", color: "#059669" }
                    : metric.tone === "info"
                      ? { bg: "#EFF6FF", color: "#2563EB" }
                      : { bg: "#EEF2FF", color: "#4338CA" };
              return (
                <div key={metric.label} className="rounded-2xl border border-border p-4" style={{ background: tone.bg }}>
                  <p className="text-xs font-medium text-muted-foreground">{metric.label}</p>
                  <p className="mt-2 text-2xl font-bold" style={{ color: tone.color }}>{metric.value}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <ActionSection locale={locale} title={t(locale, "Ø­Ø±Ø¬ Ø§Ù„Ø¢Ù†", "Critical now")} description={t(locale, "Ù‡Ø°Ù‡ Ø§Ù„Ø¹Ù†Ø§ØµØ± Ù„Ù‡Ø§ Ø£Ø«Ø± Ù…Ø¨Ø§Ø´Ø± Ø¹Ù„Ù‰ Ø§Ù„Ø§Ø´ØªØ±Ø§Ùƒ Ø£Ùˆ Ø§Ù„ØªØ­ØµÙŠÙ„ Ø£Ùˆ Ø§Ù„Ø§Ø­ØªÙØ§Ø¸ Ø¨Ø§Ù„Ø·Ø§Ù„Ø¨.", "These items directly affect enrollment, collection, or retention.")} items={data.critical} />
      <ActionSection locale={locale} title={t(locale, "ÙŠØ­ØªØ§Ø¬ Ø¥ØºÙ„Ø§Ù‚ Ø§Ù„ÙŠÙˆÙ…", "Should be closed today")} description={t(locale, "Ù„Ùˆ ØªØ£Ø®Ø±Øª Ù‡Ø°Ù‡ Ø§Ù„Ø¹Ù†Ø§ØµØ±ØŒ Ø³ØªØªØ­ÙˆÙ„ Ø¨Ø³Ø±Ø¹Ø© Ø¥Ù„Ù‰ Ø§Ø­ØªÙƒØ§Ùƒ ØªØ´ØºÙŠÙ„ÙŠ Ø£Ùˆ ÙØ±Øµ Ø¶Ø§Ø¦Ø¹Ø©.", "If delayed, these items will quickly become operational friction or missed opportunities.")} items={data.mediumPriority} />
      <ActionSection locale={locale} title={t(locale, "Ù„Ù„Ø§Ø·Ù„Ø§Ø¹ ÙˆØ§Ù„ØªÙ†Ø¸ÙŠÙ…", "For visibility and planning")} description={t(locale, "Ù„ÙŠØ³Øª Ø­Ø±Ø¬Ø© Ø§Ù„Ø¢Ù†ØŒ Ù„ÙƒÙ†Ù‡Ø§ ØªØ³Ø§Ø¹Ø¯Ùƒ ØªØ­Ø§ÙØ¸ Ø¹Ù„Ù‰ ÙˆØ¶ÙˆØ­ Ø§Ù„ØªØ´ØºÙŠÙ„ Ø®Ù„Ø§Ù„ Ø§Ù„ÙŠÙˆÙ….", "Not critical now, but they help maintain operational clarity through the day.")} items={data.informational} />
    </div>
  );
}

function ActionSection({
  locale,
  title,
  description,
  items,
}: {
  locale: "ar" | "en";
  title: string;
  description: string;
  items: ActionCenterItem[];
}) {
  const isAr = locale === "ar";
  const Arrow = isAr ? ArrowLeft : ArrowRight;

  return (
    <section className="rounded-3xl border border-border bg-card p-5 shadow-sm">
      <div className="mb-4 flex items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-foreground">{title}</h2>
          <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        </div>
        <span className="inline-flex h-9 min-w-9 items-center justify-center rounded-full border border-border bg-background px-3 text-sm font-semibold text-foreground">
          {items.length}
        </span>
      </div>

      {items.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-background px-4 py-10 text-center text-sm text-muted-foreground">
          {t(locale, "Ù„Ø§ ØªÙˆØ¬Ø¯ Ø¹Ù†Ø§ØµØ± ÙÙŠ Ù‡Ø°Ø§ Ø§Ù„Ù‚Ø³Ù… Ø§Ù„Ø¢Ù†", "There are no items in this section right now")}
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((item) => {
            const Icon = ICONS[item.category] ?? CircleAlert;
            const tone = getActionToneStyles(item.priority);
            return (
              <Link key={item.id} href={item.href} className="group flex items-start gap-4 rounded-2xl border border-border bg-background p-4 transition-all hover:-translate-y-0.5 hover:shadow-md">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl" style={{ background: tone.bg, color: tone.color }}>
                  <Icon size={20} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-sm font-semibold text-foreground">{item.title}</h3>
                    <span className="rounded-full border px-2 py-0.5 text-[11px] font-medium" style={{ borderColor: tone.border, background: tone.bg, color: tone.color }}>
                      {item.priority === "critical"
                        ? t(locale, "Ø­Ø±Ø¬", "Critical")
                        : item.priority === "high"
                          ? t(locale, "Ø¹Ø§Ù„Ù", "High")
                          : item.priority === "medium"
                            ? t(locale, "Ù…ØªÙˆØ³Ø·", "Medium")
                            : t(locale, "Ù…Ø¹Ù„ÙˆÙ…Ø©", "Info")}
                    </span>
                  </div>
                  <p className="mt-1 text-sm leading-6 text-muted-foreground">{item.description}</p>
                  {(item.owner || item.meta) && (
                    <div className="mt-2 flex flex-wrap gap-2 text-xs text-muted-foreground">
                      {item.owner ? <span className="rounded-full bg-muted px-2 py-1">{item.owner}</span> : null}
                      {item.meta ? <span className="rounded-full bg-muted px-2 py-1">{item.meta}</span> : null}
                    </div>
                  )}
                </div>
                <div className="mt-1 text-muted-foreground transition-transform group-hover:translate-x-0.5">
                  <Arrow size={18} />
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </section>
  );
}
```

### FILE: src\app\(dashboard)\follow-ups\page.tsx
```tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  ClipboardCheck,
  Clock,
  MessageSquare,
  Phone,
  RotateCcw,
} from "lucide-react";
import { useUIStore } from "@/stores/ui-store";
import { FOLLOW_UP_STATUS_META, PRIORITY_META, getMetaLabel } from "@/config/status-meta";
import { formatTime } from "@/lib/formatters";
import { cn } from "@/lib/utils";
import { getCommChannelLabel, getFollowUpTypeLabel, t } from "@/lib/locale";
import { listFollowUps, markFollowUpCompleted, reopenFollowUp } from "@/services/follow-ups.service";
import type { FollowUpItem } from "@/types/crm";

const CHANNEL_ICON: Record<FollowUpItem["channel"], typeof Phone> = {
  whatsapp: MessageSquare,
  call: Phone,
  email: MessageSquare,
  sms: MessageSquare,
};

export default function FollowUpsPage() {
  const locale = useUIStore((state) => state.locale);
  const isAr = locale === "ar";
  const [tab, setTab] = useState<"today" | "overdue" | "completed">("today");
  const [items, setItems] = useState<FollowUpItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    async function load() {
      setLoading(true);
      const data = await listFollowUps();
      if (isMounted) {
        setItems(data);
        setLoading(false);
      }
    }
    load();
    return () => {
      isMounted = false;
    };
  }, []);

  const todayItems = useMemo(() => items.filter((item) => item.status === "pending"), [items]);
  const overdueItems = useMemo(() => items.filter((item) => item.status === "overdue"), [items]);
  const completedItems = useMemo(() => items.filter((item) => item.status === "completed"), [items]);
  const displayItems = tab === "today" ? todayItems : tab === "overdue" ? overdueItems : completedItems;

  const handleComplete = async (id: string) => {
    setSavingId(id);
    const updated = await markFollowUpCompleted(id);
    if (updated) {
      setItems((current) => current.map((item) => (item.id === id ? updated : item)));
    }
    setSavingId(null);
  };

  const handleUndo = async (id: string) => {
    setSavingId(id);
    const updated = await reopenFollowUp(id);
    if (updated) {
      setItems((current) => current.map((item) => (item.id === id ? updated : item)));
    }
    setSavingId(null);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-bold text-foreground">
          <ClipboardCheck size={28} className="text-brand-600" />
          {t(locale, "Ø§Ù„Ù…ØªØ§Ø¨Ø¹Ø§Øª", "Follow-ups")}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {t(locale, "Ù…Ù‡Ø§Ù… Ø§Ù„ÙØ±ÙŠÙ‚ Ø§Ù„ÙŠÙˆÙ…ÙŠØ© ÙˆØ§Ù„Ù…ØªØ£Ø®Ø±Ø© Ù…Ø¹ Ø¥Ù…ÙƒØ§Ù†ÙŠØ© Ø§Ù„ØªØ±Ø§Ø¬Ø¹ Ø¹Ù† Ø§Ù„Ø¥ÙƒÙ…Ø§Ù„", "Daily and overdue follow-ups with quick undo support")}
        </p>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <button onClick={() => setTab("today")} className={cn("rounded-2xl border bg-card p-4 text-center transition-all", tab === "today" ? "border-brand-500 ring-2 ring-brand-500/20" : "border-border hover:border-brand-300")}>
          <Clock size={20} className="mx-auto mb-1 text-brand-600" />
          <p className="text-2xl font-bold text-foreground">{todayItems.length}</p>
          <p className="text-xs text-muted-foreground">{t(locale, "Ø§Ù„ÙŠÙˆÙ…", "Today")}</p>
        </button>
        <button onClick={() => setTab("overdue")} className={cn("rounded-2xl border bg-card p-4 text-center transition-all", tab === "overdue" ? "border-danger-500 ring-2 ring-danger-500/20" : "border-border hover:border-danger-300")}>
          <AlertTriangle size={20} className="mx-auto mb-1 text-danger-600" />
          <p className="text-2xl font-bold text-danger-600">{overdueItems.length}</p>
          <p className="text-xs text-muted-foreground">{t(locale, "Ù…ØªØ£Ø®Ø±Ø©", "Overdue")}</p>
        </button>
        <button onClick={() => setTab("completed")} className={cn("rounded-2xl border bg-card p-4 text-center transition-all", tab === "completed" ? "border-success-500 ring-2 ring-success-500/20" : "border-border hover:border-success-300")}>
          <CheckCircle2 size={20} className="mx-auto mb-1 text-success-600" />
          <p className="text-2xl font-bold text-success-600">{completedItems.length}</p>
          <p className="text-xs text-muted-foreground">{t(locale, "Ù…ÙƒØªÙ…Ù„Ø©", "Completed")}</p>
        </button>
      </div>

      {loading ? (
        <div className="rounded-2xl border border-border bg-card p-12 text-center text-muted-foreground">{t(locale, "Ø¬Ø§Ø±Ù ØªØ­Ù…ÙŠÙ„ Ø§Ù„Ù…ØªØ§Ø¨Ø¹Ø§Øª...", "Loading follow-ups...")}</div>
      ) : (
        <div className="space-y-3">
          {displayItems.map((item) => {
            const ChannelIcon = CHANNEL_ICON[item.channel] || MessageSquare;
            const priority = PRIORITY_META[item.priority];
            const status = FOLLOW_UP_STATUS_META[item.status];
            const completed = item.status === "completed";
            return (
              <div key={item.id} className={cn("rounded-2xl border border-border bg-card p-4 transition-all", item.status === "overdue" && "border-danger-300 bg-danger-50/30 dark:bg-danger-950/10", completed && "opacity-70")}>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="mb-1 flex flex-wrap items-center gap-2">
                      <ChannelIcon size={16} className="text-muted-foreground" />
                      <p className={cn("text-sm font-bold text-foreground", completed && "line-through")}>{item.title}</p>
                      <span className="rounded-full px-2 py-0.5 text-[10px] font-semibold" style={{ backgroundColor: status.bg, color: status.color }}>
                        {getMetaLabel(status, locale)}
                      </span>
                    </div>
                    <p className={cn("text-xs text-muted-foreground", completed && "line-through")}>{item.parentName} â€” {item.leadName}</p>
                    <p className="mt-2 text-[11px] text-muted-foreground">{getFollowUpTypeLabel(item.type, locale)} â€¢ {getCommChannelLabel(item.channel, locale)}</p>
                  </div>

                  <div className={cn("shrink-0 space-y-1", isAr ? "text-left" : "text-right")}>
                    <p className={cn("text-xs font-semibold", priority.textClass)}>{getMetaLabel(priority, locale)}</p>
                    <p className="text-[10px] text-muted-foreground">{formatTime(item.scheduledAt, locale)}</p>
                  </div>
                </div>

                <div className="mt-3 flex items-center justify-between border-t border-border pt-3">
                  <span className="text-xs text-muted-foreground">{item.assignedTo}</span>

                  <div className="flex items-center gap-2">
                    {completed ? (
                      <button
                        onClick={() => handleUndo(item.id)}
                        disabled={savingId === item.id}
                        className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-background px-3.5 py-1.5 text-xs font-semibold text-foreground transition-colors hover:bg-muted disabled:opacity-60"
                      >
                        <RotateCcw size={12} />
                        {savingId === item.id ? t(locale, "Ø¬Ø§Ø±Ù Ø§Ù„ØªØ±Ø§Ø¬Ø¹...", "Undoing...") : t(locale, "ØªØ±Ø§Ø¬Ø¹", "Undo")}
                      </button>
                    ) : (
                      <button
                        onClick={() => handleComplete(item.id)}
                        disabled={savingId === item.id}
                        className="inline-flex items-center rounded-xl bg-success-500 px-3.5 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-success-600 disabled:opacity-60"
                      >
                        {savingId === item.id ? t(locale, "Ø¬Ø§Ø±Ù Ø§Ù„Ø­ÙØ¸...", "Saving...") : t(locale, "ØªÙ… Ø§Ù„Ø¥ÙƒÙ…Ø§Ù„", "Mark done")}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
          {!loading && displayItems.length === 0 && <div className="py-12 text-center text-muted-foreground">{t(locale, "Ù„Ø§ ØªÙˆØ¬Ø¯ Ù…ØªØ§Ø¨Ø¹Ø§Øª ÙÙŠ Ù‡Ø°Ø§ Ø§Ù„Ù‚Ø³Ù…", "No follow-ups in this section")}</div>}
        </div>
      )}
    </div>
  );
}
```

### FILE: src\app\(dashboard)\leads\page.tsx
```tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Filter, LayoutGrid, List, Plus, Search, Users } from "lucide-react";
import { StageBadge } from "@/components/leads/stage-badge";
import { TemperatureBadge } from "@/components/leads/temperature-badge";
import { LeadsKanban } from "@/components/leads/leads-kanban";
import { FILTER_EN_LABELS, FILTER_LABELS, TEMPERATURE_EN_LABELS, TEMPERATURE_LABELS } from "@/config/labels";
import { STAGE_CONFIGS } from "@/config/stages";
import { t, getStageLabel } from "@/lib/locale";
import { useUIStore } from "@/stores/ui-store";
import { cn } from "@/lib/utils";
import { listLeads } from "@/services/leads.service";
import type { LeadListItem } from "@/types/crm";
import type { LeadStage, LeadTemperature } from "@/types/common.types";

export default function LeadsPage() {
  const router = useRouter();
  const locale = useUIStore((state) => state.locale);
  const isAr = locale === "ar";
  const [search, setSearch] = useState("");
  const [stageFilter, setStageFilter] = useState<LeadStage | "all">("all");
  const [tempFilter, setTempFilter] = useState<LeadTemperature | "all">("all");
  const [view, setView] = useState<"table" | "kanban">("table");
  const [leads, setLeads] = useState<LeadListItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    async function load() {
      setLoading(true);
      const data = await listLeads();
      if (isMounted) {
        setLeads(data);
        setLoading(false);
      }
    }
    load();
    return () => {
      isMounted = false;
    };
  }, []);

  const filteredLeads = useMemo(() => {
    return leads.filter((lead) => {
      const matchesSearch = search === "" || lead.childName.includes(search) || lead.parentName.includes(search) || lead.parentPhone.includes(search);
      const matchesStage = stageFilter === "all" || lead.stage === stageFilter;
      const matchesTemp = tempFilter === "all" || lead.temperature === tempFilter;
      return matchesSearch && matchesStage && matchesTemp;
    });
  }, [leads, search, stageFilter, tempFilter]);

  const stageStats = useMemo(() => {
    const stats: Record<string, number> = { all: leads.length };
    leads.forEach((lead) => {
      stats[lead.stage] = (stats[lead.stage] || 0) + 1;
    });
    return stats;
  }, [leads]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold text-foreground"><Users size={28} className="text-brand-600" />{t(locale, "Ø§Ù„Ø¹Ù…Ù„Ø§Ø¡ Ø§Ù„Ù…Ø­ØªÙ…Ù„ÙŠÙ†", "Leads")}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{t(locale, "Ø¥Ø¯Ø§Ø±Ø© ÙˆÙ…ØªØ§Ø¨Ø¹Ø© Ù…Ø³Ø§Ø± Ø§Ù„Ø¹Ù…Ù„Ø§Ø¡ Ø§Ù„Ù…Ø­ØªÙ…Ù„ÙŠÙ†", "Manage and track the lead pipeline")}</p>
        </div>

        <Link href="/leads/new" className={cn("inline-flex items-center gap-2 rounded-xl px-4 py-2.5 bg-brand-700 text-sm font-semibold text-white shadow-brand-md transition-colors hover:bg-brand-600")}>
          <Plus size={18} />
          {t(locale, "Ø¥Ø¶Ø§ÙØ© Ø¹Ù…ÙŠÙ„", "Add lead")}
        </Link>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-2">
        <button onClick={() => setStageFilter("all")} className={cn("shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold transition-colors", stageFilter === "all" ? "bg-brand-700 text-white" : "bg-muted text-muted-foreground hover:bg-muted/80")}>{(isAr ? FILTER_LABELS.allStages : FILTER_EN_LABELS.allStages)} ({stageStats.all || 0})</button>
        {Object.values(STAGE_CONFIGS).map((stage) => (
          <button key={stage.key} onClick={() => setStageFilter(stage.key)} className="shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold transition-colors hover:opacity-90" style={{ backgroundColor: stageFilter === stage.key ? stage.color : stage.bgColor, color: stageFilter === stage.key ? "white" : stage.textColor }}>
            {getStageLabel(stage.key, locale)} ({stageStats[stage.key] || 0})
          </button>
        ))}
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search size={18} className={cn("absolute top-1/2 -translate-y-1/2 text-muted-foreground", isAr ? "right-3" : "left-3")} />
          <input type="text" value={search} onChange={(event) => setSearch(event.target.value)} placeholder={t(locale, "Ø§Ø¨Ø­Ø« Ø¨Ø§Ø³Ù… Ø§Ù„Ø·ÙÙ„ Ø£Ùˆ ÙˆÙ„ÙŠ Ø§Ù„Ø£Ù…Ø± Ø£Ùˆ Ø§Ù„Ù‡Ø§ØªÙ", "Search by child, parent, or phone")} className={cn("w-full rounded-xl border border-border bg-card py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-ring", isAr ? "pr-10 pl-4" : "pl-10 pr-4")} />
        </div>

        <div className="flex gap-2">
          <div className="relative">
            <Filter size={16} className={cn("absolute top-1/2 -translate-y-1/2 text-muted-foreground", isAr ? "right-3" : "left-3")} />
            <select value={tempFilter} onChange={(event) => setTempFilter(event.target.value as LeadTemperature | "all")} className={cn("appearance-none rounded-xl border border-border bg-card py-2.5 text-sm text-foreground", isAr ? "pr-9 pl-4" : "pl-9 pr-4")}>
              <option value="all">{isAr ? FILTER_LABELS.allTemperatures : FILTER_EN_LABELS.allTemperatures}</option>
              {Object.entries(isAr ? TEMPERATURE_LABELS : TEMPERATURE_EN_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
            </select>
          </div>

          <div className="flex rounded-xl border border-border bg-card p-1">
            <button onClick={() => setView("table")} className={cn("rounded-lg px-3 py-1.5 transition-colors", view === "table" ? "bg-brand-700 text-white" : "text-muted-foreground")} title={t(locale, "Ø¹Ø±Ø¶ Ø¬Ø¯ÙˆÙ„", "Table view")}><List size={16} /></button>
            <button onClick={() => setView("kanban")} className={cn("rounded-lg px-3 py-1.5 transition-colors", view === "kanban" ? "bg-brand-700 text-white" : "text-muted-foreground")} title={t(locale, "Ø¹Ø±Ø¶ ÙƒØ§Ù†Ø¨Ø§Ù†", "Kanban view")}><LayoutGrid size={16} /></button>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="rounded-2xl border border-border bg-card p-12 text-center text-muted-foreground">{t(locale, "Ø¬Ø§Ø±Ù ØªØ­Ù…ÙŠÙ„ Ø§Ù„Ø¹Ù…Ù„Ø§Ø¡...", "Loading leads...")}</div>
      ) : filteredLeads.length === 0 ? (
        <div className="rounded-2xl border border-border bg-card p-12 text-center text-muted-foreground">{t(locale, "Ù„Ø§ ÙŠÙˆØ¬Ø¯ Ø¹Ù…Ù„Ø§Ø¡ Ù…Ø·Ø§Ø¨Ù‚ÙˆÙ† Ù„Ù„ÙÙ„Ø§ØªØ± Ø§Ù„Ø­Ø§Ù„ÙŠØ©", "No leads match the current filters")}</div>
      ) : view === "kanban" ? (
        <LeadsKanban leads={filteredLeads} />
      ) : (
        <div className="overflow-hidden rounded-2xl border border-border bg-card">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className={cn("px-4 py-3 font-semibold text-muted-foreground", isAr ? "text-right" : "text-left")}>{t(locale, "Ø§Ù„Ø·ÙÙ„", "Child")}</th>
                  <th className={cn("px-4 py-3 font-semibold text-muted-foreground", isAr ? "text-right" : "text-left")}>{t(locale, "ÙˆÙ„ÙŠ Ø§Ù„Ø£Ù…Ø±", "Parent")}</th>
                  <th className={cn("px-4 py-3 font-semibold text-muted-foreground", isAr ? "text-right" : "text-left")}>{t(locale, "Ø§Ù„Ù…Ø±Ø­Ù„Ø©", "Stage")}</th>
                  <th className={cn("px-4 py-3 font-semibold text-muted-foreground", isAr ? "text-right" : "text-left")}>{t(locale, "Ø§Ù„Ø§Ù‡ØªÙ…Ø§Ù…", "Temperature")}</th>
                  <th className={cn("px-4 py-3 font-semibold text-muted-foreground", isAr ? "text-right" : "text-left")}>{t(locale, "Ø§Ù„Ù…Ø³Ø¤ÙˆÙ„", "Owner")}</th>
                  <th className={cn("px-4 py-3 font-semibold text-muted-foreground", isAr ? "text-right" : "text-left")}>{t(locale, "Ø¢Ø®Ø± Ù…ØªØ§Ø¨Ø¹Ø©", "Last contact")}</th>
                </tr>
              </thead>
              <tbody>
                {filteredLeads.map((lead) => (
                  <tr key={lead.id} onClick={() => router.push(`/leads/${lead.id}`)} className="cursor-pointer border-b border-border transition-colors last:border-0 hover:bg-muted/30">
                    <td className="px-4 py-3"><p className="font-semibold text-foreground">{lead.childName}</p><p className="text-xs text-muted-foreground">{lead.childAge} {t(locale, "Ø³Ù†Ø©", "years")}</p></td>
                    <td className="px-4 py-3"><p className="text-foreground">{lead.parentName}</p><p className="text-xs text-muted-foreground">{lead.parentPhone}</p></td>
                    <td className="px-4 py-3"><StageBadge stage={lead.stage} /></td>
                    <td className="px-4 py-3"><TemperatureBadge temperature={lead.temperature} /></td>
                    <td className="px-4 py-3 text-foreground">{lead.assignedToName}</td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">{lead.lastContactAt ? new Date(lead.lastContactAt).toLocaleDateString(isAr ? "ar-EG" : "en-US") : t(locale, "Ù„Ù… ÙŠØªÙ…", "Not yet")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
```

### FILE: src\app\(dashboard)\leads\new\page.tsx
```tsx
"use client";

import { useRouter } from "next/navigation";
import { LeadForm } from "@/components/leads/lead-form";
import { createLead } from "@/services/leads.service";
import type { CreateLeadInput } from "@/types/crm";

export default function NewLeadPage() {
  const router = useRouter();

  const handleSubmit = async (payload: CreateLeadInput) => {
    await createLead(payload);
    router.push("/leads");
  };

  return (
    <LeadForm
      title="Ø¥Ø¶Ø§ÙØ© Ø¹Ù…ÙŠÙ„ Ø¬Ø¯ÙŠØ¯"
      description="Ø§Ø¨Ø¯Ø£ Ù…Ù† Ø¨ÙŠØ§Ù†Ø§Øª ÙˆÙ„ÙŠ Ø§Ù„Ø£Ù…Ø± ÙˆØ§Ù„Ø·ÙÙ„ Ø«Ù… ÙˆØ²Ù‘Ø¹ Ø§Ù„Ø¹Ù…ÙŠÙ„ Ø¹Ù„Ù‰ Ø§Ù„Ù…Ø³Ø¤ÙˆÙ„ Ø§Ù„Ù…Ù†Ø§Ø³Ø¨"
      submitLabel="Ø­ÙØ¸ Ø§Ù„Ø¹Ù…ÙŠÙ„"
      successMessage="ØªÙ… Ø­ÙØ¸ Ø§Ù„Ø¹Ù…ÙŠÙ„ Ø¨Ù†Ø¬Ø§Ø­"
      onSubmit={handleSubmit}
      cancelHref="/leads"
    />
  );
}
```

### FILE: src\app\(dashboard)\leads\[id]\page.tsx
```tsx
```

### FILE: src\app\(dashboard)\leads\[id]\edit\page.tsx
```tsx
```

### FILE: src\app\(dashboard)\parents\page.tsx
```tsx
"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { MessageCircle, Plus, Search, Users } from "lucide-react";
import { useUIStore } from "@/stores/ui-store";
import { t } from "@/lib/locale";
import { cn } from "@/lib/utils";
import { extractLeadIdFromProjectionId, listParentsWithRelations } from "@/services/relations.service";
import type { ParentListItem } from "@/types/crm";
import { EmptySearchState, LoadingState } from "@/components/shared/page-state";

export default function ParentsPage() {
  const locale = useUIStore((state) => state.locale);
  const isAr = locale === "ar";
  const [search, setSearch] = useState("");
  const [parents, setParents] = useState<ParentListItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    async function load() {
      setLoading(true);
      const data = await listParentsWithRelations();
      if (isMounted) {
        setParents(data);
        setLoading(false);
      }
    }
    load();
    return () => {
      isMounted = false;
    };
  }, []);

  const projectedCount = useMemo(() => parents.filter((parent) => Boolean(extractLeadIdFromProjectionId(parent.id))).length, [parents]);
  const assignedOwnerCount = useMemo(() => parents.filter((parent) => Boolean(parent.ownerName)).length, [parents]);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return parents.filter((parent) => {
      if (!query) return true;
      return (
        parent.fullName.toLowerCase().includes(query) ||
        parent.phone.includes(query) ||
        parent.children.some((child) => child.toLowerCase().includes(query))
      );
    });
  }, [parents, search]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
        <h1 className="flex items-center gap-2 text-2xl font-bold text-foreground">
          <Users size={28} className="text-brand-600" />
          {t(locale, "Ø£ÙˆÙ„ÙŠØ§Ø¡ Ø§Ù„Ø£Ù…ÙˆØ±", "Parents")}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">{t(locale, "Ù…ØªØ§Ø¨Ø¹Ø© Ø¨ÙŠØ§Ù†Ø§Øª Ø§Ù„ØªÙˆØ§ØµÙ„ ÙˆØ±Ø¨Ø· Ø£ÙˆÙ„ÙŠØ§Ø¡ Ø§Ù„Ø£Ù…ÙˆØ± Ø¨Ø§Ù„Ø£Ø·ÙØ§Ù„ ÙˆØ§Ù„Ø¹Ù…Ù„Ø§Ø¡ Ø§Ù„Ù…Ø­ØªÙ…Ù„ÙŠÙ†", "Track contact details and link parents with students and open leads")}</p>
        </div>
        <Link href="/parents/new" className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand-700 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-600">
          <Plus size={18} />
          {t(locale, "Ø¥Ø¶Ø§ÙØ© ÙˆÙ„ÙŠ Ø£Ù…Ø±", "Add parent")}
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <MetricCard title={t(locale, "Ø¥Ø¬Ù…Ø§Ù„ÙŠ Ø£ÙˆÙ„ÙŠØ§Ø¡ Ø§Ù„Ø£Ù…ÙˆØ±", "Total parents")} value={String(parents.length)} />
        <MetricCard title={t(locale, "Ù…Ù† Ø§Ù„Ø¹Ù…Ù„Ø§Ø¡ Ø§Ù„Ø­Ø§Ù„ÙŠÙŠÙ†", "From current customers")} value={String(projectedCount)} />
        <MetricCard title={t(locale, "Ù„Ù‡Ù… Ù…Ø³Ø¤ÙˆÙ„", "Assigned owner")} value={String(assignedOwnerCount)} />
      </div>

      <div className="relative max-w-md">
        <Search size={18} className={cn("absolute top-1/2 -translate-y-1/2 text-muted-foreground", isAr ? "right-3" : "left-3")} />
        <input type="text" value={search} onChange={(event) => setSearch(event.target.value)} placeholder={t(locale, "Ø¨Ø­Ø« Ø¨Ø§Ù„Ø§Ø³Ù… Ø£Ùˆ Ø§Ù„Ù‡Ø§ØªÙ Ø£Ùˆ Ø§Ø³Ù… Ø§Ù„Ø·ÙÙ„", "Search by name, phone, or child name")} className={cn("w-full rounded-xl border border-border bg-card py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-ring", isAr ? "pr-10 pl-4" : "pl-10 pr-4")} />
      </div>

      {loading ? (
        <LoadingState
          titleAr="Ø¬Ø§Ø±Ù ØªØ­Ù…ÙŠÙ„ Ø£ÙˆÙ„ÙŠØ§Ø¡ Ø§Ù„Ø£Ù…ÙˆØ±"
          titleEn="Loading parents"
          descriptionAr="ÙŠØªÙ… Ø§Ù„Ø¢Ù† ØªØ¬Ù‡ÙŠØ² Ù…Ù„ÙØ§Øª Ø£ÙˆÙ„ÙŠØ§Ø¡ Ø§Ù„Ø£Ù…ÙˆØ± ÙˆØ±Ø¨Ø· Ø§Ù„Ø£Ø·ÙØ§Ù„ ÙˆØ§Ù„Ø¹Ù…Ù„Ø§Ø¡ Ø§Ù„Ù…Ø­ØªÙ…Ù„ÙŠÙ† Ø§Ù„Ù…Ø±ØªØ¨Ø·ÙŠÙ† Ø¨Ù‡Ù…."
          descriptionEn="Preparing parent profiles and linking related students and open leads."
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((parent) => (
            <Link key={parent.id} href={`/parents/${parent.id}`} className="rounded-2xl border border-border bg-card p-4 transition-all hover:-translate-y-0.5 hover:shadow-brand-md">
              <div className="mb-3 flex items-start justify-between gap-3">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-bold text-foreground">{parent.fullName}</p>
                    {extractLeadIdFromProjectionId(parent.id) ? <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-semibold text-amber-700">{t(locale, "Ù…Ù† Ø§Ù„Ø¹Ù…Ù„Ø§Ø¡ Ø§Ù„Ø­Ø§Ù„ÙŠÙŠÙ†", "From current customers")}</span> : null}
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">{parent.phone}</p>
                  <p className="mt-1 text-[11px] text-muted-foreground">{t(locale, "Ø§Ù„Ù…Ø³Ø¤ÙˆÙ„", "Owner")}: {parent.ownerName ?? t(locale, "ØºÙŠØ± Ù…Ø®ØµØµ", "Unassigned")}</p>
                </div>
                {parent.whatsapp ? <span className="rounded-full bg-success-50 px-2 py-0.5 text-[10px] font-semibold text-success-600">WhatsApp</span> : null}
              </div>

              <div className="grid grid-cols-2 gap-2 text-center text-xs">
                <div className="rounded-xl bg-muted/50 p-2">
                  <p className="text-lg font-bold text-foreground">{parent.childrenCount}</p>
                  <p className="text-muted-foreground">{t(locale, "Ø£Ø·ÙØ§Ù„", "Children")}</p>
                </div>
                <div className="rounded-xl bg-muted/50 p-2">
                  <p className="text-lg font-bold text-foreground">{parent.city ?? "â€”"}</p>
                  <p className="text-muted-foreground">{t(locale, "Ø§Ù„Ù…Ø¯ÙŠÙ†Ø©", "City")}</p>
                </div>
              </div>

              <div className="mt-3 border-t border-border pt-3">
                <p className="mb-2 text-xs font-semibold text-muted-foreground">{t(locale, "Ø§Ù„Ø£Ø·ÙØ§Ù„ Ø§Ù„Ù…Ø±ØªØ¨Ø·ÙˆÙ†", "Linked children")}</p>
                <div className="flex flex-wrap gap-1.5">
                  {parent.children.length === 0 ? (
                    <span className="text-xs text-muted-foreground">{t(locale, "Ù„Ø§ ÙŠÙˆØ¬Ø¯ Ø·Ù„Ø§Ø¨ Ù…Ø±ØªØ¨Ø·ÙˆÙ† Ø¨Ø¹Ø¯", "No students linked yet")}</span>
                  ) : (
                    parent.children.map((child) => (
                      <span key={child} className="rounded-full bg-brand-50 px-2 py-0.5 text-[10px] text-brand-700 dark:bg-brand-950 dark:text-brand-300">{child}</span>
                    ))
                  )}
                </div>
              </div>

              <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
                <MessageCircle size={14} />
                <span>{parent.whatsapp ?? t(locale, "ÙˆØ§ØªØ³Ø§Ø¨ ØºÙŠØ± Ù…ØªÙˆÙØ±", "WhatsApp not available")}</span>
              </div>
            </Link>
          ))}
          {!loading && filtered.length === 0 ? <div className="col-span-full"><EmptySearchState /></div> : null}
        </div>
      )}
    </div>
  );
}


function MetricCard({ title, value }: { title: string; value: string }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <p className="text-xs font-semibold text-muted-foreground">{title}</p>
      <p className="mt-2 text-2xl font-bold text-foreground">{value}</p>
    </div>
  );
}
```

### FILE: src\app\(dashboard)\parents\new\page.tsx
```tsx
"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { ParentForm } from "@/components/parents/parent-form";
import { createParent, listParents } from "@/services/parents.service";
import { createStudent, listStudents } from "@/services/students.service";
import type { CreateParentInput } from "@/types/crm";

function normalizePhone(value: string | null | undefined): string {
  return (value ?? "").replace(/\D/g, "").replace(/^20/, "");
}

function normalizeName(value: string | null | undefined): string {
  return (value ?? "").toLowerCase().replace(/[Ù‹-ÙŸ]/g, "").replace(/\s+/g, " ").trim();
}

export default function NewParentPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleSubmit = async (payload: CreateParentInput) => {
    const parents = await listParents();
    const duplicateParent = parents.find((parent) =>
      normalizePhone(parent.phone) === normalizePhone(payload.phone) ||
      (payload.whatsapp && normalizePhone(parent.whatsapp) === normalizePhone(payload.whatsapp)) ||
      (normalizeName(parent.fullName) === normalizeName(payload.fullName) && normalizePhone(parent.phone) === normalizePhone(payload.phone)),
    );

    if (duplicateParent) {
      throw new Error("ÙŠÙˆØ¬Ø¯ ÙˆÙ„ÙŠ Ø£Ù…Ø± Ù…Ø³Ø¬Ù„ Ø¨Ø§Ù„ÙØ¹Ù„ Ø¨Ù†ÙØ³ Ø§Ù„Ø±Ù‚Ù… Ø£Ùˆ Ø§Ù„Ø§Ø³Ù…. Ø§ÙØªØ­ Ø§Ù„Ø³Ø¬Ù„ Ø§Ù„Ø­Ø§Ù„ÙŠ Ø¨Ø¯Ù„ Ø¥Ù†Ø´Ø§Ø¡ Ø³Ø¬Ù„ Ø¬Ø¯ÙŠØ¯.");
    }

    const createdParent = await createParent(payload);

    if (payload.firstStudentName && payload.firstStudentAge) {
      const students = await listStudents();
      const duplicateStudent = students.find((student) =>
        normalizeName(student.fullName) === normalizeName(payload.firstStudentName) &&
        (student.parentId === createdParent.id || normalizePhone(student.parentPhone) === normalizePhone(createdParent.phone)),
      );

      if (duplicateStudent) {
        throw new Error("Ø§Ù„Ø·Ø§Ù„Ø¨ Ø§Ù„Ø£ÙˆÙ„ Ù…Ø³Ø¬Ù„ Ø¨Ø§Ù„ÙØ¹Ù„ Ù„Ù‡Ø°Ø§ ÙˆÙ„ÙŠ Ø§Ù„Ø£Ù…Ø±. Ù„Ù† ÙŠØªÙ… Ø¥Ù†Ø´Ø§Ø¡ Ø§Ø³Ù… Ù…ÙƒØ±Ø±.");
      }

      await createStudent({
        fullName: payload.firstStudentName,
        age: payload.firstStudentAge,
        parentId: createdParent.id,
        parentName: createdParent.fullName,
        parentPhone: createdParent.phone,
        currentCourse: payload.firstStudentCourse ?? null,
        className: payload.firstStudentClassName ?? null,
        status: "active",
      });
    }

    router.push(`/parents/${createdParent.id}`);
  };

  return (
    <ParentForm
      title="Ø¥Ø¶Ø§ÙØ© ÙˆÙ„ÙŠ Ø£Ù…Ø±"
      description="Ø£Ù†Ø´Ø¦ Ø³Ø¬Ù„ ÙˆÙ„ÙŠ Ø£Ù…Ø± Ø­Ù‚ÙŠÙ‚ÙŠ Ø¯Ø§Ø®Ù„ Ø§Ù„Ù†Ø¸Ø§Ù… ÙˆÙŠÙ…ÙƒÙ†Ùƒ Ø¥Ø¶Ø§ÙØ© Ø£ÙˆÙ„ Ø·Ø§Ù„Ø¨ Ù…Ø¹Ù‡ Ù…Ù† Ù†ÙØ³ Ø§Ù„ÙÙˆØ±Ù…"
      submitLabel="Ø­ÙØ¸ ÙˆÙ„ÙŠ Ø§Ù„Ø£Ù…Ø±"
      successMessage="ØªÙ… Ø¥Ù†Ø´Ø§Ø¡ Ø³Ø¬Ù„ ÙˆÙ„ÙŠ Ø§Ù„Ø£Ù…Ø± Ø¨Ù†Ø¬Ø§Ø­"
      onSubmit={handleSubmit}
      cancelHref="/parents"
      initialValues={{
        fullName: searchParams.get("parentName") ?? undefined,
        phone: searchParams.get("parentPhone") ?? undefined,
        whatsapp: searchParams.get("parentWhatsapp") ?? undefined,
        firstStudentName: searchParams.get("firstStudentName") ?? undefined,
        firstStudentAge: searchParams.get("firstStudentAge") ? Number(searchParams.get("firstStudentAge")) : undefined,
        firstStudentCourse: (searchParams.get("currentCourse") as CreateParentInput["firstStudentCourse"] | null) ?? undefined,
        firstStudentClassName: searchParams.get("className") ?? undefined,
      }}
    />
  );
}
```

### FILE: src\app\(dashboard)\parents\[id]\page.tsx
```tsx
```

### FILE: src\app\(dashboard)\payments\page.tsx
```tsx
"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { AlertCircle, ArrowLeft, ArrowRight, PlusCircle, Search, Wallet } from "lucide-react";

import { formatCurrencyEgp, formatDate } from "@/lib/formatters";
import { getPaymentStatusLabel, t } from "@/lib/locale";
import { cn } from "@/lib/utils";
import {
  getBillingCycleText,
  getPaymentDisplayState,
  getPaymentEffectiveDueDate,
  getPaymentsSummary,
  listPayments,
} from "@/services/payments.service";
import { useUIStore } from "@/stores/ui-store";
import type { PaymentItem } from "@/types/crm";
import type { PaymentStatus } from "@/types/common.types";
import { useCurrentUser } from "@/providers/user-provider";
import { canAccessPaymentsForUser, canManagePaymentsForUser } from "@/config/roles";
import { PageStateCard } from "@/components/shared/page-state";

type DisplayStatus = PaymentStatus | "deferred";

const PAYMENT_STATUS_META: Record<DisplayStatus, { color: string; bg: string }> = {
  paid: { color: "#059669", bg: "#ECFDF5" },
  pending: { color: "#D97706", bg: "#FFFBEB" },
  overdue: { color: "#DC2626", bg: "#FEF2F2" },
  refunded: { color: "#6B7280", bg: "#F3F4F6" },
  partial: { color: "#2563EB", bg: "#EFF6FF" },
  deferred: { color: "#7C3AED", bg: "#F5F3FF" },
};

function getDisplayStatusLabel(status: DisplayStatus, locale: "ar" | "en") {
  return status === "deferred" ? t(locale, "Ù…Ø¤Ø¬Ù„", "Deferred") : getPaymentStatusLabel(status, locale);
}

export default function PaymentsPage() {
  const locale = useUIStore((state) => state.locale);
  const isAr = locale === "ar";
  const user = useCurrentUser();
  const canAccess = canAccessPaymentsForUser(user);
  const canManage = canManagePaymentsForUser(user);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<DisplayStatus | "all">("all");
  const [payments, setPayments] = useState<PaymentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState({
    totalExpected: 0,
    totalCollected: 0,
    totalOverdue: 0,
    dueToday: 0,
    deferredCount: 0,
    collectionRate: 0,
    upcoming: [] as PaymentItem[],
  });

  useEffect(() => {
    let isMounted = true;

    async function load() {
      setLoading(true);
      const [data, nextSummary] = await Promise.all([listPayments(), getPaymentsSummary()]);
      if (isMounted) {
        setPayments(data);
        setSummary(nextSummary);
        setLoading(false);
      }
    }

    if (canAccess) {
      void load();
    }

    return () => {
      isMounted = false;
    };
  }, [canAccess]);

  const filtered = useMemo(() => {
    return payments.filter((payment) => {
      const query = search.trim().toLowerCase();
      const displayStatus = getPaymentDisplayState(payment);
      const matchSearch =
        !query ||
        payment.studentName.toLowerCase().includes(query) ||
        payment.parentName.toLowerCase().includes(query) ||
        (payment.invoiceNumber ?? "").toLowerCase().includes(query);
      const matchStatus = statusFilter === "all" || displayStatus === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [payments, search, statusFilter]);

  const statusCounts = useMemo(() => {
    return {
      paid: payments.filter((payment) => getPaymentDisplayState(payment) === "paid").length,
      pending: payments.filter((payment) => getPaymentDisplayState(payment) === "pending").length,
      overdue: payments.filter((payment) => getPaymentDisplayState(payment) === "overdue").length,
      partial: payments.filter((payment) => getPaymentDisplayState(payment) === "partial").length,
      deferred: payments.filter((payment) => getPaymentDisplayState(payment) === "deferred").length,
    };
  }, [payments]);

  if (!canAccess) {
    return (
      <PageStateCard
        variant="warning"
        titleAr="Ø§Ù„Ù…Ø¯ÙÙˆØ¹Ø§Øª Ù…ØªØ§Ø­Ø© Ù„Ù„Ù…Ø³Ø¤ÙˆÙ„ÙŠÙ† Ø§Ù„Ù…Ø¹ØªÙ…Ø¯ÙŠÙ† ÙÙ‚Ø·"
        titleEn="Payments are restricted to approved users"
        descriptionAr="Ø¥Ø¯Ø§Ø±Ø© Ø§Ù„Ù…Ø¯ÙÙˆØ¹Ø§Øª ÙˆØ§Ù„ÙÙˆØ§ØªÙŠØ± Ø¯Ø§Ø®Ù„ Skidy Rein Ù…Ø­ØµÙˆØ±Ø© Ø¹Ù„Ù‰ Ø®Ø§Ù„Ø¯ ÙˆØ¹Ø¨Ø¯Ø§Ù„Ø±Ø­Ù…Ù† ÙˆØ§Ù„Ø§Ø¡ ÙÙ‚Ø·. ÙŠÙ…ÙƒÙ†Ùƒ Ø§Ù„Ø±Ø¬ÙˆØ¹ Ø¥Ù„Ù‰ Ù„ÙˆØ­Ø© Ø§Ù„ØªØ­ÙƒÙ… Ø£Ùˆ Ù…ØªØ§Ø¨Ø¹Ø© Ø£ÙŠ Ù‚Ø³Ù… Ø¢Ø®Ø± Ø­Ø³Ø¨ Ø¯ÙˆØ±Ùƒ."
        descriptionEn="Payments and invoicing in Skidy Rein are restricted to Khaled, Abdelrahman, and Alaa only. You can go back to the dashboard or continue working in the sections allowed for your role."
        actionHref="/"
        actionLabelAr="Ø§Ù„Ø¹ÙˆØ¯Ø© Ø¥Ù„Ù‰ Ù„ÙˆØ­Ø© Ø§Ù„ØªØ­ÙƒÙ…"
        actionLabelEn="Back to dashboard"
      />
    );
  }

  const hasRealPayments = payments.length > 0;
  const hasFilteredResults = filtered.length > 0;

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-border bg-card p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="flex items-center gap-2 text-2xl font-bold text-foreground">
              <Wallet size={28} className="text-brand-600" />
              {t(locale, "Ø§Ù„Ù…Ø¯ÙÙˆØ¹Ø§Øª ÙˆØ§Ù„ÙÙˆØªØ±Ø©", "Payments & billing")}
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {t(
                locale,
                "Ø§Ù„ÙØ§ØªÙˆØ±Ø© Ø§Ù„Ø§ÙØªØ±Ø§Ø¶ÙŠØ© Ù…Ø¨Ù†ÙŠØ© Ø¹Ù„Ù‰ ÙƒÙ„ 4 Ø¬Ù„Ø³Ø§ØªØŒ ÙˆÙŠÙ…ÙƒÙ† ØªØ£Ø¬ÙŠÙ„ Ø§Ù„Ø§Ø³ØªØ­Ù‚Ø§Ù‚ Ø¹Ù†Ø¯ Ø§Ù„Ø§ØªÙØ§Ù‚ Ù…Ø¹ ÙˆÙ„ÙŠ Ø§Ù„Ø£Ù…Ø±. Ø§Ù„Ø³Ø¬Ù„Ø§Øª Ø§Ù„Ù…Ø¤Ø±Ø´ÙØ© Ù„Ø§ ØªØ¸Ù‡Ø± Ù‡Ù†Ø§ Ø­ØªÙ‰ ÙŠØ¨Ù‚Ù‰ Ø§Ù„ØªØ´ØºÙŠÙ„ Ø§Ù„ÙŠÙˆÙ…ÙŠ Ù†Ø¸ÙŠÙÙ‹Ø§.",
                "The default billing cycle is one invoice for every 4 sessions, with flexible deferral when agreed with the parent. Archived records are hidden from this list to keep daily operations clean.",
              )}
            </p>
          </div>
          {canManage ? (
            <Link href="/payments/new" className="inline-flex items-center gap-2 rounded-2xl bg-brand-700 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-600">
              <PlusCircle size={18} />
              {t(locale, "Ø¥Ø¶Ø§ÙØ© Ø¯ÙØ¹Ø©", "Add payment")}
            </Link>
          ) : null}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 xl:grid-cols-5">
        <MetricCard label={t(locale, "Ø¥Ø¬Ù…Ø§Ù„ÙŠ Ø§Ù„Ù…Ø³ØªØ­Ù‚", "Total expected")} value={formatCurrencyEgp(summary.totalExpected, locale)} colorClass="text-foreground" />
        <MetricCard label={t(locale, "Ø¥Ø¬Ù…Ø§Ù„ÙŠ Ø§Ù„Ù…Ø­ØµÙ„", "Total collected")} value={formatCurrencyEgp(summary.totalCollected, locale)} colorClass="text-success-600" />
        <MetricCard label={t(locale, "Ø¥Ø¬Ù…Ø§Ù„ÙŠ Ø§Ù„Ù…ØªØ£Ø®Ø±", "Total overdue")} value={formatCurrencyEgp(summary.totalOverdue, locale)} colorClass="text-danger-600" />
        <MetricCard label={t(locale, "Ù…Ø³ØªØ­Ù‚ Ø§Ù„ÙŠÙˆÙ…", "Due today")} value={String(summary.dueToday)} colorClass="text-amber-600" />
        <MetricCard label={t(locale, "Ù…Ø¤Ø¬Ù„ Ø­Ø§Ù„ÙŠÙ‹Ø§", "Currently deferred")} value={String(summary.deferredCount)} colorClass="text-violet-600" />
      </div>

      <div className="grid grid-cols-2 gap-3 xl:grid-cols-5">
        <StatusMiniCard label={getDisplayStatusLabel("paid", locale)} count={statusCounts.paid} status="paid" />
        <StatusMiniCard label={getDisplayStatusLabel("pending", locale)} count={statusCounts.pending} status="pending" />
        <StatusMiniCard label={getDisplayStatusLabel("overdue", locale)} count={statusCounts.overdue} status="overdue" />
        <StatusMiniCard label={getDisplayStatusLabel("partial", locale)} count={statusCounts.partial} status="partial" />
        <StatusMiniCard label={getDisplayStatusLabel("deferred", locale)} count={statusCounts.deferred} status="deferred" />
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="relative flex-1">
              <Search size={18} className={cn("absolute top-1/2 -translate-y-1/2 text-muted-foreground", isAr ? "right-3" : "left-3")} />
              <input
                type="text"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder={t(locale, "Ø¨Ø­Ø« Ø¨Ø§Ù„Ø·Ø§Ù„Ø¨ Ø£Ùˆ ÙˆÙ„ÙŠ Ø§Ù„Ø£Ù…Ø± Ø£Ùˆ Ø±Ù‚Ù… Ø§Ù„ÙØ§ØªÙˆØ±Ø©...", "Search by student, parent, or invoice number...")}
                className={cn("w-full rounded-xl border border-border bg-card py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-ring", isAr ? "pr-10 pl-4" : "pl-10 pr-4")}
              />
            </div>
            <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as DisplayStatus | "all")} className="rounded-xl border border-border bg-card px-4 py-2.5 text-sm text-foreground">
              <option value="all">{t(locale, "ÙƒÙ„ Ø­Ø§Ù„Ø§Øª Ø§Ù„Ø¯ÙØ¹", "All payment statuses")}</option>
              {(["paid", "pending", "overdue", "partial", "deferred"] as DisplayStatus[]).map((key) => (
                <option key={key} value={key}>{getDisplayStatusLabel(key, locale)}</option>
              ))}
            </select>
          </div>

          {loading ? (
            <div className="rounded-2xl border border-border bg-card p-12 text-center text-muted-foreground">
              {t(locale, "Ø¬Ø§Ø±Ù ØªØ­Ù…ÙŠÙ„ Ø¨ÙŠØ§Ù†Ø§Øª Ø§Ù„Ù…Ø¯ÙÙˆØ¹Ø§Øª...", "Loading payments...")}
            </div>
          ) : !hasRealPayments ? (
            <PageStateCard
              icon={AlertCircle}
              titleAr="Ù„Ø§ ØªÙˆØ¬Ø¯ Ù…Ø¯ÙÙˆØ¹Ø§Øª Ø­Ù‚ÙŠÙ‚ÙŠØ© Ù…Ø³Ø¬Ù„Ø© Ø¨Ø¹Ø¯"
              titleEn="No real payments have been recorded yet"
              descriptionAr="Ø§Ù„Ù‚Ø§Ø¦Ù…Ø© Ø§Ù„Ø¢Ù† ØµØ§Ø¯Ù‚Ø© Ø¨Ø§Ù„ÙƒØ§Ù…Ù„: Ù„Ø§ ØªÙˆØ¬Ø¯ Ø¨ÙŠØ§Ù†Ø§Øª ØªØ¬Ø±ÙŠØ¨ÙŠØ© Ù…Ø¹Ø±ÙˆØ¶Ø©. Ø§Ø¨Ø¯Ø£ Ø¨Ø¥Ø¶Ø§ÙØ© Ø£ÙˆÙ„ Ø¯ÙØ¹Ø© Ø­Ù‚ÙŠÙ‚ÙŠØ© ÙˆØ³ÙŠØ¸Ù‡Ø± Ø£Ø«Ø±Ù‡Ø§ Ù‡Ù†Ø§ ÙˆÙÙŠ Ø§Ù„ÙÙˆØ§ØªÙŠØ± ÙˆØ§Ù„ØªÙ‚Ø§Ø±ÙŠØ±."
              descriptionEn="This list is now fully honest: no demo data is shown. Create the first real payment and it will appear here, in invoices, and in reports."
              actionHref={canManage ? "/payments/new" : undefined}
              actionLabelAr="Ø¥Ø¶Ø§ÙØ© Ø£ÙˆÙ„ Ø¯ÙØ¹Ø©"
              actionLabelEn="Create the first payment"
            />
          ) : !hasFilteredResults ? (
            <div className="flex items-center justify-center gap-2 rounded-2xl border border-border bg-card p-12 text-muted-foreground">
              <AlertCircle size={18} />
              {t(locale, "Ù„Ø§ ØªÙˆØ¬Ø¯ Ù…Ø¯ÙÙˆØ¹Ø§Øª Ù…Ø·Ø§Ø¨Ù‚Ø© Ù„Ù„ÙÙ„Ø§ØªØ± Ø§Ù„Ø­Ø§Ù„ÙŠØ©", "No payments match the current filters")}
            </div>
          ) : (
            <div className="overflow-hidden rounded-2xl border border-border bg-card">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[980px] text-sm">
                  <thead>
                    <tr className="border-b border-border bg-muted/50">
                      <th className={cn("px-4 py-3 font-semibold text-muted-foreground", isAr ? "text-right" : "text-left")}>{t(locale, "Ø§Ù„Ø·Ø§Ù„Ø¨", "Student")}</th>
                      <th className={cn("px-4 py-3 font-semibold text-muted-foreground", isAr ? "text-right" : "text-left")}>{t(locale, "ÙˆÙ„ÙŠ Ø§Ù„Ø£Ù…Ø±", "Parent")}</th>
                      <th className={cn("px-4 py-3 font-semibold text-muted-foreground", isAr ? "text-right" : "text-left")}>{t(locale, "Ø¯ÙˆØ±Ø© Ø§Ù„ÙÙˆØªØ±Ø©", "Billing cycle")}</th>
                      <th className={cn("px-4 py-3 font-semibold text-muted-foreground", isAr ? "text-right" : "text-left")}>{t(locale, "Ø§Ù„Ù…Ø¨Ù„Øº", "Amount")}</th>
                      <th className={cn("px-4 py-3 font-semibold text-muted-foreground", isAr ? "text-right" : "text-left")}>{t(locale, "Ø§Ù„Ø­Ø§Ù„Ø©", "Status")}</th>
                      <th className={cn("px-4 py-3 font-semibold text-muted-foreground", isAr ? "text-right" : "text-left")}>{t(locale, "Ø§Ù„Ø§Ø³ØªØ­Ù‚Ø§Ù‚ Ø§Ù„ÙØ¹Ù„ÙŠ", "Effective due")}</th>
                      <th className={cn("px-4 py-3 font-semibold text-muted-foreground", isAr ? "text-right" : "text-left")}>{t(locale, "Ø§Ù„ØªÙØ§ØµÙŠÙ„", "Details")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((payment) => {
                      const displayStatus = getPaymentDisplayState(payment);
                      const meta = PAYMENT_STATUS_META[displayStatus];
                      return (
                        <tr key={payment.id} className={cn("border-b border-border last:border-0 transition-colors hover:bg-muted/30", displayStatus === "overdue" && "bg-danger-50/50")}>
                          <td className="px-4 py-3"><p className="font-semibold text-foreground">{payment.studentName}</p></td>
                          <td className="px-4 py-3 text-foreground">{payment.parentName}</td>
                          <td className="px-4 py-3 text-xs text-muted-foreground">{getBillingCycleText(payment, locale)}</td>
                          <td className="px-4 py-3 font-semibold text-foreground">{formatCurrencyEgp(payment.amount, locale)}</td>
                          <td className="px-4 py-3">
                            <span className="rounded-full px-2.5 py-1 text-xs font-semibold" style={{ backgroundColor: meta.bg, color: meta.color }}>
                              {getDisplayStatusLabel(displayStatus, locale)}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-xs text-muted-foreground">{formatDate(getPaymentEffectiveDueDate(payment), locale)}</td>
                          <td className="px-4 py-3">
                            <Link href={`/payments/${payment.id}`} className="inline-flex items-center gap-1 rounded-full border border-brand-200 bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-700 transition-colors hover:bg-brand-100 dark:border-brand-900 dark:bg-brand-950 dark:text-brand-300">
                              {t(locale, "ÙØªØ­", "Open")}
                              {isAr ? <ArrowLeft size={13} /> : <ArrowRight size={13} />}
                            </Link>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-border bg-card p-5">
          <h3 className="mb-4 text-base font-bold text-foreground">{t(locale, "Ø£Ù‚Ø±Ø¨ Ø§Ù„Ø§Ø³ØªØ­Ù‚Ø§Ù‚Ø§Øª Ø§Ù„Ù‚Ø§Ø¯Ù…Ø©", "Next billing checkpoints")}</h3>
          {summary.upcoming.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
              {t(locale, "Ù„Ø§ ØªÙˆØ¬Ø¯ Ø§Ø³ØªØ­Ù‚Ø§Ù‚Ø§Øª Ù‚Ø§Ø¯Ù…Ø© Ø­Ø§Ù„ÙŠØ§Ù‹", "There are no upcoming billing checkpoints right now")}
            </div>
          ) : (
            <div className="space-y-3">
              {summary.upcoming.map((payment) => {
                const displayStatus = getPaymentDisplayState(payment);
                return (
                  <Link key={payment.id} href={`/payments/${payment.id}`} className="block rounded-2xl border border-border p-3 transition-colors hover:bg-muted/40">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="font-semibold text-foreground">{payment.studentName}</p>
                        <p className="text-xs text-muted-foreground">{getBillingCycleText(payment, locale)}</p>
                      </div>
                      <span className="text-sm font-bold text-foreground">{formatCurrencyEgp(payment.amount, locale)}</span>
                    </div>
                    <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
                      <span>{formatDate(getPaymentEffectiveDueDate(payment), locale)}</span>
                      <span>{getDisplayStatusLabel(displayStatus, locale)}</span>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function MetricCard({ label, value, colorClass }: { label: string; value: string; colorClass: string }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={cn("mt-2 text-2xl font-bold", colorClass)}>{value}</p>
    </div>
  );
}

function StatusMiniCard({ label, count, status }: { label: string; count: number; status: DisplayStatus }) {
  const meta = PAYMENT_STATUS_META[status];
  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <span className="inline-flex rounded-full px-2.5 py-1 text-xs font-semibold" style={{ backgroundColor: meta.bg, color: meta.color }}>
        {label}
      </span>
      <p className="mt-3 text-2xl font-bold text-foreground">{count}</p>
    </div>
  );
}
```

### FILE: src\app\(dashboard)\payments\invoice\[id]\page.tsx
```tsx
```

### FILE: src\app\(dashboard)\payments\new\page.tsx
```tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, ReceiptText, TriangleAlert } from "lucide-react";
import { toast } from "sonner";

import { PageStateCard } from "@/components/shared/page-state";
import { canManagePaymentsForUser } from "@/config/roles";
import { useCurrentUser } from "@/providers/user-provider";
import { createPayment } from "@/services/payments.service";
import { listStudents } from "@/services/students.service";
import { useUIStore } from "@/stores/ui-store";
import type { PaymentMethod, PaymentStatus } from "@/types/common.types";
import type { StudentListItem } from "@/types/crm";
import { t } from "@/lib/locale";
import { cn } from "@/lib/utils";

const STATUS_OPTIONS: PaymentStatus[] = ["pending", "paid", "partial", "overdue"];
const METHOD_OPTIONS: Array<PaymentMethod | ""> = ["", "instapay", "bank_transfer", "wallet", "cash", "card"];

function normalizeSessionBlock(value: string): number {
  const parsed = Number(value || 4);
  if (!Number.isFinite(parsed)) return 4;
  return Math.max(4, Math.ceil(parsed / 4) * 4);
}

export default function NewPaymentPage() {
  const locale = useUIStore((state) => state.locale);
  const isAr = locale === "ar";
  const user = useCurrentUser();
  const canManage = canManagePaymentsForUser(user);
  const router = useRouter();
  const [students, setStudents] = useState<StudentListItem[]>([]);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    studentId: "",
    amount: "1200",
    status: "pending" as PaymentStatus,
    method: "" as PaymentMethod | "",
    dueDate: new Date().toISOString().slice(0, 10),
    blockStartDate: new Date().toISOString().slice(0, 10),
    blockEndDate: "",
    deferredUntil: "",
    notes: "",
    sessionsCovered: "4",
  });

  useEffect(() => {
    listStudents().then(setStudents);
  }, []);

  const selectedStudent = useMemo(
    () => students.find((student) => student.id === form.studentId) ?? null,
    [students, form.studentId],
  );
  const normalizedSessions = useMemo(() => normalizeSessionBlock(form.sessionsCovered), [form.sessionsCovered]);
  const amountNumber = Number(form.amount || 0);
  const hasRoundedSessions = normalizedSessions !== Number(form.sessionsCovered || 0);

  if (!canManage) {
    return (
      <PageStateCard
        variant="danger"
        titleAr="Ù„Ø§ ØªÙ…Ù„Ùƒ ØµÙ„Ø§Ø­ÙŠØ© Ø¥Ø¯Ø§Ø±Ø© Ø§Ù„Ù…Ø¯ÙÙˆØ¹Ø§Øª"
        titleEn="You cannot manage payments"
        descriptionAr="Ø¥Ø¯Ø§Ø±Ø© Ø§Ù„Ù…Ø¯ÙÙˆØ¹Ø§Øª Ù…Ø­ØµÙˆØ±Ø© Ø¹Ù„Ù‰ Ø§Ù„Ø£Ø¯ÙˆØ§Ø± Ø§Ù„Ù…Ø®ÙˆÙ„Ø© ÙÙ‚Ø· Ø¯Ø§Ø®Ù„ Ø§Ù„ÙØ±ÙŠÙ‚ Ø§Ù„Ù…Ø§Ù„ÙŠ. ÙŠÙ…ÙƒÙ†Ùƒ Ù…Ø´Ø§Ù‡Ø¯Ø© Ø§Ù„Ø³Ø¬Ù„Ø§Øª Ù„ÙƒÙ† Ù„Ø§ ÙŠÙ…ÙƒÙ†Ùƒ Ø¥Ù†Ø´Ø§Ø¡ Ø¯ÙØ¹Ø© Ø¬Ø¯ÙŠØ¯Ø©."
        descriptionEn="Payment management is restricted to the approved finance users. You can review records but cannot create a new payment."
        actionHref="/payments"
        actionLabelAr="Ø§Ù„Ø¹ÙˆØ¯Ø© Ø¥Ù„Ù‰ Ø§Ù„Ù…Ø¯ÙÙˆØ¹Ø§Øª"
        actionLabelEn="Back to payments"
      />
    );
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!form.studentId) {
      toast.error(t(locale, "Ø§Ø®ØªØ± Ø§Ù„Ø·Ø§Ù„Ø¨ Ø£ÙˆÙ„Ø§Ù‹", "Choose a student first"));
      return;
    }

    if (!Number.isFinite(amountNumber) || amountNumber <= 0) {
      toast.error(t(locale, "Ø£Ø¯Ø®Ù„ Ù…Ø¨Ù„ØºÙ‹Ø§ ØµØ­ÙŠØ­Ù‹Ø§ Ø£ÙƒØ¨Ø± Ù…Ù† ØµÙØ±", "Enter a valid amount greater than zero"));
      return;
    }

    setSaving(true);
    try {
      const created = await createPayment({
        studentId: form.studentId,
        amount: amountNumber,
        status: form.status,
        method: form.method || null,
        dueDate: form.dueDate,
        sessionsCovered: normalizedSessions,
        blockStartDate: form.blockStartDate || null,
        blockEndDate: form.blockEndDate || null,
        deferredUntil: form.deferredUntil || null,
        notes: form.notes || null,
      });
      toast.success(t(locale, "ØªÙ… Ø¥Ù†Ø´Ø§Ø¡ Ø§Ù„Ø¯ÙØ¹Ø© Ø¨Ù†Ø¬Ø§Ø­", "Payment created successfully"));
      router.push(`/payments/${created.id}`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t(locale, "ØªØ¹Ø°Ø± Ø¥Ù†Ø´Ø§Ø¡ Ø§Ù„Ø¯ÙØ¹Ø©", "Could not create payment"));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <button onClick={() => router.push("/payments")} className="rounded-xl p-2 text-muted-foreground transition-colors hover:bg-muted">
          {isAr ? <ArrowRight size={20} /> : <ArrowLeft size={20} />}
        </button>
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold text-foreground"><ReceiptText size={24} className="text-brand-600" />{t(locale, "Ø¥Ø¶Ø§ÙØ© Ø¯ÙØ¹Ø© Ø¬Ø¯ÙŠØ¯Ø©", "Add new payment")}</h1>
          <p className="text-sm text-muted-foreground">{t(locale, "Ø§Ù„ÙØ§ØªÙˆØ±Ø© Ø§Ù„Ø§ÙØªØ±Ø§Ø¶ÙŠØ© ØªØºØ·ÙŠ 4 Ø¬Ù„Ø³Ø§Øª. Ø¥Ø°Ø§ Ø£Ø¯Ø®Ù„Øª 5 Ø£Ùˆ 6 Ø¬Ù„Ø³Ø§Øª ÙØ³ÙŠØªÙ… ØªÙ‚Ø±ÙŠØ¨Ù‡Ø§ ØªÙ„Ù‚Ø§Ø¦ÙŠÙ‹Ø§ Ø¥Ù„Ù‰ Ø£Ù‚Ø±Ø¨ Ù…Ø¶Ø§Ø¹Ù Ù„Ù€ 4 Ø­ØªÙ‰ ÙŠØ¨Ù‚Ù‰ Ù…Ù†Ø·Ù‚ Ø§Ù„ÙÙˆØªØ±Ø© Ø«Ø§Ø¨ØªÙ‹Ø§ ÙˆÙˆØ§Ø¶Ø­Ù‹Ø§.", "The default invoice covers 4 sessions. If you enter 5 or 6 sessions, it will be rounded up to the nearest multiple of 4 so the billing logic stays consistent and clear.")}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-5 rounded-2xl border border-border bg-card p-5">
          <Field label={t(locale, "Ø§Ù„Ø·Ø§Ù„Ø¨", "Student")}>
            <select value={form.studentId} onChange={(event) => setForm((prev) => ({ ...prev, studentId: event.target.value }))} className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm text-foreground">
              <option value="">{t(locale, "Ø§Ø®ØªØ± Ø§Ù„Ø·Ø§Ù„Ø¨", "Choose student")}</option>
              {students.map((student) => (
                <option key={student.id} value={student.id}>{student.fullName}</option>
              ))}
            </select>
          </Field>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label={t(locale, "Ø§Ù„Ù…Ø¨Ù„Øº", "Amount")}>
              <input type="number" min="1" value={form.amount} onChange={(event) => setForm((prev) => ({ ...prev, amount: event.target.value }))} className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm text-foreground" />
            </Field>
            <Field label={t(locale, "Ø¹Ø¯Ø¯ Ø§Ù„Ø¬Ù„Ø³Ø§Øª", "Sessions covered")}>
              <input type="number" min="4" step="1" value={form.sessionsCovered} onChange={(event) => setForm((prev) => ({ ...prev, sessionsCovered: event.target.value }))} className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm text-foreground" />
            </Field>
          </div>

          {hasRoundedSessions ? (
            <div className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-100">
              <TriangleAlert size={18} className="mt-0.5 shrink-0" />
              <p>
                {t(locale, `Ø³ÙŠØªÙ… Ø¥ØµØ¯Ø§Ø± Ø§Ù„ÙØ§ØªÙˆØ±Ø© Ø¹Ù„Ù‰ ${normalizedSessions} Ø¬Ù„Ø³Ø§Øª Ø¨Ø¯Ù„ ${form.sessionsCovered} Ù„Ø£Ù† Ø¯ÙˆØ±Ø© Ø§Ù„ÙÙˆØªØ±Ø© Ù…Ø¹ØªÙ…Ø¯Ø© Ø¹Ù„Ù‰ Ù…Ø¶Ø§Ø¹ÙØ§Øª 4 Ø¬Ù„Ø³Ø§Øª.`, `The invoice will be issued for ${normalizedSessions} sessions instead of ${form.sessionsCovered}, because the billing cycle is locked to multiples of 4 sessions.`)}
              </p>
            </div>
          ) : null}

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label={t(locale, "Ø§Ù„Ø­Ø§Ù„Ø©", "Status")}>
              <select value={form.status} onChange={(event) => setForm((prev) => ({ ...prev, status: event.target.value as PaymentStatus }))} className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm text-foreground">
                {STATUS_OPTIONS.map((status) => (<option key={status} value={status}>{status}</option>))}
              </select>
            </Field>
            <Field label={t(locale, "Ø·Ø±ÙŠÙ‚Ø© Ø§Ù„Ø¯ÙØ¹", "Payment method")}>
              <select value={form.method} onChange={(event) => setForm((prev) => ({ ...prev, method: event.target.value as PaymentMethod | "" }))} className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm text-foreground">
                <option value="">{t(locale, "Ù„Ø§Ø­Ù‚Ù‹Ø§", "Later")}</option>
                {METHOD_OPTIONS.filter(Boolean).map((method) => (<option key={method} value={method}>{method}</option>))}
              </select>
            </Field>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Field label={t(locale, "Ø¨Ø¯Ø§ÙŠØ© Ø§Ù„Ø¨Ø§Ù‚Ø©", "Block start")}>
              <input type="date" value={form.blockStartDate} onChange={(event) => setForm((prev) => ({ ...prev, blockStartDate: event.target.value }))} className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm text-foreground" />
            </Field>
            <Field label={t(locale, "Ù†Ù‡Ø§ÙŠØ© Ø§Ù„Ø¨Ø§Ù‚Ø©", "Block end")}>
              <input type="date" value={form.blockEndDate} onChange={(event) => setForm((prev) => ({ ...prev, blockEndDate: event.target.value }))} className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm text-foreground" />
            </Field>
            <Field label={t(locale, "ØªØ§Ø±ÙŠØ® Ø§Ù„Ø§Ø³ØªØ­Ù‚Ø§Ù‚", "Due date")}>
              <input type="date" value={form.dueDate} onChange={(event) => setForm((prev) => ({ ...prev, dueDate: event.target.value }))} className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm text-foreground" />
            </Field>
          </div>

          <Field label={t(locale, "ØªØ£Ø¬ÙŠÙ„ Ø§Ù„Ø¯ÙØ¹ Ø­ØªÙ‰", "Deferred until")}>
            <input type="date" value={form.deferredUntil} onChange={(event) => setForm((prev) => ({ ...prev, deferredUntil: event.target.value }))} className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm text-foreground" />
          </Field>

          <Field label={t(locale, "Ù…Ù„Ø§Ø­Ø¸Ø©", "Note")}>
            <textarea value={form.notes} onChange={(event) => setForm((prev) => ({ ...prev, notes: event.target.value }))} rows={4} className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm text-foreground" placeholder={t(locale, "Ù…Ø«Ø§Ù„: Ø§ØªÙÙ‚Ù†Ø§ Ø£Ù† ÙŠØªÙ… Ø§Ù„Ø³Ø¯Ø§Ø¯ Ø¨Ø¹Ø¯ Ø§Ù†ØªÙ‡Ø§Ø¡ Ø§Ù„Ø£Ø±Ø¨Ø¹ Ø¬Ù„Ø³Ø§Øª", "Example: the parent will pay after the four sessions are completed")} />
          </Field>
        </div>

        <div className="space-y-5 rounded-2xl border border-border bg-card p-5">
          <h2 className="text-lg font-bold text-foreground">{t(locale, "Ù…Ù„Ø®Øµ Ø³Ø±ÙŠØ¹", "Quick summary")}</h2>
          <SummaryRow label={t(locale, "Ø§Ù„Ø·Ø§Ù„Ø¨", "Student")} value={selectedStudent?.fullName ?? "â€”"} />
          <SummaryRow label={t(locale, "ÙˆÙ„ÙŠ Ø§Ù„Ø£Ù…Ø±", "Parent")} value={selectedStudent?.parentName ?? "â€”"} />
          <SummaryRow label={t(locale, "Ø§Ù„ÙÙˆØªØ±Ø©", "Billing")} value={t(locale, `Ø¨Ø§Ù‚Ø© ${normalizedSessions} Ø¬Ù„Ø³Ø§Øª`, `${normalizedSessions}-session block`)} />
          <SummaryRow label={t(locale, "Ø§Ù„Ù…Ø¨Ù„Øº", "Amount")} value={form.amount ? `${form.amount} ${isAr ? "Ø¬.Ù…" : "EGP"}` : "â€”"} />
          <SummaryRow label={t(locale, "Ø§Ù„Ø§Ø³ØªØ­Ù‚Ø§Ù‚", "Due date")} value={form.dueDate || "â€”"} />
          <SummaryRow label={t(locale, "Ø§Ù„ØªØ£Ø¬ÙŠÙ„", "Deferred until")} value={form.deferredUntil || t(locale, "Ø¨Ø¯ÙˆÙ† ØªØ£Ø¬ÙŠÙ„", "No deferment")} />

          <button type="submit" disabled={saving} className={cn("w-full rounded-xl bg-brand-700 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-brand-600", saving && "opacity-70")}>{saving ? t(locale, "Ø¬Ø§Ø±Ù Ø§Ù„Ø¥Ù†Ø´Ø§Ø¡...", "Creating...") : t(locale, "Ø¥Ù†Ø´Ø§Ø¡ Ø§Ù„Ø¯ÙØ¹Ø© ÙˆØ¥ØµØ¯Ø§Ø± ÙØ§ØªÙˆØ±Ø©", "Create payment & issue invoice")}</button>
        </div>
      </form>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block space-y-2">
      <span className="text-sm font-semibold text-foreground">{label}</span>
      {children}
    </label>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-border py-2 last:border-0">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-sm font-medium text-foreground">{value}</span>
    </div>
  );
}
```

### FILE: src\app\(dashboard)\payments\[id]\page.tsx
```tsx
```

### FILE: src\app\(dashboard)\payments\[id]\invoice\page.tsx
```tsx
```

### FILE: src\app\(dashboard)\reports\page.tsx
```tsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowDownRight,
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  BarChart3,
  Clock,
  Target,
  TrendingUp,
  Users,
  Wallet,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { getConversionTerm, t } from "@/lib/locale";
import { getLocalizedFunnelStage, getLocalizedLossReason, getReportsData } from "@/services/reports.service";
import { useUIStore } from "@/stores/ui-store";
import type { ReportsData } from "@/types/crm";

const KPI_ICON_MAP = {
  target: Target,
  wallet: Wallet,
  users: Users,
  clock: Clock,
} as const;

const TONE_STYLES = {
  brand: { bg: "#EEF2FF", color: "#4338CA", border: "#C7D2FE" },
  success: { bg: "#ECFDF5", color: "#059669", border: "#A7F3D0" },
  warning: { bg: "#FFFBEB", color: "#D97706", border: "#FCD34D" },
  danger: { bg: "#FEF2F2", color: "#DC2626", border: "#FCA5A5" },
  info: { bg: "#EFF6FF", color: "#2563EB", border: "#BFDBFE" },
} as const;

export default function ReportsPage() {
  const locale = useUIStore((state) => state.locale);
  const isAr = locale === "ar";
  const [data, setData] = useState<ReportsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    async function load() {
      setLoading(true);
      const reports = await getReportsData(locale);
      if (isMounted) {
        setData(reports);
        setLoading(false);
      }
    }
    load();
    return () => {
      isMounted = false;
    };
  }, [locale]);

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-border bg-card p-6">
        <h1 className="flex items-center gap-2 text-2xl font-bold text-foreground">
          <BarChart3 size={28} className="text-brand-600" />
          {t(locale, "Ø§Ù„ØªÙ‚Ø§Ø±ÙŠØ±", "Reports")}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {t(locale, "Ù‚Ø±Ø§Ø¡Ø© ØªÙ†ÙÙŠØ°ÙŠØ© Ù„Ù…Ø¹Ø¯Ù„ Ø§Ù„Ø§Ø´ØªØ±Ø§ÙƒØŒ Ø§Ù„Ù‚Ù…Ø¹ Ø§Ù„Ø¨ÙŠØ¹ÙŠØŒ Ø§Ù„ØªØ­ØµÙŠÙ„ØŒ ÙˆØ³Ø±Ø¹Ø© Ø§Ù„ØªØ´ØºÙŠÙ„", "Executive view of enrollment rate, funnel, collections, and operating velocity")}
        </p>
      </div>

      {loading || !data ? (
        <div className="rounded-2xl border border-border bg-card p-12 text-center text-muted-foreground">
          {t(locale, "Ø¬Ø§Ø±Ù ØªØ¬Ù‡ÙŠØ² Ø§Ù„ØªÙ‚Ø±ÙŠØ±...", "Preparing report...")}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
            {data.kpis.map((kpi) => {
              const Icon = KPI_ICON_MAP[kpi.icon];
              return (
                <div key={kpi.label} className="rounded-2xl border border-border bg-card p-4">
                  <div className="mb-3 flex items-center justify-between">
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-brand-50 text-brand-700 dark:bg-brand-950 dark:text-brand-300">
                      <Icon size={20} />
                    </div>
                    <span className={cn("flex items-center gap-0.5 text-xs font-semibold", kpi.up ? "text-success-600" : "text-danger-600")}>
                      {kpi.up ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                      {kpi.change}
                    </span>
                  </div>
                  <p className="text-2xl font-bold text-foreground">{kpi.value}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{kpi.label}</p>
                </div>
              );
            })}
          </div>

          <div className="grid grid-cols-1 gap-4 xl:grid-cols-4">
            <SummaryCard title={t(locale, "Ù†Ø³Ø¨Ø© Ø§Ù„ØªØ­ØµÙŠÙ„", "Collection rate")} value={`${data.collection.rate}%`} subtitle={t(locale, "Ù…Ù† Ø§Ù„Ø¥Ø¬Ù…Ø§Ù„ÙŠ Ø§Ù„Ù…ØªÙˆÙ‚Ø¹ Ù„Ù‡Ø°Ø§ Ø§Ù„Ø´Ù‡Ø±", "From this month expected total")} tone={data.collection.rate >= 80 ? "success" : data.collection.rate >= 60 ? "warning" : "danger"} />
            <SummaryCard title={t(locale, "Ø§Ù„Ù…Ø­ØµÙ„", "Collected")} value={formatMoney(data.collection.collected, locale)} subtitle={t(locale, "Ø¯Ø®Ù„ ÙØ¹Ù„ÙŠ Ù…Ø³Ø¬Ù„", "Recorded actual cash in")} tone="success" />
            <SummaryCard title={t(locale, "Ø§Ù„Ù…ØªØ£Ø®Ø±", "Overdue")} value={formatMoney(data.collection.overdue, locale)} subtitle={t(locale, "ÙŠØ­ØªØ§Ø¬ ØªØ­ØµÙŠÙ„ Ø¹Ø§Ø¬Ù„", "Needs urgent collection")} tone={data.collection.overdue > 0 ? "danger" : "info"} />
            <SummaryCard title={t(locale, "Ø§Ù„Ù…ØªÙˆÙ‚Ø¹", "Expected")} value={formatMoney(data.collection.expected, locale)} subtitle={t(locale, "Ø¥Ø¬Ù…Ø§Ù„ÙŠ Ø§Ù„ÙÙˆØ§ØªÙŠØ± Ø§Ù„Ø­Ø§Ù„ÙŠØ©", "Current billing total")} tone="brand" />
          </div>

          <div className="grid grid-cols-1 gap-6 xl:grid-cols-[0.95fr_1.05fr]">
            <div className="space-y-6">
              <div className="rounded-2xl border border-border bg-card p-5">
                <h3 className="mb-4 font-bold text-foreground">{t(locale, "Ù‚Ù…Ø¹ Ø§Ù„Ù…Ø¨ÙŠØ¹Ø§Øª", "Sales funnel")}</h3>
                <div className="space-y-4">
                  {data.funnel.map((item) => {
                    const base = Math.max(1, data.funnel[0]?.count || 1);
                    return (
                      <div key={item.stage} className="space-y-2">
                        <div className="flex items-center justify-between gap-3 text-sm">
                          <span className="font-medium text-foreground">{getLocalizedFunnelStage(item.stage, locale)}</span>
                          <span className="text-muted-foreground">{item.count}</span>
                        </div>
                        <div className="h-3 overflow-hidden rounded-full bg-muted/60">
                          <div className="h-full rounded-full transition-all" style={{ width: `${(item.count / base) * 100}%`, backgroundColor: item.color }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="rounded-2xl border border-border bg-card p-5">
                <div className="mb-4 flex items-center gap-2 text-foreground">
                  <TrendingUp size={18} className="text-brand-600" />
                  <h3 className="font-bold">{t(locale, "Ø³Ø±Ø¹Ø© Ø§Ù„Ù…Ø±Ø§Ø­Ù„", "Stage velocity")}</h3>
                </div>
                {data.stageVelocity.length === 0 ? (
                  <EmptyBlock label={t(locale, "Ù„Ø§ ØªÙˆØ¬Ø¯ Ø¨ÙŠØ§Ù†Ø§Øª ÙƒØ§ÙÙŠØ© Ù„Ø­Ø³Ø§Ø¨ Ø³Ø±Ø¹Ø© Ø§Ù„Ù…Ø±Ø§Ø­Ù„", "Not enough data to calculate stage velocity")} />
                ) : (
                  <div className="space-y-3">
                    {data.stageVelocity.map((item) => (
                      <div key={item.stage} className="flex items-center justify-between gap-3 rounded-2xl border border-border bg-background p-4">
                        <div>
                          <p className="font-semibold text-foreground">{getLocalizedFunnelStage(item.stage, locale)}</p>
                          <p className="text-xs text-muted-foreground">{t(locale, "Ù…ØªÙˆØ³Ø· Ø²Ù…Ù† Ø§Ù„Ø¨Ù‚Ø§Ø¡ ÙÙŠ Ù‡Ø°Ù‡ Ø§Ù„Ù…Ø±Ø­Ù„Ø©", "Average time spent in this stage")}</p>
                        </div>
                        <div className="text-left">
                          <p className="text-xl font-bold text-foreground">{item.days}</p>
                          <p className="text-xs text-muted-foreground">{t(locale, "ÙŠÙˆÙ…", "days")}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-6">
              <div className="rounded-2xl border border-border bg-card p-5">
                <h3 className="mb-4 font-bold text-foreground">{t(locale, "Ø£Ø³Ø¨Ø§Ø¨ Ø¹Ø¯Ù… Ø§Ù„Ø§Ø´ØªØ±Ø§Ùƒ", "Loss reasons")}</h3>
                <div className="space-y-3">
                  {data.lossReasons.map((item) => (
                    <div key={item.key} className="flex items-center gap-3">
                      <span className="w-40 shrink-0 text-xs text-foreground">{getLocalizedLossReason(item.key, locale)}</span>
                      <div className="h-6 flex-1 overflow-hidden rounded-lg bg-muted/50">
                        <div className="h-full rounded-lg bg-danger-400" style={{ width: `${item.pct}%` }} />
                      </div>
                      <span className="w-10 text-left text-xs text-muted-foreground">{item.pct}%</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-2xl border border-border bg-card p-5">
                <h3 className="mb-4 font-bold text-foreground">{t(locale, "Ù…Ù„Ø®Øµ ØªØ´ØºÙŠÙ„ÙŠ", "Operational summary")}</h3>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {data.operationalSummary.map((item) => (
                    <SummaryCard key={item.title} title={item.title} value={item.value} subtitle={item.subtitle} tone={item.tone} />
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.05fr_0.95fr]">
            <div className="rounded-2xl border border-border bg-card p-5">
              <h3 className="mb-4 font-bold text-foreground">{t(locale, "Ø£Ø¯Ø§Ø¡ ÙØ±ÙŠÙ‚ Ø§Ù„Ù…Ø¨ÙŠØ¹Ø§Øª", "Sales team performance")}</h3>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[640px] text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className={cn("px-4 py-2 font-semibold text-muted-foreground", isAr ? "text-right" : "text-left")}>{t(locale, "Ø§Ù„Ø§Ø³Ù…", "Name")}</th>
                      <th className={cn("px-4 py-2 font-semibold text-muted-foreground", isAr ? "text-right" : "text-left")}>{t(locale, "Ø§Ù„Ø¹Ù…Ù„Ø§Ø¡", "Leads")}</th>
                      <th className={cn("px-4 py-2 font-semibold text-muted-foreground", isAr ? "text-right" : "text-left")}>{getConversionTerm("successfulConversion", locale)}</th>
                      <th className={cn("px-4 py-2 font-semibold text-muted-foreground", isAr ? "text-right" : "text-left")}>{getConversionTerm("conversionRate", locale)}</th>
                      <th className={cn("px-4 py-2 font-semibold text-muted-foreground", isAr ? "text-right" : "text-left")}>{t(locale, "Ø§Ù„Ø¥ÙŠØ±Ø§Ø¯", "Revenue")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.salesPerformance.map((item) => (
                      <tr key={item.name} className="border-b border-border last:border-0">
                        <td className="px-4 py-3 font-semibold text-foreground">{item.name}</td>
                        <td className="px-4 py-3 text-foreground">{item.leads}</td>
                        <td className="px-4 py-3 font-bold text-success-600">{item.won}</td>
                        <td className="px-4 py-3 text-foreground">{item.rate}</td>
                        <td className="px-4 py-3 font-bold text-foreground">{locale === "ar" ? item.revenue.toLocaleString("ar-EG") : item.revenue.toLocaleString("en-US")} {t(locale, "Ø¬.Ù…", "EGP")}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="rounded-2xl border border-border bg-card p-5">
              <div className="mb-4 flex items-center gap-2 text-foreground">
                <Target size={18} className="text-brand-600" />
                <h3 className="font-bold">{t(locale, "ØªÙˆØµÙŠØ§Øª Ø§Ù„ØªÙ†ÙÙŠØ° Ø§Ù„ØªØ§Ù„ÙŠØ©", "Recommended next moves")}</h3>
              </div>
              {data.recommendations.length === 0 ? (
                <EmptyBlock label={t(locale, "Ù„Ø§ ØªÙˆØ¬Ø¯ ØªÙˆØµÙŠØ§Øª Ø¥Ø¶Ø§ÙÙŠØ© Ø§Ù„Ø¢Ù†", "There are no extra recommendations right now")} />
              ) : (
                <div className="space-y-3">
                  {data.recommendations.map((item) => {
                    const tone = item.priority === "high" ? "danger" : item.priority === "medium" ? "warning" : "brand";
                    const styles = TONE_STYLES[tone];
                    return (
                      <Link key={`${item.href}-${item.title}`} href={item.href} className="block rounded-2xl border p-4 transition-all hover:-translate-y-0.5 hover:shadow-sm" style={{ background: styles.bg, borderColor: styles.border }}>
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="font-semibold" style={{ color: styles.color }}>{item.title}</p>
                            <p className="mt-2 text-sm text-muted-foreground">{item.description}</p>
                          </div>
                          {isAr ? <ArrowLeft size={16} style={{ color: styles.color }} /> : <ArrowRight size={16} style={{ color: styles.color }} />}
                        </div>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function SummaryCard({ title, value, subtitle, tone }: { title: string; value: string; subtitle: string; tone: keyof typeof TONE_STYLES }) {
  const styles = TONE_STYLES[tone];
  return (
    <div className="rounded-2xl border p-4" style={{ background: styles.bg, borderColor: styles.border }}>
      <p className="text-xs font-semibold" style={{ color: styles.color }}>{title}</p>
      <p className="mt-2 text-2xl font-bold text-foreground">{value}</p>
      <p className="mt-2 text-xs text-muted-foreground">{subtitle}</p>
    </div>
  );
}

function EmptyBlock({ label }: { label: string }) {
  return <div className="rounded-2xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">{label}</div>;
}

function formatMoney(value: number, locale: "ar" | "en") {
  return `${locale === "ar" ? value.toLocaleString("ar-EG") : value.toLocaleString("en-US")} ${t(locale, "Ø¬.Ù…", "EGP")}`;
}
```

### FILE: src\app\(dashboard)\schedule\page.tsx
```tsx
"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, ArrowRight, CalendarDays, Clock, Plus, Search, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import { listScheduleSessions, getScheduleOverview } from "@/services/schedule.service";
import { useUIStore } from "@/stores/ui-store";
import { getCourseLabel, getDayLabel, t } from "@/lib/locale";
import type { CourseType } from "@/types/common.types";
import type { ScheduleSessionItem } from "@/types/crm";

const COURSE_COLORS = {
  scratch: { bg: "bg-brand-50", border: "border-brand-200", text: "text-brand-700" },
  python: { bg: "bg-emerald-50", border: "border-emerald-200", text: "text-emerald-700" },
  web: { bg: "bg-amber-50", border: "border-amber-200", text: "text-amber-700" },
  ai: { bg: "bg-purple-50", border: "border-purple-200", text: "text-purple-700" },
} as const;

export default function SchedulePage() {
  const locale = useUIStore((state) => state.locale);
  const isAr = locale === "ar";
  const [search, setSearch] = useState("");
  const [courseFilter, setCourseFilter] = useState<CourseType | "all">("all");
  const [sessions, setSessions] = useState<ScheduleSessionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [overview, setOverview] = useState({
    sessionsCount: 0,
    totalStudents: 0,
    uniqueTeachers: 0,
    busiestDay: 0,
    busiestDayCount: 0,
  });

  useEffect(() => {
    let isMounted = true;
    async function load() {
      setLoading(true);
      const [data, nextOverview] = await Promise.all([listScheduleSessions(), getScheduleOverview()]);
      if (isMounted) {
        setSessions(data);
        setOverview(nextOverview);
        setLoading(false);
      }
    }
    load();
    return () => {
      isMounted = false;
    };
  }, []);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return sessions.filter((session) => {
      const matchCourse = courseFilter === "all" || session.course === courseFilter;
      const matchSearch =
        !query ||
        session.className.toLowerCase().includes(query) ||
        session.teacher.toLowerCase().includes(query);
      return matchCourse && matchSearch;
    });
  }, [courseFilter, search, sessions]);

  const grouped = useMemo(() => {
    return Array.from({ length: 7 }, (_, dayIndex) => ({
      dayIndex,
      day: getDayLabel(dayIndex, locale),
      items: filtered
        .filter((session) => session.day === dayIndex)
        .sort((a, b) => a.startTime.localeCompare(b.startTime)),
    }));
  }, [filtered, locale]);

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-border bg-card p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
        <h1 className="flex items-center gap-2 text-2xl font-bold text-foreground">
          <CalendarDays size={28} className="text-brand-600" />
          {t(locale, "Ø§Ù„Ø¬Ø¯ÙˆÙ„", "Schedule")}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {t(locale, "Ø¹Ø±Ø¶ Ø£Ø³Ø¨ÙˆØ¹ÙŠ Ù„Ù„ÙƒÙ„Ø§Ø³Ø§ØªØŒ Ø§Ù„Ø£Ø­Ù…Ø§Ù„ØŒ ÙˆØ£Ù‡Ù… Ø§Ù„Ø¬Ù„Ø³Ø§Øª Ø§Ù„Ø¬Ø§Ø±ÙŠØ©", "Weekly view of classes, load, and ongoing sessions")}
        </p>
          </div>
          <Link href="/schedule/new" className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand-700 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-600">
            <Plus size={18} />
            {t(locale, "Ø¥Ø¶Ø§ÙØ© Ø­ØµØ© / Ø­Ø¯Ø«", "Add session / event")}
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        <MiniMetric label={t(locale, "Ø¹Ø¯Ø¯ Ø§Ù„Ø¬Ù„Ø³Ø§Øª", "Sessions")} value={overview.sessionsCount} />
        <MiniMetric label={t(locale, "Ø¥Ø¬Ù…Ø§Ù„ÙŠ Ø§Ù„Ù…Ù‚Ø§Ø¹Ø¯", "Total seats")} value={overview.totalStudents} />
        <MiniMetric label={t(locale, "Ø¹Ø¯Ø¯ Ø§Ù„Ù…Ø¯Ø±Ø³ÙŠÙ†", "Teachers")} value={overview.uniqueTeachers} />
        <MiniMetric label={t(locale, "Ø£ÙƒØ«Ø± ÙŠÙˆÙ… Ø§Ø²Ø¯Ø­Ø§Ù…Ù‹Ø§", "Busiest day")} value={`${getDayLabel(overview.busiestDay, locale)} â€¢ ${overview.busiestDayCount}`} />
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search size={18} className={cn("absolute top-1/2 -translate-y-1/2 text-muted-foreground", isAr ? "right-3" : "left-3")} />
          <input
            type="text"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder={t(locale, "Ø¨Ø­Ø« Ø¨Ø§Ø³Ù… Ø§Ù„ÙƒÙ„Ø§Ø³ Ø£Ùˆ Ø§Ù„Ù…Ø¯Ø±Ø³...", "Search by class or teacher...")}
            className={cn(
              "w-full rounded-xl border border-border bg-card py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-ring",
              isAr ? "pr-10 pl-4" : "pl-10 pr-4",
            )}
          />
        </div>
        <select
          value={courseFilter}
          onChange={(event) => setCourseFilter(event.target.value as CourseType | "all")}
          className="rounded-xl border border-border bg-card px-4 py-2.5 text-sm text-foreground"
        >
          <option value="all">{t(locale, "ÙƒÙ„ Ø§Ù„Ù…Ø³Ø§Ø±Ø§Øª", "All tracks")}</option>
          <option value="scratch">{getCourseLabel("scratch", locale)}</option>
          <option value="python">{getCourseLabel("python", locale)}</option>
          <option value="web">{getCourseLabel("web", locale)}</option>
          <option value="ai">{getCourseLabel("ai", locale)}</option>
        </select>
      </div>

      {loading ? (
        <div className="rounded-2xl border border-border bg-card p-12 text-center text-muted-foreground">
          {t(locale, "Ø¬Ø§Ø±Ù ØªØ­Ù…ÙŠÙ„ Ø§Ù„Ø¬Ø¯ÙˆÙ„...", "Loading schedule...")}
        </div>
      ) : (
        <>
          <div className="hidden gap-3 xl:grid xl:grid-cols-7">
            {grouped.map(({ day, items }) => (
              <div key={day} className="rounded-2xl border border-border bg-card p-2.5">
                <div className="mb-2 border-b border-border pb-2 text-center text-sm font-bold text-foreground">{day}</div>
                <div className="space-y-2">
                  {items.length === 0 ? (
                    <EmptyDay label={t(locale, "Ù„Ø§ ØªÙˆØ¬Ø¯ Ø¬Ù„Ø³Ø§Øª", "No sessions")} />
                  ) : (
                    items.map((session) => {
                      const colors = COURSE_COLORS[session.course];
                      return (
                        <Link key={session.id} href={`/schedule/${session.id}`} className={cn("block rounded-xl border p-2.5 transition-all hover:-translate-y-0.5 hover:shadow-sm", colors.bg, colors.border)}>
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <p className={cn("text-[13px] font-bold leading-5", colors.text)}>{session.className}</p>
                              <p className="mt-1 text-[10px] text-muted-foreground">{getCourseLabel(session.course, locale)}</p>
                            </div>
                            <span className="rounded-lg bg-white/70 px-2 py-1 text-[10px] text-muted-foreground dark:bg-black/20">{session.startTime}</span>
                          </div>
                          <div className="mt-2 space-y-1 text-[10px] text-muted-foreground">
                            <div className="flex items-center gap-1.5"><Clock size={12} />{session.startTime} â€” {session.endTime}</div>
                            <div className="flex items-center gap-1.5"><Users size={12} />{session.teacher} â€¢ {session.students} {t(locale, "Ø·Ù„Ø§Ø¨", "students")}</div>
                          </div>
                        </Link>
                      );
                    })
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="space-y-5 xl:hidden">
            {grouped.map(({ day, items }) => (
              <div key={day} className="space-y-2">
                <p className="text-sm font-bold text-foreground">{day}</p>
                {items.length === 0 ? (
                  <EmptyDay label={t(locale, "Ù„Ø§ ØªÙˆØ¬Ø¯ Ø¬Ù„Ø³Ø§Øª", "No sessions")} />
                ) : (
                  items.map((session) => {
                    const colors = COURSE_COLORS[session.course];
                    return (
                      <Link key={session.id} href={`/schedule/${session.id}`} className={cn("block rounded-xl border p-3 transition-colors hover:bg-muted/20", colors.bg, colors.border)}>
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <p className={cn("text-sm font-bold", colors.text)}>{session.className}</p>
                            <p className="text-xs text-muted-foreground">{session.teacher} â€” {session.students} {t(locale, "Ø·Ù„Ø§Ø¨", "students")}</p>
                          </div>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <span>{session.startTime}</span>
                            {isAr ? <ArrowLeft size={12} /> : <ArrowRight size={12} />}
                          </div>
                        </div>
                      </Link>
                    );
                  })
                )}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function MiniMetric({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-2 text-2xl font-bold text-foreground">{value}</p>
    </div>
  );
}

function EmptyDay({ label }: { label: string }) {
  return <div className="rounded-xl border border-dashed border-border p-4 text-center text-xs text-muted-foreground">{label}</div>;
}
```

### FILE: src\app\(dashboard)\schedule\new\page.tsx
```tsx
"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { ScheduleEntryForm } from "@/components/schedule/schedule-entry-form";
import { createScheduleEntry } from "@/services/schedule.service";
import type { CourseType } from "@/types/common.types";

export default function NewScheduleEntryPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  return (
    <ScheduleEntryForm
      title="Ø¥Ø¶Ø§ÙØ© Ø­ØµØ© / Ø­Ø¯Ø«"
      description="Ø£Ù†Ø´Ø¦ Ø­ØµØ© Ø¬Ø¯ÙŠØ¯Ø© ÙˆØ§Ø±Ø¨Ø·Ù‡Ø§ Ø¨Ø§Ù„Ù…Ø¯Ø±Ø³ ÙˆØ§Ù„Ù…Ø³Ø§Ø± ÙˆØ§Ù„ÙŠÙˆÙ… Ø­ØªÙ‰ ØªØ¸Ù‡Ø± Ù…Ø¨Ø§Ø´Ø±Ø© Ø¯Ø§Ø®Ù„ Ø§Ù„Ø¬Ø¯ÙˆÙ„"
      submitLabel="Ø­ÙØ¸ Ø§Ù„Ø­ØµØ©"
      successMessage="ØªÙ…Øª Ø¥Ø¶Ø§ÙØ© Ø§Ù„Ø­ØµØ© Ø¥Ù„Ù‰ Ø§Ù„Ø¬Ø¯ÙˆÙ„"
      initialValues={{
        className: searchParams.get("className") ?? "",
        teacherId: searchParams.get("teacherId") ?? "",
        course: (searchParams.get("course") as CourseType | null) ?? undefined,
      }}
      onSubmit={async (payload) => {
        const created = await createScheduleEntry(payload);
        router.push(`/schedule/${created.id}`);
      }}
      cancelHref="/schedule"
    />
  );
}
```

### FILE: src\app\(dashboard)\schedule\[id]\page.tsx
```tsx
```

### FILE: src\app\(dashboard)\settings\page.tsx
```tsx
"use client";

import { useMemo, useRef, useState, type ChangeEvent, type ReactNode } from "react";
import {
  Bell,
  Database,
  Download,
  Eye,
  EyeOff,
  KeyRound,
  Languages,
  MoonStar,
  Palette,
  RotateCcw,
  Save,
  Settings,
  ShieldCheck,
  Trash2,
  Upload,
  User,
} from "lucide-react";
import { useTheme } from "next-themes";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { useUIStore } from "@/stores/ui-store";
import { t } from "@/lib/locale";
import {
  clearStorageByPrefix,
  CRM_STORAGE_PREFIX,
  exportStorageSnapshot,
  getStorageEntriesByPrefix,
  importStorageSnapshot,
  parseStorageSnapshot,
} from "@/services/storage";

export default function SettingsPage() {
  const { theme, setTheme } = useTheme();
  const { locale, setLocale, sidebarOpen, setSidebarOpen } = useUIStore();
  const [notifications, setNotifications] = useState({ email: true, whatsapp: true, browser: false });
  const [profile, setProfile] = useState({ name: "Abdelrahman", email: "admin@skidyrein.com" });
  const [passwordForm, setPasswordForm] = useState({ next: "", confirm: "" });
  const [showPassword, setShowPassword] = useState({ next: false, confirm: false });
  const [busy, setBusy] = useState<null | "save" | "reset" | "clear" | "export" | "import" | "password">(null);
  const backupInputRef = useRef<HTMLInputElement | null>(null);
  const supabase = useMemo(() => createClient(), []);

  const previewText = useMemo(
    () => ({
      title: t(locale, "Ù…Ø¹Ø§ÙŠÙ†Ø© Ø³Ø±ÙŠØ¹Ø©", "Quick preview"),
      body: t(
        locale,
        "Ù‡Ø°Ù‡ Ø§Ù„ØªÙØ¶ÙŠÙ„Ø§Øª ØªÙØ·Ø¨Ù‘ÙŽÙ‚ Ù…Ø­Ù„ÙŠÙ‹Ø§ Ø¯Ø§Ø®Ù„ Ø§Ù„Ù…ØªØµÙØ­ Ø§Ù„Ø­Ø§Ù„ÙŠØŒ ÙˆÙ‡ÙŠ Ù…Ù†Ø§Ø³Ø¨Ø© Ø¬Ø¯Ù‹Ø§ Ù„Ù†Ø³Ø®Ø© Ø§Ù„ØªØ´ØºÙŠÙ„ Ø§Ù„Ø¯Ø§Ø®Ù„ÙŠ ÙˆØ§Ù„Ù€ demo.",
        "These preferences are applied locally in the current browser and work well for the internal and demo build.",
      ),
    }),
    [locale],
  );

  const localDataCount = useMemo(() => getStorageEntriesByPrefix(CRM_STORAGE_PREFIX).length, []);

  const passwordChecks = useMemo(() => ({
    length: passwordForm.next.length >= 8,
    letter: /[A-Za-z]/.test(passwordForm.next),
    number: /\d/.test(passwordForm.next),
    match: passwordForm.next.length > 0 && passwordForm.next === passwordForm.confirm,
  }), [passwordForm]);

  const handleChangePassword = async () => {
    if (!passwordChecks.length || !passwordChecks.letter || !passwordChecks.number) {
      toast.error(
        t(
          locale,
          "ÙƒÙ„Ù…Ø© Ø§Ù„Ù…Ø±ÙˆØ± Ø§Ù„Ø¬Ø¯ÙŠØ¯Ø© ÙŠØ¬Ø¨ Ø£Ù† ØªÙƒÙˆÙ† 8 Ø£Ø­Ø±Ù Ø¹Ù„Ù‰ Ø§Ù„Ø£Ù‚Ù„ ÙˆØªØ­ØªÙˆÙŠ Ø¹Ù„Ù‰ Ø­Ø±ÙˆÙ ÙˆØ£Ø±Ù‚Ø§Ù….",
          "The new password must be at least 8 characters and include letters and numbers.",
        ),
      );
      return;
    }

    if (!passwordChecks.match) {
      toast.error(t(locale, "ØªØ£ÙƒÙŠØ¯ ÙƒÙ„Ù…Ø© Ø§Ù„Ù…Ø±ÙˆØ± ØºÙŠØ± Ù…Ø·Ø§Ø¨Ù‚.", "Password confirmation does not match."));
      return;
    }

    try {
      setBusy("password");
      const { error } = await supabase.auth.updateUser({ password: passwordForm.next });

      if (error) {
        toast.error(error.message);
        return;
      }

      setPasswordForm({ next: "", confirm: "" });
      toast.success(
        t(
          locale,
          "ØªÙ… ØªØ­Ø¯ÙŠØ« ÙƒÙ„Ù…Ø© Ø§Ù„Ù…Ø±ÙˆØ± Ø¨Ù†Ø¬Ø§Ø­. Ø§Ø³ØªØ®Ø¯Ù… Ø§Ù„ÙƒÙ„Ù…Ø© Ø§Ù„Ø¬Ø¯ÙŠØ¯Ø© ÙÙŠ ØªØ³Ø¬ÙŠÙ„Ø§Øª Ø§Ù„Ø¯Ø®ÙˆÙ„ Ø§Ù„Ù‚Ø§Ø¯Ù…Ø©.",
          "Password updated successfully. Use the new password for future sign-ins.",
        ),
      );
    } finally {
      setBusy(null);
    }
  };

  const handleSave = async () => {
    setBusy("save");
    await new Promise((resolve) => setTimeout(resolve, 250));
    toast.success(t(locale, "ØªÙ… Ø­ÙØ¸ Ø§Ù„Ø¥Ø¹Ø¯Ø§Ø¯Ø§Øª Ø¨Ù†Ø¬Ø§Ø­", "Settings saved successfully"));
    setBusy(null);
  };

  const handleResetDemoData = async () => {
    setBusy("reset");
    clearStorageByPrefix(CRM_STORAGE_PREFIX);
    toast.success(t(locale, "ØªÙ…Øª Ø¥Ø¹Ø§Ø¯Ø© Ø¨ÙŠØ§Ù†Ø§Øª Ø§Ù„Ù†Ø³Ø®Ø© Ø§Ù„ØªØ¬Ø±ÙŠØ¨ÙŠØ©. Ø³ÙŠÙØ¹Ø§Ø¯ ØªØ­Ù…ÙŠÙ„ Ø§Ù„ØµÙØ­Ø© Ø§Ù„Ø¢Ù†.", "Demo data was restored. The page will reload now."));
    window.setTimeout(() => window.location.reload(), 500);
  };

  const handleClearLocalData = async () => {
    setBusy("clear");
    clearStorageByPrefix(CRM_STORAGE_PREFIX);
    toast.success(t(locale, "ØªÙ… Ù…Ø³Ø­ Ø§Ù„Ø¨ÙŠØ§Ù†Ø§Øª Ø§Ù„Ù…Ø­Ù„ÙŠØ© Ø§Ù„Ù…Ø­ÙÙˆØ¸Ø©. Ø³ÙŠÙØ¹Ø§Ø¯ ØªØ­Ù…ÙŠÙ„ Ø§Ù„ØµÙØ­Ø© Ø§Ù„Ø¢Ù†.", "Saved local data was cleared. The page will reload now."));
    window.setTimeout(() => window.location.reload(), 500);
  };

  const handleExportBackup = async () => {
    try {
      setBusy("export");
      const snapshot = exportStorageSnapshot(CRM_STORAGE_PREFIX);
      const blob = new Blob([JSON.stringify(snapshot, null, 2)], { type: "application/json" });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      const datePart = new Date().toISOString().slice(0, 19).replace(/[T:]/g, "-");
      link.href = url;
      link.download = `skidy-rein-backup-${datePart}.json`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast.success(t(locale, "ØªÙ… ØªÙ†Ø²ÙŠÙ„ Ù†Ø³Ø®Ø© Ø§Ø­ØªÙŠØ§Ø·ÙŠØ© Ù…Ø­Ù„ÙŠØ© Ø¨Ù†Ø¬Ø§Ø­", "Local backup exported successfully"));
    } finally {
      setBusy(null);
    }
  };

  const handleImportBackup = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setBusy("import");
      const content = await file.text();
      const snapshot = parseStorageSnapshot(content);

      if (!snapshot) {
        toast.error(t(locale, "Ù…Ù„Ù Ø§Ù„Ù†Ø³Ø®Ø© Ø§Ù„Ø§Ø­ØªÙŠØ§Ø·ÙŠØ© ØºÙŠØ± ØµØ§Ù„Ø­", "Invalid backup file"));
        return;
      }

      const { imported } = importStorageSnapshot(snapshot, {
        clearExisting: true,
        expectedPrefix: CRM_STORAGE_PREFIX,
      });

      toast.success(
        t(
          locale,
          `ØªÙ… Ø§Ø³ØªÙŠØ±Ø§Ø¯ ${imported} Ø¹Ù†ØµØ± Ù…Ù† Ø§Ù„Ù†Ø³Ø®Ø© Ø§Ù„Ø§Ø­ØªÙŠØ§Ø·ÙŠØ©. Ø³ÙŠÙØ¹Ø§Ø¯ ØªØ­Ù…ÙŠÙ„ Ø§Ù„ØµÙØ­Ø© Ø§Ù„Ø¢Ù†.`,
          `Imported ${imported} backup entries. The page will reload now.`,
        ),
      );
      window.setTimeout(() => window.location.reload(), 500);
    } catch {
      toast.error(t(locale, "ØªØ¹Ø°Ø± Ø§Ø³ØªÙŠØ±Ø§Ø¯ Ø§Ù„Ù†Ø³Ø®Ø© Ø§Ù„Ø§Ø­ØªÙŠØ§Ø·ÙŠØ©", "Could not import the backup"));
    } finally {
      event.target.value = "";
      setBusy(null);
    }
  };

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="rounded-3xl border border-border bg-card p-6">
        <h1 className="flex items-center gap-2 text-2xl font-bold text-foreground">
          <Settings size={28} className="text-brand-600" />
          {t(locale, "Ø§Ù„Ø¥Ø¹Ø¯Ø§Ø¯Ø§Øª", "Settings")}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {t(
            locale,
            "Ù…Ø±ÙƒØ² ÙˆØ§Ø­Ø¯ Ù„ØªÙØ¶ÙŠÙ„Ø§Øª Ø§Ù„Ø¹Ø±Ø¶ ÙˆØ§Ù„Ù„ØºØ© ÙˆØ§Ù„Ø¥Ø´Ø¹Ø§Ø±Ø§Øª ÙˆØ¥Ø¯Ø§Ø±Ø© Ø¨ÙŠØ§Ù†Ø§Øª Ø§Ù„Ù†Ø³Ø®Ø© Ø§Ù„Ù…Ø­Ù„ÙŠØ©",
            "One place for appearance, language, notifications, and local demo data controls",
          )}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-6">
          <Card title={t(locale, "Ø§Ù„Ù…Ù„Ù Ø§Ù„Ø´Ø®ØµÙŠ", "Profile")} icon={User}>
            <div className="mb-4 flex items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-700 text-2xl font-bold text-white">A</div>
              <div>
                <p className="text-lg font-bold text-foreground">{profile.name}</p>
                <p className="text-sm text-muted-foreground">{t(locale, "Ù…Ø¯ÙŠØ± Ø§Ù„Ù†Ø¸Ø§Ù…", "System admin")}</p>
              </div>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label={t(locale, "Ø§Ù„Ø§Ø³Ù…", "Name")} value={profile.name} onChange={(value) => setProfile((prev) => ({ ...prev, name: value }))} />
              <Field label={t(locale, "Ø§Ù„Ø¨Ø±ÙŠØ¯", "Email")} type="email" value={profile.email} onChange={(value) => setProfile((prev) => ({ ...prev, email: value }))} />
            </div>
          </Card>

          <Card title={t(locale, "Ø£Ù…Ø§Ù† Ø§Ù„Ø­Ø³Ø§Ø¨", "Account security")} icon={ShieldCheck}>
            <div className="space-y-4">
              <div className="rounded-2xl border border-border bg-background p-4">
                <p className="text-sm font-semibold text-foreground">{t(locale, "ØªØºÙŠÙŠØ± ÙƒÙ„Ù…Ø© Ø§Ù„Ù…Ø±ÙˆØ±", "Change password")}</p>
              </div>

              <div className="grid grid-cols-1 gap-4">
                <PasswordField
                  label={t(locale, "ÙƒÙ„Ù…Ø© Ø§Ù„Ù…Ø±ÙˆØ± Ø§Ù„Ø¬Ø¯ÙŠØ¯Ø©", "New password")}
                  value={passwordForm.next}
                  visible={showPassword.next}
                  onToggleVisibility={() => setShowPassword((prev) => ({ ...prev, next: !prev.next }))}
                  onChange={(value) => setPasswordForm((prev) => ({ ...prev, next: value }))}
                />
                <PasswordField
                  label={t(locale, "ØªØ£ÙƒÙŠØ¯ ÙƒÙ„Ù…Ø© Ø§Ù„Ù…Ø±ÙˆØ±", "Confirm password")}
                  value={passwordForm.confirm}
                  visible={showPassword.confirm}
                  onToggleVisibility={() => setShowPassword((prev) => ({ ...prev, confirm: !prev.confirm }))}
                  onChange={(value) => setPasswordForm((prev) => ({ ...prev, confirm: value }))}
                />
              </div>

              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                <PasswordCheck label={t(locale, "8 Ø£Ø­Ø±Ù Ø£Ùˆ Ø£ÙƒØ«Ø±", "8 characters or more")} passed={passwordChecks.length} />
                <PasswordCheck label={t(locale, "ÙŠØ­ØªÙˆÙŠ Ø¹Ù„Ù‰ Ø­Ø±ÙˆÙ", "Contains letters")} passed={passwordChecks.letter} />
                <PasswordCheck label={t(locale, "ÙŠØ­ØªÙˆÙŠ Ø¹Ù„Ù‰ Ø£Ø±Ù‚Ø§Ù…", "Contains numbers")} passed={passwordChecks.number} />
                <PasswordCheck label={t(locale, "Ø§Ù„ØªØ£ÙƒÙŠØ¯ Ù…Ø·Ø§Ø¨Ù‚", "Confirmation matches")} passed={passwordChecks.match} />
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-muted/30 p-4">
                <div className="space-y-1">
                  <p className="text-sm font-semibold text-foreground">{t(locale, "ØªØ­Ø¯ÙŠØ« ÙƒÙ„Ù…Ø© Ø§Ù„Ù…Ø±ÙˆØ± Ù„Ù„Ø­Ø³Ø§Ø¨ Ø§Ù„Ø­Ø§Ù„ÙŠ", "Update password for the current account")}</p>
                  <p className="text-xs text-muted-foreground">
                    {t(
                      locale,
                      "Ø¥Ø°Ø§ Ø§Ù†ØªÙ‡Øª Ø§Ù„Ø¬Ù„Ø³Ø© Ø§Ù„Ø­Ø§Ù„ÙŠØ© Ø£Ùˆ Ø§Ù†ØªÙ‡Øª ØµÙ„Ø§Ø­ÙŠØªÙ‡Ø§ØŒ Ù‚Ø¯ ØªØ­ØªØ§Ø¬ Ø¥Ù„Ù‰ ØªØ³Ø¬ÙŠÙ„ Ø§Ù„Ø¯Ø®ÙˆÙ„ Ù…Ø±Ø© Ø£Ø®Ø±Ù‰ Ø«Ù… Ø¥Ø¹Ø§Ø¯Ø© Ø§Ù„Ù…Ø­Ø§ÙˆÙ„Ø©.",
                      "If the current session has expired, you may need to sign in again before retrying.",
                    )}
                  </p>
                </div>
                <button
                  onClick={handleChangePassword}
                  disabled={busy === "password"}
                  className={cn(
                    "inline-flex items-center gap-2 rounded-xl bg-brand-700 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-60",
                  )}
                >
                  <KeyRound size={16} />
                  {busy === "password" ? t(locale, "Ø¬Ø§Ø±Ù Ø§Ù„ØªØ­Ø¯ÙŠØ«...", "Updating...") : t(locale, "ØªØ­Ø¯ÙŠØ« ÙƒÙ„Ù…Ø© Ø§Ù„Ù…Ø±ÙˆØ±", "Update password")}
                </button>
              </div>
            </div>
          </Card>

          <Card title={t(locale, "Ø§Ù„Ù…Ø¸Ù‡Ø± ÙˆØ§Ù„Ù„ØºØ©", "Appearance & language")} icon={Palette}>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <SelectField
                label={t(locale, "Ø§Ù„Ø³Ù…Ø©", "Theme")}
                value={theme ?? "system"}
                onChange={(value) => setTheme(value)}
                options={[
                  { value: "light", label: t(locale, "ÙØ§ØªØ­", "Light") },
                  { value: "dark", label: t(locale, "Ø¯Ø§ÙƒÙ†", "Dark") },
                  { value: "system", label: t(locale, "ØªÙ„Ù‚Ø§Ø¦ÙŠ", "System") },
                ]}
              />
              <SelectField
                label={t(locale, "Ø§Ù„Ù„ØºØ©", "Language")}
                value={locale}
                onChange={(value) => setLocale(value as "ar" | "en")}
                options={[
                  { value: "ar", label: "Ø§Ù„Ø¹Ø±Ø¨ÙŠØ©" },
                  { value: "en", label: "English" },
                ]}
              />
            </div>
            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <ToggleRow
                icon={Languages}
                title={t(locale, "Ø§Ù„Ø´Ø±ÙŠØ· Ø§Ù„Ø¬Ø§Ù†Ø¨ÙŠ Ù…ÙˆØ³Ù‘Ø¹", "Expanded sidebar")}
                description={t(locale, "ØªØ­ÙƒÙ… Ø³Ø±ÙŠØ¹ ÙÙŠ Ø¹Ø±Ø¶ Ø§Ù„Ù‚Ø§Ø¦Ù…Ø© Ø§Ù„Ø±Ø¦ÙŠØ³ÙŠØ©", "Quick control over main sidebar size")}
                checked={sidebarOpen}
                onChange={setSidebarOpen}
              />
              <StaticPreview icon={theme === "dark" ? MoonStar : Palette} title={previewText.title} description={previewText.body} />
            </div>
          </Card>

          <Card title={t(locale, "Ø§Ù„Ø¥Ø´Ø¹Ø§Ø±Ø§Øª", "Notifications")} icon={Bell}>
            <div className="space-y-3">
              {[
                { key: "email", labelAr: "Ø¥Ø´Ø¹Ø§Ø±Ø§Øª Ø§Ù„Ø¨Ø±ÙŠØ¯", labelEn: "Email notifications" },
                { key: "whatsapp", labelAr: "Ø¥Ø´Ø¹Ø§Ø±Ø§Øª ÙˆØ§ØªØ³Ø§Ø¨", labelEn: "WhatsApp notifications" },
                { key: "browser", labelAr: "Ø¥Ø´Ø¹Ø§Ø±Ø§Øª Ø§Ù„Ù…ØªØµÙØ­", labelEn: "Browser notifications" },
              ].map((item) => (
                <label key={item.key} className="flex cursor-pointer items-center justify-between rounded-2xl border border-border bg-background p-3 transition-colors hover:bg-muted/50">
                  <span className="text-sm text-foreground">{t(locale, item.labelAr, item.labelEn)}</span>
                  <input
                    type="checkbox"
                    checked={notifications[item.key as keyof typeof notifications]}
                    onChange={(event) => setNotifications((prev) => ({ ...prev, [item.key]: event.target.checked }))}
                    className="h-5 w-5 rounded border-border text-brand-600 focus:ring-brand-500"
                  />
                </label>
              ))}
            </div>
          </Card>
        </div>

        <div className="space-y-6">
          <Card title={t(locale, "Ø¥Ø¯Ø§Ø±Ø© Ø¨ÙŠØ§Ù†Ø§Øª Ø§Ù„Ù†Ø³Ø®Ø©", "Demo data controls")} icon={Database}>
            <div className="mb-4 rounded-2xl border border-border bg-background p-4">
              <p className="text-sm font-semibold text-foreground">{t(locale, "Ø§Ù„Ø¨ÙŠØ§Ù†Ø§Øª Ø§Ù„Ù…Ø­Ù„ÙŠØ© Ø§Ù„Ø­Ø§Ù„ÙŠØ©", "Current local data")}</p>
              <p className="mt-1 text-sm text-muted-foreground">
                {t(locale, `ÙŠÙˆØ¬Ø¯ ${localDataCount} Ù…ÙØ§ØªÙŠØ­ Ù…Ø­Ù„ÙŠØ© Ù…Ø±ØªØ¨Ø·Ø© Ø¨Ø§Ù„Ù€ CRM Ø¯Ø§Ø®Ù„ Ù‡Ø°Ø§ Ø§Ù„Ù…ØªØµÙØ­.`, `There are ${localDataCount} local CRM storage entries in this browser.`)}
              </p>
            </div>

            <div className="space-y-3">
              <ActionPanel
                icon={Download}
                title={t(locale, "ØªÙ†Ø²ÙŠÙ„ Ù†Ø³Ø®Ø© Ø§Ø­ØªÙŠØ§Ø·ÙŠØ©", "Export backup")}
                description={t(locale, "Ø§Ø­ÙØ¸ Ù†Ø³Ø®Ø© JSON Ù…Ù† Ø¨ÙŠØ§Ù†Ø§Øª Ø§Ù„Ù€ demo Ø§Ù„Ù…Ø­Ù„ÙŠØ© Ù‚Ø¨Ù„ Ø§Ù„ØªØ¬Ø§Ø±Ø¨ Ø§Ù„ÙƒØ¨ÙŠØ±Ø© Ø£Ùˆ Ù‚Ø¨Ù„ Ø§Ù„Ø§Ø³ØªØ¨Ø¯Ø§Ù„ Ø¨Ù…Ù„ÙØ§Øª Ø¬Ø¯ÙŠØ¯Ø©.", "Save a JSON backup of the local demo data before large experiments or before replacing the project files.")}
                buttonLabel={t(locale, "ØªÙ†Ø²ÙŠÙ„ Ø§Ù„Ù†Ø³Ø®Ø© Ø§Ù„Ø§Ø­ØªÙŠØ§Ø·ÙŠØ©", "Export backup")}
                onClick={handleExportBackup}
                variant="primary"
                busy={busy === "export"}
              />

              <ActionPanel
                icon={Upload}
                title={t(locale, "Ø§Ø³ØªÙŠØ±Ø§Ø¯ Ù†Ø³Ø®Ø© Ø§Ø­ØªÙŠØ§Ø·ÙŠØ©", "Import backup")}
                description={t(locale, "Ø§Ø³ØªØ±Ø¬Ø¹ Ø­Ø§Ù„Ø© Ø§Ù„Ù…ØªØµÙØ­ Ø§Ù„Ø­Ø§Ù„ÙŠØ© Ù…Ù† Ù…Ù„Ù backup JSON Ø³Ø¨Ù‚ ØªÙ†Ø²ÙŠÙ„Ù‡ Ù…Ù† Ø§Ù„Ù†Ø¸Ø§Ù… Ù†ÙØ³Ù‡.", "Restore the current browser state from a backup JSON exported from the CRM.")}
                buttonLabel={t(locale, "Ø§Ø®ØªÙŠØ§Ø± Ù…Ù„Ù Ø§Ù„Ù†Ø³Ø®Ø© Ø§Ù„Ø§Ø­ØªÙŠØ§Ø·ÙŠØ©", "Choose backup file")}
                onClick={() => backupInputRef.current?.click()}
                variant="secondary"
                busy={busy === "import"}
              />

              <ActionPanel
                icon={RotateCcw}
                title={t(locale, "Ø¥Ø¹Ø§Ø¯Ø© ØªØ­Ù…ÙŠÙ„ Ø§Ù„Ø¨ÙŠØ§Ù†Ø§Øª Ø§Ù„ØªØ¬Ø±ÙŠØ¨ÙŠØ©", "Restore demo data")}
                description={t(locale, "Ù…ÙÙŠØ¯ Ø¹Ù†Ø¯Ù…Ø§ ØªØ±ÙŠØ¯ Ø§Ù„Ø¹ÙˆØ¯Ø© Ø¥Ù„Ù‰ Ù†Ø³Ø®Ø© Ù†Ø¸ÙŠÙØ© Ø¨Ø¹Ø¯ Ø§Ù„ØªØ¬Ø±Ø¨Ø© Ø£Ùˆ Ø§Ù„ØªØ¯Ø±ÙŠØ¨.", "Useful when you want to go back to a clean internal demo state.")}
                buttonLabel={t(locale, "Ø§Ø³ØªØ¹Ø§Ø¯Ø© Ø§Ù„Ù†Ø³Ø®Ø© Ø§Ù„ØªØ¬Ø±ÙŠØ¨ÙŠØ©", "Restore demo state")}
                onClick={handleResetDemoData}
                variant="primary"
                busy={busy === "reset"}
              />

              <ActionPanel
                icon={Trash2}
                title={t(locale, "Ù…Ø³Ø­ Ø§Ù„Ø¨ÙŠØ§Ù†Ø§Øª Ø§Ù„Ù…Ø­Ù„ÙŠØ©", "Clear local data")}
                description={t(locale, "ÙŠÙ…Ø³Ø­ Ø§Ù„Ø¨ÙŠØ§Ù†Ø§Øª Ø§Ù„Ù…Ø®Ø²Ù†Ø© Ù…Ø­Ù„ÙŠÙ‹Ø§ Ø¯Ø§Ø®Ù„ Ø§Ù„Ù…ØªØµÙØ­ ÙÙ‚Ø·ØŒ Ø¯ÙˆÙ† Ø§Ù„Ù…Ø³Ø§Ø³ Ø¨Ù‚Ø§Ø¹Ø¯Ø© Ø§Ù„Ø¨ÙŠØ§Ù†Ø§Øª Ø§Ù„ÙØ¹Ù„ÙŠØ©.", "Clears only browser-saved local data without touching the real database.")}
                buttonLabel={t(locale, "Ù…Ø³Ø­ Ø§Ù„Ø¨ÙŠØ§Ù†Ø§Øª Ø§Ù„Ù…Ø­Ù„ÙŠØ©", "Clear local data")}
                onClick={handleClearLocalData}
                variant="danger"
                busy={busy === "clear"}
              />
            </div>

            <input ref={backupInputRef} type="file" accept="application/json" className="hidden" onChange={handleImportBackup} />
          </Card>

          <Card title={t(locale, "Ù…Ù„Ø§Ø­Ø¸Ø§Øª ØªØ´ØºÙŠÙ„ÙŠØ©", "Operational notes")} icon={Settings}>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>{t(locale, "â€¢ ØªØºÙŠÙŠØ± Ø§Ù„Ù„ØºØ© ÙˆØ§Ù„Ø³Ù…Ø© ÙŠÙØ­ÙÙŽØ¸ Ù…Ø­Ù„ÙŠÙ‹Ø§ ÙÙŠ Ø§Ù„Ù…ØªØµÙØ­ Ø§Ù„Ø­Ø§Ù„ÙŠ.", "â€¢ Theme and language are stored locally in the current browser.")}</li>
              <li>{t(locale, "â€¢ Ø¬Ø²Ø¡ Ù…Ù† Ø§Ù„Ù†Ø¸Ø§Ù… ÙŠØ¹Ù…Ù„ Ø¹Ù„Ù‰ ÙˆØ¶Ø¹ fallback Ù…Ø­Ù„ÙŠ Ø¹Ù†Ø¯ ØºÙŠØ§Ø¨ Ø£Ùˆ ØªØ¹Ø·Ù„ Ø§Ù„Ø§ØªØµØ§Ù„ Ø¨Ù‚Ø§Ø¹Ø¯Ø© Ø§Ù„Ø¨ÙŠØ§Ù†Ø§Øª.", "â€¢ Parts of the CRM use local fallback mode if the database is unavailable.")}</li>
              <li>{t(locale, "â€¢ ØªØµØ¯ÙŠØ± Ù†Ø³Ø®Ø© Ø§Ø­ØªÙŠØ§Ø·ÙŠØ© Ù…Ø­Ù„ÙŠØ© Ù‚Ø¨Ù„ Ø£ÙŠ ØªØ¹Ø¯ÙŠÙ„ ÙƒØ¨ÙŠØ± Ø®Ø·ÙˆØ© Ø£Ù…Ø§Ù† Ù…Ù…ØªØ§Ø²Ø©.", "â€¢ Exporting a local backup before major changes is a strong safety practice.")}</li>
              <li>{t(locale, "â€¢ Ø¥Ø¹Ø§Ø¯Ø© Ø§Ù„Ø¨ÙŠØ§Ù†Ø§Øª Ø§Ù„ØªØ¬Ø±ÙŠØ¨ÙŠØ© Ù…ÙÙŠØ¯Ø© Ù‚Ø¨Ù„ ØªØ³Ù„ÙŠÙ… Ù†Ø³Ø®Ø© Ø¹Ø±Ø¶ Ø£Ùˆ Ø¨Ø¯Ø¡ ØªØ¬Ø±Ø¨Ø© Ø¬Ø¯ÙŠØ¯Ø©.", "â€¢ Restoring demo data is useful before a showcase or a fresh demo session.")}</li>
            </ul>
          </Card>

          <div className="flex justify-end">
            <button onClick={handleSave} disabled={busy === "save"} className={cn("flex items-center gap-2 rounded-xl bg-brand-700 px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-50")}>
              <Save size={18} />
              {busy === "save" ? t(locale, "Ø¬Ø§Ø±Ù Ø§Ù„Ø­ÙØ¸...", "Saving...") : t(locale, "Ø­ÙØ¸ Ø§Ù„Ø¥Ø¹Ø¯Ø§Ø¯Ø§Øª", "Save settings")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Card({ title, icon: Icon, children }: { title: string; icon: typeof Settings; children: ReactNode }) {
  return (
    <section className="rounded-2xl border border-border bg-card p-5">
      <h3 className="mb-4 flex items-center gap-2 font-bold text-foreground">
        <Icon size={18} className="text-brand-600" />
        {title}
      </h3>
      {children}
    </section>
  );
}

function Field({ label, value, onChange, type = "text" }: { label: string; value: string; onChange: (value: string) => void; type?: string }) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-foreground">{label}</label>
      <input type={type} value={value} onChange={(event) => onChange(event.target.value)} className="w-full rounded-xl border border-input bg-muted/50 px-4 py-2.5 text-sm text-foreground" />
    </div>
  );
}

function SelectField({ label, value, onChange, options }: { label: string; value: string; onChange: (value: string) => void; options: Array<{ value: string; label: string }> }) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-foreground">{label}</label>
      <select value={value} onChange={(event) => onChange(event.target.value)} className="w-full rounded-xl border border-input bg-muted/50 px-4 py-2.5 text-sm text-foreground">
        {options.map((option) => (
          <option key={option.value} value={option.value}>{option.label}</option>
        ))}
      </select>
    </div>
  );
}

function ToggleRow({ icon: Icon, title, description, checked, onChange }: { icon: typeof Languages; title: string; description: string; checked: boolean; onChange: (value: boolean) => void }) {
  return (
    <label className="flex cursor-pointer items-center gap-3 rounded-2xl border border-border bg-background p-4 transition-colors hover:bg-muted/40">
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-700 dark:bg-brand-950 dark:text-brand-300">
        <Icon size={18} />
      </div>
      <div className="flex-1">
        <p className="text-sm font-semibold text-foreground">{title}</p>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
      <input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} className="h-5 w-5 rounded border-border text-brand-600 focus:ring-brand-500" />
    </label>
  );
}

function StaticPreview({ icon: Icon, title, description }: { icon: typeof Palette; title: string; description: string }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-border bg-background p-4">
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-700 dark:bg-brand-950 dark:text-brand-300">
        <Icon size={18} />
      </div>
      <div>
        <p className="text-sm font-semibold text-foreground">{title}</p>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
    </div>
  );
}

function PasswordField({ label, value, onChange, visible, onToggleVisibility }: { label: string; value: string; onChange: (value: string) => void; visible: boolean; onToggleVisibility: () => void }) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-foreground">{label}</label>
      <div className="relative">
        <input
          type={visible ? "text" : "password"}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="w-full rounded-xl border border-input bg-muted/50 px-4 py-2.5 pe-12 text-sm text-foreground"
        />
        <button
          type="button"
          onClick={onToggleVisibility}
          className="absolute inset-y-0 end-0 flex items-center px-3 text-muted-foreground transition-colors hover:text-foreground"
          aria-label={visible ? "Hide password" : "Show password"}
        >
          {visible ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      </div>
    </div>
  );
}

function PasswordCheck({ label, passed }: { label: string; passed: boolean }) {
  return (
    <div
      className={cn(
        "rounded-xl border px-3 py-2 text-sm font-medium transition-colors",
        passed
          ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-950/30 dark:text-emerald-300"
          : "border-border bg-background text-muted-foreground",
      )}
    >
      {label}
    </div>
  );
}

function ActionPanel({ icon: Icon, title, description, buttonLabel, onClick, variant, busy }: { icon: typeof Database; title: string; description: string; buttonLabel: string; onClick: () => void; variant: "primary" | "secondary" | "danger"; busy: boolean }) {
  const buttonClassName = {
    primary: "bg-brand-700 text-white hover:bg-brand-600",
    secondary: "border border-border bg-background text-foreground hover:bg-muted",
    danger: "bg-destructive text-white hover:bg-destructive/90",
  }[variant];

  return (
    <div className="rounded-2xl border border-border bg-background p-4">
      <div className="flex items-start gap-3">
        <div className="mt-0.5 flex h-10 w-10 items-center justify-center rounded-xl bg-muted text-brand-700 dark:text-brand-300">
          <Icon size={18} />
        </div>
        <div className="flex-1">
          <p className="text-sm font-semibold text-foreground">{title}</p>
          <p className="mt-1 text-xs leading-5 text-muted-foreground">{description}</p>
          <button onClick={onClick} disabled={busy} className={cn("mt-3 inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-60", buttonClassName)}>
            <Icon size={16} />
            {busy ? "..." : buttonLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
```

### FILE: src\app\(dashboard)\students\page.tsx
```tsx
"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { GraduationCap, Plus, Search } from "lucide-react";
import { useUIStore } from "@/stores/ui-store";
import { getFilterLabel, t } from "@/lib/locale";
import { STUDENT_STATUS_META, getMetaLabel } from "@/config/status-meta";
import { formatCourseLabel, formatCurrencyEgp } from "@/lib/formatters";
import { cn } from "@/lib/utils";
import { listParentsWithRelations, listStudentsWithRelations, extractLeadIdFromProjectionId } from "@/services/relations.service";
import type { ParentListItem, StudentListItem } from "@/types/crm";
import type { StudentStatus } from "@/types/common.types";
import { EmptySearchState, LoadingState } from "@/components/shared/page-state";

function normalizePhone(value: string | null | undefined): string {
  return (value ?? "").replace(/\D/g, "").replace(/^20/, "");
}

export default function StudentsPage() {
  const locale = useUIStore((state) => state.locale);
  const isAr = locale === "ar";
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StudentStatus | "all">("all");
  const [students, setStudents] = useState<StudentListItem[]>([]);
  const [parents, setParents] = useState<ParentListItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    async function load() {
      setLoading(true);
      const [studentData, parentData] = await Promise.all([listStudentsWithRelations(), listParentsWithRelations()]);
      if (isMounted) {
        setStudents(studentData);
        setParents(parentData);
        setLoading(false);
      }
    }
    load();
    return () => {
      isMounted = false;
    };
  }, []);

  const parentMap = useMemo(() => {
    const map = new Map<string, ParentListItem>();
    students.forEach((student) => {
      const match = parents.find((parent) => {
        if (student.parentId && parent.id === student.parentId) return true;
        return normalizePhone(parent.phone) === normalizePhone(student.parentPhone) || parent.fullName === student.parentName;
      });
      if (match) map.set(student.id, match);
    });
    return map;
  }, [parents, students]);

  const projectedCount = useMemo(() => students.filter((student) => Boolean(extractLeadIdFromProjectionId(student.id))).length, [students]);
  const assignedOwnerCount = useMemo(() => students.filter((student) => Boolean(student.ownerName)).length, [students]);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return students.filter((student) => {
      const matchSearch = !query || student.fullName.toLowerCase().includes(query) || student.parentName.toLowerCase().includes(query);
      const matchStatus = statusFilter === "all" || student.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [search, statusFilter, students]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
        <h1 className="flex items-center gap-2 text-2xl font-bold text-foreground">
          <GraduationCap size={28} className="text-brand-600" />
          {t(locale, "Ø§Ù„Ø·Ù„Ø§Ø¨", "Students")}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">{t(locale, "Ø±Ø¤ÙŠØ© Ø£ÙˆØ¶Ø­ Ù„Ù„Ø·Ù„Ø§Ø¨ Ø§Ù„Ø­Ø§Ù„ÙŠÙŠÙ† ÙˆØ±Ø¨Ø·Ù‡Ù… Ø¨Ø£ÙˆÙ„ÙŠØ§Ø¡ Ø§Ù„Ø£Ù…ÙˆØ± ÙˆØ§Ù„ÙƒÙ„Ø§Ø³Ø§Øª", "A clearer view of current students and their parent and class relationships")}</p>
        </div>
        <Link href="/students/new" className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand-700 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-600">
          <Plus size={18} />
          {t(locale, "Ø¥Ø¶Ø§ÙØ© Ø·Ø§Ù„Ø¨", "Add student")}
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <MetricCard title={t(locale, "Ø¥Ø¬Ù…Ø§Ù„ÙŠ Ø§Ù„Ø·Ù„Ø§Ø¨", "Total students")} value={String(students.length)} />
        <MetricCard title={t(locale, "Ù…Ù† Ø§Ù„Ø¹Ù…Ù„Ø§Ø¡ Ø§Ù„Ø­Ø§Ù„ÙŠÙŠÙ†", "From current customers")} value={String(projectedCount)} />
        <MetricCard title={t(locale, "Ù„Ù‡Ù… Ù…Ø³Ø¤ÙˆÙ„", "Assigned owner")} value={String(assignedOwnerCount)} />
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search size={18} className={cn("absolute top-1/2 -translate-y-1/2 text-muted-foreground", isAr ? "right-3" : "left-3")} />
          <input type="text" value={search} onChange={(event) => setSearch(event.target.value)} placeholder={t(locale, "Ø¨Ø­Ø« Ø¨Ø§Ù„Ø§Ø³Ù… Ø£Ùˆ ÙˆÙ„ÙŠ Ø§Ù„Ø£Ù…Ø±", "Search by student or parent")} className={cn("w-full rounded-xl bg-card py-2.5 text-sm text-foreground border border-border placeholder:text-muted-foreground focus:ring-2 focus:ring-ring", isAr ? "pr-10 pl-4" : "pl-10 pr-4")} />
        </div>
        <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as StudentStatus | "all")} className="rounded-xl border border-border bg-card px-4 py-2.5 text-sm text-foreground">
          <option value="all">{getFilterLabel("allStudentStatuses", locale)}</option>
          {Object.entries(STUDENT_STATUS_META).map(([key, meta]) => (
            <option key={key} value={key}>{getMetaLabel(meta, locale)}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <LoadingState
          titleAr="Ø¬Ø§Ø±Ù ØªØ­Ù…ÙŠÙ„ Ø§Ù„Ø·Ù„Ø§Ø¨"
          titleEn="Loading students"
          descriptionAr="ÙŠØªÙ… Ø§Ù„Ø¢Ù† ØªØ¬Ù‡ÙŠØ² Ù…Ù„ÙØ§Øª Ø§Ù„Ø·Ù„Ø§Ø¨ ÙˆØ±Ø¨Ø· Ø£ÙˆÙ„ÙŠØ§Ø¡ Ø§Ù„Ø£Ù…ÙˆØ± ÙˆØ§Ù„Ø­Ø§Ù„Ø§Øª Ø§Ù„Ø¯Ø±Ø§Ø³ÙŠØ© Ø§Ù„Ù…Ø±ØªØ¨Ø·Ø© Ø¨Ù‡Ù…."
          descriptionEn="Student records are being prepared with linked parents and academic statuses."
        />
      ) : (
        <div className="overflow-hidden rounded-2xl border border-border bg-card">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className={cn("px-4 py-3 font-semibold text-muted-foreground", isAr ? "text-right" : "text-left")}>{t(locale, "Ø§Ù„Ø·Ø§Ù„Ø¨", "Student")}</th>
                  <th className={cn("px-4 py-3 font-semibold text-muted-foreground", isAr ? "text-right" : "text-left")}>{t(locale, "ÙˆÙ„ÙŠ Ø§Ù„Ø£Ù…Ø±", "Parent")}</th>
                  <th className={cn("px-4 py-3 font-semibold text-muted-foreground", isAr ? "text-right" : "text-left")}>{t(locale, "Ø§Ù„Ø­Ø§Ù„Ø©", "Status")}</th>
                  <th className={cn("px-4 py-3 font-semibold text-muted-foreground", isAr ? "text-right" : "text-left")}>{t(locale, "Ø§Ù„ÙƒÙˆØ±Ø³", "Course")}</th>
                  <th className={cn("px-4 py-3 font-semibold text-muted-foreground", isAr ? "text-right" : "text-left")}>{t(locale, "Ø§Ù„ÙƒÙ„Ø§Ø³", "Class")}</th>
                  <th className={cn("px-4 py-3 font-semibold text-muted-foreground", isAr ? "text-right" : "text-left")}>{t(locale, "Ø§Ù„Ù…Ø³Ø¤ÙˆÙ„", "Owner")}</th>
                  <th className={cn("px-4 py-3 font-semibold text-muted-foreground", isAr ? "text-right" : "text-left")}>{t(locale, "Ø§Ù„Ø­Ø¶ÙˆØ±", "Attendance")}</th>
                  <th className={cn("px-4 py-3 font-semibold text-muted-foreground", isAr ? "text-right" : "text-left")}>{t(locale, "Ø§Ù„Ù…Ø¯ÙÙˆØ¹", "Paid")}</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((student) => {
                  const meta = STUDENT_STATUS_META[student.status];
                  const parent = parentMap.get(student.id);
                  const isProjected = Boolean(extractLeadIdFromProjectionId(student.id));
                  return (
                    <tr key={student.id} className="border-b border-border last:border-0 transition-colors hover:bg-muted/30">
                      <td className="px-4 py-3">
                        <Link href={`/students/${student.id}`} className="group block">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="font-semibold text-foreground transition-colors group-hover:text-brand-600">{student.fullName}</p>
                            {isProjected ? <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-semibold text-amber-700">{t(locale, "Ù…Ù† Ø§Ù„Ø¹Ù…Ù„Ø§Ø¡ Ø§Ù„Ø­Ø§Ù„ÙŠÙŠÙ†", "From current customers")}</span> : null}
                          </div>
                          <p className="text-xs text-muted-foreground">{student.age} {t(locale, "Ø³Ù†Ø©", "years")}</p>
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-foreground">
                        {parent ? <Link href={`/parents/${parent.id}`} className="transition-colors hover:text-brand-600">{student.parentName}</Link> : student.parentName}
                      </td>
                      <td className="px-4 py-3"><span className="rounded-full px-2.5 py-1 text-xs font-semibold" style={{ backgroundColor: meta.bg, color: meta.color }}>{getMetaLabel(meta, locale)}</span></td>
                      <td className="px-4 py-3"><span className="rounded-full bg-brand-50 px-2 py-0.5 text-xs text-brand-700 dark:bg-brand-950 dark:text-brand-300">{formatCourseLabel(student.currentCourse, locale)}</span></td>
                      <td className="px-4 py-3 text-xs text-foreground">{student.className ?? t(locale, "ØºÙŠØ± Ù…Ø³Ø¬Ù„", "Not assigned")}</td>
                      <td className="px-4 py-3 text-xs text-foreground">{student.ownerName ?? t(locale, "ØºÙŠØ± Ù…Ø®ØµØµ", "Unassigned")}</td>
                      <td className="px-4 py-3 text-foreground">{student.sessionsAttended} {t(locale, "Ø­ØµØ©", "sessions")}</td>
                      <td className="px-4 py-3 font-semibold text-foreground">{formatCurrencyEgp(student.totalPaid, locale)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {!loading && filtered.length === 0 ? <EmptySearchState /> : null}
        </div>
      )}
    </div>
  );
}


function MetricCard({ title, value }: { title: string; value: string }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <p className="text-xs font-semibold text-muted-foreground">{title}</p>
      <p className="mt-2 text-2xl font-bold text-foreground">{value}</p>
    </div>
  );
}
```

### FILE: src\app\(dashboard)\students\new\page.tsx
```tsx
"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { StudentForm } from "@/components/students/student-form";
import { createParent, listParents } from "@/services/parents.service";
import { createStudent, listStudents } from "@/services/students.service";
import type { CreateStudentInput } from "@/types/crm";

function normalizePhone(value: string | null | undefined): string {
  return (value ?? "").replace(/\D/g, "").replace(/^20/, "");
}

function normalizeName(value: string | null | undefined): string {
  return (value ?? "").toLowerCase().replace(/[Ù‹-ÙŸ]/g, "").replace(/\s+/g, " ").trim();
}

export default function NewStudentPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const parentName = searchParams.get("parentName") ?? "";
  const parentPhone = searchParams.get("parentPhone") ?? "";
  const childName = searchParams.get("childName") ?? "";
  const childAge = searchParams.get("childAge");
  const currentCourse = searchParams.get("currentCourse");
  const className = searchParams.get("className") ?? "";

  const handleSubmit = async (payload: CreateStudentInput) => {
    const parents = await listParents();
    const existingParent = parents.find((parent) =>
      normalizePhone(parent.phone) === normalizePhone(payload.parentPhone) ||
      normalizeName(parent.fullName) === normalizeName(payload.parentName),
    );

    const parent = existingParent ?? await createParent({
      fullName: payload.parentName,
      phone: payload.parentPhone,
      whatsapp: payload.parentPhone,
      childrenCount: 1,
    });

    const students = await listStudents();
    const duplicateStudent = students.find((student) =>
      normalizeName(student.fullName) === normalizeName(payload.fullName) &&
      (student.parentId === parent.id || normalizePhone(student.parentPhone) === normalizePhone(parent.phone)),
    );

    if (duplicateStudent) {
      throw new Error("ÙŠÙˆØ¬Ø¯ Ø·Ø§Ù„Ø¨ Ù…Ø³Ø¬Ù„ Ø¨Ø§Ù„ÙØ¹Ù„ Ø¨Ù†ÙØ³ Ø§Ù„Ø§Ø³Ù… ÙˆØªØ­Øª Ù†ÙØ³ ÙˆÙ„ÙŠ Ø§Ù„Ø£Ù…Ø±. Ø§ÙØªØ­ Ø§Ù„Ø³Ø¬Ù„ Ø§Ù„Ø­Ø§Ù„ÙŠ Ø¨Ø¯Ù„ ØªÙƒØ±Ø§Ø±Ù‡.");
    }

    const created = await createStudent({
      ...payload,
      parentId: parent.id,
      parentName: parent.fullName,
      parentPhone: parent.phone,
    });

    router.push(`/students/${created.id}`);
  };

  return (
    <StudentForm
      title="Ø¥Ø¶Ø§ÙØ© Ø·Ø§Ù„Ø¨"
      description="Ø£Ù†Ø´Ø¦ Ø·Ø§Ù„Ø¨Ù‹Ø§ Ø­Ù‚ÙŠÙ‚ÙŠÙ‹Ø§ Ø¯Ø§Ø®Ù„ Ø§Ù„Ù†Ø¸Ø§Ù… ÙˆØ§Ø±Ø¨Ø·Ù‡ Ø¨ÙˆÙ„ÙŠ Ø£Ù…Ø±Ù‡ Ù…Ø¨Ø§Ø´Ø±Ø© Ø¨Ø¯ÙˆÙ† ØªÙƒØ±Ø§Ø± ØºÙŠØ± Ù…Ù‚ØµÙˆØ¯"
      submitLabel="Ø­ÙØ¸ Ø§Ù„Ø·Ø§Ù„Ø¨"
      successMessage="ØªÙ… Ø¥Ù†Ø´Ø§Ø¡ Ø³Ø¬Ù„ Ø§Ù„Ø·Ø§Ù„Ø¨ Ø¨Ù†Ø¬Ø§Ø­"
      onSubmit={handleSubmit}
      cancelHref="/students"
      initialValues={{
        fullName: childName || undefined,
        age: childAge ? Number(childAge) : undefined,
        parentName: parentName || undefined,
        parentPhone: parentPhone || undefined,
        currentCourse: (currentCourse as CreateStudentInput["currentCourse"]) ?? undefined,
        className: className || undefined,
      }}
    />
  );
}
```

### FILE: src\app\(dashboard)\students\[id]\page.tsx
```tsx
```

### FILE: src\app\(dashboard)\students\[id]\report\page.tsx
```tsx
```

### FILE: src\app\(dashboard)\teachers\page.tsx
```tsx
"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { BookOpen, Calculator, Mail, Phone, PlusCircle, Search } from "lucide-react";
import { useUIStore } from "@/stores/ui-store";
import { COURSE_TYPE_LABELS, COURSE_TYPE_EN_LABELS } from "@/config/labels";
import { getEmploymentTypeLabel, t } from "@/lib/locale";
import { cn } from "@/lib/utils";
import { listTeachersWithRelations } from "@/services/relations.service";
import type { TeacherListItem } from "@/types/crm";
import { EmptySearchState, LoadingState } from "@/components/shared/page-state";

export default function TeachersPage() {
  const locale = useUIStore((state) => state.locale);
  const isAr = locale === "ar";
  const [search, setSearch] = useState("");
  const [teachers, setTeachers] = useState<TeacherListItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    async function load() {
      setLoading(true);
      const data = await listTeachersWithRelations();
      if (isMounted) {
        setTeachers(data);
        setLoading(false);
      }
    }
    load();
    return () => {
      isMounted = false;
    };
  }, []);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return teachers.filter((teacher) => {
      if (!query) return true;
      return (
        teacher.fullName.toLowerCase().includes(query) ||
        teacher.specialization.some((item) => (isAr ? COURSE_TYPE_LABELS[item] : COURSE_TYPE_EN_LABELS[item]).toLowerCase().includes(query))
      );
    });
  }, [teachers, search, isAr]);

  const totals = useMemo(() => ({
    active: teachers.filter((teacher) => teacher.isActive).length,
    classes: teachers.reduce((sum, teacher) => sum + teacher.classesCount, 0),
    students: teachers.reduce((sum, teacher) => sum + teacher.studentsCount, 0),
  }), [teachers]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold text-foreground">
            <BookOpen size={28} className="text-brand-600" />
            {t(locale, "Ø§Ù„Ù…Ø¯Ø±Ø³ÙŠÙ†", "Teachers")}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">{t(locale, "Ø¥Ø¯Ø§Ø±Ø© ÙØ±ÙŠÙ‚ Ø§Ù„Ù…Ø¯Ø±Ø³ÙŠÙ† ÙˆØ±Ø¨Ø·Ù‡Ù… Ø¨Ø§Ù„ÙƒÙ„Ø§Ø³Ø§Øª ÙˆØ§Ù„Ø·Ù„Ø§Ø¨ ÙˆØ§Ù„Ø­Ø³Ø§Ø¨Ø§Øª Ø§Ù„Ù…Ø§Ù„ÙŠØ©", "Manage teachers, their linked classes and students, plus financial tracking")}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/teachers/finance" className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-2.5 text-sm font-semibold text-foreground transition-colors hover:bg-muted">
            <Calculator size={16} />
            {t(locale, "Ø­Ø³Ø§Ø¨Ø§Øª Ø§Ù„Ù…Ø¯Ø±Ø³ÙŠÙ†", "Teacher accounts")}
          </Link>
          <Link href="/teachers/new" className="inline-flex items-center gap-2 rounded-xl bg-brand-700 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-600">
            <PlusCircle size={16} />
            {t(locale, "Ø¥Ø¶Ø§ÙØ© Ù…Ø¯Ø±Ø³", "Add teacher")}
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <SummaryCard label={t(locale, "Ù…Ø¯Ø±Ø³ÙˆÙ† Ù†Ø´Ø·ÙˆÙ†", "Active teachers")} value={String(totals.active)} />
        <SummaryCard label={t(locale, "Ø§Ù„ÙƒÙ„Ø§Ø³Ø§Øª Ø§Ù„Ø­Ø§Ù„ÙŠØ©", "Current classes")} value={String(totals.classes)} />
        <SummaryCard label={t(locale, "Ø§Ù„Ø·Ù„Ø§Ø¨ Ø§Ù„Ù…Ø±ØªØ¨Ø·ÙˆÙ†", "Linked students")} value={String(totals.students)} />
      </div>

      <div className="relative max-w-md">
        <Search size={18} className={cn("absolute top-1/2 -translate-y-1/2 text-muted-foreground", isAr ? "right-3" : "left-3")} />
        <input type="text" value={search} onChange={(event) => setSearch(event.target.value)} placeholder={t(locale, "Ø¨Ø­Ø« Ø¨Ø§Ù„Ø§Ø³Ù… Ø£Ùˆ Ø§Ù„ØªØ®ØµØµ...", "Search by name or specialization...")} className={cn("w-full rounded-xl border border-border bg-card py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-ring", isAr ? "pr-10 pl-4" : "pl-10 pr-4")} />
      </div>

      {loading ? (
        <LoadingState
          titleAr="Ø¬Ø§Ø±Ù ØªØ­Ù…ÙŠÙ„ Ø§Ù„Ù…Ø¯Ø±Ø³ÙŠÙ†"
          titleEn="Loading teachers"
          descriptionAr="ÙŠØªÙ… Ø§Ù„Ø¢Ù† ØªØ¬Ù‡ÙŠØ² Ù…Ù„ÙØ§Øª Ø§Ù„Ù…Ø¯Ø±Ø³ÙŠÙ† ÙˆØ±Ø¨Ø·Ù‡Ù… Ø¨Ø§Ù„ÙƒÙ„Ø§Ø³Ø§Øª ÙˆØ§Ù„Ø·Ù„Ø§Ø¨ Ø§Ù„Ù…Ø±ØªØ¨Ø·ÙŠÙ†."
          descriptionEn="Teacher profiles are being linked with actual classes and students now."
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((teacher) => (
            <Link key={teacher.id} href={`/teachers/${teacher.id}`} className="rounded-2xl border border-border bg-card p-4 transition-all hover:-translate-y-0.5 hover:shadow-brand-md">
              <div className="mb-3 flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-700">
                  <span className="font-bold text-white">{teacher.fullName.replace("Ø£. ", "").charAt(0)}</span>
                </div>
                <div>
                  <p className="font-bold text-foreground">{teacher.fullName}</p>
                  <p className="text-xs text-muted-foreground">{getEmploymentTypeLabel(teacher.employment, locale)}</p>
                </div>
                {teacher.isActive ? <span className={cn("rounded-full bg-success-50 px-2 py-0.5 text-[10px] font-semibold text-success-600", isAr ? "mr-auto" : "ml-auto")}>{t(locale, "Ù†Ø´Ø·", "Active")}</span> : null}
              </div>

              <div className="mb-3 flex flex-wrap gap-1.5">
                {teacher.specialization.map((item) => (
                  <span key={item} className="rounded-full bg-brand-50 px-2 py-0.5 text-[10px] text-brand-700 dark:bg-brand-950 dark:text-brand-300">{isAr ? COURSE_TYPE_LABELS[item] : COURSE_TYPE_EN_LABELS[item]}</span>
                ))}
              </div>

              <div className="grid grid-cols-2 gap-2 text-center text-xs">
                <div className="rounded-xl bg-muted/50 p-2">
                  <p className="text-lg font-bold text-foreground">{teacher.classesCount}</p>
                  <p className="text-muted-foreground">{t(locale, "ÙƒÙ„Ø§Ø³Ø§Øª", "Classes")}</p>
                </div>
                <div className="rounded-xl bg-muted/50 p-2">
                  <p className="text-lg font-bold text-foreground">{teacher.studentsCount}</p>
                  <p className="text-muted-foreground">{t(locale, "Ø·Ù„Ø§Ø¨", "Students")}</p>
                </div>
              </div>

              <div className="mt-3 space-y-1.5 border-t border-border pt-3 text-xs text-muted-foreground">
                <div className="flex items-center gap-2"><Phone size={14} />{teacher.phone}</div>
                <div className="flex items-center gap-2"><Mail size={14} />{teacher.email ?? t(locale, "ØºÙŠØ± Ù…ØªÙˆÙØ±", "N/A")}</div>
              </div>
            </Link>
          ))}
          {!loading && filtered.length === 0 ? <div className="col-span-full"><EmptySearchState /></div> : null}
        </div>
      )}
    </div>
  );
}

function SummaryCard({ label, value }: { label: string; value: string }) {
  return <div className="rounded-2xl border border-border bg-card p-5"><p className="text-sm text-muted-foreground">{label}</p><p className="mt-2 text-2xl font-bold text-foreground">{value}</p></div>;
}
```

### FILE: src\app\(dashboard)\teachers\finance\page.tsx
```tsx
"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, ArrowRight, Calculator, PlusCircle, Wallet } from "lucide-react";
import { useUIStore } from "@/stores/ui-store";
import { t } from "@/lib/locale";
import { formatCurrencyEgp } from "@/lib/formatters";
import { getTeacherDetails } from "@/services/relations.service";
import { listTeachers } from "@/services/teachers.service";
import { computeTeacherFinanceSummary, getTeacherFinanceConfig } from "@/services/teacher-finance.service";
import { LoadingState, PageStateCard } from "@/components/shared/page-state";
import type { TeacherDetails } from "@/types/crm";

interface TeacherFinanceView {
  teacher: TeacherDetails;
  weeklyEstimated: number;
  monthlyEstimated: number;
  averagePerSession: number;
  linkedSessions: number;
}

export default function TeachersFinancePage() {
  const locale = useUIStore((state) => state.locale);
  const isAr = locale === "ar";
  const [items, setItems] = useState<TeacherFinanceView[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    (async () => {
      const teachers = await listTeachers();
      const details = (await Promise.all(teachers.map((teacher) => getTeacherDetails(teacher.id)))).filter(Boolean) as TeacherDetails[];
      if (!mounted) return;
      const next = details.map((teacher) => {
        const config = getTeacherFinanceConfig(teacher.id);
        const summary = computeTeacherFinanceSummary(teacher.linkedSessions, config);
        return {
          teacher,
          weeklyEstimated: summary.weeklyEstimated,
          monthlyEstimated: summary.monthlyEstimated,
          averagePerSession: summary.averagePerSession,
          linkedSessions: summary.linkedSessions,
        };
      });
      setItems(next.sort((a, b) => b.monthlyEstimated - a.monthlyEstimated || a.teacher.fullName.localeCompare(b.teacher.fullName, "ar")));
      setLoading(false);
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const totals = useMemo(() => ({
    weekly: items.reduce((sum, item) => sum + item.weeklyEstimated, 0),
    monthly: items.reduce((sum, item) => sum + item.monthlyEstimated, 0),
    sessions: items.reduce((sum, item) => sum + item.linkedSessions, 0),
  }), [items]);

  if (loading) {
    return (
      <LoadingState
        titleAr="Ø¬Ø§Ø±Ù ØªØ­Ù…ÙŠÙ„ Ø§Ù„Ø­Ø³Ø§Ø¨Ø§Øª Ø§Ù„Ù…Ø§Ù„ÙŠØ© Ù„Ù„Ù…Ø¯Ø±Ø³ÙŠÙ†"
        titleEn="Loading teachers finance"
        descriptionAr="ÙŠØªÙ… Ø§Ù„Ø¢Ù† ØªØ¬Ù‡ÙŠØ² Ø§Ù„ØªÙ‚Ø¯ÙŠØ± Ø§Ù„Ø£Ø³Ø¨ÙˆØ¹ÙŠ ÙˆØ§Ù„Ø´Ù‡Ø±ÙŠ Ù„Ù„Ù…Ø¯Ø±Ø³ÙŠÙ† Ø¨Ø­Ø³Ø¨ Ø§Ù„Ø­ØµØµ ÙˆØ§Ù„ØªØ±Ø§ÙƒØ§Øª Ø§Ù„Ù…Ø±ØªØ¨Ø·Ø©."
        descriptionEn="Preparing weekly and monthly teacher estimates based on linked sessions and tracks."
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/teachers" className="rounded-xl p-2 text-muted-foreground transition-colors hover:bg-muted">
          {isAr ? <ArrowRight size={18} /> : <ArrowLeft size={18} />}
        </Link>
        <div className="flex-1">
          <h1 className="flex items-center gap-2 text-2xl font-bold text-foreground"><Wallet size={26} className="text-brand-600" />{t(locale, "Ø­Ø³Ø§Ø¨Ø§Øª Ø§Ù„Ù…Ø¯Ø±Ø³ÙŠÙ†", "Teacher accounts")}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{t(locale, "ØªÙ‚Ø¯ÙŠØ± Ø£Ø³Ø¨ÙˆØ¹ÙŠ ÙˆØ´Ù‡Ø±ÙŠ Ù„Ù…Ø³ØªØ­Ù‚Ø§Øª Ø§Ù„Ù…Ø¯Ø±Ø³ÙŠÙ† Ø¨Ù†Ø§Ø¡Ù‹ Ø¹Ù„Ù‰ Ø§Ù„Ø­ØµØµ Ø§Ù„Ù…Ø±ØªØ¨Ø·Ø© ÙˆØ¥Ø¹Ø¯Ø§Ø¯Ø§Øª ÙƒÙ„ Ù…Ø¯Ø±Ø³.", "Weekly and monthly estimates for teacher dues based on linked sessions and each teacher's pay settings.")}</p>
        </div>
        <Link href="/teachers/new" className="inline-flex items-center gap-2 rounded-xl bg-brand-700 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-600"><PlusCircle size={16} />{t(locale, "Ø¥Ø¶Ø§ÙØ© Ù…Ø¯Ø±Ø³", "Add teacher")}</Link>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <SummaryCard locale={locale} icon={Wallet} labelAr="Ø¥Ø¬Ù…Ø§Ù„ÙŠ Ø£Ø³Ø¨ÙˆØ¹ÙŠ" labelEn="Weekly total" value={formatCurrencyEgp(totals.weekly, locale)} />
        <SummaryCard locale={locale} icon={Wallet} labelAr="Ø¥Ø¬Ù…Ø§Ù„ÙŠ Ø´Ù‡Ø±ÙŠ ØªÙ‚Ø¯ÙŠØ±ÙŠ" labelEn="Estimated monthly total" value={formatCurrencyEgp(totals.monthly, locale)} />
        <SummaryCard locale={locale} icon={Calculator} labelAr="Ø¥Ø¬Ù…Ø§Ù„ÙŠ Ø§Ù„Ø­ØµØµ" labelEn="Total sessions" value={String(totals.sessions)} />
      </div>

      {items.length === 0 ? (
        <PageStateCard
          variant="default"
          titleAr="Ù„Ø§ ØªÙˆØ¬Ø¯ Ø¨ÙŠØ§Ù†Ø§Øª Ù…Ø§Ù„ÙŠØ© Ù„Ù„Ù…Ø¯Ø±Ø³ÙŠÙ† Ø¨Ø¹Ø¯"
          titleEn="No teacher finance data yet"
          descriptionAr="Ø£Ø¶Ù Ù…Ø¯Ø±Ø³ÙŠÙ† ÙˆØ§Ø±Ø¨Ø·Ù‡Ù… Ø¨Ø­ØµØµ Ø«Ù… Ø­Ø¯Ù‘Ø¯ Ø¥Ø¹Ø¯Ø§Ø¯Ø§Øª Ø§Ù„Ù…Ù‚Ø§Ø¨Ù„ Ø§Ù„Ù…Ø§Ù„ÙŠ Ù…Ù† Ù…Ù„Ù ÙƒÙ„ Ù…Ø¯Ø±Ø³."
          descriptionEn="Add teachers, link them to sessions, then define payout settings from each teacher profile."
          actionHref="/teachers"
          actionLabelAr="Ø§Ù„Ø¹ÙˆØ¯Ø© Ø¥Ù„Ù‰ Ø§Ù„Ù…Ø¯Ø±Ø³ÙŠÙ†"
          actionLabelEn="Back to teachers"
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
          {items.map((item) => (
            <Link key={item.teacher.id} href={`/teachers/${item.teacher.id}`} className="rounded-2xl border border-border bg-card p-5 transition-all hover:-translate-y-0.5 hover:shadow-brand-md">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-lg font-bold text-foreground">{item.teacher.fullName}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{item.teacher.linkedStudents.length} {t(locale, "Ø·Ù„Ø§Ø¨", "students")} â€¢ {item.linkedSessions} {t(locale, "Ø­ØµØµ", "sessions")}</p>
                </div>
                <span className="rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-700 dark:bg-brand-950 dark:text-brand-300">{formatCurrencyEgp(item.monthlyEstimated, locale)}</span>
              </div>
              <div className="mt-4 grid grid-cols-3 gap-3 text-center text-xs">
                <MiniMetric locale={locale} labelAr="Ø£Ø³Ø¨ÙˆØ¹ÙŠ" labelEn="Weekly" value={formatCurrencyEgp(item.weeklyEstimated, locale)} />
                <MiniMetric locale={locale} labelAr="Ø´Ù‡Ø±ÙŠ" labelEn="Monthly" value={formatCurrencyEgp(item.monthlyEstimated, locale)} />
                <MiniMetric locale={locale} labelAr="Ù…ØªÙˆØ³Ø· Ø§Ù„Ø­ØµØ©" labelEn="Avg session" value={formatCurrencyEgp(item.averagePerSession, locale)} />
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

function SummaryCard({ locale, icon: Icon, labelAr, labelEn, value }: { locale: "ar" | "en"; icon: typeof Wallet; labelAr: string; labelEn: string; value: string }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <div className="flex items-center gap-2 text-sm text-muted-foreground"><Icon size={16} />{t(locale, labelAr, labelEn)}</div>
      <p className="mt-3 text-2xl font-bold text-foreground">{value}</p>
    </div>
  );
}

function MiniMetric({ locale, labelAr, labelEn, value }: { locale: "ar" | "en"; labelAr: string; labelEn: string; value: string }) {
  return <div className="rounded-xl bg-muted/40 p-3"><p className="text-[11px] text-muted-foreground">{t(locale, labelAr, labelEn)}</p><p className="mt-1 font-bold text-foreground">{value}</p></div>;
}
```

### FILE: src\app\(dashboard)\teachers\new\page.tsx
```tsx
"use client";

import { useRouter } from "next/navigation";
import { TeacherForm } from "@/components/teachers/teacher-form";
import { createTeacher } from "@/services/teachers.service";

export default function NewTeacherPage() {
  const router = useRouter();

  return (
    <TeacherForm
      title="Ø¥Ø¶Ø§ÙØ© Ù…Ø¯Ø±Ø³"
      description="Ø£Ù†Ø´Ø¦ Ù…Ù„Ù Ù…Ø¯Ø±Ø³ Ø­Ù‚ÙŠÙ‚ÙŠ ÙˆØ§Ø±Ø¨Ø·Ù‡ Ù…Ø¨Ø§Ø´Ø±Ø© Ø¨Ø§Ù„Ù…Ø³Ø§Ø±Ø§Øª Ø§Ù„ØªÙŠ ÙŠØ¯Ø±Ù‘Ø³Ù‡Ø§ Ø¯Ø§Ø®Ù„ Ø§Ù„Ù†Ø¸Ø§Ù…"
      submitLabel="Ø­ÙØ¸ Ø§Ù„Ù…Ø¯Ø±Ø³"
      successMessage="ØªÙ… Ø¥Ù†Ø´Ø§Ø¡ Ù…Ù„Ù Ø§Ù„Ù…Ø¯Ø±Ø³ Ø¨Ù†Ø¬Ø§Ø­"
      onSubmit={async (payload) => {
        const created = await createTeacher(payload);
        router.push(`/teachers/${created.id}`);
      }}
      cancelHref="/teachers"
    />
  );
}
```

### FILE: src\app\(dashboard)\teachers\[id]\page.tsx
```tsx
```
## 7. COMPONENTS

### FILE: src\components\layout\dashboard-shell.tsx
```tsx
"use client";

import { useUIStore } from "@/stores/ui-store";
import { cn } from "@/lib/utils";
import { Sidebar } from "./sidebar";
import { TopNavbar } from "./top-navbar";
import { MobileNav } from "./mobile-nav";

interface DashboardShellProps {
  children: React.ReactNode;
}

export function DashboardShell({ children }: DashboardShellProps) {
  const { sidebarOpen, locale } = useUIStore();
  const isAr = locale === "ar";

  return (
    <div className="min-h-screen bg-background" dir={isAr ? "rtl" : "ltr"}>
      <Sidebar />
      <MobileNav />

      <main
        className={cn(
          "min-h-screen transition-all duration-300",
          isAr
            ? sidebarOpen
              ? "lg:mr-[260px]"
              : "lg:mr-[72px]"
            : sidebarOpen
              ? "lg:ml-[260px]"
              : "lg:ml-[72px]",
        )}
      >
        <TopNavbar />
        <div className="p-4 lg:p-6">{children}</div>
      </main>
    </div>
  );
}
```

### FILE: src\components\layout\global-search.tsx
```tsx
"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import {
  CalendarDays,
  GraduationCap,
  Search,
  UserCircle,
  Users,
  Wallet,
  X,
} from "lucide-react";
import { formatCurrencyEgp, formatCourseLabel } from "@/lib/formatters";
import { t } from "@/lib/locale";
import { listLeads } from "@/services/leads.service";
import { listParents } from "@/services/parents.service";
import { listPayments } from "@/services/payments.service";
import { listScheduleSessions } from "@/services/schedule.service";
import { listStudents } from "@/services/students.service";
import { listTeachers } from "@/services/teachers.service";
import { useUIStore } from "@/stores/ui-store";
import type {
  LeadListItem,
  ParentListItem,
  PaymentItem,
  ScheduleSessionItem,
  StudentListItem,
  TeacherListItem,
} from "@/types/crm";

type SearchScope = "all" | "leads" | "students" | "parents" | "teachers" | "payments" | "schedule";

interface GlobalSearchProps {
  open: boolean;
  onClose: () => void;
}

const SCOPE_ORDER: SearchScope[] = ["all", "leads", "students", "parents", "teachers", "payments", "schedule"];

function includesAny(haystack: Array<string | null | undefined>, query: string): boolean {
  const normalizedQuery = query.trim().toLowerCase();
  return haystack.some((value) => value?.toLowerCase().includes(normalizedQuery));
}

export function GlobalSearch({ open, onClose }: GlobalSearchProps) {
  const locale = useUIStore((state) => state.locale);
  const isAr = locale === "ar";

  const [query, setQuery] = useState("");
  const [scope, setScope] = useState<SearchScope>("all");
  const [loading, setLoading] = useState(false);
  const [leads, setLeads] = useState<LeadListItem[]>([]);
  const [students, setStudents] = useState<StudentListItem[]>([]);
  const [parents, setParents] = useState<ParentListItem[]>([]);
  const [teachers, setTeachers] = useState<TeacherListItem[]>([]);
  const [payments, setPayments] = useState<PaymentItem[]>([]);
  const [schedule, setSchedule] = useState<ScheduleSessionItem[]>([]);

  useEffect(() => {
    if (!open) return;

    let mounted = true;
    async function load() {
      setLoading(true);
      const [leadItems, studentItems, parentItems, teacherItems, paymentItems, scheduleItems] = await Promise.all([
        listLeads(),
        listStudents(),
        listParents(),
        listTeachers(),
        listPayments(),
        listScheduleSessions(),
      ]);

      if (!mounted) return;
      setLeads(leadItems);
      setStudents(studentItems);
      setParents(parentItems);
      setTeachers(teacherItems);
      setPayments(paymentItems);
      setSchedule(scheduleItems);
      setLoading(false);
    }

    void load();
    return () => {
      mounted = false;
    };
  }, [open]);

  useEffect(() => {
    if (!open) {
      setQuery("");
      setScope("all");
    }
  }, [open]);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        if (open) onClose();
      }
      if (event.key === "Escape" && open) onClose();
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose, open]);

  const filtered = useMemo(() => {
    const normalized = query.trim();
    const canShowAll = normalized.length === 0;

    const leadResults = (scope === "all" || scope === "leads")
      ? leads.filter((item) => canShowAll || includesAny([item.childName, item.parentName, item.parentPhone, item.assignedToName], normalized)).slice(0, 6)
      : [];

    const studentResults = (scope === "all" || scope === "students")
      ? students.filter((item) => canShowAll || includesAny([item.fullName, item.parentName, item.parentPhone, item.className], normalized)).slice(0, 6)
      : [];

    const parentResults = (scope === "all" || scope === "parents")
      ? parents.filter((item) => canShowAll || includesAny([item.fullName, item.phone, item.whatsapp, item.email, item.city], normalized)).slice(0, 6)
      : [];

    const teacherResults = (scope === "all" || scope === "teachers")
      ? teachers.filter((item) => canShowAll || includesAny([item.fullName, item.phone, item.email], normalized)).slice(0, 6)
      : [];

    const paymentResults = (scope === "all" || scope === "payments")
      ? payments.filter((item) => canShowAll || includesAny([item.studentName, item.parentName, item.status, item.method], normalized)).slice(0, 6)
      : [];

    const scheduleResults = (scope === "all" || scope === "schedule")
      ? schedule.filter((item) => canShowAll || includesAny([item.className, item.teacher, item.startTime, item.endTime], normalized)).slice(0, 6)
      : [];

    return {
      leadResults,
      studentResults,
      parentResults,
      teacherResults,
      paymentResults,
      scheduleResults,
      total:
        leadResults.length +
        studentResults.length +
        parentResults.length +
        teacherResults.length +
        paymentResults.length +
        scheduleResults.length,
    };
  }, [leads, parents, payments, query, schedule, scope, students, teachers]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-start justify-center bg-black/40 px-4 py-10 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-4xl rounded-3xl border border-border bg-card shadow-2xl" onClick={(event) => event.stopPropagation()}>
        <div className="flex items-center gap-3 border-b border-border p-4">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-brand-50 text-brand-700 dark:bg-brand-950 dark:text-brand-300">
            <Search size={20} />
          </div>
          <div className="flex-1">
            <input
              autoFocus
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={t(locale, "Ø§Ø¨Ø­Ø« Ø¹Ù† Ø¹Ù…ÙŠÙ„ Ø£Ùˆ Ø·Ø§Ù„Ø¨ Ø£Ùˆ Ø¯ÙØ¹Ø© Ø£Ùˆ ÙƒÙ„Ø§Ø³...", "Search leads, students, payments, or classes...")}
              className="w-full bg-transparent text-base text-foreground outline-none placeholder:text-muted-foreground"
            />
            <p className="mt-1 text-xs text-muted-foreground">{t(locale, "Ø§Ø®ØªØµØ§Ø± Ù„ÙˆØ­Ø© Ø§Ù„Ù…ÙØ§ØªÙŠØ­: Ctrl/Cmd + K", "Keyboard shortcut: Ctrl/Cmd + K")}</p>
          </div>
          <button onClick={onClose} className="rounded-xl p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground" aria-label={t(locale, "Ø¥ØºÙ„Ø§Ù‚", "Close")}>
            <X size={18} />
          </button>
        </div>

        <div className="flex flex-wrap gap-2 border-b border-border px-4 py-3">
          {SCOPE_ORDER.map((item) => (
            <button
              key={item}
              onClick={() => setScope(item)}
              className={item === scope ? "rounded-full bg-brand-700 px-3 py-1.5 text-xs font-semibold text-white" : "rounded-full bg-muted px-3 py-1.5 text-xs font-semibold text-muted-foreground transition-colors hover:text-foreground"}
            >
              {getScopeLabel(item, locale)}
            </button>
          ))}
        </div>

        <div className="max-h-[70vh] overflow-y-auto p-4">
          {loading ? (
            <div className="rounded-2xl border border-border bg-background p-10 text-center text-sm text-muted-foreground">
              {t(locale, "Ø¬Ø§Ø±Ù ØªØ¬Ù‡ÙŠØ² Ù†ØªØ§Ø¦Ø¬ Ø§Ù„Ø¨Ø­Ø«...", "Preparing search results...")}
            </div>
          ) : filtered.total === 0 ? (
            <div className="rounded-2xl border border-dashed border-border bg-background p-10 text-center text-sm text-muted-foreground">
              {t(locale, "Ù„Ø§ ØªÙˆØ¬Ø¯ Ù†ØªØ§Ø¦Ø¬ Ù…Ø·Ø§Ø¨Ù‚Ø© Ø§Ù„Ø¢Ù†", "No matching results right now")}
            </div>
          ) : (
            <div className="space-y-5">
              <ResultSection title={t(locale, "Ø§Ù„Ø¹Ù…Ù„Ø§Ø¡ Ø§Ù„Ù…Ø­ØªÙ…Ù„ÙˆÙ†", "Leads")} count={filtered.leadResults.length}>
                {filtered.leadResults.map((item) => (
                  <ResultLink key={item.id} href={`/leads/${item.id}`} title={item.childName} subtitle={`${item.parentName} â€” ${item.parentPhone}`} meta={item.assignedToName} icon={Users} onSelect={onClose} />
                ))}
              </ResultSection>

              <ResultSection title={t(locale, "Ø§Ù„Ø·Ù„Ø§Ø¨", "Students")} count={filtered.studentResults.length}>
                {filtered.studentResults.map((item) => (
                  <ResultLink key={item.id} href={`/students/${item.id}`} title={item.fullName} subtitle={`${item.parentName} â€” ${item.parentPhone}`} meta={item.className ?? t(locale, "ØºÙŠØ± Ù…Ø³Ø¬Ù„", "Not assigned")} icon={GraduationCap} onSelect={onClose} />
                ))}
              </ResultSection>

              <ResultSection title={t(locale, "Ø£ÙˆÙ„ÙŠØ§Ø¡ Ø§Ù„Ø£Ù…ÙˆØ±", "Parents")} count={filtered.parentResults.length}>
                {filtered.parentResults.map((item) => (
                  <ResultLink key={item.id} href={`/parents/${item.id}`} title={item.fullName} subtitle={item.phone} meta={item.city ?? t(locale, "ØºÙŠØ± Ù…Ø­Ø¯Ø¯Ø©", "Not set")} icon={UserCircle} onSelect={onClose} />
                ))}
              </ResultSection>

              <ResultSection title={t(locale, "Ø§Ù„Ù…Ø¯Ø±Ø³ÙˆÙ†", "Teachers")} count={filtered.teacherResults.length}>
                {filtered.teacherResults.map((item) => (
                  <ResultLink key={item.id} href={`/teachers/${item.id}`} title={item.fullName} subtitle={item.email ?? item.phone ?? t(locale, "ØºÙŠØ± Ù…ØªÙˆÙØ±", "N/A")} meta={`${item.classesCount} ${t(locale, "ÙƒÙ„Ø§Ø³", "classes")}`} icon={Users} onSelect={onClose} />
                ))}
              </ResultSection>

              <ResultSection title={t(locale, "Ø§Ù„Ù…Ø¯ÙÙˆØ¹Ø§Øª", "Payments")} count={filtered.paymentResults.length}>
                {filtered.paymentResults.map((item) => (
                  <ResultLink key={item.id} href={`/payments/${item.id}`} title={item.studentName} subtitle={item.parentName} meta={formatCurrencyEgp(item.amount, locale)} icon={Wallet} onSelect={onClose} />
                ))}
              </ResultSection>

              <ResultSection title={t(locale, "Ø§Ù„Ø¬Ø¯ÙˆÙ„", "Schedule")} count={filtered.scheduleResults.length}>
                {filtered.scheduleResults.map((item) => (
                  <ResultLink key={item.id} href={`/schedule/${item.id}`} title={item.className} subtitle={`${item.teacher} â€” ${item.startTime} â†’ ${item.endTime}`} meta={formatCourseLabel(item.course, locale)} icon={CalendarDays} onSelect={onClose} />
                ))}
              </ResultSection>
            </div>
          )}
        </div>

        <div className="border-t border-border px-4 py-3 text-xs text-muted-foreground">
          {isAr ? "Ù†ØªØ§Ø¦Ø¬ Ø³Ø±ÙŠØ¹Ø© Ù„Ù„ØªÙ†Ù‚Ù„ Ø¯Ø§Ø®Ù„ Ø§Ù„Ù†Ø¸Ø§Ù…" : "Quick navigation results across the CRM"}
        </div>
      </div>
    </div>
  );
}

function ResultSection({ title, count, children }: { title: string; count: number; children: ReactNode }) {
  if (!count) return null;
  return (
    <section className="space-y-2">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-foreground">{title}</h3>
        <span className="text-xs text-muted-foreground">{count}</span>
      </div>
      <div className="grid grid-cols-1 gap-2 md:grid-cols-2">{children}</div>
    </section>
  );
}

function ResultLink({
  href,
  title,
  subtitle,
  meta,
  icon: Icon,
  onSelect,
}: {
  href: string;
  title: string;
  subtitle: string;
  meta: string;
  icon: typeof Search;
  onSelect: () => void;
}) {
  return (
    <Link href={href} onClick={onSelect} className="flex items-center gap-3 rounded-2xl border border-border bg-background p-3 transition-all hover:-translate-y-0.5 hover:border-brand-200 hover:shadow-sm dark:hover:border-brand-900">
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
        <Icon size={18} />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-3">
          <p className="truncate text-sm font-semibold text-foreground">{title}</p>
          <span className="shrink-0 text-[11px] text-muted-foreground">{meta}</span>
        </div>
        <p className="truncate text-xs text-muted-foreground">{subtitle}</p>
      </div>
    </Link>
  );
}

function getScopeLabel(scope: SearchScope, locale: "ar" | "en"): string {
  const map = {
    all: locale === "ar" ? "Ø§Ù„ÙƒÙ„" : "All",
    leads: locale === "ar" ? "Ø§Ù„Ø¹Ù…Ù„Ø§Ø¡" : "Leads",
    students: locale === "ar" ? "Ø§Ù„Ø·Ù„Ø§Ø¨" : "Students",
    parents: locale === "ar" ? "Ø£ÙˆÙ„ÙŠØ§Ø¡ Ø§Ù„Ø£Ù…ÙˆØ±" : "Parents",
    teachers: locale === "ar" ? "Ø§Ù„Ù…Ø¯Ø±Ø³ÙˆÙ†" : "Teachers",
    payments: locale === "ar" ? "Ø§Ù„Ù…Ø¯ÙÙˆØ¹Ø§Øª" : "Payments",
    schedule: locale === "ar" ? "Ø§Ù„Ø¬Ø¯ÙˆÙ„" : "Schedule",
  } as const;

  return map[scope];
}
```

### FILE: src\components\layout\mobile-nav.tsx
```tsx
"use client";

import { usePathname } from "next/navigation";
import { useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { X, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";
import { useUIStore } from "@/stores/ui-store";
import { useCurrentUser } from "@/providers/user-provider";
import { signOutClient } from "@/lib/actions/auth.actions";
import { navigationGroups } from "@/config/navigation";
import { ROLE_PERMISSIONS } from "@/config/roles";

export function MobileNav() {
  const pathname = usePathname();
  const { mobileSidebarOpen, setMobileSidebarOpen, locale } = useUIStore();
  const isAr = locale === "ar";
  const user = useCurrentUser();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const displayName = isAr ? user.fullNameAr : user.fullName;
  const initial = user.fullName.charAt(0).toUpperCase();
  const roleLabel = isAr ? ROLE_PERMISSIONS[user.role].labelAr : ROLE_PERMISSIONS[user.role].labelEn;

  const filteredGroups = navigationGroups
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => item.roles.includes(user.role)),
    }))
    .filter((group) => group.items.length > 0);

  const isActive = (href: string): boolean => {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  };

  const handleClose = () => setMobileSidebarOpen(false);
  const handleLogout = async () => {
    setIsLoggingOut(true);
    await signOutClient();
  };

  return (
    <AnimatePresence>
      {mobileSidebarOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm lg:hidden"
            onClick={handleClose}
          />

          <motion.div
            initial={{ x: isAr ? "100%" : "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: isAr ? "100%" : "-100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className={cn(
              "fixed top-0 z-50 h-screen w-[280px] bg-brand-950 lg:hidden flex flex-col",
              isAr ? "right-0" : "left-0",
            )}
          >
            <div className="flex h-16 items-center justify-between border-b border-white/10 px-4">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl" style={{ background: "#4338CA" }}>
                  <span className="text-sm font-bold text-white">SR</span>
                </div>
                <div>
                  <p className="text-sm font-bold text-white">Skidy Rein</p>
                  <p className="text-[10px] text-white/50">{isAr ? "Ù„ÙˆØ­Ø© Ø§Ù„ØªØ­ÙƒÙ…" : "Dashboard"}</p>
                </div>
              </div>

              <button onClick={handleClose} className="rounded-xl p-2 text-white/40 transition-colors hover:bg-white/10 hover:text-white">
                <X size={20} />
              </button>
            </div>

            <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
              {filteredGroups.map((group) => (
                <div key={group.labelEn}>
                  <p className={cn("mb-2 px-3 text-[10px] font-semibold uppercase tracking-wider text-white/40", !isAr && "text-left")}>
                    {isAr ? group.labelAr : group.labelEn}
                  </p>

                  <div className="space-y-1">
                    {group.items.map((item) => {
                      const active = isActive(item.href);
                      const Icon = item.icon;

                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          onClick={handleClose}
                          className={cn(
                            "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-all duration-200",
                            active
                              ? "bg-brand-700 text-white shadow-lg shadow-brand-700/30"
                              : "text-white/60 hover:bg-white/8 hover:text-white",
                          )}
                        >
                          <Icon size={20} className={cn(active ? "text-cream-200" : "text-white/50")} />
                          <span>{isAr ? item.titleAr : item.titleEn}</span>

                          {item.badge && item.badge > 0 && (
                            <span className={cn("bg-danger-500 text-white text-[10px] font-bold rounded-full px-1.5 py-0.5", isAr ? "mr-auto" : "ml-auto")}>
                              {item.badge}
                            </span>
                          )}
                        </Link>
                      );
                    })}
                  </div>
                </div>
              ))}
            </nav>

            <div className="border-t border-white/10 p-3">
              <div className="flex items-center gap-3 rounded-xl bg-white/5 p-2">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg" style={{ background: "#4338CA" }}>
                  <span className="text-xs font-bold text-white">{initial}</span>
                </div>

                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-semibold text-white">{displayName}</p>
                  <p className="text-[10px] text-white/40">{roleLabel}</p>
                </div>

                <button
                  onClick={handleLogout}
                  disabled={isLoggingOut}
                  className={cn("text-white/30 transition-colors hover:text-red-400", isLoggingOut && "cursor-not-allowed opacity-50")}
                  title={isAr ? "ØªØ³Ø¬ÙŠÙ„ Ø§Ù„Ø®Ø±ÙˆØ¬" : "Sign out"}
                >
                  {isLoggingOut ? <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" /> : <LogOut size={16} />}
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
```

### FILE: src\components\layout\sidebar.tsx
```tsx
"use client";

import { usePathname } from "next/navigation";
import { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";
import { useUIStore } from "@/stores/ui-store";
import { useCurrentUser } from "@/providers/user-provider";
import { signOutClient } from "@/lib/actions/auth.actions";
import { navigationGroups } from "@/config/navigation";
import { ROLE_PERMISSIONS } from "@/config/roles";

const sidebarVariants = {
  expanded: { width: 260 },
  collapsed: { width: 72 },
};

const textVariants = {
  show: { opacity: 1, x: 0, display: "block" },
  hide: { opacity: 0, x: -10, transitionEnd: { display: "none" } },
};

export function Sidebar() {
  const pathname = usePathname();
  const { sidebarOpen, toggleSidebar, locale } = useUIStore();
  const isAr = locale === "ar";
  const user = useCurrentUser();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const displayName = isAr ? user.fullNameAr : user.fullName;
  const initial = user.fullName.charAt(0).toUpperCase();
  const roleLabel = isAr ? ROLE_PERMISSIONS[user.role].labelAr : ROLE_PERMISSIONS[user.role].labelEn;

  const filteredGroups = navigationGroups
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => item.roles.includes(user.role)),
    }))
    .filter((group) => group.items.length > 0);

  const isActive = (href: string): boolean => {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  };

  const handleLogout = async () => {
    setIsLoggingOut(true);
    await signOutClient();
  };

  return (
    <motion.aside
      variants={sidebarVariants}
      animate={sidebarOpen ? "expanded" : "collapsed"}
      transition={{ duration: 0.3, ease: "easeInOut" }}
      className={cn(
        "hidden lg:flex fixed top-0 h-screen z-40 flex-col bg-brand-950",
        isAr ? "right-0 border-l border-white/10" : "left-0 border-r border-white/10",
      )}
    >
      <div className="flex h-16 items-center gap-3 border-b border-white/10 px-4">
        <div className="h-9 w-9 shrink-0 rounded-xl flex items-center justify-center" style={{ background: "#4338CA" }}>
          <span className="text-sm font-bold text-white">SR</span>
        </div>

        <AnimatePresence>
          {sidebarOpen && (
            <motion.div variants={textVariants} initial="hide" animate="show" exit="hide" transition={{ duration: 0.2 }}>
              <p className="text-sm font-bold leading-tight text-white">Skidy Rein</p>
              <p className="text-[10px] text-white/50">{isAr ? "Ù„ÙˆØ­Ø© Ø§Ù„ØªØ­ÙƒÙ…" : "Dashboard"}</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <nav className="flex-1 overflow-y-auto px-2 py-4 space-y-6">
        {filteredGroups.map((group) => (
          <div key={group.labelEn}>
            <AnimatePresence>
              {sidebarOpen && (
                <motion.p
                  variants={textVariants}
                  initial="hide"
                  animate="show"
                  exit="hide"
                  className={cn(
                    "mb-2 px-3 text-[10px] font-semibold uppercase tracking-wider text-white/40",
                    !isAr && "text-left",
                  )}
                >
                  {isAr ? group.labelAr : group.labelEn}
                </motion.p>
              )}
            </AnimatePresence>

            <div className="space-y-1">
              {group.items.map((item) => {
                const active = isActive(item.href);
                const Icon = item.icon;

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "group relative flex items-center gap-3 rounded-xl text-sm transition-all duration-200",
                      sidebarOpen ? "px-3 py-2.5" : "justify-center px-0 py-2.5",
                      active
                        ? "bg-brand-700 text-white shadow-lg shadow-brand-700/30"
                        : "text-white/60 hover:bg-white/8 hover:text-white",
                    )}
                  >
                    <Icon className={cn("shrink-0 transition-colors", active ? "text-cream-200" : "text-white/50 group-hover:text-white")} size={20} />

                    <AnimatePresence>
                      {sidebarOpen && (
                        <motion.span variants={textVariants} initial="hide" animate="show" exit="hide" transition={{ duration: 0.15 }}>
                          {isAr ? item.titleAr : item.titleEn}
                        </motion.span>
                      )}
                    </AnimatePresence>

                    {item.badge && item.badge > 0 && (
                      <span
                        className={cn(
                          "bg-danger-500 text-white text-[10px] font-bold rounded-full",
                          sidebarOpen
                            ? isAr
                              ? "mr-auto px-1.5 py-0.5"
                              : "ml-auto px-1.5 py-0.5"
                            : "absolute -top-1 -left-1 flex h-4 w-4 items-center justify-center",
                        )}
                      >
                        {item.badge}
                      </span>
                    )}

                    {!sidebarOpen && (
                      <div
                        className={cn(
                          "pointer-events-none absolute px-2 py-1 text-xs whitespace-nowrap rounded-lg bg-gray-900 text-white opacity-0 transition-opacity duration-200 group-hover:opacity-100",
                          isAr ? "right-full mr-2" : "left-full ml-2",
                        )}
                      >
                        {isAr ? item.titleAr : item.titleEn}
                      </div>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      <div className="space-y-2 border-t border-white/10 p-2">
        <button
          onClick={toggleSidebar}
          className={cn(
            "flex w-full items-center gap-2 rounded-xl py-2 text-white/40 transition-colors hover:bg-white/8 hover:text-white",
            sidebarOpen ? "px-3" : "justify-center",
          )}
        >
          {isAr ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
          {sidebarOpen && (
            <motion.span variants={textVariants} initial="hide" animate="show" exit="hide" className="text-xs">
              {isAr ? "Ø·ÙŠ Ø§Ù„Ù‚Ø§Ø¦Ù…Ø©" : "Collapse"}
            </motion.span>
          )}
        </button>

        <div className={cn("flex items-center gap-3 rounded-xl bg-white/5 p-2", !sidebarOpen && "justify-center") }>
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl" style={{ background: "#4338CA" }}>
            <span className="text-xs font-bold text-white">{initial}</span>
          </div>

          <AnimatePresence>
            {sidebarOpen && (
              <motion.div variants={textVariants} initial="hide" animate="show" exit="hide" className="min-w-0 flex-1">
                <p className="truncate text-xs font-semibold text-white">{displayName}</p>
                <p className="text-[10px] text-white/40">{roleLabel}</p>
              </motion.div>
            )}
          </AnimatePresence>

          {sidebarOpen && (
            <button
              onClick={handleLogout}
              disabled={isLoggingOut}
              className={cn("text-white/30 transition-colors hover:text-red-400", isLoggingOut && "cursor-not-allowed opacity-50")}
              title={isAr ? "ØªØ³Ø¬ÙŠÙ„ Ø§Ù„Ø®Ø±ÙˆØ¬" : "Sign out"}
            >
              {isLoggingOut ? <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" /> : <LogOut size={16} />}
            </button>
          )}
        </div>
      </div>
    </motion.aside>
  );
}
```

### FILE: src\components\layout\top-navbar.tsx
```tsx

"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTheme } from "next-themes";
import {
  Search,
  Bell,
  Moon,
  Sun,
  Globe,
  Menu,
  CheckCheck,
  CheckCircle2,
  Info,
  TriangleAlert,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useUIStore } from "@/stores/ui-store";
import { useCurrentUser } from "@/providers/user-provider";
import { navigationGroups } from "@/config/navigation";
import { GlobalSearch } from "@/components/layout/global-search";
import { getActionCenterData } from "@/services/operations.service";
import type { AppNotificationItem } from "@/types/crm";

type Notification = AppNotificationItem & { read: boolean };

function usePageTitle(): { ar: string; en: string } {
  const pathname = usePathname();
  for (const group of navigationGroups) {
    for (const item of group.items) {
      if (item.href === "/" && pathname === "/") return { ar: item.titleAr, en: item.titleEn };
      if (item.href !== "/" && pathname.startsWith(item.href)) return { ar: item.titleAr, en: item.titleEn };
    }
  }
  return { ar: "Ù„ÙˆØ­Ø© Ø§Ù„ØªØ­ÙƒÙ…", en: "Dashboard" };
}

function mapNotifications(items: AppNotificationItem[]): Notification[] {
  return items.map((item) => ({
    ...item,
    read: item.readDefault ?? false,
  }));
}

export function TopNavbar() {
  const { theme, setTheme } = useTheme();
  const { locale, setLocale, toggleMobileSidebar } = useUIStore();
  const pageTitle = usePageTitle();
  const isAr = locale === "ar";
  const user = useCurrentUser();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let isMounted = true;
    async function loadNotifications() {
      const data = await getActionCenterData(
        {
          role: user.role,
          fullName: user.fullName,
          fullNameAr: user.fullNameAr,
        },
        locale,
      );
      if (isMounted) {
        setNotifications(mapNotifications(data.notifications));
      }
    }
    void loadNotifications();
    return () => {
      isMounted = false;
    };
  }, [locale, user.fullName, user.fullNameAr, user.role]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
    }
    if (showNotifications) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showNotifications]);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setShowSearch(true);
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const markAllAsRead = () => setNotifications((prev) => prev.map((item) => ({ ...item, read: true })));
  const markAsRead = (id: string) => setNotifications((prev) => prev.map((item) => (item.id === id ? { ...item, read: true } : item)));
  const visibleUnreadCount = notifications.filter((item) => !item.read).length;

  function typeIcon(type: Notification["type"]): LucideIcon {
    if (type === "warning") return TriangleAlert;
    if (type === "success") return CheckCircle2;
    return Info;
  }

  return (
    <>
      <header className={cn("sticky top-0 z-30 flex h-16 items-center justify-between gap-4 border-b border-border px-4 lg:px-6", "glass")}>
        <div className="flex items-center gap-3">
          <button onClick={toggleMobileSidebar} className="rounded-xl p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground lg:hidden" aria-label={isAr ? "ÙØªØ­ Ø§Ù„Ù‚Ø§Ø¦Ù…Ø©" : "Open menu"}>
            <Menu size={20} />
          </button>
          <div>
            <h1 className="text-base font-bold text-foreground lg:text-lg">{isAr ? pageTitle.ar : pageTitle.en}</h1>
            <p className="hidden text-xs text-muted-foreground sm:block">Skidy Rein CRM</p>
          </div>
        </div>

        <div className="flex items-center gap-1 lg:gap-2">
          <button onClick={() => setShowSearch(true)} className="flex items-center gap-2 rounded-xl p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground" aria-label={isAr ? "Ø¨Ø­Ø«" : "Search"}>
            <Search size={18} />
            <span className="hidden rounded-md border border-border px-1.5 py-0.5 text-[10px] font-semibold text-muted-foreground lg:inline-block">Ctrl K</span>
          </button>

          <div ref={notifRef} className="relative">
            <button onClick={() => setShowNotifications((prev) => !prev)} className={cn("relative rounded-xl p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground", showNotifications && "bg-muted text-foreground")} aria-label={isAr ? "Ø§Ù„Ø¥Ø´Ø¹Ø§Ø±Ø§Øª" : "Notifications"}>
              <Bell size={18} />
              {visibleUnreadCount > 0 && <span className="absolute left-1 top-1 h-2 w-2 rounded-full bg-danger-500 ring-2 ring-background" />}
            </button>

            {showNotifications && (
              <div
                className={cn(
                  "absolute top-full z-50 mt-2 max-h-[420px] overflow-hidden rounded-2xl border border-border bg-card shadow-brand-lg",
                  "w-[calc(100vw-1rem)] max-w-[380px] sm:w-[360px]",
                  isAr ? "left-0 origin-top-left" : "right-0 origin-top-right",
                )}
              >
                <div className="flex items-center justify-between border-b border-border px-4 py-3">
                  <h3 className="text-sm font-semibold text-foreground">{isAr ? "Ø§Ù„Ø¥Ø´Ø¹Ø§Ø±Ø§Øª" : "Notifications"}</h3>
                  {visibleUnreadCount > 0 && (
                    <button onClick={markAllAsRead} className="flex items-center gap-1 text-xs text-brand-600 transition-colors hover:text-brand-700">
                      <CheckCheck size={14} />
                      {isAr ? "Ù‚Ø±Ø§Ø¡Ø© Ø§Ù„ÙƒÙ„" : "Mark all read"}
                    </button>
                  )}
                </div>
                <div className="max-h-[340px] overflow-y-auto">
                  {notifications.length === 0 ? (
                    <div className="p-6 text-center text-sm text-muted-foreground">{isAr ? "Ù„Ø§ ØªÙˆØ¬Ø¯ Ø¥Ø´Ø¹Ø§Ø±Ø§Øª Ø­Ø§Ù„ÙŠØ§Ù‹" : "No notifications right now"}</div>
                  ) : (
                    notifications.map((notification) => {
                      const Icon = typeIcon(notification.type);
                      return (
                        <Link key={notification.id} href={notification.href} onClick={() => markAsRead(notification.id)} className={cn("flex w-full items-start gap-3 border-b border-border px-4 py-3 text-start transition-colors last:border-0 hover:bg-muted/50", !notification.read && "bg-brand-50/40 dark:bg-brand-950/10")}>
                          <div className={cn("mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl", notification.type === "warning" && "bg-danger-50 text-danger-600 dark:bg-danger-950/20", notification.type === "success" && "bg-success-50 text-success-600 dark:bg-success-950/20", notification.type === "info" && "bg-brand-50 text-brand-600 dark:bg-brand-950/20")}>
                            <Icon size={16} />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-start justify-between gap-2">
                              <p className={cn("line-clamp-2 text-sm text-foreground", !notification.read && "font-semibold")}>{notification.title}</p>
                              {!notification.read && <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-brand-600" />}
                            </div>
                            <p className="mt-1 text-[11px] text-muted-foreground">{notification.timeLabel}</p>
                          </div>
                        </Link>
                      );
                    })
                  )}
                </div>
                <div className="border-t border-border p-3">
                  <Link href="/action-center" className="block rounded-xl border border-border px-3 py-2 text-center text-sm font-medium text-foreground transition-colors hover:bg-muted">
                    {isAr ? "ÙØªØ­ Ù…Ø±ÙƒØ² Ø§Ù„Ø¹Ù…Ù„ÙŠØ§Øª" : "Open action center"}
                  </Link>
                </div>
              </div>
            )}
          </div>

          <button onClick={() => setTheme(theme === "dark" ? "light" : "dark")} className="rounded-xl p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground" aria-label={isAr ? "ØªØ¨Ø¯ÙŠÙ„ Ø§Ù„Ø³Ù…Ø©" : "Toggle theme"}>
            {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
          </button>

          <button onClick={() => setLocale(isAr ? "en" : "ar")} className="flex items-center gap-1 rounded-xl p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground" aria-label={isAr ? "ØªØ¨Ø¯ÙŠÙ„ Ø§Ù„Ù„ØºØ©" : "Toggle language"}>
            <Globe size={18} />
            <span className="text-xs font-semibold">{isAr ? "EN" : "Ø¹"}</span>
          </button>
        </div>
      </header>

      <GlobalSearch open={showSearch} onClose={() => setShowSearch(false)} />
    </>
  );
}
```

### FILE: src\components\leads\lead-form.tsx
```tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  Baby,
  MessageSquare,
  Save,
  Thermometer,
  User,
  UserPlus,
} from "lucide-react";
import { toast } from "sonner";
import {
  LEAD_SOURCE_EN_LABELS,
  LEAD_SOURCE_LABELS,
  TEMPERATURE_EN_LABELS,
  TEMPERATURE_LABELS,
} from "@/config/labels";
import { MOCK_TEAM } from "@/lib/mock-data";
import { t } from "@/lib/locale";
import { guardLeadDuplicate, type DuplicateCheckResult } from "@/services/duplicate-guard.service";
import { getCourseFamilyFromTrack, getCourseTrackGroups, getCourseTrackLabel, getCourseTrackOptions, getDefaultTrackIdForFamily, suggestCourseByAge } from "@/config/course-roadmap";
import { cn } from "@/lib/utils";
import { useUIStore } from "@/stores/ui-store";
import type { CreateLeadInput } from "@/types/crm";
import type { CourseType, LeadSource, LeadTemperature } from "@/types/common.types";

export interface LeadFormValues {
  childName: string;
  childAge: string;
  parentName: string;
  parentPhone: string;
  parentWhatsapp: string;
  source: LeadSource;
  temperature: LeadTemperature;
  suggestedCourse: CourseType | "";
  assignedTo: string;
  hasLaptop: boolean;
  hasPriorExperience: boolean;
  childInterests: string;
  notes: string;
}

interface LeadFormProps {
  title: string;
  description: string;
  submitLabel: string;
  successMessage: string;
  initialValues?: Partial<LeadFormValues>;
  onSubmit: (payload: CreateLeadInput) => Promise<void>;
  cancelHref?: string;
}

const DEFAULT_VALUES: LeadFormValues = {
  childName: "",
  childAge: "",
  parentName: "",
  parentPhone: "",
  parentWhatsapp: "",
  source: "facebook_ad",
  temperature: "warm",
  suggestedCourse: "",
  assignedTo: MOCK_TEAM[0]?.id ?? "",
  hasLaptop: false,
  hasPriorExperience: false,
  childInterests: "",
  notes: "",
};

export function LeadForm({
  title,
  description,
  submitLabel,
  successMessage,
  initialValues,
  onSubmit,
  cancelHref = "/leads",
}: LeadFormProps) {
  const router = useRouter();
  const locale = useUIStore((state) => state.locale);
  const isAr = locale === "ar";
  const [loading, setLoading] = useState(false);
  const [duplicateResult, setDuplicateResult] = useState<DuplicateCheckResult | null>(null);
  const [selectedTrackId, setSelectedTrackId] = useState<string>(
    getDefaultTrackIdForFamily(initialValues?.suggestedCourse ? initialValues.suggestedCourse : null),
  );
  const [form, setForm] = useState<LeadFormValues>({
    ...DEFAULT_VALUES,
    ...initialValues,
  });

  useEffect(() => {
    if (!initialValues) return;
    setForm({
      ...DEFAULT_VALUES,
      ...initialValues,
    });
    setSelectedTrackId(getDefaultTrackIdForFamily(initialValues.suggestedCourse ? initialValues.suggestedCourse : null));
  }, [initialValues]);

  useEffect(() => {
    const hasEnoughData = form.childName.trim().length > 1 && form.parentName.trim().length > 1 && form.parentPhone.trim().length > 5;
    if (!hasEnoughData) {
      setDuplicateResult(null);
      return;
    }

    let cancelled = false;
    const timeout = window.setTimeout(async () => {
      const result = await guardLeadDuplicate({
        childName: form.childName.trim(),
        parentName: form.parentName.trim(),
        parentPhone: form.parentPhone.trim(),
        parentWhatsapp: form.parentWhatsapp.trim() || undefined,
      });
      if (!cancelled) setDuplicateResult(result);
    }, 300);

    return () => {
      cancelled = true;
      window.clearTimeout(timeout);
    };
  }, [form.childName, form.parentName, form.parentPhone, form.parentWhatsapp]);

  const sourceOptions = useMemo(
    () => Object.entries(isAr ? LEAD_SOURCE_LABELS : LEAD_SOURCE_EN_LABELS).map(([value, label]) => ({ value: value as LeadSource, label })),
    [isAr],
  );

  const trackOptions = useMemo(() => getCourseTrackOptions(locale), [locale]);
  const trackGroups = useMemo(() => getCourseTrackGroups(locale), [locale]);

  const temperatureOptions = useMemo(
    () => Object.entries(isAr ? TEMPERATURE_LABELS : TEMPERATURE_EN_LABELS).map(([value, label]) => ({ value: value as LeadTemperature, label })),
    [isAr],
  );

  const salesTeam = useMemo(() => MOCK_TEAM.filter((member) => member.role === "sales"), []);

  const updateField = (field: keyof LeadFormValues, value: string | boolean) => {
    if (field === "childAge") {
      const ageValue = value as string;
      const age = parseInt(ageValue, 10);
      if (!Number.isNaN(age) && !selectedTrackId) {
        const family = suggestCourseByAge(age, form.hasPriorExperience);
        const suggestedTrack = trackOptions.find((item) => item.family === family)?.value ?? "";
        setSelectedTrackId(suggestedTrack);
        setForm((prev) => ({ ...prev, childAge: ageValue, suggestedCourse: family }));
        return;
      }
    }

    if (field === "hasPriorExperience") {
      const hasPriorExperience = Boolean(value);
      const age = parseInt(form.childAge, 10);
      if (!Number.isNaN(age) && !selectedTrackId) {
        const family = suggestCourseByAge(age, hasPriorExperience);
        const suggestedTrack = trackOptions.find((item) => item.family === family)?.value ?? "";
        setSelectedTrackId(suggestedTrack);
        setForm((prev) => ({ ...prev, hasPriorExperience, suggestedCourse: family }));
        return;
      }
    }

    setForm((prev) => ({ ...prev, [field]: value } as LeadFormValues));
  };

  const handleTrackChange = (trackId: string) => {
    setSelectedTrackId(trackId);
    setForm((prev) => ({
      ...prev,
      suggestedCourse: (getCourseFamilyFromTrack(trackId) ?? "") as LeadFormValues["suggestedCourse"],
    }));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!form.childName || !form.parentName || !form.parentPhone || !form.childAge) {
      toast.error(t(locale, "ÙŠØ±Ø¬Ù‰ Ù…Ù„Ø¡ Ø§Ù„Ø­Ù‚ÙˆÙ„ Ø§Ù„Ù…Ø·Ù„ÙˆØ¨Ø©", "Please fill in the required fields"));
      return;
    }

    const age = parseInt(form.childAge, 10);
    if (Number.isNaN(age) || age < 4 || age > 18) {
      toast.error(t(locale, "Ø§Ù„Ø¹Ù…Ø± ÙŠØ¬Ø¨ Ø£Ù† ÙŠÙƒÙˆÙ† Ø¨ÙŠÙ† 4 Ùˆ 18 Ø³Ù†Ø©", "Age must be between 4 and 18"));
      return;
    }

    const duplicate = await guardLeadDuplicate({
      childName: form.childName.trim(),
      parentName: form.parentName.trim(),
      parentPhone: form.parentPhone.trim(),
      parentWhatsapp: form.parentWhatsapp.trim() || undefined,
    });

    if (duplicate?.blocking) {
      toast.error(t(locale, duplicate.messageAr, duplicate.messageEn));
      return;
    }

    setLoading(true);
    try {
      const assignedToName = MOCK_TEAM.find((member) => member.id === form.assignedTo)?.name ?? t(locale, "ØºÙŠØ± Ù…Ø®ØµØµ", "Unassigned");

      await onSubmit({
        childName: form.childName,
        childAge: age,
        parentName: form.parentName,
        parentPhone: form.parentPhone,
        parentWhatsapp: form.parentWhatsapp || undefined,
        source: form.source,
        temperature: form.temperature,
        suggestedCourse: form.suggestedCourse || null,
        assignedTo: form.assignedTo,
        assignedToName,
        hasLaptop: form.hasLaptop,
        hasPriorExperience: form.hasPriorExperience,
        childInterests: form.childInterests || undefined,
        notes: form.notes || undefined,
      });

      toast.success(successMessage);
    } catch (error) {
      const message = error instanceof Error && error.message.trim().length > 0
        ? error.message
        : t(locale, "ØªØ¹Ø°Ø± Ø­ÙØ¸ Ø§Ù„Ø¹Ù…ÙŠÙ„. Ø±Ø§Ø¬Ø¹ Ø§Ù„ØµÙ„Ø§Ø­ÙŠØ§Øª Ø£Ùˆ Ø¨ÙŠØ§Ù†Ø§Øª Ù‚Ø§Ø¹Ø¯Ø© Ø§Ù„Ø¨ÙŠØ§Ù†Ø§Øª.", "Failed to save lead. Check permissions or database settings.");
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-center gap-3">
        <button onClick={() => router.push(cancelHref)} className="rounded-xl p-2 text-muted-foreground transition-colors hover:bg-muted">
          {isAr ? <ArrowRight size={20} /> : <ArrowLeft size={20} />}
        </button>
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold text-foreground">
            <UserPlus size={28} className="text-brand-600" />
            {title}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="rounded-2xl border border-border bg-card p-5">
          {duplicateResult?.blocking ? (
            <div className="mb-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
              <p className="font-semibold">{t(locale, "ØªÙ†Ø¨ÙŠÙ‡ ØªÙƒØ±Ø§Ø± Ù…Ø­ØªÙ…Ù„", "Potential duplicate warning")}</p>
              <p className="mt-1">{t(locale, duplicateResult.messageAr, duplicateResult.messageEn)}</p>
            </div>
          ) : null}
          <h3 className="mb-4 flex items-center gap-2 font-bold text-foreground">
            <Baby size={18} className="text-brand-600" />
            {t(locale, "Ù…Ø¹Ù„ÙˆÙ…Ø§Øª Ø§Ù„Ø·ÙÙ„", "Child information")}
          </h3>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FormField label={t(locale, "Ø§Ø³Ù… Ø§Ù„Ø·ÙÙ„ *", "Child name *")} value={form.childName} onChange={(value) => updateField("childName", value)} placeholder={t(locale, "Ù…Ø«Ø§Ù„: ÙŠÙˆØ³Ù", "Example: Youssef")} />
            <FormField label={t(locale, "Ø§Ù„Ø¹Ù…Ø± *", "Age *")} type="number" value={form.childAge} onChange={(value) => updateField("childAge", value)} placeholder="10" min={4} max={18} />
            <div className="space-y-2 sm:col-span-2">
              <FormSelect
                label={t(locale, "Ø§Ù„ÙƒÙˆØ±Ø³ / Ø§Ù„Ù…Ø³Ø§Ø±", "Course / track")}
                value={selectedTrackId}
                onChange={handleTrackChange}
                options={trackGroups.flatMap((group) => group.options.map((option) => ({ value: option.value, label: option.label, group: group.label })))}
                placeholder={t(locale, "Ø§Ø®ØªØ± Ø§Ù„ÙƒÙˆØ±Ø³ Ø§Ù„Ø£Ù†Ø³Ø¨", "Choose the most suitable course")}
              />
              {selectedTrackId ? <p className="text-xs leading-5 text-muted-foreground">{getCourseTrackLabel(selectedTrackId, locale)}</p> : null}
            </div>
            <FormField label={t(locale, "Ø§Ù‡ØªÙ…Ø§Ù…Ø§Øª Ø§Ù„Ø·ÙÙ„", "Child interests")} value={form.childInterests} onChange={(value) => updateField("childInterests", value)} placeholder={t(locale, "Ø£Ù„Ø¹Ø§Ø¨ØŒ Ø¨Ø±Ù…Ø¬Ø©ØŒ ØªØµÙ…ÙŠÙ…...", "Games, coding, design...")} />

            <div className="flex flex-wrap items-center gap-6 sm:col-span-2">
              <label className="flex cursor-pointer items-center gap-2 text-sm text-foreground">
                <input type="checkbox" checked={form.hasLaptop} onChange={(event) => updateField("hasLaptop", event.target.checked)} className="h-4 w-4 rounded border-border text-brand-600 focus:ring-brand-500" />
                {t(locale, "Ø¹Ù†Ø¯Ù‡ Ù„Ø§Ø¨ØªÙˆØ¨", "Has a laptop")}
              </label>
              <label className="flex cursor-pointer items-center gap-2 text-sm text-foreground">
                <input type="checkbox" checked={form.hasPriorExperience} onChange={(event) => updateField("hasPriorExperience", event.target.checked)} className="h-4 w-4 rounded border-border text-brand-600 focus:ring-brand-500" />
                {t(locale, "Ø¹Ù†Ø¯Ù‡ Ø®Ø¨Ø±Ø© Ø³Ø§Ø¨Ù‚Ø©", "Has prior experience")}
              </label>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-card p-5">
          {duplicateResult?.blocking ? (
            <div className="mb-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
              <p className="font-semibold">{t(locale, "ØªÙ†Ø¨ÙŠÙ‡ ØªÙƒØ±Ø§Ø± Ù…Ø­ØªÙ…Ù„", "Potential duplicate warning")}</p>
              <p className="mt-1">{t(locale, duplicateResult.messageAr, duplicateResult.messageEn)}</p>
            </div>
          ) : null}
          <h3 className="mb-4 flex items-center gap-2 font-bold text-foreground">
            <User size={18} className="text-brand-600" />
            {t(locale, "ÙˆÙ„ÙŠ Ø§Ù„Ø£Ù…Ø±", "Parent")}
          </h3>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FormField label={t(locale, "Ø§Ø³Ù… ÙˆÙ„ÙŠ Ø§Ù„Ø£Ù…Ø± *", "Parent name *")} value={form.parentName} onChange={(value) => updateField("parentName", value)} placeholder={t(locale, "Ù…Ø«Ø§Ù„: Ø£Ø­Ù…Ø¯ Ù…Ø­Ù…Ø¯", "Example: Ahmed Mohamed")} />
            <FormField label={t(locale, "Ø±Ù‚Ù… Ø§Ù„Ù‡Ø§ØªÙ *", "Phone number *")} value={form.parentPhone} onChange={(value) => updateField("parentPhone", value)} placeholder="01012345678" type="tel" />
            <FormField label="WhatsApp" value={form.parentWhatsapp} onChange={(value) => updateField("parentWhatsapp", value)} placeholder={t(locale, "Ø¥Ù† ÙˆØ¬Ø¯ Ø±Ù‚Ù… Ù…Ø®ØªÙ„Ù", "If different from phone number")} type="tel" />
            <FormSelect label={t(locale, "Ø§Ù„Ù…ØµØ¯Ø±", "Source")} value={form.source} onChange={(value) => updateField("source", value)} options={sourceOptions} />
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-card p-5">
          {duplicateResult?.blocking ? (
            <div className="mb-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
              <p className="font-semibold">{t(locale, "ØªÙ†Ø¨ÙŠÙ‡ ØªÙƒØ±Ø§Ø± Ù…Ø­ØªÙ…Ù„", "Potential duplicate warning")}</p>
              <p className="mt-1">{t(locale, duplicateResult.messageAr, duplicateResult.messageEn)}</p>
            </div>
          ) : null}
          <h3 className="mb-4 flex items-center gap-2 font-bold text-foreground">
            <Thermometer size={18} className="text-brand-600" />
            {t(locale, "Ù…Ø¹Ù„ÙˆÙ…Ø§Øª Ø§Ù„Ø¨ÙŠØ¹", "Sales details")}
          </h3>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FormSelect label={t(locale, "ØªØµÙ†ÙŠÙ Ø§Ù„Ø§Ù‡ØªÙ…Ø§Ù…", "Interest level")} value={form.temperature} onChange={(value) => updateField("temperature", value as LeadTemperature)} options={temperatureOptions} />
            <FormSelect label={t(locale, "Ø§Ù„Ù…Ø³Ø¤ÙˆÙ„", "Owner")} value={form.assignedTo} onChange={(value) => updateField("assignedTo", value)} options={salesTeam.map((member) => ({ value: member.id, label: member.name }))} />
          </div>

          <div className="mt-4">
            <label className="mb-1.5 block text-sm font-medium text-foreground">
              <MessageSquare size={14} className={cn("inline", isAr ? "ml-1" : "mr-1")} />
              {t(locale, "Ù…Ù„Ø§Ø­Ø¸Ø§Øª", "Notes")}
            </label>
            <textarea
              value={form.notes}
              onChange={(event) => updateField("notes", event.target.value)}
              placeholder={t(locale, "Ø£ÙŠ ØªÙØ§ØµÙŠÙ„ ØªØ³Ø§Ø¹Ø¯ Ø§Ù„ÙØ±ÙŠÙ‚ ÙÙŠ Ø§Ù„Ù…ØªØ§Ø¨Ø¹Ø©", "Any details that help the team follow up")}
              rows={3}
              className={cn("w-full resize-none rounded-xl border border-input bg-muted/50 px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-transparent focus:ring-2 focus:ring-ring")}
            />
          </div>
        </div>

        <div className="flex items-center justify-end gap-3">
          <button type="button" onClick={() => router.push(cancelHref)} className="rounded-xl px-6 py-2.5 text-sm font-semibold text-muted-foreground transition-colors hover:bg-muted">
            {t(locale, "Ø¥Ù„ØºØ§Ø¡", "Cancel")}
          </button>
          <button type="submit" disabled={loading} className={cn("flex items-center gap-2 rounded-xl bg-brand-700 px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-50")}>
            {loading ? <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" /> : <><Save size={18} />{submitLabel}</>}
          </button>
        </div>
      </form>
    </div>
  );
}

function FormField({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  min,
  max,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: string;
  min?: number;
  max?: number;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-foreground">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        min={min}
        max={max}
        className="w-full rounded-xl border border-input bg-muted/50 px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-transparent focus:ring-2 focus:ring-ring"
      />
    </div>
  );
}

function FormSelect({
  label,
  value,
  onChange,
  options,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: Array<{ value: string; label: string; group?: string }>;
  placeholder?: string;
}) {
  const grouped = options.reduce<Record<string, Array<{ value: string; label: string }>>>((acc, option) => {
    const key = option.group ?? "";
    if (!acc[key]) acc[key] = [];
    acc[key].push({ value: option.value, label: option.label });
    return acc;
  }, {});

  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-foreground">{label}</label>
      <select value={value} onChange={(event) => onChange(event.target.value)} className="w-full rounded-xl border border-input bg-muted/50 px-4 py-2.5 text-sm text-foreground focus:border-transparent focus:ring-2 focus:ring-ring">
        {placeholder ? <option value="">{placeholder}</option> : null}
        {Object.entries(grouped).map(([group, entries]) =>
          group ? (
            <optgroup key={group} label={group}>
              {entries.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </optgroup>
          ) : (
            entries.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))
          )
        )}
      </select>
    </div>
  );
}
```

### FILE: src\components\leads\leads-kanban.tsx
```tsx
"use client";

import { useRouter } from "next/navigation";
import { Clock, Phone } from "lucide-react";
import { cn } from "@/lib/utils";
import { KANBAN_STAGES, STAGE_CONFIGS } from "@/config/stages";
import { TemperatureBadge } from "@/components/leads/temperature-badge";
import { formatCourseLabel } from "@/lib/formatters";
import { getStageLabel, t } from "@/lib/locale";
import { useUIStore } from "@/stores/ui-store";
import type { LeadListItem } from "@/types/crm";

interface LeadsKanbanProps {
  leads: LeadListItem[];
}

export function LeadsKanban({ leads }: LeadsKanbanProps) {
  const router = useRouter();
  const locale = useUIStore((state) => state.locale);

  return (
    <div className="flex gap-3 overflow-x-auto pb-4">
      {KANBAN_STAGES.map((stageKey) => {
        const config = STAGE_CONFIGS[stageKey];
        const stageLeads = leads.filter((lead) => lead.stage === stageKey);

        return (
          <div key={stageKey} className="flex w-[280px] shrink-0 flex-col">
            <div className="mb-2 flex items-center justify-between rounded-xl px-3 py-2" style={{ backgroundColor: config.bgColor }}>
              <div className="flex items-center gap-2">
                <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: config.color }} />
                <span className="text-xs font-bold" style={{ color: config.textColor }}>{getStageLabel(stageKey, locale)}</span>
              </div>
              <span className="rounded-full px-2 py-0.5 text-xs font-bold text-white" style={{ backgroundColor: config.color }}>{stageLeads.length}</span>
            </div>

            <div className="flex-1 space-y-2">
              {stageLeads.map((lead) => (
                <div key={lead.id} onClick={() => router.push(`/leads/${lead.id}`)} className={cn("group cursor-pointer rounded-xl border border-border bg-card p-3 transition-all hover:shadow-brand-md")}>
                  <div className="mb-2 flex items-start justify-between">
                    <div>
                      <p className="text-sm font-bold text-foreground">{lead.childName}</p>
                      <p className="text-xs text-muted-foreground">{lead.childAge} {t(locale, "Ø³Ù†Ø©", "years")}</p>
                    </div>
                    <TemperatureBadge temperature={lead.temperature} />
                  </div>

                  <div className="mb-2 flex items-center gap-1.5 text-xs text-muted-foreground"><Phone size={12} /><span>{lead.parentName}</span></div>

                  {lead.suggestedCourse && <span className="rounded-full bg-brand-50 px-2 py-0.5 text-[10px] text-brand-700 dark:bg-brand-950 dark:text-brand-300">{formatCourseLabel(lead.suggestedCourse, locale)}</span>}
                  {lead.notes && <p className="mt-2 line-clamp-2 text-[11px] text-muted-foreground">{lead.notes}</p>}

                  <div className="mt-2 flex items-center justify-between border-t border-border pt-2">
                    <span className="text-[10px] text-muted-foreground">{lead.assignedToName}</span>
                    {lead.nextFollowUpAt && <span className="flex items-center gap-1 text-[10px] text-warning-600"><Clock size={10} />{t(locale, "Ù…ØªØ§Ø¨Ø¹Ø©", "Follow-up")}</span>}
                  </div>
                </div>
              ))}

              {stageLeads.length === 0 && <div className="rounded-xl border-2 border-dashed border-border p-6 text-center"><p className="text-xs text-muted-foreground">{t(locale, "Ù„Ø§ ÙŠÙˆØ¬Ø¯ Ø¹Ù…Ù„Ø§Ø¡", "No leads")}</p></div>}
            </div>
          </div>
        );
      })}
    </div>
  );
}
```

### FILE: src\components\leads\stage-badge.tsx
```tsx
"use client";

import { cn } from "@/lib/utils";
import { STAGE_CONFIGS } from "@/config/stages";
import { useUIStore } from "@/stores/ui-store";
import { getStageLabel } from "@/lib/locale";
import type { LeadStage } from "@/types/common.types";

interface StageBadgeProps {
  stage: LeadStage;
  size?: "sm" | "md";
}

export function StageBadge({ stage, size = "md" }: StageBadgeProps) {
  const locale = useUIStore((state) => state.locale);
  const config = STAGE_CONFIGS[stage];

  return (
    <span
      className={cn(
        "inline-flex items-center font-semibold rounded-full",
        size === "sm" ? "text-[10px] px-2 py-0.5" : "text-xs px-2.5 py-1",
      )}
      style={{
        backgroundColor: config.bgColor,
        color: config.textColor,
      }}
    >
      {getStageLabel(stage, locale)}
    </span>
  );
}
```

### FILE: src\components\leads\temperature-badge.tsx
```tsx
"use client";

import { cn } from "@/lib/utils";
import { Flame, Thermometer, Snowflake } from "lucide-react";
import { TEMPERATURE_META, getMetaLabel } from "@/config/status-meta";
import { useUIStore } from "@/stores/ui-store";
import type { LeadTemperature } from "@/types/common.types";

const ICON_MAP: Record<LeadTemperature, typeof Flame> = {
  hot: Flame,
  warm: Thermometer,
  cold: Snowflake,
};

interface TemperatureBadgeProps {
  temperature: LeadTemperature;
}

export function TemperatureBadge({ temperature }: TemperatureBadgeProps) {
  const locale = useUIStore((state) => state.locale);
  const meta = TEMPERATURE_META[temperature];
  const Icon = ICON_MAP[temperature];

  return (
    <span
      className={cn("inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold")}
      style={{ backgroundColor: meta.bg, color: meta.color }}
    >
      <Icon size={12} />
      {getMetaLabel(meta, locale)}
    </span>
  );
}
```

### FILE: src\components\parents\parent-form.tsx
```tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, Save, UserRound } from "lucide-react";
import { toast } from "sonner";
import { t } from "@/lib/locale";
import { guardParentDuplicate, type DuplicateCheckResult } from "@/services/duplicate-guard.service";
import { useUIStore } from "@/stores/ui-store";
import { getCourseFamilyFromTrack, getCourseTrackGroups, getCourseTrackLabel, getCourseTrackOptions, getDefaultTrackIdForFamily, suggestCourseByAge } from "@/config/course-roadmap";
import type { CreateParentInput } from "@/types/crm";

interface ParentFormProps {
  title: string;
  description: string;
  submitLabel: string;
  successMessage: string;
  onSubmit: (payload: CreateParentInput) => Promise<void>;
  cancelHref?: string;
  initialValues?: Partial<{
    fullName: string;
    phone: string;
    whatsapp: string;
    email: string;
    city: string;
    firstStudentName: string;
    firstStudentAge: number;
    firstStudentCourse: CreateParentInput["firstStudentCourse"];
    firstStudentClassName: string;
  }>;
}

export function ParentForm({
  title,
  description,
  submitLabel,
  successMessage,
  onSubmit,
  cancelHref = "/parents",
  initialValues,
}: ParentFormProps) {
  const router = useRouter();
  const locale = useUIStore((state) => state.locale);
  const isAr = locale === "ar";
  const [loading, setLoading] = useState(false);
  const [duplicateResult, setDuplicateResult] = useState<DuplicateCheckResult | null>(null);
  const [form, setForm] = useState({
    fullName: initialValues?.fullName ?? "",
    phone: initialValues?.phone ?? "",
    whatsapp: initialValues?.whatsapp ?? "",
    email: initialValues?.email ?? "",
    city: initialValues?.city ?? "",
    firstStudentName: initialValues?.firstStudentName ?? "",
    firstStudentAge: initialValues?.firstStudentAge ? String(initialValues.firstStudentAge) : "",
    firstStudentTrackId: getDefaultTrackIdForFamily(initialValues?.firstStudentCourse ?? null),
    firstStudentClassName: initialValues?.firstStudentClassName ?? "",
  });

  const trackOptions = useMemo(() => getCourseTrackOptions(locale), [locale]);
  const trackGroups = useMemo(() => getCourseTrackGroups(locale), [locale]);

  useEffect(() => {
    const hasEnoughData = form.fullName.trim().length > 1 && (form.phone.trim().length > 5 || form.whatsapp.trim().length > 5);
    if (!hasEnoughData) {
      setDuplicateResult(null);
      return;
    }

    let cancelled = false;
    const timeout = window.setTimeout(async () => {
      const result = await guardParentDuplicate({
        fullName: form.fullName.trim(),
        phone: form.phone.trim(),
        whatsapp: form.whatsapp.trim() || undefined,
      });
      if (!cancelled) setDuplicateResult(result);
    }, 300);

    return () => {
      cancelled = true;
      window.clearTimeout(timeout);
    };
  }, [form.fullName, form.phone, form.whatsapp]);

  const updateField = (field: keyof typeof form, value: string) => {
    setForm((prev) => {
      const next = { ...prev, [field]: value };
      if (field === "firstStudentAge") {
        const age = Number(value);
        if (Number.isFinite(age) && age >= 4 && !next.firstStudentTrackId) {
          const family = suggestCourseByAge(age);
          next.firstStudentTrackId = trackOptions.find((item) => item.family === family)?.value ?? "";
        }
      }
      return next;
    });
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!form.fullName.trim() || !form.phone.trim()) {
      toast.error(t(locale, "Ø§Ø³Ù… ÙˆÙ„ÙŠ Ø§Ù„Ø£Ù…Ø± ÙˆØ±Ù‚Ù… Ø§Ù„Ù‡Ø§ØªÙ Ù…Ø·Ù„ÙˆØ¨Ø§Ù†", "Parent name and phone are required"));
      return;
    }

    if (form.firstStudentName.trim() && !form.firstStudentAge.trim()) {
      toast.error(t(locale, "Ø¥Ø°Ø§ Ø£Ø¯Ø®Ù„Øª Ø§Ø³Ù… Ø§Ù„Ø·Ø§Ù„Ø¨ Ø§Ù„Ø£ÙˆÙ„ ÙŠØ¬Ø¨ Ø¥Ø¯Ø®Ø§Ù„ Ø§Ù„Ø¹Ù…Ø± Ø£ÙŠØ¶Ù‹Ø§", "If you enter a first student name, age is also required"));
      return;
    }

    const duplicate = await guardParentDuplicate({
      fullName: form.fullName.trim(),
      phone: form.phone.trim(),
      whatsapp: form.whatsapp.trim() || undefined,
    });

    if (duplicate?.blocking) {
      toast.error(t(locale, duplicate.messageAr, duplicate.messageEn));
      return;
    }

    setLoading(true);
    try {
      await onSubmit({
        fullName: form.fullName.trim(),
        phone: form.phone.trim(),
        whatsapp: form.whatsapp.trim() || form.phone.trim(),
        email: form.email.trim() || undefined,
        city: form.city.trim() || undefined,
        firstStudentName: form.firstStudentName.trim() || undefined,
        firstStudentAge: form.firstStudentAge.trim() ? Number(form.firstStudentAge) : undefined,
        firstStudentCourse: getCourseFamilyFromTrack(form.firstStudentTrackId),
        firstStudentClassName: form.firstStudentClassName.trim() || undefined,
      });
      toast.success(successMessage);
    } catch (error) {
      toast.error(
        error instanceof Error && error.message.trim().length > 0
          ? error.message
          : t(locale, "ØªØ¹Ø°Ø± Ø¥Ù†Ø´Ø§Ø¡ Ø³Ø¬Ù„ ÙˆÙ„ÙŠ Ø§Ù„Ø£Ù…Ø±", "Failed to create parent record"),
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-center gap-3">
        <button onClick={() => router.push(cancelHref)} className="rounded-xl p-2 text-muted-foreground transition-colors hover:bg-muted">
          {isAr ? <ArrowRight size={20} /> : <ArrowLeft size={20} />}
        </button>
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold text-foreground">
            <UserRound size={28} className="text-brand-600" />
            {title}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="rounded-2xl border border-border bg-card p-5">
          {duplicateResult?.blocking ? (
            <div className="mb-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
              <p className="font-semibold">{t(locale, "ØªÙ†Ø¨ÙŠÙ‡ ØªÙƒØ±Ø§Ø± Ù…Ø­ØªÙ…Ù„", "Potential duplicate warning")}</p>
              <p className="mt-1">{t(locale, duplicateResult.messageAr, duplicateResult.messageEn)}</p>
            </div>
          ) : null}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FormField label={t(locale, "Ø§Ø³Ù… ÙˆÙ„ÙŠ Ø§Ù„Ø£Ù…Ø± *", "Parent name *")} value={form.fullName} onChange={(value) => updateField("fullName", value)} placeholder={t(locale, "Ù…Ø«Ø§Ù„: Ø£Ø­Ù…Ø¯ Ù…Ø­Ù…Ø¯", "Example: Ahmed Mohamed")} />
            <FormField label={t(locale, "Ø±Ù‚Ù… Ø§Ù„Ù‡Ø§ØªÙ *", "Phone number *")} value={form.phone} onChange={(value) => updateField("phone", value)} placeholder="01012345678" type="tel" />
            <FormField label="WhatsApp" value={form.whatsapp} onChange={(value) => updateField("whatsapp", value)} placeholder={t(locale, "Ø¥Ù† ÙˆØ¬Ø¯ Ø±Ù‚Ù… Ù…Ø®ØªÙ„Ù", "If different from phone number")} type="tel" />
            <FormField label="Email" value={form.email} onChange={(value) => updateField("email", value)} placeholder="name@example.com" type="email" />
            <div className="sm:col-span-2">
              <FormField label={t(locale, "Ø§Ù„Ù…Ø¯ÙŠÙ†Ø©", "City")} value={form.city} onChange={(value) => updateField("city", value)} placeholder={t(locale, "Ù…Ø«Ø§Ù„: Ø§Ù„Ù‚Ø§Ù‡Ø±Ø©", "Example: Cairo")} />
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-card p-5">
          <div className="mb-4">
            <h2 className="text-base font-semibold text-foreground">{t(locale, "Ø§Ù„Ø·Ø§Ù„Ø¨ Ø§Ù„Ø£ÙˆÙ„ (Ø§Ø®ØªÙŠØ§Ø±ÙŠ)", "First student (optional)")}</h2>
            <p className="mt-1 text-xs text-muted-foreground">{t(locale, "Ø§ÙƒØªØ¨ Ø¨ÙŠØ§Ù†Ø§Øª Ø§Ù„Ø·Ø§Ù„Ø¨ Ø§Ù„Ø¢Ù† Ø¥Ø°Ø§ ÙƒÙ†Øª ØªØ±ÙŠØ¯ Ø¥Ù†Ø´Ø§Ø¡ ÙˆÙ„ÙŠ Ø§Ù„Ø£Ù…Ø± ÙˆØ§Ù„Ø·Ø§Ù„Ø¨ Ù…Ø¹Ù‹Ø§ Ù…Ù† Ù†ÙØ³ Ø§Ù„ÙÙˆØ±Ù….", "Enter the student now if you want to create the parent and student together from the same form.")}</p>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FormField label={t(locale, "Ø§Ø³Ù… Ø§Ù„Ø·Ø§Ù„Ø¨", "Student name")} value={form.firstStudentName} onChange={(value) => updateField("firstStudentName", value)} placeholder={t(locale, "Ù…Ø«Ø§Ù„: ÙŠÙˆØ³Ù", "Example: Youssef")} />
            <FormField label={t(locale, "Ø§Ù„Ø¹Ù…Ø±", "Age")} value={form.firstStudentAge} onChange={(value) => updateField("firstStudentAge", value)} placeholder="10" type="number" min={4} max={18} />
            <div className="sm:col-span-2">
              <FormSelect label={t(locale, "Ø§Ù„ÙƒÙˆØ±Ø³ / Ø§Ù„Ù…Ø³Ø§Ø±", "Course / track")} value={form.firstStudentTrackId} onChange={(value) => updateField("firstStudentTrackId", value)} options={trackGroups.flatMap((group) => group.options.map((option) => ({ value: option.value, label: option.label, group: group.label })))} placeholder={t(locale, "Ø§Ø®ØªØ± Ø§Ù„ÙƒÙˆØ±Ø³ Ø§Ù„Ø£Ù†Ø³Ø¨", "Choose the most suitable course")} />
              {form.firstStudentTrackId ? <p className="mt-2 text-xs leading-5 text-muted-foreground">{getCourseTrackLabel(form.firstStudentTrackId, locale)}</p> : null}
            </div>
            <div className="sm:col-span-2">
              <FormField label={t(locale, "Ø§Ø³Ù… Ø§Ù„ÙƒÙ„Ø§Ø³", "Class name")} value={form.firstStudentClassName} onChange={(value) => updateField("firstStudentClassName", value)} placeholder={t(locale, "Ø§Ø®ØªÙŠØ§Ø±ÙŠ", "Optional")} />
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3">
          <button type="button" onClick={() => router.push(cancelHref)} className="rounded-xl px-6 py-2.5 text-sm font-semibold text-muted-foreground transition-colors hover:bg-muted">
            {t(locale, "Ø¥Ù„ØºØ§Ø¡", "Cancel")}
          </button>
          <button type="submit" disabled={loading} className="flex items-center gap-2 rounded-xl bg-brand-700 px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-50">
            {loading ? <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" /> : <><Save size={18} />{submitLabel}</>}
          </button>
        </div>
      </form>
    </div>
  );
}

function FormField({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  min,
  max,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: string;
  min?: number;
  max?: number;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-foreground">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        min={min}
        max={max}
        className="w-full rounded-xl border border-input bg-muted/50 px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-transparent focus:ring-2 focus:ring-ring"
      />
    </div>
  );
}

function FormSelect({
  label,
  value,
  onChange,
  options,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: Array<{ value: string; label: string; group?: string }>;
  placeholder?: string;
}) {
  const grouped = options.reduce<Record<string, Array<{ value: string; label: string }>>>((acc, option) => {
    const key = option.group ?? "";
    if (!acc[key]) acc[key] = [];
    acc[key].push({ value: option.value, label: option.label });
    return acc;
  }, {});

  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-foreground">{label}</label>
      <select value={value} onChange={(event) => onChange(event.target.value)} className="w-full rounded-xl border border-input bg-muted/50 px-4 py-2.5 text-sm text-foreground focus:border-transparent focus:ring-2 focus:ring-ring">
        {placeholder ? <option value="">{placeholder}</option> : null}
        {Object.entries(grouped).map(([group, groupOptions]) =>
          group ? (
            <optgroup key={group} label={group}>
              {groupOptions.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </optgroup>
          ) : (
            groupOptions.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))
          ),
        )}
      </select>
    </div>
  );
}
```

### FILE: src\components\payments\invoice-toolbar.tsx
```tsx
"use client";

interface InvoiceToolbarProps {
  whatsappUrl?: string;
  mailtoUrl?: string;
}

export function InvoiceToolbar({ whatsappUrl, mailtoUrl }: InvoiceToolbarProps) {
  return (
    <div className="flex flex-wrap items-center gap-3 print:hidden">
      <button
        type="button"
        onClick={() => window.print()}
        className="rounded-2xl border border-indigo-200 bg-white px-4 py-2 text-sm font-medium text-indigo-700 transition hover:bg-indigo-50"
      >
        Ø­ÙØ¸ PDF / Ø·Ø¨Ø§Ø¹Ø©
      </button>

      {whatsappUrl ? (
        <a
          href={whatsappUrl}
          target="_blank"
          rel="noreferrer"
          className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-medium text-emerald-700 transition hover:bg-emerald-100"
        >
          Ø¥Ø±Ø³Ø§Ù„ ÙˆØ§ØªØ³Ø§Ø¨
        </a>
      ) : null}

      {mailtoUrl ? (
        <a
          href={mailtoUrl}
          className="rounded-2xl border border-sky-200 bg-sky-50 px-4 py-2 text-sm font-medium text-sky-700 transition hover:bg-sky-100"
        >
          Ø¥Ø±Ø³Ø§Ù„ Ø¨Ø±ÙŠØ¯
        </a>
      ) : null}
    </div>
  );
}
```

### FILE: src\components\payments\payment-invoice-view.tsx
```tsx
"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { InvoiceToolbar } from "@/components/payments/invoice-toolbar";
import { LoadingState, PageStateCard } from "@/components/shared/page-state";
import { t } from "@/lib/locale";
import { useUIStore } from "@/stores/ui-store";
import { getBillingCycleText, getPaymentDetails, getPaymentDisplayState, getPaymentEffectiveDueDate } from "@/services/payments.service";
import type { PaymentDetails } from "@/types/crm";

function formatCurrency(value: number, locale: "ar" | "en"): string {
  return new Intl.NumberFormat(locale === "ar" ? "ar-EG" : "en-US", {
    style: "currency",
    currency: "EGP",
    maximumFractionDigits: 0,
  }).format(value);
}

function formatDateLabel(value: string | null | undefined, locale: "ar" | "en"): string {
  if (!value) return "â€”";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value.slice(0, 10);
  return new Intl.DateTimeFormat(locale === "ar" ? "ar-EG" : "en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(date);
}

function normalizePhone(value: string | null | undefined): string {
  const digits = (value ?? "").replace(/\D/g, "");
  if (!digits) return "";
  if (digits.startsWith("20")) return digits;
  if (digits.startsWith("0")) return `20${digits.slice(1)}`;
  return digits;
}

function getStatusLabel(status: ReturnType<typeof getPaymentDisplayState>, locale: "ar" | "en"): string {
  const labels = {
    paid: t(locale, "Ù…Ø¯ÙÙˆØ¹", "Paid"),
    pending: t(locale, "Ù‚ÙŠØ¯ Ø§Ù„Ø§Ù†ØªØ¸Ø§Ø±", "Pending"),
    overdue: t(locale, "Ù…ØªØ£Ø®Ø±", "Overdue"),
    partial: t(locale, "Ù…Ø¯ÙÙˆØ¹ Ø¬Ø²Ø¦ÙŠÙ‹Ø§", "Partially paid"),
    refunded: t(locale, "Ù…Ø±ØªØ¬Ø¹", "Refunded"),
    deferred: t(locale, "Ù…Ø¤Ø¬Ù„", "Deferred"),
  } as const;
  return labels[status];
}

function getMethodLabel(method: PaymentDetails["method"], locale: "ar" | "en"): string {
  if (!method) return t(locale, "Ù„Ø§Ø­Ù‚Ù‹Ø§", "Later");

  const labels: Record<NonNullable<PaymentDetails["method"]>, string> = {
    instapay: t(locale, "Ø¥Ù†Ø³ØªØ§ Ø¨Ø§ÙŠ", "Instapay"),
    bank_transfer: t(locale, "ØªØ­ÙˆÙŠÙ„ Ø¨Ù†ÙƒÙŠ", "Bank transfer"),
    wallet: t(locale, "Ù…Ø­ÙØ¸Ø©", "Wallet"),
    cash: t(locale, "ÙƒØ§Ø´", "Cash"),
    card: t(locale, "Ø¨Ø·Ø§Ù‚Ø©", "Card"),
  };

  return labels[method];
}

export function PaymentInvoiceView({ paymentId }: { paymentId: string }) {
  const locale = useUIStore((state) => state.locale);
  const isAr = locale === "ar";
  const [payment, setPayment] = useState<PaymentDetails | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function load() {
      setLoading(true);
      const details = await getPaymentDetails(paymentId);
      if (isMounted) {
        setPayment(details);
        setLoading(false);
      }
    }

    void load();

    return () => {
      isMounted = false;
    };
  }, [paymentId]);

  const shareTargets = useMemo(() => {
    if (!payment) return { whatsappUrl: undefined, mailtoUrl: undefined };

    const parentPhone = payment.parent?.phone ?? payment.student?.parentPhone ?? null;
    const parentEmail = payment.parent?.email ?? null;
    const invoiceNumber = payment.invoiceNumber ?? payment.id;
    const studentName = payment.studentName;
    const amount = formatCurrency(payment.amount, locale);
    const sessions = String(payment.sessionsCovered);
    const effectiveDueDate = formatDateLabel(getPaymentEffectiveDueDate(payment), locale);

    const whatsappMessage = encodeURIComponent(
      t(
        locale,
        `Ø­Ø¶Ø±ØªÙƒØŒ Ù‡Ø°Ù‡ ÙØ§ØªÙˆØ±Ø© ${invoiceNumber} Ø§Ù„Ø®Ø§ØµØ© Ø¨Ø§Ù„Ø·Ø§Ù„Ø¨ ${studentName} Ù…Ù† Skidy Rein Ø¨Ù‚ÙŠÙ…Ø© ${amount} Ù„Ø¹Ø¯Ø¯ ${sessions} Ø¬Ù„Ø³Ø§Øª. Ù…ÙˆØ¹Ø¯ Ø§Ù„Ø§Ø³ØªØ­Ù‚Ø§Ù‚ Ø§Ù„ÙØ¹Ù„ÙŠ: ${effectiveDueDate}.`,
        `Here is invoice ${invoiceNumber} for ${studentName} from Skidy Rein. Amount: ${amount} for ${sessions} sessions. Effective due date: ${effectiveDueDate}.`,
      ),
    );
    const normalizedPhone = normalizePhone(parentPhone);
    const whatsappUrl = normalizedPhone ? `https://wa.me/${normalizedPhone}?text=${whatsappMessage}` : undefined;

    const mailtoBody = encodeURIComponent(
      t(
        locale,
        `Ù…Ø±Ø­Ø¨Ù‹Ø§ØŒ\n\nÙ‡Ø°Ù‡ ÙØ§ØªÙˆØ±Ø© ${invoiceNumber} Ø§Ù„Ø®Ø§ØµØ© Ø¨Ø§Ù„Ø·Ø§Ù„Ø¨ ${studentName}.\nØ§Ù„Ù‚ÙŠÙ…Ø©: ${amount}\nØ¹Ø¯Ø¯ Ø§Ù„Ø¬Ù„Ø³Ø§Øª: ${sessions}\nØ§Ù„Ø§Ø³ØªØ­Ù‚Ø§Ù‚ Ø§Ù„ÙØ¹Ù„ÙŠ: ${effectiveDueDate}\n\nSkidy Rein`,
        `Hello,\n\nThis is invoice ${invoiceNumber} for ${studentName}.\nAmount: ${amount}\nSessions: ${sessions}\nEffective due date: ${effectiveDueDate}\n\nSkidy Rein`,
      ),
    );
    const mailtoUrl = parentEmail
      ? `mailto:${parentEmail}?subject=${encodeURIComponent(`${t(locale, "ÙØ§ØªÙˆØ±Ø©", "Invoice")} ${invoiceNumber} - Skidy Rein`)}&body=${mailtoBody}`
      : undefined;

    return { whatsappUrl, mailtoUrl };
  }, [payment, locale]);

  if (loading) {
    return (
      <LoadingState
        titleAr="Ø¬Ø§Ø±Ù ØªØ¬Ù‡ÙŠØ² Ø§Ù„ÙØ§ØªÙˆØ±Ø©"
        titleEn="Preparing invoice"
        descriptionAr="ÙŠØªÙ… ØªØ­Ù…ÙŠÙ„ Ø¨ÙŠØ§Ù†Ø§Øª Ø§Ù„Ø¯ÙØ¹Ø© ÙˆØ§Ù„Ø·Ø¨Ø§Ø¹Ø© Ø§Ù„Ø¢Ù† Ù…Ù† Ø§Ù„Ø³Ø¬Ù„ Ø§Ù„Ø­Ù‚ÙŠÙ‚ÙŠ."
        descriptionEn="The real payment record is being loaded for print and sharing."
      />
    );
  }

  if (!payment) {
    return (
      <PageStateCard
        variant="warning"
        titleAr="Ø§Ù„ÙØ§ØªÙˆØ±Ø© ØºÙŠØ± Ù…ØªØ§Ø­Ø©"
        titleEn="Invoice not available"
        descriptionAr="Ù„Ù… ÙŠØªÙ… Ø§Ù„Ø¹Ø«ÙˆØ± Ø¹Ù„Ù‰ Ø³Ø¬Ù„ Ø§Ù„Ø¯ÙØ¹Ø© Ø§Ù„Ù…Ø·Ù„ÙˆØ¨ Ø£Ùˆ Ø£Ù† Ø§Ù„Ø³Ø¬Ù„ Ù„Ù… ÙŠØ¹Ø¯ Ù…ØªØ§Ø­Ù‹Ø§."
        descriptionEn="The requested payment record was not found or is no longer available."
        actionHref="/payments"
        actionLabelAr="Ø§Ù„Ø¹ÙˆØ¯Ø© Ø¥Ù„Ù‰ Ø§Ù„Ù…Ø¯ÙÙˆØ¹Ø§Øª"
        actionLabelEn="Back to payments"
      />
    );
  }

  const invoiceNumber = payment.invoiceNumber ?? `SKR-${new Date().getFullYear()}-${payment.id.slice(0, 6).toUpperCase()}`;
  const displayStatus = getPaymentDisplayState(payment);
  const issuedAt = payment.invoiceIssuedAt ?? payment.paidAt ?? payment.dueDate;
  const effectiveDueDate = getPaymentEffectiveDueDate(payment);
  const note = payment.publicNote ?? "â€”";
  const parentName = payment.parent?.fullName ?? payment.parentName;
  const parentPhone = payment.parent?.phone ?? payment.student?.parentPhone ?? "â€”";
  const parentEmail = payment.parent?.email ?? "â€”";

  const rows = [
    [t(locale, "Ø±Ù‚Ù… Ø§Ù„ÙØ§ØªÙˆØ±Ø©", "Invoice number"), invoiceNumber],
    [t(locale, "Ø§Ù„Ø·Ø§Ù„Ø¨", "Student"), payment.studentName],
    [t(locale, "ÙˆÙ„ÙŠ Ø§Ù„Ø£Ù…Ø±", "Parent"), parentName],
    [t(locale, "Ø§Ù„Ù…Ø¨Ù„Øº", "Amount"), formatCurrency(payment.amount, locale)],
    [t(locale, "Ø¹Ø¯Ø¯ Ø§Ù„Ø¬Ù„Ø³Ø§Øª", "Sessions covered"), String(payment.sessionsCovered)],
    [t(locale, "Ø§Ù„Ø­Ø§Ù„Ø©", "Status"), getStatusLabel(displayStatus, locale)],
    [t(locale, "Ø·Ø±ÙŠÙ‚Ø© Ø§Ù„Ø¯ÙØ¹", "Payment method"), getMethodLabel(payment.method, locale)],
    [t(locale, "ØªØ§Ø±ÙŠØ® Ø§Ù„Ø¥ØµØ¯Ø§Ø±", "Issued at"), formatDateLabel(issuedAt, locale)],
    [t(locale, "Ø§Ù„Ø§Ø³ØªØ­Ù‚Ø§Ù‚ Ø§Ù„Ø£ØµÙ„ÙŠ", "Original due date"), formatDateLabel(payment.dueDate, locale)],
    [t(locale, "Ø§Ù„Ø§Ø³ØªØ­Ù‚Ø§Ù‚ Ø§Ù„ÙØ¹Ù„ÙŠ", "Effective due date"), formatDateLabel(effectiveDueDate, locale)],
    [t(locale, "Ø¨Ø¯Ø§ÙŠØ© Ø§Ù„Ø¨Ø§Ù‚Ø©", "Block start"), formatDateLabel(payment.blockStartDate, locale)],
    [t(locale, "Ù†Ù‡Ø§ÙŠØ© Ø§Ù„Ø¨Ø§Ù‚Ø©", "Block end"), formatDateLabel(payment.blockEndDate, locale)],
    [t(locale, "Ø§Ù„ØªØ£Ø¬ÙŠÙ„ Ø­ØªÙ‰", "Deferred until"), formatDateLabel(payment.deferredUntil, locale)],
    [t(locale, "Ù…Ù„Ø§Ø­Ø¸Ø§Øª Ø§Ù„Ø§ØªÙØ§Ù‚", "Agreement notes"), note],
  ] as const;

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-8 print:bg-white" dir={isAr ? "rtl" : "ltr"}>
      <div className="mx-auto flex max-w-5xl flex-col gap-6">
        <div className="flex items-center justify-between gap-3 print:hidden">
          <Link
            href={`/payments/${paymentId}`}
            className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
          >
            {t(locale, "Ø§Ù„Ø¹ÙˆØ¯Ø© Ø¥Ù„Ù‰ Ø§Ù„Ø¯ÙØ¹Ø©", "Back to payment")}
          </Link>
          <InvoiceToolbar whatsappUrl={shareTargets.whatsappUrl} mailtoUrl={shareTargets.mailtoUrl} />
        </div>

        <div className="overflow-hidden rounded-[32px] border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 bg-gradient-to-l from-indigo-600 to-violet-600 px-8 py-8 text-white">
            <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
              <div className="space-y-2">
                <p className="text-sm text-white/80">Skidy Rein</p>
                <h1 className="text-3xl font-bold">{t(locale, "ÙØ§ØªÙˆØ±Ø© ØªØ­ØµÙŠÙ„ â€” Skidy Rein", "Collection invoice â€” Skidy Rein")}</h1>
                <p className="text-sm text-white/85">{t(locale, "Ø£ÙƒØ§Ø¯ÙŠÙ…ÙŠØ© Ø¨Ø±Ù…Ø¬Ø© Ù„Ù„Ø£Ø·ÙØ§Ù„ â€¢ Ù…Ø³ØªÙ†Ø¯ Ù…Ø§Ù„ÙŠ Ø¬Ø§Ù‡Ø² Ù„Ù„Ø·Ø¨Ø§Ø¹Ø© ÙˆØ§Ù„Ø­ÙØ¸ ÙƒÙ€ PDF", "Kids coding academy â€¢ print-ready financial document")}</p>
              </div>
              <div className="rounded-2xl bg-white/10 px-5 py-4 text-sm backdrop-blur">
                <p className="text-white/75">{t(locale, "Ø±Ù‚Ù… Ø§Ù„ÙØ§ØªÙˆØ±Ø©", "Invoice number")}</p>
                <p className="mt-1 text-lg font-semibold">{invoiceNumber}</p>
              </div>
            </div>
          </div>

          <div className="grid gap-6 px-8 py-8 lg:grid-cols-[1.4fr_0.8fr]">
            <div className="space-y-6">
              <div className="rounded-3xl border border-slate-200 p-5">
                <h2 className="mb-4 text-xl font-semibold text-slate-900">{t(locale, "ØªÙØ§ØµÙŠÙ„ Ø§Ù„ÙØ§ØªÙˆØ±Ø©", "Invoice details")}</h2>
                <div className="grid gap-x-6 gap-y-4 sm:grid-cols-2">
                  {rows.map(([label, value]) => (
                    <div key={label} className="border-b border-dashed border-slate-200 pb-3 last:border-b-0 last:pb-0">
                      <p className="text-sm text-slate-500">{label}</p>
                      <p className="mt-1 font-medium text-slate-900">{value}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-3xl border border-slate-200 p-5">
                <h2 className="mb-4 text-xl font-semibold text-slate-900">{t(locale, "Ø¨ÙŠØ§Ù†Ø§Øª Ø§Ù„ØªÙˆØ§ØµÙ„", "Contact details")}</h2>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <p className="text-sm text-slate-500">{t(locale, "ÙˆÙ„ÙŠ Ø§Ù„Ø£Ù…Ø±", "Parent")}</p>
                    <p className="mt-1 font-medium text-slate-900">{parentName}</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-500">{t(locale, "Ø§Ù„Ù‡Ø§ØªÙ", "Phone")}</p>
                    <p className="mt-1 font-medium text-slate-900">{parentPhone || "â€”"}</p>
                  </div>
                  <div className="sm:col-span-2">
                    <p className="text-sm text-slate-500">{t(locale, "Ø§Ù„Ø¨Ø±ÙŠØ¯", "Email")}</p>
                    <p className="mt-1 font-medium text-slate-900">{parentEmail || "â€”"}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="rounded-3xl border border-emerald-200 bg-emerald-50 p-5">
                <p className="text-sm text-emerald-700">{t(locale, "Ø¥Ø¬Ù…Ø§Ù„ÙŠ Ø§Ù„Ù…Ø³ØªØ­Ù‚", "Total amount due")}</p>
                <p className="mt-2 text-3xl font-bold text-emerald-900">{formatCurrency(payment.amount, locale)}</p>
                <p className="mt-2 text-sm text-emerald-800">{getBillingCycleText(payment, locale)}</p>
              </div>

              <div className="rounded-3xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-900">
                <p className="font-semibold">{t(locale, "Ù…Ù„Ø§Ø­Ø¸Ø© ØªØ´ØºÙŠÙ„ÙŠØ©", "Operational note")}</p>
                <p className="mt-2 leading-7">
                  {t(
                    locale,
                    "Ù‡Ø°Ù‡ Ø§Ù„ÙØ§ØªÙˆØ±Ø© Ù…Ø±ØªØ¨Ø·Ø© Ø¨Ø¨Ø§Ù‚Ø© Ø¬Ù„Ø³Ø§Øª ÙˆÙ„ÙŠØ³Øª Ø¨Ø§Ø´ØªØ±Ø§Ùƒ Ø´Ù‡Ø±ÙŠ Ø«Ø§Ø¨Øª. Ù„Ø°Ù„Ùƒ Ù‚Ø¯ ØªÙ†ØªÙ‡ÙŠ Ø§Ù„Ø£Ø±Ø¨Ø¹ Ø¬Ù„Ø³Ø§Øª Ø®Ù„Ø§Ù„ Ø´Ù‡Ø± ÙˆØ§Ø­Ø¯ Ø£Ùˆ Ø£ÙƒØ«Ø± Ù…Ù† Ø´Ù‡Ø±ØŒ ÙƒÙ…Ø§ ÙŠÙ…ÙƒÙ† ØªØ£Ø¬ÙŠÙ„ Ø§Ù„Ø§Ø³ØªØ­Ù‚Ø§Ù‚ Ø¨Ø§Ù„Ø§ØªÙØ§Ù‚ Ù…Ø¹ ÙˆÙ„ÙŠ Ø§Ù„Ø£Ù…Ø±.",
                    "This invoice is tied to a session block, not a fixed monthly subscription. The four sessions may finish within one month or over several months, and the due date can be deferred by agreement with the parent.",
                  )}
                </p>
              </div>

              <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5 text-sm text-slate-700">
                <p className="font-semibold text-slate-900">Skidy Rein</p>
                <p className="mt-2 leading-7">{t(locale, "ÙŠÙ…ÙƒÙ† Ø­ÙØ¸ Ù‡Ø°Ù‡ Ø§Ù„ØµÙØ­Ø© Ù…Ø¨Ø§Ø´Ø±Ø© ÙƒÙ…Ù„Ù PDF Ù…Ù† Ù†Ø§ÙØ°Ø© Ø§Ù„Ø·Ø¨Ø§Ø¹Ø© Ø£Ùˆ Ù…Ø´Ø§Ø±ÙƒØªÙ‡Ø§ Ù…Ø¹ ÙˆÙ„ÙŠ Ø§Ù„Ø£Ù…Ø± Ø¹Ø¨Ø± ÙˆØ§ØªØ³Ø§Ø¨ Ø£Ùˆ Ø§Ù„Ø¨Ø±ÙŠØ¯.", "This page can be saved directly as a PDF from the print dialog or shared with the parent via WhatsApp or email.")}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
```

### FILE: src\components\providers\theme-provider.tsx
```tsx
"use client";

import { ThemeProvider as NextThemesProvider } from "next-themes";
import { type ComponentProps } from "react";

/**
 * Theme provider wrapper for dark/light mode support
 * @author Abdelrahman
 */
export function ThemeProvider({
  children,
  ...props
}: ComponentProps<typeof NextThemesProvider>) {
  return <NextThemesProvider {...props}>{children}</NextThemesProvider>;
}
```

### FILE: src\components\schedule\schedule-entry-form.tsx
```tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, CalendarPlus, Save } from "lucide-react";
import { toast } from "sonner";
import { t, getDayLabel } from "@/lib/locale";
import { useUIStore } from "@/stores/ui-store";
import type { CourseType } from "@/types/common.types";
import type { CreateScheduleEntryInput, TeacherListItem } from "@/types/crm";
import { listTeachers } from "@/services/teachers.service";

interface ScheduleEntryFormProps {
  title: string;
  description: string;
  submitLabel: string;
  successMessage: string;
  onSubmit: (payload: CreateScheduleEntryInput) => Promise<void>;
  cancelHref?: string;
  initialValues?: {
    className?: string;
    teacherId?: string;
    course?: CourseType;
  };
}

const COURSE_OPTIONS: CourseType[] = ["scratch", "python", "web", "ai"];

function getCourseLabel(course: CourseType, locale: "ar" | "en") {
  const labels: Record<CourseType, { ar: string; en: string }> = {
    scratch: { ar: "Scratch", en: "Scratch" },
    python: { ar: "Python", en: "Python" },
    web: { ar: "Web", en: "Web" },
    ai: { ar: "AI", en: "AI" },
  };
  return locale === "ar" ? labels[course].ar : labels[course].en;
}

export function ScheduleEntryForm({ title, description, submitLabel, successMessage, onSubmit, cancelHref = "/schedule", initialValues }: ScheduleEntryFormProps) {
  const router = useRouter();
  const locale = useUIStore((state) => state.locale);
  const isAr = locale === "ar";
  const [loading, setLoading] = useState(false);
  const [teachers, setTeachers] = useState<TeacherListItem[]>([]);
  const [form, setForm] = useState({
    className: initialValues?.className ?? "",
    teacherId: initialValues?.teacherId ?? "",
    course: initialValues?.course ?? ("scratch" as CourseType),
    day: "0",
    startTime: "16:00",
    endTime: "17:00",
  });

  useEffect(() => {
    listTeachers().then((items) => {
      setTeachers(items);
      setForm((prev) => {
        const hasRequestedTeacher = prev.teacherId && items.some((teacher) => teacher.id === prev.teacherId);
        return { ...prev, teacherId: hasRequestedTeacher ? prev.teacherId : prev.teacherId || items[0]?.id || "" };
      });
    });
  }, []);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!form.className.trim() || !form.teacherId) {
      toast.error(t(locale, "Ø§Ø³Ù… Ø§Ù„Ø­ØµØ© ÙˆØ§Ù„Ù…Ø¯Ø±Ø³ Ù…Ø·Ù„ÙˆØ¨Ø§Ù†", "Class name and teacher are required"));
      return;
    }
    if (form.endTime <= form.startTime) {
      toast.error(t(locale, "ÙˆÙ‚Øª Ø§Ù„Ù†Ù‡Ø§ÙŠØ© ÙŠØ¬Ø¨ Ø£Ù† ÙŠÙƒÙˆÙ† Ø¨Ø¹Ø¯ ÙˆÙ‚Øª Ø§Ù„Ø¨Ø¯Ø§ÙŠØ©", "End time must be after start time"));
      return;
    }
    setLoading(true);
    try {
      await onSubmit({
        className: form.className.trim(),
        teacherId: form.teacherId,
        course: form.course,
        day: Number(form.day),
        startTime: form.startTime,
        endTime: form.endTime,
      });
      toast.success(successMessage);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t(locale, "ØªØ¹Ø°Ø± Ø¥Ø¶Ø§ÙØ© Ø§Ù„Ø­ØµØ©", "Could not create schedule entry"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-center gap-3">
        <button onClick={() => router.push(cancelHref)} className="rounded-xl p-2 text-muted-foreground transition-colors hover:bg-muted">{isAr ? <ArrowRight size={20} /> : <ArrowLeft size={20} />}</button>
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold text-foreground"><CalendarPlus size={28} className="text-brand-600" />{title}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="rounded-2xl border border-border bg-card p-5">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label={t(locale, "Ø§Ø³Ù… Ø§Ù„Ø­ØµØ© / Ø§Ù„Ø­Ø¯Ø« *", "Session / event name *")} value={form.className} onChange={(value) => setForm((prev) => ({ ...prev, className: value }))} />
            <div>
              <label className="mb-1.5 block text-sm font-medium text-foreground">{t(locale, "Ø§Ù„Ù…Ø¯Ø±Ø³ *", "Teacher *")}</label>
              <select value={form.teacherId} onChange={(event) => setForm((prev) => ({ ...prev, teacherId: event.target.value }))} className="w-full rounded-xl border border-input bg-muted/50 px-4 py-2.5 text-sm text-foreground focus:border-transparent focus:ring-2 focus:ring-ring">
                {teachers.map((teacher) => <option key={teacher.id} value={teacher.id}>{teacher.fullName}</option>)}
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-foreground">{t(locale, "Ø§Ù„Ù…Ø³Ø§Ø±", "Track")}</label>
              <select value={form.course} onChange={(event) => setForm((prev) => ({ ...prev, course: event.target.value as CourseType }))} className="w-full rounded-xl border border-input bg-muted/50 px-4 py-2.5 text-sm text-foreground focus:border-transparent focus:ring-2 focus:ring-ring">
                {COURSE_OPTIONS.map((course) => <option key={course} value={course}>{getCourseLabel(course, locale)}</option>)}
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-foreground">{t(locale, "Ø§Ù„ÙŠÙˆÙ…", "Day")}</label>
              <select value={form.day} onChange={(event) => setForm((prev) => ({ ...prev, day: event.target.value }))} className="w-full rounded-xl border border-input bg-muted/50 px-4 py-2.5 text-sm text-foreground focus:border-transparent focus:ring-2 focus:ring-ring">
                {Array.from({ length: 7 }, (_, day) => <option key={day} value={day}>{getDayLabel(day, locale)}</option>)}
              </select>
            </div>
            <Field label={t(locale, "ÙˆÙ‚Øª Ø§Ù„Ø¨Ø¯Ø§ÙŠØ©", "Start time")} value={form.startTime} onChange={(value) => setForm((prev) => ({ ...prev, startTime: value }))} type="time" />
            <Field label={t(locale, "ÙˆÙ‚Øª Ø§Ù„Ù†Ù‡Ø§ÙŠØ©", "End time")} value={form.endTime} onChange={(value) => setForm((prev) => ({ ...prev, endTime: value }))} type="time" />
          </div>
        </div>

        <div className="flex items-center justify-end gap-3">
          <button type="button" onClick={() => router.push(cancelHref)} className="rounded-xl px-6 py-2.5 text-sm font-semibold text-muted-foreground transition-colors hover:bg-muted">{t(locale, "Ø¥Ù„ØºØ§Ø¡", "Cancel")}</button>
          <button type="submit" disabled={loading} className="flex items-center gap-2 rounded-xl bg-brand-700 px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-50">
            {loading ? <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" /> : <><Save size={18} />{submitLabel}</>}
          </button>
        </div>
      </form>
    </div>
  );
}

function Field({ label, value, onChange, type = "text" }: { label: string; value: string; onChange: (value: string) => void; type?: string }) {
  return <div><label className="mb-1.5 block text-sm font-medium text-foreground">{label}</label><input type={type} value={value} onChange={(event) => onChange(event.target.value)} className="w-full rounded-xl border border-input bg-muted/50 px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-transparent focus:ring-2 focus:ring-ring" /></div>;
}
```

### FILE: src\components\shared\page-state.tsx
```tsx
"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { AlertTriangle, ArrowLeft, Inbox, SearchX, ShieldAlert } from "lucide-react";
import { useUIStore } from "@/stores/ui-store";
import { t } from "@/lib/locale";
import { cn } from "@/lib/utils";

interface PageStateProps {
  icon?: LucideIcon;
  titleAr: string;
  titleEn: string;
  descriptionAr: string;
  descriptionEn: string;
  actionHref?: string;
  actionLabelAr?: string;
  actionLabelEn?: string;
  secondaryAction?: ReactNode;
  variant?: "default" | "warning" | "danger";
  compact?: boolean;
}

const VARIANT_STYLES: Record<NonNullable<PageStateProps["variant"]>, string> = {
  default: "border-border bg-card text-foreground",
  warning: "border-warning-200 bg-warning-50/60 text-foreground dark:border-warning-900 dark:bg-warning-950/30",
  danger: "border-destructive/20 bg-destructive/5 text-foreground dark:bg-destructive/10",
};

const DEFAULT_ICONS: Record<NonNullable<PageStateProps["variant"]>, LucideIcon> = {
  default: Inbox,
  warning: AlertTriangle,
  danger: ShieldAlert,
};

export function PageStateCard({
  icon,
  titleAr,
  titleEn,
  descriptionAr,
  descriptionEn,
  actionHref,
  actionLabelAr,
  actionLabelEn,
  secondaryAction,
  variant = "default",
  compact = false,
}: PageStateProps) {
  const locale = useUIStore((state) => state.locale);
  const isAr = locale === "ar";
  const Icon = icon ?? DEFAULT_ICONS[variant];

  return (
    <div
      className={cn(
        "rounded-2xl border text-center shadow-sm",
        compact ? "p-6" : "p-10",
        VARIANT_STYLES[variant],
      )}
    >
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-background/80 text-brand-600 shadow-sm ring-1 ring-border/60">
        <Icon size={24} />
      </div>
      <h2 className="mt-4 text-lg font-bold text-foreground">{t(locale, titleAr, titleEn)}</h2>
      <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-muted-foreground">
        {t(locale, descriptionAr, descriptionEn)}
      </p>

      {(actionHref || secondaryAction) && (
        <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
          {actionHref ? (
            <Link
              href={actionHref}
              className="inline-flex items-center gap-2 rounded-xl bg-brand-700 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-600"
            >
              {isAr ? null : <ArrowLeft size={16} />}
              {t(locale, actionLabelAr ?? "Ø§Ù„Ø¹ÙˆØ¯Ø©", actionLabelEn ?? "Go back")}
              {isAr ? <ArrowLeft size={16} /> : null}
            </Link>
          ) : null}
          {secondaryAction}
        </div>
      )}
    </div>
  );
}

export function LoadingState({ titleAr, titleEn, descriptionAr, descriptionEn }: Omit<PageStateProps, "variant">) {
  const locale = useUIStore((state) => state.locale);

  return (
    <div className="rounded-2xl border border-border bg-card p-10 text-center shadow-sm">
      <div className="mx-auto h-12 w-12 animate-spin rounded-full border-2 border-brand-200 border-t-brand-700" />
      <h2 className="mt-4 text-lg font-bold text-foreground">{t(locale, titleAr, titleEn)}</h2>
      <p className="mt-2 text-sm text-muted-foreground">{t(locale, descriptionAr, descriptionEn)}</p>
    </div>
  );
}

export function EmptySearchState() {
  const locale = useUIStore((state) => state.locale);

  return (
    <PageStateCard
      icon={SearchX}
      titleAr="Ù„Ø§ ØªÙˆØ¬Ø¯ Ù†ØªØ§Ø¦Ø¬ Ù…Ø·Ø§Ø¨Ù‚Ø©"
      titleEn="No matching results"
      descriptionAr="Ø¬Ø±Ù‘Ø¨ ØªØ¹Ø¯ÙŠÙ„ ÙƒÙ„Ù…Ø© Ø§Ù„Ø¨Ø­Ø« Ø£Ùˆ ØªØ®ÙÙŠÙ Ø§Ù„ÙÙ„Ø§ØªØ± Ù„Ù„ÙˆØµÙˆÙ„ Ø¥Ù„Ù‰ Ù†ØªØ§Ø¦Ø¬ Ø£ÙƒØ«Ø± Ø¯Ù‚Ø©."
      descriptionEn="Try adjusting the search term or easing the filters to get better results."
      compact
    />
  );
}
```

### FILE: src\components\students\student-form.tsx
```tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, GraduationCap, Save } from "lucide-react";
import { toast } from "sonner";
import { getCourseFamilyFromTrack, getCourseTrackGroups, getCourseTrackLabel, getCourseTrackOptions, getDefaultTrackIdForFamily, suggestCourseByAge } from "@/config/course-roadmap";
import { STUDENT_STATUS_META, getMetaLabel } from "@/config/status-meta";
import { t } from "@/lib/locale";
import { guardStudentDuplicate, type DuplicateCheckResult } from "@/services/duplicate-guard.service";
import { useUIStore } from "@/stores/ui-store";
import type { CourseType, StudentStatus } from "@/types/common.types";
import type { CreateStudentInput } from "@/types/crm";

interface StudentFormProps {
  title: string;
  description: string;
  submitLabel: string;
  successMessage: string;
  onSubmit: (payload: CreateStudentInput) => Promise<void>;
  cancelHref?: string;
  initialValues?: Partial<{
    fullName: string;
    age: number;
    parentName: string;
    parentPhone: string;
    currentCourse: CourseType | null;
    status: StudentStatus;
    className: string;
  }>;
}

export function StudentForm({
  title,
  description,
  submitLabel,
  successMessage,
  onSubmit,
  cancelHref = "/students",
  initialValues,
}: StudentFormProps) {
  const router = useRouter();
  const locale = useUIStore((state) => state.locale);
  const isAr = locale === "ar";
  const [loading, setLoading] = useState(false);
  const [duplicateResult, setDuplicateResult] = useState<DuplicateCheckResult | null>(null);
  const [form, setForm] = useState({
    fullName: initialValues?.fullName ?? "",
    age: initialValues?.age ? String(initialValues.age) : "",
    parentName: initialValues?.parentName ?? "",
    parentPhone: initialValues?.parentPhone ?? "",
    selectedTrackId: getDefaultTrackIdForFamily(initialValues?.currentCourse ?? null),
    status: initialValues?.status ?? ("active" as StudentStatus),
    className: initialValues?.className ?? "",
    hasPriorExperience: false,
  });

  const trackOptions = useMemo(() => getCourseTrackOptions(locale), [locale]);
  const trackGroups = useMemo(() => getCourseTrackGroups(locale), [locale]);
  const statusOptions = useMemo(
    () => Object.entries(STUDENT_STATUS_META).map(([value, meta]) => ({ value: value as StudentStatus, label: getMetaLabel(meta, locale) })),
    [locale],
  );

  const updateField = (field: keyof typeof form, value: string | boolean) => {
    setForm((prev) => {
      const next = { ...prev, [field]: value } as typeof form;
      if (field === "age") {
        const age = parseInt(value as string, 10);
        if (!Number.isNaN(age)) {
          const family = suggestCourseByAge(age, next.hasPriorExperience);
          const suggestedTrack = trackOptions.find((item) => item.family === family)?.value ?? "";
          if (!next.selectedTrackId) next.selectedTrackId = suggestedTrack;
        }
      }
      if (field === "hasPriorExperience") {
        const age = parseInt(next.age, 10);
        if (!Number.isNaN(age) && !next.selectedTrackId) {
          const family = suggestCourseByAge(age, Boolean(value));
          next.selectedTrackId = trackOptions.find((item) => item.family === family)?.value ?? "";
        }
      }
      return next;
    });
  };

  useEffect(() => {
    const hasEnoughData = form.fullName.trim().length > 1 && form.parentName.trim().length > 1 && form.parentPhone.trim().length > 5;
    if (!hasEnoughData) {
      setDuplicateResult(null);
      return;
    }

    let cancelled = false;
    const timeout = window.setTimeout(async () => {
      const result = await guardStudentDuplicate({
        fullName: form.fullName.trim(),
        parentName: form.parentName.trim(),
        parentPhone: form.parentPhone.trim(),
      });
      if (!cancelled) setDuplicateResult(result);
    }, 300);

    return () => {
      cancelled = true;
      window.clearTimeout(timeout);
    };
  }, [form.fullName, form.parentName, form.parentPhone]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!form.fullName.trim() || !form.parentName.trim() || !form.parentPhone.trim() || !form.age.trim()) {
      toast.error(t(locale, "ÙŠØ±Ø¬Ù‰ Ù…Ù„Ø¡ Ø§Ù„Ø­Ù‚ÙˆÙ„ Ø§Ù„Ù…Ø·Ù„ÙˆØ¨Ø©", "Please fill in the required fields"));
      return;
    }

    const age = parseInt(form.age, 10);
    if (Number.isNaN(age) || age < 4 || age > 18) {
      toast.error(t(locale, "Ø§Ù„Ø¹Ù…Ø± ÙŠØ¬Ø¨ Ø£Ù† ÙŠÙƒÙˆÙ† Ø¨ÙŠÙ† 4 Ùˆ 18 Ø³Ù†Ø©", "Age must be between 4 and 18"));
      return;
    }

    const duplicate = await guardStudentDuplicate({
      fullName: form.fullName.trim(),
      parentName: form.parentName.trim(),
      parentPhone: form.parentPhone.trim(),
    });

    if (duplicate?.blocking) {
      toast.error(t(locale, duplicate.messageAr, duplicate.messageEn));
      return;
    }

    setLoading(true);
    try {
      await onSubmit({
        fullName: form.fullName.trim(),
        age,
        parentName: form.parentName.trim(),
        parentPhone: form.parentPhone.trim(),
        currentCourse: getCourseFamilyFromTrack(form.selectedTrackId),
        status: form.status,
        className: form.className.trim() || null,
      });
      toast.success(successMessage);
    } catch (error) {
      toast.error(
        error instanceof Error && error.message.trim().length > 0
          ? error.message
          : t(locale, "ØªØ¹Ø°Ø± Ø¥Ù†Ø´Ø§Ø¡ Ø³Ø¬Ù„ Ø§Ù„Ø·Ø§Ù„Ø¨", "Failed to create student record"),
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-center gap-3">
        <button onClick={() => router.push(cancelHref)} className="rounded-xl p-2 text-muted-foreground transition-colors hover:bg-muted">
          {isAr ? <ArrowRight size={20} /> : <ArrowLeft size={20} />}
        </button>
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold text-foreground">
            <GraduationCap size={28} className="text-brand-600" />
            {title}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="rounded-2xl border border-border bg-card p-5">
          {duplicateResult?.blocking ? (
            <div className="mb-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
              <p className="font-semibold">{t(locale, "ØªÙ†Ø¨ÙŠÙ‡ ØªÙƒØ±Ø§Ø± Ù…Ø­ØªÙ…Ù„", "Potential duplicate warning")}</p>
              <p className="mt-1">{t(locale, duplicateResult.messageAr, duplicateResult.messageEn)}</p>
            </div>
          ) : null}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FormField label={t(locale, "Ø§Ø³Ù… Ø§Ù„Ø·Ø§Ù„Ø¨ *", "Student name *")} value={form.fullName} onChange={(value) => updateField("fullName", value)} placeholder={t(locale, "Ù…Ø«Ø§Ù„: ÙŠÙˆØ³Ù", "Example: Youssef")} />
            <FormField label={t(locale, "Ø§Ù„Ø¹Ù…Ø± *", "Age *")} value={form.age} onChange={(value) => updateField("age", value)} placeholder="10" type="number" min={4} max={18} />
            <FormField label={t(locale, "Ø§Ø³Ù… ÙˆÙ„ÙŠ Ø§Ù„Ø£Ù…Ø± *", "Parent name *")} value={form.parentName} onChange={(value) => updateField("parentName", value)} placeholder={t(locale, "Ù…Ø«Ø§Ù„: Ø£Ø­Ù…Ø¯ Ù…Ø­Ù…Ø¯", "Example: Ahmed Mohamed")} />
            <FormField label={t(locale, "Ø±Ù‚Ù… ÙˆÙ„ÙŠ Ø§Ù„Ø£Ù…Ø± *", "Parent phone *")} value={form.parentPhone} onChange={(value) => updateField("parentPhone", value)} placeholder="01012345678" type="tel" />
            <div className="space-y-2 sm:col-span-2">
              <FormSelect label={t(locale, "Ø§Ù„ÙƒÙˆØ±Ø³ / Ø§Ù„Ù…Ø³Ø§Ø±", "Course / track")} value={form.selectedTrackId} onChange={(value) => updateField("selectedTrackId", value)} options={trackGroups.flatMap((group) => group.options.map((option) => ({ value: option.value, label: option.label, group: group.label })))} placeholder={t(locale, "Ø§Ø®ØªØ± Ø§Ù„ÙƒÙˆØ±Ø³ Ø§Ù„Ø£Ù†Ø³Ø¨", "Choose the most suitable course")} />
              {form.selectedTrackId ? <p className="text-xs leading-5 text-muted-foreground">{getCourseTrackLabel(form.selectedTrackId, locale)}</p> : null}
            </div>
            <FormSelect label={t(locale, "Ø§Ù„Ø­Ø§Ù„Ø©", "Status")} value={form.status} onChange={(value) => updateField("status", value)} options={statusOptions} />
            <div className="sm:col-span-2">
              <FormField label={t(locale, "Ø§Ø³Ù… Ø§Ù„ÙƒÙ„Ø§Ø³", "Class name")} value={form.className} onChange={(value) => updateField("className", value)} placeholder={t(locale, "Ù…Ø«Ø§Ù„: Scratch Saturday 6 PM", "Example: Scratch Saturday 6 PM")} />
            </div>
            <label className="flex cursor-pointer items-center gap-2 text-sm text-foreground sm:col-span-2">
              <input type="checkbox" checked={form.hasPriorExperience} onChange={(event) => updateField("hasPriorExperience", event.target.checked)} className="h-4 w-4 rounded border-border text-brand-600 focus:ring-brand-500" />
              {t(locale, "Ø¹Ù†Ø¯Ù‡ Ø®Ø¨Ø±Ø© Ø³Ø§Ø¨Ù‚Ø©", "Has prior experience")}
            </label>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3">
          <button type="button" onClick={() => router.push(cancelHref)} className="rounded-xl px-6 py-2.5 text-sm font-semibold text-muted-foreground transition-colors hover:bg-muted">
            {t(locale, "Ø¥Ù„ØºØ§Ø¡", "Cancel")}
          </button>
          <button type="submit" disabled={loading} className="flex items-center gap-2 rounded-xl bg-brand-700 px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-50">
            {loading ? <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" /> : <><Save size={18} />{submitLabel}</>}
          </button>
        </div>
      </form>
    </div>
  );
}

function FormField({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  min,
  max,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: string;
  min?: number;
  max?: number;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-foreground">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        min={min}
        max={max}
        className="w-full rounded-xl border border-input bg-muted/50 px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-transparent focus:ring-2 focus:ring-ring"
      />
    </div>
  );
}

function FormSelect({
  label,
  value,
  onChange,
  options,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: Array<{ value: string; label: string; group?: string }>;
  placeholder?: string;
}) {
  const grouped = options.reduce<Record<string, Array<{ value: string; label: string }>>>((acc, option) => {
    const key = option.group ?? "";
    if (!acc[key]) acc[key] = [];
    acc[key].push({ value: option.value, label: option.label });
    return acc;
  }, {});

  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-foreground">{label}</label>
      <select value={value} onChange={(event) => onChange(event.target.value)} className="w-full rounded-xl border border-input bg-muted/50 px-4 py-2.5 text-sm text-foreground focus:border-transparent focus:ring-2 focus:ring-ring">
        {placeholder ? <option value="">{placeholder}</option> : null}
        {Object.entries(grouped).map(([group, groupOptions]) =>
          group ? (
            <optgroup key={group} label={group}>
              {groupOptions.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </optgroup>
          ) : (
            groupOptions.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))
          ),
        )}
      </select>
    </div>
  );
}
```

### FILE: src\components\teachers\teacher-form.tsx
```tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, BookOpen, Save } from "lucide-react";
import { toast } from "sonner";
import { t, getEmploymentTypeLabel } from "@/lib/locale";
import { useUIStore } from "@/stores/ui-store";
import type { CourseType, EmploymentType } from "@/types/common.types";
import type { CreateTeacherInput } from "@/types/crm";

const COURSE_OPTIONS: CourseType[] = ["scratch", "python", "web", "ai"];

function getCourseLabel(course: CourseType, locale: "ar" | "en") {
  const labels: Record<CourseType, { ar: string; en: string }> = {
    scratch: { ar: "Scratch", en: "Scratch" },
    python: { ar: "Python", en: "Python" },
    web: { ar: "Web", en: "Web" },
    ai: { ar: "AI", en: "AI" },
  };
  return locale === "ar" ? labels[course].ar : labels[course].en;
}

interface TeacherFormProps {
  title: string;
  description: string;
  submitLabel: string;
  successMessage: string;
  onSubmit: (payload: CreateTeacherInput) => Promise<void>;
  cancelHref?: string;
}

export function TeacherForm({ title, description, submitLabel, successMessage, onSubmit, cancelHref = "/teachers" }: TeacherFormProps) {
  const router = useRouter();
  const locale = useUIStore((state) => state.locale);
  const isAr = locale === "ar";
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    fullName: "",
    phone: "",
    employment: "part_time" as EmploymentType,
    specialization: ["scratch"] as CourseType[],
  });

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!form.fullName.trim() || !form.phone.trim()) {
      toast.error(t(locale, "Ø§Ø³Ù… Ø§Ù„Ù…Ø¯Ø±Ø³ ÙˆØ§Ù„Ù‡Ø§ØªÙ Ù…Ø·Ù„ÙˆØ¨Ø§Ù†", "Teacher name and phone are required"));
      return;
    }
    if (form.specialization.length === 0) {
      toast.error(t(locale, "Ø§Ø®ØªØ± Ù…Ø³Ø§Ø±Ù‹Ø§ ÙˆØ§Ø­Ø¯Ù‹Ø§ Ø¹Ù„Ù‰ Ø§Ù„Ø£Ù‚Ù„", "Choose at least one specialization"));
      return;
    }

    setLoading(true);
    try {
      await onSubmit({
        fullName: form.fullName.trim(),
        phone: form.phone.trim(),
        employment: form.employment,
        specialization: form.specialization,
      });
      toast.success(successMessage);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t(locale, "ØªØ¹Ø°Ø± Ø¥Ù†Ø´Ø§Ø¡ Ø§Ù„Ù…Ø¯Ø±Ø³", "Could not create teacher"));
    } finally {
      setLoading(false);
    }
  };

  const toggleCourse = (course: CourseType) => {
    setForm((prev) => {
      const exists = prev.specialization.includes(course);
      const next = exists ? prev.specialization.filter((item) => item !== course) : [...prev.specialization, course];
      return { ...prev, specialization: next };
    });
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-center gap-3">
        <button onClick={() => router.push(cancelHref)} className="rounded-xl p-2 text-muted-foreground transition-colors hover:bg-muted">
          {isAr ? <ArrowRight size={20} /> : <ArrowLeft size={20} />}
        </button>
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold text-foreground"><BookOpen size={28} className="text-brand-600" />{title}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="rounded-2xl border border-border bg-card p-5">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label={t(locale, "Ø§Ø³Ù… Ø§Ù„Ù…Ø¯Ø±Ø³ *", "Teacher name *")} value={form.fullName} onChange={(value) => setForm((prev) => ({ ...prev, fullName: value }))} />
            <Field label={t(locale, "Ø§Ù„Ù‡Ø§ØªÙ *", "Phone *")} value={form.phone} onChange={(value) => setForm((prev) => ({ ...prev, phone: value }))} type="tel" />
            <div className="sm:col-span-2">
              <label className="mb-1.5 block text-sm font-medium text-foreground">{t(locale, "Ù†ÙˆØ¹ Ø§Ù„ØªØ¹Ø§Ù‚Ø¯", "Employment type")}</label>
              <select value={form.employment} onChange={(event) => setForm((prev) => ({ ...prev, employment: event.target.value as EmploymentType }))} className="w-full rounded-xl border border-input bg-muted/50 px-4 py-2.5 text-sm text-foreground focus:border-transparent focus:ring-2 focus:ring-ring">
                {(["full_time", "part_time", "freelance"] as EmploymentType[]).map((item) => (
                  <option key={item} value={item}>{getEmploymentTypeLabel(item, locale)}</option>
                ))}
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className="mb-2 block text-sm font-medium text-foreground">{t(locale, "Ø§Ù„Ù…Ø³Ø§Ø±Ø§Øª Ø§Ù„ØªÙŠ ÙŠØ¯Ø±Ù‘Ø³Ù‡Ø§", "Taught tracks")}</label>
              <div className="flex flex-wrap gap-2">
                {COURSE_OPTIONS.map((course) => {
                  const active = form.specialization.includes(course);
                  return (
                    <button key={course} type="button" onClick={() => toggleCourse(course)} className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors ${active ? "border-brand-600 bg-brand-600 text-white" : "border-border bg-card text-foreground hover:bg-muted"}`}>
                      {getCourseLabel(course, locale)}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3">
          <button type="button" onClick={() => router.push(cancelHref)} className="rounded-xl px-6 py-2.5 text-sm font-semibold text-muted-foreground transition-colors hover:bg-muted">{t(locale, "Ø¥Ù„ØºØ§Ø¡", "Cancel")}</button>
          <button type="submit" disabled={loading} className="flex items-center gap-2 rounded-xl bg-brand-700 px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-50">
            {loading ? <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" /> : <><Save size={18} />{submitLabel}</>}
          </button>
        </div>
      </form>
    </div>
  );
}

function Field({ label, value, onChange, type = "text" }: { label: string; value: string; onChange: (value: string) => void; type?: string }) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-foreground">{label}</label>
      <input type={type} value={value} onChange={(event) => onChange(event.target.value)} className="w-full rounded-xl border border-input bg-muted/50 px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-transparent focus:ring-2 focus:ring-ring" />
    </div>
  );
}
```

### FILE: src\components\ui\button.tsx
```tsx
import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { Slot } from "radix-ui"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "group/button inline-flex shrink-0 items-center justify-center rounded-lg border border-transparent bg-clip-padding text-sm font-medium whitespace-nowrap transition-all outline-none select-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 active:not-aria-[haspopup]:translate-y-px disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground [a]:hover:bg-primary/80",
        outline:
          "border-border bg-background hover:bg-muted hover:text-foreground aria-expanded:bg-muted aria-expanded:text-foreground dark:border-input dark:bg-input/30 dark:hover:bg-input/50",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80 aria-expanded:bg-secondary aria-expanded:text-secondary-foreground",
        ghost:
          "hover:bg-muted hover:text-foreground aria-expanded:bg-muted aria-expanded:text-foreground dark:hover:bg-muted/50",
        destructive:
          "bg-destructive/10 text-destructive hover:bg-destructive/20 focus-visible:border-destructive/40 focus-visible:ring-destructive/20 dark:bg-destructive/20 dark:hover:bg-destructive/30 dark:focus-visible:ring-destructive/40",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default:
          "h-8 gap-1.5 px-2.5 has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2",
        xs: "h-6 gap-1 rounded-[min(var(--radius-md),10px)] px-2 text-xs in-data-[slot=button-group]:rounded-lg has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 [&_svg:not([class*='size-'])]:size-3",
        sm: "h-7 gap-1 rounded-[min(var(--radius-md),12px)] px-2.5 text-[0.8rem] in-data-[slot=button-group]:rounded-lg has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 [&_svg:not([class*='size-'])]:size-3.5",
        lg: "h-9 gap-1.5 px-2.5 has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2",
        icon: "size-8",
        "icon-xs":
          "size-6 rounded-[min(var(--radius-md),10px)] in-data-[slot=button-group]:rounded-lg [&_svg:not([class*='size-'])]:size-3",
        "icon-sm":
          "size-7 rounded-[min(var(--radius-md),12px)] in-data-[slot=button-group]:rounded-lg",
        "icon-lg": "size-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant = "default",
  size = "default",
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot.Root : "button"

  return (
    <Comp
      data-slot="button"
      data-variant={variant}
      data-size={size}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
```

### FILE: src\app\(auth)\login\auth.ts
```tsx
export {
  getCurrentUser,
  requireAuth,
  requireRole,
} from "@/lib/auth";
```

### FILE: src\app\(auth)\login\layout.tsx
```tsx
/**
 * Auth layout â€” centered, no sidebar
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
```

### FILE: src\app\(dashboard)\layout.tsx
```tsx
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
```

### FILE: src\app\(dashboard)\loading.tsx
```tsx
import { LoadingState } from "@/components/shared/page-state";

export default function DashboardLoading() {
  return (
    <LoadingState
      titleAr="Ø¬Ø§Ø±Ù ØªØ¬Ù‡ÙŠØ² Ù„ÙˆØ­Ø© Ø§Ù„ØªØ­ÙƒÙ…"
      titleEn="Preparing the dashboard"
      descriptionAr="ÙŠØªÙ… Ø§Ù„Ø¢Ù† ØªØ­Ù…ÙŠÙ„ Ø§Ù„Ø¨ÙŠØ§Ù†Ø§Øª Ø§Ù„Ø£Ø³Ø§Ø³ÙŠØ© ÙˆØªØ¬Ù‡ÙŠØ² Ø§Ù„ØµÙØ­Ø©."
      descriptionEn="Core data is loading and the page is being prepared."
    />
  );
}
```

### FILE: src\app\(dashboard)\not-found.tsx
```tsx
"use client";

import { PageStateCard } from "@/components/shared/page-state";

export default function DashboardNotFound() {
  return (
    <PageStateCard
      titleAr="Ø§Ù„Ø¹Ù†ØµØ± Ø§Ù„Ù…Ø·Ù„ÙˆØ¨ ØºÙŠØ± Ù…ÙˆØ¬ÙˆØ¯"
      titleEn="Requested item was not found"
      descriptionAr="Ù‚Ø¯ ÙŠÙƒÙˆÙ† Ø§Ù„Ø¹Ù†ØµØ± Ù…Ø­Ø°ÙˆÙÙ‹Ø§ Ø£Ùˆ Ø£Ù† Ø§Ù„Ø±Ø§Ø¨Ø· ØºÙŠØ± ØµØ­ÙŠØ­. Ø§Ø±Ø¬Ø¹ Ø¥Ù„Ù‰ Ø§Ù„Ù‚Ø³Ù… Ø§Ù„Ø±Ø¦ÙŠØ³ÙŠ ÙˆØ£Ø¹Ø¯ Ø§Ù„Ù…Ø­Ø§ÙˆÙ„Ø©."
      descriptionEn="The requested item may have been removed or the link is incorrect. Go back to the main section and try again."
      actionHref="/"
      actionLabelAr="Ø§Ù„Ø¹ÙˆØ¯Ø© Ø¥Ù„Ù‰ Ù„ÙˆØ­Ø© Ø§Ù„ØªØ­ÙƒÙ…"
      actionLabelEn="Back to dashboard"
      variant="warning"
    />
  );
}
```

### FILE: src\app\error.tsx
```tsx
"use client";

import { RefreshCcw } from "lucide-react";
import { PageStateCard } from "@/components/shared/page-state";

export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className="mx-auto flex min-h-screen max-w-3xl items-center justify-center px-4 py-10">
      <PageStateCard
        variant="danger"
        titleAr="Ø­Ø¯Ø« Ø®Ø·Ø£ ØºÙŠØ± Ù…ØªÙˆÙ‚Ø¹"
        titleEn="Something went wrong"
        descriptionAr="Ø§Ù„Ù†Ø¸Ø§Ù… ÙˆØ§Ø¬Ù‡ Ù…Ø´ÙƒÙ„Ø© Ø£Ø«Ù†Ø§Ø¡ ØªØ­Ù…ÙŠÙ„ Ù‡Ø°Ù‡ Ø§Ù„ØµÙØ­Ø©. ÙŠÙ…ÙƒÙ†Ùƒ Ø¥Ø¹Ø§Ø¯Ø© Ø§Ù„Ù…Ø­Ø§ÙˆÙ„Ø© Ø§Ù„Ø¢Ù†ØŒ ÙˆØ¥Ø°Ø§ ØªÙƒØ±Ø± Ø§Ù„Ø®Ø·Ø£ ÙØ§Ø±Ø¬Ø¹ Ù„Ù„ØµÙØ­Ø© Ø§Ù„Ø³Ø§Ø¨Ù‚Ø© Ø£Ùˆ Ø£Ø¹Ø¯ ØªØ­Ù…ÙŠÙ„ Ø§Ù„Ù…ØªØµÙØ­."
        descriptionEn="The app hit an unexpected issue while loading this page. Try again now, and if it persists, go back or refresh the browser."
        secondaryAction={
          <button
            onClick={reset}
            className="inline-flex items-center gap-2 rounded-xl border border-border bg-background px-4 py-2 text-sm font-semibold text-foreground transition-colors hover:bg-muted"
          >
            <RefreshCcw size={16} />
            Ø¥Ø¹Ø§Ø¯Ø© Ø§Ù„Ù…Ø­Ø§ÙˆÙ„Ø© / Try again
          </button>
        }
      />
    </main>
  );
}
```

### FILE: src\app\layout.tsx
```tsx
import type { Metadata } from "next";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { Toaster } from "sonner";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Skidy Rein â€” Ù„ÙˆØ­Ø© Ø§Ù„ØªØ­ÙƒÙ…",
    template: "%s | Skidy Rein",
  },
  description: "Ù†Ø¸Ø§Ù… Ø¥Ø¯Ø§Ø±Ø© Ø£ÙƒØ§Ø¯ÙŠÙ…ÙŠØ© Skidy Rein Ù„ØªØ¹Ù„ÙŠÙ… Ø§Ù„Ø¨Ø±Ù…Ø¬Ø© Ù„Ù„Ø£Ø·ÙØ§Ù„",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="ar"
      dir="rtl"
      suppressHydrationWarning
    >
      <body className="min-h-screen bg-background text-foreground antialiased font-cairo">
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
          disableTransitionOnChange={false}
        >
          {children}
          <Toaster position="top-center" richColors closeButton dir="rtl" />
        </ThemeProvider>
      </body>
    </html>
  );
}
```

### FILE: src\app\not-found.tsx
```tsx
"use client";

import { PageStateCard } from "@/components/shared/page-state";

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-screen max-w-3xl items-center justify-center px-4 py-10">
      <PageStateCard
        titleAr="Ø§Ù„ØµÙØ­Ø© ØºÙŠØ± Ù…ÙˆØ¬ÙˆØ¯Ø©"
        titleEn="Page not found"
        descriptionAr="Ø§Ù„Ø±Ø§Ø¨Ø· Ø§Ù„Ø°ÙŠ ÙØªØ­ØªÙ‡ ØºÙŠØ± ØµØ­ÙŠØ­ Ø£Ùˆ Ø£Ù† Ø§Ù„ØµÙØ­Ø© ØªÙ… Ù†Ù‚Ù„Ù‡Ø§. Ø§Ø±Ø¬Ø¹ Ø¥Ù„Ù‰ Ù„ÙˆØ­Ø© Ø§Ù„ØªØ­ÙƒÙ… Ø«Ù… ØªØ§Ø¨Ø¹ Ù…Ù† Ø§Ù„Ù‚Ø§Ø¦Ù…Ø© Ø§Ù„Ø±Ø¦ÙŠØ³ÙŠØ©."
        descriptionEn="The page you opened does not exist or has been moved. Head back to the dashboard and continue from the main navigation."
        actionHref="/"
        actionLabelAr="Ø§Ù„Ø¹ÙˆØ¯Ø© Ø¥Ù„Ù‰ Ù„ÙˆØ­Ø© Ø§Ù„ØªØ­ÙƒÙ…"
        actionLabelEn="Back to dashboard"
        variant="warning"
      />
    </main>
  );
}
```

### FILE: src\app\page.backup.tsx
```tsx
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
          Ù…Ø±Ø­Ø¨Ø§Ù‹ â€” Ø§Ù„Ù†Ø¸Ø§Ù… ÙŠØ¹Ù…Ù„ Ø¨Ù†Ø¬Ø§Ø­
        </p>
        <a
          href="/dashboard"
          className="inline-block px-6 py-3 rounded-xl text-white font-semibold"
          style={{ background: "#4338CA" }}
        >
          Ø¯Ø®ÙˆÙ„ Ù„ÙˆØ­Ø© Ø§Ù„ØªØ­ÙƒÙ…
        </a>
      </div>
    </div>
  );
}
```
## 8. ENV EXAMPLE (keys only, no values)

### FILE: .env.example
NEXT_PUBLIC_SUPABASE_URL=***
NEXT_PUBLIC_SUPABASE_ANON_KEY=***

### FILE: .env.local
NEXT_PUBLIC_SUPABASE_URL=***
NEXT_PUBLIC_SUPABASE_ANON_KEY=***
