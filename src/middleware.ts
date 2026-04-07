import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Route access control — must match src/config/navigation.ts roles
 * "/" (dashboard) is open to ALL authenticated users
 */
const ROUTE_ROLES: Record<string, string[]> = {
  "/leads": ["admin", "sales"],
  "/follow-ups": ["admin", "sales"],
  "/students": ["admin", "ops", "owner"],
  "/parents": ["admin", "ops"],
  "/teachers": ["admin", "ops", "owner"],
  "/schedule": ["admin", "ops", "owner"],
  "/payments": ["admin", "sales", "owner"],
  "/reports": ["admin", "owner"],
  "/settings": ["admin"],
};

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );

          supabaseResponse = NextResponse.next({ request });

          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;
  const isLoginPage = pathname.startsWith("/login");
  const isPublicAsset =
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    /\.[a-zA-Z0-9]+$/.test(pathname);

  // Skip static assets
  if (isPublicAsset) {
    return supabaseResponse;
  }

  // Not authenticated → login
  if (!user && !isLoginPage) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  // Already authenticated on login page → dashboard
  if (user && isLoginPage) {
    const url = request.nextUrl.clone();
    url.pathname = "/";
    return NextResponse.redirect(url);
  }

  // Role-based route protection
  if (user && !isLoginPage) {
    // Find which protected route this matches
    const matchedRoute = Object.keys(ROUTE_ROLES).find(
      (route) => pathname === route || pathname.startsWith(route + "/")
    );

    // If it's a protected route, check role
    if (matchedRoute) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .maybeSingle();

      const userRole = profile?.role;
      const allowedRoles = ROUTE_ROLES[matchedRoute];

      // No role or unauthorized → redirect to dashboard
      if (!userRole || !allowedRoles.includes(userRole)) {
        const url = request.nextUrl.clone();
        url.pathname = "/";
        return NextResponse.redirect(url);
      }
    }
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};