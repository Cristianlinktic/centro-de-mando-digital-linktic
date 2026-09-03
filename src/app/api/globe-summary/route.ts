import Anthropic from "@anthropic-ai/sdk";
import { NO_TESTIGOS_DIGITALES_RULE, sanitizeAiText } from "@/lib/ai-sanitize";

export const runtime = "nodejs";

// Genera un análisis (o una micro-narración) de la conversación sobre el
// Centro de Mando Digital LinkTIC en un país concreto, a partir de las
// métricas que ya tiene el globo.
// mode: "summary"   -> párrafo de análisis para el panel de detalle.
// mode: "narration" -> una sola frase para el modo narrador del tour.

type Country = {
  pais?: string;
  tema?: string;
  volumen?: number;
  sentimiento?: string;
  sentimientoPct?: { positivo?: number; neutral?: number; negativo?: number };
  plataformas?: Record<string, number>;
  topHashtags?: string[];
  keywords?: string[];
  pctCambio?: number;
};

function buildContext(c: Country): string {
  const plats = c.plataformas
    ? Object.entries(c.plataformas)
        .filter(([, v]) => (v || 0) > 0)
        .sort((a, b) => (b[1] || 0) - (a[1] || 0))
        .map(([k, v]) => `${k}: ${Number(v).toLocaleString()}`)
        .join(", ")
    : "sin datos";
  const sp = c.sentimientoPct || {};
  return [
    `País: ${c.pais ?? "—"}`,
    `Tema principal de conversación: ${c.tema ?? "—"}`,
    `Volumen total de menciones: ${Number(c.volumen ?? 0).toLocaleString()}`,
    `Crecimiento vs. periodo anterior: ${c.pctCambio ?? 0}%`,
    `Sentimiento dominante: ${c.sentimiento ?? "—"}`,
    `Distribución de sentimiento: positivo ${sp.positivo ?? 0}%, neutral ${sp.neutral ?? 0}%, negativo ${sp.negativo ?? 0}%`,
    `Menciones por plataforma: ${plats}`,
    `Hashtags destacados: ${(c.topHashtags || []).join(" ") || "—"}`,
    `Palabras clave: ${(c.keywords || []).join(", ") || "—"}`,
  ].join("\n");
}

export async function POST(req: Request) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return Response.json(
      { error: "Falta ANTHROPIC_API_KEY en el servidor (.env.local)." },
      { status: 500 }
    );
  }

  let body: { country?: Country; mode?: "summary" | "narration" };
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Cuerpo inválido." }, { status: 400 });
  }

  const country = body.country;
  if (!country || !country.pais) {
    return Response.json({ error: "Falta el país." }, { status: 400 });
  }
  const mode = body.mode === "narration" ? "narration" : "summary";

  const instruction =
    mode === "narration"
      ? "Redacta UNA sola frase (máximo 22 palabras), en presente, lista para mostrarse como subtítulo en una presentación. Describe qué está pasando con la conversación sobre el Centro de Mando Digital LinkTIC en este país. Sin comillas, sin emojis, sin hashtags."
      : "Redacta un análisis breve (3 a 5 frases) en español, claro y accionable, sobre la conversación digital acerca del Centro de Mando Digital LinkTIC en este país. Interpreta el sentimiento, el volumen, la tendencia y los temas. No inventes datos que no estén en el contexto. No uses encabezados ni listas.";

  const system =
    "Eres un analista de escucha social del Centro de Mando Digital LinkTIC. Analizas la conversación internacional sobre LinkTIC. Respondes SIEMPRE en español, con tono institucional y sobrio, basándote únicamente en los datos entregados. " +
    NO_TESTIGOS_DIGITALES_RULE;

  try {
    const client = new Anthropic();
    const msg = await client.messages.create({
      model: "claude-opus-4-8",
      max_tokens: mode === "narration" ? 120 : 512,
      system,
      messages: [
        {
          role: "user",
          content: `${instruction}\n\n=== DATOS DEL PAÍS ===\n${buildContext(country)}`,
        },
      ],
    });

    const text = msg.content
      .filter((b): b is Anthropic.TextBlock => b.type === "text")
      .map((b) => b.text)
      .join("")
      .trim();

    return Response.json({ text: sanitizeAiText(text) });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Error desconocido";
    return Response.json({ error: message }, { status: 500 });
  }
}
