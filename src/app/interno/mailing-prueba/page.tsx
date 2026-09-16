"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Mail, FlaskConical } from "lucide-react";
import { TabLoadingScreen } from "@/components/bird-loading/tab-loading-screen";
import { useMinLoadingDuration } from "@/hooks/use-min-loading-duration";
import { listMeses } from "@/lib/mailing-prueba/data";

export default function MailingPruebaIndexPage() {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    Promise.resolve().then(() => setReady(true));
  }, []);
  const showLoading = useMinLoadingDuration(!ready);

  if (showLoading) {
    return <TabLoadingScreen section="Estrategia Mailing · Prueba" fullScreen={false} />;
  }

  const meses = listMeses();

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
              ESTRATEGIA MAILING · PRUEBA
            </span>
            <span className="flex items-center gap-1 bg-[#1e2240] text-[#f5b21e] text-[10px] px-2 py-1 rounded-full border border-[#f5b21e]/25 font-bold uppercase">
              <FlaskConical className="h-3 w-3" /> Datos de ejemplo
            </span>
          </div>
          <h1 className="page-title flex items-center gap-3 break-words font-bold tracking-tight text-white">
            <Mail className="h-7 w-7 shrink-0" style={{ color: "var(--tab-accent)" }} />
            Desempeño de correos
          </h1>
          <p className="mt-2 max-w-2xl text-[#aab3cf]">
            Elige un mes para ver sus campañas. Flujo de prueba con datos simulados — la misma navegación (mes → campaña →
            destinatarios) que tendrá el módulo cuando se conecte al proveedor real de email marketing.
          </p>
        </header>

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {meses.map((m) => (
            <Link
              key={m.id}
              href={`/interno/mailing-prueba/${m.id}`}
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
