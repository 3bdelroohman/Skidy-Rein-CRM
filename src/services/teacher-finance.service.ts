import type { CourseType, ScheduleSessionItem } from "@/types/crm";
import { readStorage, writeStorage } from "@/services/storage";

const KEY = "skidy.crm.teacher-finance";

export interface TeacherFinanceConfig {
  teacherId: string;
  sessionRate60: number;
  sessionRate90: number;
  sessionRate120: number;
  trackAdjustments: Record<CourseType, number>;
  notes: string | null;
  updatedAt: string | null;
}

export interface TeacherFinanceLineItem {
  sessionId: string;
  className: string;
  course: CourseType;
  minutes: number;
  payout: number;
}

export interface TeacherFinanceSummary {
  linkedSessions: number;
  weeklyEstimated: number;
  monthlyEstimated: number;
  averagePerSession: number;
  lines: TeacherFinanceLineItem[];
}

type TeacherFinanceStorage = Record<string, TeacherFinanceConfig>;

const DEFAULT_TRACK_ADJUSTMENTS: Record<CourseType, number> = {
  scratch: 0,
  python: 20,
  web: 30,
  ai: 40,
};

function defaultConfig(teacherId: string): TeacherFinanceConfig {
  return {
    teacherId,
    sessionRate60: 120,
    sessionRate90: 180,
    sessionRate120: 240,
    trackAdjustments: { ...DEFAULT_TRACK_ADJUSTMENTS },
    notes: null,
    updatedAt: null,
  };
}

function readAll(): TeacherFinanceStorage {
  return readStorage<TeacherFinanceStorage>(KEY, {});
}

function writeAll(data: TeacherFinanceStorage) {
  writeStorage(KEY, data);
}

function safeNumber(value: number | null | undefined, fallback: number): number {
  return Number.isFinite(value) ? Number(value) : fallback;
}

export function getTeacherFinanceConfig(teacherId: string): TeacherFinanceConfig {
  const stored = readAll()[teacherId];
  const base = defaultConfig(teacherId);
  if (!stored) return base;

  return {
    teacherId,
    sessionRate60: safeNumber(stored.sessionRate60, base.sessionRate60),
    sessionRate90: safeNumber(stored.sessionRate90, base.sessionRate90),
    sessionRate120: safeNumber(stored.sessionRate120, base.sessionRate120),
    trackAdjustments: {
      scratch: safeNumber(stored.trackAdjustments?.scratch, base.trackAdjustments.scratch),
      python: safeNumber(stored.trackAdjustments?.python, base.trackAdjustments.python),
      web: safeNumber(stored.trackAdjustments?.web, base.trackAdjustments.web),
      ai: safeNumber(stored.trackAdjustments?.ai, base.trackAdjustments.ai),
    },
    notes: stored.notes ?? null,
    updatedAt: stored.updatedAt ?? null,
  };
}

export function saveTeacherFinanceConfig(input: {
  teacherId: string;
  sessionRate60: number;
  sessionRate90: number;
  sessionRate120: number;
  trackAdjustments: Record<CourseType, number>;
  notes?: string | null;
}) {
  const all = readAll();
  const record: TeacherFinanceConfig = {
    teacherId: input.teacherId,
    sessionRate60: safeNumber(input.sessionRate60, 120),
    sessionRate90: safeNumber(input.sessionRate90, 180),
    sessionRate120: safeNumber(input.sessionRate120, 240),
    trackAdjustments: {
      scratch: safeNumber(input.trackAdjustments.scratch, 0),
      python: safeNumber(input.trackAdjustments.python, 20),
      web: safeNumber(input.trackAdjustments.web, 30),
      ai: safeNumber(input.trackAdjustments.ai, 40),
    },
    notes: input.notes?.trim() || null,
    updatedAt: new Date().toISOString(),
  };
  all[input.teacherId] = record;
  writeAll(all);
  return record;
}

function toMinutes(startTime: string, endTime: string): number {
  const [startHour, startMinute] = startTime.split(":").map(Number);
  const [endHour, endMinute] = endTime.split(":").map(Number);
  if ([startHour, startMinute, endHour, endMinute].some((value) => !Number.isFinite(value))) return 60;
  const start = startHour * 60 + startMinute;
  let end = endHour * 60 + endMinute;
  if (end <= start) end += 24 * 60;
  return Math.max(30, end - start);
}

function getBaseSessionRate(minutes: number, config: TeacherFinanceConfig): number {
  if (minutes <= 60) return config.sessionRate60;
  if (minutes <= 90) return config.sessionRate90;
  if (minutes <= 120) return config.sessionRate120;
  const extraMinutes = minutes - 120;
  return config.sessionRate120 + Math.ceil(extraMinutes / 30) * (config.sessionRate60 / 2);
}

export function computeTeacherFinanceSummary(sessions: ScheduleSessionItem[], config: TeacherFinanceConfig): TeacherFinanceSummary {
  const lines = sessions.map((session) => {
    const minutes = toMinutes(session.startTime, session.endTime);
    const payout = getBaseSessionRate(minutes, config) + (config.trackAdjustments[session.course] ?? 0);
    return {
      sessionId: session.id,
      className: session.className,
      course: session.course,
      minutes,
      payout,
    };
  });

  const weeklyEstimated = lines.reduce((sum, item) => sum + item.payout, 0);
  const monthlyEstimated = Math.round(weeklyEstimated * 4.33);

  return {
    linkedSessions: lines.length,
    weeklyEstimated,
    monthlyEstimated,
    averagePerSession: lines.length > 0 ? Math.round(weeklyEstimated / lines.length) : 0,
    lines,
  };
}
