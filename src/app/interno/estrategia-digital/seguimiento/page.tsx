"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/components/auth-provider";
import { canEdit } from "@/lib/auth/rbac";
import { fetchContentTracking, saveContentTracking } from "@/lib/campana/client-data";
import { ADS_FIELDS, META_FIELDS, type ContentTrackingField } from "@/lib/campana/types";
import { formatNumber } from "@/lib/campana/format";
import { toast } from "@/components/ui/toast";
import { TabLoadingScreen } from "@/components/bird-loading/tab-loading-screen";
import { useCategoria } from "../_shared";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSave } from "@fortawesome/free-solid-svg-icons";

const LABELS: Record<ContentTrackingField, string> = {
  total_pautados: "Total pautados",
  video: "Video",
  carrusel: "Carrusel",
  pendiente: "Pendiente",
  total_campanas: "Total de campañas",
  campanas_search: "Campañas search",
  campanas_display: "Campañas display",
  total_anuncios: "Total de anuncios",
  piezas_entregadas: "Total de piezas entregadas",
  pauta_pendiente: "Pauta pendiente",
};

export default function SeguimientoPage() {
  const { role } = useAuth();
  const tipo = useCategoria();
  const [campaignId, setCampaignId] = useState<string | null | undefined>(undefined);
  const [values, setValues] = useState<Record<ContentTrackingField, number> | null>(null);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setCampaignId(undefined);
    setValues(null);
    fetchContentTracking(tipo).then((data) => {
      if (!data) { setCampaignId(null); return; }
      const { campaignId: id, ...rest } = data;
      setCampaignId(id);
      setValues(rest as Record<ContentTrackingField, number>);
    }).catch(() => setCampaignId(null));
  }, [tipo]);

  if (campaignId === undefined || !values) {
    return <TabLoadingScreen section={`Seguimiento · ${tipo === "medios" ? "Medios" : "RRSS"}`} fullScreen={false} />;
  }
  if (campaignId === null) {
    return (
      <Card className="panel border border-[#1e2240] p-10 rounded-2xl text-center">
        <p className="text-[#aab3cf] text-sm">Aún no hay una campaña cargada. Importa un plan en la pestaña Importar.</p>
      </Card>
    );
  }

  const setField = (f: ContentTrackingField, v: number) => setValues((s) => (s ? { ...s, [f]: v } : s));

  const save = async () => {
    if (!campaignId || !values) return;
    setSaving(true);
    try {
      await saveContentTracking(campaignId, values);
      setEditing(false);
      toast.success("Seguimiento guardado");
    } catch (e) {
      toast.error("Error al guardar", "No se pudo guardar el seguimiento.");
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      <div className="flex justify-between items-center">
        <p className="text-sm text-[#aab3cf]">Consolidado de piezas y campañas de contenido pautadas.</p>
        {canEdit(role) && (
          editing ? (
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => setEditing(false)} className="text-[#aab3cf]">Cancelar</Button>
              <Button size="sm" onClick={save} disabled={saving} className="bg-green-600 hover:bg-green-700">
                <FontAwesomeIcon icon={faSave} className="mr-2" /> {saving ? "Guardando…" : "Guardar"}
              </Button>
            </div>
          ) : (
            <Button variant="outline" size="sm" onClick={() => setEditing(true)} className="bg-[#0094ff]/10 text-[#75ddff] border-[#0094ff]/20 hover:bg-[#0094ff] hover:text-white">
              Editar datos
            </Button>
          )
        )}
      </div>

      <section>
        <h3 className="mb-3 text-xs font-bold uppercase tracking-widest text-[#8892b0]">Meta</h3>
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {META_FIELDS.map((f) => (
            <StatCard key={f} label={LABELS[f]} value={values[f]} editing={editing} accent={f === "total_pautados"} onChange={(v) => setField(f, v)} />
          ))}
        </div>
      </section>

      <section>
        <h3 className="mb-3 text-xs font-bold uppercase tracking-widest text-[#8892b0]">Ads</h3>
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
          {ADS_FIELDS.map((f) => (
            <StatCard key={f} label={LABELS[f]} value={values[f]} editing={editing} accent={f === "total_campanas"} onChange={(v) => setField(f, v)} />
          ))}
        </div>
      </section>
    </div>
  );
}

function StatCard({ label, value, editing, accent, onChange }: { label: string; value: number; editing: boolean; accent?: boolean; onChange: (v: number) => void }) {
  return (
    <Card className="panel border-[#1e2240] p-5 rounded-2xl" style={accent ? { borderTop: "3px solid #0094ff" } : undefined}>
      <p className="text-[10px] font-bold uppercase tracking-wider text-[#8892b0]">{label}</p>
      {editing ? (
        <Input
          type="number"
          min={0}
          value={value}
          onChange={(e) => onChange(Math.max(0, Math.floor(Number(e.target.value) || 0)))}
          className="mt-2 h-10 text-2xl font-black bg-white/5 border-[#2a2a4a]"
          style={{ color: accent ? "#0094ff" : undefined }}
        />
      ) : (
        <p className="mt-2 text-3xl font-black tabular-nums" style={{ color: accent ? "#0094ff" : "#c0c8de" }}>
          {formatNumber(value)}
        </p>
      )}
    </Card>
  );
}
