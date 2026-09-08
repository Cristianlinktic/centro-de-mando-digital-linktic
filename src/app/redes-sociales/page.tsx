"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/components/auth-provider";
import { canEdit } from "@/lib/auth/rbac";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { TOOLTIP_STYLE, TOOLTIP_LABEL_STYLE, TOOLTIP_ITEM_STYLE } from "@/lib/chart-theme";
import {
  faUsers,
  faUserPlus,
  faEye,
  faHeart,
  faComment,
  faFileLines,
  faPaperPlane,
  faBolt,
  faCalendarDays,
  faSave,
  faXmark,
  faPlus,
  faTrash,
  faUpload,
  faRotate,
  faSpinner,
} from "@fortawesome/free-solid-svg-icons";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  Radar,
  PieChart,
  Pie,
  Cell,
} from "recharts";

const IMAGES_BUCKET = "centro-mando-images";
const CATEGORIA = "linktic";

/* ============================================================================
 * Tipos
 * ========================================================================== */

interface EstrategiaRow {
  id: string;
  fecha: string;
  seguidores: number;
  nuevos_seguidores: number;
  num_publicaciones: number;
  contenidos_entregados: number;
  contenidos_publicados: number;
  impresiones: number;
  reacciones_likes: number;
  comentarios_respuestas: number;
  social_performance_score: number;
  sentimiento_positivo: number;
  sentimiento_negativo: number;
  publicaciones_principales: string | null;
}

type Importancia = "alta" | "media" | "baja";
type Impacto = "positivo" | "negativo" | "neutral";

interface TagItem {
  text: string;
  importance: Importancia;
}
interface ImpactItem {
  nombre: string;
  identificador: string;
  impacto: Impacto;
}
interface EmocionValor {
  resultados: string;
  porcentaje: number;
  tendencia: "igual" | "subio" | "bajo";
}

const EMOCIONES = [
  { key: "Alegria", label: "Alegría", emoji: "😀", color: "#2eb88a" },
  { key: "Amor", label: "Amor", emoji: "😍", color: "#e879f9" },
  { key: "Sorpresa", label: "Sorpresa", emoji: "😮", color: "#f3b116" },
  { key: "Tristeza", label: "Tristeza", emoji: "😢", color: "#0094ff" },
  { key: "Miedo", label: "Miedo", emoji: "😨", color: "#a78bfa" },
  { key: "Ira", label: "Ira", emoji: "😡", color: "#df3a3a" },
] as const;

interface ListeningRow {
  id: string;
  fecha: string;
  resultados: string;
  interacciones: string;
  alcance_potencial: string;
  sentimiento_positivo: number;
  sentimiento_negativo: number;
  activity_peak: string | null;
  hashtags: string | null;
  hashtags_para_usar: TagItem[];
  palabras_claves_para_usar: TagItem[];
  que_no_usar: TagItem[];
  cuentas_impacto: ImpactItem[];
  sitios_impacto: ImpactItem[];
  cuota_emocion: Record<string, EmocionValor>;
}

const num = (v: unknown) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};

const todayStr = () => new Date().toISOString().slice(0, 10);

/* ============================================================================
 * Piezas reutilizables
 * ========================================================================== */

function KpiCard({
  label,
  value,
  icon,
  colorClass = "text-[#0094ff]",
  suffix,
}: {
  label: string;
  value: number | string;
  icon: typeof faUsers;
  colorClass?: string;
  suffix?: string;
}) {
  return (
    <Card className="panel border-[#1e2240] p-5 rounded-2xl">
      <div className="flex items-center gap-3 mb-3">
        <div className={`p-2 rounded-xl bg-white/5 border border-[#2a2a4a] ${colorClass}`}>
          <FontAwesomeIcon icon={icon} className="w-4 h-4" />
        </div>
        <p className="text-[10px] font-bold text-[#8892b0] tracking-wider uppercase">{label}</p>
      </div>
      <p className={`text-2xl font-bold ${colorClass}`}>
        {typeof value === "number" ? value.toLocaleString("es-CO") : value}
        {suffix && <span className="text-sm text-[#8892b0] ml-1">{suffix}</span>}
      </p>
    </Card>
  );
}

