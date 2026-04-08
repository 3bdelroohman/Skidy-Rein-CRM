"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { AlertTriangle, ArrowLeft, Inbox, SearchX, ShieldAlert } from "lucide-react";
import { useUIStore } from "@/stores/ui-store";
import { t } from "@/lib/locale";
import { cn } from "@/lib/utils";

interface PageStateProps {
  icon?: LucideIcon;
  titleAr: string;
  titleEn: string;
  descriptionAr: string;
  descriptionEn: string;
  actionHref?: string;
  actionLabelAr?: string;
  actionLabelEn?: string;
  secondaryAction?: ReactNode;
  variant?: "default" | "warning" | "danger";
  compact?: boolean;
}

const VARIANT_STYLES: Record<NonNullable<PageStateProps["variant"]>, string> = {
  default: "border-border bg-card text-foreground",
  warning: "border-warning-200 bg-warning-50/60 text-foreground dark:border-warning-900 dark:bg-warning-950/30",
  danger: "border-destructive/20 bg-destructive/5 text-foreground dark:bg-destructive/10",
};

const DEFAULT_ICONS: Record<NonNullable<PageStateProps["variant"]>, LucideIcon> = {
  default: Inbox,
  warning: AlertTriangle,
  danger: ShieldAlert,
};

export function PageStateCard({
  icon,
  titleAr,
  titleEn,
  descriptionAr,
  descriptionEn,
  actionHref,
  actionLabelAr,
  actionLabelEn,
  secondaryAction,
  variant = "default",
  compact = false,
}: PageStateProps) {
  const locale = useUIStore((state) => state.locale);
  const isAr = locale === "ar";
  const Icon = icon ?? DEFAULT_ICONS[variant];

  return (
    <div
      className={cn(
        "rounded-2xl border text-center shadow-sm",
        compact ? "p-6" : "p-10",
        VARIANT_STYLES[variant],
      )}
    >
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-background/80 text-brand-600 shadow-sm ring-1 ring-border/60">
        <Icon size={24} />
      </div>
      <h2 className="mt-4 text-lg font-bold text-foreground">{t(locale, titleAr, titleEn)}</h2>
      <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-muted-foreground">
        {t(locale, descriptionAr, descriptionEn)}
      </p>

      {(actionHref || secondaryAction) && (
        <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
          {actionHref ? (
            <Link
              href={actionHref}
              className="inline-flex items-center gap-2 rounded-xl bg-brand-700 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-600"
            >
              {isAr ? null : <ArrowLeft size={16} />}
              {t(locale, actionLabelAr ?? "العودة", actionLabelEn ?? "Go back")}
              {isAr ? <ArrowLeft size={16} /> : null}
            </Link>
          ) : null}
          {secondaryAction}
        </div>
      )}
    </div>
  );
}

export function LoadingState({ titleAr, titleEn, descriptionAr, descriptionEn }: Omit<PageStateProps, "variant">) {
  const locale = useUIStore((state) => state.locale);

  return (
    <div className="rounded-2xl border border-border bg-card p-10 text-center shadow-sm">
      <div className="mx-auto h-12 w-12 animate-spin rounded-full border-2 border-brand-200 border-t-brand-700" />
      <h2 className="mt-4 text-lg font-bold text-foreground">{t(locale, titleAr, titleEn)}</h2>
      <p className="mt-2 text-sm text-muted-foreground">{t(locale, descriptionAr, descriptionEn)}</p>
    </div>
  );
}

export function EmptySearchState() {
  const locale = useUIStore((state) => state.locale);

  return (
    <PageStateCard
      icon={SearchX}
      titleAr="لا توجد نتائج مطابقة"
      titleEn="No matching results"
      descriptionAr="جرّب تعديل كلمة البحث أو تخفيف الفلاتر للوصول إلى نتائج أكثر دقة."
      descriptionEn="Try adjusting the search term or easing the filters to get better results."
      compact
    />
  );
}
