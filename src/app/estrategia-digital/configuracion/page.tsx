"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useAuth } from "@/components/auth-provider";
import { canEdit } from "@/lib/auth/rbac";
import {
  fetchCampaignData,
  updateCampaignParams,
  upsertCampaignMetrics,
  upsertDailyActuals,
  upsertDailyImpressions,
} from "@/lib/campana/client-data";
import { participationSum } from "@/lib/campana/calc";
import { CHANNELS } from "@/lib/campana/constants";
import { formatDate, formatPercent } from "@/lib/campana/format";
import type { CampaignData, DailyActuals, DailyImpressions, DailyPlan } from "@/lib/campana/types";
import { EmptyCampaign, LoadingCampaign } from "../_shared";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSave } from "@fortawesome/free-solid-svg-icons";

const CHANNEL_KEYS = ["meta", "pilas", "youtube", "google_display"] as const;

export default function ConfiguracionPage() {
  const { role } = useAuth();
  const editable = canEdit(role);
  const [data, setData] = useState<CampaignData | null | undefined>(undefined);

  const load = () => fetchCampaignData().then(setData).catch(() => setData(null));
  useEffect(() => { load(); }, []);

  if (data === undefined) return <LoadingCampaign />;
  if (data === null) return <EmptyCampaign />;

  const pctSum = participationSum(data.channels);
  const pctOk = Math.abs(pctSum - 1) < 0.005;

  return (
    <div className="space-y-6 pb-12">
      {!pctOk && (
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-400">
          ⚠️ La suma de participación por canal es <b>{formatPercent(pctSum, 1)}</b> (debería ser 100%). Ajusta los canales en la pestaña Canales.
        </div>
      )}

      <Tabs defaultValue="parametros">
        <TabsList variant="line">
          <TabsTrigger value="parametros">Parámetros</TabsTrigger>
          <TabsTrigger value="metricas">Métricas acumuladas</TabsTrigger>
          <TabsTrigger value="inversion">Inversión real</TabsTrigger>
          <TabsTrigger value="impresiones">Impresiones reales</TabsTrigger>
        </TabsList>

        <TabsContent value="parametros" className="pt-4">
          <ParamsForm data={data} editable={editable} onSaved={load} />
        </TabsContent>
        <TabsContent value="metricas" className="pt-4">
          <MetricsForm data={data} editable={editable} onSaved={load} />
        </TabsContent>
        <TabsContent value="inversion" className="pt-4">
          <DailyForm
            title="Inversión real por canal por día"
            subtitle="Ingresa los valores reales de inversión diaria por canal (COP)."
            campaignId={data.campaign.id}
            days={data.days}
            rows={data.actuals}
            editable={editable}
            onSave={upsertDailyActuals}
            onSaved={load}
          />
        </TabsContent>
        <TabsContent value="impresiones" className="pt-4">
          <DailyForm
            title="Impresiones reales por canal por día"
            subtitle="Ingresa las impresiones reales por canal."
            campaignId={data.campaign.id}
            days={data.days}
            rows={data.impressions}
            editable={editable}
            onSave={upsertDailyImpressions}
            onSaved={load}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function ParamsForm({ data, editable, onSaved }: { data: CampaignData; editable: boolean; onSaved: () => void }) {
  const [form, setForm] = useState({
    name: data.campaign.name,
    total_budget: data.campaign.total_budget,
    duration_days: data.campaign.duration_days,
    start_date: data.campaign.start_date,
  });
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setSaving(true);
    try {
      await updateCampaignParams({ id: data.campaign.id, ...form });
      onSaved();
    } catch (e) {
      alert("No se pudieron guardar los parámetros.");
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card className="bg-[#0b101d] border border-white/5 p-6 rounded-2xl">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Field label="Nombre" className="sm:col-span-2">
          <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} disabled={!editable} className="bg-white/5 border-white/10" />
        </Field>
        <Field label="Presupuesto total (COP)">
          <Input type="number" value={form.total_budget} onChange={(e) => setForm({ ...form, total_budget: Number(e.target.value) || 0 })} disabled={!editable} className="bg-white/5 border-white/10" />
        </Field>
        <Field label="Duración (días)">
          <Input type="number" value={form.duration_days} onChange={(e) => setForm({ ...form, duration_days: Number(e.target.value) || 1 })} disabled={!editable} className="bg-white/5 border-white/10" />
        </Field>
        <Field label="Fecha de inicio">
          <Input type="date" value={form.start_date} onChange={(e) => setForm({ ...form, start_date: e.target.value })} disabled={!editable} className="bg-white/5 border-white/10" />
        </Field>
      </div>
      {editable && (
        <div className="mt-4">
          <Button onClick={save} disabled={saving} className="bg-blue-600 hover:bg-blue-700 font-bold">
            <FontAwesomeIcon icon={faSave} className="mr-2" /> {saving ? "Guardando…" : "Guardar parámetros"}
          </Button>
        </div>
      )}
    </Card>
  );
}

function MetricsForm({ data, editable, onSaved }: { data: CampaignData; editable: boolean; onSaved: () => void }) {
  const [form, setForm] = useState({
    inversion_acumulada: data.metrics?.inversion_acumulada ?? 0,
    impresion_acumulada: data.metrics?.impresion_acumulada ?? 0,
    alcance_acumulado: data.metrics?.alcance_acumulado ?? 0,
    pacing_presupuestal: data.metrics?.pacing_presupuestal ?? 0,
  });
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setSaving(true);
    try {
      await upsertCampaignMetrics({ campaign_id: data.campaign.id, ...form });
      onSaved();
    } catch (e) {
      alert("No se pudieron guardar las métricas.");
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card className="bg-[#0b101d] border border-white/5 p-6 rounded-2xl">
      <p className="text-xs text-slate-500 mb-4">Estos valores se muestran en las cards del Resumen. Actualízalos periódicamente.</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Field label="Inversión acumulada (COP)">
          <Input type="number" value={form.inversion_acumulada} onChange={(e) => setForm({ ...form, inversion_acumulada: Number(e.target.value) || 0 })} disabled={!editable} className="bg-white/5 border-white/10" />
        </Field>
        <Field label="Impresión acumulada">
          <Input type="number" value={form.impresion_acumulada} onChange={(e) => setForm({ ...form, impresion_acumulada: Number(e.target.value) || 0 })} disabled={!editable} className="bg-white/5 border-white/10" />
        </Field>
        <Field label="Alcance acumulado">
          <Input type="number" value={form.alcance_acumulado} onChange={(e) => setForm({ ...form, alcance_acumulado: Number(e.target.value) || 0 })} disabled={!editable} className="bg-white/5 border-white/10" />
        </Field>
        <Field label="Pacing presupuestal (%)">
          <Input type="number" value={form.pacing_presupuestal} onChange={(e) => setForm({ ...form, pacing_presupuestal: Number(e.target.value) || 0 })} disabled={!editable} className="bg-white/5 border-white/10" />
        </Field>
      </div>
      {editable && (
        <div className="mt-4">
          <Button onClick={save} disabled={saving} className="bg-blue-600 hover:bg-blue-700 font-bold">
            <FontAwesomeIcon icon={faSave} className="mr-2" /> {saving ? "Guardando…" : "Guardar métricas"}
          </Button>
        </div>
      )}
    </Card>
  );
}

type DailyRow = DailyActuals | DailyImpressions;

function DailyForm({
  title, subtitle, campaignId, days, rows, editable, onSave, onSaved,
}: {
  title: string;
  subtitle: string;
  campaignId: string;
  days: DailyPlan[];
  rows: DailyRow[];
  editable: boolean;
  onSave: (campaignId: string, rows: { day_number: number; date: string; meta: number; pilas: number; youtube: number; google_display: number }[]) => Promise<void>;
  onSaved: () => void;
}) {
  const rowsMap = new Map(rows.map((r) => [r.day_number, r]));
  const [values, setValues] = useState<Record<number, Record<(typeof CHANNEL_KEYS)[number], number>>>(() => {
    const init: Record<number, Record<(typeof CHANNEL_KEYS)[number], number>> = {};
    for (const d of days) {
      const r = rowsMap.get(d.day_number);
      init[d.day_number] = {
        meta: r?.meta ?? 0,
        pilas: r?.pilas ?? 0,
        youtube: r?.youtube ?? 0,
        google_display: r?.google_display ?? 0,
      };
    }
    return init;
  });
  const [saving, setSaving] = useState(false);

  const setCell = (dayNumber: number, key: (typeof CHANNEL_KEYS)[number], v: number) => {
    setValues((s) => ({ ...s, [dayNumber]: { ...s[dayNumber], [key]: v } }));
  };

  const save = async () => {
    setSaving(true);
    try {
      const payload = days.map((d) => ({
        day_number: d.day_number,
        date: d.date,
        ...values[d.day_number],
      }));
      await onSave(campaignId, payload);
      onSaved();
    } catch (e) {
      alert("No se pudieron guardar los datos.");
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card className="bg-[#0b101d] border border-white/5 rounded-2xl overflow-hidden">
      <div className="p-6 pb-3">
        <h3 className="font-bold text-sm text-slate-200 uppercase tracking-widest">{title}</h3>
        <p className="text-xs text-slate-500 mt-1">{subtitle}</p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] text-sm">
          <thead>
            <tr className="border-b border-white/5 text-left text-[10px] uppercase tracking-wider text-slate-500">
              <th className="px-4 py-2 font-bold">Día</th>
              <th className="px-4 py-2 font-bold">Fecha</th>
              {CHANNEL_KEYS.map((k) => (
                <th key={k} className="px-3 py-2 font-bold">
                  <span className="inline-flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: CHANNELS[k].color }} />
                    {CHANNELS[k].label}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {days.map((d) => (
              <tr key={d.day_number} className="border-b border-white/5 hover:bg-white/3">
                <td className="px-4 py-1.5 font-semibold text-slate-200">{d.day_number}</td>
                <td className="px-4 py-1.5 text-slate-400">{formatDate(d.date)}</td>
                {CHANNEL_KEYS.map((k) => (
                  <td key={k} className="px-3 py-1.5">
                    <Input
                      type="number"
                      min={0}
                      disabled={!editable}
                      value={values[d.day_number]?.[k] ?? 0}
                      onChange={(e) => setCell(d.day_number, k, Number(e.target.value) || 0)}
                      className="h-8 text-right bg-white/5 border-white/10 text-xs min-w-[90px]"
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {editable && (
        <div className="border-t border-white/5 px-6 py-4 flex justify-end">
          <Button onClick={save} disabled={saving} className="bg-green-600 hover:bg-green-700 font-bold">
            <FontAwesomeIcon icon={faSave} className="mr-2" /> {saving ? "Guardando…" : "Guardar datos"}
          </Button>
        </div>
      )}
    </Card>
  );
}

function Field({ label, className, children }: { label: string; className?: string; children: React.ReactNode }) {
  return (
    <label className={`flex flex-col gap-1.5 ${className ?? ""}`}>
      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">{label}</span>
      {children}
    </label>
  );
}
