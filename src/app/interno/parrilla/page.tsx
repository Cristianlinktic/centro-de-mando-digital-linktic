"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/components/auth-provider";
import { canEdit } from "@/lib/auth/rbac";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/components/ui/toast";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faPlus,
  faTrash,
  faSave,
  faUpload,
  faRotate,
  faXmark,
  faLayerGroup,
  faChevronLeft,
  faChevronRight,
} from "@fortawesome/free-solid-svg-icons";
import * as XLSX from "xlsx";
import {
  type ContentItem,
  type ContentStatus,
  type ContentType,
  type CustomTab,
  type PlatformId,
  HOURS,
  PLATFORMS,
  TYPE_OPTIONS,
  STATUS_OPTIONS,
  inputCls,
  platformById,
} from "./types";
import {
  todayISO,
  parseISO,
  addDays,
  addMonths,
  formatMonthLabel,
  formatWeekRangeLabel,
  formatDayLabel,
} from "./date-utils";
import { MonthView } from "./month-view";
import { WeekView } from "./week-view";
import { DayView } from "./day-view";

type ViewMode = "day" | "week" | "month";

const emptyForm = {
  id: "",
  date: todayISO(),
  hour: "07",
  minute: "00",
  duration: 60,
  platform: "facebook" as PlatformId,
  type: "post" as ContentType,
  status: "Programado" as ContentStatus,
  description: "",
  url: "",
  comments: "",
  kpi: "",
};

