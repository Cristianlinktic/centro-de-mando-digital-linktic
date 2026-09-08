"use client";

import { Suspense, useState, useMemo, useEffect } from "react";
import dynamic from "next/dynamic";
import { Card } from "@/components/ui/card";
import { KpiCards } from "@/components/kpi-cards";
import { CountUp } from "@/components/count-up";
import { SentimentDonut } from "@/components/sentiment-donut";
import { DecimalInput } from "@/components/decimal-input";
import { Flag } from "@/components/flag";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";
import { useRealtimeRefresh } from "@/hooks/use-realtime-refresh";
import { useAuth } from "@/components/auth-provider";
import { AdminPopup } from "@/components/admin-popup";
import { Input } from "@/components/ui/input";
import { TabLoadingScreen } from "@/components/bird-loading/tab-loading-screen";
import * as XLSX from "xlsx";
import { faInstagram, faFacebook, faXTwitter, faTiktok } from "@fortawesome/free-brands-svg-icons";
import { faRotate, faGlobe, faArrowTrendUp, faStar, faSave, faUpload, faPlus, faWandMagicSparkles } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

const Globe = dynamic(() => import("@/components/globe").then((m) => m.GlobeComponent), {
  ssr: false,
  loading: () => (
    <div className="h-full rounded-lg flex items-center justify-center" style={{ background: "radial-gradient(ellipse at 40% 40%, #070a16 0%, #070a16 100%)" }}>
      <p className="text-muted-foreground text-sm">Cargando globo...</p>
    </div>
  ),
});

const platformConfig: Record<string, { color: string; icon: any; name: string }> = {
  Instagram: { color: "#E1306C", icon: faInstagram, name: "Instagram" },
  Facebook: { color: "#1877f2", icon: faFacebook, name: "Facebook" },
  X: { color: "#ffffff", icon: faXTwitter, name: "X" },
  TikTok: { color: "#69C9D0", icon: faTiktok, name: "TikTok" },
};

const CountryDetail = ({ country, selectedPlatform, sentimentColors, platformColors, BrandIcon }: any) => {
    const [aiText, setAiText] = useState("");
    const [aiLoading, setAiLoading] = useState(false);
    // El reset del análisis al cambiar de país se logra remontando el componente
    // con key={country.id} (ver más abajo), sin efectos con setState.

    const runAi = async () => {
        setAiLoading(true);
        try {
            const res = await fetch("/api/globe-summary", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    mode: "summary",
                    country: {
                        pais: country.pais, tema: country.tema, volumen: country.volumen,
                        sentimiento: country.sentimiento, sentimientoPct: country.sentimientoPct,
                        plataformas: country.plataformas, topHashtags: country.topHashtags,
                        keywords: country.keywords, pctCambio: country.pctCambio,
                    },
                }),
            });
            const d = await res.json();
            setAiText(d.text || d.error || "No se pudo generar el análisis.");
        } catch {
            setAiText("Error de red al generar el análisis.");
        } finally {
            setAiLoading(false);
        }
    };

    if (!country) return null;
    return (
        <div key={country.id} className="p-5 space-y-4 panel border border-[#2a2a4a] rounded-2xl text-white animate-in fade-in slide-in-from-right-4 duration-500">
            <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                    <Flag code={country.id} className="h-8 w-auto rounded shadow border border-[#2a2a4a]" />
                    <div>
                        <h3 className="text-xl font-bold">{country.pais}</h3>
                        <p className="text-xs text-[#aab3cf]">{country.updateTime}</p>
                    </div>
                </div>
            </div>

            <div className="panel-soft p-4 rounded-xl border border-[#1e2240]">
                <p className="text-xs text-[#aab3cf] mb-1">Tema principal</p>
                <p className="text-sm font-semibold text-[#75ddff]">{country.tema}</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className="panel-soft p-4 rounded-xl min-w-0 overflow-hidden border border-[#1e2240]">
                    <p className="text-xl font-bold text-yellow-500 tabular-nums truncate"><CountUp value={country.volumen} /></p>
                    <p className="text-xs text-[#aab3cf] truncate">menciones hoy</p>
                    <p className="text-xs text-green-500 flex items-center gap-1 mt-1"><FontAwesomeIcon icon={faArrowTrendUp} className="w-3 h-3 shrink-0"/> <span className="truncate">{country.pctCambio}%</span></p>
                </div>
                <div className="panel-soft p-4 rounded-xl min-w-0 overflow-hidden border border-[#1e2240]">
                    <p className="text-base font-bold text-green-500 flex items-center gap-1"><span className="truncate">↑ Positivo</span> <FontAwesomeIcon icon={faStar} className="w-3 h-3 shrink-0 fill-green-500"/></p>
                    <p className="text-xs text-[#aab3cf] truncate">Sentimiento</p>
                    <p className="text-xs text-[#75ddff] mt-1 flex items-center gap-1"><span className="truncate">{selectedPlatform || 'TikTok'}</span> <FontAwesomeIcon icon={faStar} className="w-3 h-3 shrink-0"/></p>
                </div>
            </div>

            <div className="space-y-2 bg-[#10142a] p-4 rounded-xl border border-[#1e2240]">
                <p className="text-xs text-[#aab3cf]">Distribución de sentimiento</p>
                <SentimentDonut
                    positivo={country.sentimientoPct?.positivo || 0}
                    neutral={country.sentimientoPct?.neutral || 0}
                    negativo={country.sentimientoPct?.negativo || 0}
                    colors={{ positivo: sentimentColors.positivo, neutral: sentimentColors.neutral, negativo: sentimentColors.negativo }}
                />
            </div>

            <div>
                <p className="text-xs text-[#aab3cf] mb-2">Volumen por plataforma</p>
                <div className="space-y-2">
                    {(() => {
                        const platformEntries = Object.entries(country.plataformas) as [string, number][];
                        const trueTotal = platformEntries.reduce((acc: any, [_, v]: any) => acc + (v || 0), 0);
                        
                        return platformEntries
                            .sort((a: any, b: any) => (b[1] || 0) - (a[1] || 0))
                            .map(([plat, vol]: any) => (
                                <div key={plat} className="flex items-center gap-3">
                                    <div style={{ color: platformColors[plat] }}>
                                        <BrandIcon name={plat} className="w-5 h-5"/>
                                    </div>
                                    <div className="flex-1 h-1.5 rounded-full panel-soft">
                                        <div 
                                            className="h-full rounded-full transition-all duration-500" 
                                            style={{ 
                                                width: `${trueTotal > 0 ? ((vol || 0) / trueTotal) * 100 : 0}%`, 
                                                background: platformColors[plat] 
                                            }}
                                        ></div>
                                    </div>
                                    <span className="text-xs font-mono w-16 text-right">{(vol || 0).toLocaleString()}</span>
                                </div>
                            ));
                    })()}
                </div>
            </div>

            <div className="space-y-2">
                <p className="text-xs text-[#aab3cf]">Palabras clave</p>
                <div className="flex flex-wrap gap-1">
                    {country.keywords.map((k: string) => <span key={k} className="px-2 py-1 rounded panel-soft text-[10px] border border-[#1e2240]">{k}</span>)}
                </div>
            </div>

            <div className="space-y-2">
                <p className="text-xs text-[#aab3cf]">Top hashtags</p>
                <div className="flex flex-wrap gap-1">
                    {country.topHashtags.map((h: string) => <span key={h} className="px-2 py-1 rounded panel-soft text-[10px] text-yellow-500 border border-[#1e2240]">{h}</span>)}
                </div>
            </div>

            <div className="p-4 rounded-xl panel-soft border border-[#0094ff]/20 text-xs text-[#c0c8de] leading-relaxed">
                <p className="text-[#aab3cf] mb-1">Resumen</p>
                {country.resumen}
            </div>

            <div className="space-y-2">
                <button
                    onClick={runAi}
                    disabled={aiLoading}
                    className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-gradient-to-r from-fuchsia-500/20 to-violet-500/20 border border-fuchsia-500/30 text-fuchsia-200 text-sm font-semibold hover:from-fuchsia-500/30 hover:to-violet-500/30 transition-colors disabled:opacity-60"
                >
                    <FontAwesomeIcon icon={faWandMagicSparkles} className={`w-4 h-4 ${aiLoading ? 'animate-pulse' : ''}`} />
                    {aiLoading ? "Analizando con IA…" : "Análisis con IA"}
                </button>
                {aiText && (
                    <div className="p-4 rounded-xl bg-fuchsia-500/5 border border-fuchsia-500/20 text-xs text-[#e4e9f5] leading-relaxed whitespace-pre-line animate-in fade-in duration-500">
                        <p className="text-fuchsia-300 mb-1.5 font-semibold flex items-center gap-1.5">
                            <FontAwesomeIcon icon={faWandMagicSparkles} className="w-3 h-3" /> Análisis IA
                        </p>
                        {aiText}
                    </div>
                )}
            </div>
        </div>
    );
};
const BrandIcon = ({ name, className = "w-4 h-4" }: { name: string, className?: string }) => {
  const normalizedName = name.toLowerCase();
  const key = Object.keys(platformConfig).find(k => k.toLowerCase() === normalizedName);
  const p = key ? platformConfig[key] : null;
  if (!p) return null;
  return <FontAwesomeIcon icon={p.icon} className={className} />;
};

