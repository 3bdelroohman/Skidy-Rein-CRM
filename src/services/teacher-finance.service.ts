import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@/types/database.types";
import type { CourseType, ScheduleSessionItem } from "@/types/crm";
import { readStorage, writeStorage } from "@/services/storage";

/* ------------------------------------------------------------------ */
/*  Supabase client                                                    */
/* ------------------------------------------------------------------ */
function getSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key || typeof window === "undefined") return null;
  return createBrowserClient<Database>(url, key);
}

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */
export interface TeacherFinanceConfig {
  teacherId: string;
  sessionRate60: number;
  sessionRate90: number;
  sessionRate120: number;
  trackAdjustments: Record<CourseType, number>;
  notes: string | null;
  updatedAt: string | null;
}

export interface TeacherFinanceLineItem {
  sessionId: string;
  className: string;
  course: CourseType;
  minutes: number;
  payout: number;
}

export interface TeacherFinanceSummary {
  linkedSessions: number;
  weeklyEstimated: number;
  monthlyEstimated: number;
  averagePerSession: number;
  lines: TeacherFinanceLineItem[];
}

/* ------------------------------------------------------------------ */
/*  Defaults + helpers                                                 */
/* ------------------------------------------------------------------ */
const LOCAL_KEY = "skidy.crm.teacher-finance";

const DEFAULT_TRACK: Record<CourseType, number> = {
  scratch: 0,
  python: 20,
  web: 30,
  ai: 40,
};

function defaultConfig(teacherId: string): TeacherFinanceConfig {
  return {
    teacherId,
    sessionRate60: 120,
    sessionRate90: 180,
    sessionRate120: 240,
    trackAdjustments: { ...DEFAULT_TRACK },
    notes: null,
    updatedAt: null,
  };
}

function safe(value: number | null | undefined, fallback: number): number {
  return Number.isFinite(value) ? Number(value) : fallback;
}

type DbRow = Database["public"]["Tables"]["teacher_finance_config"]["Row"];

function rowToConfig(teacherId: string, row: DbRow): TeacherFinanceConfig {
  return {
    teacherId,
    sessionRate60: safe(row.session_rate_60, 120),
    sessionRate90: safe(row.session_rate_90, 180),
    sessionRate120: safe(row.session_rate_120, 240),
    trackAdjustments: {
      scratch: safe(row.adj_scratch, 0),
      python: safe(row.adj_python, 20),
      web: safe(row.adj_web, 30),
      ai: safe(row.adj_ai, 40),
    },
    notes: row.notes ?? null,
    updatedAt: row.updated_at ?? null,
  };
}

/* localStorage cache (fallback + fast first paint) */
function readLocal(teacherId: string): TeacherFinanceConfig | null {
  const all = readStorage<Record<string, TeacherFinanceConfig>>(LOCAL_KEY, {});
  return all[teacherId] ?? null;
}

function writeLocal(config: TeacherFinanceConfig): void {
  const all = readStorage<Record<string, TeacherFinanceConfig>>(LOCAL_KEY, {});
  all[config.teacherId] = config;
  writeStorage(LOCAL_KEY, all);
}

/* ------------------------------------------------------------------ */
/*  GET config (async � Supabase first, localStorage fallback)         */
/* ------------------------------------------------------------------ */
export async function getTeacherFinanceConfig(
  teacherId: string,
): Promise<TeacherFinanceConfig> {
  const base = defaultConfig(teacherId);
  const supabase = getSupabaseClient();

  if (supabase) {
    try {
      const { data, error } = await supabase
        .from("teacher_finance_config")
        .select("*")
        .eq("teacher_id", teacherId)
        .maybeSingle();

      if (!error && data) {
        const config = rowToConfig(teacherId, data);
        writeLocal(config);
        return config;
      }
    } catch (err) {
      console.warn("[teacher-finance] Supabase read failed, using cache", err);
    }
  }

  // Fallback: localStorage
  const cached = readLocal(teacherId);
  if (cached) {
    return {
      ...base,
      sessionRate60: safe(cached.sessionRate60, base.sessionRate60),
      sessionRate90: safe(cached.sessionRate90, base.sessionRate90),
      sessionRate120: safe(cached.sessionRate120, base.sessionRate120),
      trackAdjustments: {
        scratch: safe(cached.trackAdjustments?.scratch, base.trackAdjustments.scratch),
        python: safe(cached.trackAdjustments?.python, base.trackAdjustments.python),
        web: safe(cached.trackAdjustments?.web, base.trackAdjustments.web),
        ai: safe(cached.trackAdjustments?.ai, base.trackAdjustments.ai),
      },
      notes: cached.notes ?? null,
      updatedAt: cached.updatedAt ?? null,
    };
  }

  return base;
}

