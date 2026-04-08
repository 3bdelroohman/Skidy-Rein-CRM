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
} from "@/types/common.types";

export const TEMPERATURE_LABELS: Record<LeadTemperature, string> = {
  hot: "مهتم جداً",
  warm: "مهتم",
  cold: "غير جاهز حالياً",
};

export const TEMPERATURE_EN_LABELS: Record<LeadTemperature, string> = {
  hot: "Very interested",
  warm: "Interested",
  cold: "Not ready yet",
};

export const STAGE_LABELS: Record<LeadStage, string> = {
  new: "جديد",
  qualified: "مهتم",
  trial_proposed: "عُرض عليه سيشن تجريبية",
  trial_booked: "حجز سيشن تجريبية",
  trial_attended: "حضر السيشن التجريبية",
  offer_sent: "تم إرسال العرض",
  won: "مشترك",
  lost: "لم يشترك",
};

export const STAGE_EN_LABELS: Record<LeadStage, string> = {
  new: "New",
  qualified: "Interested",
  trial_proposed: "Trial proposed",
  trial_booked: "Trial booked",
  trial_attended: "Trial attended",
  offer_sent: "Offer sent",
  won: "Enrolled",
  lost: "Did not enroll",
};

export const STUDENT_STATUS_LABELS: Record<StudentStatus, string> = {
  trial: "في حصة تجريبية",
  active: "نشط",
  paused: "متوقف مؤقتاً",
  at_risk: "بحاجة متابعة",
  completed: "أنهى الدورة",
  churned: "انسحب",
};

export const STUDENT_STATUS_EN_LABELS: Record<StudentStatus, string> = {
  trial: "In trial class",
  active: "Active",
  paused: "Paused",
  at_risk: "Needs attention",
  completed: "Completed",
  churned: "Dropped",
};

export const PRIORITY_LABELS: Record<Priority, string> = {
  urgent: "عاجل جداً",
  high: "عاجل",
  medium: "مهم",
  low: "غير مستعجل",
};

export const PRIORITY_EN_LABELS: Record<Priority, string> = {
  urgent: "Critical",
  high: "High",
  medium: "Medium",
  low: "Low",
};

export const LOSS_REASON_LABELS: Record<LossReason, string> = {
  price: "السعر غير مناسب",
  wants_offline: "يفضّل كورس حضوري",
  no_laptop: "لا يوجد جهاز مناسب",
  age_mismatch: "العمر غير مناسب للكورس",
  no_response: "لا يرد على التواصل",
  exams_deferred: "مؤجّل إلى بعد الامتحانات",
  not_convinced_online: "غير مقتنع بالتعلّم أونلاين",
  chose_competitor: "انضم لمركز/أكاديمية أخرى",
  other: "سبب آخر",
};

export const LOSS_REASON_EN_LABELS: Record<LossReason, string> = {
  price: "Price is not suitable",
  wants_offline: "Prefers offline course",
  no_laptop: "No suitable device",
  age_mismatch: "Age does not fit the course",
  no_response: "Not responding",
  exams_deferred: "Postponed until after exams",
  not_convinced_online: "Not convinced by online learning",
  chose_competitor: "Joined another academy",
  other: "Other reason",
};

export const FOLLOW_UP_TYPE_LABELS: Record<FollowUpType, string> = {
  first_contact: "أول تواصل",
  qualification: "تأهيل العميل",
  trial_reminder: "تذكير بالسيشن التجريبية",
  post_trial: "متابعة بعد السيشن التجريبية",
  no_show: "متابعة عدم الحضور",
  closing: "إغلاق الاشتراك",
  payment_reminder: "تذكير بالدفع",
  re_engagement: "إعادة تواصل",
};

