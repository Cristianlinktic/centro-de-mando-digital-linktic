import "server-only";
import { headers } from "next/headers";
import { getServiceRoleSupabaseClient } from "@/lib/supabase-admin";

// Rate limit del login/signup, persistido en Supabase (tabla
// centro_mando.rate_limits + función increment_rate_limit). No se puede
// guardar en memoria: en Vercel cada invocación puede correr en una
// instancia serverless distinta, así que un Map en memoria no se comparte
// de forma confiable entre requests — se reiniciaría sin avisar.
const WINDOW_MS = 5 * 60 * 1000; // 5 minutos
const MAX_ATTEMPTS = 5;

/** IP real del cliente. En Vercel este header lo sobrescribe su edge
 *  network con la IP real y nunca reenvía un valor puesto por el cliente
 *  (ver https://vercel.com/docs/headers/request-headers#x-forwarded-for),
 *  así que no es spoofeable en este despliegue. */
export async function getClientIp(): Promise<string> {
  const hdrs = await headers();
  const forwardedFor = hdrs.get("x-forwarded-for");
  return forwardedFor?.split(",")[0]?.trim() || hdrs.get("x-real-ip") || "unknown";
}

/** Registra un intento para `ip` y devuelve true si ya superó el límite.
 *  El incremento es atómico en la base de datos (evita condiciones de
 *  carrera si llegan varios intentos casi simultáneos). */
export async function recordLoginAttempt(ip: string): Promise<boolean> {
  const supabase = getServiceRoleSupabaseClient();
  const { data: count, error } = await supabase.rpc("increment_rate_limit", {
    p_key: ip,
    p_window_ms: WINDOW_MS,
    p_now: new Date().toISOString(),
  });

  if (error) {
    console.error(`[rate-limit] error al registrar intento (ip=${ip}):`, error.message);
    return false; // No bloquear el login por una falla de infraestructura.
  }

  return (count ?? 0) > MAX_ATTEMPTS;
}

/** Login exitoso: esa IP ya probó ser legítima, no debería seguir penalizada. */
export async function resetLoginAttempts(ip: string): Promise<void> {
  const supabase = getServiceRoleSupabaseClient();
  await supabase.from("rate_limits").delete().eq("key", ip);
}
