"use client";

import { PageStateCard } from "@/components/shared/page-state";

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-screen max-w-3xl items-center justify-center px-4 py-10">
      <PageStateCard
        titleAr="الصفحة غير موجودة"
        titleEn="Page not found"
        descriptionAr="الرابط الذي فتحته غير صحيح أو أن الصفحة تم نقلها. ارجع إلى لوحة التحكم ثم تابع من القائمة الرئيسية."
        descriptionEn="The page you opened does not exist or has been moved. Head back to the dashboard and continue from the main navigation."
        actionHref="/"
        actionLabelAr="العودة إلى لوحة التحكم"
        actionLabelEn="Back to dashboard"
        variant="warning"
      />
    </main>
  );
}
