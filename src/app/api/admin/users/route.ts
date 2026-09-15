import { NextResponse } from "next/server";
import { requireSuperadmin } from "@/lib/auth/access";
import { getServiceRoleSupabaseClient } from "@/lib/supabase-admin";
import { allScreens, hasAppAccess, normalizeRole, type AppRole } from "@/lib/auth/rbac";

const VALID_ROLES: AppRole[] = ["superadmin", "admin", "viewer"];

/** GET: lista usuarios con su rol y pantallas asignadas (solo superadmin). */
export async function GET() {
  const guard = await requireSuperadmin();
  if ("error" in guard) return guard.error;

  const admin = getServiceRoleSupabaseClient();
  const { data: list, error } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const ids = list.users.map((u) => u.id);
  const [{ data: profiles }, { data: access }] = await Promise.all([
    ids.length
      ? admin.from("profiles").select("id, user_role, full_name").in("id", ids)
      : Promise.resolve({ data: [] as { id: string; user_role: string; full_name: string }[] }),
    ids.length
      ? admin.from("user_screen_access").select("user_id, screen_key").in("user_id", ids)
      : Promise.resolve({ data: [] as { user_id: string; screen_key: string }[] }),
  ]);

  const profMap = new Map((profiles ?? []).map((p) => [p.id, p]));
  const screenMap = new Map<string, string[]>();
  for (const r of access ?? []) {
    const arr = screenMap.get(r.user_id) ?? [];
    arr.push(r.screen_key);
    screenMap.set(r.user_id, arr);
  }

  const validKeys = new Set(allScreens().map((s) => s.key));
  const users = list.users
    .map((u) => {
      const p = profMap.get(u.id);
      // Solo exponemos las pantallas de ESTE tablero (lt-tab:*).
      const screens = (screenMap.get(u.id) ?? []).filter((k) => validKeys.has(k));
      return {
        id: u.id,
        email: u.email ?? "",
        role: normalizeRole(p?.user_role),
        full_name: p?.full_name ?? "",
        screens,
      };
    })
    // Esta instancia de Supabase es compartida con otras apps: el trigger de
    // auto-provisión crea fila en `profiles` para CUALQUIER alta en
    // auth.users (de cualquier app), así que "tiene fila en profiles" ya no
    // distingue cuentas ajenas (mismo hallazgo que llevó a `requireAppAccess`
    // en access.ts). El criterio real es si de verdad tiene acceso a este
    // tablero: superadmin, o al menos una pantalla lt-tab asignada.
    .filter((u) => hasAppAccess(u));

  return NextResponse.json({ users, screens: allScreens() });
}

/** POST: crea un usuario (Supabase Auth) + perfil con rol + pantallas. */
export async function POST(req: Request) {
  const guard = await requireSuperadmin();
  if ("error" in guard) return guard.error;

  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "JSON inválido." }, { status: 400 });

  const usernameRaw = String(body.username ?? body.email ?? "").trim();
  const password = String(body.password ?? "");
  const role = body.role as AppRole;
  const fullName = String(body.full_name ?? "").trim();
  const screensIn: string[] = Array.isArray(body.screens) ? body.screens.map(String) : [];

  if (!usernameRaw || password.length < 6) {
    return NextResponse.json({ error: "Usuario y contraseña (mínimo 6) requeridos." }, { status: 400 });
  }
  if (!VALID_ROLES.includes(role)) {
    return NextResponse.json({ error: "Rol inválido." }, { status: 400 });
  }

  const validKeys = new Set(allScreens().map((s) => s.key));
  const screens = screensIn.filter((s) => validKeys.has(s));
  const email = usernameRaw.includes("@") ? usernameRaw : `${usernameRaw}@yopmail.com`;

  const admin = getServiceRoleSupabaseClient();
  const { data: created, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: fullName, username: usernameRaw.split("@")[0] },
  });
  if (error || !created.user) {
    return NextResponse.json({ error: error?.message ?? "No se pudo crear el usuario." }, { status: 400 });
  }

  const userId = created.user.id;
  // El trigger crea el perfil con rol 'reader'; fijamos el rol y nombre definitivos.
  await admin.from("profiles").upsert(
    { id: userId, user_role: role, full_name: fullName || null },
    { onConflict: "id" },
  );
  if (screens.length) {
    await admin.from("user_screen_access").insert(screens.map((s) => ({ user_id: userId, screen_key: s })));
  }

  return NextResponse.json({ ok: true, id: userId });
}
