import type { StudentDetails } from "@/types/crm";

export interface StudentJourneyMilestone {
  id: string;
  titleAr: string;
  titleEn: string;
  detailAr: string;
  detailEn: string;
  tone: "brand" | "success" | "warning" | "info";
}

export interface StudentJourneySummary {
  stageAr: string;
  stageEn: string;
  reportReady: boolean;
  milestones: StudentJourneyMilestone[];
}

export function buildStudentJourney(student: StudentDetails): StudentJourneySummary {
  const milestones: StudentJourneyMilestone[] = [
    {
      id: "enrollment",
      titleAr: "بداية الرحلة",
      titleEn: "Journey started",
      detailAr: `التحق بتاريخ ${student.enrollmentDate}`,
      detailEn: `Joined on ${student.enrollmentDate}`,
      tone: "brand",
    },
    {
      id: "course",
      titleAr: "المسار الحالي",
      titleEn: "Current track",
      detailAr: student.currentCourse ? `يعمل الآن داخل مسار ${student.currentCourse}` : "لم يتم تحديد المسار بعد",
      detailEn: student.currentCourse ? `Currently progressing in ${student.currentCourse}` : "No track assigned yet",
      tone: student.currentCourse ? "info" : "warning",
    },
    {
      id: "teacher",
      titleAr: "المدرس المرتبط",
      titleEn: "Assigned teacher",
      detailAr: student.teachers[0] ? `المدرس الحالي: ${student.teachers[0].fullName}` : "لم يتم ربط مدرس بعد",
      detailEn: student.teachers[0] ? `Current teacher: ${student.teachers[0].fullName}` : "No teacher linked yet",
      tone: student.teachers[0] ? "success" : "warning",
    },
    {
      id: "sessions",
      titleAr: "الإنجاز داخل الحصص",
      titleEn: "Session progress",
      detailAr: `أنجز ${student.sessionsAttended} حصة حتى الآن`,
      detailEn: `Completed ${student.sessionsAttended} sessions so far`,
      tone: student.sessionsAttended >= 4 ? "success" : "info",
    },
    {
      id: "payments",
      titleAr: "الالتزام المالي",
      titleEn: "Payment progress",
      detailAr: `إجمالي المدفوع ${student.totalPaid} جنيه`,
      detailEn: `Total paid ${student.totalPaid} EGP`,
      tone: student.totalPaid > 0 ? "success" : "warning",
    },
  ];

  const reportReady = student.sessionsAttended >= 4;
  const stageAr = reportReady ? "جاهز لأول تقرير شهري" : "ما زال في مرحلة التأسيس";
  const stageEn = reportReady ? "Ready for the first monthly report" : "Still in the foundation phase";

  return { stageAr, stageEn, reportReady, milestones };
}
