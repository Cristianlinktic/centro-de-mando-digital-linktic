/**
 * Defs SVG compartidos para darle a los gráficos de Recharts el acabado
 * "Future Forum": relleno en degradado (luz que cae hacia la base) y un
 * resplandor suave en trazos/barras/segmentos, en vez del flat fill por
 * defecto de Recharts. Un mismo lenguaje visual para área, barra, línea y
 * dona — así ninguna pantalla de Estrategia Publicitaria inventa el suyo.
 */

/** Convierte un hex "#0094ff" en un id de SVG válido y estable: "grad-0094ff". */
function idFor(prefix: string, color: string) {
  return `${prefix}-${color.replace("#", "").toLowerCase()}`;
}

export function gradientId(color: string) {
  return idFor("grad", color);
}

export function gradientFill(color: string) {
  return `url(#${gradientId(color)})`;
}

/** Resplandor sutil detrás de un trazo/relleno — la "luz" del dato. */
export function glowShadow(color: string, blur = 8) {
  return `drop-shadow(0 0 ${blur}px ${color}99)`;
}

/**
 * `<defs>` con un degradado vertical (arriba intenso, abajo transparente)
 * por cada color recibido. Se coloca como hijo directo de <AreaChart>,
 * <BarChart>, <LineChart> o <PieChart> — Recharts renderiza los hijos que
 * no reconoce tal cual, así que un <defs> normal funciona sin más.
 */
export function ChartGradients({ colors }: { colors: string[] }) {
  const unique = Array.from(new Set(colors));
  return (
    <defs>
      {unique.map((c) => (
        <linearGradient key={c} id={gradientId(c)} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={c} stopOpacity={0.65} />
          <stop offset="100%" stopColor={c} stopOpacity={0.04} />
        </linearGradient>
      ))}
    </defs>
  );
}
