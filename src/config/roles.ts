import { type UserRole } from "@/types/common.types";

/**
 * Role-based access control configuration
 * Defines permissions for each user role
 * @author Abdelrahman
 */

export interface RolePermissions {
  labelAr: string;
  labelEn: string;
  canViewDashboard: boolean;
  canViewLeads: boolean;
  canManageLeads: boolean;
  canViewStudents: boolean;
  canManageStudents: boolean;
  canViewParents: boolean;
  canManageParents: boolean;
  canViewTeachers: boolean;
  canManageTeachers: boolean;
  canViewPayments: boolean;
  canManagePayments: boolean;
  canViewSchedule: boolean;
  canManageSchedule: boolean;
  canViewFollowUps: boolean;
  canManageFollowUps: boolean;
  canViewReports: boolean;
  canViewSettings: boolean;
  canManageSettings: boolean;
  canManageUsers: boolean;
}

export const ROLE_PERMISSIONS: Record<UserRole, RolePermissions> = {
  admin: {
    labelAr: "مدير النظام",
    labelEn: "Admin",
    canViewDashboard: true,
    canViewLeads: true,
    canManageLeads: true,
    canViewStudents: true,
    canManageStudents: true,
    canViewParents: true,
    canManageParents: true,
    canViewTeachers: true,
    canManageTeachers: true,
    canViewPayments: true,
    canManagePayments: true,
    canViewSchedule: true,
    canManageSchedule: true,
    canViewFollowUps: true,
    canManageFollowUps: true,
    canViewReports: true,
    canViewSettings: true,
    canManageSettings: true,
    canManageUsers: true,
  },
  sales: {
    labelAr: "مبيعات",
    labelEn: "Sales",
    canViewDashboard: true,
    canViewLeads: true,
    canManageLeads: true,
    canViewStudents: false,
    canManageStudents: false,
    canViewParents: false,
    canManageParents: false,
    canViewTeachers: false,
    canManageTeachers: false,
    canViewPayments: true,
    canManagePayments: true,
    canViewSchedule: false,
    canManageSchedule: false,
    canViewFollowUps: true,
    canManageFollowUps: true,
    canViewReports: false,
    canViewSettings: false,
    canManageSettings: false,
    canManageUsers: false,
  },
  ops: {
    labelAr: "عمليات",
    labelEn: "Operations",
    canViewDashboard: true,
    canViewLeads: false,
    canManageLeads: false,
    canViewStudents: true,
    canManageStudents: true,
    canViewParents: true,
    canManageParents: true,
    canViewTeachers: true,
    canManageTeachers: false,
    canViewPayments: false,
    canManagePayments: false,
    canViewSchedule: true,
    canManageSchedule: true,
    canViewFollowUps: true,
    canManageFollowUps: true,
    canViewReports: false,
    canViewSettings: false,
    canManageSettings: false,
    canManageUsers: false,
  },
  owner: {
    labelAr: "المالك",
    labelEn: "Owner",
    canViewDashboard: true,
    canViewLeads: false,
    canManageLeads: false,
    canViewStudents: true,
    canManageStudents: false,
    canViewParents: false,
    canManageParents: false,
    canViewTeachers: true,
    canManageTeachers: false,
    canViewPayments: true,
    canManagePayments: false,
    canViewSchedule: true,
    canManageSchedule: false,
    canViewFollowUps: false,
    canManageFollowUps: false,
    canViewReports: true,
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