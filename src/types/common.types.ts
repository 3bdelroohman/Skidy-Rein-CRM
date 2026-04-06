/**
 * Common TypeScript types used across the application
 * @author Abdelrahman
 */

/** Supported UI languages */
export type Locale = "ar" | "en";

/** Application user role */
export type UserRole = "admin" | "sales" | "ops" | "owner";

/** Lead pipeline stage */
export type LeadStage =
  | "new"
  | "contacted"
  | "qualified"
  | "pitched"
  | "objection"
  | "trial_booked"
  | "trial_done"
  | "closing"
  | "paid"
  | "lost"
  | "unresponsive";

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