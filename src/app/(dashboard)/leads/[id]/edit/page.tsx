"use client";

import { use, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { LeadForm, type LeadFormValues } from "@/components/leads/lead-form";
import { t } from "@/lib/locale";
import { getLeadById, updateLead } from "@/services/leads.service";
import { useUIStore } from "@/stores/ui-store";
import type { CreateLeadInput, LeadListItem } from "@/types/crm";
import { LoadingState, PageStateCard } from "@/components/shared/page-state";

function toInitialValues(lead: LeadListItem): Partial<LeadFormValues> {
  return {
    childName: lead.childName,
    childAge: String(lead.childAge),
    parentName: lead.parentName,
    parentPhone: lead.parentPhone,
    parentWhatsapp: lead.parentPhone,
    source: lead.source,
    temperature: lead.temperature,
    suggestedCourse: lead.suggestedCourse ?? "",
    assignedTo: lead.assignedTo,
    notes: lead.notes ?? "",
  };
}

export default function EditLeadPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const locale = useUIStore((state) => state.locale);
  const [lead, setLead] = useState<LeadListItem | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    async function load() {
      setLoading(true);
      const data = await getLeadById(id);
      if (mounted) {
        setLead(data);
        setLoading(false);
      }
    }
    void load();
    return () => {
      mounted = false;
    };
  }, [id]);

  const initialValues = useMemo(() => (lead ? toInitialValues(lead) : undefined), [lead]);

  async function handleSubmit(payload: CreateLeadInput) {
    const updated = await updateLead(id, payload, payload.assignedToName);
    if (updated) router.push(`/leads/${id}`);
  }

  if (loading) {
    return (
      <LoadingState
        titleAr="جارِ تحميل بيانات العميل"
        titleEn="Loading lead details"
        descriptionAr="يتم الآن تجهيز بيانات العميل قبل فتح شاشة التعديل."
        descriptionEn="The lead data is being prepared before opening the edit screen."
      />
    );
  }

  if (!lead) {
    return (
      <PageStateCard
        variant="warning"
        titleAr="العميل غير موجود"
        titleEn="Lead not found"
        descriptionAr="لا يمكن تعديل هذا الملف لأن الرابط غير صحيح أو لأن العنصر لم يعد موجودًا."
        descriptionEn="This record cannot be edited because the link is incorrect or the item no longer exists."
        actionHref="/leads"
        actionLabelAr="العودة إلى العملاء المحتملين"
        actionLabelEn="Back to leads"
      />
    );
  }

  return (
    <LeadForm
      title={t(locale, "تعديل بيانات العميل", "Edit lead")}
      description={t(locale, "حدّث بيانات ولي الأمر والطفل دون فقد مسار البيع الحالي", "Update parent and child information without affecting the current pipeline stage")}
      submitLabel={t(locale, "حفظ التعديلات", "Save changes")}
      successMessage={t(locale, "تم تحديث بيانات العميل", "Lead details updated")}
      initialValues={initialValues}
      onSubmit={handleSubmit}
      cancelHref={`/leads/${id}`}
    />
  );
}
