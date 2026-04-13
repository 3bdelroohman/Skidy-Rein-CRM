const fs = require('fs');
const path = require('path');

function read(file) { return fs.readFileSync(file, 'utf8'); }
function write(file, text) { fs.writeFileSync(file, text, 'utf8'); }
function ensureContains(text, needle, replacement) {
  return text.includes(needle) ? text : replacement(text);
}

const root = process.cwd();
const servicePath = path.join(root, 'src/services/teachers.service.ts');
const pagePath = path.join(root, 'src/app/(dashboard)/teachers/[id]/page.tsx');

let service = read(servicePath);
if (!service.includes('export async function deleteTeacher(')) {
  service += `

export async function deleteTeacher(id: string): Promise<boolean> {
  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      const { error } = await supabase.from("teachers").delete().eq("id", id);
      if (!error) {
        saveLocalTeachers(getLocalTeachers().filter((teacher) => teacher.id !== id));
        return true;
      }
    } catch {}
  }

  const current = getLocalTeachers();
  const next = current.filter((teacher) => teacher.id !== id);
  if (next.length === current.length) return false;
  saveLocalTeachers(next);
  return true;
}
`;
  write(servicePath, service);
  console.log('[OK] added deleteTeacher to teachers.service.ts');
} else {
  console.log('[OK] deleteTeacher already exists in teachers.service.ts');
}

let page = read(pagePath);
page = page.replace('import Link from "next/link";\n', 'import Link from "next/link";\nimport { useRouter } from "next/navigation";\n');
page = page.replace('{ ArrowLeft, ArrowRight, BookOpen, CalendarDays, Mail, Phone, Users } from "lucide-react";', '{ ArrowLeft, ArrowRight, BookOpen, CalendarDays, Mail, Phone, Trash2, Users } from "lucide-react";');
if (!page.includes('from "sonner"')) {
  page = page.replace('import { getTeacherDetails } from "@/services/relations.service";\n', 'import { getTeacherDetails } from "@/services/relations.service";\nimport { deleteTeacher } from "@/services/teachers.service";\nimport { toast } from "sonner";\n');
}
if (!page.includes('const router = useRouter();')) {
  page = page.replace('  const locale = useUIStore((state) => state.locale);\n  const isAr = locale === "ar";\n', '  const locale = useUIStore((state) => state.locale);\n  const isAr = locale === "ar";\n  const router = useRouter();\n');
}
if (!page.includes('const [deleting, setDeleting] = useState(false);')) {
  page = page.replace('  const [teacher, setTeacher] = useState<TeacherDetails | null>(null);\n  const [loading, setLoading] = useState(true);\n', '  const [teacher, setTeacher] = useState<TeacherDetails | null>(null);\n  const [loading, setLoading] = useState(true);\n  const [deleting, setDeleting] = useState(false);\n');
}
if (!page.includes('async function handleDeleteTeacher()')) {
  page = page.replace('  }, [id]);\n\n  if (loading) {', `  }, [id]);\n\n  const hasBlockingRelations = (teacher?.linkedSessions?.length ?? 0) > 0 || (teacher?.linkedStudents?.length ?? 0) > 0;\n\n  async function handleDeleteTeacher() {\n    if (!teacher) return;\n    if (hasBlockingRelations) {\n      toast.error(t(locale, "لا يمكن حذف المدرس لأنه مرتبط بحصص أو طلاب", "This teacher cannot be deleted while linked to sessions or students"));\n      return;\n    }\n\n    const confirmed = window.confirm(\n      t(locale, "سيتم حذف المدرس نهائيًا. هل تريد المتابعة؟", "This will permanently delete the teacher. Do you want to continue?"),\n    );\n    if (!confirmed) return;\n\n    setDeleting(true);\n    const ok = await deleteTeacher(teacher.id);\n    setDeleting(false);\n\n    if (!ok) {\n      toast.error(t(locale, "تعذر حذف المدرس", "Failed to delete teacher"));\n      return;\n    }\n\n    toast.success(t(locale, "تم حذف المدرس", "Teacher deleted"));\n    router.push("/teachers");\n  }\n\n  if (loading) {`);
}
if (!page.includes('handleDeleteTeacher')) {
  console.error('Failed to inject delete handler');
}
if (!page.includes('لا يمكن حذف المدرس لأنه مرتبط بحصص أو طلاب')) {
  page = page.replace('      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">', `      <div className="rounded-2xl border border-red-200 bg-red-50/70 p-4 dark:border-red-900/50 dark:bg-red-950/20">\n        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">\n          <div>\n            <p className="text-sm font-bold text-foreground">{t(locale, "حذف المدرس", "Delete teacher")}</p>\n            <p className="mt-1 text-xs text-muted-foreground">\n              {hasBlockingRelations\n                ? t(locale, "احذف أو انقل الحصص والطلاب المرتبطين أولًا ثم احذف المدرس.", "Remove or reassign linked sessions and students first, then delete the teacher.")\n                : t(locale, "سيتم حذف المدرس نهائيًا من النظام.", "The teacher will be permanently removed from the system.")}\n            </p>\n          </div>\n          <button\n            type="button"\n            onClick={handleDeleteTeacher}\n            disabled={deleting || hasBlockingRelations}\n            className="inline-flex items-center justify-center gap-2 rounded-xl border border-red-200 bg-white px-4 py-2 text-sm font-semibold text-red-700 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-red-900/50 dark:bg-transparent dark:text-red-300 dark:hover:bg-red-950/30"\n          >\n            <Trash2 size={16} />\n            {deleting ? t(locale, "جارِ الحذف...", "Deleting...") : t(locale, "حذف المدرس", "Delete teacher")}\n          </button>\n        </div>\n      </div>\n\n      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">`);
}
write(pagePath, page);
console.log('[OK] patched teacher details page with delete action');
