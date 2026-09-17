/**
 * Datos reales de "Estrategia Mailing" (Interno), leídos de Supabase.
 *
 * Reemplaza al generador pseudoaleatorio que alimentaba esta pantalla hasta
 * septiembre de 2026 — sigue disponible en `data.sample.ts` para levantar la
 * interfaz sin base de datos. Los tipos y las tres funciones conservan sus
 * nombres y su forma; lo único que cambió es que ahora son asíncronas, porque
 * consultan.
 *
 * DE DÓNDE SALEN LOS DATOS
 * Las tablas `centro_mando.mailing_*` (migración 08) las escribe un script en
 * Python —`dashboard.py`, el mismo que genera el tablero estático de correos—
 * autenticado como un usuario propio con rol admin. Esta aplicación NUNCA
 * escribe en ellas: aquí solo se leen. Las cifras vienen ya calculadas, no se
 * recalculan, para que los dos tableros muestren exactamente el mismo número.
 *
 * PRIVACIDAD
 * La columna `correo` guarda un seudónimo estable, nunca la dirección real:
 * u<hash>@dominio. Se puede seguir a la misma persona entre campañas, pero no
 * se puede volver a su dirección. El dominio sí es real.
 *
 * Server-only: usa el cliente de Supabase que lee la sesión de las cookies, de
 * modo que las lecturas pasan por RLS con el usuario que está mirando. Las
 * tablas no conceden lectura a `anon`.
 */
import "server-only";
import { getAuthenticatedSupabaseClient } from "@/lib/supabase-server";

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
  /** true = llevaba enlaces · false = no llevaba · null = NO SE SABE.
   *  El tercer caso es el mayoritario y no es lo mismo que `false`: con cero
   *  clics el export no permite distinguir "no tenía botón" de "tenía y nadie
   *  lo pulsó". Una campaña con `null` no debe presentarse como un 0% de CTR
   *  que suena a fracaso. */
  enlaces: boolean | null;
  /** false = envío masivo del que solo se guardó el agregado. Las cifras de
   *  arriba siguen siendo exactas; lo que no existe es el detalle individual,
   *  así que las tablas de Eventos y Destinatarios van vacías y hay que
   *  decírselo al usuario en vez de mostrarlas en blanco. */
  detalleGuardado: boolean;
  /** Reparto de la dona, tal como lo calculó el script. Viene guardado y no se
   *  deriva de `destinatarios` por dos razones: para un envío masivo no hay
   *  destinatarios de los que derivarlo, y porque la resta
   *  `aperturas - clics` da mal — hay gente que hace clic sin que se registre
   *  su apertura (imágenes bloqueadas, enlace pulsado). */
  buckets: Record<BucketDestinatario, number>;
  /** Captura del correo, o null si esa campaña no tenía una guardada. Es una
   *  URL absoluta al tablero estático, donde las capturas ya viven publicadas:
   *  no se copian a ningún otro sitio. Se guarda en la fila y no se compone
   *  aquí, para que cambiar de host no obligue a desplegar la web. */
  miniaturaUrl: string | null;
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

// PostgREST corta las respuestas a 1.000 filas y NO avisa: una campaña de 1.132
// destinatarios devuelve 1.000 sin error. Por eso todo lo que pueda pasar de
// ahí se pide por páginas.
const PAGINA = 1000;

const num = (v: unknown): number => (v === null || v === undefined ? 0 : Number(v));
const round1 = (n: number) => Math.round(n * 10) / 10;

/** "2026-09-01T08:40:01" -> "2026-09-01 08:40:01" (lo que espera la tabla). */
function aTexto(ts: string | null): string {
  if (!ts) return "";
  return ts.replace("T", " ").slice(0, 19);
}

type FilaCampana = Record<string, unknown>;

function aResumen(f: FilaCampana): CampanaResumen {
  return {
    id: String(f.id),
    mesId: String(f.mes_id ?? ""),
    fecha: String(f.fecha ?? ""),
    envio: String(f.envio ?? ""),
    asunto: String(f.asunto ?? ""),
    remitente: String(f.remitente ?? ""),
    entregados: num(f.entregados),
    no_entregados: num(f.no_entregados),
    aperturas_unicas: num(f.aperturas_unicas),
    clics_unicos: num(f.clics_unicos),
    apertura: num(f.apertura),
    ctr: num(f.ctr),
  };
}

/** Trae TODAS las filas de una tabla de detalle, en páginas de 1.000. */
async function porPaginas(
  tabla: "mailing_destinatarios" | "mailing_eventos",
  columnas: string,
  campanaId: string,
  orden: string,
): Promise<Record<string, unknown>[]> {
  const sb = await getAuthenticatedSupabaseClient();
  const filas: Record<string, unknown>[] = [];
  for (;;) {
    const { data, error } = await sb
      .from(tabla)
      .select(columnas)
      .eq("campana_id", campanaId)
      .order(orden, { ascending: true })
      .range(filas.length, filas.length + PAGINA - 1);
    if (error) throw new Error(`${tabla}: ${error.message}`);
    const lote = (data ?? []) as unknown as Record<string, unknown>[];
    filas.push(...lote);
    if (lote.length < PAGINA) return filas;
  }
}

