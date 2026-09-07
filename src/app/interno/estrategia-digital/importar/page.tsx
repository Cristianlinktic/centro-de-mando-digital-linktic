"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { parsePautaWorkbook, ExcelParseError } from "@/lib/campana/excel";
import { replaceCampaignFromPlan } from "@/lib/campana/client-data";
import { formatCOP, formatDate } from "@/lib/campana/format";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faFileArrowUp, faCheck, faTriangleExclamation } from "@fortawesome/free-solid-svg-icons";

type Status = "idle" | "uploading" | "success" | "error";

interface Summary {
  name: string;
  totalBudget: number;
  durationDays: number;
  startDate: string;
  channels: number;
  days: number;
}

export default function ImportarPage() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState("");
  const [summary, setSummary] = useState<Summary | null>(null);
  const [dragging, setDragging] = useState(false);
  const [fileName, setFileName] = useState("");

  async function upload(file: File) {
    setStatus("uploading");
    setMessage("");
    setSummary(null);
    setFileName(file.name);

    if (file.size > 5 * 1024 * 1024) {
      setStatus("error");
      setMessage("El archivo supera el máximo de 5 MB.");
      return;
    }

    try {
      const buffer = await file.arrayBuffer();
      const plan = parsePautaWorkbook(buffer);
      await replaceCampaignFromPlan(plan);
      setStatus("success");
      setSummary({
        name: plan.name,
        totalBudget: plan.total_budget,
        durationDays: plan.duration_days,
        startDate: plan.start_date,
        channels: plan.channels.length,
        days: plan.days.length,
      });
      router.refresh();
    } catch (e) {
      setStatus("error");
      setMessage(e instanceof ExcelParseError ? e.message : "No se pudo importar el archivo.");
      console.error(e);
    }
  }

  function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) upload(file);
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) upload(file);
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pb-12">
      <div className="lg:col-span-2">
        <Card className="bg-[#0b101d] border border-white/5 p-6 rounded-2xl">
          <h3 className="font-bold text-sm text-slate-200 mb-1 uppercase tracking-widest">Subir plan de pauta</h3>
          <p className="text-xs text-slate-500 mb-5">
            El archivo reemplaza los datos de la campaña actual (la inversión real registrada se conserva).
          </p>

          <div
            onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={onDrop}
            onClick={() => inputRef.current?.click()}
            className={`flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed px-6 py-14 text-center transition-all ${
              dragging ? "border-blue-500 bg-blue-500/10" : "border-white/15 bg-white/3 hover:border-blue-500/50 hover:bg-blue-500/5"
            }`}
          >
            <input ref={inputRef} type="file" accept=".xlsx" className="hidden" onChange={onPick} />
            <FontAwesomeIcon icon={faFileArrowUp} className="text-3xl text-blue-400 mb-3" />
            <p className="text-sm font-bold text-slate-200">
              {status === "uploading" ? "Procesando archivo…" : "Arrastra tu archivo .xlsx aquí"}
            </p>
            <p className="text-xs text-slate-500 mt-1">o haz clic para seleccionarlo · máximo 5 MB</p>
            {fileName && status !== "idle" && (
              <p className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-400">
                📄 {fileName}
              </p>
            )}
          </div>

          {status === "uploading" && (
            <div className="h-1 w-full overflow-hidden rounded-full bg-white/10 mt-4">
              <div className="h-full w-1/2 animate-pulse rounded-full bg-blue-500" />
            </div>
          )}

          {status === "error" && (
            <div className="mt-4 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400 flex gap-2">
              <FontAwesomeIcon icon={faTriangleExclamation} className="mt-0.5" />
              <div><span className="font-bold">No se pudo importar. </span>{message}</div>
            </div>
          )}

          {status === "success" && summary && (
            <div className="mt-4 rounded-xl border border-green-500/30 bg-green-500/10 px-4 py-4">
              <p className="flex items-center gap-2 text-sm font-bold text-green-400">
                <FontAwesomeIcon icon={faCheck} /> Importación completada
              </p>
              <dl className="mt-3 grid grid-cols-2 gap-x-6 gap-y-2 text-sm sm:grid-cols-3">
                <Item label="Pauta" value={summary.name} />
                <Item label="Presupuesto" value={formatCOP(summary.totalBudget)} />
                <Item label="Duración" value={`${summary.durationDays} días`} />
                <Item label="Inicio" value={formatDate(summary.startDate)} />
                <Item label="Canales" value={String(summary.channels)} />
                <Item label="Días cargados" value={String(summary.days)} />
              </dl>
              <a href="/interno/estrategia-digital" className="mt-4 inline-block rounded-xl bg-blue-600 hover:bg-blue-700 px-4 py-2 text-sm font-bold text-white transition-colors">
                Ver dashboard
              </a>
            </div>
          )}
        </Card>
      </div>

      <Card className="bg-[#0b101d] border border-white/5 p-6 rounded-2xl">
        <h3 className="font-bold text-sm text-slate-200 mb-4 uppercase tracking-widest">Formato esperado</h3>
        <div className="space-y-3 text-xs text-slate-400">
          <p>El Excel debe contener estas hojas:</p>
          <ul className="space-y-2">
            <li className="flex gap-2"><Dot /><span><b className="text-slate-200">Resumen Ejecutivo</b> — presupuesto, duración, % / CPM / CTR por canal.</span></li>
            <li className="flex gap-2"><Dot /><span><b className="text-slate-200">Distribución x Canal</b> — objetivo, público y KPI por canal.</span></li>
            <li className="flex gap-2"><Dot /><span><b className="text-slate-200">Desglose Diario</b> — fecha de inicio y factor de peso por día.</span></li>
            <li className="flex gap-2"><Dot /><span><b className="text-slate-200">Proyecciones</b> — frecuencia estimada por canal.</span></li>
          </ul>
          <div className="rounded-lg bg-amber-500/10 px-3 py-2.5 text-amber-400">
            Las métricas se <b>calculan</b> en el dashboard a partir de estos parámetros.
          </div>
        </div>
      </Card>
    </div>
  );
}

function Dot() {
  return <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-blue-500" />;
}

function Item({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-[10px] uppercase tracking-wide text-green-400/70">{label}</dt>
      <dd className="font-semibold text-green-300">{value}</dd>
    </div>
  );
}
