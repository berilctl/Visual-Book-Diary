// Orphaned image cleanup — finds files in the book-images bucket that NO row
// references, and optionally deletes them.
//
// Usage, from the project directory:
//   npm run storage:orphans              -> report only, nothing is deleted
//   npm run storage:orphans -- --delete  -> DELETES the reported files (irreversible)
//
// The app cleans up after itself (lib/storage/cleanup.ts); this script exists
// for files that accumulated before that and for the rare leftover case where
// an upload succeeds but the save request never reaches the server.
//
// Safety rules:
// - Dry run by default; deletion requires --delete.
// - It STOPS if the references (books.cover_url, characters.image_url,
//   locations.image_url) cannot be read in full: an incomplete reference list
//   would make files that are in use look orphaned.
// - Tables are paged ordered by id; unordered paging can skip rows.
// - Files uploaded in the last hour are skipped, so an image picked in an open
//   form but not saved yet survives.
// - Folder placeholder files (".emptyFolderPlaceholder" and friends) are skipped.
// - It runs with the service role (bypassing RLS) and therefore sees every
//   user's files. It touches only this bucket and only the files it listed.

import { createClient } from "@supabase/supabase-js";
import { pathToFileURL } from "node:url";

export const BUCKET = "book-images";
export const MIN_AGE_MS = 60 * 60 * 1000;
const DB_PAGE = 1000;
const STORAGE_PAGE = 100;
const PUBLIC_MARKER = `/storage/v1/object/public/${BUCKET}/`;

const REFERENCES = [
  ["books", "cover_url"],
  ["characters", "image_url"],
  ["locations", "image_url"],
];

// Public URL -> object path inside the bucket, or null when it points elsewhere.
export function toObjectPath(publicUrl) {
  let pathname;
  try {
    pathname = new URL(publicUrl).pathname;
  } catch {
    return null;
  }
  const at = pathname.indexOf(PUBLIC_MARKER);
  if (at === -1) return null;
  const raw = pathname.slice(at + PUBLIC_MARKER.length);
  try {
    return decodeURIComponent(raw);
  } catch {
    return raw;
  }
}

// Sorts files into orphans and recent uploads. A file with an unreadable
// createdAt counts as recent, which is the safe side.
export function classify(files, referenced, now = Date.now()) {
  const orphans = [];
  const recent = [];
  for (const file of files) {
    const name = file.path.split("/").pop() ?? "";
    if (name.startsWith(".")) continue;
    if (referenced.has(file.path)) continue;
    const age = now - Date.parse(file.createdAt);
    if (!(age >= MIN_AGE_MS)) recent.push(file);
    else orphans.push(file);
  }
  return { orphans, recent };
}

async function loadReferences(supabase) {
  const referenced = new Set();
  for (const [table, column] of REFERENCES) {
    for (let from = 0; ; from += DB_PAGE) {
      const { data, error } = await supabase
        .from(table)
        .select(`id, ${column}`)
        .not(column, "is", null)
        .order("id")
        .range(from, from + DB_PAGE - 1);
      if (error) {
        throw new Error(`Could not read ${table}.${column}: ${error.message}`);
      }
      for (const row of data) {
        const path = toObjectPath(row[column]);
        if (path) referenced.add(path);
      }
      if (data.length < DB_PAGE) break;
    }
  }
  return referenced;
}

async function listFiles(supabase, prefix = "") {
  const files = [];
  for (let offset = 0; ; offset += STORAGE_PAGE) {
    const { data, error } = await supabase.storage.from(BUCKET).list(prefix, {
      limit: STORAGE_PAGE,
      offset,
      sortBy: { column: "name", order: "asc" },
    });
    if (error) {
      throw new Error(`Could not list "${prefix || "/"}": ${error.message}`);
    }
    for (const item of data) {
      const path = prefix ? `${prefix}/${item.name}` : item.name;
      if (item.id === null) {
        files.push(...(await listFiles(supabase, path)));
      } else {
        files.push({
          path,
          size: item.metadata?.size ?? 0,
          createdAt: item.created_at,
        });
      }
    }
    if (data.length < STORAGE_PAGE) break;
  }
  return files;
}

const kb = (bytes) => `${(bytes / 1024).toFixed(0)} KB`;

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error(
      "NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY are missing. " +
        "Run the script with `npm run storage:orphans`, which reads .env.local.",
    );
  }
  const shouldDelete = process.argv.includes("--delete");
  const supabase = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  // References first, files second: a file uploaded and linked in between is
  // still "recent" under the one-hour threshold, so it is skipped.
  const referenced = await loadReferences(supabase);
  const files = await listFiles(supabase);
  const { orphans, recent } = classify(files, referenced);

  const total = orphans.reduce((sum, f) => sum + f.size, 0);
  console.log(`Bucket: ${BUCKET}`);
  console.log(
    `Files in bucket: ${files.length} · images referenced by rows: ${referenced.size}`,
  );
  console.log(`Skipped as uploaded within the last hour: ${recent.length}`);
  console.log(`Orphaned: ${orphans.length} files (${kb(total)})`);
  for (const f of orphans) {
    console.log(`  - ${f.path}  (${kb(f.size)}, ${f.createdAt})`);
  }
  if (!shouldDelete) {
    console.log(
      orphans.length
        ? "\nDry run — nothing was deleted. To delete:\n  npm run storage:orphans -- --delete"
        : "\nNothing to clean up.",
    );
    return;
  }
  if (orphans.length === 0) {
    console.log("\nNothing to clean up.");
    return;
  }

  let removed = 0;
  for (let i = 0; i < orphans.length; i += STORAGE_PAGE) {
    const chunk = orphans.slice(i, i + STORAGE_PAGE).map((f) => f.path);
    const { data, error } = await supabase.storage.from(BUCKET).remove(chunk);
    if (error) {
      console.error(`Failed to delete a batch of ${chunk.length}: ${error.message}`);
      continue;
    }
    removed += data?.length ?? 0;
  }
  console.log(`\nDeleted ${removed}/${orphans.length} files.`);
  if (removed !== orphans.length) process.exitCode = 1;
}

// Only when executed directly, not when imported.
if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  main().catch((error) => {
    console.error(`\nStopped, nothing was deleted: ${error.message}`);
    process.exitCode = 1;
  });
}
