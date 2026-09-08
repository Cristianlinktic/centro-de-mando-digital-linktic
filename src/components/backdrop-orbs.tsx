import type { CSSProperties } from "react";

/**
 * Elipsis azules difuminadas — el recurso decorativo del LinkTIC Future Forum.
 *
 * La receta base es la del sitio:
 *
 *   <div class="absolute w-69 h-69 bg-blue-linktic-100/80 rounded-full
 *               blur-3xl -top-15 -right-30 opacity-40 z-0"></div>
 *
 * que con `--spacing: 4px` es un círculo de 276px de #0094FF al 80%,
 * desenfocado 64px y al 40% de opacidad. Ese es el orbe `md` de aquí.
 *
 * Los colores salen todos de la escala azul oficial (`--blue-linktic-*`),
 * así que por muchas elipsis que se apilen nunca aparece un azul que no
 * sea de LinkTIC.
 */

// Escala azul oficial de LinkTIC.
const AZUL = {
  cyan: "#01d9ff", // blue-linktic-50
  brand: "#0094ff", // blue-linktic-100
  vivid: "#2c80ff", // blue-linktic-40
  electric: "#274ff5", // blue-linktic-60
  deep: "#102486", // blue-linktic-300
} as const;

/** Misma escala, en verde — para la pestaña "Externo" (ver PALETAS y el
 *  prop `palette` de BackdropOrbs). Mismos roles de tono/brillo que AZUL,
 *  así que cualquier composición de orbes se ve igual de "leída" en ambas. */
const VERDE = {
  cyan: "#2dd4bf",
  brand: "#10b981",
  vivid: "#34d399",
  electric: "#0d9488",
  deep: "#065f46",
} as const;

const PALETAS = { azul: AZUL, verde: VERDE } as const;

type Tono = keyof typeof AZUL;
type Deriva = "a" | "b" | "c" | "d";

export interface Orb {
  /** Diámetro en px antes del desenfoque. El del sitio es 276. */
  size: number;
  tono: Tono;
  /** Opacidad final. En el sitio es 0.4. */
  alpha?: number;
  /** Radio del desenfoque en px. `blur-3xl` del sitio es 64. */
  blur?: number;
  /** Posición: acepta valores negativos para que asome fuera del borde. */
  top?: string;
  bottom?: string;
  left?: string;
  right?: string;
  deriva?: Deriva | null;
  /** Desfase para que dos orbes con la misma deriva no vayan sincronizados. */
  delay?: string;
}

/**
 * Composición del shell. Tamaños deliberadamente dispares —tres grandes que
 * tiñen el fondo y tres chicos que dan el detalle— para que se lea como
 * profundidad y no como tres manchas repetidas.
 */
export const ORBES_SHELL: Orb[] = [
  // Los dos que enmarcan la parte superior, como en el hero del Forum.
  { size: 560, tono: "brand", alpha: 0.34, blur: 110, top: "-14%", left: "-8%", deriva: "a" },
  { size: 620, tono: "electric", alpha: 0.3, blur: 120, top: "-18%", right: "-12%", deriva: "b" },
  // El profundo del fondo: da cuerpo sin subir el brillo.
  { size: 720, tono: "deep", alpha: 0.4, blur: 140, bottom: "-26%", left: "22%", deriva: "c", delay: "-8s" },
  // Los chicos, en la medida exacta del sitio (276px / blur 64 / alpha .4).
  { size: 276, tono: "cyan", alpha: 0.22, blur: 64, top: "18%", right: "26%", deriva: "d" },
  { size: 276, tono: "vivid", alpha: 0.26, blur: 64, bottom: "12%", right: "-60px", deriva: "a", delay: "-12s" },
  { size: 200, tono: "cyan", alpha: 0.2, blur: 56, top: "52%", left: "-40px", deriva: "b", delay: "-6s" },
];

/** Composición corta para paneles y tarjetas destacadas. */
export const ORBES_PANEL: Orb[] = [
  { size: 276, tono: "brand", alpha: 0.4, blur: 64, top: "-60px", right: "-120px", deriva: "d" },
  { size: 220, tono: "electric", alpha: 0.28, blur: 64, bottom: "-70px", left: "-80px", deriva: "b", delay: "-9s" },
];

interface BackdropOrbsProps {
  orbs?: Orb[];
  /** `fixed` para el shell (no se mueve al hacer scroll); `absolute` dentro de un panel. */
  fixed?: boolean;
  /** Rejilla de perspectiva bajo las elipsis. */
  grid?: boolean;
  className?: string;
  /** "azul" (Interno, por defecto) o "verde" (Externo) — para que cada
   *  pestaña de alto nivel se distinga también en el fondo del shell. */
  palette?: keyof typeof PALETAS;
}

export function BackdropOrbs({
  orbs = ORBES_SHELL,
  fixed = false,
  grid = false,
  className = "",
  palette = "azul",
}: BackdropOrbsProps) {
  const COLORS = PALETAS[palette];
  return (
    <div
      aria-hidden="true"
      className={`orb-field ${fixed ? "orb-field-fixed" : ""} ${className}`.trim()}
    >
      {grid && <div className="grid-floor" />}
      {orbs.map((o, i) => (
        <span
          key={i}
          className={`orb ${o.deriva ? `orb-drift-${o.deriva}` : ""}`.trim()}
          style={
            {
              "--orb-size": `${o.size}px`,
              "--orb-color": COLORS[o.tono],
              "--orb-alpha": o.alpha ?? 0.4,
              "--orb-blur": `${o.blur ?? 64}px`,
              top: o.top,
              bottom: o.bottom,
              left: o.left,
              right: o.right,
              animationDelay: o.delay,
            } as CSSProperties
          }
        />
      ))}
    </div>
  );
}
