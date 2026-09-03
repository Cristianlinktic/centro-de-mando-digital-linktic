"use client";

import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { newsCategoryColors, narrativeTypeColors, socialUrls } from "@/data/mock";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faFileLines, faArrowUpRightFromSquare, faClock, faHashtag, faZap, faBullseye, faGlobe, faPlus, faTrash, faSave } from "@fortawesome/free-solid-svg-icons";
import { faInstagram, faFacebook, faXTwitter, faTiktok } from "@fortawesome/free-brands-svg-icons";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const platformInfo: Record<string, { icon: any; color: string; label: string }> = {
  instagram: { icon: faInstagram, color: "rgb(225, 48, 108)", label: "Instagram" },
  facebook: { icon: faFacebook, color: "rgb(24, 119, 242)", label: "Facebook" },
  x: { icon: faXTwitter, color: "rgb(255, 255, 255)", label: "X (Twitter)" },
  tiktok: { icon: faTiktok, color: "rgb(105, 201, 208)", label: "TikTok" },
};

interface NarrativaData {
  gancho: string;
  tipoConversacion: string;
  mensajeClave: string;
  arco: { fase: string; mensaje: string; tipo: string }[];
}

interface PilarItem {
  pilar: string;
  descripcion: string;
  icono: string;
  color: string;
}

interface NoticiaItem {
  titulo: string;
  medio: string;
  fecha: string;
  url: string;
  categoria: string;
}

interface ContenidoSet {
  instagram: { formato: string; idea: string; tipo: string }[];
  facebook: { formato: string; idea: string; tipo: string }[];
  x: { formato: string; idea: string; tipo: string }[];
  tiktok: { formato: string; idea: string; tipo: string }[];
}

interface ConversacionPlatform {
  menciones: number;
  sentimiento: number;
  topHashtags: string[];
  volumePeak: string;
}

interface ConversacionSet {
  instagram: ConversacionPlatform;
  facebook: ConversacionPlatform;
  x: ConversacionPlatform;
  tiktok: ConversacionPlatform;
}

interface PautaItem {
  formato: string;
  objetivo: string;
  plataforma: string[];
  cta: string;
  segmento: string;
  presupuesto: string;
}

interface TabData {
  key: string;
  label: string;
}

interface TopicTabsProps {
  tabs: TabData[];
  overviewContent: React.ReactNode;
  narrativa: NarrativaData;
  pilares: PilarItem[];
  noticias: NoticiaItem[];
  contenido: ContenidoSet;
  conversacion: ConversacionSet;
  pauta: PautaItem[];
  isEditing?: boolean;
  strategy?: any;
  setStrategy?: (s: any) => void;
}

