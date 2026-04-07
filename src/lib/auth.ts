import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { UserRole } from "@/types/common.types";

/** Valid roles — used to verify DB value */
const VALID_ROLES: UserRole[] = ["admin", "sales", "ops", "owner"];

async function getSupabaseServer() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          } catch {
            // ignore in server components
          }
        },
      },
    }
  );
}

export async function getCurrentUser() {
  const supabase = await getSupabaseServer();

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  // CRITICAL: No profile = no access (don't fallback to admin!)
  if (!profile) return null;

  // CRITICAL: No valid role = no access
  const role = profile.role as UserRole;
  if (!role || !VALID_ROLES.includes(role)) return null;

  // CRITICAL: Inactive user = no access
  if (profile.is_active === false) return null;

  return {
    id: user.id,
    email: user.email ?? "",
    fullName:
      profile.full_name ??
      user.email?.split("@")[0] ??
      "User",
    fullNameAr:
      profile.full_name_ar ??
      user.email?.split("@")[0] ??
      "مستخدم",
    role,
    avatarUrl: profile.avatar_url ?? null,
    isActive: true,
  };
}

export async function requireAuth() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}

export async function requireRole(roles: UserRole[]) {
  const user = await requireAuth();
  if (!roles.includes(user.role)) redirect("/");
  return user;
}