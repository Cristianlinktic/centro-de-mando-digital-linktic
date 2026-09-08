"use client";

import { useRef, useState, useEffect } from "react";
import { Markdown } from "./Markdown";

interface Msg {
  role: "user" | "assistant";
  content: string;
}

const SUGGESTIONS = [
  "¿Qué tipo de contenido funciona mejor y por qué?",
  "¿Qué publicación tuvo mejor engagement y qué tenía?",
  "¿Qué días debería publicar según los datos?",
  "Dame 3 recomendaciones para crecer el alcance",
];

const WomanIcon = ({ size }: { size: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <circle cx="12" cy="8" r="4" fill="white" />
    <path d="M4 21c0-4.418 3.582-8 8-8s8 3.582 8 8" stroke="white" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

export function Analyst() {
  const [open, setOpen] = useState(false);
  const [tooltip, setTooltip] = useState(true);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const tooltipTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, open]);

  // Cuando se cierra el chat, vuelve a mostrar el tooltip al minuto
  useEffect(() => {
    if (!open) {
      tooltipTimerRef.current = setTimeout(() => setTooltip(true), 60_000);
    } else {
      if (tooltipTimerRef.current) clearTimeout(tooltipTimerRef.current);
    }
    return () => {
      if (tooltipTimerRef.current) clearTimeout(tooltipTimerRef.current);
    };
  }, [open]);

  function handleOpen() {
    setTooltip(false);
    setOpen((o) => !o);
  }

  async function send(text: string) {
    const q = text.trim();
    if (!q || busy) return;
    setInput("");
    const next: Msg[] = [...messages, { role: "user", content: q }];
    setMessages([...next, { role: "assistant", content: "" }]);
    setBusy(true);

    try {
      const res = await fetch("/api/analyst", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: next }),
      });
      if (!res.ok || !res.body) {
        const e = await res.json().catch(() => ({ error: "Error de red" }));
        throw new Error(e.error ?? "Error");
      }
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let acc = "";
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        acc += decoder.decode(value, { stream: true });
        setMessages((m) => {
          const copy = [...m];
          copy[copy.length - 1] = { role: "assistant", content: acc };
          return copy;
        });
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Error";
      setMessages((m) => {
        const copy = [...m];
        copy[copy.length - 1] = { role: "assistant", content: `⚠️ ${msg}` };
        return copy;
      });
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      {/* Tooltip flotante antes de abrir */}
      {tooltip && !open && (
        <div
          className="fixed bottom-[4.8rem] right-5 z-40 animate-in fade-in slide-in-from-bottom-2 duration-500"
          style={{ animationDelay: "800ms", animationFillMode: "both" }}
        >
          <div
            className="relative rounded-2xl px-4 py-2.5 text-sm font-semibold text-[#131a30] shadow-xl whitespace-nowrap"
            style={{
              background: "#ffffff",
              border: "1px solid rgba(255,255,255,0.4)",
              boxShadow: "0 8px 28px rgba(168,85,247,0.45)",
            }}
          >
            <p>¿En qué puedo ayudarte hoy?</p>
            {/* flecha apuntando hacia abajo */}
            <span
              className="absolute -bottom-2 right-8 w-4 h-4 rotate-45"
              style={{ background: "#ffffff" }}
            />
            <button
              onClick={() => setTooltip(false)}
              className="absolute -top-1.5 -right-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-purple-600 text-white hover:bg-purple-700 transition text-[10px] font-bold shadow"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Botón principal */}
      <div className="fixed bottom-5 right-5 z-40">
        {!open && (
          <>
            <span
              className="martha-ring-1 absolute inset-0 rounded-full"
              style={{ background: "linear-gradient(135deg, #E1306C, #833ab4)" }}
            />
            <span
              className="martha-ring-2 absolute inset-0 rounded-full"
              style={{ background: "linear-gradient(135deg, #E1306C, #833ab4)" }}
            />
          </>
        )}
        <button
        onClick={handleOpen}
        className="relative flex items-center gap-2.5 rounded-full px-5 py-3 font-semibold text-white shadow-lg transition hover:opacity-90"
        style={{ background: "linear-gradient(135deg, #E1306C 0%, #833ab4 100%)", boxShadow: "0 8px 32px rgba(131,58,180,0.45)" }}
      >
        <WomanIcon size={18} />
        {open ? "Cerrar" : "Martha"}
        </button>
      </div>

      {open && (
        <div className="fixed bottom-20 right-5 z-40 flex h-[70vh] max-h-[640px] w-[min(440px,calc(100vw-2.5rem))] flex-col overflow-hidden rounded-2xl border border-[#2a2a4a] panel shadow-2xl">
          {/* Header */}
          <div
            className="border-b border-[#2a2a4a] px-4 py-3"
            style={{ background: "linear-gradient(135deg, rgba(225,48,108,0.08) 0%, rgba(131,58,180,0.08) 100%)" }}
          >
            <div className="flex items-center gap-2.5">
              <div
                className="flex h-9 w-9 items-center justify-center rounded-full shrink-0 border-2 border-[#2b62ff]/40"
                style={{ background: "linear-gradient(135deg, #E1306C 0%, #833ab4 100%)" }}
              >
                <WomanIcon size={20} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-white tracking-wide">Martha</h3>
                  <span className="flex items-center gap-1 text-[10px] text-emerald-400">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    activa
                  </span>
                </div>
                <p className="text-[10px] text-[#8892b0]">Analista de Instagram</p>
              </div>
              <span className="ml-auto text-[10px] text-[#8892b0] font-mono">Claude Opus 4.8</span>
            </div>
          </div>

          {/* Messages */}
          <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto p-4">
            {messages.length === 0 && (
              <div className="space-y-2">
                <p className="text-xs text-[#8892b0] uppercase tracking-widest font-bold mb-3">Sugerencias</p>
                {SUGGESTIONS.map((s) => (
                  <button
                    key={s}
                    onClick={() => send(s)}
                    className="block w-full rounded-xl border border-[#1e2240] bg-white/5 px-3 py-2.5 text-left text-sm text-[#e4e9f5] transition hover:bg-white/10 hover:border-[#2a2a4a]"
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}
            {messages.map((m, i) => (
              <div key={i} className={m.role === "user" ? "flex justify-end" : "flex justify-start"}>
                <div
                  className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${
                    m.role === "user" ? "whitespace-pre-wrap text-white" : "bg-white/5 text-[#ffffff]"
                  }`}
                  style={m.role === "user" ? { background: "#E1306C" } : undefined}
                >
                  {m.role === "user" ? (
                    m.content
                  ) : m.content ? (
                    <Markdown>{m.content}</Markdown>
                  ) : busy && i === messages.length - 1 ? (
                    <span className="flex items-center gap-1.5 text-[#aab3cf]">
                      <span className="flex gap-0.5">
                        <span className="h-1.5 w-1.5 rounded-full bg-[#8892b0] animate-bounce" style={{ animationDelay: "0ms" }} />
                        <span className="h-1.5 w-1.5 rounded-full bg-[#8892b0] animate-bounce" style={{ animationDelay: "150ms" }} />
                        <span className="h-1.5 w-1.5 rounded-full bg-[#8892b0] animate-bounce" style={{ animationDelay: "300ms" }} />
                      </span>
                      Analizando
                    </span>
                  ) : (
                    ""
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Input */}
          <form
            onSubmit={(e) => { e.preventDefault(); send(input); }}
            className="border-t border-[#2a2a4a] p-3"
          >
            <div className="flex items-end gap-2">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(input); }
                }}
                rows={1}
                placeholder="Escribe tu pregunta…"
                className="max-h-32 flex-1 resize-none rounded-xl border border-[#2a2a4a] well px-3 py-2 text-sm text-white outline-none placeholder:text-[#8892b0] focus:border-pink-500"
              />
              <button
                type="submit"
                disabled={busy || !input.trim()}
                className="rounded-xl px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-40"
                style={{ background: "linear-gradient(135deg, #E1306C 0%, #833ab4 100%)" }}
              >
                {busy ? "…" : "Enviar"}
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}