/** Índice de meses, de más reciente a más antiguo. */
export async function listMeses(): Promise<MesResumen[]> {
  const sb = await getAuthenticatedSupabaseClient();
  const { data, error } = await sb
    .from("mailing_meses")
    .select("id, label, campanas, entregados, apertura, ctr")
    .order("id", { ascending: false });
  if (error) throw new Error(`mailing_meses: ${error.message}`);
  return (data ?? []).map((m: Record<string, unknown>) => ({
    id: String(m.id),
    label: String(m.label ?? ""),
    campanas: num(m.campanas),
    entregados: num(m.entregados),
    apertura: num(m.apertura),
    ctr: num(m.ctr),
  }));
}

/** Un mes con sus KPIs, su curva por día y sus campañas. */
export async function getMes(id: string): Promise<MesDetalle | null> {
  const sb = await getAuthenticatedSupabaseClient();

  const [{ data: mes, error: errMes }, { data: camps, error: errCamps }] = await Promise.all([
    sb.from("mailing_meses")
      .select("id, label, desde, hasta, entregados, procesados, no_entregados, apertura, ctr, ctor, no_entregados_pct")
      .eq("id", id)
      .maybeSingle(),
    sb.from("mailing_campanas")
      .select("id, mes_id, fecha, envio, asunto, remitente, entregados, no_entregados, aperturas_unicas, clics_unicos, apertura, ctr")
      .eq("mes_id", id)
      .order("fecha", { ascending: true }),
  ]);
  if (errMes) throw new Error(`mailing_meses: ${errMes.message}`);
  if (errCamps) throw new Error(`mailing_campanas: ${errCamps.message}`);
  if (!mes) return null;

  const m = mes as Record<string, unknown>;
  const campanas = ((camps ?? []) as unknown as FilaCampana[]).map(aResumen);

  // La curva por día suma los envíos de cada fecha y recalcula la tasa sobre
  // los totales del día: promediar los porcentajes de cada campaña le daría el
  // mismo peso a un envío de 20 personas que a uno de mil.
  const porFecha = new Map<string, { entregados: number; aperturas: number }>();
  for (const c of campanas) {
    const acc = porFecha.get(c.fecha) ?? { entregados: 0, aperturas: 0 };
    acc.entregados += c.entregados;
    acc.aperturas += c.aperturas_unicas;
    porFecha.set(c.fecha, acc);
  }
  const porDia: DiaApertura[] = [...porFecha.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([fecha, v]) => ({
      fecha,
      entregados: v.entregados,
      apertura: v.entregados ? round1((v.aperturas / v.entregados) * 100) : 0,
    }));

  return {
    id: String(m.id),
    label: String(m.label ?? ""),
    rango: `${String(m.desde ?? "")} a ${String(m.hasta ?? "")}`,
    kpis: {
      entregados: num(m.entregados),
      procesados: num(m.procesados),
      apertura: num(m.apertura),
      ctr: num(m.ctr),
      ctor: num(m.ctor),
      noEntregados: num(m.no_entregados),
      noEntregadosPct: num(m.no_entregados_pct),
    },
    porDia,
    campanas,
  };
}

/** Una campaña con su detalle. Si el envío superó el umbral de detalle, las
 *  listas vuelven vacías y `detalleGuardado` es false. */
export async function getCampana(mesId: string, campanaId: string): Promise<CampanaDetalle | null> {
  const sb = await getAuthenticatedSupabaseClient();
  const { data, error } = await sb
    .from("mailing_campanas")
    .select("*")
    .eq("id", campanaId)
    .eq("mes_id", mesId)
    .maybeSingle();
  if (error) throw new Error(`mailing_campanas: ${error.message}`);
  if (!data) return null;

  const c = data as unknown as FilaCampana;
  const detalleGuardado = c.detalle_guardado !== false;

  let destinatarios: DestinatarioRow[] = [];
  let eventos: EventoRow[] = [];
  if (detalleGuardado) {
    const [ds, es] = await Promise.all([
      porPaginas("mailing_destinatarios",
        "correo, procesado, entregado, abrio, clic, diferido, reboto, descartado",
        campanaId, "correo"),
      porPaginas("mailing_eventos",
        "id, ocurrido_en, correo, evento, bucket", campanaId, "id"),
    ]);
    destinatarios = ds.map((d) => ({
      correo: String(d.correo),
      procesado: Boolean(d.procesado),
      entregado: Boolean(d.entregado),
      abrio: Boolean(d.abrio),
      clic: Boolean(d.clic),
      diferido: Boolean(d.diferido),
      reboto: Boolean(d.reboto),
      descartado: Boolean(d.descartado),
    }));
    eventos = es
      .map((e) => ({
        fecha: aTexto(e.ocurrido_en as string | null),
        correo: String(e.correo),
        evento: e.evento as EventoEstado,
        bucket: e.bucket as BucketDestinatario,
      }))
      .sort((a, b) => a.fecha.localeCompare(b.fecha));
  }

  return {
    ...aResumen(c),
    template: String(c.template ?? ""),
    base: num(c.base),
    procesados: num(c.procesados),
    rebotes: num(c.rebotes),
    descartados: num(c.descartados),
    diferidos: num(c.diferidos),
    ctor: num(c.ctor),
    enlaces: c.enlaces === null || c.enlaces === undefined ? null : Boolean(c.enlaces),
    detalleGuardado,
    miniaturaUrl: (c.miniatura_url as string | null) || null,
    buckets: {
      clic: num(c.bucket_clic),
      abierto: num(c.bucket_abierto),
      entregado: num(c.bucket_entregado),
      no_entregado: num(c.bucket_no_entregado),
    },
    eventos,
    destinatarios,
  };
}
