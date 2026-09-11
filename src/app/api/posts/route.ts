export const runtime = "nodejs";

import type { Post } from "@/lib/instagram-types";
import type { SocialPlatform } from "@/lib/social-platforms";
import { getServerAccess } from "@/lib/auth/access";

const VALID_PLATFORMS: SocialPlatform[] = ["instagram", "facebook", "tiktok"];

function parsePlatform(value: string | null): SocialPlatform {
  return VALID_PLATFORMS.includes(value as SocialPlatform) ? (value as SocialPlatform) : "instagram";
}

// Cache de 2h por red — protege el límite de peticiones del plan free de Windsor.ai
const cache = new Map<SocialPlatform, { at: number; posts: Post[] }>();
const TTL_MS = 2 * 60 * 60 * 1000;

const FIELDS = [
  "media_id",
  "date",
  "media_type",
  "media_url",
  "media_thumbnail_url",
  "media_caption",
  "media_permalink",
  "media_like_count",
  "media_comments_count",
  "media_saved",
  "media_shares",
  "media_reach",
  "media_engagement",
  "media_views",
  "carousel_album_reach",
  "carousel_album_engagement",
  "carousel_album_saved",
].join(",");

function num(row: Record<string, unknown>, ...keys: string[]): number {
  for (const k of keys) {
    const v = row[k];
    if (v !== undefined && v !== null) return Number(v) || 0;
  }
  return 0;
}

function str(row: Record<string, unknown>, ...keys: string[]): string {
  for (const k of keys) {
    const v = row[k];
    if (v !== undefined && v !== null && v !== "") return String(v);
  }
  return "";
}

async function fetchPosts(platform: SocialPlatform): Promise<Post[]> {
  const cached = cache.get(platform);
  if (cached && Date.now() - cached.at < TTL_MS) return cached.posts;

  const key = process.env.WINDSOR_API_KEY;
  if (!key) throw new Error("WINDSOR_API_KEY no configurada en Vercel");

  const url = `https://connectors.windsor.ai/${platform}?api_key=${key}&date_preset=last_90d&fields=${FIELDS}`;

  let res: Response;
  try {
    res = await fetch(url, { cache: "no-store" });
  } catch (e) {
    throw new Error(`Error de red con Windsor.ai: ${(e as Error).message}`);
  }

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Windsor.ai respondió ${res.status}: ${body.slice(0, 200)}`);
  }

  let json: { data?: Record<string, unknown>[] };
  try {
    json = await res.json();
  } catch {
    throw new Error("Windsor.ai no devolvió JSON válido");
  }

  const rows = json.data ?? [];

  // Log de campos disponibles para diagnóstico (solo en primer registro)
  if (rows.length > 0) {
    console.log(`[api/posts] (${platform}) Campos disponibles en Windsor.ai:`, Object.keys(rows[0]));
  }

  // Windsor.ai a veces devuelve un aviso (ej. límite de cuentas del plan Free)
  // disfrazado de fila de datos en vez de un error HTTP real — si se cuela,
  // se vería como una publicación falsa con "Uh-oh..." de texto. Lo detectamos
  // y lo tratamos como el error que en realidad es.
  const warningRow = rows.find((r) => /windsor\.ai/i.test(str(r, "media_id", "media_type", "media_caption")));
  if (warningRow) {
    throw new Error(str(warningRow, "media_id", "media_type", "media_caption"));
  }

  const posts: Post[] = rows
    .filter((r) => str(r, "media_id"))
    .map((r) => {
      const reach = num(r, "media_reach", "carousel_album_reach");
      const engagement = num(r, "media_engagement", "carousel_album_engagement");
      const rate = reach > 0 ? parseFloat(((engagement / reach) * 100).toFixed(2)) : 0;

      return {
        id: str(r, "media_id"),
        date: str(r, "date").slice(0, 10),
        type: str(r, "media_type") || "IMAGE",
        caption: str(r, "media_caption"),
        permalink: str(r, "media_permalink"),
        mediaUrl: str(r, "media_url", "media_thumbnail_url"),
        likes: num(r, "media_like_count"),
        comments: num(r, "media_comments_count"),
        saved: num(r, "media_saved", "carousel_album_saved"),
        shares: num(r, "media_shares"),
        reach,
        engagement,
        videoViews: num(r, "media_views"),
        plays: num(r, "media_views"),
        engagementRate: rate,
      };
    })
    .filter((p) => p.date)
    .sort((a, b) => b.date.localeCompare(a.date));

  cache.set(platform, { at: Date.now(), posts });
  return posts;
}

export async function GET(req: Request) {
  const access = await getServerAccess();
  if (!access) return Response.json({ error: "No autenticado." }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const platform = parsePlatform(searchParams.get("platform"));

  try {
    const posts = await fetchPosts(platform);
    return Response.json({ posts });
  } catch (e) {
    const message = (e as Error).message;
    console.error(`[api/posts] (${platform}) ${message}`);
    return Response.json({ error: message }, { status: 500 });
  }
}
