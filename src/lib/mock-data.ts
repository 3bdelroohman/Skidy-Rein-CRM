import type {
  LeadStage,
  LeadTemperature,
  LeadSource,
  CourseType,
} from "@/types/common.types";

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
    notes: "Trial يوم الثلاثاء 4 مساءً",
    createdAt: "2026-04-01T12:00:00",
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
    notes: "حضرت Trial — المدرس أعجبها جداً",
    createdAt: "2026-03-28T08:00:00",
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
    notes: "دفع — بدأ الكلاس",
    createdAt: "2026-03-20T10:00:00",
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
  status: "trial" | "active" | "paused" | "at_risk" | "completed" | "churned";
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