function slugify(label: string) {
  return label
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

export default function ParrillaPage() {
  const { role } = useAuth();
  const editing = canEdit(role);

  const [items, setItems] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [now, setNow] = useState<Date | null>(null);

  const [viewMode, setViewMode] = useState<ViewMode>("month");
  const [cursorDate, setCursorDate] = useState<Date>(() => new Date());

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [viewItem, setViewItem] = useState<ContentItem | null>(null);
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);
  const [viewerName, setViewerName] = useState("");
  const [viewerComment, setViewerComment] = useState("");
  const [saving, setSaving] = useState(false);

  const [customTabs, setCustomTabs] = useState<CustomTab[]>([]);
  const [showTabPanel, setShowTabPanel] = useState(false);
  const [newTabLabel, setNewTabLabel] = useState("");
  const [generatedSql, setGeneratedSql] = useState<string | null>(null);

  const fetchContent = async () => {
    setLoading(true);
    const { data } = await supabase.from("dashboard_content").select("id, content");
    const rows = ((data as { id: string; content: ContentItem }[]) ?? []).map((row) => ({
      ...row.content,
      id: row.id,
    }));
    setItems(rows);
    setLoading(false);
  };

  const fetchCustomTabs = async () => {
    const { data } = await supabase.from("parrilla_custom_tabs").select("*").order("created_at", { ascending: true });
    setCustomTabs((data as CustomTab[]) ?? []);
  };

  useEffect(() => {
    fetchContent();
    fetchCustomTabs();
    setNow(new Date());
    const timer = setInterval(() => setNow(new Date()), 30000);
    return () => clearInterval(timer);
  }, []);

  const openAddModal = (date: Date, hour: string) => {
    if (!editing) return;
    const [h] = hour.split(":");
    setForm({ ...emptyForm, date: toISOSafe(date), hour: h });
    setIsModalOpen(true);
  };

  const openEditModal = (item: ContentItem) => {
    if (!editing) return;
    const [h, m] = (item.time || "07:00").split(":");
    setForm({
      id: item.id,
      date: item.date || todayISO(),
      hour: h || "07",
      minute: m || "00",
      duration: item.duration || 60,
      platform: item.platform,
      type: item.type,
      status: item.status,
      description: item.description || "",
      url: item.url || "",
      comments: item.comments || "",
      kpi: item.kpi || "",
    });
    setIsModalOpen(true);
  };

  const saveItem = async (e: React.FormEvent, forceNew = false) => {
    e.preventDefault();
    if (!form.description.trim()) {
      toast.error("Falta la descripción", "Escribe el texto o descripción del contenido.");
      return;
    }
    const id = forceNew ? Date.now().toString() : form.id || Date.now().toString();
    const existing = items.find((i) => i.id === id);
    const item: ContentItem = {
      id,
      date: form.date || todayISO(),
      time: `${form.hour}:${form.minute}`,
      platform: form.platform,
      type: form.type,
      status: form.status,
      description: form.description,
      duration: Number(form.duration),
      url: form.url || null,
      comments: form.comments || null,
      kpi: form.kpi || null,
      viewer_comments: existing?.viewer_comments ?? [],
    };

    setSaving(true);
    const { error } = await supabase.from("dashboard_content").upsert({ id: item.id, content: item });
    setSaving(false);
    if (error) {
      toast.error("Error al guardar", error.message);
      return;
    }
    setItems((prev) => {
      const idx = prev.findIndex((i) => i.id === id);
      if (idx > -1) {
        const copy = [...prev];
        copy[idx] = item;
        return copy;
      }
      return [...prev, item];
    });
    toast.success("Publicación guardada", `${item.date} · ${item.time} en ${platformById[item.platform]?.name || item.platform}.`);
    setIsModalOpen(false);
  };

  const confirmDelete = async () => {
    if (!itemToDelete) return;
    setSaving(true);
    const { error } = await supabase.from("dashboard_content").delete().eq("id", itemToDelete);
    setSaving(false);
    if (error) {
      toast.error("Error al eliminar", error.message);
      return;
    }
    setItems((prev) => prev.filter((i) => i.id !== itemToDelete));
    setItemToDelete(null);
    setIsModalOpen(false);
    toast.success("Publicación eliminada");
  };

  const addViewerComment = async () => {
    if (!viewItem || !viewerName.trim() || !viewerComment.trim()) {
      toast.error("Faltan datos", "Ingresa tu nombre y un comentario.");
      return;
    }
    const timestamp = new Date().toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit", hour12: false });
    const newComment = { id: Date.now().toString(), name: viewerName, comment: viewerComment, timestamp };
    const updated: ContentItem = { ...viewItem, viewer_comments: [...(viewItem.viewer_comments || []), newComment] };
    const { error } = await supabase.from("dashboard_content").upsert({ id: updated.id, content: updated });
    if (error) {
      toast.error("Error al comentar", error.message);
      return;
    }
    setViewItem(updated);
    setItems((prev) => prev.map((i) => (i.id === updated.id ? updated : i)));
    setViewerName("");
    setViewerComment("");
  };

  const handleExcelUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: "binary" });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json(ws) as any[];
        if (!rows.length) return;

        const parsed: ContentItem[] = rows.map((row) => {
          let fecha = row["Fecha"] || row["fecha"] || row["date"];
          if (typeof fecha === "number") {
            // Excel guarda fechas como número de días desde 1899-12-30
            fecha = toISOSafe(new Date((fecha - 25569) * 86400 * 1000));
          } else if (fecha) {
            const d = new Date(fecha);
            fecha = isNaN(d.getTime()) ? todayISO() : toISOSafe(d);
          } else {
            fecha = todayISO();
          }

          return {
            id: (row["ID"] || row["id"] || Date.now() + Math.random()).toString(),
            date: fecha,
            time: (row["Hora"] || row["time"] || "07:00").toString(),
            platform: (row["Plataforma"] || row["platform"] || "facebook").toString().toLowerCase() as PlatformId,
            type: (row["Tipo"] || row["type"] || "post") as ContentType,
            status: (row["Estado"] || row["status"] || "Programado") as ContentStatus,
            description: (row["Descripcion"] || row["Descripción"] || row["description"] || "").toString(),
            duration: parseInt(row["Duracion"] || row["duration"]) || 60,
            url: row["URL"] || row["url"] || null,
            comments: row["Comentarios"] || row["comments"] || null,
            kpi: row["KPI"] || row["kpi"] || null,
            viewer_comments: [],
          };
        });

        const { error } = await supabase
          .from("dashboard_content")
          .upsert(parsed.map((item) => ({ id: item.id, content: item })));
        if (error) throw error;
        await fetchContent();
        toast.success("Importación finalizada", `${parsed.length} publicaciones procesadas.`);
      } catch (err: any) {
        console.error(err);
        toast.error("Error al procesar el Excel", err.message || "Revisa el formato del archivo.");
      }
    };
    reader.readAsBinaryString(file);
  };

  const createCustomTab = async () => {
    if (!newTabLabel.trim()) return;
    const key = slugify(newTabLabel);
    const tableName = `parrilla_${key}`;
    const { error } = await supabase.from("parrilla_custom_tabs").insert({
      key,
      label: newTabLabel.trim(),
      table_name: tableName,
    });
    if (error) {
      toast.error("Error al registrar la pestaña", error.message);
      return;
    }
    setGeneratedSql(
`CREATE TABLE IF NOT EXISTS centro_mando.${tableName} (
    id TEXT PRIMARY KEY,
    date TEXT,
    time TEXT,
    platform TEXT,
    type TEXT,
    description TEXT,
    status TEXT DEFAULT 'Programado',
    duration INTEGER DEFAULT 60,
    url TEXT,
    comments TEXT,
    kpi TEXT,
    viewer_comments JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
ALTER TABLE centro_mando.${tableName} ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Lectura autenticados" ON centro_mando.${tableName} FOR SELECT TO authenticated USING (true);
CREATE POLICY "Escritura administradores" ON centro_mando.${tableName} FOR ALL TO authenticated USING (centro_mando.is_admin()) WITH CHECK (centro_mando.is_admin());
GRANT SELECT ON centro_mando.${tableName} TO anon, authenticated;
GRANT ALL ON centro_mando.${tableName} TO authenticated, service_role;`
    );
    setNewTabLabel("");
    fetchCustomTabs();
  };

  // Navegación del calendario
  const goToday = () => setCursorDate(new Date());
  const goPrev = () => {
    if (viewMode === "month") setCursorDate((d) => addMonths(d, -1));
    else if (viewMode === "week") setCursorDate((d) => addDays(d, -7));
    else setCursorDate((d) => addDays(d, -1));
  };
  const goNext = () => {
    if (viewMode === "month") setCursorDate((d) => addMonths(d, 1));
    else if (viewMode === "week") setCursorDate((d) => addDays(d, 7));
    else setCursorDate((d) => addDays(d, 1));
  };

  const rangeLabel = useMemo(() => {
    if (viewMode === "month") return formatMonthLabel(cursorDate);
    if (viewMode === "week") return formatWeekRangeLabel(cursorDate);
    return formatDayLabel(cursorDate);
  }, [viewMode, cursorDate]);

  if (loading) {
    return (
      <div className="h-screen page-bg text-white flex justify-center items-center font-mono tracking-widest uppercase animate-pulse">
        Cargando Parrilla de Contenidos...
      </div>
    );
  }

  return (
    <div className="page-bg text-white p-6">
      {/* Header */}
      <div className="mb-6 flex flex-wrap justify-between items-center gap-4">
        <div>
          <div className="flex gap-2 mb-2">
            <span className="bg-[#1e293b] text-blue-400 text-[10px] px-2 py-0.5 rounded-full border border-blue-500/20 uppercase font-black">
              PLANIFICACIÓN DE CONTENIDO
            </span>
            <span className="bg-[#1e293b] text-slate-400 text-[10px] px-2 py-0.5 rounded-full border border-white/10 uppercase">
              {editing ? "MODO EDITOR" : "MODO LECTOR"}
            </span>
          </div>
          <h1 className="text-3xl font-bold mb-1 gradient-text text-glow-blue">Parrilla de Contenidos</h1>
          <p className="text-slate-400 text-sm">
            Calendario de publicaciones en redes — Centro de Mando Digital LinkTIC.
          </p>
        </div>
        <div className="flex gap-2">
          {editing && (
            <Button variant="outline" size="sm" className="relative cursor-pointer bg-green-600/20 text-green-400 border-green-500/20">
              <FontAwesomeIcon icon={faUpload} className="mr-2" /> Excel
              <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" onChange={handleExcelUpload} accept=".xlsx,.xls" />
            </Button>
          )}
          {editing && (
            <Button variant="outline" size="sm" onClick={() => setShowTabPanel((v) => !v)} className="bg-[#0b101d] border-white/10 text-white">
              <FontAwesomeIcon icon={faLayerGroup} className="mr-2" /> Pestañas
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={fetchContent} className="bg-[#0b101d] border-white/10 text-white">
            <FontAwesomeIcon icon={faRotate} />
          </Button>
        </div>
      </div>

      {/* Custom tabs panel (opcional, secundario) */}
      {showTabPanel && editing && (
        <Card className="bg-[#0b101d] border border-white/5 p-5 rounded-2xl mb-6">
          <h3 className="text-sm font-bold text-slate-200 mb-1">Pestañas adicionales de parrilla</h3>
          <p className="text-xs text-slate-500 mb-4">
            Registra una pestaña nueva (p.ej. para un evento puntual). Esto solo crea el registro — la tabla física
            hay que crearla una vez en el SQL Editor de Supabase con el script que se genera abajo.
          </p>
          <div className="flex gap-2 mb-4">
            <Input
              placeholder="Nombre de la pestaña (ej: Debate 12 de mayo)"
              value={newTabLabel}
              onChange={(e) => setNewTabLabel(e.target.value)}
              className="bg-[#05080f] border-white/10 h-9 text-sm flex-1"
            />
            <Button size="sm" onClick={createCustomTab} className="bg-blue-600 hover:bg-blue-700">
              <FontAwesomeIcon icon={faPlus} className="mr-2" /> Registrar
            </Button>
          </div>
          {customTabs.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-4">
              {customTabs.map((t) => (
                <span key={t.id} className="text-[11px] bg-white/5 border border-white/10 rounded-full px-3 py-1 text-slate-300">
                  {t.label} <span className="text-slate-600">({t.table_name})</span>
                </span>
              ))}
            </div>
          )}
          {generatedSql && (
            <div>
              <p className="text-[11px] font-bold text-amber-400 uppercase tracking-wide mb-2">
                Corre esto una vez en el SQL Editor de Supabase:
              </p>
              <pre className="bg-[#05080f] border border-white/10 rounded-lg p-3 text-[11px] text-slate-300 overflow-x-auto whitespace-pre-wrap">
                {generatedSql}
              </pre>
            </div>
          )}
        </Card>
      )}

      {/* Barra de navegación del calendario */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={goToday} className="bg-[#0b101d] border-white/10 text-white">
            Hoy
          </Button>
          <Button variant="outline" size="sm" onClick={goPrev} className="bg-[#0b101d] border-white/10 text-white h-8 w-8 p-0">
            <FontAwesomeIcon icon={faChevronLeft} className="h-3 w-3" />
          </Button>
          <Button variant="outline" size="sm" onClick={goNext} className="bg-[#0b101d] border-white/10 text-white h-8 w-8 p-0">
            <FontAwesomeIcon icon={faChevronRight} className="h-3 w-3" />
          </Button>
          <h2 className="text-lg font-bold text-slate-100 ml-2 capitalize">{rangeLabel}</h2>
        </div>
        <div className="flex gap-1 rounded-lg bg-white/5 p-1">
          {(["day", "week", "month"] as ViewMode[]).map((v) => (
            <button
              key={v}
              onClick={() => setViewMode(v)}
              className={`px-3 py-1.5 rounded-md text-xs font-bold uppercase tracking-wide transition-colors ${
                viewMode === v ? "bg-blue-600 text-white" : "text-slate-400 hover:text-white"
              }`}
            >
              {v === "day" ? "Día" : v === "week" ? "Semana" : "Mes"}
            </button>
          ))}
        </div>
      </div>

      {/* Leyenda de plataformas */}
      <div className="mb-4 flex flex-wrap gap-3">
        {PLATFORMS.map((p) => (
          <div key={p.id} className="flex items-center gap-1.5 text-[11px] font-bold text-slate-400">
            <FontAwesomeIcon icon={p.icon} className="h-3 w-3" style={{ color: p.color }} />
            {p.name}
          </div>
        ))}
      </div>

      {/* Vista de calendario */}
      {viewMode === "month" && (
        <MonthView
          cursorDate={cursorDate}
          items={items}
          onSelectDay={(d) => {
            setCursorDate(d);
            setViewMode("day");
          }}
          onItemClick={(item) => (editing ? openEditModal(item) : setViewItem(item))}
        />
      )}
      {viewMode === "week" && (
        <WeekView
          cursorDate={cursorDate}
          items={items}
          editing={editing}
          now={now}
          onSelectDay={(d) => {
            setCursorDate(d);
            setViewMode("day");
          }}
          onAddSlot={(d, hour) => openAddModal(d, hour)}
          onItemClick={(item) => (editing ? openEditModal(item) : setViewItem(item))}
        />
      )}
      {viewMode === "day" && (
        <DayView
          date={cursorDate}
          items={items}
          editing={editing}
          now={now}
          onAddSlot={(hour) => openAddModal(cursorDate, hour)}
          onItemClick={(item) => (editing ? openEditModal(item) : setViewItem(item))}
        />
      )}

      {/* Add/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-4" onClick={() => setIsModalOpen(false)}>
          <div className="bg-[#0b101d] border border-white/10 rounded-2xl w-full max-w-2xl max-h-[85vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-white/10 p-5">
              <h2 className="text-lg font-bold">{form.id ? "Editar Publicación" : "Agregar a Parrilla"}</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-500 hover:text-white">
                <FontAwesomeIcon icon={faXmark} />
              </button>
            </div>
            <form onSubmit={saveItem} className="p-5 space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                <div>
                  <label className="text-[10px] font-bold uppercase text-slate-500 mb-1 block">Fecha</label>
                  <Input type="date" className={`${inputCls} [color-scheme:dark]`} value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase text-slate-500 mb-1 block">Hora</label>
                  <select className={inputCls} value={form.hour} onChange={(e) => setForm({ ...form, hour: e.target.value })}>
                    {HOURS.map((h) => (
                      <option key={h} value={h.split(":")[0]}>{h.split(":")[0]}:</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase text-slate-500 mb-1 block">Minuto</label>
                  <select className={inputCls} value={form.minute} onChange={(e) => setForm({ ...form, minute: e.target.value })}>
                    {["00", "05", "10", "15", "20", "25", "30", "35", "40", "45", "50", "55"].map((m) => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase text-slate-500 mb-1 block">Duración (min)</label>
                  <Input type="number" className={inputCls} value={form.duration} onChange={(e) => setForm({ ...form, duration: Number(e.target.value) })} />
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase text-slate-500 mb-1 block">Plataforma</label>
                  <select className={inputCls} value={form.platform} onChange={(e) => setForm({ ...form, platform: e.target.value as PlatformId })}>
                    {PLATFORMS.map((p) => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase text-slate-500 mb-1 block">Tipo</label>
                  <select className={inputCls} value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value as ContentType })}>
                    {TYPE_OPTIONS.map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase text-slate-500 mb-1 block">Estado</label>
                  <select className={inputCls} value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as ContentStatus })}>
                    {STATUS_OPTIONS.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase text-slate-500 mb-1 block">KPI objetivo</label>
                <Input className={inputCls} placeholder="Ej: 1000 likes, 500 clics..." value={form.kpi} onChange={(e) => setForm({ ...form, kpi: e.target.value })} />
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase text-slate-500 mb-1 block">Copy del contenido</label>
                <textarea className={`${inputCls} min-h-[100px] resize-y`} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase text-slate-500 mb-1 block">Link de piezas</label>
                <Input type="url" className={inputCls} placeholder="https://..." value={form.url} onChange={(e) => setForm({ ...form, url: e.target.value })} />
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase text-slate-500 mb-1 block">Comentarios internos</label>
                <textarea className={`${inputCls} min-h-[70px] resize-y`} value={form.comments} onChange={(e) => setForm({ ...form, comments: e.target.value })} />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-white/10">
                <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)} className="text-slate-400">
                  Cancelar
                </Button>
                {form.id && (
                  <Button type="button" variant="outline" onClick={(e: any) => saveItem(e, true)} className="border-blue-500/30 text-blue-400">
                    Guardar como nuevo
                  </Button>
                )}
                <Button type="submit" disabled={saving} className="bg-blue-600 hover:bg-blue-700">
                  <FontAwesomeIcon icon={faSave} className="mr-2" /> {form.id ? "Guardar Cambios" : "Guardar"}
                </Button>
                {form.id && (
                  <Button type="button" variant="destructive" onClick={() => setItemToDelete(form.id)}>
                    <FontAwesomeIcon icon={faTrash} />
                  </Button>
                )}
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Modal (lectores) */}
      {viewItem && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-4" onClick={() => setViewItem(null)}>
          <div className="bg-[#0b101d] border border-white/10 rounded-2xl w-full max-w-xl max-h-[85vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-white/10 p-5">
              <h2 className="text-lg font-bold">Contenido</h2>
              <button onClick={() => setViewItem(null)} className="text-slate-500 hover:text-white">
                <FontAwesomeIcon icon={faXmark} />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-white/5 rounded-lg p-3 border border-white/5">
                  <span className="text-[10px] font-bold uppercase text-slate-500 block">Plataforma</span>
                  <span className="text-sm capitalize">{platformById[viewItem.platform]?.name}</span>
                </div>
                <div className="bg-white/5 rounded-lg p-3 border border-white/5">
                  <span className="text-[10px] font-bold uppercase text-slate-500 block">Fecha</span>
                  <span className="text-sm">{viewItem.date || "—"}</span>
                </div>
                <div className="bg-white/5 rounded-lg p-3 border border-white/5">
                  <span className="text-[10px] font-bold uppercase text-slate-500 block">Hora</span>
                  <span className="text-sm">{viewItem.time}</span>
                </div>
              </div>
              <div className="bg-white/5 rounded-lg p-3 border border-white/5">
                <span className="text-[10px] font-bold uppercase text-slate-500 block mb-1">Copy</span>
                <p className="text-sm whitespace-pre-wrap">{viewItem.description}</p>
              </div>
              {viewItem.url && (
                <a href={viewItem.url} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-400 underline break-words block">
                  {viewItem.url}
                </a>
              )}

              <div className="pt-3 border-t border-white/10 space-y-3">
                <h3 className="text-xs font-bold uppercase text-slate-400">Comentarios</h3>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {(viewItem.viewer_comments || []).length === 0 ? (
                    <p className="text-xs text-slate-500 italic">Sin comentarios aún.</p>
                  ) : (
                    viewItem.viewer_comments.map((c) => (
                      <div key={c.id} className="bg-white/5 rounded-lg p-2.5 border border-white/5">
                        <div className="flex justify-between text-[11px]">
                          <span className="font-bold text-blue-400">{c.name}</span>
                          <span className="text-slate-500">{c.timestamp}</span>
                        </div>
                        <p className="text-xs mt-1">{c.comment}</p>
                      </div>
                    ))
                  )}
                </div>
                <div className="flex gap-2">
                  <Input placeholder="Tu nombre" value={viewerName} onChange={(e) => setViewerName(e.target.value)} className="bg-[#05080f] border-white/10 h-8 text-xs w-32" />
                  <Input placeholder="Comentario..." value={viewerComment} onChange={(e) => setViewerComment(e.target.value)} className="bg-[#05080f] border-white/10 h-8 text-xs flex-1" />
                  <Button size="sm" onClick={addViewerComment} className="bg-blue-600 hover:bg-blue-700 h-8">
                    Enviar
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirm */}
      {itemToDelete && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/70 p-4">
          <div className="bg-[#0b101d] border border-rose-500/30 rounded-2xl w-full max-w-sm">
            <div className="p-5 border-b border-rose-500/20">
              <h2 className="font-bold text-rose-300">Confirmar eliminación</h2>
            </div>
            <div className="p-5 text-sm text-slate-300">
              ¿Eliminar esta publicación? Esta acción no se puede deshacer.
            </div>
            <div className="flex justify-end gap-2 p-5 border-t border-white/10">
              <Button variant="ghost" onClick={() => setItemToDelete(null)} className="text-slate-400">
                Cancelar
              </Button>
              <Button variant="destructive" onClick={confirmDelete}>
                Eliminar
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function toISOSafe(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}
