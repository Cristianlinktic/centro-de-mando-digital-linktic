import { createBrowserClient } from '@supabase/ssr'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

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
