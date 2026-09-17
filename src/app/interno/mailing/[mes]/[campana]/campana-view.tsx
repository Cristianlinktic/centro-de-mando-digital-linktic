"use client";

/**
 * Pintado del detalle de campaña. Recibe los datos ya resueltos del Server
 * Component de al lado; sigue siendo cliente por la dona interactiva, los
 * filtros, la paginación y la descarga de CSV.
 */
import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Download, ImageOff, Search } from "lucide-react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import { Input } from "@/components/ui/input";
import type { BucketDestinatario, CampanaDetalle, EventoEstado } from "@/lib/mailing/data";

const ACCENT = "#10b981";
const POR_PAG = 10;
const ETIQUETAS: EventoEstado[] = ["Clic", "Abierto", "Entregado", "Rebotado", "Descartado", "Diferido", "Procesado"];

const DONUT_COLORS: Record<BucketDestinatario, string> = {
  clic: "#10b981",
  abierto: "#34d399",
  entregado: "#6ee7b7",
  no_entregado: "#df3a3a",
};
const DONUT_LABELS: Record<BucketDestinatario, string> = {
  clic: "Con clic",
  abierto: "Abierto sin clic",
  entregado: "Entregado sin abrir",
  no_entregado: "No entregado",
};

export function CampanaView({ mes, c }: { mes: string; c: CampanaDetalle | null }) {
  const [filtroBucket, setFiltroBucket] = useState<BucketDestinatario | null>(null);
  const [filtroEvento, setFiltroEvento] = useState<EventoEstado | "">("");
  const [pagEv, setPagEv] = useState(0);
  const [pagPe, setPagPe] = useState(0);
  const [buscarPe, setBuscarPe] = useState("");
  // La miniatura cuelga del tablero estático. Si ese proyecto se renombra o se
  // retira, la URL guardada deja de responder: con esto la pantalla vuelve al
  // aviso en vez de mostrar el icono de imagen rota.
  const [miniaturaFallo, setMiniaturaFallo] = useState(false);

  if (!c) {
    return (
      <div className="page-bg flex min-h-screen flex-col items-center justify-center gap-3 text-center text-white">
        <p className="font-bold">No encontramos esa campaña.</p>
        <Link href={`/interno/mailing/${mes}`} className="text-sm" style={{ color: ACCENT }}>
          ← Volver al mes
        </Link>
      </div>
    );
  }

  // El reparto viene guardado en la campaña, no se cuenta sobre los
  // destinatarios: un envío masivo no trae detalle del que contar, y la resta
  // "aperturas - clics" da mal porque hay gente que hace clic sin que se
  // registre su apertura (imágenes bloqueadas, enlace pulsado).
  const donutValues: Record<BucketDestinatario, number> = c.buckets;
  const total = donutValues.clic + donutValues.abierto + donutValues.entregado + donutValues.no_entregado;
  const donutData = (Object.keys(donutValues) as BucketDestinatario[])
    .filter((k) => donutValues[k] > 0)
    .map((k) => ({ key: k, name: DONUT_LABELS[k], value: donutValues[k], color: DONUT_COLORS[k] }));

  const clickBucket = (k: BucketDestinatario) => {
    setFiltroBucket((prev) => (prev === k ? null : k));
    setFiltroEvento("");
    setPagEv(0);
  };

  const eventosFiltrados = c.eventos.filter((e) => (!filtroBucket || e.bucket === filtroBucket) && (!filtroEvento || e.evento === filtroEvento));
  const destinatariosFiltrados = c.destinatarios.filter((d) => !buscarPe || d.correo.includes(buscarPe.trim().toLowerCase()));
  const evPage = eventosFiltrados.slice(pagEv * POR_PAG, pagEv * POR_PAG + POR_PAG);
  const pePage = destinatariosFiltrados.slice(pagPe * POR_PAG, pagPe * POR_PAG + POR_PAG);

  const conteoPorEvento = ETIQUETAS.reduce<Record<string, number>>((acc, et) => {
    acc[et] = c.eventos.filter((e) => e.evento === et).length;
    return acc;
  }, {});

  const descargar = (cual: "ev" | "pe") => {
    const SALTO = "\r\n";
    const escapa = (v: unknown) => `"${String(v).replace(/"/g, '""')}"`;
    let csv: string;
    if (cual === "ev") {
      const filas = eventosFiltrados.map((e) => [e.fecha, e.correo, e.evento]);
      csv = [["Fecha", "Correo", "Evento"], ...filas].map((f) => f.map(escapa).join(",")).join(SALTO);
    } else {
      const filas = destinatariosFiltrados.map((d) => [d.correo, d.procesado, d.entregado, d.abrio, d.clic, d.diferido, d.reboto, d.descartado].map((v) => (typeof v === "boolean" ? (v ? "Si" : "No") : v)));
      csv = [["Correo", "Procesado", "Entregado", "Abrio", "Clic", "Diferido", "Reboto", "Descartado"], ...filas].map((f) => f.map(escapa).join(",")).join(SALTO);
    }
    const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `${c.id}-${cual === "ev" ? "eventos" : "destinatarios"}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  return (
    <div className="page-bg min-h-screen">
      <div className="page-pad text-white">
        <Link href={`/interno/mailing/${mes}`} className="mb-3 inline-flex items-center gap-1.5 text-xs font-semibold text-[#8892b0] hover:text-white transition-colors">
          <ArrowLeft className="h-3.5 w-3.5" /> Volver al mes
        </Link>

        <header className="mb-6">
          <h1 className="page-title break-words font-bold tracking-tight" style={{ color: ACCENT }}>{c.asunto}</h1>
          <p className="mt-1 text-sm text-[#8892b0]">
            {c.envio} · {c.remitente} · plantilla {c.template}
          </p>
        </header>

        <div className="mb-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
          <div className="flex flex-col gap-3">
            <Caja label="Base de correos" value={c.base.toLocaleString("es-CO")} marco />
            <div className="panel rounded-2xl border border-[#1e2240] p-4 text-center">
              <div className="mb-2 text-[10px] uppercase tracking-wider text-[#8892b0]">Reportes únicos de correos</div>
              <div className="relative mx-auto h-44 max-w-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={donutData}
                      dataKey="value"
                      nameKey="name"
                      innerRadius={46}
                      outerRadius={78}
                      paddingAngle={2}
                      onClick={(_, index) => clickBucket(donutData[index].key)}
                    >
                      {donutData.map((d) => (
                        <Cell key={d.key} fill={d.color} stroke="none" style={{ cursor: "pointer", opacity: filtroBucket && filtroBucket !== d.key ? 0.3 : 1 }} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{ backgroundColor: "#0d1120", border: "1px solid #1e2240", borderRadius: 12 }}
                      formatter={(value, name) => [`${value} (${total ? Math.round((Number(value) / total) * 1000) / 10 : 0}%)`, name]}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-2xl font-bold text-white">{total}</span>
                  <span className="text-[9px] uppercase tracking-wider text-[#8892b0]">correos</span>
                </div>
              </div>
              <div className="mt-3 flex flex-col gap-1.5 text-left">
                {donutData.map((d) => (
                  <button
                    key={d.key}
                    onClick={() => clickBucket(d.key)}
                    className={`flex items-center justify-between gap-2 rounded-lg px-2 py-1 text-xs transition-colors ${filtroBucket === d.key ? "bg-white/10" : "hover:bg-white/5"}`}
                  >
                    <span className="flex items-center gap-1.5 text-[#aab3cf]">
                      <span className="h-2 w-2 rounded-full" style={{ background: d.color }} />
                      {d.name}
                    </span>
                    <span className="font-semibold text-white">{d.value} ({total ? Math.round((d.value / total) * 1000) / 10 : 0}%)</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <Caja label="Fecha y hora" value={c.envio} />
            <Caja label="Entregados" value={c.entregados.toLocaleString("es-CO")} />
            <Caja label="Abiertos" value={c.aperturas_unicas.toLocaleString("es-CO")} />
            <Caja label="Clics" value={c.clics_unicos.toLocaleString("es-CO")} />
          </div>

          <div className="flex flex-col gap-3">
            <Caja label="No entregados" value={c.no_entregados.toLocaleString("es-CO")} />
            {c.miniaturaUrl && !miniaturaFallo ? (
              // Las capturas son de 640px de ancho por 475 a 2.433 de alto: en
              // esta columna estrecha una larga se volveria una tira ilegible.
              // Se recorta a alto fijo anclado arriba, que es donde esta la
              // cabecera del correo —la parte que lo identifica— y se enlaza la
              // imagen completa.
              <a
                href={c.miniaturaUrl}
                target="_blank"
                rel="noreferrer"
                title="Abrir la captura completa"
                className="panel relative block min-h-[200px] flex-1 overflow-hidden rounded-2xl border border-[#1e2240] transition-colors hover:border-[#10b981]/60"
              >
                <img
                  src={c.miniaturaUrl}
                  alt={`Vista previa del correo "${c.asunto}"`}
                  onError={() => setMiniaturaFallo(true)}
                  className="absolute inset-0 h-full w-full object-cover object-top"
                />
                <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-[#0d1120] to-transparent px-3 pb-2 pt-6 text-[10px] font-semibold uppercase tracking-wider text-[#aab3cf]">
                  Ver completo
                </span>
              </a>
            ) : (
              <div className="panel flex flex-1 flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-[#2a2a4a] p-6 text-center">
                <ImageOff className="h-6 w-6 text-[#4a5578]" />
                <p className="text-xs text-[#6b7280]">
                  {c.miniaturaUrl
                    ? "No se pudo cargar la vista previa del correo."
                    : "Esta campaña no tiene captura guardada."}
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="panel mb-6 rounded-2xl border border-[#1e2240] p-5">
          <h2 className="mb-1 text-lg font-semibold text-white">Recorrido del envío</h2>
          <p className="mb-4 text-xs text-[#8892b0]">sobre {c.base.toLocaleString("es-CO")} correos</p>
          <div className="space-y-3">
            <Etapa label="Procesados" value={c.procesados} base={c.base} color="#6ee7b7" />
            <Etapa label="Entregados" value={c.entregados} base={c.base} color={ACCENT} />
            <Etapa label="Abiertos" value={c.aperturas_unicas} base={c.base} color="#34d399" />
            <Etapa label="Con clic" value={c.clics_unicos} base={c.base} color="#10b981" />
          </div>
          <p className="mt-3 border-t border-[#1e2240] pt-3 text-xs text-[#8892b0]">
            {c.no_entregados} no entregados · {c.diferidos} diferidos en el camino
          </p>
        </div>

        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Caja label="Tasa de correos abiertos" value={`${c.apertura}%`} big />
          <Caja label="Tasa de clics en correos" value={`${c.ctr}%`} big />
        </div>

        {!c.detalleGuardado ? (
          <div className="panel rounded-2xl border border-dashed border-[#2a2a4a] p-8 text-center">
            <p className="text-sm font-semibold text-white">Sin detalle por destinatario</p>
            <p className="mx-auto mt-2 max-w-xl text-xs text-[#8892b0]">
              De los envíos masivos se conserva solo el agregado, que es lo que ves arriba y es
              exacto. El registro individual de {c.base.toLocaleString("es-CO")} correos no se guarda
              para no llenar la base con datos que casi nunca se consultan.
            </p>
          </div>
        ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <div className="panel rounded-2xl border border-[#1e2240] p-5">
            <div className="mb-3 flex items-center justify-between gap-2">
              <h2 className="text-base font-semibold text-white">Eventos <span className="font-normal text-[#8892b0]">· un registro por correo</span></h2>
              <button onClick={() => descargar("ev")} className="flex items-center gap-1 rounded-full border border-[#2a2a4a] px-2.5 py-1 text-[10px] font-semibold text-[#8892b0] hover:text-white transition-colors">
                <Download className="h-3 w-3" /> CSV
              </button>
            </div>
            <select
              value={filtroEvento}
              onChange={(e) => {
                setFiltroEvento(e.target.value as EventoEstado | "");
                setFiltroBucket(null);
                setPagEv(0);
              }}
              className="mb-3 w-full rounded-lg border border-[#2a2a4a] bg-white/5 px-2.5 py-1.5 text-xs text-white [color-scheme:dark] focus:border-[color:var(--tab-accent)] focus:outline-none"
            >
              <option value="">Todos los eventos</option>
              {ETIQUETAS.map((et) => (
                <option key={et} value={et} disabled={!conteoPorEvento[et]}>
                  {et} ({conteoPorEvento[et]})
                </option>
              ))}
            </select>
            <div className="max-h-[360px] overflow-y-auto rounded-lg border border-[#1e2240]">
              <table className="w-full text-xs">
                <thead className="sticky top-0 bg-[#0d1120]">
                  <tr className="border-b border-[#1e2240] text-left text-[9px] uppercase tracking-wider text-[#8892b0]">
                    <th className="px-2.5 py-2">Fecha</th>
                    <th className="px-2.5 py-2">Correo</th>
                    <th className="px-2.5 py-2">Evento</th>
                  </tr>
                </thead>
                <tbody>
                  {evPage.map((e, i) => (
                    <tr key={`${e.correo}-${e.fecha}-${i}`} className="border-b border-[#1e2240]/60">
                      <td className="whitespace-nowrap px-2.5 py-1.5 text-[#8892b0]">{e.fecha}</td>
                      <td className="whitespace-nowrap px-2.5 py-1.5 text-[#aab3cf]">{e.correo}</td>
                      <td className="whitespace-nowrap px-2.5 py-1.5 text-white">{e.evento}</td>
                    </tr>
                  ))}
                  {evPage.length === 0 && (
                    <tr><td colSpan={3} className="px-2.5 py-6 text-center text-[#6b7280]">Sin registros</td></tr>
                  )}
                </tbody>
              </table>
            </div>
            <Paginador pagina={pagEv} total={eventosFiltrados.length} porPagina={POR_PAG} onChange={setPagEv} />
          </div>

          <div className="panel rounded-2xl border border-[#1e2240] p-5">
            <div className="mb-3 flex items-center justify-between gap-2">
              <h2 className="text-base font-semibold text-white">Detalle por destinatario</h2>
              <button onClick={() => descargar("pe")} className="flex items-center gap-1 rounded-full border border-[#2a2a4a] px-2.5 py-1 text-[10px] font-semibold text-[#8892b0] hover:text-white transition-colors">
                <Download className="h-3 w-3" /> CSV
              </button>
            </div>
            <div className="relative mb-3">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#8892b0]" />
              <Input
                value={buscarPe}
                onChange={(e) => { setBuscarPe(e.target.value); setPagPe(0); }}
                placeholder="Buscar por correo…"
                className="h-8 pl-8 text-xs"
              />
            </div>
            <div className="max-h-[300px] overflow-y-auto rounded-lg border border-[#1e2240]">
              <table className="w-full text-xs">
                <thead className="sticky top-0 bg-[#0d1120]">
                  <tr className="border-b border-[#1e2240] text-left text-[9px] uppercase tracking-wider text-[#8892b0]">
                    <th className="px-2.5 py-2">Correo</th>
                    <th className="px-2.5 py-2 text-center">Entr.</th>
                    <th className="px-2.5 py-2 text-center">Abrió</th>
                    <th className="px-2.5 py-2 text-center">Clic</th>
                    <th className="px-2.5 py-2 text-center">Difer.</th>
                    <th className="px-2.5 py-2 text-center">Rebotó</th>
                    <th className="px-2.5 py-2 text-center">Descart.</th>
                  </tr>
                </thead>
                <tbody>
                  {pePage.map((d) => (
                    <tr key={d.correo} className="border-b border-[#1e2240]/60">
                      <td className="whitespace-nowrap px-2.5 py-1.5 text-[#aab3cf]">{d.correo}</td>
                      <SiNo v={d.entregado} />
                      <SiNo v={d.abrio} />
                      <SiNo v={d.clic} />
                      <SiNo v={d.diferido} />
                      <SiNo v={d.reboto} />
                      <SiNo v={d.descartado} />
                    </tr>
                  ))}
                  {pePage.length === 0 && (
                    <tr><td colSpan={7} className="px-2.5 py-6 text-center text-[#6b7280]">Sin registros</td></tr>
                  )}
                </tbody>
              </table>
            </div>
            <Paginador pagina={pagPe} total={destinatariosFiltrados.length} porPagina={POR_PAG} onChange={setPagPe} />
          </div>
        </div>
        )}
      </div>
    </div>
  );
}

function Caja({ label, value, marco = false, big = false }: { label: string; value: string; marco?: boolean; big?: boolean }) {
  return (
    <div className={`panel rounded-2xl border p-4 text-center ${marco ? "border-2 border-white/20" : "border-[#1e2240]"}`}>
      <div className="text-[10px] uppercase tracking-wider text-[#8892b0]">{label}</div>
      <div className={`mt-1 font-bold tabular-nums text-white ${big ? "text-3xl" : "text-xl"}`}>{value}</div>
    </div>
  );
}

function Etapa({ label, value, base, color }: { label: string; value: number; base: number; color: string }) {
  const pct = base ? Math.round((value / base) * 1000) / 10 : 0;
  return (
    <div className="grid grid-cols-[92px_1fr_120px] items-center gap-3">
      <div className="text-xs text-[#8892b0]">{label}</div>
      <div className="h-6 overflow-hidden rounded-md bg-white/5">
        <div className="h-full rounded-md transition-all" style={{ width: `${Math.max(pct, 1.5)}%`, background: color }} />
      </div>
      <div className="text-right text-sm font-semibold text-white">
        {value.toLocaleString("es-CO")} <span className="font-normal text-[#8892b0]">{pct}%</span>
      </div>
    </div>
  );
}

function SiNo({ v }: { v: boolean }) {
  return <td className={`px-2.5 py-1.5 text-center font-semibold ${v ? "text-emerald-400" : "text-[#4a5578]"}`}>{v ? "Sí" : "No"}</td>;
}

function Paginador({ pagina, total, porPagina, onChange }: { pagina: number; total: number; porPagina: number; onChange: (p: number) => void }) {
  const desde = pagina * porPagina;
  const hasta = Math.min(desde + porPagina, total);
  return (
    <div className="mt-2 flex items-center justify-end gap-2 text-[11px] text-[#8892b0]">
      <span>{total ? `${desde + 1}-${hasta} de ${total.toLocaleString("es-CO")}` : "sin registros"}</span>
      <button
        onClick={() => onChange(Math.max(0, pagina - 1))}
        disabled={pagina === 0}
        className="rounded-md border border-[#2a2a4a] px-2 py-0.5 disabled:opacity-30"
      >
        ‹
      </button>
      <button
        onClick={() => onChange(pagina + 1)}
        disabled={desde + porPagina >= total}
        className="rounded-md border border-[#2a2a4a] px-2 py-0.5 disabled:opacity-30"
      >
        ›
      </button>
    </div>
  );
}
