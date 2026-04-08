import type {
  CourseType,
  LeadSource,
  LeadStage,
  LeadTemperature,
  StudentStatus,
} from "@/types/common.types";
import type { FollowUpItem, LeadActivityItem } from "@/types/crm";

export interface MockLead {
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
  lossReason?: null | "price";
}

export const MOCK_LEADS: MockLead[] = [
  {
    id: "1",
    parentName: "أحمد محمد",
    parentPhone: "01012345678",
    childName: "يوسف",
    childAge: 10,
    stage: "new",
    temperature: "hot",
    source: "facebook_ad",
    suggestedCourse: "scratch",
    assignedTo: "1",
    assignedToName: "الاء",
    lastContactAt: null,
    nextFollowUpAt: "2026-04-06T10:00:00",
    notes: "مهتم جداً — سأل عن المواعيد",
    createdAt: "2026-04-05T08:00:00",
    lossReason: null,
  },
  {
    id: "2",
    parentName: "سارة أحمد",
    parentPhone: "01098765432",
    childName: "ملك",
    childAge: 14,
    stage: "qualified",
    temperature: "hot",
    source: "instagram_ad",
    suggestedCourse: "python",
    assignedTo: "2",
    assignedToName: "سمر",
    lastContactAt: "2026-04-04T14:00:00",
    nextFollowUpAt: "2026-04-06T14:00:00",
    notes: "عندها لابتوب — مهتمة بالـ AI",
    createdAt: "2026-04-03T10:00:00",
    lossReason: null,
  },
  {
    id: "3",
    parentName: "محمد علي",
    parentPhone: "01155544433",
    childName: "عمر",
    childAge: 8,
    stage: "trial_proposed",
    temperature: "warm",
    source: "referral",
    suggestedCourse: "scratch",
    assignedTo: "1",
    assignedToName: "الاء",
    lastContactAt: "2026-04-04T11:00:00",
    nextFollowUpAt: "2026-04-07T10:00:00",
    notes: "صاحب أحمد محمد — referral",
    createdAt: "2026-04-02T09:00:00",
    lossReason: null,
  },
  {
    id: "4",
    parentName: "فاطمة حسن",
    parentPhone: "01234567890",
    childName: "زين",
    childAge: 11,
    stage: "trial_booked",
    temperature: "hot",
    source: "facebook_ad",
    suggestedCourse: "scratch",
    assignedTo: "2",
    assignedToName: "سمر",
    lastContactAt: "2026-04-05T09:00:00",
    nextFollowUpAt: "2026-04-08T16:00:00",
    notes: "السيشن التجريبية يوم الثلاثاء 4 مساءً",
    createdAt: "2026-04-01T12:00:00",
    lossReason: null,
  },
  {
    id: "5",
    parentName: "هدى إبراهيم",
    parentPhone: "01122334455",
    childName: "ليلى",
    childAge: 13,
    stage: "trial_attended",
    temperature: "hot",
    source: "website",
    suggestedCourse: "python",
    assignedTo: "1",
    assignedToName: "الاء",
    lastContactAt: "2026-04-05T17:00:00",
    nextFollowUpAt: "2026-04-06T12:00:00",
    notes: "حضرت السيشن التجريبية — المدرس أعجبها جداً",
    createdAt: "2026-03-28T08:00:00",
    lossReason: null,
  },
  {
    id: "6",
    parentName: "خالد عبدالله",
    parentPhone: "01066778899",
    childName: "آدم",
    childAge: 7,
    stage: "offer_sent",
    temperature: "warm",
    source: "group",
    suggestedCourse: "scratch",
    assignedTo: "2",
    assignedToName: "سمر",
    lastContactAt: "2026-04-05T10:00:00",
    nextFollowUpAt: "2026-04-06T18:00:00",
    notes: "أرسلنا العرض — ينتظر رد الأب",
    createdAt: "2026-03-25T14:00:00",
    lossReason: null,
  },
  {
    id: "7",
    parentName: "نورا سعيد",
    parentPhone: "01199887766",
    childName: "كريم",
    childAge: 9,
    stage: "won",
    temperature: "hot",
    source: "facebook_ad",
    suggestedCourse: "scratch",
    assignedTo: "1",
    assignedToName: "الاء",
    lastContactAt: "2026-04-04T16:00:00",
    nextFollowUpAt: null,
    notes: "تم الاشتراك — بدأ الكلاس",
    createdAt: "2026-03-20T10:00:00",
    lossReason: null,
  },
  {
    id: "8",
    parentName: "ريم محمود",
    parentPhone: "01033445566",
    childName: "سلمى",
    childAge: 6,
    stage: "lost",
    temperature: "cold",
    source: "instagram_ad",
    suggestedCourse: "scratch",
    assignedTo: "2",
    assignedToName: "سمر",
    lastContactAt: "2026-04-02T13:00:00",
    nextFollowUpAt: null,
    notes: "السعر عالي — مؤجل للشهر الجاي",
    createdAt: "2026-03-15T11:00:00",
    lossReason: "price",
  },
];

