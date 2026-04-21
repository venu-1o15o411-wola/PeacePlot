import AsyncStorage from "@react-native-async-storage/async-storage";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const anonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

/**
 * Supabase client expects project origin only: https://YOUR_REF.supabase.co
 * If .env mistakenly includes /rest/v1 or other paths, Edge Functions 404.
 */
function normalizeSupabaseProjectUrl(raw: string | undefined): string | undefined {
  if (!raw?.trim()) return undefined;
  const t = raw.trim().replace(/\/+$/, "");
  try {
    const u = new URL(t.startsWith("http") ? t : `https://${t}`);
    return `${u.protocol}//${u.host}`;
  } catch {
    return t;
  }
}

const url = normalizeSupabaseProjectUrl(process.env.EXPO_PUBLIC_SUPABASE_URL);

export const isSupabaseConfigured = Boolean(url && anonKey);

export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(url!, anonKey!, {
      auth: {
        storage: AsyncStorage,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
      },
    })
  : null;

export function requireSupabase(): SupabaseClient {
  if (!supabase) {
    throw new Error(
      "Supabase is not configured. Set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY in `.env` (see `.env.example`).",
    );
  }
  return supabase;
}
