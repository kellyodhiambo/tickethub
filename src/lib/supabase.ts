import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_PUBLIC_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_PUBLIC_SUPABASE_ANON_KEY as string;

if (!supabaseUrl || !supabaseAnonKey) {
  // Keeps the app usable while still surfacing a clear console hint in development.
  console.warn("Supabase environment variables are missing. Live data will be unavailable.");
}

export const supabase = createClient(supabaseUrl ?? "", supabaseAnonKey ?? "", {
  auth: {
    // Keep this app's persisted session separate from any other app that uses
    // the same Supabase project on the same browser origin.
    storageKey: "tickethub-auth-token",
    persistSession: true,
    autoRefreshToken: true,
    flowType: "pkce",
    // The callback route exchanges the code explicitly, so URL detection stays off.
    detectSessionInUrl: false,
  },
});