export const MOCK_TEAM = [
  { id: "1", name: "الاء", role: "sales" as const },
  { id: "2", name: "سمر", role: "sales" as const },
  { id: "3", name: "هاجر", role: "ops" as const },
];

export interface MockStudent {
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

export interface MockParent {
  id: string;
  fullName: string;
  phone: string;
  whatsapp: string | null;
  email: string | null;
  city: string | null;
  childrenCount: number;
  children: string[];
}

export interface MockTeacher {
  id: string;
  fullName: string;
  phone: string;
  email: string;
  specialization: CourseType[];
  employment: "full_time" | "part_time" | "freelance";
  classesCount: number;
  studentsCount: number;
  isActive: boolean;
}

export const MOCK_STUDENTS: MockStudent[] = [
  { id: "1", fullName: "يوسف أحمد", age: 10, parentName: "أحمد محمد", parentPhone: "01012345678", status: "active", currentCourse: "scratch", className: "Scratch A", enrollmentDate: "2026-03-01", sessionsAttended: 12, totalPaid: 1500 },
  { id: "2", fullName: "ملك سارة", age: 14, parentName: "سارة أحمد", parentPhone: "01098765432", status: "active", currentCourse: "python", className: "Python B", enrollmentDate: "2026-02-15", sessionsAttended: 18, totalPaid: 2250 },
  { id: "3", fullName: "كريم نورا", age: 9, parentName: "نورا سعيد", parentPhone: "01199887766", status: "trial", currentCourse: "scratch", className: null, enrollmentDate: "2026-04-01", sessionsAttended: 1, totalPaid: 0 },
  { id: "4", fullName: "سلمى خالد", age: 11, parentName: "خالد عبدالله", parentPhone: "01066778899", status: "at_risk", currentCourse: "scratch", className: "Scratch A", enrollmentDate: "2026-01-10", sessionsAttended: 8, totalPaid: 750 },
  { id: "5", fullName: "عمر محمد", age: 8, parentName: "محمد علي", parentPhone: "01155544433", status: "paused", currentCourse: "scratch", className: "Scratch B", enrollmentDate: "2026-02-01", sessionsAttended: 6, totalPaid: 750 },
  { id: "6", fullName: "ليلى هدى", age: 13, parentName: "هدى إبراهيم", parentPhone: "01122334455", status: "active", currentCourse: "python", className: "Python A", enrollmentDate: "2026-03-15", sessionsAttended: 8, totalPaid: 1500 },
];

export const MOCK_PARENTS: MockParent[] = [
  { id: "1", fullName: "أحمد محمد", phone: "01012345678", whatsapp: "01012345678", email: "ahmed@gmail.com", city: "القاهرة", childrenCount: 1, children: ["يوسف"] },
  { id: "2", fullName: "سارة أحمد", phone: "01098765432", whatsapp: "01098765432", email: "sara@gmail.com", city: "الإسكندرية", childrenCount: 1, children: ["ملك"] },
  { id: "3", fullName: "نورا سعيد", phone: "01199887766", whatsapp: null, email: null, city: "القاهرة", childrenCount: 1, children: ["كريم"] },
  { id: "4", fullName: "خالد عبدالله", phone: "01066778899", whatsapp: "01066778899", email: "khaled@gmail.com", city: "المنصورة", childrenCount: 1, children: ["سلمى"] },
  { id: "5", fullName: "محمد علي", phone: "01155544433", whatsapp: "01155544433", email: null, city: "القاهرة", childrenCount: 1, children: ["عمر"] },
  { id: "6", fullName: "هدى إبراهيم", phone: "01122334455", whatsapp: "01122334455", email: "huda@gmail.com", city: "طنطا", childrenCount: 1, children: ["ليلى"] },
];

export const MOCK_TEACHERS: MockTeacher[] = [
  { id: "1", fullName: "أ. محمود حسن", phone: "01011112222", email: "mahmoud@skidyrein.com", specialization: ["scratch"], employment: "part_time", classesCount: 3, studentsCount: 15, isActive: true },
  { id: "2", fullName: "أ. دينا سمير", phone: "01033334444", email: "dina@skidyrein.com", specialization: ["python", "ai"], employment: "full_time", classesCount: 4, studentsCount: 20, isActive: true },
  { id: "3", fullName: "أ. كريم فتحي", phone: "01055556666", email: "karim@skidyrein.com", specialization: ["scratch", "web"], employment: "freelance", classesCount: 2, studentsCount: 8, isActive: true },
];

export const MOCK_FOLLOW_UPS: FollowUpItem[] = [
  { id: "1", title: "متابعة يوسف — أول تواصل", leadId: "1", leadName: "يوسف أحمد", parentName: "أحمد محمد", type: "first_contact", channel: "whatsapp", priority: "high", scheduledAt: "2026-04-06T10:00:00", status: "pending", assignedTo: "الاء" },
  { id: "2", title: "تذكير بالسيشن التجريبية — زين", leadId: "4", leadName: "زين فاطمة", parentName: "فاطمة حسن", type: "trial_reminder", channel: "whatsapp", priority: "urgent", scheduledAt: "2026-04-06T14:00:00", status: "pending", assignedTo: "سمر" },
  { id: "3", title: "متابعة بعد السيشن — ليلى", leadId: "5", leadName: "ليلى هدى", parentName: "هدى إبراهيم", type: "post_trial", channel: "call", priority: "high", scheduledAt: "2026-04-06T12:00:00", status: "pending", assignedTo: "الاء" },
  { id: "4", title: "إعادة تواصل — عمر", leadId: "3", leadName: "عمر محمد", parentName: "محمد علي", type: "re_engagement", channel: "whatsapp", priority: "medium", scheduledAt: "2026-04-07T10:00:00", status: "pending", assignedTo: "الاء" },
  { id: "5", title: "متابعة الدفع — آدم", leadId: "6", leadName: "آدم خالد", parentName: "خالد عبدالله", type: "closing", channel: "whatsapp", priority: "high", scheduledAt: "2026-04-06T18:00:00", status: "pending", assignedTo: "سمر" },
  { id: "6", title: "أول تواصل — Lead جديد", leadId: null, leadName: "حسن أيمن", parentName: "أيمن حسن", type: "first_contact", channel: "whatsapp", priority: "medium", scheduledAt: "2026-04-05T09:00:00", status: "overdue", assignedTo: "سمر" },
  { id: "7", title: "متابعة ملك — تأكيد الدفع", leadId: "2", leadName: "ملك سارة", parentName: "سارة أحمد", type: "payment_reminder", channel: "call", priority: "medium", scheduledAt: "2026-04-04T15:00:00", status: "completed", assignedTo: "سمر" },
];

export const MOCK_LEAD_ACTIVITIES: LeadActivityItem[] = [
  { id: "1", leadId: "1", action: "تم إنشاء العميل المحتمل", date: "2026-04-05T08:00:00", by: "الاء", type: "create" },
  { id: "2", leadId: "1", action: "أول تواصل عبر واتساب", date: "2026-04-05T09:30:00", by: "الاء", type: "contact" },
  { id: "3", leadId: "1", action: "تم التأهيل — سن مناسب + لابتوب", date: "2026-04-05T09:45:00", by: "الاء", type: "stage" },
  { id: "4", leadId: "1", action: "عُرضت السيشن التجريبية", date: "2026-04-05T10:00:00", by: "الاء", type: "stage" },
  { id: "5", leadId: "5", action: "حضرت السيشن التجريبية بنجاح", date: "2026-04-05T17:00:00", by: "الاء", type: "stage" },
  { id: "6", leadId: "6", action: "تم إرسال العرض السعري", date: "2026-04-05T10:00:00", by: "سمر", type: "stage" },
];
