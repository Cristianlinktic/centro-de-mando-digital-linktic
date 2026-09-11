import { NextResponse } from "next/server";
import { requireSuperadmin } from "@/lib/auth/access";
import { getServiceRoleSupabaseClient } from "@/lib/supabase-admin";

/** POST: resetea la contraseña de un usuario (solo superadmin). */
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const guard = await requireSuperadmin();
  if ("error" in guard) return guard.error;

  const { id } = await params;
  const body = await req.json().catch(() => null);
  const password = String(body?.password ?? "");
  if (password.length < 6) {
    return NextResponse.json({ error: "La contraseña debe tener al menos 6 caracteres." }, { status: 400 });
  }

  const admin = getServiceRoleSupabaseClient();

  // Instancia compartida con otras apps: solo permitimos resetear password de
  // usuarios que tienen perfil en centro_mando (creados desde este tablero).
  const { data: existing } = await admin.from("profiles").select("id").eq("id", id).maybeSingle();
  if (!existing) {
    return NextResponse.json({ error: "Usuario no pertenece a este tablero." }, { status: 404 });
  }

  const { error } = await admin.auth.admin.updateUserById(id, { password });
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  return NextResponse.json({ ok: true });
}
