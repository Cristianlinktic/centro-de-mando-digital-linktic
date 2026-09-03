import * as XLSX from "xlsx";
import type { ChannelKey, ParsedChannel, ParsedDay, ParsedPlan } from "./types";

const CHANNEL_BY_INDEX: ChannelKey[] = ["meta", "pilas", "youtube", "google_display"];

export class ExcelParseError extends Error {}

function findSheet(wb: XLSX.WorkBook, index: number, keyword: string): XLSX.WorkSheet {
  const byName = wb.SheetNames.find((n) =>
    n.toLowerCase().includes(keyword.toLowerCase()),
  );
  const sheetName = byName ?? wb.SheetNames[index];
  if (!sheetName || !wb.Sheets[sheetName]) {
    throw new ExcelParseError(
      `No se encontró la hoja "${keyword}" (posición ${index + 1}). ¿El archivo tiene el formato esperado?`,
    );
  }
  return wb.Sheets[sheetName];
}

function cellNum(ws: XLSX.WorkSheet, addr: string): number | null {
  const cell = ws[addr];
  if (!cell) return null;
  if (cell.t === "n") return typeof cell.v === "number" ? cell.v : null;
  if (cell.t === "f") {
    const n = Number(cell.v);
    return isFinite(n) ? n : null;
  }
  if (cell.t === "s") {
    const s = String(cell.v)
      .replace(/\./g, "")
      .replace(",", ".")
      .replace(/[^\d.eE+-]/g, "");
    const n = parseFloat(s);
    return isFinite(n) ? n : null;
  }
  return null;
}

function cellText(ws: XLSX.WorkSheet, addr: string): string | null {
  const cell = ws[addr];
  if (!cell) return null;
  const raw = cell.w ?? String(cell.v ?? "");
  const text = raw.replace(/\s*\n\s*/g, " ").trim();
  return text || null;
}

function cellDate(ws: XLSX.WorkSheet, addr: string): string | null {
  const cell = ws[addr];
  if (!cell) return null;

  let date: Date | null = null;
  if (cell.v instanceof Date) {
    date = cell.v;
  } else if ((cell.t === "n" || cell.t === "d") && typeof cell.v === "number") {
    date = new Date(Math.round((cell.v - 25569) * 86400 * 1000));
  }

  if (!date) return null;
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, "0");
  const d = String(date.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function addDays(iso: string, days: number): string {
  const [y, m, d] = iso.split("-").map(Number);
  const date = new Date(Date.UTC(y, m - 1, d + days));
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}-${String(date.getUTCDate()).padStart(2, "0")}`;
}

export function parsePautaWorkbook(buffer: ArrayBuffer): ParsedPlan {
  let wb: XLSX.WorkBook;
  try {
    wb = XLSX.read(buffer, { type: "array", cellDates: true });
  } catch {
    throw new ExcelParseError("No se pudo leer el archivo. ¿Es un .xlsx válido?");
  }

  if (wb.SheetNames.length < 3) {
    throw new ExcelParseError(
      "El archivo no tiene las hojas esperadas (Resumen, Distribución, Desglose Diario, Proyecciones).",
    );
  }

  const resumen = findSheet(wb, 0, "resumen");
  const distrib = findSheet(wb, 1, "distribuci");
  const diario = findSheet(wb, 2, "diario");
  const proyec = findSheet(wb, 3, "proyec");

  const totalBudget = cellNum(resumen, "E6");
  if (!totalBudget || totalBudget <= 0) {
    throw new ExcelParseError(
      "No se encontró un presupuesto total válido en la hoja Resumen (celda E6).",
    );
  }

  const durationFromCell = cellNum(resumen, "E7");

  const channels: ParsedChannel[] = CHANNEL_BY_INDEX.map((channel, i) => ({
    channel,
    participation_pct: cellNum(resumen, `E${8 + i}`) ?? 0,
    cpm: cellNum(resumen, `E${12 + i}`) ?? 0,
    ctr: cellNum(resumen, `E${16 + i}`) ?? 0,
    frequency: cellNum(proyec, `I${7 + i}`) ?? 1.4,
    objective: cellText(distrib, `C${15 + i}`),
    target_audience: cellText(distrib, `E${15 + i}`),
    main_kpi: cellText(distrib, `K${15 + i}`),
  }));

  const startDate = cellDate(diario, "C6");
  if (!startDate) {
    throw new ExcelParseError(
      "No se encontró la fecha de inicio en la hoja Desglose Diario (celda C6).",
    );
  }

  const days: ParsedDay[] = [];
  for (let row = 6; row <= 60; row++) {
    const dayNum = cellNum(diario, `B${row}`);
    const factor = cellNum(diario, `D${row}`);
    if (dayNum == null) break;
    days.push({
      day_number: Math.round(dayNum),
      date: addDays(startDate, days.length),
      weight_factor: factor ?? 1,
    });
  }

  if (days.length === 0) {
    throw new ExcelParseError("No se encontraron días en la hoja Desglose Diario.");
  }

  const nameRaw = cellText(resumen, "B2");
  const name =
    nameRaw && !/resumen ejecutivo/i.test(nameRaw)
      ? nameRaw
      : "Plan de inversión para pauta";

  return {
    name,
    total_budget: totalBudget,
    duration_days: durationFromCell ? Math.round(durationFromCell) : days.length,
    start_date: startDate,
    channels,
    days,
  };
}