const sentimentColors: Record<string, string> = {
  positivo: "rgb(46, 184, 138)",
  negativo: "rgb(223, 58, 58)",
  neutral: "rgb(243, 177, 22)",
  mixto: "hsl(42 90% 52%)",
};

const platformColors: Record<string, string> = {
  X: "rgb(255, 255, 255)",
  Facebook: "rgb(24, 119, 242)",
  Instagram: "rgb(225, 48, 108)",
  TikTok: "rgb(105, 201, 208)",
};

// Static KPIs removed, now calculated dynamically inside the component

const getEmojiFlag = (iso: string) => {
    if (!iso || iso.length !== 2) return '🌍';
    return iso.toUpperCase().replace(/./g, char => String.fromCodePoint(char.charCodeAt(0) + 127397));
};

const countryCoordinates: Record<string, { lat: number, lng: number }> = {
    'CO': { lat: 4.5709, lng: -74.2973 },
    'US': { lat: 37.0902, lng: -95.7129 },
    'ES': { lat: 40.4637, lng: -3.7492 },
    'MX': { lat: 23.6345, lng: -102.5528 },
    'AR': { lat: -38.4161, lng: -63.6167 },
    'BR': { lat: -14.2350, lng: -51.9253 },
    'VE': { lat: 6.4238, lng: -66.5897 },
    'CL': { lat: -35.6751, lng: -71.5430 },
    'PE': { lat: -9.1900, lng: -75.0152 },
    'EC': { lat: -1.8312, lng: -78.1834 },
    'PA': { lat: 8.5380, lng: -80.7821 },
    'DE': { lat: 51.1657, lng: 10.4515 },
    'FR': { lat: 46.2276, lng: 2.2137 },
    'IT': { lat: 41.8719, lng: 12.5674 },
    'GB': { lat: 55.3781, lng: -3.4360 },
    'CA': { lat: 56.1304, lng: -106.3468 },
    'RU': { lat: 61.5240, lng: 105.3188 },
    'CN': { lat: 35.8617, lng: 104.1954 },
    'JP': { lat: 36.2048, lng: 138.2529 },
    'BO': { lat: -16.2902, lng: -63.5887 },
    'UY': { lat: -32.5228, lng: -55.7658 },
    'PY': { lat: -23.4425, lng: -58.4438 },
    'CU': { lat: 21.5218, lng: -77.7812 },
    'DO': { lat: 18.7357, lng: -70.1627 },
    'HN': { lat: 15.2000, lng: -86.2419 },
    'SV': { lat: 13.7942, lng: -88.8965 },
    'NI': { lat: 12.8654, lng: -85.2072 },
    'CR': { lat: 9.7489, lng: -83.7534 },
    'GT': { lat: 15.7835, lng: -90.2308 }
};

const countryNameToIso: Record<string, string> = {
    'colombia': 'CO', 'estados unidos': 'US', 'españa': 'ES', 'mexico': 'MX', 'méxico': 'MX',
    'argentina': 'AR', 'brasil': 'BR', 'venezuela': 'VE', 'chile': 'CL', 'peru': 'PE', 'perú': 'PE',
    'ecuador': 'EC', 'panama': 'PA', 'panamá': 'PA', 'alemania': 'DE', 'francia': 'FR', 'italia': 'IT',
    'reino unido': 'GB', 'inglaterra': 'GB', 'canada': 'CA', 'canadá': 'CA', 'rusia': 'RU', 'china': 'CN',
    'japon': 'JP', 'japón': 'JP', 'bolivia': 'BO', 'uruguay': 'UY', 'paraguay': 'PY', 'cuba': 'CU',
    'republica dominicana': 'DO', 'república dominicana': 'DO', 'honduras': 'HN', 'el salvador': 'SV',
    'nicaragua': 'NI', 'costa rica': 'CR', 'guatemala': 'GT', 'suiza': 'CH',
    'portugal': 'PT', 'australia': 'AU', 'turquia': 'TR', 'turquía': 'TR', 'india': 'IN',
    'corea del sur': 'KR', 'sudafrica': 'ZA', 'sudáfrica': 'ZA', 'nigeria': 'NG',
    'marruecos': 'MA', 'egipto': 'EG', 'polonia': 'PL', 'holanda': 'NL', 'países bajos': 'NL'
};