function SentimentDonut({
  positivo,
  negativo,
  title,
}: {
  positivo: number;
  negativo: number;
  title: string;
}) {
  const pos = num(positivo);
  const neg = num(negativo);
  const neu = Math.max(0, 100 - pos - neg);
  const segments = [
    { name: "Positivo", value: pos, color: "#2eb88a" },
    { name: "Neutral", value: neu, color: "#aab3cf" },
    { name: "Negativo", value: neg, color: "#df3a3a" },
  ];
  const dominant = segments.reduce((a, b) => (a.value >= b.value ? a : b));
  const emoji = dominant.name === "Positivo" ? "😊" : dominant.name === "Negativo" ? "😟" : "😐";

  return (
    <Card className="panel border-[#1e2240] p-6 rounded-2xl">
      <h3 className="text-sm font-semibold mb-5 text-[#e4e9f5] uppercase tracking-widest">{title}</h3>
      <div className="flex items-center gap-6">
        <div className="relative w-36 h-36 shrink-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={segments}
                cx="50%"
                cy="50%"
                innerRadius={44}
                outerRadius={62}
                startAngle={90}
                endAngle={-270}
                dataKey="value"
                strokeWidth={0}
              >
                {segments.map((s) => (
                  <Cell key={s.name} fill={s.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={TOOLTIP_STYLE} labelStyle={TOOLTIP_LABEL_STYLE} itemStyle={TOOLTIP_ITEM_STYLE}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <span className="text-2xl">{emoji}</span>
          </div>
        </div>
        <div className="flex-1 space-y-2">
          {segments.map((s) => (
            <div key={s.name} className="flex items-center justify-between rounded-xl px-3 py-2 bg-white/5">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full" style={{ background: s.color }} />
                <span className="text-xs font-bold text-[#c0c8de]">{s.name}</span>
              </div>
              <span className="text-sm font-bold" style={{ color: s.color }}>
                {s.value.toFixed(1)}%
              </span>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
}

function ImageBox({ src, alt, emptyText }: { src: string | null | undefined; alt: string; emptyText?: string }) {
  if (!src) {
    return (
      <div className="flex-1 min-h-[200px] rounded-xl border border-dashed border-[#2a2a4a] flex items-center justify-center text-xs text-[#8892b0] text-center px-4">
        {emptyText ?? "Sin imagen para esta fecha"}
      </div>
    );
  }
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={src} alt={alt} className="w-full h-full min-h-[200px] object-contain rounded-xl bg-black/20" />;
}

function ImagePicker({
  label,
  file,
  onChange,
}: {
  label: string;
  file: File | null;
  onChange: (f: File | null) => void;
}) {
  return (
    <div className="space-y-1">
      <label className="text-[10px] text-[#8892b0] uppercase font-black">{label}</label>
      <div className="relative w-full well border border-[#2a2a4a] rounded-xl px-4 py-3 flex items-center gap-2">
        <input
          type="file"
          accept="image/*"
          onChange={(e) => onChange(e.target.files?.[0] ?? null)}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        />
        <FontAwesomeIcon icon={faUpload} className="w-4 h-4 text-[#8892b0]" />
        <span className="text-xs text-[#aab3cf] truncate">{file ? file.name : "Seleccionar imagen..."}</span>
      </div>
    </div>
  );
}

async function uploadImage(file: File, prefix: string): Promise<string> {
  const ext = file.name.split(".").pop() || "png";
  const fileName = `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const { error } = await supabase.storage.from(IMAGES_BUCKET).upload(fileName, file);
  if (error) throw new Error("Error al subir la imagen: " + error.message);
  const { data } = supabase.storage.from(IMAGES_BUCKET).getPublicUrl(fileName);
  return data.publicUrl;
}

/* Chips con importancia (hashtags / palabras clave) */
function TagListEditor({
  label,
  items,
  onChange,
}: {
  label: string;
  items: TagItem[];
  onChange: (items: TagItem[]) => void;
}) {
  const [text, setText] = useState("");
  const [importance, setImportance] = useState<Importancia>("alta");

  const add = () => {
    if (!text.trim()) return;
    onChange([...items, { text: text.trim(), importance }]);
    setText("");
  };

  return (
    <div className="space-y-2">
      <label className="text-[10px] text-[#8892b0] uppercase font-black">{label}</label>
      <div className="flex gap-2">
        <Input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              add();
            }
          }}
          placeholder="Ej. #campaña"
          className="well border-[#2a2a4a] h-9 text-xs flex-1"
        />
        <select
          value={importance}
          onChange={(e) => setImportance(e.target.value as Importancia)}
          className="well border border-[#2a2a4a] rounded-md text-xs px-2"
        >
          <option value="alta">Alta</option>
          <option value="media">Media</option>
          <option value="baja">Baja</option>
        </select>
        <Button type="button" size="sm" variant="neon" onClick={add} className="h-9">
          <FontAwesomeIcon icon={faPlus} />
        </Button>
      </div>
      {items.length > 0 && (
        <div className="flex flex-wrap gap-2 pt-1">
          {items.map((it, idx) => (
            <span
              key={idx}
              className="inline-flex items-center gap-2 rounded-full border border-[#2a2a4a] bg-white/5 px-3 py-1 text-xs font-semibold text-[#e4e9f5]"
            >
              {it.text}
              <span className="text-[9px] uppercase font-black text-[#8892b0]">{it.importance}</span>
              <button type="button" onClick={() => onChange(items.filter((_, i) => i !== idx))}>
                <FontAwesomeIcon icon={faXmark} className="w-3 h-3 text-[#8892b0] hover:text-red-400" />
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

function ImpactListEditor({
  label,
  idPlaceholder,
  items,
  onChange,
}: {
  label: string;
  idPlaceholder: string;
  items: ImpactItem[];
  onChange: (items: ImpactItem[]) => void;
}) {
  const [nombre, setNombre] = useState("");
  const [identificador, setIdentificador] = useState("");
  const [impacto, setImpacto] = useState<Impacto>("positivo");

  const add = () => {
    if (!nombre.trim() || !identificador.trim()) return;
    onChange([...items, { nombre: nombre.trim(), identificador: identificador.trim(), impacto }]);
    setNombre("");
    setIdentificador("");
  };

  return (
    <div className="space-y-2">
      <label className="text-[10px] text-[#8892b0] uppercase font-black">{label}</label>
      <div className="flex flex-col sm:flex-row gap-2">
        <Input value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Nombre" className="well border-[#2a2a4a] h-9 text-xs" />
        <Input
          value={identificador}
          onChange={(e) => setIdentificador(e.target.value)}
          placeholder={idPlaceholder}
          className="well border-[#2a2a4a] h-9 text-xs"
        />
        <select
          value={impacto}
          onChange={(e) => setImpacto(e.target.value as Impacto)}
          className="well border border-[#2a2a4a] rounded-md text-xs px-2"
        >
          <option value="positivo">Positivo 😀</option>
          <option value="neutral">Neutral 😐</option>
          <option value="negativo">Negativo 😡</option>
        </select>
        <Button type="button" size="sm" variant="neon" onClick={add} className="h-9">
          <FontAwesomeIcon icon={faPlus} />
        </Button>
      </div>
      {items.length > 0 && (
        <div className="space-y-1.5 pt-1">
          {items.map((it, idx) => (
            <div key={idx} className="flex items-center justify-between bg-white/5 border border-[#2a2a4a] rounded-lg px-3 py-2">
              <div>
                <p className="text-xs font-bold text-[#e4e9f5]">{it.nombre}</p>
                <p className="text-[10px] text-[#8892b0]">{it.identificador}</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-lg">{it.impacto === "positivo" ? "😀" : it.impacto === "negativo" ? "😡" : "😐"}</span>
                <button type="button" onClick={() => onChange(items.filter((_, i) => i !== idx))}>
                  <FontAwesomeIcon icon={faXmark} className="w-3 h-3 text-[#8892b0] hover:text-red-400" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ============================================================================
 * Formulario: Estrategia
 * ========================================================================== */

function EstrategiaFormModal({
  open,
  onClose,
  onSaved,
  initial,
  fecha,
}: {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  initial: EstrategiaRow | null;
  fecha: string;
}) {
  const blank = {
    seguidores: "",
    nuevos_seguidores: "",
    num_publicaciones: "",
    contenidos_entregados: "",
    contenidos_publicados: "",
    impresiones: "",
    reacciones_likes: "",
    comentarios_respuestas: "",
    social_performance_score: "",
    sentimiento_positivo: "",
    sentimiento_negativo: "",
  };
  const [form, setForm] = useState(blank);
  const [image, setImage] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;
    if (initial) {
      setForm({
        seguidores: String(initial.seguidores ?? ""),
        nuevos_seguidores: String(initial.nuevos_seguidores ?? ""),
        num_publicaciones: String(initial.num_publicaciones ?? ""),
        contenidos_entregados: String(initial.contenidos_entregados ?? ""),
        contenidos_publicados: String(initial.contenidos_publicados ?? ""),
        impresiones: String(initial.impresiones ?? ""),
        reacciones_likes: String(initial.reacciones_likes ?? ""),
        comentarios_respuestas: String(initial.comentarios_respuestas ?? ""),
        social_performance_score: String(initial.social_performance_score ?? ""),
        sentimiento_positivo: String(initial.sentimiento_positivo ?? ""),
        sentimiento_negativo: String(initial.sentimiento_negativo ?? ""),
      });
    } else {
      setForm(blank);
    }
    setImage(null);
    setError("");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, initial, fecha]);

  if (!open) return null;

  const set = (k: keyof typeof blank) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const save = async () => {
    setSaving(true);
    setError("");
    try {
      let imageUrl: string | undefined;
      if (image) imageUrl = await uploadImage(image, "estrategia");

      const payload: Record<string, unknown> = {
        categoria: CATEGORIA,
        fecha,
        seguidores: num(form.seguidores),
        nuevos_seguidores: num(form.nuevos_seguidores),
        num_publicaciones: num(form.num_publicaciones),
        contenidos_entregados: num(form.contenidos_entregados),
        contenidos_publicados: num(form.contenidos_publicados),
        impresiones: num(form.impresiones),
        reacciones_likes: num(form.reacciones_likes),
        comentarios_respuestas: num(form.comentarios_respuestas),
        social_performance_score: num(form.social_performance_score),
        sentimiento_positivo: num(form.sentimiento_positivo),
        sentimiento_negativo: num(form.sentimiento_negativo),
      };
      if (imageUrl) payload.publicaciones_principales = imageUrl;

      const { error: upsertError } = await supabase
        .from("rrss_estrategia_metricas")
        .upsert(payload, { onConflict: "fecha,categoria" });
      if (upsertError) throw upsertError;

      onSaved();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al guardar.");
    } finally {
      setSaving(false);
    }
  };

  const fields: [keyof typeof blank, string][] = [
    ["social_performance_score", "Social Performance Score (0-1000)"],
    ["seguidores", "Seguidores"],
    ["nuevos_seguidores", "Nuevos Seguidores"],
    ["num_publicaciones", "Nº Publicaciones"],
    ["contenidos_entregados", "Contenidos Entregados"],
    ["contenidos_publicados", "Contenidos Publicados"],
    ["impresiones", "Impresiones"],
    ["reacciones_likes", "Reacciones / Likes"],
    ["comentarios_respuestas", "Comentarios / Respuestas"],
    ["sentimiento_positivo", "Sentimiento Positivo (%)"],
    ["sentimiento_negativo", "Sentimiento Negativo (%)"],
  ];

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
      <div className="panel border border-[#2a2a4a] rounded-3xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-[#2a2a4a]">
          <div>
            <h2 className="text-xl font-bold text-white">Actualizar Estrategia — {fecha}</h2>
            <p className="text-xs text-[#aab3cf]">Métricas de redes sociales</p>
          </div>
          <button onClick={onClose} className="text-[#aab3cf] hover:text-white">
            <FontAwesomeIcon icon={faXmark} className="w-5 h-5" />
          </button>
        </div>
        <div className="p-6 overflow-y-auto space-y-4">
          {error && <div className="p-3 bg-red-500/10 text-red-400 text-xs rounded-lg border border-red-500/20">{error}</div>}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {fields.map(([key, label]) => (
              <div key={key} className="space-y-1">
                <label className="text-[10px] text-[#8892b0] uppercase font-black">{label}</label>
                <Input type="number" value={form[key]} onChange={set(key)} className="well border-[#2a2a4a] h-9 text-xs" />
              </div>
            ))}
          </div>
          <ImagePicker label="Publicaciones Principales (imagen)" file={image} onChange={setImage} />
        </div>
        <div className="p-6 border-t border-[#2a2a4a] flex justify-end gap-2">
          <Button variant="outline" onClick={onClose} className="text-[#aab3cf]">
            Cancelar
          </Button>
          <Button variant="neon" onClick={save} disabled={saving}>
            <FontAwesomeIcon icon={saving ? faSpinner : faSave} className={`mr-2 ${saving ? "animate-spin" : ""}`} />
            Guardar
          </Button>
        </div>
      </div>
    </div>
  );
}

/* ============================================================================
 * Formulario: Listening
 * ========================================================================== */

function ListeningFormModal({
  open,
  onClose,
  onSaved,
  initial,
  fecha,
}: {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  initial: ListeningRow | null;
  fecha: string;
}) {
  const blankEmocion = (): Record<string, EmocionValor> =>
    Object.fromEntries(EMOCIONES.map((e) => [e.key, { resultados: "", porcentaje: 0, tendencia: "igual" as const }]));

  const [form, setForm] = useState({ resultados: "", interacciones: "", alcance_potencial: "", sentimiento_positivo: "", sentimiento_negativo: "" });
  const [cuota, setCuota] = useState<Record<string, EmocionValor>>(blankEmocion());
  const [hashtagsUsar, setHashtagsUsar] = useState<TagItem[]>([]);
  const [palabrasUsar, setPalabrasUsar] = useState<TagItem[]>([]);
  const [queNoUsar, setQueNoUsar] = useState<TagItem[]>([]);
  const [cuentas, setCuentas] = useState<ImpactItem[]>([]);
  const [sitios, setSitios] = useState<ImpactItem[]>([]);
  const [activityFile, setActivityFile] = useState<File | null>(null);
  const [hashtagsFile, setHashtagsFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;
    if (initial) {
      setForm({
        resultados: String(initial.resultados ?? ""),
        interacciones: String(initial.interacciones ?? ""),
        alcance_potencial: String(initial.alcance_potencial ?? ""),
        sentimiento_positivo: String(initial.sentimiento_positivo ?? ""),
        sentimiento_negativo: String(initial.sentimiento_negativo ?? ""),
      });
      setCuota(initial.cuota_emocion && Object.keys(initial.cuota_emocion).length ? initial.cuota_emocion : blankEmocion());
      setHashtagsUsar(initial.hashtags_para_usar ?? []);
      setPalabrasUsar(initial.palabras_claves_para_usar ?? []);
      setQueNoUsar(initial.que_no_usar ?? []);
      setCuentas(initial.cuentas_impacto ?? []);
      setSitios(initial.sitios_impacto ?? []);
    } else {
      setForm({ resultados: "", interacciones: "", alcance_potencial: "", sentimiento_positivo: "", sentimiento_negativo: "" });
      setCuota(blankEmocion());
      setHashtagsUsar([]);
      setPalabrasUsar([]);
      setQueNoUsar([]);
      setCuentas([]);
      setSitios([]);
    }
    setActivityFile(null);
    setHashtagsFile(null);
    setError("");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, initial, fecha]);

  if (!open) return null;

  const save = async () => {
    setSaving(true);
    setError("");
    try {
      let activityUrl: string | undefined;
      if (activityFile) activityUrl = await uploadImage(activityFile, "activity-peak");
      let hashtagsUrl: string | undefined;
      if (hashtagsFile) hashtagsUrl = await uploadImage(hashtagsFile, "hashtags");

      const payload: Record<string, unknown> = {
        categoria: CATEGORIA,
        fecha,
        resultados: form.resultados,
        interacciones: form.interacciones,
        alcance_potencial: form.alcance_potencial,
        sentimiento_positivo: num(form.sentimiento_positivo),
        sentimiento_negativo: num(form.sentimiento_negativo),
        hashtags_para_usar: hashtagsUsar,
        palabras_claves_para_usar: palabrasUsar,
        que_no_usar: queNoUsar,
        cuentas_impacto: cuentas,
        sitios_impacto: sitios,
        cuota_emocion: cuota,
      };
      if (activityUrl) payload.activity_peak = activityUrl;
      if (hashtagsUrl) payload.hashtags = hashtagsUrl;

      const { error: upsertError } = await supabase
        .from("rrss_listening_metricas")
        .upsert(payload, { onConflict: "fecha,categoria" });
      if (upsertError) throw upsertError;

      onSaved();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al guardar.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
      <div className="panel border border-[#2a2a4a] rounded-3xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-[#2a2a4a]">
          <div>
            <h2 className="text-xl font-bold text-white">Actualizar Listening — {fecha}</h2>
            <p className="text-xs text-[#aab3cf]">Escucha social y análisis de conversación</p>
          </div>
          <button onClick={onClose} className="text-[#aab3cf] hover:text-white">
            <FontAwesomeIcon icon={faXmark} className="w-5 h-5" />
          </button>
        </div>
        <div className="p-6 overflow-y-auto space-y-6">
          {error && <div className="p-3 bg-red-500/10 text-red-400 text-xs rounded-lg border border-red-500/20">{error}</div>}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] text-[#8892b0] uppercase font-black">Resultados</label>
              <Input value={form.resultados} onChange={(e) => setForm((f) => ({ ...f, resultados: e.target.value }))} className="well border-[#2a2a4a] h-9 text-xs" />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] text-[#8892b0] uppercase font-black">Interacciones</label>
              <Input value={form.interacciones} onChange={(e) => setForm((f) => ({ ...f, interacciones: e.target.value }))} className="well border-[#2a2a4a] h-9 text-xs" />
            </div>
            <div className="space-y-1 sm:col-span-2">
              <label className="text-[10px] text-[#8892b0] uppercase font-black">Alcance Potencial</label>
              <Input value={form.alcance_potencial} onChange={(e) => setForm((f) => ({ ...f, alcance_potencial: e.target.value }))} className="well border-[#2a2a4a] h-9 text-xs" />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] text-[#8892b0] uppercase font-black">Sentimiento Positivo (%)</label>
              <Input type="number" value={form.sentimiento_positivo} onChange={(e) => setForm((f) => ({ ...f, sentimiento_positivo: e.target.value }))} className="well border-[#2a2a4a] h-9 text-xs" />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] text-[#8892b0] uppercase font-black">Sentimiento Negativo (%)</label>
              <Input type="number" value={form.sentimiento_negativo} onChange={(e) => setForm((f) => ({ ...f, sentimiento_negativo: e.target.value }))} className="well border-[#2a2a4a] h-9 text-xs" />
            </div>
          </div>

          <div className="border-t border-[#2a2a4a] pt-4">
            <h4 className="text-xs font-black text-[#c0c8de] uppercase tracking-widest mb-3">Cuota de Emoción</h4>
            <div className="space-y-3 bg-white/5 p-4 rounded-xl">
              {EMOCIONES.map(({ key, label, emoji }) => {
                const val = cuota[key] ?? { resultados: "", porcentaje: 0, tendencia: "igual" as const };
                return (
                  <div key={key} className="grid grid-cols-2 sm:grid-cols-4 gap-2 items-center">
                    <span className="text-xs font-bold text-[#c0c8de]">
                      {emoji} {label}
                    </span>
                    <Input
                      placeholder="Resultados"
                      value={val.resultados}
                      onChange={(e) => setCuota((c) => ({ ...c, [key]: { ...val, resultados: e.target.value } }))}
                      className="well border-[#2a2a4a] h-8 text-xs"
                    />
                    <Input
                      type="number"
                      placeholder="%"
                      value={val.porcentaje}
                      onChange={(e) => setCuota((c) => ({ ...c, [key]: { ...val, porcentaje: num(e.target.value) } }))}
                      className="well border-[#2a2a4a] h-8 text-xs"
                    />
                    <select
                      value={val.tendencia}
                      onChange={(e) => setCuota((c) => ({ ...c, [key]: { ...val, tendencia: e.target.value as EmocionValor["tendencia"] } }))}
                      className="well border border-[#2a2a4a] rounded-md text-xs px-2 h-8"
                    >
                      <option value="igual">Sin cambio ▬</option>
                      <option value="subio">Incrementó ▲</option>
                      <option value="bajo">Disminuyó ▼</option>
                    </select>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <ImagePicker label="Activity Peak (imagen)" file={activityFile} onChange={setActivityFile} />
            <ImagePicker label="Hashtags (imagen)" file={hashtagsFile} onChange={setHashtagsFile} />
          </div>

          <TagListEditor label="Hashtags para usar" items={hashtagsUsar} onChange={setHashtagsUsar} />
          <TagListEditor label="Palabras clave para usar" items={palabrasUsar} onChange={setPalabrasUsar} />
          <TagListEditor label="Qué NO usar" items={queNoUsar} onChange={setQueNoUsar} />
          <ImpactListEditor label="Cuentas con mayor impacto" idPlaceholder="Ej. @usuario" items={cuentas} onChange={setCuentas} />
          <ImpactListEditor label="Sitios con mayor impacto" idPlaceholder="Ej. https://ejemplo.com" items={sitios} onChange={setSitios} />
        </div>
        <div className="p-6 border-t border-[#2a2a4a] flex justify-end gap-2">
          <Button variant="outline" onClick={onClose} className="text-[#aab3cf]">
            Cancelar
          </Button>
          <Button variant="neon" onClick={save} disabled={saving}>
            <FontAwesomeIcon icon={saving ? faSpinner : faSave} className={`mr-2 ${saving ? "animate-spin" : ""}`} />
            Guardar
          </Button>
        </div>
      </div>
    </div>
  );
}

/* ============================================================================
 * Página principal
 * ========================================================================== */

export default function RedesSocialesPage() {
  const { role } = useAuth();
  const editable = canEdit(role);

  const [tab, setTab] = useState<"estrategia" | "listening">("estrategia");
  const [fecha, setFecha] = useState(todayStr());
  const dateRef = useRef<HTMLInputElement>(null);

  const [estrategiaData, setEstrategiaData] = useState<EstrategiaRow[]>([]);
  const [listeningData, setListeningData] = useState<ListeningRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const [{ data: est }, { data: lis }] = await Promise.all([
      supabase.from("rrss_estrategia_metricas").select("*").eq("categoria", CATEGORIA).order("fecha", { ascending: true }),
      supabase.from("rrss_listening_metricas").select("*").eq("categoria", CATEGORIA).order("fecha", { ascending: true }),
    ]);
    setEstrategiaData(est ?? []);
    setListeningData(lis ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const filteredEstrategia = useMemo(() => estrategiaData.filter((d) => d.fecha <= fecha), [estrategiaData, fecha]);
  const filteredListening = useMemo(() => listeningData.filter((d) => d.fecha <= fecha), [listeningData, fecha]);

  const latestEst = filteredEstrategia[filteredEstrategia.length - 1] ?? null;
  const latestLis = filteredListening[filteredListening.length - 1] ?? null;

  const chartData = filteredEstrategia.map((d) => ({
    fecha: d.fecha.slice(5),
    Seguidores: d.seguidores,
    Impresiones: d.impresiones,
    Reacciones: d.reacciones_likes,
  }));

  const radarMetrics = [
    { key: "seguidores", label: "Seguidores" },
    { key: "nuevos_seguidores", label: "Nuevos Seg." },
    { key: "impresiones", label: "Impresiones" },
    { key: "reacciones_likes", label: "Reacciones" },
    { key: "comentarios_respuestas", label: "Comentarios" },
  ] as const;
  const radarData = radarMetrics.map(({ key, label }) => {
    const max = Math.max(...filteredEstrategia.map((d) => num((d as unknown as Record<string, unknown>)[key])), 1);
    const val = num((latestEst as unknown as Record<string, unknown>)?.[key] ?? 0);
    return { metric: label, value: Math.round((val / max) * 100), raw: val };
  });

  const impactCounts = useMemo(() => {
    const all = [...(latestLis?.cuentas_impacto ?? []), ...(latestLis?.sitios_impacto ?? [])];
    const counts: Record<string, number> = { positivo: 0, negativo: 0, neutral: 0 };
    all.forEach((i) => {
      counts[i.impacto] = (counts[i.impacto] ?? 0) + 1;
    });
    return counts;
  }, [latestLis]);
  const impactPie = (["positivo", "negativo", "neutral"] as const)
    .map((k) => ({ name: k, value: impactCounts[k], color: k === "positivo" ? "#2eb88a" : k === "negativo" ? "#df3a3a" : "#aab3cf" }))
    .filter((d) => d.value > 0);
  const impactTotal = impactPie.reduce((s, d) => s + d.value, 0);

  const emotionRadarData = EMOCIONES.map(({ key, label }) => ({
    emotion: label,
    value: num(latestLis?.cuota_emocion?.[key]?.porcentaje ?? 0),
  }));

  if (loading) {
    return (
      <div className="h-screen page-bg text-white flex justify-center items-center font-mono tracking-widest uppercase animate-pulse">
        Cargando Redes Sociales...
      </div>
    );
  }

  return (
    <div className="page-bg text-white p-6">
      <div className="mb-8 flex flex-wrap justify-between items-center gap-4">
        <div>
          <div className="flex gap-2 mb-2">
            <span className="bg-[#1e2240] text-[#75ddff] text-[10px] px-2 py-0.5 rounded-full border border-[#0094ff]/20 uppercase font-black">
              REDES SOCIALES
            </span>
          </div>
          <h1 className="font-heading text-3xl font-bold mb-1 gradient-text text-glow-blue">Redes Sociales</h1>
          <p className="text-[#aab3cf] text-sm">Estrategia digital y escucha social (listening) sobre redes.</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 panel border border-[#2a2a4a] rounded-xl px-3 py-2">
            <FontAwesomeIcon
              icon={faCalendarDays}
              className="w-4 h-4 text-[#aab3cf] cursor-pointer"
              onClick={() => dateRef.current?.showPicker?.()}
            />
            <input
              ref={dateRef}
              type="date"
              value={fecha}
              max={todayStr()}
              onChange={(e) => setFecha(e.target.value)}
              className="bg-transparent text-sm text-white focus:outline-none w-[130px]"
            />
          </div>
          <Button variant="outline" size="sm" onClick={fetchData} className="panel border-[#2a2a4a] text-white">
            <FontAwesomeIcon icon={faRotate} />
          </Button>
          {editable && (
            <Button variant="neon" onClick={() => setFormOpen(true)} className="font-bold">
              <FontAwesomeIcon icon={faPlus} className="mr-2" />
              {tab === "estrategia" ? (latestEst ? "Editar / Ingresar" : "Ingresar Datos") : latestLis ? "Editar / Ingresar" : "Ingresar Datos"}
            </Button>
          )}
        </div>
      </div>

      <div className="flex gap-2 mb-8 border-b border-[#1e2240]">
        {(["estrategia", "listening"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm font-bold uppercase tracking-wider transition-colors border-b-2 ${
              tab === t ? "border-[#0094ff] text-[#75ddff]" : "border-transparent text-[#8892b0] hover:text-[#c0c8de]"
            }`}
          >
            {t === "estrategia" ? "Estrategia" : "Listening"}
          </button>
        ))}
      </div>

      {tab === "estrategia" ? (
        !latestEst ? (
          <Card className="panel border-[#1e2240] p-16 rounded-2xl flex flex-col items-center gap-3 text-center">
            <FontAwesomeIcon icon={faUsers} className="w-8 h-8 text-[#8892b0]" />
            <h2 className="text-lg font-bold">Aún no hay datos de estrategia</h2>
            <p className="text-[#8892b0] text-sm max-w-sm">
              {editable ? 'Ingresa los primeros datos con el botón "Ingresar Datos".' : "No se han registrado métricas todavía."}
            </p>
          </Card>
        ) : (
          <div className="space-y-6 mb-20">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
              <KpiCard label="Social Performance" value={latestEst.social_performance_score} icon={faBolt} suffix="/1000" />
              <KpiCard label="Seguidores" value={latestEst.seguidores} icon={faUsers} />
              <KpiCard label="Nuevos Seguidores" value={latestEst.nuevos_seguidores} icon={faUserPlus} colorClass="text-amber-400" />
              <KpiCard label="Impresiones" value={latestEst.impresiones} icon={faEye} colorClass="text-emerald-400" />
              <KpiCard label="Reacciones" value={latestEst.reacciones_likes} icon={faHeart} colorClass="text-rose-400" />
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <KpiCard label="Comentarios" value={latestEst.comentarios_respuestas} icon={faComment} colorClass="text-orange-400" />
              <KpiCard label="Publicaciones" value={latestEst.num_publicaciones} icon={faFileLines} />
              <KpiCard label="Contenidos Entregados" value={latestEst.contenidos_entregados} icon={faPaperPlane} colorClass="text-purple-400" />
              <KpiCard label="Contenidos Publicados" value={latestEst.contenidos_publicados} icon={faFileLines} colorClass="text-teal-400" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="panel border-[#1e2240] p-6 rounded-2xl">
                <h3 className="text-sm font-semibold mb-1 text-[#e4e9f5] uppercase tracking-widest">Perfil de Engagement</h3>
                <p className="text-xs text-[#8892b0] mb-4">% respecto al máximo histórico registrado</p>
                <ResponsiveContainer width="100%" height={240}>
                  <RadarChart data={radarData} margin={{ top: 10, right: 30, bottom: 10, left: 30 }}>
                    <PolarGrid stroke="#1e2240" />
                    <PolarAngleAxis dataKey="metric" tick={{ fill: "#aab3cf", fontSize: 11, fontWeight: 700 }} />
                    <Radar dataKey="value" stroke="#0094ff" fill="#0094ff" fillOpacity={0.2} strokeWidth={2} />
                    <Tooltip contentStyle={TOOLTIP_STYLE} labelStyle={TOOLTIP_LABEL_STYLE} itemStyle={TOOLTIP_ITEM_STYLE} />
                  </RadarChart>
                </ResponsiveContainer>
              </Card>

              {chartData.length > 1 && (
                <Card className="panel border-[#1e2240] p-6 rounded-2xl">
                  <h3 className="text-sm font-semibold mb-5 text-[#e4e9f5] uppercase tracking-widest">Tendencia Histórica</h3>
                  <ResponsiveContainer width="100%" height={220}>
                    <AreaChart data={chartData} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                      <defs>
                        <linearGradient id="gSeg" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#00e1ff" stopOpacity={0.35} />
                          <stop offset="95%" stopColor="#00e1ff" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e2240" vertical={false} />
                      <XAxis dataKey="fecha" stroke="#aab3cf" tick={{ fontSize: 11 }} />
                      <YAxis stroke="#aab3cf" tick={{ fontSize: 11 }} width={40} />
                      <Tooltip contentStyle={TOOLTIP_STYLE} labelStyle={TOOLTIP_LABEL_STYLE} itemStyle={TOOLTIP_ITEM_STYLE} />
                      <Area type="monotone" dataKey="Seguidores" stroke="#00e1ff" strokeWidth={2} fill="url(#gSeg)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </Card>
              )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <SentimentDonut positivo={latestEst.sentimiento_positivo} negativo={latestEst.sentimiento_negativo} title="Análisis de Sentimiento" />
              <Card className="panel border-[#1e2240] p-6 rounded-2xl flex flex-col" style={{ minHeight: 320 }}>
                <h3 className="text-sm font-semibold mb-4 text-[#e4e9f5] uppercase tracking-widest">Publicaciones Principales</h3>
                <ImageBox src={latestEst.publicaciones_principales} alt="Publicaciones principales" />
              </Card>
            </div>
          </div>
        )
      ) : !latestLis ? (
        <Card className="panel border-[#1e2240] p-16 rounded-2xl flex flex-col items-center gap-3 text-center">
          <FontAwesomeIcon icon={faBolt} className="w-8 h-8 text-[#8892b0]" />
          <h2 className="text-lg font-bold">Aún no hay datos de listening</h2>
          <p className="text-[#8892b0] text-sm max-w-sm">
            {editable ? 'Ingresa los primeros datos con el botón "Ingresar Datos".' : "No se han registrado métricas todavía."}
          </p>
        </Card>
      ) : (
        <div className="space-y-6 mb-20">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <KpiCard label="Resultados" value={latestLis.resultados} icon={faFileLines} />
            <KpiCard label="Interacciones" value={latestLis.interacciones} icon={faComment} colorClass="text-emerald-400" />
            <KpiCard label="Alcance Potencial" value={latestLis.alcance_potencial} icon={faEye} colorClass="text-purple-400" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="panel border-[#1e2240] p-6 rounded-2xl">
              <h3 className="text-sm font-semibold mb-4 text-[#e4e9f5] uppercase tracking-widest">Radar de Emociones</h3>
              <ResponsiveContainer width="100%" height={220}>
                <RadarChart data={emotionRadarData} margin={{ top: 10, right: 30, bottom: 10, left: 30 }}>
                  <PolarGrid stroke="#1e2240" />
                  <PolarAngleAxis dataKey="emotion" tick={{ fill: "#aab3cf", fontSize: 11, fontWeight: 700 }} />
                  <Radar dataKey="value" stroke="#e879f9" fill="#e879f9" fillOpacity={0.2} strokeWidth={2} />
                  <Tooltip contentStyle={TOOLTIP_STYLE} labelStyle={TOOLTIP_LABEL_STYLE} itemStyle={TOOLTIP_ITEM_STYLE} />
                </RadarChart>
              </ResponsiveContainer>
            </Card>

            <Card className="panel border-[#1e2240] p-6 rounded-2xl flex flex-col">
              <h3 className="text-sm font-semibold mb-4 text-[#e4e9f5] uppercase tracking-widest">Distribución de Impacto</h3>
              {impactTotal === 0 ? (
                <div className="flex-1 flex items-center justify-center text-xs text-[#8892b0] italic">Sin datos de impacto</div>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center gap-3">
                  <ResponsiveContainer width={140} height={140}>
                    <PieChart>
                      <Pie data={impactPie} cx="50%" cy="50%" innerRadius={40} outerRadius={60} dataKey="value" strokeWidth={0}>
                        {impactPie.map((d) => (
                          <Cell key={d.name} fill={d.color} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={TOOLTIP_STYLE} labelStyle={TOOLTIP_LABEL_STYLE} itemStyle={TOOLTIP_ITEM_STYLE} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="w-full space-y-1">
                    {impactPie.map((d) => (
                      <div key={d.name} className="flex justify-between text-xs">
                        <span className="capitalize font-bold" style={{ color: d.color }}>
                          {d.name}
                        </span>
                        <span className="font-bold" style={{ color: d.color }}>
                          {d.value}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </Card>

            <SentimentDonut positivo={latestLis.sentimiento_positivo} negativo={latestLis.sentimiento_negativo} title="Sentimiento de la Conversación" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="panel border-[#1e2240] p-6 rounded-2xl flex flex-col" style={{ minHeight: 260 }}>
              <h3 className="text-sm font-semibold mb-4 text-[#e4e9f5] uppercase tracking-widest">Activity Peak</h3>
              <ImageBox src={latestLis.activity_peak} alt="Activity peak" />
            </Card>
            <Card className="panel border-[#1e2240] p-6 rounded-2xl flex flex-col" style={{ minHeight: 260 }}>
              <h3 className="text-sm font-semibold mb-4 text-[#e4e9f5] uppercase tracking-widest">Hashtags</h3>
              <ImageBox src={latestLis.hashtags} alt="Hashtags" />
            </Card>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <ImpactListCard title="Cuentas con Mayor Impacto" items={latestLis.cuentas_impacto} />
            <ImpactListCard title="Sitios con Mayor Impacto" items={latestLis.sitios_impacto} isUrl />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <TagListCard title="Hashtags para usar" items={latestLis.hashtags_para_usar} />
            <TagListCard title="Palabras Clave para usar" items={latestLis.palabras_claves_para_usar} />
            <TagListCard title="Qué NO usar" items={latestLis.que_no_usar} />
          </div>
        </div>
      )}

      {tab === "estrategia" ? (
        <EstrategiaFormModal open={formOpen} onClose={() => setFormOpen(false)} onSaved={fetchData} initial={latestEst} fecha={fecha} />
      ) : (
        <ListeningFormModal open={formOpen} onClose={() => setFormOpen(false)} onSaved={fetchData} initial={latestLis} fecha={fecha} />
      )}
    </div>
  );
}

function TagListCard({ title, items }: { title: string; items: TagItem[] }) {
  const sorted = [...(items ?? [])].sort((a, b) => {
    const rank: Record<Importancia, number> = { alta: 3, media: 2, baja: 1 };
    return (rank[b.importance] ?? 0) - (rank[a.importance] ?? 0);
  });
  return (
    <Card className="panel border-[#1e2240] p-6 rounded-2xl min-h-[220px] flex flex-col">
      <h3 className="text-sm font-semibold mb-4 text-[#e4e9f5] uppercase tracking-widest">{title}</h3>
      {sorted.length === 0 ? (
        <div className="flex-1 flex items-center justify-center text-xs text-[#8892b0] italic">Sin datos</div>
      ) : (
        <div className="flex flex-wrap gap-2 content-start">
          {sorted.map((it, idx) => (
            <span key={idx} className="inline-flex items-center gap-2 rounded-full border border-[#2a2a4a] bg-white/5 px-3 py-1.5 text-xs font-semibold text-[#e4e9f5]">
              {it.text}
              <span className="text-[9px] uppercase font-black text-[#8892b0]">{it.importance}</span>
            </span>
          ))}
        </div>
      )}
    </Card>
  );
}

function ImpactListCard({ title, items, isUrl }: { title: string; items: ImpactItem[]; isUrl?: boolean }) {
  return (
    <Card className="panel border-[#1e2240] p-6 rounded-2xl min-h-[220px] flex flex-col">
      <h3 className="text-sm font-semibold mb-4 text-[#e4e9f5] uppercase tracking-widest">{title}</h3>
      {!items || items.length === 0 ? (
        <div className="flex-1 flex items-center justify-center text-xs text-[#8892b0] italic">Sin datos</div>
      ) : (
        <div className="space-y-2">
          {items.map((it, idx) => (
            <div key={idx} className="flex items-center justify-between bg-white/5 border border-[#2a2a4a] rounded-xl px-4 py-3">
              <div className="min-w-0">
                <p className="text-sm font-bold text-[#ffffff] truncate">{it.nombre}</p>
                {isUrl ? (
                  <a href={it.identificador.startsWith("http") ? it.identificador : `https://${it.identificador}`} target="_blank" rel="noreferrer" className="text-xs text-[#75ddff] hover:underline truncate block">
                    {it.identificador}
                  </a>
                ) : (
                  <p className="text-xs text-[#8892b0] truncate">{it.identificador}</p>
                )}
              </div>
              <span
                className={`shrink-0 text-[10px] font-black uppercase px-2 py-1 rounded-full ${
                  it.impacto === "positivo" ? "bg-emerald-500/10 text-emerald-400" : it.impacto === "negativo" ? "bg-rose-500/10 text-rose-400" : "bg-white/10 text-[#aab3cf]"
                }`}
              >
                {it.impacto}
              </span>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
