"use client";

/**
 * Pintado del índice de meses. Recibe los datos ya resueltos del Server
 * Component de al lado; es cliente solo por los handlers de ratón de las
 * tarjetas.
 */
import Link from "next/link";
import { Mail } from "lucide-react";
import type { MesResumen } from "@/lib/mailing-prueba/data";

export function MesesView({ meses }: { meses: MesResumen[] }) {
  if (!meses.length) {
    return (
      <div className="page-bg min-h-screen">
        <div className="page-pad text-white">
          <h1 className="page-title flex items-center gap-3 font-bold tracking-tight text-white">
            <Mail className="h-7 w-7 shrink-0" style={{ color: "var(--tab-accent)" }} />
            Desempeño de correos
          </h1>
          <p className="mt-3 text-[#aab3cf]">
            Todavía no hay campañas cargadas.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="page-bg min-h-screen">
      <div className="page-pad text-white">
        <header className="mb-8">
          <div className="mb-3 flex flex-wrap gap-2">
            <span
              className="flex items-center gap-1 rounded-full border px-2 py-1 text-[10px] font-bold"
              style={{ background: "var(--tab-accent-wash)", color: "var(--tab-accent-soft)", borderColor: "var(--tab-accent-ring)" }}
            >
              <span className="h-1.5 w-1.5 rounded-full animate-pulse" style={{ background: "var(--tab-accent)" }} />
              ESTRATEGIA MAILING
            </span>
          </div>
          <h1 className="page-title flex items-center gap-3 break-words font-bold tracking-tight text-white">
            <Mail className="h-7 w-7 shrink-0" style={{ color: "var(--tab-accent)" }} />
            Desempeño de correos
          </h1>
          <p className="mt-2 max-w-2xl text-[#aab3cf]">
            Elige un mes para ver sus campañas, y de ahí al detalle por destinatario. Las cifras vienen de los envíos
            reales medidos en SendGrid; las direcciones se muestran seudonimizadas.
          </p>
        </header>

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {meses.map((m) => (
            <Link
              key={m.id}
              href={`/interno/mailing/${m.id}`}
              className="panel rounded-2xl border border-[#1e2240] p-5 transition-all hover:-translate-y-0.5"
              style={{ borderColor: "#1e2240" }}
              onMouseEnter={(e) => (e.currentTarget.style.borderColor = "var(--tab-accent)")}
              onMouseLeave={(e) => (e.currentTarget.style.borderColor = "#1e2240")}
            >
              <h2 className="text-lg font-bold capitalize text-white">{m.label}</h2>
              <p className="mb-4 text-xs text-[#8892b0]">{m.campanas} campañas</p>
              <div className="grid grid-cols-3 gap-2 border-t border-[#1e2240] pt-3">
                <div>
                  <div className="text-base font-bold text-white tabular-nums">{m.entregados.toLocaleString("es-CO")}</div>
                  <div className="text-[9px] uppercase tracking-wider text-[#8892b0]">Entregados</div>
                </div>
                <div>
                  <div className="text-base font-bold text-white tabular-nums">{m.apertura}%</div>
                  <div className="text-[9px] uppercase tracking-wider text-[#8892b0]">Apertura</div>
                </div>
                <div>
                  <div className="text-base font-bold text-white tabular-nums">{m.ctr}%</div>
                  <div className="text-[9px] uppercase tracking-wider text-[#8892b0]">CTR</div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
