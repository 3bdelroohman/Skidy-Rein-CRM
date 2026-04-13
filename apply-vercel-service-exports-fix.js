const fs = require('fs');
const path = require('path');

function read(p){return fs.readFileSync(p,'utf8');}
function write(p,s){fs.writeFileSync(p,s,'utf8');}
function ensureImport(src, line){return src.includes(line)?src:line+'\n'+src;}
function appendIfMissing(src, marker, code){return src.includes(marker)?src:src.trimEnd()+"\n\n"+code.trim()+"\n";}

const root = process.cwd();
const files = {
  parents: path.join(root,'src/services/parents.service.ts'),
  students: path.join(root,'src/services/students.service.ts'),
  teachers: path.join(root,'src/services/teachers.service.ts'),
  schedule: path.join(root,'src/services/schedule.service.ts'),
  relations: path.join(root,'src/services/relations.service.ts'),
};

// parents.service.ts
let src = read(files.parents);
src = appendIfMissing(src, 'export async function createParent(', `
export async function createParent(input: {
  fullName: string;
  phone: string;
  whatsapp?: string | null;
  email?: string | null;
  city?: string | null;
}): Promise<ParentListItem> {
  const payload = {
    full_name: input.fullName.trim(),
    phone: input.phone.trim(),
    whatsapp: input.whatsapp?.trim() || null,
    email: input.email?.trim() || null,
    city: input.city?.trim() || null,
  };

  const supabase = getSupabaseClient();
  if (supabase) {
    const { data, error } = await supabase.from('parents').insert(payload).select('*').single();
    if (!error && data) {
      const mapped = mapRow(data as Record<string, unknown>);
      const existing = getLocalParents().filter((item) => item.id !== mapped.id);
      saveLocalParents([mapped, ...existing]);
      return mapped;
    }
    console.error('[parents] create failed, falling back locally', error);
  }

  const mapped = mapRow({ id: crypto.randomUUID(), ...payload, children_count: 0 });
  const existing = getLocalParents().filter((item) => item.id !== mapped.id);
  saveLocalParents([mapped, ...existing]);
  return mapped;
}`);
write(files.parents, src);

// students.service.ts
src = read(files.students);
src = appendIfMissing(src, 'export async function createStudent(', `
export async function createStudent(input: {
  fullName: string;
  age: number;
  parentName: string;
  parentPhone: string;
  parentId?: string | null;
  status?: StudentStatus;
  currentCourse?: StudentListItem['currentCourse'];
  className?: string | null;
  enrollmentDate?: string;
  sessionsAttended?: number;
  totalPaid?: number;
}): Promise<StudentListItem> {
  const payload = {
    full_name: input.fullName.trim(),
    age: input.age,
    parent_name: input.parentName.trim(),
    parent_phone: input.parentPhone.trim(),
    parent_id: input.parentId ?? null,
    status: input.status ?? 'trial',
    current_course: input.currentCourse ?? null,
    class_name: input.className ?? null,
    enrollment_date: input.enrollmentDate ?? new Date().toISOString(),
    sessions_attended: input.sessionsAttended ?? 0,
    total_paid: input.totalPaid ?? 0,
  };

  const supabase = getSupabaseClient();
  if (supabase) {
    const { data, error } = await supabase.from('students').insert(payload).select('*').single();
    if (!error && data) {
      const mapped = mapRow(data as Record<string, unknown>);
      const existing = getLocalStudents().filter((item) => item.id !== mapped.id);
      saveLocalStudents([mapped, ...existing]);
      return mapped;
    }
    console.error('[students] create failed, falling back locally', error);
  }

  const mapped = mapRow({ id: crypto.randomUUID(), ...payload });
  const existing = getLocalStudents().filter((item) => item.id !== mapped.id);
  saveLocalStudents([mapped, ...existing]);
  return mapped;
}`);
write(files.students, src);

