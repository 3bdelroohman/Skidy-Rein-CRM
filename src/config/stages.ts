import { STAGE_LABELS } from "@/config/labels";
import type { LeadStage } from "@/types/common.types";

export interface StageConfig {
  key: LeadStage;
  labelAr: string;
  labelEn: string;
  color: string;
  bgColor: string;
  textColor: string;
  order: number;
}

export const STAGE_CONFIGS: Record<LeadStage, StageConfig> = {
  new: {
    key: "new",
    labelAr: STAGE_LABELS.new,
    labelEn: "New",
    color: "#6366F1",
    bgColor: "#EEF2FF",
    textColor: "#4338CA",
    order: 1,
  },
  qualified: {
    key: "qualified",
    labelAr: STAGE_LABELS.qualified,
    labelEn: "Interested",
    color: "#8B5CF6",
    bgColor: "#F5F3FF",
    textColor: "#7C3AED",
    order: 2,
  },
  trial_proposed: {
    key: "trial_proposed",
    labelAr: STAGE_LABELS.trial_proposed,
    labelEn: "Trial Proposed",
    color: "#EC4899",
    bgColor: "#FDF2F8",
    textColor: "#DB2777",
    order: 3,
  },
  trial_booked: {
    key: "trial_booked",
    labelAr: STAGE_LABELS.trial_booked,
    labelEn: "Trial Booked",
    color: "#F59E0B",
    bgColor: "#FFFBEB",
    textColor: "#D97706",
    order: 4,
  },
  trial_attended: {
    key: "trial_attended",
    labelAr: STAGE_LABELS.trial_attended,
    labelEn: "Trial Attended",
    color: "#10B981",
    bgColor: "#ECFDF5",
    textColor: "#059669",
    order: 5,
  },
  offer_sent: {
    key: "offer_sent",
    labelAr: STAGE_LABELS.offer_sent,
    labelEn: "Offer Sent",
    color: "#3B82F6",
    bgColor: "#EFF6FF",
    textColor: "#2563EB",
    order: 6,
  },
  won: {
    key: "won",
    labelAr: STAGE_LABELS.won,
    labelEn: "Won",
    color: "#059669",
    bgColor: "#D1FAE5",
    textColor: "#047857",
    order: 7,
  },
  lost: {
    key: "lost",
    labelAr: STAGE_LABELS.lost,
    labelEn: "Lost",
    color: "#EF4444",
    bgColor: "#FEF2F2",
    textColor: "#DC2626",
    order: 8,
  },
};

export const PIPELINE_STAGES: LeadStage[] = [
  "new",
  "qualified",
  "trial_proposed",
  "trial_booked",
  "trial_attended",
  "offer_sent",
  "won",
  "lost",
];

export const KANBAN_STAGES: LeadStage[] = [
  "new",
  "qualified",
  "trial_proposed",
  "trial_booked",
  "trial_attended",
  "offer_sent",
];

export const NEXT_STAGE_MAP: Partial<Record<LeadStage, LeadStage[]>> = {
  new: ["qualified", "lost"],
  qualified: ["trial_proposed", "lost"],
  trial_proposed: ["trial_booked", "lost"],
  trial_booked: ["trial_attended", "trial_proposed", "lost"],
  trial_attended: ["offer_sent", "lost"],
  offer_sent: ["won", "lost"],
  won: [],
  lost: ["new"],
};

export function getStageConfig(stage: LeadStage): StageConfig {
  return STAGE_CONFIGS[stage];
}
