import { readStorage, writeStorage } from "@/services/storage";

const KEY = "skidy.crm.teacher-evaluations";

export interface TeacherEvaluationRecord {
  teacherId: string;
  rating: number | null;
  notes: string | null;
  updatedAt: string;
}

function readAll(): Record<string, TeacherEvaluationRecord> {
  return readStorage<Record<string, TeacherEvaluationRecord>>(KEY, {});
}

function writeAll(data: Record<string, TeacherEvaluationRecord>) {
  writeStorage(KEY, data);
}

export function getTeacherEvaluation(teacherId: string): TeacherEvaluationRecord | null {
  const all = readAll();
  return all[teacherId] ?? null;
}

export function saveTeacherEvaluation(input: { teacherId: string; rating: number | null; notes?: string | null }) {
  const all = readAll();
  const record: TeacherEvaluationRecord = {
    teacherId: input.teacherId,
    rating: input.rating,
    notes: input.notes?.trim() || null,
    updatedAt: new Date().toISOString(),
  };
  all[input.teacherId] = record;
  writeAll(all);
  return record;
}
