"use client";

import { useRouter } from "next/navigation";
import { TeacherForm } from "@/components/teachers/teacher-form";
import { createTeacher } from "@/services/teachers.service";

export default function NewTeacherPage() {
  const router = useRouter();

  return (
    <TeacherForm
      title="إضافة مدرس"
      description="أنشئ ملف مدرس حقيقي واربطه مباشرة بالمسارات التي يدرّسها داخل النظام"
      submitLabel="حفظ المدرس"
      successMessage="تم إنشاء ملف المدرس بنجاح"
      onSubmit={async (payload) => {
        const created = await createTeacher(payload);
        router.push(`/teachers/${created.id}`);
      }}
      cancelHref="/teachers"
    />
  );
}
