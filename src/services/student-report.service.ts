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
  };
}
