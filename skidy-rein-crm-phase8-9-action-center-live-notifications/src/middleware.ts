import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Owner = same as Admin — full access
 * Must match src/config/navigation.ts
 */
const ROUTE_ROLES: Record<string, string[]> = {
  "/action-center": ["admin", "owner", "sales", "ops"],
  "/leads":      ["admin", "owner", "sales"],
  "/follow-ups": ["admin", "owner", "sales", "ops"],
  "/students":   ["admin", "owner", "sales", "ops"],
  "/parents":    ["admin", "owner", "ops"],
  "/teachers":   ["admin", "owner", "ops"],
  "/schedule":   ["admin", "owner", "ops"],
  "/payments":   ["admin", "owner", "sales", "ops"],
  "/reports":    ["admin", "owner"],
  "/settings":   ["admin", "owner"],
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

  if (isPublicAsset) {
    return supabaseResponse;
  }

  if (!user && !isLoginPage) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  if (user && isLoginPage) {
    const url = request.nextUrl.clone();
    url.pathname = "/";
    return NextResponse.redirect(url);
  }

  if (user && !isLoginPage) {
    const matchedRoute = Object.keys(ROUTE_ROLES).find(
      (route) => pathname === route || pathname.startsWith(route + "/")
    );

    if (matchedRoute) {
      try {
        const { data: profile } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", user.id)
          .maybeSingle();

        const userRole = profile?.role;

        if (userRole && !ROUTE_ROLES[matchedRoute].includes(userRole)) {
          const url = request.nextUrl.clone();
          url.pathname = "/";
          return NextResponse.redirect(url);
        }
      } catch {
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