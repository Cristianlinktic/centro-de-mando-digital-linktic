const COP = new Intl.NumberFormat("es-CO", {
  style: "currency",
  currency: "COP",
  maximumFractionDigits: 0,
});

const COP_COMPACT = new Intl.NumberFormat("es-CO", {
  style: "currency",
  currency: "COP",
  notation: "compact",
  maximumFractionDigits: 1,
});

const NUM = new Intl.NumberFormat("es-CO", { maximumFractionDigits: 0 });
const NUM2 = new Intl.NumberFormat("es-CO", { maximumFractionDigits: 2 });

export function formatCOP(value: number): string {
  return COP.format(Math.round(value || 0));
}

export function formatCOPCompact(value: number): string {
  return COP_COMPACT.format(value || 0);
}

export function formatNumber(value: number): string {
  return NUM.format(Math.round(value || 0));
}

export function formatDecimal(value: number): string {
  return NUM2.format(value || 0);
}

export function formatPercent(fraction: number, decimals = 2): string {
  return `${((fraction || 0) * 100).toLocaleString("es-CO", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })} %`;
}

export function formatDate(iso: string): string {
  if (!iso) return "";
  const [y, m, d] = iso.split("-").map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  return date.toLocaleDateString("es-CO", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
}

export function formatDateShort(iso: string): string {
  if (!iso) return "";
  const [y, m, d] = iso.split("-").map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  return date.toLocaleDateString("es-CO", {
    day: "numeric",
    month: "short",
    timeZone: "UTC",
  });
}
