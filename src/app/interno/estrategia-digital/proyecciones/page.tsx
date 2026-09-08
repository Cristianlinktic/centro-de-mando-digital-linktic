"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { fetchCampaignData } from "@/lib/campana/client-data";
import { computeChannels, computeDaily, computeTotals } from "@/lib/campana/calc";
import { CHANNELS } from "@/lib/campana/constants";
import { formatCOP, formatDate, formatDateShort, formatDecimal, formatNumber, formatPercent } from "@/lib/campana/format";
import type { CampaignData } from "@/lib/campana/types";
import { ResponsiveContainer, ComposedChart, Line, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from "recharts";
import { EmptyCampaign, LoadingCampaign, useCategoria } from "../_shared";
import { TOOLTIP_STYLE, TOOLTIP_LABEL_STYLE, TOOLTIP_ITEM_STYLE, TOOLTIP_CURSOR_LINE } from "@/lib/chart-theme";
import { ChartGradients, gradientFill, glowShadow } from "@/lib/chart-defs";

export default function ProyeccionesPage() {
  const tipo = useCategoria();
  const [data, setData] = useState<CampaignData | null | undefined>(undefined);

  useEffect(() => {
    setData(undefined);
    fetchCampaignData(tipo).then(setData).catch(() => setData(null));
  }, [tipo]);

  if (data === undefined) return <LoadingCampaign />;
  if (data === null) return <EmptyCampaign />;

  const channels = computeChannels(data);
  const totals = computeTotals(channels);
  const daily = computeDaily(data);

  const chart = daily.map((d) => ({
    label: formatDateShort(d.date),
    impresiones: Math.round(d.totalImpressions),
    clicks: Math.round(d.totalClicks),
  }));

  return (
    <div className="space-y-6 pb-12">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Kpi label="Impresiones totales" value={formatNumber(totals.impressions)} color="#a855f7" />
        <Kpi label="Clicks totales" value={formatNumber(totals.clicks)} color="#2eb88a" />
        <Kpi label="Alcance único estimado" value={formatNumber(totals.reach)} hint="Suma de impresiones ÷ frecuencia" color="#0094ff" />
        <Kpi label="CTR ponderado" value={formatPercent(totals.weightedCtr)} hint={`CPC ${formatCOP(totals.blendedCpc)}`} color="#e8a817" />
      </div>

      <Card className="panel border border-[#1e2240] rounded-2xl overflow-hidden">
        <div className="p-6 pb-3">
          <h3 className="font-bold text-sm text-[#e4e9f5] uppercase tracking-widest">Proyección consolidada por canal</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[820px] text-sm">
            <thead>
              <tr className="border-b border-[#1e2240] text-left text-[10px] uppercase tracking-wider text-[#8892b0]">
                <th className="px-4 py-2 font-bold">Canal</th>
                <th className="px-4 py-2 text-right font-bold">Inversión</th>
                <th className="px-4 py-2 text-right font-bold">CPM</th>
                <th className="px-4 py-2 text-right font-bold">Impresiones</th>
                <th className="px-4 py-2 text-right font-bold">CTR</th>
                <th className="px-4 py-2 text-right font-bold">Clicks</th>
                <th className="px-4 py-2 text-right font-bold">Frecuencia</th>
                <th className="px-4 py-2 text-right font-bold">Alcance único</th>
              </tr>
            </thead>
            <tbody>
              {channels.map((c) => (
                <tr key={c.channel} className="border-b border-[#1e2240] hover:bg-white/3">
                  <td className="px-4 py-2 font-semibold text-[#e4e9f5]">{CHANNELS[c.channel].label}</td>
                  <td className="px-4 py-2 text-right tabular-nums text-[#aab3cf]">{formatCOP(c.plannedBudget)}</td>
                  <td className="px-4 py-2 text-right tabular-nums text-[#aab3cf]">{formatCOP(c.cpm)}</td>
                  <td className="px-4 py-2 text-right tabular-nums text-[#aab3cf]">{formatNumber(c.impressions)}</td>
                  <td className="px-4 py-2 text-right tabular-nums text-[#aab3cf]">{formatPercent(c.ctr)}</td>
                  <td className="px-4 py-2 text-right tabular-nums text-[#aab3cf]">{formatNumber(c.clicks)}</td>
                  <td className="px-4 py-2 text-right tabular-nums text-[#aab3cf]">{formatDecimal(c.frequency)}x</td>
                  <td className="px-4 py-2 text-right tabular-nums text-[#aab3cf]">{formatNumber(c.reach)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-[#2a2a4a] font-bold text-[#ffffff]">
                <td className="px-4 py-2">Total</td>
                <td className="px-4 py-2 text-right tabular-nums">{formatCOP(totals.plannedBudget)}</td>
                <td className="px-4 py-2 text-right tabular-nums">{formatCOP(totals.blendedCpm)}</td>
                <td className="px-4 py-2 text-right tabular-nums">{formatNumber(totals.impressions)}</td>
                <td className="px-4 py-2 text-right tabular-nums">{formatPercent(totals.weightedCtr)}</td>
                <td className="px-4 py-2 text-right tabular-nums">{formatNumber(totals.clicks)}</td>
                <td className="px-4 py-2 text-right tabular-nums">—</td>
                <td className="px-4 py-2 text-right tabular-nums">{formatNumber(totals.reach)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </Card>

      <Card className="panel border border-[#1e2240] p-6 rounded-2xl">
        <h3 className="font-bold text-sm text-[#e4e9f5] mb-1 uppercase tracking-widest">Proyección diaria — impresiones y clicks</h3>
        <p className="text-xs text-[#8892b0] mb-4">Todos los canales combinados</p>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={chart} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <ChartGradients colors={["#a855f7", "#2eb88a"]} />
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1e2240" />
              <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fill: "#aab3cf", fontSize: 10 }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fill: "#aab3cf", fontSize: 10 }} />
              <Tooltip
                contentStyle={TOOLTIP_STYLE} labelStyle={TOOLTIP_LABEL_STYLE} itemStyle={TOOLTIP_ITEM_STYLE}
                cursor={TOOLTIP_CURSOR_LINE}
              />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Area type="monotone" dataKey="impresiones" name="Impresiones" fill={gradientFill("#a855f7")} stroke="none" legendType="none" tooltipType="none" isAnimationActive animationDuration={700} />
              <Area type="monotone" dataKey="clicks" name="Clicks" fill={gradientFill("#2eb88a")} stroke="none" legendType="none" tooltipType="none" isAnimationActive animationDuration={700} />
              <Line
                type="monotone" dataKey="impresiones" name="Impresiones" stroke="#a855f7" strokeWidth={2.5} dot={false}
                style={{ filter: glowShadow("#a855f7", 5) }}
                activeDot={{ r: 4, strokeWidth: 0, style: { filter: glowShadow("#a855f7", 9) } }}
                animationDuration={700} animationEasing="ease-out"
              />
              <Line
                type="monotone" dataKey="clicks" name="Clicks" stroke="#2eb88a" strokeWidth={2.5} dot={false}
                style={{ filter: glowShadow("#2eb88a", 5) }}
                activeDot={{ r: 4, strokeWidth: 0, style: { filter: glowShadow("#2eb88a", 9) } }}
                animationDuration={700} animationEasing="ease-out"
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <p className="px-1 text-xs text-[#8892b0]">
        * Las proyecciones se recalculan automáticamente al editar CPM, CTR o frecuencia en Canales/Configuración.
        Campaña del {formatDate(daily[0]?.date ?? data.campaign.start_date)} al {formatDate(daily[daily.length - 1]?.date ?? data.campaign.start_date)}.
      </p>
    </div>
  );
}

function Kpi({ label, value, hint, color }: { label: string; value: string; hint?: string; color: string }) {
  return (
    <Card className="panel border-[#1e2240] p-5 rounded-2xl relative overflow-hidden">
      <p className="text-[10px] font-bold text-[#8892b0] tracking-wider uppercase">{label}</p>
      <p className="text-2xl font-bold mt-1" style={{ color }}>{value}</p>
      {hint && <p className="text-[10px] text-[#8892b0] mt-1">{hint}</p>}
      <div className="absolute bottom-0 left-0 w-full h-1" style={{ background: color, opacity: 0.6 }} />
    </Card>
  );
}
