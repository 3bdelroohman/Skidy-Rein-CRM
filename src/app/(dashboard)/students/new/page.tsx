"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { StudentForm } from "@/components/students/student-form";
import { createParent } from "@/services/parents.service";
import { createStudent } from "@/services/students.service";
import type { CreateStudentInput } from "@/types/crm";

export default function NewStudentPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const parentName = searchParams.get("parentName") ?? "";
  const parentPhone = searchParams.get("parentPhone") ?? "";
  const childName = searchParams.get("childName") ?? "";
  const childAge = searchParams.get("childAge");
  const currentCourse = searchParams.get("currentCourse");
  const className = searchParams.get("className") ?? "";

  const handleSubmit = async (payload: CreateStudentInput) => {
    const parent = await createParent({
      fullName: payload.parentName,
      phone: payload.parentPhone,
      whatsapp: payload.parentPhone,
      childrenCount: 1,
    });

    const created = await createStudent({
      ...payload,
      parentId: parent.id,
      parentName: parent.fullName,
      parentPhone: parent.phone,
    });

    router.push(`/students/${created.id}`);
  };

  return (
    <StudentForm
      title="إضافة طالب"
      description="أنشئ طالبًا حقيقيًا داخل النظام واربطه بولي أمره مباشرة"
      submitLabel="حفظ الطالب"
      successMessage="تم إنشاء سجل الطالب بنجاح"
      onSubmit={handleSubmit}
      cancelHref="/students"
      initialValues={{
        fullName: childName || undefined,
        age: childAge ? Number(childAge) : undefined,
        parentName: parentName || undefined,
        parentPhone: parentPhone || undefined,
        currentCourse: (currentCourse as CreateStudentInput["currentCourse"]) ?? undefined,
        className: className || undefined,
      }}
    />
  );
}
