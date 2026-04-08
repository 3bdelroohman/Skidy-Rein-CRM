"use client";

import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  ClipboardCheck,
  Clock,
  MessageSquare,
  Phone,
  RotateCcw,
} from "lucide-react";
import { useUIStore } from "@/stores/ui-store";
import { FOLLOW_UP_STATUS_META, PRIORITY_META, getMetaLabel } from "@/config/status-meta";
import { formatTime } from "@/lib/formatters";
import { cn } from "@/lib/utils";
import { getCommChannelLabel, getFollowUpTypeLabel, t } from "@/lib/locale";
import { listFollowUps, markFollowUpCompleted, reopenFollowUp } from "@/services/follow-ups.service";
import type { FollowUpItem } from "@/types/crm";

const CHANNEL_ICON: Record<FollowUpItem["channel"], typeof Phone> = {
  whatsapp: MessageSquare,
  call: Phone,
  email: MessageSquare,
  sms: MessageSquare,
};

export default function FollowUpsPage() {
  const locale = useUIStore((state) => state.locale);
  const isAr = locale === "ar";
  const [tab, setTab] = useState<"today" | "overdue" | "completed">("today");
  const [items, setItems] = useState<FollowUpItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    async function load() {
      setLoading(true);
      const data = await listFollowUps();
      if (isMounted) {
        setItems(data);
        setLoading(false);
      }
    }
    load();
    return () => {
      isMounted = false;
    };
  }, []);

  const todayItems = useMemo(() => items.filter((item) => item.status === "pending"), [items]);
  const overdueItems = useMemo(() => items.filter((item) => item.status === "overdue"), [items]);
  const completedItems = useMemo(() => items.filter((item) => item.status === "completed"), [items]);
  const displayItems = tab === "today" ? todayItems : tab === "overdue" ? overdueItems : completedItems;

  const handleComplete = async (id: string) => {
    setSavingId(id);
    const updated = await markFollowUpCompleted(id);
    if (updated) {
      setItems((current) => current.map((item) => (item.id === id ? updated : item)));
    }
    setSavingId(null);
  };

  const handleUndo = async (id: string) => {
    setSavingId(id);
    const updated = await reopenFollowUp(id);
    if (updated) {
      setItems((current) => current.map((item) => (item.id === id ? updated : item)));
    }
    setSavingId(null);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-bold text-foreground">
          <ClipboardCheck size={28} className="text-brand-600" />
          {t(locale, "المتابعات", "Follow-ups")}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {t(locale, "مهام الفريق اليومية والمتأخرة مع إمكانية التراجع عن الإكمال", "Daily and overdue follow-ups with quick undo support")}
        </p>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <button onClick={() => setTab("today")} className={cn("rounded-2xl border bg-card p-4 text-center transition-all", tab === "today" ? "border-brand-500 ring-2 ring-brand-500/20" : "border-border hover:border-brand-300")}>
          <Clock size={20} className="mx-auto mb-1 text-brand-600" />
          <p className="text-2xl font-bold text-foreground">{todayItems.length}</p>
          <p className="text-xs text-muted-foreground">{t(locale, "اليوم", "Today")}</p>
        </button>
        <button onClick={() => setTab("overdue")} className={cn("rounded-2xl border bg-card p-4 text-center transition-all", tab === "overdue" ? "border-danger-500 ring-2 ring-danger-500/20" : "border-border hover:border-danger-300")}>
          <AlertTriangle size={20} className="mx-auto mb-1 text-danger-600" />
          <p className="text-2xl font-bold text-danger-600">{overdueItems.length}</p>
          <p className="text-xs text-muted-foreground">{t(locale, "متأخرة", "Overdue")}</p>
        </button>
        <button onClick={() => setTab("completed")} className={cn("rounded-2xl border bg-card p-4 text-center transition-all", tab === "completed" ? "border-success-500 ring-2 ring-success-500/20" : "border-border hover:border-success-300")}>
          <CheckCircle2 size={20} className="mx-auto mb-1 text-success-600" />
          <p className="text-2xl font-bold text-success-600">{completedItems.length}</p>
          <p className="text-xs text-muted-foreground">{t(locale, "مكتملة", "Completed")}</p>
        </button>
      </div>

      {loading ? (
        <div className="rounded-2xl border border-border bg-card p-12 text-center text-muted-foreground">{t(locale, "جارِ تحميل المتابعات...", "Loading follow-ups...")}</div>
      ) : (
        <div className="space-y-3">
          {displayItems.map((item) => {
            const ChannelIcon = CHANNEL_ICON[item.channel] || MessageSquare;
            const priority = PRIORITY_META[item.priority];
            const status = FOLLOW_UP_STATUS_META[item.status];
            const completed = item.status === "completed";
            return (
              <div key={item.id} className={cn("rounded-2xl border border-border bg-card p-4 transition-all", item.status === "overdue" && "border-danger-300 bg-danger-50/30 dark:bg-danger-950/10", completed && "opacity-70")}>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="mb-1 flex flex-wrap items-center gap-2">
                      <ChannelIcon size={16} className="text-muted-foreground" />
                      <p className={cn("text-sm font-bold text-foreground", completed && "line-through")}>{item.title}</p>
                      <span className="rounded-full px-2 py-0.5 text-[10px] font-semibold" style={{ backgroundColor: status.bg, color: status.color }}>
                        {getMetaLabel(status, locale)}
                      </span>
                    </div>
                    <p className={cn("text-xs text-muted-foreground", completed && "line-through")}>{item.parentName} — {item.leadName}</p>
                    <p className="mt-2 text-[11px] text-muted-foreground">{getFollowUpTypeLabel(item.type, locale)} • {getCommChannelLabel(item.channel, locale)}</p>
                  </div>

                  <div className={cn("shrink-0 space-y-1", isAr ? "text-left" : "text-right")}>
                    <p className={cn("text-xs font-semibold", priority.textClass)}>{getMetaLabel(priority, locale)}</p>
                    <p className="text-[10px] text-muted-foreground">{formatTime(item.scheduledAt, locale)}</p>
                  </div>
                </div>

                <div className="mt-3 flex items-center justify-between border-t border-border pt-3">
                  <span className="text-xs text-muted-foreground">{item.assignedTo}</span>

                  <div className="flex items-center gap-2">
                    {completed ? (
                      <button
                        onClick={() => handleUndo(item.id)}
                        disabled={savingId === item.id}
                        className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-background px-3.5 py-1.5 text-xs font-semibold text-foreground transition-colors hover:bg-muted disabled:opacity-60"
                      >
                        <RotateCcw size={12} />
                        {savingId === item.id ? t(locale, "جارِ التراجع...", "Undoing...") : t(locale, "تراجع", "Undo")}
                      </button>
                    ) : (
                      <button
                        onClick={() => handleComplete(item.id)}
                        disabled={savingId === item.id}
                        className="inline-flex items-center rounded-xl bg-success-500 px-3.5 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-success-600 disabled:opacity-60"
                      >
                        {savingId === item.id ? t(locale, "جارِ الحفظ...", "Saving...") : t(locale, "تم الإكمال", "Mark done")}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
          {!loading && displayItems.length === 0 && <div className="py-12 text-center text-muted-foreground">{t(locale, "لا توجد متابعات في هذا القسم", "No follow-ups in this section")}</div>}
        </div>
      )}
    </div>
  );
}
