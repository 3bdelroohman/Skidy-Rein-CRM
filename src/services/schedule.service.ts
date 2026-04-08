import type { ScheduleSessionItem } from "@/types/crm";
import { readStorage, writeStorage } from "@/services/storage";

const SCHEDULE_KEY = "skidy.crm.schedule";

const DEFAULT_SCHEDULE: ScheduleSessionItem[] = [
  { id: "1", day: 0, startTime: "16:00", endTime: "17:00", className: "Scratch A", teacher: "أ. محمود", students: 5, course: "scratch" },
  { id: "2", day: 0, startTime: "17:30", endTime: "18:30", className: "Python A", teacher: "أ. دينا", students: 4, course: "python" },
  { id: "3", day: 1, startTime: "16:00", endTime: "17:00", className: "Scratch B", teacher: "أ. كريم", students: 6, course: "scratch" },
  { id: "4", day: 2, startTime: "18:00", endTime: "19:00", className: "AI Intro", teacher: "أ. دينا", students: 3, course: "ai" },
  { id: "5", day: 3, startTime: "17:00", endTime: "18:00", className: "Web Starters", teacher: "أ. كريم", students: 4, course: "web" },
  { id: "6", day: 4, startTime: "16:30", endTime: "17:30", className: "Scratch Trial", teacher: "أ. محمود", students: 5, course: "scratch" },
];

function sortSessions(items: ScheduleSessionItem[]): ScheduleSessionItem[] {
  return [...items].sort((a, b) => {
    if (a.day !== b.day) return a.day - b.day;
    return a.startTime.localeCompare(b.startTime);
  });
}

function getLocalSchedule(): ScheduleSessionItem[] {
  return sortSessions(readStorage(SCHEDULE_KEY, DEFAULT_SCHEDULE));
}

function saveLocalSchedule(items: ScheduleSessionItem[]): void {
  writeStorage(SCHEDULE_KEY, sortSessions(items));
}

export async function listScheduleSessions(): Promise<ScheduleSessionItem[]> {
  const local = getLocalSchedule();
  if (local.length > 0) return local;
  saveLocalSchedule(DEFAULT_SCHEDULE);
  return DEFAULT_SCHEDULE;
}

export async function getScheduleSessionById(id: string): Promise<ScheduleSessionItem | null> {
  const items = await listScheduleSessions();
  return items.find((session) => session.id === id) ?? null;
}

export async function getScheduleOverview() {
  const sessions = await listScheduleSessions();
  const totalStudents = sessions.reduce((sum, session) => sum + session.students, 0);
  const uniqueTeachers = new Set(sessions.map((session) => session.teacher)).size;
  const busiestDay = sessions.reduce(
    (acc, session) => {
      acc[session.day] = (acc[session.day] ?? 0) + 1;
      return acc;
    },
    {} as Record<number, number>,
  );

  const busiestDayEntry = Object.entries(busiestDay).sort((a, b) => Number(b[1]) - Number(a[1]))[0];

  return {
    sessionsCount: sessions.length,
    totalStudents,
    uniqueTeachers,
    busiestDay: busiestDayEntry ? Number(busiestDayEntry[0]) : 0,
    busiestDayCount: busiestDayEntry ? Number(busiestDayEntry[1]) : 0,
  };
}
