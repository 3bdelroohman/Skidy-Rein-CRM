"use client";

import { useState, useMemo } from "react";
import { ClipboardCheck, Clock, CheckCircle2, AlertTriangle, Phone, MessageSquare } from "lucide-react";
import { cn } from "@/lib/utils";

type FollowUpStatus = "pending" | "completed" | "overdue";

const MOCK_FOLLOWUPS = [
  { id: "1", title: "متابعة يوسف — أول تواصل", leadName: "يوسف أحمد", parentName: "أحمد محمد", type: "first_contact", channel: "whatsapp", priority: "high", scheduledAt: "2026-04-06T10:00:00", status: "pending" as FollowUpStatus, assignedTo: "الاء" },
  { id: "2", title: "تذكير Trial — زين", leadName: "زين فاطمة", parentName: "فاطمة حسن", type: "trial_reminder", channel: "whatsapp", priority: "urgent", scheduledAt: "2026-04-06T14:00:00", status: "pending" as FollowUpStatus, assignedTo: "سمر" },
  { id: "3", title: "متابعة بعد Trial — ليلى", leadName: "ليلى هدى", parentName: "هدى إبراهيم", type: "post_trial", channel: "call", priority: "high", scheduledAt: "2026-04-06T12:00:00", status: "pending" as FollowUpStatus, assignedTo: "الاء" },
  { id: "4", title: "إعادة تواصل — عمر", leadName: "عمر محمد", parentName: "محمد علي", type: "re_engagement", channel: "whatsapp", priority: "medium", scheduledAt: "2026-04-07T10:00:00", status: "pending" as FollowUpStatus, assignedTo: "الاء" },
  { id: "5", title: "متابعة دفع — آدم", leadName: "آدم خالد", parentName: "خالد عبدالله", type: "closing", channel: "whatsapp", priority: "high", scheduledAt: "2026-04-06T18:00:00", status: "pending" as FollowUpStatus, assignedTo: "سمر" },
  { id: "6", title: "أول تواصل — Lead جديد", leadName: "حسن أيمن", parentName: "أيمن حسن", type: "first_contact", channel: "whatsapp", priority: "medium", scheduledAt: "2026-04-05T09:00:00", status: "overdue" as FollowUpStatus, assignedTo: "سمر" },
  { id: "7", title: "متابعة ملك — تأكيد الدفع", leadName: "ملك سارة", parentName: "سارة أحمد", type: "payment_reminder", channel: "call", priority: "medium", scheduledAt: "2026-04-04T15:00:00", status: "completed" as FollowUpStatus, assignedTo: "سمر" },
];

const PRIORITY_MAP: Record<string, { label: string; color: string }> = {
  urgent: { label: "عاجل", color: "text-danger-600" },
  high: { label: "مرتفع", color: "text-warning-600" },
  medium: { label: "متوسط", color: "text-brand-600" },
  low: { label: "منخفض", color: "text-muted-foreground" },
};

const CHANNEL_ICON: Record<string, typeof Phone> = { whatsapp: MessageSquare, call: Phone, email: MessageSquare, sms: MessageSquare };

export default function FollowUpsPage() {
  const [tab, setTab] = useState<"today" | "overdue" | "completed">("today");

  const todayItems = MOCK_FOLLOWUPS.filter((f) => f.status === "pending");
  const overdueItems = MOCK_FOLLOWUPS.filter((f) => f.status === "overdue");
  const completedItems = MOCK_FOLLOWUPS.filter((f) => f.status === "completed");

  const displayItems = tab === "today" ? todayItems : tab === "overdue" ? overdueItems : completedItems;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <ClipboardCheck size={28} className="text-brand-600" />
          المتابعات
        </h1>
        <p className="text-muted-foreground text-sm mt-1">متابعات اليوم والمتأخرة</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-4">
        <button onClick={() => setTab("today")} className={cn("bg-card rounded-2xl border p-4 text-center transition-all", tab === "today" ? "border-brand-500 ring-2 ring-brand-500/20" : "border-border hover:border-brand-300")}>
          <Clock size={20} className="mx-auto text-brand-600 mb-1" />
          <p className="text-2xl font-bold text-foreground">{todayItems.length}</p>
          <p className="text-xs text-muted-foreground">اليوم</p>
        </button>
        <button onClick={() => setTab("overdue")} className={cn("bg-card rounded-2xl border p-4 text-center transition-all", tab === "overdue" ? "border-danger-500 ring-2 ring-danger-500/20" : "border-border hover:border-danger-300")}>
          <AlertTriangle size={20} className="mx-auto text-danger-600 mb-1" />
          <p className="text-2xl font-bold text-danger-600">{overdueItems.length}</p>
          <p className="text-xs text-muted-foreground">متأخرة</p>
        </button>
        <button onClick={() => setTab("completed")} className={cn("bg-card rounded-2xl border p-4 text-center transition-all", tab === "completed" ? "border-success-500 ring-2 ring-success-500/20" : "border-border hover:border-success-300")}>
          <CheckCircle2 size={20} className="mx-auto text-success-600 mb-1" />
          <p className="text-2xl font-bold text-success-600">{completedItems.length}</p>
          <p className="text-xs text-muted-foreground">مكتملة</p>
        </button>
      </div>

      {/* List */}
      <div className="space-y-3">
        {displayItems.map((item) => {
          const ChannelIcon = CHANNEL_ICON[item.channel] || MessageSquare;
          const priority = PRIORITY_MAP[item.priority];
          return (
            <div key={item.id} className={cn("bg-card rounded-2xl border border-border p-4 hover:shadow-brand-sm transition-all cursor-pointer", item.status === "overdue" && "border-danger-300 bg-danger-50/30 dark:bg-danger-950/10")}>
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <ChannelIcon size={16} className="text-muted-foreground" />
                    <p className="font-bold text-foreground text-sm">{item.title}</p>
                  </div>
                  <p className="text-xs text-muted-foreground">{item.parentName} — {item.leadName}</p>
                </div>
                <div className="text-left shrink-0">
                  <p className={cn("text-xs font-semibold", priority?.color)}>{priority?.label}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">
                    {new Date(item.scheduledAt).toLocaleTimeString("ar-EG", { hour: "2-digit", minute: "2-digit" })}
                  </p>
                </div>
              </div>
              <div className="flex items-center justify-between mt-3 pt-3 border-t border-border">
                <span className="text-xs text-muted-foreground">{item.assignedTo}</span>
                {item.status === "pending" && (
                  <button className="text-xs bg-success-500 text-white px-3 py-1 rounded-lg font-semibold hover:bg-success-600 transition-colors">تم ✓</button>
                )}
              </div>
            </div>
          );
        })}
        {displayItems.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">لا توجد متابعات</div>
        )}
      </div>
    </div>
  );
}