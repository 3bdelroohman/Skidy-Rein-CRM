"use client";

import { RefreshCcw } from "lucide-react";
import { PageStateCard } from "@/components/shared/page-state";

export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className="mx-auto flex min-h-screen max-w-3xl items-center justify-center px-4 py-10">
      <PageStateCard
        variant="danger"
        titleAr="حدث خطأ غير متوقع"
        titleEn="Something went wrong"
        descriptionAr="النظام واجه مشكلة أثناء تحميل هذه الصفحة. يمكنك إعادة المحاولة الآن، وإذا تكرر الخطأ فارجع للصفحة السابقة أو أعد تحميل المتصفح."
        descriptionEn="The app hit an unexpected issue while loading this page. Try again now, and if it persists, go back or refresh the browser."
        secondaryAction={
          <button
            onClick={reset}
            className="inline-flex items-center gap-2 rounded-xl border border-border bg-background px-4 py-2 text-sm font-semibold text-foreground transition-colors hover:bg-muted"
          >
            <RefreshCcw size={16} />
            إعادة المحاولة / Try again
          </button>
        }
      />
    </main>
  );
}
