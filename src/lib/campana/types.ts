export type ChannelKey = "meta" | "pilas" | "youtube" | "google_display";

/** Dos pautas independientes conviven en las mismas tablas, distinguidas
 *  por esta columna en campaign_dash — cada una con sus propios canales,
 *  plan diario y métricas (todas las tablas hijas ya cuelgan de campaign_id). */
export type CampaignCategory = "rrss" | "medios";

export const CHANNEL_KEYS: ChannelKey[] = [
  "meta",
  "pilas",
  "youtube",
  "google_display",
];

export interface Campaign {
  id: string;
  name: string;
  description: string | null;
  total_budget: number;
  duration_days: number;
  start_date: string;
  status: "draft" | "active" | "completed";
  category: CampaignCategory;
  created_at: string;
  updated_at: string;
}

export interface CampaignChannel {
  id: string;
  campaign_id: string;
  channel: ChannelKey;
  position: number;
  participation_pct: number;
  cpm: number;
  ctr: number;
  frequency: number;
  objective: string | null;
  recommended_format: string | null;
  target_audience: string | null;
  main_kpi: string | null;
  real_investment: number;
  created_at: string;
  updated_at: string;
}

export interface DailyPlan {
  id: string;
  campaign_id: string;
  day_number: number;
  date: string;
  weight_factor: number;
  created_at: string;
  updated_at: string;
}

export interface CampaignMetrics {
  id: string;
  campaign_id: string;
  inversion_acumulada: number;
  impresion_acumulada: number;
  pacing_presupuestal: number;
  alcance_acumulado: number;
  updated_at: string;
}

export interface DailyActuals {
  id: string;
  campaign_id: string;
  day_number: number;
  date: string;
  meta: number;
  pilas: number;
  youtube: number;
  google_display: number;
}

export interface DailyImpressions {
  id: string;
  campaign_id: string;
  day_number: number;
  date: string;
  meta: number;
  pilas: number;
  youtube: number;
  google_display: number;
}

export interface CampaignData {
  campaign: Campaign;
  channels: CampaignChannel[];
  days: DailyPlan[];
  metrics: CampaignMetrics | null;
  actuals: DailyActuals[];
  impressions: DailyImpressions[];
}

/** Campos manuales del resumen de contenidos (las cards de la pantalla). */
export type MetaField = "total_pautados" | "video" | "carrusel" | "pendiente";

export type AdsField =
  | "total_campanas"
  | "campanas_search"
  | "campanas_display"
  | "total_anuncios"
  | "piezas_entregadas"
  | "pauta_pendiente";

export type ContentTrackingField = MetaField | AdsField;

export const META_FIELDS: MetaField[] = ["total_pautados", "video", "carrusel", "pendiente"];

export const ADS_FIELDS: AdsField[] = [
  "total_campanas",
  "campanas_search",
  "campanas_display",
  "total_anuncios",
  "piezas_entregadas",
  "pauta_pendiente",
];

export const CONTENT_TRACKING_FIELDS: ContentTrackingField[] = [...META_FIELDS, ...ADS_FIELDS];

export type ContentTrackingData = { campaignId: string } & Record<ContentTrackingField, number>;

export interface ParsedChannel {
  channel: ChannelKey;
  participation_pct: number;
  cpm: number;
  ctr: number;
  frequency: number;
  objective: string | null;
  target_audience: string | null;
  main_kpi: string | null;
}

export interface ParsedDay {
  day_number: number;
  date: string;
  weight_factor: number;
}

export interface ParsedPlan {
  name: string;
  total_budget: number;
  duration_days: number;
  start_date: string;
  channels: ParsedChannel[];
  days: ParsedDay[];
}
