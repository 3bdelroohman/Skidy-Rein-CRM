import type { TeacherListItem } from "@/types/crm";
import { MOCK_TEACHERS } from "@/lib/mock-data";
import { readStorage, writeStorage } from "@/services/storage";

const TEACHERS_KEY = "skidy.crm.teachers";

function sortTeachers(items: TeacherListItem[]): TeacherListItem[] {
  return [...items].sort((a, b) => a.fullName.localeCompare(b.fullName, "ar"));
}

function mockTeachers(): TeacherListItem[] {
  return MOCK_TEACHERS.map((teacher) => ({ ...teacher }));
}

function getLocalTeachers(): TeacherListItem[] {
  return sortTeachers(readStorage(TEACHERS_KEY, mockTeachers()));
}

function saveLocalTeachers(items: TeacherListItem[]): void {
  writeStorage(TEACHERS_KEY, sortTeachers(items));
}

export async function listTeachers(): Promise<TeacherListItem[]> {
  const local = getLocalTeachers();
  if (local.length > 0) return local;
  const fallback = mockTeachers();
  saveLocalTeachers(fallback);
  return fallback;
}

export async function getTeacherById(id: string): Promise<TeacherListItem | null> {
  const items = await listTeachers();
  return items.find((teacher) => teacher.id === id) ?? null;
}
