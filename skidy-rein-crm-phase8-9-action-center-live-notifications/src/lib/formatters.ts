import {
  COURSE_TYPE_EN_LABELS,
  COURSE_TYPE_LABELS,
  LEAD_SOURCE_EN_LABELS,
  LEAD_SOURCE_LABELS,
} from "@/config/labels";
import type { CourseType, LeadSource, Locale } from "@/types/common.types";

function toDate(value: string | Date | null | undefined): Date | null {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function formatDate(value: string | Date | null | undefined, locale: Locale = "ar"): string {
  const date = toDate(value);
  if (!date) return "—";
  return date.toLocaleDateString(locale === "ar" ? "ar-EG" : "en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function formatTime(value: string | Date | null | undefined, locale: Locale = "ar"): string {
  const date = toDate(value);
  if (!date) return "—";
  return date.toLocaleTimeString(locale === "ar" ? "ar-EG" : "en-US", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatDateTime(value: string | Date | null | undefined, locale: Locale = "ar"): string {
  const date = toDate(value);
  if (!date) return "—";
  return `${formatDate(date, locale)} — ${formatTime(date, locale)}`;
}

export function formatCurrencyEgp(value: number | null | undefined, locale: Locale = "ar"): string {
  const safeValue = value ?? 0;
  return locale === "ar"
    ? `${safeValue.toLocaleString("ar-EG")} ج.م`
    : `EGP ${safeValue.toLocaleString("en-US")}`;
}

export function formatCourseLabel(course: CourseType | null | undefined, locale: Locale = "ar"): string {
  if (!course) return "—";
  return locale === "ar" ? COURSE_TYPE_LABELS[course] : COURSE_TYPE_EN_LABELS[course];
}

export function formatLeadSource(source: LeadSource | null | undefined, locale: Locale = "ar"): string {
  if (!source) return "—";
  return locale === "ar" ? LEAD_SOURCE_LABELS[source] : LEAD_SOURCE_EN_LABELS[source];
}
