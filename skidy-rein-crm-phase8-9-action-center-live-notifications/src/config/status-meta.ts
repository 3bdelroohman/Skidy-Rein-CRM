import {
  PRIORITY_EN_LABELS,
  PRIORITY_LABELS,
  STUDENT_STATUS_EN_LABELS,
  STUDENT_STATUS_LABELS,
  TEMPERATURE_EN_LABELS,
  TEMPERATURE_LABELS,
} from "@/config/labels";
import type { LeadTemperature, Priority, StudentStatus } from "@/types/common.types";
import type { Locale } from "@/types/common.types";

export type FollowUpStatus = "pending" | "completed" | "overdue";
export type DashboardTaskStatus = "pending" | "completed" | "urgent" | "new";

export const TEMPERATURE_META: Record<
  LeadTemperature,
  { label: string; labelEn: string; color: string; bg: string }
> = {
  hot: { label: TEMPERATURE_LABELS.hot, labelEn: TEMPERATURE_EN_LABELS.hot, color: "#DC2626", bg: "#FEF2F2" },
  warm: { label: TEMPERATURE_LABELS.warm, labelEn: TEMPERATURE_EN_LABELS.warm, color: "#D97706", bg: "#FFFBEB" },
  cold: { label: TEMPERATURE_LABELS.cold, labelEn: TEMPERATURE_EN_LABELS.cold, color: "#2563EB", bg: "#EFF6FF" },
};

export const PRIORITY_META: Record<
  Priority,
  { label: string; labelEn: string; color: string; bg: string; textClass: string }
> = {
  urgent: {
    label: PRIORITY_LABELS.urgent,
    labelEn: PRIORITY_EN_LABELS.urgent,
    color: "#DC2626",
    bg: "#FEF2F2",
    textClass: "text-danger-600",
  },
  high: {
    label: PRIORITY_LABELS.high,
    labelEn: PRIORITY_EN_LABELS.high,
    color: "#D97706",
    bg: "#FFFBEB",
    textClass: "text-warning-600",
  },
  medium: {
    label: PRIORITY_LABELS.medium,
    labelEn: PRIORITY_EN_LABELS.medium,
    color: "#4338CA",
    bg: "#EEF2FF",
    textClass: "text-brand-600",
  },
  low: {
    label: PRIORITY_LABELS.low,
    labelEn: PRIORITY_EN_LABELS.low,
    color: "#6B7280",
    bg: "#F3F4F6",
    textClass: "text-muted-foreground",
  },
};

export const STUDENT_STATUS_META: Record<
  StudentStatus,
  { label: string; labelEn: string; color: string; bg: string }
> = {
  trial: { label: STUDENT_STATUS_LABELS.trial, labelEn: STUDENT_STATUS_EN_LABELS.trial, color: "#D97706", bg: "#FFFBEB" },
  active: { label: STUDENT_STATUS_LABELS.active, labelEn: STUDENT_STATUS_EN_LABELS.active, color: "#059669", bg: "#ECFDF5" },
  paused: { label: STUDENT_STATUS_LABELS.paused, labelEn: STUDENT_STATUS_EN_LABELS.paused, color: "#6B7280", bg: "#F3F4F6" },
  at_risk: { label: STUDENT_STATUS_LABELS.at_risk, labelEn: STUDENT_STATUS_EN_LABELS.at_risk, color: "#DC2626", bg: "#FEF2F2" },
  completed: { label: STUDENT_STATUS_LABELS.completed, labelEn: STUDENT_STATUS_EN_LABELS.completed, color: "#2563EB", bg: "#EFF6FF" },
  churned: { label: STUDENT_STATUS_LABELS.churned, labelEn: STUDENT_STATUS_EN_LABELS.churned, color: "#991B1B", bg: "#FEF2F2" },
};

export const FOLLOW_UP_STATUS_META: Record<
  FollowUpStatus,
  { label: string; labelEn: string; color: string; bg: string; border?: string }
> = {
  pending: { label: "قيد التنفيذ", labelEn: "Pending", color: "#6366F1", bg: "#EEF2FF" },
  completed: { label: "مكتملة", labelEn: "Completed", color: "#059669", bg: "#ECFDF5" },
  overdue: {
    label: "متأخرة",
    labelEn: "Overdue",
    color: "#DC2626",
    bg: "#FEF2F2",
    border: "#FCA5A5",
  },
};

export const DASHBOARD_TASK_STATUS_META: Record<
  DashboardTaskStatus,
  { label: string; labelEn: string; color: string; bg: string }
> = {
  pending: { label: "معلّق", labelEn: "Pending", color: "#7C3AED", bg: "#F5F3FF" },
  completed: { label: "مكتملة", labelEn: "Completed", color: "#059669", bg: "#ECFDF5" },
  urgent: { label: PRIORITY_LABELS.urgent, labelEn: PRIORITY_EN_LABELS.urgent, color: "#DC2626", bg: "#FEF2F2" },
  new: { label: "جديد", labelEn: "New", color: "#2563EB", bg: "#EFF6FF" },
};

export function getMetaLabel<T extends { label: string; labelEn: string }>(meta: T, locale: Locale): string {
  return locale === "ar" ? meta.label : meta.labelEn;
}
