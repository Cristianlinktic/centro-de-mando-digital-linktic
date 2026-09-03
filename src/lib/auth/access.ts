import "server-only";
import { NextResponse } from "next/server";
import { getAuthenticatedSupabaseClient } from "@/lib/supabase-server";
import { canEdit, normalizeRole, SCREEN_PREFIX, type UserAccess } from "@/lib/auth/rbac";

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

  const [{ data: profile }, { data: rows }] = await Promise.all([
    supabase.from("profiles").select("user_role, full_name").eq("id", user.id).single(),
    supabase
      .from("user_screen_access")
      .select("screen_key")
      .eq("user_id", user.id)
      .like("screen_key", `${SCREEN_PREFIX}%`),
  ]);

  const role = normalizeRole(profile?.user_role);
  const screens = (rows ?? []).map((r: { screen_key: string }) => r.screen_key);
  const name =
    profile?.full_name ||
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
