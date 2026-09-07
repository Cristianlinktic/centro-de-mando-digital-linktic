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
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSave, faSpinner } from "@fortawesome/free-solid-svg-icons";

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
  const [campaignId, setCampaignId] = useState<string | null | undefined>(undefined);
  const [values, setValues] = useState<Record<ContentTrackingField, number> | null>(null);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchContentTracking().then((data) => {
      if (!data) { setCampaignId(null); return; }
      const { campaignId: id, ...rest } = data;
      setCampaignId(id);
      setValues(rest as Record<ContentTrackingField, number>);
    }).catch(() => setCampaignId(null));
  }, []);

  if (campaignId === undefined || !values) {
    return (
      <div className="h-64 flex items-center justify-center text-slate-500 font-mono tracking-widest uppercase text-sm">
        <FontAwesomeIcon icon={faSpinner} className="animate-spin mr-3" /> Cargando seguimiento…
      </div>
    );
  }
  if (campaignId === null) {
    return (
      <Card className="bg-[#0b101d] border border-white/5 p-10 rounded-2xl text-center">
        <p className="text-slate-400 text-sm">Aún no hay una campaña cargada. Importa un plan en la pestaña Importar.</p>
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
    } catch (e) {
      alert("No se pudo guardar el seguimiento.");
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      <div className="flex justify-between items-center">
        <p className="text-sm text-slate-400">Consolidado de piezas y campañas de contenido pautadas.</p>
        {canEdit(role) && (
          editing ? (
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => setEditing(false)} className="text-slate-400">Cancelar</Button>
              <Button size="sm" onClick={save} disabled={saving} className="bg-green-600 hover:bg-green-700">
                <FontAwesomeIcon icon={faSave} className="mr-2" /> {saving ? "Guardando…" : "Guardar"}
              </Button>
            </div>
          ) : (
            <Button variant="outline" size="sm" onClick={() => setEditing(true)} className="bg-blue-600/10 text-blue-400 border-blue-500/20 hover:bg-blue-600 hover:text-white">
              Editar datos
            </Button>
          )
        )}
      </div>

      <section>
        <h3 className="mb-3 text-xs font-bold uppercase tracking-widest text-slate-500">Meta</h3>
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {META_FIELDS.map((f) => (
            <StatCard key={f} label={LABELS[f]} value={values[f]} editing={editing} accent={f === "total_pautados"} onChange={(v) => setField(f, v)} />
          ))}
        </div>
      </section>

      <section>
        <h3 className="mb-3 text-xs font-bold uppercase tracking-widest text-slate-500">Ads</h3>
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
    <Card className="bg-[#0b101d] border-white/5 p-5 rounded-2xl" style={accent ? { borderTop: "3px solid #3b82f6" } : undefined}>
      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">{label}</p>
      {editing ? (
        <Input
          type="number"
          min={0}
          value={value}
          onChange={(e) => onChange(Math.max(0, Math.floor(Number(e.target.value) || 0)))}
          className="mt-2 h-10 text-2xl font-black bg-white/5 border-white/10"
          style={{ color: accent ? "#3b82f6" : undefined }}
        />
      ) : (
        <p className="mt-2 text-3xl font-black tabular-nums" style={{ color: accent ? "#3b82f6" : "#e2e8f0" }}>
          {formatNumber(value)}
        </p>
      )}
    </Card>
  );
}
