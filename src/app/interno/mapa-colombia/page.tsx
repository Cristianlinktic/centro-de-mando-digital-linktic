"use client";

import { Suspense, useState, useMemo, useEffect } from "react";
import dynamic from "next/dynamic";
import { Card } from "@/components/ui/card";
import { KpiCards } from "@/components/kpi-cards";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/components/auth-provider";
import { AdminPopup } from "@/components/admin-popup";
import { canEdit } from "@/lib/auth/rbac";
import { ColombiaMapEditor } from "@/components/colombia-map-editor";
import { COLOMBIA_DEPARTAMENTOS } from "@/data/colombia-departamentos";
import { LiveTicker } from "@/components/live-ticker";
import { SentimentDonut } from "@/components/sentiment-donut";
import { TabLoadingScreen } from "@/components/bird-loading/tab-loading-screen";
import { faInstagram } from "@fortawesome/free-brands-svg-icons";
import { faRotate, faArrowTrendUp, faArrowTrendDown, faLocationDot, faMapLocationDot, faLayerGroup, faGear } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

const Globe = dynamic(() => import("@/components/globe").then((m) => m.GlobeComponent), {
  ssr: false,
  loading: () => (
    <div className="h-full rounded-lg flex items-center justify-center" style={{ background: "radial-gradient(ellipse at 40% 40%, #070a16 0%, #070a16 100%)" }}>
      <p className="text-muted-foreground text-sm">Cargando mapa...</p>
    </div>
  ),
});

const sentimentColors: Record<string, string> = {
  positivo: "rgb(46, 184, 138)",
  negativo: "rgb(223, 58, 58)",
  neutral: "rgb(243, 177, 22)",
  mixto: "hsl(42 90% 52%)",
};

// Solo Instagram en esta vista
const platformColors: Record<string, string> = { Instagram: "rgb(225, 48, 108)" };

// Cámara inicial centrada y con zoom cerrado sobre Colombia
const COLOMBIA_POV = { lat: 4.6, lng: -73.8, altitude: 0.6 };

const DepartmentDetail = ({ dep }: { dep: any }) => {
  if (!dep) return null;
  const pct = dep.sentimientoPct || { positivo: 0, neutral: 0, negativo: 0 };
  return (
    <div className="p-5 space-y-4 panel border border-[#2a2a4a] rounded-2xl text-white">
      <div className="flex justify-between items-start">
        <div className="flex items-center gap-3">
          <span className="font-mono text-2xl font-bold text-[#aab3cf]">{dep.id}</span>
          <div>
            <h3 className="text-xl font-bold leading-tight">{dep.label ?? dep.pais}</h3>
            <p className="text-xs text-[#aab3cf] flex items-center gap-1">
              <FontAwesomeIcon icon={faLocationDot} className="w-3 h-3" /> {dep.capital} · {dep.updateTime}
            </p>
          </div>
        </div>
        <span className="text-[10px] font-bold px-2 py-1 rounded-full flex items-center gap-1" style={{ background: "rgba(225,48,108,0.12)", color: "#E1306C" }}>
          <FontAwesomeIcon icon={faInstagram} className="w-3 h-3" /> INSTAGRAM
        </span>
      </div>

      <div className="panel-soft p-4 rounded-xl border border-[#1e2240]">
        <p className="text-xs text-[#aab3cf] mb-1">Tema principal</p>
        <p className="text-sm font-semibold text-[#75ddff]">{dep.tema}</p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="panel-soft p-4 rounded-xl border border-[#1e2240]">
          <p className="text-2xl font-bold text-yellow-500">{Number(dep.volumen).toLocaleString()}</p>
          <p className="text-xs text-[#aab3cf]">menciones</p>
          <p className={`text-xs flex items-center mt-1 ${dep.pctCambio >= 0 ? "text-green-500" : "text-red-500"}`}>
            <FontAwesomeIcon icon={faArrowTrendUp} className="w-3 h-3 mr-1" /> {dep.pctCambio}%
          </p>
        </div>
        <div className="panel-soft p-4 rounded-xl border border-[#1e2240]">
          <p className="text-lg font-bold capitalize" style={{ color: sentimentColors[dep.sentimiento] || "#c0c8de" }}>{dep.sentimiento}</p>
          <p className="text-xs text-[#aab3cf]">Sentimiento</p>
        </div>
      </div>

      <div className="space-y-2 bg-[#10142a] p-4 rounded-xl border border-[#1e2240]">
        <p className="text-xs text-[#aab3cf]">Distribución de sentimiento</p>
        <SentimentDonut
          positivo={pct.positivo || 0}
          neutral={pct.neutral || 0}
          negativo={pct.negativo || 0}
          colors={{ positivo: sentimentColors.positivo, neutral: sentimentColors.neutral, negativo: sentimentColors.negativo }}
        />
      </div>

      {dep.topHashtags?.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs text-[#aab3cf]">Top hashtags</p>
          <div className="flex flex-wrap gap-1">
            {dep.topHashtags.map((h: string) => (
              <span key={h} className="px-2 py-1 rounded panel-soft text-[10px] text-yellow-500 border border-[#1e2240]">{h}</span>
            ))}
          </div>
        </div>
      )}

      <div className="p-4 rounded-xl panel-soft border border-[#0094ff]/20 text-xs text-[#c0c8de] leading-relaxed">
        <p className="text-[#aab3cf] mb-1">Resumen</p>
        {dep.resumen}
      </div>
    </div>
  );
};

