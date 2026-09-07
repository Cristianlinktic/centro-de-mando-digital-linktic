"use client";

import { Suspense, useState, useMemo, useEffect } from "react";
import dynamic from "next/dynamic";
import { Card } from "@/components/ui/card";
import { KpiCards } from "@/components/kpi-cards";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/components/auth-provider";
import { COLOMBIA_DEPARTAMENTOS } from "@/data/colombia-departamentos";
import { LiveTicker } from "@/components/live-ticker";
import { SentimentDonut } from "@/components/sentiment-donut";
import { analyzerSupabase } from "@/lib/supabase-analyzer";
import {
  faRotate,
  faMapLocationDot, faLayerGroup,
  faNewspaper,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { ExternalLink } from "lucide-react";

const Globe = dynamic(() => import("@/components/globe").then((m) => m.GlobeComponent), {
  ssr: false,
  loading: () => (
    <div className="h-full rounded-lg flex items-center justify-center" style={{ background: "radial-gradient(ellipse at 40% 40%, #091428 0%, #030810 100%)" }}>
      <p className="text-muted-foreground text-sm">Cargando mapa...</p>
    </div>
  ),
});

// ─── Constants ────────────────────────────────────────────────────────────────

const COLOMBIA_POV = { lat: 4.6, lng: -73.8, altitude: 0.6 };

const sentimentColors: Record<string, string> = {
  positivo: "rgb(46, 184, 138)",
  negativo: "rgb(223, 58, 58)",
  neutral:  "rgb(243, 177, 22)",
  mixto:    "hsl(42 90% 52%)",
};

const toneColors: Record<string, string> = {
  Positivo: "rgb(46, 184, 138)",
  Negativo: "rgb(223, 58, 58)",
  Neutro:   "rgb(243, 177, 22)",
};

const toneBadge: Record<string, string> = {
  Positivo: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  Negativo: "bg-rose-500/10 text-rose-400 border-rose-500/20",
  Neutro:   "bg-amber-500/10 text-amber-400 border-amber-500/20",
};

// ─── Region → Dept ID mapping ─────────────────────────────────────────────────

function normalizeStr(s: string) {
  return s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").trim();
}

const REGION_MAP: Record<string, string> = {
  antioquia: "05",
  atlantico: "08",
  bogota: "11", "bogota d.c": "11", "bogota dc": "11",
  "distrito capital": "11", "santafe de bogota": "11",
  "santafe de bogota d.c": "11",
  bolivar: "13",
  boyaca: "15",
  caldas: "17",
  caqueta: "18",
  cauca: "19",
  cesar: "20",
  cordoba: "23",
  cundinamarca: "25",
  choco: "27",
  huila: "41",
  "la guajira": "44", guajira: "44",
  magdalena: "47",
  meta: "50",
  narino: "52",
  "norte de santander": "54", "norte santander": "54",
  quindio: "63",
  risaralda: "66",
  santander: "68",
  sucre: "70",
  tolima: "73",
  "valle del cauca": "76", valle: "76",
  arauca: "81",
  casanare: "85",
  putumayo: "86",
  "san andres": "88", "san andres providencia": "88",
  amazonas: "91",
  guainia: "94",
  guaviare: "95",
  vaupes: "97",
  vichada: "99",
};

function regionToDeptId(region: string | null | undefined): string | null {
  if (!region) return null;
  const norm = normalizeStr(region);
  if (REGION_MAP[norm]) return REGION_MAP[norm];
  for (const [key, id] of Object.entries(REGION_MAP)) {
    if (norm.includes(key) || key.includes(norm)) return id;
  }
  return null;
}

// ─── Types ────────────────────────────────────────────────────────────────────

interface Article {
  id: string;
  url: string;
  title: string;
  tone: string;
  emoji: string;
  media: string;
  type: string;
  region: string;
  summary: string;
  tier: string;
  timestamp: string;
}

interface DeptData {
  id: string;
  nombre: string;
  label: string;
  pais: string;
  capital: string;
  lat: number;
  lng: number;
  volumen: number;
  tonos: Record<string, number>;
  sentimientoPct: { positivo: number; neutral: number; negativo: number };
  sentimiento: string;
  articulos: Article[];
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function normalizeTone(raw: string | null | undefined): string {
  if (!raw) return "Neutro";
  const t = raw.trim().toLowerCase();
  if (t === "positivo" || t === "positive") return "Positivo";
  if (t === "negativo" || t === "negative") return "Negativo";
  return "Neutro";
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function dominantTone(tonos: Record<string, number>): string {
  const entries = Object.entries(tonos).filter(([, v]) => v > 0);
  if (!entries.length) return "neutral";
  const [tone] = entries.sort(([, a], [, b]) => b - a)[0];
  return tone.toLowerCase() === "neutro" ? "neutral" : tone.toLowerCase();
}

function buildDeptMap(articles: Article[]): Record<string, Article[]> {
  const map: Record<string, Article[]> = {};
  for (const a of articles) {
    const deptId = regionToDeptId(a.region);
    if (!deptId) continue;
    if (!map[deptId]) map[deptId] = [];
    map[deptId].push(a);
  }
  return map;
}

// ─── Department detail panel ──────────────────────────────────────────────────

const DepartmentDetail = ({ dep, selectedTone }: { dep: DeptData; selectedTone: string | null }) => {
  const { positivo, neutral, negativo } = dep.sentimientoPct;

  const articles = useMemo(
    () => shuffle(selectedTone ? dep.articulos.filter((a) => a.tone === selectedTone) : dep.articulos),
    [dep.articulos, selectedTone]
  );

  return (
    <div className="p-5 space-y-4 bg-[#0b101d]/70 backdrop-blur-md border border-white/10 rounded-2xl text-white">
      {/* Header */}
      <div>
        <h3 className="text-xl font-bold leading-tight">{dep.label ?? dep.pais}</h3>
        <p className="text-xs text-slate-400 mt-0.5">{dep.capital}</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-[#161d2b]/70 backdrop-blur-md p-3 rounded-xl">
          <p className="text-2xl font-bold text-yellow-500">{dep.volumen.toLocaleString()}</p>
          <p className="text-xs text-slate-400">artículos</p>
        </div>
        <div className="bg-[#161d2b]/70 backdrop-blur-md p-3 rounded-xl">
          <SentimentDonut
            positivo={positivo || 0}
            neutral={neutral || 0}
            negativo={negativo || 0}
            colors={{ positivo: sentimentColors.positivo, neutral: sentimentColors.neutral, negativo: sentimentColors.negativo }}
          />
        </div>
      </div>

      {/* Article list */}
      {articles.length === 0 ? (
        <p className="text-xs text-slate-500 italic">Sin artículos para este departamento.</p>
      ) : (
        <div className="space-y-2">
          <p className="text-xs text-slate-400">{articles.length} {articles.length === 1 ? "artículo" : "artículos"}</p>
          <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
            {articles.map((a) => (
              <div key={a.id} className="p-3 rounded-xl bg-[#0e1526] border border-white/5 space-y-1.5">
                {/* Tone + media row */}
                <div className="flex items-center justify-between gap-2">
                  {a.tone && (
                    <span className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-lg border shrink-0 ${toneBadge[a.tone] ?? "bg-slate-500/10 text-slate-400 border-slate-500/20"}`}>
                      {a.tone}
                    </span>
                  )}
                  {a.media && (
                    <span className="text-[9px] font-semibold text-slate-500 uppercase tracking-wider truncate">
                      {a.media}
                    </span>
                  )}
                </div>

                {/* Title */}
                <div className="flex items-start justify-between gap-2">
                  <p className="text-xs font-bold text-slate-100 leading-snug">{a.title}</p>
                  {a.url && (
                    <a
                      href={a.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="shrink-0 text-indigo-400 hover:text-indigo-300 transition-colors mt-0.5"
                    >
                      <ExternalLink size={11} />
                    </a>
                  )}
                </div>

                {/* Summary */}
                {a.summary && (
                  <p className="text-[10px] text-slate-400 leading-relaxed line-clamp-2">{a.summary}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// ─── Main page ────────────────────────────────────────────────────────────────

export default function NacionalPage() {
  const { firstName } = useAuth();
  const [data, setData] = useState<DeptData[]>([]);
  const [totalRaw, setTotalRaw] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [selectedTone, setSelectedTone] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = async (silent = false) => {
    if (!silent) setLoading(true);

    // Conteo exacto total de la tabla (sin límite de filas)
    const { count: exactCount } = await analyzerSupabase
      .from("analyses")
      .select("*", { count: "exact", head: true });
    setTotalRaw(exactCount ?? 0);

    // Traer todas las filas paginando de 1 000 en 1 000
    const allRows: Article[] = [];
    const PAGE = 1000;
    let from = 0;
    while (true) {
      const { data: page } = await analyzerSupabase
        .from("analyses")
        .select("id, url, title, tone, emoji, media, type, region, summary, tier, timestamp")
        .range(from, from + PAGE - 1);
      if (!page || page.length === 0) break;
      allRows.push(...(page as Article[]));
      if (page.length < PAGE) break;
      from += PAGE;
    }

    // Normalizar tono en todas las filas antes de agrupar
    const articles = allRows.map((a) => ({ ...a, tone: normalizeTone(a.tone) }));
    const byDept = buildDeptMap(articles);

    const merged: DeptData[] = COLOMBIA_DEPARTAMENTOS.map((dep) => {
      const arts = byDept[dep.id] ?? [];
      const tonos: Record<string, number> = {};
      for (const a of arts) {
        tonos[a.tone] = (tonos[a.tone] || 0) + 1;
      }
      const total = arts.length;
      const posCount = tonos["Positivo"] || 0;
      const negCount = tonos["Negativo"] || 0;
      const neuCount = tonos["Neutro"]   || 0;
      const sentimientoPct = total > 0
        ? {
            positivo: Math.round((posCount / total) * 100),
            negativo: Math.round((negCount / total) * 100),
            neutral:  Math.round((neuCount / total) * 100),
          }
        : { positivo: 0, negativo: 0, neutral: 0 };

      return {
        id: dep.id,
        nombre: dep.nombre,
        label: dep.displayNombre ?? dep.nombre,
        pais: dep.nombre,
        capital: dep.capital,
        lat: dep.lat,
        lng: dep.lng,
        volumen: total,
        totalDept: total,
        tonos,
        plataformas: tonos,
        sentimientoPct,
        sentimiento: dominantTone(tonos),
        articulos: arts,
      };
    });

    setData(merged);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const volOf = (d: DeptData) =>
    selectedTone ? (d.tonos[selectedTone] || 0) : d.volumen;

  const selectedDep = useMemo(() => data.find((d) => d.id === selected), [data, selected]);

  const sortedDeps = useMemo(
    () => [...data].sort((a, b) => volOf(b) - volOf(a)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [data, selectedTone]
  );

  const maxVolume = useMemo(
    () => Math.max(...data.map((d) => volOf(d)), 1),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [data, selectedTone]
  );

  const kpis = useMemo(() => {
    if (data.length === 0) {
      return [
        { label: "Artículos en prensa", value: "0", delta: null, trend: "neutral" as const },
        { label: "Departamentos con cobertura", value: "0", delta: null, trend: "neutral" as const },
        { label: "Cobertura positiva", value: "0%", delta: null, trend: "neutral" as const },
        { label: "Departamento líder", value: "---", delta: null, trend: "neutral" as const },
      ];
    }
    const activos = data.filter((d) => volOf(d) > 0).length;
    // Conteo real: artículos Positivo / total artículos con tono mapeado
    const totalPos = data.reduce((acc, d) => acc + (d.tonos["Positivo"] || 0), 0);
    const totalNeg = data.reduce((acc, d) => acc + (d.tonos["Negativo"] || 0), 0);
    const totalNeu = data.reduce((acc, d) => acc + (d.tonos["Neutro"]   || 0), 0);
    const totalToned = totalPos + totalNeg + totalNeu;
    const avgPos = totalToned > 0 ? Math.round((totalPos / totalToned) * 100) : 0;
    const top = sortedDeps[0];
    const fmt = (v: number) =>
      v >= 1_000_000 ? (v / 1_000_000).toFixed(1) + "M" :
      v >= 1_000     ? (v / 1_000).toFixed(1) + "K"     : String(v);
    return [
      { label: "Artículos en prensa",          value: totalRaw.toLocaleString("es-CO"), delta: null, trend: "up" as const },
      { label: "Departamentos con cobertura",  value: `${activos}/${data.length}`, delta: null, trend: "neutral" as const },
      { label: "Cobertura positiva",           value: `${avgPos}%`,  delta: null, trend: avgPos > 50 ? ("up" as const) : ("down" as const) },
      { label: "Departamento líder",           value: top ? (top.label ?? top.pais) : "---", delta: fmt(top ? volOf(top) : 0), trend: "up" as const },
    ];
  }, [data, sortedDeps, selectedTone, totalRaw]);

  if (loading) {
    return (
      <div className="h-screen page-bg text-white flex justify-center items-center">
        Cargando conversación nacional...
      </div>
    );
  }

  return (
    <div className="flex flex-col p-6 gap-6 page-bg text-white">
      <div className="space-y-4">
        <div className="flex gap-2 flex-wrap">
          <span className="bg-[#1e293b] text-blue-400 text-xs px-2 py-1 rounded-full border border-blue-500/20">🇨🇴 MAPA NACIONAL</span>
          <span className="inline-flex items-center gap-2 bg-[#0f291e] text-green-400 text-xs px-2.5 py-1 rounded-full border border-green-500/20">
            <FontAwesomeIcon icon={faNewspaper} className="w-3 h-3" /> MONITOREO DE PRENSA
          </span>
        </div>

        <div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight gradient-text text-glow-blue break-words">
            Conversación Nacional — Centro de Mando Digital LinkTIC
          </h1>
          <p className="text-slate-400 mt-2">
            Hola {firstName}, bienvenido. Cobertura de prensa por departamento. Haz clic en un departamento para ver los artículos.
          </p>
        </div>

        {sortedDeps.length > 0 && (() => {
          const tickerDeps = sortedDeps.filter((d) => volOf(d) > 0).slice(0, 14);
          const tickerTotal = tickerDeps.reduce((acc, d) => acc + volOf(d), 0);
          return (
            <LiveTicker
              liveLabel="Prensa"
              items={tickerDeps.map((d) => ({
                code: d.id,
                label: d.label ?? d.pais,
                value: volOf(d),
                pct: tickerTotal > 0 ? Math.round((volOf(d) / tickerTotal) * 100 * 10) / 10 : 0,
                color: selectedTone
                  ? toneColors[selectedTone]
                  : (sentimentColors[d.sentimiento] || "#3b82f6"),
              }))}
            />
          );
        })()}

        <KpiCards items={kpis} />

        <div className="flex flex-wrap gap-2 items-center mt-2">
          <Button
            variant="outline" size="sm"
            className={`bg-[#0b101d]/70 backdrop-blur-md border-white/10 ${!selectedTone ? "bg-primary/20 border-primary" : "text-white"}`}
            onClick={() => setSelectedTone(null)}
          >
            Todos
          </Button>
          {(["Positivo", "Negativo", "Neutro"] as const).map((tone) => (
            <Button
              key={tone} variant="outline" size="sm"
              className={`bg-[#0b101d]/70 backdrop-blur-md border-white/10 ${selectedTone === tone ? "bg-primary/20 border-primary" : "text-white"}`}
              onClick={() => setSelectedTone(tone)}
            >
              <span className="w-2 h-2 rounded-full mr-2 inline-block" style={{ background: toneColors[tone] }} />
              {tone}
            </Button>
          ))}
          <Button
            variant="outline" size="sm"
            className="bg-[#0b101d]/70 backdrop-blur-md border-white/10 text-white"
            onClick={() => fetchData()}
          >
            <FontAwesomeIcon icon={faRotate} className="h-4 w-4 mr-2" /> Actualizar
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:h-[600px]">
        <Card className="lg:col-span-2 overflow-hidden bg-[#05080f] border border-white/5 shadow-none h-[380px] sm:h-[460px] lg:h-full neon-frame rounded-xl">
          <Suspense fallback={<div className="h-full flex items-center justify-center">Cargando...</div>}>
            <Globe
              className="h-full"
              onSelect={(id: string) => setSelected(id || null)}
              selectedCountryId={selected}
              selectedPlatform={selectedTone}
              countriesData={data}
              globeMarkers={[]}
              sentimentColors={sentimentColors}
              platformColors={toneColors}
              title="Conversación Nacional en Medios — Centro de Mando Digital LinkTIC"
              geoUrl="/colombia-departamentos.geojson"
              regionNameProp="NOMBRE_DPT"
              initialPov={COLOMBIA_POV}
              fullscreenAltitude={0.35}
              tourAltitude={0.6}
              showFlag={false}
              unitLabel="artículos"
              initialTourActive={true}
              plainGlobe
            />
          </Suspense>
        </Card>

        <div className="flex flex-col gap-4 lg:h-full lg:min-h-0">
          <div className="shrink-0 lg:max-h-[65%] overflow-y-auto pr-1">
            {selectedDep ? (
              <DepartmentDetail dep={selectedDep} selectedTone={selectedTone} />
            ) : (
              <Card className="p-6 h-40 flex flex-col items-center justify-center text-center bg-[#0b101d]/50 border border-white/5 text-white">
                <FontAwesomeIcon icon={faMapLocationDot} className="w-8 h-8 text-blue-500 mb-2" />
                <h3 className="font-bold">Selecciona un departamento</h3>
                <p className="text-xs text-slate-400 mt-1">Haz clic en el mapa o en el ranking para ver los artículos de prensa.</p>
              </Card>
            )}
          </div>

          <Card className="bg-[#0b101d]/70 backdrop-blur-md border border-white/10 p-4 text-white flex-1 min-h-0 flex flex-col">
            <div className="flex items-center justify-between mb-3 shrink-0">
              <h3 className="font-bold text-sm flex items-center gap-2">
                <FontAwesomeIcon icon={faLayerGroup} className="w-4 h-4 text-blue-400" /> Ranking por artículos
              </h3>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/5 text-slate-400">TOP 10</span>
            </div>
            <div className="space-y-1.5 flex-1 min-h-0 overflow-y-auto pr-1">
              {sortedDeps.slice(0, 10).map((d, i) => {
                const rankColor = i === 0 ? "#f3b116" : i === 1 ? "#cbd5e1" : i === 2 ? "#d08b5b" : "#64748b";
                return (
                  <button
                    key={d.id}
                    onClick={() => setSelected(d.id)}
                    className={`w-full text-left p-2 rounded-lg transition-colors ${selected === d.id ? "bg-primary/20 border border-primary/40" : "hover:bg-white/5 border border-transparent"}`}
                  >
                    <div className="flex items-center justify-between gap-2 text-xs">
                      <span className="flex items-center gap-2 truncate">
                        <span className="font-mono font-bold w-5 text-center" style={{ color: rankColor }}>{i + 1}</span>
                        <span className="truncate">{d.label ?? d.pais}</span>
                      </span>
                      <span className="font-mono text-slate-300 shrink-0">{Number(volOf(d)).toLocaleString()}</span>
                    </div>
                    <div className="mt-1 h-1 rounded-full bg-white/5 overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${(volOf(d) / maxVolume) * 100}%`, background: "#3b82f6" }} />
                    </div>
                  </button>
                );
              })}
            </div>
          </Card>
        </div>
      </div>

      {/* Grid de todos los departamentos */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold flex items-center gap-2">
            <FontAwesomeIcon icon={faLayerGroup} className="w-4 h-4 text-blue-400" /> Todos los departamentos
          </h2>
          <span className="text-xs text-slate-400">{sortedDeps.length} departamentos · orden por artículos</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3">
          {sortedDeps.map((d, i) => {
            const isSel = selected === d.id;
            const count = volOf(d);
            return (
              <button
                key={d.id}
                onClick={() => setSelected(d.id)}
                className={`text-left p-3 rounded-xl border transition-all ${isSel ? "bg-primary/15 border-primary/50 ring-1 ring-primary/40" : "bg-[#0b101d]/70 backdrop-blur-md border-white/10 hover:border-blue-500/40 hover:bg-white/[0.03]"}`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-mono text-[10px] text-slate-500">#{i + 1} · {d.id}</span>
                  <span
                    className="w-2 h-2 rounded-full shrink-0"
                    style={{ background: selectedTone ? toneColors[selectedTone] : (sentimentColors[d.sentimiento] || "#64748b") }}
                    title={selectedTone ?? d.sentimiento}
                  />
                </div>
                <h3 className="text-sm font-semibold text-white leading-tight truncate" title={d.label ?? d.pais}>
                  {d.label ?? d.pais}
                </h3>
                <p className="text-[10px] text-slate-500 truncate mb-2">{d.capital}</p>
                <span className="text-lg font-bold" style={{ color: "#3b82f6" }}>{count.toLocaleString()}</span>
                <p className="text-[9px] uppercase tracking-wider text-slate-500">artículos</p>
                <div className="mt-2 h-1 rounded-full bg-white/5 overflow-hidden">
                  <div className="h-full rounded-full" style={{ width: `${maxVolume > 0 ? (count / maxVolume) * 100 : 0}%`, background: "#3b82f6" }} />
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
