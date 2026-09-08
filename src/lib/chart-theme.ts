import type { CSSProperties } from "react";

/**
 * Tema de gráficos del Centro de Mando — alineado al KV del LinkTIC
 * Future Forum. Un único sitio donde viven los colores de ejes, rejilla,
 * tooltips y series, para que ninguna pantalla invente los suyos.
 */

/** Escala azul oficial de LinkTIC (`--color-blue-linktic-*` de su Tailwind). */
export const AZUL_LINKTIC = {
  c10: "#def0ff",
  c30: "#b7e6fc",
  c40: "#2c80ff",
  c50: "#01d9ff",
  c60: "#274ff5",
  c70: "#1f3fc4",
  c90: "#172f93",
  c100: "#0094ff",
  c200: "#015999",
  c300: "#102486",
  c400: "#0e1c56",
} as const;

/** Tintas y líneas del KV. */
export const KV = {
  ink: "#0a0a1c",
  inkDeep: "#070a16",
  panel: "#0d1120",
  panelHi: "#10142a",
  row: "#131a30",
  line: "#1e2240",
  lineSoft: "#2a2a4a",
  edge: "#2b62ff",
  text: "#ffffff",
  muted: "#aab3cf",
  mutedLo: "#8892b0",
} as const;

/** Rejilla y ejes: apenas visibles, para que el dato mande. */
export const GRID_STROKE = KV.line;
export const AXIS_STROKE = KV.mutedLo;
export const AXIS_TICK: CSSProperties = { fill: KV.muted, fontSize: 11 };

/**
 * Tooltip con la receta de cristal del KV — la misma de las píldoras del
 * contador del Future Forum, para que coincida con paneles y con el globo.
 */
export const TOOLTIP_STYLE: CSSProperties = {
  background:
    "linear-gradient(145deg, rgba(255,255,255,0.10) 0%, rgba(255,255,255,0.03) 40%, rgba(255,255,255,0.01) 100%), linear-gradient(180deg, rgba(13,17,32,0.96), rgba(10,10,28,0.94))",
  border: `1px solid ${KV.lineSoft}`,
  borderRadius: 16,
  color: KV.text,
  boxShadow:
    "inset 0 18px 33.77px 10.1px rgba(20,117,212,0.10), inset 0 1px 1px rgba(255,255,255,0.22), 0 10px 40px rgba(0,0,0,0.55)",
  backdropFilter: "blur(12px) saturate(160%)",
  WebkitBackdropFilter: "blur(12px) saturate(160%)",
  padding: "10px 12px",
};

export const TOOLTIP_LABEL_STYLE: CSSProperties = {
  color: KV.muted,
  fontSize: 11,
  fontWeight: 700,
  letterSpacing: "0.08em",
  textTransform: "uppercase",
  marginBottom: 4,
};

export const TOOLTIP_ITEM_STYLE: CSSProperties = { color: KV.text, fontSize: 12 };

/** Cursor del tooltip: un velo azul, no el gris por defecto de recharts. */
export const TOOLTIP_CURSOR = { fill: "rgba(0,148,255,0.08)" };
export const TOOLTIP_CURSOR_LINE = { stroke: AZUL_LINKTIC.c100, strokeWidth: 1, strokeOpacity: 0.45 };

/**
 * Series categóricas. Arranca en la rampa del KV y se abre a dos matices
 * ajenos: con más de tres categorías un solo tono deja de distinguirse.
 */
export const SERIES = [
  AZUL_LINKTIC.c100, // #0094FF
  AZUL_LINKTIC.c50, // #01D9FF
  "#75ddff",
  AZUL_LINKTIC.c60, // #274FF5
  "#6d5cf5",
  AZUL_LINKTIC.c300, // #102486
] as const;

/** Rampa secuencial (magnitud): de azul profundo a cian. */
export const RAMPA = [
  AZUL_LINKTIC.c300,
  AZUL_LINKTIC.c90,
  AZUL_LINKTIC.c60,
  AZUL_LINKTIC.c40,
  AZUL_LINKTIC.c100,
  AZUL_LINKTIC.c50,
] as const;

/** Semántica de dato — deliberadamente fuera del KV: significan, no decoran. */
export const SEMANTICO = {
  positivo: "#2eb88a",
  negativo: "#df3a3a",
  neutro: "#f3b116",
} as const;
