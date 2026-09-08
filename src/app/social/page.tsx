"use client";

import { useState, useMemo, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { faRotate, faHeart, faComment, faSave, faPlus, faTrash, faUpload, faLock } from "@fortawesome/free-solid-svg-icons";
import { faInstagram, faFacebook, faXTwitter, faTiktok } from "@fortawesome/free-brands-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useAuth } from "@/components/auth-provider";
import { canEdit } from "@/lib/auth/rbac";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { AreaChart, Area, ResponsiveContainer } from "recharts";
import { AdminPopup } from "@/components/admin-popup";
import { Input } from "@/components/ui/input";
import { LiveTicker } from "@/components/live-ticker";
import * as XLSX from 'xlsx';

const feedSentimentColor: Record<string, string> = {
  positivo: "rgb(46, 184, 138)",
  negativo: "rgb(223, 58, 58)",
  neutral: "rgb(243, 177, 22)",
};

const platformConfig: Record<string, { color: string; icon: any; name: string }> = {
  Instagram: { color: "#E1306C", icon: faInstagram, name: "Instagram" },
  Facebook: { color: "#1877f2", icon: faFacebook, name: "Facebook" },
  X: { color: "#ffffff", icon: faXTwitter, name: "X" }, 
  TikTok: { color: "#69C9D0", icon: faTiktok, name: "TikTok" },
};

const BrandIcon = ({ name, className = "w-4 h-4" }: { name: string, className?: string }) => {
  const normalizedName = name.toLowerCase();
  const key = Object.keys(platformConfig).find(k => k.toLowerCase() === normalizedName);
  const p = key ? platformConfig[key] : null;
  
  if (!p || !p.icon) return null;
  
  return <FontAwesomeIcon icon={p.icon} className={className} />;
};

const getPlatformConfig = (name: string) => {
  const key = Object.keys(platformConfig).find(k => k.toLowerCase() === name.toLowerCase());
  return key ? platformConfig[key] : null;
};

export default function SocialPage() {
  const { role } = useAuth();
  const [selectedPlatform, setSelectedPlatform] = useState<string | null>(null);
  const [profiles, setProfiles] = useState<any[]>([]);
  const [feed, setFeed] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastFetchTime, setLastFetchTime] = useState<Date | null>(null);
  const [timeAgo, setTimeAgo] = useState<string>("AHORA");
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [pass, setPass] = useState("");
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const fetchSocialData = async () => {
    setLoading(true);
    const { data: pData } = await supabase.from('social_perfiles').select('*');
    const { data: fData } = await supabase.from('social_feed').select('*').order('id', { ascending: false });
    
    if (pData) setProfiles(pData);
    if (fData) setFeed(fData);
    setLastFetchTime(new Date());
    setTimeAgo("AHORA");
    setLoading(false);
  };

  useEffect(() => {
    fetchSocialData();
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

  const saveSocialData = async () => {
    try {
        // Update Profiles
        for (const p of profiles) {
            await supabase.from('social_perfiles').upsert(p);
        }
        // Update Feed (caution: usually feed is large, here we just upsert the ones we have in state)
        // For simplicity, we just save what's in state
        for (const post of feed) {
            const { error } = await supabase.from('social_feed').upsert(post);
        }
        alert("¡Datos guardados con éxito!");
        setIsEditing(false);
        fetchSocialData();
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

            // Iteramos por todas las pestañas del archivo
            wb.SheetNames.forEach((wsname) => {
                const ws = wb.Sheets[wsname];
                const data = XLSX.utils.sheet_to_json(ws);
                if (data.length === 0) return;

                const firstRow = data[0] as any;

                // Detección: Si es pestaña de FEED
                if (firstRow['Usuario'] || firstRow['usuario'] || firstRow['Texto'] || firstRow['texto']) {
                    const newFeedData = data.map((row: any) => ({
                        red: row['Red'] || row['red'] || 'X',
                        usuario: row['Usuario'] || row['usuario'] || 'Anónimo',
                        tiempo: row['Tiempo'] || row['tiempo'] || 'Ahora',
                        texto: row['Texto'] || row['texto'] || '',
                        tipo: (row['Tipo'] || row['tipo'] || 'neutral').toLowerCase()
                    }));
                    updatedFeed = [...newFeedData, ...updatedFeed].slice(0, 50);
                    feedsFound += newFeedData.length;
                } 
                // Detección: Si es pestaña de PERFILES
                else if (firstRow['Seguidores'] || firstRow['seguidores'] || firstRow['ID'] || firstRow['id']) {
                    data.forEach((row: any) => {
                        const id = (row['ID'] || row['id'] || '').toLowerCase().trim();
                        if (!id) return;
                        
                        const idx = updatedProfiles.findIndex(p => p.id === id);
                        const obj = {
                            id,
                            seguidores: (row['Seguidores'] || row['seguidores'] || '0').toString(),
                            interacciones: parseInt(row['Interacciones'] || row['interacciones']) || 0,
                            alcance: (row['Alcance'] || row['alcance'] || '0').toString(),
                            posts: parseInt(row['Posts'] || row['posts']) || 0,
                            sentimiento: parseInt(row['Sentimiento'] || row['sentimiento']) || 50,
                            tendencia: row['Tendencia'] ? (typeof row['Tendencia'] === 'string' ? JSON.parse(row['Tendencia']) : row['Tendencia']) : [],
                            top_posts: row['TopPosts'] ? (typeof row['TopPosts'] === 'string' ? JSON.parse(row['TopPosts']) : row['TopPosts']) : []
                        };
                        if (idx !== -1) updatedProfiles[idx] = obj;
                        else updatedProfiles.push(obj);
                    });
                    profilesFound++;
                }
            });

            if (feedsFound > 0) setFeed(updatedFeed);
            if (profilesFound > 0) setProfiles(updatedProfiles);

            alert(`Importación finalizada:\n- ${profilesFound} redes actualizadas\n- ${feedsFound} entradas de feed añadidas`);
            
        } catch(err) {
            console.error(err);
            alert("Error procesando Excel. Revisa que el formato de las columnas sea correcto.");
        }
    };
    reader.readAsBinaryString(file);
  };

  const filteredFeed = useMemo(() => {
    return selectedPlatform 
        ? feed.filter(post => post.red.toLowerCase() === selectedPlatform.toLowerCase())
        : feed;
  }, [selectedPlatform, feed]);

  if (loading) return <div className="h-screen page-bg text-white flex justify-center items-center font-mono tracking-widest uppercase animate-pulse">Cargando Inteligencia Social...</div>;

  return (
    <div className="page-bg text-white p-6">
      {/* Header */}
      <div className="mb-6 flex justify-between items-center">
        <div>
          <div className="flex gap-2 mb-2">
            <span className="bg-[#1e2240] text-[#75ddff] text-[10px] px-2 py-0.5 rounded-full border border-[#0094ff]/20 uppercase font-bold tracking-tight">ESTRATEGIA DIGITAL</span>
            <span className="bg-[#1e2240] text-[#aab3cf] text-[10px] px-2 py-0.5 rounded-full border border-[#2a2a4a] uppercase">ACTUALIZADO {timeAgo}</span>
          </div>
          <h1 className="font-heading text-3xl font-bold mb-1 gradient-text text-glow-blue">Conversación en Redes Sociales</h1>
          <p className="text-[#aab3cf] text-sm">Monitoreo en tiempo real de Instagram, Facebook, X y TikTok.</p>
        </div>
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
                        <Button variant="default" size="sm" onClick={saveSocialData} className="bg-green-600 hover:bg-green-700 text-white font-bold px-4">
                            <FontAwesomeIcon icon={faSave} className="mr-2" /> Guardar Todo
                        </Button>
                    </div>
                )
            )}
            <Button variant="outline" size="sm" onClick={fetchSocialData} className="panel border-[#2a2a4a] text-white">
                <FontAwesomeIcon icon={faRotate} className={`mr-2 ${loading ? 'animate-spin' : ''}`}/>
            </Button>
        </div>
      </div>

      {feed.length > 0 && (
        <div className="mb-6">
          <LiveTicker
            liveLabel="Feed"
            items={feed.slice(0, 16).map((post: any) => ({
              code: (post.red || "").toUpperCase(),
              label: `@${post.usuario}`,
              value: (post.tipo || "neutral").charAt(0).toUpperCase() + (post.tipo || "neutral").slice(1),
              color: feedSentimentColor[(post.tipo || "neutral").toLowerCase()] || "#c0c8de",
            }))}
          />
        </div>
      )}

      {/* Platform Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {Object.entries(platformConfig).map(([key, p]) => {
              const stats = profiles.find(pr => pr.id === key.toLowerCase()) || {
                  seguidores: "0", sentimiento: 0, interacciones: 0, alcance: "0", posts: 0, tendencia: [], top_posts: []
              };
              return (
                <Card key={key} className="panel border border-[#1e2240] p-4 rounded-2xl">
                    <div className="flex justify-between items-start mb-4">
                        <div className="flex items-center gap-2">
                            <div className="p-2 rounded-lg bg-white/5" style={{ color: p.color }}>
                                <BrandIcon name={key} className="w-5 h-5"/>
                            </div>
                            <div>
                                <h3 className="font-bold text-sm">{p.name}</h3>
                                {isEditing ? (
                                    <Input 
                                        value={stats.seguidores} 
                                        onChange={e => {
                                            const up = [...profiles];
                                            const idx = up.findIndex(pr => pr.id === key.toLowerCase());
                                            up[idx].seguidores = e.target.value;
                                            setProfiles(up);
                                        }} 
                                        className="h-5 text-[10px] bg-white/5 border-[#2a2a4a] p-1 w-20" 
                                    />
                                ) : (
                                    <p className="text-[10px] text-[#aab3cf]">{stats.seguidores} seguidores</p>
                                )}
                            </div>
                        </div>
                        {isEditing ? (
                            <div className="flex items-center gap-1">
                                <Input 
                                    type="number" 
                                    value={stats.sentimiento} 
                                    onChange={e => {
                                        const up = [...profiles];
                                        const idx = up.findIndex(pr => pr.id === key.toLowerCase());
                                        up[idx].sentimiento = parseInt(e.target.value);
                                        setProfiles(up);
                                    }} 
                                    className="h-5 text-[10px] bg-white/5 border-green-500/30 p-1 w-10 text-green-500" 
                                />
                                <span className="text-[10px] text-green-500">%</span>
                            </div>
                        ) : (
                            <span className="text-green-500 text-xs">● {stats.sentimiento}% pos</span>
                        )}
                    </div>
                    <div className="flex justify-between text-center mb-4">
                        <div>
                            {isEditing ? (
                                <Input type="number" value={stats.interacciones} onChange={e => {
                                    const up = [...profiles];
                                    const idx = up.findIndex(pr => pr.id === key.toLowerCase());
                                    up[idx].interacciones = parseInt(e.target.value);
                                    setProfiles(up);
                                }} className="h-6 text-xs text-center bg-white/5 border-[#2a2a4a]" />
                            ) : (
                                <p className="text-lg font-bold">{stats.interacciones >= 1000 ? (stats.interacciones/1000).toFixed(1)+'K' : stats.interacciones}</p>
                            )}
                            <p className="text-[10px] text-[#aab3cf]">Interacciones</p>
                        </div>
                        <div>
                            {isEditing ? (
                                <Input value={stats.alcance} onChange={e => {
                                    const up = [...profiles];
                                    const idx = up.findIndex(pr => pr.id === key.toLowerCase());
                                    up[idx].alcance = e.target.value;
                                    setProfiles(up);
                                }} className="h-6 text-xs text-center bg-white/5 border-[#2a2a4a]" />
                            ) : (
                                <p className="text-lg font-bold">{stats.alcance}</p>
                            )}
                            <p className="text-[10px] text-[#aab3cf]">Alcance</p>
                        </div>
                        <div>
                            {isEditing ? (
                                <Input type="number" value={stats.posts} onChange={e => {
                                    const up = [...profiles];
                                    const idx = up.findIndex(pr => pr.id === key.toLowerCase());
                                    up[idx].posts = parseInt(e.target.value);
                                    setProfiles(up);
                                }} className="h-6 text-xs text-center bg-white/5 border-[#2a2a4a]" />
                            ) : (
                                <p className="text-lg font-bold">{stats.posts}</p>
                            )}
                            <p className="text-[10px] text-[#aab3cf]">Posts</p>
                        </div>
                    </div>
                    <div className="h-16 mb-4">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={stats.tendencia || []}>
                                <Area type="monotone" dataKey="mentions" stroke={p.color} fill={p.color} fillOpacity={0.1} />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                    <div className="text-xs">
                        <p className="text-[#aab3cf] mb-1">Top post</p>
                        {isEditing ? (
                            <textarea 
                                value={stats.top_posts?.[0]?.texto || ''} 
                                onChange={e => {
                                    const up = [...profiles];
                                    const idx = up.findIndex(pr => pr.id === key.toLowerCase());
                                    if (!up[idx].top_posts) up[idx].top_posts = [{}];
                                    up[idx].top_posts[0].texto = e.target.value;
                                    setProfiles(up);
                                }}
                                className="w-full bg-white/5 border border-[#2a2a4a] rounded p-1 text-[10px] text-white resize-none min-h-[40px] outline-none"
                            />
                        ) : (
                            <p className="font-semibold mb-2 line-clamp-2">{stats.top_posts?.[0]?.texto || 'Sin datos'}</p>
                        )}
                        <div className="flex gap-3 text-[#8892b0] text-[10px]">
                            <span className="flex items-center gap-1">
                                <FontAwesomeIcon icon={faHeart} className="w-3 h-3 text-red-500/50"/>
                                {isEditing ? (
                                    <Input 
                                        type="number" 
                                        value={stats.top_posts?.[0]?.likes || 0} 
                                        onChange={e => {
                                            const up = [...profiles];
                                            const idx = up.findIndex(pr => pr.id === key.toLowerCase());
                                            if (!up[idx].top_posts) up[idx].top_posts = [{}];
                                            up[idx].top_posts[0].likes = parseInt(e.target.value);
                                            setProfiles(up);
                                        }}
                                        className="h-4 w-10 bg-transparent border-none p-0 text-[10px] font-bold"
                                    />
                                ) : (stats.top_posts?.[0]?.likes || 0)}
                            </span>
                            <span className="flex items-center gap-1">
                                <FontAwesomeIcon icon={faComment} className="w-3 h-3 text-[#0094ff]/50"/>
                                {isEditing ? (
                                    <Input 
                                        type="number" 
                                        value={stats.top_posts?.[0]?.comments || 0} 
                                        onChange={e => {
                                            const up = [...profiles];
                                            const idx = up.findIndex(pr => pr.id === key.toLowerCase());
                                            if (!up[idx].top_posts) up[idx].top_posts = [{}];
                                            up[idx].top_posts[0].comments = parseInt(e.target.value);
                                            setProfiles(up);
                                        }}
                                        className="h-4 w-10 bg-transparent border-none p-0 text-[10px] font-bold"
                                    />
                                ) : (stats.top_posts?.[0]?.comments || 0)}
                            </span>
                        </div>
                    </div>
                </Card>
              )
          })}
      </div>

      {/* Feed */}
      <div className="panel border border-[#1e2240] rounded-2xl p-6 mb-20 neon-frame">
        <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
                <span className="text-yellow-500 font-bold text-xl">⚡</span>
                <h1 className="text-xl font-bold">Feed en Vivo</h1>
                <span className="inline-flex items-center gap-2 bg-[#0f291e] text-green-400 text-[10px] px-2.5 py-0.5 rounded-full border border-green-500/20"><span className="live-dot" style={{ background: "#34d399", boxShadow: "0 0 8px #34d399" }} /> EN TIEMPO REAL</span>
            </div>
            {isEditing && (
                <Button size="sm" variant="ghost" className="text-[10px] font-black uppercase text-[#75ddff]" onClick={() => setFeed([{ red: 'X', usuario: 'Nuevo', tiempo: 'Ahora', texto: '', tipo: 'neutral' }, ...feed])}>
                    <FontAwesomeIcon icon={faPlus} className="mr-1" /> Nuevo Post
                </Button>
            )}
        </div>

        <div className="flex gap-2 mb-6">
            {["Todas", "Instagram", "Facebook", "X", "TikTok"].map((p) => (
                <Button 
                    key={p}
                    variant="ghost"
                    className={`rounded-full px-4 py-1.5 h-auto text-xs ${selectedPlatform === (p === "Todas" ? null : p) ? "bg-white/10 text-white" : "text-[#8892b0] hover:text-white"}`}
                    onClick={() => setSelectedPlatform(p === "Todas" ? null : p)}
                >
                    {p === "Todas" ? p : <span className="flex items-center gap-2"><BrandIcon name={p} className="w-3 h-3"/> {p}</span>}
                </Button>
            ))}
        </div>

        <div className="space-y-2">
            {filteredFeed.map((post, idx) => {
                const p = getPlatformConfig(post.red);
                return (
                    <div key={post.id || idx} className="well border border-[#1e2240] rounded-xl p-4 flex items-center gap-4 hover:border-[#2a2a4a] transition-colors group relative">
                        <div className="p-2 rounded-lg bg-white/5" style={{ color: p?.color || 'white' }}>
                            <BrandIcon name={post.red} className="w-5 h-5"/>
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1 flex-wrap">
                                {isEditing ? (
                                    <>
                                        <select 
                                            value={post.red} 
                                            onChange={e => {
                                                const up = [...feed];
                                                up[idx].red = e.target.value;
                                                setFeed(up);
                                            }}
                                            className="panel-soft text-[10px] font-bold rounded p-1 border-none outline-none"
                                        >
                                            <option value="X">X</option>
                                            <option value="Instagram">IG</option>
                                            <option value="Facebook">FB</option>
                                            <option value="TikTok">TT</option>
                                        </select>
                                        <Input 
                                            value={post.usuario} 
                                            onChange={e => {
                                                const up = [...feed];
                                                up[idx].usuario = e.target.value;
                                                setFeed(up);
                                            }} 
                                            className="h-6 text-xs font-bold bg-white/5 border-[#2a2a4a] w-24" 
                                        />
                                        <Input 
                                            value={post.tiempo} 
                                            onChange={e => {
                                                const up = [...feed];
                                                up[idx].tiempo = e.target.value;
                                                setFeed(up);
                                            }} 
                                            className="h-6 text-[10px] bg-white/5 border-[#2a2a4a] w-20" 
                                        />
                                        <select 
                                            value={post.tipo} 
                                            onChange={e => {
                                                const up = [...feed];
                                                up[idx].tipo = e.target.value;
                                                setFeed(up);
                                            }}
                                            className="panel-soft text-[10px] font-bold rounded p-1 border-none outline-none"
                                        >
                                            <option value="positivo">Positivo</option>
                                            <option value="neutral">Neutral</option>
                                            <option value="negativo">Negativo</option>
                                        </select>
                                    </>
                                ) : (
                                    <>
                                        <span className="font-bold text-sm">@{post.usuario}</span>
                                        <span className="text-xs text-[#8892b0]">{post.tiempo}</span>
                                        <span className={`text-[10px] font-bold uppercase tracking-widest ${post.tipo === 'positivo' ? 'text-green-500' : post.tipo === 'negativo' ? 'text-red-500' : 'text-yellow-500'}`}>
                                            {post.tipo}
                                        </span>
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
                                    className="w-full bg-transparent border-none p-0 text-sm text-[#c0c8de] outline-none resize-none min-h-[40px]"
                                />
                            ) : (
                                <p className="text-sm text-[#c0c8de]">{post.texto}</p>
                            )}
                        </div>
                        {isEditing ? (
                            <Button variant="ghost" size="sm" onClick={() => setFeed(feed.filter((_, i) => i !== idx))} className="text-red-500 h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity">
                                <FontAwesomeIcon icon={faTrash} className="w-3 h-3" />
                            </Button>
                        ) : (
                            <div className={`w-2 h-2 rounded-full ${post.tipo === 'positivo' ? 'bg-green-500' : post.tipo === 'negativo' ? 'bg-red-500' : 'bg-yellow-500'}`} />
                        )}
                    </div>
                );
            })}
        </div>
      </div>

      <AdminPopup title="Editor de Inteligencia Social" hideTrigger={true}>
            <div className="space-y-6">
                <div className="flex justify-between items-center mb-6 panel-soft p-4 rounded-xl border border-[#1e2240]">
                    <div>
                        <h3 className="font-bold">Panel de Control</h3>
                        <p className="text-xs text-[#aab3cf]">Gestiona métricas y publicaciones en tiempo real.</p>
                    </div>
                    <div className="flex gap-2">
                        <Button variant="outline" size="sm" className="relative cursor-pointer bg-green-600/20 text-green-400 border-green-500/20">
                            <FontAwesomeIcon icon={faUpload} className="mr-2" /> Excel
                            <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" onChange={handleExcelUpload} accept=".xlsx,.xls" />
                        </Button>
                        <Button variant="neon" className="font-bold" onClick={saveSocialData}>
                            <FontAwesomeIcon icon={faSave} className="mr-2" /> Guardar Todos
                        </Button>
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-8">
                    <div>
                        <h3 className="text-[#75ddff] font-black mb-4 uppercase text-xs tracking-widest flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-[#0094ff]"></span> Métricas por Red
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {profiles.map((p, idx) => (
                                <div key={p.id} className="bg-white/5 p-4 rounded-xl space-y-3 border border-[#1e2240]">
                                    <div className="flex items-center gap-2 mb-2">
                                        <BrandIcon name={p.id} className="w-4 h-4" />
                                        <span className="font-bold uppercase text-xs">{p.id}</span>
                                    </div>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="space-y-1">
                                            <label className="text-[9px] text-[#8892b0] uppercase font-black">Seguidores</label>
                                            <Input value={p.seguidores} onChange={(e) => {
                                                const news = [...profiles];
                                                news[idx].seguidores = e.target.value;
                                                setProfiles(news);
                                            }} className="well border-[#1e2240] h-8 text-xs" />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-[9px] text-[#8892b0] uppercase font-black">Sentimiento %</label>
                                            <Input type="number" value={p.sentimiento} onChange={(e) => {
                                                const news = [...profiles];
                                                news[idx].sentimiento = parseInt(e.target.value);
                                                setProfiles(news);
                                            }} className="well border-[#1e2240] h-8 text-xs" />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-[9px] text-[#8892b0] uppercase font-black">Interacciones</label>
                                            <Input type="number" value={p.interacciones} onChange={(e) => {
                                                const news = [...profiles];
                                                news[idx].interacciones = parseInt(e.target.value);
                                                setProfiles(news);
                                            }} className="well border-[#1e2240] h-8 text-xs" />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-[9px] text-[#8892b0] uppercase font-black">Alcance</label>
                                            <Input value={p.alcance} onChange={(e) => {
                                                const news = [...profiles];
                                                news[idx].alcance = e.target.value;
                                                setProfiles(news);
                                            }} className="well border-[#1e2240] h-8 text-xs" />
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div>
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-yellow-500 font-black uppercase text-xs tracking-widest flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-yellow-500"></span> Feed de Mensajes
                            </h3>
                            <Button size="sm" variant="ghost" className="text-[10px] uppercase font-black text-[#aab3cf] hover:text-white" onClick={() => setFeed([{ red: 'X', usuario: 'Nuevo', tiempo: 'Ahora', texto: '', tipo: 'neutral' }, ...feed])}>
                                <FontAwesomeIcon icon={faPlus} className="mr-2" /> Agregar Post
                            </Button>
                        </div>
                        <div className="space-y-2">
                            {feed.map((post, idx) => (
                                <div key={idx} className="bg-white/5 p-3 rounded-xl flex gap-3 items-start border border-[#1e2240]">
                                    <select className="panel-soft border-none text-[10px] font-bold rounded p-1" value={post.red} onChange={(e) => {
                                        const news = [...feed];
                                        news[idx].red = e.target.value;
                                        setFeed(news);
                                    }}>
                                        <option value="X">X</option>
                                        <option value="Instagram">IG</option>
                                        <option value="Facebook">FB</option>
                                        <option value="TikTok">TT</option>
                                    </select>
                                    <div className="flex-1 space-y-2">
                                        <div className="flex gap-2">
                                            <Input value={post.usuario} placeholder="Usuario" onChange={(e) => {
                                                const news = [...feed];
                                                news[idx].usuario = e.target.value;
                                                setFeed(news);
                                            }} className="well border-[#1e2240] h-7 text-[10px] w-1/3" />
                                            <Input value={post.tiempo} placeholder="Tiempo" onChange={(e) => {
                                                const news = [...feed];
                                                news[idx].tiempo = e.target.value;
                                                setFeed(news);
                                            }} className="well border-[#1e2240] h-7 text-[10px] w-1/3" />
                                            <select className="well border-[#1e2240] h-7 text-[10px] rounded-md px-2 w-1/3" value={post.tipo} onChange={(e) => {
                                                const news = [...feed];
                                                news[idx].tipo = e.target.value;
                                                setFeed(news);
                                            }}>
                                                <option value="positivo">Positivo</option>
                                                <option value="neutral">Neutral</option>
                                                <option value="negativo">Negativo</option>
                                            </select>
                                        </div>
                                        <textarea className="w-full well border-[#1e2240] rounded-md p-2 text-xs focus:outline-none" value={post.texto} rows={2} onChange={(e) => {
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
