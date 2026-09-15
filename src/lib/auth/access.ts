import "server-only";
import { NextResponse } from "next/server";
import { getAuthenticatedSupabaseClient } from "@/lib/supabase-server";
import { canEdit, hasAppAccess, normalizeRole, SCREEN_PREFIX, type UserAccess } from "@/lib/auth/rbac";

/**
 * Carga el acceso del usuario ACTUAL (sesión por cookies de Supabase Auth):
 * rol normalizado + pantallas "lt-tab:*" permitidas. null si no hay sesión.
 *
 * Server-only. Úsese en Server Components (page/layout) y Route Handlers.
 */
export async function getServerAccess(): Promise<UserAccess | null> {
  const supabase = await getAuthenticatedSupabaseClient();

  let user = null;
  try {
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser();
    user = authUser;
  } catch {
    // Refresh token inválido/caducado (p.ej. cookie vieja de otra instancia de
    // Supabase): tratamos como sin sesión y limpiamos la cookie local.
    await supabase.auth.signOut();
    return null;
  }
  if (!user) return null;

  const [{ data: profile, error: profileError }, { data: rows }] = await Promise.all([
    supabase.from("profiles").select("user_role, full_name").eq("id", user.id).single(),
    supabase
      .from("user_screen_access")
      .select("screen_key")
      .eq("user_id", user.id)
      .like("screen_key", `${SCREEN_PREFIX}%`),
  ]);

  // Esta instancia de Supabase es compartida con otras apps (auth.users es
  // por-proyecto, no por-app: ver comentario en rbac.ts sobre "dashboard-unificado").
  // Una sesión válida en Supabase Auth NO implica que la cuenta pertenezca a
  // ESTE tablero: sin fila en `profiles`, antes se caía a rol "viewer" con
  // screens vacíos, lo que igual pasaba el guard `if (!access)` de rutas
  // como /api/globe-summary (llama a un LLM de pago), /api/perfil/avatar y
  // /api/me — cualquier cuenta autenticada en el proyecto compartido, sin
  // importar de qué app viniera, podía usarlas. Ahora se niega directamente.
  if (profileError || !profile) {
    return null;
  }

  const role = normalizeRole(profile.user_role);
  const screens = (rows ?? []).map((r: { screen_key: string }) => r.screen_key);
  const name =
    profile.full_name ||
    (user.user_metadata?.full_name as string) ||
    (user.user_metadata?.username as string) ||
    user.email ||
    "";

  return {
    userId: user.id,
    email: user.email ?? "",
    name: typeof name === "string" ? name.split(/[\s@]/)[0] : "",
    role,
    screens,
  };
}

type Guard = { access: UserAccess } | { error: NextResponse };

/** Guard de API: exige sesión + rol superadmin. */
export async function requireSuperadmin(): Promise<Guard> {
  const access = await getServerAccess();
  if (!access) return { error: NextResponse.json({ error: "No autenticado." }, { status: 401 }) };
  if (access.role !== "superadmin")
    return { error: NextResponse.json({ error: "No autorizado." }, { status: 403 }) };
  return { access };
}

/** Guard de API: exige sesión + permisos de edición (admin o superadmin). */
export async function requireEditor(): Promise<Guard> {
  const access = await getServerAccess();
  if (!access) return { error: NextResponse.json({ error: "No autenticado." }, { status: 401 }) };
  if (!canEdit(access.role))
    return { error: NextResponse.json({ error: "No autorizado." }, { status: 403 }) };
  return { access };
}

/**
 * Guard de API: exige sesión + acceso real a ESTE tablero (superadmin o al
 * menos una pantalla "lt-tab:*"), igual criterio que usa el middleware para
 * las páginas (`hasAppAccess`). A diferencia de `requireEditor`/
 * `requireSuperadmin` (pensados para acciones administrativas por rol),
 * este guard es para las rutas de CONTENIDO (/api/me, /api/posts,
 * /api/analyst, /api/globe-summary, /api/media/[id], /api/perfil/avatar):
 * `getServerAccess()` ya no devuelve null solo por no tener fila en
 * `profiles`, porque el proyecto de Supabase es compartido y otra app
 * (p.ej. nocode-qa) puede haber creado esa fila con rol "viewer" por
 * defecto vía su propio trigger — sin este guard, esas rutas de contenido
 * quedaban abiertas a cualquier cuenta autenticada del proyecto compartido.
 */
export async function requireAppAccess(): Promise<Guard> {
  const access = await getServerAccess();
  if (!access) return { error: NextResponse.json({ error: "No autenticado." }, { status: 401 }) };
  if (!hasAppAccess(access))
    return { error: NextResponse.json({ error: "No autorizado." }, { status: 403 }) };
  return { access };
}
