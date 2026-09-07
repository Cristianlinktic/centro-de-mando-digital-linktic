"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { fetchCampaignData } from "@/lib/campana/client-data";
import { computeChannels, computeDaily, computeTotals } from "@/lib/campana/calc";
import { CHANNELS } from "@/lib/campana/constants";
import {
  formatCOP,
  formatCOPCompact,
  formatDate,
  formatDateShort,
  formatDecimal,
  formatNumber,
  formatPercent,
} from "@/lib/campana/format";
import type { CampaignData } from "@/lib/campana/types";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend,
} from "recharts";
import { EmptyCampaign, LoadingCampaign } from "./_shared";

export default function EstrategiaDigitalPage() {
  const [data, setData] = useState<CampaignData | null | undefined>(undefined);

  useEffect(() => {
    fetchCampaignData().then(setData).catch(() => setData(null));
  }, []);

  if (data === undefined) return <LoadingCampaign />;
  if (data === null) return <EmptyCampaign />;

  const channels = computeChannels(data);
  const totals = computeTotals(channels);
  const daily = computeDaily(data);
  const { campaign } = data;

  const donut = channels.map((c) => ({
    name: CHANNELS[c.channel].label,
    value: c.plannedBudget,
    color: CHANNELS[c.channel].color,
  }));

  const area = daily.map((d) => ({
    label: formatDateShort(d.date),
    meta: d.byChannel.meta?.investment ?? 0,
    pilas: d.byChannel.pilas?.investment ?? 0,
    youtube: d.byChannel.youtube?.investment ?? 0,
    google_display: d.byChannel.google_display?.investment ?? 0,
  }));

  const endDate = daily[daily.length - 1]?.date ?? campaign.start_date;

  return (
    <div className="space-y-6 pb-12">
      <p className="text-xs text-slate-500 -mt-4">
        {campaign.name} · {formatDate(campaign.start_date)} → {formatDate(endDate)} · {campaign.duration_days} días
      </p>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Kpi
          label="Inversión"
          value={data.metrics?.inversion_acumulada ? formatCOP(data.metrics.inversion_acumulada) : "—"}
          hint={`Estimado: ${formatCOP(campaign.total_budget)}`}
          color="#3b82f6"
        />
        <Kpi
          label="Impresiones"
          value={data.metrics?.impresion_acumulada ? formatNumber(data.metrics.impresion_acumulada) : "—"}
          hint={`Estimado: ${formatNumber(totals.impressions)}`}
          color="#a855f7"
        />
        <Kpi
          label="Alcance"
          value={data.metrics?.alcance_acumulado ? formatNumber(data.metrics.alcance_acumulado) : "—"}
          hint={`Estimado: ${formatNumber(totals.reach)}`}
          color="#2eb88a"
        />
        <Kpi
          label="Pacing presupuestal"
          value={data.metrics?.pacing_presupuestal != null ? `${formatDecimal(data.metrics.pacing_presupuestal)} %` : "— %"}
          hint="Meta de ejecución presupuestal"
          color="#e8a817"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-1 bg-[#0b101d]/70 backdrop-blur-md border border-white/5 p-6 rounded-2xl">
          <h3 className="font-bold text-sm text-slate-200 mb-4 uppercase tracking-widest">Distribución por canal</h3>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={donut} dataKey="value" nameKey="name" innerRadius={55} outerRadius={80} paddingAngle={2}>
                  {donut.map((d) => (
                    <Cell key={d.name} fill={d.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(v) => formatCOP(Number(v))}
                  contentStyle={{ backgroundColor: "#0b101d", border: "1px solid #1e293b", borderRadius: 12 }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <ul className="mt-2 space-y-2">
            {channels.map((c) => (
              <li key={c.channel} className="flex items-center justify-between text-xs">
                <span className="inline-flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: CHANNELS[c.channel].color }} />
                  <span className="text-slate-200">{CHANNELS[c.channel].label}</span>
                </span>
                <span className="text-slate-400 tabular-nums">
                  {formatPercent(c.participationPct, 0)} · {formatCOPCompact(c.plannedBudget)}
                </span>
              </li>
            ))}
          </ul>
        </Card>

        <Card className="lg:col-span-2 bg-[#0b101d]/70 backdrop-blur-md border border-white/5 p-6 rounded-2xl">
          <h3 className="font-bold text-sm text-slate-200 mb-4 uppercase tracking-widest">Inversión diaria por canal</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={area} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1e293b" />
                <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fill: "#64748b", fontSize: 10 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: "#64748b", fontSize: 10 }} tickFormatter={(v) => formatCOPCompact(v)} />
                <Tooltip
                  formatter={(v) => formatCOP(Number(v))}
                  contentStyle={{ backgroundColor: "#0b101d", border: "1px solid #1e293b", borderRadius: 12 }}
                />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                {(["meta", "pilas", "youtube", "google_display"] as const).map((k) => (
                  <Area
                    key={k}
                    type="monotone"
                    dataKey={k}
                    name={CHANNELS[k].label}
                    stackId="1"
                    stroke={CHANNELS[k].color}
                    fill={CHANNELS[k].color}
                    fillOpacity={0.25}
                  />
                ))}
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      <Card className="bg-[#0b101d]/70 backdrop-blur-md border border-white/5 rounded-2xl overflow-hidden">
        <div className="p-6 pb-3">
          <h3 className="font-bold text-sm text-slate-200 uppercase tracking-widest">Seguimiento real vs meta</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/5 text-left text-[10px] uppercase tracking-wider text-slate-500">
                <th className="px-6 py-2 font-bold">Canal</th>
                <th className="px-6 py-2 text-right font-bold">Planeado</th>
                <th className="px-6 py-2 text-right font-bold">Real</th>
                <th className="px-6 py-2 text-right font-bold">Diferencia</th>
                <th className="px-6 py-2 text-right font-bold">% Ejecución</th>
              </tr>
            </thead>
            <tbody>
              {channels.map((c) => (
                <tr key={c.channel} className="border-b border-white/5 hover:bg-white/3">
                  <td className="px-6 py-3 font-semibold text-slate-200">{CHANNELS[c.channel].label}</td>
                  <td className="px-6 py-3 text-right tabular-nums text-slate-400">{formatCOP(c.plannedBudget)}</td>
                  <td className="px-6 py-3 text-right tabular-nums text-slate-200">{formatCOP(c.realInvestment)}</td>
                  <td className={`px-6 py-3 text-right tabular-nums ${c.difference >= 0 ? "text-green-500" : "text-red-500"}`}>
                    {formatCOP(c.difference)}
                  </td>
                  <td className="px-6 py-3 text-right tabular-nums text-slate-400">{formatPercent(c.executionPct, 0)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-white/10 font-bold text-slate-100">
                <td className="px-6 py-3">Total</td>
                <td className="px-6 py-3 text-right tabular-nums">{formatCOP(totals.plannedBudget)}</td>
                <td className="px-6 py-3 text-right tabular-nums">{formatCOP(totals.realInvestment)}</td>
                <td className="px-6 py-3 text-right tabular-nums">{formatCOP(totals.difference)}</td>
                <td className="px-6 py-3 text-right tabular-nums">{formatPercent(totals.executionPct, 0)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </Card>
    </div>
  );
}

function Kpi({ label, value, hint, color }: { label: string; value: string; hint: string; color: string }) {
  return (
    <Card className="bg-[#0b101d]/70 backdrop-blur-md border-white/5 p-5 rounded-2xl relative overflow-hidden">
      <p className="text-[10px] font-bold text-slate-500 tracking-wider uppercase">{label}</p>
      <p className="text-2xl font-bold mt-1" style={{ color }}>{value}</p>
      <p className="text-[10px] text-slate-500 mt-1">{hint}</p>
      <div className="absolute bottom-0 left-0 w-full h-1" style={{ background: color, opacity: 0.6 }} />
    </Card>
  );
}
