"use client";

import { useState, useMemo } from "react";
import { Wallet, Search, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

const MOCK_PAYMENTS = [
  { id: "1", studentName: "يوسف أحمد", parentName: "أحمد محمد", amount: 750, status: "paid" as const, method: "instapay", dueDate: "2026-04-01", paidAt: "2026-03-30" },
  { id: "2", studentName: "ملك سارة", parentName: "سارة أحمد", amount: 750, status: "paid" as const, method: "bank_transfer", dueDate: "2026-04-01", paidAt: "2026-04-01" },
  { id: "3", studentName: "سلمى خالد", parentName: "خالد عبدالله", amount: 750, status: "overdue" as const, method: null, dueDate: "2026-03-15", paidAt: null },
  { id: "4", studentName: "عمر محمد", parentName: "محمد علي", amount: 750, status: "pending" as const, method: null, dueDate: "2026-04-10", paidAt: null },
  { id: "5", studentName: "ليلى هدى", parentName: "هدى إبراهيم", amount: 750, status: "paid" as const, method: "wallet", dueDate: "2026-04-01", paidAt: "2026-04-02" },
];

const STATUS_MAP: Record<string, { label: string; color: string; bg: string }> = {
  paid: { label: "مدفوع", color: "#059669", bg: "#ECFDF5" },
  pending: { label: "معلّق", color: "#D97706", bg: "#FFFBEB" },
  overdue: { label: "متأخر", color: "#DC2626", bg: "#FEF2F2" },
  refunded: { label: "مسترد", color: "#6B7280", bg: "#F3F4F6" },
  partial: { label: "جزئي", color: "#2563EB", bg: "#EFF6FF" },
};

export default function PaymentsPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const filtered = useMemo(() => {
    return MOCK_PAYMENTS.filter((p) => {
      const matchSearch = !search || p.studentName.includes(search) || p.parentName.includes(search);
      const matchStatus = statusFilter === "all" || p.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [search, statusFilter]);

  const totalPaid = MOCK_PAYMENTS.filter((p) => p.status === "paid").reduce((s, p) => s + p.amount, 0);
  const totalOverdue = MOCK_PAYMENTS.filter((p) => p.status === "overdue").reduce((s, p) => s + p.amount, 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <Wallet size={28} className="text-brand-600" />
          المدفوعات
        </h1>
        <p className="text-muted-foreground text-sm mt-1">إدارة الإيرادات والمدفوعات</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-card rounded-2xl border border-border p-4 text-center">
          <p className="text-muted-foreground text-xs">إجمالي المدفوع</p>
          <p className="text-2xl font-bold text-success-600 mt-1">{totalPaid.toLocaleString()} ج.م</p>
        </div>
        <div className="bg-card rounded-2xl border border-border p-4 text-center">
          <p className="text-muted-foreground text-xs">متأخرات</p>
          <p className="text-2xl font-bold text-danger-600 mt-1">{totalOverdue.toLocaleString()} ج.م</p>
        </div>
        <div className="bg-card rounded-2xl border border-border p-4 text-center">
          <p className="text-muted-foreground text-xs">نسبة التحصيل</p>
          <p className="text-2xl font-bold text-brand-600 mt-1">{totalOverdue === 0 ? "100" : Math.round((totalPaid / (totalPaid + totalOverdue)) * 100)}%</p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={18} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="بحث..." className={cn("w-full pr-10 pl-4 py-2.5 rounded-xl", "bg-card border border-border text-foreground placeholder:text-muted-foreground", "focus:ring-2 focus:ring-ring text-sm")} />
        </div>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="px-4 py-2.5 rounded-xl text-sm bg-card border border-border text-foreground">
          <option value="all">كل الحالات</option>
          {Object.entries(STATUS_MAP).map(([k, v]) => (<option key={k} value={k}>{v.label}</option>))}
        </select>
      </div>

      <div className="bg-card rounded-2xl border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="text-right px-4 py-3 font-semibold text-muted-foreground">الطالب</th>
                <th className="text-right px-4 py-3 font-semibold text-muted-foreground">ولي الأمر</th>
                <th className="text-right px-4 py-3 font-semibold text-muted-foreground">المبلغ</th>
                <th className="text-right px-4 py-3 font-semibold text-muted-foreground">الحالة</th>
                <th className="text-right px-4 py-3 font-semibold text-muted-foreground">تاريخ الاستحقاق</th>
                <th className="text-right px-4 py-3 font-semibold text-muted-foreground">تاريخ الدفع</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => (
                <tr key={p.id} className={cn("border-b border-border last:border-0 hover:bg-muted/30 transition-colors", p.status === "overdue" && "bg-danger-50/50")}>
                  <td className="px-4 py-3 font-semibold text-foreground">{p.studentName}</td>
                  <td className="px-4 py-3 text-foreground">{p.parentName}</td>
                  <td className="px-4 py-3 font-bold text-foreground">{p.amount.toLocaleString()} ج.م</td>
                  <td className="px-4 py-3">
                    <span className="text-xs font-semibold px-2.5 py-1 rounded-full" style={{ backgroundColor: STATUS_MAP[p.status]?.bg, color: STATUS_MAP[p.status]?.color }}>{STATUS_MAP[p.status]?.label}</span>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground text-xs">{new Date(p.dueDate).toLocaleDateString("ar-EG")}</td>
                  <td className="px-4 py-3 text-muted-foreground text-xs">{p.paidAt ? new Date(p.paidAt).toLocaleDateString("ar-EG") : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}