/**
 * Datos de ejemplo para "Estrategia Mailing · Prueba" (Interno) — reproduce
 * el flujo de un dashboard de campañas de correo (mes → campaña → detalle
 * por destinatario) con cifras simuladas pero internamente consistentes:
 * cada agregado (entregados, apertura, CTR…) se calcula a partir de la
 * lista de destinatarios generada, nunca se inventa por separado. Sirve de
 * plantilla para cuando se conecte un proveedor real (SendGrid, Mailchimp…).
 */

export type DestinatarioRow = {
  correo: string;
  procesado: boolean;
  entregado: boolean;
  abrio: boolean;
  clic: boolean;
  diferido: boolean;
  reboto: boolean;
  descartado: boolean;
};

export type EventoEstado = "Procesado" | "Entregado" | "Abierto" | "Clic" | "Rebotado" | "Descartado" | "Diferido";

/** Bucket final del destinatario dueño del evento — el mismo que colorea la
 *  dona del detalle de campaña, para poder filtrar la tabla de eventos al
 *  hacer clic en una porción (todos los eventos de ese destinatario, no solo
 *  los que llevan ese nombre exacto). */
export type BucketDestinatario = "clic" | "abierto" | "entregado" | "no_entregado";

export type EventoRow = { fecha: string; correo: string; evento: EventoEstado; bucket: BucketDestinatario };

export type CampanaResumen = {
  id: string;
  mesId: string;
  fecha: string;
  envio: string;
  asunto: string;
  remitente: string;
  entregados: number;
  no_entregados: number;
  aperturas_unicas: number;
  clics_unicos: number;
  apertura: number;
  ctr: number;
};

export type CampanaDetalle = CampanaResumen & {
  template: string;
  base: number;
  procesados: number;
  rebotes: number;
  descartados: number;
  diferidos: number;
  ctor: number;
  enlaces: boolean;
  eventos: EventoRow[];
  destinatarios: DestinatarioRow[];
};

export type MesResumen = {
  id: string;
  label: string;
  campanas: number;
  entregados: number;
  apertura: number;
  ctr: number;
};

export type DiaApertura = { fecha: string; entregados: number; apertura: number };

export type MesDetalle = {
  id: string;
  label: string;
  rango: string;
  kpis: {
    entregados: number;
    procesados: number;
    apertura: number;
    ctr: number;
    ctor: number;
    noEntregados: number;
    noEntregadosPct: number;
  };
  porDia: DiaApertura[];
  campanas: CampanaResumen[];
};

