import type {
  CommChannel,
  CourseType,
  EmploymentType,
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
import type {
  DashboardTaskStatus,
  FollowUpStatus,
} from "@/config/status-meta";

export interface LeadListItem {
  id: string;
  parentName: string;
  parentPhone: string;
  childName: string;
  childAge: number;
  stage: LeadStage;
  temperature: LeadTemperature;
  source: LeadSource;
  suggestedCourse: CourseType | null;
  assignedTo: string;
  assignedToName: string;
  lastContactAt: string | null;
  nextFollowUpAt: string | null;
  notes: string | null;
  createdAt: string;
  lossReason?: LossReason | null;
}

export interface LeadActivityItem {
  id: string;
  leadId: string;
  action: string;
  date: string;
  by: string;
  type: "create" | "contact" | "stage" | "note";
}

export interface FollowUpItem {
  id: string;
  title: string;
  leadId?: string | null;
  leadName: string;
  parentName: string;
  type: FollowUpType;
  channel: CommChannel;
  priority: Priority;
  scheduledAt: string;
  status: FollowUpStatus;
  assignedTo: string;
}

export interface CreateFollowUpInput {
  leadId?: string | null;
  leadName: string;
  parentName: string;
  title: string;
  type: FollowUpType;
  channel: CommChannel;
  priority: Priority;
  scheduledAt: string;
  assignedTo: string;
}

export interface StudentListItem {
  id: string;
  fullName: string;
  age: number;
  parentName: string;
  parentPhone: string;
  parentId?: string | null;
  status: StudentStatus;
  currentCourse: CourseType | null;
  className: string | null;
  enrollmentDate: string;
  sessionsAttended: number;
  totalPaid: number;
}

export interface ParentListItem {
  id: string;
  fullName: string;
  phone: string;
  whatsapp: string | null;
  email: string | null;
  city: string | null;
  childrenCount: number;
  children: string[];
}

export interface TeacherListItem {
  id: string;
  fullName: string;
  phone: string;
  email: string;
  specialization: CourseType[];
  employment: EmploymentType;
  classesCount: number;
  studentsCount: number;
  isActive: boolean;
}

export interface PaymentItem {
  id: string;
  studentId: string | null;
  studentName: string;
  parentName: string;
  parentId?: string | null;
  amount: number;
  status: PaymentStatus;
  method: PaymentMethod | null;
  dueDate: string;
  paidAt: string | null;
  notes?: string | null;
  publicNote?: string | null;
  sessionsCovered: number;
  blockStartDate: string | null;
  blockEndDate: string | null;
  deferredUntil: string | null;
  invoiceNumber: string | null;
  invoiceIssuedAt: string | null;
}

export interface PaymentDetails extends PaymentItem {
  student: StudentListItem | null;
  parent: ParentListItem | null;
  siblingPayments: PaymentItem[];
  paymentHistory: PaymentItem[];
}

export interface CreatePaymentInput {
  studentId: string;
  amount: number;
  status: PaymentStatus;
  method: PaymentMethod | null;
  dueDate: string;
  sessionsCovered?: number;
  blockStartDate?: string | null;
  blockEndDate?: string | null;
  deferredUntil?: string | null;
  notes?: string | null;
}

export interface ScheduleSessionItem {
  id: string;
  classId?: string | null;
  teacherId?: string | null;
  day: number;
  startTime: string;
  endTime: string;
  className: string;
  teacher: string;
  students: number;
  course: CourseType;
  sessionDate?: string | null;
}

export interface ScheduleSessionDetails extends ScheduleSessionItem {
  teacherRecord: TeacherListItem | null;
  linkedStudents: StudentListItem[];
  linkedParentIds: string[];
  linkedParents: ParentListItem[];
  siblingSessions: ScheduleSessionItem[];
}

export interface StudentDetails extends StudentListItem {
  parent: ParentListItem | null;
  siblings: StudentListItem[];
  relatedSessions: ScheduleSessionItem[];
  teachers: TeacherListItem[];
}

export interface ParentDetails extends ParentListItem {
  childrenRecords: StudentListItem[];
  activeStudents: number;
  totalPaid: number;
  openLeads: LeadListItem[];
}

export interface TeacherDetails extends TeacherListItem {
  linkedSessions: ScheduleSessionItem[];
  linkedStudents: StudentListItem[];
  activeCourses: CourseType[];
}

export interface DashboardStatItem {
  label: string;
  value: string;
  change?: string;
  bg?: string;
  color?: string;
  icon?: string;
}

export interface DashboardAlertItem {
  icon: string;
  text: string;
  type: "danger" | "warning" | "info" | "success";
}

export interface DashboardFunnelItem {
  label: string;
  value: number;
  pct: string;
  color: string;
}

export interface DashboardFollowUpItem {
  id: string;
  name: string;
  reason: string;
  assignee: string;
  assigneeEn?: string;
  dot: string;
  time: string;
  status: DashboardTaskStatus;
}

export interface DashboardOperationItem {
  title: string;
  value: string;
  subtitle: string;
  tone: "brand" | "success" | "warning" | "danger" | "info";
}

export interface DashboardActionItem {
  title: string;
  description: string;
  href: string;
  tone: "brand" | "success" | "warning" | "info";
}

export interface DashboardOverview {
  managementStats: DashboardStatItem[];
  secondaryStats: DashboardStatItem[];
  alerts: DashboardAlertItem[];
  funnel: DashboardFunnelItem[];
  followUps: DashboardFollowUpItem[];
  operations: DashboardOperationItem[];
  quickActions: DashboardActionItem[];
  recommendations: string[];
}

export interface ReportsCollectionSummary {
  expected: number;
  collected: number;
  overdue: number;
  rate: number;
}

export interface ReportsRecommendationItem {
  title: string;
  description: string;
  href: string;
  priority: "high" | "medium" | "low";
}

export interface ReportsVelocityItem {
  stage: LeadStage;
  days: number;
}

export interface ReportsSummaryItem {
  title: string;
  value: string;
  subtitle: string;
  tone: "brand" | "success" | "warning" | "danger" | "info";
}

export interface ReportsData {
  kpis: Array<{
    label: string;
    value: string;
    change: string;
    up: boolean;
    icon: "target" | "wallet" | "users" | "clock";
  }>;
  funnel: Array<{
    stage: LeadStage;
    count: number;
    color: string;
  }>;
  lossReasons: Array<{
    key: LossReason;
    count: number;
    pct: number;
  }>;
  salesPerformance: Array<{
    name: string;
    leads: number;
    won: number;
    rate: string;
    revenue: number;
  }>;
  collection: ReportsCollectionSummary;
  stageVelocity: ReportsVelocityItem[];
  operationalSummary: ReportsSummaryItem[];
  recommendations: ReportsRecommendationItem[];
}


export type ActionCenterItemCategory = "follow_up" | "lead" | "payment" | "student" | "schedule";
export type ActionCenterItemPriority = "critical" | "high" | "medium" | "info";

export interface ActionCenterItem {
  id: string;
  title: string;
  description: string;
  href: string;
  category: ActionCenterItemCategory;
  priority: ActionCenterItemPriority;
  owner?: string;
  meta?: string;
}

export interface ActionCenterMetric {
  label: string;
  value: string;
  tone: "danger" | "warning" | "success" | "info" | "brand";
}

export interface AppNotificationItem {
  id: string;
  title: string;
  timeLabel: string;
  readDefault?: boolean;
  href: string;
  type: "warning" | "info" | "success";
}

export interface ActionCenterData {
  metrics: ActionCenterMetric[];
  critical: ActionCenterItem[];
  mediumPriority: ActionCenterItem[];
  informational: ActionCenterItem[];
  notifications: AppNotificationItem[];
}


export interface CreateParentInput {
  fullName: string;
  phone: string;
  whatsapp?: string;
  email?: string;
  city?: string;
  childrenCount?: number;
  firstStudentName?: string;
  firstStudentAge?: number | null;
  firstStudentCourse?: CourseType | null;
  firstStudentClassName?: string | null;
}

export interface CreateStudentInput {
  fullName: string;
  age: number;
  parentId?: string | null;
  parentName: string;
  parentPhone: string;
  status?: StudentStatus;
  currentCourse?: CourseType | null;
  className?: string | null;
  enrollmentDate?: string | null;
  sessionsAttended?: number;
  totalPaid?: number;
}

export interface CreateLeadInput {
  childName: string;
  childAge: number;
  parentName: string;
  parentPhone: string;
  parentWhatsapp?: string;
  source: LeadSource;
  temperature: LeadTemperature;
  suggestedCourse: CourseType | null;
  assignedTo: string;
  assignedToName: string;
  hasLaptop?: boolean;
  hasPriorExperience?: boolean;
  childInterests?: string;
  notes?: string;
}

export interface UpdateLeadInput extends CreateLeadInput {
  stage?: LeadStage;
  lossReason?: LossReason | null;
  nextFollowUpAt?: string | null;
}

export interface DashboardContext {
  role: UserRole;
  fullName: string;
  fullNameAr: string;
}
