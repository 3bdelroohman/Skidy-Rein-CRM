import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Route-to-Role access map
 * "/" is open to ALL authenticated users
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

  // Not authenticated → login (but don't redirect if already on login)
  if (!user && !isLoginPage) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  // Authenticated on login page → dashboard
  if (user && isLoginPage) {
    const url = request.nextUrl.clone();
    url.pathname = "/";
    return NextResponse.redirect(url);
  }

  // Role-based route protection (only for protected routes, NOT "/")
  if (user && !isLoginPage) {
    const matchedRoute = Object.keys(ROUTE_ROLES).find(
      (route) => pathname === route || pathname.startsWith(route + "/")
    );

    // Only check role for explicitly protected routes
    if (matchedRoute) {
      try {
        const { data: profile } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", user.id)
          .maybeSingle();

        const userRole = profile?.role;
        const allowedRoles = ROUTE_ROLES[matchedRoute];

        // If we got a role and it's not allowed → redirect to dashboard
        // If profile query failed → let request through (layout will handle)
        if (userRole && !allowedRoles.includes(userRole)) {
          const url = request.nextUrl.clone();
          url.pathname = "/";
          return NextResponse.redirect(url);
        }
      } catch {
        // Profile query failed → don't block, let server component handle
        return supabaseResponse;
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