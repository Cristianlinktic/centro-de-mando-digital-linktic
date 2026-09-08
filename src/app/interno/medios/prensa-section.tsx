"use client";

import { useState, useMemo, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/components/auth-provider";
import { canEdit } from "@/lib/auth/rbac";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { toast } from "@/components/ui/toast";
import {
  faRotate,
  faSave,
  faPlus,
  faTrash,
  faClock,
  faPen,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
} from "recharts";

type Ubicacion = { city: string; lat: number; lng: number; weight: number };

type MonitoreoRow = {
  fecha: string;
  menciones_totales: number;
  audiencia_estimada: number;
  share_of_voice: number;
  sentimiento_positivo: number;
  sentimiento_negativo: number;
  cobertura_tv: number;
  cobertura_digital: number;
  cobertura_radio: number;
  cobertura_impresos: number;
  valor_publicitario: number;
  tier_1: number;
  tier_2: number;
  tier_3: number;
  ubicaciones: Ubicacion[];
};

const emptyRow = (fecha: string): MonitoreoRow => ({
  fecha,
  menciones_totales: 0,
  audiencia_estimada: 0,
  share_of_voice: 0,
  sentimiento_positivo: 0,
  sentimiento_negativo: 0,
  cobertura_tv: 0,
  cobertura_digital: 0,
  cobertura_radio: 0,
  cobertura_impresos: 0,
  valor_publicitario: 0,
  tier_1: 0,
  tier_2: 0,
  tier_3: 0,
  ubicaciones: [],
});

const todayISO = () => new Date().toISOString().slice(0, 10);
const monthISO = () => new Date().toISOString().slice(0, 7);

const fmtNum = (n: number | undefined | null) => (n ?? 0).toLocaleString("es-CO");
const fmtCOP = (n: number | undefined | null) => `$${(n ?? 0).toLocaleString("es-CO")}`;

const SENTIMENT_COLORS = { positivo: "#2eb88a", negativo: "#df3a3a", neutral: "#aab3cf" };
const COVERAGE_COLORS = ["#0094ff", "#a78bfa", "#f3b116", "#2eb88a"];
const TIER_COLORS = ["#fbbf24", "#c0c8de", "#78716c"];

function KpiCard({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <Card className="panel border-[#1e2240] p-5 rounded-2xl">
      <p className="text-[10px] font-bold text-[#8892b0] tracking-wider mb-2">{label.toUpperCase()}</p>
      <p className="text-2xl font-bold text-[#0094ff]">{value}</p>
      {hint && <p className="text-[10px] text-[#8892b0] mt-1">{hint}</p>}
    </Card>
  );
}

function SentimentDonut({ positivo, negativo }: { positivo: number; negativo: number }) {
  const neutral = Math.max(0, 100 - positivo - negativo);
  const data = [
    { name: "Positivo", value: positivo, color: SENTIMENT_COLORS.positivo },
    { name: "Negativo", value: negativo, color: SENTIMENT_COLORS.negativo },
    { name: "Neutral", value: neutral, color: SENTIMENT_COLORS.neutral },
  ];
  return (
    <Card className="panel border border-[#1e2240] p-6 rounded-2xl">
      <h3 className="text-sm font-semibold mb-4 text-[#e4e9f5] uppercase tracking-widest">Sentimiento</h3>
      <div className="h-40">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={data} dataKey="value" nameKey="name" innerRadius={40} outerRadius={65} paddingAngle={2}>
              {data.map((d) => (
                <Cell key={d.name} fill={d.color} stroke="none" />
              ))}
            </Pie>
            <Tooltip contentStyle={{ backgroundColor: "#0d1120", border: "1px solid #1e2240", borderRadius: 12 }} />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div className="flex justify-center gap-4 mt-2 text-[10px] font-bold text-[#aab3cf] uppercase tracking-widest">
        <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-[#2eb88a]" />Pos {positivo}%</div>
        <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-[#df3a3a]" />Neg {negativo}%</div>
        <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-[#aab3cf]" />Neu {neutral}%</div>
      </div>
    </Card>
  );
}

function CoverageBars({ tv, digital, radio, impresos }: { tv: number; digital: number; radio: number; impresos: number }) {
  const items = [
    { label: "TV", value: tv, color: COVERAGE_COLORS[0] },
    { label: "Digital", value: digital, color: COVERAGE_COLORS[1] },
    { label: "Radio", value: radio, color: COVERAGE_COLORS[2] },
    { label: "Impresos", value: impresos, color: COVERAGE_COLORS[3] },
  ];
  const max = Math.max(1, ...items.map((i) => i.value));
  return (
    <Card className="panel border border-[#1e2240] p-6 rounded-2xl">
      <h3 className="text-sm font-semibold mb-4 text-[#e4e9f5] uppercase tracking-widest">Cobertura por Medio</h3>
      <div className="space-y-3">
        {items.map((it) => (
          <div key={it.label}>
            <div className="flex justify-between text-[10px] font-bold text-[#aab3cf] mb-1">
              <span>{it.label}</span>
              <span>{fmtNum(it.value)}</span>
            </div>
            <div className="h-2 w-full bg-[#131a30] rounded-full overflow-hidden">
              <div className="h-full rounded-full" style={{ width: `${(it.value / max) * 100}%`, background: it.color }} />
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

function TierBars({ tier1, tier2, tier3 }: { tier1: number; tier2: number; tier3: number }) {
  const items = [
    { label: "Tier 1", value: tier1, color: TIER_COLORS[0] },
    { label: "Tier 2", value: tier2, color: TIER_COLORS[1] },
    { label: "Tier 3", value: tier3, color: TIER_COLORS[2] },
  ];
  const max = Math.max(1, ...items.map((i) => i.value));
  return (
    <Card className="panel border border-[#1e2240] p-6 rounded-2xl">
      <h3 className="text-sm font-semibold mb-4 text-[#e4e9f5] uppercase tracking-widest">Medios por Tier</h3>
      <div className="space-y-3">
        {items.map((it) => (
          <div key={it.label}>
            <div className="flex justify-between text-[10px] font-bold text-[#aab3cf] mb-1">
              <span>{it.label}</span>
              <span>{fmtNum(it.value)}</span>
            </div>
            <div className="h-2 w-full bg-[#131a30] rounded-full overflow-hidden">
              <div className="h-full rounded-full" style={{ width: `${(it.value / max) * 100}%`, background: it.color }} />
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

function UbicacionesPanel({
  ubicaciones,
  editing,
  onChange,
}: {
  ubicaciones: Ubicacion[];
  editing: boolean;
  onChange?: (next: Ubicacion[]) => void;
}) {
  const sorted = useMemo(() => [...ubicaciones].sort((a, b) => (b.weight || 0) - (a.weight || 0)).slice(0, 15), [ubicaciones]);
  const max = Math.max(1, ...sorted.map((u) => u.weight || 0));

  return (
    <Card className="panel border border-[#1e2240] p-6 rounded-2xl h-full">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-[#e4e9f5] uppercase tracking-widest">Menciones por Ciudad</h3>
        {editing && onChange && (
          <Button size="sm" variant="ghost" className="text-[10px] font-black uppercase text-[#75ddff]" onClick={() => onChange([{ city: "", lat: 0, lng: 0, weight: 0 }, ...ubicaciones])}>
            <FontAwesomeIcon icon={faPlus} className="mr-1" /> Agregar
          </Button>
        )}
      </div>
      {editing && onChange ? (
        <div className="space-y-2 max-h-[420px] overflow-y-auto">
          {ubicaciones.map((u, idx) => (
            <div key={idx} className="flex gap-2 items-center bg-white/5 p-2 rounded-lg border border-[#1e2240]">
              <Input value={u.city} placeholder="Ciudad" onChange={(e) => {
                const up = [...ubicaciones];
                up[idx] = { ...up[idx], city: e.target.value };
                onChange(up);
              }} className="h-7 text-xs well border-[#1e2240] flex-1" />
              <Input type="number" value={u.weight} placeholder="Peso" onChange={(e) => {
                const up = [...ubicaciones];
                up[idx] = { ...up[idx], weight: parseInt(e.target.value) || 0 };
                onChange(up);
              }} className="h-7 text-xs well border-[#1e2240] w-20" />
              <Button variant="ghost" size="sm" onClick={() => onChange(ubicaciones.filter((_, i) => i !== idx))} className="h-6 w-6 p-0 text-red-500 shrink-0">
                <FontAwesomeIcon icon={faTrash} className="w-2.5 h-2.5" />
              </Button>
            </div>
          ))}
          {ubicaciones.length === 0 && <p className="text-xs text-[#8892b0] text-center py-6">Sin ubicaciones registradas.</p>}
        </div>
      ) : (
        <div className="space-y-3 max-h-[420px] overflow-y-auto">
          {sorted.map((u, i) => (
            <div key={`${u.city}-${i}`} className="flex items-center gap-3">
              <span className="text-[10px] font-black text-[#8892b0] w-4 shrink-0">{i + 1}</span>
              <span className="text-xs font-bold text-[#e4e9f5] w-28 truncate shrink-0">{u.city || "—"}</span>
              <div className="flex-1 h-1.5 bg-[#131a30] rounded-full overflow-hidden">
                <div className="h-full bg-[#0094ff] rounded-full" style={{ width: `${((u.weight || 0) / max) * 100}%` }} />
              </div>
              <span className="text-[10px] font-mono text-[#8892b0] w-10 text-right shrink-0">{fmtNum(u.weight)}</span>
            </div>
          ))}
          {sorted.length === 0 && <p className="text-xs text-[#8892b0] text-center py-6">Sin ubicaciones registradas.</p>}
        </div>
      )}
    </Card>
  );
}

export function PrensaSection() {
  const { role } = useAuth();
  const editable = canEdit(role);

  const [activeTab, setActiveTab] = useState<"diario" | "mensual">("diario");
  const [selectedDate, setSelectedDate] = useState(todayISO());
  const [selectedMonth, setSelectedMonth] = useState(monthISO());
  const [loading, setLoading] = useState(true);
  const [currentData, setCurrentData] = useState<MonitoreoRow | null>(null);
  const [historicalData, setHistoricalData] = useState<MonitoreoRow[]>([]);
  const [monthRows, setMonthRows] = useState<MonitoreoRow[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState<MonitoreoRow>(emptyRow(todayISO()));
  const [showHistory, setShowHistory] = useState(false);
  const [allRecords, setAllRecords] = useState<MonitoreoRow[]>([]);

  const loadDaily = async (fecha: string) => {
    setLoading(true);
    const [{ data: dayData }, { data: histData }] = await Promise.all([
      supabase.from("prensa_monitoreo").select("*").eq("fecha", fecha).maybeSingle(),
      supabase.from("prensa_monitoreo").select("*").order("fecha", { ascending: false }).limit(30),
    ]);
    setCurrentData((dayData as MonitoreoRow) ?? null);
    setHistoricalData(((histData as MonitoreoRow[]) ?? []).reverse());
    setLoading(false);
  };

  const loadMonthly = async (month: string) => {
    setLoading(true);
    const start = `${month}-01`;
    const [y, m] = month.split("-").map(Number);
    const lastDay = new Date(y, m, 0).getDate();
    const end = `${month}-${String(lastDay).padStart(2, "0")}`;
    const { data } = await supabase
      .from("prensa_monitoreo")
      .select("*")
      .gte("fecha", start)
      .lte("fecha", end)
      .order("fecha", { ascending: true });
    setMonthRows((data as MonitoreoRow[]) ?? []);
    setLoading(false);
  };

  useEffect(() => {
    if (activeTab === "diario") loadDaily(selectedDate);
  }, [activeTab, selectedDate]);

  useEffect(() => {
    if (activeTab === "mensual") loadMonthly(selectedMonth);
  }, [activeTab, selectedMonth]);

  useEffect(() => {
    setIsEditing(false);
    setDraft(currentData ?? emptyRow(selectedDate));
  }, [currentData, selectedDate]);

  const monthly = useMemo(() => {
    if (monthRows.length === 0) return null;
    const sum = (k: keyof MonitoreoRow) => monthRows.reduce((acc, r) => acc + ((r[k] as number) || 0), 0);
    const avg = (k: keyof MonitoreoRow) => sum(k) / monthRows.length;
    const locationMap = new Map<string, Ubicacion>();
    monthRows.forEach((r) => {
      (r.ubicaciones ?? []).forEach((loc) => {
        const existing = locationMap.get(loc.city);
        locationMap.set(loc.city, existing ? { ...existing, weight: (existing.weight || 0) + (loc.weight || 0) } : loc);
      });
    });
    return {
      fecha: selectedMonth,
      menciones_totales: sum("menciones_totales"),
      audiencia_estimada: sum("audiencia_estimada"),
      valor_publicitario: sum("valor_publicitario"),
      share_of_voice: Number(avg("share_of_voice").toFixed(2)),
      sentimiento_positivo: Math.round(avg("sentimiento_positivo")),
      sentimiento_negativo: Math.round(avg("sentimiento_negativo")),
      cobertura_tv: sum("cobertura_tv"),
      cobertura_digital: sum("cobertura_digital"),
      cobertura_radio: sum("cobertura_radio"),
      cobertura_impresos: sum("cobertura_impresos"),
      tier_1: sum("tier_1"),
      tier_2: sum("tier_2"),
      tier_3: sum("tier_3"),
      ubicaciones: Array.from(locationMap.values()),
    };
  }, [monthRows, selectedMonth]);

  const chartData = useMemo(
    () => (activeTab === "diario" ? historicalData : monthRows).map((r) => ({
      fecha: r.fecha?.slice(5),
      menciones: r.menciones_totales,
      audiencia: r.audiencia_estimada,
    })),
    [activeTab, historicalData, monthRows]
  );

  const displayData: MonitoreoRow | null = activeTab === "diario" ? currentData : monthly;

  const openHistory = async () => {
    const { data } = await supabase.from("prensa_monitoreo").select("*").order("fecha", { ascending: false });
    setAllRecords((data as MonitoreoRow[]) ?? []);
    setShowHistory(true);
  };

  const saveDraft = async () => {
    try {
      const payload = { ...draft, fecha: selectedDate };
      const { error } = await supabase.from("prensa_monitoreo").upsert(payload, { onConflict: "fecha" });
      if (error) throw error;
      setIsEditing(false);
      await loadDaily(selectedDate);
      toast.success("Datos guardados", "El monitoreo de prensa del día quedó guardado.");
    } catch (err) {
      console.error(err);
      toast.error("Error al guardar", "No se pudieron guardar los datos. Intenta de nuevo.");
    }
  };

  const numField = (key: keyof MonitoreoRow, label: string) => (
    <div className="space-y-1">
      <label className="text-[9px] text-[#8892b0] uppercase font-black">{label}</label>
      <Input
        type="number"
        value={(draft[key] as number) ?? 0}
        onChange={(e) => setDraft({ ...draft, [key]: key === "share_of_voice" || key === "sentimiento_positivo" || key === "sentimiento_negativo" ? parseFloat(e.target.value) || 0 : parseInt(e.target.value) || 0 })}
        className="well border-[#1e2240] h-8 text-xs"
      />
    </div>
  );

  if (loading && !displayData) {
    return <div className="h-64 text-white flex justify-center items-center font-mono tracking-widest uppercase animate-pulse">Cargando Análisis de Prensa...</div>;
  }

  return (
    <>
      {/* Header */}
      <div className="mb-6 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <div className="flex gap-2 mb-2">
            <span className="bg-[#1e2240] text-[#75ddff] text-[10px] px-2 py-0.5 rounded-full border border-[#0094ff]/20 uppercase font-black">MONITOREO DE PRENSA</span>
          </div>
          <h2 className="text-2xl font-bold mb-1 gradient-text text-glow-blue">Análisis de Prensa</h2>
          <p className="text-[#aab3cf] text-sm">Impacto, cobertura y sentimiento en medios de comunicación.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "diario" | "mensual")}>
            <TabsList>
              <TabsTrigger value="diario">Diaria</TabsTrigger>
              <TabsTrigger value="mensual">Mensual</TabsTrigger>
            </TabsList>
          </Tabs>
          {activeTab === "diario" ? (
            <Input type="date" value={selectedDate} max={todayISO()} onChange={(e) => setSelectedDate(e.target.value)} className="h-8 w-40 panel border-[#2a2a4a] text-xs [color-scheme:dark]" />
          ) : (
            <Input type="month" value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)} className="h-8 w-36 panel border-[#2a2a4a] text-xs [color-scheme:dark]" />
          )}
          {editable && activeTab === "diario" && (
            <>
              {!isEditing ? (
                <Button variant="outline" size="sm" onClick={() => setIsEditing(true)} className="bg-[#0094ff]/10 text-[#75ddff] border-[#0094ff]/20 hover:bg-[#0094ff] hover:text-white transition-all">
                  <FontAwesomeIcon icon={faPen} className="mr-2" /> {currentData ? "Editar Datos" : "Ingresar Datos"}
                </Button>
              ) : (
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => { setIsEditing(false); setDraft(currentData ?? emptyRow(selectedDate)); }} className="text-[#aab3cf] hover:text-white">
                    Cancelar
                  </Button>
                  <Button variant="default" size="sm" onClick={saveDraft} className="bg-green-600 hover:bg-green-700 text-white font-bold px-4">
                    <FontAwesomeIcon icon={faSave} className="mr-2" /> Guardar
                  </Button>
                </div>
              )}
              <Button variant="outline" size="sm" onClick={openHistory} className="panel border-[#2a2a4a] text-white">
                <FontAwesomeIcon icon={faClock} className="mr-2" /> Historial
              </Button>
            </>
          )}
          <Button variant="outline" size="sm" onClick={() => (activeTab === "diario" ? loadDaily(selectedDate) : loadMonthly(selectedMonth))} className="panel border-[#2a2a4a] text-white">
            <FontAwesomeIcon icon={faRotate} className={loading ? "animate-spin" : ""} />
          </Button>
        </div>
      </div>

      {activeTab === "mensual" && !monthly ? (
        <Card className="panel border border-[#1e2240] p-12 rounded-2xl text-center">
          <p className="text-[#c0c8de] font-bold mb-1">No hay datos para este mes</p>
          <p className="text-[#8892b0] text-sm">Selecciona otro periodo o ingresa datos diarios en la vista Diaria.</p>
        </Card>
      ) : (
        <>
          {/* KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <KpiCard label="Menciones" value={fmtNum(displayData?.menciones_totales)} hint={activeTab === "diario" ? "Del día" : "Total del mes"} />
            <KpiCard label="Audiencia Estimada" value={fmtNum(displayData?.audiencia_estimada)} hint="Alcance aproximado" />
            <KpiCard label="Share of Voice" value={`${displayData?.share_of_voice ?? 0}%`} />
            <KpiCard label="Valor Publicitario" value={fmtCOP(displayData?.valor_publicitario)} hint="Equivalente estimado" />
          </div>

          {/* Historical chart */}
          <Card className="panel border border-[#1e2240] p-6 rounded-2xl neon-frame mb-6">
            <h3 className="font-bold text-lg text-[#e4e9f5] mb-1">{activeTab === "diario" ? "Últimos 30 registros" : "Tendencia del mes"}</h3>
            <p className="text-xs text-[#8892b0] mb-6">Menciones y audiencia estimada</p>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1e2240" />
                  <XAxis dataKey="fecha" axisLine={false} tickLine={false} tick={{ fill: "#aab3cf", fontSize: 11 }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: "#aab3cf", fontSize: 11 }} />
                  <Tooltip contentStyle={{ backgroundColor: "#0d1120", border: "1px solid #1e2240", borderRadius: 12 }} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Line type="monotone" dataKey="menciones" name="Menciones" stroke="#0094ff" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="audiencia" name="Audiencia" stroke="#2eb88a" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            <div className="space-y-6">
              <SentimentDonut positivo={displayData?.sentimiento_positivo ?? 0} negativo={displayData?.sentimiento_negativo ?? 0} />
              <CoverageBars
                tv={displayData?.cobertura_tv ?? 0}
                digital={displayData?.cobertura_digital ?? 0}
                radio={displayData?.cobertura_radio ?? 0}
                impresos={displayData?.cobertura_impresos ?? 0}
              />
              <TierBars tier1={displayData?.tier_1 ?? 0} tier2={displayData?.tier_2 ?? 0} tier3={displayData?.tier_3 ?? 0} />
            </div>
            <div className="lg:col-span-2">
              <UbicacionesPanel
                ubicaciones={isEditing ? draft.ubicaciones ?? [] : displayData?.ubicaciones ?? []}
                editing={activeTab === "diario" && isEditing}
                onChange={(next) => setDraft({ ...draft, ubicaciones: next })}
              />
            </div>
          </div>

          {/* Inline edit form */}
          {activeTab === "diario" && isEditing && (
            <Card className="panel border border-[#1e2240] p-6 rounded-2xl mb-20 animate-in fade-in slide-in-from-top-4 duration-300">
              <h3 className="text-[#75ddff] font-black mb-4 uppercase text-xs tracking-widest flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#0094ff]" /> Editar métricas — {selectedDate}
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {numField("menciones_totales", "Menciones Totales")}
                {numField("audiencia_estimada", "Audiencia Estimada")}
                {numField("share_of_voice", "Share of Voice %")}
                {numField("valor_publicitario", "Valor Publicitario")}
                {numField("sentimiento_positivo", "Sentimiento Positivo %")}
                {numField("sentimiento_negativo", "Sentimiento Negativo %")}
                {numField("cobertura_tv", "Cobertura TV")}
                {numField("cobertura_digital", "Cobertura Digital")}
                {numField("cobertura_radio", "Cobertura Radio")}
                {numField("cobertura_impresos", "Cobertura Impresos")}
                {numField("tier_1", "Tier 1")}
                {numField("tier_2", "Tier 2")}
                {numField("tier_3", "Tier 3")}
              </div>
            </Card>
          )}
        </>
      )}

      {/* Historial modal */}
      <Sheet open={showHistory} onOpenChange={setShowHistory}>
        <SheetContent side="right" className="panel text-white border-l border-[#2a2a4a] w-full sm:max-w-md overflow-y-auto">
          <SheetHeader>
            <SheetTitle className="text-white text-xl font-bold border-b border-[#2a2a4a] pb-4">Historial de Registros</SheetTitle>
          </SheetHeader>
          <div className="mt-6 space-y-2">
            {allRecords.map((r) => (
              <button
                key={r.fecha}
                onClick={() => {
                  setActiveTab("diario");
                  setSelectedDate(r.fecha);
                  setShowHistory(false);
                  setTimeout(() => setIsEditing(true), 0);
                }}
                className="w-full flex items-center justify-between bg-white/5 hover:bg-white/10 transition-colors p-3 rounded-xl text-left"
              >
                <span className="text-sm font-bold">{r.fecha}</span>
                <span className="text-xs text-[#aab3cf]">{fmtNum(r.menciones_totales)} menciones</span>
              </button>
            ))}
            {allRecords.length === 0 && <p className="text-xs text-[#8892b0] text-center py-8">Sin registros aún.</p>}
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
