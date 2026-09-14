import type { ContentItem } from "./types";

/** YYYY-MM-DD en horario local (no UTC), para no desfasar un día. */
export function toISO(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function todayISO(): string {
  return toISO(new Date());
}

export function parseISO(iso: string): Date {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, (m || 1) - 1, d || 1);
}

/** Fecha efectiva de una publicación: usa `date` si existe; las publicaciones
 *  antiguas (de antes de agregar este campo) no tienen fecha propia, así que
 *  por ahora se muestran en el día de hoy hasta que alguien las edite y
 *  queden con una fecha explícita. */
export function dateOf(item: Pick<ContentItem, "date">): string {
  return item.date || todayISO();
}

export function isSameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

export function addDays(date: Date, n: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + n);
  return d;
}

export function addMonths(date: Date, n: number): Date {
  const d = new Date(date);
  d.setMonth(d.getMonth() + n);
  return d;
}

/** Domingo de la semana que contiene `date` (estilo Google Calendar). */
export function startOfWeek(date: Date): Date {
  const d = new Date(date);
  d.setDate(d.getDate() - d.getDay());
  d.setHours(0, 0, 0, 0);
  return d;
}

export function startOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

/** Grilla de 42 días (6 semanas x 7) para la vista de mes, incluyendo días
 *  del mes anterior/siguiente para completar semanas. */
export function getMonthGrid(date: Date): Date[] {
  const firstOfMonth = startOfMonth(date);
  const gridStart = startOfWeek(firstOfMonth);
  return Array.from({ length: 42 }, (_, i) => addDays(gridStart, i));
}

export const WEEKDAY_LABELS = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];

export function formatMonthLabel(date: Date): string {
  const label = date.toLocaleDateString("es-CO", { month: "long", year: "numeric" });
  return label.charAt(0).toUpperCase() + label.slice(1);
}

export function formatWeekRangeLabel(date: Date): string {
  const start = startOfWeek(date);
  const end = addDays(start, 6);
  const sameMonth = start.getMonth() === end.getMonth();
  const startLabel = start.toLocaleDateString("es-CO", { day: "numeric", month: sameMonth ? undefined : "short" });
  const endLabel = end.toLocaleDateString("es-CO", { day: "numeric", month: "short", year: "numeric" });
  return `${startLabel} – ${endLabel}`;
}

export function formatDayLabel(date: Date): string {
  const label = date.toLocaleDateString("es-CO", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
  return label.charAt(0).toUpperCase() + label.slice(1);
}
