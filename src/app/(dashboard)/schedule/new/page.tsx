"use client";

import { useRouter } from "next/navigation";
import { ScheduleEntryForm } from "@/components/schedule/schedule-entry-form";
import { createScheduleEntry } from "@/services/schedule.service";

export default function NewScheduleEntryPage() {
  const router = useRouter();

  return (
    <ScheduleEntryForm
      title="إضافة حصة / حدث"
      description="أنشئ حصة جديدة واربطها بالمدرس والمسار واليوم حتى تظهر مباشرة داخل الجدول"
      submitLabel="حفظ الحصة"
      successMessage="تمت إضافة الحصة إلى الجدول"
      onSubmit={async (payload) => {
        const created = await createScheduleEntry(payload);
        router.push(`/schedule/${created.id}`);
      }}
      cancelHref="/schedule"
    />
  );
}
