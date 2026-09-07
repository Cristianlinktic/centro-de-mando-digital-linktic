"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { fetchCampaignData } from "@/lib/campana/client-data";
import { computeDaily } from "@/lib/campana/calc";
import { CHANNELS } from "@/lib/campana/constants";
import { formatCOP, formatDate, formatDateShort, formatDecimal, formatNumber } from "@/lib/campana/format";
import type { CampaignData } from "@/lib/campana/types";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from "recharts";
import { EmptyCampaign, LoadingCampaign } from "../_shared";

const CHANNEL_KEYS = ["meta", "pilas", "youtube", "google_display"] as const;

export default function DiarioPage() {
  const [data, setData] = useState<CampaignData | null | undefined>(undefined);

  useEffect(() => {
    fetchCampaignData().then(setData).catch(() => setData(null));
  }, []);

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
      <Card className="bg-[#0b101d] border border-white/5 p-6 rounded-2xl">
        <h3 className="font-bold text-sm text-slate-200 mb-1 uppercase tracking-widest">Curva de inversión diaria</h3>
        <p className="text-xs text-slate-500 mb-4">Día pico: {formatDate(peak?.date ?? "")} con {formatCOP(peak?.totalInvestment ?? 0)}</p>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={area} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1e293b" />
              <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fill: "#64748b", fontSize: 10 }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fill: "#64748b", fontSize: 10 }} />
              <Tooltip
                formatter={(v) => formatCOP(Number(v))}
                contentStyle={{ backgroundColor: "#0b101d", border: "1px solid #1e293b", borderRadius: 12 }}
              />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              {CHANNEL_KEYS.map((k) => (
                <Area key={k} type="monotone" dataKey={k} name={CHANNELS[k].label} stackId="1" stroke={CHANNELS[k].color} fill={CHANNELS[k].color} fillOpacity={0.25} />
              ))}
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <Card className="bg-[#0b101d] border border-white/5 rounded-2xl overflow-hidden">
        <div className="p-6 pb-3">
          <h3 className="font-bold text-sm text-slate-200 uppercase tracking-widest">Detalle por día</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[920px] text-sm">
            <thead>
              <tr className="border-b border-white/5 text-left text-[10px] uppercase tracking-wider text-slate-500">
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
                <tr key={d.dayNumber} className="border-b border-white/5 hover:bg-white/3">
                  <td className="px-4 py-2 font-bold text-slate-200">{d.dayNumber}</td>
                  <td className="px-4 py-2 text-slate-400">{formatDate(d.date)}</td>
                  <td className="px-4 py-2 text-right tabular-nums text-slate-400">{formatDecimal(d.weightFactor)}</td>
                  <td className="px-4 py-2 text-right tabular-nums font-bold text-slate-200">{formatCOP(d.totalInvestment)}</td>
                  {CHANNEL_KEYS.map((k) => (
                    <td key={k} className="px-4 py-2 text-right tabular-nums text-slate-400">
                      {formatCOP(d.byChannel[k]?.investment ?? 0)}
                    </td>
                  ))}
                  <td className="px-4 py-2 text-right tabular-nums text-slate-400">{formatNumber(d.totalImpressions)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-white/10 font-bold text-slate-100">
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
        <div className="border-t border-white/5 px-6 py-3 text-[11px] text-slate-500">
          * Inversión diaria = presupuesto total × factor ÷ suma de factores.
        </div>
      </Card>
    </div>
  );
}
