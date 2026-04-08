import type {
  CommChannel,
  CourseType,
  EmploymentType,
  FollowUpType,
  LeadSource,
  LeadStage,
  LeadTemperature,
  Locale,
  LossReason,
  PaymentMethod,
  PaymentStatus,
  Priority,
  StudentStatus,
} from "@/types/common.types";
import {
  COMM_CHANNEL_EN_LABELS,
  COMM_CHANNEL_LABELS,
  CONVERSION_EN_TERMS,
  CONVERSION_TERMS,
  COURSE_TYPE_EN_LABELS,
  COURSE_TYPE_LABELS,
  DAY_EN_LABELS,
  DAY_LABELS,
  EMPLOYMENT_TYPE_EN_LABELS,
  EMPLOYMENT_TYPE_LABELS,
  FILTER_EN_LABELS,
  FILTER_LABELS,
  FOLLOW_UP_TYPE_EN_LABELS,
  FOLLOW_UP_TYPE_LABELS,
  LEAD_SOURCE_EN_LABELS,
  LEAD_SOURCE_LABELS,
  LOSS_REASON_EN_LABELS,
  LOSS_REASON_LABELS,
  PAYMENT_METHOD_EN_LABELS,
  PAYMENT_METHOD_LABELS,
  PAYMENT_STATUS_EN_LABELS,
  PAYMENT_STATUS_LABELS,
  PRIORITY_EN_LABELS,
  PRIORITY_LABELS,
  STAGE_EN_LABELS,
  STAGE_LABELS,
  STUDENT_STATUS_EN_LABELS,
  STUDENT_STATUS_LABELS,
  TEMPERATURE_EN_LABELS,
  TEMPERATURE_LABELS,
} from "@/config/labels";

export function isArabic(locale: Locale): boolean {
  return locale === "ar";
}

export function t(locale: Locale, ar: string, en: string): string {
  return locale === "ar" ? ar : en;
}

export function getStageLabel(stage: LeadStage, locale: Locale): string {
  return locale === "ar" ? STAGE_LABELS[stage] : STAGE_EN_LABELS[stage];
}

export function getTemperatureLabel(temperature: LeadTemperature, locale: Locale): string {
  return locale === "ar" ? TEMPERATURE_LABELS[temperature] : TEMPERATURE_EN_LABELS[temperature];
}

export function getStudentStatusLabel(status: StudentStatus, locale: Locale): string {
  return locale === "ar" ? STUDENT_STATUS_LABELS[status] : STUDENT_STATUS_EN_LABELS[status];
}

export function getPriorityLabel(priority: Priority, locale: Locale): string {
  return locale === "ar" ? PRIORITY_LABELS[priority] : PRIORITY_EN_LABELS[priority];
}

export function getLossReasonLabel(reason: LossReason, locale: Locale): string {
  return locale === "ar" ? LOSS_REASON_LABELS[reason] : LOSS_REASON_EN_LABELS[reason];
}

export function getFollowUpTypeLabel(type: FollowUpType, locale: Locale): string {
  return locale === "ar" ? FOLLOW_UP_TYPE_LABELS[type] : FOLLOW_UP_TYPE_EN_LABELS[type];
}

export function getLeadSourceLabel(source: LeadSource, locale: Locale): string {
  return locale === "ar" ? LEAD_SOURCE_LABELS[source] : LEAD_SOURCE_EN_LABELS[source];
}

export function getCommChannelLabel(channel: CommChannel, locale: Locale): string {
  return locale === "ar" ? COMM_CHANNEL_LABELS[channel] : COMM_CHANNEL_EN_LABELS[channel];
}

export function getCourseLabel(course: CourseType, locale: Locale): string {
  return locale === "ar" ? COURSE_TYPE_LABELS[course] : COURSE_TYPE_EN_LABELS[course];
}

export function getPaymentStatusLabel(status: PaymentStatus, locale: Locale): string {
  return locale === "ar" ? PAYMENT_STATUS_LABELS[status] : PAYMENT_STATUS_EN_LABELS[status];
}

export function getPaymentMethodLabel(method: PaymentMethod | null | undefined, locale: Locale): string {
  if (!method) return locale === "ar" ? "—" : "—";
  return locale === "ar" ? PAYMENT_METHOD_LABELS[method] : PAYMENT_METHOD_EN_LABELS[method];
}

export function getEmploymentTypeLabel(type: EmploymentType, locale: Locale): string {
  return locale === "ar" ? EMPLOYMENT_TYPE_LABELS[type] : EMPLOYMENT_TYPE_EN_LABELS[type];
}

export function getFilterLabel(key: keyof typeof FILTER_LABELS, locale: Locale): string {
  return locale === "ar" ? FILTER_LABELS[key] : FILTER_EN_LABELS[key];
}

export function getDayLabel(dayIndex: number, locale: Locale): string {
  const safeIndex = Math.max(0, Math.min(dayIndex, DAY_LABELS.length - 1));
  return locale === "ar" ? DAY_LABELS[safeIndex] : DAY_EN_LABELS[safeIndex];
}

export function getConversionTerm(
  key: keyof typeof CONVERSION_TERMS,
  locale: Locale,
): string {
  return locale === "ar" ? CONVERSION_TERMS[key] : CONVERSION_EN_TERMS[key];
}

export function getStatusActionLabel(status: "pending" | "completed" | "overdue", locale: Locale): string {
  if (locale === "ar") {
    if (status === "completed") return "مكتملة";
    if (status === "overdue") return "متأخرة";
    return "قيد التنفيذ";
  }

  if (status === "completed") return "Completed";
  if (status === "overdue") return "Overdue";
  return "Pending";
}
