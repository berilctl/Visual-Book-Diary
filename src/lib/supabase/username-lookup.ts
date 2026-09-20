import "server-only";
import { createAdminClient } from "./admin";

// Resolves a username to an account. It reads another user's profile row, so
// it has to bypass row-level security: service-role, server-side only. Neither
// the id nor the email is ever returned to the client.
//
// The lookup goes through the user_id_for_username function added in
// migrations/001_username_login.sql: PostgREST cannot filter on
// lower(username), and ilike would treat "_" as a wildcard ("ber_ingo" would
// match "berlingo").

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
