"use client";

import { PageStateCard } from "@/components/shared/page-state";

export default function DashboardNotFound() {
  return (
    <PageStateCard
      titleAr="العنصر المطلوب غير موجود"
      titleEn="Requested item was not found"
      descriptionAr="قد يكون العنصر محذوفًا أو أن الرابط غير صحيح. ارجع إلى القسم الرئيسي وأعد المحاولة."
      descriptionEn="The requested item may have been removed or the link is incorrect. Go back to the main section and try again."
      actionHref="/"
      actionLabelAr="العودة إلى لوحة التحكم"
      actionLabelEn="Back to dashboard"
      variant="warning"
    />
  );
}
