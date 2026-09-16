import "server-only";
import { createAdminClient } from "./admin";

// Kullanıcı adından hesap bulma. Başkasının profilini okuduğu için RLS'i
// aşmak zorunda; bu yüzden service-role ile ve yalnızca sunucuda çalışır.
// Sonuç (kimlik ya da e-posta) asla istemciye dönmez.
//
// Arama, migrations/001_username_login.sql'deki user_id_for_username
// fonksiyonuyla yapılır: PostgREST lower(username) üzerinden filtreleyemez,
// ilike ise "_" karakterini joker sayar ("ber_ingo" -> "berlingo" eşleşirdi).

type Lookup<T> = { ok: true; value: T | null } | { ok: false };

export async function findUserIdByUsername(
  username: string,
): Promise<Lookup<string>> {
  const admin = createAdminClient();
  const { data, error } = await admin.rpc("user_id_for_username", {
    p_username: username,
  });
  if (error) {
    console.error("[username-lookup] rpc failed:", error.message);
    return { ok: false };
  }
  return { ok: true, value: (data as string | null) ?? null };
}

export async function findEmailByUsername(
  username: string,
): Promise<Lookup<string>> {
  const idLookup = await findUserIdByUsername(username);
  if (!idLookup.ok || !idLookup.value) return idLookup;

  const admin = createAdminClient();
  const { data, error } = await admin.auth.admin.getUserById(idLookup.value);
  if (error) {
    console.error("[username-lookup] getUserById failed:", error.message);
    return { ok: false };
  }
  return { ok: true, value: data.user?.email ?? null };
}
