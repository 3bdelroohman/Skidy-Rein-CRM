"use client";

import { useRouter } from "next/navigation";
import { ParentForm } from "@/components/parents/parent-form";
import { createParent, listParents } from "@/services/parents.service";
import { createStudent, listStudents } from "@/services/students.service";
import type { CreateParentInput } from "@/types/crm";

function normalizePhone(value: string | null | undefined): string {
  return (value ?? "").replace(/\D/g, "").replace(/^20/, "");
}

function normalizeName(value: string | null | undefined): string {
  return (value ?? "").toLowerCase().replace(/[ً-ٟ]/g, "").replace(/\s+/g, " ").trim();
}

export default function NewParentPage() {
  const router = useRouter();

  const handleSubmit = async (payload: CreateParentInput) => {
    const parents = await listParents();
    const duplicateParent = parents.find((parent) =>
      normalizePhone(parent.phone) === normalizePhone(payload.phone) ||
      (payload.whatsapp && normalizePhone(parent.whatsapp) === normalizePhone(payload.whatsapp)) ||
      (normalizeName(parent.fullName) === normalizeName(payload.fullName) && normalizePhone(parent.phone) === normalizePhone(payload.phone)),
    );

    if (duplicateParent) {
      throw new Error("يوجد ولي أمر مسجل بالفعل بنفس الرقم أو الاسم. افتح السجل الحالي بدل إنشاء سجل جديد.");
    }

    const createdParent = await createParent(payload);

    if (payload.firstStudentName && payload.firstStudentAge) {
      const students = await listStudents();
      const duplicateStudent = students.find((student) =>
        normalizeName(student.fullName) === normalizeName(payload.firstStudentName) &&
        (student.parentId === createdParent.id || normalizePhone(student.parentPhone) === normalizePhone(createdParent.phone)),
      );

      if (duplicateStudent) {
        throw new Error("الطالب الأول مسجل بالفعل لهذا ولي الأمر. لن يتم إنشاء اسم مكرر.");
      }

      await createStudent({
        fullName: payload.firstStudentName,
        age: payload.firstStudentAge,
        parentId: createdParent.id,
        parentName: createdParent.fullName,
        parentPhone: createdParent.phone,
        currentCourse: payload.firstStudentCourse ?? null,
        className: payload.firstStudentClassName ?? null,
        status: "active",
      });
    }

    router.push(`/parents/${createdParent.id}`);
  };

  return (
    <ParentForm
      title="إضافة ولي أمر"
      description="أنشئ سجل ولي أمر حقيقي داخل النظام ويمكنك إضافة أول طالب معه من نفس الفورم"
      submitLabel="حفظ ولي الأمر"
      successMessage="تم إنشاء سجل ولي الأمر بنجاح"
      onSubmit={handleSubmit}
      cancelHref="/parents"
    />
  );
}
