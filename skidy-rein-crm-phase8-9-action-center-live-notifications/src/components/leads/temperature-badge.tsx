"use client";

import { cn } from "@/lib/utils";
import { Flame, Thermometer, Snowflake } from "lucide-react";
import { TEMPERATURE_META, getMetaLabel } from "@/config/status-meta";
import { useUIStore } from "@/stores/ui-store";
import type { LeadTemperature } from "@/types/common.types";

const ICON_MAP: Record<LeadTemperature, typeof Flame> = {
  hot: Flame,
  warm: Thermometer,
  cold: Snowflake,
};

interface TemperatureBadgeProps {
  temperature: LeadTemperature;
}

export function TemperatureBadge({ temperature }: TemperatureBadgeProps) {
  const locale = useUIStore((state) => state.locale);
  const meta = TEMPERATURE_META[temperature];
  const Icon = ICON_MAP[temperature];

  return (
    <span
      className={cn("inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold")}
      style={{ backgroundColor: meta.bg, color: meta.color }}
    >
      <Icon size={12} />
      {getMetaLabel(meta, locale)}
    </span>
  );
}
