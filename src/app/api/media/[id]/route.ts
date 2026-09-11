export const runtime = "nodejs";

import type { SocialPlatform } from "@/lib/social-platforms";
import { getServerAccess } from "@/lib/auth/access";

const VALID_PLATFORMS: SocialPlatform[] = ["instagram", "facebook", "tiktok"];

function parsePlatform(value: string | null): SocialPlatform {
  return VALID_PLATFORMS.includes(value as SocialPlatform) ? (value as SocialPlatform) : "instagram";
}

interface MediaRow {
  media_id: string;
  media_type?: string;
  media_url?: string | null;
  media_thumbnail_url?: string | null;
}

const cache = new Map<SocialPlatform, { at: number; byId: Map<string, string> }>();
const TTL_MS = 15 * 60 * 1000;

async function getFreshUrls(platform: SocialPlatform): Promise<Map<string, string>> {
  const cached = cache.get(platform);
  if (cached && Date.now() - cached.at < TTL_MS) return cached.byId;

  const key = process.env.WINDSOR_API_KEY;
  if (!key) throw new Error("WINDSOR_API_KEY no está configurada en las variables de entorno de Vercel");

  const url = `https://connectors.windsor.ai/${platform}?api_key=${key}&date_preset=last_90d&fields=media_id,media_type,media_url,media_thumbnail_url`;

  let res: Response;
  try {
    res = await fetch(url, { cache: "no-store" });
  } catch (e) {
    throw new Error(`Error de red al contactar Windsor.ai: ${(e as Error).message}`);
  }

  if (!res.ok) {
    const body = await res.text().catch(() => "(sin cuerpo)");
    throw new Error(`Windsor.ai respondió ${res.status}: ${body.slice(0, 200)}`);
  }

  let json: { data?: MediaRow[] };
  try {
    json = await res.json();
  } catch {
    throw new Error("Windsor.ai devolvió una respuesta que no es JSON válido");
  }

  const byId = new Map<string, string>();
  for (const r of json.data ?? []) {
    const best = r.media_thumbnail_url || r.media_url;
    if (r.media_id && best) byId.set(String(r.media_id), best);
  }
  cache.set(platform, { at: Date.now(), byId });
  return byId;
}

function weservUrl(sourceUrl: string): string {
  const src = encodeURIComponent(sourceUrl.replace(/^https:\/\//, "ssl:"));
  return `https://images.weserv.nl/?url=${src}&w=800&output=jpg`;
}

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const access = await getServerAccess();
  if (!access) return Response.json({ error: "No autenticado." }, { status: 401 });

  const { id } = await params;
  const { searchParams } = new URL(req.url);
  const platform = parsePlatform(searchParams.get("platform"));

  let urls: Map<string, string>;
  try {
    urls = await getFreshUrls(platform);
  } catch (e) {
    const message = (e as Error).message;
    console.error(`[api/media] (${platform}) Error al obtener URLs de Windsor.ai: ${message}`);
    return Response.json({ error: message }, { status: 500 });
  }

  const target = urls.get(id);
  if (!target) {
    return Response.json({ error: `media_id ${id} no encontrado en Windsor.ai (${platform})` }, { status: 404 });
  }

  return Response.redirect(weservUrl(target), 302);
}
