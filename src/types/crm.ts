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

export interface StudentListItem {
  id: string;
  fullName: string;
  age: number;
  parentName: string;
  parentPhone: string;
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
  amount: number;
  status: PaymentStatus;
  method: PaymentMethod | null;
  dueDate: string;
  paidAt: string | null;
}

export interface ScheduleSessionItem {
  id: string;
  day: number;
  startTime: string;
  endTime: string;
  className: string;
  teacher: string;
  students: number;
  course: CourseType;
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

export interface DashboardOverview {
  managementStats: DashboardStatItem[];
  secondaryStats: DashboardStatItem[];
  alerts: DashboardAlertItem[];
  funnel: DashboardFunnelItem[];
  followUps: DashboardFollowUpItem[];
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
