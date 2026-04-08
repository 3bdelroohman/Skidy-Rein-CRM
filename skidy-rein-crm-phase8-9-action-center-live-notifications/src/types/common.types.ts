/**
 * Common TypeScript types used across the application
 * Updated to reflect simplified sales system (8-stage pipeline)
 * @author Abdelrahman
 */

/** Supported UI languages */
export type Locale = "ar" | "en";

/** Application user role */
export type UserRole = "admin" | "sales" | "ops" | "owner";

/**
 * Lead pipeline stage — 8 stages (simplified from 12)
 * Decision: simpler pipeline = higher team compliance
 */
export type LeadStage =
  | "new"
  | "qualified"
  | "trial_proposed"
  | "trial_booked"
  | "trial_attended"
  | "offer_sent"
  | "won"
  | "lost";

/** Lead temperature — simplified scoring (3 levels) */
export type LeadTemperature = "hot" | "warm" | "cold";

/**
 * Loss reason — Dropdown (not free text)
 * Critical for diagnosing: pricing? ads? objections?
 */
export type LossReason =
  | "price"
  | "wants_offline"
  | "no_laptop"
  | "age_mismatch"
  | "no_response"
  | "exams_deferred"
  | "not_convinced_online"
  | "chose_competitor"
  | "other";

/** Trial session status */
export type TrialStatus =
  | "scheduled"
  | "reminded"
  | "attended"
  | "no_show"
  | "rescheduled"
  | "cancelled";

/** Student enrollment status */
export type StudentStatus =
  | "trial"
  | "active"
  | "paused"
  | "at_risk"
  | "completed"
  | "churned";

/** Payment status */
export type PaymentStatus =
  | "paid"
  | "pending"
  | "overdue"
  | "refunded"
  | "partial";

/** Teacher employment type */
export type EmploymentType = "full_time" | "part_time" | "freelance";

/** Communication channel */
export type CommChannel = "whatsapp" | "email" | "call" | "sms";

/** Lead source */
export type LeadSource =
  | "facebook_ad"
  | "instagram_ad"
  | "group"
  | "referral"
  | "direct"
  | "website"
  | "other";

/** Objection type from sales system */
export type ObjectionType =
  | "price"
  | "timing"
  | "online"
  | "uncertain"
  | "hyperactive_child"
  | "certificate"
  | "other";

/** Attendance status */
export type AttendanceStatus = "present" | "absent" | "late" | "excused";

/** Payment method */
export type PaymentMethod =
  | "bank_transfer"
  | "card"
  | "wallet"
  | "cash"
  | "instapay";

/** Feedback type */
export type FeedbackType = "complaint" | "suggestion" | "praise" | "general";

/** Priority levels */
export type Priority = "low" | "medium" | "high" | "urgent";

/** Follow-up type */
export type FollowUpType =
  | "first_contact"
  | "qualification"
  | "trial_reminder"
  | "post_trial"
  | "no_show"
  | "closing"
  | "payment_reminder"
  | "re_engagement";

/** Course type based on age placement logic */
export type CourseType = "scratch" | "python" | "web" | "ai";

/** Generic API response wrapper */
export interface ApiResponse<T> {
  data: T | null;
  error: string | null;
  success: boolean;
}

/** Pagination parameters */
export interface PaginationParams {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

/** Filter and sort options for data tables */
export interface DataTableParams {
  search?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  page?: number;
  pageSize?: number;
  filters?: Record<string, string | string[]>;
}