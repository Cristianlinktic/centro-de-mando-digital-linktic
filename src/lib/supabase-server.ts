import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// CLIENTE PARA EL SERVIDOR (Server Components / API Routes)
// Este cliente lee y escribe cookies para mantener la sesión sincronizada
export async function getAuthenticatedSupabaseClient() {
  const cookieStore = await cookies()

  return createServerClient(
    supabaseUrl,
    supabaseAnonKey,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value, ...options })
          } catch (error) {
            // El método set puede fallar si se llama desde un Server Component
            // Esto es normal en Next.js si solo estamos leyendo datos
          }
        },
        remove(name: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value: '', ...options })
          } catch (error) {
            // El método remove puede fallar si se llama desde un Server Component
          }
        },
      },
      db: { schema: 'centro_mando' },
    }
  )
}
