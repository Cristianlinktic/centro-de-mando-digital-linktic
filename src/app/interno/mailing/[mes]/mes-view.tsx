"use client";

/**
 * Pintado del detalle de un mes. Recibe los datos ya resueltos del Server
 * Component de al lado; sigue siendo cliente por la tabla ordenable, el
 * buscador y las gráficas.
 */
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Mail, Search } from "lucide-react";
import { ResponsiveContainer, BarChart, Bar, Cell, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import { Input } from "@/components/ui/input";
import type { MesDetalle } from "@/lib/mailing-prueba/data";
import { TOOLTIP_STYLE, TOOLTIP_LABEL_STYLE, TOOLTIP_ITEM_STYLE, TOOLTIP_CURSOR } from "@/lib/chart-theme";
import { ChartGradients, gradientFill, glowShadow } from "@/lib/chart-defs";

const ACCENT = "#10b981";
const MIN_VOLUMEN = 100;

type SortCol = "fecha" | "asunto" | "entregados" | "apertura" | "clics_unicos" | "ctr" | "no_entregados";

export function MesView({ mes, data }: { mes: string; data: MesDetalle | null }) {
  const router = useRouter();

  const [q, setQ] = useState("");
  const [soloReales, setSoloReales] = useState(true);
  const [orden, setOrden] = useState<{ col: SortCol; asc: boolean }>({ col: "fecha", asc: true });

  if (!data) {
    return (
      <div className="page-bg flex min-h-screen flex-col items-center justify-center gap-3 text-center text-white">
        <p className="font-bold">No encontramos ese mes.</p>
        <Link href="/interno/mailing" className="text-sm" style={{ color: ACCENT }}>
          ← Volver a Desempeño de correos
        </Link>
      </div>
    );
  }

  const ordenar = (col: SortCol) => {
    setOrden((prev) => (prev.col === col ? { col, asc: !prev.asc } : { col, asc: true }));
  };

  const filas = data.campanas
    .filter((c) => (!soloReales || c.entregados >= MIN_VOLUMEN) && (!q || c.asunto.toLowerCase().includes(q.toLowerCase()) || c.fecha.includes(q)))
    .sort((a, b) => {
      const x = a[orden.col];
      const y = b[orden.col];
      const r = typeof x === "number" && typeof y === "number" ? x - y : String(x).localeCompare(String(y), "es");
      return orden.asc ? r : -r;
    });

  const barData = data.porDia.map((d) => ({ fecha: `${d.fecha.slice(8)}/${d.fecha.slice(5, 7)}`, apertura: d.apertura, entregados: d.entregados }));

  return (
    <div className="page-bg min-h-screen">
      <div className="page-pad text-white">
        <Link href="/interno/mailing" className="mb-3 inline-flex items-center gap-1.5 text-xs font-semibold text-[#8892b0] hover:text-white transition-colors">
          <ArrowLeft className="h-3.5 w-3.5" /> Todos los meses
        </Link>

        <header className="mb-6">
          <h1 className="page-title flex items-center gap-3 break-words font-bold tracking-tight text-white">
            <Mail className="h-7 w-7 shrink-0" style={{ color: ACCENT }} />
            <span className="capitalize">{data.label}</span>
          </h1>
          <p className="mt-2 text-[#aab3cf]">
            {data.campanas.length} campañas · {data.rango}
          </p>
        </header>

        <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          <Kpi label="Entregados" value={data.kpis.entregados.toLocaleString("es-CO")} sub={`de ${data.kpis.procesados.toLocaleString("es-CO")} procesados`} />
          <Kpi label="Apertura" value={`${data.kpis.apertura}%`} />
          <Kpi label="CTR" value={`${data.kpis.ctr}%`} />
          <Kpi label="CTOR" value={`${data.kpis.ctor}%`} sub="clics sobre aperturas" />
          <Kpi label="No entregados" value={`${data.kpis.noEntregadosPct}%`} sub={`${data.kpis.noEntregados.toLocaleString("es-CO")} correos`} />
        </div>

        <div className="panel mb-6 rounded-2xl border border-[#1e2240] p-5">
          <h2 className="mb-1 text-lg font-semibold text-white">Apertura por día</h2>
          <p className="mb-4 text-xs text-[#8892b0]">% sobre entregados</p>
          <div className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <ChartGradients colors={[ACCENT]} />
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1e2240" />
                <XAxis dataKey="fecha" axisLine={false} tickLine={false} tick={{ fill: "#aab3cf", fontSize: 11 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: "#aab3cf", fontSize: 11 }} unit="%" />
                <Tooltip
                  contentStyle={TOOLTIP_STYLE}
                  labelStyle={TOOLTIP_LABEL_STYLE}
                  itemStyle={TOOLTIP_ITEM_STYLE}
                  cursor={TOOLTIP_CURSOR}
                  formatter={(value) => [`${value}%`, "Apertura"]}
                />
                <Bar dataKey="apertura" radius={[8, 8, 0, 0]} isAnimationActive animationDuration={600}>
                  {barData.map((d) => (
                    <Cell key={d.fecha} fill={gradientFill(ACCENT)} stroke={ACCENT} strokeWidth={1} style={{ filter: glowShadow(ACCENT, 5) }} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="panel rounded-2xl border border-[#1e2240] p-5">
          <div className="mb-4 flex flex-wrap items-center gap-3">
            <div className="relative min-w-[220px] flex-1">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#8892b0]" />
              <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar por asunto o fecha…" className="h-9 pl-8" />
            </div>
            <label className="flex cursor-pointer items-center gap-2 text-xs font-semibold text-[#8892b0]">
              <input type="checkbox" checked={soloReales} onChange={(e) => setSoloReales(e.target.checked)} className="h-3.5 w-3.5 accent-[#10b981]" />
              Ocultar envíos de menos de {MIN_VOLUMEN} entregados
            </label>
            <span className="text-xs text-[#8892b0]">
              {filas.length} campaña{filas.length === 1 ? "" : "s"}
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-sm">
              <thead>
                <tr className="border-b border-[#1e2240] text-left text-[10px] uppercase tracking-wider text-[#8892b0]">
                  <Th col="fecha" orden={orden} onClick={ordenar} className="text-left">Fecha</Th>
                  <Th col="asunto" orden={orden} onClick={ordenar} className="text-left">Asunto</Th>
                  <Th col="entregados" orden={orden} onClick={ordenar}>Entregados</Th>
                  <Th col="apertura" orden={orden} onClick={ordenar}>Apertura</Th>
                  <Th col="clics_unicos" orden={orden} onClick={ordenar}>Clics</Th>
                  <Th col="ctr" orden={orden} onClick={ordenar}>CTR</Th>
                  <Th col="no_entregados" orden={orden} onClick={ordenar}>No entreg.</Th>
                </tr>
              </thead>
              <tbody>
                {filas.map((c) => (
                  <tr
                    key={c.id}
                    onClick={() => router.push(`/interno/mailing/${mes}/${c.id}`)}
                    className="cursor-pointer border-b border-[#1e2240] hover:bg-white/5"
                  >
                    <td className="px-3 py-2.5 text-[#aab3cf]">{c.fecha.slice(8)}/{c.fecha.slice(5, 7)}</td>
                    <td className="max-w-[360px] truncate px-3 py-2.5 font-medium text-white">{c.asunto}</td>
                    <td className="px-3 py-2.5 text-right tabular-nums text-[#aab3cf]">
                      {c.entregados.toLocaleString("es-CO")}
                      {c.entregados < MIN_VOLUMEN && <span className="ml-1.5 rounded-full bg-white/5 px-1.5 py-0.5 text-[9px] text-[#8892b0]">chico</span>}
                    </td>
                    <td className={`px-3 py-2.5 text-right tabular-nums font-semibold ${c.apertura >= 70 ? "text-emerald-400" : c.apertura < 50 ? "text-rose-400" : "text-[#aab3cf]"}`}>{c.apertura}%</td>
                    <td className="px-3 py-2.5 text-right tabular-nums text-[#aab3cf]">{c.clics_unicos.toLocaleString("es-CO")}</td>
                    <td className={`px-3 py-2.5 text-right tabular-nums font-semibold ${c.ctr >= 15 ? "text-emerald-400" : "text-[#aab3cf]"}`}>{c.ctr}%</td>
                    <td className="px-3 py-2.5 text-right tabular-nums text-[#aab3cf]">{c.no_entregados}</td>
                  </tr>
                ))}
                {filas.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-3 py-8 text-center text-[#6b7280]">Sin campañas para ese filtro.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

function Kpi({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="panel rounded-2xl border border-[#1e2240] p-4">
      <div className="text-[10px] uppercase tracking-wider text-[#8892b0]">{label}</div>
      <div className="mt-1 text-2xl font-bold tabular-nums text-white">{value}</div>
      {sub && <div className="mt-0.5 text-[10px] text-[#6b7280]">{sub}</div>}
    </div>
  );
}

function Th({
  col, orden, onClick, className = "text-right", children,
}: { col: SortCol; orden: { col: SortCol; asc: boolean }; onClick: (c: SortCol) => void; className?: string; children: React.ReactNode }) {
  const active = orden.col === col;
  return (
    <th
      onClick={() => onClick(col)}
      className={`cursor-pointer select-none whitespace-nowrap px-3 py-2.5 font-bold hover:text-white ${className}`}
      style={active ? { color: ACCENT } : undefined}
    >
      {children}
      {active && <span className="ml-1">{orden.asc ? "↑" : "↓"}</span>}
    </th>
  );
}
