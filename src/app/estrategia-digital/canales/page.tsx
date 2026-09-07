"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/components/auth-provider";
import { canEdit } from "@/lib/auth/rbac";
import { fetchCampaignData, updateChannel } from "@/lib/campana/client-data";
import { computeChannels, computeTotals } from "@/lib/campana/calc";
import { CHANNELS } from "@/lib/campana/constants";
import { formatCOP, formatDecimal, formatNumber, formatPercent } from "@/lib/campana/format";
import type { CampaignChannel, CampaignData } from "@/lib/campana/types";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import { EmptyCampaign, LoadingCampaign, round } from "../_shared";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPen, faSave, faXmark } from "@fortawesome/free-solid-svg-icons";

const CHANNEL_KEYS = ["meta", "pilas", "youtube", "google_display"] as const;

export default function CanalesPage() {
  const { role } = useAuth();
  const [data, setData] = useState<CampaignData | null | undefined>(undefined);

  const load = () => fetchCampaignData().then(setData).catch(() => setData(null));
  useEffect(() => { load(); }, []);

  if (data === undefined) return <LoadingCampaign />;
  if (data === null) return <EmptyCampaign />;

  const channels = computeChannels(data);
  const totals = computeTotals(channels);

  const impressionsData = channels.map((c) => ({ name: CHANNELS[c.channel].label, value: Math.round(c.impressions), color: CHANNELS[c.channel].color }));
  const clicksData = channels.map((c) => ({ name: CHANNELS[c.channel].label, value: Math.round(c.clicks), color: CHANNELS[c.channel].color }));

  return (
    <div className="space-y-6 pb-12">
      <Card className="bg-[#0b101d]/70 backdrop-blur-md border border-white/5 rounded-2xl overflow-hidden">
        <div className="p-6 pb-3">
          <h3 className="font-bold text-sm text-slate-200 uppercase tracking-widest">Presupuesto y proyección por canal</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-sm">
            <thead>
              <tr className="border-b border-white/5 text-left text-[10px] uppercase tracking-wider text-slate-500">
                <th className="px-4 py-2 font-bold">Canal</th>
                <th className="px-4 py-2 text-right font-bold">%</th>
                <th className="px-4 py-2 text-right font-bold">Presupuesto</th>
                <th className="px-4 py-2 text-right font-bold">Diario</th>
                <th className="px-4 py-2 text-right font-bold">CPM</th>
                <th className="px-4 py-2 text-right font-bold">Impresiones</th>
                <th className="px-4 py-2 text-right font-bold">CTR</th>
                <th className="px-4 py-2 text-right font-bold">Clicks</th>
                <th className="px-4 py-2 text-right font-bold">CPC</th>
                <th className="px-4 py-2 text-right font-bold">Alcance</th>
              </tr>
            </thead>
            <tbody>
              {channels.map((c) => (
                <tr key={c.channel} className="border-b border-white/5 hover:bg-white/3">
                  <td className="px-4 py-2 font-semibold text-slate-200">{CHANNELS[c.channel].label}</td>
                  <td className="px-4 py-2 text-right tabular-nums text-slate-400">{formatPercent(c.participationPct, 0)}</td>
                  <td className="px-4 py-2 text-right tabular-nums font-bold text-slate-200">{formatCOP(c.plannedBudget)}</td>
                  <td className="px-4 py-2 text-right tabular-nums text-slate-400">{formatCOP(c.dailyBudget)}</td>
                  <td className="px-4 py-2 text-right tabular-nums text-slate-400">{formatCOP(c.cpm)}</td>
                  <td className="px-4 py-2 text-right tabular-nums text-slate-400">{formatNumber(c.impressions)}</td>
                  <td className="px-4 py-2 text-right tabular-nums text-slate-400">{formatPercent(c.ctr)}</td>
                  <td className="px-4 py-2 text-right tabular-nums text-slate-400">{formatNumber(c.clicks)}</td>
                  <td className="px-4 py-2 text-right tabular-nums text-slate-400">{formatCOP(c.cpc)}</td>
                  <td className="px-4 py-2 text-right tabular-nums text-slate-400">{formatNumber(c.reach)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-white/10 font-bold text-slate-100">
                <td className="px-4 py-2">Total</td>
                <td className="px-4 py-2 text-right tabular-nums">100%</td>
                <td className="px-4 py-2 text-right tabular-nums">{formatCOP(totals.plannedBudget)}</td>
                <td className="px-4 py-2 text-right tabular-nums">{formatCOP(totals.dailyBudget)}</td>
                <td className="px-4 py-2 text-right tabular-nums">{formatCOP(totals.blendedCpm)}</td>
                <td className="px-4 py-2 text-right tabular-nums">{formatNumber(totals.impressions)}</td>
                <td className="px-4 py-2 text-right tabular-nums">{formatPercent(totals.weightedCtr)}</td>
                <td className="px-4 py-2 text-right tabular-nums">{formatNumber(totals.clicks)}</td>
                <td className="px-4 py-2 text-right tabular-nums">{formatCOP(totals.blendedCpc)}</td>
                <td className="px-4 py-2 text-right tabular-nums">{formatNumber(totals.reach)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
        <div className="border-t border-white/5 px-6 py-3 text-[11px] text-slate-500">
          * Alcance estimado = impresiones ÷ frecuencia por canal (frecuencia promedio {formatDecimal(channels.reduce((a, c) => a + c.frequency, 0) / (channels.length || 1))}x).
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-[#0b101d]/70 backdrop-blur-md border border-white/5 p-6 rounded-2xl">
          <h3 className="font-bold text-sm text-slate-200 mb-4 uppercase tracking-widest">Impresiones por canal</h3>
          <MiniBar data={impressionsData} />
        </Card>
        <Card className="bg-[#0b101d]/70 backdrop-blur-md border border-white/5 p-6 rounded-2xl">
          <h3 className="font-bold text-sm text-slate-200 mb-4 uppercase tracking-widest">Clicks por canal</h3>
          <MiniBar data={clicksData} />
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {data.channels.map((ch) => (
          <ChannelCard key={ch.id} channel={ch} canEditChannel={canEdit(role)} onSaved={load} />
        ))}
      </div>
    </div>
  );
}

function MiniBar({ data }: { data: { name: string; value: number; color: string }[] }) {
  return (
    <div className="h-56">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1e293b" />
          <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: "#64748b", fontSize: 10 }} />
          <YAxis axisLine={false} tickLine={false} tick={{ fill: "#64748b", fontSize: 10 }} />
          <Tooltip contentStyle={{ backgroundColor: "#0b101d", border: "1px solid #1e293b", borderRadius: 12 }} />
          <Bar dataKey="value" radius={[4, 4, 0, 0]}>
            {data.map((d) => <Cell key={d.name} fill={d.color} />)}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

function ChannelCard({
  channel, canEditChannel, onSaved,
}: { channel: CampaignChannel; canEditChannel: boolean; onSaved: () => void }) {
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    participation_pct: round(channel.participation_pct * 100, 2),
    cpm: channel.cpm,
    ctr: round(channel.ctr * 100, 3),
    frequency: channel.frequency,
    objective: channel.objective ?? "",
    target_audience: channel.target_audience ?? "",
    main_kpi: channel.main_kpi ?? "",
  });

  const meta = CHANNELS[channel.channel];

  const save = async () => {
    setSaving(true);
    try {
      await updateChannel({
        id: channel.id,
        participation_pct: form.participation_pct / 100,
        cpm: form.cpm,
        ctr: form.ctr / 100,
        frequency: form.frequency,
        objective: form.objective,
        target_audience: form.target_audience,
        main_kpi: form.main_kpi,
      });
      setEditing(false);
      onSaved();
    } catch (e) {
      alert("No se pudo guardar el canal.");
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card className="bg-[#0b101d]/70 backdrop-blur-md border border-white/5 p-5 rounded-2xl" style={{ borderTop: `3px solid ${meta.color}` }}>
      <div className="flex items-center justify-between mb-3">
        <div>
          <p className="font-bold text-slate-100">{meta.label}</p>
          <p className="text-[11px] text-slate-500">{meta.subtitle}</p>
        </div>
        {canEditChannel && (
          editing ? (
            <div className="flex gap-1">
              <Button size="sm" variant="ghost" onClick={() => setEditing(false)} className="h-7 w-7 p-0 text-slate-400">
                <FontAwesomeIcon icon={faXmark} className="w-3 h-3" />
              </Button>
              <Button size="sm" onClick={save} disabled={saving} className="h-7 px-2 bg-green-600 hover:bg-green-700">
                <FontAwesomeIcon icon={faSave} className="w-3 h-3" />
              </Button>
            </div>
          ) : (
            <Button size="sm" variant="ghost" onClick={() => setEditing(true)} className="h-7 w-7 p-0 text-blue-400">
              <FontAwesomeIcon icon={faPen} className="w-3 h-3" />
            </Button>
          )
        )}
      </div>

      {editing ? (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <LabeledInput label="% Participación" type="number" value={form.participation_pct} onChange={(v) => setForm({ ...form, participation_pct: v })} />
            <LabeledInput label="CPM (COP)" type="number" value={form.cpm} onChange={(v) => setForm({ ...form, cpm: v })} />
            <LabeledInput label="CTR (%)" type="number" value={form.ctr} onChange={(v) => setForm({ ...form, ctr: v })} />
            <LabeledInput label="Frecuencia" type="number" value={form.frequency} onChange={(v) => setForm({ ...form, frequency: v })} />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] uppercase font-bold text-slate-500">Objetivo</label>
            <Input value={form.objective} onChange={(e) => setForm({ ...form, objective: e.target.value })} className="bg-white/5 border-white/10 h-8 text-xs" />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] uppercase font-bold text-slate-500">Público objetivo</label>
            <Input value={form.target_audience} onChange={(e) => setForm({ ...form, target_audience: e.target.value })} className="bg-white/5 border-white/10 h-8 text-xs" />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] uppercase font-bold text-slate-500">KPI principal</label>
            <Input value={form.main_kpi} onChange={(e) => setForm({ ...form, main_kpi: e.target.value })} className="bg-white/5 border-white/10 h-8 text-xs" />
          </div>
        </div>
      ) : (
        <dl className="space-y-2 text-sm">
          <Field label="Participación" value={`${formatDecimal(channel.participation_pct * 100)}%`} />
          <Field label="Objetivo" value={channel.objective} />
          <Field label="Público objetivo" value={channel.target_audience} />
          <Field label="KPI principal" value={channel.main_kpi} />
        </dl>
      )}
    </Card>
  );
}

function LabeledInput({ label, type, value, onChange }: { label: string; type: string; value: number; onChange: (v: number) => void }) {
  return (
    <div className="space-y-1">
      <label className="text-[10px] uppercase font-bold text-slate-500">{label}</label>
      <Input type={type} value={value} onChange={(e) => onChange(parseFloat(e.target.value) || 0)} className="bg-white/5 border-white/10 h-8 text-xs" />
    </div>
  );
}

function Field({ label, value }: { label: string; value: string | null }) {
  return (
    <div className="flex flex-col gap-0.5">
      <dt className="text-[10px] font-bold uppercase tracking-wider text-slate-500">{label}</dt>
      <dd className="text-slate-200 text-xs">{value ?? "—"}</dd>
    </div>
  );
}