export default function MapaPage() {
  const { firstName } = useAuth();
  const [selected, setSelected] = useState<string | null>("CO");
  const [selectedPlatform, setSelectedPlatform] = useState<string | null>(null);
  const [countriesData, setCountriesData] = useState<any[]>([]);
  const [globeMarkers, setGlobeMarkers] = useState<any[]>([]);
  const [loadingDb, setLoadingDb] = useState(true);
  const [editingCountryId, setEditingCountryId] = useState<string | null>(null);
  const [rawHashtags, setRawHashtags] = useState<string>('');
  const [rawKeywords, setRawKeywords] = useState<string>('');
  const [lookingUp, setLookingUp] = useState(false);
  const [lastFetchTime, setLastFetchTime] = useState<Date | null>(null);
  const [timeAgo, setTimeAgo] = useState<string>("AHORA");
  const [editorOpen, setEditorOpen] = useState(false);

  // `silent`: refresco en vivo (Realtime) sin mostrar la pantalla de carga.
  const fetchMapData = async (silent = false) => {
    if (!silent) setLoadingDb(true);
    const { data: countries } = await supabase.from('mapa_paises').select('*');
    const { data: markers } = await supabase.from('mapa_marcadores').select('*');
    if (countries) {
        const formattedC = countries.map((c: any) => ({
            ...c,
            // Auto-fill missing coordinates from local dict
            lat: c.lat || countryCoordinates[c.id]?.lat || 0,
            lng: c.lng || countryCoordinates[c.id]?.lng || 0,
            emoji: c.emoji || getEmojiFlag(c.id),
            sentimientoPct: c.sentimiento_pct,
            plataformaDominante: c.plataforma_dominante,
            pctCambio: c.pct_cambio,
            topHashtags: c.top_hashtags,
            updateTime: c.update_time
        }));
        setCountriesData(formattedC);
    }
    if (markers) setGlobeMarkers(markers);
    setLastFetchTime(new Date());
    setTimeAgo("AHORA");
    setLoadingDb(false);
  };

  useEffect(() => {
    fetchMapData();
  }, []);

  // Actualización automática en vivo: el mapa global se refresca apenas entran
  // datos nuevos (editor, import de Excel o cualquier otro dispositivo).
  useRealtimeRefresh(
    ["mapa_paises", "mapa_marcadores"],
    () => fetchMapData(true),
    { paused: editorOpen }
  );

  useEffect(() => {
    if (!lastFetchTime) return;
    const interval = setInterval(() => {
      const now = new Date();
      const diffInMins = Math.floor((now.getTime() - lastFetchTime.getTime()) / 60000);
      if (diffInMins === 0) setTimeAgo("AHORA");
      else setTimeAgo(`HACE ${diffInMins} MIN`);
    }, 30000); // Check every 30s for better responsiveness
    return () => clearInterval(interval);
  }, [lastFetchTime]);
  
  const lookupCountryByName = async (id: string, name: string) => {
    if (!name || name.length < 3) return;
    setLookingUp(true);
    try {
        const res = await fetch(`https://restcountries.com/v3.1/name/${encodeURIComponent(name)}?fields=cca2,latlng,flag,name,translations`);
        if (!res.ok) throw new Error('Not found');
        const data = await res.json();
        if (!data || data.length === 0) throw new Error('Empty');
        const match = data.find((c: any) =>
            c.translations?.spa?.common?.toLowerCase() === name.toLowerCase() ||
            c.name?.common?.toLowerCase() === name.toLowerCase()
        ) || data[0];
        const iso = match.cca2;
        const lat = match.latlng?.[0] ?? 0;
        const lng = match.latlng?.[1] ?? 0;
        const emoji = match.flag || getEmojiFlag(iso);
        setCountriesData(prev => prev.map((c: any) => c.id !== id ? c : { ...c, id: iso, emoji, lat, lng }));
        if (editingCountryId === id) setEditingCountryId(iso);
    } catch {
        // silently fail
    } finally {
        setLookingUp(false);
    }
  };

  const repairAllCoordinates = async () => {
    setLookingUp(true);
    try {
        const missing = countriesData.filter((c: any) => !c.lat && !c.lng);
        let repaired = [...countriesData];
        for (const country of missing) {
            try {
                // Look up by ISO code (alpha2) — much more reliable than name
                const res = await fetch(`https://restcountries.com/v3.1/alpha/${country.id}?fields=cca2,latlng,flag,name`);
                if (!res.ok) continue;
                const data = await res.json();
                const iso = data.cca2 || country.id;
                const lat = data.latlng?.[0] ?? countryCoordinates[iso]?.lat ?? 0;
                const lng = data.latlng?.[1] ?? countryCoordinates[iso]?.lng ?? 0;
                const emoji = data.flag || getEmojiFlag(iso);
                repaired = repaired.map((c: any) => c.id === country.id ? { ...c, lat, lng, emoji } : c);
                // Save to DB immediately
                await supabase.from('mapa_paises').update({ lat, lng, emoji }).eq('id', country.id);
            } catch {
                continue;
            }
        }
        setCountriesData(repaired);
        alert(`✅ Coordenadas reparadas para ${missing.length} países.`);
    } finally {
        setLookingUp(false);
    }
  };

  const handleCountryChange = (id: string, field: string, value: any) => {
    if (field === 'id' && editingCountryId === id) {
        setEditingCountryId(value);
    }
    
    setCountriesData(prev => prev.map((c: any) => {
        if (c.id !== id) return c;
        
        const newC = { ...c, [field]: value };
        
        // Auto-detect if User types country name
        if (field === 'pais') {
            const normalizedName = value.toLowerCase().trim();
            const isoMatched = countryNameToIso[normalizedName];
            if (isoMatched) {
                newC.id = isoMatched;
                newC.emoji = getEmojiFlag(isoMatched);
                if (countryCoordinates[isoMatched]) {
                    newC.lat = countryCoordinates[isoMatched].lat;
                    newC.lng = countryCoordinates[isoMatched].lng;
                }
                if (editingCountryId === id) {
                    setEditingCountryId(isoMatched); // keep editor open on auto-iso change
                }
            }
        }
        
        // Auto-detect Emoji and Coordinates if ID changes directly
        if (field === 'id' && value.length === 2 && value === value.toUpperCase()) {
            newC.emoji = getEmojiFlag(value);
            if (countryCoordinates[value]) {
                newC.lat = countryCoordinates[value].lat;
                newC.lng = countryCoordinates[value].lng;
            }
        }
        
        return newC;
    }));
  };

  const handlePlatformChange = (id: string, platform: string, value: string) => {
    setCountriesData(prev => prev.map((c: any) => {
        if (c.id !== id) return c;
        const newPlats = { ...(c.plataformas || {}), [platform]: parseInt(value) || 0 };
        // auto update total volume
        const total = Object.values(newPlats).reduce((acc: any, val: any) => acc + (val || 0), 0);
        return { ...c, plataformas: newPlats, volumen: total };
    }));
  };
  
  const handleExcelUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
        try {
            const bstr = evt.target?.result;
            const wb = XLSX.read(bstr, { type: 'binary' });
            const wsname = wb.SheetNames[0];
            const ws = wb.Sheets[wsname];
            const data = XLSX.utils.sheet_to_json(ws);
            
            let updated = [...countriesData];
            let addedCount = 0;
            let updatedCount = 0;

            // Helper to parse numbers with thousands separators (e.g., "48.200")
            const parseNum = (val: any) => {
                if (typeof val === 'number') return val;
                if (!val) return 0;
                return parseInt(val.toString().replace(/\./g, '').replace(/,/g, ''), 10) || 0;
            };

            data.forEach((row: any) => {
                // Determine ID (e.g., from Country Name since ID column is missing now)
                const countryName = (row['Pais'] || row['pais'] || '').toString().trim().toLowerCase();
                const id = countryNameToIso[countryName] || (row['ID'] || row['id'] || '').toString().toUpperCase().trim();
                if (!id || id.length !== 2) return;

                const idx = updated.findIndex((c: any) => c.id === id);
                const existing = idx !== -1 ? updated[idx] : null;

                // Platform data
                const tiktokVol = parseNum(row['TikTok']);
                const xVol = parseNum(row['X']);
                const instaVol = parseNum(row['Instagram']);
                const fbVol = parseNum(row['Facebook']);

                const newPlats = {
                    TikTok: tiktokVol || (existing?.plataformas?.TikTok || 0),
                    X: xVol || (existing?.plataformas?.X || 0),
                    Instagram: instaVol || (existing?.plataformas?.Instagram || 0),
                    Facebook: fbVol || (existing?.plataformas?.Facebook || 0)
                };

                // Auto-calculate dominant platform
                const platformsArr = Object.entries(newPlats) as [string, number][];
                const dominantPlatform = platformsArr.reduce((a, b) => (b[1] > a[1] ? b : a))[0];

                const totalVol = platformsArr.reduce((a, [_, v]) => a + v, 0);

                // Sentiment data
                const pos = parseInt(row['Positivo'] || 0);
                const neu = parseInt(row['Neutral'] || 0);
                const neg = parseInt(row['Negativo'] || 0);

                const newSentimentPct = {
                    positivo: !isNaN(pos) ? pos : (existing?.sentimientoPct?.positivo || 33),
                    neutral: !isNaN(neu) ? neu : (existing?.sentimientoPct?.neutral || 33),
                    negativo: !isNaN(neg) ? neg : (existing?.sentimientoPct?.negativo || 34),
                };

                const countryObj = {
                    id,
                    pais: row['Pais'] || row['pais'] || (existing?.pais || countryName),
                    tema: row['Tema'] || row['tema'] || (existing?.tema || 'Sin definir'),
                    volumen: totalVol,
                    plataformas: newPlats,
                    plataformaDominante: dominantPlatform,
                    sentimiento: (row['Sentimiento'] || existing?.sentimiento || 'neutral').toLowerCase(),
                    sentimientoPct: newSentimentPct,
                    tendencia: row['Tendencia'] || existing?.tendencia || 'estable',
                    pctCambio: parseFloat(row['PctCambio']?.toString().replace(',', '.') || existing?.pctCambio || 0),
                    resumen: row['Resumen'] || existing?.resumen || '',
                    topHashtags: row['Hashtags'] ? row['Hashtags'].toString().split(/[\s,]+/).map((s:any) => s.trim()).filter((s:any) => s.length > 0) : (existing?.topHashtags || []),
                    keywords: row['Keywords'] ? row['Keywords'].toString().split(',').map((s:any) => s.trim()).filter((s:any) => s.length > 0) : (existing?.keywords || []),
                    lat: existing?.lat || countryCoordinates[id]?.lat || 0,
                    lng: existing?.lng || countryCoordinates[id]?.lng || 0,
                    emoji: existing?.emoji || getEmojiFlag(id),
                    updateTime: 'Sincronizado'
                };

                if (idx !== -1) {
                    updated[idx] = countryObj;
                    updatedCount++;
                } else {
                    updated.push(countryObj);
                    addedCount++;
                }
            });

            setCountriesData(updated);
            alert(`✅ Excel procesado con éxito.\n\n- Países actualizados: ${updatedCount}\n- Países nuevos: ${addedCount}`);
        } catch(err) {
            console.error(err);
            alert("❌ Error procesando Excel. Verifica los nombres de las columnas.");
        }
    };
    reader.readAsBinaryString(file);
  };
  
  const handleArrayChange = (id: string, field: string, value: string) => {
    const arr = value.split(',').map((s: any) => s.trim()).filter((s: any) => s.length > 0);
    handleCountryChange(id, field, arr);
  };

  const handleSentimentPctChange = (id: string, type: 'positivo' | 'neutral' | 'negativo', value: number) => {
    setCountriesData(prev => prev.map((c: any) => {
        if (c.id !== id) return c;
        const newPct = { ...(c.sentimientoPct || { positivo: 0, neutral: 0, negativo: 0 }), [type]: value };
        return { ...c, sentimientoPct: newPct };
    }));
  };

  const saveMapData = async () => {
    try {
        setLoadingDb(true);
        for (const c of countriesData) {
            // If we're upserting, we need all required DB columns or the mapped ones
            const updateData = {
                id: c.id,
                pais: c.pais,
                emoji: c.emoji || '🌍',
                lat: c.lat || 0,
                lng: c.lng || 0,
                tema: c.tema || 'Nuevo',
                keywords: c.keywords || [],
                sentimiento: c.sentimiento,
                sentimiento_pct: c.sentimientoPct || { positivo: 33, neutral: 33, negativo: 33 },
                volumen: parseInt((c.volumen || 0).toString()),
                plataforma_dominante: c.plataformaDominante || 'X',
                plataformas: c.plataformas || { X: 0 },
                resumen: c.resumen || '',
                tendencia: c.tendencia || 'estable',
                pct_cambio: parseFloat((c.pctCambio || 0).toString()),
                top_hashtags: c.topHashtags || [],
                update_time: c.updateTime || 'hace poco'
            };
            await supabase.from('mapa_paises').upsert(updateData, { onConflict: 'id' });
        }
        alert("Datos del mapa guardados exitosamente!");
        fetchMapData();
    } catch(err) {
        console.error(err);
        alert("Error al guardar.");
    } finally {
        setLoadingDb(false);
    }
  };

  const addNewCountry = () => {
    const newId = `TEMP${Math.floor(Math.random() * 100)}`;
    setCountriesData([{
        id: newId,
        pais: 'Nuevo País',
        emoji: '🌍',
        lat: 0,
        lng: 0,
        tema: 'Sin definir',
        keywords: [],
        sentimiento: 'neutral',
        sentimientoPct: { positivo: 33, neutral: 33, negativo: 33 },
        volumen: 0,
        plataformaDominante: 'X',
        plataformas: { X: 0 },
        resumen: '',
        tendencia: 'estable',
        pctCambio: 0,
        topHashtags: [],
        updateTime: 'hace poco'
    }, ...countriesData]);
  };

  const country = useMemo(() => {
      const c = countriesData.find((c) => c.id === selected);
      if (!c) return null;
      if (!selectedPlatform) return { ...c };
      const platformVol = (c.plataformas as any)[selectedPlatform] || 0;
      return { ...c, volumen: platformVol };
  }, [selected, selectedPlatform, countriesData]);

  const sortedCountries = useMemo(() => {
    let data = [...countriesData];
    if (selectedPlatform) {
        data = data.filter((c: any) => (c.plataformas as any)[selectedPlatform] > 0);
    }
    return data.sort((a: any, b: any) => {
        const volA = selectedPlatform ? (a.plataformas as any)[selectedPlatform] || 0 : a.volumen;
        const volB = selectedPlatform ? (b.plataformas as any)[selectedPlatform] || 0 : b.volumen;
        return volB - volA;
    });
  }, [selectedPlatform, countriesData]);

  const maxVolume = useMemo(() => {
    if (countriesData.length === 0) return 1;
    return Math.max(...countriesData.map((c: any) => 
      selectedPlatform ? (c.plataformas as any)[selectedPlatform] || 0 : c.volumen
    ), 1);
  }, [countriesData, selectedPlatform]);

  const dynamicKpis = useMemo(() => {
    if (!countriesData || countriesData.length === 0) {
        return [
            { label: "Menciones globales", value: "0", delta: "0%", trend: "neutral" as const },
            { label: "Paises activos", value: "0", delta: null, trend: "neutral" as const },
            { label: "Sentimiento positivo", value: "0%", delta: null, trend: "neutral" as const },
            { label: "Pais mas activo", value: "---", delta: "0", trend: "neutral" as const },
        ];
    }

    const totalMentions = countriesData.reduce((acc: any, c: any) => acc + (selectedPlatform ? (c.plataformas as any)[selectedPlatform] || 0 : c.volumen), 0);
    const activeCountries = countriesData.filter((c: any) => (selectedPlatform ? (c.plataformas as any)[selectedPlatform] || 0 : c.volumen) > 0).length;
    
    // Weighted Sentiment and Pct Cambio
    let weightedPos = 0;
    let weightedPct = 0;
    let totalVolForSentiment = 0;
    
    countriesData.forEach((c: any) => {
        const vol = selectedPlatform ? (c.plataformas as any)[selectedPlatform] || 0 : c.volumen;
        if (vol > 0) {
            if (c.sentimientoPct) {
                weightedPos += (c.sentimientoPct.positivo || 0) * vol;
                totalVolForSentiment += vol;
            }
            weightedPct += (c.pct_cambio || 0) * vol;
        }
    });

    const avgSentiment = totalVolForSentiment > 0 ? Math.round(weightedPos / totalVolForSentiment) : 0;
    const avgPct = totalMentions > 0 ? (weightedPct / totalMentions).toFixed(1) : "0";

    // Most active
    const sorted = [...countriesData].sort((a: any, b: any) => {
        const vA = selectedPlatform ? (a.plataformas as any)[selectedPlatform] || 0 : a.volumen;
        const vB = selectedPlatform ? (b.plataformas as any)[selectedPlatform] || 0 : b.volumen;
        return vB - vA;
    });
    const topCountry = sorted[0];
    const topVol = topCountry ? (selectedPlatform ? (topCountry.plataformas as any)[selectedPlatform] || 0 : topCountry.volumen) : 0;

    const format = (v: number) => {
        if (v >= 1000000) return (v / 1000000).toFixed(1) + 'M';
        if (v >= 1000) return (v / 1000).toFixed(1) + 'K';
        return v.toString();
    };

    return [
        { 
            label: "Menciones globales", 
            value: format(totalMentions), 
            delta: `${parseFloat(avgPct) >= 0 ? '+' : ''}${avgPct}%`, 
            trend: parseFloat(avgPct) >= 0 ? "up" as const : "down" as const 
        },
        { 
            label: "Países activos", 
            value: activeCountries.toString(), 
            delta: null, 
            trend: "up" as const 
        },
        { 
            label: "Sentimiento positivo", 
            value: `${avgSentiment}%`, 
            delta: null, 
            trend: avgSentiment > 50 ? "up" as const : "down" as const 
        },
        { 
            label: "País más activo", 
            value: topCountry ? topCountry.pais : "---", 
            delta: format(topVol), 
            trend: "up" as const 
        },
    ];
  }, [countriesData, selectedPlatform]);

  if (loadingDb) return <TabLoadingScreen section="Mapa Global" />;

  return (
    <div className="flex flex-col p-6 gap-6 page-bg text-white">
      <div className="space-y-4">
        <div className="flex gap-2">
            <span className="bg-[#1e2240] text-[#75ddff] text-xs px-2 py-1 rounded-full border border-[#0094ff]/20">🌐 MAPA GLOBAL</span>
            <span className="inline-flex items-center gap-2 bg-[#0f291e] text-green-400 text-xs px-2.5 py-1 rounded-full border border-green-500/20"><span className="live-dot" style={{ background: "#34d399", boxShadow: "0 0 8px #34d399" }} /> EN TIEMPO REAL</span>
            <span className="bg-[#1e2240] text-[#aab3cf] text-xs px-2 py-1 rounded-full border border-[#8892b0]/20 uppercase">ACTUALIZADO {timeAgo}</span>
        </div>
        <div>
          <h1 className="font-heading text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight gradient-text text-glow-blue break-words">Conversación Global — Centro de Mando Digital LinkTIC</h1>
          <p className="text-[#aab3cf] mt-2">Hola {firstName}, bienvenido. Conoce la narrativa y las tendencias internacionales del Centro de Mando Digital LinkTIC. Haz clic en un marcador para ver el detalle.</p>
        </div>

        {sortedCountries.length > 0 && (
          <div className="relative flex items-center rounded-full border border-[#2a2a4a] panel overflow-hidden backdrop-blur-sm">
            <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-red-600/25 to-transparent shrink-0 z-10">
              <span className="live-dot" />
              <span className="text-[11px] font-bold uppercase tracking-wider text-red-300">En vivo</span>
            </div>
            <div className="marquee flex-1 py-2">
              <div className="marquee-track" style={{ animationDuration: "70s" }}>
                {[...sortedCountries.slice(0, 14), ...sortedCountries.slice(0, 14)].map((c: any, i: number) => {
                  const vol = selectedPlatform ? (c.plataformas as any)[selectedPlatform] || 0 : c.volumen;
                  const up = (c.pctCambio || 0) >= 0;
                  return (
                    <span key={i} className="inline-flex items-center gap-2 px-5 text-sm border-r border-[#1e2240]">
                      <Flag code={c.id} className="h-3 w-auto rounded-[2px]" showCodeFallback={false} />
                      <span className="text-[#e4e9f5]">{c.pais}</span>
                      <span className="font-semibold text-yellow-500 tabular-nums">{vol.toLocaleString()}</span>
                      <span className={`text-xs font-semibold ${up ? "text-green-400" : "text-red-400"}`}>{up ? "▲" : "▼"} {Math.abs(c.pctCambio || 0)}%</span>
                    </span>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        <KpiCards items={dynamicKpis} />

        <div className="flex flex-wrap gap-4 items-center mt-4">
            <div className="flex flex-wrap gap-2">
                <Button variant="outline" size="sm" className={`panel border-[#2a2a4a] ${!selectedPlatform ? 'bg-primary/20 border-primary' : 'text-white'}`} onClick={() => setSelectedPlatform(null)}>Todas</Button>
                {Object.keys(platformConfig).map(plat => (
                    <Button key={plat} variant="outline" size="sm" className={`panel border-[#2a2a4a] ${selectedPlatform === plat ? 'bg-primary/20 border-primary' : 'text-white'}`} onClick={() => setSelectedPlatform(plat)}><BrandIcon name={plat} className="mr-2"/> {plat}</Button>
                ))}
                <Button variant="outline" size="sm" className="panel border-[#2a2a4a] text-white" onClick={() => fetchMapData()}><FontAwesomeIcon icon={faRotate} className="h-4 w-4 mr-2"/> Actualizar</Button>
            </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:h-[600px]">
        <Card className="lg:col-span-2 overflow-hidden well border border-[#1e2240] shadow-none h-[380px] sm:h-[460px] lg:h-full neon-frame rounded-xl">
          <Suspense fallback={<div className="h-full flex items-center justify-center">Cargando...</div>}>
            <Globe className="h-full" onSelect={setSelected} selectedCountryId={selected} selectedPlatform={selectedPlatform} countriesData={countriesData} globeMarkers={globeMarkers} sentimentColors={sentimentColors} platformColors={platformColors} />
          </Suspense>
        </Card>

        <div className="flex flex-col gap-6 lg:h-full lg:overflow-y-auto">
          {country ? (
            <CountryDetail
                key={country.id}
                country={country}
                selectedPlatform={selectedPlatform}
                sentimentColors={sentimentColors}
                platformColors={platformColors}
                BrandIcon={BrandIcon}
            />
          ) : (
            <Card className="p-6 h-40 flex flex-col items-center justify-center text-center panel border border-[#1e2240] text-white">
                <FontAwesomeIcon icon={faGlobe} className="w-8 h-8 text-[#0094ff] mb-2"/>
                <h3 className="font-bold">Selecciona un país</h3>
                <p className="text-xs text-[#aab3cf]">Haz click en un marcador del globo para ver la conversación detallada del territorio</p>
            </Card>
          )}

          <Card className="flex-none shadow-md border-none panel text-white">
            <div className="p-4 font-bold text-lg flex justify-between">
                Ranking de Países <span className="text-sm font-normal text-[#aab3cf]">por menciones</span>
            </div>
            <div className="space-y-1 p-2">
                {sortedCountries.slice(0, 8).map((c, i) => (
                  <button key={c.id} onClick={() => setSelected(c.id)} className="w-full flex items-center gap-3 p-3 hover:bg-white/5 rounded transition-colors">
                    <span className="font-bold text-[#8892b0] w-6">{i + 1}</span>
                    <span className="w-6 flex justify-center shrink-0"><Flag code={c.id} className="h-3.5 w-auto rounded-[2px]" /></span>
                    <span className="flex-1 text-sm text-left">{c.pais}</span>
                    <span className="text-sm font-semibold text-yellow-500">{(selectedPlatform ? (c.plataformas as any)[selectedPlatform] || 0 : c.volumen).toLocaleString()}</span>
                    <span className={`text-xs ${c.pctCambio > 0 ? "text-green-500" : "text-red-500"}`}>{c.pctCambio > 0 ? "↗" : "↘"} {Math.abs(c.pctCambio)}%</span>
                  </button>
                ))}
            </div>
          </Card>
        </div>
      </div>

      <div className="mt-8">
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <FontAwesomeIcon icon={faGlobe} className="text-[#0094ff] w-5 h-5"/>
            Países en donde se habla de LinkTIC
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {sortedCountries.map((c: any) => (
                <button 
                    key={c.id} 
                    onClick={() => setSelected(c.id)}
                    className="p-4 panel border border-[#1e2240] rounded-2xl text-left hover:border-primary/50 transition-all"
                >
                    <div className="flex justify-between items-center gap-2 mb-1">
                        <h4 className="font-bold text-sm flex items-center gap-2 min-w-0">
                            <Flag code={c.id} className="h-3.5 w-auto rounded-[2px] shrink-0" />
                            <span className="truncate">{c.pais}</span>
                        </h4>
                        <span className={`text-xs font-semibold shrink-0 whitespace-nowrap ${c.pctCambio > 0 ? "text-green-500" : "text-red-500"}`}>
                            {c.pctCambio > 0 ? "↗ +" : "↘ "} {Math.abs(c.pctCambio)}%
                        </span>
                    </div>
                    <p className="text-xs text-[#aab3cf] mb-3 truncate">{c.tema}</p>
                    <div className="flex justify-between items-center gap-2">
                        <p className="font-bold text-yellow-500 text-sm truncate min-w-0">{(selectedPlatform ? (c.plataformas as any)[selectedPlatform] || 0 : c.volumen).toLocaleString()}</p>
                        <span className={`text-[10px] shrink-0 whitespace-nowrap ${c.sentimiento === 'positivo' ? 'text-green-500' : 'text-[#aab3cf]'}`}>↑ {c.sentimiento.charAt(0).toUpperCase() + c.sentimiento.slice(1)}</span>
                    </div>
                    <div className="w-full h-1 mt-2 rounded-full bg-[#131a30]">
                        <div 
                            className="h-full rounded-full bg-yellow-500 transition-all duration-500" 
                            style={{ width: `${((selectedPlatform ? (c.plataformas as any)[selectedPlatform] || 0 : c.volumen) / maxVolume) * 100}%` }}
                        ></div>
                    </div>
                </button>
            ))}
        </div>
      </div>
      
      <AdminPopup title="Editor de Mapa Global" open={editorOpen} onOpenChange={setEditorOpen}>
        <div className="space-y-6">
            <div className="flex justify-between items-center panel-soft p-4 rounded-xl border border-[#1e2240]">
                <div>
                    <h3 className="font-bold">Datos de Países</h3>
                    <p className="text-xs text-[#aab3cf]">Actualiza las métricas principales de conversación de cada país.</p>
                </div>
                <div className="flex gap-2 flex-wrap">
                    <Button type="button" onClick={addNewCountry} variant="outline" className="panel-soft border-[#2a2a4a] text-white">
                        <FontAwesomeIcon icon={faPlus} className="mr-2" /> Agregar País
                    </Button>
                    <Button type="button" onClick={repairAllCoordinates} disabled={lookingUp} variant="outline" className="bg-amber-500/10 border-amber-500/30 text-amber-400 hover:bg-amber-500/20">
                        <FontAwesomeIcon icon={faRotate} className={`mr-2 ${lookingUp ? 'animate-spin' : ''}`} /> 
                        {lookingUp ? 'Reparando...' : 'Reparar Coords'}
                    </Button>
                    <label className="bg-[#0094ff]/10 hover:bg-[#0094ff]/20 text-[#75ddff] px-4 py-2 rounded-md text-sm font-medium cursor-pointer transition-colors flex items-center">
                        <FontAwesomeIcon icon={faUpload} className="mr-2" /> Importar Excel
                        <input type="file" accept=".xlsx, .xls" className="hidden" onChange={handleExcelUpload} />
                    </label>
                    <Button type="button" onClick={saveMapData} className="bg-emerald-500 hover:bg-emerald-600 text-white">
                        <FontAwesomeIcon icon={faSave} className="mr-2" /> Guardar Todos
                    </Button>
                </div>
            </div>
            
            <div className="bg-[#10142a] p-4 rounded-xl border border-[#1e2240]">
                <label className="text-xs text-[#aab3cf] uppercase tracking-widest font-bold mb-2 block">Seleccionar País a Editar</label>
                <select 
                    className="w-full h-10 rounded-lg panel-soft border border-[#2a2a4a] px-3 py-2 text-sm outline-none focus:border-primary text-white"
                    value={editingCountryId || ''}
                    onChange={(e) => setEditingCountryId(e.target.value)}
                >
                    <option value="">-- Seleccionar --</option>
                    {countriesData.map((c: any) => (
                        <option key={c.id} value={c.id}>{c.pais} ({c.id})</option>
                    ))}
                </select>
            </div>

            {editingCountryId && countriesData.find((c: any) => c.id === editingCountryId) && (
                <div className="space-y-4 bg-[#10142a] p-4 rounded-xl border border-[#1e2240]">
                    {(() => {
                        // Sync raw fields when editing country changes

                        const c = countriesData.find((c: any) => c.id === editingCountryId)!;
                        return (
                            <div className="space-y-4">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-[10px] text-[#aab3cf] uppercase tracking-widest block mb-1">ID (ISO 2-letras)</label>
                                        <Input type="text" value={c.id} readOnly className="panel border-[#1e2240] h-10 opacity-60" />
                                    </div>
                                    <div>
                                        <label className="text-[10px] text-[#aab3cf] uppercase tracking-widest block mb-1">
                                            Nombre del País {lookingUp && <span className="text-[#75ddff] ml-2 animate-pulse">Buscando...</span>}
                                        </label>
                                        <Input 
                                            type="text" 
                                            value={c.pais} 
                                            onChange={(e) => handleCountryChange(c.id, 'pais', e.target.value)} 
                                            onBlur={(e) => lookupCountryByName(c.id, e.target.value)}
                                            placeholder="Escribe el nombre y sale el foco para auto-detectar"
                                            className="panel-soft border-[#2a2a4a] h-10" 
                                        />
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:items-center">
                                    <div>
                                        <label className="text-[10px] text-[#aab3cf] uppercase tracking-widest block mb-1">Latitud</label>
                                        <Input type="number" step="0.0001" value={c.lat ?? 0} onChange={(e) => handleCountryChange(c.id, 'lat', parseFloat(e.target.value))} className="panel-soft border-[#2a2a4a] h-10" />
                                    </div>
                                    <div>
                                        <label className="text-[10px] text-[#aab3cf] uppercase tracking-widest block mb-1">Longitud</label>
                                        <Input type="number" step="0.0001" value={c.lng ?? 0} onChange={(e) => handleCountryChange(c.id, 'lng', parseFloat(e.target.value))} className="panel-soft border-[#2a2a4a] h-10" />
                                    </div>
                                    <div className="flex flex-col items-center justify-center pt-4">
                                        <span className="text-3xl">{c.emoji || '🌍'}</span>
                                        <span className="text-[10px] text-[#8892b0] mt-1">Auto-bandera</span>
                                    </div>
                                </div>
                                {(!c.lat && !c.lng) && (
                                    <p className="text-xs text-amber-400 bg-amber-400/10 px-3 py-2 rounded-lg">
                                        ⚠️ Coordenadas en 0,0. Escribe el nombre del país o ajusta lat/lng manualmente para ubicarlo en el globo.
                                    </p>
                                )}
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-[10px] text-[#aab3cf] uppercase tracking-widest block mb-1">Tema Principal</label>
                                        <Input type="text" value={c.tema} onChange={(e) => handleCountryChange(c.id, 'tema', e.target.value)} className="panel-soft border-[#2a2a4a] h-10" />
                                    </div>
                                    <div>
                                        <label className="text-[10px] text-[#aab3cf] uppercase tracking-widest block mb-1">Tendencia General</label>
                                        <select 
                                            className="w-full h-10 rounded-lg panel-soft border border-[#2a2a4a] px-2.5 py-1 text-sm outline-none"
                                            value={c.tendencia} onChange={(e) => handleCountryChange(c.id, 'tendencia', e.target.value)}
                                        >
                                            <option value="sube">Sube</option>
                                            <option value="baja">Baja</option>
                                            <option value="estable">Estable</option>
                                        </select>
                                    </div>
                                </div>
                                
                                <h4 className="text-sm font-bold text-[#75ddff] border-b border-[#2a2a4a] pb-2 mt-4">Redes Sociales (Menciones)</h4>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="flex items-center gap-3">
                                        <FontAwesomeIcon icon={faTiktok} className="text-white w-5 h-5"/>
                                        <Input type="number" value={(c.plataformas as any)?.TikTok || 0} onChange={(e) => handlePlatformChange(c.id, 'TikTok', e.target.value)} className="panel-soft border-[#2a2a4a] h-8" />
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <FontAwesomeIcon icon={faXTwitter} className="text-white w-5 h-5"/>
                                        <Input type="number" value={(c.plataformas as any)?.X || 0} onChange={(e) => handlePlatformChange(c.id, 'X', e.target.value)} className="panel-soft border-[#2a2a4a] h-8" />
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <FontAwesomeIcon icon={faInstagram} className="text-[#E1306C] w-5 h-5"/>
                                        <Input type="number" value={(c.plataformas as any)?.Instagram || 0} onChange={(e) => handlePlatformChange(c.id, 'Instagram', e.target.value)} className="panel-soft border-[#2a2a4a] h-8" />
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <FontAwesomeIcon icon={faFacebook} className="text-[#1877F2] w-5 h-5"/>
                                        <Input type="number" value={(c.plataformas as any)?.Facebook || 0} onChange={(e) => handlePlatformChange(c.id, 'Facebook', e.target.value)} className="panel-soft border-[#2a2a4a] h-8" />
                                    </div>
                                </div>
                                
                                <div className="grid grid-cols-3 gap-4 mt-4">
                                    <div>
                                        <label className="text-[10px] text-[#aab3cf] uppercase tracking-widest block mb-1">Volumen Total</label>
                                        <Input type="number" value={c.volumen} disabled className="panel border-[#1e2240] h-10 text-yellow-500 font-bold opacity-70" />
                                    </div>
                                    <div>
                                        <label className="text-[10px] text-[#aab3cf] uppercase tracking-widest block mb-1">Sentimiento</label>
                                        <select 
                                            className="w-full h-10 rounded-lg panel-soft border border-[#2a2a4a] px-2.5 py-1 text-sm outline-none focus:border-primary"
                                            value={c.sentimiento} onChange={(e) => handleCountryChange(c.id, 'sentimiento', e.target.value)}
                                        >
                                            <option value="positivo">Positivo</option>
                                            <option value="neutral">Neutral</option>
                                            <option value="negativo">Negativo</option>
                                            <option value="mixto">Mixto</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="text-[10px] text-[#aab3cf] uppercase tracking-widest block mb-1">% Crecimiento</label>
                                        <Input type="number" value={c.pctCambio} onChange={(e) => handleCountryChange(c.id, 'pctCambio', e.target.value)} className="panel-soft border-[#2a2a4a] h-10" />
                                    </div>
                                </div>

                                <h4 className="text-sm font-bold text-[#75ddff] border-b border-[#2a2a4a] pb-2 mt-4">Distribución del Sentimiento (%)</h4>
                                <div className="grid grid-cols-3 gap-4">
                                    <div>
                                        <label className="text-[10px] text-green-400 uppercase tracking-widest block mb-1">Positivo</label>
                                        <DecimalInput value={c.sentimientoPct?.positivo || 0} onChange={(v) => handleSentimentPctChange(c.id, 'positivo', v)} className="panel-soft border-[#2a2a4a] h-10" />
                                    </div>
                                    <div>
                                        <label className="text-[10px] text-yellow-400 uppercase tracking-widest block mb-1">Neutral</label>
                                        <DecimalInput value={c.sentimientoPct?.neutral || 0} onChange={(v) => handleSentimentPctChange(c.id, 'neutral', v)} className="panel-soft border-[#2a2a4a] h-10" />
                                    </div>
                                    <div>
                                        <label className="text-[10px] text-red-400 uppercase tracking-widest block mb-1">Negativo</label>
                                        <DecimalInput value={c.sentimientoPct?.negativo || 0} onChange={(v) => handleSentimentPctChange(c.id, 'negativo', v)} className="panel-soft border-[#2a2a4a] h-10" />
                                    </div>
                                </div>

                                <h4 className="text-sm font-bold text-[#75ddff] border-b border-[#2a2a4a] pb-2 mt-4">Detalles Cualitativos</h4>
                                <div>
                                    <label className="text-[10px] text-[#aab3cf] uppercase tracking-widest block mb-1">Top Hashtags (separados por coma)</label>
                                    <Input 
                                        type="text" 
                                        value={rawHashtags}
                                        placeholder="Ej: #Elecciones2026, #LinkTIC"
                                        onFocus={() => setRawHashtags((c.topHashtags || []).join(', '))}
                                        onChange={(e) => setRawHashtags(e.target.value)}
                                        onBlur={(e) => handleArrayChange(c.id, 'topHashtags', e.target.value)}
                                        className="panel-soft border-[#2a2a4a] h-10" 
                                    />
                                </div>
                                <div>
                                    <label className="text-[10px] text-[#aab3cf] uppercase tracking-widest block mb-1">Palabras Clave (separadas por coma)</label>
                                    <Input 
                                        type="text" 
                                        value={rawKeywords}
                                        placeholder="Ej: fraude, votaciones, garantías"
                                        onFocus={() => setRawKeywords((c.keywords || []).join(', '))}
                                        onChange={(e) => setRawKeywords(e.target.value)}
                                        onBlur={(e) => handleArrayChange(c.id, 'keywords', e.target.value)}
                                        className="panel-soft border-[#2a2a4a] h-10" 
                                    />
                                </div>
                                <div>
                                    <label className="text-[10px] text-[#aab3cf] uppercase tracking-widest block mb-1">Resumen / Análisis Corto</label>
                                    <textarea 
                                        className="w-full h-24 rounded-lg panel-soft border border-[#2a2a4a] p-3 text-sm outline-none focus:border-primary text-[#c0c8de] resize-none"
                                        value={c.resumen || ''}
                                        placeholder="Escribe un análisis representativo del país..."
                                        onChange={(e) => handleCountryChange(c.id, 'resumen', e.target.value)}
                                    ></textarea>
                                </div>
                            </div>
                        );
                    })()}
                </div>
            )}
        </div>
      </AdminPopup>
    </div>
  );
}
