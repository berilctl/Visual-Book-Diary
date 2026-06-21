import { createBrowserClient } from "@supabase/ssr";

/**
 * Browser (client component) Supabase istemcisi.
 * Yalnızca public env değişkenlerini kullanır; RLS aktif olduğu için
 * anon key ile yapılan her sorgu kullanıcının kendi verisiyle sınırlıdır.
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