export function TopicTabs({
  tabs,
  overviewContent,
  narrativa,
  pilares,
  noticias,
  contenido,
  conversacion,
  pauta,
  isEditing = false,
  strategy,
  setStrategy
}: TopicTabsProps) {
  const [localHashtags, setLocalHashtags] = useState<Record<string, string>>({});

  useEffect(() => {
    if (conversacion) {
      const initial: Record<string, string> = {};
      Object.entries(conversacion).forEach(([plat, data]) => {
        initial[plat] = (data.topHashtags || []).join(', ');
      });
      setLocalHashtags(initial);
    }
  }, [conversacion]);

  return (
    <Tabs defaultValue="overview" className="mt-6">
      <TabsList className="flex flex-wrap h-auto gap-1 bg-muted/50 p-1">
        {tabs.map((t: TabData) => (
          <TabsTrigger key={t.key} value={t.key} className="text-xs">
            {t.label}
          </TabsTrigger>
        ))}
      </TabsList>

      <TabsContent value="overview" className="mt-4">
        {overviewContent}
      </TabsContent>

      <TabsContent value="narrativa" className="mt-4 space-y-5 fade-in">
        {/* Gancho Narrativo */}
        <div className="rounded-xl p-5" style={{ background: "linear-gradient(135deg, rgba(18, 112, 226, 0.15), rgba(243, 177, 22, 0.08))", border: "1px solid rgba(18, 112, 226, 0.3)" }}>
          <div className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: "rgb(43, 130, 238)" }}>Gancho narrativo</div>
          {isEditing && setStrategy && strategy ? (
            <textarea 
                value={strategy.narrativa.gancho} 
                onChange={e => setStrategy({...strategy, narrativa: {...strategy.narrativa, gancho: e.target.value}})}
                className="w-full bg-black/40 border border-blue-500/30 rounded-lg p-3 text-sm text-white min-h-[80px] outline-none focus:border-blue-500 transition-colors"
                placeholder="Escribe el gancho narrativo..."
            />
          ) : (
            <p className="text-base font-medium leading-relaxed">{narrativa.gancho}</p>
          )}
        </div>

        {/* Info Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="kpi-card p-4">
            <div className="text-xs font-bold uppercase tracking-widest mb-2 text-muted-foreground">Tipo de conversación</div>
            {isEditing && setStrategy && strategy ? (
                <Input 
                    value={strategy.narrativa.tipoConversacion} 
                    onChange={e => setStrategy({...strategy, narrativa: {...strategy.narrativa, tipoConversacion: e.target.value}})}
                    className="bg-white/5 border-white/10 text-blue-400 font-medium"
                />
            ) : (
                <div className="flex flex-wrap gap-2 mt-2">
                {narrativa.tipoConversacion.split(" + ").map((t: string) => (
                    <span key={t} className="px-3 py-1 rounded-full text-xs font-medium bg-white/5" style={{ color: "rgb(43, 130, 238)" }}>
                    {t}
                    </span>
                ))}
                </div>
            )}
          </div>
          <div className="kpi-card p-4">
            <div className="text-xs font-bold uppercase tracking-widest mb-2 text-muted-foreground">Mensaje clave</div>
            {isEditing && setStrategy && strategy ? (
                <textarea 
                    value={strategy.narrativa.mensajeClave} 
                    onChange={e => setStrategy({...strategy, narrativa: {...strategy.narrativa, mensajeClave: e.target.value}})}
                    className="w-full bg-white/5 border border-white/10 rounded-lg p-2 text-sm text-yellow-500 min-h-[60px] outline-none"
                />
            ) : (
                <p className="text-sm leading-relaxed" style={{ color: "rgb(243, 177, 22)" }}>
                    &ldquo;{narrativa.mensajeClave}&rdquo;
                </p>
            )}
          </div>
        </div>

        {/* Arco Narrativo */}
        <div className="kpi-card p-4">
          <div className="text-sm font-semibold mb-4">Arco narrativo recomendado</div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {(isEditing && strategy ? strategy.narrativa.arco : narrativa.arco).map((a: any, i: number) => (
              <div 
                key={i} 
                className="p-3 rounded-lg relative overflow-hidden bg-[rgb(21,27,40)] border-l-[3px]"
                style={{ borderColor: (narrativeTypeColors as any)[a.tipo] || "rgb(43, 130, 238)" }}
              >
                <div className="flex items-center gap-2 mb-1">
                    <div className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold" style={{ color: narrativeTypeColors[a.tipo] || "rgb(43, 130, 238)" }}>
                        {i + 1}
                    </div>
                    {isEditing && setStrategy && strategy ? (
                        <Input 
                            value={a.fase} 
                            onChange={e => {
                                const newArco = [...strategy.narrativa.arco];
                                newArco[i].fase = e.target.value;
                                setStrategy({...strategy, narrativa: {...strategy.narrativa, arco: newArco}});
                            }}
                            className="h-6 text-[10px] font-bold bg-transparent border-none p-0 focus-visible:ring-0" 
                        />
                    ) : (
                        <span className="text-xs font-bold" style={{ color: narrativeTypeColors[a.tipo] || "rgb(43, 130, 238)" }}>
                            {a.fase}
                        </span>
                    )}
                </div>
                {isEditing && setStrategy && strategy ? (
                    <textarea 
                        value={a.mensaje} 
                        onChange={e => {
                            const newArco = [...strategy.narrativa.arco];
                            newArco[i].mensaje = e.target.value;
                            setStrategy({...strategy, narrativa: {...strategy.narrativa, arco: newArco}});
                        }}
                        className="w-full bg-transparent border-none p-0 text-[10px] text-muted-foreground outline-none resize-none min-h-[40px]"
                    />
                ) : (
                    <p className="text-xs text-muted-foreground">{a.mensaje}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      </TabsContent>

      <TabsContent value="pilares" className="mt-4 space-y-4 fade-in">
        <div className="flex justify-between items-center mb-2">
            <div className="text-sm text-muted-foreground">
                Pilares estratégicos que deben guiar toda la producción de contenido para este tema.
            </div>
            {isEditing && setStrategy && strategy && (
                <Button size="sm" variant="outline" onClick={() => setStrategy({...strategy, pilares: [...strategy.pilares, { pilar: 'Nuevo Pilar', descripcion: 'Descripción del pilar estratégico.', icono: '📌', color: 'hsl(213,85%,55%)' }]})} className="h-7 text-[10px] font-black uppercase text-blue-400 border-blue-500/20">
                    <FontAwesomeIcon icon={faPlus} className="mr-1" /> Añadir Pilar
                </Button>
            )}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {(isEditing && strategy ? strategy.pilares : pilares).map((p: any, i: number) => (
            <div 
                key={i} 
                className="kpi-card p-5 flex flex-col gap-3 hover:scale-[1.02] transition-transform cursor-default rounded-xl relative group"
            >
                {isEditing && setStrategy && strategy && (
                    <Button variant="ghost" size="sm" onClick={() => setStrategy({...strategy, pilares: strategy.pilares.filter((_:any, idx:number) => idx !== i)})} className="absolute top-2 right-2 h-6 w-6 p-0 text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">
                        <FontAwesomeIcon icon={faTrash} className="w-2.5 h-2.5" />
                    </Button>
                )}
                {isEditing && setStrategy && strategy ? (
                    <Input value={p.icono} onChange={e => {
                        const newP = [...strategy.pilares];
                        newP[i].icono = e.target.value;
                        setStrategy({...strategy, pilares: newP});
                    }} className="h-8 w-16 text-3xl bg-transparent border-white/10 p-0 text-center" />
                ) : (
                    <div className="text-3xl">{p.icono}</div>
                )}
                <div>
                    {isEditing && setStrategy && strategy ? (
                        <>
                            <Input value={p.pilar} onChange={e => {
                                const newP = [...strategy.pilares];
                                newP[i].pilar = e.target.value;
                                setStrategy({...strategy, pilares: newP});
                            }} className="h-7 text-sm font-bold mb-1 bg-white/5 border-white/10" style={{ color: p.color }} />
                            <textarea value={p.descripcion} onChange={e => {
                                const newP = [...strategy.pilares];
                                newP[i].descripcion = e.target.value;
                                setStrategy({...strategy, pilares: newP});
                            }} className="w-full bg-transparent border-none p-0 text-xs text-muted-foreground outline-none resize-none min-h-[40px]" />
                        </>
                    ) : (
                        <>
                            <div className="font-bold text-sm mb-1" style={{ color: p.color }}>
                                {p.pilar}
                            </div>
                            <p className="text-xs text-muted-foreground leading-relaxed">
                                {p.descripcion}
                            </p>
                        </>
                    )}
                </div>
                <div className="w-full h-1 mt-auto rounded-full bg-slate-800/50 overflow-hidden">
                    <div 
                        className="h-full rounded-full transition-all duration-1000" 
                        style={{ 
                            width: `${70 + i * 5}%`, 
                            backgroundColor: p.color 
                        }}
                    />
                </div>
            </div>
          ))}
        </div>
      </TabsContent>

      <TabsContent value="noticias" className="mt-4 space-y-3 fade-in">
        <div className="flex justify-between items-center mb-2">
            <div className="text-sm text-muted-foreground">
                Noticias recientes relevantes para este tema en medios de comunicación colombianos.
            </div>
            {isEditing && setStrategy && strategy && (
                <Button size="sm" variant="outline" onClick={() => setStrategy({...strategy, noticias: [{ medio: 'Medio', titulo: 'Nueva Noticia', fecha: 'Hoy', categoria: 'Debate', url: '#' }, ...strategy.noticias]})} className="h-7 text-[10px] font-black uppercase text-blue-400 border-blue-500/20">
                    <FontAwesomeIcon icon={faPlus} className="mr-1" /> Añadir Noticia
                </Button>
            )}
        </div>
        {(isEditing && strategy ? strategy.noticias : noticias).map((n: any, i: number) => (
          <div 
            key={i} 
            className="kpi-card p-4 flex items-start gap-3 group rounded-xl"
          >
            <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 bg-white/5">
                <FontAwesomeIcon 
                    icon={faFileLines} 
                    className="w-3.5 h-3.5" 
                    style={{ color: newsCategoryColors[n.categoria] || "rgb(43, 130, 238)" }} 
                />
            </div>
            <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                    {isEditing && setStrategy && strategy ? (
                        <div className="w-full space-y-2">
                            <Input 
                                value={n.titulo} 
                                onChange={e => {
                                    const news = [...strategy.noticias];
                                    news[i].titulo = e.target.value;
                                    setStrategy({...strategy, noticias: news});
                                }}
                                className="h-8 text-sm font-medium bg-white/5 border-white/10"
                            />
                            <div className="flex gap-2">
                                <Input 
                                    value={n.medio} 
                                    onChange={e => {
                                        const news = [...strategy.noticias];
                                        news[i].medio = e.target.value;
                                        setStrategy({...strategy, noticias: news});
                                    }}
                                    className="h-6 text-[10px] w-1/3 bg-white/5 border-white/10"
                                />
                                <Input 
                                    value={n.fecha} 
                                    onChange={e => {
                                        const news = [...strategy.noticias];
                                        news[i].fecha = e.target.value;
                                        setStrategy({...strategy, noticias: news});
                                    }}
                                    className="h-6 text-[10px] w-1/3 bg-white/5 border-white/10"
                                />
                                <Input 
                                    value={n.categoria} 
                                    onChange={e => {
                                        const news = [...strategy.noticias];
                                        news[i].categoria = e.target.value;
                                        setStrategy({...strategy, noticias: news});
                                    }}
                                    className="h-6 text-[10px] w-1/3 bg-white/5 border-white/10"
                                />
                            </div>
                        </div>
                    ) : (
                        <h4 className="text-sm font-medium leading-snug group-hover:text-primary transition-colors">
                            {n.titulo}
                        </h4>
                    )}
                    {!isEditing && (
                        <FontAwesomeIcon 
                            icon={faArrowUpRightFromSquare} 
                            className="w-3 h-3 text-muted-foreground shrink-0 mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity" 
                        />
                    )}
                    {isEditing && setStrategy && strategy && (
                        <Button variant="ghost" size="sm" onClick={() => setStrategy({...strategy, noticias: strategy.noticias.filter((_:any, idx:number) => idx !== i)})} className="h-8 w-8 p-0 text-red-500">
                             <FontAwesomeIcon icon={faTrash} className="w-3 h-3" />
                        </Button>
                    )}
                </div>
                {!isEditing && (
                    <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                        <span 
                            className="text-xs font-semibold" 
                            style={{ color: newsCategoryColors[n.categoria] || "rgb(43, 130, 238)" }}
                        >
                            {n.medio}
                        </span>
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <FontAwesomeIcon icon={faClock} className="w-2.5 h-2.5" />
                            {n.fecha}
                        </span>
                        <span 
                            className="px-2 py-0.5 rounded-full text-[10px] font-bold" 
                            style={{ 
                                color: newsCategoryColors[n.categoria] || "rgb(43, 130, 238)",
                                background: "rgba(255,255,255,0.03)"
                            }}
                        >
                            {n.categoria}
                        </span>
                    </div>
                )}
            </div>
          </div>
        ))}
      </TabsContent>

      <TabsContent value="contenido" className="mt-4 space-y-8 fade-in">
        <div className="text-sm text-muted-foreground">
            Ideas de contenido orgánico por plataforma para las cuentas de LinkTIC.
        </div>
        {(["instagram", "facebook", "x", "tiktok"] as const).map((plat) => {
            const info = platformInfo[plat];
            const platformContent = (isEditing && strategy ? strategy.contenido[plat] : contenido[plat]) || [];

            return (
                <div key={plat} className="space-y-4">
                    <div className="kpi-card p-4 rounded-xl flex items-center justify-between border-white/5">
                        <div className="flex items-center gap-2">
                            <div 
                                className="w-8 h-8 rounded-lg flex items-center justify-center bg-white/5" 
                                style={{ color: info.color }}
                            >
                                <FontAwesomeIcon icon={info.icon} className="text-base" />
                            </div>
                            <div>
                                <div className="font-semibold text-sm text-slate-200">{info.label}</div>
                            </div>
                        </div>
                        {isEditing && setStrategy && strategy && (
                            <Button size="sm" variant="ghost" onClick={() => {
                                const newContenido = {...strategy.contenido};
                                newContenido[plat] = [{ formato: 'NUEVO', idea: 'Escribe tu idea...', tipo: 'Orgánico' }, ...(newContenido[plat] || [])];
                                setStrategy({...strategy, contenido: newContenido});
                            }} className="h-7 text-[10px] font-black uppercase text-blue-400">
                                <FontAwesomeIcon icon={faPlus} className="mr-1" /> Añadir Idea
                            </Button>
                        )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {platformContent.map((c: any, i: number) => (
                            <div 
                                key={i} 
                                className="p-3 rounded-lg bg-[rgb(21,27,40)] border-l-2 relative group"
                                style={{ borderLeftColor: info.color === "rgb(255, 255, 255)" ? "rgba(255,255,255,0.2)" : info.color.replace(")", ", 0.25)") }}
                            >
                                {isEditing && setStrategy && strategy && (
                                    <Button variant="ghost" size="sm" onClick={() => {
                                        const newContenido = {...strategy.contenido};
                                        newContenido[plat] = newContenido[plat].filter((_: any, idx: number) => idx !== i);
                                        setStrategy({...strategy, contenido: newContenido});
                                    }} className="absolute top-1 right-1 h-6 w-6 p-0 text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <FontAwesomeIcon icon={faTrash} className="w-2.5 h-2.5" />
                                    </Button>
                                )}
                                <div className="flex items-center gap-2 mb-2">
                                    {isEditing && setStrategy && strategy ? (
                                        <>
                                            <Input 
                                                value={c.formato} 
                                                onChange={e => {
                                                    const newContenido = {...strategy.contenido};
                                                    newContenido[plat][i].formato = e.target.value;
                                                    setStrategy({...strategy, contenido: newContenido});
                                                }}
                                                className="h-6 text-[10px] font-bold w-20 bg-white/5 border-white/10"
                                            />
                                            <Input 
                                                value={c.tipo} 
                                                onChange={e => {
                                                    const newContenido = {...strategy.contenido};
                                                    newContenido[plat][i].tipo = e.target.value;
                                                    setStrategy({...strategy, contenido: newContenido});
                                                }}
                                                className="h-6 text-[10px] font-bold w-20 bg-white/5 border-white/10"
                                            />
                                        </>
                                    ) : (
                                        <>
                                            <span className="px-2 py-0.5 rounded text-[10px] font-bold" style={{ background: info.color.replace("rgb", "rgba").replace(")", ", 0.125)"), color: info.color }}>{c.formato}</span>
                                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-white/5 text-slate-500">{c.tipo}</span>
                                        </>
                                    )}
                                </div>
                                {isEditing && setStrategy && strategy ? (
                                    <textarea 
                                        value={c.idea} 
                                        onChange={e => {
                                            const newContenido = {...strategy.contenido};
                                            newContenido[plat][i].idea = e.target.value;
                                            setStrategy({...strategy, contenido: newContenido});
                                        }}
                                        className="w-full bg-transparent border-none p-0 text-xs text-slate-300 font-medium outline-none resize-none min-h-[40px]"
                                    />
                                ) : (
                                    <p className="text-xs leading-relaxed text-slate-300 font-medium">{c.idea}</p>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            );
        })}
      </TabsContent>

      <TabsContent value="conversacion" className="mt-4 space-y-4 fade-in">
        <div className="text-sm text-muted-foreground">
            Análisis de la conversación en redes sociales sobre este tema en las últimas 4 semanas.
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {(["instagram", "facebook", "x", "tiktok"] as const).map((plat) => {
            const d = (isEditing && strategy ? strategy.conversacion : conversacion)[plat];
            const info = platformInfo[plat];
            const url = (socialUrls as any)[plat];
            
            return (
              <div key={plat} className="kpi-card p-4 space-y-3 rounded-xl border-white/5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FontAwesomeIcon icon={info.icon} style={{ color: info.color }} className="text-lg" />
                    <span className="font-semibold text-sm text-slate-200">{info.label}</span>
                  </div>
                  {!isEditing && (
                      <a href={url} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary transition-colors">
                        <FontAwesomeIcon icon={faArrowUpRightFromSquare} className="w-3.5 h-3.5" />
                      </a>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="p-2.5 rounded-lg text-center bg-[rgb(21,27,40)]">
                    {isEditing && setStrategy && strategy ? (
                        <input 
                            type="number"
                            value={d.menciones} 
                            onChange={e => {
                                const newConv = {...strategy.conversacion};
                                newConv[plat].menciones = parseInt(e.target.value) || 0;
                                setStrategy({...strategy, conversacion: newConv});
                            }}
                            className="w-full text-center text-lg font-bold bg-transparent border-none outline-none"
                            style={{ color: info.color }}
                        />
                    ) : (
                        <div className="text-lg font-bold" style={{ color: info.color }}>
                            {d.menciones.toLocaleString()}
                        </div>
                    )}
                    <div className="text-[10px] text-muted-foreground uppercase font-bold tracking-tight">Menciones</div>
                  </div>
                  <div className="p-2.5 rounded-lg text-center bg-[rgb(21,27,40)]">
                    {isEditing && setStrategy && strategy ? (
                        <input 
                            type="number"
                            min={0} max={100}
                            value={d.sentimiento} 
                            onChange={e => {
                                const newConv = {...strategy.conversacion};
                                newConv[plat].sentimiento = parseInt(e.target.value) || 0;
                                setStrategy({...strategy, conversacion: newConv});
                            }}
                            className="w-full text-center text-lg font-bold text-[#f3b116] bg-transparent border-none outline-none"
                        />
                    ) : (
                        <div className="text-lg font-bold text-[#f3b116]">
                            {d.sentimiento}%
                        </div>
                    )}
                    <div className="text-[10px] text-muted-foreground uppercase font-bold tracking-tight">Sentimiento +</div>
                  </div>
                </div>

                <div>
                  <div className="text-[10px] font-bold text-muted-foreground mb-1.5 uppercase tracking-wider">Top Hashtags</div>
                  {isEditing && setStrategy && strategy ? (
                      <textarea
                          value={localHashtags[plat] ?? ''}
                          onChange={e => {
                              setLocalHashtags({ ...localHashtags, [plat]: e.target.value });
                          }}
                          onBlur={() => {
                              const newConv = {...strategy.conversacion};
                              newConv[plat].topHashtags = (localHashtags[plat] || '').split(',').map((h: string) => h.trim()).filter(Boolean);
                              setStrategy({...strategy, conversacion: newConv});
                          }}
                          placeholder="Ej: #Hashtag1, #Hashtag2"
                          className="w-full bg-white/5 border border-white/10 rounded-lg p-2 text-[10px] text-slate-300 outline-none resize-none min-h-[50px]"
                      />
                  ) : (
                      <div className="flex flex-wrap gap-1">
                        {d.topHashtags.map((h: string) => (
                          <span 
                            key={h} 
                            className="flex items-center gap-0.5 text-[10px] px-2 py-0.5 rounded-full font-bold"
                            style={{ 
                                background: info.color.replace("rgb", "rgba").replace(")", ", 0.08)"),
                                color: info.color === "rgb(255, 255, 255)" ? "rgba(255,255,255,0.8)" : info.color 
                            }}
                          >
                            <FontAwesomeIcon icon={faHashtag} className="w-2 h-2 opacity-70" />
                            {h.trim().replace("#", "")}
                          </span>
                        ))}
                      </div>
                  )}
                </div>

                <div className="flex items-center gap-1.5 text-xs pt-1 border-t border-white/5">
                  <FontAwesomeIcon icon={faZap} className="text-[#f3b116] w-2.5 h-2.5" />
                  <span className="text-[10px] text-muted-foreground">Pico de volumen:</span>
                  {isEditing && setStrategy && strategy ? (
                      <Input 
                          value={d.volumePeak} 
                          onChange={e => {
                              const newConv = {...strategy.conversacion};
                              newConv[plat].volumePeak = e.target.value;
                              setStrategy({...strategy, conversacion: newConv});
                          }}
                          className="h-5 text-[10px] font-bold text-[#f3b116] bg-transparent border-none p-0 focus-visible:ring-0"
                      />
                  ) : (
                      <span className="text-[10px] font-bold text-[#f3b116]">{d.volumePeak}</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </TabsContent>

      <TabsContent value="pauta" className="mt-4 space-y-4 fade-in">
        <div className="flex justify-between items-center mb-2">
            <div className="text-sm text-muted-foreground">
                Ideas de piezas y campañas de pauta pagada recomendadas para amplificar la narrativa de LinkTIC.
            </div>
            {isEditing && setStrategy && strategy && (
                <Button size="sm" variant="outline" onClick={() => setStrategy({...strategy, pauta: [{ formato: 'Video 15s', objetivo: 'Nuevo Objetivo', plataforma: ['X'], cta: 'Ver Más', segmento: 'Audiencia', presupuesto: 'Medio' }, ...strategy.pauta]})} className="h-7 text-[10px] font-black uppercase text-green-400 border-green-500/20">
                    <FontAwesomeIcon icon={faPlus} className="mr-1" /> Añadir Pauta
                </Button>
            )}
        </div>
        {(isEditing && strategy ? strategy.pauta : pauta).map((p: any, i: number) => (
          <div key={i} className="kpi-card p-5 rounded-2xl border-white/5 shadow-none relative group">
            {isEditing && setStrategy && strategy && (
                <Button variant="ghost" size="sm" onClick={() => setStrategy({...strategy, pauta: strategy.pauta.filter((_:any, idx:number) => idx !== i)})} className="absolute top-2 right-2 h-8 w-8 p-0 text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">
                    <FontAwesomeIcon icon={faTrash} className="w-3 h-3" />
                </Button>
            )}
            <div className="flex items-start gap-4">
              <div 
                className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 text-lg" 
                style={{ background: "rgba(243, 177, 22, 0.15)", border: "1px solid rgba(243, 177, 22, 0.3)" }}
              >
                🎯
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-2">
                    {isEditing && setStrategy && strategy ? (
                        <div className="flex gap-2 w-full mb-2">
                            <Input value={p.formato} onChange={e => {
                                const newP = [...strategy.pauta];
                                newP[i].formato = e.target.value;
                                setStrategy({...strategy, pauta: newP});
                            }} className="h-7 text-xs font-bold text-orange-400 bg-white/5 border-white/10 w-1/3" />
                            <Input value={p.presupuesto} onChange={e => {
                                const newP = [...strategy.pauta];
                                newP[i].presupuesto = e.target.value;
                                setStrategy({...strategy, pauta: newP});
                            }} className="h-7 text-xs font-bold text-blue-400 bg-white/5 border-white/10 w-1/3" />
                        </div>
                    ) : (
                        <>
                            <span className="font-semibold text-sm" style={{ color: "rgb(243, 177, 22)" }}>{p.formato}</span>
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider" style={{ color: "rgb(43, 130, 238)", background: "rgba(43, 130, 238, 0.1)" }}>{p.presupuesto}</span>
                        </>
                    )}
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <div className="text-muted-foreground mb-0.5 flex items-center gap-1">
                      <FontAwesomeIcon icon={faBullseye} className="w-2.5 h-2.5" /> Objetivo
                    </div>
                    {isEditing && setStrategy && strategy ? (
                        <textarea value={p.objetivo} onChange={e => {
                            const newP = [...strategy.pauta];
                            newP[i].objetivo = e.target.value;
                            setStrategy({...strategy, pauta: newP});
                        }} className="w-full bg-white/5 border border-white/10 rounded p-1 text-[11px] text-slate-200 outline-none min-h-[40px]" />
                    ) : (
                        <div className="font-medium text-slate-200">{p.objetivo}</div>
                    )}
                  </div>
                  <div>
                    <div className="text-muted-foreground mb-0.5">CTA</div>
                    {isEditing && setStrategy && strategy ? (
                        <Input value={p.cta} onChange={e => {
                            const newP = [...strategy.pauta];
                            newP[i].cta = e.target.value;
                            setStrategy({...strategy, pauta: newP});
                        }} className="h-7 text-[11px] text-green-400 bg-white/5 border-white/10" />
                    ) : (
                        <div className="font-medium" style={{ color: "rgb(46, 184, 138)" }}>&ldquo;{p.cta}&rdquo;</div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </TabsContent>
    </Tabs>
  );
}
