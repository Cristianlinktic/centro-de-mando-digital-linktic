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
import { TOOLTIP_STYLE, TOOLTIP_LABEL_STYLE, TOOLTIP_ITEM_STYLE, TOOLTIP_CURSOR_LINE } from "@/lib/chart-theme";
import { ChartGradients, gradientFill, glowShadow } from "@/lib/chart-defs";

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
      <p className="text-xs text-[#8892b0] -mt-4">
        {campaign.name} · {formatDate(campaign.start_date)} → {formatDate(endDate)} · {campaign.duration_days} días
      </p>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Kpi
          label="Inversión"
          value={data.metrics?.inversion_acumulada ? formatCOP(data.metrics.inversion_acumulada) : "—"}
          hint={`Estimado: ${formatCOP(campaign.total_budget)}`}
          color="#0094ff"
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
        <Card className="lg:col-span-1 panel border border-[#1e2240] p-6 rounded-2xl">
          <h3 className="font-bold text-sm text-[#e4e9f5] mb-4 uppercase tracking-widest">Distribución por canal</h3>
          <div className="relative h-56">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <ChartGradients colors={donut.map((d) => d.color)} />
                <Pie
                  data={donut}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={58}
                  outerRadius={82}
                  paddingAngle={3}
                  cornerRadius={6}
                  stroke="none"
                  isAnimationActive
                  animationDuration={700}
                  animationEasing="ease-out"
                >
                  {donut.map((d) => (
                    <Cell key={d.name} fill={gradientFill(d.color)} style={{ filter: glowShadow(d.color, 6) }} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(v) => formatCOP(Number(v))}
                  contentStyle={TOOLTIP_STYLE} labelStyle={TOOLTIP_LABEL_STYLE} itemStyle={TOOLTIP_ITEM_STYLE}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-[9px] uppercase tracking-widest text-[#8892b0]">Total</span>
              <span className="text-base font-bold text-white">{formatCOPCompact(totals.plannedBudget)}</span>
            </div>
          </div>
          <ul className="mt-2 space-y-2">
            {channels.map((c) => (
              <li key={c.channel} className="flex items-center justify-between text-xs">
                <span className="inline-flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: CHANNELS[c.channel].color }} />
                  <span className="text-[#e4e9f5]">{CHANNELS[c.channel].label}</span>
                </span>
                <span className="text-[#aab3cf] tabular-nums">
                  {formatPercent(c.participationPct, 0)} · {formatCOPCompact(c.plannedBudget)}
                </span>
              </li>
            ))}
          </ul>
        </Card>

        <Card className="lg:col-span-2 panel border border-[#1e2240] p-6 rounded-2xl">
          <h3 className="font-bold text-sm text-[#e4e9f5] mb-4 uppercase tracking-widest">Inversión diaria por canal</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={area} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <ChartGradients colors={(["meta", "pilas", "youtube", "google_display"] as const).map((k) => CHANNELS[k].color)} />
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1e2240" />
                <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fill: "#aab3cf", fontSize: 10 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: "#aab3cf", fontSize: 10 }} tickFormatter={(v) => formatCOPCompact(v)} />
                <Tooltip
                  formatter={(v) => formatCOP(Number(v))}
                  contentStyle={TOOLTIP_STYLE} labelStyle={TOOLTIP_LABEL_STYLE} itemStyle={TOOLTIP_ITEM_STYLE}
                  cursor={TOOLTIP_CURSOR_LINE}
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
                    strokeWidth={2}
                    fill={gradientFill(CHANNELS[k].color)}
                    activeDot={{ r: 4, strokeWidth: 0, style: { filter: glowShadow(CHANNELS[k].color, 8) } }}
                    animationDuration={700}
                    animationEasing="ease-out"
                  />
                ))}
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      <Card className="panel border border-[#1e2240] rounded-2xl overflow-hidden">
        <div className="p-6 pb-3">
          <h3 className="font-bold text-sm text-[#e4e9f5] uppercase tracking-widest">Seguimiento real vs meta</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#1e2240] text-left text-[10px] uppercase tracking-wider text-[#8892b0]">
                <th className="px-6 py-2 font-bold">Canal</th>
                <th className="px-6 py-2 text-right font-bold">Planeado</th>
                <th className="px-6 py-2 text-right font-bold">Real</th>
                <th className="px-6 py-2 text-right font-bold">Diferencia</th>
                <th className="px-6 py-2 text-right font-bold">% Ejecución</th>
              </tr>
            </thead>
            <tbody>
              {channels.map((c) => (
                <tr key={c.channel} className="border-b border-[#1e2240] hover:bg-white/3">
                  <td className="px-6 py-3 font-semibold text-[#e4e9f5]">{CHANNELS[c.channel].label}</td>
                  <td className="px-6 py-3 text-right tabular-nums text-[#aab3cf]">{formatCOP(c.plannedBudget)}</td>
                  <td className="px-6 py-3 text-right tabular-nums text-[#e4e9f5]">{formatCOP(c.realInvestment)}</td>
                  <td className={`px-6 py-3 text-right tabular-nums ${c.difference >= 0 ? "text-green-500" : "text-red-500"}`}>
                    {formatCOP(c.difference)}
                  </td>
                  <td className="px-6 py-3 text-right tabular-nums text-[#aab3cf]">{formatPercent(c.executionPct, 0)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-[#2a2a4a] font-bold text-[#ffffff]">
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
    <Card className="panel border-[#1e2240] p-5 rounded-2xl relative overflow-hidden">
      <p className="text-[10px] font-bold text-[#8892b0] tracking-wider uppercase">{label}</p>
      <p className="text-2xl font-bold mt-1" style={{ color }}>{value}</p>
      <p className="text-[10px] text-[#8892b0] mt-1">{hint}</p>
      <div className="absolute bottom-0 left-0 w-full h-1" style={{ background: color, opacity: 0.6 }} />
    </Card>
  );
}
