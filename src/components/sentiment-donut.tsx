"use client";

import { useEffect, useState } from "react";

interface SentimentDonutProps {
  positivo: number;
  neutral: number;
  negativo: number;
  colors: { positivo: string; neutral: string; negativo: string };
  size?: number;
}

/**
 * Donut de sentimiento animado en SVG puro. Los segmentos crecen desde 0 al
 * montar (animación de "dibujado") y el centro resalta el sentimiento dominante.
 */
export function SentimentDonut({
  positivo,
  neutral,
  negativo,
  colors,
  size = 150,
}: SentimentDonutProps) {
  const total = positivo + neutral + negativo || 1;
  const segments = [
    { key: "Positivo", value: positivo, color: colors.positivo },
    { key: "Neutral", value: neutral, color: colors.neutral },
    { key: "Negativo", value: negativo, color: colors.negativo },
  ];
  const dominant = segments.reduce((a, b) => (b.value > a.value ? b : a));

  const stroke = 12;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;

  // Animación de entrada: de 0 a su longitud real.
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    const id = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(id);
  }, []);

  let offsetAcc = 0;

  return (
    <div className="flex flex-wrap items-center justify-center gap-4">
      <div className="relative shrink-0" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="#131a30"
            strokeWidth={stroke}
          />
          {segments.map((s) => {
            const frac = s.value / total;
            const len = mounted ? frac * circumference : 0;
            const dashoffset = -offsetAcc;
            offsetAcc += frac * circumference;
            return (
              <circle
                key={s.key}
                cx={size / 2}
                cy={size / 2}
                r={radius}
                fill="none"
                stroke={s.color}
                strokeWidth={stroke}
                strokeLinecap="round"
                strokeDasharray={`${len} ${circumference - len}`}
                strokeDashoffset={dashoffset}
                style={{
                  transition: "stroke-dasharray 1s cubic-bezier(0.22,1,0.36,1)",
                  filter: `drop-shadow(0 0 5px ${s.color})`,
                }}
              />
            );
          })}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-xl font-bold tabular-nums whitespace-nowrap leading-none" style={{ color: dominant.color }}>
            {((dominant.value / total) * 100).toFixed(1)}%
          </span>
          <span className="text-[10px] uppercase tracking-wider text-[#aab3cf] mt-0.5">{dominant.key}</span>
        </div>
      </div>

      <div className="space-y-2">
        {segments.map((s) => (
          <div key={s.key} className="flex items-center gap-2 text-xs">
            <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: s.color, boxShadow: `0 0 6px ${s.color}` }} />
            <span className="text-[#c0c8de] w-14">{s.key}</span>
            <span className="font-mono font-semibold tabular-nums" style={{ color: s.color }}>
              {((s.value / total) * 100).toFixed(1)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
