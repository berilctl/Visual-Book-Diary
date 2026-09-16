import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

// Next.js 16: "middleware" artık "proxy" olarak adlandırılıyor (aynı işlev).
// Bu dosya her istekte Supabase oturum cookie'sini tazeler VE korumalı
// route'lar için optimistic yönlendirme yapar (PRD Bölüm 7).

// Giriş yapmamış kullanıcının erişemeyeceği route'lar.
const PROTECTED_PREFIXES = ["/dashboard", "/books"];

export async function proxy(request: NextRequest) {
  // getUser() cookie tazeleyebilir; tazelenen cookie'ler bu response'a yazılır.
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

  // ÖNEMLİ: createServerClient ile getUser() arasına kod koymayın; aksi halde
  // oturumun rastgele kapanmasıyla sonuçlanan zor bir bug ile karşılaşabilirsiniz.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const path = request.nextUrl.pathname;
  const isProtected = PROTECTED_PREFIXES.some(
    (prefix) => path === prefix || path.startsWith(`${prefix}/`),
  );

  // Giriş yapmamış kullanıcı korumalı route'a giderse -> /
  if (!user && isProtected) {
    const url = request.nextUrl.clone();
    url.pathname = "/";
    return copyCookies(supabaseResponse, NextResponse.redirect(url));
  }

  // Giriş yapmış kullanıcı landing/login (/) sayfasına giderse -> /dashboard
  // Yalnızca sayfa gezinmelerinde (GET/HEAD). Landing'deki Server Action'lar
  // da "/"a POST edilir; oturum varken onları yönlendirmek (307 metodu korur)
  // isteği POST /dashboard'a taşır, yanıt RSC olmadığı için istemci
  // "An unexpected response was received from the server" hatası fırlatır.
  // Action'lar kendi redirect'lerini zaten yapıyor.
  const isNavigation = request.method === "GET" || request.method === "HEAD";
  if (user && path === "/" && isNavigation) {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    return copyCookies(supabaseResponse, NextResponse.redirect(url));
  }

  return supabaseResponse;
}

// Tazelenen oturum cookie'lerini redirect response'una taşır; aksi halde
// yönlendirme sırasında kullanıcı oturumu düşebilir.
function copyCookies(from: NextResponse, to: NextResponse) {
  from.cookies.getAll().forEach((cookie) => to.cookies.set(cookie));
  return to;
}

export const config = {
  // Statik dosyalar ve görseller dışındaki tüm route'larda çalış.
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|svg|webp|ico)$).*)"],
};
