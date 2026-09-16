"use client";

import { useEffect, useState } from "react";
import { Hash, Radio } from "lucide-react";
import { KpiGroup, EmptyChartPanel } from "@/components/placeholder-panel";
import { TabLoadingScreen } from "@/components/bird-loading/tab-loading-screen";
import { useMinLoadingDuration } from "@/hooks/use-min-loading-duration";

// Panel de Conversación en Canales — Space (grupo interno donde nosotros
// enviamos mensajes) y RIPOR (banner que nos envía mensajes/alertas a
// nosotros). Sin integración todavía: cada tarjeta documenta qué métrica va
// ahí y cómo se calcula, en vez de mostrar cifras inventadas.

type ChannelKey = "space" | "ripor";

const CHANNELS: Record<
  ChannelKey,
  {
    label: string;
    icon: typeof Hash;
    accent: string;
    accentBg: string;
    accentBorder: string;
    direction: string;
    emptyMsg: string;
  }
> = {
  space: {
    label: "Space",
    icon: Hash,
    accent: "#2eb88a",
    accentBg: "#10241d",
    accentBorder: "rgba(46,184,138,0.25)",
    direction: "Mensajes que enviamos hacia el grupo de Space #TeamLinkTIC.",
    emptyMsg: "Sin datos aún",
  },
  ripor: {
    label: "RIPOR",
    icon: Radio,
    accent: "#f97316",
    accentBg: "#2a1a0d",
    accentBorder: "rgba(249,115,22,0.25)",
    direction: "Banners en RIPOR.",
    emptyMsg: "Sin datos aún",
  },
};

const ORDER: ChannelKey[] = ["space", "ripor"];

export default function InternoCanalesPage() {
  const [tab, setTab] = useState<ChannelKey>("space");
  const [ready, setReady] = useState(false);
  useEffect(() => setReady(true), []);
  const showLoading = useMinLoadingDuration(!ready);
  const cfg = CHANNELS[tab];
  const Icon = cfg.icon;

  if (showLoading) {
    return <TabLoadingScreen section="Conversación en Canales" fullScreen={false} />;
  }

  return (
    <div className="page-bg min-h-screen">
      <nav className="flex gap-1 border-b border-[#1e2240] page-pad pb-0 pt-4 w-fit max-w-full overflow-x-auto">
        {ORDER.map((k) => {
          const c = CHANNELS[k];
          const CIcon = c.icon;
          const active = tab === k;
          return (
            <button
              key={k}
              onClick={() => setTab(k)}
              className={`flex cursor-pointer items-center gap-2 px-3 py-2 text-xs font-bold uppercase tracking-wider rounded-t-lg transition-colors border-b-2 ${active ? "bg-white/5" : "border-transparent text-[#8892b0] hover:text-[#c0c8de] hover:bg-white/5"
                }`}
              style={active ? { color: c.accent, borderColor: c.accent } : undefined}
            >
              <CIcon className="h-3.5 w-3.5" />
              {c.label}
            </button>
          );
        })}
      </nav>

      <div className="page-pad text-white">
        {/* Header */}
        <header className="mb-8">
          <div className="mb-3 flex flex-wrap gap-2">
            <span
              className="flex items-center gap-1 rounded-full border px-2 py-1 text-[10px] font-bold"
              style={{ background: cfg.accentBg, color: cfg.accent, borderColor: cfg.accentBorder }}
            >
              <span className="h-1.5 w-1.5 rounded-full animate-pulse" style={{ background: cfg.accent }} />
              {cfg.label.toUpperCase()}
            </span>
            <span className="bg-[#1e2240] text-[#75ddff] text-[10px] px-2 py-1 rounded-full border border-[#0094ff]/20 font-bold uppercase">
              LINKTIC
            </span>
          </div>
          <h1 className="page-title flex items-center gap-3 break-words font-bold tracking-tight text-white">
            <Icon className="h-7 w-7 shrink-0" style={{ color: cfg.accent }} />
            Conversación en Canales · {cfg.label}
          </h1>
          <p className="mt-2 max-w-2xl text-[#aab3cf]">{cfg.direction}</p>
        </header>

        {tab === "space" ? (
          <>
            <KpiGroup
              title="Volumen"
              items={[
                { label: "Mensajes enviados", formula: "Total de mensajes publicados en el space en el periodo" },
                { label: "Promedio diario", formula: "Mensajes enviados ÷ días del periodo" },
                { label: "Miembros activos", formula: "Miembros totales del space" },
                { label: "Mensajes con adjuntos", formula: "Mensajes que incluyen archivo, imagen o enlace" },
              ]}
            />
            <KpiGroup
              title="Respuesta y participación"
              items={[
                { label: "Vistas del mensaje", formula: "Cantidad de usuarios que leyeron el mensaje" },
                { label: "Cantidad de reacciones", formula: "Número total de reacciones por mensaje" },
                { label: "Hilos activos", formula: "Hilos con actividad en las últimas 48h" },
                { label: "Día y hora de mayor actividad", formula: "Día y hora de la semana con más mensajes enviados" },
              ]}
            />
            <section className="mb-8 rounded-2xl border border-[#1e2240] panel p-5">
              <h2 className="mb-1 text-lg font-semibold text-white">Mensajes enviados en el tiempo</h2>
              <p className="mb-4 text-xs text-[#8892b0]">
                Serie diaria o semanal de mensajes publicados en el space, para ver tendencia de uso del canal.
              </p>
              <EmptyChartPanel message={cfg.emptyMsg} />
            </section>
          </>
        ) : (
          <>
            <KpiGroup
              title="Volumen"
              items={[
                { label: "Banners publicados", formula: "Total de banners publicados en el periodo" },
                { label: "Promedio mensual", formula: "Promedio de banners publicados en el periodo" },
                { label: "Total de campañas", formula: "Total de campañas publicadas" },
                { label: "Tasa de clics (CTR)", formula: "Clics ÷ Entregados" },
              ]}
            />
            <section className="mb-8 rounded-2xl border border-[#1e2240] panel p-5">
              <h2 className="mb-1 text-lg font-semibold text-white">Análisis de banners en el tiempo</h2>
              <EmptyChartPanel message={cfg.emptyMsg} />
            </section>
            <section className="mb-8 rounded-2xl border border-[#1e2240] panel p-5">
              <h2 className="mb-1 text-lg font-semibold text-white">Detallado de campañas por gestión</h2>
              <EmptyChartPanel message={cfg.emptyMsg} />
            </section>
          </>
        )}

      </div>
    </div>
  );
}
