import { createServerSupabase } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import type { UserRole } from "@/types/common.types";

/**
 * Get current authenticated user with profile
 * Returns null if not authenticated
 * @author Abdelrahman
 */
export async function getCurrentUser() {
  const supabase = await createServerSupabase();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (!profile) return null;

  return {
    id: user.id,
    email: user.email ?? "",
    fullName: profile.full_name,
    fullNameAr: profile.full_name_ar,
    role: profile.role as UserRole,
    avatarUrl: profile.avatar_url,
    isActive: profile.is_active,
  };
}

/**
 * Require authentication — redirects to login if not authenticated
 */
export async function requireAuth() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}

/**
 * Require specific role
 */
export async function requireRole(roles: UserRole[]) {
  const user = await requireAuth();
  if (!roles.includes(user.role)) redirect("/");
  return user;
}