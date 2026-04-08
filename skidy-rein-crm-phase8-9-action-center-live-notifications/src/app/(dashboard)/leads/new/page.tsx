"use client";

import { useRouter } from "next/navigation";
import { LeadForm } from "@/components/leads/lead-form";
import { createLead } from "@/services/leads.service";
import type { CreateLeadInput } from "@/types/crm";

export default function NewLeadPage() {
  const router = useRouter();

  const handleSubmit = async (payload: CreateLeadInput) => {
    await createLead(payload);
    router.push("/leads");
  };

  return (
    <LeadForm
      title="إضافة عميل جديد"
      description="ابدأ من بيانات ولي الأمر والطفل ثم وزّع العميل على المسؤول المناسب"
      submitLabel="حفظ العميل"
      successMessage="تم حفظ العميل بنجاح"
      onSubmit={handleSubmit}
      cancelHref="/leads"
    />
  );
}
