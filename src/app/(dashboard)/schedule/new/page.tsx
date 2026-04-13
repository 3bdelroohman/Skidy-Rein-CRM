"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { ScheduleEntryForm } from "@/components/schedule/schedule-entry-form";
import { createScheduleEntry } from "@/services/schedule.service";
import type { CourseType } from "@/types/common.types";

export default function NewScheduleEntryPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  return (
    <ScheduleEntryForm
      title="إضافة حصة / حدث"
      description="أنشئ حصة جديدة واربطها بالمدرس والمسار واليوم حتى تظهر مباشرة داخل الجدول"
      submitLabel="حفظ الحصة"
      successMessage="تمت إضافة الحصة إلى الجدول"
      initialValues={{
        className: searchParams.get("className") ?? "",
        teacherId: searchParams.get("teacherId") ?? "",
        course: (searchParams.get("course") as CourseType | null) ?? undefined,
      }}
      onSubmit={async (payload) => {
        const created = await createScheduleEntry(payload);
        router.push(`/schedule/${created.id}`);
      }}
      cancelHref="/schedule"
    />
  );
}
