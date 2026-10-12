import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
export const cloudConfigured = Boolean(url && key);
let cached: SupabaseClient | null = null;
export function getSupabase(): SupabaseClient | null {
  if (!cloudConfigured) return null;
  if (!cached) cached = createClient(url!, key!, {
    auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
  });
  return cached;
}
