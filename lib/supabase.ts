import { createClient, SupabaseClient } from "@supabase/supabase-js";

// Lazily create the Supabase client so that missing env vars only cause
// an error when an API route actually runs, not at build time.
export function getSupabaseServerClient(): SupabaseClient {
  const url = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw new Error(
      "SUPABASE_URL oder SUPABASE_SERVICE_ROLE_KEY fehlt. Bitte in den Umgebungsvariablen setzen."
    );
  }

  return createClient(url, serviceRoleKey, {
    auth: { persistSession: false },
  });
}

export type DiaryEntry = {
  id: string;
  created_at: string;
  entry_date: string; // YYYY-MM-DD
  raw_transcript: string | null;
  cleaned_text: string;
};
