"use client";

import { cn } from "@/lib/utils";
import { STAGE_CONFIGS } from "@/config/stages";
import { useUIStore } from "@/stores/ui-store";
import { getStageLabel } from "@/lib/locale";
import type { LeadStage } from "@/types/common.types";

interface StageBadgeProps {
  stage: LeadStage;
  size?: "sm" | "md";
}

export function StageBadge({ stage, size = "md" }: StageBadgeProps) {
  const locale = useUIStore((state) => state.locale);
  const config = STAGE_CONFIGS[stage];

  return (
    <span
      className={cn(
        "inline-flex items-center font-semibold rounded-full",
        size === "sm" ? "text-[10px] px-2 py-0.5" : "text-xs px-2.5 py-1",
      )}
      style={{
        backgroundColor: config.bgColor,
        color: config.textColor,
      }}
    >
      {getStageLabel(stage, locale)}
    </span>
  );
}
