import { createBrowserClient } from '@supabase/ssr'
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// CLIENTE PARA EL NAVEGADOR (Client Components)
// Singleton para evitar "Multiple GoTrueClient instances"
// Configurado para resolver consultas en el schema "centro_mando".
let browserClient: any;

export const getSupabaseBrowserClient = () => {
  if (browserClient) return browserClient;

  browserClient = createBrowserClient(
    supabaseUrl,
    supabaseAnonKey,
    { db: { schema: 'centro_mando' } }
  );

  return browserClient;
};

// Exportamos 'supabase' como el cliente de navegador por defecto para compatibilidad
export const supabase = getSupabaseBrowserClient();

// CLIENTE ADMINISTRATIVO (Solo para el Servidor)
// Se usa para saltar RLS cuando sea necesario y seguro
// Configurado para resolver consultas en el schema "centro_mando".
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
