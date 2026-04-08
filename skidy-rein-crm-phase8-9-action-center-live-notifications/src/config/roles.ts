import { type UserRole } from "@/types/common.types";

/**
 * Role-based access control
 * Owner = same as Admin (business owner sees everything)
 * @author Abdelrahman
 */

export interface RolePermissions {
  labelAr: string;
  labelEn: string;
  canViewDashboard: boolean;
  canViewLeads: boolean;
  canCreateLeads: boolean;
  canEditLeads: boolean;
  canDeleteLeads: boolean;
  canViewStudents: boolean;
  canCreateStudents: boolean;
  canEditStudents: boolean;
  canViewParents: boolean;
  canManageParents: boolean;
  canViewTeachers: boolean;
  canManageTeachers: boolean;
  canViewSchedule: boolean;
  canManageSchedule: boolean;
  canViewPayments: boolean;
  canManagePayments: boolean;
  canViewFollowUps: boolean;
  canManageFollowUps: boolean;
  canViewReports: boolean;
  canViewNotifications: boolean;
  canViewSettings: boolean;
  canManageSettings: boolean;
  canManageUsers: boolean;
}

const FULL_ACCESS: RolePermissions = {
  labelAr: "",
  labelEn: "",
  canViewDashboard: true,
  canViewLeads: true,
  canCreateLeads: true,
  canEditLeads: true,
  canDeleteLeads: true,
  canViewStudents: true,
  canCreateStudents: true,
  canEditStudents: true,
  canViewParents: true,
  canManageParents: true,
  canViewTeachers: true,
  canManageTeachers: true,
  canViewSchedule: true,
  canManageSchedule: true,
  canViewPayments: true,
  canManagePayments: true,
  canViewFollowUps: true,
  canManageFollowUps: true,
  canViewReports: true,
  canViewNotifications: true,
  canViewSettings: true,
  canManageSettings: true,
  canManageUsers: true,
};

export const ROLE_PERMISSIONS: Record<UserRole, RolePermissions> = {
  admin: {
    ...FULL_ACCESS,
    labelAr: "مدير النظام",
    labelEn: "Admin",
  },
  owner: {
    ...FULL_ACCESS,
    labelAr: "المالك",
    labelEn: "Owner",
  },
  sales: {
    labelAr: "مبيعات",
    labelEn: "Sales",
    canViewDashboard: true,
    canViewLeads: true,
    canCreateLeads: true,
    canEditLeads: true,
    canDeleteLeads: false,
    canViewStudents: true,
    canCreateStudents: false,
    canEditStudents: false,
    canViewParents: false,
    canManageParents: false,
    canViewTeachers: false,
    canManageTeachers: false,
    canViewSchedule: false,
    canManageSchedule: false,
    canViewPayments: true,
    canManagePayments: true,
    canViewFollowUps: true,
    canManageFollowUps: true,
    canViewReports: false,
    canViewNotifications: true,
    canViewSettings: false,
    canManageSettings: false,
    canManageUsers: false,
  },
  ops: {
    labelAr: "عمليات",
    labelEn: "Operations",
    canViewDashboard: true,
    canViewLeads: false,
    canCreateLeads: false,
    canEditLeads: false,
    canDeleteLeads: false,
    canViewStudents: true,
    canCreateStudents: true,
    canEditStudents: true,
    canViewParents: true,
    canManageParents: true,
    canViewTeachers: true,
    canManageTeachers: true,
    canViewSchedule: true,
    canManageSchedule: true,
    canViewPayments: true,
    canManagePayments: false,
    canViewFollowUps: true,
    canManageFollowUps: true,
    canViewReports: false,
    canViewNotifications: true,
    canViewSettings: false,
    canManageSettings: false,
    canManageUsers: false,
  },
};

/** Check if a role has a specific permission */
export function hasPermission(
  role: UserRole,
  permission: keyof RolePermissions
): boolean {
  const permissions = ROLE_PERMISSIONS[role];
  if (!permissions) return false;
  const value = permissions[permission];
  return typeof value === "boolean" ? value : false;
}