import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

// Next.js 16 renamed "middleware" to "proxy" (same role). This file refreshes
// the Supabase session cookie on every request and does the optimistic
// redirects for protected routes.

// Routes that require a session.
const PROTECTED_PREFIXES = ["/dashboard", "/books"];

export async function proxy(request: NextRequest) {
  // getUser() may refresh cookies; the refreshed ones are written to this response.
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
            request.cookies.set(name, value),
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  // IMPORTANT: do not put code between createServerClient and getUser(), or
  // sessions start dropping at random and the cause is very hard to find.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const path = request.nextUrl.pathname;
  const isProtected = PROTECTED_PREFIXES.some(
    (prefix) => path === prefix || path.startsWith(`${prefix}/`),
  );

  // Signed-out user on a protected route -> /
  if (!user && isProtected) {
    const url = request.nextUrl.clone();
    url.pathname = "/";
    return copyCookies(supabaseResponse, NextResponse.redirect(url));
  }

  // Signed-in user on the landing page -> /dashboard, but only for navigations
  // (GET/HEAD). The landing page's Server Actions POST to "/" as well, and a 307
  // preserves the method, so redirecting them would turn the request into
  // POST /dashboard; the response is not an RSC payload and the client throws
  // "An unexpected response was received from the server". The actions already
  // handle their own redirects.
  const isNavigation = request.method === "GET" || request.method === "HEAD";
  if (user && path === "/" && isNavigation) {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    return copyCookies(supabaseResponse, NextResponse.redirect(url));
  }

  return supabaseResponse;
}

// Carry the refreshed session cookies over to the redirect response, otherwise
// the user can be signed out by the redirect itself.
function copyCookies(from: NextResponse, to: NextResponse) {
  from.cookies.getAll().forEach((cookie) => to.cookies.set(cookie));
  return to;
}

export const config = {
  // Run on every route except static files and images.
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|svg|webp|ico)$).*)"],
};