export const FOLLOW_UP_TYPE_EN_LABELS: Record<FollowUpType, string> = {
  first_contact: "First contact",
  qualification: "Qualification",
  trial_reminder: "Trial reminder",
  post_trial: "Post-trial follow-up",
  no_show: "No-show follow-up",
  closing: "Closing",
  payment_reminder: "Payment reminder",
  re_engagement: "Re-engagement",
};

export const LEAD_SOURCE_LABELS: Record<LeadSource, string> = {
  facebook_ad: "إعلان فيسبوك",
  instagram_ad: "إعلان إنستجرام",
  group: "جروب",
  referral: "ترشيح",
  direct: "مباشر",
  website: "الموقع",
  other: "أخرى",
};

export const LEAD_SOURCE_EN_LABELS: Record<LeadSource, string> = {
  facebook_ad: "Facebook ad",
  instagram_ad: "Instagram ad",
  group: "Group",
  referral: "Referral",
  direct: "Direct",
  website: "Website",
  other: "Other",
};

export const COMM_CHANNEL_LABELS: Record<CommChannel, string> = {
  whatsapp: "واتساب",
  email: "بريد إلكتروني",
  call: "مكالمة",
  sms: "رسالة نصية",
};

export const COMM_CHANNEL_EN_LABELS: Record<CommChannel, string> = {
  whatsapp: "WhatsApp",
  email: "Email",
  call: "Call",
  sms: "SMS",
};

export const COURSE_TYPE_LABELS: Record<CourseType, string> = {
  scratch: "Scratch",
  python: "Python",
  web: "Web Development",
  ai: "AI & Machine Learning",
};

export const COURSE_TYPE_EN_LABELS: Record<CourseType, string> = {
  scratch: "Scratch",
  python: "Python",
  web: "Web Development",
  ai: "AI & Machine Learning",
};

export const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
  paid: "مدفوع",
  pending: "قيد الانتظار",
  overdue: "متأخر",
  refunded: "مسترد",
  partial: "مدفوع جزئيًا",
};

export const PAYMENT_STATUS_EN_LABELS: Record<PaymentStatus, string> = {
  paid: "Paid",
  pending: "Pending",
  overdue: "Overdue",
  refunded: "Refunded",
  partial: "Partially paid",
};

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  bank_transfer: "تحويل بنكي",
  card: "بطاقة",
  wallet: "محفظة إلكترونية",
  cash: "نقدي",
  instapay: "إنستاباي",
};

export const PAYMENT_METHOD_EN_LABELS: Record<PaymentMethod, string> = {
  bank_transfer: "Bank transfer",
  card: "Card",
  wallet: "Wallet",
  cash: "Cash",
  instapay: "Instapay",
};

export const EMPLOYMENT_TYPE_LABELS: Record<EmploymentType, string> = {
  full_time: "دوام كامل",
  part_time: "دوام جزئي",
  freelance: "تعاقد حر",
};

export const EMPLOYMENT_TYPE_EN_LABELS: Record<EmploymentType, string> = {
  full_time: "Full time",
  part_time: "Part time",
  freelance: "Freelance",
};

export const FILTER_LABELS = {
  allStages: "كل المراحل",
  allTemperatures: "كل التصنيفات",
  allStudentStatuses: "كل الحالات",
  allPriorities: "كل الأولويات",
} as const;

export const FILTER_EN_LABELS = {
  allStages: "All stages",
  allTemperatures: "All temperatures",
  allStudentStatuses: "All statuses",
  allPriorities: "All priorities",
} as const;

export const DAY_LABELS = ["الأحد", "الإثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"] as const;
export const DAY_EN_LABELS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"] as const;

export const CONVERSION_TERMS = {
  conversionRate: "معدل الاشتراك",
  successfulConversion: "اشتراك ناجح",
  averageConversionTime: "متوسط وقت قرار الاشتراك",
} as const;

export const CONVERSION_EN_TERMS = {
  conversionRate: "Enrollment rate",
  successfulConversion: "Successful enrollment",
  averageConversionTime: "Average enrollment decision time",
} as const;
