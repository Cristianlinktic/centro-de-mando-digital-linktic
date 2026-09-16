export const runtime = "nodejs";

import type { SocialPlatform } from "@/lib/social-platforms";
import { requireAppAccess } from "@/lib/auth/access";
import { fetchPosts } from "@/lib/windsor";

const VALID_PLATFORMS: SocialPlatform[] = ["instagram", "facebook", "tiktok"];

function parsePlatform(value: string | null): SocialPlatform {
  return VALID_PLATFORMS.includes(value as SocialPlatform) ? (value as SocialPlatform) : "instagram";
}

export async function GET(req: Request) {
  const guard = await requireAppAccess();
  if ("error" in guard) return guard.error;

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