/* ------------------------------------------------------------------ */
/*  SAVE config (async � Supabase upsert + localStorage cache)         */
/* ------------------------------------------------------------------ */
export async function saveTeacherFinanceConfig(input: {
  teacherId: string;
  sessionRate60: number;
  sessionRate90: number;
  sessionRate120: number;
  trackAdjustments: Record<CourseType, number>;
  notes?: string | null;
}): Promise<TeacherFinanceConfig> {
  const config: TeacherFinanceConfig = {
    teacherId: input.teacherId,
    sessionRate60: safe(input.sessionRate60, 120),
    sessionRate90: safe(input.sessionRate90, 180),
    sessionRate120: safe(input.sessionRate120, 240),
    trackAdjustments: {
      scratch: safe(input.trackAdjustments.scratch, 0),
      python: safe(input.trackAdjustments.python, 20),
      web: safe(input.trackAdjustments.web, 30),
      ai: safe(input.trackAdjustments.ai, 40),
    },
    notes: input.notes?.trim() || null,
    updatedAt: new Date().toISOString(),
  };

  // Always cache locally
  writeLocal(config);

  const supabase = getSupabaseClient();
  if (supabase) {
    const { error } = await supabase
      .from("teacher_finance_config")
      .upsert(
        {
          teacher_id: input.teacherId,
          session_rate_60: config.sessionRate60,
          session_rate_90: config.sessionRate90,
          session_rate_120: config.sessionRate120,
          adj_scratch: config.trackAdjustments.scratch,
          adj_python: config.trackAdjustments.python,
          adj_web: config.trackAdjustments.web,
          adj_ai: config.trackAdjustments.ai,
          notes: config.notes,
        },
        { onConflict: "teacher_id" },
      );

    if (error) {
      console.error("[teacher-finance] Supabase save failed", error);
      throw new Error(error.message);
    }
  }

  return config;
}

/* ------------------------------------------------------------------ */
/*  Compute summary (sync � pure computation, no DB)                   */
/* ------------------------------------------------------------------ */
function toMinutes(startTime: string, endTime: string): number {
  const [sh, sm] = startTime.split(":").map(Number);
  const [eh, em] = endTime.split(":").map(Number);
  if ([sh, sm, eh, em].some((v) => !Number.isFinite(v))) return 60;
  const start = sh * 60 + sm;
  let end = eh * 60 + em;
  if (end <= start) end += 1440;
  return Math.max(30, end - start);
}

function getBaseRate(minutes: number, config: TeacherFinanceConfig): number {
  if (minutes <= 60) return config.sessionRate60;
  if (minutes <= 90) return config.sessionRate90;
  if (minutes <= 120) return config.sessionRate120;
  const extra = minutes - 120;
  return config.sessionRate120 + Math.ceil(extra / 30) * (config.sessionRate60 / 2);
}

export function computeTeacherFinanceSummary(
  sessions: ScheduleSessionItem[],
  config: TeacherFinanceConfig,
): TeacherFinanceSummary {
  const lines = sessions.map((s) => {
    const minutes = toMinutes(s.startTime, s.endTime);
    const payout = getBaseRate(minutes, config) + (config.trackAdjustments[s.course] ?? 0);
    return { sessionId: s.id, className: s.className, course: s.course, minutes, payout };
  });

  const weeklyEstimated = lines.reduce((sum, l) => sum + l.payout, 0);
  const monthlyEstimated = Math.round(weeklyEstimated * 4.33);

  return {
    linkedSessions: lines.length,
    weeklyEstimated,
    monthlyEstimated,
    averagePerSession: lines.length > 0 ? Math.round(weeklyEstimated / lines.length) : 0,
    lines,
  };
}
