"use client";

import { Suspense, useState, useMemo, useEffect } from "react";
import dynamic from "next/dynamic";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/components/auth-provider";
import { canEdit } from "@/lib/auth/rbac";
import { PageHeader } from "@/components/page-header";
import { TopicTabs } from "@/components/topic-tabs";
import { AdminPopup } from "@/components/admin-popup";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const Globe = dynamic(() => import("@/components/globe").then((m) => m.GlobeComponent), {
  ssr: false,
  loading: () => (
    <div className="h-[420px] rounded-lg flex items-center justify-center well border border-[#1e2240]">
      <p className="text-muted-foreground text-sm">Cargando globo...</p>
    </div>
  ),
});

import {
  pageHeaders,
  testigosTabs,
  countriesData,
  topicData as mockTopicData,
} from "@/data/mock";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { 
    faGlobe, 
    faMapPin, 
    faEye, 
    faArrowTrendUp,
    faXmark,
    faRotate,
    faSave,
    faPlus,
    faTrash,
    faBrain
} from "@fortawesome/free-solid-svg-icons";

function TestigosOverview({ 
    kpis, 
    deptos, 
    misiones, 
    countriesData,
    isEditing, 
    setKpis, 
    setDeptos, 
    setMisiones 
}: { 
    kpis: any[], 
    deptos: any[], 
    misiones: any[], 
    countriesData: any[],
    isEditing: boolean, 
    setKpis: (k: any[]) => void, 
    setDeptos: (d: any[]) => void, 
    setMisiones: (m: any[]) => void 
}) {
  const [selected, setSelected] = useState<string | null>(null);
  
  const marker = useMemo(() => 
    misiones.find((m) => m.pais === selected), 
  [selected, misiones]);

  const maxDeptoCount = useMemo(() => 
    deptos.length > 0 ? Math.max(...deptos.map(d => d.count)) : 1,
  [deptos]);

  return (
    <div className="space-y-5 fade-in">
      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi, i) => (
          <div key={kpi.id} className="kpi-card p-4 flex flex-col gap-2 rounded-xl border-[#1e2240] shadow-none">
            <div className="flex items-center justify-between">
              {isEditing ? (
                  <Input value={kpi.label} onChange={e => {
                      const newK = [...kpis];
                      newK[i].label = e.target.value;
                      setKpis(newK);
                  }} className="h-4 bg-transparent border-none p-0 text-[10px] font-bold uppercase tracking-widest text-[#8892b0]" />
              ) : (
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest truncate min-w-0">{kpi.label}</span>
              )}
              {isEditing ? (
                  <Input value={kpi.delta || ''} onChange={e => {
                      const newK = [...kpis];
                      newK[i].delta = e.target.value;
                      setKpis(newK);
                  }} className="h-4 w-12 bg-transparent border-none p-0 text-[10px] font-bold text-green-400 text-right" />
              ) : (
                  kpi.delta && (
                    <span className="flex items-center gap-0.5 text-[10px] font-bold text-green-400">
                      <FontAwesomeIcon icon={faArrowTrendUp} className="w-2.5 h-2.5" />
                      {kpi.delta}
                    </span>
                  )
              )}
            </div>
            {isEditing ? (
                <Input value={kpi.value} onChange={e => {
                    const newK = [...kpis];
                    newK[i].value = e.target.value;
                    setKpis(newK);
                }} className="h-8 text-2xl font-bold text-[#0094ff] bg-white/5 border-[#2a2a4a]" />
            ) : (
                <div className="font-bold text-xl sm:text-2xl text-[#0094ff] truncate">{kpi.value}</div>
            )}
            <div className="h-1 w-full bg-[#131a30] rounded-full overflow-hidden mt-1">
              <div className="h-full bg-[#0094ff] rounded-full" style={{ width: `${kpi.progress}%` }}></div>
            </div>
          </div>
        ))}
      </div>

      {/* Globe Card */}
      <div className="kpi-card p-4 rounded-xl relative border-[#1e2240] shadow-none">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-sm font-semibold text-[#ffffff] flex items-center gap-2">
            <FontAwesomeIcon icon={faGlobe} className="text-[#0094ff]" />
            Globo Terráqueo — Narrativa por País
          </span>
        </div>
        <p className="text-[11px] text-muted-foreground mb-4">
          Misiones internacionales de observación acreditadas ante el Centro de Mando Digital LinkTIC. Arrastra para rotar, haz click para ver el detalle.
        </p>
        
        <div className="relative w-full h-[420px] well rounded-xl overflow-hidden border border-[#1e2240]">
          <Suspense fallback={<div className="h-full flex items-center justify-center">Cargando...</div>}>
            <Globe 
                className="h-full" 
                countriesData={countriesData}
                globeMarkers={misiones}
                onSelect={(id) => {
                    const found = misiones.find(m => m.pais.toLowerCase().includes(id.toLowerCase()));
                    if (found) setSelected(found.pais);
                }} 
                selectedCountryId={null} 
                selectedPlatform={null} 
                hideIntensity={true}
                title="Misiones Internacionales y Testigos"
                showDetails={false}
                mode="witnesses"
            />
          </Suspense>
          
          <div className="absolute bottom-3 left-3 flex items-center gap-4 text-[10px] pointer-events-none bg-black/40 px-3 py-1.5 rounded-full backdrop-blur-sm border border-[#1e2240]">
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-[#f3b116]"></div>
              <span className="text-muted-foreground font-medium">Colombia</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-[#0094ff]"></div>
              <span className="text-muted-foreground font-medium">Misión internacional</span>
            </div>
          </div>
          
          <div className="absolute top-3 right-3 text-[10px] text-muted-foreground pointer-events-none bg-[#10142a]/90 px-3 py-1.5 rounded-lg border border-[#1e2240] font-medium">
            Arrastra para rotar · Click en un marcador
          </div>

          {/* Overlay Detail Panel */}
          {marker && (
            <div className="absolute right-3 top-10 rounded-xl p-4 text-sm bg-[#10142a]/95 border border-[#0094ff]/40 min-w-[200px] max-w-[calc(100%-1.5rem)] z-20 shadow-2xl animate-in fade-in slide-in-from-right-4 duration-300">
                <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-yellow-500">{marker.pais}</span>
                    <button onClick={() => setSelected(null)} className="text-muted-foreground hover:text-white transition-colors">
                        <FontAwesomeIcon icon={faXmark} className="w-3 h-3" />
                    </button>
                </div>
                <div className="text-[10px] text-muted-foreground mb-1">{marker.ciudad}</div>
                <div className="text-[11px] font-bold text-[#0094ff]">{marker.tipo}</div>
                <div className="h-px bg-white/10 my-2"></div>
                <div className="text-[10px] mb-1">
                    <span className="text-muted-foreground">Observadores: </span>
                    <span className="font-bold text-[#e4e9f5]">{marker.count}</span>
                </div>
                <div className="text-[10px] mb-1">
                    <span className="text-muted-foreground">Narrativa: </span>
                    <span className="text-[#c0c8de]">{marker.narrativa}</span>
                </div>
                <div className="text-[10px]">
                    <span className="text-muted-foreground">Tendencia: </span>
                    <span className="font-bold text-green-400">{marker.tendencia} ↔</span>
                </div>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Department Progress */}
        <div className="kpi-card p-4 rounded-xl border-[#1e2240] shadow-none">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
                <FontAwesomeIcon icon={faMapPin} className="text-[#0094ff] w-3.5 h-3.5" />
                <h3 className="text-sm font-semibold text-[#ffffff]">Testigos por Departamento</h3>
            </div>
            {isEditing && (
                <Button size="sm" variant="ghost" onClick={() => setDeptos([...deptos, { depto: 'Nuevo', count: 0 }])} className="h-6 text-[10px] font-bold text-[#75ddff]">
                    <FontAwesomeIcon icon={faPlus} className="mr-1" /> Agregar
                </Button>
            )}
          </div>
          <div className="space-y-4">
            {deptos.map((d, i) => (
              <div key={i} className="space-y-1 group">
                <div className="flex justify-between items-center text-[11px] font-medium">
                  <div className="flex items-center gap-2 flex-1">
                      {isEditing ? (
                          <Input value={d.depto} onChange={e => {
                              const newD = [...deptos];
                              newD[i].depto = e.target.value;
                              setDeptos(newD);
                          }} className="h-6 text-[10px] bg-white/5 border-[#2a2a4a] p-1 flex-1" />
                      ) : (
                          <span className="text-muted-foreground">{d.depto}</span>
                      )}
                  </div>
                  <div className="flex items-center gap-2">
                      {isEditing ? (
                          <Input type="number" value={d.count} onChange={e => {
                              const newD = [...deptos];
                              newD[i].count = parseInt(e.target.value);
                              setDeptos(newD);
                          }} className="h-6 w-16 text-[10px] bg-white/5 border-[#2a2a4a] p-1 text-right" />
                      ) : (
                          <span className="text-[#e4e9f5]">{d.count.toLocaleString()}</span>
                      )}
                      {isEditing && (
                          <Button variant="ghost" size="sm" onClick={() => setDeptos(deptos.filter((_, idx) => idx !== i))} className="h-6 w-6 p-0 text-red-500 opacity-0 group-hover:opacity-100">
                              <FontAwesomeIcon icon={faTrash} className="w-2.5 h-2.5" />
                          </Button>
                      )}
                  </div>
                </div>
                <div className="h-1 w-full bg-[#131a30] rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-[#0094ff] rounded-full" 
                    style={{ width: `${(d.count / maxDeptoCount) * 100}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Missions List */}
        <div className="kpi-card p-4 rounded-xl flex flex-col border-[#1e2240] shadow-none">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
                <FontAwesomeIcon icon={faEye} className="text-yellow-500 w-3.5 h-3.5" />
                <h3 className="text-sm font-semibold text-[#ffffff]">Misiones por País</h3>
            </div>
            {isEditing && (
                <Button size="sm" variant="ghost" onClick={() => setMisiones([...misiones, { pais: 'Nuevo', ciudad: 'Ciudad', tipo: 'Misión', count: 0, narrativa: '', tendencia: 'Estable' }])} className="h-6 text-[10px] font-bold text-[#75ddff]">
                    <FontAwesomeIcon icon={faPlus} className="mr-1" /> Agregar
                </Button>
            )}
          </div>
          <div className="space-y-2 overflow-y-auto pr-2 custom-scrollbar max-h-[280px]">
            {misiones.map((m, i) => (
              <div 
                key={i} 
                onClick={() => setSelected(m.pais)}
                className={`flex items-center justify-between py-1.5 px-2 border-b border-[#1e2240] last:border-0 cursor-pointer transition-colors rounded-lg group ${selected === m.pais ? 'bg-[#0094ff]/10' : 'hover:bg-white/5'}`}
              >
                <div className="flex-1">
                  {isEditing ? (
                      <Input value={m.pais} onChange={e => {
                          const newM = [...misiones];
                          newM[i].pais = e.target.value;
                          setMisiones(newM);
                      }} className="h-6 text-sm font-bold bg-transparent border-[#2a2a4a] w-32" />
                  ) : (
                      <div className="text-sm font-bold text-[#e4e9f5]">{m.pais}</div>
                  )}
                  {isEditing ? (
                      <Input value={m.ciudad} onChange={e => {
                          const newM = [...misiones];
                          newM[i].ciudad = e.target.value;
                          setMisiones(newM);
                      }} className="h-5 text-[10px] bg-transparent border-[#2a2a4a] w-24 mt-1" />
                  ) : (
                      <div className="text-[10px] text-muted-foreground">{m.ciudad}</div>
                  )}
                </div>
                <div className="text-right flex items-center gap-3">
                  <div>
                    {isEditing ? (
                        <Input value={m.tipo} onChange={e => {
                            const newM = [...misiones];
                            newM[i].tipo = e.target.value;
                            setMisiones(newM);
                        }} className="h-5 text-[11px] font-bold text-[#0094ff] bg-transparent border-[#2a2a4a] w-24 text-right" />
                    ) : (
                        <div className="text-[11px] font-bold text-[#0094ff]">{m.tipo}</div>
                    )}
                    {isEditing ? (
                        <Input type="number" value={m.count} onChange={e => {
                            const newM = [...misiones];
                            newM[i].count = parseInt(e.target.value);
                            setMisiones(newM);
                        }} className="h-5 text-[10px] bg-transparent border-[#2a2a4a] w-16 text-right mt-1" />
                    ) : (
                        <div className="text-[10px] text-muted-foreground font-bold tracking-tight">{m.count} obs.</div>
                    )}
                  </div>
                  {isEditing && (
                      <Button variant="ghost" size="sm" onClick={(e) => {
                          e.stopPropagation();
                          setMisiones(misiones.filter((_, idx) => idx !== i));
                      }} className="h-8 w-8 p-0 text-red-500 opacity-0 group-hover:opacity-100">
                          <FontAwesomeIcon icon={faTrash} className="w-3 h-3" />
                      </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function TestigosPage() {
  const h = pageHeaders.testigos;
  const { role } = useAuth();
  const [strategy, setStrategy] = useState<any>(mockTopicData.testigos);
  const [kpis, setKpis] = useState<any[]>([]);
  const [deptos, setDeptos] = useState<any[]>([]);
  const [misiones, setMisiones] = useState<any[]>([]);
  const [countriesDataLive, setCountriesDataLive] = useState<any[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchTestigosData = async () => {
    setLoading(true);
    const { data: sData } = await supabase.from('testigos_estrategia').select('*').eq('id', 'main').single();
    const { data: kData } = await supabase.from('testigos_kpis').select('*').order('id');
    const { data: dData } = await supabase.from('testigos_departamentos').select('*').order('count', { ascending: false });
    const { data: mData } = await supabase.from('testigos_misiones').select('*').order('count', { ascending: false });
    const { data: cData } = await supabase.from('mapa_paises').select('*');

    if (sData) setStrategy(sData);
    if (kData) setKpis(kData);
    if (dData) setDeptos(dData);
    if (mData) setMisiones(mData);
    if (cData) setCountriesDataLive(cData);
    setLoading(false);
  };

  useEffect(() => {
    fetchTestigosData();
  }, []);

  const saveTestigosData = async () => {
      try {
          await supabase.from('testigos_estrategia').upsert({ id: 'main', ...strategy });
          
          for (const k of kpis) {
              await supabase.from('testigos_kpis').upsert(k);
          }

          await supabase.from('testigos_departamentos').delete().neq('id', 0);
          if (deptos.length > 0) {
              await supabase.from('testigos_departamentos').insert(deptos.map(({ id, ...rest }) => rest));
          }

          await supabase.from('testigos_misiones').delete().neq('id', 0);
          if (misiones.length > 0) {
              await supabase.from('testigos_misiones').insert(misiones.map(({ id, ...rest }) => rest));
          }

          alert("¡Cambios en Testigos guardados con éxito!");
          setIsEditing(false);
          fetchTestigosData();
      } catch (err) {
          console.error(err);
          alert("Error al guardar los datos.");
      }
  };

  if (loading) return <div className="h-screen page-bg text-white flex justify-center items-center font-mono tracking-widest uppercase animate-pulse">Cargando Testigos...</div>;

  return (
    <div className="p-6 page-bg text-white">
      <div className="flex justify-between items-start">
        <PageHeader badges={h.badges} title={h.title} description={h.description} />
        <div className="flex gap-2">
            {canEdit(role) && (
                !isEditing ? (
                    <Button variant="outline" size="sm" onClick={() => setIsEditing(true)} className="bg-[#0094ff]/10 text-[#75ddff] border-[#0094ff]/20 hover:bg-[#0094ff] hover:text-white transition-all">
                        <FontAwesomeIcon icon={faRotate} className="mr-2" /> Modo Edición
                    </Button>
                ) : (
                    <div className="flex gap-2 animate-in fade-in zoom-in duration-300">
                        <Button variant="outline" size="sm" onClick={() => setIsEditing(false)} className="text-[#aab3cf] hover:text-white">
                            Cancelar
                        </Button>
                        <Button variant="default" size="sm" onClick={saveTestigosData} className="bg-green-600 hover:bg-green-700 text-white font-bold px-4">
                            <FontAwesomeIcon icon={faSave} className="mr-2" /> Guardar Todo
                        </Button>
                    </div>
                )
            )}
            <Button variant="outline" size="sm" onClick={fetchTestigosData} className="panel border-[#2a2a4a] text-white">
                <FontAwesomeIcon icon={faRotate} className={`mr-2 ${loading ? 'animate-spin' : ''}`}/>
            </Button>
        </div>
      </div>
      <div className="mt-6">
        <TopicTabs
            tabs={testigosTabs}
            overviewContent={
                <TestigosOverview 
                    kpis={kpis} 
                    deptos={deptos} 
                    misiones={misiones} 
                    countriesData={countriesDataLive}
                    isEditing={isEditing} 
                    setKpis={setKpis}
                    setDeptos={setDeptos}
                    setMisiones={setMisiones}
                />
            }
            narrativa={strategy.narrativa}
            pilares={strategy.pilares}
            noticias={strategy.noticias}
            contenido={strategy.contenido}
            conversacion={strategy.conversacion}
            pauta={strategy.pauta}
            isEditing={isEditing}
            strategy={strategy}
            setStrategy={setStrategy}
        />
      </div>

      <AdminPopup title="Estratega: Testigos Electorales" hideTrigger={true}>
          <div className="space-y-6">
              <div className="flex justify-between items-center panel-soft p-4 rounded-xl border border-[#1e2240]">
                <div>
                    <h3 className="font-bold text-[#75ddff]">Panel Estratégico</h3>
                    <p className="text-xs text-[#aab3cf]">Configura las misiones internacionales y metas regionales.</p>
                </div>
                <Button variant="neon" className="font-bold" onClick={saveTestigosData}>
                    <FontAwesomeIcon icon={faSave} className="mr-2" /> Guardar Todo
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-white/5 p-4 rounded-xl border border-[#1e2240]">
                      <h4 className="text-xs font-black text-[#8892b0] uppercase tracking-widest mb-4">Metas por Departamento</h4>
                      <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                          {deptos.map((d, i) => (
                              <div key={i} className="flex gap-2 items-center">
                                  <Input value={d.depto} onChange={e => {
                                      const newD = [...deptos];
                                      newD[i].depto = e.target.value;
                                      setDeptos(newD);
                                  }} className="h-8 text-xs bg-black/20 border-[#1e2240]" />
                                  <Input type="number" value={d.count} onChange={e => {
                                      const newD = [...deptos];
                                      newD[i].count = parseInt(e.target.value);
                                      setDeptos(newD);
                                  }} className="h-8 text-xs bg-black/20 border-[#1e2240] w-24 text-right" />
                              </div>
                          ))}
                      </div>
                  </div>

                  <div className="bg-white/5 p-4 rounded-xl border border-[#1e2240]">
                      <h4 className="text-xs font-black text-[#8892b0] uppercase tracking-widest mb-4">Detalle de Misiones</h4>
                      <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                          {misiones.map((m, i) => (
                              <div key={i} className="p-3 bg-black/20 rounded-lg space-y-2">
                                  <div className="flex gap-2">
                                      <Input value={m.pais} placeholder="País" onChange={e => {
                                          const newM = [...misiones];
                                          newM[i].pais = e.target.value;
                                          setMisiones(newM);
                                      }} className="h-7 text-[10px] bg-transparent border-[#2a2a4a]" />
                                      <Input value={m.tipo} placeholder="Tipo" onChange={e => {
                                          const newM = [...misiones];
                                          newM[i].tipo = e.target.value;
                                          setMisiones(newM);
                                      }} className="h-7 text-[10px] bg-transparent border-[#2a2a4a]" />
                                  </div>
                                  <textarea 
                                    value={m.narrativa} 
                                    placeholder="Narrativa de la misión"
                                    onChange={e => {
                                        const newM = [...misiones];
                                        newM[i].narrativa = e.target.value;
                                        setMisiones(newM);
                                    }}
                                    className="w-full bg-transparent border border-[#2a2a4a] rounded p-2 text-[10px] text-[#c0c8de] h-16 resize-none"
                                  />
                              </div>
                          ))}
                      </div>
                  </div>
              </div>

              <div>
                  <div className="flex justify-between items-center mb-4">
                    <h4 className="text-xs font-black text-[#8892b0] uppercase tracking-widest">Estado de la Red Global</h4>
                    <span className="text-[10px] text-[#75ddff] bg-[#75ddff]/10 px-2 py-0.5 rounded-full"><FontAwesomeIcon icon={faBrain} className="mr-1" /> IA Insights</span>
                  </div>
                  <div className="bg-[#0094ff]/5 border border-[#0094ff]/20 p-4 rounded-2xl">
                      <p className="text-xs text-[#75ddff] leading-relaxed">
                          La red de misiones internacionales está al 92% de su capacidad histórica. Se recomienda reforzar la narrativa de transparencia en los países del bloque UE para consolidar el respaldo técnico antes de la auditoría final.
                      </p>
                  </div>
              </div>
          </div>
      </AdminPopup>
    </div>
  );
}
