import type { StudentDetails } from "@/types/crm";
import { getCourseTrackMeta } from "@/config/course-roadmap";
import { buildStudentReportSnapshot } from "@/services/student-report.service";

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
  const report = buildStudentReportSnapshot(student);
  const trackMeta = getCourseTrackMeta(student.currentCourse);

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
      id: "class",
      titleAr: "الكلاس الحالي",
      titleEn: "Current class",
      detailAr: report.className ? `الطالب مرتبط الآن بـ ${report.className}` : "لم يتم ربط كلاس بعد",
      detailEn: report.className ? `Currently linked to ${report.className}` : "No class linked yet",
      tone: report.className ? "info" : "warning",
    },
    {
      id: "course",
      titleAr: "المسار الحالي",
      titleEn: "Current track",
      detailAr: trackMeta ? `يعمل الآن داخل ${trackMeta.labelAr}` : (student.currentCourse ? `يعمل الآن داخل مسار ${student.currentCourse}` : "لم يتم تحديد المسار بعد"),
      detailEn: trackMeta ? `Currently progressing in ${trackMeta.labelEn}` : (student.currentCourse ? `Currently progressing in ${student.currentCourse}` : "No track assigned yet"),
      tone: student.currentCourse ? "info" : "warning",
    },
    {
      id: "teacher",
      titleAr: "المدرس المرتبط",
      titleEn: "Assigned teacher",
      detailAr: report.teacherName ? `المدرس الحالي: ${report.teacherName}` : "لم يتم ربط مدرس بعد",
      detailEn: report.teacherName ? `Current teacher: ${report.teacherName}` : "No teacher linked yet",
      tone: report.teacherName ? "success" : "warning",
    },
    {
      id: "sessions",
      titleAr: "الإنجاز داخل الحصص",
      titleEn: "Session progress",
      detailAr: `أنجز ${student.sessionsAttended} حصة حتى الآن — ${report.cycleLabelAr}`,
      detailEn: `Completed ${student.sessionsAttended} sessions so far — ${report.cycleLabelEn}`,
      tone: student.sessionsAttended >= 4 ? "success" : "info",
    },
    {
      id: "report",
      titleAr: "نقطة التقرير القادمة",
      titleEn: "Next report checkpoint",
      detailAr: report.ready
        ? `آخر نقطة تقرير مكتملة عند ${report.currentCheckpoint} حصص، والنقطة القادمة عند ${report.nextCheckpoint}`
        : `أول تقرير يصبح جاهزًا بعد ${report.sessionsUntilNext} حصص إضافية`,
      detailEn: report.ready
        ? `Last completed checkpoint at ${report.currentCheckpoint} sessions, next one at ${report.nextCheckpoint}`
        : `First report becomes ready after ${report.sessionsUntilNext} more sessions`,
      tone: report.ready ? "success" : "info",
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
  const stageAr = reportReady ? "جاهز للتقرير الحالي" : "ما زال قبل أول نقطة تقرير";
  const stageEn = reportReady ? "Ready for the current report checkpoint" : "Still before the first report checkpoint";

  return { stageAr, stageEn, reportReady, milestones };
}