function mulberry32(seed: number) {
  let a = seed;
  return function rng() {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const DOMINIOS: { d: string; w: number }[] = [
  { d: "linktic.com", w: 0.58 },
  { d: "gmail.com", w: 0.2 },
  { d: "hotmail.com", w: 0.12 },
  { d: "outlook.com", w: 0.06 },
  { d: "ripor.co", w: 0.04 },
];

function pickDominio(rng: () => number): string {
  const r = rng();
  let acc = 0;
  for (const { d, w } of DOMINIOS) {
    acc += w;
    if (r <= acc) return d;
  }
  return DOMINIOS[0].d;
}

const HEX = "0123456789abcdef";
function hexId(rng: () => number, len = 6): string {
  let s = "";
  for (let i = 0; i < len; i++) s += HEX[Math.floor(rng() * HEX.length)];
  return s;
}

const pad2 = (n: number) => String(n).padStart(2, "0");
function fmtFechaHora(d: Date): string {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())} ${pad2(d.getHours())}:${pad2(d.getMinutes())}:${pad2(d.getSeconds())}`;
}
const round1 = (n: number) => Math.round(n * 10) / 10;

type CampanaSeed = {
  id: string;
  mesId: string;
  fecha: string;
  hora: string;
  asunto: string;
  remitente: string;
  enlaces: boolean;
  destinatarios: number;
  tasaEntrega: number;
  tasaApertura: number;
  tasaClicSobreApertura: number;
};

function generarCampana(s: CampanaSeed, seed: number): CampanaDetalle {
  const rng = mulberry32(seed);
  const envioDate = new Date(`${s.fecha}T${s.hora}:00`);
  const template = `d-${hexId(rng, 32)}`;

  const destinatarios: DestinatarioRow[] = [];
  const eventos: EventoRow[] = [];
  let entregadosN = 0;
  let noEntregadosN = 0;
  let rebotesN = 0;
  let descartadosN = 0;
  let diferidosN = 0;
  let aperturasN = 0;
  let clicsN = 0;

  for (let i = 0; i < s.destinatarios; i++) {
    const correo = `u${hexId(rng)}@${pickDominio(rng)}`;
    const eventosRecipiente: { fecha: string; evento: EventoEstado }[] = [];
    const procesadoTs = new Date(envioDate.getTime() - Math.floor(rng() * 5000));
    eventosRecipiente.push({ fecha: fmtFechaHora(procesadoTs), evento: "Procesado" });

    const entregado = rng() < s.tasaEntrega;
    let reboto = false;
    let descartado = false;
    let diferido = false;
    let evtEntrega: EventoEstado;
    const entregaTs = new Date(envioDate.getTime() + Math.floor(rng() * 4000) + 500);

    if (entregado) {
      evtEntrega = "Entregado";
      entregadosN++;
    } else {
      const r = rng();
      if (r < 0.5) {
        reboto = true;
        evtEntrega = "Rebotado";
        rebotesN++;
      } else if (r < 0.8) {
        descartado = true;
        evtEntrega = "Descartado";
        descartadosN++;
      } else {
        diferido = true;
        evtEntrega = "Diferido";
        diferidosN++;
      }
      noEntregadosN++;
    }
    eventosRecipiente.push({ fecha: fmtFechaHora(entregaTs), evento: evtEntrega });

    let abrio = false;
    let clic = false;
    if (entregado) {
      abrio = rng() < s.tasaApertura;
      if (abrio) {
        aperturasN++;
        const aperturaTs = new Date(entregaTs.getTime() + Math.floor(rng() * 1000 * 60 * 60 * 30));
        eventosRecipiente.push({ fecha: fmtFechaHora(aperturaTs), evento: "Abierto" });
        if (s.enlaces) {
          clic = rng() < s.tasaClicSobreApertura;
          if (clic) {
            clicsN++;
            const clicTs = new Date(aperturaTs.getTime() + Math.floor(rng() * 1000 * 60 * 45));
            eventosRecipiente.push({ fecha: fmtFechaHora(clicTs), evento: "Clic" });
          }
        }
      }
    }

    const bucket: BucketDestinatario = clic ? "clic" : abrio ? "abierto" : entregado ? "entregado" : "no_entregado";
    for (const ev of eventosRecipiente) eventos.push({ ...ev, correo, bucket });

    destinatarios.push({ correo, procesado: true, entregado, abrio, clic, diferido, reboto, descartado });
  }

  eventos.sort((a, b) => a.fecha.localeCompare(b.fecha));

  const procesados = s.destinatarios;
  const filasDescartadas = Math.floor(rng() * 4);
  const base = procesados + filasDescartadas;
  const apertura = entregadosN ? round1((aperturasN / entregadosN) * 100) : 0;
  const ctr = entregadosN ? round1((clicsN / entregadosN) * 100) : 0;
  const ctor = aperturasN ? round1((clicsN / aperturasN) * 100) : 0;

  return {
    id: s.id,
    mesId: s.mesId,
    fecha: s.fecha,
    envio: `${s.fecha} ${s.hora}`,
    asunto: s.asunto,
    remitente: s.remitente,
    template,
    base,
    procesados,
    entregados: entregadosN,
    no_entregados: noEntregadosN,
    rebotes: rebotesN,
    descartados: descartadosN,
    diferidos: diferidosN,
    aperturas_unicas: aperturasN,
    clics_unicos: clicsN,
    apertura,
    ctr,
    ctor,
    enlaces: s.enlaces,
    eventos,
    destinatarios,
  };
}

const SEEDS: CampanaSeed[] = [
  { id: "2026-09-02-bienvenida-nuevo-coworking", mesId: "2026-09", fecha: "2026-09-02", hora: "08:00", asunto: "¡Conoce el nuevo espacio de coworking!", remitente: "digital@linktic.com", enlaces: true, destinatarios: 62, tasaEntrega: 0.96, tasaApertura: 0.74, tasaClicSobreApertura: 0.32 },
  { id: "2026-09-05-recordatorio-actualiza-datos", mesId: "2026-09", fecha: "2026-09-05", hora: "10:30", asunto: "Recordatorio: actualiza tus datos antes del 15 de septiembre", remitente: "digital@linktic.com", enlaces: true, destinatarios: 60, tasaEntrega: 0.95, tasaApertura: 0.68, tasaClicSobreApertura: 0.4 },
  { id: "2026-09-09-newsletter-cierre-trimestre", mesId: "2026-09", fecha: "2026-09-09", hora: "09:00", asunto: "Newsletter LinkTIC: así cerramos el trimestre", remitente: "digital@linktic.com", enlaces: true, destinatarios: 61, tasaEntrega: 0.97, tasaApertura: 0.7, tasaClicSobreApertura: 0.18 },
  { id: "2026-09-11-beneficios-equipo", mesId: "2026-09", fecha: "2026-09-11", hora: "08:00", asunto: "Beneficios exclusivos para el equipo LinkTIC", remitente: "digital@linktic.com", enlaces: true, destinatarios: 59, tasaEntrega: 0.94, tasaApertura: 0.77, tasaClicSobreApertura: 0.29 },
  { id: "2026-09-13-dias-bloqueados-ripor", mesId: "2026-09", fecha: "2026-09-13", hora: "10:00", asunto: "La solicitud de días bloqueados en RIPOR se renueva", remitente: "info@ripor.co", enlaces: true, destinatarios: 60, tasaEntrega: 0.94, tasaApertura: 0.55, tasaClicSobreApertura: 0.12 },
  { id: "2026-09-15-protege-tu-equipo", mesId: "2026-09", fecha: "2026-09-15", hora: "17:30", asunto: "Protocolo de seguridad: protege tu equipo personal", remitente: "digital@linktic.com", enlaces: false, destinatarios: 60, tasaEntrega: 0.96, tasaApertura: 0.73, tasaClicSobreApertura: 0 },
  { id: "2026-08-04-canal-interno", mesId: "2026-08", fecha: "2026-08-04", hora: "08:00", asunto: "Conoce el nuevo canal interno de comunicación", remitente: "digital@linktic.com", enlaces: true, destinatarios: 58, tasaEntrega: 0.95, tasaApertura: 0.65, tasaClicSobreApertura: 0.35 },
  { id: "2026-08-12-taller-comunicacion", mesId: "2026-08", fecha: "2026-08-12", hora: "11:00", asunto: "Invitación: taller de comunicación efectiva", remitente: "digital@linktic.com", enlaces: true, destinatarios: 60, tasaEntrega: 0.96, tasaApertura: 0.6, tasaClicSobreApertura: 0.22 },
  { id: "2026-08-20-politica-vacaciones", mesId: "2026-08", fecha: "2026-08-20", hora: "09:15", asunto: "Actualización de la política de vacaciones", remitente: "digital@linktic.com", enlaces: false, destinatarios: 57, tasaEntrega: 0.93, tasaApertura: 0.58, tasaClicSobreApertura: 0 },
  { id: "2026-08-27-team-show", mesId: "2026-08", fecha: "2026-08-27", hora: "15:00", asunto: "¡Nueva temporada de The Team Show para Linkers!", remitente: "digital@linktic.com", enlaces: true, destinatarios: 59, tasaEntrega: 0.97, tasaApertura: 0.69, tasaClicSobreApertura: 0.15 },
];

const CAMPANAS: CampanaDetalle[] = SEEDS.map((s, i) => generarCampana(s, 1000 + i));

const MESES_META: Record<string, { label: string; rango: string }> = {
  "2026-09": { label: "Septiembre 2026", rango: "2026-09-02 a 2026-09-15" },
  "2026-08": { label: "Agosto 2026", rango: "2026-08-04 a 2026-08-27" },
};

function campanasDeMes(mesId: string): CampanaDetalle[] {
  return CAMPANAS.filter((c) => c.mesId === mesId).sort((a, b) => a.fecha.localeCompare(b.fecha));
}

function resumenDe(c: CampanaDetalle): CampanaResumen {
  return {
    id: c.id,
    mesId: c.mesId,
    fecha: c.fecha,
    envio: c.envio,
    asunto: c.asunto,
    remitente: c.remitente,
    entregados: c.entregados,
    no_entregados: c.no_entregados,
    aperturas_unicas: c.aperturas_unicas,
    clics_unicos: c.clics_unicos,
    apertura: c.apertura,
    ctr: c.ctr,
  };
}

export function listMeses(): MesResumen[] {
  return Object.keys(MESES_META)
    .sort((a, b) => b.localeCompare(a))
    .map((id) => {
      const cs = campanasDeMes(id);
      const entregados = cs.reduce((a, c) => a + c.entregados, 0);
      const aperturas = cs.reduce((a, c) => a + c.aperturas_unicas, 0);
      const clics = cs.reduce((a, c) => a + c.clics_unicos, 0);
      return {
        id,
        label: MESES_META[id].label,
        campanas: cs.length,
        entregados,
        apertura: entregados ? round1((aperturas / entregados) * 100) : 0,
        ctr: entregados ? round1((clics / entregados) * 100) : 0,
      };
    });
}

export function getMes(id: string): MesDetalle | null {
  const meta = MESES_META[id];
  if (!meta) return null;
  const cs = campanasDeMes(id);
  if (!cs.length) return null;

  const entregados = cs.reduce((a, c) => a + c.entregados, 0);
  const procesados = cs.reduce((a, c) => a + c.procesados, 0);
  const aperturas = cs.reduce((a, c) => a + c.aperturas_unicas, 0);
  const clics = cs.reduce((a, c) => a + c.clics_unicos, 0);
  const noEntregados = cs.reduce((a, c) => a + c.no_entregados, 0);

  const porDiaMap = new Map<string, { entregados: number; aperturas: number }>();
  for (const c of cs) {
    const cur = porDiaMap.get(c.fecha) ?? { entregados: 0, aperturas: 0 };
    cur.entregados += c.entregados;
    cur.aperturas += c.aperturas_unicas;
    porDiaMap.set(c.fecha, cur);
  }
  const porDia: DiaApertura[] = Array.from(porDiaMap.entries())
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([fecha, v]) => ({ fecha, entregados: v.entregados, apertura: v.entregados ? round1((v.aperturas / v.entregados) * 100) : 0 }));

  return {
    id,
    label: meta.label,
    rango: meta.rango,
    kpis: {
      entregados,
      procesados,
      apertura: entregados ? round1((aperturas / entregados) * 100) : 0,
      ctr: entregados ? round1((clics / entregados) * 100) : 0,
      ctor: aperturas ? round1((clics / aperturas) * 100) : 0,
      noEntregados,
      noEntregadosPct: procesados ? round1((noEntregados / procesados) * 100) : 0,
    },
    porDia,
    campanas: cs.map(resumenDe),
  };
}

export function getCampana(mesId: string, campanaId: string): CampanaDetalle | null {
  return CAMPANAS.find((c) => c.mesId === mesId && c.id === campanaId) ?? null;
}
