import "server-only";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// CLIENTE ADMINISTRATIVO — bypassa RLS. Server-only: si algo lo importa desde
// un client component, falla en build/dev en vez de filtrar la service role
// key silenciosamente a runtime.
export function getServiceRoleSupabaseClient() {
  return createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
    db: { schema: 'centro_mando' },
  });
}