// teachers.service.ts
src = read(files.teachers);
src = appendIfMissing(src, 'export async function createTeacher(', `
export async function createTeacher(input: {
  fullName: string;
  phone: string;
  email?: string | null;
  specialization?: CourseType[];
  employment?: EmploymentType;
  isActive?: boolean;
}): Promise<TeacherListItem> {
  const payload = {
    full_name: input.fullName.trim(),
    phone: input.phone.trim(),
    email: input.email?.trim() || '',
    specialization: input.specialization ?? [],
    employment: input.employment ?? 'part_time',
    is_active: input.isActive ?? true,
  };

  const supabase = getSupabaseClient();
  if (supabase) {
    const { data, error } = await supabase.from('teachers').insert(payload).select('*').single();
    if (!error && data) {
      const mapped = mapRow(data as Record<string, unknown>);
      const existing = getLocalTeachers().filter((item) => item.id !== mapped.id);
      saveLocalTeachers([mapped, ...existing]);
      return mapped;
    }
    console.error('[teachers] create failed, falling back locally', error);
  }

  const mapped = mapRow({ id: crypto.randomUUID(), ...payload, classes_count: 0, students_count: 0 });
  const existing = getLocalTeachers().filter((item) => item.id !== mapped.id);
  saveLocalTeachers([mapped, ...existing]);
  return mapped;
}`);
write(files.teachers, src);

// schedule.service.ts
src = read(files.schedule);
src = appendIfMissing(src, 'export async function createScheduleEntry(', `
export async function createScheduleEntry(input: {
  day: number;
  startTime: string;
  endTime: string;
  className: string;
  teacherId?: string | null;
  teacher?: string | null;
  course: CourseType;
  sessionDate?: string | null;
}): Promise<ScheduleSessionItem> {
  const supabase = getSupabaseClient();
  const teacherName = input.teacher ?? null;

  if (supabase) {
    let classId: string | null = null;
    const { data: classData, error: classError } = await supabase
      .from('classes')
      .insert({
        name: input.className.trim(),
        course: input.course,
        teacher_id: input.teacherId ?? null,
        day_of_week: input.day,
        starts_at: input.startTime,
        ends_at: input.endTime,
      })
      .select('id')
      .single();

    if (!classError && classData?.id) classId = classData.id;

    const { data, error } = await supabase
      .from('sessions')
      .insert({
        class_id: classId,
        teacher_id: input.teacherId ?? null,
        day_of_week: input.day,
        start_time: input.startTime,
        end_time: input.endTime,
        session_date: input.sessionDate ?? null,
      })
      .select('*')
      .single();

    if (!error && data) {
      const teachers = await listTeachers();
      return mapSessionFromSession(
        data as Database['public']['Tables']['sessions']['Row'],
        new Map(classId ? [[classId, {
          id: classId,
          name: input.className.trim(),
          course: input.course,
          teacher_id: input.teacherId ?? null,
        } as unknown as Database['public']['Tables']['classes']['Row']]] : []),
        teachers,
        0,
      );
    }

    console.error('[schedule] create failed, falling back locally', error ?? classError);
  }

  const localItem: ScheduleSessionItem = {
    id: crypto.randomUUID(),
    classId: null,
    teacherId: input.teacherId ?? null,
    day: input.day,
    startTime: input.startTime,
    endTime: input.endTime,
    className: input.className.trim(),
    teacher: teacherName ?? '—',
    students: 0,
    course: input.course,
    sessionDate: input.sessionDate ?? null,
  };
  const existing = await listScheduleSessions();
  saveLocalSchedule([localItem, ...existing]);
  return localItem;
}`);
write(files.schedule, src);

// relations.service.ts
src = read(files.relations);
src = appendIfMissing(src, 'export function extractLeadIdFromProjectionId(', `
export function extractLeadIdFromProjectionId(value: string | null | undefined): string | null {
  if (!value) return null;
  const exactPrefixes = ['projection:lead:', 'projected-lead-', 'lead:', 'lead-'];
  for (const prefix of exactPrefixes) {
    if (value.startsWith(prefix)) {
      const rest = value.slice(prefix.length);
      return rest.split(':')[0] || null;
    }
  }
  const parts = value.split(':');
  const leadIndex = parts.findIndex((part) => part === 'lead');
  if (leadIndex >= 0 && parts[leadIndex + 1]) return parts[leadIndex + 1];
  return null;
}`);
write(files.relations, src);

console.log('[OK] ensured missing Vercel service exports');
