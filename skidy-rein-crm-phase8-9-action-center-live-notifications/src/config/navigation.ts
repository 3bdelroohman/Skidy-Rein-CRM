import {
  LayoutDashboard,
  Users,
  GraduationCap,
  UserCircle,
  BookOpen,
  Wallet,
  CalendarDays,
  ClipboardCheck,
  BarChart3,
  Settings,
  BellRing,
  type LucideIcon,
} from "lucide-react";
import type { UserRole } from "@/types/common.types";

/**
 * Sidebar navigation — single source of truth
 * Owner = same access as Admin
 * @author Abdelrahman
 */

export interface NavigationItem {
  titleAr: string;
  titleEn: string;
  href: string;
  icon: LucideIcon;
  roles: UserRole[];
  badge?: number;
}

export interface NavigationGroup {
  labelAr: string;
  labelEn: string;
  items: NavigationItem[];
}

export const navigationGroups: NavigationGroup[] = [
  {
    labelAr: "الرئيسية",
    labelEn: "Overview",
    items: [
      {
        titleAr: "لوحة التحكم",
        titleEn: "Dashboard",
        href: "/",
        icon: LayoutDashboard,
        roles: ["admin", "owner", "sales", "ops"],
      },
      {
        titleAr: "مركز العمليات",
        titleEn: "Action Center",
        href: "/action-center",
        icon: BellRing,
        roles: ["admin", "owner", "sales", "ops"],
      },
    ],
  },
  {
    labelAr: "المبيعات",
    labelEn: "Sales",
    items: [
      {
        titleAr: "العملاء المحتملين",
        titleEn: "Leads",
        href: "/leads",
        icon: Users,
        roles: ["admin", "owner", "sales"],
      },
      {
        titleAr: "المتابعات",
        titleEn: "Follow-ups",
        href: "/follow-ups",
        icon: ClipboardCheck,
        roles: ["admin", "owner", "sales", "ops"],
      },
    ],
  },
  {
    labelAr: "الأكاديمية",
    labelEn: "Academy",
    items: [
      {
        titleAr: "الطلاب",
        titleEn: "Students",
        href: "/students",
        icon: GraduationCap,
        roles: ["admin", "owner", "sales", "ops"],
      },
      {
        titleAr: "أولياء الأمور",
        titleEn: "Parents",
        href: "/parents",
        icon: UserCircle,
        roles: ["admin", "owner", "ops"],
      },
      {
        titleAr: "المدرسين",
        titleEn: "Teachers",
        href: "/teachers",
        icon: BookOpen,
        roles: ["admin", "owner", "ops"],
      },
      {
        titleAr: "الجدول",
        titleEn: "Schedule",
        href: "/schedule",
        icon: CalendarDays,
        roles: ["admin", "owner", "ops"],
      },
    ],
  },
  {
    labelAr: "المالية",
    labelEn: "Finance",
    items: [
      {
        titleAr: "المدفوعات",
        titleEn: "Payments",
        href: "/payments",
        icon: Wallet,
        roles: ["admin", "owner", "sales", "ops"],
      },
    ],
  },
  {
    labelAr: "التحليلات",
    labelEn: "Analytics",
    items: [
      {
        titleAr: "التقارير",
        titleEn: "Reports",
        href: "/reports",
        icon: BarChart3,
        roles: ["admin", "owner"],
      },
    ],
  },
  {
    labelAr: "النظام",
    labelEn: "System",
    items: [
      {
        titleAr: "الإعدادات",
        titleEn: "Settings",
        href: "/settings",
        icon: Settings,
        roles: ["admin", "owner"],
      },
    ],
  },
];