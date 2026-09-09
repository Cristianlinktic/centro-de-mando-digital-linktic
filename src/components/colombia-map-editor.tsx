"use client";

import { useState, useEffect, useRef } from "react";
import * as XLSX from "xlsx";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DecimalInput } from "@/components/decimal-input";
import { supabase } from "@/lib/supabase";
import { toast } from "@/components/ui/toast";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSave, faChevronDown, faFileArrowDown, faFileArrowUp } from "@fortawesome/free-solid-svg-icons";

// Convierte arrays <-> texto separado por comas
const toText = (arr: any) => (Array.isArray(arr) ? arr.join(", ") : "");
const toArr = (txt: string) => txt.split(",").map((s) => s.trim()).filter(Boolean);

// Normaliza nombres para calzar el Excel con los departamentos (ignora acentos/mayúsculas)
const norm = (s: any) => String(s ?? "").toLowerCase().trim().normalize("NFD").replace(/[̀-ͯ]/g, "");

// Parsea números con separadores de miles ("48.200" / "48,200")
const parseNum = (val: any) => {
  if (typeof val === "number") return val;
  if (val === null || val === undefined || val === "") return 0;
  return parseInt(String(val).replace(/[.,\s]/g, ""), 10) || 0;
};

// Columnas esperadas en el Excel (en orden)
const TEMPLATE_COLUMNS = [
  "Codigo",
  "Departamento",
  "Capital",
  "Menciones",
  "Positivo",
  "Neutral",
  "Negativo",
  "Sentimiento",
  "Tendencia",
  "PctCambio",
  "Tema",
  "Keywords",
  "Hashtags",
  "Resumen",
  "Actualizado",
] as const;

const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <label className="flex flex-col gap-1">
    <span className="text-[10px] uppercase tracking-wider text-[#aab3cf]">{label}</span>
    {children}
  </label>
);

const inputCls = "panel-soft border-[#2a2a4a] text-white h-9 text-sm";

