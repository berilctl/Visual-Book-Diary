import "server-only";
import { createClient } from "@supabase/supabase-js";

/**
 * Service-role Supabase istemcisi — RLS'i BYPASS eder.
 * YALNIZCA güvenilen server-side kodda (örn. Storage upload pipeline,
 * AI üretim route'ları) kullanılır. `server-only` importu bu modülün
 * yanlışlıkla client bundle'a girmesini derleme zamanında engeller.
 */
export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: { autoRefreshToken: false, persistSession: false },
    },
  );
}
