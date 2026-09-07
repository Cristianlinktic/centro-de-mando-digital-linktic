import Anthropic from "@anthropic-ai/sdk";
import postsData from "@/data/instagram-posts.json";
import type { Post } from "@/lib/instagram-types";
import { computeTotals, breakdownByType, topHashtags, typeLabel } from "@/lib/instagram-analytics";

const posts = postsData as Post[];
const ACCOUNT = "actoreselectorales";

function buildContext(): string {
  const totals = computeTotals(posts);
  const byType = breakdownByType(posts);
  const tags = topHashtags(posts, 15);
  const dates = posts.map((p) => p.date).sort();

  const summary = [
    `Cuenta de Instagram: @${ACCOUNT}`,
    `Periodo: ${dates[0]} a ${dates[dates.length - 1]} · ${posts.length} publicaciones`,
    `Totales: alcance=${totals.reach}, likes=${totals.likes}, comentarios=${totals.comments}, guardados=${totals.saved}, compartidos=${totals.shares}, engagement=${totals.engagement}`,
    `Promedios por post: alcance=${totals.avgReach}, engagement rate=${totals.avgEngagementRate}%`,
    "",
    "Por tipo de contenido:",
    ...byType.map(
      (t) =>
        `- ${typeLabel(t.type)}: ${t.count} posts, alcance promedio ${t.avgReach}, likes promedio ${t.avgLikes}, ER ${t.avgEngagementRate}%`
    ),
    "",
    `Hashtags más usados: ${tags.map((h) => `${h.tag} (×${h.count})`).join(", ")}`,
  ].join("\n");

  const rows = posts.map((p) => ({
    date: p.date,
    type: p.type,
    reach: p.reach,
    likes: p.likes,
    comments: p.comments,
    saved: p.saved,
    shares: p.shares,
    engagement: p.engagement,
    er: p.engagementRate,
    caption: p.caption.replace(/\s+/g, " ").slice(0, 280),
    link: p.permalink,
  }));

  return `${summary}\n\nDATOS COMPLETOS DE LAS PUBLICACIONES (JSON):\n${JSON.stringify(rows)}`;
}

const DATA_CONTEXT = buildContext();

const SYSTEM_PROMPT = `Eres un analista de redes sociales experto, especializado en Instagram. Respondes en español, de forma clara, concreta y accionable.

Tienes acceso a los datos reales de la cuenta @${ACCOUNT} (extraídos vía Windsor.ai). Responde SIEMPRE basándote en estos datos: cita cifras concretas, identifica publicaciones específicas por su fecha y describe su contenido cuando sea relevante.

Reglas:
- Si te preguntan algo que los datos no contienen (p. ej. quiénes son las personas que dan like o comentan individualmente), explica que la API de Instagram/Meta no expone identidades individuales, solo métricas agregadas.
- Da respuestas breves y bien estructuradas (usa listas y negritas cuando ayude). No inventes datos.
- Cuando recomiendes acciones, fundaméntalas en los números que ves.

=== DATOS DE LA CUENTA ===
${DATA_CONTEXT}`;

export const runtime = "nodejs";

export async function POST(req: Request) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return Response.json(
      { error: "Falta ANTHROPIC_API_KEY en el servidor (.env.local)." },
      { status: 500 }
    );
  }

  let body: { messages?: { role: "user" | "assistant"; content: string }[] };
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Cuerpo inválido." }, { status: 400 });
  }

  const messages = (body.messages ?? []).filter(
    (m) => (m.role === "user" || m.role === "assistant") && typeof m.content === "string"
  );
  if (messages.length === 0) {
    return Response.json({ error: "No hay mensajes." }, { status: 400 });
  }

  const client = new Anthropic();

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      try {
        const llm = client.messages.stream({
          model: "claude-opus-4-8",
          max_tokens: 2048,
          thinking: { type: "adaptive" },
          system: [
            { type: "text", text: SYSTEM_PROMPT, cache_control: { type: "ephemeral" } },
          ],
          messages,
        });
        llm.on("text", (delta) => {
          controller.enqueue(encoder.encode(delta));
        });
        await llm.finalMessage();
        controller.close();
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Error desconocido";
        controller.enqueue(encoder.encode(`\n\n⚠️ Error al consultar al analista: ${msg}`));
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store" },
  });
}
