import { supabase } from "@/lib/supabase";
import { CHANNEL_ORDER } from "./constants";
import type {
  Campaign,
  CampaignCategory,
  CampaignChannel,
  CampaignData,
  CampaignMetrics,
  ContentTrackingData,
  ContentTrackingField,
  DailyActuals,
  DailyImpressions,
  DailyPlan,
  ParsedPlan,
} from "./types";
import { CONTENT_TRACKING_FIELDS } from "./types";

/** Trae la campaña activa de esta categoría (rrss o medios) con todo lo relacionado. */
export async function fetchCampaignData(category: CampaignCategory = "rrss"): Promise<CampaignData | null> {
  const { data: campaignData, error } = await supabase
    .from("campaign_dash")
    .select("*")
    .eq("category", category)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();
  const campaign = campaignData as Campaign | null;

  if (error) throw error;
  if (!campaign) return null;

  const [channelsRes, daysRes, metricsRes, actualsRes, impressionsRes] = await Promise.all([
    supabase.from("campaign_channels").select("*").eq("campaign_id", campaign.id),
    supabase
      .from("daily_plan")
      .select("*")
      .eq("campaign_id", campaign.id)
      .order("day_number", { ascending: true }),
    supabase
      .from("campaign_metrics")
      .select("*")
      .eq("campaign_id", campaign.id)
      .maybeSingle(),
    supabase
      .from("campaign_daily_actuals")
      .select("*")
      .eq("campaign_id", campaign.id)
      .order("day_number", { ascending: true }),
    supabase
      .from("campaign_daily_impressions")
      .select("*")
      .eq("campaign_id", campaign.id)
      .order("day_number", { ascending: true }),
  ]);

  if (channelsRes.error) throw channelsRes.error;
  if (daysRes.error) throw daysRes.error;

  const channels = ((channelsRes.data as CampaignChannel[]) ?? []).sort(
    (a, b) => CHANNEL_ORDER.indexOf(a.channel) - CHANNEL_ORDER.indexOf(b.channel),
  );

  return {
    campaign,
    channels,
    days: (daysRes.data as DailyPlan[]) ?? [],
    metrics: (metricsRes.data as CampaignMetrics | null) ?? null,
    actuals: (actualsRes.data as DailyActuals[]) ?? [],
    impressions: (impressionsRes.data as DailyImpressions[]) ?? [],
  };
}

export async function fetchContentTracking(category: CampaignCategory = "rrss"): Promise<ContentTrackingData | null> {
  const { data: campaignData, error } = await supabase
    .from("campaign_dash")
    .select("id")
    .eq("category", category)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();
  const campaign = campaignData as { id: string } | null;

  if (error) throw error;
  if (!campaign) return null;

  const { data: summaryData, error: summaryError } = await supabase
    .from("content_tracking_summary")
    .select(CONTENT_TRACKING_FIELDS.join(", "))
    .eq("campaign_id", campaign.id)
    .maybeSingle();
  const summary = summaryData as Record<ContentTrackingField, number> | null;

  if (summaryError) throw summaryError;

  const values = Object.fromEntries(
    CONTENT_TRACKING_FIELDS.map((f) => [f, summary?.[f] ?? 0]),
  ) as Record<ContentTrackingField, number>;

  return { campaignId: campaign.id, ...values };
}

export async function updateCampaignParams(params: {
  id: string;
  name: string;
  total_budget: number;
  duration_days: number;
  start_date: string;
}) {
  const { error } = await supabase
    .from("campaign_dash")
    .update({
      name: params.name.trim() || "Campaña de pauta",
      total_budget: params.total_budget,
      duration_days: Math.round(params.duration_days) || 1,
      start_date: params.start_date,
    })
    .eq("id", params.id);
  if (error) throw error;
}

export async function updateChannel(params: {
  id: string;
  participation_pct: number; // fracción 0-1
  cpm: number;
  ctr: number; // fracción 0-1
  frequency: number;
  objective: string | null;
  target_audience: string | null;
  main_kpi: string | null;
}) {
  const { error } = await supabase
    .from("campaign_channels")
    .update({
      participation_pct: params.participation_pct,
      cpm: params.cpm,
      ctr: params.ctr,
      frequency: params.frequency || 1,
      objective: params.objective?.trim() || null,
      target_audience: params.target_audience?.trim() || null,
      main_kpi: params.main_kpi?.trim() || null,
    })
    .eq("id", params.id);
  if (error) throw error;
}

export async function updateRealInvestment(channelId: string, realInvestment: number) {
  const { error } = await supabase
    .from("campaign_channels")
    .update({ real_investment: realInvestment || 0 })
    .eq("id", channelId);
  if (error) throw error;
}

