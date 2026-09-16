"use client";

import { useEffect, useState } from "react";
import { Mail } from "lucide-react";
import { KpiGroup, EmptyChartPanel } from "@/components/placeholder-panel";
import { TabLoadingScreen } from "@/components/bird-loading/tab-loading-screen";
import { useMinLoadingDuration } from "@/hooks/use-min-loading-duration";

// Panel de Estrategia Mailing — estructura lista para conectar un proveedor
// de email marketing (Mailchimp, Brevo, SendGrid, HubSpot, ActiveCampaign…).
// Sin integración todavía: cada tarjeta/gráfica documenta qué métrica va ahí
// y cómo se calcula, en vez de mostrar cifras inventadas.

const EMAIL_EMPTY_MSG = "Sin datos aún";

const FUNNEL_STAGES = [
  { label: "Enviados", width: 100 },
  { label: "Entregados", width: 88 },
  { label: "Abiertos", width: 55 },
  { label: "Clics", width: 22 },
];

export default function ExternoMailingPage() {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    Promise.resolve().then(() => setReady(true));
  }, []);
  const showLoading = useMinLoadingDuration(!ready);

  if (showLoading) {
    return <TabLoadingScreen section="Estrategia Mailing" fullScreen={false} />;
  }

  return (
    <div className="page-bg min-h-screen">
      <div className="page-pad text-white">
        {/* Header */}
        <header className="mb-8">
          <div className="mb-3 flex flex-wrap gap-2">
            <span
              className="flex items-center gap-1 rounded-full border px-2 py-1 text-[10px] font-bold"
              style={{ background: "#2a2010", color: "#f5b21e", borderColor: "rgba(245,178,30,0.25)" }}
            >
              <span className="h-1.5 w-1.5 rounded-full animate-pulse" style={{ background: "#f5b21e" }} />
              ESTRATEGIA MAILING
            </span>
            <span className="bg-[#1e2240] text-[#75ddff] text-[10px] px-2 py-1 rounded-full border border-[#0094ff]/20 font-bold uppercase">
              LINKTIC
            </span>
          </div>
          <h1 className="page-title flex items-center gap-3 break-words font-bold tracking-tight text-white">
            <Mail className="h-7 w-7 shrink-0" style={{ color: "#f5b21e" }} />
            Estrategia Mailing
          </h1>
          <p className="mt-2 max-w-2xl text-[#aab3cf]">
            Panel de desempeño de campañas de email marketing.
          </p>
        </header>

        {/* KPIs */}
        <KpiGroup
          title="Entrega y alcance"
          items={[
            { label: "Base de correos activos", formula: "Tamaño de la lista de correos vigentes" },
            { label: "Correos enviados", formula: "Total de envíos en el periodo" },
            { label: "Tasa de entrega", formula: "Entregados ÷ Enviados" },
            { label: "Tasa de rebote", formula: "Rebotes duros + blandos ÷ Enviados" },
          ]}
        />
        <KpiGroup
          title="Interacción"
          items={[
            { label: "Tasa de apertura (OR)", formula: "Abiertos ÷ Entregados" },
            { label: "Tasa de clics (CTR)", formula: "Clics ÷ Entregados" },
            { label: "Click-to-Open (CTOR)", formula: "Clics ÷ Abiertos" },
            { label: "Tasa de lecturabilidad", formula: "Porcentaje de profundidad delectura del correo" },
          ]}
        />
        <KpiGroup
          title="Salud de la lista"
          items={[
            { label: "Crecimiento neto de lista", formula: "Porcentaje de crecimiento" },
            { label: "Última actualización de lista", formula: "Fecha de actualización" },
          ]}
        />

        {/* Evolución en el tiempo */}
        <section className="mb-8 rounded-2xl border border-[#1e2240] panel p-5">
          <h2 className="mb-1 text-lg font-semibold text-white">Evolución de envíos, aperturas y clics</h2>
          <p className="mb-4 text-xs text-[#8892b0]">
            Línea de tiempo por campaña o por semana: enviados, entregados, aperturas y clics superpuestos,
            para ver tendencia y detectar caídas de desempeño.
          </p>
          <EmptyChartPanel message={EMAIL_EMPTY_MSG} />
        </section>

        {/* Embudo de conversión */}
        <section className="mb-8 rounded-2xl border border-[#1e2240] panel p-5">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-lg font-semibold text-white">Embudo de conversión</h2>
          </div>
          <div className="space-y-3">
            {FUNNEL_STAGES.map((s) => (
              <div key={s.label}>
                <div className="mb-1 flex items-center justify-between text-sm">
                  <span className="font-medium text-white">{s.label}</span>
                  <span className="text-[#6b7280]">—</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-white/5">
                  <div className="h-full rounded-full bg-white/10" style={{ width: `${s.width}%` }} />
                </div>
              </div>
            ))}
          </div>
          <p className="mt-3 text-xs text-[#8892b0]">
            Enviados → Entregados → Abiertos → Clics.
          </p>
        </section>

        {/* Comparativa por campaña + mejores asuntos */}
        <section className="mb-8 grid gap-4 lg:grid-cols-2">
          <div className="rounded-2xl border border-[#1e2240] panel p-5">
            <h2 className="mb-1 text-lg font-semibold text-white">Comparativa por campaña</h2>
            <p className="mb-4 text-xs text-[#8892b0]">
              Ranking de campañas por tasa de apertura y CTR, para saber qué envíos funcionan mejor.
            </p>
            <p className="text-sm text-[#8892b0]">Aún no hay campañas registradas.</p>
          </div>
          <div className="rounded-2xl border border-[#1e2240] panel p-5">
            <h2 className="mb-1 text-lg font-semibold text-white">Mejores asuntos (subject lines)</h2>
            <p className="mb-4 text-xs text-[#8892b0]">
              Asuntos con mayor tasa de apertura, para reutilizar patrones que funcionan.
            </p>
            <p className="text-sm text-[#8892b0]">Aún no hay asuntos con datos.</p>
          </div>
        </section>

        {/* Dispositivos/clientes + crecimiento de lista */}
        <section className="mb-8 grid gap-4 lg:grid-cols-2">
          <div className="rounded-2xl border border-[#1e2240] panel p-5">
            <h2 className="mb-1 text-lg font-semibold text-white">Dispositivos y diseño de correo</h2>
            <p className="mb-4 text-xs text-[#8892b0]">
              Distribución de aperturas por móvil vs escritorio —
              define si el diseño del correo necesita ajustes.
            </p>
            <EmptyChartPanel height="h-40" message={EMAIL_EMPTY_MSG} />
          </div>
          <div className="rounded-2xl border border-[#1e2240] panel p-5">
            <h2 className="mb-1 text-lg font-semibold text-white">Crecimiento de la lista</h2>
            <p className="mb-4 text-xs text-[#8892b0]">
              Altas vs. bajas de suscriptores por mes. El mejor día/hora de envío según apertura histórica.
            </p>
            <EmptyChartPanel height="h-40" message={EMAIL_EMPTY_MSG} />
          </div>
        </section>

        {/* Segmentación */}
        <section className="mb-8 overflow-hidden rounded-2xl border border-[#1e2240]">
          <div className="panel px-5 py-4">
            <h2 className="text-lg font-semibold text-white">Segmentación de audiencia</h2>
            <p className="mt-1 text-xs text-[#8892b0]">
              Desempeño por lista/segmento (por ejemplo: area, proyecto, cargo),
              para enfocar contenido y frecuencia de envío por grupo.
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead className="panel text-xs uppercase tracking-wide text-[#aab3cf]">
                <tr>
                  <th className="px-4 py-3">Segmento</th>
                  <th className="px-4 py-3 text-right">Suscriptores</th>
                  <th className="px-4 py-3 text-right">Tasa de apertura</th>
                  <th className="px-4 py-3 text-right">CTR</th>
                  <th className="px-4 py-3 text-right">Tasa de lecturabilidad</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-t border-[#1e2240]">
                  <td colSpan={5} className="px-4 py-6 text-center text-[#6b7280]">
                    Sin segmentos configurados aún.
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
}
