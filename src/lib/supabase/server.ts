import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/**
 * Server (Server Component / Route Handler / Server Action) Supabase istemcisi.
 * Cookie tabanlı oturumu okur ve yeniler. Anon key kullanır — RLS korumayı
 * üstlenir. Service role key BU dosyada KULLANILMAZ (bkz. PRD Bölüm 8).
 */
export async function createClient() {
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
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // Server Component'ten çağrıldığında `set` atılır; oturum
            // yenileme middleware'de yapıldığı sürece bu güvenle yutulabilir.
          }
        },
      },
    },
  );
}
