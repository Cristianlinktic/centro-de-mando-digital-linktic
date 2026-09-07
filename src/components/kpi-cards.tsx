"use client";

import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { CountUp, Sparkline } from "@/components/count-up";

const kpiColors = [
  "hsl(213 85% 55%)",  // blue
  "hsl(42 90% 52%)",   // gold
  "hsl(160 60% 45%)",  // green
  "hsl(280 65% 60%)",  // purple
];

interface KpiItem {
  label: string;
  value: string;
  delta?: string | null;
  trend?: "up" | "down" | "neutral";
  mes?: string;
  spark?: number[];
}

export function KpiCards({ items }: { items: KpiItem[] }) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
      {items.map((kpi, i) => {
        const barColor = kpiColors[i % kpiColors.length];
        return (
          <div key={kpi.label} className="kpi-card group relative rounded-2xl overflow-hidden">
            <div className="p-4 pb-3 relative z-10">
              <p className="text-[10px] text-muted-foreground uppercase tracking-widest truncate">
                {kpi.label}
              </p>
              <div className="flex items-baseline gap-2 mt-1 min-w-0">
                <p className="font-heading text-xl sm:text-2xl font-semibold tabular-nums truncate min-w-0">
                  <CountUp value={kpi.value} />
                </p>
                {kpi.delta && (
                  <span
                    className={`text-xs flex items-center gap-0.5 shrink-0 ${
                      kpi.trend === "up"
                        ? "trend-up"
                        : kpi.trend === "down"
                          ? "trend-down"
                          : "text-muted-foreground"
                    }`}
                  >
                    {kpi.trend === "up" && <TrendingUp className="h-3 w-3" />}
                    {kpi.trend === "down" && <TrendingDown className="h-3 w-3" />}
                    {kpi.trend === "neutral" && <Minus className="h-3 w-3" />}
                    {kpi.delta}
                  </span>
                )}
              </div>
              {kpi.mes && (
                <p className="text-[10px] text-muted-foreground mt-1">{kpi.mes}</p>
              )}
            </div>
            {kpi.spark && kpi.spark.length > 1 && (
              <div className="absolute bottom-1 right-2 z-0 opacity-80 pointer-events-none">
                <Sparkline data={kpi.spark} color={barColor} />
              </div>
            )}
            <div
              className="h-1 w-full opacity-90 transition-opacity duration-300 group-hover:opacity-100"
              style={{ background: `linear-gradient(90deg, ${barColor}, transparent 140%)`, boxShadow: `0 0 10px ${barColor}` }}
            />
          </div>
        );
      })}
    </div>
  );
}