export default function MapaColombiaPage() {
  const { firstName, role } = useAuth();
  const [data, setData] = useState<any[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [editorOpen, setEditorOpen] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    const { data: rows } = await supabase.from("actores_colombia").select("*");
    const byId: Record<string, any> = {};
    (rows || []).forEach((r: any) => { byId[r.id] = r; });

    // La lista canónica garantiza los 33 departamentos (identidad + geometría);
    // las métricas de Instagram se superponen desde la BD cuando existen.
    const merged = COLOMBIA_DEPARTAMENTOS.map((dep) => {
      const r = byId[dep.id];
      const volumen = r?.volumen ?? 0;
      return {
        id: dep.id,
        nombre: dep.nombre,
        label: dep.displayNombre ?? dep.nombre,
        pais: dep.nombre, // El globo usa "pais" como nombre de la región a pintar
        capital: r?.capital ?? dep.capital,
        lat: dep.lat,
        lng: dep.lng,
        tema: r?.tema ?? "",
        keywords: r?.keywords ?? [],
        sentimiento: r?.sentimiento ?? "neutral",
        sentimientoPct: r?.sentimiento_pct ?? { positivo: 0, neutral: 0, negativo: 0 },
        volumen,
        plataformaDominante: "Instagram",
        plataformas: r?.plataformas ?? { Instagram: volumen },
        resumen: r?.resumen ?? "",
        tendencia: r?.tendencia ?? "estable",
        pctCambio: r?.pct_cambio ?? 0,
        topHashtags: r?.top_hashtags ?? [],
        updateTime: r?.update_time ?? "",
      };
    });
    setData(merged);
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const selectedDep = useMemo(() => data.find((d) => d.id === selected), [data, selected]);

  const sortedDeps = useMemo(
    () => [...data].sort((a, b) => (b.volumen || 0) - (a.volumen || 0)),
    [data]
  );

  const maxVolume = useMemo(() => Math.max(...data.map((d) => d.volumen || 0), 1), [data]);

  const kpis = useMemo(() => {
    if (data.length === 0) {
      return [
        { label: "Menciones Instagram", value: "0", delta: null, trend: "neutral" as const },
        { label: "Departamentos activos", value: "0", delta: null, trend: "neutral" as const },
        { label: "Sentimiento positivo", value: "0%", delta: null, trend: "neutral" as const },
        { label: "Departamento líder", value: "---", delta: null, trend: "neutral" as const },
      ];
    }
    const total = data.reduce((acc, d) => acc + (d.volumen || 0), 0);
    const activos = data.filter((d) => (d.volumen || 0) > 0).length;
    let wPos = 0, wVol = 0;
    data.forEach((d) => {
      const v = d.volumen || 0;
      if (v > 0 && d.sentimientoPct) { wPos += (d.sentimientoPct.positivo || 0) * v; wVol += v; }
    });
    const avgPos = wVol > 0 ? Math.round(wPos / wVol) : 0;
    const top = sortedDeps[0];
    const fmt = (v: number) => (v >= 1000000 ? (v / 1000000).toFixed(1) + "M" : v >= 1000 ? (v / 1000).toFixed(1) + "K" : String(v));
    return [
      { label: "Menciones Instagram", value: fmt(total), delta: null, trend: "up" as const },
      { label: "Departamentos activos", value: `${activos}/${data.length}`, delta: null, trend: "neutral" as const },
      { label: "Sentimiento positivo", value: `${avgPos}%`, delta: null, trend: avgPos > 50 ? ("up" as const) : ("down" as const) },
      { label: "Departamento líder", value: top ? (top.label ?? top.pais) : "---", delta: fmt(top?.volumen || 0), trend: "up" as const },
    ];
  }, [data, sortedDeps]);

  if (loading) return <TabLoadingScreen section="Mapa de Colombia" />;

  return (
    <div className="flex flex-col p-6 gap-6 page-bg text-white">
      <div className="space-y-4">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="font-heading text-4xl font-bold tracking-tight gradient-text text-glow-blue">Conversación Nacional — Centro de Mando Digital LinkTIC</h1>
            <p className="text-[#aab3cf] mt-2">Hola {firstName}, bienvenido. Conoce la narrativa y las tendencias nacionales del Centro de Mando Digital LinkTIC. Haz clic en un marcador para ver el detalle.</p>
          </div>
          {canEdit(role) && (
            <button
              onClick={() => setEditorOpen(true)}
              className="shrink-0 inline-flex cursor-pointer items-center gap-2 rounded-full border border-[#0094ff]/30 bg-[#0094ff]/10 px-3.5 py-2 text-xs font-bold text-[#75ddff] transition-colors hover:bg-[#0094ff]/20"
            >
              <FontAwesomeIcon icon={faGear} className="h-3.5 w-3.5" />
              Editar
            </button>
          )}
        </div>

        {sortedDeps.length > 0 && (
          <LiveTicker
            liveLabel="En vivo"
            items={sortedDeps.slice(0, 14).map((d) => ({
              code: d.id,
              label: d.label ?? d.pais,
              value: d.volumen,
              pct: d.pctCambio || 0,
              color: "#E1306C",
            }))}
          />
        )}

        <KpiCards items={kpis} />

        <div className="flex gap-2 items-center mt-2">
          <span className="text-xs px-3 py-1.5 rounded-md bg-primary/20 border border-primary flex items-center gap-2">
            <FontAwesomeIcon icon={faInstagram} className="w-4 h-4" style={{ color: "#E1306C" }} /> Instagram
          </span>
          <Button variant="outline" size="sm" className="panel border-[#2a2a4a] text-white" onClick={fetchData}>
            <FontAwesomeIcon icon={faRotate} className="h-4 w-4 mr-2" /> Actualizar
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:h-[600px]">
        <Card className="lg:col-span-2 overflow-hidden well border border-[#1e2240] shadow-none h-[380px] sm:h-[460px] lg:h-full neon-frame rounded-xl">
          <Suspense fallback={<div className="h-full flex items-center justify-center">Cargando...</div>}>
            <Globe
              className="h-full"
              onSelect={(id: string) => setSelected(id || null)}
              selectedCountryId={selected}
              selectedPlatform={null}
              countriesData={data}
              globeMarkers={[]}
              sentimentColors={sentimentColors}
              platformColors={platformColors}
              title="Conversación Nacional — Centro de Mando Digital LinkTIC"
              // Configuración geográfica: Colombia por departamentos
              geoUrl="/colombia-departamentos.geojson"
              regionNameProp="NOMBRE_DPT"
              initialPov={COLOMBIA_POV}
              tourAltitude={0.6}
              showFlag={false}
              unitLabel="menciones"
              initialTourActive={true}
              plainGlobe
            />
          </Suspense>
        </Card>

        <div className="flex flex-col gap-4 lg:h-full lg:min-h-0">
          <div className="shrink-0 lg:max-h-[58%] overflow-y-auto pr-1">
            {selectedDep ? (
              <DepartmentDetail dep={selectedDep} />
            ) : (
              <Card className="p-6 h-40 flex flex-col items-center justify-center text-center panel border border-[#1e2240] text-white">
                <FontAwesomeIcon icon={faMapLocationDot} className="w-8 h-8 text-pink-500 mb-2" />
                <h3 className="font-bold">Selecciona un departamento</h3>
                <p className="text-xs text-[#aab3cf] mt-1">Haz clic en el mapa o en el ranking para ver el detalle de Instagram.</p>
              </Card>
            )}
          </div>

          <Card className="panel border border-[#2a2a4a] p-4 text-white flex-1 min-h-0 flex flex-col">
            <div className="flex items-center justify-between mb-3 shrink-0">
              <h3 className="font-bold text-sm flex items-center gap-2">
                <FontAwesomeIcon icon={faInstagram} className="w-4 h-4" style={{ color: "#E1306C" }} /> Ranking por menciones
              </h3>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/5 text-[#aab3cf]">TOP 10</span>
            </div>
            <div className="space-y-1.5 flex-1 min-h-0 overflow-y-auto pr-1">
              {sortedDeps.slice(0, 10).map((d, i) => {
                const rankColor = i === 0 ? "#f3b116" : i === 1 ? "#cbd5e1" : i === 2 ? "#d08b5b" : "#aab3cf";
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
                      <span className="font-mono text-[#c0c8de] shrink-0">{Number(d.volumen).toLocaleString()}</span>
                    </div>
                    <div className="mt-1 h-1 rounded-full bg-white/5 overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${((d.volumen || 0) / maxVolume) * 100}%`, background: "#E1306C" }} />
                    </div>
                  </button>
                );
              })}
            </div>
          </Card>
        </div>
      </div>

      {/* Grilla de todos los departamentos */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold flex items-center gap-2">
            <FontAwesomeIcon icon={faLayerGroup} className="w-4 h-4 text-pink-500" /> Todos los departamentos
          </h2>
          <span className="text-xs text-[#aab3cf]">{sortedDeps.length} departamentos · orden por menciones</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3">
          {sortedDeps.map((d, i) => {
            const isSel = selected === d.id;
            const up = (d.pctCambio || 0) >= 0;
            return (
              <button
                key={d.id}
                onClick={() => setSelected(d.id)}
                className={`text-left p-3 rounded-xl border transition-all ${isSel ? "bg-primary/15 border-primary/50 ring-1 ring-primary/40" : "panel border-[#2a2a4a] hover:border-pink-500/40 hover:bg-white/[0.03]"}`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-mono text-[10px] text-[#8892b0]">#{i + 1} · {d.id}</span>
                  <span
                    className="w-2 h-2 rounded-full shrink-0"
                    style={{ background: sentimentColors[d.sentimiento] || "#aab3cf" }}
                    title={d.sentimiento}
                  />
                </div>

                <h3 className="text-sm font-semibold text-white leading-tight truncate" title={d.label ?? d.pais}>{d.label ?? d.pais}</h3>
                <p className="text-[10px] text-[#8892b0] truncate mb-2">{d.capital}</p>

                <div className="flex items-baseline gap-1.5">
                  <span className="text-lg font-bold" style={{ color: "#E1306C" }}>{Number(d.volumen || 0).toLocaleString()}</span>
                  <span className={`text-[10px] flex items-center gap-0.5 ${up ? "text-green-500" : "text-red-500"}`}>
                    <FontAwesomeIcon icon={up ? faArrowTrendUp : faArrowTrendDown} className="w-2.5 h-2.5" />
                    {Math.abs(d.pctCambio || 0)}%
                  </span>
                </div>
                <p className="text-[9px] uppercase tracking-wider text-[#8892b0]">menciones</p>

                <div className="mt-2 h-1 rounded-full bg-white/5 overflow-hidden">
                  <div className="h-full rounded-full" style={{ width: `${((d.volumen || 0) / maxVolume) * 100}%`, background: "#E1306C" }} />
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Editor (solo admin): ingresar/editar datos de Instagram por departamento */}
      <AdminPopup title="Editor · Mapa de Colombia (Instagram)" open={editorOpen} onOpenChange={setEditorOpen} hideTrigger>
        <ColombiaMapEditor data={data} onSaved={fetchData} />
      </AdminPopup>
    </div>
  );
}
