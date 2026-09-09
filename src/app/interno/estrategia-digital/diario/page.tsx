"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { fetchCampaignData } from "@/lib/campana/client-data";
import { computeDaily } from "@/lib/campana/calc";
import { CHANNELS } from "@/lib/campana/constants";
import { formatCOP, formatDate, formatDateShort, formatDecimal, formatNumber } from "@/lib/campana/format";
import type { CampaignData } from "@/lib/campana/types";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from "recharts";
import { EmptyCampaign, LoadingCampaign, useCategoria } from "../_shared";
import { TOOLTIP_STYLE, TOOLTIP_LABEL_STYLE, TOOLTIP_ITEM_STYLE, TOOLTIP_CURSOR_LINE } from "@/lib/chart-theme";
import { ChartGradients, gradientFill, glowShadow } from "@/lib/chart-defs";

const CHANNEL_KEYS = ["meta", "pilas", "youtube", "google_display"] as const;

export default function DiarioPage() {
  const tipo = useCategoria();
  const [data, setData] = useState<CampaignData | null | undefined>(undefined);

  useEffect(() => {
    setData(undefined);
    fetchCampaignData(tipo).then(setData).catch(() => setData(null));
  }, [tipo]);

  if (data === undefined) return <LoadingCampaign />;
  if (data === null) return <EmptyCampaign />;

  const daily = computeDaily(data);
  const area = daily.map((d) => ({
    label: formatDateShort(d.date),
    meta: d.byChannel.meta?.investment ?? 0,
    pilas: d.byChannel.pilas?.investment ?? 0,
    youtube: d.byChannel.youtube?.investment ?? 0,
    google_display: d.byChannel.google_display?.investment ?? 0,
  }));

  const totalInvestment = daily.reduce((a, d) => a + d.totalInvestment, 0);
  const totalFactor = daily.reduce((a, d) => a + d.weightFactor, 0);
  const peak = daily.reduce((max, d) => (d.totalInvestment > max.totalInvestment ? d : max), daily[0]);

  return (
    <div className="space-y-6 pb-12">
      <Card className="panel border border-[#1e2240] p-6 rounded-2xl">
        <h3 className="font-bold text-sm text-[#e4e9f5] mb-1 uppercase tracking-widest">Curva de inversión diaria</h3>
        <p className="text-xs text-[#8892b0] mb-4">Día pico: {formatDate(peak?.date ?? "")} con {formatCOP(peak?.totalInvestment ?? 0)}</p>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={area} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <ChartGradients colors={CHANNEL_KEYS.map((k) => CHANNELS[k].color)} />
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1e2240" />
              <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fill: "#aab3cf", fontSize: 10 }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fill: "#aab3cf", fontSize: 10 }} />
              <Tooltip
                formatter={(v) => formatCOP(Number(v))}
                contentStyle={TOOLTIP_STYLE} labelStyle={TOOLTIP_LABEL_STYLE} itemStyle={TOOLTIP_ITEM_STYLE}
                cursor={TOOLTIP_CURSOR_LINE}
              />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              {CHANNEL_KEYS.map((k) => (
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

      <Card className="panel border border-[#1e2240] rounded-2xl overflow-hidden">
        <div className="p-4 pb-3 sm:p-6 sm:pb-3">
          <h3 className="font-bold text-sm text-[#e4e9f5] uppercase tracking-widest">Detalle por día</h3>
        </div>
        <p className="px-4 pb-2 text-[10px] text-[#8892b0] sm:hidden">Desliza para ver más →</p>
        <div className="relative">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[920px] text-sm">
            <thead>
              <tr className="border-b border-[#1e2240] text-left text-[10px] uppercase tracking-wider text-[#8892b0]">
                <th className="px-4 py-2 font-bold">Día</th>
                <th className="px-4 py-2 font-bold">Fecha</th>
                <th className="px-4 py-2 text-right font-bold">Factor</th>
                <th className="px-4 py-2 text-right font-bold">Total / día</th>
                {CHANNEL_KEYS.map((k) => (
                  <th key={k} className="px-4 py-2 text-right font-bold">{CHANNELS[k].label}</th>
                ))}
                <th className="px-4 py-2 text-right font-bold">Impresiones</th>
              </tr>
            </thead>
            <tbody>
              {daily.map((d) => (
                <tr key={d.dayNumber} className="border-b border-[#1e2240] hover:bg-white/3">
                  <td className="px-4 py-2 font-bold text-[#e4e9f5]">{d.dayNumber}</td>
                  <td className="px-4 py-2 text-[#aab3cf]">{formatDate(d.date)}</td>
                  <td className="px-4 py-2 text-right tabular-nums text-[#aab3cf]">{formatDecimal(d.weightFactor)}</td>
                  <td className="px-4 py-2 text-right tabular-nums font-bold text-[#e4e9f5]">{formatCOP(d.totalInvestment)}</td>
                  {CHANNEL_KEYS.map((k) => (
                    <td key={k} className="px-4 py-2 text-right tabular-nums text-[#aab3cf]">
                      {formatCOP(d.byChannel[k]?.investment ?? 0)}
                    </td>
                  ))}
                  <td className="px-4 py-2 text-right tabular-nums text-[#aab3cf]">{formatNumber(d.totalImpressions)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-[#2a2a4a] font-bold text-[#ffffff]">
                <td className="px-4 py-2" colSpan={2}>Total · {daily.length} días</td>
                <td className="px-4 py-2 text-right tabular-nums">{formatDecimal(totalFactor)}</td>
                <td className="px-4 py-2 text-right tabular-nums">{formatCOP(totalInvestment)}</td>
                {CHANNEL_KEYS.map((k) => (
                  <td key={k} className="px-4 py-2 text-right tabular-nums">
                    {formatCOP(daily.reduce((a, d) => a + (d.byChannel[k]?.investment ?? 0), 0))}
                  </td>
                ))}
                <td className="px-4 py-2 text-right tabular-nums">
                  {formatNumber(daily.reduce((a, d) => a + d.totalImpressions, 0))}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
        <div className="scroll-fade-x-edge sm:hidden" aria-hidden="true" />
        </div>
        <div className="border-t border-[#1e2240] px-6 py-3 text-[11px] text-[#8892b0]">
          * Inversión diaria = presupuesto total × factor ÷ suma de factores.
        </div>
      </Card>
    </div>
  );
}
