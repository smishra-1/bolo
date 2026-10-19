import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

export const isSupabaseConfigured = Boolean(url && key);

let client: SupabaseClient | null = null;

/** Browser client. Reads and writes are limited by Row Level Security. */
export function getSupabaseBrowserClient(): SupabaseClient {
  if (!url || !key) throw new Error("Supabase is not configured");
  client ??= createBrowserClient(url, key);
  return client;
}
