import { NextResponse } from "next/server";
import { getServerAccess } from "@/lib/auth/access";
import { getServiceRoleSupabaseClient } from "@/lib/supabase";

const BUCKET = "centro-mando-images";
const MAX_BYTES = 3 * 1024 * 1024;
const ALLOWED: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
  "image/gif": "gif",
};

/** POST: sube/reemplaza la foto de perfil del usuario logueado (sesión actual, no admin). */
export async function POST(req: Request) {
  const access = await getServerAccess();
  if (!access) return NextResponse.json({ error: "No autenticado." }, { status: 401 });

  const form = await req.formData().catch(() => null);
  const file = form?.get("file");
  if (!file || !(file instanceof File)) {
    return NextResponse.json({ error: "No se recibió ninguna imagen." }, { status: 400 });
  }

  const ext = ALLOWED[file.type];
  if (!ext) {
    return NextResponse.json({ error: "Formato no soportado. Usa PNG, JPG, WEBP o GIF." }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: "La imagen supera el máximo de 3 MB." }, { status: 400 });
  }

  const admin = getServiceRoleSupabaseClient();
  // Nombre fijo por usuario: cada carga reemplaza la anterior, sin acumular archivos huérfanos.
  const path = `avatars/${access.userId}.${ext}`;

  const { error: uploadError } = await admin.storage.from(BUCKET).upload(path, file, {
    contentType: file.type,
    upsert: true,
  });
  if (uploadError) {
    return NextResponse.json({ error: uploadError.message }, { status: 500 });
  }

  const { data: pub } = admin.storage.from(BUCKET).getPublicUrl(path);
  // Cache-bust: la ruta es fija por usuario, así que sin esto el navegador
  // seguiría mostrando la imagen anterior tras reemplazarla.
  const avatarUrl = `${pub.publicUrl}?t=${Date.now()}`;

  const { error: dbError } = await admin
    .from("profiles")
    .update({ avatar_url: avatarUrl })
    .eq("id", access.userId);
  if (dbError) {
    return NextResponse.json({ error: dbError.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, avatarUrl });
}
