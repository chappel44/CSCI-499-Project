import { createClient } from "@supabase/supabase-js";

// Vite automatically uses .env locally or environment variables in production
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error("Supabase URL and key are required!");
}

export const supabase = createClient(supabaseUrl, supabaseKey);
