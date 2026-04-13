import type { CourseType } from "@/types/common.types";
import type {
  ParentDetails,
  ParentListItem,
  ScheduleSessionItem,
  StudentDetails,
  StudentListItem,
  TeacherDetails,
  TeacherListItem,
} from "@/types/crm";
import { listLeads } from "@/services/leads.service";
import { listParents } from "@/services/parents.service";
import { listScheduleSessions } from "@/services/schedule.service";
import { getStudentById, listStudents } from "@/services/students.service";
import { listTeachers } from "@/services/teachers.service";

function normalizeName(value: string | null | undefined): string {
  return (value ?? "")
    .toLowerCase()
    .replace(/أ\.?\s*/g, "")
    .replace(/[\u064B-\u065F]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizePhone(value: string | null | undefined): string {
  const digits = (value ?? "").replace(/\D/g, "");
  if (digits.startsWith("20") && digits.length > 11) return digits.slice(2);
  if (digits.startsWith("2") && digits.length === 12) return digits.slice(1);
  return digits;
}

function samePhone(a: string | null | undefined, b: string | null | undefined): boolean {
  const left = normalizePhone(a);
  const right = normalizePhone(b);
  return left.length > 0 && left === right;
}

function sameName(a: string | null | undefined, b: string | null | undefined): boolean {
  const left = normalizeName(a);
  const right = normalizeName(b);
  return left.length > 0 && left === right;
}

function findParentForStudent(student: StudentListItem, parents: ParentListItem[]): ParentListItem | null {
  if (student.parentId) {
    const direct = parents.find((parent) => parent.id === student.parentId);
    if (direct) return direct;
  }

  return (
    parents.find((parent) => samePhone(parent.phone, student.parentPhone)) ??
    parents.find((parent) => sameName(parent.fullName, student.parentName)) ??
    null
  );
}

function findStudentsForParent(parent: ParentListItem, students: StudentListItem[]): StudentListItem[] {
  return students.filter((student) => {
    if (student.parentId && student.parentId === parent.id) return true;
    if (samePhone(student.parentPhone, parent.phone)) return true;
    return sameName(student.parentName, parent.fullName);
  });
}

function findSessionsForStudent(student: StudentListItem, sessions: ScheduleSessionItem[]): ScheduleSessionItem[] {
  const directClass = student.className
    ? sessions.filter((session) => sameName(session.className, student.className))
    : [];

  if (directClass.length > 0) return directClass;
  if (!student.currentCourse) return [];

  return sessions.filter((session) => session.course === student.currentCourse);
}

function findSessionsForTeacher(teacher: TeacherListItem, sessions: ScheduleSessionItem[]): ScheduleSessionItem[] {
  return sessions.filter((session) => {
    const sessionTeacher = normalizeName(session.teacher);
    const teacherName = normalizeName(teacher.fullName);
    return sessionTeacher.length > 0 && (sessionTeacher.includes(teacherName) || teacherName.includes(sessionTeacher));
  });
}

function uniqueTeachers(teachers: TeacherListItem[]): TeacherListItem[] {
  const map = new Map<string, TeacherListItem>();
  teachers.forEach((teacher) => {
    if (!map.has(teacher.id)) map.set(teacher.id, teacher);
  });
  return Array.from(map.values());
}

function uniqueCourses(courses: CourseType[]): CourseType[] {
  return Array.from(new Set(courses));
}

export async function getStudentDetails(id: string): Promise<StudentDetails | null> {
  const student = await getStudentById(id);
  if (!student) return null;

  const [students, parents, teachers, sessions] = await Promise.all([
    listStudents(),
    listParents(),
    listTeachers(),
    listScheduleSessions(),
  ]);

  const parent = findParentForStudent(student, parents);
  const siblings = parent
    ? findStudentsForParent(parent, students).filter((item) => item.id !== student.id)
    : students.filter((item) => item.id !== student.id && samePhone(item.parentPhone, student.parentPhone));

  const relatedSessions = findSessionsForStudent(student, sessions);
  const linkedTeachers = uniqueTeachers(
    relatedSessions
      .map((session) => teachers.find((teacher) => findSessionsForTeacher(teacher, [session]).length > 0) ?? null)
      .filter((teacher): teacher is TeacherListItem => teacher !== null),
  );

  return {
    ...student,
    parent,
    siblings,
    relatedSessions,
    teachers: linkedTeachers,
  };
}

export async function listParentsWithRelations(): Promise<ParentListItem[]> {
  const [parents, students] = await Promise.all([listParents(), listStudents()]);

  return parents.map((parent) => {
    const childrenRecords = findStudentsForParent(parent, students);
    return {
      ...parent,
      childrenCount: childrenRecords.length || parent.childrenCount,
      children: childrenRecords.map((student) => student.fullName),
    };
  });
}

export async function getParentDetails(id: string): Promise<ParentDetails | null> {
  const [parents, students, leads] = await Promise.all([
    listParentsWithRelations(),
    listStudents(),
    listLeads(),
  ]);

  const parent = parents.find((item) => item.id === id) ?? null;
  if (!parent) return null;

  const childrenRecords = findStudentsForParent(parent, students);
  const openLeads = leads.filter((lead) => {
    if (lead.stage === "won") return false;
    if (samePhone(lead.parentPhone, parent.phone)) return true;
    return sameName(lead.parentName, parent.fullName);
  });

  return {
    ...parent,
    childrenCount: childrenRecords.length || parent.childrenCount,
    children: childrenRecords.map((student) => student.fullName),
    childrenRecords,
    activeStudents: childrenRecords.filter((student) => student.status === "active" || student.status === "trial").length,
    totalPaid: childrenRecords.reduce((sum, student) => sum + student.totalPaid, 0),
    openLeads,
  };
}

export async function listTeachersWithRelations(): Promise<TeacherListItem[]> {
  const [teachers, students, sessions] = await Promise.all([
    listTeachers(),
    listStudents(),
    listScheduleSessions(),
  ]);

  return teachers.map((teacher) => {
    const linkedSessions = findSessionsForTeacher(teacher, sessions);
    const classNames = linkedSessions.map((session) => normalizeName(session.className));
    const linkedStudents = students.filter((student) => {
      const classMatch = student.className ? classNames.includes(normalizeName(student.className)) : false;
      const courseMatch = student.currentCourse ? teacher.specialization.includes(student.currentCourse) : false;
      return classMatch || courseMatch;
    });

    return {
      ...teacher,
      classesCount: linkedSessions.length || teacher.classesCount,
      studentsCount: linkedStudents.length || teacher.studentsCount,
    };
  });
}

export async function getTeacherDetails(id: string): Promise<TeacherDetails | null> {
  const [teachers, students, sessions] = await Promise.all([
    listTeachersWithRelations(),
    listStudents(),
    listScheduleSessions(),
  ]);

  const teacher = teachers.find((item) => item.id === id) ?? null;
  if (!teacher) return null;

  const linkedSessions = findSessionsForTeacher(teacher, sessions);
  const classNames = linkedSessions.map((session) => normalizeName(session.className));
  const linkedStudents = students.filter((student) => {
    const classMatch = student.className ? classNames.includes(normalizeName(student.className)) : false;
    const courseMatch = student.currentCourse ? teacher.specialization.includes(student.currentCourse) : false;
    return classMatch || courseMatch;
  });

  return {
    ...teacher,
    linkedSessions,
    linkedStudents,
    activeCourses: uniqueCourses(linkedSessions.map((session) => session.course)),
  };
}
