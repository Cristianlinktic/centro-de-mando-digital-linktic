"use client";

export interface TickerItem {
  code?: string;            // código corto (ISO, plataforma, #)
  label: string;           // nombre / texto principal
  value?: string | number; // métrica destacada
  pct?: number;            // % de cambio (muestra flecha verde/roja)
  color?: string;          // color del value (default dorado)
}

/**
 * Cinta tipo "noticias en vivo" con marquee infinito. Se pausa al pasar el
 * cursor. Reutiliza las clases .marquee / .live-dot de globals.css.
 */
export function LiveTicker({
  items,
  liveLabel = "En vivo",
}: {
  items: TickerItem[];
  liveLabel?: string;
}) {
  if (!items || items.length === 0) return null;
  const doubled = [...items, ...items];

  return (
    <div className="relative flex items-center rounded-full border border-[#2a2a4a] panel overflow-hidden backdrop-blur-sm">
      <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-red-600/25 to-transparent shrink-0 z-10">
        <span className="live-dot" />
        <span className="text-[11px] font-bold uppercase tracking-wider text-red-300">{liveLabel}</span>
      </div>
      <div className="marquee flex-1 py-2">
        <div className="marquee-track">
          {doubled.map((it, i) => (
            <span key={i} className="inline-flex items-center gap-2 px-5 text-sm border-r border-[#1e2240]">
              {it.code && <span className="font-mono text-[11px] text-[#8892b0]">{it.code}</span>}
              <span className="text-[#e4e9f5]">{it.label}</span>
              {it.value !== undefined && it.value !== "" && (
                <span className="font-semibold tabular-nums" style={{ color: it.color || "#f3b116" }}>
                  {typeof it.value === "number" ? it.value.toLocaleString() : it.value}
                </span>
              )}
              {it.pct !== undefined && (
                <span className={`text-xs font-semibold ${it.pct >= 0 ? "text-green-400" : "text-red-400"}`}>
                  {it.pct >= 0 ? "▲" : "▼"} {Math.abs(it.pct)}%
                </span>
              )}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