export async function upsertCampaignMetrics(metrics: {
  campaign_id: string;
  inversion_acumulada: number;
  impresion_acumulada: number;
  pacing_presupuestal: number;
  alcance_acumulado: number;
}) {
  const { error } = await supabase
    .from("campaign_metrics")
    .upsert(
      {
        campaign_id: metrics.campaign_id,
        inversion_acumulada: metrics.inversion_acumulada,
        impresion_acumulada: Math.round(metrics.impresion_acumulada),
        pacing_presupuestal: metrics.pacing_presupuestal,
        alcance_acumulado: Math.round(metrics.alcance_acumulado),
      },
      { onConflict: "campaign_id" },
    );
  if (error) throw error;
}

export async function upsertDailyActuals(
  campaignId: string,
  rows: { day_number: number; date: string; meta: number; pilas: number; youtube: number; google_display: number }[],
) {
  const { error } = await supabase
    .from("campaign_daily_actuals")
    .upsert(
      rows.map((r) => ({ campaign_id: campaignId, ...r })),
      { onConflict: "campaign_id,day_number" },
    );
  if (error) throw error;
}

export async function upsertDailyImpressions(
  campaignId: string,
  rows: { day_number: number; date: string; meta: number; pilas: number; youtube: number; google_display: number }[],
) {
  const { error } = await supabase
    .from("campaign_daily_impressions")
    .upsert(
      rows.map((r) => ({
        campaign_id: campaignId,
        day_number: r.day_number,
        date: r.date,
        meta: Math.round(r.meta),
        pilas: Math.round(r.pilas),
        youtube: Math.round(r.youtube),
        google_display: Math.round(r.google_display),
      })),
      { onConflict: "campaign_id,day_number" },
    );
  if (error) throw error;
}

export async function saveContentTracking(
  campaignId: string,
  values: Record<ContentTrackingField, number>,
) {
  const row: Record<string, string | number> = { campaign_id: campaignId };
  for (const f of CONTENT_TRACKING_FIELDS) {
    row[f] = Math.max(0, Math.round(values[f] || 0));
  }
  const { error } = await supabase
    .from("content_tracking_summary")
    .upsert(row, { onConflict: "campaign_id" });
  if (error) throw error;
}

async function ensureCampaignId(category: CampaignCategory): Promise<string> {
  const { data } = await supabase
    .from("campaign_dash")
    .select("id")
    .eq("category", category)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();
  const existing = data as { id: string } | null;

  if (existing?.id) return existing.id;

  const { data: createdData, error } = await supabase
    .from("campaign_dash")
    .insert({ name: category === "medios" ? "Campaña de medios" : "Campaña de pauta", category })
    .select("id")
    .single();
  const created = createdData as { id: string } | null;

  if (error) throw error;
  return created!.id;
}

/** Reemplaza el plan de campaña (canales + días) a partir de un Excel importado.
 *  Preserva la inversión real ya registrada por canal. */
export async function replaceCampaignFromPlan(plan: ParsedPlan, category: CampaignCategory = "rrss"): Promise<void> {
  const campaignId = await ensureCampaignId(category);

  const { data: prev } = await supabase
    .from("campaign_channels")
    .select("channel, real_investment")
    .eq("campaign_id", campaignId);

  const realByChannel = new Map<string, number>(
    ((prev ?? []) as { channel: string; real_investment: number }[]).map((r) => [
      r.channel,
      Number(r.real_investment) || 0,
    ]),
  );

  const { error: upErr } = await supabase
    .from("campaign_dash")
    .update({
      name: plan.name,
      total_budget: plan.total_budget,
      duration_days: plan.duration_days,
      start_date: plan.start_date,
    })
    .eq("id", campaignId);
  if (upErr) throw upErr;

  await supabase.from("campaign_channels").delete().eq("campaign_id", campaignId);
  const channelRows = plan.channels.map((c, i) => ({
    campaign_id: campaignId,
    channel: c.channel,
    position: i,
    participation_pct: c.participation_pct,
    cpm: c.cpm,
    ctr: c.ctr,
    frequency: c.frequency,
    objective: c.objective,
    target_audience: c.target_audience,
    main_kpi: c.main_kpi,
    real_investment: realByChannel.get(c.channel) ?? 0,
  }));
  const { error: chErr } = await supabase.from("campaign_channels").insert(channelRows);
  if (chErr) throw chErr;

  await supabase.from("daily_plan").delete().eq("campaign_id", campaignId);
  const dayRows = plan.days.map((d) => ({
    campaign_id: campaignId,
    day_number: d.day_number,
    date: d.date,
    weight_factor: d.weight_factor,
  }));
  const { error: dErr } = await supabase.from("daily_plan").insert(dayRows);
  if (dErr) throw dErr;

  await supabase
    .from("campaign_metrics")
    .upsert({ campaign_id: campaignId }, { onConflict: "campaign_id", ignoreDuplicates: true });
}
