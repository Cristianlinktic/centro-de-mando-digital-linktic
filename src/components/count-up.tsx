"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Anima un valor numérico desde 0 (o desde el valor previo) hasta `value`.
 * Si el texto no es numérico (ej: "Colombia"), lo muestra tal cual.
 * Conserva sufijos como "K", "M" o "%" detectados en el string original.
 */
export function CountUp({
  value,
  duration = 1100,
  className,
}: {
  value: string | number;
  duration?: number;
  className?: string;
}) {
  const raw = value.toString();
  // Extrae el número (admite separadores de miles y decimales) y el sufijo.
  const match = raw.match(/^([^\d-]*)(-?[\d.,]+)\s*([%KMkm]*)(.*)$/);
  const target = match ? parseFloat(match[2].replace(/\./g, "").replace(",", ".")) : NaN;

  const [display, setDisplay] = useState<number>(0);
  const fromRef = useRef(0);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    if (isNaN(target)) return;
    const from = fromRef.current;
    const start = performance.now();
    const ease = (t: number) => 1 - Math.pow(1 - t, 3); // easeOutCubic

    const tick = (now: number) => {
      const p = Math.min(1, (now - start) / duration);
      const current = from + (target - from) * ease(p);
      setDisplay(current);
      if (p < 1) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        fromRef.current = target;
      }
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [target, duration]);

  if (isNaN(target)) return <span className={className}>{raw}</span>;

  const prefix = match?.[1] ?? "";
  const suffix = match?.[3] ?? "";
  const tail = match?.[4] ?? "";
  const hasDecimal = /[.,]\d/.test(match?.[2] ?? "") || suffix === "K" || suffix === "M";
  const formatted = hasDecimal
    ? display.toLocaleString("es-CO", { maximumFractionDigits: 1, minimumFractionDigits: suffix ? 1 : 0 })
    : Math.round(display).toLocaleString("es-CO");

  return (
    <span className={className}>
      {prefix}
      {formatted}
      {suffix}
      {tail}
    </span>
  );
}

/**
 * Mini gráfico de tendencia (sparkline) en SVG puro, sin dependencias.
 * Recibe una serie de números y dibuja una línea con área degradada.
 */
export function Sparkline({
  data,
  color = "#0094ff",
  width = 96,
  height = 28,
  strokeWidth = 1.6,
}: {
  data: number[];
  color?: string;
  width?: number;
  height?: number;
  strokeWidth?: number;
}) {
  if (!data || data.length < 2) return null;

  const min = Math.min(...data);
  const max = Math.max(...data);
  const span = max - min || 1;
  const stepX = width / (data.length - 1);
  const pad = strokeWidth;

  const points = data.map((d, i) => {
    const x = i * stepX;
    const y = pad + (1 - (d - min) / span) * (height - pad * 2);
    return [x, y] as const;
  });

  const linePath = points.map(([x, y], i) => `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`).join(" ");
  const areaPath = `${linePath} L${width},${height} L0,${height} Z`;
  const gradId = `spark-${color.replace(/[^a-z0-9]/gi, "")}`;

  return (
    <svg width={width} height={height} className="overflow-visible">
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity={0.35} />
          <stop offset="100%" stopColor={color} stopOpacity={0} />
        </linearGradient>
      </defs>
      <path d={areaPath} fill={`url(#${gradId})`} />
      <path d={linePath} fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={points[points.length - 1][0]} cy={points[points.length - 1][1]} r={2.2} fill={color} />
    </svg>
  );
}
