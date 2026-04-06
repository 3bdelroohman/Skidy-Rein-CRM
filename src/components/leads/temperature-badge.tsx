import { cn } from "@/lib/utils";
import { Flame, Thermometer, Snowflake } from "lucide-react";
import type { LeadTemperature } from "@/types/common.types";

const TEMP_CONFIG: Record<
  LeadTemperature,
  { label: string; icon: typeof Flame; color: string; bg: string }
> = {
  hot: { label: "ساخن", icon: Flame, color: "#DC2626", bg: "#FEF2F2" },
  warm: { label: "دافئ", icon: Thermometer, color: "#D97706", bg: "#FFFBEB" },
  cold: { label: "بارد", icon: Snowflake, color: "#2563EB", bg: "#EFF6FF" },
};

interface TemperatureBadgeProps {
  temperature: LeadTemperature;
}

export function TemperatureBadge({ temperature }: TemperatureBadgeProps) {
  const config = TEMP_CONFIG[temperature];
  const Icon = config.icon;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 text-[10px] font-semibold rounded-full px-2 py-0.5"
      )}
      style={{ backgroundColor: config.bg, color: config.color }}
    >
      <Icon size={12} />
      {config.label}
    </span>
  );
}