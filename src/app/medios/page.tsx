"use client";

import { useState, useMemo, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/components/auth-provider";
import { canEdit } from "@/lib/auth/rbac";
import { Card } from "@/components/ui/card";
import { 
  faNewspaper, 
  faRadio, 
  faTv, 
  faGlobe, 
  faArrowTrendUp, 
  faRotate,
  faLock,
  faSave,
  faPlus,
  faTrash,
  faUpload
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer, 
  CartesianGrid
} from "recharts";
import { Button } from "@/components/ui/button";
import { AdminPopup } from "@/components/admin-popup";
import { Input } from "@/components/ui/input";
import * as XLSX from 'xlsx';

// Helper to get media icon based on name/type
const getMediaIcon = (medio: string) => {
  const name = medio.toLowerCase();
  if (name.includes("tiempo") || name.includes("semana") || name.includes("pulzo") || name.includes("infobae")) return faNewspaper;
  if (name.includes("radio") || name.includes("blu") || name.includes("la w") || name.includes("caracol")) return faRadio;
  if (name.includes("televisión") || name.includes("rcn") || name.includes("caracol tv")) return faTv;
  return faGlobe;
};

const sentimentColors = {
  positivas: "#2eb88a",
  neutral: "#64748b",
  negativas: "#df3a3a"
};

const formatTime = (time: string | Date) => {
    if (!time) return "Ahora";
    const date = typeof time === 'string' ? new Date(time) : time;
    if (isNaN(date.getTime())) return time.toString();
    
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 0) return "En un momento";
    if (diffInSeconds < 60) return "Hace un momento";
    if (diffInSeconds < 3600) return `Hace ${Math.floor(diffInSeconds / 60)} min`;
    if (diffInSeconds < 86400) return `Hace ${Math.floor(diffInSeconds / 3600)} h`;
    
    return date.toLocaleDateString('es-CO', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
};

export default function MediosPage() {
  const { role } = useAuth();
  const [profiles, setProfiles] = useState<any[]>([]);
  const [feed, setFeed] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastFetchTime, setLastFetchTime] = useState<Date | null>(null);
  const [timeAgo, setTimeAgo] = useState<string>("AHORA");
  const [isEditing, setIsEditing] = useState(false);

  const fetchMediosData = async () => {
    setLoading(true);
    const { data: pData } = await supabase.from('medios_perfiles').select('*');
    const { data: fData } = await supabase.from('medios_feed').select('*').order('id', { ascending: false });
    
    if (pData) setProfiles(pData);
    if (fData) setFeed(fData);
    setLastFetchTime(new Date());
    setTimeAgo("AHORA");
    setLoading(false);
  };

  useEffect(() => {
    fetchMediosData();
  }, []);

  useEffect(() => {
    if (!lastFetchTime) return;
    const interval = setInterval(() => {
      const now = new Date();
      const diffInMins = Math.floor((now.getTime() - lastFetchTime.getTime()) / 60000);
      if (diffInMins === 0) setTimeAgo("AHORA");
      else setTimeAgo(`HACE ${diffInMins} MIN`);
    }, 30000);
    return () => clearInterval(interval);
  }, [lastFetchTime]);

  const saveMediosData = async () => {
    try {
        for (const p of profiles) {
            await supabase.from('medios_perfiles').upsert(p);
        }
        for (const post of feed) {
            await supabase.from('medios_feed').upsert(post);
        }
        alert("¡Datos guardados con éxito!");
        setIsEditing(false);
        fetchMediosData();
    } catch (err) {
        console.error(err);
        alert("Error al guardar datos");
    }
  };

  const handleExcelUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
        try {
            const bstr = evt.target?.result;
            const wb = XLSX.read(bstr, { type: 'binary' });
            
            let updatedProfiles = [...profiles];
            let updatedFeed = [...feed];
            let feedsFound = 0;
            let profilesFound = 0;

            wb.SheetNames.forEach((wsname) => {
                const ws = wb.Sheets[wsname];
                const data = XLSX.utils.sheet_to_json(ws);
                if (data.length === 0) return;

                const firstRow = data[0] as any;

                // FEED detection
                if (firstRow['Medio'] || firstRow['medio'] || firstRow['Titular'] || firstRow['texto']) {
                    const newFeedData = data.map((row: any) => {
                        let tiempo = row['Tiempo'] || row['tiempo'];
                        // Handle Excel date if it's a number
                        if (typeof tiempo === 'number') {
                            tiempo = new Date((tiempo - (25567 + 1)) * 86400 * 1000).toISOString();
                        } else if (!tiempo || tiempo === 'Ahora') {
                            tiempo = new Date().toISOString();
                        } else {
                            const d = new Date(tiempo);
                            tiempo = isNaN(d.getTime()) ? new Date().toISOString() : d.toISOString();
                        }
                        
                        return {
                            medio: row['Medio'] || row['medio'] || 'Medio',
                            tiempo: tiempo,
                            texto: row['Texto'] || row['texto'] || row['Titular'] || '',
                            tipo: (row['Tipo'] || row['tipo'] || 'neutral').toLowerCase()
                        };
                    });
                    updatedFeed = [...newFeedData, ...updatedFeed].slice(0, 50);
                    feedsFound += newFeedData.length;
                } 
                // PROFILES detection
                else if (firstRow['ID'] || firstRow['id'] || firstRow['Notas'] || firstRow['notas']) {
                    data.forEach((row: any) => {
                        const id = (row['ID'] || row['id'] || '').toLowerCase().trim();
                        if (!id) return;
                        
                        const idx = updatedProfiles.findIndex(p => p.id === id);
                        const obj = {
                            id,
                            label: row['Etiqueta'] || row['label'] || id.toUpperCase(),
                            value: (row['Valor'] || row['value'] || '0').toString(),
                            delta: (row['Delta'] || row['delta'] || '0%').toString(),
                            sentimiento: parseInt(row['Sentimiento'] || row['sentimiento']) || 50,
                            notas: parseInt(row['Notas'] || row['notas']) || 0,
                            tendencia_semanal: row['Tendencia'] ? (typeof row['Tendencia'] === 'string' ? JSON.parse(row['Tendencia']) : row['Tendencia']) : []
                        };
                        if (idx !== -1) updatedProfiles[idx] = obj;
                        else updatedProfiles.push(obj);
                    });
                    profilesFound++;
                }
            });

            if (feedsFound > 0) setFeed(updatedFeed);
            if (profilesFound > 0) setProfiles(updatedProfiles);
            alert(`Importación finalizada: ${profilesFound} perfiles y ${feedsFound} noticias.`);
        } catch(err) {
            console.error(err);
            alert("Error procesando Excel.");
        }
    };
    reader.readAsBinaryString(file);
  };

  const kpis = useMemo(() => profiles.filter(p => p.id.startsWith('kpi_')), [profiles]);
  const topMedios = useMemo(() => profiles.filter(p => !p.id.startsWith('kpi_')).sort((a,b) => b.notas - a.notas), [profiles]);
  
  const stackedData = useMemo(() => {
    const kpiNotas = profiles.find(p => p.id === 'kpi_notas');
    if (!kpiNotas || !kpiNotas.tendencia_semanal) return [];
    return kpiNotas.tendencia_semanal.map((item: any) => ({
      ...item,
      neutral: item.notas - item.positivas - item.negativas
    }));
  }, [profiles]);

  if (loading) return <div className="h-screen page-bg text-white flex justify-center items-center font-mono tracking-widest uppercase animate-pulse">Cargando Conversación en Medios...</div>;

  return (
    <div className="page-bg text-white p-6">
      {/* Header Section */}
      <div className="mb-8 flex justify-between items-center">
        <div>
          <div className="flex gap-2 mb-2">
              <span className="bg-[#1e293b] text-blue-400 text-[10px] px-2 py-0.5 rounded-full border border-blue-500/20 uppercase font-black">MEDIOS DE COMUNICACIÓN</span>
              <span className="bg-[#1e293b] text-slate-400 text-[10px] px-2 py-0.5 rounded-full border border-white/10 uppercase">ACTUALIZADO {timeAgo}</span>
          </div>
          <h1 className="text-3xl font-bold mb-1 gradient-text text-glow-blue">Conversación en Medios</h1>
          <p className="text-slate-400 text-sm">Monitoreo de prensa, radio, TV y medios digitales sobre el proceso electoral.</p>
        </div>
        <div className="flex gap-3">
            {canEdit(role) && (
                !isEditing ? (
                    <Button variant="outline" size="sm" onClick={() => setIsEditing(true)} className="bg-blue-600/10 text-blue-400 border-blue-500/20 hover:bg-blue-600 hover:text-white transition-all">
                        <FontAwesomeIcon icon={faRotate} className="mr-2" /> Modo Edición
                    </Button>
                ) : (
                    <div className="flex gap-2 animate-in fade-in zoom-in duration-300">
                        <Button variant="outline" size="sm" onClick={() => setIsEditing(false)} className="text-slate-400 hover:text-white">
                            Cancelar
                        </Button>
                        <Button variant="default" size="sm" onClick={saveMediosData} className="bg-green-600 hover:bg-green-700 text-white font-bold px-4">
                            <FontAwesomeIcon icon={faSave} className="mr-2" /> Guardar Todo
                        </Button>
                    </div>
                )
            )}
            <Button variant="outline" size="sm" onClick={fetchMediosData} className="bg-[#0b101d]/70 backdrop-blur-md border-white/10 text-white">
                <FontAwesomeIcon icon={faRotate} className={`mr-2 ${loading ? 'animate-spin' : ''}`}/>
            </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          {kpis.map((kpi, i) => (
              <Card key={kpi.id} className="bg-[#0b101d]/70 backdrop-blur-md border-white/5 p-5 rounded-2xl relative overflow-hidden group">
                  <div className="flex justify-between items-start mb-2">
                      <p className="text-[10px] font-bold text-slate-500 tracking-wider">
                          {isEditing ? (
                              <Input 
                                value={kpi.label} 
                                onChange={e => {
                                    const up = [...profiles];
                                    const idx = up.findIndex(pr => pr.id === kpi.id);
                                    up[idx].label = e.target.value;
                                    setProfiles(up);
                                }} 
                                className="h-4 bg-transparent border-none p-0 text-[10px] font-bold uppercase"
                              />
                          ) : kpi.label.toUpperCase()}
                      </p>
                      {isEditing ? (
                          <Input 
                            value={kpi.delta} 
                            onChange={e => {
                                const up = [...profiles];
                                const idx = up.findIndex(pr => pr.id === kpi.id);
                                up[idx].delta = e.target.value;
                                setProfiles(up);
                            }} 
                            className="h-4 w-12 bg-transparent border-none p-0 text-[10px] font-bold text-right"
                          />
                      ) : (
                          <span className={`${kpi.delta.includes('+') ? 'text-green-500' : 'text-red-500'} text-[10px] font-bold`}>{kpi.delta}</span>
                      )}
                  </div>
                  {isEditing ? (
                      <Input 
                        value={kpi.value} 
                        onChange={e => {
                            const up = [...profiles];
                            const idx = up.findIndex(pr => pr.id === kpi.id);
                            up[idx].value = e.target.value;
                            setProfiles(up);
                        }} 
                        className="h-8 text-2xl font-bold text-blue-500 bg-white/5 border-white/10 mb-2"
                      />
                  ) : (
                      <p className="text-3xl font-bold text-blue-500">{kpi.value}</p>
                  )}
                  <div className="absolute bottom-0 left-0 w-full h-1 bg-slate-800">
                      <div 
                          className="h-full transition-all duration-1000" 
                          style={{ 
                              width: '40%', 
                              background: i === 0 ? '#3b82f6' : i === 1 ? '#e8a817' : i === 2 ? '#2eb88a' : '#3b82f6' 
                          }} 
                      />
                  </div>
              </Card>
          ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Weekly Chart */}
        <Card className="lg:col-span-2 bg-[#0b101d]/70 backdrop-blur-md border border-white/5 p-6 rounded-2xl neon-frame">
            <div className="mb-8">
                <h3 className="font-bold text-lg text-slate-200">Notas Publicadas esta Semana</h3>
                <p className="text-xs text-slate-500">Distribución por sentimiento — últimos 7 días</p>
            </div>
            <div className="h-64 px-4">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart 
                        data={stackedData} 
                        margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                    >
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1e293b" />
                        <XAxis dataKey="dia" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 11 }} />
                        <Tooltip 
                            cursor={{ fill: 'rgba(255,255,255,0.03)' }}
                            contentStyle={{ backgroundColor: '#0b101d', border: '1px solid #1e293b', borderRadius: '12px' }}
                        />
                        <Bar dataKey="positivas" stackId="a" fill={sentimentColors.positivas} barSize={60} />
                        <Bar dataKey="neutral" stackId="a" fill={sentimentColors.neutral} />
                        <Bar dataKey="negativas" stackId="a" fill={sentimentColors.negativas} radius={[4, 4, 0, 0]} />
                    </BarChart>
                </ResponsiveContainer>
            </div>
            <div className="flex justify-center gap-6 mt-6 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                <div className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full bg-[#2eb88a]"></span> Positivas</div>
                <div className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full bg-[#64748b]"></span> Neutral</div>
                <div className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full bg-[#df3a3a]"></span> Negativas</div>
            </div>

            {isEditing && (
                <div className="mt-8 pt-8 border-t border-white/5 animate-in fade-in slide-in-from-top-4 duration-500">
                    <h4 className="text-[10px] font-black text-emerald-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-emerald-500"></span> Editar Datos del Gráfico
                    </h4>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="text-[10px] font-bold text-slate-500 uppercase tracking-wider border-b border-white/10">
                                    <th className="pb-2">Día</th>
                                    <th className="pb-2 text-center">Total</th>
                                    <th className="pb-2 text-center text-green-500">Pos</th>
                                    <th className="pb-2 text-center text-red-500">Neg</th>
                                    <th className="pb-2 text-right">Neu</th>
                                </tr>
                            </thead>
                            <tbody>
                                {(() => {
                                    const kpiNotas = profiles.find(p => p.id === 'kpi_notas');
                                    if (!kpiNotas || !kpiNotas.tendencia_semanal) return null;
                                    return kpiNotas.tendencia_semanal.map((day: any, dIdx: number) => (
                                        <tr key={day.dia} className="border-b border-white/5 last:border-0 hover:bg-white/5 transition-colors">
                                            <td className="py-2">
                                                <Input value={day.dia} onChange={e => {
                                                    const up = [...profiles];
                                                    const pIdx = up.findIndex(pr => pr.id === 'kpi_notas');
                                                    const newTrend = [...up[pIdx].tendencia_semanal];
                                                    newTrend[dIdx].dia = e.target.value;
                                                    up[pIdx].tendencia_semanal = newTrend;
                                                    setProfiles(up);
                                                }} className="h-6 w-12 bg-transparent border-none p-0 text-xs font-bold text-slate-200" />
                                            </td>
                                            <td className="py-2">
                                                <div className="flex justify-center">
                                                    <Input type="number" value={day.notas} onChange={e => {
                                                        const up = [...profiles];
                                                        const pIdx = up.findIndex(pr => pr.id === 'kpi_notas');
                                                        const newTrend = [...up[pIdx].tendencia_semanal];
                                                        newTrend[dIdx].notas = parseInt(e.target.value) || 0;
                                                        up[pIdx].tendencia_semanal = newTrend;
                                                        setProfiles(up);
                                                    }} className="h-6 w-16 bg-white/5 border-white/10 text-center text-xs text-blue-400 font-bold" />
                                                </div>
                                            </td>
                                            <td className="py-2">
                                                <div className="flex justify-center">
                                                    <Input type="number" value={day.positivas} onChange={e => {
                                                        const up = [...profiles];
                                                        const pIdx = up.findIndex(pr => pr.id === 'kpi_notas');
                                                        const newTrend = [...up[pIdx].tendencia_semanal];
                                                        newTrend[dIdx].positivas = parseInt(e.target.value) || 0;
                                                        up[pIdx].tendencia_semanal = newTrend;
                                                        setProfiles(up);
                                                    }} className="h-6 w-16 bg-green-500/5 border-green-500/20 text-center text-xs text-green-500 font-bold" />
                                                </div>
                                            </td>
                                            <td className="py-2">
                                                <div className="flex justify-center">
                                                    <Input type="number" value={day.negativas} onChange={e => {
                                                        const up = [...profiles];
                                                        const pIdx = up.findIndex(pr => pr.id === 'kpi_notas');
                                                        const newTrend = [...up[pIdx].tendencia_semanal];
                                                        newTrend[dIdx].negativas = parseInt(e.target.value) || 0;
                                                        up[pIdx].tendencia_semanal = newTrend;
                                                        setProfiles(up);
                                                    }} className="h-6 w-16 bg-red-500/5 border-red-500/20 text-center text-xs text-red-500 font-bold" />
                                                </div>
                                            </td>
                                            <td className="py-2 text-right text-[10px] text-slate-500 font-mono font-bold">
                                                {day.notas - day.positivas - day.negativas}
                                            </td>
                                        </tr>
                                    ));
                                })()}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </Card>

        {/* Top Media */}
        <Card className="bg-[#0b101d]/70 backdrop-blur-md border border-white/5 p-6 rounded-2xl overflow-y-auto">
            <h3 className="text-sm font-semibold mb-6 text-slate-200 uppercase tracking-widest">Top Medios</h3>
            <div className="space-y-4">
                {topMedios.map((m, i) => (
                    <div key={m.id} className="flex items-center gap-3 group relative">
                        <div className="shrink-0 w-5 h-5 rounded flex items-center justify-center text-[10px] font-black" style={i < 3 ? { color: '#fbbf24' } : { color: '#475569' }}>
                            {i + 1}
                        </div>
                        <div className="flex items-center gap-2 w-32 shrink-0">
                            <FontAwesomeIcon icon={getMediaIcon(m.label)} className="w-3.5 h-3.5 text-blue-500" />
                            {isEditing ? (
                                <Input 
                                    value={m.label} 
                                    onChange={e => {
                                        const up = [...profiles];
                                        const idx = up.findIndex(pr => pr.id === m.id);
                                        up[idx].label = e.target.value;
                                        setProfiles(up);
                                    }} 
                                    className="h-6 text-xs font-bold bg-white/5 border-white/10 p-1" 
                                />
                            ) : (
                                <span className="text-xs font-bold truncate text-slate-100">{m.label}</span>
                            )}
                        </div>
                        <div className="flex-1 space-y-1">
                            <div className="flex justify-between text-[9px] font-bold">
                                {isEditing ? (
                                    <div className="flex gap-1">
                                        <Input type="number" value={m.notas} onChange={e => {
                                            const up = [...profiles];
                                            const idx = up.findIndex(pr => pr.id === m.id);
                                            up[idx].notas = parseInt(e.target.value);
                                            setProfiles(up);
                                        }} className="h-4 w-8 bg-transparent border-none p-0 text-[9px]" />
                                        <span className="text-slate-500">notas</span>
                                    </div>
                                ) : (
                                    <span className="text-slate-500">{m.notas} notas</span>
                                )}

                                {isEditing ? (
                                    <div className="flex gap-1">
                                        <Input type="number" value={m.sentimiento} onChange={e => {
                                            const up = [...profiles];
                                            const idx = up.findIndex(pr => pr.id === m.id);
                                            up[idx].sentimiento = parseInt(e.target.value);
                                            setProfiles(up);
                                        }} className="h-4 w-8 bg-transparent border-none p-0 text-[9px] text-right" />
                                        <span className="text-green-500">% pos</span>
                                    </div>
                                ) : (
                                    <span className="text-green-500">{m.sentimiento}% pos</span>
                                )}
                            </div>
                            <div className="h-1 w-full bg-slate-800 rounded-full overflow-hidden">
                                <div className="h-full bg-blue-500" style={{ width: `${(m.notas / (topMedios[0]?.notas || 1)) * 100}%` }} />
                            </div>
                        </div>
                        {isEditing && (
                            <Button variant="ghost" size="sm" onClick={() => setProfiles(profiles.filter(p => p.id !== m.id))} className="h-6 w-6 p-0 text-red-500 opacity-0 group-hover:opacity-100 transition-opacity ml-1">
                                <FontAwesomeIcon icon={faTrash} className="w-2.5 h-2.5" />
                            </Button>
                        )}
                    </div>
                ))}
            </div>
        </Card>
      </div>

      {/* Live Feed de Noticias */}
      <div className="bg-[#0b101d]/70 backdrop-blur-md border border-white/5 rounded-2xl p-6 mb-20">
        <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
                <span className="text-blue-500 font-bold text-xl">📰</span>
                <h1 className="text-xl font-bold">Últimas Noticias y Titulares</h1>
                <span className="bg-[#0f291e] text-green-400 text-[10px] px-2 py-0.5 rounded-full border border-green-500/20">● ACTUALIZADO</span>
            </div>
            {isEditing && (
                <Button size="sm" variant="ghost" onClick={() => setFeed([{ medio: 'Medio', tiempo: new Date().toISOString(), texto: '', tipo: 'neutral' }, ...feed])} className="text-[10px] font-black uppercase text-blue-400">
                    <FontAwesomeIcon icon={faPlus} className="mr-1" /> Nueva Noticia
                </Button>
            )}
        </div>

        <div className="space-y-2">
            {feed.map((post, idx) => (
                <div key={post.id || idx} className="bg-[#05080f] border border-white/5 rounded-xl p-4 flex items-center gap-4 hover:border-white/10 transition-colors group relative">
                    <div className="p-2 rounded-lg bg-white/5 text-blue-400">
                        <FontAwesomeIcon icon={getMediaIcon(post.medio)} className="w-5 h-5"/>
                    </div>
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                            {isEditing ? (
                                <>
                                    <Input value={post.medio} onChange={e => {
                                        const up = [...feed];
                                        up[idx].medio = e.target.value;
                                        setFeed(up);
                                    }} className="h-6 text-xs font-bold text-blue-400 bg-white/5 border-white/10 w-32" />
                                    <Input 
                                        type="datetime-local"
                                        value={post.tiempo && !isNaN(new Date(post.tiempo).getTime()) ? new Date(new Date(post.tiempo).getTime() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16) : ''} 
                                        onChange={e => {
                                            const up = [...feed];
                                            up[idx].tiempo = e.target.value;
                                            setFeed(up);
                                        }} 
                                        className="h-6 text-xs bg-white/5 border-white/10 w-44" 
                                    />
                                    <select 
                                        value={post.tipo} 
                                        onChange={e => {
                                            const up = [...feed];
                                            up[idx].tipo = e.target.value;
                                            setFeed(up);
                                        }}
                                        className="bg-[#161d2b]/70 backdrop-blur-md text-[10px] font-bold rounded p-1 border-none outline-none"
                                    >
                                        <option value="positivo">Positivo</option>
                                        <option value="neutral">Neutral</option>
                                        <option value="negativo">Negativo</option>
                                    </select>
                                </>
                            ) : (
                                <>
                                    <span className="font-bold text-sm text-blue-400">{post.medio.toUpperCase()}</span>
                                    <span className="text-xs text-slate-500">{formatTime(post.tiempo)}</span>
                                </>
                            )}
                        </div>
                        {isEditing ? (
                            <textarea 
                                value={post.texto} 
                                onChange={e => {
                                    const up = [...feed];
                                    up[idx].texto = e.target.value;
                                    setFeed(up);
                                }}
                                className="w-full bg-transparent border-none p-0 text-sm text-slate-300 outline-none resize-none min-h-[40px]"
                            />
                        ) : (
                            <p className="text-sm text-slate-300 font-medium group-hover:text-white transition-colors">{post.texto}</p>
                        )}
                    </div>
                    {isEditing ? (
                        <Button variant="ghost" size="sm" onClick={() => setFeed(feed.filter((_, i) => i !== idx))} className="text-red-500 h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity">
                            <FontAwesomeIcon icon={faTrash} className="w-3 h-3" />
                        </Button>
                    ) : (
                        <div className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${post.tipo === 'positivo' ? 'bg-green-500/10 text-green-500' : post.tipo === 'negativo' ? 'bg-red-500/10 text-red-500' : 'bg-slate-500/10 text-slate-500'}`}>
                            {post.tipo}
                        </div>
                    )}
                </div>
            ))}
        </div>
      </div>

      <AdminPopup title="Editor de Conversación en Medios" hideTrigger={true}>
            <div className="space-y-6">
                <div className="flex justify-between items-center bg-[#161d2b]/70 backdrop-blur-md p-4 rounded-xl border border-white/5">
                    <div>
                        <h3 className="font-bold">Panel de Administración</h3>
                        <p className="text-xs text-slate-400">Edita métricas, gráficos y titulares del día.</p>
                    </div>
                    <div className="flex gap-2">
                        <Button variant="outline" size="sm" className="relative cursor-pointer bg-green-600/20 text-green-400 border-green-500/20">
                            <FontAwesomeIcon icon={faUpload} className="mr-2" /> Excel
                            <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" onChange={handleExcelUpload} accept=".xlsx,.xls" />
                        </Button>
                        <Button variant="neon" className="font-bold" onClick={saveMediosData}>
                            <FontAwesomeIcon icon={faSave} className="mr-2" /> Guardar Todos
                        </Button>
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-8">
                    {/* Media Profiles Section */}
                    <div>
                        <h3 className="text-blue-400 font-black mb-4 uppercase text-xs tracking-widest flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-blue-500"></span> KPIs y Medios Top
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {profiles.map((p, idx) => (
                                <div key={p.id} className="bg-white/5 p-4 rounded-xl space-y-3 border border-white/5">
                                    <div className="flex justify-between items-center mb-1">
                                        <span className="font-bold uppercase text-[10px] text-slate-400">{p.id}</span>
                                        <Input value={p.label} onChange={(e) => {
                                            const news = [...profiles];
                                            news[idx].label = e.target.value;
                                            setProfiles(news);
                                        }} className="bg-transparent border-none w-2/3 text-right text-xs font-bold h-6" />
                                    </div>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="space-y-1">
                                            <label className="text-[9px] text-slate-500 uppercase font-black">Valor/Texto</label>
                                            <Input value={p.value} onChange={(e) => {
                                                const news = [...profiles];
                                                news[idx].value = e.target.value;
                                                setProfiles(news);
                                            }} className="bg-[#05080f] border-white/5 h-8 text-xs" />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-[9px] text-slate-500 uppercase font-black">Delta/Positiva</label>
                                            <Input value={p.delta} onChange={(e) => {
                                                const news = [...profiles];
                                                news[idx].delta = e.target.value;
                                                setProfiles(news);
                                            }} className="bg-[#05080f] border-white/5 h-8 text-xs" />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-[9px] text-slate-500 uppercase font-black">Sentimiento %</label>
                                            <Input type="number" value={p.sentimiento} onChange={(e) => {
                                                const news = [...profiles];
                                                news[idx].sentimiento = parseInt(e.target.value);
                                                setProfiles(news);
                                            }} className="bg-[#05080f] border-white/5 h-8 text-xs" />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-[9px] text-slate-500 uppercase font-black">Notas Totales</label>
                                            <Input type="number" value={p.notas} onChange={(e) => {
                                                const news = [...profiles];
                                                news[idx].notas = parseInt(e.target.value);
                                                setProfiles(news);
                                            }} className="bg-[#05080f] border-white/5 h-8 text-xs" />
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Weekly Tendency Section */}
                    <div>
                        <h3 className="text-emerald-400 font-black mb-4 uppercase text-xs tracking-widest flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-emerald-500"></span> Tendencia Semanal (Gráfico)
                        </h3>
                        <div className="bg-white/5 p-4 rounded-xl border border-white/5 overflow-x-auto">
                            <table className="w-full text-xs text-left">
                                <thead>
                                    <tr className="text-slate-500 border-b border-white/10">
                                        <th className="pb-2">Día</th>
                                        <th className="pb-2">Total Notas</th>
                                        <th className="pb-2">Positivas</th>
                                        <th className="pb-2">Negativas</th>
                                        <th className="pb-2 text-right">Neutral (Auto)</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {(() => {
                                        const kpiNotas = profiles.find(p => p.id === 'kpi_notas');
                                        if (!kpiNotas || !kpiNotas.tendencia_semanal) return null;
                                        return kpiNotas.tendencia_semanal.map((day: any, dIdx: number) => (
                                            <tr key={day.dia} className="border-b border-white/5 last:border-0">
                                                <td className="py-2">
                                                    <Input value={day.dia} onChange={e => {
                                                        const up = [...profiles];
                                                        const pIdx = up.findIndex(pr => pr.id === 'kpi_notas');
                                                        const newTrend = [...up[pIdx].tendencia_semanal];
                                                        newTrend[dIdx].dia = e.target.value;
                                                        up[pIdx].tendencia_semanal = newTrend;
                                                        setProfiles(up);
                                                    }} className="h-7 w-16 bg-transparent border-none p-0 font-bold" />
                                                </td>
                                                <td className="py-2">
                                                    <Input type="number" value={day.notas} onChange={e => {
                                                        const up = [...profiles];
                                                        const pIdx = up.findIndex(pr => pr.id === 'kpi_notas');
                                                        const newTrend = [...up[pIdx].tendencia_semanal];
                                                        newTrend[dIdx].notas = parseInt(e.target.value) || 0;
                                                        up[pIdx].tendencia_semanal = newTrend;
                                                        setProfiles(up);
                                                    }} className="h-7 w-20 bg-[#05080f] border-white/5 px-2" />
                                                </td>
                                                <td className="py-2">
                                                    <Input type="number" value={day.positivas} onChange={e => {
                                                        const up = [...profiles];
                                                        const pIdx = up.findIndex(pr => pr.id === 'kpi_notas');
                                                        const newTrend = [...up[pIdx].tendencia_semanal];
                                                        newTrend[dIdx].positivas = parseInt(e.target.value) || 0;
                                                        up[pIdx].tendencia_semanal = newTrend;
                                                        setProfiles(up);
                                                    }} className="h-7 w-20 bg-[#05080f] border-white/5 px-2 text-green-500" />
                                                </td>
                                                <td className="py-2">
                                                    <Input type="number" value={day.negativas} onChange={e => {
                                                        const up = [...profiles];
                                                        const pIdx = up.findIndex(pr => pr.id === 'kpi_notas');
                                                        const newTrend = [...up[pIdx].tendencia_semanal];
                                                        newTrend[dIdx].negativas = parseInt(e.target.value) || 0;
                                                        up[pIdx].tendencia_semanal = newTrend;
                                                        setProfiles(up);
                                                    }} className="h-7 w-20 bg-[#05080f] border-white/5 px-2 text-red-500" />
                                                </td>
                                                <td className="py-2 text-right text-slate-400 font-mono">
                                                    {day.notas - day.positivas - day.negativas}
                                                </td>
                                            </tr>
                                        ));
                                    })()}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* News Feed Section */}
                    <div>
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-yellow-500 font-black uppercase text-xs tracking-widest flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-yellow-500"></span> Feed de Noticias
                            </h3>
                            <Button size="sm" variant="ghost" className="text-[10px] uppercase font-black text-slate-400 hover:text-white" onClick={() => setFeed([{ medio: 'Medio', tiempo: new Date().toISOString(), texto: '', tipo: 'neutral' }, ...feed])}>
                                <FontAwesomeIcon icon={faPlus} className="mr-2" /> Agregar Noticia
                            </Button>
                        </div>
                        <div className="space-y-2">
                            {feed.map((post, idx) => (
                                <div key={idx} className="bg-white/5 p-3 rounded-xl flex gap-3 items-start border border-white/5">
                                    <div className="flex-1 space-y-2">
                                        <div className="flex gap-2">
                                            <Input value={post.medio} placeholder="Medio" onChange={(e) => {
                                                const news = [...feed];
                                                news[idx].medio = e.target.value;
                                                setFeed(news);
                                            }} className="bg-[#05080f] border-white/5 h-8 text-xs w-1/3" />
                                            <Input 
                                                type="datetime-local"
                                                value={post.tiempo && !isNaN(new Date(post.tiempo).getTime()) ? new Date(new Date(post.tiempo).getTime() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16) : ''} 
                                                onChange={(e) => {
                                                    const news = [...feed];
                                                    news[idx].tiempo = e.target.value;
                                                    setFeed(news);
                                                }} className="bg-[#05080f] border-white/5 h-8 text-xs w-1/3" />
                                            <select className="bg-[#05080f] border-white/5 h-8 text-xs rounded-md px-2 w-1/3" value={post.tipo} onChange={(e) => {
                                                const news = [...feed];
                                                news[idx].tipo = e.target.value;
                                                setFeed(news);
                                            }}>
                                                <option value="positivo">Positivo</option>
                                                <option value="neutral">Neutral</option>
                                                <option value="negativo">Negativo</option>
                                            </select>
                                        </div>
                                        <textarea className="w-full bg-[#05080f] border-white/5 rounded-md p-2 text-xs text-white focus:outline-none" value={post.texto} rows={2} onChange={(e) => {
                                            const news = [...feed];
                                            news[idx].texto = e.target.value;
                                            setFeed(news);
                                        }} />
                                    </div>
                                    <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-400 p-1 h-auto" onClick={() => setFeed(feed.filter((_, i) => i !== idx))}>
                                        <FontAwesomeIcon icon={faTrash} className="w-3 h-3" />
                                    </Button>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
      </AdminPopup>
    </div>
  );
}
