"use client";

import { useRouter } from "next/navigation";
import { ParentForm } from "@/components/parents/parent-form";
import { createParent } from "@/services/parents.service";
import type { CreateParentInput } from "@/types/crm";

export default function NewParentPage() {
  const router = useRouter();

  const handleSubmit = async (payload: CreateParentInput) => {
    const created = await createParent(payload);
    router.push(`/parents/${created.id}`);
  };

  return (
    <ParentForm
      title="إضافة ولي أمر"
      description="أنشئ سجل ولي أمر حقيقي داخل النظام بدل الاعتماد على العملاء المحتملين فقط"
      submitLabel="حفظ ولي الأمر"
      successMessage="تم إنشاء سجل ولي الأمر بنجاح"
      onSubmit={handleSubmit}
      cancelHref="/parents"
    />
  );
}