export function ColombiaMapEditor({ data, onSaved }: { data: any[]; onSaved: () => void }) {
  const [rows, setRows] = useState<any[]>([]);
  const [saving, setSaving] = useState(false);
  const [importInfo, setImportInfo] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Reinicia el estado editable cuando cambian los datos de origen
  useEffect(() => {
    setRows(data.map((d) => ({ ...d, sentimientoPct: { positivo: 0, neutral: 0, negativo: 0, ...(d.sentimientoPct || {}) } })));
  }, [data]);

  const update = (id: string, field: string, value: any) =>
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, [field]: value } : r)));

  const updatePct = (id: string, key: string, value: number) =>
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, sentimientoPct: { ...r.sentimientoPct, [key]: value } } : r)));

  // Descarga una plantilla .xlsx con la estructura correcta y los 33 departamentos
  // pre-cargados con los valores actuales (round-trip: exportar → editar → reimportar).
  const downloadTemplate = () => {
    const aoa = [
      [...TEMPLATE_COLUMNS],
      ...rows.map((r) => [
        r.id,
        r.nombre,
        r.capital || "",
        r.volumen || 0,
        r.sentimientoPct?.positivo ?? 0,
        r.sentimientoPct?.neutral ?? 0,
        r.sentimientoPct?.negativo ?? 0,
        r.sentimiento || "",
        r.tendencia || "",
        r.pctCambio ?? 0,
        r.tema || "",
        toText(r.keywords),
        toText(r.topHashtags),
        r.resumen || "",
        r.updateTime || "",
      ]),
    ];
    const ws = XLSX.utils.aoa_to_sheet(aoa);
    ws["!cols"] = TEMPLATE_COLUMNS.map((c) => ({ wch: c === "Resumen" ? 40 : c === "Departamento" ? 26 : c === "Keywords" || c === "Hashtags" ? 28 : 12 }));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Departamentos");
    XLSX.writeFile(wb, "plantilla_mapa_colombia.xlsx");
  };

  // Importa un Excel y calza cada fila contra los 33 departamentos por Codigo (DANE)
  // o por nombre normalizado. No guarda: llena el editor para revisar y luego "Guardar todo".
  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const wb = XLSX.read(evt.target?.result, { type: "binary" });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const excelRows = XLSX.utils.sheet_to_json<any>(ws);

        let matched = 0;
        const noMatch: string[] = [];

        const next = rows.map((r) => ({ ...r }));
        const findRow = (row: any) => {
          const code = String(row["Codigo"] ?? row["codigo"] ?? row["ID"] ?? row["id"] ?? "").trim();
          if (code) {
            const padded = code.padStart(2, "0");
            const byCode = next.find((r) => r.id === code || r.id === padded);
            if (byCode) return byCode;
          }
          const name = norm(row["Departamento"] ?? row["departamento"] ?? row["Nombre"] ?? row["nombre"]);
          return name ? next.find((r) => norm(r.nombre) === name) : undefined;
        };

        excelRows.forEach((row) => {
          const target = findRow(row);
          if (!target) {
            const label = row["Departamento"] || row["Codigo"] || "(fila sin nombre/código)";
            noMatch.push(String(label));
            return;
          }
          const has = (k: string) => row[k] !== undefined && row[k] !== null && row[k] !== "";

          if (has("Menciones")) target.volumen = parseNum(row["Menciones"]);
          if (has("Tema")) target.tema = String(row["Tema"]);
          if (has("Capital")) target.capital = String(row["Capital"]);
          if (has("Resumen")) target.resumen = String(row["Resumen"]);
          if (has("Tendencia")) target.tendencia = String(row["Tendencia"]).toLowerCase();
          if (has("PctCambio")) target.pctCambio = parseFloat(String(row["PctCambio"]).replace(",", ".")) || 0;
          if (has("Actualizado")) target.updateTime = String(row["Actualizado"]);
          if (has("Keywords")) target.keywords = toArr(String(row["Keywords"]));
          if (has("Hashtags")) target.topHashtags = toArr(String(row["Hashtags"]));

          const pos = has("Positivo") ? parseInt(String(row["Positivo"])) : undefined;
          const neu = has("Neutral") ? parseInt(String(row["Neutral"])) : undefined;
          const neg = has("Negativo") ? parseInt(String(row["Negativo"])) : undefined;
          if (pos !== undefined || neu !== undefined || neg !== undefined) {
            target.sentimientoPct = {
              positivo: pos ?? target.sentimientoPct?.positivo ?? 0,
              neutral: neu ?? target.sentimientoPct?.neutral ?? 0,
              negativo: neg ?? target.sentimientoPct?.negativo ?? 0,
            };
          }
          // Sentimiento: explícito o derivado del % mayor
          if (has("Sentimiento")) {
            target.sentimiento = String(row["Sentimiento"]).toLowerCase();
          } else if (target.sentimientoPct) {
            const p = target.sentimientoPct;
            target.sentimiento = p.positivo >= p.neutral && p.positivo >= p.negativo
              ? "positivo"
              : p.negativo >= p.neutral ? "negativo" : "neutral";
          }
          matched++;
        });

        setRows(next);
        setImportInfo(`Importadas ${matched} fila(s).` + (noMatch.length ? ` Sin calce (${noMatch.length}): ${noMatch.slice(0, 5).join(", ")}${noMatch.length > 5 ? "…" : ""}` : "") + ' Revisa y pulsa "Guardar todo".');
      } catch (err) {
        console.error(err);
        setImportInfo("Error procesando el Excel. Verifica que las columnas coincidan con la plantilla.");
      } finally {
        if (fileInputRef.current) fileInputRef.current.value = "";
      }
    };
    reader.readAsBinaryString(file);
  };

  const save = async () => {
    setSaving(true);
    try {
      for (const r of rows) {
        const volumen = parseInt(String(r.volumen || 0)) || 0;
        const payload = {
          id: r.id,
          nombre: r.nombre,
          capital: r.capital || "",
          lat: r.lat,
          lng: r.lng,
          tema: r.tema || "",
          keywords: Array.isArray(r.keywords) ? r.keywords : toArr(r.keywords || ""),
          sentimiento: r.sentimiento || "neutral",
          sentimiento_pct: r.sentimientoPct || { positivo: 0, neutral: 0, negativo: 0 },
          volumen,
          plataformas: { Instagram: volumen },
          resumen: r.resumen || "",
          tendencia: r.tendencia || "estable",
          pct_cambio: parseFloat(String(r.pctCambio || 0)) || 0,
          top_hashtags: Array.isArray(r.topHashtags) ? r.topHashtags : toArr(r.topHashtags || ""),
          update_time: r.updateTime || "hace poco",
        };
        const { error } = await supabase
          .from("actores_colombia")
          .upsert(payload, { onConflict: "id" });
        if (error) throw error;
      }
      toast.success("Datos guardados", "Instagram por departamento actualizado.");
      onSaved();
    } catch (err: any) {
      console.error(err);
      toast.error("Error al guardar", err?.message || "Revisa la consola. ¿Tienes rol admin y RLS configurado?");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-3">
      <div className="sticky top-0 z-10 panel pb-3 space-y-3">
        <div className="flex items-center justify-between gap-3">
          <p className="text-xs text-[#aab3cf]">
            Edita las métricas de <b>Instagram</b> de los 33 departamentos. Los campos de identidad
            (código, nombre, coordenadas) son fijos para mantener el calce con el mapa.
          </p>
          <Button onClick={save} disabled={saving} className="bg-emerald-500 hover:bg-emerald-600 text-white shrink-0">
            <FontAwesomeIcon icon={faSave} className="w-4 h-4 mr-2" />
            {saving ? "Guardando..." : "Guardar todo"}
          </Button>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Button type="button" variant="outline" size="sm" className="panel-soft border-[#2a2a4a] text-white" onClick={downloadTemplate}>
            <FontAwesomeIcon icon={faFileArrowDown} className="w-4 h-4 mr-2" /> Descargar plantilla
          </Button>
          <Button type="button" variant="outline" size="sm" className="panel-soft border-[#2a2a4a] text-white" onClick={() => fileInputRef.current?.click()}>
            <FontAwesomeIcon icon={faFileArrowUp} className="w-4 h-4 mr-2" /> Importar Excel
          </Button>
          <input ref={fileInputRef} type="file" accept=".xlsx,.xls" className="hidden" onChange={handleImport} />
        </div>

        {importInfo && (
          <p className="text-[11px] text-[#75ddff] bg-[#0094ff]/10 border border-[#0094ff]/20 rounded-md px-3 py-2">{importInfo}</p>
        )}
      </div>

      <div className="space-y-2">
        {rows.map((r) => (
          <details key={r.id} className="group panel border border-[#2a2a4a] rounded-xl overflow-hidden">
            <summary className="flex items-center justify-between gap-3 px-4 py-3 cursor-pointer list-none hover:bg-white/5">
              <span className="flex items-center gap-3">
                <span className="font-mono text-xs text-[#8892b0] w-6">{r.id}</span>
                <span className="text-sm font-semibold text-white">{r.nombre}</span>
              </span>
              <span className="flex items-center gap-3">
                <span className="text-xs font-mono text-pink-400">{Number(r.volumen || 0).toLocaleString()}</span>
                <FontAwesomeIcon icon={faChevronDown} className="w-3 h-3 text-[#8892b0] transition-transform group-open:rotate-180" />
              </span>
            </summary>

            <div className="p-4 pt-2 border-t border-[#1e2240] grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Field label="Menciones Instagram">
                <Input type="number" className={inputCls} value={r.volumen ?? 0} onChange={(e) => update(r.id, "volumen", e.target.value)} />
              </Field>
              <Field label="% Cambio">
                <Input type="number" step="0.1" className={inputCls} value={r.pctCambio ?? 0} onChange={(e) => update(r.id, "pctCambio", e.target.value)} />
              </Field>

              <Field label="Sentimiento">
                <select className={`${inputCls} rounded-md px-2`} value={r.sentimiento || "neutral"} onChange={(e) => update(r.id, "sentimiento", e.target.value)}>
                  <option value="positivo">positivo</option>
                  <option value="neutral">neutral</option>
                  <option value="negativo">negativo</option>
                  <option value="mixto">mixto</option>
                </select>
              </Field>
              <Field label="Tendencia">
                <select className={`${inputCls} rounded-md px-2`} value={r.tendencia || "estable"} onChange={(e) => update(r.id, "tendencia", e.target.value)}>
                  <option value="sube">sube</option>
                  <option value="estable">estable</option>
                  <option value="baja">baja</option>
                </select>
              </Field>

              <div className="sm:col-span-2 grid grid-cols-3 gap-2">
                <Field label="% Positivo">
                  <DecimalInput className={inputCls} value={r.sentimientoPct?.positivo ?? 0} onChange={(v) => updatePct(r.id, "positivo", v)} />
                </Field>
                <Field label="% Neutral">
                  <DecimalInput className={inputCls} value={r.sentimientoPct?.neutral ?? 0} onChange={(v) => updatePct(r.id, "neutral", v)} />
                </Field>
                <Field label="% Negativo">
                  <DecimalInput className={inputCls} value={r.sentimientoPct?.negativo ?? 0} onChange={(v) => updatePct(r.id, "negativo", v)} />
                </Field>
              </div>

              <div className="sm:col-span-2">
                <Field label="Tema principal">
                  <Input className={inputCls} value={r.tema || ""} onChange={(e) => update(r.id, "tema", e.target.value)} />
                </Field>
              </div>
              <div className="sm:col-span-2">
                <Field label="Keywords (separadas por coma)">
                  <Input className={inputCls} value={toText(r.keywords)} onChange={(e) => update(r.id, "keywords", toArr(e.target.value))} />
                </Field>
              </div>
              <div className="sm:col-span-2">
                <Field label="Top hashtags (separados por coma)">
                  <Input className={inputCls} value={toText(r.topHashtags)} onChange={(e) => update(r.id, "topHashtags", toArr(e.target.value))} />
                </Field>
              </div>

              <Field label="Capital">
                <Input className={inputCls} value={r.capital || ""} onChange={(e) => update(r.id, "capital", e.target.value)} />
              </Field>
              <Field label="Actualizado">
                <Input className={inputCls} value={r.updateTime || ""} onChange={(e) => update(r.id, "updateTime", e.target.value)} />
              </Field>

              <div className="sm:col-span-2">
                <Field label="Resumen">
                  <textarea
                    className={`${inputCls} rounded-md p-2 min-h-[60px] resize-y`}
                    value={r.resumen || ""}
                    onChange={(e) => update(r.id, "resumen", e.target.value)}
                  />
                </Field>
              </div>
            </div>
          </details>
        ))}
      </div>
    </div>
  );
}
