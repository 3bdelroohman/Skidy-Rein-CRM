import { getCourseFormLabel } from "@/config/course-roadmap";
import type { StudentDetails } from "@/types/crm";

export interface StudentReportSnapshot {
  ready: boolean;
  currentCheckpoint: number;
  nextCheckpoint: number;
  sessionsInCurrentCycle: number;
  sessionsUntilNext: number;
  progressPercent: number;
  teacherName: string | null;
  className: string | null;
  cycleLabelAr: string;
  cycleLabelEn: string;
}

export interface StudentMonthlyReportDraft {
  summaryAr: string;
  summaryEn: string;
  strengthsAr: string[];
  strengthsEn: string[];
  focusAreasAr: string[];
  focusAreasEn: string[];
  nextGoalAr: string;
  nextGoalEn: string;
}

function ceilToCheckpoint(value: number, checkpoint = 4): number {
  if (value <= 0) return checkpoint;
  return Math.ceil(value / checkpoint) * checkpoint;
}

export function buildStudentReportSnapshot(student: StudentDetails): StudentReportSnapshot {
  const totalSessions = Math.max(0, student.sessionsAttended);
  const nextCheckpoint = ceilToCheckpoint(totalSessions + (totalSessions % 4 === 0 ? 4 : 0));
  const currentCheckpoint = totalSessions >= 4 ? Math.floor(totalSessions / 4) * 4 : 0;
  const sessionsInCurrentCycle = totalSessions % 4;
  const sessionsUntilNext = totalSessions === 0 ? 4 : (4 - sessionsInCurrentCycle) % 4 || 4;
  const progressPercent = Math.min(100, Math.max(0, Math.round((sessionsInCurrentCycle / 4) * 100)));

  return {
    ready: totalSessions >= 4,
    currentCheckpoint,
    nextCheckpoint,
    sessionsInCurrentCycle,
    sessionsUntilNext,
    progressPercent,
    teacherName: student.teachers[0]?.fullName ?? null,
    className: student.className ?? student.relatedSessions[0]?.className ?? null,
    cycleLabelAr: currentCheckpoint > 0 ? `تقرير حتى الحصة ${currentCheckpoint}` : "قبل أول تقرير شهري",
    cycleLabelEn: currentCheckpoint > 0 ? `Report through session ${currentCheckpoint}` : "Before the first monthly report",
  };
}

export function buildStudentMonthlyReportDraft(student: StudentDetails): StudentMonthlyReportDraft {
  const snapshot = buildStudentReportSnapshot(student);
  const courseLabelAr = student.currentCourse ? getCourseFormLabel(student.currentCourse, "ar") : "المسار الحالي";
  const courseLabelEn = student.currentCourse ? getCourseFormLabel(student.currentCourse, "en") : "current track";
  const teacherName = snapshot.teacherName ?? "المدرس الحالي";
  const teacherNameEn = snapshot.teacherName ?? "current teacher";
  const className = snapshot.className ?? "الكلاس الحالي";
  const classNameEn = snapshot.className ?? "current class";

  return {
    summaryAr: `الطالب مستمر في ${courseLabelAr} داخل ${className} مع ${teacherName}. أنجز ${student.sessionsAttended} حصة حتى الآن ونسبة التقدم الحالية ${snapshot.progressPercent}%.`,
    summaryEn: `The student is progressing in ${courseLabelEn} within ${classNameEn} with ${teacherNameEn}. ${student.sessionsAttended} sessions are completed so far with ${snapshot.progressPercent}% progress in the current cycle.`,
    strengthsAr: [
      `الالتزام بالحضور وصل إلى ${student.sessionsAttended} حصة`,
      snapshot.teacherName ? `يوجد مدرس مرتبط بوضوح: ${teacherName}` : "تم تحديد المسار العام للطالب",
      student.currentCourse ? `المسار الحالي محدد: ${courseLabelAr}` : "هناك حاجة لتحديد المسار بدقة أكبر",
    ],
    strengthsEn: [
      `Attendance has reached ${student.sessionsAttended} sessions`,
      snapshot.teacherName ? `A clear teacher link exists: ${teacherNameEn}` : "The general learning path is identified",
      student.currentCourse ? `The current track is defined: ${courseLabelEn}` : "The track still needs sharper definition",
    ],
    focusAreasAr: [
      snapshot.sessionsUntilNext > 0 ? `المتبقي ${snapshot.sessionsUntilNext} حصص للوصول إلى نقطة التقرير التالية` : "جاهز لنقطة التقرير التالية",
      snapshot.className ? `الحفاظ على الاتساق داخل ${className}` : "تثبيت الكلاس المناسب للطالب",
      snapshot.teacherName ? `متابعة الخطة مع ${teacherName}` : "تعيين مدرس أساسي ومتابعة الخطة معه",
    ],
    focusAreasEn: [
      snapshot.sessionsUntilNext > 0 ? `${snapshot.sessionsUntilNext} sessions remain before the next checkpoint` : "Ready for the next checkpoint",
      snapshot.className ? `Maintain consistency inside ${classNameEn}` : "Stabilize the student inside the right class",
      snapshot.teacherName ? `Continue the plan with ${teacherNameEn}` : "Assign a primary teacher and continue the plan",
    ],
    nextGoalAr: snapshot.sessionsUntilNext > 0 ? `الوصول إلى الحصة ${snapshot.nextCheckpoint} لاستخراج التقرير الشهري التالي.` : "مراجعة التقرير الشهري الحالي وتحديث الهدف التالي.",
    nextGoalEn: snapshot.sessionsUntilNext > 0 ? `Reach session ${snapshot.nextCheckpoint} to unlock the next monthly report.` : "Review the current monthly report and define the next goal.",
  };
}
